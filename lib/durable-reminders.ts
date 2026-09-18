import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getWorkspaceForUser } from "@/lib/repository";
import { enqueueJob, runWorkerOnce, type JobRecord } from "@/lib/worker";
import { SandboxEmailAdapter, UnavailablePushAdapter, type PushNotificationPort, type TransactionalEmailPort } from "@/lib/providers";
import { SmtpEmailAdapter, smtpConfigFromEnvironment } from "@/lib/smtp-mailbox";

export const REMINDER_STATES = ["SCHEDULED", "READY", "DISPATCHING", "DELIVERED", "FAILED_RETRYABLE", "FAILED_TERMINAL", "CANCELLED"] as const;
export const REMINDER_CHANNELS = ["IN_APP", "EMAIL", "PUSH"] as const;
export type ReminderState = (typeof REMINDER_STATES)[number];
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];
export type ReminderAction = "read" | "unread" | "snooze" | "dismiss";

export type ReminderWorkerDependencies = {
  email: TransactionalEmailPort;
  push: PushNotificationPort;
};

export class ReminderInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ReminderInputError";
    this.code = code;
    this.status = status;
  }
}

function dateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ReminderInputError("REMINDER_DATE_INVALID", "Reminder dates must be YYYY-MM-DD.");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ReminderInputError("REMINDER_DATE_INVALID", "Reminder date is not a real calendar date.");
  return value;
}

function addDays(value: string, days: number) {
  const date = new Date(`${dateOnly(value)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function validTimezone(value: string) {
  try { new Intl.DateTimeFormat("en-IN", { timeZone: value }).format(); }
  catch { throw new ReminderInputError("REMINDER_TIMEZONE_INVALID", "Reminder timezone must be a supported IANA timezone."); }
  return value;
}

function timezoneParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day), hour: Number(values.hour), minute: Number(values.minute) };
}

/** Convert a date-only local wall-clock target to an instant without using server local time. */
export function localReminderInstant(localDate: string, localTime: string, timezone: string) {
  dateOnly(localDate);
  validTimezone(timezone);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(localTime)) throw new ReminderInputError("REMINDER_TIME_INVALID", "Reminder local time must be HH:mm.");
  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const observed = timezoneParts(new Date(localAsUtc), timezone);
  const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute);
  return new Date(localAsUtc - (observedAsUtc - localAsUtc));
}

type ReminderConfig = { enabled: boolean; beforeDays: number[]; localTime: string; channels: ReminderChannel[] };

export function parseReminderConfig(value: unknown): ReminderConfig {
  if (value === undefined || value === null) return { enabled: false, beforeDays: [], localTime: "09:00", channels: ["IN_APP"] };
  if (typeof value !== "object" || Array.isArray(value)) throw new ReminderInputError("REMINDER_CONFIG_INVALID", "Reminder configuration must be an object.");
  const source = value as Record<string, unknown>;
  const enabled = source.enabled === true;
  const rawOffsets = source.beforeDays ?? source.offsetDays ?? source.offsetsDays ?? [0];
  if (!Array.isArray(rawOffsets) || !rawOffsets.length || rawOffsets.length > 8) throw new ReminderInputError("REMINDER_OFFSETS_INVALID", "Choose between one and eight reminder offsets.");
  const beforeDays = [...new Set(rawOffsets.map((offset) => Number(offset)))];
  if (beforeDays.some((offset) => !Number.isInteger(offset) || offset < 0 || offset > 366)) throw new ReminderInputError("REMINDER_OFFSETS_INVALID", "Reminder offsets must be whole days from 0 to 366.");
  const localTime = typeof source.localTime === "string" ? source.localTime : "09:00";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(localTime)) throw new ReminderInputError("REMINDER_TIME_INVALID", "Reminder local time must be HH:mm.");
  const rawChannels = source.channels ?? ["IN_APP"];
  if (!Array.isArray(rawChannels) || !rawChannels.length || rawChannels.length > 3) throw new ReminderInputError("REMINDER_CHANNELS_INVALID", "Choose at least one reminder channel.");
  const channels = [...new Set(rawChannels)] as ReminderChannel[];
  if (channels.some((channel) => !REMINDER_CHANNELS.includes(channel))) throw new ReminderInputError("REMINDER_CHANNELS_INVALID", "Reminder channel is invalid.");
  return { enabled, beforeDays, localTime, channels };
}

function payloadHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function dto(row: {
  id: string; propertyId: string; sourceType: string; sourceId: string; obligationId: string | null; occurrenceId: string | null;
  offsetDays: number; scheduledAt: Date; timezone: string; localTime: string; channel: string; state: string;
  readAt: Date | null; snoozedUntil: Date | null; attemptCount: number; lastAttemptAt: Date | null; deliveredAt: Date | null;
  failureState: string | null; failureReason: string | null; deepLink: string; title: string; body: string; version: number;
  createdAt: Date; updatedAt: Date;
}) {
  return { ...row, scheduledAt: row.scheduledAt.toISOString(), readAt: row.readAt?.toISOString() ?? null, snoozedUntil: row.snoozedUntil?.toISOString() ?? null, lastAttemptAt: row.lastAttemptAt?.toISOString() ?? null, deliveredAt: row.deliveredAt?.toISOString() ?? null };
}

async function obligationContext(obligationId: string) {
  return prisma.obligation.findUnique({ where: { id: obligationId }, include: { occurrences: { orderBy: { dueDate: "asc" }, include: { payments: { where: { status: "RECORDED", reversalOfId: null }, select: { amountPaise: true } } } } } });
}

function pendingState(state: string) { return ["SCHEDULED", "READY", "DISPATCHING", "FAILED_RETRYABLE"].includes(state); }

/** Reconcile the durable schedule after every obligation/occurrence lifecycle mutation. */
export async function reconcileRemindersForObligation(obligationId: string) {
  const obligation = await obligationContext(obligationId);
  if (!obligation) return [];
  const config = parseReminderConfig(obligation.reminderConfig);
  const now = new Date();
  const desired = new Map<string, { occurrenceId: string; offsetDays: number; channel: ReminderChannel; scheduledAt: Date }>();
  if (obligation.active && config.enabled) {
    for (const occurrence of obligation.occurrences) {
      if (occurrence.status === "CANCELLED" || occurrence.status === "COMPLETED") continue;
      const paid = occurrence.payments.reduce((sum, payment) => sum + payment.amountPaise, 0n);
      const completed = occurrence.amountPaise !== null && paid >= occurrence.amountPaise;
      if (completed) continue;
      for (const beforeDays of config.beforeDays) {
        const scheduledAt = localReminderInstant(addDays(occurrence.dueDate, -beforeDays), config.localTime, obligation.timezone);
        for (const channel of config.channels) {
          const idempotencyKey = `reminder:${occurrence.id}:${beforeDays}:${channel}`;
          desired.set(idempotencyKey, { occurrenceId: occurrence.id, offsetDays: -beforeDays, channel, scheduledAt });
        }
      }
    }
  }
  const existing = await prisma.durableReminder.findMany({ where: { workspaceId: obligation.workspaceId, obligationId } });
  for (const reminder of existing) {
    if (!desired.has(reminder.idempotencyKey) && pendingState(reminder.state)) {
      await prisma.durableReminder.update({ where: { id: reminder.id }, data: { state: "CANCELLED", failureState: "RECONCILED", failureReason: "The source obligation is inactive, completed, or its schedule changed.", version: { increment: 1 } } });
    }
  }
  for (const [idempotencyKey, item] of desired) {
    const state: ReminderState = item.scheduledAt <= now ? "READY" : "SCHEDULED";
    const occurrence = obligation.occurrences.find((candidate) => candidate.id === item.occurrenceId);
    if (!occurrence) continue;
    const currentReminder = existing.find((candidate) => candidate.idempotencyKey === idempotencyKey);
    const canRestore = currentReminder && (pendingState(currentReminder.state) || (currentReminder.state === "CANCELLED" && currentReminder.failureState === "RECONCILED"));
    await prisma.durableReminder.upsert({
      where: { idempotencyKey },
      create: {
        id: randomUUID(), workspaceId: obligation.workspaceId, propertyId: obligation.propertyId, sourceType: "OBLIGATION_OCCURRENCE", sourceId: occurrence.id,
        obligationId: obligation.id, occurrenceId: occurrence.id, offsetDays: item.offsetDays, scheduledAt: item.scheduledAt, timezone: obligation.timezone, localTime: config.localTime,
        channel: item.channel, state, idempotencyKey, deepLink: `/property/${obligation.propertyId}?tab=bills&occurrence=${occurrence.id}`,
        title: `Reminder: ${obligation.label}`, body: `${obligation.label} is due on ${occurrence.dueDate}. This is a self-entered reminder, not proof of an official obligation.`,
      },
      update: {
        scheduledAt: item.scheduledAt, timezone: obligation.timezone, localTime: config.localTime, offsetDays: item.offsetDays, channel: item.channel,
        title: `Reminder: ${obligation.label}`, body: `${obligation.label} is due on ${occurrence.dueDate}. This is a self-entered reminder, not proof of an official obligation.`,
        ...(canRestore ? { state, snoozedUntil: null, failureState: null, failureReason: null } : {}),
        version: { increment: 1 },
      },
    });
  }
  return prisma.durableReminder.findMany({ where: { workspaceId: obligation.workspaceId, obligationId }, orderBy: { scheduledAt: "asc" } });
}

export async function cancelRemindersForProperty(workspaceId: string, propertyId: string, reason: string) {
  await prisma.durableReminder.updateMany({ where: { workspaceId, propertyId, state: { in: ["SCHEDULED", "READY", "DISPATCHING", "FAILED_RETRYABLE"] } }, data: { state: "CANCELLED", failureState: "SOURCE_ARCHIVED", failureReason: reason, version: { increment: 1 } } });
}

async function ownedReminder(userId: string, reminderId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new ReminderInputError("REMINDER_NOT_FOUND", "Reminder not found.", 404);
  const reminder = await prisma.durableReminder.findFirst({ where: { id: reminderId, workspaceId: workspace.id } });
  if (!reminder) throw new ReminderInputError("REMINDER_NOT_FOUND", "Reminder not found.", 404);
  return { workspace, reminder };
}

export async function listRemindersForUser(userId: string, propertyId?: string, state?: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return [];
  if (state && !REMINDER_STATES.includes(state as ReminderState)) throw new ReminderInputError("REMINDER_STATE_INVALID", "Reminder state is invalid.");
  const rows = await prisma.durableReminder.findMany({ where: { workspaceId: workspace.id, ...(propertyId ? { propertyId } : {}), ...(state ? { state } : {}) }, orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }] });
  return rows.map(dto);
}

export async function createManualReminderForUser(userId: string, propertyId: string, raw: unknown) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new ReminderInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ReminderInputError("REMINDER_INPUT_INVALID", "A reminder is required.");
  const source = raw as Record<string, unknown>;
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" }, select: { id: true } });
  if (!property) throw new ReminderInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  if (typeof source.title !== "string" || !source.title.trim() || source.title.length > 180) throw new ReminderInputError("REMINDER_INPUT_INVALID", "Reminder title is required.");
  if (typeof source.scheduledDate !== "string") throw new ReminderInputError("REMINDER_DATE_INVALID", "A date-only scheduled date is required.");
  const config = parseReminderConfig({ enabled: true, beforeDays: [0], localTime: source.localTime, channels: source.channels });
  if (typeof source.sourceType !== "string" || !["PROPERTY_DEADLINE", "FUTURE_EVENT"].includes(source.sourceType)) throw new ReminderInputError("REMINDER_SOURCE_INVALID", "Reminder source must be a property deadline or selected future event.");
  const sourceId = typeof source.sourceId === "string" && source.sourceId.trim() ? source.sourceId.trim().slice(0, 160) : randomUUID();
  const deepLink = typeof source.deepLink === "string" && /^\/property\/[a-zA-Z0-9_-]+(?:\?.*)?$/.test(source.deepLink) ? source.deepLink : `/property/${propertyId}?tab=overview`;
  const body = typeof source.body === "string" && source.body.trim() ? source.body.trim().slice(0, 2_000) : `${source.title.trim()} is scheduled for ${source.scheduledDate}. This is a self-entered reminder, not proof of an official deadline.`;
  const rows = [];
  for (const channel of config.channels) {
    const idempotencyKey = typeof source.idempotencyKey === "string" && source.idempotencyKey.trim() ? `${source.idempotencyKey.trim().slice(0, 140)}:${channel}` : `manual-reminder:${sourceId}:${channel}`;
    const row = await prisma.durableReminder.upsert({ where: { idempotencyKey }, create: { id: randomUUID(), workspaceId: workspace.id, propertyId, sourceType: source.sourceType, sourceId, offsetDays: 0, scheduledAt: localReminderInstant(source.scheduledDate, config.localTime, typeof source.timezone === "string" ? source.timezone : "UTC"), timezone: typeof source.timezone === "string" ? source.timezone : "UTC", localTime: config.localTime, channel, state: "SCHEDULED", idempotencyKey, deepLink, title: source.title.trim(), body }, update: { title: source.title.trim(), body, scheduledAt: localReminderInstant(source.scheduledDate, config.localTime, typeof source.timezone === "string" ? source.timezone : "UTC"), timezone: typeof source.timezone === "string" ? source.timezone : "UTC", localTime: config.localTime } });
    rows.push(dto(row));
  }
  return rows;
}

export async function listNotificationPreferencesForUser(userId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new ReminderInputError("WORKSPACE_NOT_FOUND", "Workspace not found.", 404);
  const channels = ["IN_APP", "EMAIL", "PUSH"] as const;
  const rows = await prisma.notificationPreference.findMany({ where: { workspaceId: workspace.id } });
  return channels.map((channel) => ({ channel, enabled: rows.find((row) => row.channel === channel)?.enabled ?? true }));
}

export async function setNotificationPreferencesForUser(userId: string, raw: unknown) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new ReminderInputError("WORKSPACE_NOT_FOUND", "Workspace not found.", 404);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ReminderInputError("PREFERENCES_INVALID", "Notification preferences are invalid.");
  const entries = Object.entries(raw as Record<string, unknown>);
  for (const [channel, enabled] of entries) {
    if (!["IN_APP", "EMAIL", "PUSH"].includes(channel) || typeof enabled !== "boolean") throw new ReminderInputError("PREFERENCES_INVALID", "Notification preferences are invalid.");
    await prisma.notificationPreference.upsert({ where: { workspaceId_channel: { workspaceId: workspace.id, channel } }, create: { id: randomUUID(), workspaceId: workspace.id, channel, enabled }, update: { enabled } });
  }
  return listNotificationPreferencesForUser(userId);
}

export async function actOnReminderForUser(userId: string, reminderId: string, action: ReminderAction, value?: unknown) {
  const { reminder } = await ownedReminder(userId, reminderId);
  if (action === "read" || action === "unread") {
    return dto(await prisma.durableReminder.update({ where: { id: reminder.id }, data: { readAt: action === "read" ? new Date() : null } }));
  }
  if (action === "dismiss") {
    return dto(await prisma.durableReminder.update({ where: { id: reminder.id }, data: { state: "CANCELLED", failureState: "DISMISSED", failureReason: "Dismissed by the owner.", version: { increment: 1 } } }));
  }
  if (typeof value !== "string") throw new ReminderInputError("SNOOZE_UNTIL_INVALID", "Snooze requires an ISO timestamp.");
  const until = new Date(value);
  if (Number.isNaN(until.getTime()) || until <= new Date() || until.getTime() > Date.now() + 31 * 86400000) throw new ReminderInputError("SNOOZE_UNTIL_INVALID", "Snooze must be a future time within 31 days.");
  return dto(await prisma.durableReminder.update({ where: { id: reminder.id }, data: { state: "SCHEDULED", scheduledAt: until, snoozedUntil: until, readAt: null, failureState: null, failureReason: null, version: { increment: 1 } } }));
}

export async function markAllRemindersReadForUser(userId: string, propertyId?: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return { count: 0 };
  return prisma.durableReminder.updateMany({ where: { workspaceId: workspace.id, readAt: null, ...(propertyId ? { propertyId } : {}) }, data: { readAt: new Date() } });
}

export async function enqueueReadyReminderJobs(now = new Date()) {
  await prisma.durableReminder.updateMany({ where: { state: "SCHEDULED", scheduledAt: { lte: now }, OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }] }, data: { state: "READY", snoozedUntil: null, version: { increment: 1 } } });
  const rows = await prisma.durableReminder.findMany({ where: { state: "READY", scheduledAt: { lte: now }, snoozedUntil: null }, orderBy: { scheduledAt: "asc" }, take: 100 });
  const jobs = [];
  for (const reminder of rows) {
    jobs.push(await enqueueJob({ aggregateType: "durable_reminder", aggregateId: reminder.id, eventType: "DISPATCH_REMINDER", payload: { reminderId: reminder.id, workspaceId: reminder.workspaceId }, idempotencyKey: `reminder-dispatch:${reminder.id}`, correlationId: reminder.id, maxAttempts: 3 }));
  }
  return jobs;
}

function reminderPayload(job: JobRecord) {
  if (!job.payload || typeof job.payload !== "object") throw new Error("REMINDER_JOB_PAYLOAD_INVALID");
  const payload = job.payload as Record<string, unknown>;
  if (typeof payload.reminderId !== "string" || typeof payload.workspaceId !== "string") throw new Error("REMINDER_JOB_PAYLOAD_INVALID");
  return { reminderId: payload.reminderId, workspaceId: payload.workspaceId };
}

async function dispatchReminder(job: JobRecord, deps: ReminderWorkerDependencies) {
  const payload = reminderPayload(job);
  const reminder = await prisma.durableReminder.findFirst({ where: { id: payload.reminderId, workspaceId: payload.workspaceId } });
  if (!reminder || ["CANCELLED", "DELIVERED", "FAILED_TERMINAL"].includes(reminder.state)) return;
  if (reminder.snoozedUntil && reminder.snoozedUntil > new Date()) return;
  if (reminder.state === "DISPATCHING" && job.attempts <= 1) return;
  const claimStates = job.attempts > 1 ? ["READY", "FAILED_RETRYABLE", "DISPATCHING"] : ["READY", "FAILED_RETRYABLE"];
  const claimed = await prisma.durableReminder.updateMany({ where: { id: reminder.id, workspaceId: reminder.workspaceId, state: { in: claimStates } }, data: { state: "DISPATCHING", attemptCount: { increment: 1 }, lastAttemptAt: new Date(), version: { increment: 1 } } });
  if (claimed.count !== 1) return;
  const current = await prisma.durableReminder.findUniqueOrThrow({ where: { id: reminder.id } });
  const preference = await prisma.notificationPreference.findUnique({ where: { workspaceId_channel: { workspaceId: current.workspaceId, channel: current.channel } } });
  if (preference && !preference.enabled) {
    await prisma.durableReminder.update({ where: { id: current.id }, data: { state: "CANCELLED", failureState: "PREFERENCE_DISABLED", failureReason: "The owner disabled this notification channel.", version: { increment: 1 } } });
    return;
  }
  const attemptKey = `reminder-attempt:${current.id}`;
  const existingAttempt = await prisma.reminderAttempt.findUnique({ where: { idempotencyKey: attemptKey } });
  if (existingAttempt?.state === "DELIVERED" || existingAttempt?.state === "SANDBOX_CAPTURED" || existingAttempt?.state === "FAILED_TERMINAL") return;
  const attempt = await prisma.reminderAttempt.upsert({ where: { idempotencyKey: attemptKey }, create: { id: randomUUID(), workspaceId: current.workspaceId, reminderId: current.id, attemptNumber: 1, state: "DISPATCHING", idempotencyKey: attemptKey }, update: { state: "DISPATCHING", attemptedAt: new Date(), failureReason: null } });
  if (current.channel === "IN_APP") {
    await prisma.$transaction([
      prisma.reminderAttempt.update({ where: { id: attempt.id }, data: { state: "DELIVERED", providerOutcome: "in_app", deliveredAt: new Date(), failureReason: null } }),
      prisma.durableReminder.update({ where: { id: current.id }, data: { state: "DELIVERED", deliveredAt: new Date(), failureState: null, failureReason: null, version: { increment: 1 } } }),
    ]);
    return;
  }
  const owner = await prisma.workspace.findUniqueOrThrow({ where: { id: current.workspaceId }, select: { ownerUserId: true, owner: { select: { email: true } } } });
  const result = current.channel === "EMAIL"
    ? await deps.email.send({ to: owner.owner.email, subject: current.title, text: `${current.body}\nOpen ${current.deepLink}`, idempotencyKey: attemptKey })
    : await deps.push.send({ userId: owner.ownerUserId, title: current.title, body: current.body, idempotencyKey: attemptKey });
  if (result.outcome === "available") {
    await prisma.$transaction([
      prisma.reminderAttempt.update({ where: { id: attempt.id }, data: { state: "DELIVERED", providerOutcome: result.outcome, providerMessageId: result.value.messageId, deliveredAt: new Date(), failureReason: null } }),
      prisma.durableReminder.update({ where: { id: current.id }, data: { state: "DELIVERED", deliveredAt: new Date(), failureState: null, failureReason: null, version: { increment: 1 } } }),
    ]);
    return;
  }
  if (result.outcome === "sandbox") {
    await prisma.$transaction([
      prisma.reminderAttempt.update({ where: { id: attempt.id }, data: { state: "SANDBOX_CAPTURED", providerOutcome: result.outcome, providerMessageId: result.value.messageId, failureReason: result.note } }),
      prisma.durableReminder.update({ where: { id: current.id }, data: { state: "FAILED_TERMINAL", failureState: "SANDBOX_CAPTURED", failureReason: result.note, version: { increment: 1 } } }),
    ]);
    return;
  }
  await prisma.$transaction([
    prisma.reminderAttempt.update({ where: { id: attempt.id }, data: { state: "FAILED_RETRYABLE", providerOutcome: result.outcome, failureReason: result.reason } }),
    prisma.durableReminder.update({ where: { id: current.id }, data: { state: "FAILED_RETRYABLE", failureState: "PROVIDER_UNAVAILABLE", failureReason: result.reason, version: { increment: 1 } } }),
  ]);
  if (current.channel === "PUSH") {
    const fallbackKey = `reminder-fallback:${current.id}`;
    await prisma.durableReminder.upsert({ where: { idempotencyKey: fallbackKey }, create: { id: randomUUID(), workspaceId: current.workspaceId, propertyId: current.propertyId, sourceType: current.sourceType, sourceId: current.sourceId, obligationId: current.obligationId, occurrenceId: current.occurrenceId, offsetDays: current.offsetDays, scheduledAt: new Date(), timezone: current.timezone, localTime: current.localTime, channel: "IN_APP", state: "READY", idempotencyKey: fallbackKey, deepLink: current.deepLink, title: `${current.title} · in-app fallback`, body: `${current.body} Push is unavailable; this reminder remains available in-app.` }, update: {} });
  }
  throw Object.assign(new Error(result.reason), { code: "REMINDER_PROVIDER_UNAVAILABLE" });
}

export async function runReminderWorkerOnce(workerId: string, dependencies: ReminderWorkerDependencies = localReminderWorkerDependencies()) {
  await enqueueReadyReminderJobs();
  return runWorkerOnce(workerId, (job) => dispatchReminder(job, dependencies), {eventTypes: ["DISPATCH_REMINDER"]});
}

export function localReminderWorkerDependencies(): ReminderWorkerDependencies {
  return { email: new SandboxEmailAdapter(), push: new UnavailablePushAdapter() };
}

export function stagingReminderWorkerDependencies(env: NodeJS.Dict<string> = process.env): ReminderWorkerDependencies {
  return { email: new SmtpEmailAdapter(smtpConfigFromEnvironment(env)), push: new UnavailablePushAdapter() };
}

export function clientReviewReminderWorkerDependencies(env: NodeJS.Dict<string> = process.env): ReminderWorkerDependencies {
  void env;
  return localReminderWorkerDependencies();
}

export async function reminderFingerprint(input: { sourceId: string; beforeDays: number; channel: string }) {
  return payloadHash(input).slice(0, 16);
}

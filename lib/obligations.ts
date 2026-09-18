import { randomUUID, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { getWorkspaceForUser } from "@/lib/repository";
import { rupeesToPaise } from "@/lib/money";
import { parseReminderConfig, reconcileRemindersForObligation, ReminderInputError } from "@/lib/durable-reminders";

export const OBLIGATION_DIRECTIONS = ["PAYABLE", "RECEIVABLE", "NON_FINANCIAL"] as const;
export const RECURRENCE_TYPES = ["once", "monthly", "quarterly", "yearly"] as const;
export type ObligationDirection = (typeof OBLIGATION_DIRECTIONS)[number];
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];
export type ObligationView = "upcoming" | "overdue" | "completed" | "all";

export class ObligationInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ObligationInputError";
    this.code = code;
    this.status = status;
  }
}

function text(value: unknown, label: string, required = true, max = 200) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ObligationInputError("OBLIGATION_INPUT_INVALID", `${label} is required.`);
    return null;
  }
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > max) throw new ObligationInputError("OBLIGATION_INPUT_INVALID", `${label} is invalid.`);
  return value.trim();
}

export function assertDateOnly(value: unknown, label = "Date") {
  const result = text(value, label, true, 10) as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new ObligationInputError("DATE_ONLY_INVALID", `${label} must be YYYY-MM-DD.`);
  const parsed = new Date(`${result}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw new ObligationInputError("DATE_ONLY_INVALID", `${label} is not a real calendar date.`);
  return result;
}

function amountPaise(value: unknown, required: boolean) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ObligationInputError("AMOUNT_REQUIRED", "A payable or receivable obligation needs an amount.");
    return null;
  }
  try {
    const parsed = typeof value === "bigint" ? value : rupeesToPaise(value as number | string);
    if (parsed === null || parsed <= 0n) throw new Error("non-positive");
    return parsed;
  } catch { throw new ObligationInputError("AMOUNT_INVALID", "Amount must be a positive rupee value."); }
}

function timezone(value: unknown) {
  const result = text(value, "Timezone", true, 80) as string;
  try { new Intl.DateTimeFormat("en-IN", { timeZone: result }).format(); } catch { throw new ObligationInputError("TIMEZONE_INVALID", "Timezone must be a supported IANA timezone."); }
  return result;
}

function recurrence(value: unknown) {
  const result = text(value, "Recurrence", true, 20) as RecurrenceType;
  if (!RECURRENCE_TYPES.includes(result)) throw new ObligationInputError("RECURRENCE_INVALID", "Recurrence must be once, monthly, quarterly, or yearly.");
  return result;
}

function day(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === "") return fallback;
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1 || result > 31) throw new ObligationInputError("RECURRENCE_DAY_INVALID", "Recurrence day must be between 1 and 31.");
  return result;
}

function dateParts(value: string) { return value.split("-").map(Number) as [number, number, number]; }
function daysInMonth(year: number, monthIndex: number) { return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate(); }
function dateFromParts(year: number, monthIndex: number, requestedDay: number) { return `${String(year).padStart(4, "0")}-${String(monthIndex + 1).padStart(2, "0")}-${String(Math.min(requestedDay, daysInMonth(year, monthIndex))).padStart(2, "0")}`; }

/**
 * Date-only recurrence rule: monthly, quarterly, and yearly cycles retain the
 * anchor day where possible; day 29/30/31 is clamped to the target month's
 * last calendar day. There is no local-time or DST arithmetic.
 */
export function occurrenceDate(anchor: string, recurrenceType: RecurrenceType, cycleIndex: number, recurrenceDay?: number) {
  if (recurrenceType === "once") return anchor;
  const [year, month, anchorDay] = dateParts(anchor);
  const increment = recurrenceType === "monthly" ? cycleIndex : recurrenceType === "quarterly" ? cycleIndex * 3 : cycleIndex * 12;
  const target = new Date(Date.UTC(year, month - 1 + increment, 1));
  return dateFromParts(target.getUTCFullYear(), target.getUTCMonth(), recurrenceDay ?? anchorDay);
}

function addMonths(date: string, months: number) { return occurrenceDate(date, "monthly", months); }
function horizonDate(from: string, months: number) { return addMonths(from, months); }

export function parseObligationInput(input: unknown, existing?: { type: string; label: string; direction: string; amountPaise: bigint | null; currency: string; dueDate: string; timezone: string; recurrenceType: string; recurrenceDay: number | null; notes: string | null; reminderConfig: unknown; maintenanceId?: string | null }) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ObligationInputError("OBLIGATION_INPUT_INVALID", "An obligation object is required.");
  const source = input as Record<string, unknown>;
  const direction = text(source.direction ?? existing?.direction, "Direction") as ObligationDirection;
  if (!OBLIGATION_DIRECTIONS.includes(direction)) throw new ObligationInputError("DIRECTION_INVALID", "Direction must be PAYABLE, RECEIVABLE, or NON_FINANCIAL.");
  const dueDate = assertDateOnly(source.dueDate ?? existing?.dueDate, "Due date");
  const recurrenceType = recurrence(source.recurrenceType ?? existing?.recurrenceType);
  const recurrenceDay = day(source.recurrenceDay ?? existing?.recurrenceDay, Number(dueDate.slice(-2)));
  const currency = text(source.currency ?? existing?.currency, "Currency", true, 3) as string;
  if (!/^[A-Z]{3}$/.test(currency)) throw new ObligationInputError("CURRENCY_INVALID", "Currency must be a three-letter uppercase code.");
  const amount = amountPaise(source.amountPaise ?? source.amount ?? existing?.amountPaise, direction !== "NON_FINANCIAL");
  let reminderConfig: unknown = source.reminderConfig ?? existing?.reminderConfig;
  if (reminderConfig !== undefined && reminderConfig !== null) {
    if (typeof reminderConfig !== "object" || Array.isArray(reminderConfig)) throw new ObligationInputError("REMINDER_CONFIG_INVALID", "Reminder configuration must be an object.");
    reminderConfig = JSON.parse(JSON.stringify(reminderConfig));
    try { parseReminderConfig(reminderConfig); }
    catch (error: unknown) { if (error instanceof ReminderInputError) throw new ObligationInputError(error.code, error.message, error.status); throw error; }
  }
  const maintenanceId = source.maintenanceId ?? existing?.maintenanceId;
  if (maintenanceId !== undefined && maintenanceId !== null && (typeof maintenanceId !== "string" || !maintenanceId.trim() || maintenanceId.length > 80)) throw new ObligationInputError("MAINTENANCE_REFERENCE_INVALID", "Maintenance reference is invalid.");
  return {
    type: text(source.type ?? existing?.type, "Type", true, 80) as string,
    label: text(source.label ?? existing?.label, "Label", true, 200) as string,
    direction,
    amountPaise: amount,
    currency,
    dueDate,
    timezone: timezone(source.timezone ?? existing?.timezone),
    recurrenceType,
    recurrenceDay,
    notes: text(source.notes ?? existing?.notes, "Notes", false, 2_000),
    reminderConfig: reminderConfig && typeof reminderConfig === "object" ? reminderConfig as Prisma.InputJsonValue : undefined,
    maintenanceId: maintenanceId ? maintenanceId.trim() : null,
  };
}

function dto(row: { id: string; propertyId: string; type: string; label: string; direction: string; amountPaise: bigint | null; currency: string; dueDate: string; timezone: string; recurrenceType: string; recurrenceDay: number | null; source: string; notes: string | null; reminderConfig: unknown; maintenanceId: string | null; active: boolean; version: number; createdAt: Date; updatedAt: Date }, occurrences?: Array<{ id: string; cycleKey: string; dueDate: string; amountPaise: bigint | null; currency: string; status: string; source: string; version: number }>) {
  return { ...row, amountPaise: row.amountPaise?.toString() ?? null, amount: row.amountPaise === null ? null : Number(row.amountPaise) / 100, occurrences: occurrences?.map((occurrence) => ({ ...occurrence, amountPaise: occurrence.amountPaise?.toString() ?? null, amount: occurrence.amountPaise === null ? null : Number(occurrence.amountPaise) / 100 })) };
}

async function ownedProperty(userId: string, propertyId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new ObligationInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" } });
  if (!property) throw new ObligationInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  return { workspace, property };
}

async function obligationForUser(userId: string, obligationId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new ObligationInputError("OBLIGATION_NOT_FOUND", "Obligation not found.", 404);
  const obligation = await prisma.obligation.findFirst({ where: { id: obligationId, workspaceId: workspace.id } });
  if (!obligation) throw new ObligationInputError("OBLIGATION_NOT_FOUND", "Obligation not found.", 404);
  return { workspace, obligation };
}

export async function ensureObligationOccurrences(obligationId: string, throughDate: string, db: PrismaClient | Prisma.TransactionClient = prisma): Promise<Array<{ id: string; cycleKey: string; dueDate: string }>> {
  // A concurrent list/worker must not materialize an obsolete recurrence after
  // its correction commits. Share the same schedule lock as corrections.
  if (db === prisma) return prisma.$transaction(tx => ensureObligationOccurrences(obligationId, throughDate, tx));
  await db.$queryRaw`SELECT id FROM "Obligation" WHERE id = ${obligationId} FOR UPDATE`;
  const obligation = await db.obligation.findUnique({ where: { id: obligationId }, select: { id: true, workspaceId: true, propertyId: true, amountPaise: true, currency: true, dueDate: true, recurrenceType: true, recurrenceDay: true, active: true } });
  if (!obligation || !obligation.active) return [];
  const through = assertDateOnly(throughDate, "Occurrence horizon");
  const occurrences: Array<{ id: string; cycleKey: string; dueDate: string }> = [];
  for (let index = 0; index < 1_000; index += 1) {
    const dueDate = occurrenceDate(obligation.dueDate, obligation.recurrenceType as RecurrenceType, index, obligation.recurrenceDay ?? undefined);
    if (dueDate > through) break;
    const row = await db.obligationOccurrence.upsert({ where: { obligationId_cycleKey: { obligationId, cycleKey: dueDate } }, create: { id: randomUUID(), workspaceId: obligation.workspaceId, propertyId: obligation.propertyId, obligationId, cycleKey: dueDate, dueDate, amountPaise: obligation.amountPaise, currency: obligation.currency, status: "OPEN", source: "GENERATED" }, update: {} });
    occurrences.push({ id: row.id, cycleKey: row.cycleKey, dueDate: row.dueDate });
    if (obligation.recurrenceType === "once") break;
  }
  return occurrences;
}

async function updateOccurrenceStatuses(userId: string, propertyId: string, asOf: string) {
  const { workspace } = await ownedProperty(userId, propertyId);
  const obligations = await prisma.obligation.findMany({ where: { workspaceId: workspace.id, propertyId, active: true }, select: { id: true } });
  const horizon = horizonDate(asOf, 12);
  for (const obligation of obligations) await ensureObligationOccurrences(obligation.id, horizon);
  const occurrences = await prisma.obligationOccurrence.findMany({ where: { workspaceId: workspace.id, propertyId }, include: { payments: { where: { status: "RECORDED" }, select: { amountPaise: true } } } });
  for (const occurrence of occurrences) {
    const paid = occurrence.payments.reduce((sum, payment) => sum + payment.amountPaise, 0n);
    const next = occurrence.amountPaise !== null && paid >= occurrence.amountPaise ? "COMPLETED" : occurrence.dueDate < asOf ? "OVERDUE" : "OPEN";
    if (occurrence.status === "CANCELLED" || (occurrence.amountPaise === null && occurrence.status === "COMPLETED")) continue;
    if (occurrence.status !== next) await prisma.obligationOccurrence.updateMany({ where: { id: occurrence.id, version: occurrence.version, status: occurrence.status }, data: { status: next, version: { increment: 1 } } });
  }
  for (const obligation of obligations) await reconcileRemindersForObligation(obligation.id);
}

export async function createObligationForUser(userId: string, propertyId: string, input: unknown) {
  const { workspace } = await ownedProperty(userId, propertyId);
  const value = parseObligationInput(input);
  const requestKey = (input as Record<string, unknown>).requestKey;
  if (requestKey !== undefined && (typeof requestKey !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(requestKey))) throw new ObligationInputError("REQUEST_KEY_INVALID", "A valid request key is required.");
  const payloadHash = createHash("sha256").update(JSON.stringify({ propertyId, ...value }, (_key, val) => typeof val === "bigint" ? val.toString() : val)).digest("hex");
  if (value.maintenanceId && !(await prisma.maintenance.findFirst({ where: { id: value.maintenanceId, workspaceId: workspace.id, propertyId }, select: { id: true } }))) throw new ObligationInputError("MAINTENANCE_NOT_FOUND", "Linked maintenance record not found.", 404);
  const obligation = await prisma.$transaction(async (tx) => {
    if (typeof requestKey === "string") {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`);
      const previous = await tx.idempotencyRecord.findUnique({ where: { principalUserId_action_requestKey: { principalUserId: userId, action: "obligation.create", requestKey } } });
      if (previous) {
        if (previous.payloadHash !== payloadHash) throw new ObligationInputError("REQUEST_KEY_CONFLICT", "This request key already records different schedule details.", 409);
        const receipt = previous.response as { obligationId: string };
        return tx.obligation.findFirstOrThrow({ where: { id: receipt.obligationId, workspaceId: workspace.id, propertyId } });
      }
    }
    const row = await tx.obligation.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, source: "USER_ENTERED", ...value } });
    await ensureObligationOccurrences(row.id, horizonDate(row.dueDate, 12), tx);
    await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, date: row.dueDate, title: "Obligation recorded", detail: `${row.label} was added manually as ${row.direction}.`, kind: "tax" } });
    if (typeof requestKey === "string") await tx.idempotencyRecord.create({ data: { id: randomUUID(), principalUserId: userId, action: "obligation.create", requestKey, payloadHash, response: { obligationId: row.id, propertyId } } });
    return row;
  });
  await reconcileRemindersForObligation(obligation.id);
  return getObligationForUser(userId, obligation.id);
}

export async function getObligationForUser(userId: string, obligationId: string) {
  const { obligation } = await obligationForUser(userId, obligationId);
  const occurrences = await prisma.obligationOccurrence.findMany({ where: { obligationId, workspaceId: obligation.workspaceId }, orderBy: { dueDate: "asc" }, select: { id: true, cycleKey: true, dueDate: true, amountPaise: true, currency: true, status: true, source: true, version: true } });
  return dto(obligation, occurrences);
}

export async function listObligationsForUser(userId: string, propertyId: string, view: ObligationView = "all", asOf = new Date().toISOString().slice(0, 10)) {
  assertDateOnly(asOf, "As-of date");
  const { workspace } = await ownedProperty(userId, propertyId);
  await updateOccurrenceStatuses(userId, propertyId, asOf);
  const obligations = await prisma.obligation.findMany({ where: { workspaceId: workspace.id, propertyId }, orderBy: { dueDate: "asc" }, include: { occurrences: { orderBy: { dueDate: "asc" }, select: { id: true, cycleKey: true, dueDate: true, amountPaise: true, currency: true, status: true, source: true, version: true } } } });
  const filtered = obligations.map((row) => dto(row, row.occurrences)).filter((row) => view === "all" || row.occurrences?.some((occurrence) => occurrence.status === (view === "upcoming" ? "OPEN" : view === "overdue" ? "OVERDUE" : "COMPLETED")));
  return filtered;
}

export async function updateObligationForUser(userId: string, obligationId: string, expectedVersion: number, input: unknown) {
  const { obligation } = await obligationForUser(userId, obligationId);
  if (obligation.version !== expectedVersion) throw new ObligationInputError("OBLIGATION_VERSION_CONFLICT", "This obligation changed in another request. Reload before saving again.", 409);
  const value = parseObligationInput(input, obligation);
  if (value.maintenanceId && !(await prisma.maintenance.findFirst({ where: { id: value.maintenanceId, workspaceId: obligation.workspaceId, propertyId: obligation.propertyId }, select: { id: true } }))) throw new ObligationInputError("MAINTENANCE_NOT_FOUND", "Linked maintenance record not found.", 404);
  await prisma.$transaction(async tx => {
    const updated = await tx.obligation.updateMany({ where: { id: obligationId, workspaceId: obligation.workspaceId, version: expectedVersion }, data: { ...value, version: { increment: 1 } } });
    if (updated.count !== 1) throw new ObligationInputError("OBLIGATION_VERSION_CONFLICT", "This obligation changed in another request. Reload before saving again.", 409);
    // Serialize against payment writes before deciding which occurrences are editable.
    await tx.$queryRaw`SELECT id FROM "ObligationOccurrence" WHERE "obligationId" = ${obligationId} ORDER BY id FOR UPDATE`;
    const previous = await tx.obligationOccurrence.findMany({ where: { obligationId }, include: { payments: { select: { id: true } } } });
    if (previous.some(row => row.payments.length) && (value.direction !== obligation.direction || value.currency !== obligation.currency)) throw new ObligationInputError("PAID_SCHEDULE_SEMANTICS", "A schedule with payment history cannot change direction or currency.", 409);
    const through = previous.reduce((latest, row) => row.dueDate > latest ? row.dueDate : latest, horizonDate(value.dueDate, 12));
    const desired = new Set<string>();
    for (let index = 0; index < 1000; index++) {
      const date = occurrenceDate(value.dueDate, value.recurrenceType, index, value.recurrenceDay);
      if (date > through) break;
      desired.add(date);
      if (value.recurrenceType === "once") break;
    }
    for (const row of previous) {
      // Even reversed payment history is immutable evidence; no silent repricing.
      if (row.payments.length || row.status === "COMPLETED") continue;
      await tx.obligationOccurrence.update({ where: { id: row.id }, data: desired.has(row.dueDate)
        ? { amountPaise: value.amountPaise, currency: value.currency, status: "OPEN", version: { increment: 1 } }
        : { status: "CANCELLED", version: { increment: 1 } } });
    }
    await ensureObligationOccurrences(obligationId, through, tx);
    await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: obligation.workspaceId, propertyId: obligation.propertyId, date: new Date().toISOString().slice(0, 10), title: "Obligation corrected", detail: `${obligation.label}: schedule v${expectedVersion} corrected to v${expectedVersion + 1}. Paid occurrences and loan balance retained.`, kind: "tax" } });
  });
  await reconcileRemindersForObligation(obligationId);
  return getObligationForUser(userId, obligationId);
}

export async function setObligationActiveForUser(userId: string, obligationId: string, active: boolean, expectedVersion: number) {
  const { obligation } = await obligationForUser(userId, obligationId);
  if (obligation.version !== expectedVersion) throw new ObligationInputError("OBLIGATION_VERSION_CONFLICT", "This obligation changed in another request. Reload before saving again.", 409);
  const updated = await prisma.obligation.updateMany({ where: { id: obligationId, workspaceId: obligation.workspaceId, version: expectedVersion }, data: { active, version: { increment: 1 } } });
  if (updated.count !== 1) throw new ObligationInputError("OBLIGATION_VERSION_CONFLICT", "This obligation changed in another request. Reload before saving again.", 409);
  await reconcileRemindersForObligation(obligationId);
  return getObligationForUser(userId, obligationId);
}

export async function markOccurrenceCompletedForUser(userId: string, occurrenceId: string, expectedVersion: number) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new ObligationInputError("OCCURRENCE_NOT_FOUND", "Occurrence not found.", 404);
  const occurrence = await prisma.obligationOccurrence.findFirst({ where: { id: occurrenceId, workspaceId: workspace.id } });
  if (!occurrence) throw new ObligationInputError("OCCURRENCE_NOT_FOUND", "Occurrence not found.", 404);
  const updated = await prisma.obligationOccurrence.updateMany({ where: { id: occurrenceId, workspaceId: workspace.id, version: expectedVersion }, data: { status: "COMPLETED", source: "USER_ENTERED", version: { increment: 1 } } });
  if (updated.count !== 1) throw new ObligationInputError("OCCURRENCE_VERSION_CONFLICT", "This occurrence changed in another request. Reload before completing it.", 409);
  await reconcileRemindersForObligation(occurrence.obligationId);
  return prisma.obligationOccurrence.findUniqueOrThrow({ where: { id: occurrenceId } });
}

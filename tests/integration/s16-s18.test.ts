import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { toNextJsHandler } from "better-auth/next-js";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { clearLocalMailbox, readLocalOtp } from "@/lib/auth-mailbox";
import { prisma } from "@/lib/prisma";
import { POST as createProperty } from "@/app/api/properties/route";
import { GET as remindersGet, POST as remindersPost } from "@/app/api/reminders/route";
import { GET as reminderPreferencesGet, PATCH as reminderPreferencesPatch } from "@/app/api/reminders/preferences/route";
import { POST as reminderAction } from "@/app/api/reminders/[id]/route";
import { PATCH as obligationPatch } from "@/app/api/obligations/[id]/route";
import { POST as obligationPost } from "@/app/api/obligations/route";
import { POST as paymentPost } from "@/app/api/obligations/[id]/payments/route";
import { POST as reversePayment } from "@/app/api/payments/[id]/reverse/route";
import { POST as archiveProperty } from "@/app/api/properties/[id]/archive/route";
import { POST as maintenancePost, GET as maintenanceGet } from "@/app/api/maintenance/route";
import { GET as maintenanceItemGet, PATCH as maintenancePatch, POST as maintenanceAction } from "@/app/api/maintenance/[id]/route";
import { GET as maintenanceDocumentsGet, POST as maintenanceDocumentPost } from "@/app/api/maintenance/[id]/documents/route";
import { POST as shareCreate, GET as sharesGet } from "@/app/api/properties/[id]/shares/route";
import { POST as shareRevoke } from "@/app/api/shares/[id]/route";
import { POST as shareAccept } from "@/app/api/share-invitations/accept/route";
import { GET as sharedPropertiesGet } from "@/app/api/shared/properties/route";
import { GET as sharedPropertyGet } from "@/app/api/shared/properties/[id]/route";
import { GET as sharedDocumentsGet } from "@/app/api/shared/properties/[id]/documents/route";
import { GET as sharedDocumentGet } from "@/app/api/shared/documents/[id]/route";
import { GET as sharedHealthGet } from "@/app/api/shared/health/[id]/route";
import { POST as sharedOperationPost } from "@/app/api/shared/operations/route";
import { runSharedOperationWorkerOnce } from "@/lib/sharing";
import { enqueueReadyReminderJobs, localReminderInstant, runReminderWorkerOnce } from "@/lib/durable-reminders";
import { LocalObjectStorageAdapter } from "@/lib/providers";
import { sha256Hex } from "@/lib/vault-repository";

const authHandler = toNextJsHandler(auth);
const today = "2026-09-11";
type Json = Record<string, unknown>;

function requestWithCookie(path: string, cookie: string, init?: RequestInit) { return new Request(`http://localhost:3100${path}`, { ...init, headers: { ...(init?.headers ?? {}), cookie, "content-type": "application/json" } }); }
async function json(response: Response) { return response.json() as Promise<Json>; }

async function signIn(email: string) {
  await authHandler.POST(new Request("http://localhost:3100/api/auth/email-otp/send-verification-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, type: "sign-in" }) }));
  const message = readLocalOtp(email);
  expect(message?.otp).toMatch(/^\d{6}$/);
  const response = await authHandler.POST(new Request("http://localhost:3100/api/auth/sign-in/email-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, otp: message?.otp ?? "" }) }));
  expect(response.ok).toBe(true);
  return response.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
}

function propertyPayload(name: string) { return { name, type: "flat", city: "Pune", area: "Kothrud", address: "7 Forest Road", jurisdiction: "India / Maharashtra / Pune", areaValue: "1200", areaUnit: "sqft", areaType: "carpet", ownerName: "Synthetic Owner", ownershipAssertion: "self_asserted", ownershipProvenance: "Synthetic owner-entered evidence", identifiers: [{ label: "Survey no.", value: "SYN-S16-S18" }] }; }
async function makeProperty(cookie: string, name: string) { const response = await createProperty(requestWithCookie("/api/properties", cookie, { method: "POST", body: JSON.stringify(propertyPayload(name)) })); expect(response.status).toBe(201); return ((await json(response)).data as Json).property as { id: string; version: number }; }
async function makeCleanDocument(ownerEmail: string, propertyId: string, label: string) {
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } });
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: owner.id } });
  const id = randomUUID(); const versionId = randomUUID(); const bytes = Buffer.from(`synthetic clean vault object ${label}`); const storageKey = `${owner.id}/${propertyId}/${id}/v1.pdf`;
  await new LocalObjectStorageAdapter("test").put({ storageKey, bytes, contentType: "application/pdf" });
  const sha256 = sha256Hex(bytes);
  await prisma.propertyDoc.create({ data: { id, workspaceId: workspace.id, propertyId, type: label === "hidden" ? "NOC" : "Registry", name: `${label}.pdf`, displayName: `${label} evidence`, originalFilename: `${label}.pdf`, uploadDate: today, uploadedBy: owner.id, sizeBytes: bytes.length, sha256, storageKey, mimeType: "application/pdf", processingState: "ready", scanStatus: "clean", reviewStatus: "confirmed", version: 1, verified: false } });
  await prisma.documentVersion.create({ data: { id: versionId, workspaceId: workspace.id, documentId: id, version: 1, originalFilename: `${label}.pdf`, displayName: `${label} evidence`, mimeType: "application/pdf", sizeBytes: bytes.length, sha256, storageKey, scanStatus: "clean", processingState: "ready", reviewStatus: "confirmed", source: "user_uploaded", uploadedBy: owner.id } });
  return { id, versionId };
}

let ownerCookie = ""; let familyCookie = ""; let lawyerCookie = ""; let userBCookie = ""; let operatorCookie = ""; let propertyId = ""; let otherPropertyId = ""; let registryId = ""; let hiddenId = ""; let maintenanceId = ""; let shareId = ""; let operationId = "";

async function cleanupReminderQueue() {
  await prisma.reminderAttempt.deleteMany();
  await prisma.durableReminder.deleteMany();
  await prisma.outboxEvent.deleteMany();
}

async function waitForReminderWorker(workerId: string) {
  const deadline = Date.now() + 2_000;
  let result = await runReminderWorkerOnce(workerId);
  while (!result && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    result = await runReminderWorkerOnce(workerId);
  }
  return result;
}

beforeAll(async () => {
  await prisma.user.deleteMany();
  await prisma.outboxEvent.deleteMany();
  clearLocalMailbox();
  ownerCookie = await signIn("s16-owner@example.com");
  familyCookie = await signIn("s16-family@example.com");
  lawyerCookie = await signIn("s16-lawyer@example.com");
  userBCookie = await signIn("s16-user-b@example.com");
  operatorCookie = await signIn("s16-operator@example.com");
  const operator = await prisma.user.findUniqueOrThrow({ where: { email: "s16-operator@example.com" } });
  await prisma.user.update({ where: { id: operator.id }, data: { role: "operator" } });
  propertyId = (await makeProperty(ownerCookie, "S16-S18 Synthetic Home")).id;
  otherPropertyId = (await makeProperty(ownerCookie, "S16-S18 Other Home")).id;
  registryId = (await makeCleanDocument("s16-owner@example.com", propertyId, "registry")).id;
  hiddenId = (await makeCleanDocument("s16-owner@example.com", propertyId, "hidden")).id;
});

afterAll(async () => { await prisma.outboxEvent.deleteMany(); await prisma.user.deleteMany(); clearLocalMailbox(); });
afterEach(cleanupReminderQueue);

describe("S16 durable reminders and local notification boundaries", () => {
  it("uses date-only local semantics across timezone, month-end, leap-day, and chosen delivery time", async () => {
    expect(localReminderInstant("2026-09-12", "09:00", "Asia/Kolkata").toISOString()).toBe("2026-09-12T03:30:00.000Z");
    expect(localReminderInstant("2024-03-01", "09:15", "America/Los_Angeles").toISOString()).toBe("2024-03-01T17:15:00.000Z");
    expect(localReminderInstant("2024-03-01", "09:15", "UTC").toISOString()).toBe("2024-03-01T09:15:00.000Z");
  });

  it("creates, edits, cancels on full payment, and restores on reversal", async () => {
    const created = await obligationPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Property tax", label: "Synthetic September tax", direction: "PAYABLE", amount: "1000", currency: "INR", dueDate: "2026-09-15", timezone: "Asia/Kolkata", recurrenceType: "once", reminderConfig: { enabled: true, beforeDays: [3, 0], localTime: "09:00", channels: ["IN_APP"] } }) }));
    expect(created.status).toBe(201);
    const obligation = (await json(created)).data as Json;
    const obligationId = obligation.obligation as Json;
    let rows = await prisma.durableReminder.findMany({ where: { obligationId: obligationId.id as string } });
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.offsetDays === -3)?.scheduledAt.toISOString()).toBe("2026-09-12T03:30:00.000Z");
    const edited = await obligationPatch(requestWithCookie(`/api/obligations/${obligationId.id}`, ownerCookie, { method: "PATCH", body: JSON.stringify({ version: obligationId.version, obligation: { dueDate: "2026-09-20" } }) }), { params: Promise.resolve({ id: obligationId.id as string }) });
    expect(edited.status).toBe(200);
    rows = await prisma.durableReminder.findMany({ where: { obligationId: obligationId.id as string } });
    expect(rows.filter((row) => row.state === "CANCELLED")).toHaveLength(2);
    const current = (await json(edited)).data as Json; const currentObligation = current.obligation as Json; const occurrence = (currentObligation.occurrences as Array<Json>).find((item) => item.dueDate === "2026-09-20") as Json;
    const paid = await paymentPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "1000", currency: "INR", paymentDate: today, method: "synthetic transfer", idempotencyKey: "s16-payment-1", expectedOccurrenceVersion: occurrence.version }) }), { params: Promise.resolve({ id: occurrence.id as string }) });
    expect(paid.status).toBe(201);
    expect((await prisma.durableReminder.count({ where: { obligationId: obligationId.id as string, occurrenceId: occurrence.id as string, state: "CANCELLED" } }))).toBeGreaterThanOrEqual(2);
    const paymentId = (((await json(paid)).data as Json).payment as Json).id as string;
    const reversed = await reversePayment(requestWithCookie(`/api/payments/${paymentId}/reverse`, ownerCookie, { method: "POST", body: JSON.stringify({ idempotencyKey: "s16-reversal-1" }) }), { params: Promise.resolve({ id: paymentId }) });
    expect(reversed.status).toBe(200);
    expect(await prisma.durableReminder.count({ where: { obligationId: obligationId.id as string, occurrenceId: occurrence.id as string, state: { in: ["SCHEDULED", "READY"] } } })).toBeGreaterThan(0);
  });

  it("delivers in-app once, captures email in sandbox, and keeps push unavailable with local fallback", async () => {
    const inApp = await obligationPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Insurance", label: "Synthetic in-app due", direction: "PAYABLE", amount: "500", currency: "INR", dueDate: today, timezone: "UTC", recurrenceType: "once", reminderConfig: { enabled: true, beforeDays: [0], localTime: "09:00", channels: ["IN_APP"] } }) }));
    expect(inApp.status).toBe(201);
    const inAppObligation = ((await json(inApp)).data as Json).obligation as Json;
    const inAppReminder = await prisma.durableReminder.findFirstOrThrow({ where: { obligationId: inAppObligation.id as string } });
    await prisma.durableReminder.update({ where: { id: inAppReminder.id }, data: { state: "READY", scheduledAt: new Date() } });
    await enqueueReadyReminderJobs();
    expect((await runReminderWorkerOnce("s16-worker-a"))?.status).toBe("succeeded");
    await runReminderWorkerOnce("s16-worker-b");
    expect(await prisma.reminderAttempt.count({ where: { reminderId: inAppReminder.id } })).toBe(1);
    expect((await prisma.durableReminder.findUniqueOrThrow({ where: { id: inAppReminder.id } })).state).toBe("DELIVERED");

    const email = await obligationPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Insurance", label: "Synthetic email due", direction: "PAYABLE", amount: "500", currency: "INR", dueDate: today, timezone: "UTC", recurrenceType: "once", reminderConfig: { enabled: true, beforeDays: [0], localTime: "09:00", channels: ["EMAIL"] } }) }));
    const emailObligation = ((await json(email)).data as Json).obligation as Json; const emailReminder = await prisma.durableReminder.findFirstOrThrow({ where: { obligationId: emailObligation.id as string } });
    await prisma.durableReminder.update({ where: { id: emailReminder.id }, data: { state: "READY", scheduledAt: new Date() } });
    await enqueueReadyReminderJobs(); await runReminderWorkerOnce("s16-email-worker");
    expect((await prisma.durableReminder.findUniqueOrThrow({ where: { id: emailReminder.id } })).failureState).toBe("SANDBOX_CAPTURED");
    expect((await prisma.reminderAttempt.findFirstOrThrow({ where: { reminderId: emailReminder.id } })).providerOutcome).toBe("sandbox");

    const push = await obligationPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Insurance", label: "Synthetic push due", direction: "PAYABLE", amount: "500", currency: "INR", dueDate: today, timezone: "UTC", recurrenceType: "once", reminderConfig: { enabled: true, beforeDays: [0], localTime: "09:00", channels: ["PUSH", "IN_APP"] } }) }));
    const pushObligation = ((await json(push)).data as Json).obligation as Json; const pushRows = await prisma.durableReminder.findMany({ where: { obligationId: pushObligation.id as string } });
    await prisma.durableReminder.updateMany({ where: { id: { in: pushRows.map((row) => row.id) } }, data: { state: "READY", scheduledAt: new Date() } });
    for (let i = 0; i < 5; i += 1) { await enqueueReadyReminderJobs(); await runReminderWorkerOnce(`s16-push-worker-${i}`); await new Promise((resolve) => setTimeout(resolve, 120)); }
    expect((await prisma.durableReminder.findFirstOrThrow({ where: { obligationId: pushObligation.id as string, channel: "PUSH" } })).state).toBe("FAILED_RETRYABLE");
    expect((await prisma.durableReminder.findFirstOrThrow({ where: { obligationId: pushObligation.id as string, channel: "IN_APP" } })).state).toBe("DELIVERED");
    expect(await prisma.durableReminder.count({ where: { idempotencyKey: { startsWith: "reminder-fallback:" }, sourceId: { not: "" } } })).toBeGreaterThan(0);
  });

  it("supports read, unread, mark-all-read, snooze, dismiss, archive cancellation, and User B isolation", async () => {
    const obligationResponse = await obligationPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Other", label: "Snooze target", direction: "NON_FINANCIAL", currency: "INR", dueDate: "2026-12-15", timezone: "UTC", recurrenceType: "once", reminderConfig: { enabled: true, beforeDays: [0], localTime: "10:00", channels: ["IN_APP"] } }) }));
    const obligation = ((await json(obligationResponse)).data as Json).obligation as Json; const reminder = await prisma.durableReminder.findFirstOrThrow({ where: { obligationId: obligation.id as string } });
    const snoozed = await reminderAction(requestWithCookie(`/api/reminders/${reminder.id}`, ownerCookie, { method: "POST", body: JSON.stringify({ action: "snooze", until: new Date(Date.now() + 3_600_000).toISOString() }) }), { params: Promise.resolve({ id: reminder.id }) });
    expect(snoozed.status).toBe(200); expect((await prisma.durableReminder.findUniqueOrThrow({ where: { id: reminder.id } })).snoozedUntil).toBeTruthy();
    expect((await reminderAction(requestWithCookie(`/api/reminders/${reminder.id}`, ownerCookie, { method: "POST", body: JSON.stringify({ action: "read" }) }), { params: Promise.resolve({ id: reminder.id }) })).status).toBe(200);
    expect((await reminderAction(requestWithCookie(`/api/reminders/${reminder.id}`, ownerCookie, { method: "POST", body: JSON.stringify({ action: "unread" }) }), { params: Promise.resolve({ id: reminder.id }) })).status).toBe(200);
    expect((await remindersPost(requestWithCookie("/api/reminders", ownerCookie, { method: "POST", body: JSON.stringify({ action: "mark-all-read" }) }))).status).toBe(200);
    expect((await reminderAction(requestWithCookie(`/api/reminders/${reminder.id}`, ownerCookie, { method: "POST", body: JSON.stringify({ action: "dismiss" }) }), { params: Promise.resolve({ id: reminder.id }) })).status).toBe(200);
    const archivedProperty = (await makeProperty(ownerCookie, "Archive reminder test")).id;
    const archivedObligation = await obligationPost(requestWithCookie(`/api/obligations?propertyId=${archivedProperty}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Other", label: "Archive cancellation", direction: "NON_FINANCIAL", currency: "INR", dueDate: "2026-12-15", timezone: "UTC", recurrenceType: "once", reminderConfig: { enabled: true, beforeDays: [0], localTime: "10:00", channels: ["IN_APP"] } }) }));
    const archivedId = ((await json(archivedObligation)).data as Json).obligation as Json; const property = await prisma.property.findUniqueOrThrow({ where: { id: archivedProperty }, select: { version: true } });
    const archived = await archiveProperty(requestWithCookie(`/api/properties/${archivedProperty}/archive`, ownerCookie, { method: "POST", body: JSON.stringify({ version: property.version }) }), { params: Promise.resolve({ id: archivedProperty }) });
    expect(archived.status).toBe(200); expect(await prisma.durableReminder.count({ where: { obligationId: archivedId.id as string, state: "CANCELLED" } })).toBeGreaterThan(0);
    const userB = await remindersGet(requestWithCookie("/api/reminders", userBCookie)); expect(userB.status).toBe(200); expect(((await json(userB)).data as Json).reminders).toEqual([]);
  });

  it("stores manual deadline/future-event reminders, durable channel preferences, and reclaims a crashed worker lease", async () => {
    const manual = await remindersPost(requestWithCookie("/api/reminders", ownerCookie, { method: "POST", body: JSON.stringify({ action: "create", propertyId, sourceType: "FUTURE_EVENT", sourceId: "synthetic-registration-event", title: "Synthetic future event", scheduledDate: "2026-10-01", timezone: "Asia/Kolkata", localTime: "08:30", channels: ["IN_APP"], idempotencyKey: "s16-manual-event" }) }));
    expect(manual.status).toBe(201); const manualReminder = ((await json(manual)).data as Json).reminders as Array<Json>; expect(manualReminder[0]).toMatchObject({ sourceType: "FUTURE_EVENT", sourceId: "synthetic-registration-event", timezone: "Asia/Kolkata", localTime: "08:30" });
    expect((await reminderPreferencesGet(requestWithCookie("/api/reminders/preferences", ownerCookie))).status).toBe(200);
    const preferences = await reminderPreferencesPatch(requestWithCookie("/api/reminders/preferences", ownerCookie, { method: "PATCH", body: JSON.stringify({ EMAIL: false }) })); expect(preferences.status).toBe(200); expect(((await json(preferences)).data as Json).preferences).toEqual(expect.arrayContaining([{ channel: "EMAIL", enabled: false }]));
    await prisma.outboxEvent.deleteMany({ where: { eventType: "DISPATCH_REMINDER" } });
    await prisma.durableReminder.update({ where: { id: manualReminder[0].id as string }, data: { state: "READY", scheduledAt: new Date() } });
    await enqueueReadyReminderJobs();
    const crashed = await import("@/lib/worker").then(({ claimNextJob }) => claimNextJob("s16-crashed-worker", 100, ["DISPATCH_REMINDER"])); expect(crashed?.eventType).toBe("DISPATCH_REMINDER");
    expect((await waitForReminderWorker("s16-restarted-worker"))?.status).toBe("succeeded");
    expect((await prisma.durableReminder.findUniqueOrThrow({ where: { id: manualReminder[0].id as string } })).state).toBe("DELIVERED");
  });
});

describe("S17 maintenance lifecycle, Vault links, and timeline", () => {
  it("creates, progresses, resolves, reopens, corrects, and reads owner-reported records", async () => {
    const created = await maintenancePost(requestWithCookie(`/api/maintenance?propertyId=${propertyId}`, ownerCookie, { method: "POST", headers: { "Idempotency-Key": "s17-maintenance-create" }, body: JSON.stringify({ title: "Terrace waterproofing", category: "Waterproofing", description: "Synthetic seepage report", priority: "HIGH", dateReported: today, location: "Terrace", provider: "Synthetic Works", contactDetails: "local only", estimatedAmount: "6000" }) }));
    expect(created.status).toBe(201); const createdMaintenance = ((await json(created)).data as Json).maintenance as Json; maintenanceId = createdMaintenance.id as string;
    const planned = await maintenanceAction(requestWithCookie(`/api/maintenance/${maintenanceId}`, ownerCookie, { method: "POST", headers: { "Idempotency-Key": "s17-plan" }, body: JSON.stringify({ action: "plan", version: createdMaintenance.version }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(planned.status).toBe(200);
    const plannedRow = ((await json(planned)).data as Json).maintenance as Json;
    const progress = await maintenanceAction(requestWithCookie(`/api/maintenance/${maintenanceId}`, ownerCookie, { method: "POST", headers: { "Idempotency-Key": "s17-progress" }, body: JSON.stringify({ action: "progress", version: plannedRow.version }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(progress.status).toBe(200);
    const progressRow = ((await json(progress)).data as Json).maintenance as Json;
    const resolved = await maintenanceAction(requestWithCookie(`/api/maintenance/${maintenanceId}`, ownerCookie, { method: "POST", headers: { "Idempotency-Key": "s17-resolve" }, body: JSON.stringify({ action: "resolve", version: progressRow.version, input: { finalAmount: "5850" } }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(resolved.status).toBe(200);
    const resolvedRow = ((await json(resolved)).data as Json).maintenance as Json; expect(resolvedRow.status).toBe("RESOLVED"); expect(resolvedRow.finalAmount).toBe(5850);
    const reopened = await maintenanceAction(requestWithCookie(`/api/maintenance/${maintenanceId}`, ownerCookie, { method: "POST", headers: { "Idempotency-Key": "s17-reopen" }, body: JSON.stringify({ action: "reopen", version: resolvedRow.version }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(reopened.status).toBe(200);
    const row = ((await json(reopened)).data as Json).maintenance as Json;
    const corrected = await maintenancePatch(requestWithCookie(`/api/maintenance/${maintenanceId}`, ownerCookie, { method: "PATCH", headers: { "Idempotency-Key": "s17-correction" }, body: JSON.stringify({ version: row.version, maintenance: { notes: "Corrected by owner" } }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(corrected.status).toBe(200);
    expect(((await json(await maintenanceItemGet(requestWithCookie(`/api/maintenance/${maintenanceId}`, ownerCookie), { params: Promise.resolve({ id: maintenanceId }) }))).data as Json).maintenance).toBeTruthy();
  });

  it("links active clean invoice and warranty documents, rejects cross-property links, and keeps timeline retry-safe", async () => {
    const otherDoc = (await makeCleanDocument("s16-owner@example.com", otherPropertyId, "other-property")).id;
    const invoice = await maintenanceDocumentPost(requestWithCookie(`/api/maintenance/${maintenanceId}/documents`, ownerCookie, { method: "POST", body: JSON.stringify({ documentId: registryId, linkType: "INVOICE" }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(invoice.status).toBe(201);
    const warranty = await maintenanceDocumentPost(requestWithCookie(`/api/maintenance/${maintenanceId}/documents`, ownerCookie, { method: "POST", body: JSON.stringify({ documentId: hiddenId, linkType: "WARRANTY" }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(warranty.status).toBe(201);
    const cross = await maintenanceDocumentPost(requestWithCookie(`/api/maintenance/${maintenanceId}/documents`, ownerCookie, { method: "POST", body: JSON.stringify({ documentId: otherDoc, linkType: "PHOTO" }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(cross.status).toBe(404);
    const links = await maintenanceDocumentsGet(requestWithCookie(`/api/maintenance/${maintenanceId}/documents`, ownerCookie), { params: Promise.resolve({ id: maintenanceId }) }); expect(((await json(links)).data as Json).links).toHaveLength(2);
    const beforeEvents = await prisma.maintenanceEvent.count({ where: { maintenanceId } }); const beforeTimeline = await prisma.timelineEvent.count({ where: { propertyId } });
    const current = await prisma.maintenance.findUniqueOrThrow({ where: { id: maintenanceId }, select: { version: true } });
    const first = await maintenancePatch(requestWithCookie(`/api/maintenance/${maintenanceId}`, ownerCookie, { method: "PATCH", headers: { "Idempotency-Key": "s17-retry-update" }, body: JSON.stringify({ version: current.version, maintenance: { notes: "Retry-safe note" } }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(first.status).toBe(200);
    const second = await maintenancePatch(requestWithCookie(`/api/maintenance/${maintenanceId}`, ownerCookie, { method: "PATCH", headers: { "Idempotency-Key": "s17-retry-update" }, body: JSON.stringify({ version: current.version, maintenance: { notes: "Retry-safe note" } }) }), { params: Promise.resolve({ id: maintenanceId }) }); expect(second.status).toBe(200);
    expect(await prisma.maintenanceEvent.count({ where: { maintenanceId } })).toBe(beforeEvents + 1); expect(await prisma.timelineEvent.count({ where: { propertyId } })).toBe(beforeTimeline + 1);
    const ordered = await prisma.maintenanceEvent.findMany({ where: { maintenanceId }, orderBy: { createdAt: "asc" } }); expect(ordered.map((event) => event.createdAt.getTime())).toEqual([...ordered.map((event) => event.createdAt.getTime())].sort((a, b) => a - b));
  });

  it("connects final maintenance cost to one linked S15 invoice payment without double counting", async () => {
    const invoice = await obligationPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Maintenance", label: "Waterproofing invoice", direction: "PAYABLE", amount: "5850", currency: "INR", dueDate: "2026-09-30", timezone: "Asia/Kolkata", recurrenceType: "once", maintenanceId, reminderConfig: { enabled: false, beforeDays: [0], localTime: "09:00", channels: ["IN_APP"] } }) }));
    expect(invoice.status).toBe(201); const obligation = ((await json(invoice)).data as Json).obligation as Json; const occurrence = (obligation.occurrences as Array<Json>)[0];
    const before = await prisma.expenseLedgerEntry.count({ where: { propertyId, obligationId: obligation.id as string } });
    const paid = await paymentPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "5850", currency: "INR", paymentDate: today, method: "synthetic transfer", idempotencyKey: "s17-maintenance-payment", expectedOccurrenceVersion: occurrence.version, receiptDocumentId: registryId, receiptDocumentVersionId: (await prisma.documentVersion.findFirstOrThrow({ where: { documentId: registryId }, select: { id: true } })).id }) }), { params: Promise.resolve({ id: occurrence.id as string }) });
    expect(paid.status).toBe(201); expect(await prisma.expenseLedgerEntry.count({ where: { propertyId, obligationId: obligation.id as string } })).toBe(before + 1); expect(await prisma.expenseLedgerEntry.count({ where: { propertyId, payment: { is: null } } })).toBe(0);
    const userB = await maintenanceItemGet(requestWithCookie(`/api/maintenance/${maintenanceId}`, userBCookie), { params: Promise.resolve({ id: maintenanceId }) }); expect(userB.status).toBe(404);
    const listed = await maintenanceGet(requestWithCookie(`/api/maintenance?propertyId=${propertyId}&view=all`, ownerCookie)); expect(listed.status).toBe(200);
  });
});

describe("S18 identity-bound capability sharing", () => {
  it("requires the invited identity, rejects replay, and exposes only selected capability-filtered data", async () => {
    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    const created = await shareCreate(requestWithCookie(`/api/properties/${propertyId}/shares`, ownerCookie, { method: "POST", body: JSON.stringify({ inviteeEmail: "s16-lawyer@example.com", role: "LAWYER", expiresAt, scopes: [{ capability: "PROPERTY_BASIC_READ" }, { capability: "DOCUMENT_LIST", documentId: registryId }, { capability: "DOCUMENT_METADATA_READ", documentId: registryId }, { capability: "DOCUMENT_PREVIEW", documentId: registryId }, { capability: "TIMELINE_READ" }] }) }), { params: Promise.resolve({ id: propertyId }) });
    expect(created.status).toBe(201); const invitation = ((await json(created)).data as Json); const token = invitation.invitationToken as string; expect(token.length).toBeGreaterThan(40);
    const wrong = await shareAccept(requestWithCookie("/api/share-invitations/accept", familyCookie, { method: "POST", body: JSON.stringify({ token }) })); expect(wrong.status).toBe(403);
    const accepted = await shareAccept(requestWithCookie("/api/share-invitations/accept", lawyerCookie, { method: "POST", body: JSON.stringify({ token }) })); expect(accepted.status).toBe(200); shareId = (((await json(accepted)).data as Json).share as Json).id as string;
    expect((await shareAccept(requestWithCookie("/api/share-invitations/accept", lawyerCookie, { method: "POST", body: JSON.stringify({ token }) }))).status).toBe(409);
    const shared = await sharedPropertiesGet(requestWithCookie("/api/shared/properties", lawyerCookie)); expect(shared.status).toBe(200); expect(((await json(shared)).data as Json).properties).toHaveLength(1);
    const property = await sharedPropertyGet(requestWithCookie(`/api/shared/properties/${propertyId}`, lawyerCookie), { params: Promise.resolve({ id: propertyId }) }); expect(property.status).toBe(200); const propertyBody = (await json(property)).data as Json; expect(propertyBody.bills).toBeUndefined(); expect(propertyBody.maintenance).toBeUndefined(); expect((propertyBody.property as Json).ownerName).toBeUndefined(); expect((propertyBody.documents as Array<Json>)).toHaveLength(1);
    const docs = await sharedDocumentsGet(requestWithCookie(`/api/shared/properties/${propertyId}/documents`, lawyerCookie), { params: Promise.resolve({ id: propertyId }) }); expect(docs.status).toBe(200); expect(((await json(docs)).data as Json).documents).toHaveLength(1);
    expect((await sharedDocumentGet(requestWithCookie(`/api/shared/documents/${registryId}?metadata=true`, lawyerCookie), { params: Promise.resolve({ id: registryId }) })).status).toBe(200);
    expect((await sharedDocumentGet(requestWithCookie(`/api/shared/documents/${hiddenId}?metadata=true`, lawyerCookie), { params: Promise.resolve({ id: hiddenId }) })).status).toBe(404);
    expect((await sharedDocumentGet(requestWithCookie(`/api/documents/${registryId}`, lawyerCookie), { params: Promise.resolve({ id: registryId }) })).status).toBe(200);
    expect((await sharedDocumentGet(requestWithCookie(`/api/documents/${hiddenId}`, lawyerCookie), { params: Promise.resolve({ id: hiddenId }) })).status).toBe(404);
    expect((await sharedHealthGet(requestWithCookie(`/api/shared/health/${propertyId}`, lawyerCookie), { params: Promise.resolve({ id: propertyId }) })).status).toBe(404);
  });

  it("suppresses a queued shared job at the output boundary after immediate revocation and denies direct guesses, expiry, operator, and User B", async () => {
    const operation = await sharedOperationPost(requestWithCookie("/api/shared/operations", lawyerCookie, { method: "POST", body: JSON.stringify({ shareId, propertyId, documentId: registryId }) })); expect(operation.status).toBe(202); operationId = (((await json(operation)).data as Json).operation as Json).id as string;
    const revoke = await shareRevoke(requestWithCookie(`/api/shares/${shareId}`, ownerCookie, { method: "POST" }), { params: Promise.resolve({ id: shareId }) }); expect(revoke.status).toBe(200);
    await runSharedOperationWorkerOnce("s18-revocation-worker");
    const operationRow = await prisma.shareOperation.findUniqueOrThrow({ where: { id: operationId }, select: { status: true, output: true } }); expect(operationRow).toMatchObject({ status: "SUPPRESSED_REVOKED", output: null });
    expect((await sharedPropertiesGet(requestWithCookie("/api/shared/properties", lawyerCookie))).status).toBe(200); expect(((await json(await sharedPropertiesGet(requestWithCookie("/api/shared/properties", lawyerCookie)))).data as Json).properties).toEqual([]);
    expect((await sharedPropertyGet(requestWithCookie(`/api/shared/properties/${propertyId}`, lawyerCookie), { params: Promise.resolve({ id: propertyId }) })).status).toBe(404);
    expect((await sharedDocumentsGet(requestWithCookie(`/api/shared/properties/${propertyId}/documents`, lawyerCookie), { params: Promise.resolve({ id: propertyId }) })).status).toBe(404);
    expect((await sharedDocumentGet(requestWithCookie(`/api/shared/documents/${registryId}?metadata=true`, lawyerCookie), { params: Promise.resolve({ id: registryId }) })).status).toBe(404);
    expect((await sharedDocumentGet(requestWithCookie(`/api/documents/${registryId}`, lawyerCookie), { params: Promise.resolve({ id: registryId }) })).status).toBe(404);
    expect((await sharedPropertyGet(requestWithCookie(`/api/shared/properties/${propertyId}`, userBCookie), { params: Promise.resolve({ id: propertyId }) })).status).toBe(404);
    expect((await sharedDocumentGet(requestWithCookie(`/api/documents/${registryId}`, operatorCookie), { params: Promise.resolve({ id: registryId }) })).status).toBe(404);
    const expired = await shareCreate(requestWithCookie(`/api/properties/${propertyId}/shares`, ownerCookie, { method: "POST", body: JSON.stringify({ inviteeEmail: "s16-family@example.com", role: "FAMILY", expiresAt: new Date(Date.now() + 50).toISOString(), scopes: [{ capability: "PROPERTY_BASIC_READ" }] }) }), { params: Promise.resolve({ id: propertyId }) }); expect(expired.status).toBe(201); const expiredToken = (((await json(expired)).data as Json).invitationToken as string); await new Promise((resolve) => setTimeout(resolve, 100)); expect((await shareAccept(requestWithCookie("/api/share-invitations/accept", familyCookie, { method: "POST", body: JSON.stringify({ token: expiredToken }) }))).status).toBe(410);
    expect((await sharesGet(requestWithCookie(`/api/properties/${propertyId}/shares`, ownerCookie), { params: Promise.resolve({ id: propertyId }) })).status).toBe(200);
  });
});

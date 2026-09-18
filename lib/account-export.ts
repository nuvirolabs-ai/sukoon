import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { createZip } from "@/lib/zip";
import { LocalObjectStorageAdapter, assertProviderConfiguration, type ObjectStoragePort } from "@/lib/providers";
import { S3ObjectStorageAdapter } from "@/lib/s3-object-storage";
import { enqueueJob, runWorkerOnce, type JobRecord } from "@/lib/worker";
import { sha256Hex } from "@/lib/vault-repository";
import { PrivacyRequestError } from "@/lib/privacy-requests";

export const ACCOUNT_EXPORT_SCOPE = "account-owned-records-v1";
export const ACCOUNT_EXPORT_EXCLUSIONS = ["Other owners' records temporarily shared with this account", "Original document bytes (use separately authorized Vault downloads)", "Parsed text, OCR and AI output, prompts and search caches", "Authentication secrets, OTPs, session tokens, invitation tokens and internal storage paths", "Provider delivery payloads and raw failure logs"];
function localOnly() {
  if (process.env.APP_ENV === "staging" && process.env.NODE_ENV === "production" && process.env.SUKOON_RUNTIME_PROFILE === "STAGING") {
    try { assertProviderConfiguration(); return; } catch { throw new PrivacyRequestError("ACCOUNT_EXPORT_HOSTED_POLICY_REQUIRED", 403); }
  }
  if (!["local", "test"].includes(process.env.APP_ENV ?? "") || process.env.NODE_ENV === "production") throw new PrivacyRequestError("ACCOUNT_EXPORT_HOSTED_POLICY_REQUIRED", 403);
}
function storage(): ObjectStoragePort {
  if (process.env.APP_ENV === "staging" && process.env.SUKOON_RUNTIME_PROFILE === "STAGING") {
    return new S3ObjectStorageAdapter({ endpoint: process.env.SUKOON_STORAGE_ENDPOINT!, bucket: process.env.SUKOON_STORAGE_BUCKET!, accessKeyId: process.env.SUKOON_STORAGE_ACCESS_KEY!, secretAccessKey: process.env.SUKOON_STORAGE_SECRET_KEY! });
  }
  return new LocalObjectStorageAdapter(process.env.APP_ENV === "test" ? "test" : "local");
}
function json(value: unknown) { return Buffer.from(JSON.stringify(value, (_key, v) => typeof v === "bigint" ? v.toString() : v, 2)); }
const keyFor = (id: string) => `account-exports/${id}.zip`;

export async function requestAccountExport(userId: string, id: string, input: { confirmed: boolean; scope: string; expiresAt: string }) {
  localOnly();
  const expiresAt = new Date(input.expiresAt);
  if (!input.confirmed || input.scope !== ACCOUNT_EXPORT_SCOPE || !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() < Date.now() + 60000 || expiresAt.getTime() > Date.now() + 7 * 86400000) throw new PrivacyRequestError("EXPORT_SCOPE_AND_EXPIRY_REQUIRED", 400);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "PrivacyRequest" WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE`);
    const request = await tx.privacyRequest.findFirst({ where: { id, userId, kind: "EXPORT_ACCOUNT" } });
    if (!request) throw new PrivacyRequestError("RESOURCE_NOT_FOUND", 404);
    if (["QUEUED", "PROCESSING", "READY"].includes(request.status)) return { id, status: request.status };
    if (request.status !== "AWAITING_POLICY") throw new PrivacyRequestError("EXPORT_REQUEST_NOT_STARTABLE", 409);
    await tx.privacyRequest.update({ where: { id }, data: { status: "QUEUED", exportScope: input.scope, expiresAt, artifactKey: keyFor(id) } });
    await enqueueJob({ aggregateType: "privacy_request", aggregateId: id, eventType: "GENERATE_ACCOUNT_EXPORT", payload: { requestId: id, userId }, idempotencyKey: `account-export:${id}` }, tx);
    return { id, status: "QUEUED" };
  });
}

async function recordsFor(userId: string) {
  return prisma.$transaction(async tx => {
    const account = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, emailVerified: true, createdAt: true, consents: true } });
    const workspace = await tx.workspace.findUnique({ where: { ownerUserId: userId }, select: {
      id: true, name: true, lang: true, createdAt: true, updatedAt: true, properties: true, propertyHistory: true,
      bills: true, maintenance: true, maintenanceEvents: true, maintenanceDocuments: true, timeline: true, tenants: true, bookings: true, listings: true,
      obligations: true, occurrences: true, payments: true, ledgerEntries: true, assessmentSnapshots: true, assessmentItems: true,
      notificationPreferences: true, reminders: true,
      docs: { select: { id: true, propertyId: true, purchaseCandidateId: true, type: true, name: true, displayName: true, version: true, scanStatus: true, processingState: true, reviewStatus: true, archivedAt: true, deletedAt: true } },
      documentVersions: { select: { id: true, documentId: true, version: true, originalFilename: true, mimeType: true, sizeBytes: true, sha256: true, source: true, scanStatus: true, reviewStatus: true, createdAt: true } },
      shares: { select: { id: true, propertyId: true, role: true, inviteeEmail: true, acceptedAt: true, revokedAt: true, expiresAt: true, scopes: true } },
      projects: { include: { stages: true, tasks: true, budgets: true, costs: true, materials: true, prices: true, procurement: true, contacts: true, updates: true, events: true, documents: true } },
      processingControl: true,
      purchaseWorkspaces: { select: { id: true, name: true, createdAt: true, candidates: { select: { id: true, name: true, propertyType: true, location: true, areaValue: true, areaUnit: true, askingPricePaise: true, budgetPaise: true, source: true, notes: true, stage: true, version: true, entries: { select: { id: true, kind: true, body: true, state: true, version: true, createdAt: true, events: { select: { id: true, action: true, note: true, source: true, actorUserId: true, documentVersionId: true, createdAt: true }, orderBy: { createdAt: "asc" } } } } } } } },
    } });
    return { account, workspace };
  }, { isolationLevel: "RepeatableRead", timeout: 15000 });
}

async function activeRequest(id: string, userId: string) {
  const row = await prisma.privacyRequest.findFirst({ where: { id, userId, kind: "EXPORT_ACCOUNT", exportScope: ACCOUNT_EXPORT_SCOPE, user: { id: userId } } });
  if (!row || !["QUEUED", "PROCESSING", "FAILED", "READY"].includes(row.status) || !row.expiresAt || row.expiresAt.getTime() <= Date.now()) throw new PrivacyRequestError("EXPORT_NOT_AVAILABLE", 409);
  return row;
}

export async function processAccountExport(job: JobRecord, objectStorage: ObjectStoragePort = storage(), beforeOutput?: () => Promise<void>) {
  localOnly();
  const payload = job.payload as { requestId?: string; userId?: string };
  if (job.eventType !== "GENERATE_ACCOUNT_EXPORT" || !payload?.requestId || !payload.userId || job.aggregateId !== payload.requestId) throw new Error("ACCOUNT_EXPORT_JOB_INVALID");
  const id = payload.requestId, userId = payload.userId, key = keyFor(id);
  const initial = await prisma.privacyRequest.findFirst({ where: { id, userId } });
  if (!initial || ["CANCELLED", "EXPIRED"].includes(initial.status)) return;
  if (initial.status === "READY") return;
  try {
    await activeRequest(id, userId);
    const claimed = await prisma.privacyRequest.updateMany({ where: { id, status: { in: ["QUEUED", "PROCESSING", "FAILED"] } }, data: { status: "PROCESSING", failureCode: null } });
    if (!claimed.count) return;
    const records = json(await recordsFor(userId));
    if (records.byteLength > 10 * 1024 * 1024) throw new Error("ACCOUNT_EXPORT_SIZE_LIMIT");
    const manifest = json({ scope: ACCOUNT_EXPORT_SCOPE, generatedAt: new Date().toISOString(), requestId: id, provenance: "Snapshot of account-owned stored records; owner assertions are not verified facts", monetaryIntegers: "paise as decimal strings", exclusions: ACCOUNT_EXPORT_EXCLUSIONS, recordsSha256: sha256Hex(records) });
    const bytes = createZip([{ name: "manifest.json", bytes: manifest }, { name: "account-records.json", bytes: records }]);
    if (beforeOutput) await beforeOutput();
    await activeRequest(id, userId);
    const stored = await objectStorage.put({ storageKey: key, bytes, contentType: "application/zip" });
    if (stored.outcome !== "available") throw new Error("ACCOUNT_EXPORT_STORAGE_UNAVAILABLE");
    const changed = await prisma.privacyRequest.updateMany({ where: { id, userId, status: "PROCESSING", expiresAt: { gt: new Date() } }, data: { status: "READY", artifactKey: key, artifactSha256: sha256Hex(bytes), completedAt: new Date(), failureCode: null } });
    if (!changed.count) { await objectStorage.delete(key); return; }
  } catch (error) {
    await objectStorage.delete(key);
    await prisma.privacyRequest.updateMany({ where: { id, status: { in: ["QUEUED", "PROCESSING", "FAILED"] } }, data: { status: "FAILED", failureCode: "ACCOUNT_EXPORT_GENERATION_FAILED" } });
    throw error;
  }
}
export async function runAccountExportOnce(workerId: string, objectStorage: ObjectStoragePort = storage()) {
  await cleanupAccountExports(objectStorage);
  return runWorkerOnce(workerId, job => processAccountExport(job, objectStorage), { eventTypes: ["GENERATE_ACCOUNT_EXPORT"] });
}
export async function downloadAccountExport(userId: string, id: string, objectStorage: ObjectStoragePort = storage()) {
  localOnly();
  const row = await prisma.privacyRequest.findFirst({ where: { id, userId, status: "READY", expiresAt: { gt: new Date() }, exportScope: ACCOUNT_EXPORT_SCOPE } });
  if (!row || row.artifactKey !== keyFor(id)) throw new PrivacyRequestError("RESOURCE_NOT_FOUND", 404);
  const result = await objectStorage.get(row.artifactKey);
  if (result.outcome !== "available" || sha256Hex(result.value.bytes) !== row.artifactSha256) throw new PrivacyRequestError("EXPORT_INTEGRITY_UNAVAILABLE", 503);
  const current = await activeRequest(id, userId);
  if (current.status !== "READY") throw new PrivacyRequestError("RESOURCE_NOT_FOUND", 404);
  return result.value.bytes;
}
export async function cleanupAccountExports(objectStorage: ObjectStoragePort = storage()) {
  await prisma.privacyRequest.updateMany({ where: { kind: "EXPORT_ACCOUNT", exportScope: ACCOUNT_EXPORT_SCOPE, expiresAt: { lte: new Date() }, status: { in: ["QUEUED", "PROCESSING", "READY", "FAILED"] } }, data: { status: "EXPIRED" } });
  const rows = await prisma.privacyRequest.findMany({ where: { exportScope: ACCOUNT_EXPORT_SCOPE, status: { in: ["CANCELLED", "EXPIRED"] }, artifactKey: { not: null } }, take: 100 });
  for (const row of rows) {
    if (row.artifactKey !== keyFor(row.id)) continue;
    const deleted = await objectStorage.delete(row.artifactKey);
    if (deleted.outcome === "available") await prisma.privacyRequest.update({ where: { id: row.id }, data: { artifactKey: null, artifactSha256: null } });
  }
}

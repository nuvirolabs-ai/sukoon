import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getWorkspaceForUser } from "@/lib/repository";
import { LocalObjectStorageAdapter, type ObjectStoragePort } from "@/lib/providers";
import { sha256Hex } from "@/lib/vault-repository";
import { authorizeSharedDocument, authorizeSharedProperty, shareScopeAllows } from "@/lib/authz";
import { createZip } from "@/lib/zip";
import { enqueueJob, runWorkerOnce, type JobRecord } from "@/lib/worker";

export const EXPORT_STATUSES = ["QUEUED", "GENERATING", "READY", "FAILED", "EXPIRED", "REVOKED"] as const;
type ExportStatus = (typeof EXPORT_STATUSES)[number];
const MAX_ITEMS = 50;
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;
const MAX_EXPIRY_MS = 7 * DEFAULT_EXPIRY_MS;

export class ExportInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) { super(message); this.name = "ExportInputError"; this.code = code; this.status = status; }
}

type SelectionInput = { propertyId?: unknown; documentIds?: unknown; documentVersionIds?: unknown; includePropertyMetadata?: unknown; expiresAt?: unknown; idempotencyKey?: unknown };
type CleanSelection = { propertyId: string; documentIds: string[]; documentVersionIds: string[]; includePropertyMetadata: boolean; expiresAt: Date; idempotencyKey: string };
type SelectedItem = { documentId: string; documentVersionId: string; sourceType: string; name: string; originalFilename: string; mimeType: string; sizeBytes: number; sha256: string; storageKey: string; version: number; type: string };

function asJson(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item)) as Prisma.InputJsonValue; }
function text(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new ExportInputError("EXPORT_INPUT_INVALID", `${label} is invalid.`);
  return value.trim();
}
function cleanSelection(input: unknown): CleanSelection {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ExportInputError("EXPORT_INPUT_INVALID", "An export selection is required.");
  const raw = input as SelectionInput;
  const propertyId = text(raw.propertyId, "Property", 100);
  if (!Array.isArray(raw.documentIds) || raw.documentIds.length < 1 || raw.documentIds.length > MAX_ITEMS || raw.documentIds.some((id) => typeof id !== "string" || !id.trim())) throw new ExportInputError("EXPORT_SELECTION_INVALID", `Select between one and ${MAX_ITEMS} documents.`);
  const documentIds = [...new Set((raw.documentIds as string[]).map((id) => id.trim()))];
  const documentVersionIds = Array.isArray(raw.documentVersionIds) ? raw.documentVersionIds.map((id) => text(id, "Document version", 100)) : [];
  if (documentVersionIds.length && documentVersionIds.length !== documentIds.length) throw new ExportInputError("EXPORT_SELECTION_INVALID", "Document version selection must match the document selection.");
  const includePropertyMetadata = raw.includePropertyMetadata === true;
  const expiresAt = raw.expiresAt === undefined ? new Date(Date.now() + DEFAULT_EXPIRY_MS) : new Date(text(raw.expiresAt, "Expiry", 80));
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now() || expiresAt.getTime() > Date.now() + MAX_EXPIRY_MS) throw new ExportInputError("EXPORT_EXPIRY_INVALID", "Expiry must be a future time within seven days.");
  const idempotencyKey = text(raw.idempotencyKey, "Idempotency key", 160);
  return { propertyId, documentIds, documentVersionIds, includePropertyMetadata, expiresAt, idempotencyKey };
}

function selectionHash(input: { propertyId: string; documentIds: string[]; documentVersionIds: string[]; includePropertyMetadata: boolean }) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function safeFilename(value: string, fallback: string) {
  const base = value.replaceAll("\\", "/").split("/").pop()?.replace(/[\u0000-\u001f\u007f]/g, "_").trim() || fallback;
  return base.slice(0, 150).replace(/[^a-zA-Z0-9._() -]/g, "_") || fallback;
}

function sourceType(value: string) {
  if (value === "fixture_ai") return "document_extracted_fixture";
  if (value === "document_extracted") return "document_extracted";
  if (value === "user_replaced") return "owner_replaced_document";
  return "owner_uploaded_document";
}

async function authorizeSelection(userId: string, input: { propertyId: string; documentIds: string[]; documentVersionIds: string[] }) {
  const ownerWorkspace = await getWorkspaceForUser(userId);
  let workspaceId: string;
  let requesterMode: "owner" | "delegate";
  if (ownerWorkspace) {
    const property = await prisma.property.findFirst({ where: { id: input.propertyId, workspaceId: ownerWorkspace.id, status: "active" }, select: { id: true, workspaceId: true, name: true, type: true, city: true, area: true, address: true } });
    if (!property) throw new ExportInputError("EXPORT_NOT_FOUND", "Export selection not found.", 404);
    workspaceId = property.workspaceId; requesterMode = "owner";
  } else {
    const access = await authorizeSharedProperty(userId, input.propertyId, "PROPERTY_BASIC_READ");
    if (!access) throw new ExportInputError("EXPORT_NOT_FOUND", "Export selection not found.", 404);
    workspaceId = access.grant.workspaceId; requesterMode = "delegate";
  }
  const documents = await prisma.propertyDoc.findMany({ where: { id: { in: input.documentIds }, workspaceId, propertyId: input.propertyId, archivedAt: null, deletedAt: null, scanStatus: "clean" }, include: { versions: { where: { scanStatus: "clean" }, orderBy: { version: "desc" } } } });
  if (documents.length !== input.documentIds.length) throw new ExportInputError("EXPORT_NOT_FOUND", "Export selection not found.", 404);
  const selected: SelectedItem[] = [];
  for (const documentId of input.documentIds) {
    const document = documents.find((candidate) => candidate.id === documentId);
    if (!document) throw new ExportInputError("EXPORT_NOT_FOUND", "Export selection not found.", 404);
    if (requesterMode === "delegate") {
      const access = await authorizeSharedDocument(userId, document.id, "DOCUMENT_PREVIEW");
      if (!access || access.grant.workspaceId !== workspaceId || !shareScopeAllows(access.grant, "DOCUMENT_EXPORT", document)) throw new ExportInputError("EXPORT_NOT_FOUND", "Export selection not found.", 404);
    }
    const requestedVersion = input.documentVersionIds[input.documentIds.indexOf(document.id)];
    const version = (requestedVersion ? document.versions.find((candidate) => candidate.id === requestedVersion) : document.versions[0]);
    if (!version || version.scanStatus !== "clean") throw new ExportInputError("EXPORT_NOT_FOUND", "Export selection not found.", 404);
    if (requesterMode === "delegate") {
      const access = await authorizeSharedDocument(userId, document.id, "DOCUMENT_PREVIEW");
      if (!access || !shareScopeAllows(access.grant, "DOCUMENT_EXPORT", { id: document.id, type: document.type })) throw new ExportInputError("EXPORT_NOT_FOUND", "Export selection not found.", 404);
    }
    selected.push({ documentId: document.id, documentVersionId: version.id, sourceType: sourceType(version.source), name: document.displayName || document.name, originalFilename: version.originalFilename, mimeType: version.mimeType, sizeBytes: version.sizeBytes, sha256: version.sha256, storageKey: version.storageKey, version: version.version, type: document.type });
  }
  return { workspaceId, requesterMode, property: await prisma.property.findFirstOrThrow({ where: { id: input.propertyId, workspaceId }, select: { id: true, name: true, type: true, city: true, area: true, address: true } }), selected };
}

function previewDto(context: Awaited<ReturnType<typeof authorizeSelection>>, includePropertyMetadata: boolean) {
  return { property: includePropertyMetadata ? context.property : { id: context.property.id, name: context.property.name }, items: context.selected.map((item) => ({ documentId: item.documentId, documentVersionId: item.documentVersionId, name: item.name, originalFilename: item.originalFilename, type: item.type, version: item.version, sourceType: item.sourceType, sizeBytes: item.sizeBytes, sha256: item.sha256 })), requesterMode: context.requesterMode, source: "authorized_property_records" };
}

export async function previewExportSelectionForUser(userId: string, raw: unknown) {
  const input = cleanSelection({ ...(raw as object), idempotencyKey: "preview-only" });
  const context = await authorizeSelection(userId, input);
  return { ...previewDto(context, input.includePropertyMetadata), expiresAt: input.expiresAt.toISOString() };
}

export async function createExportPackageForUser(userId: string, raw: unknown) {
  const input = cleanSelection(raw);
  const context = await authorizeSelection(userId, input);
  const hash = selectionHash({ propertyId: input.propertyId, documentIds: input.documentIds, documentVersionIds: context.selected.map((item) => item.documentVersionId), includePropertyMetadata: input.includePropertyMetadata });
  const idempotencyKey = `export:${userId}:${input.idempotencyKey}`;
  const existing = await prisma.exportPackage.findUnique({ where: { idempotencyKey }, include: { items: true } });
  if (existing) {
    if (existing.selectionHash !== hash || existing.propertyId !== input.propertyId) throw new ExportInputError("IDEMPOTENCY_CONFLICT", "This export key was already used for a different selection.", 409);
    return { id: existing.id, status: existing.status, expiresAt: existing.expiresAt.toISOString(), preview: previewDto(context, existing.includePropertyMetadata), duplicate: true };
  }
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.exportPackage.create({ data: { id: randomUUID(), workspaceId: context.workspaceId, propertyId: input.propertyId, requestedByUserId: userId, status: "QUEUED", includePropertyMetadata: input.includePropertyMetadata, selectionHash: hash, expiresAt: input.expiresAt, idempotencyKey } });
    await tx.exportPackageItem.createMany({ data: context.selected.map((item) => ({ id: randomUUID(), workspaceId: context.workspaceId, packageId: created.id, propertyId: input.propertyId, documentId: item.documentId, documentVersionId: item.documentVersionId, sourceType: item.sourceType })) });
    return created;
  });
  await enqueueJob({ aggregateType: "export_package", aggregateId: row.id, eventType: "GENERATE_EXPORT", payload: { packageId: row.id, workspaceId: context.workspaceId }, idempotencyKey: `export-job:${row.id}`, correlationId: row.id, maxAttempts: 3 });
  return { id: row.id, status: row.status, expiresAt: row.expiresAt.toISOString(), preview: previewDto(context, row.includePropertyMetadata), duplicate: false };
}

async function packageContext(userId: string, packageId: string) {
  const row = await prisma.exportPackage.findUnique({ where: { id: packageId }, include: { items: { orderBy: { createdAt: "asc" } } } });
  if (!row) throw new ExportInputError("EXPORT_NOT_FOUND", "Export package not found.", 404);
  const context = await authorizeSelection(userId, { propertyId: row.propertyId, documentIds: row.items.map((item) => item.documentId), documentVersionIds: row.items.map((item) => item.documentVersionId) });
  return { row, context };
}

export async function getExportPackageForUser(userId: string, packageId: string) {
  await expireAndCleanupExportPackages();
  try {
    const { row, context } = await packageContext(userId, packageId);
    return { id: row.id, status: row.status as ExportStatus, expiresAt: row.expiresAt.toISOString(), generatedAt: row.generatedAt?.toISOString() ?? null, failureReason: row.failureReason, manifest: row.manifest, preview: previewDto(context, row.includePropertyMetadata) };
  } catch (error) {
    if (error instanceof ExportInputError && error.status === 404) throw error;
    throw new ExportInputError("EXPORT_NOT_FOUND", "Export package not found.", 404);
  }
}

export async function listExportPackagesForUser(userId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return [];
  await expireAndCleanupExportPackages();
  return prisma.exportPackage.findMany({ where: { workspaceId: workspace.id, requestedByUserId: userId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, propertyId: true, status: true, expiresAt: true, generatedAt: true, failureReason: true } }).then((rows) => rows.map((row) => ({ ...row, expiresAt: row.expiresAt.toISOString(), generatedAt: row.generatedAt?.toISOString() ?? null })));
}

function manifestFor(context: Awaited<ReturnType<typeof authorizeSelection>>, includePropertyMetadata: boolean, generatedAt: string) {
  return { schemaVersion: 1, generatedAt, source: "authorized_property_records", property: includePropertyMetadata ? context.property : { id: context.property.id, name: context.property.name }, records: context.selected.map((item) => ({ documentId: item.documentId, documentVersionId: item.documentVersionId, filename: safeFilename(item.originalFilename, `document-${item.documentId}.bin`), title: item.name, type: item.type, version: item.version, sourceType: item.sourceType, mimeType: item.mimeType, sizeBytes: item.sizeBytes, sha256: item.sha256 })) };
}

export async function dispatchExportJob(job: JobRecord, options?: { storage?: ObjectStoragePort; beforeOutputBoundary?: () => Promise<void> }) {
  if (!job.payload || typeof job.payload !== "object") throw new Error("EXPORT_JOB_PAYLOAD_INVALID");
  const packageId = (job.payload as Record<string, unknown>).packageId;
  if (typeof packageId !== "string") throw new Error("EXPORT_JOB_PAYLOAD_INVALID");
  const row = await prisma.exportPackage.findUnique({ where: { id: packageId }, include: { items: true } });
  if (!row || ["READY", "EXPIRED", "REVOKED"].includes(row.status) || row.expiresAt.getTime() <= Date.now()) return;
  await prisma.exportPackage.update({ where: { id: row.id }, data: { status: "GENERATING", failureReason: null } });
  try {
    const context = await authorizeSelection(row.requestedByUserId, { propertyId: row.propertyId, documentIds: row.items.map((item) => item.documentId), documentVersionIds: row.items.map((item) => item.documentVersionId) });
    const storage = options?.storage ?? new LocalObjectStorageAdapter(process.env.NODE_ENV === "test" ? "test" : "local");
    const generatedAt = new Date().toISOString();
    const manifest = manifestFor(context, row.includePropertyMetadata, generatedAt);
    const entries: Array<{ name: string; bytes: Uint8Array }> = [{ name: "manifest.json", bytes: Buffer.from(JSON.stringify(manifest, null, 2), "utf8") }];
    for (const item of context.selected) {
      const stored = await storage.get(item.storageKey);
      if (stored.outcome !== "available" || sha256Hex(stored.value.bytes) !== item.sha256) throw new ExportInputError("EXPORT_SOURCE_INTEGRITY", "A selected document failed its integrity check.", 503);
      const filename = (manifest.records.find((record) => record.documentId === item.documentId)?.filename) ?? `document-${item.documentId}.bin`;
      entries.push({ name: `documents/${item.documentId}-${filename}`, bytes: stored.value.bytes });
    }
    const artifact = createZip(entries);
    if (options?.beforeOutputBoundary) await options.beforeOutputBoundary();
    const latest = await authorizeSelection(row.requestedByUserId, { propertyId: row.propertyId, documentIds: row.items.map((item) => item.documentId), documentVersionIds: row.items.map((item) => item.documentVersionId) }).catch(() => null);
    if (!latest || row.expiresAt.getTime() <= Date.now()) {
      await prisma.exportPackage.update({ where: { id: row.id }, data: { status: "REVOKED", revokedAt: new Date(), failureReason: "Grant or source access was revoked before export output." } });
      return;
    }
    const key = `exports/${row.workspaceId}/${row.id}.zip`;
    const stored = await storage.put({ storageKey: key, bytes: artifact, contentType: "application/zip" });
    if (stored.outcome !== "available") throw new ExportInputError("EXPORT_STORAGE_UNAVAILABLE", "Export storage is unavailable.", 503);
    const afterPut = await authorizeSelection(row.requestedByUserId, { propertyId: row.propertyId, documentIds: row.items.map((item) => item.documentId), documentVersionIds: row.items.map((item) => item.documentVersionId) }).catch(() => null);
    if (!afterPut || row.expiresAt.getTime() <= Date.now()) {
      await storage.delete(key);
      await prisma.exportPackage.update({ where: { id: row.id }, data: { status: "REVOKED", revokedAt: new Date(), failureReason: "Grant or source access was revoked after export storage." } });
      return;
    }
    await prisma.exportPackage.update({ where: { id: row.id }, data: { status: "READY", artifactStorageKey: key, artifactSha256: sha256Hex(artifact), artifactSizeBytes: artifact.byteLength, generatedAt: new Date(generatedAt), manifest: asJson(manifest), failureReason: null } });
  } catch (error: unknown) {
    if (error instanceof ExportInputError && error.code === "EXPORT_NOT_FOUND") {
      await prisma.exportPackage.update({ where: { id: row.id }, data: { status: "REVOKED", revokedAt: new Date(), failureReason: "Grant or source access was revoked before export output." } });
      return;
    }
    await prisma.exportPackage.update({ where: { id: row.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 240) : "Export generation failed." } });
    throw error;
  }
}

export async function runExportWorkerOnce(workerId: string, options?: { storage?: ObjectStoragePort; beforeOutputBoundary?: () => Promise<void> }) {
  return runWorkerOnce(workerId, (job) => job.eventType === "GENERATE_EXPORT" ? dispatchExportJob(job, options) : Promise.reject(new Error("EXPORT_JOB_EVENT_UNSUPPORTED")), { eventTypes: ["GENERATE_EXPORT"] });
}

export async function downloadExportForUser(userId: string, packageId: string) {
  await expireAndCleanupExportPackages();
  const row = await prisma.exportPackage.findUnique({ where: { id: packageId } });
  if (!row) throw new ExportInputError("EXPORT_NOT_FOUND", "Export package not found.", 404);
  try { await authorizeSelection(userId, { propertyId: row.propertyId, documentIds: (await prisma.exportPackageItem.findMany({ where: { packageId: row.id }, orderBy: { createdAt: "asc" }, select: { documentId: true, documentVersionId: true } })).map((item) => item.documentId), documentVersionIds: (await prisma.exportPackageItem.findMany({ where: { packageId: row.id }, orderBy: { createdAt: "asc" }, select: { documentId: true, documentVersionId: true } })).map((item) => item.documentVersionId) }); }
  catch (error) {
    const storage = new LocalObjectStorageAdapter(process.env.NODE_ENV === "test" ? "test" : "local");
    if (row.artifactStorageKey) await storage.delete(row.artifactStorageKey);
    await prisma.exportPackage.update({ where: { id: row.id }, data: { status: "REVOKED", revokedAt: new Date(), artifactStorageKey: null, failureReason: "Access was revoked before download." } });
    if (error instanceof ExportInputError) throw new ExportInputError("EXPORT_NOT_FOUND", "Export package not found.", 404);
    throw error;
  }
  if (row.status !== "READY" || !row.artifactStorageKey || !row.artifactSha256) throw new ExportInputError("EXPORT_NOT_READY", "This export is not ready for download.", 409);
  const storage = new LocalObjectStorageAdapter(process.env.NODE_ENV === "test" ? "test" : "local");
  const stored = await storage.get(row.artifactStorageKey);
  if (stored.outcome !== "available" || sha256Hex(stored.value.bytes) !== row.artifactSha256) throw new ExportInputError("EXPORT_ARTIFACT_INVALID", "The export artifact failed its integrity check.", 503);
  return { bytes: stored.value.bytes, filename: `sukoon-export-${row.propertyId}-${row.id}.zip`, sha256: row.artifactSha256 };
}

export async function expireAndCleanupExportPackages(now = new Date()) {
  const rows = await prisma.exportPackage.findMany({ where: { OR: [{ status: { in: ["QUEUED", "GENERATING", "READY"] }, expiresAt: { lte: now } }, { status: "REVOKED", artifactStorageKey: { not: null } }] }, select: { id: true, status: true, artifactStorageKey: true } });
  const storage = new LocalObjectStorageAdapter(process.env.NODE_ENV === "test" ? "test" : "local");
  for (const row of rows) {
    if (row.artifactStorageKey) await storage.delete(row.artifactStorageKey);
    await prisma.exportPackage.update({ where: { id: row.id }, data: { status: row.status === "REVOKED" ? "REVOKED" : "EXPIRED", artifactStorageKey: null } });
  }
  return rows.length;
}

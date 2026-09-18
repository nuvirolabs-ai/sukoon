import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { getWorkspaceForUser } from "@/lib/repository";
import { LocalObjectStorageAdapter, type ObjectStoragePort } from "@/lib/providers";
import { prisma } from "@/lib/prisma";
import { authorizeVaultContext } from "@/lib/authz";
import type { DocumentProcessingState, DocumentReviewStatus, DocumentScanStatus, DocumentSource, DocumentVersionSummary, DocType } from "@/lib/types";

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const SUPPORTED_DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const DOCUMENT_CATEGORIES: DocType[] = ["Registry", "Chain documents", "Link papers", "NOC", "Naamantaran (mutation)", "Property info", "Measurement", "Sanction map", "Tax receipt", "Loan agreement", "Insurance", "EC", "Identity", "Address proof", "Receipt", "Other"];

type SupportedMimeType = (typeof SUPPORTED_DOCUMENT_MIME_TYPES)[number];
type PropertyDocWithVersions = Prisma.PropertyDocGetPayload<{ include: { versions: true } }>;

export class VaultInputError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "VaultInputError";
    this.code = code;
    this.status = status;
  }
}

export class VaultStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultStorageError";
  }
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? nested.toString() : nested)) as Prisma.InputJsonValue;
}

function cleanFilename(filename: string) {
  const basename = filename.replaceAll("\\", "/").split("/").pop() || "document";
  return basename.replace(/[\u0000-\u001f\u007f]/g, "_").trim().slice(0, 180) || "document";
}

function normalizedDisplayName(displayName: string | undefined, originalFilename: string) {
  return (displayName?.replace(/[\u0000-\u001f\u007f]/g, "_").trim() || originalFilename).slice(0, 180);
}

function expectedExtensions(mimeType: SupportedMimeType) {
  if (mimeType === "application/pdf") return ["pdf"];
  if (mimeType === "image/png") return ["png"];
  return ["jpg", "jpeg"];
}

function hasExpectedExtension(filename: string, mimeType: SupportedMimeType) {
  const extension = cleanFilename(filename).split(".").pop()?.toLowerCase();
  return Boolean(extension && expectedExtensions(mimeType).includes(extension));
}

function matchesSignature(bytes: Uint8Array, mimeType: SupportedMimeType) {
  if (mimeType === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (mimeType === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function sha256Hex(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** T02 import lineage validation. All source fields travel together or none do. */
export function sourceLineage(input: { provenance?: string; sourceDocumentId?: string; sourceVersionId?: string; sourceSha256?: string; sourceCandidateId?: string }) {
  const { provenance, sourceDocumentId, sourceVersionId, sourceSha256, sourceCandidateId } = input;
  const present = [provenance, sourceDocumentId, sourceVersionId, sourceSha256, sourceCandidateId].filter(v => v !== undefined);
  if (!present.length) return null;
  if (present.length !== 5) throw new VaultInputError("IMPORT_LINEAGE_INCOMPLETE", "Import lineage requires provenance and all source references together.");
  if (provenance !== "purchase_import") throw new VaultInputError("IMPORT_LINEAGE_INVALID", "Unsupported import provenance.");
  for (const [label, value] of [["source document", sourceDocumentId], ["source version", sourceVersionId], ["source candidate", sourceCandidateId]] as const) {
    if (!value || value.length > 100) throw new VaultInputError("IMPORT_LINEAGE_INVALID", `Invalid ${label} reference.`);
  }
  if (!sourceSha256 || !/^[a-f0-9]{64}$/.test(sourceSha256)) throw new VaultInputError("IMPORT_LINEAGE_INVALID", "Invalid source content hash.");
  return { provenance, sourceDocumentId: sourceDocumentId!, sourceVersionId: sourceVersionId!, sourceSha256, sourceCandidateId: sourceCandidateId! };
}

export function validateDocumentUpload(input: { filename: string; mimeType: string; bytes: Uint8Array }) {
  if (!SUPPORTED_DOCUMENT_MIME_TYPES.includes(input.mimeType as SupportedMimeType)) throw new VaultInputError("FILE_TYPE_NOT_ALLOWED", "Only PDF, JPEG, and PNG files are supported.");
  const mimeType = input.mimeType as SupportedMimeType;
  if (input.filename.includes("/") || input.filename.includes("\\")) throw new VaultInputError("FILENAME_NOT_ALLOWED", "The filename must not contain a path.");
  if (input.bytes.byteLength <= 0 || input.bytes.byteLength > MAX_DOCUMENT_BYTES) throw new VaultInputError("FILE_SIZE_NOT_ALLOWED", "Files must be between 1 byte and 25 MB.");
  if (!hasExpectedExtension(input.filename, mimeType)) throw new VaultInputError("FILE_EXTENSION_MISMATCH", "The filename extension does not match the declared file type.");
  if (!matchesSignature(input.bytes, mimeType)) throw new VaultInputError("FILE_SIGNATURE_INVALID", "The file content does not match its declared type.");
  return { mimeType, originalFilename: cleanFilename(input.filename), displayName: normalizedDisplayName(undefined, cleanFilename(input.filename)), sha256: sha256Hex(input.bytes), sizeBytes: input.bytes.byteLength, extension: mimeType === "application/pdf" ? "pdf" : mimeType === "image/png" ? "png" : "jpg" };
}

function mapVersion(row: PropertyDocWithVersions["versions"][number]): DocumentVersionSummary {
  return {
    id: row.id,
    version: row.version,
    originalFilename: row.originalFilename,
    displayName: row.displayName,
    mimeType: row.mimeType as SupportedMimeType,
    sizeBytes: row.sizeBytes,
    sha256: row.sha256,
    scanStatus: row.scanStatus as DocumentScanStatus,
    processingState: row.processingState as DocumentProcessingState,
    reviewStatus: row.reviewStatus as DocumentReviewStatus,
    source: row.source as DocumentSource,
    uploadedBy: row.uploadedBy,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}

export function mapVaultDocument(row: PropertyDocWithVersions) {
  return {
    id: row.id,
    propertyId: row.propertyId,
    purchaseCandidateId: row.purchaseCandidateId,
    type: row.type as DocType,
    name: row.displayName || row.name,
    originalFilename: row.originalFilename || row.name,
    displayName: row.displayName || row.name,
    subtype: row.subtype ?? undefined,
    uploadDate: row.uploadDate,
    uploadedBy: row.uploadedBy ?? undefined,
    uploadedAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sizeKb: Math.ceil(row.sizeBytes / 1024),
    sizeBytes: row.sizeBytes,
    sha256: row.sha256 || undefined,
    storageKey: row.storageKey,
    mimeType: row.mimeType as SupportedMimeType,
    processingState: row.processingState as DocumentProcessingState,
    scanStatus: row.scanStatus as DocumentScanStatus,
    reviewStatus: row.reviewStatus as DocumentReviewStatus,
    provenance: row.provenance as DocumentSource,
    sourceDocumentId: row.sourceDocumentId ?? undefined,
    sourceVersionId: row.sourceVersionId ?? undefined,
    sourceSha256: row.sourceSha256 || undefined,
    sourceCandidateId: row.sourceCandidateId ?? undefined,
    archivedAt: row.archivedAt?.toISOString(),
    deletedAt: row.deletedAt?.toISOString(),
    version: row.version,
    versions: row.versions.sort((a, b) => a.version - b.version).map(mapVersion),
    verified: row.verified,
    notes: row.notes ?? undefined,
    extracted: row.extracted && typeof row.extracted === "object" ? row.extracted as Record<string, string> : undefined,
  };
}

function localObjectStorage(): ObjectStoragePort {
  return new LocalObjectStorageAdapter(process.env.NODE_ENV === "test" ? "test" : "local");
}

export async function recordVaultHistory(tx: Prisma.TransactionClient, context: { workspaceId: string; propertyId: string | null; purchaseCandidateId: string | null }, event: { date: string; title: string; detail: string; kind: string }) {
  if (context.propertyId) return tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: context.workspaceId, propertyId: context.propertyId, ...event } });
  if (!context.purchaseCandidateId) throw new VaultInputError("INVALID_CONTEXT", "Document context required.");
  return tx.purchaseEntry.create({ data: { id: randomUUID(), workspaceId: context.workspaceId, candidateId: context.purchaseCandidateId, kind: "HISTORY", body: JSON.stringify(event), requestKey: randomUUID() } });
}

async function ownerWorkspace(userId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document not found.", 404);
  return prisma.workspace.findUniqueOrThrow({ where: { id: workspace.id }, select: { id: true, version: true } });
}

async function ownedActiveProperty(userId: string, propertyId: string) {
  const workspace = await ownerWorkspace(userId);
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" }, select: { id: true } });
  if (!property) throw new VaultInputError("RESOURCE_NOT_FOUND", "Property not found.", 404);
  return workspace;
}

async function findDocumentForUser(userId: string, documentId: string, includeArchived = false) {
  const workspace = await ownerWorkspace(userId);
  const row = await prisma.propertyDoc.findFirst({
    where: { id: documentId, workspaceId: workspace.id, ...(includeArchived ? {} : { archivedAt: null, deletedAt: null }) },
    include: { versions: { orderBy: { version: "asc" } } },
  });
  if (!row) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document not found.", 404);
  const property = await authorizeVaultContext({ userId, workspaceId: workspace.id, role: "owner", email: "" }, row);
  if (!property) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document not found.", 404);
  return { workspace, row };
}

export async function getDocumentForUser(userId: string, documentId: string, includeArchived = false) {
  return findDocumentForUser(userId, documentId, includeArchived);
}

function scanJobData(input: { documentId: string; documentVersionId: string; workspaceId: string; propertyId: string | null; purchaseCandidateId?: string | null }) {
  return { ...input };
}

async function createScanJob(tx: Prisma.TransactionClient, input: { documentId: string; documentVersionId: string; workspaceId: string; propertyId: string | null; purchaseCandidateId?: string | null }) {
  const idempotencyKey = `document-scan:${input.documentVersionId}`;
  await tx.outboxEvent.create({
    data: {
      id: randomUUID(),
      aggregateType: "property_document",
      aggregateId: input.documentId,
      eventType: "SCAN_DOCUMENT",
      payload: jsonValue(scanJobData(input)),
      idempotencyKey,
      correlationId: input.documentId,
      maxAttempts: 3,
      status: "queued",
    },
  });
}

export async function createDocumentForUser(input: {
  userId: string;
  propertyId?: string | null;
  purchaseCandidateId?: string | null;
  category: string;
  subtype?: string;
  displayName?: string;
  idempotencyKey: string;
  replaceDocumentId?: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  storage?: ObjectStoragePort;
  /** T02 import lineage. All-or-nothing: provide every source field or none. */
  provenance?: string;
  sourceDocumentId?: string;
  sourceVersionId?: string;
  sourceSha256?: string;
  sourceCandidateId?: string;
}) {
  if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 160) throw new VaultInputError("IDEMPOTENCY_KEY_REQUIRED", "A bounded Idempotency-Key header is required.");
  if (!DOCUMENT_CATEGORIES.includes(input.category as DocType)) throw new VaultInputError("INVALID_DOCUMENT_TYPE", "Choose a supported document category.");
  const propertyId = input.propertyId || null, purchaseCandidateId = input.purchaseCandidateId || null;
  const workspace = await ownerWorkspace(input.userId);
  if (!await authorizeVaultContext({ userId: input.userId, workspaceId: workspace.id, role: "owner", email: "" }, { propertyId, purchaseCandidateId })) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document context not found.", 404);
  const checked = validateDocumentUpload({ filename: input.filename, mimeType: input.mimeType, bytes: input.bytes });
  const lineage = sourceLineage(input);
  const existing = await prisma.propertyDoc.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { versions: { orderBy: { version: "asc" } } } });
  if (existing) {
    if (existing.workspaceId !== workspace.id || existing.propertyId !== propertyId || existing.purchaseCandidateId !== purchaseCandidateId || existing.sha256 !== checked.sha256) throw new VaultInputError("IDEMPOTENCY_CONFLICT", "This upload key was already used for a different document.", 409);
    return { document: mapVaultDocument(existing), duplicate: true, version: workspace.version };
  }

  const storage = input.storage ?? localObjectStorage();
  const documentId = input.replaceDocumentId ?? randomUUID().replaceAll("-", "");
  const versionId = randomUUID().replaceAll("-", "");
  const storageKey = `${input.userId}/${propertyId ?? purchaseCandidateId}/${documentId}/${versionId}.${checked.extension}`;
  const stored = await storage.put({ storageKey, bytes: input.bytes, contentType: checked.mimeType });
  if (stored.outcome === "unavailable") throw new VaultStorageError("Private object storage is unavailable.");
  const displayName = normalizedDisplayName(input.displayName, checked.originalFilename);
  const now = new Date();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const raced = await tx.propertyDoc.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { versions: { orderBy: { version: "asc" } } } });
      if (raced) {
        if (raced.workspaceId !== workspace.id || raced.propertyId !== propertyId || raced.purchaseCandidateId !== purchaseCandidateId || raced.sha256 !== checked.sha256) throw new VaultInputError("IDEMPOTENCY_CONFLICT", "This upload key was already used for a different document.", 409);
        return { row: raced, duplicate: true };
      }

      const parent = input.replaceDocumentId ? await tx.propertyDoc.findFirst({ where: { id: input.replaceDocumentId, workspaceId: workspace.id, propertyId, purchaseCandidateId, archivedAt: null, deletedAt: null }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } }) : null;
      if (input.replaceDocumentId && !parent) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document not found.", 404);
      const version = (parent?.version ?? 0) + 1;
      const common = {
        originalFilename: checked.originalFilename,
        displayName,
        mimeType: checked.mimeType,
        sizeBytes: checked.sizeBytes,
        sha256: checked.sha256,
        storageKey,
        scanStatus: "scan_pending",
        processingState: "quarantined",
        reviewStatus: "awaiting_review",
        source: parent ? "user_replaced" : "user_uploaded",
        uploadedBy: input.userId,
        uploadedAt: now,
      };
      const documentCommon = {
        originalFilename: common.originalFilename,
        displayName: common.displayName,
        mimeType: common.mimeType,
        sizeBytes: common.sizeBytes,
        sha256: common.sha256,
        storageKey: common.storageKey,
        scanStatus: common.scanStatus,
        processingState: common.processingState,
        reviewStatus: common.reviewStatus,
        provenance: lineage?.provenance ?? common.source,
        ...(lineage ? { sourceDocumentId: lineage.sourceDocumentId, sourceVersionId: lineage.sourceVersionId, sourceSha256: lineage.sourceSha256, sourceCandidateId: lineage.sourceCandidateId } : {}),
        uploadedBy: common.uploadedBy,
        version,
      };
      const row = parent
        ? await tx.propertyDoc.update({ where: { id: parent.id }, data: { type: input.category, ...(input.subtype === undefined ? {} : { subtype: input.subtype.slice(0, 120) }), name: displayName, ...documentCommon, uploadDate: now.toISOString().slice(0, 10), verified: false, extracted: Prisma.JsonNull, idempotencyKey: input.idempotencyKey, version } , include: { versions: { orderBy: { version: "asc" } } } })
        : await tx.propertyDoc.create({ data: { id: documentId, workspaceId: workspace.id, propertyId, purchaseCandidateId, type: input.category, ...(input.subtype === undefined ? {} : { subtype: input.subtype.slice(0, 120) }), name: displayName, ...documentCommon, uploadDate: now.toISOString().slice(0, 10), idempotencyKey: input.idempotencyKey, verified: false }, include: { versions: { orderBy: { version: "asc" } } } });
      await tx.documentVersion.create({ data: { id: versionId, workspaceId: workspace.id, documentId: row.id, version, ...common } });
      await tx.workspace.update({ where: { id: workspace.id }, data: { version: { increment: 1 } } });
      await recordVaultHistory(tx, { workspaceId: workspace.id, propertyId, purchaseCandidateId }, { date: now.toISOString().slice(0, 10), title: parent ? `Document version added: ${input.category}` : `Document quarantined: ${input.category}`, detail: displayName, kind: "doc" });
      await createScanJob(tx, { documentId: row.id, documentVersionId: versionId, workspaceId: workspace.id, propertyId, purchaseCandidateId });
      const fresh = await tx.propertyDoc.findUniqueOrThrow({ where: { id: row.id }, include: { versions: { orderBy: { version: "asc" } } } });
      return { row: fresh, duplicate: false };
    }, { timeout: 15000 });
    return { document: mapVaultDocument(result.row), duplicate: result.duplicate, version: workspace.version + (result.duplicate ? 0 : 1) };
  } catch (error) {
    await storage.delete(storageKey);
    throw error;
  }
}

export async function listDocumentsForUser(userId: string, propertyId: string, includeArchived = false) {
  const workspace = await ownedActiveProperty(userId, propertyId);
  const rows = await prisma.propertyDoc.findMany({ where: { workspaceId: workspace.id, propertyId, deletedAt: null, ...(includeArchived ? {} : { archivedAt: null }) }, include: { versions: { orderBy: { version: "asc" } } }, orderBy: { createdAt: "asc" } });
  return rows.map(mapVaultDocument);
}

export async function listPurchaseDocumentsForUser(userId: string, purchaseCandidateId: string) {
  const workspace = await ownerWorkspace(userId);
  if (!await authorizeVaultContext({ userId, workspaceId: workspace.id, role: "owner", email: "" }, { propertyId: null, purchaseCandidateId })) throw new VaultInputError("RESOURCE_NOT_FOUND", "Candidate not found.", 404);
  return (await prisma.propertyDoc.findMany({ where: { workspaceId: workspace.id, purchaseCandidateId, archivedAt: null, deletedAt: null }, include: { versions: true }, orderBy: { createdAt: "asc" } })).map(mapVaultDocument);
}

export async function archiveDocumentForUser(userId: string, documentId: string) {
  const { workspace, row } = await findDocumentForUser(userId, documentId);
  const archived = await prisma.$transaction(async (tx) => {
    const updated = await tx.propertyDoc.updateMany({ where: { id: row.id, workspaceId: workspace.id, archivedAt: null, deletedAt: null }, data: { archivedAt: new Date(), processingState: "archived" } });
    if (updated.count !== 1) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document not found.", 404);
    await tx.workspace.update({ where: { id: workspace.id }, data: { version: { increment: 1 } } });
    await recordVaultHistory(tx, row, { date: new Date().toISOString().slice(0, 10), title: "Document archived", detail: row.displayName || row.name, kind: "doc" });
  }, { timeout: 15000 });
  void archived;
  return { document: mapVaultDocument(await findDocumentForUser(userId, documentId, true).then(({ row: fresh }) => fresh)), version: workspace.version + 1 };
}

export async function restoreDocumentForUser(userId: string, documentId: string) {
  const { workspace, row } = await findDocumentForUser(userId, documentId, true);
  if (row.deletedAt || !row.archivedAt) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document not found.", 404);
  const processingState = row.scanStatus === "clean" ? "ready" : "quarantined";
  await prisma.$transaction(async (tx) => {
    await tx.propertyDoc.update({ where: { id: row.id }, data: { archivedAt: null, processingState } });
    await tx.workspace.update({ where: { id: workspace.id }, data: { version: { increment: 1 } } });
  }, { timeout: 15000 });
  return { document: mapVaultDocument(await findDocumentForUser(userId, documentId).then(({ row: fresh }) => fresh)), version: workspace.version + 1 };
}

export async function deleteDocumentForUser(userId: string, documentId: string, storage: ObjectStoragePort = localObjectStorage()) {
  const { workspace, row } = await findDocumentForUser(userId, documentId);
  const versions = await prisma.documentVersion.findMany({ where: { workspaceId: workspace.id, documentId: row.id }, select: { storageKey: true } });
  await prisma.$transaction(async (tx) => {
    await tx.propertyDoc.update({ where: { id: row.id }, data: { deletedAt: new Date(), processingState: "archived" } });
    await tx.workspace.update({ where: { id: workspace.id }, data: { version: { increment: 1 } } });
  }, { timeout: 15000 });
  for (const version of versions) await storage.delete(version.storageKey);
  return { version: workspace.version + 1 };
}

export async function getProtectedDocumentBytes(userId: string, documentId: string, storage: ObjectStoragePort = localObjectStorage(), versionId?: string) {
  const { row } = await findDocumentForUser(userId, documentId);
  const version = versionId ? row.versions.find(v => v.id === versionId) : row.versions.find(v => v.version === row.version);
  if (!version || version.scanStatus !== "clean" || (row.purchaseCandidateId && version.reviewStatus !== "confirmed")) throw new VaultInputError("DOCUMENT_NOT_READY", "This version requires a completed scan and applicable manual review.", 423);
  if (version.version === row.version && (version.sha256 !== row.sha256 || version.storageKey !== row.storageKey || version.sizeBytes !== row.sizeBytes)) throw new VaultStorageError("Current document and version integrity metadata disagree.");
  if (version.version === row.version && row.scanStatus !== "clean") throw new VaultInputError("DOCUMENT_NOT_READY", "Current scan verdict unavailable.", 423);
  const stored = await storage.get(version.storageKey);
  if (stored.outcome === "unavailable") throw new VaultStorageError("The private document object is unavailable.");
  if (sha256Hex(stored.value.bytes) !== version.sha256) throw new VaultStorageError("The private document failed its integrity check.");
  const fresh = await findDocumentForUser(userId, documentId); // Re-authorize after object retrieval.
  if (!versionId && fresh.row.version !== row.version) throw new VaultInputError("DOCUMENT_CHANGED", "The current document changed. Reload before previewing.", 409);
  return { bytes: stored.value.bytes, mimeType: version.mimeType as SupportedMimeType, name: version.displayName || version.originalFilename, sha256: version.sha256 };
}

export async function getDocumentDetailsForUser(userId: string, documentId: string) {
  const { row } = await findDocumentForUser(userId, documentId, true);
  const [parsingRuns, ocrRuns, aiRuns] = await Promise.all([
    prisma.documentParsingRun.findMany({ where: { workspaceId: row.workspaceId, documentId: row.id }, orderBy: { createdAt: "desc" } }),
    prisma.documentOcrRun.findMany({ where: { workspaceId: row.workspaceId, documentId: row.id }, orderBy: { createdAt: "desc" } }),
    prisma.aiExtractionRun.findMany({ where: { workspaceId: row.workspaceId, documentId: row.id }, include: { proposals: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" } }),
  ]);
  const scanEvidence = await prisma.documentScanEvidence.findMany({ where: { documentVersion: { documentId: row.id, workspaceId: row.workspaceId } }, select: { evidence: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  return { document: mapVaultDocument(row), scanEvidence, parsingRuns, ocrRuns, aiRuns };
}

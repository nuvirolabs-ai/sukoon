import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { getWorkspaceForUser } from "@/lib/repository";
import { prisma } from "@/lib/prisma";
import { enqueueJob, runWorkerOnce, type JobRecord } from "@/lib/worker";
import { LocalObjectStorageAdapter, SandboxEmailAdapter } from "@/lib/providers";
import { sha256Hex } from "@/lib/vault-repository";
import { captureShareInvitation } from "@/lib/share-mailbox";
import { SHARE_CAPABILITIES, authorizeSharedDocument, authorizeSharedProperty, getActiveSharesForUser, shareScopeAllows, type ShareCapability } from "@/lib/authz";

export const SHARE_ROLES = ["FAMILY", "LAWYER", "CA", "BUYER", "ARCHITECT"] as const;
export type ShareRole = (typeof SHARE_ROLES)[number];
export const SHARE_PRESETS: Record<ShareRole, ShareCapability[]> = {
  FAMILY: ["PROPERTY_BASIC_READ", "DOCUMENT_LIST", "DOCUMENT_METADATA_READ", "DOCUMENT_PREVIEW", "BILLS_READ", "MAINTENANCE_READ", "TIMELINE_READ"],
  LAWYER: ["PROPERTY_BASIC_READ", "DOCUMENT_LIST", "DOCUMENT_METADATA_READ", "DOCUMENT_PREVIEW", "TIMELINE_READ"],
  CA: ["PROPERTY_BASIC_READ", "DOCUMENT_LIST", "DOCUMENT_METADATA_READ", "BILLS_READ", "TIMELINE_READ"],
  BUYER: ["PROPERTY_BASIC_READ", "DOCUMENT_LIST", "DOCUMENT_METADATA_READ", "TIMELINE_READ"],
  ARCHITECT: ["PROPERTY_BASIC_READ", "DOCUMENT_LIST", "DOCUMENT_METADATA_READ", "DOCUMENT_PREVIEW", "MAINTENANCE_READ", "TIMELINE_READ"],
};

export class SharingInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) { super(message); this.name = "SharingInputError"; this.code = code; this.status = status; }
}

function email(value: unknown) {
  if (typeof value !== "string" || value.trim().length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new SharingInputError("INVITEE_EMAIL_INVALID", "A valid authenticated recipient email is required.");
  return value.trim().toLowerCase();
}

function jsonValue(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item)) as Prisma.InputJsonValue; }
function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function isoExpiry(value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw new SharingInputError("EXPIRY_REQUIRED", "An invitation expiry is required.");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now() || parsed.getTime() > Date.now() + 365 * 86400000) throw new SharingInputError("EXPIRY_INVALID", "Expiry must be a future instant within one year.");
  return parsed.toISOString();
}

function capability(value: unknown): ShareCapability {
  if (typeof value !== "string" || !SHARE_CAPABILITIES.includes(value as ShareCapability)) throw new SharingInputError("CAPABILITY_INVALID", "The requested sharing capability is invalid.");
  return value as ShareCapability;
}

type ScopeInput = { capability: ShareCapability; documentId?: string; docType?: string };

async function ownedProperty(userId: string, propertyId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new SharingInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" }, select: { id: true, name: true } });
  if (!property) throw new SharingInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  return workspace;
}

function scopesFromInput(raw: unknown, role: ShareRole): ScopeInput[] {
  const source = raw === undefined ? SHARE_PRESETS[role].map((item) => ({ capability: item })) : raw;
  if (!Array.isArray(source) || source.length === 0 || source.length > 40) throw new SharingInputError("CAPABILITIES_INVALID", "Choose at least one and at most forty capabilities.");
  const values = source.map((item) => {
    if (typeof item === "string") return { capability: capability(item) };
    if (!item || typeof item !== "object") throw new SharingInputError("CAPABILITIES_INVALID", "Sharing capabilities are invalid.");
    const entry = item as Record<string, unknown>;
    const result: ScopeInput = { capability: capability(entry.capability ?? entry.scopeType) };
    if (entry.documentId !== undefined) { if (typeof entry.documentId !== "string" || !entry.documentId.trim()) throw new SharingInputError("DOCUMENT_SCOPE_INVALID", "Document scope is invalid."); result.documentId = entry.documentId.trim(); }
    if (entry.docType !== undefined) { if (typeof entry.docType !== "string" || !entry.docType.trim() || entry.docType.length > 120) throw new SharingInputError("DOCUMENT_SCOPE_INVALID", "Document category scope is invalid."); result.docType = entry.docType.trim(); }
    return result;
  });
  const hardDenied: Partial<Record<ShareRole, ShareCapability[]>> = { LAWYER: ["BILLS_READ", "MAINTENANCE_READ", "HEALTH_READ"], BUYER: ["BILLS_READ", "MAINTENANCE_READ", "HEALTH_READ", "DOCUMENT_PREVIEW"] };
  const denied = new Set(hardDenied[role] ?? []);
  if (values.some((item) => denied.has(item.capability))) throw new SharingInputError("ROLE_CAPABILITY_INVALID", `${role} cannot receive one or more private operational capabilities.`);
  const unique = new Map(values.map((item) => [`${item.capability}:${item.documentId || ""}:${item.docType || ""}`, item]));
  return [...unique.values()];
}

function grantDto(row: { id: string; propertyId: string; role: string; inviteeEmail: string; inviteeUserId: string | null; acceptedAt: Date | null; expiresAt: string; revokedAt: Date | null; note: string | null; version: number; createdAt: Date; scopes: Array<{ scopeType: string; documentId: string | null; docType: string | null }> }) {
  return { id: row.id, propertyId: row.propertyId, role: row.role, inviteeEmail: row.inviteeEmail, inviteeUserId: row.inviteeUserId, acceptedAt: row.acceptedAt?.toISOString() ?? null, expiresAt: row.expiresAt, revokedAt: row.revokedAt?.toISOString() ?? null, note: row.note, version: row.version, createdAt: row.createdAt.toISOString(), active: row.acceptedAt !== null && row.revokedAt === null && new Date(row.expiresAt).getTime() > Date.now(), scopes: row.scopes.map((scope) => ({ capability: scope.scopeType, documentId: scope.documentId, docType: scope.docType })) };
}

export async function createShareInvitationForUser(userId: string, propertyId: string, raw: unknown) {
  const workspace = await ownedProperty(userId, propertyId);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new SharingInputError("INVITATION_INVALID", "An invitation is required.");
  const source = raw as Record<string, unknown>;
  const inviteeEmail = email(source.inviteeEmail ?? source.email);
  const roleValue = typeof source.role === "string" ? source.role.toUpperCase() : "";
  if (!SHARE_ROLES.includes(roleValue as ShareRole)) throw new SharingInputError("ROLE_INVALID", "Choose a supported role preset.");
  const role = roleValue as ShareRole;
  const scopes = scopesFromInput(source.scopes ?? source.capabilities, role);
  const expiresAt = isoExpiry(source.expiresAt);
  const note = typeof source.note === "string" ? source.note.trim().slice(0, 500) || null : null;
  const documentIds = scopes.filter((scope) => scope.documentId).map((scope) => scope.documentId as string);
  if (documentIds.length) {
    const documents = await prisma.propertyDoc.findMany({ where: { id: { in: [...new Set(documentIds)] }, workspaceId: workspace.id, propertyId, archivedAt: null, deletedAt: null, scanStatus: "clean" }, select: { id: true } });
    if (documents.length !== new Set(documentIds).size) throw new SharingInputError("DOCUMENT_SCOPE_INVALID", "Every selected document must be an active clean document in this property.", 404);
  }
  const rawToken = randomBytes(32).toString("base64url");
  const row = await prisma.$transaction(async (tx) => {
    const share = await tx.shareLink.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, grantorId: userId, role, inviteeEmail, tokenHash: tokenHash(rawToken), expiresAt, note } });
    await tx.shareLinkScope.createMany({ data: scopes.map((scope) => ({ id: randomUUID(), shareLinkId: share.id, scopeType: scope.capability, documentId: scope.documentId ?? null, docType: scope.docType ?? null })) });
    return tx.shareLink.findUniqueOrThrow({ where: { id: share.id }, include: { scopes: { select: { scopeType: true, documentId: true, docType: true } } } });
  });
  const mail = new SandboxEmailAdapter();
  const sent = await mail.send({ to: inviteeEmail, subject: `Sukoon invitation for ${propertyId}`, text: `An authenticated Sukoon invitation is waiting. Use the local app to sign in and accept it. Invitation token: ${rawToken}` });
  captureShareInvitation({ to: inviteeEmail, subject: `Sukoon invitation for ${propertyId}`, text: `Invitation ${row.id}; ${sent.outcome === "sandbox" ? sent.note : "provider boundary"}` });
  return { invitation: grantDto(row), invitationToken: process.env.NODE_ENV === "production" ? null : rawToken, delivery: sent.outcome === "sandbox" ? sent.note : sent.outcome === "available" ? "Delivered by configured provider." : sent.reason };
}

export async function acceptShareInvitationForUser(userId: string, userEmail: string, rawToken: unknown) {
  if (typeof rawToken !== "string" || rawToken.length < 32 || rawToken.length > 200) throw new SharingInputError("INVITATION_TOKEN_INVALID", "Invitation token is invalid.");
  const row = await prisma.shareLink.findUnique({ where: { tokenHash: tokenHash(rawToken) }, include: { scopes: { select: { scopeType: true, documentId: true, docType: true } } } });
  if (!row) throw new SharingInputError("INVITATION_NOT_FOUND", "Invitation not found.", 404);
  if (row.acceptedAt) throw new SharingInputError("INVITATION_REPLAYED", "This invitation has already been accepted and cannot be replayed.", 409);
  if (row.revokedAt || new Date(row.expiresAt).getTime() <= Date.now()) throw new SharingInputError("INVITATION_EXPIRED", "This invitation is expired or revoked.", 410);
  if (row.inviteeEmail !== email(userEmail)) throw new SharingInputError("INVITATION_RECIPIENT_MISMATCH", "Sign in with the authenticated recipient address named in the invitation.", 403);
  const accepted = await prisma.shareLink.update({ where: { id: row.id, acceptedAt: null }, data: { inviteeUserId: userId, acceptedAt: new Date(), version: { increment: 1 } }, include: { scopes: { select: { scopeType: true, documentId: true, docType: true } } } });
  return grantDto(accepted);
}

export async function listOwnedSharesForUser(userId: string, propertyId: string) {
  const workspace = await ownedProperty(userId, propertyId);
  const rows = await prisma.shareLink.findMany({ where: { workspaceId: workspace.id, propertyId }, orderBy: { createdAt: "desc" }, include: { scopes: { select: { scopeType: true, documentId: true, docType: true } } } });
  return rows.map(grantDto);
}

export async function revokeShareForUser(userId: string, shareId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new SharingInputError("SHARE_NOT_FOUND", "Share grant not found.", 404);
  const row = await prisma.shareLink.findFirst({ where: { id: shareId, workspaceId: workspace.id, grantorId: userId } });
  if (!row) throw new SharingInputError("SHARE_NOT_FOUND", "Share grant not found.", 404);
  const revoked = await prisma.shareLink.update({ where: { id: row.id }, data: { revokedAt: new Date(), version: { increment: 1 } }, include: { scopes: { select: { scopeType: true, documentId: true, docType: true } } } });
  return grantDto(revoked);
}

export async function listSharedPropertiesForUser(userId: string) {
  const grants = await getActiveSharesForUser(userId);
  const properties = await Promise.all(grants.filter((grant) => shareScopeAllows(grant, "PROPERTY_BASIC_READ")).map(async (grant) => {
    const property = await prisma.property.findFirst({ where: { id: grant.propertyId, workspaceId: grant.workspaceId, status: "active" }, select: { id: true, name: true, type: true, city: true, area: true, address: true } });
    return property ? { property, shareId: grant.id, role: grant.role, expiresAt: grant.expiresAt } : null;
  }));
  return properties.filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function has(grant: { scopes: Array<{ scopeType: string; documentId: string | null; docType: string | null }> }, value: ShareCapability) { return shareScopeAllows(grant, value); }

export async function getSharedPropertyForUser(userId: string, propertyId: string) {
  const access = await authorizeSharedProperty(userId, propertyId, "PROPERTY_BASIC_READ");
  if (!access) throw new SharingInputError("SHARED_PROPERTY_NOT_FOUND", "Shared property not found.", 404);
  const { grant, property } = access;
  const result: Record<string, unknown> = { property: { id: property.id, name: property.name, type: property.type, city: property.city, area: property.area, address: property.address }, role: grant.role, shareId: grant.id, expiresAt: grant.expiresAt, capabilities: grant.scopes.filter((scope) => !scope.documentId && !scope.docType).map((scope) => scope.scopeType) };
  if (has(grant, "DOCUMENT_LIST") || has(grant, "DOCUMENT_METADATA_READ")) {
    const documents = await prisma.propertyDoc.findMany({ where: { workspaceId: grant.workspaceId, propertyId, archivedAt: null, deletedAt: null, scanStatus: "clean" }, select: { id: true, type: true, name: true, displayName: true, version: true, sizeBytes: true, sha256: true } });
    result.documents = documents.filter((doc) => shareScopeAllows(grant, "DOCUMENT_LIST", doc) || shareScopeAllows(grant, "DOCUMENT_METADATA_READ", doc)).map((doc) => ({ id: doc.id, type: doc.type, name: doc.displayName || doc.name, version: doc.version, sizeBytes: doc.sizeBytes, sha256: doc.sha256 }));
  }
  if (has(grant, "BILLS_READ")) result.bills = (await prisma.obligation.findMany({ where: { workspaceId: grant.workspaceId, propertyId }, orderBy: { dueDate: "asc" }, select: { id: true, label: true, type: true, direction: true, dueDate: true, currency: true, active: true } }));
  if (has(grant, "MAINTENANCE_READ")) result.maintenance = (await prisma.maintenance.findMany({ where: { workspaceId: grant.workspaceId, propertyId }, orderBy: { dateReported: "desc" }, select: { id: true, task: true, category: true, dateReported: true, status: true, finalCostPaise: true, warrantyUntil: true } })).map((item) => ({ ...item, finalCost: item.finalCostPaise === null ? null : Number(item.finalCostPaise) / 100, finalCostPaise: undefined }));
  if (has(grant, "TIMELINE_READ")) result.timeline = await prisma.timelineEvent.findMany({ where: { workspaceId: grant.workspaceId, propertyId }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], select: { id: true, date: true, title: true, detail: true, kind: true } });
  return result;
}

export async function listSharedDocumentsForUser(userId: string, propertyId: string) {
  const grants = await getActiveSharesForUser(userId, propertyId);
  const allowed = grants.filter((grant) => grant.scopes.some((scope) => (scope.scopeType === "DOCUMENT_LIST" || scope.scopeType === "DOCUMENT_METADATA_READ") && (scope.documentId || scope.docType || (!scope.documentId && !scope.docType))));
  if (!allowed.length) throw new SharingInputError("SHARED_DOCUMENTS_NOT_FOUND", "Shared documents not found.", 404);
  const workspaceIds = [...new Set(allowed.map((grant) => grant.workspaceId))];
  const docs = await prisma.propertyDoc.findMany({ where: { propertyId, workspaceId: { in: workspaceIds }, archivedAt: null, deletedAt: null, scanStatus: "clean" }, select: { id: true, workspaceId: true, propertyId: true, type: true, displayName: true, name: true, originalFilename: true, version: true, sizeBytes: true, sha256: true, mimeType: true } });
  return docs.filter((doc) => allowed.some((grant) => grant.workspaceId === doc.workspaceId && (shareScopeAllows(grant, "DOCUMENT_LIST", doc) || shareScopeAllows(grant, "DOCUMENT_METADATA_READ", doc)))).map((doc) => ({ id: doc.id, propertyId: doc.propertyId, type: doc.type, name: doc.displayName || doc.name, originalFilename: doc.originalFilename, version: doc.version, sizeBytes: doc.sizeBytes, sha256: doc.sha256, mimeType: doc.mimeType }));
}

export async function searchSharedForUser(userId: string, query: string) {
  const needle = query.trim().toLowerCase().slice(0, 120);
  const properties = await listSharedPropertiesForUser(userId);
  const documents = (await Promise.all(properties.map(async (item) => listSharedDocumentsForUser(userId, item.property.id).catch(() => [])))).flat();
  return {
    properties: properties.filter((item) => !needle || `${item.property.name} ${item.property.type} ${item.property.city} ${item.property.area}`.toLowerCase().includes(needle)),
    documents: documents.filter((item) => !needle || `${item.name} ${item.type}`.toLowerCase().includes(needle)),
  };
}

export async function getSharedDocumentMetadataForUser(userId: string, documentId: string) {
  const access = await authorizeSharedDocument(userId, documentId, "DOCUMENT_METADATA_READ");
  if (!access) throw new SharingInputError("SHARED_DOCUMENT_NOT_FOUND", "Shared document not found.", 404);
  const { document, grant } = access;
  return { id: document.id, propertyId: document.propertyId, type: document.type, name: document.displayName || document.name, originalFilename: document.originalFilename, version: document.version, sizeBytes: document.sizeBytes, sha256: document.sha256, mimeType: document.mimeType, shareId: grant.id, parsedText: undefined, aiRuns: undefined, extracted: undefined };
}

export async function getSharedDocumentBytesForUser(userId: string, documentId: string) {
  const access = await authorizeSharedDocument(userId, documentId, "DOCUMENT_PREVIEW");
  if (!access) throw new SharingInputError("SHARED_DOCUMENT_NOT_FOUND", "Shared document not found.", 404);
  const storage = new LocalObjectStorageAdapter(process.env.NODE_ENV === "test" ? "test" : "local");
  const stored = await storage.get(access.document.storageKey);
  if (stored.outcome !== "available" || (access.document.sha256 && sha256Hex(stored.value.bytes) !== access.document.sha256)) throw new SharingInputError("SHARED_DOCUMENT_UNAVAILABLE", "The shared private document is unavailable.", 503);
  return { bytes: stored.value.bytes, mimeType: access.document.mimeType, name: access.document.displayName || access.document.name, sha256: access.document.sha256 };
}

export async function evaluateSharedHealthForUser(userId: string, propertyId: string) {
  const access = await authorizeSharedProperty(userId, propertyId, "HEALTH_READ");
  if (!access) throw new SharingInputError("SHARED_HEALTH_NOT_FOUND", "Shared health view not found.", 404);
  const docs = await prisma.propertyDoc.findMany({ where: { workspaceId: access.grant.workspaceId, propertyId, archivedAt: null, deletedAt: null, scanStatus: "clean" }, select: { id: true, type: true, displayName: true, name: true } });
  const visible = docs.filter((doc) => shareScopeAllows(access.grant, "DOCUMENT_METADATA_READ", doc) || shareScopeAllows(access.grant, "DOCUMENT_PREVIEW", doc));
  return { assessment: "LIMITED_SHARED_VIEW", score: null, applicableCount: null, satisfiedCount: null, unknownCount: null, caveat: "Only explicitly shared clean document evidence is considered; inaccessible evidence and health impact are omitted.", items: visible.map((doc) => ({ evidenceDocumentId: doc.id, evidenceCategory: doc.type, evidenceState: "VISIBLE_SHARED_EVIDENCE", documentName: doc.displayName || doc.name })) };
}

function operationPayload(job: JobRecord) {
  if (!job.payload || typeof job.payload !== "object") throw new Error("SHARE_OPERATION_PAYLOAD_INVALID");
  const payload = job.payload as Record<string, unknown>;
  if (typeof payload.operationId !== "string") throw new Error("SHARE_OPERATION_PAYLOAD_INVALID");
  return payload.operationId;
}

async function dispatchSharedOperation(job: JobRecord) {
  const operationId = operationPayload(job);
  const operation = await prisma.shareOperation.findUnique({ where: { id: operationId } });
  if (!operation) return;
  const access = await authorizeSharedDocument(operation.requestedByUserId, operation.documentId, "DOCUMENT_PREVIEW");
  if (!access || access.grant.id !== operation.shareLinkId || access.document.propertyId !== operation.propertyId) {
    await prisma.shareOperation.update({ where: { id: operation.id }, data: { status: "SUPPRESSED_REVOKED", output: Prisma.JsonNull, failureReason: "Grant was revoked or expired before the job output boundary." } });
    return;
  }
  await prisma.shareOperation.update({ where: { id: operation.id }, data: { status: "DELIVERED", output: jsonValue({ documentId: operation.documentId, sha256: access.document.sha256, generatedAt: new Date().toISOString() }), failureReason: null } });
}

export async function startSharedDocumentOperationForUser(userId: string, shareLinkId: string, propertyId: string, documentId: string) {
  const access = await authorizeSharedDocument(userId, documentId, "DOCUMENT_PREVIEW");
  if (!access || access.grant.id !== shareLinkId || access.document.propertyId !== propertyId) throw new SharingInputError("SHARED_DOCUMENT_NOT_FOUND", "Shared document not found.", 404);
  const operation = await prisma.shareOperation.create({ data: { id: randomUUID(), workspaceId: access.grant.workspaceId, propertyId, shareLinkId, documentId, requestedByUserId: userId, status: "QUEUED" } });
  await enqueueJob({ aggregateType: "shared_document", aggregateId: operation.id, eventType: "SHARED_DOCUMENT_OPERATION", payload: { operationId: operation.id, workspaceId: access.grant.workspaceId }, idempotencyKey: `shared-operation:${operation.id}`, correlationId: operation.id });
  return { id: operation.id, status: operation.status };
}

export async function getSharedOperationForUser(userId: string, operationId: string) {
  const operation = await prisma.shareOperation.findUnique({ where: { id: operationId } });
  if (!operation) throw new SharingInputError("SHARED_OPERATION_NOT_FOUND", "Shared operation not found.", 404);
  const workspace = await getWorkspaceForUser(userId);
  if (workspace?.id === operation.workspaceId) return { id: operation.id, status: operation.status, output: operation.output, failureReason: operation.failureReason };
  const access = await authorizeSharedDocument(userId, operation.documentId, "DOCUMENT_PREVIEW");
  if (!access || access.grant.id !== operation.shareLinkId) throw new SharingInputError("SHARED_OPERATION_NOT_FOUND", "Shared operation not found.", 404);
  return { id: operation.id, status: operation.status, output: operation.output, failureReason: operation.failureReason };
}

export async function runSharedOperationWorkerOnce(workerId: string) {
  return runWorkerOnce(workerId, (job) => job.eventType === "SHARED_DOCUMENT_OPERATION" ? dispatchSharedOperation(job) : Promise.reject(new Error("SHARED_OPERATION_EVENT_UNSUPPORTED")), { eventTypes: ["SHARED_DOCUMENT_OPERATION"] });
}

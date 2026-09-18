import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthorizationAction = "read" | "write" | "delete" | "download" | "share" | "assistant" | "export";

export const SHARE_CAPABILITIES = ["PROPERTY_BASIC_READ", "DOCUMENT_LIST", "DOCUMENT_METADATA_READ", "DOCUMENT_PREVIEW", "DOCUMENT_EXPORT", "BILLS_READ", "MAINTENANCE_READ", "TIMELINE_READ", "HEALTH_READ", "CONSTRUCTION_PROJECT_READ", "CONSTRUCTION_TASK_READ", "CONSTRUCTION_DOCUMENT_READ", "CONSTRUCTION_BUDGET_READ", "CONSTRUCTION_COST_READ", "CONSTRUCTION_UPDATE_READ", "CONSTRUCTION_MATERIAL_READ", "CONSTRUCTION_CONTACT_READ"] as const;
export type ShareCapability = (typeof SHARE_CAPABILITIES)[number];

export type Principal = {
  userId: string;
  workspaceId: string;
  email: string;
  role: "owner";
};

export async function getPrincipal(request?: Request): Promise<Principal | null> {
  const requestHeaders = request?.headers ?? await nextHeaders();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const workspace = await prisma.workspace.findFirst({ where: { ownerUserId: session.user.id, owner: { role: "owner" } }, select: { id: true } });
  if (!workspace) return null;
  return { userId: session.user.id, workspaceId: workspace.id, email: session.user.email, role: "owner" };
}

export async function requirePrincipal(request?: Request) {
  const principal = await getPrincipal(request);
  if (!principal) throw new AuthorizationError("AUTHENTICATION_REQUIRED", 401, "Sign in required.");
  return principal;
}

/**
 * All resource checks live here. The owner-only policy is deliberately a small
 * seam: delegate grants can be added here later without trusting client IDs or
 * duplicating workspace predicates in individual handlers.
 */
export async function authorizeProperty(principal: Principal, propertyId: string, _action: AuthorizationAction = "read") {
  void _action;
  return prisma.property.findFirst({ where: { id: propertyId, workspaceId: principal.workspaceId, status: "active" } });
}

/** Prospective buying records confer no ownership or seller access. */
export async function authorizePurchaseWorkspace(principal: Principal, id: string) {
  return prisma.purchaseWorkspace.findFirst({ where: { id, workspaceId: principal.workspaceId } });
}
export async function authorizePurchaseCandidate(principal: Principal, id: string) {
  return prisma.purchaseCandidate.findFirst({ where: { id, workspaceId: principal.workspaceId } });
}

export async function authorizeDocument(principal: Principal, documentId: string, action: AuthorizationAction = "read") {
  const document = await prisma.propertyDoc.findFirst({ where: { id: documentId, workspaceId: principal.workspaceId }, include: { property: true } });
  if (!document || !(await authorizeVaultContext(principal, document))) return null;
  void action;
  return document;
}

export async function authorizeVaultContext(principal: Principal, context: { propertyId: string | null; purchaseCandidateId: string | null }) {
  if (Boolean(context.propertyId) === Boolean(context.purchaseCandidateId)) return null;
  if (context.propertyId) return authorizeProperty(principal, context.propertyId);
  return authorizePurchaseCandidate(principal, context.purchaseCandidateId!);
}

export async function authorizeBill(principal: Principal, billId: string, action: AuthorizationAction = "read") {
  const bill = await prisma.bill.findFirst({ where: { id: billId, workspaceId: principal.workspaceId } });
  if (!bill || !(await authorizeProperty(principal, bill.propertyId, action))) return null;
  return bill;
}

type SharedGrant = {
  id: string;
  workspaceId: string;
  propertyId: string;
  role: string;
  expiresAt: string;
  revokedAt: Date | null;
  scopes: Array<{ scopeType: string; documentId: string | null; docType: string | null }>;
};

function grantIsActive(grant: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: string; inviteeUserId: string | null }, userId: string) {
  return grant.inviteeUserId === userId && grant.acceptedAt !== null && grant.revokedAt === null && new Date(grant.expiresAt).getTime() > Date.now();
}

export function shareScopeAllows(grant: { scopes: Array<{ scopeType: string; documentId: string | null; docType: string | null }> }, capability: ShareCapability, document?: { id: string; type: string }) {
  return grant.scopes.some((scope) => scope.scopeType === capability && (!document || (!scope.documentId && !scope.docType) || scope.documentId === document.id || scope.docType === document.type));
}

export async function getActiveSharesForUser(userId: string, propertyId?: string): Promise<SharedGrant[]> {
  const rows = await prisma.shareLink.findMany({ where: { inviteeUserId: userId, acceptedAt: { not: null }, revokedAt: null, ...(propertyId ? { propertyId } : {}) }, include: { scopes: { select: { scopeType: true, documentId: true, docType: true } } } });
  return rows.filter((row) => grantIsActive(row, userId)).map((row) => ({ id: row.id, workspaceId: row.workspaceId, propertyId: row.propertyId, role: row.role, expiresAt: row.expiresAt, revokedAt: row.revokedAt, scopes: row.scopes }));
}

export async function authorizeSharedProperty(userId: string, propertyId: string, capability: ShareCapability) {
  const grants = await getActiveSharesForUser(userId, propertyId);
  const grant = grants.find((candidate) => shareScopeAllows(candidate, capability));
  if (!grant) return null;
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: grant.workspaceId, status: "active" } });
  return property ? { grant, property } : null;
}

export async function authorizeSharedDocument(userId: string, documentId: string, capability: "DOCUMENT_LIST" | "DOCUMENT_METADATA_READ" | "DOCUMENT_PREVIEW") {
  const document = await prisma.propertyDoc.findFirst({ where: { id: documentId, archivedAt: null, deletedAt: null }, select: { id: true, workspaceId: true, propertyId: true, type: true, name: true, displayName: true, originalFilename: true, version: true, sizeBytes: true, sha256: true, mimeType: true, storageKey: true, scanStatus: true } });
  if (!document || !document.propertyId || document.scanStatus !== "clean") return null;
  const grants = await getActiveSharesForUser(userId, document.propertyId);
  const grant = grants.find((candidate) => candidate.workspaceId === document.workspaceId && shareScopeAllows(candidate, capability, document));
  return grant ? { grant, document } : null;
}

export class AuthorizationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
    this.status = status;
  }
}

export function notFoundResponse() {
  return { code: "RESOURCE_NOT_FOUND", message: "Resource not found.", status: 404 } as const;
}

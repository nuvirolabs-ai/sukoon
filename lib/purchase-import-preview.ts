import { prisma } from "@/lib/prisma";
import { authorizeProperty, authorizePurchaseCandidate, AuthorizationError, type Principal } from "@/lib/authz";

/** T02 read-only preparation. This NEVER grants access, copies bytes or creates ownership. */
export async function previewPurchaseImport(principal: Principal, input: Record<string, unknown>) {
  const { candidateId, targetPropertyId, documentVersionIds } = input;
  if (typeof candidateId !== "string" || typeof targetPropertyId !== "string" || !Array.isArray(documentVersionIds) || !documentVersionIds.length || documentVersionIds.length > 20 || documentVersionIds.some(id => typeof id !== "string") || new Set(documentVersionIds).size !== documentVersionIds.length) throw new AuthorizationError("IMPORT_SELECTION_INVALID", 400, "Select a candidate, an existing owned Passport and one to twenty distinct versions.");
  if (!await authorizePurchaseCandidate(principal, candidateId) || !await authorizeProperty(principal, targetPropertyId)) throw new AuthorizationError("RESOURCE_NOT_FOUND", 404, "Selection not found.");
  const versions = await prisma.documentVersion.findMany({ where: { id: { in: documentVersionIds }, workspaceId: principal.workspaceId, document: { purchaseCandidateId: candidateId, propertyId: null, archivedAt: null, deletedAt: null } }, include: { document: { select: { version: true } } } });
  if (versions.length !== documentVersionIds.length) throw new AuthorizationError("RESOURCE_NOT_FOUND", 404, "Selected version not found in this candidate.");
  if (versions.some(v => v.scanStatus !== "clean" || v.reviewStatus !== "confirmed")) throw new AuthorizationError("IMPORT_EVIDENCE_NOT_READY", 423, "Each selected version needs its own scan and manual category confirmation.");
  return {
    mode: "PREVIEW_ONLY" as const, importEnabled: false,
    candidateId, targetPropertyId,
    notice: "Nothing has been copied, shared or transferred. A Passport is an owner assertion, not a government registry change. Transactional import and explicit confirmation remain unfinished.",
    selections: documentVersionIds.map(id => {
      const v = versions.find(v => v.id === id)!;
      return { documentId: v.documentId, documentVersionId: v.id, sourceVersion: v.version, sourceSha256: v.sha256, current: v.document.version === v.version, filename: v.originalFilename, provenance: "buyer_owned_purchase_upload", destinationAction: "proposed_new_version_with_fresh_scan" };
    }),
  };
}

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { authorizeProperty, authorizePurchaseCandidate, AuthorizationError, type Principal } from "@/lib/authz";
import { createDocumentForUser, getProtectedDocumentBytes } from "@/lib/vault-repository";

/**
 * T02 explicit post-purchase import executor.
 *
 * Copies the buyer's OWN candidate evidence versions into the buyer's OWNED
 * Passport as NEW documents with preserved source lineage and a FRESH
 * destination scan. It never moves, merges, transfers ownership of, or
 * grants access to anything:
 * - same principal must own the candidate workspace AND the target Passport
 *   (share recipients, sellers and other buyers get RESOURCE_NOT_FOUND);
 * - candidate originals are untouched (append-only HISTORY entry only);
 * - no ShareLink, grant, ownership or seller-record mutation occurs anywhere.
 */

function selection(input: Record<string, unknown>) {
  const { candidateId, targetPropertyId, documentVersionIds, confirmed, requestKey } = input;
  if (typeof candidateId !== "string" || !candidateId || typeof targetPropertyId !== "string" || !targetPropertyId) throw new AuthorizationError("IMPORT_SELECTION_INVALID", 400, "Select a candidate and an existing owned Passport.");
  if (!Array.isArray(documentVersionIds) || !documentVersionIds.length || documentVersionIds.length > 20 || documentVersionIds.some(id => typeof id !== "string") || new Set(documentVersionIds).size !== documentVersionIds.length) throw new AuthorizationError("IMPORT_SELECTION_INVALID", 400, "Select one to twenty distinct evidence versions.");
  if (confirmed !== true) throw new AuthorizationError("IMPORT_CONFIRMATION_REQUIRED", 400, "Explicit confirmation is required before any record is copied.");
  if (typeof requestKey !== "string" || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestKey)) throw new AuthorizationError("REQUEST_KEY_REQUIRED", 400, "A bounded idempotency key is required.");
  return { candidateId, targetPropertyId, documentVersionIds: documentVersionIds as string[], requestKey };
}

export async function executePurchaseImport(principal: Principal, input: Record<string, unknown>) {
  const { candidateId, targetPropertyId, documentVersionIds, requestKey } = selection(input);
  // Identity-bound: both sides must belong to this principal's workspace.
  const candidate = await authorizePurchaseCandidate(principal, candidateId);
  const property = await authorizeProperty(principal, targetPropertyId);
  if (!candidate || !property) throw new AuthorizationError("RESOURCE_NOT_FOUND", 404, "Selection not found.");
  // Re-validate exact source versions at execution time (never trust the preview).
  const versions = await prisma.documentVersion.findMany({
    where: { id: { in: documentVersionIds }, workspaceId: principal.workspaceId, document: { purchaseCandidateId: candidateId, propertyId: null, archivedAt: null, deletedAt: null } },
    include: { document: { select: { id: true, version: true, type: true, name: true, displayName: true, originalFilename: true, mimeType: true } } },
  });
  if (versions.length !== documentVersionIds.length) throw new AuthorizationError("RESOURCE_NOT_FOUND", 404, "Selected version not found in this candidate.");
  if (versions.some(v => v.scanStatus !== "clean" || v.reviewStatus !== "confirmed")) throw new AuthorizationError("IMPORT_EVIDENCE_NOT_READY", 423, "Each selected version needs its own scan and manual category confirmation.");
  const items: Array<{ sourceDocumentId: string; sourceVersionId: string; sourceVersion: number; sourceSha256: string; documentId: string; version: number; scanStatus: string; duplicate: boolean }> = [];
  let created = 0;
  for (const versionId of documentVersionIds) {
    const source = versions.find(v => v.id === versionId)!;
    const itemKey = `purchase-import:${requestKey}:${versionId}`;
    const prior = await prisma.propertyDoc.findUnique({ where: { idempotencyKey: itemKey } });
    if (prior) {
      if (prior.workspaceId !== principal.workspaceId || prior.propertyId !== targetPropertyId || prior.provenance !== "purchase_import" || prior.sourceVersionId !== versionId || prior.sourceSha256 !== source.sha256 || prior.sourceCandidateId !== candidateId || prior.sourceDocumentId !== source.documentId) {
        throw new AuthorizationError("IMPORT_KEY_CONFLICT", 409, "This import key was already used for different records. Use a new key.");
      }
      items.push({ sourceDocumentId: source.documentId, sourceVersionId: versionId, sourceVersion: source.version, sourceSha256: source.sha256, documentId: prior.id, version: prior.version, scanStatus: prior.scanStatus, duplicate: true });
      continue;
    }
    // Owner-gated, integrity-checked bytes; re-authorizes after retrieval.
    const bytes = await getProtectedDocumentBytes(principal.userId, source.documentId, undefined, versionId);
    const result = await createDocumentForUser({
      userId: principal.userId,
      propertyId: targetPropertyId,
      category: source.document.type,
      displayName: source.document.displayName || source.document.name,
      filename: source.document.originalFilename,
      mimeType: source.document.mimeType,
      bytes: bytes.bytes,
      idempotencyKey: itemKey,
      provenance: "purchase_import",
      sourceDocumentId: source.documentId,
      sourceVersionId: versionId,
      sourceSha256: source.sha256,
      sourceCandidateId: candidateId,
    });
    if (result.duplicate) throw new AuthorizationError("IMPORT_KEY_CONFLICT", 409, "This import key was already used for different records. Use a new key.");
    created += 1;
    items.push({ sourceDocumentId: source.documentId, sourceVersionId: versionId, sourceVersion: source.version, sourceSha256: source.sha256, documentId: result.document.id, version: result.document.version, scanStatus: result.document.scanStatus, duplicate: false });
  }
  // Append-only records, written once: candidate history + property timeline.
  // The timeline detail embeds the request key so a crashed-then-retried call
  // resumes without duplicating the event.
  // Append-only records. History is written when this call creates records;
  // the timeline event converges independently: its detail embeds the request
  // key, so a crashed-then-retried call (or a full replay) never duplicates it.
  const detail = `Imported ${items.length} record${items.length === 1 ? "" : "s"} from purchase candidate "${candidate.name}" (explicit owner import ${requestKey}). A Passport is an owner assertion, not a government registry change.`;
  if (created > 0) {
    const importedAt = new Date().toISOString();
    await prisma.purchaseEntry.create({
      data: {
        id: randomUUID(),
        candidateId, workspaceId: principal.workspaceId, kind: "HISTORY",
        body: JSON.stringify({ action: "purchase_import", requestKey, targetPropertyId, targetPropertyName: property.name, importedAt, actorUserId: principal.userId, items: items.filter(i => !i.duplicate).map(i => ({ sourceVersionId: i.sourceVersionId, documentId: i.documentId, version: i.version })) }),
        requestKey: `purchase-import-history-${requestKey}`,
      },
    });
  }
  const existingEvent = await prisma.timelineEvent.findFirst({ where: { workspaceId: principal.workspaceId, propertyId: targetPropertyId, title: "Purchase import recorded", detail: { contains: requestKey } } });
  if (!existingEvent) {
    await prisma.timelineEvent.create({ data: { id: randomUUID(), workspaceId: principal.workspaceId, propertyId: targetPropertyId, date: new Date().toISOString().slice(0, 10), title: "Purchase import recorded", detail, kind: "doc" } });
  }
  return {
    mode: "EXECUTED" as const,
    requestKey, candidateId, targetPropertyId,
    created,
    items,
    notices: [
      "Copies were created in your Passport; the candidate originals are unchanged.",
      "Each copy starts a fresh malware scan; preview waits for a clean verdict.",
      "A Passport is an owner assertion, not a government registry change; receiving documents is not legal verification.",
      "No ownership transferred, no access granted, no seller records touched.",
    ],
  };
}

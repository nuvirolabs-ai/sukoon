import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { authorizePurchaseCandidate, AuthorizationError, type Principal } from "@/lib/authz";
const fail = (message: string, status = 400): never => { throw new AuthorizationError("PURCHASE_EVIDENCE_DENIED", status, message); };
export async function purchaseEvidence(principal: Principal, candidateId: string) {
  if (!await authorizePurchaseCandidate(principal, candidateId)) return fail("Candidate not found.", 404);
  const entries = await prisma.purchaseEntry.findMany({ where: { candidateId, workspaceId: principal.workspaceId, kind: { in: ["DOCUMENT_REQUEST", "QUESTION"] } }, orderBy: { createdAt: "asc" }, include: { events: { orderBy: { createdAt: "asc" }, include: { documentVersion: { include: { document: true } } } } } });
  return entries.map(entry => ({ id: entry.id, body: entry.body, kind: entry.kind, state: entry.state, version: entry.version, events: entry.events.map(event => {
    const v = event.documentVersion, d = v?.document;
    const available = !!v && !!d && !d.archivedAt && !d.deletedAt && d.purchaseCandidateId === candidateId && v.scanStatus === "clean" && v.reviewStatus === "confirmed";
    return { id: event.id, action: event.action, note: event.note, source: event.source, actorUserId: event.actorUserId, createdAt: event.createdAt, documentVersionId: event.documentVersionId, evidence: v ? { documentId: d!.id, version: v.version, sha256: v.sha256, current: d!.version === v.version, available, scanStatus: v.scanStatus, reviewStatus: v.reviewStatus } : null };
  }) }));
}
export async function recordPurchaseEvidence(principal: Principal, input: Record<string, unknown>) {
  const { candidateId, entryId, action, note, source, requestKey, version } = input;
  if (typeof candidateId !== "string" || typeof entryId !== "string" || typeof action !== "string" || typeof note !== "string" || !note.trim() || note.length > 2000 || typeof requestKey !== "string" || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestKey) || !Number.isInteger(version)) return fail("Entry, version, bounded note and retry key are required.");
  if (!await authorizePurchaseCandidate(principal, candidateId)) return fail("Candidate not found.", 404);
  const documentVersionId = input.documentVersionId === "" || input.documentVersionId === undefined ? null : input.documentVersionId;
  if (documentVersionId !== null && typeof documentVersionId !== "string") return fail("Invalid document reference.");
  if (!["BUYER_UPLOADED", "BUYER_REPORTED_SELLER", "USER_NOTE"].includes(String(source))) return fail("Choose an honest evidence source.");
  const payloadHash = createHash("sha256").update(JSON.stringify({ candidateId, entryId, action, note, source, version, documentVersionId })).digest("hex");
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "PurchaseEntry" WHERE id = ${entryId} AND "workspaceId" = ${principal.workspaceId} FOR UPDATE`;
    const entry = await tx.purchaseEntry.findFirst({ where: { id: entryId, candidateId, workspaceId: principal.workspaceId } });
    if (!entry) return fail("Entry not found.", 404);
    const previous = await tx.purchaseEvidenceEvent.findUnique({ where: { requestKey } });
    if (previous) { if (previous.entryId !== entryId || previous.payloadHash !== payloadHash || previous.actorUserId !== principal.userId) return fail("Retry key conflict.", 409); return { id: previous.id, duplicate: true }; }
    if (entry.version !== version) return fail("This entry changed. Refresh before saving.", 409);
    if (entry.kind === "DOCUMENT_REQUEST" ? !["RECEIVE", "REVIEW"].includes(action) : entry.kind === "QUESTION" ? !["ANSWER", "RESOLVE", "REOPEN"].includes(action) : true) return fail("Unsupported entry action.");
    if (["RECEIVE", "REVIEW"].includes(action) && !documentVersionId) return fail("Select the received document version.");
    if (action === "REVIEW" && !await tx.purchaseEvidenceEvent.findFirst({ where: { entryId, action: "RECEIVE", documentVersionId } })) return fail("Record receipt of this version first.", 409);
    if (documentVersionId) {
      const v = await tx.documentVersion.findFirst({ where: { id: documentVersionId, workspaceId: principal.workspaceId, document: { purchaseCandidateId: candidateId, propertyId: null, deletedAt: null, archivedAt: null } } });
      if (!v) return fail("Evidence version not available in this candidate.", 404);
      if (action !== "RECEIVE" && (v.scanStatus !== "clean" || v.reviewStatus !== "confirmed")) return fail("Evidence requires scan and manual category confirmation.", 423);
    }
    const state = action === "RECEIVE" ? "RECEIVED" : action === "REVIEW" ? "USER_REVIEWED" : action === "RESOLVE" ? "RESOLVED" : action === "REOPEN" ? "OPEN" : "ANSWERED";
    const event = await tx.purchaseEvidenceEvent.create({ data: { id: randomUUID(), entryId, action, note: note.trim(), source: String(source), actorUserId: principal.userId, documentVersionId, requestKey, payloadHash } });
    await tx.purchaseEntry.update({ where: { id: entryId }, data: { state, version: { increment: 1 } } });
    return { id: event.id, duplicate: false };
  });
}

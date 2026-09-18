import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ensureWorkspace } from "@/lib/repository";

export const INTELLIGENCE_EVENTS = ["PARSE_DOCUMENT", "OCR_DOCUMENT", "AI_EXTRACT_DOCUMENT"];
export const PROCESSING_NOTICE = "local-document-intelligence-withdrawal-v1";
export class ProcessingWithdrawnError extends Error {
  code = "PROCESSING_WITHDRAWN";
  status = 403;
  constructor() { super("Document intelligence processing has been withdrawn. Scanning and manual document review remain separate."); }
}
export async function intelligenceAllowed(workspaceId: string) {
  return !await prisma.processingControl.findUnique({ where: { workspaceId } });
}
export async function assertIntelligenceAllowed(workspaceId: string) {
  if (!await intelligenceAllowed(workspaceId)) throw new ProcessingWithdrawnError();
}
/** Serialize output persistence with withdrawal; never hold this lock across a provider call. */
export async function lockIntelligence(tx: Prisma.TransactionClient, workspaceId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`SELECT "id" FROM "Workspace" WHERE "id" = ${workspaceId} FOR UPDATE`);
  if (!rows.length || await tx.processingControl.findUnique({ where: { workspaceId } })) throw new ProcessingWithdrawnError();
}
export async function withdrawIntelligence(userId: string, noticeVersion: string) {
  if (noticeVersion !== PROCESSING_NOTICE) throw new Error("PROCESSING_NOTICE_REQUIRED");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "owner") throw new Error("OWNER_REQUIRED");
  const workspace = await ensureWorkspace(userId);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Workspace" WHERE "id" = ${workspace.id} FOR UPDATE`);
    const existing = await tx.processingControl.findUnique({ where: { workspaceId: workspace.id } });
    if (existing) return existing;
    const control = await tx.processingControl.create({ data: { workspaceId: workspace.id, withdrawnAt: new Date(), noticeVersion } });
    await tx.outboxEvent.updateMany({ where: { eventType: { in: INTELLIGENCE_EVENTS }, status: { in: ["queued", "retryable_failure", "terminal_failure"] }, payload: { path: ["workspaceId"], equals: workspace.id } }, data: { status: "cancelled", lastError: { code: "PROCESSING_WITHDRAWN" } } });
    await tx.idempotencyRecord.create({ data: { id: randomUUID(), principalUserId: userId, action: "processing.withdraw", requestKey: workspace.id, payloadHash: noticeVersion, response: { noticeVersion, purpose: "DOCUMENT_INTELLIGENCE", futureProcessingStopped: true, previouslyDispatchedDataNotRecalled: true } } });
    return control;
  });
}

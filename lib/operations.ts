import { prisma } from "@/lib/prisma";
import { redactedProviderHealth } from "@/lib/providers";
import { Prisma } from "@/lib/generated/prisma/client";
import { randomUUID } from "node:crypto";
const DOCUMENT_HANDLERS = ["SCAN_DOCUMENT", "PARSE_DOCUMENT", "OCR_DOCUMENT", "AI_EXTRACT_DOCUMENT"];

export class OperationsAccessError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}

export async function requireLocalOperator(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "operator") throw new OperationsAccessError("OPERATOR_REQUIRED", 403);
  // A database role is not sufficient assurance for hosted support access.
  if (!["local", "test"].includes(process.env.APP_ENV ?? "") || process.env.NODE_ENV === "production") {
    throw new OperationsAccessError("OPERATOR_STRONG_AUTH_NOT_CONFIGURED", 403);
  }
}

export async function operationsSnapshot(userId: string) {
  await requireLocalOperator(userId);
  const [counts, failures] = await Promise.all([
    prisma.outboxEvent.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.outboxEvent.findMany({
      where: { status: { in: ["terminal_failure", "retryable_failure"] } },
      orderBy: { createdAt: "desc" }, take: 50,
      // Do not fetch payload, error text, tenant/document identifiers or worker paths.
      select: { id: true, eventType: true, status: true, attempts: true, maxAttempts: true, createdAt: true, nextAttemptAt: true },
    }),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    providers: redactedProviderHealth().providers,
    providerEvidence: "Configuration only; not a live availability or release check.",
    queue: counts.map(row => ({ status: row.status, count: row._count._all })), failures: failures.map(({ eventType, ...row }) => ({ ...row, handler: DOCUMENT_HANDLERS.includes(eventType) ? eventType : "OTHER", canCancel: DOCUMENT_HANDLERS.includes(eventType), failureReason: row.status === "terminal_failure" ? "Attempt budget exhausted" : "Handler reported a retryable failure" })),
    retryPolicy: "Failed document jobs may be cancelled after current-source checks. Operator replay is disabled. Owners may use the separately audited, same-version scan recovery control.",
  };
}

export async function cancelFailedDocumentJob(operatorId: string, jobId: string) {
  await requireLocalOperator(operatorId);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "OutboxEvent" WHERE "id" = ${jobId} FOR UPDATE`);
    const job = await tx.outboxEvent.findUnique({ where: { id: jobId } });
    const receipt = await tx.idempotencyRecord.findUnique({ where: { principalUserId_action_requestKey: { principalUserId: operatorId, action: "operations.document.cancel", requestKey: jobId } } });
    if (receipt) return { id: jobId, status: "cancelled", duplicate: true };
    if (!job || !DOCUMENT_HANDLERS.includes(job.eventType) || !["terminal_failure", "retryable_failure"].includes(job.status) || job.lockedBy) throw new OperationsAccessError("JOB_CANCEL_NOT_ALLOWED", 409);
    const payload = job.payload as Record<string, unknown> | null;
    if (!payload || typeof payload.documentVersionId !== "string" || typeof payload.workspaceId !== "string") throw new OperationsAccessError("JOB_SOURCE_UNAVAILABLE", 409);
    const source = await tx.documentVersion.findFirst({ where: { id: payload.documentVersionId, workspaceId: payload.workspaceId, documentId: job.aggregateId }, include: { document: { include: { property: true } } } });
    if (!source || source.document.version !== source.version || source.document.deletedAt || source.document.archivedAt || (source.document.propertyId && source.document.property?.status !== "active")) throw new OperationsAccessError("JOB_SOURCE_UNAVAILABLE", 409);
    await tx.outboxEvent.update({ where: { id: jobId }, data: { status: "cancelled", lastError: { code: "OPERATOR_CANCELLED" } } });
    await tx.idempotencyRecord.create({ data: { id: randomUUID(), principalUserId: operatorId, action: "operations.document.cancel", requestKey: jobId, payloadHash: jobId, response: { status: "cancelled", handler: job.eventType, sourceChecked: true } } });
    return { id: jobId, status: "cancelled", duplicate: false };
  });
}

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

export class PrivacyRequestError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}
export async function listPrivacyRequests(userId: string) {
  return prisma.privacyRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, kind: true, propertyId: true, status: true, createdAt: true, cancelledAt: true, exportScope: true, expiresAt: true, completedAt: true, failureCode: true } });
}
export async function createPrivacyRequest(userId: string, input: { kind: string; propertyId?: string; requestKey: string; confirmed: boolean }) {
  if (!input.confirmed || !["EXPORT_ACCOUNT", "DELETE_ACCOUNT", "DELETE_PROPERTY"].includes(input.kind) || !/^[a-zA-Z0-9-]{16,80}$/.test(input.requestKey)) throw new PrivacyRequestError("INVALID_PRIVACY_REQUEST", 400);
  if ((input.kind === "DELETE_PROPERTY") !== (input.propertyId !== undefined) || input.propertyId === "") throw new PrivacyRequestError("INVALID_PRIVACY_SCOPE", 400);
  if (input.propertyId && !await prisma.property.findFirst({ where: { id: input.propertyId, workspace: { ownerUserId: userId } }, select: { id: true } })) throw new PrivacyRequestError("RESOURCE_NOT_FOUND", 404);
  return prisma.$transaction(async tx => {
    // Serialize request-key replay and per-account request quotas.
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "user" WHERE "id" = ${userId} FOR UPDATE`);
    const previous = await tx.privacyRequest.findUnique({ where: { userId_requestKey: { userId, requestKey: input.requestKey } } });
    if (previous) {
      if (previous.kind !== input.kind || previous.propertyId !== (input.propertyId ?? null)) throw new PrivacyRequestError("REQUEST_KEY_CONFLICT", 409);
      return previous;
    }
    if (await tx.privacyRequest.count({ where: { userId, createdAt: { gt: new Date(Date.now() - 86_400_000) } } }) >= 10) throw new PrivacyRequestError("REQUEST_LIMIT_REACHED", 429);
    const outstanding = await tx.privacyRequest.findFirst({ where: { userId, kind: input.kind, propertyId: input.propertyId ?? null, status: { in: ["AWAITING_POLICY", "QUEUED", "PROCESSING"] } } });
    if (outstanding) throw new PrivacyRequestError("REQUEST_ALREADY_PENDING", 409);
    return tx.privacyRequest.create({ data: { id: randomUUID(), userId, kind: input.kind, propertyId: input.propertyId, requestKey: input.requestKey } });
  });
}
export async function cancelPrivacyRequest(userId: string, id: string) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "PrivacyRequest" WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE`);
    const row = await tx.privacyRequest.findFirst({ where: { id, userId } });
    if (!row) throw new PrivacyRequestError("RESOURCE_NOT_FOUND", 404);
    if (row.status === "CANCELLED") return { id, status: row.status };
    if (row.status !== "AWAITING_POLICY" && !(row.kind === "EXPORT_ACCOUNT" && ["QUEUED", "PROCESSING", "READY", "FAILED"].includes(row.status))) throw new PrivacyRequestError("REQUEST_CANCELLATION_CLOSED", 409);
    await tx.privacyRequest.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    await tx.outboxEvent.updateMany({ where: { aggregateId: id, eventType: "GENERATE_ACCOUNT_EXPORT", status: { in: ["queued", "retryable_failure", "terminal_failure"] } }, data: { status: "cancelled", lastError: { code: "OWNER_CANCELLED" } } });
    return { id, status: "CANCELLED" };
  });
}

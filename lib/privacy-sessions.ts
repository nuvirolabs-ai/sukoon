import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function listOwnerSessions(userId: string, currentSessionId: string) {
  const rows = await prisma.session.findMany({ where: { userId, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, expiresAt: true } });
  return rows.map(row => ({ ...row, current: row.id === currentSessionId }));
}

export async function revokeOtherOwnerSessions(userId: string, currentSessionId: string) {
  return prisma.$transaction(async tx => {
    // Recheck session within the transaction; never trust a client-supplied user/session scope.
    const current = await tx.session.findFirst({ where: { id: currentSessionId, userId, expiresAt: { gt: new Date() } } });
    if (!current) throw new Error("SESSION_REQUIRED");
    const result = await tx.session.deleteMany({ where: { userId, id: { not: currentSessionId } } });
    // Existing principal-scoped action ledger: no tokens, IPs or device fingerprints.
    await tx.idempotencyRecord.create({ data: { id: randomUUID(), principalUserId: userId, action: "privacy.sessions.revoke_others", requestKey: randomUUID(), payloadHash: "no-private-payload", response: { revoked: result.count } } });
    return { revoked: result.count };
  });
}

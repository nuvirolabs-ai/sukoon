import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { authorizePurchaseCandidate, authorizePurchaseWorkspace, AuthorizationError, type Principal } from "@/lib/authz";
import { rupeesToPaise } from "@/lib/money";

import { PURCHASE_STAGES } from "@/lib/purchase-stages";
const fail = (code: string, status = 400): never => { throw new AuthorizationError(code, status, code.replaceAll("_", " ")); };
function text(value: unknown, required = false, max = 2000): string | null {
  if (value === undefined || value === null || value === "") { if (required) return fail("VALUE_REQUIRED"); return null; }
  if (typeof value !== "string" || !value.trim() || value.length > max) return fail("INVALID_TEXT");
  return value.trim();
}
function key(value: unknown) { const result = text(value, true, 100)!; if (!/^[a-zA-Z0-9_-]{16,100}$/.test(result)) return fail("REQUEST_KEY_REQUIRED"); return result; }
function money(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value !== "string" && typeof value !== "number") return fail("INVALID_AMOUNT");
  try { const amount = rupeesToPaise(value); if (amount !== null && amount < 0n) return fail("INVALID_AMOUNT"); return amount; } catch { return fail("INVALID_AMOUNT"); }
}
export function candidateInput(input: Record<string, unknown>) {
  const areaValue = text(input.areaValue, false, 30), areaUnit = text(input.areaUnit, false, 20);
  if ((areaValue === null) !== (areaUnit === null) || (areaValue && (!/^\d+(\.\d{1,6})?$/.test(areaValue) || Number(areaValue) <= 0)) || (areaUnit && !["sqft", "sqm", "acre", "hectare"].includes(areaUnit))) return fail("AREA_AND_ORIGINAL_UNIT_REQUIRED");
  const stage = input.stage ?? "CONSIDERING";
  if (!PURCHASE_STAGES.includes(stage as typeof PURCHASE_STAGES[number])) return fail("INVALID_PURCHASE_STAGE");
  return { name: text(input.name, true, 200)!, propertyType: text(input.propertyType, false, 80), location: text(input.location, false, 500), areaValue, areaUnit, askingPricePaise: money(input.askingPrice), budgetPaise: money(input.budget), source: text(input.source, false, 500), notes: text(input.notes), stage: stage as string };
}
const comparable = (value: unknown) => JSON.stringify(value, (_key, v) => typeof v === "bigint" ? v.toString() : v);

export async function purchaseSnapshot(principal: Principal, id?: string) {
  if (id && !await authorizePurchaseWorkspace(principal, id)) return fail("PURCHASE_NOT_FOUND", 404);
  return prisma.purchaseWorkspace.findMany({ where: { workspaceId: principal.workspaceId, ...(id ? { id } : {}) }, select: { id: true, name: true, version: true, candidates: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, propertyType: true, location: true, areaValue: true, areaUnit: true, askingPricePaise: true, budgetPaise: true, source: true, notes: true, stage: true, transactionPhase: true, lifecycle: true, linkedPropertyId: true, version: true, entries: { orderBy: { createdAt: "asc" }, select: { id: true, kind: true, body: true, state: true, dueDate: true, createdAt: true } } } } }, orderBy: { createdAt: "desc" } });
}
export async function purchaseCommand(principal: Principal, input: Record<string, unknown>) {
  const requestKey = key(input.requestKey);
  if (input.action === "create-workspace") {
    const name = text(input.name, true, 200)!;
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${principal.workspaceId} FOR UPDATE`;
      const prior = await tx.purchaseWorkspace.findUnique({ where: { requestKey } });
      if (prior) { if (prior.workspaceId !== principal.workspaceId || prior.name !== name) return fail("REQUEST_CONFLICT", 409); return { id: prior.id }; }
      return tx.purchaseWorkspace.create({ data: { id: randomUUID(), workspaceId: principal.workspaceId, name, requestKey }, select: { id: true } });
    });
  }
  if (input.action === "add-candidate") {
    const purchaseWorkspaceId = text(input.purchaseWorkspaceId, true, 100)!;
    if (!await authorizePurchaseWorkspace(principal, purchaseWorkspaceId)) return fail("PURCHASE_NOT_FOUND", 404);
    const values = candidateInput(input);
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "PurchaseWorkspace" WHERE id = ${purchaseWorkspaceId} FOR UPDATE`;
      const prior = await tx.purchaseCandidate.findUnique({ where: { requestKey } });
      if (prior) { if (prior.workspaceId !== principal.workspaceId || prior.purchaseWorkspaceId !== purchaseWorkspaceId || comparable(Object.fromEntries(Object.keys(values).map(k => [k, prior[k as keyof typeof prior]]))) !== comparable(values)) return fail("REQUEST_CONFLICT", 409); return { id: prior.id }; }
      return tx.purchaseCandidate.create({ data: { id: randomUUID(), workspaceId: principal.workspaceId, purchaseWorkspaceId, requestKey, ...values }, select: { id: true } });
    });
  }
  const candidateId = text(input.candidateId, true, 100)!;
  const candidate = await authorizePurchaseCandidate(principal, candidateId);
  if (!candidate) return fail("CANDIDATE_NOT_FOUND", 404);
  if (input.action === "add-entry") {
    const kind = text(input.kind, true, 30)!, body = text(input.body, true)!;
    if (!["QUESTION", "NOTE", "DOCUMENT_REQUEST"].includes(kind)) return fail("INVALID_ENTRY_KIND");
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "PurchaseCandidate" WHERE id = ${candidateId} FOR UPDATE`;
      const prior = await tx.purchaseEntry.findUnique({ where: { requestKey } });
      if (prior) { if (prior.workspaceId !== principal.workspaceId || prior.candidateId !== candidateId || prior.kind !== kind || prior.body !== body) return fail("REQUEST_CONFLICT", 409); return { id: prior.id }; }
      const dueDate = typeof input.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ? input.dueDate : null;
      return tx.purchaseEntry.create({ data: { id: randomUUID(), candidateId, workspaceId: principal.workspaceId, kind, body, dueDate, requestKey }, select: { id: true } });
    });
  }
  if (input.action === "update-candidate") {
    if (!Number.isInteger(input.version)) return fail("CANDIDATE_VERSION_REQUIRED", 409);
    const values = candidateInput(input);
    return prisma.$transaction(async tx => {
      const changed = await tx.purchaseCandidate.updateMany({ where: { id: candidateId, workspaceId: principal.workspaceId, version: input.version as number }, data: { ...values, version: { increment: 1 } } });
      if (changed.count !== 1) return fail("CANDIDATE_VERSION_CONFLICT", 409);
      await tx.purchaseEntry.create({ data: { id: randomUUID(), candidateId, workspaceId: principal.workspaceId, kind: "HISTORY", body: comparable({ previous: { name: candidate.name, propertyType: candidate.propertyType, location: candidate.location, areaValue: candidate.areaValue, areaUnit: candidate.areaUnit, askingPricePaise: candidate.askingPricePaise, budgetPaise: candidate.budgetPaise, source: candidate.source, notes: candidate.notes, stage: candidate.stage }, next: values, actorUserId: principal.userId }), requestKey } });
      return { id: candidateId };
    });
  }
  return fail("INVALID_PURCHASE_ACTION");
}

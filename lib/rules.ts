import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireLocalOperator, OperationsAccessError } from "@/lib/operations";

export const RULE_STATUSES = ["DRAFT", "IN_REVIEW", "PUBLISHED", "EXPIRED", "RETIRED"] as const;
export type RuleStatus = (typeof RULE_STATUSES)[number];
export type RuleApplicability = "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";

// This is a neutral vocabulary for owner-entered records. It intentionally
// does not say that any category is legally required.
export { DOCUMENT_TAXONOMY } from "@/lib/types";

export type RuleInput = {
  stableKey: string;
  version?: number;
  contentType?: string;
  title: string;
  description: string;
  category: string;
  jurisdiction?: string | null;
  propertyType?: string | null;
  ownershipContext?: string | null;
  evidenceCategory?: string | null;
  requiresConfirmation?: boolean;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  sourceName?: string | null;
  sourceReference?: unknown;
  sourcePublishedDate?: string | null;
  reviewer?: string | null;
  reviewedAt?: string | Date | null;
  supersedesId?: string | null;
};

export class RuleInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "RuleInputError";
    this.code = code;
    this.status = status;
  }
}

function text(value: unknown, label: string, required = true, max = 500) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new RuleInputError("RULE_INPUT_INVALID", `${label} is required.`);
    return null;
  }
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > max) {
    throw new RuleInputError("RULE_INPUT_INVALID", `${label} is invalid.`);
  }
  return value.trim();
}

function dateOnly(value: unknown, label: string, required = true) {
  const result = text(value, label, required, 10);
  if (result === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new RuleInputError("RULE_DATE_INVALID", `${label} must be YYYY-MM-DD.`);
  const parsed = new Date(`${result}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw new RuleInputError("RULE_DATE_INVALID", `${label} is not a real calendar date.`);
  return result;
}

function jsonValue(value: unknown) {
  if (value === undefined || value === null) return undefined;
  try { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; } catch { throw new RuleInputError("RULE_SOURCE_INVALID", "Source reference must be JSON."); }
}

function reviewedAt(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const result = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(result.getTime())) throw new RuleInputError("RULE_REVIEW_DATE_INVALID", "Review date is invalid.");
  return result;
}

function normaliseType(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  if (!normalized) return null;
  const aliases: Record<string, string> = { flat: "residential_flat", villa: "residential_villa", plot: "residential_plot", agri: "agricultural_land" };
  return aliases[normalized] ?? normalized;
}

function normalise(value: string | null | undefined) { return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? ""; }

export function evaluateRuleApplicability(rule: { effectiveFrom: string; effectiveUntil: string | null; jurisdiction: string | null; propertyType: string | null; ownershipContext: string | null }, property: { jurisdiction: string; type: string; coOwners: string | null }, asOf = new Date().toISOString().slice(0, 10)): RuleApplicability {
  if (asOf < rule.effectiveFrom || (rule.effectiveUntil !== null && asOf > rule.effectiveUntil)) return "NOT_APPLICABLE";
  if (rule.jurisdiction) {
    if (!property.jurisdiction.trim()) return "UNKNOWN";
    if (normalise(property.jurisdiction) !== normalise(rule.jurisdiction)) return "NOT_APPLICABLE";
  }
  if (rule.propertyType) {
    if (!property.type.trim()) return "UNKNOWN";
    if (normaliseType(property.type) !== normaliseType(rule.propertyType)) return "NOT_APPLICABLE";
  }
  if (rule.ownershipContext) {
    const context = property.coOwners?.trim() ? "joint" : "self";
    if (rule.ownershipContext.trim().toLowerCase() !== context) return "UNKNOWN";
  }
  return "APPLICABLE";
}

async function operatorUser(userId: string) {
  try { await requireLocalOperator(userId); } catch (error) { if (error instanceof OperationsAccessError) throw new RuleInputError(error.code, "Local operator access required; hosted stronger authentication is not configured.", error.status); throw error; }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "operator") throw new RuleInputError("OPERATOR_REQUIRED", "Only an operator may edit or publish rules.", 403);
  return user;
}

function validatedInput(input: RuleInput) {
  const effectiveFrom = dateOnly(input.effectiveFrom, "Effective from") as string;
  const effectiveUntil = dateOnly(input.effectiveUntil, "Effective until", false);
  if (effectiveUntil && effectiveUntil < effectiveFrom) throw new RuleInputError("RULE_DATE_INVALID", "Effective until must be on or after effective from.");
  const category = text(input.category, "Category", true, 80) as string;
  const contentType = text(input.contentType ?? "checklist", "Content type", true, 40) as string;
  if (!["checklist", "do", "dont", "explanation"].includes(contentType)) throw new RuleInputError("RULE_INPUT_INVALID", "Content type is invalid.");
  const sourceReference = jsonValue(input.sourceReference);
  return {
    stableKey: text(input.stableKey, "Stable key", true, 120) as string,
    version: input.version === undefined ? undefined : Number.isInteger(input.version) && input.version > 0 ? input.version : (() => { throw new RuleInputError("RULE_INPUT_INVALID", "Version is invalid."); })(),
    contentType,
    title: text(input.title, "Title", true, 200) as string,
    description: text(input.description, "Description", true, 2_000) as string,
    category,
    jurisdiction: text(input.jurisdiction, "Jurisdiction", false, 160),
    propertyType: text(input.propertyType, "Property type", false, 80),
    ownershipContext: text(input.ownershipContext, "Ownership context", false, 80),
    evidenceCategory: text(input.evidenceCategory, "Evidence category", false, 80),
    requiresConfirmation: input.requiresConfirmation === true,
    effectiveFrom,
    effectiveUntil,
    sourceName: text(input.sourceName, "Source name", false, 240),
    sourceReference,
    sourcePublishedDate: dateOnly(input.sourcePublishedDate, "Source published date", false),
    reviewer: text(input.reviewer, "Reviewer", false, 160),
    reviewedAt: reviewedAt(input.reviewedAt),
    supersedesId: text(input.supersedesId, "Superseded rule", false, 80),
  };
}

function auditData(ruleId: string, actorUserId: string, action: string, fromStatus: string | null, toStatus: string | null, detail?: unknown) {
  return { id: randomUUID(), ruleId, actorUserId, action, fromStatus, toStatus, detail: jsonValue(detail) };
}

export async function createRuleDraftForOperator(actorUserId: string, input: RuleInput) {
  await operatorUser(actorUserId);
  const value = validatedInput(input);
  const rule = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${value.stableKey}, 0))`);
    const latest = (await tx.checklistRule.aggregate({ where: { stableKey: value.stableKey }, _max: { version: true } }))._max.version ?? 0;
    const version = value.version ?? latest + 1;
    if (version <= latest) throw new RuleInputError("RULE_VERSION_CONFLICT", "Create a new version from the latest rule.", 409);
    const created = await tx.checklistRule.create({ data: { id: randomUUID(), ...value, version, status: "DRAFT" } });
    await tx.ruleAuditEvent.create({ data: auditData(created.id, actorUserId, "created", null, "DRAFT") });
    return created;
  });
  return rule;
}

export async function updateRuleDraftForOperator(actorUserId: string, ruleId: string, input: Partial<RuleInput>, expectedRevision?: number) {
  await operatorUser(actorUserId);
  const current = await prisma.checklistRule.findUnique({ where: { id: ruleId } });
  if (!current) throw new RuleInputError("RULE_NOT_FOUND", "Rule not found.", 404);
  if (expectedRevision !== undefined && expectedRevision !== current.revision) throw new RuleInputError("RULE_STALE", "Refresh this rule before changing it.", 409);
  if (!["DRAFT", "IN_REVIEW"].includes(current.status)) throw new RuleInputError("RULE_IMMUTABLE", "Published, expired, and retired rules are immutable; create a new version.", 409);
  const merged: RuleInput = { ...current, ...input, reviewedAt: input.reviewedAt ?? current.reviewedAt };
  const value = validatedInput(merged);
  if (value.stableKey !== current.stableKey || value.supersedesId !== current.supersedesId) throw new RuleInputError("RULE_IDENTITY_IMMUTABLE", "Rule identity cannot be edited.", 409);
  const contentChanged = (["title", "description", "contentType", "category", "jurisdiction", "propertyType", "ownershipContext", "evidenceCategory", "effectiveFrom", "effectiveUntil", "requiresConfirmation"] as const).some(key => value[key] !== current[key]);
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.checklistRule.updateMany({ where: { id: ruleId, revision: current.revision, status: current.status }, data: { ...value, version: current.version, status: contentChanged ? "DRAFT" : current.status, ...(contentChanged ? { reviewer: null, reviewedAt: null } : {}), revision: { increment: 1 } } });
    if (changed.count !== 1) throw new RuleInputError("RULE_STALE", "Refresh this rule before changing it.", 409);
    const row = await tx.checklistRule.findUniqueOrThrow({ where: { id: ruleId } });
    await tx.ruleAuditEvent.create({ data: auditData(ruleId, actorUserId, "edited", current.status, row.status, { revision: row.revision, reviewInvalidated: contentChanged }) });
    return row;
  });
  return updated;
}

export async function supersedeRuleForOperator(actorUserId: string, ruleId: string, input: RuleInput, expectedRevision?: number) {
  await operatorUser(actorUserId);
  const current = await prisma.checklistRule.findUnique({ where: { id: ruleId } });
  if (!current) throw new RuleInputError("RULE_NOT_FOUND", "Rule not found.", 404);
  if (expectedRevision !== undefined && expectedRevision !== current.revision) throw new RuleInputError("RULE_STALE", "Refresh this rule before changing it.", 409);
  const value = validatedInput({ ...current, ...input, reviewer: input.reviewer ?? null, reviewedAt: input.reviewedAt ?? null, stableKey: current.stableKey, version: current.version + 1, supersedesId: current.id });
  return createRuleDraftForOperator(actorUserId, { ...value, stableKey: current.stableKey, version: current.version + 1, supersedesId: current.id });
}

export async function transitionRuleForOperator(actorUserId: string, ruleId: string, action: "submit" | "publish" | "expire" | "retire", expectedRevision?: number) {
  await operatorUser(actorUserId);
  const current = await prisma.checklistRule.findUnique({ where: { id: ruleId } });
  if (!current) throw new RuleInputError("RULE_NOT_FOUND", "Rule not found.", 404);
  if (expectedRevision !== undefined && expectedRevision !== current.revision) throw new RuleInputError("RULE_STALE", "Refresh this rule before changing it.", 409);
  const next: Record<string, RuleStatus> = { submit: "IN_REVIEW", publish: "PUBLISHED", expire: "EXPIRED", retire: "RETIRED" };
  const toStatus = next[action];
  if ((action === "submit" && current.status !== "DRAFT") || (action === "publish" && current.status !== "IN_REVIEW") || ((action === "expire" || action === "retire") && current.status !== "PUBLISHED")) {
    throw new RuleInputError("RULE_TRANSITION_INVALID", `Cannot ${action} a ${current.status} rule.`, 409);
  }
  if (action === "publish" && (!current.sourceName || !current.sourceReference || !current.reviewer || !current.reviewedAt)) {
    throw new RuleInputError("PUBLICATION_EVIDENCE_REQUIRED", "Publication requires a source, reviewer, and review date.", 422);
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${current.stableKey}, 0))`);
    const changed = await tx.checklistRule.updateMany({ where: { id: ruleId, revision: current.revision, status: current.status }, data: { status: toStatus, revision: { increment: 1 } } });
    if (changed.count !== 1) throw new RuleInputError("RULE_STALE", "Refresh this rule before changing it.", 409);
    if (toStatus === "PUBLISHED") {
      const predecessors = await tx.checklistRule.findMany({ where: { stableKey: current.stableKey, status: "PUBLISHED", id: { not: ruleId } }, select: { id: true } });
      await tx.checklistRule.updateMany({ where: { id: { in: predecessors.map(row => row.id) } }, data: { status: "RETIRED", revision: { increment: 1 } } });
      for (const predecessor of predecessors) await tx.ruleAuditEvent.create({ data: auditData(predecessor.id, actorUserId, "superseded", "PUBLISHED", "RETIRED", { successorId: ruleId }) });
    }
    const row = await tx.checklistRule.findUniqueOrThrow({ where: { id: ruleId } });
    await tx.ruleAuditEvent.create({ data: auditData(ruleId, actorUserId, action, current.status, toStatus) });
    return row;
  });
}

export async function listRulesForOperator(userId: string) {
  await operatorUser(userId);
  return prisma.checklistRule.findMany({ take: 100, orderBy: { updatedAt: "desc" }, include: { auditEvents: { take: 20, orderBy: { createdAt: "desc" } } } });
}

export async function listPublishedRulesForProperty(userId: string, propertyId?: string, asOf = new Date().toISOString().slice(0, 10)) {
  dateOnly(asOf, "As-of date");
  let property: { jurisdiction: string; type: string; coOwners: string | null } | null = null;
  if (propertyId) {
    const workspace = await prisma.workspace.findFirst({ where: { ownerUserId: userId, owner: { role: "owner" } }, select: { id: true } });
    if (!workspace) throw new RuleInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
    property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" }, select: { jurisdiction: true, type: true, coOwners: true } });
    if (!property) throw new RuleInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  }
  const rules = await prisma.checklistRule.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ stableKey: "asc" }, { version: "desc" }] });
  return rules.flatMap((rule) => {
    const applicability = property ? evaluateRuleApplicability(rule, property, asOf) : "APPLICABLE" as const;
    if (property && applicability !== "APPLICABLE" && applicability !== "UNKNOWN") return [];
    return [{ ...rule, applicability }];
  });
}

export async function getRuleForUser(userId: string, ruleId: string) {
  const rule = await prisma.checklistRule.findFirst({ where: { id: ruleId, status: "PUBLISHED" } });
  if (!rule) throw new RuleInputError("RULE_NOT_FOUND", "Rule not found.", 404);
  void userId;
  return rule;
}

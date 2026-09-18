import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getWorkspaceForUser } from "@/lib/repository";
import { evaluateRuleApplicability, type RuleApplicability } from "@/lib/rules";

export type EvidenceState = "SATISFIED" | "MISSING" | "UNKNOWN" | "NOT_APPLICABLE" | "NEEDS_REVIEW";
export type AssessmentStatus = "RECORD_READINESS" | "NOT_ASSESSED";

export class AssessmentInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "AssessmentInputError";
    this.code = code;
    this.status = status;
  }
}

function itemResult(applicability: RuleApplicability, evidenceState: EvidenceState) {
  if (applicability === "NOT_APPLICABLE") return "NOT_APPLICABLE";
  return evidenceState;
}

function evidenceExplanation(rule: { evidenceCategory: string | null; requiresConfirmation: boolean }, state: EvidenceState, documentName?: string) {
  if (state === "SATISFIED") return `Active clean document ${documentName ? `“${documentName}” ` : ""}is confirmed for ${rule.evidenceCategory}.`;
  if (state === "NEEDS_REVIEW") return `A clean ${rule.evidenceCategory ?? "record"} exists, but owner confirmation is still needed before it contributes.`;
  if (state === "MISSING") return `No active clean ${rule.evidenceCategory ?? "record"} was found in this property's vault.`;
  if (state === "UNKNOWN") return "Applicability could not be determined from the current Property Passport; no score contribution was inferred.";
  return "The published rule does not apply to the current Property Passport on this assessment date.";
}

export async function evaluatePropertyHealthForUser(userId: string, propertyId: string, asOf = new Date().toISOString().slice(0, 10)) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new AssessmentInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" } });
  if (!property) throw new AssessmentInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  const [rules, documents] = await Promise.all([
    prisma.checklistRule.findMany({ where: { status: "PUBLISHED", contentType: "checklist" }, orderBy: [{ stableKey: "asc" }, { version: "desc" }] }),
    prisma.propertyDoc.findMany({ where: { workspaceId: workspace.id, propertyId, archivedAt: null, deletedAt: null, scanStatus: "clean" }, include: { versions: { orderBy: { version: "desc" } } }, orderBy: { updatedAt: "desc" } }),
  ]);

  const items = rules.map((rule) => {
    const applicability = evaluateRuleApplicability(rule, property, asOf);
    if (applicability !== "APPLICABLE") {
      const state = applicability === "UNKNOWN" ? "UNKNOWN" : "NOT_APPLICABLE" as const;
      return { rule, applicability, evidenceState: state, result: itemResult(applicability, state), evidenceDocumentId: null, evidenceDocumentVersionId: null, contribution: "excluded", suggestedAction: applicability === "UNKNOWN" ? "Complete the relevant passport context or have an operator review this rule." : null, explanation: evidenceExplanation(rule, state) };
    }
    const evidence = rule.evidenceCategory ? documents.find((doc) => doc.type === rule.evidenceCategory || doc.subtype === rule.evidenceCategory) : undefined;
    if (!rule.evidenceCategory) {
      const state = "UNKNOWN" as const;
      return { rule, applicability, evidenceState: state, result: state, evidenceDocumentId: null, evidenceDocumentVersionId: null, contribution: "excluded", suggestedAction: "Operator must attach a neutral evidence category before this rule can assess a record.", explanation: evidenceExplanation(rule, state) };
    }
    if (!evidence) {
      const state = "MISSING" as const;
      return { rule, applicability, evidenceState: state, result: state, evidenceDocumentId: null, evidenceDocumentVersionId: null, contribution: "not_satisfied", suggestedAction: `Add a ${rule.evidenceCategory} record to this property's private vault.`, explanation: evidenceExplanation(rule, state) };
    }
    const currentVersion = evidence.versions.find((version) => version.version === evidence.version) ?? evidence.versions[0];
    if (currentVersion?.scanStatus === "clean" && (evidence.reviewStatus === "confirmed" || !rule.requiresConfirmation)) {
      const state = "SATISFIED" as const;
      return { rule, applicability, evidenceState: state, result: state, evidenceDocumentId: evidence.id, evidenceDocumentVersionId: currentVersion.id, contribution: "satisfied", suggestedAction: null, explanation: evidenceExplanation(rule, state, evidence.displayName || evidence.name) };
    }
    const state = "NEEDS_REVIEW" as const;
    return { rule, applicability, evidenceState: state, result: state, evidenceDocumentId: evidence.id, evidenceDocumentVersionId: currentVersion?.id ?? null, contribution: "not_satisfied", suggestedAction: "Review and confirm the clean evidence in the private vault.", explanation: evidenceExplanation(rule, state, evidence.displayName || evidence.name) };
  });

  const applicable = items.filter((item) => item.applicability === "APPLICABLE");
  const satisfied = applicable.filter((item) => item.evidenceState === "SATISFIED");
  const unknown = items.filter((item) => item.evidenceState === "UNKNOWN");
  const assessment: AssessmentStatus = applicable.length ? "RECORD_READINESS" : "NOT_ASSESSED";
  const score = applicable.length ? Math.round((satisfied.length / applicable.length) * 100) : null;
  const snapshot = await prisma.$transaction(async (tx) => {
    const created = await tx.assessmentSnapshot.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, propertyVersion: property.version, assessment, score, applicableCount: applicable.length, satisfiedCount: satisfied.length, unknownCount: unknown.length, evaluatorUserId: userId } });
    if (items.length) {
      await tx.assessmentItem.createMany({ data: items.map((item) => ({ id: randomUUID(), workspaceId: workspace.id, snapshotId: created.id, propertyId, ruleId: item.rule.id, ruleStableKey: item.rule.stableKey, ruleVersion: item.rule.version, requirement: item.rule.title, applicability: item.applicability, evidenceState: item.evidenceState, evidenceDocumentId: item.evidenceDocumentId, evidenceDocumentVersionId: item.evidenceDocumentVersionId, contribution: item.contribution, result: item.result, suggestedAction: item.suggestedAction, explanation: item.explanation })) });
    }
    await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, date: asOf, title: assessment === "NOT_ASSESSED" ? "Record readiness not assessed" : "Record readiness assessed", detail: `${satisfied.length}/${applicable.length} applicable published rule${applicable.length === 1 ? "" : "s"} satisfied; unknown ${unknown.length}.`, kind: "doc" } });
    return created;
  });
  return getAssessmentSnapshotForUser(userId, propertyId, snapshot.id);
}

export async function getAssessmentSnapshotForUser(userId: string, propertyId: string, snapshotId?: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new AssessmentInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" }, select: { id: true } });
  if (!property) throw new AssessmentInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  const snapshot = await prisma.assessmentSnapshot.findFirst({ where: { workspaceId: workspace.id, propertyId, ...(snapshotId ? { id: snapshotId } : {}) }, orderBy: { evaluatedAt: "desc" }, include: { items: { orderBy: { ruleStableKey: "asc" }, include: { rule: { select: { sourceName: true, sourceReference: true, sourcePublishedDate: true, reviewer: true, reviewedAt: true, status: true } } } } } });
  if (!snapshot) return null;
  return snapshot;
}

export async function listAssessmentHistoryForUser(userId: string, propertyId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new AssessmentInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" }, select: { id: true } });
  if (!property) throw new AssessmentInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  return prisma.assessmentSnapshot.findMany({ where: { workspaceId: workspace.id, propertyId }, orderBy: { evaluatedAt: "desc" }, include: { items: { orderBy: { ruleStableKey: "asc" } } } });
}

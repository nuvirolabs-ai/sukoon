import { randomUUID } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { DOCUMENT_CATEGORIES, getDocumentForUser, recordVaultHistory } from "@/lib/vault-repository";
import type { DocType } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { intelligenceAllowed, lockIntelligence } from "@/lib/processing-consent";

export type ReviewAction = "accept" | "edit" | "reject";

/** Owner classification, not extraction, authenticity, legal approval or verification. */
export async function confirmManualDocumentReview(input: { userId: string; documentId: string; documentVersion: number; category: string }) {
  const { row } = await getDocumentForUser(input.userId, input.documentId, false);
  if (!DOCUMENT_CATEGORIES.includes(input.category as DocType)) throw new ReviewInputError("INVALID_CATEGORY", "Choose a supported document category.");
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "PropertyDoc" WHERE id = ${row.id} AND "workspaceId" = ${row.workspaceId} FOR UPDATE`;
    const current = await tx.propertyDoc.findFirst({ where: { id: row.id, workspaceId: row.workspaceId, version: input.documentVersion, scanStatus: "clean", archivedAt: null, deletedAt: null } });
    if (current?.reviewStatus === "confirmed" && current.type === input.category) {
      const confirmed = await tx.documentVersion.findFirst({ where: { documentId: row.id, version: input.documentVersion, scanStatus: "clean", reviewStatus: "confirmed" } });
      if (confirmed) return { documentId: row.id, documentVersionId: confirmed.id, reviewStatus: "confirmed", scope: "classification_only" };
    }
    const changed = await tx.propertyDoc.updateMany({ where: { id: row.id, workspaceId: row.workspaceId, version: input.documentVersion, scanStatus: "clean", archivedAt: null, deletedAt: null }, data: { type: input.category, reviewStatus: "confirmed" } });
    if (changed.count !== 1) throw new ReviewInputError("DOCUMENT_REVIEW_BLOCKED", "Reload the document. This exact version must pass scanning before manual review.", 423);
    const version = await tx.documentVersion.findFirst({ where: { documentId: row.id, workspaceId: row.workspaceId, version: input.documentVersion, scanStatus: "clean" } });
    if (!version) throw new ReviewInputError("DOCUMENT_REVIEW_BLOCKED", "A scanned source version is required.", 423);
    await tx.documentVersion.update({ where: { id: version.id }, data: { reviewStatus: "confirmed" } });
    await recordVaultHistory(tx, row, { date: new Date().toISOString().slice(0, 10), title: "User manually classified document", detail: JSON.stringify({ actorUserId: input.userId, documentId: row.id, documentVersionId: version.id, sha256: version.sha256, category: input.category, reviewedAt: new Date().toISOString(), scope: "classification_only" }), kind: "doc" });
    return { documentId: row.id, documentVersionId: version.id, reviewStatus: "confirmed", scope: "classification_only" };
  });
}

export class ReviewInputError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ReviewInputError";
    this.code = code;
    this.status = status;
  }
}

const CANONICAL_FIELDS = new Set(["ownerName", "address", "city", "area", "jurisdiction", "areaValue", "purchaseDate"]);

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? nested.toString() : nested)) as Prisma.InputJsonValue;
}

function proposalText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  throw new ReviewInputError("INVALID_REVIEW_VALUE", "This proposal cannot be applied as a text property fact.");
}

export async function getReviewForUser(userId: string, documentId: string) {
  const { row } = await getDocumentForUser(userId, documentId, false);
  const runs = await prisma.aiExtractionRun.findMany({ where: { workspaceId: row.workspaceId, documentId: row.id }, include: { proposals: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" } });
  const parsingRuns = await prisma.documentParsingRun.findMany({ where: { workspaceId: row.workspaceId, documentId: row.id }, orderBy: { createdAt: "desc" } });
  const ocrRuns = await prisma.documentOcrRun.findMany({ where: { workspaceId: row.workspaceId, documentId: row.id }, orderBy: { createdAt: "desc" } });
  if (!await intelligenceAllowed(row.workspaceId)) throw new ReviewInputError("PROCESSING_WITHDRAWN", "Extracted output is suppressed after withdrawal. Manual classification remains available.", 403);
  return {
    document: {
      id: row.id,
      propertyId: row.propertyId,
      type: row.type,
      name: row.displayName || row.name,
      version: row.version,
      scanStatus: row.scanStatus,
      processingState: row.processingState,
      reviewStatus: row.reviewStatus,
    },
    parsingRuns,
    ocrRuns,
    aiRuns: runs,
  };
}

export async function reviewProposalForUser(input: { userId: string; documentId: string; proposalId: string; action: ReviewAction; value?: unknown; propertyVersion?: number }) {
  if (!input.proposalId.trim()) throw new ReviewInputError("INVALID_PROPOSAL", "A proposal is required.");
  if (!(["accept", "edit", "reject"] as ReviewAction[]).includes(input.action)) throw new ReviewInputError("INVALID_REVIEW_ACTION", "Choose accept, edit, or reject.");
  const { workspace, row: document } = await getDocumentForUser(input.userId, input.documentId, false);
  if (!await intelligenceAllowed(workspace.id)) throw new ReviewInputError("PROCESSING_WITHDRAWN", "Extracted output is suppressed after withdrawal.", 403);
  const proposal = await prisma.aiFieldProposal.findFirst({ where: { id: input.proposalId, workspaceId: workspace.id, documentId: document.id }, include: { run: true } });
  if (!proposal) throw new ReviewInputError("RESOURCE_NOT_FOUND", "Proposal not found.", 404);
  if (proposal.state !== "proposed") return { proposal, propertyVersion: undefined, duplicate: true };
  if (input.action !== "reject" && (!Number.isInteger(input.propertyVersion) || input.propertyVersion === undefined)) throw new ReviewInputError("PROPERTY_VERSION_REQUIRED", "The current Property Passport version is required.");

  const value = input.action === "reject" ? undefined : input.action === "edit" ? proposalText(input.value) : proposalText(proposal.proposedValue);
  if (input.action !== "reject" && !CANONICAL_FIELDS.has(proposal.fieldName)) throw new ReviewInputError("FIELD_NOT_APPLICABLE", "This proposal is not eligible to update a Property Passport fact.");
  const result = await prisma.$transaction(async (tx) => {
    await lockIntelligence(tx, workspace.id);
    if (!document.propertyId) throw new ReviewInputError("PROPERTY_CONTEXT_REQUIRED", "Purchase evidence cannot update an owned Property Passport.", 409);
    const property = await tx.property.findFirst({ where: { id: document.propertyId, workspaceId: workspace.id, status: "active" } });
    if (!property) throw new ReviewInputError("RESOURCE_NOT_FOUND", "Property not found.", 404);
    if (input.action !== "reject" && property.version !== input.propertyVersion) throw new ReviewInputError("PROPERTY_VERSION_CONFLICT", "The Property Passport changed while this review was open. Reload before applying.", 409);
    const proposalUpdate = await tx.aiFieldProposal.update({ where: { id: proposal.id }, data: { state: input.action === "reject" ? "rejected" : input.action === "edit" ? "edited" : "accepted", acceptedValue: value === undefined ? Prisma.JsonNull : jsonValue(value) } });
    if (input.action !== "reject" && value !== undefined) {
      const previousValue = property[proposal.fieldName as keyof typeof property];
      await tx.property.update({ where: { id: property.id }, data: { [proposal.fieldName]: value, version: { increment: 1 } } });
      await tx.propertyHistory.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: property.id, actorUserId: input.userId, field: proposal.fieldName, previousValue: previousValue === null || previousValue === undefined ? undefined : jsonValue(previousValue), nextValue: jsonValue(value), source: "user_confirmed" } });
      await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: property.id, date: new Date().toISOString().slice(0, 10), title: `Document field ${input.action === "edit" ? "edited" : "accepted"}: ${proposal.fieldName}`, detail: `Source: ${document.displayName || document.name}; proposal ${proposal.id}`, kind: "doc" } });
    }
    const allProposals = await tx.aiFieldProposal.findMany({ where: { workspaceId: workspace.id, documentId: document.id }, select: { state: true } });
    const pending = allProposals.some((item) => item.state === "proposed");
    const accepted = allProposals.some((item) => item.state === "accepted" || item.state === "edited");
    await tx.propertyDoc.update({ where: { id: document.id }, data: { reviewStatus: pending ? accepted ? "partially_confirmed" : "in_review" : accepted ? "confirmed" : "partially_confirmed" } });
    return { proposal: proposalUpdate, propertyVersion: input.action === "reject" ? property.version : property.version + 1, duplicate: false };
  }, { timeout: 15000 });
  return result;
}

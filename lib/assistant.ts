import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getWorkspaceForUser } from "@/lib/repository";
import { authorizeSharedProperty, getActiveSharesForUser, shareScopeAllows } from "@/lib/authz";

const MAX_INPUT = 2_000;
const WINDOW_MS = 15 * 60 * 1_000;
const MAX_REQUESTS = 20;

export class AssistantInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) { super(message); this.name = "AssistantInputError"; this.code = code; this.status = status; }
}

type Citation = { kind: string; id: string; title: string; href: string; recordType: string; versionId?: string; page?: number; chunk?: number };
type Context = { mode: "owner" | "delegate"; workspaceId: string; property: { id: string; name: string; type: string; city: string; area: string; address: string }; grants: Awaited<ReturnType<typeof getActiveSharesForUser>> };

function cleanQuestion(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.length > MAX_INPUT) throw new AssistantInputError("ASSISTANT_INPUT_INVALID", "Ask a question between 1 and 2,000 characters.");
  return value.trim();
}
function money(value: bigint | null | undefined) { return value === null || value === undefined ? 0n : value; }
function rupees(value: bigint) { return Number(value) / 100; }
function terms(question: string) { return question.toLowerCase().split(/\s+/).filter((term) => term.length > 2); }
function hasAny(value: string, words: string[]) { return words.some((word) => value.includes(word)); }
function providerEnvironment() { return process.env.NODE_ENV === "test" ? "fixture_test_only" : "unavailable_local"; }
function citation(kind: string, id: string, title: string, href: string, recordType: string, extra: Partial<Citation> = {}): Citation { return { kind, id, title, href, recordType, ...extra }; }

async function contextForUser(userId: string, propertyId?: unknown): Promise<Context> {
  const ownerWorkspace = await getWorkspaceForUser(userId);
  if (ownerWorkspace) {
    const selected = typeof propertyId === "string" && propertyId.trim() ? propertyId.trim() : undefined;
    const property = await prisma.property.findFirst({ where: { workspaceId: ownerWorkspace.id, status: "active", ...(selected ? { id: selected } : {}) }, select: { id: true, name: true, type: true, city: true, area: true, address: true } });
    if (!property) throw new AssistantInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
    return { mode: "owner", workspaceId: ownerWorkspace.id, property, grants: [] };
  }
  if (typeof propertyId !== "string" || !propertyId.trim()) throw new AssistantInputError("PROPERTY_REQUIRED", "Choose a shared property before asking the assistant.");
  const access = await authorizeSharedProperty(userId, propertyId.trim(), "PROPERTY_BASIC_READ");
  if (!access) throw new AssistantInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  return { mode: "delegate", workspaceId: access.grant.workspaceId, property: { id: access.property.id, name: access.property.name, type: access.property.type, city: access.property.city, area: access.property.area, address: access.property.address }, grants: await getActiveSharesForUser(userId, propertyId.trim()) };
}

function can(context: Context, capability: "BILLS_READ" | "MAINTENANCE_READ" | "TIMELINE_READ" | "HEALTH_READ") { return context.mode === "owner" || context.grants.some((grant) => shareScopeAllows(grant, capability)); }

async function rateLimit(context: Context, userId: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.assistantRequest.count({ where: { workspaceId: context.workspaceId, requestedByUserId: userId, createdAt: { gte: since } } });
  if (count >= MAX_REQUESTS) throw new AssistantInputError("ASSISTANT_RATE_LIMITED", "Assistant request limit reached. Try again later.", 429);
}

async function createAudit(context: Context, userId: string, inputChars: number, retrievalCount: number, outputState: string, cancelledAt?: Date) {
  await prisma.assistantRequest.create({ data: { id: randomUUID(), workspaceId: context.workspaceId, requestedByUserId: userId, propertyId: context.property.id, providerEnvironment: providerEnvironment(), outputState, inputChars, retrievalCount, cancelledAt: cancelledAt ?? null } });
}

function readonlyResponse(question: string) {
  return { supported: false, outputState: "READ_ONLY", providerEnvironment: providerEnvironment(), answer: "I can answer from authorized Sukoon records, but I cannot create, edit, pay, delete, share, send, or upload anything. Use the relevant record screen for changes.", citations: [], sourceCount: 0, questionClass: question, estimatedCostPaise: null, actualCostPaise: null };
}

export async function answerAssistantForUser(userId: string, rawQuestion: unknown, rawPropertyId?: unknown, options?: { beforeFinalization?: () => Promise<void>; cancelled?: boolean; timeoutMs?: number; projectId?: string }) {
  const question = cleanQuestion(rawQuestion);
  const context = await contextForUser(userId, rawPropertyId);
  await rateLimit(context, userId);
  const deadline = options?.timeoutMs === undefined ? null : Date.now() + Math.max(0, Math.min(5_000, options.timeoutMs));
  if (options?.cancelled) {
    await createAudit(context, userId, question.length, 0, "CANCELLED", new Date());
    return { supported: false, outputState: "CANCELLED", providerEnvironment: providerEnvironment(), answer: "This assistant request was cancelled before an answer was finalized.", citations: [], sourceCount: 0, estimatedCostPaise: null, actualCostPaise: null };
  }
  const timedOut = async () => {
    if (deadline !== null && Date.now() > deadline) {
      await createAudit(context, userId, question.length, 0, "TIMEOUT");
      return { supported: false, outputState: "TIMEOUT", providerEnvironment: providerEnvironment(), answer: "The authorized record lookup timed out before an answer could be finalized.", citations: [], sourceCount: 0, estimatedCostPaise: null, actualCostPaise: null };
    }
    return null;
  };
  const beforeRetrieval = await timedOut(); if (beforeRetrieval) return beforeRetrieval;
  if(options?.projectId){
    const {getConstructionForUser,constructionAnswerForUser}=await import("@/lib/construction");
    const project=await getConstructionForUser(userId,options.projectId);
    if(project.propertyId!==context.property.id)throw new AssistantInputError("PROPERTY_NOT_FOUND","Property not found.",404);
    const result=await constructionAnswerForUser(userId,options.projectId,question,{beforeFinalization:options.beforeFinalization});
    const timeout=await timedOut();if(timeout)return timeout;
    await createAudit(context,userId,question.length,1,result.outputState);
    return result;
  }
  const lower = question.toLowerCase();
  if (hasAny(lower, ["create", "add ", "edit ", "update ", "delete", "remove", "pay ", "mark ", "share ", "upload", "send "])) {
    await createAudit(context, userId, question.length, 0, "READ_ONLY");
    return readonlyResponse("mutation");
  }

  const [obligations, maintenance, documents, assessment] = await Promise.all([
    can(context, "BILLS_READ") ? prisma.obligation.findMany({ where: { workspaceId: context.workspaceId, propertyId: context.property.id, active: true }, include: { occurrences: { where: { status: { not: "COMPLETED" } }, orderBy: { dueDate: "asc" }, include: { payments: { where: { status: "RECORDED", reversalOfId: null }, select: { amountPaise: true } } } } } }) : Promise.resolve([]),
    can(context, "MAINTENANCE_READ") ? prisma.maintenance.findMany({ where: { workspaceId: context.workspaceId, propertyId: context.property.id }, orderBy: { dateReported: "desc" }, include: { events: { orderBy: { createdAt: "desc" }, take: 5 }, invoiceObligation: { select: { id: true } } } }) : Promise.resolve([]),
    prisma.propertyDoc.findMany({ where: { workspaceId: context.workspaceId, propertyId: context.property.id, archivedAt: null, deletedAt: null, scanStatus: "clean", ...(context.mode === "owner" ? {} : { OR: context.grants.flatMap((grant) => grant.scopes.filter((scope) => ["DOCUMENT_LIST", "DOCUMENT_METADATA_READ", "DOCUMENT_PREVIEW"].includes(scope.scopeType)).map((scope) => scope.documentId ? { id: scope.documentId } : scope.docType ? { type: scope.docType } : { id: "__no_document_scope__" })) }) }, orderBy: { updatedAt: "desc" }, include: { versions: { where: { scanStatus: "clean" }, orderBy: { version: "desc" }, take: 1 }, parsingRuns: { where: { status: "succeeded" }, orderBy: { createdAt: "desc" }, take: 3 } } }),
    context.mode === "owner" ? prisma.assessmentSnapshot.findFirst({ where: { workspaceId: context.workspaceId, propertyId: context.property.id }, orderBy: { evaluatedAt: "desc" }, include: { items: { orderBy: { ruleStableKey: "asc" }, include: { rule: { select: { sourceName: true, sourceReference: true } } } } } }) : Promise.resolve(null),
  ]);
  const afterRetrieval = await timedOut(); if (afterRetrieval) return afterRetrieval;

  const visibleDocuments = documents.filter((doc) => context.mode === "owner" || context.grants.some((grant) => shareScopeAllows(grant, "DOCUMENT_LIST", doc) || shareScopeAllows(grant, "DOCUMENT_METADATA_READ", doc) || shareScopeAllows(grant, "DOCUMENT_PREVIEW", doc)));
  const sources: Citation[] = [citation("property", context.property.id, context.property.name, context.mode === "owner" ? `/property/${context.property.id}` : `/shared/${context.property.id}`, "property")];
  let answer = "I can only answer from the authorized records for this property. No supported record question matched.";
  let outputState = "UNSUPPORTED";

  if (hasAny(lower, ["pending", "owe", "due", "bill", "obligation", "outstanding"]) && can(context, "BILLS_READ")) {
    const rows = obligations.flatMap((obligation) => obligation.occurrences.map((occurrence) => ({ obligation, occurrence, paid: occurrence.payments.reduce((sum, payment) => sum + payment.amountPaise, 0n) }))).filter((row) => money(row.occurrence.amountPaise) - row.paid > 0n);
    const outstanding = rows.reduce((sum, row) => sum + (money(row.occurrence.amountPaise) - row.paid), 0n);
    answer = rows.length ? `${rows.length} open obligation occurrence${rows.length === 1 ? "" : "s"}; outstanding recorded amount ₹${rupees(outstanding).toFixed(2)}.` : "There are no open obligation occurrences with a recorded outstanding amount.";
    sources.push(...rows.slice(0, 10).map((row) => citation("obligation", row.obligation.id, row.obligation.label, `/property/${context.property.id}?tab=bills`, "obligation", { chunk: undefined })));
    outputState = "SUPPORTED_DETERMINISTIC";
  } else if (hasAny(lower, ["spend", "spent", "expense", "maintenance cost", "maintenance spend"]) && can(context, "MAINTENANCE_READ")) {
    const ids = maintenance.flatMap((item) => item.invoiceObligation?.id ? [item.invoiceObligation.id] : []);
    const ledger = ids.length ? await prisma.expenseLedgerEntry.findMany({ where: { workspaceId: context.workspaceId, propertyId: context.property.id, obligationId: { in: ids } }, select: { id: true, amountPaise: true, canonicalKey: true, obligationId: true } }) : [];
    const total = ledger.reduce((sum, entry) => sum + entry.amountPaise, 0n);
    answer = `Canonical maintenance-linked ledger spend is ₹${rupees(total).toFixed(2)} across ${ledger.length} ledger entr${ledger.length === 1 ? "y" : "ies"}.`;
    sources.push(...maintenance.slice(0, 8).map((item) => citation("maintenance", item.id, item.task, `/property/${context.property.id}?tab=maint`, "maintenance")));
    outputState = "SUPPORTED_DETERMINISTIC";
  } else if (hasAny(lower, ["waterproof", "last maintenance", "last repair", "repair history"]) && can(context, "MAINTENANCE_READ")) {
    const matching = maintenance.find((item) => hasAny(`${item.task} ${item.category} ${item.description ?? ""}`.toLowerCase(), ["waterproof", "repair", "maintenance"])) ?? maintenance[0];
    answer = matching ? `The latest matching maintenance record is “${matching.task}” reported on ${matching.dateReported}; its recorded status is ${matching.status}.` : "No maintenance record is available for this property.";
    if (matching) { sources.push(citation("maintenance", matching.id, matching.task, `/property/${context.property.id}?tab=maint`, "maintenance")); const event = matching.events[0]; if (event) sources.push(citation("maintenance_event", event.id, event.eventType, `/property/${context.property.id}?tab=timeline`, "maintenance_event")); }
    outputState = "SUPPORTED_DETERMINISTIC";
  } else if (hasAny(lower, ["missing doc", "missing document", "readiness", "checklist", "health"]) && can(context, "HEALTH_READ")) {
    const missing = assessment?.items.filter((item) => ["MISSING", "NEEDS_REVIEW", "UNKNOWN"].includes(item.evidenceState)) ?? [];
    answer = missing.length ? `${missing.length} published readiness item${missing.length === 1 ? "" : "s"} need attention. The result is record readiness, not legal, title, tax, or government verification.` : assessment ? "The latest published readiness snapshot has no missing or review-needed evidence items." : "No readiness assessment has been recorded yet.";
    sources.push(...missing.slice(0, 10).map((item) => citation("rule", item.ruleId ?? item.ruleStableKey, item.requirement, `/property/${context.property.id}?tab=overview`, "readiness_rule")));
    outputState = "SUPPORTED_DETERMINISTIC";
  } else {
    const queryTerms = terms(question);
    const doc = visibleDocuments.find((candidate) => {
      const version = candidate.versions[0];
      const text = candidate.parsingRuns.flatMap((run) => Array.isArray(run.textChunks) ? run.textChunks.map((chunk) => typeof chunk === "object" && chunk && "text" in chunk ? String((chunk as { text?: unknown }).text ?? "") : "") : []).join(" ");
      return queryTerms.some((term) => `${candidate.displayName} ${candidate.type} ${text}`.toLowerCase().includes(term)) && Boolean(version);
    });
    if (doc && hasAny(lower, ["document", "doc", "registry", "noc", "agreement", "what does", "summarize", "summary"])) {
      const version = doc.versions[0];
      const run = doc.parsingRuns.find((candidate) => candidate.documentVersionId === version?.id);
      const chunks = Array.isArray(run?.textChunks) ? run.textChunks.flatMap((chunk, index) => typeof chunk === "object" && chunk && typeof (chunk as { text?: unknown }).text === "string" ? [{ index, page: typeof (chunk as { page?: unknown }).page === "number" ? (chunk as { page: number }).page : undefined, text: (chunk as { text: string }).text.trim() }] : []) : [];
      const excerpt = chunks.slice(0, 2).map((chunk) => chunk.text).join(" ").slice(0, 420);
      answer = excerpt ? `Authorized record excerpt from “${doc.displayName || doc.name}”: ${excerpt}` : `“${doc.displayName || doc.name}” is an authorized clean record, but no approved parsed text is available for a summary.`;
      sources.push(citation("document", doc.id, doc.displayName || doc.name, context.mode === "owner" ? `/property/${context.property.id}?tab=vault&document=${doc.id}` : `/shared/${context.property.id}?document=${doc.id}`, "document", { versionId: version?.id, page: chunks[0]?.page, chunk: chunks[0]?.index }));
      outputState = "SUPPORTED_RECORD_EXCERPT";
    }
  }

  if (options?.beforeFinalization) await options.beforeFinalization();
  if (outputState === "SUPPORTED_RECORD_EXCERPT" && await prisma.processingControl.findUnique({ where: { workspaceId: context.workspaceId } })) {
    await createAudit(context, userId, question.length, 0, "SUPPRESSED_WITHDRAWN");
    return { supported: false, outputState: "SUPPRESSED_WITHDRAWN", providerEnvironment: providerEnvironment(), answer: "Document intelligence output is suppressed after processing withdrawal. Original documents and manual records remain separate.", citations: [], sourceCount: 0, estimatedCostPaise: null, actualCostPaise: null };
  }
  const current = context.mode === "owner" ? true : Boolean(await authorizeSharedProperty(userId, context.property.id, "PROPERTY_BASIC_READ"));
  if (!current) {
    await createAudit(context, userId, question.length, sources.length - 1, "SUPPRESSED_REVOKED");
    return { supported: false, outputState: "SUPPRESSED_REVOKED", providerEnvironment: providerEnvironment(), answer: "This answer was suppressed because the shared grant is no longer active.", citations: [], sourceCount: 0, estimatedCostPaise: null, actualCostPaise: null };
  }
  await createAudit(context, userId, question.length, sources.length - 1, outputState);
  return { supported: outputState !== "UNSUPPORTED", outputState, providerEnvironment: providerEnvironment(), answer, citations: sources, sourceCount: sources.length, estimatedCostPaise: null, actualCostPaise: null };
}

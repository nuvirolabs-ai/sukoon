import { randomUUID } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { LocalTextPdfParser } from "@/lib/document-parsing";
import { ClamAvScanner } from "@/lib/clamav-scanner";
import { ClamdScanner } from "@/lib/clamd-scanner";
import { S3ObjectStorageAdapter } from "@/lib/s3-object-storage";
import {
  LocalObjectStorageAdapter,
  LocalUnavailableScanner,
  assertProviderConfiguration,
  UnavailableAiExtraction,
  UnavailableOcrAdapter,
  type AiExtractionPort,
  type DocumentParsingPort,
  type MalwareScanPort,
  type ObjectStoragePort,
  type OcrPort,
} from "@/lib/providers";
import { validateAiExtractionResponse } from "@/lib/providers";
import { prisma } from "@/lib/prisma";
import { enqueueJob, recordJobEffect, runWorkerOnce, type JobRecord } from "@/lib/worker";
import { VaultInputError, getDocumentForUser } from "@/lib/vault-repository";
import { assertIntelligenceAllowed, intelligenceAllowed, lockIntelligence, ProcessingWithdrawnError } from "@/lib/processing-consent";

const PAGE_LIMIT = 50;

export type DocumentProcessingDependencies = {
  storage: ObjectStoragePort;
  scanner: MalwareScanPort;
  parser: DocumentParsingPort;
  ocr: OcrPort;
  ai: AiExtractionPort;
};

export function localDocumentProcessingDependencies(): DocumentProcessingDependencies {
  const storage = new LocalObjectStorageAdapter(process.env.NODE_ENV === "test" ? "test" : "local");
  return {
    storage,
    scanner: process.env.APP_ENV === "local" && process.env.SUKOON_LOCAL_SCANNER === "clamav"
      ? new ClamAvScanner(storage, process.env.SUKOON_CLAMSCAN_PATH ?? "/opt/homebrew/bin/clamscan", process.env.SUKOON_CLAMAV_DATABASE ?? "")
      : new LocalUnavailableScanner(process.env.NODE_ENV === "test" ? "test" : "local"),
    parser: new LocalTextPdfParser(storage),
    ocr: new UnavailableOcrAdapter(),
    ai: new UnavailableAiExtraction(),
  };
}

/** Selects provider adapters by explicit runtime profile; local selection remains unchanged. */
export function documentProcessingDependenciesForEnvironment(env: NodeJS.ProcessEnv = process.env): DocumentProcessingDependencies {
  if (env.APP_ENV !== "staging" && env.SUKOON_RUNTIME_PROFILE !== "STAGING") return localDocumentProcessingDependencies();
  assertProviderConfiguration(env);
  const storage = new S3ObjectStorageAdapter({ endpoint: env.SUKOON_STORAGE_ENDPOINT!, bucket: env.SUKOON_STORAGE_BUCKET!, accessKeyId: env.SUKOON_STORAGE_ACCESS_KEY!, secretAccessKey: env.SUKOON_STORAGE_SECRET_KEY! });
  return {
    storage,
    scanner: new ClamdScanner(storage, env.SUKOON_CLAMAV_ENDPOINT!),
    parser: new LocalTextPdfParser(storage),
    ocr: new UnavailableOcrAdapter(),
    ai: new UnavailableAiExtraction(),
  };
}

export type DocumentJobPayload = { documentId: string; documentVersionId: string; workspaceId: string; propertyId: string | null; purchaseCandidateId?: string | null };

function payloadOf(job: JobRecord): DocumentJobPayload {
  if (!job.payload || typeof job.payload !== "object") throw new Error("DOCUMENT_JOB_PAYLOAD_INVALID");
  const payload = job.payload as Record<string, unknown>;
  if (!["documentId", "documentVersionId", "workspaceId"].every((key) => typeof payload[key] === "string" && payload[key]) || !["propertyId", "purchaseCandidateId"].every(key => payload[key] == null || (typeof payload[key] === "string" && !!payload[key])) || Boolean(payload.propertyId) === Boolean(payload.purchaseCandidateId)) throw new Error("DOCUMENT_JOB_PAYLOAD_INVALID");
  return payload as unknown as DocumentJobPayload;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? nested.toString() : nested)) as Prisma.InputJsonValue;
}

async function versionContext(payload: DocumentJobPayload) {
  const context = await prisma.documentVersion.findFirst({ where: { id: payload.documentVersionId, workspaceId: payload.workspaceId, documentId: payload.documentId }, include: { document: { include: { property: { select: { status: true } } } } } });
  if (!context || context.document.version !== context.version || context.document.propertyId !== payload.propertyId || (context.document.purchaseCandidateId ?? null) !== (payload.purchaseCandidateId ?? null) || (context.document.propertyId && context.document.property?.status !== "active")) return null;
  return context;
}

async function enqueueNextDocumentJob(payload: DocumentJobPayload, eventType: "PARSE_DOCUMENT" | "OCR_DOCUMENT" | "AI_EXTRACT_DOCUMENT") {
  return prisma.$transaction(async tx => {
    try { await lockIntelligence(tx, payload.workspaceId); } catch (error) { if (error instanceof ProcessingWithdrawnError) return null; throw error; }
    return enqueueJob({
    aggregateType: "property_document",
    aggregateId: payload.documentId,
    eventType,
    payload,
    idempotencyKey: `${eventType.toLowerCase()}:${payload.documentVersionId}`,
    correlationId: payload.documentId,
    maxAttempts: 3,
    }, tx);
  });
}

async function updateCurrentDocument(payload: DocumentJobPayload, data: { scanStatus?: string; processingState?: string; reviewStatus?: string }) {
  const version = await prisma.documentVersion.findFirst({ where: { id: payload.documentVersionId, workspaceId: payload.workspaceId }, select: { version: true } });
  if (version) {
    const { reviewStatus, ...independent } = data;
    await prisma.propertyDoc.updateMany({ where: { id: payload.documentId, workspaceId: payload.workspaceId, version: version.version, archivedAt: null, deletedAt: null }, data: independent });
    if (reviewStatus) await prisma.propertyDoc.updateMany({ where: { id: payload.documentId, workspaceId: payload.workspaceId, version: version.version, reviewStatus: { not: "confirmed" }, archivedAt: null, deletedAt: null }, data: { reviewStatus } });
  }
}

async function processScan(job: JobRecord, deps: DocumentProcessingDependencies) {
  const payload = payloadOf(job);
  const context = await versionContext(payload);
  if (!context || context.document.deletedAt || context.document.archivedAt) return;
  const markEffect = async (status: string) => {
    if (!await prisma.jobEffect.findUnique({ where: { jobId: job.id } })) await recordJobEffect({ jobId: job.id, effectKey: `document-scan-job:${job.id}`, aggregateType: "property_document", aggregateId: payload.documentId, result: { status, evidenceSource: "DocumentScanEvidence" } });
  };
  if (context.scanStatus === "clean") {
    await markEffect("clean");
    await enqueueNextDocumentJob(payload, "PARSE_DOCUMENT");
    return;
  }
  let result = await deps.scanner.scan({ storageKey: context.storageKey, contentType: context.mimeType, sizeBytes: context.sizeBytes, documentVersionId: context.id, sha256: context.sha256 });
  if (process.env.NODE_ENV !== "test" && result.outcome !== "unavailable" && (result.outcome !== "available" || !result.evidence || result.evidence.documentVersionId !== context.id || result.evidence.sha256 !== context.sha256 || result.evidence.verdict !== result.value.verdict)) {
    result = { outcome: "unavailable", reason: "SCAN_EVIDENCE_INVALID" };
  }
  // One immutable evidence row per attempt, before releasing quarantine. JobEffect stays one per job.
  await prisma.documentScanEvidence.upsert({ where: { jobId_attempt: { jobId: job.id, attempt: job.attempts } }, update: {}, create: { id: randomUUID(), jobId: job.id, attempt: job.attempts, documentVersionId: context.id, evidence: jsonValue(result.evidence ?? { implementation: deps.scanner.id, engineVersion: null, signatureVersion: null, signatureDate: null, scannedAt: new Date().toISOString(), documentVersionId: context.id, sha256: context.sha256, verdict: result.outcome === "unavailable" ? "unavailable" : result.value.verdict, reason: result.outcome === "unavailable" ? result.reason.slice(0, 160) : null, testOnly: deps.scanner.environment === "test" }) } });
  if (result.outcome === "unavailable") {
    await prisma.documentVersion.update({ where: { id: context.id }, data: { scanStatus: "unavailable", processingState: "scan_failed" } });
    await updateCurrentDocument(payload, { scanStatus: "unavailable", processingState: "scan_failed" });
    await markEffect("unavailable");
    throw new Error("MALWARE_SCANNER_UNAVAILABLE");
  }
  const clean = result.value.verdict === "clean";
  await prisma.documentVersion.update({ where: { id: context.id }, data: { scanStatus: clean ? "clean" : "infected", processingState: clean ? "awaiting_review" : "failed" } });
  await updateCurrentDocument(payload, { scanStatus: clean ? "clean" : "infected", processingState: clean ? "awaiting_review" : "failed" });
  await markEffect(clean ? "clean" : "infected");
  if (clean) await enqueueNextDocumentJob(payload, "PARSE_DOCUMENT");
}

async function saveParsingRun(payload: DocumentJobPayload, data: { status: string; method: string; parserVersion: string; pageCount?: number; textChars: number; textChunks?: unknown; error?: unknown }) {
  const idempotencyKey = `document-parse:${payload.documentVersionId}`;
  try {
    return await prisma.$transaction(async tx => {
      await lockIntelligence(tx, payload.workspaceId);
      return tx.documentParsingRun.create({ data: { id: randomUUID(), workspaceId: payload.workspaceId, documentId: payload.documentId, documentVersionId: payload.documentVersionId, idempotencyKey, status: data.status, method: data.method, parserVersion: data.parserVersion, pageCount: data.pageCount, textChars: data.textChars, textChunks: data.textChunks === undefined ? undefined : jsonValue(data.textChunks), error: data.error === undefined ? undefined : jsonValue(data.error) } });
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return prisma.documentParsingRun.findUniqueOrThrow({ where: { idempotencyKey } });
    throw error;
  }
}

async function processParse(job: JobRecord, deps: DocumentProcessingDependencies) {
  const payload = payloadOf(job);
  const context = await versionContext(payload);
  if (!context || context.document.deletedAt || context.document.archivedAt) return;
  if (context.scanStatus !== "clean") return;
  const idempotencyKey = `document-parse:${payload.documentVersionId}`;
  const existing = await prisma.documentParsingRun.findUnique({ where: { idempotencyKey } });
  if (existing) {
    if (existing.status === "succeeded" && existing.textChars > 0) await enqueueNextDocumentJob(payload, "AI_EXTRACT_DOCUMENT");
    else if (["empty", "unavailable"].includes(existing.status)) await enqueueNextDocumentJob(payload, "OCR_DOCUMENT");
    return;
  }

  type ParsedResult = Awaited<ReturnType<DocumentParsingPort["parse"]>>;
  let parsed: ParsedResult;
  try {
    await assertIntelligenceAllowed(payload.workspaceId);
    parsed = await deps.parser.parse({ storageKey: context.storageKey, mimeType: context.mimeType, pageLimit: PAGE_LIMIT });
    await assertIntelligenceAllowed(payload.workspaceId);
  } catch (error: unknown) {
    if (error instanceof ProcessingWithdrawnError) throw error;
    const run = await saveParsingRun(payload, { status: "failed", method: "text_pdf", parserVersion: deps.parser.id, textChars: 0, error: { code: "PARSER_FAILED", message: error instanceof Error ? error.message.slice(0, 240) : "The parser failed.", retryable: false } });
    await updateCurrentDocument(payload, { processingState: "failed" });
    await recordJobEffect({ jobId: job.id, effectKey: `document-parse:${payload.documentVersionId}:failed`, aggregateType: "property_document", aggregateId: payload.documentId, result: { status: run.status, parsingRunId: run.id } });
    return;
  }
  if (parsed.outcome === "unavailable") {
    const run = await saveParsingRun(payload, { status: "unavailable", method: "text_pdf", parserVersion: deps.parser.id, textChars: 0, error: { code: "PARSER_UNAVAILABLE", message: parsed.reason, retryable: false } });
    await updateCurrentDocument(payload, { processingState: "processing" });
    await recordJobEffect({ jobId: job.id, effectKey: `document-parse:${payload.documentVersionId}:unavailable`, aggregateType: "property_document", aggregateId: payload.documentId, result: { status: run.status, parsingRunId: run.id } });
    await enqueueNextDocumentJob(payload, "OCR_DOCUMENT");
    return;
  }
  const textChunks = parsed.value.chunks;
  const run = await saveParsingRun(payload, { status: parsed.value.text.length ? "succeeded" : "empty", method: "text_pdf", parserVersion: parsed.value.parserVersion, pageCount: parsed.value.pageCount, textChars: parsed.value.text.length, textChunks });
  await updateCurrentDocument(payload, { processingState: "processing" });
  await recordJobEffect({ jobId: job.id, effectKey: `document-parse:${payload.documentVersionId}:${run.status}`, aggregateType: "property_document", aggregateId: payload.documentId, result: { status: run.status, parsingRunId: run.id } });
  if (run.status === "succeeded") await enqueueNextDocumentJob(payload, "AI_EXTRACT_DOCUMENT");
  else await enqueueNextDocumentJob(payload, "OCR_DOCUMENT");
}

async function saveOcrRun(payload: DocumentJobPayload, data: { status: string; method: string; providerEnvironment: string; pageCount?: number; textChars: number; textChunks?: unknown; error?: unknown }) {
  const idempotencyKey = `document-ocr:${payload.documentVersionId}`;
  try {
    return await prisma.$transaction(async tx => {
      await lockIntelligence(tx, payload.workspaceId);
      return tx.documentOcrRun.create({ data: { id: randomUUID(), workspaceId: payload.workspaceId, documentId: payload.documentId, documentVersionId: payload.documentVersionId, idempotencyKey, status: data.status, method: data.method, providerEnvironment: data.providerEnvironment, pageCount: data.pageCount, textChars: data.textChars, textChunks: data.textChunks === undefined ? undefined : jsonValue(data.textChunks), error: data.error === undefined ? undefined : jsonValue(data.error) } });
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return prisma.documentOcrRun.findUniqueOrThrow({ where: { idempotencyKey } });
    throw error;
  }
}

async function processOcr(job: JobRecord, deps: DocumentProcessingDependencies) {
  const payload = payloadOf(job);
  const context = await versionContext(payload);
  if (!context || context.document.deletedAt || context.document.archivedAt || context.scanStatus !== "clean") return;
  const idempotencyKey = `document-ocr:${payload.documentVersionId}`;
  const existing = await prisma.documentOcrRun.findUnique({ where: { idempotencyKey } });
  if (existing) {
    if (existing.status === "succeeded" && existing.textChars > 0) await enqueueNextDocumentJob(payload, "AI_EXTRACT_DOCUMENT");
    return;
  }
  let result: Awaited<ReturnType<OcrPort["recognize"]>>;
  try {
    await assertIntelligenceAllowed(payload.workspaceId);
    result = await deps.ocr.recognize({ storageKey: context.storageKey, mimeType: context.mimeType, pageLimit: PAGE_LIMIT });
    await assertIntelligenceAllowed(payload.workspaceId);
  } catch (error: unknown) {
    if (error instanceof ProcessingWithdrawnError) throw error;
    await saveOcrRun(payload, { status: "failed", method: "ocr", providerEnvironment: deps.ocr.environment, textChars: 0, error: { code: "OCR_FAILED", message: error instanceof Error ? error.message.slice(0, 240) : "OCR failed.", retryable: true } });
    throw error;
  }
  if (result.outcome === "unavailable") {
    const run = await saveOcrRun(payload, { status: "unavailable", method: "ocr", providerEnvironment: deps.ocr.environment, textChars: 0, error: { code: "OCR_UNAVAILABLE", message: result.reason, retryable: false } });
    await updateCurrentDocument(payload, { processingState: "awaiting_review" });
    await recordJobEffect({ jobId: job.id, effectKey: `document-ocr:${payload.documentVersionId}:unavailable`, aggregateType: "property_document", aggregateId: payload.documentId, result: { status: run.status, ocrRunId: run.id } });
    return;
  }
  const run = await saveOcrRun(payload, { status: result.value.text.length ? "succeeded" : "empty", method: "ocr", providerEnvironment: deps.ocr.environment, pageCount: result.value.pageCount, textChars: result.value.text.length, textChunks: result.value.chunks });
  await updateCurrentDocument(payload, { processingState: result.value.text.length ? "processing" : "awaiting_review" });
  await recordJobEffect({ jobId: job.id, effectKey: `document-ocr:${payload.documentVersionId}:${run.status}`, aggregateType: "property_document", aggregateId: payload.documentId, result: { status: run.status, ocrRunId: run.id } });
  if (run.status === "succeeded") await enqueueNextDocumentJob(payload, "AI_EXTRACT_DOCUMENT");
}

async function processAi(job: JobRecord, deps: DocumentProcessingDependencies) {
  const payload = payloadOf(job);
  const context = await versionContext(payload);
  if (!context || context.document.deletedAt || context.document.archivedAt || context.scanStatus !== "clean") return;
  const parsingRun = await prisma.documentParsingRun.findUnique({ where: { idempotencyKey: `document-parse:${payload.documentVersionId}` } });
  const ocrRun = await prisma.documentOcrRun.findUnique({ where: { idempotencyKey: `document-ocr:${payload.documentVersionId}` } });
  const textRun = parsingRun?.status === "succeeded" && parsingRun.textChunks ? parsingRun : ocrRun?.status === "succeeded" && ocrRun.textChunks ? ocrRun : null;
  if (!textRun || !textRun.textChunks) return;
  const idempotencyKey = `document-ai:${payload.documentVersionId}`;
  if (await prisma.aiExtractionRun.findUnique({ where: { idempotencyKey } })) return;
  const chunks = textRun.textChunks as Array<{ page: number | null; text: string }>;
  const text = chunks.map((chunk) => chunk.text).join("\n");
  await assertIntelligenceAllowed(payload.workspaceId);
  const result = await deps.ai.extract({ text, chunks, documentType: context.document.type });
  await assertIntelligenceAllowed(payload.workspaceId);
  if (result.outcome === "unavailable") {
    await prisma.aiExtractionRun.create({ data: { id: randomUUID(), workspaceId: payload.workspaceId, documentId: payload.documentId, documentVersionId: payload.documentVersionId, parsingRunId: parsingRun?.id, idempotencyKey, status: "unavailable", method: "provider_unavailable", providerEnvironment: deps.ai.environment, error: jsonValue({ code: "AI_UNAVAILABLE", message: result.reason, retryable: false }) } });
    await updateCurrentDocument(payload, { processingState: "awaiting_review" });
    return;
  }
  let proposals;
  try { proposals = validateAiExtractionResponse({ proposals: result.value.proposals }); }
  catch {
    await prisma.aiExtractionRun.create({ data: { id: randomUUID(), workspaceId: payload.workspaceId, documentId: payload.documentId, documentVersionId: payload.documentVersionId, parsingRunId: parsingRun?.id, idempotencyKey, status: "failed", method: "schema_validation", providerEnvironment: deps.ai.environment, error: jsonValue({ code: "AI_RESPONSE_INVALID", message: "The provider response did not match the extraction schema.", retryable: false }) } });
    await updateCurrentDocument(payload, { processingState: "failed", reviewStatus: "awaiting_review" });
    return;
  }
  const run = await prisma.$transaction(async (tx) => {
    await lockIntelligence(tx, payload.workspaceId);
    const created = await tx.aiExtractionRun.create({ data: { id: randomUUID(), workspaceId: payload.workspaceId, documentId: payload.documentId, documentVersionId: payload.documentVersionId, parsingRunId: parsingRun?.id, idempotencyKey, status: proposals.length ? "succeeded" : "no_fields", method: result.value.proposals[0]?.extractionMethod ?? "fixture_ai", providerEnvironment: deps.ai.environment, response: result.value.providerResponse === undefined ? undefined : jsonValue(result.value.providerResponse) } });
    if (proposals.length) await tx.aiFieldProposal.createMany({ data: proposals.map((proposal) => ({ id: randomUUID(), workspaceId: payload.workspaceId, runId: created.id, documentId: payload.documentId, documentVersionId: payload.documentVersionId, fieldName: proposal.fieldName, proposedValue: jsonValue(proposal.value), state: "proposed", sourcePage: proposal.sourcePage, sourceChunk: proposal.sourceChunk, extractionMethod: proposal.extractionMethod, evidence: jsonValue({ documentId: payload.documentId, documentVersionId: payload.documentVersionId, page: proposal.sourcePage ?? null, chunk: proposal.sourceChunk ?? null, extractionMethod: proposal.extractionMethod }) })) });
    return created;
  });
  await updateCurrentDocument(payload, { processingState: proposals.length ? "ready" : "awaiting_review", reviewStatus: proposals.length ? "in_review" : "awaiting_review" });
  await recordJobEffect({ jobId: job.id, effectKey: `document-ai:${payload.documentVersionId}:${run.status}`, aggregateType: "property_document", aggregateId: payload.documentId, result: { status: run.status, aiRunId: run.id, proposalCount: proposals.length } });
}

export async function processDocumentJob(job: JobRecord, dependencies = localDocumentProcessingDependencies()) {
  if (job.eventType === "SCAN_DOCUMENT") return processScan(job, dependencies);
  await assertIntelligenceAllowed(payloadOf(job).workspaceId);
  if (job.eventType === "PARSE_DOCUMENT") return processParse(job, dependencies);
  if (job.eventType === "OCR_DOCUMENT") return processOcr(job, dependencies);
  if (job.eventType === "AI_EXTRACT_DOCUMENT") return processAi(job, dependencies);
  throw new Error("DOCUMENT_JOB_EVENT_UNSUPPORTED");
}

export async function runDocumentJobOnce(workerId: string, dependencies = localDocumentProcessingDependencies(), options?: { leaseMs?: number }) {
  return runWorkerOnce(workerId, (job) => processDocumentJob(job, dependencies), {leaseMs: 180_000, ...options, eventTypes: ["SCAN_DOCUMENT", "PARSE_DOCUMENT", "OCR_DOCUMENT", "AI_EXTRACT_DOCUMENT"]});
}

export async function queueDocumentStageForUser(input: { userId: string; documentId: string; stage: "scan" | "parse" | "ocr" | "extract"; retryKey?: string }) {
  await getDocumentForUser(input.userId, input.documentId);
  const workspace = await prisma.workspace.findUnique({ where: { ownerUserId: input.userId }, select: { id: true } });
  if (!workspace) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document not found.", 404);
  const row = await prisma.propertyDoc.findFirst({ where: { id: input.documentId, workspaceId: workspace.id, archivedAt: null, deletedAt: null }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
  if (!row) throw new VaultInputError("RESOURCE_NOT_FOUND", "Document not found.", 404);
  const version = row.versions[0];
  if (!version) throw new VaultInputError("DOCUMENT_VERSION_MISSING", "Document version not found.", 409);
  const eventType = input.stage === "scan" ? "SCAN_DOCUMENT" : input.stage === "parse" ? "PARSE_DOCUMENT" : input.stage === "extract" ? "AI_EXTRACT_DOCUMENT" : "OCR_DOCUMENT";
  if (input.stage !== "scan" && row.scanStatus !== "clean") throw new VaultInputError("DOCUMENT_SCAN_REQUIRED", "A clean malware scan is required before processing.", 423);
  if (input.stage !== "scan" && !await intelligenceAllowed(workspace.id)) throw new VaultInputError("PROCESSING_WITHDRAWN", "Document intelligence processing is withdrawn.", 403);
  if (input.retryKey) {
    if (input.stage !== "scan" || !/^[a-zA-Z0-9-]{16,80}$/.test(input.retryKey)) throw new VaultInputError("INVALID_RETRY", "A valid scan retry key is required.", 400);
    return retryUnavailableScan({ userId: input.userId, workspaceId: workspace.id, documentId: row.id, versionId: version.id, requestKey: input.retryKey });
  }
  return prisma.$transaction(async tx => {
    if (input.stage !== "scan") await lockIntelligence(tx, workspace.id);
    return enqueueJob({ aggregateType: "property_document", aggregateId: row.id, eventType, payload: { documentId: row.id, documentVersionId: version.id, workspaceId: workspace.id, propertyId: row.propertyId, purchaseCandidateId: row.purchaseCandidateId }, idempotencyKey: input.stage === "scan" ? `document-scan:${version.id}` : `${eventType.toLowerCase()}:${version.id}`, correlationId: row.id, maxAttempts: 3 }, tx);
  });
}

// Retry the same durable job, retaining monotonically increasing evidence attempt
// numbers. Never clear a verdict, replace bytes or replay arbitrary side effects.
async function retryUnavailableScan(input: { userId: string; workspaceId: string; documentId: string; versionId: string; requestKey: string }) {
  return prisma.$transaction(async tx => {
    const key = `document-scan:${input.versionId}`;
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "OutboxEvent" WHERE "idempotencyKey" = ${key} FOR UPDATE`);
    const job = await tx.outboxEvent.findUnique({ where: { idempotencyKey: key } });
    if (!job || job.eventType !== "SCAN_DOCUMENT" || job.aggregateId !== input.documentId) throw new VaultInputError("SCAN_JOB_NOT_FOUND", "The original scan job is unavailable.", 409);
    const action = "document.scan.retry";
    const receipt = await tx.idempotencyRecord.findUnique({ where: { principalUserId_action_requestKey: { principalUserId: input.userId, action, requestKey: input.requestKey } } });
    if (receipt) {
      if (receipt.payloadHash !== input.versionId) throw new VaultInputError("RETRY_KEY_CONFLICT", "Retry key already belongs to another version.", 409);
      return { job, duplicate: true };
    }
    const version = await tx.documentVersion.findFirst({ where: { id: input.versionId, workspaceId: input.workspaceId, documentId: input.documentId }, include: { document: true } });
    if (!version || version.document.deletedAt || version.document.archivedAt || version.document.version !== version.version || version.scanStatus !== "unavailable") throw new VaultInputError("SCAN_RETRY_NOT_ALLOWED", "Only the current unavailable scan can be retried. Clean or detected-threat verdicts cannot be reset.", 409);
    if (job.status !== "terminal_failure" || job.lockedBy || job.attempts >= 10) throw new VaultInputError("SCAN_RETRY_NOT_ALLOWED", "Wait for the active scan, or request support after the retry limit.", 409);
    const resumed = await tx.outboxEvent.update({ where: { id: job.id }, data: { status: "queued", maxAttempts: Math.min(10, job.attempts + 3), nextAttemptAt: new Date(), deadLetteredAt: null } });
    await tx.idempotencyRecord.create({ data: { id: randomUUID(), principalUserId: input.userId, action, requestKey: input.requestKey, payloadHash: input.versionId, response: { jobId: job.id, documentVersionId: version.id, sha256: version.sha256, previousAttempts: job.attempts, maxAttempts: resumed.maxAttempts } } });
    return { job: resumed, duplicate: false };
  });
}

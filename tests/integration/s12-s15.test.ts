import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { clearLocalMailbox, readLocalOtp } from "@/lib/auth-mailbox";
import { prisma } from "@/lib/prisma";
import { POST as createProperty } from "@/app/api/properties/route";
import { POST as rulesPost } from "@/app/api/rules/route";
import { GET as rulesGet } from "@/app/api/rules/route";
import { PATCH as rulesPatchRaw, POST as rulesActionRaw } from "@/app/api/rules/[id]/route";
import { GET as healthGet } from "@/app/api/properties/[id]/health/route";
import { GET as documentGet } from "@/app/api/documents/[id]/route";
import { POST as uploadDocument } from "@/app/api/documents/route";
import { GET as reviewGet, POST as reviewPost } from "@/app/api/documents/[id]/review/route";
import { GET as obligationsGet, POST as obligationsPost } from "@/app/api/obligations/route";
import { GET as obligationGet, PATCH as obligationPatch, POST as obligationAction } from "@/app/api/obligations/[id]/route";
import { GET as paymentsGet, POST as paymentsPost } from "@/app/api/obligations/[id]/payments/route";
import { POST as reversePayment } from "@/app/api/payments/[id]/reverse/route";
import { occurrenceDate } from "@/lib/obligations";
import { FixtureAiExtractionAdapter, LocalObjectStorageAdapter, TestMalwareScanner, UnavailableOcrAdapter } from "@/lib/providers";
import { LocalTextPdfParser } from "@/lib/document-parsing";
import { runDocumentJobOnce } from "@/lib/document-processing";
import { sha256Hex } from "@/lib/vault-repository";
import { randomUUID } from "node:crypto";

const authHandler = toNextJsHandler(auth);
const today = "2026-09-11";

function requestWithCookie(path: string, cookie: string, init?: RequestInit) {
  return new Request(`http://localhost:3100${path}`, { ...init, headers: { ...(init?.headers ?? {}), cookie, "content-type": "application/json" } });
}

async function signIn(email: string) {
  await authHandler.POST(new Request("http://localhost:3100/api/auth/email-otp/send-verification-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, type: "sign-in" }) }));
  const message = readLocalOtp(email);
  expect(message?.otp).toMatch(/^\d{6}$/);
  const response = await authHandler.POST(new Request("http://localhost:3100/api/auth/sign-in/email-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, otp: message?.otp ?? "" }) }));
  expect(response.ok).toBe(true);
  return response.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
}

function propertyPayload(name: string, jurisdiction = "India / Maharashtra / Pune", type = "flat") {
  return { name, type, city: "Pune", area: "Kothrud", address: "7 Forest Road", jurisdiction, areaValue: "1200", areaUnit: "sqft", areaType: "carpet", ownerName: "Owner A", ownershipAssertion: "self_asserted", ownershipProvenance: "Owner-entered synthetic test assertion", identifiers: [{ label: "Survey no.", value: "SYN-77" }] };
}

function syntheticPdf(lines: string[]) {
  const stream = `BT /F1 12 Tf 72 720 Td (${lines[0] ?? ""}) Tj ${lines.slice(1).map((line) => `0 -20 Td (${line}) Tj`).join(" ")} ET`;
  const objects = ["1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n", "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n", "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n", "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n", `5 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`];
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  for (const object of objects) { offsets.push(Buffer.byteLength(pdf)); pdf += object; }
  const startXref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

async function makeProperty(cookie: string, name: string, jurisdiction = "India / Maharashtra / Pune", type = "flat") {
  const response = await createProperty(requestWithCookie("/api/properties", cookie, { method: "POST", body: JSON.stringify(propertyPayload(name, jurisdiction, type)) }));
  expect(response.status).toBe(201);
  return (await response.json()).data.property as { id: string; version: number };
}

// Route response shapes are narrowed at each assertion below; the helper only
// keeps the integration test readable while preserving the production types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(response: Response) { return response.json() as Promise<any>; }

const baseRule = (stableKey: string, overrides: Record<string, unknown> = {}) => ({ stableKey, title: stableKey, description: `Synthetic explanation for ${stableKey}`, category: "record", jurisdiction: "India / Maharashtra / Pune", propertyType: "residential_flat", evidenceCategory: "Registry", effectiveFrom: "2020-01-01", contentType: "checklist", requiresConfirmation: true, ...overrides });

// Model a client loading the current revision before each intended change.
async function ruleRequest(handler: typeof rulesActionRaw, request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const current = await prisma.checklistRule.findUniqueOrThrow({ where: { id }, select: { revision: true } });
  const headers = new Headers(request.headers); headers.set("origin", "http://localhost:3100");
  return handler(new Request(request.url, { method: request.method, headers, body: JSON.stringify({ ...await request.json(), revision: current.revision }) }), context);
}
const rulesAction = (request: Request, context: { params: Promise<{ id: string }> }) => ruleRequest(rulesActionRaw, request, context);
const rulesPatch = (request: Request, context: { params: Promise<{ id: string }> }) => ruleRequest(rulesPatchRaw, request, context);

async function createAndPublishRule(operatorCookie: string, input: Record<string, unknown>) {
  const created = await rulesPost(requestWithCookie("/api/rules", operatorCookie, { method: "POST", body: JSON.stringify(input) }));
  expect(created.status).toBe(201);
  const rule = (await json(created)).data.rule as { id: string; version: number };
  const submitted = await rulesAction(requestWithCookie(`/api/rules/${rule.id}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "submit" }) }), { params: Promise.resolve({ id: rule.id }) });
  expect(submitted.status).toBe(200);
  const patched = await rulesPatch(requestWithCookie(`/api/rules/${rule.id}`, operatorCookie, { method: "PATCH", body: JSON.stringify({ sourceName: "Synthetic QA source", sourceReference: { kind: "synthetic", reference: rule.id }, reviewer: "QA Operator", reviewedAt: "2026-09-11T10:00:00.000Z" }) }), { params: Promise.resolve({ id: rule.id }) });
  expect(patched.status).toBe(200);
  const published = await rulesAction(requestWithCookie(`/api/rules/${rule.id}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "publish" }) }), { params: Promise.resolve({ id: rule.id }) });
  expect(published.status).toBe(200);
  return rule;
}

async function createSyntheticDocument(ownerCookie: string, propertyId: string, reviewStatus: "confirmed" | "in_review" = "confirmed", category = "Registry") {
  void ownerCookie;
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: "s12-owner@example.com" } });
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: owner.id } });
  const id = randomUUID();
  const versionId = randomUUID();
  await prisma.propertyDoc.create({ data: { id, workspaceId: workspace.id, propertyId, type: category, name: `synthetic-${category}.pdf`, displayName: `Synthetic ${category} record`, originalFilename: `synthetic-${category}.pdf`, uploadDate: today, uploadedBy: owner.id, sizeBytes: 128, sha256: "synthetic-sha", storageKey: `${owner.id}/${propertyId}/${id}.pdf`, mimeType: "application/pdf", processingState: "ready", scanStatus: "clean", reviewStatus, version: 1, verified: false } });
  await prisma.documentVersion.create({ data: { id: versionId, workspaceId: workspace.id, documentId: id, version: 1, originalFilename: `synthetic-${category}.pdf`, displayName: `Synthetic ${category} record`, mimeType: "application/pdf", sizeBytes: 128, sha256: "synthetic-sha", storageKey: `${owner.id}/${propertyId}/${id}.pdf`, scanStatus: "clean", processingState: "ready", reviewStatus, source: "user_uploaded", uploadedBy: owner.id } });
  return { id, versionId };
}

async function createPipelineDocument(propertyId: string) {
  const form = new FormData();
  form.append("propertyId", propertyId); form.append("type", "Registry"); form.append("displayName", "Pipeline accepted registry");
  form.append("file", new File([syntheticPdf(["Owner: Accepted Synthetic Owner", "Address: Accepted Synthetic Address", "Survey No: SYN-PIPE"]) as unknown as ArrayBuffer], "pipeline-registry.pdf", { type: "application/pdf" }));
  const response = await uploadDocument(new Request("http://localhost:3100/api/documents", { method: "POST", headers: { cookie: ownerCookie, "Idempotency-Key": "s15-pipeline-document" }, body: form }));
  expect(response.status).toBe(201);
  const documentId = (await json(response)).data.document.id as string;
  const storage = new LocalObjectStorageAdapter("test");
  const dependencies = { storage, scanner: new TestMalwareScanner({ outcome: "available", value: { verdict: "clean" } }), parser: new LocalTextPdfParser(storage), ocr: new UnavailableOcrAdapter(), ai: new FixtureAiExtractionAdapter() };
  for (let index = 0; index < 16; index += 1) { const result = await runDocumentJobOnce("s12-s15-pipeline-worker", dependencies); if (!result) break; }
  const review = await reviewGet(new Request(`http://localhost:3100/api/documents/${documentId}/review`, { headers: { cookie: ownerCookie } }), { params: Promise.resolve({ id: documentId }) });
  expect(review.status).toBe(200);
  const proposals = (await json(review)).data.aiRuns[0].proposals as Array<{ id: string; fieldName: string; state: string }>;
  let propertyVersion = (await prisma.property.findUniqueOrThrow({ where: { id: propertyId }, select: { version: true } })).version;
  for (const proposal of proposals) {
    const action = proposal.fieldName === "ownerName" || proposal.fieldName === "address" ? "accept" : "reject";
    const reviewed = await reviewPost(new Request(`http://localhost:3100/api/documents/${documentId}/review`, { method: "POST", headers: { cookie: ownerCookie, "content-type": "application/json" }, body: JSON.stringify({ proposalId: proposal.id, action, ...(action === "accept" ? { propertyVersion } : {}) }) }), { params: Promise.resolve({ id: documentId }) });
    expect(reviewed.status).toBe(200);
    if (action === "accept") propertyVersion += 1;
  }
  const version = await prisma.documentVersion.findFirstOrThrow({ where: { documentId, version: 1 }, select: { id: true, sha256: true, scanStatus: true } });
  const document = await prisma.propertyDoc.findUniqueOrThrow({ where: { id: documentId }, select: { reviewStatus: true } });
  expect(version).toMatchObject({ scanStatus: "clean" });
  expect(document.reviewStatus).toBe("confirmed");
  expect(version.sha256).toBe(sha256Hex(syntheticPdf(["Owner: Accepted Synthetic Owner", "Address: Accepted Synthetic Address", "Survey No: SYN-PIPE"])));
  return { id: documentId, versionId: version.id };
}

let ownerCookie = "";
let otherCookie = "";
let operatorCookie = "";
let propertyId = "";
let otherPropertyId = "";
let registryRuleId = "";
let registryRuleVersion = 0;
let receipt: { id: string; versionId: string };

beforeAll(async () => {
  await prisma.user.deleteMany();
  await prisma.checklistRule.deleteMany();
  clearLocalMailbox();
  ownerCookie = await signIn("s12-owner@example.com");
  otherCookie = await signIn("s12-other@example.com");
  operatorCookie = await signIn("s12-operator@example.com");
  const operator = await prisma.user.findUniqueOrThrow({ where: { email: "s12-operator@example.com" } });
  await prisma.user.update({ where: { id: operator.id }, data: { role: "operator" } });
  propertyId = (await makeProperty(ownerCookie, "Sukoon S12-S15 Home")).id;
  otherPropertyId = (await makeProperty(otherCookie, "Other private home", "India / Maharashtra / Pune")).id;
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.checklistRule.deleteMany();
  clearLocalMailbox();
});

describe("S12 controlled published content rules", () => {
  it("keeps drafts and review state hidden, requires publication provenance, and prevents owner publication", async () => {
    const created = await rulesPost(requestWithCookie("/api/rules", operatorCookie, { method: "POST", body: JSON.stringify(baseRule("synthetic.registry.v1")) }));
    expect(created.status).toBe(201);
    const rule = (await json(created)).data.rule as { id: string };
    const missingRevision = await rulesActionRaw(new Request(`http://localhost:3100/api/rules/${rule.id}`, { method: "POST", headers: { cookie: operatorCookie, origin: "http://localhost:3100", "content-type": "application/json" }, body: JSON.stringify({ action: "submit" }) }), { params: Promise.resolve({ id: rule.id }) });
    expect(missingRevision.status).toBe(409);
    expect((await json(missingRevision)).error.code).toBe("RULE_REVISION_REQUIRED");
    expect((await json(await rulesGet(requestWithCookie(`/api/rules?propertyId=${propertyId}`, ownerCookie)))).data.rules).toEqual([]);
    expect((await rulesAction(requestWithCookie(`/api/rules/${rule.id}`, ownerCookie, { method: "POST", body: JSON.stringify({ action: "publish" }) }), { params: Promise.resolve({ id: rule.id }) })).status).toBe(403);
    expect((await rulesAction(requestWithCookie(`/api/rules/${rule.id}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "submit" }) }), { params: Promise.resolve({ id: rule.id }) })).status).toBe(200);
    const missingEvidence = await rulesAction(requestWithCookie(`/api/rules/${rule.id}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "publish" }) }), { params: Promise.resolve({ id: rule.id }) });
    expect(missingEvidence.status).toBe(422);
    const patched = await rulesPatch(requestWithCookie(`/api/rules/${rule.id}`, operatorCookie, { method: "PATCH", body: JSON.stringify({ sourceName: "Synthetic QA source", sourceReference: { kind: "synthetic" }, reviewer: "QA Operator", reviewedAt: "2026-09-11T10:00:00.000Z" }) }), { params: Promise.resolve({ id: rule.id }) });
    expect(patched.status).toBe(200);
    expect((await rulesAction(requestWithCookie(`/api/rules/${rule.id}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "publish" }) }), { params: Promise.resolve({ id: rule.id }) })).status).toBe(200);
    registryRuleId = rule.id;
    registryRuleVersion = (await prisma.checklistRule.findUniqueOrThrow({ where: { id: rule.id }, select: { version: true } })).version;
    const visible = (await json(await rulesGet(requestWithCookie(`/api/rules?propertyId=${propertyId}`, ownerCookie)))).data.rules as Array<{ id: string; status: string; applicability: string; sourceName: string | null }>;
    expect(visible).toHaveLength(1);
    expect(visible[0]).toMatchObject({ id: rule.id, status: "PUBLISHED", applicability: "APPLICABLE", sourceName: "Synthetic QA source" });
  });

  it("uses typed applicability and retires the previous published version on supersede", async () => {
    await createAndPublishRule(operatorCookie, baseRule("synthetic.future", { effectiveFrom: "2099-01-01" }));
    await createAndPublishRule(operatorCookie, baseRule("synthetic.expired", { effectiveFrom: "2020-01-01", effectiveUntil: "2020-12-31" }));
    await createAndPublishRule(operatorCookie, baseRule("synthetic.wrong-jurisdiction", { jurisdiction: "India / Gujarat / Surat" }));
    await createAndPublishRule(operatorCookie, baseRule("synthetic.wrong-type", { propertyType: "commercial" }));
    await createAndPublishRule(operatorCookie, baseRule("synthetic.unknown-owner-context", { ownershipContext: "joint" }));
    const visible = (await json(await rulesGet(requestWithCookie(`/api/rules?propertyId=${propertyId}`, ownerCookie)))).data.rules as Array<{ stableKey: string; applicability: string }>;
    expect(visible.map((rule) => rule.stableKey)).toContain("synthetic.registry.v1");
    expect(visible.map((rule) => rule.stableKey)).toContain("synthetic.unknown-owner-context");
    expect(visible.find((rule) => rule.stableKey === "synthetic.unknown-owner-context")?.applicability).toBe("UNKNOWN");
    expect(visible.map((rule) => rule.stableKey)).not.toEqual(expect.arrayContaining(["synthetic.future", "synthetic.expired", "synthetic.wrong-jurisdiction", "synthetic.wrong-type"]));

    const supersede = await rulesAction(requestWithCookie(`/api/rules/${registryRuleId}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "supersede", input: baseRule("ignored", { title: "Synthetic registry v2", description: "Updated synthetic source" }) }) }), { params: Promise.resolve({ id: registryRuleId }) });
    expect(supersede.status).toBe(201);
    const newRule = (await json(supersede)).data.rule as { id: string; version: number };
    expect(newRule.version).toBe(registryRuleVersion + 1);
    await rulesAction(requestWithCookie(`/api/rules/${newRule.id}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "submit" }) }), { params: Promise.resolve({ id: newRule.id }) });
    expect((await rulesAction(requestWithCookie(`/api/rules/${newRule.id}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "publish" }) }), { params: Promise.resolve({ id: newRule.id }) })).status).toBe(422);
    expect((await rulesPatch(requestWithCookie(`/api/rules/${newRule.id}`, operatorCookie, { method: "PATCH", body: JSON.stringify({ reviewer: "Synthetic successor reviewer", reviewedAt: "2026-09-12T10:00:00.000Z" }) }), { params: Promise.resolve({ id: newRule.id }) })).status).toBe(200);
    const publish = await rulesAction(requestWithCookie(`/api/rules/${newRule.id}`, operatorCookie, { method: "POST", body: JSON.stringify({ action: "publish" }) }), { params: Promise.resolve({ id: newRule.id }) });
    expect(publish.status).toBe(200);
    expect((await prisma.checklistRule.findUniqueOrThrow({ where: { id: registryRuleId }, select: { status: true } })).status).toBe("RETIRED");
    expect((await prisma.checklistRule.findUniqueOrThrow({ where: { id: newRule.id }, select: { supersedesId: true } })).supersedesId).toBe(registryRuleId);
  });
});

describe("S13 explainable record readiness", () => {
  it("returns NOT_ASSESSED without an applicable published checklist", async () => {
    const noMatchProperty = (await makeProperty(ownerCookie, "No matching checklist", "India / Gujarat / Surat", "commercial")).id;
    const response = await healthGet(requestWithCookie(`/api/properties/${noMatchProperty}/health`, ownerCookie), { params: Promise.resolve({ id: noMatchProperty }) });
    expect(response.status).toBe(200);
    expect((await json(response)).data.snapshot).toMatchObject({ assessment: "NOT_ASSESSED", score: null, applicableCount: 0 });
  });

  it("scores confirmed evidence, separates missing and unknown, and stores immutable history", async () => {
    receipt = await createSyntheticDocument(ownerCookie, propertyId, "confirmed");
    expect((await documentGet(requestWithCookie(`/api/documents/${receipt.id}`, operatorCookie), { params: Promise.resolve({ id: receipt.id }) })).status).toBe(404);
    const missingRuleId = (await createAndPublishRule(operatorCookie, baseRule("synthetic.noc", { title: "Synthetic NOC record", evidenceCategory: "NOC" }))).id;
    const first = await healthGet(requestWithCookie(`/api/properties/${propertyId}/health`, ownerCookie), { params: Promise.resolve({ id: propertyId }) });
    expect(first.status).toBe(200);
    const snapshot = (await json(first)).data.snapshot as { id: string; assessment: string; score: number | null; applicableCount: number; satisfiedCount: number; unknownCount: number; items: Array<{ ruleStableKey: string; evidenceState: string; rule: { sourceName: string | null } | null }> };
    expect(snapshot.assessment).toBe("RECORD_READINESS");
    expect(snapshot.items.find((item) => item.ruleStableKey === "synthetic.registry.v1")?.evidenceState).toBe("SATISFIED");
    expect(snapshot.items.find((item) => item.ruleStableKey === "synthetic.noc")?.evidenceState).toBe("MISSING");
    expect(snapshot.items.find((item) => item.ruleStableKey === "synthetic.unknown-owner-context")?.evidenceState).toBe("UNKNOWN");
    expect(snapshot.items.find((item) => item.ruleStableKey === "synthetic.registry.v1")?.rule?.sourceName).toBe("Synthetic QA source");
    expect(snapshot.score).toBe(50);
    expect(snapshot.applicableCount).toBe(2);
    expect(snapshot.satisfiedCount).toBe(1);
    expect(snapshot.unknownCount).toBe(1);
    await createSyntheticDocument(ownerCookie, propertyId, "in_review", "NOC");
    const needsReview = await healthGet(requestWithCookie(`/api/properties/${propertyId}/health?asOf=${today}`, ownerCookie), { params: Promise.resolve({ id: propertyId }) });
    expect((await json(needsReview)).data.snapshot.items.find((item: { ruleStableKey: string }) => item.ruleStableKey === "synthetic.noc")?.evidenceState).toBe("NEEDS_REVIEW");
    const second = await healthGet(requestWithCookie(`/api/properties/${propertyId}/health?asOf=${today}`, ownerCookie), { params: Promise.resolve({ id: propertyId }) });
    const secondBody = (await json(second)).data.snapshot as { id: string };
    expect(secondBody.id).not.toBe(snapshot.id);
    const history = await healthGet(requestWithCookie(`/api/properties/${propertyId}/health?history=true`, ownerCookie), { params: Promise.resolve({ id: propertyId }) });
    expect((await json(history)).data.snapshots.length).toBeGreaterThanOrEqual(2);
    expect((await healthGet(requestWithCookie(`/api/properties/${propertyId}/health`, otherCookie), { params: Promise.resolve({ id: propertyId }) })).status).toBe(404);
    expect(missingRuleId).toBeTruthy();
  });

  it("removes archived evidence from the next assessment instead of mutating old snapshots", async () => {
    await prisma.propertyDoc.update({ where: { id: receipt.id }, data: { archivedAt: new Date() } });
    const response = await healthGet(requestWithCookie(`/api/properties/${propertyId}/health?asOf=${today}`, ownerCookie), { params: Promise.resolve({ id: propertyId }) });
    const body = (await json(response)).data.snapshot as { id: string; items: Array<{ ruleStableKey: string; evidenceState: string }> };
    expect(body.items.find((item) => item.ruleStableKey === "synthetic.registry.v1")?.evidenceState).toBe("MISSING");
    const oldSnapshots = await prisma.assessmentSnapshot.count({ where: { propertyId } });
    expect(oldSnapshots).toBeGreaterThanOrEqual(2);
  });
});

describe("S14 obligations and S15 manual payments", () => {
  it("corrects loan recurrence without reviving cancelled cycles or repricing paid evidence", async () => {
    const created = await obligationsPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Loan instalment", label: "Synthetic loan correction", direction: "PAYABLE", amount: "100.25", currency: "INR", dueDate: "2027-01-31", timezone: "Asia/Kolkata", recurrenceType: "monthly", requestKey: "loan-correction-retry-0001" }) }));
    const loan = (await json(created)).data.obligation;
    const paidCycle = loan.occurrences[0];
    const beforeBalance = (await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })).loanBalancePaise;
    const payment = { amount: "10.25", currency: "INR", paymentDate: today, method: "synthetic manual record", idempotencyKey: "loan-partial-repeat-0001", expectedOccurrenceVersion: paidCycle.version };
    expect((await paymentsPost(requestWithCookie(`/api/obligations/${paidCycle.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify(payment) }), { params: Promise.resolve({ id: paidCycle.id }) })).status).toBe(201);
    expect((await paymentsPost(requestWithCookie(`/api/obligations/${paidCycle.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify(payment) }), { params: Promise.resolve({ id: paidCycle.id }) })).status).toBe(200);
    const correction = { version: loan.version, obligation: { recurrenceType: "quarterly", amount: "120.75" } };
    const patch = (cookie: string) => obligationPatch(requestWithCookie(`/api/obligations/${loan.id}`, cookie, { method: "PATCH", body: JSON.stringify(correction) }), { params: Promise.resolve({ id: loan.id }) });
    expect((await patch(otherCookie)).status).toBe(404);
    expect((await patch(ownerCookie)).status).toBe(200);
    expect((await patch(ownerCookie)).status).toBe(409);
    await obligationsGet(requestWithCookie(`/api/obligations?propertyId=${propertyId}&view=all&asOf=2027-02-01`, ownerCookie));
    const rows = await prisma.obligationOccurrence.findMany({ where: { obligationId: loan.id } });
    expect(rows.find(row => row.id === paidCycle.id)?.amountPaise).toBe(10025n);
    expect(rows.find(row => row.dueDate === "2027-04-30")).toMatchObject({ amountPaise: 12075n, status: "OPEN" });
    const cancelled = rows.find(row => row.dueDate === "2027-02-28")!;
    expect(cancelled.status).toBe("CANCELLED");
    expect((await paymentsPost(requestWithCookie(`/api/obligations/${cancelled.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ ...payment, idempotencyKey: "cancelled-loan-no-payment", expectedOccurrenceVersion: cancelled.version }) }), { params: Promise.resolve({ id: cancelled.id }) })).status).toBe(409);
    expect(await prisma.expenseLedgerEntry.count({ where: { obligationId: loan.id } })).toBe(1);
    expect((await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })).loanBalancePaise).toBe(beforeBalance);
  });

  it("generates date-only one-time/monthly/quarterly/yearly cycles with safe month ends", async () => {
    expect(occurrenceDate("2024-01-31", "monthly", 1)).toBe("2024-02-29");
    expect(occurrenceDate("2024-01-31", "monthly", 2)).toBe("2024-03-31");
    expect(occurrenceDate("2024-02-29", "yearly", 1)).toBe("2025-02-28");
    expect(occurrenceDate("2024-01-31", "quarterly", 1)).toBe("2024-04-30");
    const monthlyResponse = await obligationsPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "test", label: "Month end synthetic", direction: "PAYABLE", amount: "100", currency: "INR", dueDate: "2024-01-31", timezone: "Asia/Kolkata", recurrenceType: "monthly" }) }));
    expect(monthlyResponse.status).toBe(201);
    const monthly = (await json(monthlyResponse)).data.obligation as { id: string; version: number; recurrenceType: string; occurrences: Array<{ dueDate: string; status: string }> };
    expect(monthly.occurrences.map((occurrence) => occurrence.dueDate)).toContain("2024-02-29");
    const edited = await obligationPatch(requestWithCookie(`/api/obligations/${monthly.id}`, ownerCookie, { method: "PATCH", body: JSON.stringify({ version: monthly.version, obligation: { recurrenceType: "quarterly" } }) }), { params: Promise.resolve({ id: monthly.id }) });
    expect(edited.status).toBe(200);
    expect((await json(edited)).data.obligation.recurrenceType).toBe("quarterly");
    const nonFinancial = await obligationsPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "record", label: "Read meter", direction: "NON_FINANCIAL", currency: "INR", dueDate: today, timezone: "Asia/Kolkata", recurrenceType: "once" }) }));
    expect(nonFinancial.status).toBe(201);
    const nonFinancialBody = (await json(nonFinancial)).data.obligation as { id: string; version: number; active: boolean };
    const deactivated = await obligationAction(requestWithCookie(`/api/obligations/${nonFinancialBody.id}`, ownerCookie, { method: "POST", body: JSON.stringify({ action: "deactivate", version: nonFinancialBody.version }) }), { params: Promise.resolve({ id: nonFinancialBody.id }) });
    expect((await json(deactivated)).data.obligation.active).toBe(false);
    const reactivated = await obligationAction(requestWithCookie(`/api/obligations/${nonFinancialBody.id}`, ownerCookie, { method: "POST", body: JSON.stringify({ action: "reactivate", version: nonFinancialBody.version + 1 }) }), { params: Promise.resolve({ id: nonFinancialBody.id }) });
    expect((await json(reactivated)).data.obligation.active).toBe(true);
    expect((await obligationsGet(requestWithCookie(`/api/obligations?propertyId=${propertyId}&view=all&asOf=${today}`, ownerCookie))).status).toBe(200);
  });

  it("records the connected ₹18,450 journey with partials, paise, receipt provenance, and idempotency", async () => {
    // Use the completed S09-S11 worker and owner review path as the connected
    // journey's accepted evidence, then reuse that protected clean version as
    // the payment receipt.
    receipt = await createPipelineDocument(propertyId);
    const healthBeforePayment = await healthGet(requestWithCookie(`/api/properties/${propertyId}/health?asOf=${today}`, ownerCookie), { params: Promise.resolve({ id: propertyId }) });
    expect(healthBeforePayment.status).toBe(200);
    const healthBeforeSnapshot = (await json(healthBeforePayment)).data.snapshot as { items: Array<{ ruleStableKey: string; evidenceState: string }> };
    expect(healthBeforeSnapshot.items.find((item) => item.ruleStableKey === "synthetic.registry.v1")?.evidenceState).toBe("SATISFIED");
    expect(healthBeforeSnapshot.items.find((item) => item.ruleStableKey === "synthetic.noc")?.evidenceState).toBe("NEEDS_REVIEW");
    const created = await obligationsPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "Property tax", label: "Synthetic property tax", direction: "PAYABLE", amount: "18450", currency: "INR", dueDate: today, timezone: "Asia/Kolkata", recurrenceType: "once", reminderConfig: { enabled: false } }) }));
    expect(created.status).toBe(201);
    const obligation = (await json(created)).data.obligation as { id: string; occurrences: Array<{ id: string; version: number; amountPaise: string }> };
    const occurrence = obligation.occurrences[0];
    if (!occurrence) throw new Error("Synthetic obligation occurrence was not generated.");
    const first = await paymentsPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "10000", currency: "INR", paymentDate: today, method: "bank transfer", idempotencyKey: "s15-first", expectedOccurrenceVersion: occurrence.version }) }), { params: Promise.resolve({ id: occurrence.id }) });
    expect(first.status).toBe(201);
    const firstBody = (await json(first)).data as { payment: { id: string; amountPaise: string }; summary: { remainingPaise: string; occurrence: { version: number; status: string } } };
    expect(firstBody.payment.amountPaise).toBe("1000000");
    expect(firstBody.summary.remainingPaise).toBe("845000");
    const duplicate = await paymentsPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "10000", currency: "INR", paymentDate: today, method: "bank transfer", idempotencyKey: "s15-first", expectedOccurrenceVersion: occurrence.version }) }), { params: Promise.resolve({ id: occurrence.id }) });
    expect(duplicate.status).toBe(200);
    expect((await json(duplicate)).data.duplicate).toBe(true);
    const conflict = await paymentsPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "1", currency: "INR", paymentDate: today, method: "bank transfer", idempotencyKey: "s15-first" }) }), { params: Promise.resolve({ id: occurrence.id }) });
    expect(conflict.status).toBe(409);
    const second = await paymentsPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "8450", currency: "INR", paymentDate: today, method: "UPI", idempotencyKey: "s15-second", expectedOccurrenceVersion: firstBody.summary.occurrence.version, receiptDocumentId: receipt.id, receiptDocumentVersionId: receipt.versionId }) }), { params: Promise.resolve({ id: occurrence.id }) });
    expect(second.status).toBe(201);
    const secondBody = (await json(second)).data as { payment: { receiptDocumentId: string; receiptDocumentVersionId: string }; summary: { paidPaise: string; remainingPaise: string; occurrence: { status: string } } };
    expect(secondBody.payment).toMatchObject({ receiptDocumentId: receipt.id, receiptDocumentVersionId: receipt.versionId });
    expect(secondBody.summary).toMatchObject({ paidPaise: "1845000", remainingPaise: "0", occurrence: { status: "COMPLETED" } });
    expect(await prisma.expenseLedgerEntry.count({ where: { propertyId, obligationId: obligation.id } })).toBe(2);
    const healthAfterPayment = await healthGet(requestWithCookie(`/api/properties/${propertyId}/health?asOf=${today}`, ownerCookie), { params: Promise.resolve({ id: propertyId }) });
    expect(healthAfterPayment.status).toBe(200);
    const healthAfterSnapshot = (await json(healthAfterPayment)).data.snapshot as { items: Array<{ ruleStableKey: string; evidenceState: string }> };
    expect(healthAfterSnapshot.items.find((item) => item.ruleStableKey === "synthetic.registry.v1")?.evidenceState).toBe("SATISFIED");
    expect(healthAfterSnapshot.items.find((item) => item.ruleStableKey === "synthetic.noc")?.evidenceState).toBe("NEEDS_REVIEW");
    await prisma.$disconnect();
    await prisma.$connect();
    const restartedRead = await obligationGet(requestWithCookie(`/api/obligations/${obligation.id}`, ownerCookie), { params: Promise.resolve({ id: obligation.id }) });
    expect(restartedRead.status).toBe(200);
    expect((await json(restartedRead)).data.obligation.occurrences[0].status).toBe("COMPLETED");
    expect((await paymentsGet(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie), { params: Promise.resolve({ id: occurrence.id }) })).status).toBe(200);
    expect((await paymentsGet(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, otherCookie), { params: Promise.resolve({ id: occurrence.id }) })).status).toBe(404);
  });

  it("rejects stale and overpaying writes, and records explicit reversal correction rows", async () => {
    const created = await obligationsPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "test", label: "Reversal test", direction: "PAYABLE", amount: "100", currency: "INR", dueDate: today, timezone: "Asia/Kolkata", recurrenceType: "once" }) }));
    const occurrence = ((await json(created)).data.obligation.occurrences as Array<{ id: string; version: number }>)[0];
    if (!occurrence) throw new Error("Reversal occurrence missing.");
    const overpay = await paymentsPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "101", currency: "INR", paymentDate: today, method: "cash", idempotencyKey: "s15-overpay", expectedOccurrenceVersion: occurrence.version }) }), { params: Promise.resolve({ id: occurrence.id }) });
    expect(overpay.status).toBe(409);
    const paid = await paymentsPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "100", currency: "INR", paymentDate: today, method: "cash", idempotencyKey: "s15-reversible", expectedOccurrenceVersion: occurrence.version }) }), { params: Promise.resolve({ id: occurrence.id }) });
    const paymentId = (await json(paid)).data.payment.id as string;
    const stale = await paymentsPost(requestWithCookie(`/api/obligations/${occurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "1", currency: "INR", paymentDate: today, method: "cash", idempotencyKey: "s15-stale", expectedOccurrenceVersion: occurrence.version }) }), { params: Promise.resolve({ id: occurrence.id }) });
    expect(stale.status).toBe(409);
    const reversed = await reversePayment(requestWithCookie(`/api/payments/${paymentId}/reverse`, ownerCookie, { method: "POST", body: JSON.stringify({ idempotencyKey: "s15-reversal" }) }), { params: Promise.resolve({ id: paymentId }) });
    expect(reversed.status).toBe(200);
    const reversalBody = (await json(reversed)).data as { reversedPayment: { status: string }; payment: { status: string; source: string }; summary: { paidPaise: string } };
    expect(reversalBody.reversedPayment.status).toBe("REVERSED");
    expect(reversalBody.payment).toMatchObject({ status: "REVERSAL", source: "USER_ENTERED_CORRECTION" });
    expect(reversalBody.summary.paidPaise).toBe("0");
    expect(await prisma.expenseLedgerEntry.count({ where: { canonicalKey: { in: [`payment:${paymentId}`, `reversal:${paymentId}`] } } })).toBe(2);

    const concurrentCreated = await obligationsPost(requestWithCookie(`/api/obligations?propertyId=${propertyId}`, ownerCookie, { method: "POST", body: JSON.stringify({ type: "test", label: "Concurrent payment test", direction: "PAYABLE", amount: "100", currency: "INR", dueDate: today, timezone: "Asia/Kolkata", recurrenceType: "once" }) }));
    const concurrentOccurrence = ((await json(concurrentCreated)).data.obligation.occurrences as Array<{ id: string; version: number }>)[0];
    if (!concurrentOccurrence) throw new Error("Concurrent occurrence missing.");
    const concurrent = await Promise.all(["s15-concurrent-a", "s15-concurrent-b"].map((key) => paymentsPost(requestWithCookie(`/api/obligations/${concurrentOccurrence.id}/payments`, ownerCookie, { method: "POST", body: JSON.stringify({ amount: "100", currency: "INR", paymentDate: today, method: "cash", idempotencyKey: key, expectedOccurrenceVersion: concurrentOccurrence.version }) }), { params: Promise.resolve({ id: concurrentOccurrence.id }) })));
    expect(concurrent.map((response) => response.status).sort()).toEqual([201, 409]);
  });

  it("keeps all S12-S15 private routes property-scoped for User B after a fresh read", async () => {
    expect((await obligationGet(requestWithCookie("/api/obligations/not-owner", otherCookie), { params: Promise.resolve({ id: "not-owner" }) })).status).toBe(404);
    expect((await obligationsGet(requestWithCookie(`/api/obligations?propertyId=${propertyId}&view=all`, otherCookie))).status).toBe(404);
    expect((await obligationsGet(requestWithCookie(`/api/obligations?propertyId=${otherPropertyId}&view=all`, otherCookie))).status).toBe(200);
    expect((await healthGet(requestWithCookie(`/api/properties/${propertyId}/health`, otherCookie), { params: Promise.resolve({ id: propertyId }) })).status).toBe(404);
    const fresh = await obligationsGet(requestWithCookie(`/api/obligations?propertyId=${propertyId}&view=all&asOf=${today}`, ownerCookie));
    expect(fresh.status).toBe(200);
    expect((await json(fresh)).data.obligations.length).toBeGreaterThan(0);
    expect((await prisma.timelineEvent.count({ where: { propertyId } })).valueOf()).toBeGreaterThan(0);
  });
});

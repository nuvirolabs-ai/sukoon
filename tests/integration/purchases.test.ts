import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { purchaseCommand, purchaseSnapshot, candidateInput } from "@/lib/purchases";
import type { Principal } from "@/lib/authz";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { readLocalOtp } from "@/lib/auth-mailbox";
import { GET, POST } from "@/app/api/purchases/route";
import { createDocumentForUser, getProtectedDocumentBytes, getDocumentDetailsForUser, listPurchaseDocumentsForUser, deleteDocumentForUser } from "@/lib/vault-repository";
import { recordPurchaseEvidence, purchaseEvidence } from "@/lib/purchase-evidence";
import { confirmManualDocumentReview } from "@/lib/document-review";
import { runDocumentJobOnce } from "@/lib/document-processing";
import { LocalObjectStorageAdapter, TestMalwareScanner, UnavailableAiExtraction, UnavailableOcrAdapter } from "@/lib/providers";
import { LocalTextPdfParser } from "@/lib/document-parsing";
import { readStateForUser, replaceStateForUser } from "@/lib/repository";
import { GET as documentGet } from "@/app/api/documents/[id]/route";
import { GET as documentList } from "@/app/api/documents/route";
import { GET as evidenceGet } from "@/app/api/purchases/evidence/route";
import { GET as reviewGet } from "@/app/api/documents/[id]/review/route";
import { POST as processingPost } from "@/app/api/documents/[id]/process/route";
import { createPrivacyRequest, cancelPrivacyRequest } from "@/lib/privacy-requests";
import { ACCOUNT_EXPORT_SCOPE, requestAccountExport, runAccountExportOnce, downloadAccountExport, cleanupAccountExports } from "@/lib/account-export";
import { readZipEntries } from "@/lib/zip";
import { createConstructionForUser, mutateConstructionForUser } from "@/lib/construction";
import { createObligationForUser } from "@/lib/obligations";
import { recordPaymentForUser } from "@/lib/payments";
import { previewPurchaseImport } from "@/lib/purchase-import-preview";
const owner: Principal = { userId: randomUUID(), workspaceId: randomUUID(), email: "purchase-test-owner@example.com", role: "owner" };
const other: Principal = { userId: randomUUID(), workspaceId: randomUUID(), email: "purchase-test-other@example.com", role: "owner" };
beforeAll(async () => { for (const actor of [owner, other]) { await prisma.user.create({ data: { id: actor.userId, email: actor.email, name: "Synthetic purchase fixture", emailVerified: true } }); await prisma.workspace.create({ data: { id: actor.workspaceId, ownerUserId: actor.userId, name: "Synthetic purchase fixture" } }); } });
afterAll(async () => { const docs = await prisma.propertyDoc.findMany({ where: { workspaceId: owner.workspaceId }, select: { id: true } }); await prisma.outboxEvent.deleteMany({ where: { aggregateId: { in: docs.map(d => d.id) } } }); await prisma.user.deleteMany({ where: { id: { in: [owner.userId, other.userId] } } }); });
it("lets an ordinary new OTP buyer create an account container without a Passport", async () => {
  const email = `fresh-purchase-${randomUUID()}@example.com`, handlers = toNextJsHandler(auth);
  const request = (path: string, body: unknown, cookie = "") => new Request(`http://localhost:3100${path}`, { method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost:3100", cookie }, body: JSON.stringify(body) });
  await handlers.POST(request("/api/auth/email-otp/send-verification-otp", { email, type: "sign-in" }));
  const signed = await handlers.POST(request("/api/auth/sign-in/email-otp", { email, otp: readLocalOtp(email)?.otp }));
  expect(signed.status).toBe(200);
  const cookie = signed.headers.get("set-cookie")!.split(";", 1)[0]!;
  try {
    expect((await GET(new Request("http://localhost:3100/api/purchases"))).status).toBe(401);
    const empty = await GET(new Request("http://localhost:3100/api/purchases", { headers: { cookie } }));
    expect(await empty.json()).toEqual({ data: [] });
    const input = { action: "create-workspace", name: "First buying organizer", requestKey: randomUUID() };
    const created = await POST(request("/api/purchases", input, cookie)); expect(created.status).toBe(200);
    const id = (await created.json()).data.id;
    const denied = await POST(new Request("http://localhost:3100/api/purchases", { method: "POST", headers: { cookie, origin: "https://unrelated.invalid", "Content-Type": "application/json" }, body: JSON.stringify(input) })); expect(denied.status).toBe(403);
    expect((await GET(new Request(`http://localhost:3100/api/purchases?id=${id}`, { headers: { cookie } }))).status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email }, include: { workspace: true } });
    expect(user.workspace).not.toBeNull();
    expect(await prisma.property.count({ where: { workspaceId: user.workspace!.id } })).toBe(0);
  } finally { await prisma.user.deleteMany({ where: { email } }); }
});
it("preserves unknowns and rejects fabricated conversion stages and invalid original units", () => {
  expect(candidateInput({ name: "External prospect" })).toMatchObject({ askingPricePaise: null, budgetPaise: null, areaValue: null, propertyType: null, stage: "CONSIDERING" });
  expect(() => candidateInput({ name: "Prospect", areaValue: "100" })).toThrow();
  expect(() => candidateInput({ name: "Prospect", stage: "PURCHASED" })).toThrow();
  expect(() => candidateInput({ name: "Prospect", askingPrice: "-1" })).toThrow();
});
it("denies purchase lists, metadata, bytes, processing and history to basic property delegates and operators through API handlers", async () => {
  const purchase = await purchaseCommand(owner, { action: "create-workspace", name: "API boundary proof", requestKey: randomUUID() });
  const candidate = await purchaseCommand(owner, { action: "add-candidate", purchaseWorkspaceId: purchase.id, name: "Private candidate", requestKey: randomUUID() });
  const docId = randomUUID(), propertyId = randomUUID();
  const operatorId = randomUUID(), delegateId = randomUUID();
  const handlers = toNextJsHandler(auth);
  await prisma.property.create({ data: { id: propertyId, workspaceId: owner.workspaceId, name: "Unrelated owned property", type: "flat", city: "Synthetic", area: "Synthetic", address: "Synthetic", ownerName: "Synthetic" } });
  await prisma.propertyDoc.create({ data: { id: docId, workspaceId: owner.workspaceId, purchaseCandidateId: candidate.id, type: "Other", name: "PRIVATE_PURCHASE_FILENAME", uploadDate: "2026-09-12", sizeBytes: 0, storageKey: `synthetic/${docId}.pdf`, mimeType: "application/pdf" } });
  try {
    for (const [id, role] of [[delegateId, "owner"], [operatorId, "operator"]] as const) {
      const email = `${id}@example.com`;
      await prisma.user.create({ data: { id, email, name: "Synthetic API boundary", emailVerified: true, role } });
      await prisma.workspace.create({ data: { id: randomUUID(), ownerUserId: id, name: "Separate account" } });
      if (id === delegateId) await prisma.shareLink.create({ data: { id: randomUUID(), workspaceId: owner.workspaceId, propertyId, grantorId: owner.userId, inviteeEmail: email, inviteeUserId: id, acceptedAt: new Date(), role: "FAMILY", tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 86400000).toISOString(), scopes: { create: { id: randomUUID(), scopeType: "PROPERTY_BASIC_READ" } } } });
      await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
      const signed = await handlers.POST(new Request("http://localhost:3100/api/auth/sign-in/email-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, otp: readLocalOtp(email)!.otp }) }));
      const cookie = signed.headers.get("set-cookie")!.split(";", 1)[0]!;
      const req = (url: string, post = false) => new Request(`http://localhost:3100${url}`, { headers: { cookie, origin: "http://localhost:3100", "content-type": "application/json" }, ...(post ? { method: "POST", body: JSON.stringify({ stage: "scan" }) } : {}) });
      const params = { params: Promise.resolve({ id: docId }) };
      const responses = [
        await documentList(req(`/api/documents?purchaseCandidateId=${candidate.id}`)),
        await evidenceGet(req(`/api/purchases/evidence?candidateId=${candidate.id}`)),
        await documentGet(req(`/api/documents/${docId}?metadata=true`), params),
        await documentGet(req(`/api/documents/${docId}?download=true`), params),
        await reviewGet(req(`/api/documents/${docId}/review`), params),
        await processingPost(req(`/api/documents/${docId}/process`, true), params),
      ];
      for (const response of responses) { expect([401, 403, 404]).toContain(response.status); expect(await response.text()).not.toContain("PRIVATE_PURCHASE_FILENAME"); }
    }
  } finally { await prisma.user.deleteMany({ where: { id: { in: [delegateId, operatorId] } } }); await prisma.property.delete({ where: { id: propertyId } }); }
});
it("runs purchase context through quarantine, scan/review, exact-version evidence and authorization without owned assets", async () => {
  const workspace = await purchaseCommand(owner, { action: "create-workspace", name: "Evidence isolation", requestKey: randomUUID() });
  const candidate = await purchaseCommand(owner, { action: "add-candidate", name: "Evidence prospect", purchaseWorkspaceId: workspace.id, requestKey: randomUUID() });
  const wrong = await purchaseCommand(owner, { action: "add-candidate", name: "Other candidate", purchaseWorkspaceId: workspace.id, requestKey: randomUUID() });
  const entry = await purchaseCommand(owner, { action: "add-entry", candidateId: candidate.id, kind: "DOCUMENT_REQUEST", body: "Synthetic image request", requestKey: randomUUID() });
  const question = await purchaseCommand(owner, { action: "add-entry", candidateId: candidate.id, kind: "QUESTION", body: "Synthetic open question", requestKey: randomUUID() });
  const storage = new LocalObjectStorageAdapter("test");
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1sAAAAASUVORK5CYII=", "base64");
  const input = { userId: owner.userId, purchaseCandidateId: candidate.id, category: "Other", idempotencyKey: randomUUID(), filename: "purchase-fixture.png", mimeType: "image/png", bytes, storage };
  const upload = await createDocumentForUser(input), doc = upload.document, v = doc.versions[0]!;
  expect(doc).toMatchObject({ propertyId: null, purchaseCandidateId: candidate.id, scanStatus: "scan_pending" });
  await expect(getProtectedDocumentBytes(owner.userId, doc.id, storage)).rejects.toMatchObject({ status: 423 });
  await expect(getDocumentDetailsForUser(other.userId, doc.id)).rejects.toMatchObject({ status: 404 });
  await expect(listPurchaseDocumentsForUser(other.userId, candidate.id)).rejects.toMatchObject({ status: 404 });
  const receive = { candidateId: candidate.id, entryId: entry.id, version: 0, action: "RECEIVE", documentVersionId: v.id, note: "Buyer reports receiving image, still quarantined", source: "BUYER_REPORTED_SELLER", requestKey: randomUUID() };
  await recordPurchaseEvidence(owner, receive);
  expect((await recordPurchaseEvidence(owner, receive)).duplicate).toBe(true);
  await expect(recordPurchaseEvidence(owner, { ...receive, action: "REVIEW", version: 1, requestKey: randomUUID() })).rejects.toMatchObject({ status: 423 });
  await expect(recordPurchaseEvidence(owner, { ...receive, candidateId: wrong.id, requestKey: randomUUID() })).rejects.toMatchObject({ status: 404 });
  const deps = { storage, scanner: new TestMalwareScanner({ outcome: "available", value: { verdict: "clean" } }), parser: new LocalTextPdfParser(storage), ocr: new UnavailableOcrAdapter(), ai: new UnavailableAiExtraction() };
  for (let i = 0; i < 20; i++) {
    await runDocumentJobOnce("purchase-fixture-scan", deps);
    if ((await prisma.propertyDoc.findUniqueOrThrow({ where: { id: doc.id } })).scanStatus === "clean") break;
  }
  expect((await prisma.propertyDoc.findUniqueOrThrow({ where: { id: doc.id } })).scanStatus).toBe("clean");
  await confirmManualDocumentReview({ userId: owner.userId, documentId: doc.id, documentVersion: 1, category: "Other" });
  for (let i = 0; i < 8; i++) if (!await runDocumentJobOnce("purchase-fixture-downstream", deps)) break;
  expect((await getProtectedDocumentBytes(owner.userId, doc.id, storage)).bytes).toEqual(bytes);
  const ownedPropertyId = randomUUID();
  await prisma.property.create({ data: { id: ownedPropertyId, workspaceId: owner.workspaceId, name: "Separate owned fixture", type: "flat", city: "Synthetic", area: "Synthetic", address: "Synthetic", ownerName: "Synthetic" } });
  try {
    const selection = { candidateId: candidate.id, targetPropertyId: ownedPropertyId, documentVersionIds: [v.id] };
    const preview = await previewPurchaseImport(owner, selection);
    expect(preview).toMatchObject({ mode: "PREVIEW_ONLY", importEnabled: false });
    expect(preview.selections[0]).toMatchObject({ sourceVersion: 1, sourceSha256: v.sha256, current: true });
    await expect(previewPurchaseImport(other, selection)).rejects.toMatchObject({ status: 404 });
    await expect(previewPurchaseImport(owner, { ...selection, candidateId: wrong.id })).rejects.toMatchObject({ status: 404 });
    await expect(previewPurchaseImport(owner, { ...selection, documentVersionIds: [v.id, v.id] })).rejects.toMatchObject({ status: 400 });
    expect(await prisma.propertyDoc.count({ where: { propertyId: ownedPropertyId } })).toBe(0);
    const project = await createConstructionForUser(owner.userId, { propertyId: ownedPropertyId, name: "Separate Construction fixture", projectType: "NEW_HOME", builtUpArea: "100", areaUnit: "sqft", floorCount: 1, qualityLevel: "STANDARD", estimatedBudgetPaise: "10000", startDate: "2026-09-12", targetCompletionDate: "2027-09-12", requirements: "Synthetic only", idempotencyKey: randomUUID() });
    await expect(mutateConstructionForUser(owner.userId, project.id, { action: "DOCUMENT_LINK", version: project.version, documentId: doc.id, documentVersionId: v.id, category: "Plan", idempotencyKey: randomUUID() })).rejects.toMatchObject({ status: 404 });
    const obligation = await createObligationForUser(owner.userId, ownedPropertyId, { type: "Synthetic", label: "Synthetic invoice", direction: "PAYABLE", amountPaise: "100", currency: "INR", dueDate: "2026-09-12", timezone: "Asia/Kolkata", recurrenceType: "once" });
    const occurrence = await prisma.obligationOccurrence.findFirstOrThrow({ where: { obligationId: obligation.id } });
    await expect(recordPaymentForUser(owner.userId, occurrence.id, { amountPaise: "100", currency: "INR", paymentDate: "2026-09-12", method: "Synthetic manual", idempotencyKey: randomUUID(), receiptDocumentId: doc.id, receiptDocumentVersionId: v.id })).rejects.toMatchObject({ status: 422, code: "RECEIPT_NOT_AVAILABLE" });
    expect(await prisma.obligationPayment.count({ where: { occurrenceId: occurrence.id } })).toBe(0);
  } finally { await prisma.property.delete({ where: { id: ownedPropertyId } }); }
  await recordPurchaseEvidence(owner, { ...receive, action: "REVIEW", version: 1, note: "Reviewed by buyer, not legal clearance", requestKey: randomUUID() });
  const answer = { ...receive, entryId: question.id, action: "ANSWER", version: 0, note: "User answer with source version", requestKey: randomUUID() };
  await recordPurchaseEvidence(owner, answer);
  await recordPurchaseEvidence(owner, { ...answer, action: "RESOLVE", version: 1, requestKey: randomUUID() });
  await recordPurchaseEvidence(owner, { ...answer, action: "REOPEN", version: 2, note: "Reopened pending clarification", requestKey: randomUUID() });
  await expect(recordPurchaseEvidence(owner, { ...answer, version: 0, requestKey: randomUUID() })).rejects.toMatchObject({ status: 409 });
  const replacement = await createDocumentForUser({ ...input, idempotencyKey: randomUUID(), replaceDocumentId: doc.id });
  expect(replacement.document.version).toBe(2);
  await expect(getProtectedDocumentBytes(owner.userId, doc.id, storage)).rejects.toMatchObject({ status: 423 });
  expect((await getProtectedDocumentBytes(owner.userId, doc.id, storage, v.id)).bytes).toEqual(bytes);
  const history = await purchaseEvidence(owner, candidate.id);
  expect(history.find(e => e.id === question.id)).toMatchObject({ state: "OPEN", version: 3 });
  expect(history.find(e => e.id === question.id)!.events[0]!.evidence).toMatchObject({ version: 1, current: false, available: true });
  const privacy = await createPrivacyRequest(owner.userId, { kind: "EXPORT_ACCOUNT", requestKey: randomUUID(), confirmed: true });
  await requestAccountExport(owner.userId, privacy.id, { confirmed: true, scope: ACCOUNT_EXPORT_SCOPE, expiresAt: new Date(Date.now() + 3600000).toISOString() });
  expect((await runAccountExportOnce("purchase-export", storage))?.status).toBe("succeeded");
  const archived = readZipEntries(await downloadAccountExport(owner.userId, privacy.id, storage)).find(e => e.name === "account-records.json")!.bytes.toString();
  expect(archived).toContain(candidate.id); expect(archived).toContain(v.id); expect(archived).toContain("Reopened pending clarification");
  expect(archived).toContain('"purchaseCandidateId"'); expect(archived).not.toContain('"storageKey"'); expect(archived).not.toContain('"payloadHash"');
  await cancelPrivacyRequest(owner.userId, privacy.id); await cleanupAccountExports(storage);
  const state = await readStateForUser(owner.userId); expect(state.state.docs).toEqual([]);
  await replaceStateForUser(owner.userId, state.state, state.version);
  expect(await prisma.propertyDoc.count({ where: { id: doc.id } })).toBe(1);
  await expect(prisma.propertyDoc.update({ where: { id: doc.id }, data: { purchaseCandidateId: wrong.id } })).rejects.toThrow();
  await deleteDocumentForUser(owner.userId, doc.id, storage);
  expect((await purchaseEvidence(owner, candidate.id)).find(e => e.id === question.id)!.events[0]!.evidence?.available).toBe(false);
  expect((await storage.get((await prisma.documentVersion.findUniqueOrThrow({ where: { id: v.id } })).storageKey)).outcome).toBe("unavailable");
  expect(await prisma.property.count({ where: { workspaceId: owner.workspaceId } })).toBe(0);
});
it("isolates prospects, deduplicates retries, guards stale edits and retains history without owned assets", async () => {
  const create = { action: "create-workspace", name: "External home search", requestKey: randomUUID() };
  const [a, b] = await Promise.all([purchaseCommand(owner, create), purchaseCommand(owner, create)]);
  expect(a.id).toBe(b.id);
  const details = { name: "Synthetic not owned", propertyType: "flat", location: "Synthetic district", areaValue: "100.50", areaUnit: "sqft", askingPrice: "1000.25", budget: "1200.75", notes: "Private buyer note", source: "Entered seller reference is not authority" };
  const add = { ...details, action: "add-candidate", purchaseWorkspaceId: a.id, requestKey: randomUUID() };
  const candidate = await purchaseCommand(owner, add);
  expect((await purchaseCommand(owner, add)).id).toBe(candidate.id);
  await expect(purchaseCommand(other, add)).rejects.toMatchObject({ status: 404 });
  await expect(purchaseSnapshot(other, a.id)).rejects.toMatchObject({ status: 404 });
  expect(await purchaseSnapshot(other)).toEqual([]);
  const request = { action: "add-entry", candidateId: candidate.id, kind: "DOCUMENT_REQUEST", body: "User-selected plan request; not mandatory or delivered", requestKey: randomUUID() };
  const entry = await purchaseCommand(owner, request);
  expect((await purchaseCommand(owner, request)).id).toBe(entry.id);
  await expect(purchaseCommand(other, { ...request, requestKey: randomUUID() })).rejects.toMatchObject({ status: 404 });
  const update = { ...details, action: "update-candidate", candidateId: candidate.id, version: 0, notes: "Corrected private note", stage: "REVIEWING", requestKey: randomUUID() };
  await purchaseCommand(owner, update);
  await expect(purchaseCommand(owner, { ...update, requestKey: randomUUID() })).rejects.toMatchObject({ status: 409 });
  const snapshot = (await purchaseSnapshot(owner, a.id))[0]!;
  expect(snapshot.candidates[0]).toMatchObject({ askingPricePaise: 100025n, budgetPaise: 120075n, notes: "Corrected private note", stage: "REVIEWING", version: 1 });
  expect(snapshot.candidates[0]!.entries.map(entry => entry.kind).sort()).toEqual(["DOCUMENT_REQUEST", "HISTORY"]);
  expect(await prisma.property.count({ where: { workspaceId: owner.workspaceId } })).toBe(0);
  expect(await prisma.shareLink.count({ where: { workspaceId: owner.workspaceId } })).toBe(0);
  // Verify the exact FK cascade used by the existing scoped erasure graph without
  // deleting even this fixture: rollback restores all rows after assertions.
  await expect(prisma.$transaction(async tx => {
    await tx.user.delete({ where: { id: owner.userId } });
    expect(await tx.purchaseWorkspace.count({ where: { workspaceId: owner.workspaceId } })).toBe(0);
    expect(await tx.purchaseCandidate.count({ where: { workspaceId: owner.workspaceId } })).toBe(0);
    expect(await tx.purchaseEntry.count({ where: { workspaceId: owner.workspaceId } })).toBe(0);
    throw new Error("ROLLBACK_SYNTHETIC_CASCADE_PROOF");
  })).rejects.toThrow("ROLLBACK_SYNTHETIC_CASCADE_PROOF");
  expect((await purchaseSnapshot(owner, a.id))[0]!.candidates).toHaveLength(1);
});

import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { purchaseCommand } from "@/lib/purchases";
import type { Principal } from "@/lib/authz";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { readLocalOtp } from "@/lib/auth-mailbox";
import { POST } from "@/app/api/purchases/route";
import { previewPurchaseImport } from "@/lib/purchase-import-preview";
import { executePurchaseImport } from "@/lib/purchase-import";
import { createDocumentForUser } from "@/lib/vault-repository";
import { confirmManualDocumentReview } from "@/lib/document-review";
import { runDocumentJobOnce } from "@/lib/document-processing";
import { LocalObjectStorageAdapter, TestMalwareScanner, UnavailableAiExtraction, UnavailableOcrAdapter } from "@/lib/providers";
import { LocalTextPdfParser } from "@/lib/document-parsing";
import { POST as importPost } from "@/app/api/purchases/import/route";

/**
 * T02 import executor acceptance (isolated synthetic principals + test DB).
 * No demo data, no grants, no ownership transfer anywhere in this file.
 */
const owner: Principal = { userId: randomUUID(), workspaceId: randomUUID(), email: "import-test-owner@example.com", role: "owner" };
const other: Principal = { userId: randomUUID(), workspaceId: randomUUID(), email: "import-test-other@example.com", role: "owner" };
const storage = new LocalObjectStorageAdapter("test");
const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1sAAAAASUVORK5CYII=", "base64");

beforeAll(async () => {
  for (const actor of [owner, other]) {
    await prisma.user.create({ data: { id: actor.userId, email: actor.email, name: "Synthetic import fixture", emailVerified: true } });
    await prisma.workspace.create({ data: { id: actor.workspaceId, ownerUserId: actor.userId, name: "Synthetic import fixture" } });
  }
});
afterAll(async () => {
  const docs = await prisma.propertyDoc.findMany({ where: { workspaceId: { in: [owner.workspaceId, other.workspaceId] } }, select: { id: true } });
  await prisma.outboxEvent.deleteMany({ where: { aggregateId: { in: docs.map(d => d.id) } } });
  await prisma.user.deleteMany({ where: { id: { in: [owner.userId, other.userId] } } });
});

async function readyCandidate() {
  const workspace = await purchaseCommand(owner, { action: "create-workspace", name: "Import fixture workspace", requestKey: randomUUID() });
  const candidate = await purchaseCommand(owner, { action: "add-candidate", name: "Import prospect", purchaseWorkspaceId: workspace.id, requestKey: randomUUID() });
  const upload = await createDocumentForUser({ userId: owner.userId, purchaseCandidateId: candidate.id, category: "Other", idempotencyKey: randomUUID(), filename: "import-fixture.png", mimeType: "image/png", bytes, storage });
  const doc = upload.document, v = doc.versions[0]!;
  const deps = { storage, scanner: new TestMalwareScanner({ outcome: "available", value: { verdict: "clean" } }), parser: new LocalTextPdfParser(storage), ocr: new UnavailableOcrAdapter(), ai: new UnavailableAiExtraction() };
  for (let i = 0; i < 20; i++) {
    await runDocumentJobOnce("import-fixture-scan", deps);
    if ((await prisma.propertyDoc.findUniqueOrThrow({ where: { id: doc.id } })).scanStatus === "clean") break;
  }
  expect((await prisma.propertyDoc.findUniqueOrThrow({ where: { id: doc.id } })).scanStatus).toBe("clean");
  await confirmManualDocumentReview({ userId: owner.userId, documentId: doc.id, documentVersion: 1, category: "Other" });
  return { candidate, doc, versionId: v.id, sha256: v.sha256 };
}

async function ownedProperty(actor: Principal, name: string) {
  const id = randomUUID();
  await prisma.property.create({ data: { id, workspaceId: actor.workspaceId, name, type: "flat", city: "Synthetic", area: "Synthetic", address: "Synthetic", ownerName: "Synthetic" } });
  return id;
}

it("executes a confirmed import with lineage, fresh scan queue, history and timeline", async () => {
  const { candidate, doc, versionId, sha256 } = await readyCandidate();
  const targetPropertyId = await ownedProperty(owner, "Import destination");
  try {
    const selection = { candidateId: candidate.id, targetPropertyId, documentVersionIds: [versionId] };
    const preview = await previewPurchaseImport(owner, selection);
    expect(preview).toMatchObject({ mode: "PREVIEW_ONLY", importEnabled: false });
    expect(await prisma.propertyDoc.count({ where: { propertyId: targetPropertyId } })).toBe(0);
    const key = randomUUID();
    const result = await executePurchaseImport(owner, { ...selection, confirmed: true, requestKey: key });
    expect(result).toMatchObject({ mode: "EXECUTED", candidateId: candidate.id, targetPropertyId, created: 1 });
    expect(result.notices).toHaveLength(4);
    const item = result.items[0]!;
    expect(item).toMatchObject({ sourceVersionId: versionId, sourceSha256: sha256, version: 1, scanStatus: "scan_pending", duplicate: false });
    // Destination copy: owned Passport context, lineage preserved, fresh scan state.
    const copy = await prisma.propertyDoc.findUniqueOrThrow({ where: { id: item.documentId }, include: { versions: true } });
    expect(copy).toMatchObject({ workspaceId: owner.workspaceId, propertyId: targetPropertyId, purchaseCandidateId: null, provenance: "purchase_import", sourceDocumentId: doc.id, sourceVersionId: versionId, sourceSha256: sha256, sourceCandidateId: candidate.id, scanStatus: "scan_pending", reviewStatus: "awaiting_review" });
    expect(copy.storageKey).not.toBe(doc.storageKey);
    // Copied bytes are scannable through the normal pipeline (fresh verdict, not reused).
    const deps = { storage, scanner: new TestMalwareScanner({ outcome: "available", value: { verdict: "clean" } }), parser: new LocalTextPdfParser(storage), ocr: new UnavailableOcrAdapter(), ai: new UnavailableAiExtraction() };
    for (let i = 0; i < 20; i++) {
      await runDocumentJobOnce("import-copy-scan", deps);
      if ((await prisma.propertyDoc.findUniqueOrThrow({ where: { id: copy.id } })).scanStatus === "clean") break;
    }
    expect((await prisma.propertyDoc.findUniqueOrThrow({ where: { id: copy.id } })).scanStatus).toBe("clean");
    // Candidate original untouched; append-only history + property timeline recorded.
    expect(await prisma.propertyDoc.findUniqueOrThrow({ where: { id: doc.id } })).toMatchObject({ version: 1, scanStatus: "clean" });
    const history = await prisma.purchaseEntry.findFirstOrThrow({ where: { requestKey: `purchase-import-history-${key}` } });
    expect(history.kind).toBe("HISTORY");
    expect(history.body).toContain(targetPropertyId);
    const event = await prisma.timelineEvent.findFirstOrThrow({ where: { workspaceId: owner.workspaceId, propertyId: targetPropertyId, title: "Purchase import recorded" } });
    expect(event.detail).toContain(key);
  } finally {
    await prisma.propertyDoc.deleteMany({ where: { workspaceId: owner.workspaceId, propertyId: targetPropertyId } });
    await prisma.property.delete({ where: { id: targetPropertyId } });
  }
});

it("requires explicit confirmation and a bounded selection", async () => {
  const { candidate, versionId } = await readyCandidate();
  const targetPropertyId = await ownedProperty(owner, "Confirmation gate");
  try {
    const base = { candidateId: candidate.id, targetPropertyId, documentVersionIds: [versionId], requestKey: randomUUID() };
    await expect(executePurchaseImport(owner, base)).rejects.toMatchObject({ status: 400, code: "IMPORT_CONFIRMATION_REQUIRED" });
    await expect(executePurchaseImport(owner, { ...base, confirmed: false })).rejects.toMatchObject({ status: 400 });
    await expect(executePurchaseImport(owner, { ...base, confirmed: true, documentVersionIds: [] })).rejects.toMatchObject({ status: 400 });
    await expect(executePurchaseImport(owner, { ...base, confirmed: true, documentVersionIds: [versionId, versionId] })).rejects.toMatchObject({ status: 400 });
    await expect(executePurchaseImport(owner, { ...base, confirmed: true, requestKey: "short" })).rejects.toMatchObject({ status: 400 });
    expect(await prisma.propertyDoc.count({ where: { propertyId: targetPropertyId } })).toBe(0);
  } finally {
    await prisma.property.delete({ where: { id: targetPropertyId } });
  }
});

it("denies cross-principal and share-scoped import attempts without leaking", async () => {
  const { candidate, versionId } = await readyCandidate();
  const targetPropertyId = await ownedProperty(owner, "Identity boundary");
  const otherPropertyId = await ownedProperty(other, "Other buyer passport");
  // Share-scoped delegate: property share on the target, but no candidate access.
  const delegateId = randomUUID(), delegateEmail = `${delegateId}@example.com`;
  await prisma.user.create({ data: { id: delegateId, email: delegateEmail, name: "Synthetic delegate", emailVerified: true } });
  const delegateWorkspace = randomUUID();
  await prisma.workspace.create({ data: { id: delegateWorkspace, ownerUserId: delegateId, name: "Separate account" } });
  await prisma.shareLink.create({ data: { id: randomUUID(), workspaceId: owner.workspaceId, propertyId: targetPropertyId, grantorId: owner.userId, inviteeEmail: delegateEmail, inviteeUserId: delegateId, acceptedAt: new Date(), role: "FAMILY", tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 86400000).toISOString(), scopes: { create: { id: randomUUID(), scopeType: "PROPERTY_BASIC_READ" } } } });
  const delegate: Principal = { userId: delegateId, workspaceId: delegateWorkspace, email: delegateEmail, role: "owner" };
  try {
    const selection = { candidateId: candidate.id, targetPropertyId, documentVersionIds: [versionId], confirmed: true, requestKey: randomUUID() };
    await expect(executePurchaseImport(other, selection)).rejects.toMatchObject({ status: 404 });
    await expect(previewPurchaseImport(other, selection)).rejects.toMatchObject({ status: 404 });
    await expect(executePurchaseImport(delegate, selection)).rejects.toMatchObject({ status: 404 });
    await expect(executePurchaseImport(owner, { ...selection, targetPropertyId: otherPropertyId, requestKey: randomUUID() })).rejects.toMatchObject({ status: 404 });
    await expect(executePurchaseImport(owner, { candidateId: "missing", targetPropertyId, documentVersionIds: [versionId], confirmed: true, requestKey: randomUUID() })).rejects.toMatchObject({ status: 404 });
    expect(await prisma.propertyDoc.count({ where: { propertyId: targetPropertyId } })).toBe(0);
    expect(await prisma.shareLink.count({ where: { workspaceId: owner.workspaceId } })).toBe(1);
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [delegateId] } } });
    await prisma.property.delete({ where: { id: targetPropertyId } });
    await prisma.property.delete({ where: { id: otherPropertyId } });
  }
});

it("refuses unready evidence and mismatched versions", async () => {
  const workspace = await purchaseCommand(owner, { action: "create-workspace", name: "Unready fixture", requestKey: randomUUID() });
  const candidate = await purchaseCommand(owner, { action: "add-candidate", name: "Unready prospect", purchaseWorkspaceId: workspace.id, requestKey: randomUUID() });
  const pending = await createDocumentForUser({ userId: owner.userId, purchaseCandidateId: candidate.id, category: "Other", idempotencyKey: randomUUID(), filename: "unready-fixture.png", mimeType: "image/png", bytes, storage });
  const targetPropertyId = await ownedProperty(owner, "Readiness gate");
  try {
    const pendingVersion = pending.document.versions[0]!.id;
    await expect(executePurchaseImport(owner, { candidateId: candidate.id, targetPropertyId, documentVersionIds: [pendingVersion], confirmed: true, requestKey: randomUUID() })).rejects.toMatchObject({ status: 423 });
    const deps = { storage, scanner: new TestMalwareScanner({ outcome: "available", value: { verdict: "clean" } }), parser: new LocalTextPdfParser(storage), ocr: new UnavailableOcrAdapter(), ai: new UnavailableAiExtraction() };
    for (let i = 0; i < 20; i++) {
      await runDocumentJobOnce("unready-fixture-scan", deps);
      if ((await prisma.propertyDoc.findUniqueOrThrow({ where: { id: pending.document.id } })).scanStatus === "clean") break;
    }
    await expect(executePurchaseImport(owner, { candidateId: candidate.id, targetPropertyId, documentVersionIds: [pendingVersion], confirmed: true, requestKey: randomUUID() })).rejects.toMatchObject({ status: 423, code: "IMPORT_EVIDENCE_NOT_READY" });
    await expect(executePurchaseImport(owner, { candidateId: candidate.id, targetPropertyId, documentVersionIds: [randomUUID().replaceAll("-", "")], confirmed: true, requestKey: randomUUID() })).rejects.toMatchObject({ status: 404 });
    expect(await prisma.propertyDoc.count({ where: { propertyId: targetPropertyId } })).toBe(0);
  } finally {
    await prisma.property.delete({ where: { id: targetPropertyId } });
  }
});

it("replays idempotently on the same key and conflicts on key reuse", async () => {
  const { candidate, versionId } = await readyCandidate();
  const targetPropertyId = await ownedProperty(owner, "Replay gate");
  try {
    const key = randomUUID();
    const input = { candidateId: candidate.id, targetPropertyId, documentVersionIds: [versionId], confirmed: true, requestKey: key };
    const first = await executePurchaseImport(owner, input);
    const second = await executePurchaseImport(owner, input);
    expect(second.items[0]).toMatchObject({ documentId: first.items[0]!.documentId, duplicate: true });
    expect(await prisma.propertyDoc.count({ where: { propertyId: targetPropertyId } })).toBe(1);
    expect(await prisma.purchaseEntry.count({ where: { requestKey: `purchase-import-history-${key}` } })).toBe(1);
    expect(await prisma.timelineEvent.count({ where: { workspaceId: owner.workspaceId, propertyId: targetPropertyId, title: "Purchase import recorded" } })).toBe(1);
    const secondTarget = await ownedProperty(owner, "Replay conflict gate");
    try {
      await expect(executePurchaseImport(owner, { candidateId: candidate.id, targetPropertyId: secondTarget, documentVersionIds: [versionId], confirmed: true, requestKey: key })).rejects.toMatchObject({ status: 409, code: "IMPORT_KEY_CONFLICT" });
      expect(await prisma.propertyDoc.count({ where: { propertyId: secondTarget } })).toBe(0);
    } finally {
      await prisma.property.delete({ where: { id: secondTarget } });
    }
    expect(await prisma.propertyDoc.count({ where: { propertyId: targetPropertyId } })).toBe(1);
  } finally {
    await prisma.propertyDoc.deleteMany({ where: { workspaceId: owner.workspaceId, propertyId: targetPropertyId } });
    await prisma.property.delete({ where: { id: targetPropertyId } });
  }
});

it("creates no grants and changes no ownership or candidate state", async () => {
  const { candidate, versionId } = await readyCandidate();
  const targetPropertyId = await ownedProperty(owner, "Side-effect gate");
  const sharesBefore = await prisma.shareLink.count({ where: { workspaceId: owner.workspaceId } });
  const stageBefore = (await prisma.purchaseCandidate.findUniqueOrThrow({ where: { id: candidate.id } })).stage;
  try {
    await executePurchaseImport(owner, { candidateId: candidate.id, targetPropertyId, documentVersionIds: [versionId], confirmed: true, requestKey: randomUUID() });
    expect(await prisma.shareLink.count({ where: { workspaceId: owner.workspaceId } })).toBe(sharesBefore);
    expect((await prisma.property.findUniqueOrThrow({ where: { id: targetPropertyId } })).workspaceId).toBe(owner.workspaceId);
    expect((await prisma.purchaseCandidate.findUniqueOrThrow({ where: { id: candidate.id } })).stage).toBe(stageBefore);
  } finally {
    await prisma.propertyDoc.deleteMany({ where: { workspaceId: owner.workspaceId, propertyId: targetPropertyId } });
    await prisma.property.delete({ where: { id: targetPropertyId } });
  }
});

it("enforces import route authentication and origin boundaries", async () => {
  const anonymous = await importPost(new Request("http://localhost:3100/api/purchases/import", { method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost:3100" }, body: JSON.stringify({}) }));
  expect(anonymous.status).toBe(401);
  // Authenticated session for origin/body boundary proofs.
  const email = `import-route-${randomUUID()}@example.com`;
  const handlers = toNextJsHandler(auth);
  await handlers.POST(new Request("http://localhost:3100/api/auth/email-otp/send-verification-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, type: "sign-in" }) }));
  const signed = await handlers.POST(new Request("http://localhost:3100/api/auth/sign-in/email-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, otp: readLocalOtp(email)?.otp }) }));
  const cookie = signed.headers.get("set-cookie")!.split(";", 1)[0]!;
  try {
    const authed = (body: unknown, origin: string) => new Request("http://localhost:3100/api/purchases/import", { method: "POST", headers: { "Content-Type": "application/json", origin, cookie }, body: JSON.stringify(body) });
    // Provision the fresh account container, then boundaries apply.
    const provisioned = await POST(new Request("http://localhost:3100/api/purchases", { method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost:3100", cookie }, body: JSON.stringify({ action: "create-workspace", name: "Route boundary fixture", requestKey: randomUUID() }) }));
    expect(provisioned.status).toBe(200);
    expect((await importPost(authed({}, "https://unrelated.invalid"))).status).toBe(403);
    const malformed = await importPost(new Request("http://localhost:3100/api/purchases/import", { method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost:3100", cookie }, body: "not-json{" }));
    expect(malformed.status).toBe(400);
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }
});

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { operationsSnapshot } from "@/lib/operations";
import { listOwnerSessions, revokeOtherOwnerSessions } from "@/lib/privacy-sessions";
import { GET as health } from "@/app/api/health/route";
import { GET as operations } from "@/app/api/operations/route";
import { GET as sessions, POST as revoke } from "@/app/api/privacy/sessions/route";
import { auth } from "@/lib/auth";
import { readLocalOtp } from "@/lib/auth-mailbox";
import { createPrivacyRequest, cancelPrivacyRequest, listPrivacyRequests } from "@/lib/privacy-requests";
import { createRuleDraftForOperator, updateRuleDraftForOperator, transitionRuleForOperator } from "@/lib/rules";
import { ACCOUNT_EXPORT_SCOPE, requestAccountExport, runAccountExportOnce, downloadAccountExport, cleanupAccountExports, processAccountExport } from "@/lib/account-export";
import { LocalObjectStorageAdapter } from "@/lib/providers";
import { readZipEntries } from "@/lib/zip";
import { sha256Hex } from "@/lib/vault-repository";

const owner = "f01-owner", other = "f01-other", operator = "f01-operator";
const current = "f01-current", alternate = "f01-alternate";
async function cleanup() {
  const exports = await prisma.privacyRequest.findMany({ where: { userId: { in: [owner, other] }, artifactKey: { not: null } }, select: { artifactKey: true } });
  for (const row of exports) await new LocalObjectStorageAdapter("test").delete(row.artifactKey!);
  await prisma.outboxEvent.deleteMany({ where: { eventType: "GENERATE_ACCOUNT_EXPORT" } });
  await prisma.checklistRule.deleteMany({ where: { stableKey: "synthetic-ops-revision-test" } });
  await prisma.outboxEvent.deleteMany({ where: { id: "f01-failure" } });
  await prisma.user.deleteMany({ where: { id: { in: [owner, other, operator] } } });
  await prisma.user.deleteMany({ where: { email: "f01-http@example.com" } });
}
beforeAll(async () => {
  await cleanup();
  for (const id of [owner, other, operator]) await prisma.user.create({ data: { id, email: `${id}@example.com`, name: "Synthetic foundation test", role: id === operator ? "operator" : "owner" } });
  for (const [id, userId] of [[current, owner], [alternate, owner], ["f01-foreign", other]]) await prisma.session.create({ data: { id, userId, token: randomUUID(), expiresAt: new Date(Date.now() + 60_000), ipAddress: "PRIVATE_IP", userAgent: "PRIVATE_AGENT" } });
});
afterAll(cleanup);

describe("F01 operations and F03 session controls", () => {
  it("generates an owned records archive, isolates bytes, checks integrity and expiry, and suppresses cancellation during generation", async () => {
    await prisma.workspace.create({ data: { id: "export-owner-workspace", ownerUserId: owner, name: "OWNED_EXPORT_MARKER" } });
    await prisma.workspace.create({ data: { id: "export-foreign-workspace", ownerUserId: other, name: "FOREIGN_EXPORT_MARKER" } });
    const row = await createPrivacyRequest(owner, { kind: "EXPORT_ACCOUNT", requestKey: "account-export-first-01", confirmed: true });
    const input = { confirmed: true, scope: ACCOUNT_EXPORT_SCOPE, expiresAt: new Date(Date.now() + 3600000).toISOString() };
    await expect(requestAccountExport(other, row.id, input)).rejects.toMatchObject({ status: 404 });
    await expect(requestAccountExport(owner, row.id, { ...input, confirmed: false })).rejects.toMatchObject({ status: 400 });
    expect(await requestAccountExport(owner, row.id, input)).toMatchObject({ status: "QUEUED" });
    expect(await requestAccountExport(owner, row.id, input)).toMatchObject({ status: "QUEUED" });
    expect((await runAccountExportOnce("account-export-test"))?.status).toBe("succeeded");
    const bytes = await downloadAccountExport(owner, row.id);
    const entries = readZipEntries(bytes);
    const records = entries.find(entry => entry.name === "account-records.json")!.bytes;
    const manifest = JSON.parse(entries.find(entry => entry.name === "manifest.json")!.bytes.toString());
    expect(manifest.recordsSha256).toBe(sha256Hex(records));
    expect(records.toString()).toContain("OWNED_EXPORT_MARKER");
    expect(records.toString()).not.toMatch(/FOREIGN_EXPORT_MARKER|tokenHash|PRIVATE_AGENT|PRIVATE_IP/);
    await expect(downloadAccountExport(other, row.id)).rejects.toMatchObject({ status: 404 });
    await cancelPrivacyRequest(owner, row.id);
    await expect(downloadAccountExport(owner, row.id)).rejects.toMatchObject({ status: 404 });
    await cleanupAccountExports();
    expect((await new LocalObjectStorageAdapter("test").get(`account-exports/${row.id}.zip`)).outcome).toBe("unavailable");
    const interrupted = await createPrivacyRequest(owner, { kind: "EXPORT_ACCOUNT", requestKey: "account-export-interrupt-01", confirmed: true });
    await requestAccountExport(owner, interrupted.id, input);
    const job = await prisma.outboxEvent.findUniqueOrThrow({ where: { idempotencyKey: `account-export:${interrupted.id}` } });
    await expect(processAccountExport(job, new LocalObjectStorageAdapter("test"), async () => { await cancelPrivacyRequest(owner, interrupted.id); })).rejects.toMatchObject({ code: "EXPORT_NOT_AVAILABLE" });
    expect((await prisma.privacyRequest.findUniqueOrThrow({ where: { id: interrupted.id } })).status).toBe("CANCELLED");
    expect((await new LocalObjectStorageAdapter("test").get(`account-exports/${interrupted.id}.zip`)).outcome).toBe("unavailable");
    const expired = await createPrivacyRequest(owner, { kind: "EXPORT_ACCOUNT", requestKey: "account-export-expiry-01", confirmed: true });
    await requestAccountExport(owner, expired.id, input);
    expect((await runAccountExportOnce("account-export-expiry"))?.status).toBe("succeeded");
    await prisma.privacyRequest.update({ where: { id: expired.id }, data: { expiresAt: new Date(Date.now() - 1) } });
    await cleanupAccountExports();
    expect((await prisma.privacyRequest.findUniqueOrThrow({ where: { id: expired.id } })).status).toBe("EXPIRED");
    expect((await new LocalObjectStorageAdapter("test").get(`account-exports/${expired.id}.zip`)).outcome).toBe("unavailable");
  });
  it("audits synthetic review transitions, rejects stale revisions and invalidates review on changed content", async () => {
    const input = { stableKey: "synthetic-ops-revision-test", title: "Synthetic test only", description: "Not legal or property guidance", category: "synthetic", effectiveFrom: "2026-09-12" };
    await expect(createRuleDraftForOperator(owner, input)).rejects.toMatchObject({ status: 403 });
    const draft = await createRuleDraftForOperator(operator, input);
    const submitted = await transitionRuleForOperator(operator, draft.id, "submit", draft.revision);
    await expect(transitionRuleForOperator(operator, draft.id, "publish", submitted.revision)).rejects.toMatchObject({ code: "PUBLICATION_EVIDENCE_REQUIRED" });
    await expect(updateRuleDraftForOperator(operator, draft.id, { title: "Stale" }, draft.revision)).rejects.toMatchObject({ code: "RULE_STALE" });
    const reviewed = await updateRuleDraftForOperator(operator, draft.id, { sourceName: "Isolated synthetic test", sourceReference: { reference: "test fixture" }, reviewer: "Synthetic operator", reviewedAt: new Date() }, submitted.revision);
    const edited = await updateRuleDraftForOperator(operator, draft.id, { description: "Changed synthetic text" }, reviewed.revision);
    expect(edited).toMatchObject({ status: "DRAFT", reviewer: null, reviewedAt: null });
    const ready = await updateRuleDraftForOperator(operator, draft.id, { reviewer: "Synthetic operator", reviewedAt: new Date() }, edited.revision);
    const review = await transitionRuleForOperator(operator, draft.id, "submit", ready.revision);
    const races = await Promise.allSettled([transitionRuleForOperator(operator, draft.id, "publish", review.revision), transitionRuleForOperator(operator, draft.id, "publish", review.revision)]);
    expect(races.filter(row => row.status === "fulfilled")).toHaveLength(1);
    const published = await prisma.checklistRule.findUniqueOrThrow({ where: { id: draft.id } });
    await expect(updateRuleDraftForOperator(operator, draft.id, { title: "Blocked" }, published.revision)).rejects.toMatchObject({ code: "RULE_IMMUTABLE" });
    expect(await transitionRuleForOperator(operator, draft.id, "retire", published.revision)).toMatchObject({ status: "RETIRED" });
    expect(await prisma.ruleAuditEvent.count({ where: { ruleId: draft.id, action: "publish" } })).toBe(1);
    expect(await prisma.ruleAuditEvent.count({ where: { ruleId: draft.id, action: "retire" } })).toBe(1);
  });
  it("persists explicit request-only privacy intake, replays safely and isolates cancellation", async () => {
    const input = { kind: "EXPORT_ACCOUNT", requestKey: "privacy-export-test-01", confirmed: true };
    await expect(createPrivacyRequest(owner, { ...input, confirmed: false })).rejects.toMatchObject({ status: 400 });
    await expect(createPrivacyRequest(owner, { ...input, kind: "DELETE_PROPERTY", propertyId: "foreign-property" })).rejects.toMatchObject({ status: 404 });
    const pair = await Promise.all([createPrivacyRequest(owner, input), createPrivacyRequest(owner, input)]);
    expect(pair[0].id).toBe(pair[1].id);
    expect(pair[0].status).toBe("AWAITING_POLICY");
    await expect(createPrivacyRequest(owner, { ...input, requestKey: "privacy-export-test-02" })).rejects.toMatchObject({ code: "REQUEST_ALREADY_PENDING" });
    await expect(createPrivacyRequest(owner, { ...input, propertyId: "" })).rejects.toMatchObject({ code: "INVALID_PRIVACY_SCOPE" });
    await expect(createPrivacyRequest(owner, { ...input, kind: "DELETE_ACCOUNT" })).rejects.toMatchObject({ status: 409 });
    expect(await listPrivacyRequests(other)).toEqual([]);
    await expect(cancelPrivacyRequest(other, pair[0].id)).rejects.toMatchObject({ status: 404 });
    expect(await cancelPrivacyRequest(owner, pair[0].id)).toMatchObject({ status: "CANCELLED" });
    expect(await createPrivacyRequest(owner, input)).toMatchObject({ status: "CANCELLED" });
    expect(await prisma.user.findUnique({ where: { id: owner } })).not.toBeNull();
  });
  it("keeps public liveness independent from unavailable optional providers", async () => {
    const response = await health();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { status: "alive" } });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("denies owners and unknown principals; never returns payloads, raw errors or aggregate identifiers", async () => {
    await expect(operationsSnapshot(owner)).rejects.toMatchObject({ status: 403 });
    await expect(operationsSnapshot("nonexistent")).rejects.toMatchObject({ status: 403 });
    await prisma.outboxEvent.create({ data: { id: "f01-failure", aggregateType: "PRIVATE_TYPE", aggregateId: "PRIVATE_DOCUMENT", eventType: "PRIVATE_EVENT", payload: { text: "PRIVATE_PAYLOAD" }, lastError: { message: "PRIVATE_ERROR" }, status: "terminal_failure" } });
    const snapshot = await operationsSnapshot(operator);
    expect(snapshot.failures.some(row => row.id === "f01-failure")).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("PRIVATE_");
    expect(snapshot.failures.length).toBeLessThanOrEqual(50);
  });
  it("blocks hosted operator access until stronger authentication exists", async () => {
    vi.stubEnv("APP_ENV", "staging");
    try { await expect(operationsSnapshot(operator)).rejects.toMatchObject({ code: "OPERATOR_STRONG_AUTH_NOT_CONFIGURED" }); }
    finally { vi.unstubAllEnvs(); }
  });
  it("lists only owner sessions, then revokes others with an action receipt and no cross-user mutation", async () => {
    const rows = await listOwnerSessions(owner, current);
    expect(rows).toHaveLength(2);
    expect(rows.filter(row => row.current)).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toMatch(/token|PRIVATE_/);
    expect(await revokeOtherOwnerSessions(owner, current)).toEqual({ revoked: 1 });
    expect(await prisma.session.findUnique({ where: { id: current } })).not.toBeNull();
    expect(await prisma.session.findUnique({ where: { id: alternate } })).toBeNull();
    expect(await prisma.session.findUnique({ where: { id: "f01-foreign" } })).not.toBeNull();
    expect(await revokeOtherOwnerSessions(owner, current)).toEqual({ revoked: 0 });
    expect(await prisma.idempotencyRecord.count({ where: { principalUserId: owner, action: "privacy.sessions.revoke_others" } })).toBe(2);
    await expect(revokeOtherOwnerSessions(other, current)).rejects.toThrow("SESSION_REQUIRED");
  });
  it("uses ordinary OTP cookies, enforces origin and rejects revoked/expired sessions at the route boundary", async () => {
    const url = "http://localhost:3100/api/privacy/sessions";
    expect((await sessions(new Request(url))).status).toBe(401);
    expect((await operations(new Request("http://localhost:3100/api/operations"))).status).toBe(401);
    const email = "f01-http@example.com";
    async function signIn() {
      await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
      const result = await auth.api.signInEmailOTP({ body: { email, otp: readLocalOtp(email)!.otp }, returnHeaders: true });
      return { token: result.response.token, cookie: result.headers.get("set-cookie")!.split(";", 1)[0] };
    }
    const a = await signIn(), b = await signIn();
    expect((await revoke(new Request(url, { method: "POST", headers: { cookie: a.cookie, origin: "https://untrusted.example" } }))).status).toBe(403);
    expect((await sessions(new Request(url, { headers: { cookie: b.cookie } }))).status).toBe(200);
    expect((await revoke(new Request(url, { method: "POST", headers: { cookie: a.cookie, origin: "http://localhost:3100" } }))).status).toBe(200);
    expect((await sessions(new Request(url, { headers: { cookie: b.cookie } }))).status).toBe(401);
    expect((await operations(new Request("http://localhost:3100/api/operations", { headers: { cookie: a.cookie } }))).status).toBe(403);
    await prisma.session.update({ where: { token: a.token }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await sessions(new Request(url, { headers: { cookie: a.cookie } }))).status).toBe(401);
  });
});

/** Destructive ONLY in a newly-created, uniquely named synthetic target.
 * No reset/drop/restore-to-source operation exists in this runner. */
import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile, readFile, cp, rename, rmdir } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const policy = "synthetic-erasure-v1-no-content-retained";
const stage = process.argv[2];
const run = process.env.SUKOON_ERASURE_RUN_ID ?? randomBytes(8).toString("hex");
assert.match(run, /^[a-f0-9]{16}$/);
const database = `sukoon_s02_local_erasure_${run}`;
const base = path.resolve(".data/erasure-tests", run), ledgerDir = path.resolve(".data/erasure-ledgers", run);
const source = new URL(process.env.DATABASE_URL!);
assert.ok(["localhost", "127.0.0.1"].includes(source.hostname));
source.pathname = `/${database}`;
const env = { ...process.env, APP_ENV: "local", NODE_ENV: "development" as const, DATABASE_URL: source.href, BETTER_AUTH_URL: "http://127.0.0.1:3103", SUKOON_SYNTHETIC_ERASURE: policy, SUKOON_ERASURE_RUN_ID: run, SUKOON_DATA_DIR: path.join(base, "objects"), SUKOON_ERASURE_LEDGER_DIR: ledgerDir };
const records: unknown[] = [];
function command(binary: string, args: string[], settings = env, expected = 0) {
  const result = spawnSync(binary, args, { env: settings, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  records.push({ command: [binary, ...args], exit: result.status, evidence: binary === "npx" ? result.stdout.slice(-3000) : undefined });
  if (result.status !== expected) { console.error(result.stdout, result.stderr); throw new Error(`ACCEPTANCE_COMMAND_FAILED:${binary}:${result.status}`); }
  if (binary === "npx") console.log(result.stdout.slice(-3000));
}
async function provision() {
  // mkdir without recursive on the run directory refuses accidental reuse.
  await mkdir(path.dirname(base), { recursive: true, mode: 0o700 });
  await mkdir(base, { mode: 0o700 });
  await mkdir(env.SUKOON_DATA_DIR, { mode: 0o700 });
  await mkdir(path.dirname(ledgerDir), { recursive: true, mode: 0o700 });
  await mkdir(ledgerDir, { mode: 0o700 });
  await mkdir(path.join(ledgerDir, "instructions"), { mode: 0o700 });
  // createdb fails if the target exists; no reuse and no dropping anything.
  command("createdb", ["--host", source.hostname, "--username", source.username, database]);
  command("node", ["scripts/run-prisma-safe.mjs", "migrate", "deploy"]);
  const nonce = randomUUID();
  await writeFile(path.join(env.SUKOON_DATA_DIR, ".erasure-target.json"), JSON.stringify({ run, database, nonce }), { mode: 0o600, flag: "wx" });
  await writeFile(path.join(ledgerDir, "ledger.json"), JSON.stringify({ version: 1, run, policy, registeredUsers: [], targets: { [database]: { nonce, ready: true, completed: [] } }, deletions: [] }), { mode: 0o600, flag: "wx" });
  const db = new Client({ connectionString: source.href }); await db.connect();
  assert.equal((await db.query('SELECT count(*)::int n FROM "user"')).rows[0].n, 0);
  await db.query('CREATE TABLE "SyntheticErasureEnvironment" (run text PRIMARY KEY, fenced boolean NOT NULL)');
  await db.query('INSERT INTO "SyntheticErasureEnvironment" VALUES ($1, false)', [run]);
  await db.query(`CREATE FUNCTION synthetic_erasure_write_fence() RETURNS trigger LANGUAGE plpgsql AS $fn$
    DECLARE state record;
    BEGIN
      SELECT * INTO STRICT state FROM "SyntheticErasureEnvironment" FOR SHARE;
      IF state.fenced AND current_setting('sukoon.erasure_executor', true) IS DISTINCT FROM state.run THEN
        IF TG_TABLE_NAME = 'OutboxEvent' THEN
          IF COALESCE(NEW."eventType", OLD."eventType") = 'ERASE_PRIVACY_REQUEST' THEN RETURN COALESCE(NEW, OLD); END IF;
        END IF;
        RAISE EXCEPTION 'ERASURE_DATABASE_FENCED';
      END IF;
      RETURN COALESCE(NEW, OLD);
    END $fn$`);
  const tables = (await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('_prisma_migrations','SyntheticErasureEnvironment')")).rows;
  for (const { tablename } of tables) {
    assert.match(tablename, /^[A-Za-z_]+$/);
    await db.query(`CREATE TRIGGER synthetic_erasure_fence BEFORE INSERT OR UPDATE OR DELETE ON "${tablename}" FOR EACH ROW EXECUTE FUNCTION synthetic_erasure_write_fence()`);
  }
  await db.end();
}
async function child() {
  const { prisma } = await import("../lib/prisma");
  const { auth } = await import("../lib/auth");
  const { readLocalOtp } = await import("../lib/auth-mailbox");
  const { erasureMaintenance, assertErasureReady, readErasureLedger } = await import("../lib/erasure-gate");
  const { durableErasureJson, confirmSyntheticErasure } = await import("../lib/privacy-erasure");
  const { POST: intake } = await import("../app/api/privacy/requests/route");
  const { POST: confirm } = await import("../app/api/privacy/erasure/route");
  const { cancelPrivacyRequest } = await import("../lib/privacy-requests");
  const origin = "http://127.0.0.1:3103";
  async function login(email: string) {
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    const result = await auth.api.signInEmailOTP({ body: { email, otp: readLocalOtp(email)!.otp }, returnHeaders: true });
    return { id: result.response.user.id, cookie: result.headers.get("set-cookie")!.split(";", 1)[0] };
  }
  function request(body: unknown, cookie: string, endpoint = "requests") { return new Request(`${origin}/api/privacy/${endpoint}`, { method: "POST", headers: { origin, cookie, "content-type": "application/json" }, body: JSON.stringify(body) }); }
  const fixturePath = path.join(base, "fixture.json");
  if (stage === "seed") {
    const owner = await login(`erase-owner-${run}@example.com`), other = await login(`erase-retained-${run}@example.com`), delegate = await login(`erase-delegate-${run}@example.com`);
    const ledger = readErasureLedger(); ledger.registeredUsers = [owner.id, other.id, delegate.id];
    await durableErasureJson(path.join(ledgerDir, "ledger.json"), ledger);
    const fixtures = [];
    for (const [index, user] of [owner, owner, other].entries()) {
      let workspace = await prisma.workspace.findUnique({ where: { ownerUserId: user.id } });
      workspace ??= await prisma.workspace.create({ data: { id: randomUUID(), ownerUserId: user.id, name: "Disposable synthetic workspace" } });
      const propertyId = randomUUID(), documentId = randomUUID(), versionId = randomUUID(), projectId = randomUUID(), exportId = randomUUID(), grantId = randomUUID();
      const storageKey = `quarantine/${workspace.id}/${documentId}/${versionId}.pdf`, exportKey = `exports/${workspace.id}/${exportId}.zip`;
      const bytes = Buffer.from("SYNTHETIC ERASURE OBJECT - NOT SCANNER ACCEPTANCE"), sha256 = createHash("sha256").update(bytes).digest("hex");
      const root = process.env.SUKOON_DATA_DIR!;
      for (const key of [storageKey, exportKey]) { await mkdir(path.dirname(path.join(root, key)), { recursive: true, mode: 0o700 }); await writeFile(path.join(root, key), bytes, { mode: 0o600 }); }
      await prisma.property.create({ data: { id: propertyId, workspaceId: workspace.id, name: `Synthetic erasure property ${index}`, type: "apartment", city: "Synthetic", area: "Synthetic", address: "Synthetic - no real address", ownerName: "Synthetic owner" } });
      await prisma.constructionProject.create({ data: { id: projectId, workspaceId: workspace.id, propertyId, name: "Synthetic deletion project", plotSizeSqft: 100, spec: "standard", budgetPaise: 0n, currentStage: 0, stageStatus: {}, startDate: "2026-09-12" } });
      await prisma.propertyDoc.create({ data: { id: documentId, workspaceId: workspace.id, propertyId, type: "other", name: "Synthetic erasure object", uploadDate: "2026-09-12", sizeBytes: bytes.length, sha256, storageKey, mimeType: "application/pdf" } });
      await prisma.documentVersion.create({ data: { id: versionId, workspaceId: workspace.id, documentId, version: 1, originalFilename: "synthetic-erasure.pdf", displayName: "Synthetic erasure object", mimeType: "application/pdf", sizeBytes: bytes.length, sha256, storageKey, scanStatus: "scan_pending", processingState: "quarantined", reviewStatus: "awaiting_review", uploadedBy: user.id } });
      await prisma.documentParsingRun.create({ data: { id: randomUUID(), workspaceId: workspace.id, documentId, documentVersionId: versionId, idempotencyKey: randomUUID(), status: "succeeded", method: "synthetic-erasure-fixture", parserVersion: "fixture", textChunks: [{ text: "SYNTHETIC_DERIVED_ERASURE_MARKER" }] } });
      await prisma.searchProjection.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, documentId, documentVersionId: versionId, entityType: "document", sourceType: "synthetic-erasure-fixture", title: "Synthetic search erasure", searchableText: "SYNTHETIC_SEARCH_MARKER", reviewState: "awaiting_review" } });
      const replacementId = randomUUID(), replacementKey = `${user.id}/${propertyId}/${documentId}/${replacementId}.pdf`;
      await mkdir(path.dirname(path.join(root, replacementKey)), { recursive: true, mode: 0o700 });
      await writeFile(path.join(root, replacementKey), bytes, { mode: 0o600 });
      await writeFile(path.join(root, user.id, propertyId, documentId, "interrupted-upload.tmp"), bytes, { mode: 0o600 });
      await prisma.documentVersion.create({ data: { id: replacementId, workspaceId: workspace.id, documentId, version: 2, originalFilename: "synthetic-replacement.pdf", displayName: "Synthetic replacement", mimeType: "application/pdf", sizeBytes: bytes.length, sha256, storageKey: replacementKey, scanStatus: "scan_pending", processingState: "quarantined", reviewStatus: "awaiting_review", uploadedBy: user.id } });
      await prisma.exportPackage.create({ data: { id: exportId, workspaceId: workspace.id, propertyId, requestedByUserId: user.id, selectionHash: sha256, artifactStorageKey: exportKey, expiresAt: new Date(Date.now() + 3600000), idempotencyKey: randomUUID() } });
      await prisma.reminder.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, kind: "synthetic", title: "Synthetic erasure reminder", dueDate: "2026-09-13" } });
      await prisma.outboxEvent.create({ data: { id: randomUUID(), aggregateType: "document", aggregateId: documentId, eventType: "SCAN_DOCUMENT", payload: { workspaceId: workspace.id, propertyId, documentId, documentVersionId: versionId }, idempotencyKey: randomUUID() } });
      await prisma.shareLink.create({ data: { id: grantId, workspaceId: workspace.id, propertyId, grantorId: user.id, role: "ARCHITECT", inviteeEmail: `erase-delegate-${run}@example.com`, inviteeUserId: delegate.id, acceptedAt: new Date(), tokenHash: createHash("sha256").update(randomUUID()).digest("hex"), expiresAt: "2026-09-13T00:00:00.000Z", scopes: { create: { id: randomUUID(), scopeType: "document_preview", documentId } } } });
      await prisma.idempotencyRecord.create({ data: { id: randomUUID(), principalUserId: user.id, action: "synthetic.property", requestKey: randomUUID(), payloadHash: sha256, response: { propertyId, text: "SYNTHETIC_RECEIPT_MARKER" } } });
      fixtures.push({ propertyId, documentId, versionId, projectId, exportId, grantId, storageKey, exportKey });
    }
    await prisma.processingControl.create({ data: { workspaceId: (await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: owner.id } })).id, withdrawnAt: new Date(), noticeVersion: "synthetic-erasure-fixture" } });
    const purchaseFixtures = [];
    if (process.env.SUKOON_ERASURE_PURCHASE_ONLY === "1") {
      const { createDocumentForUser } = await import("../lib/vault-repository");
      const { purchaseCommand } = await import("../lib/purchases");
      const { recordPurchaseEvidence } = await import("../lib/purchase-evidence");
      for (const user of [owner, other]) {
        const workspace = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: user.id } });
        const principal = { userId: user.id, workspaceId: workspace.id, email: "synthetic@example.com", role: "owner" as const };
        const purchase = await purchaseCommand(principal, { action: "create-workspace", name: "Disposable purchase erasure proof", requestKey: randomUUID() });
        const candidate = await purchaseCommand(principal, { action: "add-candidate", purchaseWorkspaceId: purchase.id, name: "Synthetic non-owned candidate", requestKey: randomUUID() });
        const entry = await purchaseCommand(principal, { action: "add-entry", candidateId: candidate.id, kind: "DOCUMENT_REQUEST", body: "Synthetic erasure-only receipt", requestKey: randomUUID() });
        const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1sAAAAASUVORK5CYII=", "base64");
        const input = { userId: user.id, purchaseCandidateId: candidate.id, category: "Other", idempotencyKey: randomUUID(), filename: "synthetic-purchase-erasure.png", mimeType: "image/png", bytes };
        const doc = (await createDocumentForUser(input)).document;
        await createDocumentForUser({ ...input, idempotencyKey: randomUUID(), replaceDocumentId: doc.id });
        await recordPurchaseEvidence(principal, { candidateId: candidate.id, entryId: entry.id, action: "RECEIVE", version: 0, note: "Quarantined fixture, not scanner acceptance", source: "BUYER_UPLOADED", documentVersionId: doc.versions[0]!.id, requestKey: randomUUID() });
        await prisma.documentParsingRun.create({ data: { id: randomUUID(), workspaceId: workspace.id, documentId: doc.id, documentVersionId: doc.versions[0]!.id, idempotencyKey: randomUUID(), status: "succeeded", method: "synthetic-erasure-fixture", parserVersion: "fixture", textChunks: [{ text: "PURCHASE_ERASURE_DERIVED_MARKER" }] } });
        const versions = await prisma.documentVersion.findMany({ where: { documentId: doc.id } });
        purchaseFixtures.push({ candidateId: candidate.id, documentId: doc.id, entryId: entry.id, keys: versions.map(v => v.storageKey) });
      }
    }
    await writeFile(fixturePath, JSON.stringify({ owner, other, delegate, fixtures, purchaseFixtures }), { mode: 0o600, flag: "wx" });
    console.log("SEED_PASS: three new OTP accounts; three properties; synthetic documents, derived results, projects, grants, exports, reminders, jobs and receipts.");
  } else {
    const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
    const { owner, other, delegate, fixtures } = fixture;
    if (stage === "purge-auth") {
      readErasureLedger(); // Verify exact run/root identity before touching its private artifact.
      for (const user of [owner, other, delegate]) delete user.cookie;
      await durableErasureJson(fixturePath, fixture);
      console.log("EPHEMERAL_AUTH_PURGED: retained opaque fixture IDs; repeat acceptance in a fresh run for old-cookie proof.");
    } else if (stage === "restored-http") {
      const endpoint = process.env.BETTER_AUTH_URL!;
      assert.equal(new URL(endpoint).port, "3104");
      assert.ok(process.env.DATABASE_URL!.includes(`${database}_restore`));
      const results: { path: string; status: number }[] = [];
      for (const [route, cookie, expected] of [["/api/session", owner.cookie, 401], ["/api/session", delegate.cookie, 401], [`/api/documents/${fixtures[0].documentId}`, owner.cookie, 401], [`/api/documents/${fixtures[0].documentId}`, other.cookie, 404], [`/api/construction/${fixtures[0].projectId}`, other.cookie, 404]] as const) {
        const response = await fetch(`${endpoint}${route}`, { headers: { cookie } });
        assert.equal(response.status, expected); results.push({ path: route, status: response.status });
      }
      const retained = await fetch(`${endpoint}/api/session`, { headers: { cookie: other.cookie } }); assert.equal(retained.status, 200);
      const retainedBody = await retained.json(); assert.equal(retainedBody.data.state.properties.length, 1);
      assert.equal(retainedBody.data.state.properties[0].id, fixtures[2].propertyId);
      results.push({ path: "/api/session retained owner", status: 200 });
      console.log(JSON.stringify({ restoredHttp: "PASS", retainedProperties: 1, results }));
      const ledgerPath = path.join(ledgerDir, "ledger.json");
      await rename(ledgerPath, `${ledgerPath}.http-unavailable`);
      try {
        assert.equal((await fetch(`${endpoint}/api/recovery-readiness`)).status, 503);
        assert.equal((await fetch(`${endpoint}/api/session`, { headers: { cookie: other.cookie } })).status, 503);
        console.log("RESTORED_HTTP_MISSING_LEDGER_PASS: readiness and authenticated session both 503.");
      } finally { await rename(`${ledgerPath}.http-unavailable`, ledgerPath); }
    } else if (stage === "browser-o01-seed") {
      const { createPropertyForUser } = await import("../lib/property-repository");
      const result = await createPropertyForUser(other.id, { name: "Synthetic ownership renewal acceptance", type: "flat", city: "Synthetic", area: "Synthetic", address: "Synthetic - no real address", jurisdiction: "Synthetic test only", areaValue: "100", areaUnit: "sqft", areaType: "carpet", ownerName: "Synthetic retained owner", ownershipAssertion: "self_asserted", ownershipProvenance: "Disposable browser acceptance only" });
      console.log(JSON.stringify({ propertyId: result.property.id }));
    } else if (stage === "browser-seed") {
      const operator = await login(`erase-operator-${run}@example.com`);
      const ledger = readErasureLedger(); ledger.registeredUsers = [...new Set([...ledger.registeredUsers, operator.id])];
      await durableErasureJson(path.join(ledgerDir, "ledger.json"), ledger);
      await prisma.user.update({ where: { id: operator.id }, data: { role: "operator" } });
      const version = await prisma.documentVersion.findFirstOrThrow({ where: { documentId: fixtures[2].documentId, version: 2 } });
      await prisma.propertyDoc.update({ where: { id: fixtures[2].documentId }, data: { version: 2 } });
      const job = await prisma.outboxEvent.create({ data: { id: randomUUID(), aggregateType: "document", aggregateId: version.documentId, eventType: "SCAN_DOCUMENT", status: "terminal_failure", attempts: 3, maxAttempts: 3, payload: { workspaceId: version.workspaceId, documentVersionId: version.id }, lastError: { code: "SYNTHETIC_BROWSER_CANCELLATION_FIXTURE" } } });
      console.log(JSON.stringify({ operatorEmail: `erase-operator-${run}@example.com`, ownerEmail: `erase-retained-${run}@example.com`, jobId: job.id, projectId: fixtures[2].projectId }));
    } else if (stage === "browser-exports") {
      const { runAccountExportOnce } = await import("../lib/account-export");
      console.log(await runAccountExportOnce(`erasure-browser-export-${run}`));
    } else if (stage === "confirm-property" || stage === "confirm-account" || stage === "confirm-delegate") {
      const user = stage === "confirm-delegate" ? delegate : owner;
      const signed = await login(`erase-${stage === "confirm-delegate" ? "delegate" : "owner"}-${run}@example.com`);
      assert.equal(signed.id, user.id);
      const input = { kind: stage === "confirm-property" ? "DELETE_PROPERTY" : "DELETE_ACCOUNT", ...(stage === "confirm-property" ? { propertyId: fixtures[0].propertyId } : {}), requestKey: randomUUID(), confirmed: true };
      if (stage === "confirm-property") {
        assert.equal((await intake(request({ ...input, propertyId: fixtures[2].propertyId }, signed.cookie))).status, 404);
      }
      const response = await intake(request(input, signed.cookie)); assert.equal(response.status, 202);
      const { data } = await response.json();
      const body = { requestId: data.id, confirmed: true, policy };
      assert.equal((await confirm(request(body, "", "erasure"))).status, 401);
      assert.equal((await confirm(request({ ...body, userId: other.id }, signed.cookie, "erasure"))).status, 400);
      assert.equal((await confirm(request({ ...body, confirmed: false }, signed.cookie, "erasure"))).status, 400);
      assert.equal((await confirm(request(body, other.cookie, "erasure"))).status, 409);
      const accepted = await confirm(request(body, signed.cookie, "erasure"));
      if (accepted.status !== 202) console.log(await accepted.clone().text());
      assert.equal(accepted.status, 202);
      assert.throws(assertErasureReady, /unavailable/);
      await assert.rejects(() => prisma.property.count());
      await erasureMaintenance(async () => {
        assert.equal((await confirmSyntheticErasure(user.id, data.id, true, policy)).duplicate, true);
        await assert.rejects(() => cancelPrivacyRequest(user.id, data.id), /REQUEST_CANCELLATION_CLOSED/);
      });
      console.log(`${stage}: authenticated intake/confirmation PASS; wrong owner, forged target, missing confirmation, unauthenticated, duplicate and cancellation boundary PASS.`);
    } else if (stage === "interrupted") {
      assert.throws(assertErasureReady);
      const raw = new Client({ connectionString: process.env.DATABASE_URL }); await raw.connect();
      assert.equal((await raw.query('SELECT count(*)::int n FROM "Property" WHERE id=$1', [fixtures[0].propertyId])).rows[0].n, 0);
      assert.equal((await readFile(path.join(process.env.SUKOON_DATA_DIR!, fixtures[0].storageKey))).length > 0, true);
      await assert.rejects(() => raw.query('UPDATE "Property" SET name=$1 WHERE id=$2', ["LATE_WRITE", fixtures[2].propertyId]), /ERASURE_DATABASE_FENCED/);
      await raw.end();
      console.log("INTERRUPTION_PASS: DB removed; bytes still present; app access and raw late DB writes denied.");
    } else if (stage === "database-failure-install" || stage === "database-failure-clear") {
      assert.throws(assertErasureReady);
      const raw = new Client({ connectionString: process.env.DATABASE_URL }); await raw.connect();
      assert.equal((await raw.query('SELECT run FROM "SyntheticErasureEnvironment"')).rows[0].run, run);
      assert.equal((await raw.query('SELECT count(*)::int n FROM "Property" WHERE id=$1', [fixtures[0].propertyId])).rows[0].n, 1);
      if (stage === "database-failure-install") {
        await raw.query("CREATE FUNCTION synthetic_injected_delete_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_DB_FAILURE'; END $$");
        await raw.query('CREATE TRIGGER synthetic_injected_delete_failure BEFORE DELETE ON "Property" FOR EACH ROW EXECUTE FUNCTION synthetic_injected_delete_failure()');
      } else {
        await raw.query('DROP TRIGGER synthetic_injected_delete_failure ON "Property"');
        await raw.query('DROP FUNCTION synthetic_injected_delete_failure()');
        console.log("DATABASE_FAILURE_PASS: instruction durable; deletion transaction rolled back; source remains fenced; synthetic fault removed.");
      }
      await raw.end();
    } else if (stage === "verify" || stage === "verify-property" || stage === "verify-restored") {
      assertErasureReady();
      if (fixture.purchaseFixtures?.length && stage !== "verify-property") {
        const [removed, retained] = fixture.purchaseFixtures;
        assert.equal(await prisma.purchaseCandidate.count({ where: { id: removed.candidateId } }), 0);
        assert.equal(await prisma.propertyDoc.count({ where: { id: removed.documentId } }), 0);
        assert.equal(await prisma.documentVersion.count({ where: { documentId: removed.documentId } }), 0);
        assert.equal(await prisma.documentParsingRun.count({ where: { documentId: removed.documentId } }), 0);
        assert.equal(await prisma.purchaseEvidenceEvent.count({ where: { entryId: removed.entryId } }), 0);
        assert.equal(await prisma.outboxEvent.count({ where: { aggregateId: removed.documentId } }), 0);
        for (const key of removed.keys) await assert.rejects(readFile(path.join(process.env.SUKOON_DATA_DIR!, key)), { code: "ENOENT" });
        assert.equal(await prisma.purchaseCandidate.count({ where: { id: retained.candidateId } }), 1);
        for (const key of retained.keys) assert.ok((await readFile(path.join(process.env.SUKOON_DATA_DIR!, key))).length);
        const { runDocumentJobOnce } = await import("../lib/document-processing");
        // Retained pending uploads remain quarantined if scanner is unavailable;
        // no deleted job or source can be recreated by the ordinary worker.
        await runDocumentJobOnce(`purchase-erasure-late-${run}`);
        assert.equal(await prisma.propertyDoc.count({ where: { id: removed.documentId } }), 0);
        assert.equal(await prisma.documentParsingRun.count({ where: { documentId: removed.documentId } }), 0);
        console.log("PURCHASE_ERASURE_PASS: originals, replacements, derived data, evidence and queued work removed; unrelated purchase bytes preserved; late worker cannot recreate removed source.");
      }
      assert.equal(await prisma.property.count({ where: { id: fixtures[2].propertyId } }), 1);
      assert.equal(await prisma.documentVersion.count({ where: { id: fixtures[2].versionId } }), 1);
      assert.ok((await readFile(path.join(process.env.SUKOON_DATA_DIR!, fixtures[2].storageKey))).length);
      assert.equal(await prisma.property.count({ where: { id: fixtures[0].propertyId } }), 0);
      if (stage === "verify-property") { assert.equal(await prisma.user.count({ where: { id: owner.id } }), 1); assert.equal(await prisma.property.count({ where: { id: fixtures[1].propertyId } }), 1); }
      else { assert.equal(await prisma.user.count({ where: { id: { in: [owner.id, delegate.id] } } }), 0); assert.equal(await prisma.property.count(), 1); assert.equal(await prisma.shareLink.count(), 0); }
      for (const user of stage === "verify-property" ? [owner] : [owner, delegate]) assert.equal(await auth.api.getSession({ headers: new Headers({ cookie: user.cookie }) }), null);
      assert.ok(await auth.api.getSession({ headers: new Headers({ cookie: other.cookie }) }));
      console.log(`${stage}: removed scope and old sessions absent; unrelated owner/property/version/bytes/session intact.`);
    } else if (stage === "restore-before") {
      assert.throws(assertErasureReady);
      await erasureMaintenance(async () => { assert.equal(await prisma.property.count(), 3); assert.equal(await prisma.shareLink.count(), 3); assert.equal(await prisma.user.count(), 3); });
      console.log("RESTORE_OLD_RECORDS_PASS: three old users/properties/grants present behind closed gate.");
    } else if (stage === "negative-gates") {
      const config = { database: process.env.DATABASE_URL, root: process.env.SUKOON_DATA_DIR, policy: process.env.SUKOON_SYNTHETIC_ERASURE };
      process.env.DATABASE_URL = config.database!.replace(/sukoon_s02_local_erasure_[a-f0-9]+(?:_restore)?/, "sukoon_s02_local_20260911");
      assert.throws(assertErasureReady);
      process.env.DATABASE_URL = config.database;
      process.env.SUKOON_DATA_DIR = path.resolve(".data"); assert.throws(assertErasureReady); process.env.SUKOON_DATA_DIR = config.root;
      delete process.env.SUKOON_SYNTHETIC_ERASURE; assert.throws(assertErasureReady); process.env.SUKOON_SYNTHETIC_ERASURE = config.policy;
      const ledgerFile = path.join(ledgerDir, "ledger.json"), original = await readFile(ledgerFile, "utf8");
      await rename(ledgerFile, `${ledgerFile}.unavailable`); assert.throws(assertErasureReady); await rename(`${ledgerFile}.unavailable`, ledgerFile);
      try { const incomplete = JSON.parse(original); incomplete.deletions.pop(); await writeFile(ledgerFile, JSON.stringify(incomplete)); assert.throws(assertErasureReady); }
      finally { await writeFile(ledgerFile, original); }
      console.log("NEGATIVE_GATES_PASS: normal DB, wrong root, disabled policy, missing ledger and incomplete instructions rejected.");
    }
  }
  await prisma.$disconnect();
}
async function main() {
  if (stage) return child();
  await provision();
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "seed"]);
  const archive = path.join(base, "before-erasure.dump"), snapshot = path.join(base, "before-erasure-objects");
  command("pg_dump", ["--host", source.hostname, "--username", source.username, "--format=custom", "--no-owner", "--no-acl", "--file", archive, database]);
  await cp(env.SUKOON_DATA_DIR, snapshot, { recursive: true, errorOnExist: true, force: false });
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "confirm-property"]);
  if (process.env.SUKOON_ERASURE_PURCHASE_ONLY !== "1") {
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "database-failure-install"]);
  command("npx", ["tsx", "scripts/erasure-worker.ts"], env, 1);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "database-failure-clear"]);
  command("npx", ["tsx", "scripts/erasure-worker.ts", "--interrupt-after-database"], env, 75);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "interrupted"]);
  const fixture = JSON.parse(await readFile(path.join(base, "fixture.json"), "utf8"));
  const failedObject = path.join(env.SUKOON_DATA_DIR, fixture.fixtures[0].storageKey), heldObject = path.join(base, "held-synthetic-object");
  await rename(failedObject, heldObject); await mkdir(failedObject);
  command("npx", ["tsx", "scripts/erasure-worker.ts"], env, 1);
  assert.equal(JSON.parse(await readFile(path.join(ledgerDir, "ledger.json"), "utf8")).targets[database].ready, false);
  await rmdir(failedObject); await rename(heldObject, failedObject);
  records.push({ test: "storage EISDIR failure", gate: "closed", repair: "synthetic obstacle removed; original test bytes restored for retry" });
  }
  command("npx", ["tsx", "scripts/erasure-worker.ts"]);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "verify-property"]);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "confirm-account"]);
  command("npx", ["tsx", "scripts/erasure-worker.ts"]);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "confirm-delegate"]);
  command("npx", ["tsx", "scripts/erasure-worker.ts"]);
  command("npx", ["tsx", "scripts/erasure-worker.ts"]);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "verify"]);
  for (let job = 0; job < 3; job++) command("npx", ["tsx", "scripts/erasure-worker.ts", "--queue"]);
  const restoredDatabase = `${database}_restore`, restoredRoot = path.join(base, "restored-objects");
  command("createdb", ["--host", source.hostname, "--username", source.username, restoredDatabase]);
  // NO --create, --clean or archive-selected database. Explicit new target only.
  command("pg_restore", ["--host", source.hostname, "--username", source.username, "--no-owner", "--no-acl", "--exit-on-error", "--dbname", restoredDatabase, archive]);
  await cp(snapshot, restoredRoot, { recursive: true, errorOnExist: true, force: false });
  const ledger = JSON.parse(await readFile(path.join(ledgerDir, "ledger.json"), "utf8")), nonce = randomUUID();
  ledger.targets[restoredDatabase] = { nonce, ready: false, completed: [] };
  await writeFile(path.join(ledgerDir, "ledger.json"), JSON.stringify(ledger), { mode: 0o600 });
  await writeFile(path.join(restoredRoot, ".erasure-target.json"), JSON.stringify({ run, database: restoredDatabase, nonce }), { mode: 0o600 });
  const restoredUrl = new URL(source); restoredUrl.pathname = `/${restoredDatabase}`;
  const restoredEnv = { ...env, DATABASE_URL: restoredUrl.href, SUKOON_DATA_DIR: restoredRoot };
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "restore-before"], restoredEnv);
  command("npx", ["tsx", "scripts/erasure-worker.ts"], restoredEnv);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "verify-restored"], restoredEnv);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "negative-gates"], restoredEnv);
  // A second new process proves repeat replay is harmless and readiness durable.
  command("npx", ["tsx", "scripts/erasure-worker.ts"], restoredEnv);
  command("npx", ["tsx", "scripts/erasure-acceptance.ts", "verify-restored"], restoredEnv);
  await rename(path.join(ledgerDir, "instructions"), path.join(ledgerDir, "instructions-unavailable"));
  command("npx", ["tsx", "scripts/erasure-worker.ts"], restoredEnv, 1);
  await rename(path.join(ledgerDir, "instructions-unavailable"), path.join(ledgerDir, "instructions"));
  await writeFile(path.join(base, "evidence.json"), JSON.stringify({ run, database, restoredDatabase, historicalBackupRetained: true, records }, null, 2), { mode: 0o600 });
  console.log(`ERASURE_ACCEPTANCE_PASS ${base}`);
}
main().catch(error => { console.error(error); console.error(`FAILED_RUN_PRESERVED ${base}`); process.exitCode = 1; });

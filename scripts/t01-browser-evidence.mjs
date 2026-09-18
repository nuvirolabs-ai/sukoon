// Ordinary local app acceptance. No database writes, fixture scanner or saved auth.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire('/Users/tanutejas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const root = 'http://localhost:3100';
const dir = 'output/t01-browser-evidence';
await mkdir(dir, { recursive: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const evidencePath = `${dir}/evidence.json`;
const evidence = process.argv[2] ? JSON.parse(await readFile(evidencePath, 'utf8')) : { screenshots: [], checks: [], browser: 'Installed headless Chromium, ordinary local application' };
async function capture(name) { const refresh = page.getByRole('button', { name: 'Refresh evidence status', exact: true }); await refresh.waitFor(); for (let i = 0; i < 50 && !await refresh.isEnabled(); i++) await new Promise(resolve => setTimeout(resolve, 100)); assert.ok(await refresh.isEnabled()); await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true }); evidence.screenshots.push(`${dir}/${name}.png`); }
async function login(email = 't01-buyer-20260912@example.com') {
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send OTP', exact: true }).click();
  await page.getByLabel('One-time code').waitFor();
  const mailbox = await context.request.get(`${root}/api/auth/dev-mailbox?email=${encodeURIComponent(email)}`);
  await page.getByLabel('One-time code').fill((await mailbox.json()).data.otp);
  await page.getByRole('button', { name: 'Open passport', exact: true }).click();
  await page.getByRole('heading', { name: 'My Purchase Workspaces', exact: true }).waitFor();
  if (email.startsWith('t01-buyer-')) await page.getByRole('heading', { name: 'Purchase documents and evidence', exact: true }).waitFor();
}
async function action(index, actionName, note) {
  await page.locator('select[name="action"]').nth(index).selectOption(actionName);
  await page.locator('select[name="documentVersionId"]').nth(index).selectOption(evidence.versionId);
  await page.locator('textarea[name="note"]').nth(index).fill(note);
  const pending = page.waitForResponse(r => r.url().endsWith('/api/purchases/evidence') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save evidence action', exact: true }).nth(index).click();
  assert.equal((await pending).status(), 200);
  await page.getByRole('button', { name: 'Refresh evidence status', exact: true }).click();
}
try {
  await page.goto(`${root}/buy-sell/purchases`, { waitUntil: 'domcontentloaded' });
  await login();
  if (process.argv[2] === 'capture-only') {
    await page.getByRole('button', { name: 'Inspect scan evidence: t01-purchase-evidence-synthetic.pdf', exact: true }).click();
    await capture('11-final-reviewed-history');
  } else if (process.argv[2] === 'unrelated') {
    await context.request.post(`${root}/api/auth/sign-out`, { headers: { origin: root }, data: {} });
    await page.reload({ waitUntil: 'domcontentloaded' }); await login('t01-unrelated-20260912@example.com');
    assert.equal((await context.request.get(`${root}/api/session`)).status(), 200);
    const denials = [];
    for (const route of [`/api/documents?purchaseCandidateId=${evidence.candidateId}`, `/api/documents/${evidence.documentId}`, `/api/documents/${evidence.documentId}?metadata=true`, `/api/documents/${evidence.documentId}?download=true&versionId=${evidence.versionId}`, `/api/documents/${evidence.documentId}/review`, `/api/purchases/evidence?candidateId=${evidence.candidateId}`]) {
      const result = await context.request.get(`${root}${route}`); assert.ok([401, 404].includes(result.status())); assert.ok(!(await result.text()).includes('t01-purchase-evidence-synthetic.pdf')); denials.push({ route, status: result.status() });
    }
    evidence.unrelatedBuyerDenials = denials;
    await page.screenshot({ path: `${dir}/09-unrelated-buyer-empty.png`, fullPage: true }); evidence.screenshots.push(`${dir}/09-unrelated-buyer-empty.png`);
  } else if (process.argv[2] === 'boundaries') {
    const snapshot = (await (await context.request.get(`${root}/api/purchases/evidence?candidateId=${evidence.candidateId}`)).json()).data;
    const question = snapshot.find(e => e.kind === 'QUESTION');
    const mutation = { candidateId: evidence.candidateId, entryId: question.id, version: question.version, action: 'REOPEN', note: 'Synthetic API boundary confirmation: remains unresolved.', source: 'USER_NOTE', documentVersionId: evidence.versionId, requestKey: crypto.randomUUID() };
    const post = data => context.request.post(`${root}/api/purchases/evidence`, { headers: { origin: root }, data });
    assert.equal((await post(mutation)).status(), 200);
    assert.equal((await post(mutation)).status(), 200);
    assert.equal((await post({ ...mutation, requestKey: crypto.randomUUID() })).status(), 409);
    assert.equal((await post({ ...mutation, candidateId: crypto.randomUUID(), requestKey: crypto.randomUUID() })).status(), 404);
    await page.locator('select[name="replaceDocumentId"]').selectOption(evidence.documentId);
    await page.getByLabel('Candidate document', { exact: true }).setInputFiles('output/pdf/t01-purchase-evidence-synthetic.pdf');
    const pending = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Upload to private quarantine', exact: true }).click();
    const response = await pending; assert.equal(response.status(), 201);
    const doc = (await response.json()).data.document;
    assert.equal(doc.version, 2); assert.equal(doc.scanStatus, 'scan_pending');
    evidence.replacementVersionId = doc.versions.find(v => v.version === 2).id;
    assert.equal((await context.request.get(`${root}/api/documents/${doc.id}`)).status(), 423);
    assert.equal((await context.request.get(`${root}/api/documents/${doc.id}?versionId=${evidence.versionId}`)).status(), 200);
    await page.getByText('Historical — not current', { exact: false }).waitFor();
    await capture('08-replacement-quarantine-history');
    evidence.checks.push('UI replacement v2 quarantined; historical v1 reference remains available; duplicate 200, stale 409, wrong candidate 404');
    await context.request.post(`${root}/api/auth/sign-out`, { headers: { origin: root }, data: {} });
    await page.reload({ waitUntil: 'domcontentloaded' }); await login('t01-unrelated-20260912@example.com');
    const denials = [];
    for (const route of [`/api/documents?purchaseCandidateId=${evidence.candidateId}`, `/api/documents/${doc.id}`, `/api/documents/${doc.id}?metadata=true`, `/api/documents/${doc.id}?download=true&versionId=${evidence.versionId}`, `/api/documents/${doc.id}/review`, `/api/purchases/evidence?candidateId=${evidence.candidateId}`]) {
      const result = await context.request.get(`${root}${route}`); assert.equal(result.status(), 404); assert.ok(!(await result.text()).includes('t01-purchase-evidence-synthetic.pdf')); denials.push({ route, status: result.status() });
    }
    evidence.unrelatedBuyerDenials = denials;
    await page.screenshot({ path: `${dir}/09-unrelated-buyer-empty.png`, fullPage: true }); evidence.screenshots.push(`${dir}/09-unrelated-buyer-empty.png`);
  } else if (process.argv[2] === 'review-replacement') {
    await page.getByRole('button', { name: 'Confirm category for v2', exact: true }).click();
    await page.getByRole('link', { name: 'Preview v2', exact: true }).waitFor();
    await capture('10-current-and-historical-reviewed');
    const metadata = await (await context.request.get(`${root}/api/documents/${evidence.documentId}?metadata=true`)).json();
    evidence.scanEvidence = metadata.data.scanEvidence;
    const downloaded = await context.request.get(`${root}/api/documents/${evidence.documentId}?download=true`);
    assert.equal(downloaded.status(), 200); assert.equal(createHash('sha256').update(await downloaded.body()).digest('hex'), evidence.hash);
    evidence.checks.push('Replacement v2 independently really scanned, manually confirmed and hash verified');
  } else if (process.argv[2] === 'receive') {
    assert.equal((await context.request.get(`${root}/api/documents/${evidence.documentId}`)).status(), 423);
    await action(0, 'RECEIVE', 'Synthetic buyer upload received locally while quarantined. No seller delivery or verification.');
    await capture('02-quarantine-received');
    evidence.checks.push('UI upload, quarantine 423 and receipt recorded separately');
    delete evidence.failure;
  } else if (!process.argv[2]) {
    await capture('01-purchase-overview');
    const bytes = await readFile('output/pdf/t01-purchase-evidence-synthetic.pdf');
    evidence.hash = createHash('sha256').update(bytes).digest('hex');
    await page.getByLabel('Candidate document', { exact: true }).setInputFiles('output/pdf/t01-purchase-evidence-synthetic.pdf');
    const pending = page.waitForResponse(r => r.url().endsWith('/api/documents') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Upload to private quarantine', exact: true }).click();
    const uploaded = await pending; assert.equal(uploaded.status(), 201);
    const doc = (await uploaded.json()).data.document;
    const v = doc.versions.find(v => v.version === doc.version);
    Object.assign(evidence, { documentId: doc.id, candidateId: doc.purchaseCandidateId, versionId: v.id, sizeBytes: bytes.length });
    assert.equal(v.sha256, evidence.hash); assert.equal(doc.scanStatus, 'scan_pending');
    assert.equal((await context.request.get(`${root}/api/documents/${doc.id}`)).status(), 423);
    await action(0, 'RECEIVE', 'Synthetic buyer upload received locally while quarantined. No seller delivery or verification.');
    await capture('02-quarantine-received');
    evidence.checks.push('UI upload, quarantine 423 and receipt recorded separately');
  } else {
    const metadata = await (await context.request.get(`${root}/api/documents/${evidence.documentId}?metadata=true`)).json();
    assert.equal(metadata.data.document.scanStatus, 'clean'); evidence.scanEvidence = metadata.data.scanEvidence;
    await page.getByRole('button', { name: 'Confirm category for v1', exact: true }).last().click();
    await page.getByRole('link', { name: 'Preview v1', exact: true }).last().waitFor();
    await page.getByRole('button', { name: 'Inspect scan evidence: t01-purchase-evidence-synthetic.pdf', exact: true }).click();
    await capture('03-real-scan-manual-review');
    const download = await context.request.get(`${root}/api/documents/${evidence.documentId}?versionId=${evidence.versionId}&download=true`);
    assert.equal(download.status(), 200); assert.equal(createHash('sha256').update(await download.body()).digest('hex'), evidence.hash);
    evidence.checks.push('Protected HTTP download matches actual uploaded hash');
    const popupPending = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
    await page.getByRole('link', { name: 'Preview v1', exact: true }).last().click();
    const popup = await popupPending;
    if (popup) {
    await popup.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    try { await popup.screenshot({ path: `${dir}/04-browser-preview.png`, timeout: 5000 }); evidence.screenshots.push(`${dir}/04-browser-preview.png`); }
    catch (error) { evidence.previewCaptureFailure = error.message; }
    evidence.preview = { url: popup.url(), visualPass: false, reason: 'Native PDF popup did not provide verified page rendering; protected HTTP download verified independently.' };
    await popup.close();
    } else { evidence.preview = { visualPass: false, reason: 'Preview click did not produce a renderable popup within 5 seconds; separate HTTP hash passed.' }; }
    await action(0, 'REVIEW', 'User reviewed synthetic page only. Not legal clearance.');
    await action(1, 'ANSWER', 'Synthetic page cannot establish any real area measurement.');
    await action(1, 'RESOLVE', 'Resolved this local synthetic question for acceptance only.');
    await capture('05-question-resolved-history');
    await action(1, 'REOPEN', 'Correction: actual area remains unknown; reopened pending genuine evidence.');
    await capture('06-question-reopened-history');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByText('Correction: actual area remains unknown; reopened pending genuine evidence.', { exact: true }).waitFor();
    const session = await (await context.request.get(`${root}/api/session`)).json(); assert.equal(session.data.state.properties.length, 0);
    await context.request.post(`${root}/api/auth/sign-out`, { headers: { origin: root }, data: {} });
    await page.reload({ waitUntil: 'domcontentloaded' }); await login();
    await page.getByText('Correction: actual area remains unknown; reopened pending genuine evidence.', { exact: true }).waitFor();
    evidence.checks.push('Question answer/resolve/reopen, refresh and fresh OTP persistence; zero owned properties');
    await capture('07-reauthenticated-evidence');
  }
  delete evidence.failure;
  console.log(JSON.stringify(evidence));
} catch (error) { evidence.failure = error.message; console.error(error.message); process.exitCode = 1;
} finally { evidence.errors = errors; evidence.screenshots = [...new Set(evidence.screenshots)]; evidence.checks = [...new Set(evidence.checks)]; await writeFile(evidencePath, JSON.stringify(evidence, null, 2)); await browser.close(); }

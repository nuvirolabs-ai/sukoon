// HTTP confirmation of UI-created synthetic records. No fixture providers or DB writes.
import assert from "node:assert/strict";
const base = "http://localhost:3100";
const project = "build-627e6f7dc2ee4d0d8389fb36e35d541d";
const document = "7001e8e567ce412eaa22d98525f9d01e";
const revoked = process.argv.includes("--revoked");
async function login(email) {
  const post = (path, data) => fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify(data) });
  assert.equal((await post("/api/auth/email-otp/send-verification-otp", { email, type: "sign-in" })).status, 200);
  const mailbox = await (await fetch(`${base}/api/auth/dev-mailbox?email=${encodeURIComponent(email)}`)).json();
  const response = await post("/api/auth/sign-in/email-otp", { email, otp: mailbox.data.otp });
  assert.equal(response.status, 200);
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}
const owner = await login("construction-review-20260912@example.com");
const get = (path, cookie) => fetch(base + path, { headers: { cookie }, redirect: "manual" });
const owned = await (await get(`/api/construction/${project}`, owner)).json();
assert.equal(owned.data.recordedSpendPaise, "250000");
const bytes = await get(`/api/documents/${document}`, owner);
assert.equal(bytes.status, 423);
assert.match(bytes.headers.get("content-type"), /json/);
const architect = await login("construction-architect-review-20260912@example.com");
const response = await get(`/api/construction/${project}`, architect);
const body = await response.json();
if (revoked) assert.equal(response.status, 404);
else {
  assert.equal(response.status, 200);
  assert.equal(body.data.owner, false);
  assert.equal(body.data.recordedSpendPaise, undefined);
  assert.equal(body.data.estimatedBudgetPaise, undefined);
  assert.equal(body.data.costs.length, 0);
  assert.equal(body.data.budgets.length, 0);
  assert.equal(body.data.contacts.length, 0);
  assert.ok(body.data.tasks.length > 0);
  assert.ok(body.data.updates.length > 0);
  assert.ok(!JSON.stringify(body).includes("PRIVATE CONTACT NOTE"));
}
const sources = await get(`/api/construction/${project}/cost-sources`, architect);
assert.equal(sources.status, 404);
const sharedBytes = await get(`/api/shared/documents/${document}`, architect);
assert.equal(sharedBytes.status, 404);
console.log(JSON.stringify({ phase: revoked ? "revoked" : "active", ownerSpendPaise: owned.data.recordedSpendPaise, ownerUnscannedBytesStatus: bytes.status, architectProjectStatus: response.status, architectCostSourcesStatus: sources.status, architectUnselectedDocumentStatus: sharedBytes.status, financialAndContactFieldsAbsent: revoked ? "project denied" : true, providerBypass: false }));

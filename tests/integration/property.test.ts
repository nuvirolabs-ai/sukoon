import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { clearLocalMailbox, readLocalOtp } from "@/lib/auth-mailbox";
import { prisma } from "@/lib/prisma";
import { GET as listProperties, POST as createProperty } from "@/app/api/properties/route";
import { PATCH as updateProperty, POST as propertyAction } from "@/app/api/properties/[id]/route";
import { GET as propertyHistory } from "@/app/api/properties/[id]/history/route";
import { createObligationForUser } from "@/lib/obligations";

const authHandler = toNextJsHandler(auth);

function withCookie(path: string, cookie: string, init?: RequestInit) {
  return new Request(`http://localhost:3100${path}`, { ...init, headers: { ...(init?.headers ?? {}), cookie, "content-type": "application/json" } });
}

async function signIn(email: string) {
  await authHandler.POST(new Request("http://localhost:3100/api/auth/email-otp/send-verification-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, type: "sign-in" }) }));
  const otp = readLocalOtp(email)?.otp;
  expect(otp).toMatch(/^\d{6}$/);
  const response = await authHandler.POST(new Request("http://localhost:3100/api/auth/sign-in/email-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, otp }) }));
  expect(response.ok).toBe(true);
  return response.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
}

function payload(name = "Vijay Nagar Home") {
  return { name, type: "flat", city: "Indore", area: "Vijay Nagar", address: "1203 Skyline Residency", jurisdiction: "India / Madhya Pradesh / Indore", areaValue: "1200", areaUnit: "sqft", areaType: "carpet", ownerName: "Owner A", ownershipAssertion: "self_asserted", ownershipProvenance: "Owner-entered assertion; registry upload pending", identifiers: [{ label: "Survey no.", value: "SYN-1200" }] };
}

beforeAll(async () => {
  await prisma.user.deleteMany();
  clearLocalMailbox();
});

afterAll(async () => {
  await prisma.user.deleteMany();
  clearLocalMailbox();
});

describe("S07 Property Passport vertical slice", () => {
  it("O01 records manual ownership and renewal facts without grants or automatic schedules, then deduplicates an explicitly entered schedule", async () => {
    const cookie = await signIn("o01-manual-owner@example.com");
    const created = await createProperty(withCookie("/api/properties", cookie, { method: "POST", body: JSON.stringify(payload("Synthetic ownership renewal")) }));
    const property = (await created.json()).data.property;
    const context = { params: Promise.resolve({ id: property.id }) };
    const patch = (data: object, version = property.version) => updateProperty(withCookie(`/api/properties/${property.id}`, cookie, { method: "PATCH", body: JSON.stringify({ version, property: data }) }), context);
    expect((await patch({ insuranceUntil: "2027-02-30" })).status).toBe(400);
    const saved = await patch({ coOwners: "Synthetic co-owner; record only", loanActive: true, loanBalance: "1234.56", insuranceUntil: "2027-02-28" });
    expect(saved.status).toBe(200);
    const state = (await saved.json()).data;
    expect(state.property).toMatchObject({ coOwners: "Synthetic co-owner; record only", loanActive: true, loanBalance: 1234.56, insuranceUntil: "2027-02-28" });
    expect((await prisma.property.findUniqueOrThrow({ where: { id: property.id } })).loanBalancePaise).toBe(123456n);
    expect(await prisma.shareLink.count({ where: { propertyId: property.id } })).toBe(0);
    expect(await prisma.obligation.count({ where: { propertyId: property.id } })).toBe(0);
    expect(await prisma.propertyHistory.count({ where: { propertyId: property.id, field: { in: ["coOwners", "loanActive", "loanBalancePaise", "insuranceUntil"] } } })).toBeGreaterThanOrEqual(4);
    expect((await patch({ loanBalance: "99" })).status).toBe(409);
    const blank = await patch({ loanBalance: null }, state.property.version); expect(blank.status).toBe(200);
    expect((await prisma.property.findUniqueOrThrow({ where: { id: property.id } })).loanBalancePaise).toBeNull();
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: "o01-manual-owner@example.com" } });
    const schedule = { type: "Insurance", label: "Synthetic renewal review", direction: "NON_FINANCIAL", currency: "INR", dueDate: "2027-02-28", timezone: "Asia/Kolkata", recurrenceType: "once", requestKey: "o01-renewal-idempotency-01", reminderConfig: { enabled: true, beforeDays: [0, 7], localTime: "09:00", channels: ["IN_APP"] } };
    const pair = await Promise.all([createObligationForUser(owner.id, property.id, schedule), createObligationForUser(owner.id, property.id, schedule)]);
    expect(pair[0].id).toBe(pair[1].id);
    expect(pair[0].amountPaise).toBeNull();
    expect(await prisma.obligation.count({ where: { propertyId: property.id } })).toBe(1);
    expect(await prisma.durableReminder.count({ where: { propertyId: property.id } })).toBe(2);
    await expect(createObligationForUser(owner.id, property.id, { ...schedule, dueDate: "2027-03-01" })).rejects.toMatchObject({ code: "REQUEST_KEY_CONFLICT" });
    await signIn("o01-foreign-owner@example.com");
    const other = await prisma.user.findUniqueOrThrow({ where: { email: "o01-foreign-owner@example.com" } });
    await expect(createObligationForUser(other.id, property.id, schedule)).rejects.toMatchObject({ status: 404 });
  });
  it("validates required jurisdiction and persists typed identity with history", async () => {
    const ownerCookie = await signIn("passport-owner@example.com");
    const invalid = await createProperty(withCookie("/api/properties", ownerCookie, { method: "POST", body: JSON.stringify({ ...payload(), jurisdiction: "" }) }));
    expect(invalid.status).toBe(400);
    const created = await createProperty(withCookie("/api/properties", ownerCookie, { method: "POST", body: JSON.stringify(payload()) }));
    expect(created.status).toBe(201);
    const createdBody = await created.json() as { data: { property: { id: string; version?: number; jurisdiction?: string; areaValue?: string; ownershipAssertion?: string }; state: { properties: unknown[] }; version: number } };
    expect(createdBody.data.property.jurisdiction).toContain("Indore");
    expect(createdBody.data.property.areaValue).toBe("1200");
    expect(createdBody.data.property.ownershipAssertion).toBe("self_asserted");
    expect(createdBody.data.state.properties).toHaveLength(1);
    const history = await propertyHistory(withCookie(`/api/properties/${createdBody.data.property.id}/history`, ownerCookie), { params: Promise.resolve({ id: createdBody.data.property.id }) });
    expect(history.status).toBe(200);
    expect((await history.json()).data.history.length).toBeGreaterThan(0);
  });

  it("keeps a new account empty, then lists one and multiple owned passports", async () => {
    const ownerCookie = await signIn("passport-list@example.com");
    const empty = await listProperties(withCookie("/api/properties", ownerCookie));
    expect((await empty.json()).data.properties).toEqual([]);
    const first = await createProperty(withCookie("/api/properties", ownerCookie, { method: "POST", body: JSON.stringify(payload("First passport")) }));
    expect(first.status).toBe(201);
    const second = await createProperty(withCookie("/api/properties", ownerCookie, { method: "POST", body: JSON.stringify(payload("Second passport")) }));
    expect(second.status).toBe(201);
    const multiple = await listProperties(withCookie("/api/properties", ownerCookie));
    expect((await multiple.json()).data.properties).toHaveLength(2);
  });

  it("edits with property versions, archives without deleting children, and restores", async () => {
    const ownerCookie = await signIn("passport-owner-edit@example.com");
    const created = await createProperty(withCookie("/api/properties", ownerCookie, { method: "POST", body: JSON.stringify(payload("Archive me")) }));
    const createdBody = await created.json() as { data: { property: { id: string; version: number } } };
    const id = createdBody.data.property.id;
    const firstEdit = await updateProperty(withCookie(`/api/properties/${id}`, ownerCookie, { method: "PATCH", body: JSON.stringify({ version: createdBody.data.property.version, property: { ...payload("Edited home") } }) }), { params: Promise.resolve({ id }) });
    expect(firstEdit.status).toBe(200);
    const editBody = await firstEdit.json() as { data: { property: { version: number; name: string } } };
    expect(editBody.data.property.name).toBe("Edited home");
    const stale = await updateProperty(withCookie(`/api/properties/${id}`, ownerCookie, { method: "PATCH", body: JSON.stringify({ version: createdBody.data.property.version, property: { ...payload("Stale overwrite") } }) }), { params: Promise.resolve({ id }) });
    expect(stale.status).toBe(409);

    const owner = await prisma.user.findUniqueOrThrow({ where: { email: "passport-owner-edit@example.com" } });
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: owner.id } });
    await prisma.propertyDoc.create({ data: { id: "passport-archive-doc", workspaceId: workspace.id, propertyId: id, type: "Registry", name: "Synthetic registry", uploadDate: "2026-09-11", sizeBytes: 8, storageKey: `${owner.id}/${id}/passport-archive-doc.pdf`, mimeType: "application/pdf", processingState: "awaiting_review", verified: false } });
    const archived = await propertyAction(withCookie(`/api/properties/${id}/archive`, ownerCookie, { method: "POST", body: JSON.stringify({ version: editBody.data.property.version }) }), { params: Promise.resolve({ id }) });
    expect(archived.status).toBe(200);
    const archivedBody = await archived.json() as { data: { property: { version: number; status: string }; state: { properties: unknown[] } } };
    expect(archivedBody.data.property.status).toBe("archived");
    expect(archivedBody.data.state.properties).toHaveLength(0);
    expect(await prisma.propertyDoc.count({ where: { id: "passport-archive-doc" } })).toBe(1);

    const restored = await propertyAction(withCookie(`/api/properties/${id}/restore`, ownerCookie, { method: "POST", body: JSON.stringify({ version: archivedBody.data.property.version }) }), { params: Promise.resolve({ id }) });
    expect(restored.status).toBe(200);
    expect((await restored.json()).data.state.properties).toHaveLength(1);
  });

  it("does not expose list, edit, archive, or history to a second user", async () => {
    const ownerCookie = await signIn("passport-owner-authorization@example.com");
    const created = await createProperty(withCookie("/api/properties", ownerCookie, { method: "POST", body: JSON.stringify(payload("Private passport")) }));
    const id = (await created.json()).data.property.id as string;
    const otherCookie = await signIn("passport-other-authorization@example.com");
    const list = await listProperties(withCookie("/api/properties?includeArchived=true", otherCookie));
    expect(list.status).toBe(200);
    expect((await list.json()).data.properties).toEqual([]);
    const edit = await updateProperty(withCookie(`/api/properties/${id}`, otherCookie, { method: "PATCH", body: JSON.stringify({ version: 0, property: payload("Guessed") }) }), { params: Promise.resolve({ id }) });
    expect(edit.status).toBe(404);
    expect(await edit.text()).not.toContain(id);
    const archive = await propertyAction(withCookie(`/api/properties/${id}/archive`, otherCookie, { method: "POST", body: JSON.stringify({ version: 0 }) }), { params: Promise.resolve({ id }) });
    expect(archive.status).toBe(404);
    const history = await propertyHistory(withCookie(`/api/properties/${id}/history`, otherCookie), { params: Promise.resolve({ id }) });
    expect(history.status).toBe(404);
    expect(await history.text()).not.toContain(id);
  });
});

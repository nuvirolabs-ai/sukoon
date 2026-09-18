import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { clearLocalMailbox, readLocalOtp } from "@/lib/auth-mailbox";
import { prisma } from "@/lib/prisma";
import { GET as getState, PUT as putState } from "@/app/api/state/route";
import { GET as getDocument } from "@/app/api/documents/[id]/route";
import { emptyState } from "@/lib/store";

const authHandler = toNextJsHandler(auth);

async function signIn(email: string) {
  await authHandler.POST(new Request("http://localhost:3100/api/auth/email-otp/send-verification-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, type: "sign-in" }) }));
  const otp = readLocalOtp(email)?.otp;
  expect(otp).toMatch(/^\d{6}$/);
  const response = await authHandler.POST(new Request("http://localhost:3100/api/auth/sign-in/email-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, otp }) }));
  expect(response.ok).toBe(true);
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  return setCookie?.split(";", 1)[0] ?? "";
}

function requestWithCookie(path: string, cookie: string, init?: RequestInit) {
  return new Request(`http://localhost:3100${path}`, { ...init, headers: { ...(init?.headers ?? {}), cookie, "content-type": "application/json" } });
}

beforeAll(async () => {
  await prisma.user.deleteMany();
  await prisma.verification.deleteMany();
  clearLocalMailbox();
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.verification.deleteMany();
});

describe("S04 centralized authorization", () => {
  it("keeps the owner flow and denies guessed property/document IDs", async () => {
    const ownerCookie = await signIn("api-owner@example.com");
    const ownerState = emptyState();
    ownerState.properties.push({ id: "api-owner-property", name: "API owner home", type: "flat", city: "Pune", area: "Kothrud", address: "Private", ownerName: "Owner", createdAt: new Date().toISOString() });
    const createResponse = await putState(requestWithCookie("/api/state", ownerCookie, { method: "PUT", body: JSON.stringify({ version: 0, state: ownerState }) }));
    expect(createResponse.status).toBe(200);
    const ownerDocument = "api-owner-document-that-exists-only-in-owner-workspace";
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: "api-owner@example.com" } });
    const ownerWorkspace = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: owner.id } });
    await prisma.propertyDoc.create({ data: { id: ownerDocument, workspaceId: ownerWorkspace.id, propertyId: "api-owner-property", type: "Registry", name: "Owner registry", uploadDate: "2026-09-11", sizeBytes: 1, storageKey: `${owner.id}/api-owner-property/${ownerDocument}.pdf`, mimeType: "application/pdf", processingState: "awaiting_review", verified: false } });
    const otherCookie = await signIn("api-other@example.com");

    const emptyResponse = await getState(requestWithCookie("/api/state", otherCookie));
    expect(emptyResponse.status).toBe(200);
    expect((await emptyResponse.json()).data.state.properties).toEqual([]);

    const guessedPropertyResponse = await putState(requestWithCookie("/api/state", otherCookie, { method: "PUT", body: JSON.stringify({ version: 0, state: { ...emptyState(), properties: [{ ...ownerState.properties[0], id: "api-owner-property" }] } }) }));
    expect(guessedPropertyResponse.status).toBe(404);
    expect(await guessedPropertyResponse.text()).not.toContain("api-owner-property");

    const guessedDocumentResponse = await getDocument(requestWithCookie(`/api/documents/${ownerDocument}`, otherCookie), { params: Promise.resolve({ id: ownerDocument }) });
    expect(guessedDocumentResponse.status).toBe(404);
    expect(await guessedDocumentResponse.text()).not.toContain(ownerDocument);

    const guessedMetadata = await getDocument(requestWithCookie(`/api/documents/${ownerDocument}?metadata=true`, otherCookie), { params: Promise.resolve({ id: ownerDocument }) });
    expect(guessedMetadata.status).toBe(404);
  });
});

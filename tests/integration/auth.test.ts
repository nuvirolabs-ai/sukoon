import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { clearLocalMailbox, readLocalOtp } from "@/lib/auth-mailbox";
import { prisma } from "@/lib/prisma";

beforeAll(async () => {
  await prisma.user.deleteMany();
  await prisma.verification.deleteMany();
  clearLocalMailbox();
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.verification.deleteMany();
});

describe("S03 maintained email OTP auth", () => {
  it("hashes the OTP, creates a persistent session, and supports multiple users", async () => {
    const firstEmail = "otp-owner@example.com";
    const secondEmail = "otp-second@example.com";
    await auth.api.sendVerificationOTP({ body: { email: firstEmail, type: "sign-in" } });
    const firstMessage = readLocalOtp(firstEmail);
    expect(firstMessage?.otp).toMatch(/^\d{6}$/);
    const verification = await prisma.verification.findFirst({ where: { identifier: { contains: firstEmail } } });
    expect(verification?.value).toBeDefined();
    expect(verification?.value).not.toBe(firstMessage?.otp);

    const firstSignInWithHeaders = await auth.api.signInEmailOTP({ body: { email: firstEmail, otp: firstMessage?.otp ?? "" }, returnHeaders: true });
    const firstSignIn = firstSignInWithHeaders.response;
    const firstSession = await prisma.session.findUnique({ where: { token: firstSignIn.token } });
    expect(firstSession?.userId).toBe(firstSignIn.user.id);
    expect(firstSession?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    await auth.api.sendVerificationOTP({ body: { email: secondEmail, type: "sign-in" } });
    const secondMessage = readLocalOtp(secondEmail);
    const secondSignIn = await auth.api.signInEmailOTP({ body: { email: secondEmail, otp: secondMessage?.otp ?? "" } });
    expect(secondSignIn.user.id).not.toBe(firstSignIn.user.id);
    expect(await prisma.user.count()).toBe(2);
    expect(await prisma.session.count()).toBe(2);

    await expect(auth.api.signInEmailOTP({ body: { email: firstEmail, otp: "000000" } })).rejects.toThrow();
    const cookie = firstSignInWithHeaders.headers.get("set-cookie")?.split(";", 1)[0];
    expect(cookie).toContain("better-auth.session_token=");
    if (!cookie) throw new Error("Better Auth did not return a session cookie.");
    await auth.api.signOut({ headers: new Headers({ cookie }), returnHeaders: true });
    expect(await prisma.session.findUnique({ where: { token: firstSignIn.token } })).toBeNull();
  });
});

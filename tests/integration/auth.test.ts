import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { clearLocalMailbox, readLocalOtp } from "@/lib/auth-mailbox";
import { clearClientReviewLoginAttempts } from "@/lib/client-review-auth";
import { toNextJsHandler } from "better-auth/next-js";
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

describe("STAGING review access-code auth", () => {
  const previous = {
    APP_ENV: process.env.APP_ENV,
    NODE_ENV: process.env.NODE_ENV,
    SUKOON_RUNTIME_PROFILE: process.env.SUKOON_RUNTIME_PROFILE,
    SUKOON_STAGING_REVIEW_LOGIN: process.env.SUKOON_STAGING_REVIEW_LOGIN,
    SUKOON_STAGING_REVIEW_EMAIL: process.env.SUKOON_STAGING_REVIEW_EMAIL,
    SUKOON_STAGING_REVIEW_ACCESS_CODE: process.env.SUKOON_STAGING_REVIEW_ACCESS_CODE,
  };

  afterEach(async () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    clearClientReviewLoginAttempts();
    await prisma.user.deleteMany({ where: { email: "staging-review-auth@example.com" } });
  });

  it("keeps the staging endpoint unavailable in production even when staging variables are present", async () => {
    Object.assign(process.env, {
      APP_ENV: "production",
      NODE_ENV: "production",
      SUKOON_RUNTIME_PROFILE: "PRODUCTION",
      SUKOON_STAGING_REVIEW_LOGIN: "true",
      SUKOON_STAGING_REVIEW_EMAIL: "staging-review-auth@example.com",
      SUKOON_STAGING_REVIEW_ACCESS_CODE: "c".repeat(48),
    });

    const handlers = toNextJsHandler(auth);
    const response = await handlers.POST(new Request("http://localhost:3100/api/auth/staging-review/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "staging-review-auth@example.com", accessCode: "c".repeat(48) }),
    }));
    expect(response.status).toBe(404);
  });

  it("creates a normal Better Auth session and cookie without using the local mailbox", async () => {
    const email = "staging-review-auth@example.com";
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    const otp = readLocalOtp(email)?.otp;
    const signed = await auth.api.signInEmailOTP({ body: { email, otp: otp ?? "" }, returnHeaders: true });
    await auth.api.signOut({ headers: new Headers({ cookie: signed.headers.get("set-cookie")?.split(";", 1)[0] ?? "" }) });

    Object.assign(process.env, {
      APP_ENV: "staging",
      NODE_ENV: "production",
      SUKOON_RUNTIME_PROFILE: "STAGING",
      SUKOON_STAGING_REVIEW_LOGIN: "true",
      SUKOON_STAGING_REVIEW_EMAIL: email,
      SUKOON_STAGING_REVIEW_ACCESS_CODE: "c".repeat(48),
    });

    const handlers = toNextJsHandler(auth);
    const response = await handlers.POST(new Request("http://localhost:3100/api/auth/staging-review/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, accessCode: "c".repeat(48) }),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("better-auth.session_token=");
    expect(readLocalOtp(email)).toBeNull();
  });
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

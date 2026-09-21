import { timingSafeEqual } from "node:crypto";
import { APIError, type BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { isClientReviewAuthEnvironment } from "@/lib/auth-mailbox";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const ENTRY_TTL_MS = 60 * 60 * 1000;

type AttemptState = { failures: number; lockedUntil: number; updatedAt: number };
const attempts = new Map<string, AttemptState>();

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function configuredEmail(env: NodeJS.Dict<string> = process.env) {
  return normalizedEmail(env.SUKOON_CLIENT_REVIEW_EMAIL ?? "");
}

function configuredCode(env: NodeJS.Dict<string> = process.env) {
  return env.SUKOON_CLIENT_REVIEW_ACCESS_CODE ?? "";
}

function configuredStagingEmail(env: NodeJS.Dict<string> = process.env) {
  return normalizedEmail(env.SUKOON_STAGING_REVIEW_EMAIL ?? "");
}

function configuredStagingCode(env: NodeJS.Dict<string> = process.env) {
  return env.SUKOON_STAGING_REVIEW_ACCESS_CODE ?? "";
}

const validReviewEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

export function stagingReviewAuthEnvironment(env: NodeJS.Dict<string> = process.env) {
  return env.APP_ENV === "staging" && env.NODE_ENV === "production" && env.SUKOON_RUNTIME_PROFILE === "STAGING" && env.SUKOON_STAGING_REVIEW_LOGIN === "true";
}

export function stagingReviewAuthConfigured(env: NodeJS.Dict<string> = process.env) {
  const email = configuredStagingEmail(env);
  const code = configuredStagingCode(env);
  return stagingReviewAuthEnvironment(env) && validReviewEmail(email) && code.length >= 32;
}

export function clientReviewAuthConfigured(env: NodeJS.Dict<string> = process.env) {
  const email = configuredEmail(env);
  const code = configuredCode(env);
  return isClientReviewAuthEnvironment(env) && validReviewEmail(email) && code.length >= 32;
}

export function accessCodeMatches(candidate: string, expected: string) {
  const candidateBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  if (candidateBytes.length !== expectedBytes.length || expectedBytes.length === 0) return false;
  return timingSafeEqual(candidateBytes, expectedBytes);
}

function requestKey(email: string, request?: Request) {
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const address = forwarded || request?.headers.get("x-real-ip")?.trim() || "unknown";
  return `${email}:${address}`;
}

function pruneAttempts(now = Date.now()) {
  for (const [key, state] of attempts) if (now - state.updatedAt > ENTRY_TTL_MS) attempts.delete(key);
}

export function clearClientReviewLoginAttempts() {
  attempts.clear();
}

export function reviewLoginAttemptAllowed(key: string, now = Date.now()) {
  pruneAttempts(now);
  const state = attempts.get(key);
  if (!state || state.lockedUntil <= now) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.ceil((state.lockedUntil - now) / 1000) };
}

export function recordReviewLoginFailure(key: string, now = Date.now()) {
  pruneAttempts(now);
  const previous = attempts.get(key);
  const failures = (previous?.failures ?? 0) + 1;
  const lockedUntil = failures >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MS : 0;
  attempts.set(key, { failures, lockedUntil, updatedAt: now });
  return { failures, lockedUntil };
}

function clearReviewLoginFailures(key: string) {
  attempts.delete(key);
}

const bodySchema = z.object({
  email: z.string().min(1).max(320),
  accessCode: z.string().min(1).max(256),
});

function reviewSignInEndpoint({
  path,
  unavailableMessage,
  enabled,
  configured,
  expectedEmail,
  expectedCode,
  keyPrefix,
}: {
  path: string;
  unavailableMessage: string;
  enabled: (env?: NodeJS.Dict<string>) => boolean;
  configured: (env?: NodeJS.Dict<string>) => boolean;
  expectedEmail: (env?: NodeJS.Dict<string>) => string;
  expectedCode: (env?: NodeJS.Dict<string>) => string;
  keyPrefix: string;
}) {
  return createAuthEndpoint(path, {
    method: "POST",
    body: bodySchema,
    metadata: { noStore: true },
  }, async (ctx) => {
    if (!enabled()) throw APIError.fromStatus("NOT_FOUND");
    if (!configured()) throw APIError.fromStatus("SERVICE_UNAVAILABLE", { message: unavailableMessage });

    const email = normalizedEmail(ctx.body.email);
    const key = requestKey(`${keyPrefix}:${email}`, ctx.request);
    const availability = reviewLoginAttemptAllowed(key);
    if (!availability.allowed) throw APIError.fromStatus("TOO_MANY_REQUESTS", { message: "Too many unsuccessful attempts. Try again later." });

    const emailMatches = email === expectedEmail();
    const codeMatches = accessCodeMatches(ctx.body.accessCode, expectedCode());
    if (!emailMatches || !codeMatches) {
      recordReviewLoginFailure(key);
      throw APIError.fromStatus("UNAUTHORIZED", { message: "The email or access code is not recognised." });
    }

    const found = await ctx.context.internalAdapter.findUserByEmail(email);
    const user = found?.user;
    if (!user || !user.emailVerified) throw APIError.fromStatus("UNAUTHORIZED", { message: "The email or access code is not recognised." });
    const session = await ctx.context.internalAdapter.createSession(user.id);
    if (!session) throw APIError.fromStatus("INTERNAL_SERVER_ERROR", { message: "The review session could not be created." });
    clearReviewLoginFailures(key);
    await setSessionCookie(ctx, { session, user });
    return ctx.json({ status: true });
  });
}

/**
 * Temporary CLIENT_REVIEW-only entry point. Successful sign-in still uses
 * Better Auth's internal adapter and cookie writer, exactly like other sign-in
 * methods. This endpoint must never be enabled for a hosted or production
 * profile.
 */
export function clientReviewAuthPlugin(): BetterAuthPlugin {
  return {
    id: "sukoon-client-review-access-code",
    version: "1.0.0",
    endpoints: {
      clientReviewSignIn: reviewSignInEndpoint({
        path: "/client-review/sign-in",
        unavailableMessage: "Client review sign-in is not configured.",
        enabled: isClientReviewAuthEnvironment,
        configured: clientReviewAuthConfigured,
        expectedEmail: configuredEmail,
        expectedCode: configuredCode,
        keyPrefix: "client-review",
      }),
    },
  };
}

/** Hosted synthetic review sign-in; this endpoint can never activate for PRODUCTION. */
export function stagingReviewAuthPlugin(): BetterAuthPlugin {
  return {
    id: "sukoon-staging-review-access-code",
    version: "1.0.0",
    endpoints: {
      stagingReviewSignIn: reviewSignInEndpoint({
        path: "/staging-review/sign-in",
        unavailableMessage: "Staging review sign-in is not configured.",
        enabled: stagingReviewAuthEnvironment,
        configured: stagingReviewAuthConfigured,
        expectedEmail: configuredStagingEmail,
        expectedCode: configuredStagingCode,
        keyPrefix: "staging-review",
      }),
    },
  };
}

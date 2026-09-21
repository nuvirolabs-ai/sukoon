import { beforeEach, describe, expect, it } from "vitest";
import { accessCodeMatches, clearClientReviewLoginAttempts, clientReviewAuthConfigured, recordReviewLoginFailure, reviewLoginAttemptAllowed, stagingReviewAuthConfigured, stagingReviewAuthEnvironment } from "@/lib/client-review-auth";
import { sessionLifetimeSeconds } from "@/lib/session-policy";

const valid = {
  APP_ENV: "local",
  NODE_ENV: "development",
  SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW",
  SUKOON_CLIENT_REVIEW_EMAIL: "akshay-review@sukoon.local",
  SUKOON_CLIENT_REVIEW_ACCESS_CODE: "a".repeat(48),
};

describe("CLIENT_REVIEW access-code boundary", () => {
  beforeEach(() => clearClientReviewLoginAttempts());

  it("requires the exact client-review profile and a strong configured code", () => {
    expect(clientReviewAuthConfigured(valid)).toBe(true);
    expect(clientReviewAuthConfigured({ ...valid, SUKOON_RUNTIME_PROFILE: "LOCAL_WEB" })).toBe(false);
    expect(clientReviewAuthConfigured({ ...valid, SUKOON_CLIENT_REVIEW_ACCESS_CODE: "short" })).toBe(false);
    expect(clientReviewAuthConfigured({ ...valid, SUKOON_CLIENT_REVIEW_EMAIL: "demo-owner@sukoon.local" })).toBe(true);
  });

  it("compares codes without accepting empty, truncated, or unequal values", () => {
    expect(accessCodeMatches(valid.SUKOON_CLIENT_REVIEW_ACCESS_CODE, valid.SUKOON_CLIENT_REVIEW_ACCESS_CODE)).toBe(true);
    expect(accessCodeMatches("", valid.SUKOON_CLIENT_REVIEW_ACCESS_CODE)).toBe(false);
    expect(accessCodeMatches(`${valid.SUKOON_CLIENT_REVIEW_ACCESS_CODE}x`, valid.SUKOON_CLIENT_REVIEW_ACCESS_CODE)).toBe(false);
    expect(accessCodeMatches("b".repeat(48), valid.SUKOON_CLIENT_REVIEW_ACCESS_CODE)).toBe(false);
  });

  it("locks an email and address after five failures, without leaking the code", () => {
    const key = "akshay-review@sukoon.local:198.51.100.10";
    for (let i = 0; i < 4; i++) recordReviewLoginFailure(key, 1_000 + i);
    expect(reviewLoginAttemptAllowed(key, 2_000).allowed).toBe(true);
    recordReviewLoginFailure(key, 2_001);
    const locked = reviewLoginAttemptAllowed(key, 2_002);
    expect(locked.allowed).toBe(false);
    expect(locked.retryAfterSeconds).toBeGreaterThan(0);
    expect(recordReviewLoginFailure(key, 2_003)).not.toHaveProperty("code");
  });
});

describe("CLIENT_REVIEW session lifetime", () => {
  it("uses 30 days only for the local client-review profile", () => {
    expect(sessionLifetimeSeconds(valid)).toBe(30 * 24 * 60 * 60);
    expect(sessionLifetimeSeconds({ APP_ENV: "local", NODE_ENV: "development" })).toBe(604800);
    expect(sessionLifetimeSeconds({ APP_ENV: "staging", NODE_ENV: "production", SUKOON_RUNTIME_PROFILE: "STAGING" })).toBe(604800);
  });
});

describe("STAGING review access-code boundary", () => {
  const staging = {
    APP_ENV: "staging",
    NODE_ENV: "production",
    SUKOON_RUNTIME_PROFILE: "STAGING",
    SUKOON_STAGING_REVIEW_LOGIN: "true",
    SUKOON_STAGING_REVIEW_EMAIL: "akshay-review@sukoon.local",
    SUKOON_STAGING_REVIEW_ACCESS_CODE: "b".repeat(48),
  };

  beforeEach(() => clearClientReviewLoginAttempts());

  it("enables only the exact production STAGING profile and flag", () => {
    expect(stagingReviewAuthEnvironment(staging)).toBe(true);
    expect(stagingReviewAuthConfigured(staging)).toBe(true);
    expect(stagingReviewAuthEnvironment({ ...staging, SUKOON_STAGING_REVIEW_LOGIN: "false" })).toBe(false);
    expect(stagingReviewAuthEnvironment({ ...staging, APP_ENV: "local" })).toBe(false);
    expect(stagingReviewAuthEnvironment({ ...staging, NODE_ENV: "development" })).toBe(false);
    expect(stagingReviewAuthEnvironment({ ...staging, SUKOON_RUNTIME_PROFILE: "PRODUCTION" })).toBe(false);
    expect(stagingReviewAuthConfigured({ ...staging, SUKOON_STAGING_REVIEW_ACCESS_CODE: "short" })).toBe(false);
    expect(stagingReviewAuthConfigured({ ...staging, SUKOON_STAGING_REVIEW_EMAIL: "demo-owner@sukoon.local" })).toBe(true);
  });

  it("rejects staging variables in production even when the flag and code are present", () => {
    const production = { ...staging, APP_ENV: "production", SUKOON_RUNTIME_PROFILE: "PRODUCTION" };
    expect(stagingReviewAuthEnvironment(production)).toBe(false);
    expect(stagingReviewAuthConfigured(production)).toBe(false);
  });

  it("uses the same timing-safe validation boundary and lockout policy", () => {
    expect(accessCodeMatches(staging.SUKOON_STAGING_REVIEW_ACCESS_CODE, staging.SUKOON_STAGING_REVIEW_ACCESS_CODE)).toBe(true);
    expect(accessCodeMatches("a".repeat(48), staging.SUKOON_STAGING_REVIEW_ACCESS_CODE)).toBe(false);
    const key = "akshay-review@sukoon.local:203.0.113.7";
    for (let i = 0; i < 5; i++) recordReviewLoginFailure(key, 10_000 + i);
    expect(reviewLoginAttemptAllowed(key, 10_006).allowed).toBe(false);
  });
});

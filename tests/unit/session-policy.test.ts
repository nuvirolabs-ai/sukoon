import { describe, expect, it } from "vitest";
import { sessionLifetimeSeconds } from "@/lib/session-policy";
import { hasTrustedOrigin } from "@/lib/request-origin";
describe("isolated acceptance session lifetime", () => {
  it("preserves normal duration and rejects overrides on ordinary or hosted environments", () => {
    expect(sessionLifetimeSeconds({})).toBe(604800);
    const env = { APP_ENV: "local", NODE_ENV: "development" as const, SUKOON_ACCEPTANCE_SESSION_SECONDS: "30", DATABASE_URL: "postgresql://localhost/sukoon_s02_local_acceptance_test", BETTER_AUTH_URL: "http://127.0.0.1:3102" };
    expect(sessionLifetimeSeconds(env)).toBe(30);
    for (const change of [{ DATABASE_URL: "postgresql://localhost/sukoon_s02_local_20260911" }, { NODE_ENV: "production" as const }, { BETTER_AUTH_URL: "http://127.0.0.1:3100" }, { SUKOON_ACCEPTANCE_SESSION_SECONDS: "1" }]) expect(() => sessionLifetimeSeconds({ ...env, ...change })).toThrow("ACCEPTANCE_SESSION_SCOPE_INVALID");
  });
  it("rejects absent and unrelated origins", () => {
    expect(hasTrustedOrigin(new Request("http://localhost:3100/api/operations/content"))).toBe(false);
    expect(hasTrustedOrigin(new Request("http://localhost:3100/api/operations/content", { headers: { origin: "https://attacker.invalid" } }))).toBe(false);
  });
});

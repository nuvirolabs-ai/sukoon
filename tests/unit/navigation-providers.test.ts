import { describe, expect, it } from "vitest";
import { HOME_CATEGORIES, PRIMARY_NAVIGATION, PROPERTY_TABS, propertyTab } from "@/lib/navigation";
import { assertProviderConfiguration, providerConfiguration, redactedProviderHealth } from "@/lib/providers";
import { retryDelayMs, sanitizeWorkerError } from "@/lib/worker";

describe("S05/S06 reusable navigation and provider boundaries", () => {
  it("resolves Construction Bills and Vault deep links and rejects unknown tabs", () => {
    for (const tab of PROPERTY_TABS) expect(propertyTab(tab)).toBe(tab);
    expect(propertyTab(null)).toBe("overview");
    expect(propertyTab("javascript:alert(1)")).toBe("overview");
    expect(HOME_CATEGORIES.find((category) => category.key === "construction")?.scope).not.toMatch(/deferred/i);
  });
  it("keeps the four approved home categories on real routes", () => {
    expect(HOME_CATEGORIES.map((category) => category.label)).toEqual(["Vault", "Construction", "Buy / Sell", "Updates"]);
    expect(new Set(HOME_CATEGORIES.map((category) => category.href)).size).toBe(4);
    expect(PRIMARY_NAVIGATION.map((item) => item.href)).toEqual(["/", "/properties", "/property/new", "/search", "/more"]);
  });

  it("rejects local, sandbox, and unconfigured adapters in production", () => {
    const production = providerConfiguration({ APP_ENV: "production", NODE_ENV: "production", SUKOON_STORAGE_PROVIDER: "local", SUKOON_SCANNER_PROVIDER: "local", SUKOON_EMAIL_PROVIDER: "sandbox", SUKOON_PUSH_PROVIDER: "unconfigured", SUKOON_PARSER_PROVIDER: "unconfigured", SUKOON_AI_PROVIDER: "unconfigured", SUKOON_CONNECTOR_PROVIDER: "unconfigured" });
    expect(production.errors.length).toBeGreaterThan(0);
    expect(() => assertProviderConfiguration({ APP_ENV: "production", NODE_ENV: "production", SUKOON_STORAGE_PROVIDER: "local" })).toThrow(/requires a remote provider/);
    expect(providerConfiguration({ APP_ENV: "test", NODE_ENV: "test", SUKOON_AUTH_MAILBOX: "memory" }).errors).toEqual([]);
  });

  it("reports missing local capabilities as degraded without provider values", () => {
    const health = redactedProviderHealth({ APP_ENV: "test", NODE_ENV: "test" });
    expect(health.status).toBe("degraded");
    expect(health.providers.malwareScan).toEqual({ environment: "unconfigured", status: "unavailable" });
    expect(JSON.stringify(health)).not.toContain("BETTER_AUTH_SECRET");
  });

  it("keeps worker errors bounded and sanitized", () => {
    const error = Object.assign(new Error("x".repeat(500)), { code: "PRIVATE_INTERNAL_CODE" });
    const sanitized = sanitizeWorkerError(error);
    expect(sanitized.message).toHaveLength(240);
    expect(sanitized.code).toBe("PRIVATE_INTERNAL_CODE");
    expect(sanitized).not.toHaveProperty("stack");
    expect(retryDelayMs(1)).toBe(100);
    expect(retryDelayMs(20)).toBe(60_000);
  });
});

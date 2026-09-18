import { describe, expect, it } from "vitest";
import { assertWorkerEnvironment, checkWorkerReadiness } from "@/lib/worker-readiness";

const valid = {
  APP_ENV: "staging",
  NODE_ENV: "production",
  SUKOON_RUNTIME_PROFILE: "STAGING",
  DATABASE_URL: "postgresql://render-host-test:5432/sukoon_demo_staging",
  BETTER_AUTH_URL: "https://demo.sukoon.nuvirolabs.com",
  SUKOON_STORAGE_PROVIDER: "remote",
  SUKOON_STORAGE_ENDPOINT: "http://sukoon-storage:8333",
  SUKOON_STORAGE_BUCKET: "sukoon-demo-staging",
  SUKOON_STORAGE_ACCESS_KEY: "generated-test-access",
  SUKOON_STORAGE_SECRET_KEY: "generated-test-secret",
  SUKOON_SCANNER_PROVIDER: "remote",
  SUKOON_CLAMAV_ENDPOINT: "sukoon-clamav:3310",
  SUKOON_EMAIL_PROVIDER: "remote",
  SUKOON_SMTP_HOST: "smtp.example.test",
  SUKOON_SMTP_PORT: "587",
  SUKOON_SMTP_TLS_MODE: "starttls",
  SUKOON_SMTP_USERNAME: "user",
  SUKOON_SMTP_PASSWORD: "test-password",
  SUKOON_EMAIL_FROM: "Sukoon Demo <demo@example.test>",
} as const;

describe("staging worker readiness", () => {
  it("rejects local/test profiles, local data roots and non-staging databases", () => {
    expect(() => assertWorkerEnvironment({ APP_ENV: "local", NODE_ENV: "development", DATABASE_URL: "postgresql://localhost/sukoon_s02_local_review" })).toThrow("WORKER_STAGING_ONLY");
    expect(() => assertWorkerEnvironment({ ...valid, SUKOON_DATA_DIR: ".data" })).toThrow("WORKER_LOCAL_DATA_FORBIDDEN");
    expect(() => assertWorkerEnvironment({ ...valid, DATABASE_URL: "postgresql://render-host:5432/other_database" })).toThrow("WORKER_DATABASE_SCOPE_INVALID");
  });

  it("fails closed before claiming jobs when provider or migration checks fail", async () => {
    await expect(checkWorkerReadiness({ ...valid, SUKOON_SMTP_PASSWORD: "" }, { migrationsReady: async () => true })).rejects.toThrow("WORKER_PROVIDER_CONFIGURATION_INVALID");
    await expect(checkWorkerReadiness(valid, { migrationsReady: async () => false })).rejects.toThrow("WORKER_MIGRATIONS_NOT_READY");
    await expect(checkWorkerReadiness(valid, { migrationsReady: async () => { throw new Error("database offline"); } })).rejects.toThrow("WORKER_MIGRATIONS_UNAVAILABLE");
  });

  it("allows consumption only after the current schema and providers are confirmed", async () => {
    await expect(checkWorkerReadiness(valid, { migrationsReady: async () => true })).resolves.toEqual({ ready: true, environment: "staging" });
  });
});

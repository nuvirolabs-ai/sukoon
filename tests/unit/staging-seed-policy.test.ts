import { describe, expect, it } from "vitest";
import { assertStagingSeedEnvironment, STAGING_SEED_CONFIRMATION } from "@/lib/staging-seed-policy";

const valid = {
  APP_ENV: "staging",
  NODE_ENV: "production",
  SUKOON_RUNTIME_PROFILE: "STAGING",
  SUKOON_STAGING_SEED_CONFIRMATION: STAGING_SEED_CONFIRMATION,
  DATABASE_URL: "postgresql://render-host-test:5432/sukoon_demo_staging",
  BETTER_AUTH_URL: "https://demo.sukoon.nuvirolabs.com",
  SUKOON_STORAGE_PROVIDER: "remote",
  SUKOON_STORAGE_ENDPOINT: "sukoon-storage:8333",
  SUKOON_STORAGE_BUCKET: "sukoon-demo-staging",
  SUKOON_STORAGE_ACCESS_KEY: "generated-test-access",
  SUKOON_STORAGE_SECRET_KEY: "generated-test-secret",
  SUKOON_SCANNER_PROVIDER: "remote",
  SUKOON_CLAMAV_ENDPOINT: "sukoon-clamav:3310",
  SUKOON_EMAIL_PROVIDER: "remote",
  SUKOON_SMTP_HOST: "smtp.example.test",
  SUKOON_SMTP_PORT: "587",
  SUKOON_SMTP_TLS_MODE: "starttls",
  SUKOON_SMTP_USERNAME: "staging-test-user",
  SUKOON_SMTP_PASSWORD: "staging-test-password",
  SUKOON_EMAIL_FROM: "Sukoon Demo <demo@example.test>",
} as const;

describe("staging seed guard", () => {
  it("requires an explicit synthetic confirmation and exact database scope", () => {
    expect(() => assertStagingSeedEnvironment({ ...valid, SUKOON_STAGING_SEED_CONFIRMATION: "" })).toThrow("STAGING_SEED_CONFIRMATION_REQUIRED");
    expect(() => assertStagingSeedEnvironment({ ...valid, DATABASE_URL: "postgresql://render-host:5432/other" })).toThrow("STAGING_SEED_DATABASE_SCOPE_INVALID");
    expect(() => assertStagingSeedEnvironment(valid, "other")).toThrow("STAGING_SEED_DATABASE_SCOPE_INVALID");
  });

  it("rejects local data, local providers and public private-service targets", () => {
    expect(() => assertStagingSeedEnvironment({ ...valid, SUKOON_DATA_DIR: ".data" })).toThrow("STAGING_SEED_LOCAL_DATA_FORBIDDEN");
    expect(() => assertStagingSeedEnvironment({ ...valid, SUKOON_STORAGE_PROVIDER: "local" })).toThrow("STAGING_SEED_STORAGE_SCOPE_INVALID");
    expect(() => assertStagingSeedEnvironment({ ...valid, SUKOON_STORAGE_ENDPOINT: "https://storage.example.com" })).toThrow("STAGING_SEED_STORAGE_ENDPOINT_INVALID");
    expect(() => assertStagingSeedEnvironment({ ...valid, SUKOON_CLAMAV_ENDPOINT: "clamav.example.com:3310" })).toThrow("STAGING_SEED_SCANNER_ENDPOINT_INVALID");
    expect(() => assertStagingSeedEnvironment({ ...valid, SUKOON_EMAIL_PROVIDER: "sandbox" })).toThrow("STAGING_SEED_EMAIL_SCOPE_INVALID");
  });

  it("accepts only a fully configured staging environment", () => {
    expect(() => assertStagingSeedEnvironment(valid, "sukoon_demo_staging")).not.toThrow();
  });
});

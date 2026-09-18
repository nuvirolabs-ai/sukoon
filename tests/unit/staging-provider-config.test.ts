import { describe, expect, it } from "vitest";
import { assertProviderConfiguration, providerConfiguration } from "@/lib/providers";
import { trustedOriginList } from "@/lib/trusted-origins";
import { documentProcessingDependenciesForEnvironment } from "@/lib/document-processing";
import { S3ObjectStorageAdapter } from "@/lib/s3-object-storage";
import { ClamdScanner } from "@/lib/clamd-scanner";
import { stagingReminderWorkerDependencies } from "@/lib/durable-reminders";

const stagingEnv = {
  APP_ENV: "staging",
  NODE_ENV: "production",
  SUKOON_RUNTIME_PROFILE: "STAGING",
  DATABASE_URL: "postgresql://render-host-test:5432/sukoon_demo_staging",
  BETTER_AUTH_URL: "https://demo.sukoon.nuvirolabs.com",
  BETTER_AUTH_TRUSTED_ORIGINS: "https://demo.sukoon.nuvirolabs.com",
  SUKOON_TRUSTED_ORIGINS: "https://demo.sukoon.nuvirolabs.com",
  SUKOON_STORAGE_PROVIDER: "remote",
  SUKOON_STORAGE_ENDPOINT: "http://sukoon-storage:8333",
  SUKOON_STORAGE_BUCKET: "sukoon-demo-staging",
  SUKOON_STORAGE_ACCESS_KEY: "generated-test-access-key",
  SUKOON_STORAGE_SECRET_KEY: "generated-test-secret-key",
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

describe("staging provider contract", () => {
  it("accepts the required remote web providers while optional capabilities remain unavailable", () => {
    const configuration = providerConfiguration(stagingEnv);
    expect(configuration.staging).toBe(true);
    expect(configuration.production).toBe(false);
    expect(configuration.errors).toEqual([]);
    expect(configuration.bindings).toMatchObject({ objectStorage: "remote", malwareScan: "remote", email: "remote", ocr: "unconfigured", aiExtraction: "unconfigured" });
  });

  it("fails closed when staging is missing a required provider or staging identity", () => {
    const configuration = providerConfiguration({ ...stagingEnv, SUKOON_STORAGE_PROVIDER: "local", SUKOON_SMTP_PASSWORD: "", SUKOON_RUNTIME_PROFILE: "LOCAL_WEB" });
    expect(configuration.errors.join(" ")).toMatch(/staging.*objectStorage|objectStorage.*staging/i);
    expect(configuration.errors.join(" ")).toMatch(/SMTP_PASSWORD/);
    expect(configuration.errors.join(" ")).toMatch(/STAGING/);
    expect(() => assertProviderConfiguration({ ...stagingEnv, SUKOON_SCANNER_PROVIDER: "local" })).toThrow(/malwareScan.*staging/i);
  });

  it("rejects local or production databases and non-HTTPS origins for staging", () => {
    expect(providerConfiguration({ ...stagingEnv, DATABASE_URL: "postgresql://localhost:5432/sukoon_s02_local_review" }).errors.join(" ")).toMatch(/database/i);
    expect(providerConfiguration({ ...stagingEnv, BETTER_AUTH_URL: "http://demo.sukoon.nuvirolabs.com" }).errors.join(" ")).toMatch(/HTTPS|origin/i);
    expect(trustedOriginList({ ...stagingEnv, SUKOON_ANDROID_SERVER_URL: "http://127.0.0.1:3100" })).toEqual(["https://demo.sukoon.nuvirolabs.com"]);
  });

  it("keeps the local/test mailbox and local adapters valid", () => {
    expect(providerConfiguration({ APP_ENV: "local", NODE_ENV: "development", SUKOON_AUTH_MAILBOX: "memory" }).errors).toEqual([]);
    expect(providerConfiguration({ APP_ENV: "test", NODE_ENV: "test", SUKOON_AUTH_MAILBOX: "memory" }).errors).toEqual([]);
  });

  it("selects only remote storage and private ClamAV for staging", () => {
    const dependencies = documentProcessingDependenciesForEnvironment(stagingEnv);
    expect(dependencies.storage).toBeInstanceOf(S3ObjectStorageAdapter);
    expect(dependencies.scanner).toBeInstanceOf(ClamdScanner);
    expect(dependencies.scanner.environment).toBe("remote");
  });

  it("selects owner-supplied SMTP for staging reminders without enabling push", () => {
    const dependencies = stagingReminderWorkerDependencies(stagingEnv);
    expect(dependencies.email.environment).toBe("remote");
    expect(dependencies.email.id).toBe("staging-smtp");
    expect(dependencies.push.environment).toBe("unconfigured");
  });
});

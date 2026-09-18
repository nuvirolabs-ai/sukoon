import { describe, expect, it } from "vitest";
import { auditStagingPaths, auditStagingText, isStagingPathAllowed } from "@/lib/staging-repository-policy";

describe("staging repository publication policy", () => {
  it("allows source, migrations, reviewed docs and safe environment templates", () => {
    const paths = [
      "app/page.tsx",
      "lib/providers.ts",
      "prisma/migrations/20260917090000_staging_worker_heartbeat/migration.sql",
      "docs/STAGING_DEMO_RUNBOOK.md",
      ".env.example",
      ".env.android.local.example",
    ];
    expect(auditStagingPaths(paths)).toEqual([]);
    expect(paths.every((candidate) => isStagingPathAllowed(candidate).allowed)).toBe(true);
  });

  it("rejects local state, private documents, fixtures and generated acceptance output", () => {
    const violations = auditStagingPaths([
      ".env",
      ".data/local.sqlite",
      "output/ui-visual-audit/home-390.png",
      "artifacts/sukoon-audit/synthetic-registry.pdf",
      "tmp/eicar-isolated/eicar.com",
      "android/app/build/outputs/apk/debug/app-debug.apk",
      "private/customer-document.pdf",
      "secrets/service.pem",
    ]);
    expect(violations.map((item) => item.path)).toEqual([
      ".env",
      ".data/local.sqlite",
      "output/ui-visual-audit/home-390.png",
      "artifacts/sukoon-audit/synthetic-registry.pdf",
      "tmp/eicar-isolated/eicar.com",
      "android/app/build/outputs/apk/debug/app-debug.apk",
      "private/customer-document.pdf",
      "secrets/service.pem",
    ]);
    expect(violations.every((item) => item.reason.length > 0)).toBe(true);
  });

  it("flags secret-like assignments without exposing their values", () => {
    const secretAssignment = ["const SMTP", "_PASSWORD = \"secret-value\";"].join("");
    expect(auditStagingText("config/runtime.ts", secretAssignment)).toMatchObject({
      path: "config/runtime.ts",
      reason: "SECRET_LIKE_VALUE",
    });
    expect(auditStagingText(".env.example", "SMTP_PASSWORD=<owner-supplied-secret>")).toBeNull();
    const marker = ["X5O!P%", "@AP[4", "\\\\PZX54(P^)7CC)7}$", "EICAR-", "STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"].join("");
    expect(auditStagingText("tests/fixture.ts", `const fixture = \"${marker}\";`)).toMatchObject({
      path: "tests/fixture.ts",
      reason: "MALWARE_FIXTURE",
    });
  });

  it("does not include the offending content in the sanitized report", () => {
    const report = JSON.stringify(auditStagingText("config/runtime.ts", ["DATABASE", "_URL=postgres://user:password@host/db"].join("")));
    expect(report).not.toContain("password");
    expect(report).not.toContain("postgres://");
  });
});

import { describe, expect, it } from "vitest";
import {
  DEMO_ENRICHMENT_ANCHOR_DATE,
  DEMO_ENRICHMENT_NAMESPACE,
  assertDemoEnrichmentEnvironment,
  buildDemoEnrichmentPlan,
  stableDemoEnrichmentId,
  stableDemoEnrichmentKey,
} from "@/lib/demo-enrichment";

const asOf = new Date("2026-09-22T00:00:00.000Z");

const validEnvironment: Record<string, string> = {
  APP_ENV: "staging",
  NODE_ENV: "production",
  SUKOON_RUNTIME_PROFILE: "STAGING",
  SUKOON_DEMO_ENRICHMENT_CONFIRMATION: DEMO_ENRICHMENT_NAMESPACE,
};
validEnvironment[["DATABASE", "URL"].join("_")] = ["postgresql://render-host:5432", "sukoon_demo_staging"].join("/");

describe("SUKOON_DEMO_ENRICHMENT_V1 planning", () => {
  it("uses deterministic, namespaced IDs and retry keys", () => {
    expect(stableDemoEnrichmentId("bill", "electricity:2026-01")).toBe(stableDemoEnrichmentId("bill", "electricity:2026-01"));
    expect(stableDemoEnrichmentId("bill", "electricity:2026-01")).toMatch(/^sukoon-demo-enrichment-v1-bill-[a-f0-9]{24}$/);
    expect(stableDemoEnrichmentKey("payment", "electricity:2026-01")).toBe("SUKOON_DEMO_ENRICHMENT_V1:payment:electricity:2026-01");
  });

  it("requires the exact staging profile, database, and confirmation", () => {
    expect(() => assertDemoEnrichmentEnvironment(validEnvironment, "sukoon_demo_staging")).not.toThrow();
    expect(() => assertDemoEnrichmentEnvironment({ ...validEnvironment, APP_ENV: "local" }, "sukoon_demo_staging")).toThrow("DEMO_ENRICHMENT_STAGING_REQUIRED");
    expect(() => assertDemoEnrichmentEnvironment({ ...validEnvironment, APP_ENV: "production", SUKOON_RUNTIME_PROFILE: "PRODUCTION" }, "sukoon_demo_staging")).toThrow("DEMO_ENRICHMENT_STAGING_REQUIRED");
    expect(() => assertDemoEnrichmentEnvironment({ ...validEnvironment, SUKOON_DEMO_ENRICHMENT_CONFIRMATION: "" }, "sukoon_demo_staging")).toThrow("DEMO_ENRICHMENT_CONFIRMATION_REQUIRED");
    expect(() => assertDemoEnrichmentEnvironment({ ...validEnvironment, SUKOON_DATA_DIR: ".data" }, "sukoon_demo_staging")).toThrow("DEMO_ENRICHMENT_LOCAL_DATA_FORBIDDEN");
    expect(() => assertDemoEnrichmentEnvironment(validEnvironment, "other_database")).toThrow("DEMO_ENRICHMENT_DATABASE_SCOPE_INVALID");
  });

  it("plans a bounded lived-in window with mixed states and future work", () => {
    const plan = buildDemoEnrichmentPlan(asOf);
    expect(plan.namespace).toBe(DEMO_ENRICHMENT_NAMESPACE);
    expect(plan.dateRange.start).toBe("2025-11-26");
    expect(plan.dateRange.end).toBe("2026-11-21");
    expect(plan.timeline.length).toBeGreaterThanOrEqual(30);
    expect(plan.timeline.length).toBeLessThanOrEqual(60);
    expect(plan.legacyBills.length).toBeGreaterThanOrEqual(12);
    expect(plan.obligations.length).toBeGreaterThanOrEqual(12);
    expect(plan.maintenance.length).toBeGreaterThanOrEqual(6);
    expect(plan.constructionEvents.length).toBeGreaterThanOrEqual(8);
    expect(plan.purchaseEntries.length).toBeGreaterThanOrEqual(6);
    expect(plan.documents).toHaveLength(0);
    expect(plan.obligations.some((item) => item.status === "paid")).toBe(true);
    expect(plan.obligations.some((item) => item.status === "partial")).toBe(true);
    expect(plan.obligations.some((item) => item.status === "upcoming")).toBe(true);
    expect(plan.maintenance.some((item) => item.status === "CANCELLED")).toBe(true);
    expect(plan.maintenance.some((item) => item.status === "IN_PROGRESS")).toBe(true);
    expect(plan.reminders.some((item) => item.dueDate > "2026-09-22")).toBe(true);
    expect(buildDemoEnrichmentPlan().asOf).toBe(DEMO_ENRICHMENT_ANCHOR_DATE);
  });
});

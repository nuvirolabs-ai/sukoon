import { describe, expect, it } from "vitest";
import { CONSTRUCTION_POPULATE_NAMESPACE, CONSTRUCTION_POPULATE_RECORDED_PAISE, assertConstructionPopulateEnvironment, shiftScenarioDate } from "@/lib/construction-populate";
import { assertTransactionSeedEnvironment } from "@/lib/transaction-seed";
import { netPricePaidPaise } from "@/lib/transactions";
import { purchaseComparison } from "@/lib/purchase-presentation";

const staging = {
  APP_ENV: "staging",
  NODE_ENV: "production",
  SUKOON_RUNTIME_PROFILE: "STAGING",
  DATABASE_URL: "postgresql://localhost/sukoon_demo_staging",
};

describe("V1 scenario guards", () => {
  it("shifts dates from a persisted anchor without using the clock", () => {
    expect(shiftScenarioDate("2026-09-23", -1)).toBe("2026-09-22");
    expect(shiftScenarioDate("2026-09-23", 2)).toBe("2026-09-25");
    expect(() => shiftScenarioDate("23-09-2026", 1)).toThrow(/ANCHOR_INVALID/);
  });

  it("keeps the construction recorded-spend target at the twelve cost lines", () => {
    expect(CONSTRUCTION_POPULATE_RECORDED_PAISE).toBe(269000000n);
  });

  it("refuses construction population outside the confirmed staging database", () => {
    expect(() => assertConstructionPopulateEnvironment({ ...staging, APP_ENV: "local", SUKOON_CONSTRUCTION_POPULATE_CONFIRMATION: CONSTRUCTION_POPULATE_NAMESPACE })).toThrow(/STAGING_REQUIRED/);
    expect(() => assertConstructionPopulateEnvironment({ ...staging, SUKOON_CONSTRUCTION_POPULATE_CONFIRMATION: "no" })).toThrow(/CONFIRMATION_REQUIRED/);
    expect(() => assertConstructionPopulateEnvironment({ ...staging, SUKOON_CONSTRUCTION_POPULATE_CONFIRMATION: CONSTRUCTION_POPULATE_NAMESPACE, SUKOON_DATA_DIR: ".data" })).toThrow(/LOCAL_DATA_FORBIDDEN/);
    expect(() => assertConstructionPopulateEnvironment({ ...staging, SUKOON_CONSTRUCTION_POPULATE_CONFIRMATION: CONSTRUCTION_POPULATE_NAMESPACE }, "sukoon_s02_local_20260911")).toThrow(/DATABASE_SCOPE_INVALID/);
    expect(() => assertConstructionPopulateEnvironment({ ...staging, SUKOON_CONSTRUCTION_POPULATE_CONFIRMATION: CONSTRUCTION_POPULATE_NAMESPACE }, "sukoon_s02_test_20260911", { testOnly: true })).not.toThrow();
  });

  it("refuses transaction seeding without the transaction confirmation", () => {
    expect(() => assertTransactionSeedEnvironment({ ...staging, SUKOON_TRANSACTION_DEMO_CONFIRMATION: "SUKOON_TRANSACTION_DEMO_V1" }, "sukoon_demo_staging")).not.toThrow();
    expect(() => assertTransactionSeedEnvironment({ ...staging }, "sukoon_demo_staging")).toThrow(/CONFIRMATION_REQUIRED/);
  });

  it("nets posted price payments and leaves plan lines out of the total", () => {
    expect(netPricePaidPaise([
      { kind: "POSTED", allocation: "PRICE", amountPaise: 20000000n },
      { kind: "POSTED", allocation: "PRICE", amountPaise: 10000000n },
      { kind: "POSTED", allocation: "ADDITIONAL", amountPaise: 500n },
      { kind: "REFUND", allocation: "PRICE", amountPaise: 100n },
      { kind: "REVERSAL", allocation: "PRICE", amountPaise: 50n },
    ])).toBe(29999850n);
  });

  it("shows unknown comparison values instead of a score", () => {
    const [row] = purchaseComparison([{
      id: "c", name: "Riverfront Residency — Unit 1204", propertyType: null, location: "", areaValue: null, areaUnit: null,
      askingPricePaise: null, budgetPaise: "1720000000", source: null, notes: null, stage: "REVIEWING", version: 0, entries: [],
    }]);
    expect(row).toMatchObject({ asking: "Unknown", area: "Unknown", location: "Unknown", situation: "Reviewing" });
    expect(JSON.stringify(row)).not.toMatch(/score/i);
  });
});

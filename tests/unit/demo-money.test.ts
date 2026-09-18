import { describe, expect, it } from "vitest";
import { DEMO_MONEY_EXPECTATIONS, DEMO_RUPEE_INPUTS, demoPaise, demoRemainingPaise } from "@/lib/demo-money";

describe("synthetic demo money boundaries", () => {
  it("converts seeded rupee values to paise exactly once", () => {
    expect(demoPaise(DEMO_MONEY_EXPECTATIONS.electricityTotal)).toBe(485000n);
    expect(demoPaise(DEMO_MONEY_EXPECTATIONS.propertyTaxTotal)).toBe(1845000n);
    expect(demoPaise(DEMO_MONEY_EXPECTATIONS.propertyTaxPayment)).toBe(1000000n);
    expect(demoPaise(DEMO_MONEY_EXPECTATIONS.waterTotal)).toBe(73000n);
    expect(demoPaise(DEMO_MONEY_EXPECTATIONS.constructionPlannedBudget)).toBe(1200000000n);
    expect(demoPaise(DEMO_MONEY_EXPECTATIONS.constructionRecordedSpend)).toBe(269000000n);
  });

  it("keeps the displayed property-tax remainder in integer paise", () => {
    expect(demoRemainingPaise("18450", "10000")).toBe(845000n);
  });

  it("converts every seed-side rupee literal by one factor of 100", () => {
    for (const rupees of DEMO_RUPEE_INPUTS) expect(demoPaise(rupees)).toBe(BigInt(rupees) * 100n);
  });
});

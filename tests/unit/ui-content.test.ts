import { describe, expect, it } from "vitest";
import { displayLabel, documentStatusLabel, formatMoneyCompact, formatMoneyExact, layoutStressFixtures, presentDate, presentName } from "@/lib/ui-content";

describe("consumer money and status presentation", () => {
  it("formats compact Indian summary values", () => {
    expect(formatMoneyCompact(4850)).toBe("₹4,850");
    expect(formatMoneyCompact(2690000)).toBe("₹26.90L");
    expect(formatMoneyCompact(12000000)).toBe("₹1.20Cr");
    expect(formatMoneyCompact(15200000)).toBe("₹1.52Cr");
  });
  it("keeps exact grouping for transaction values", () => {
    expect(formatMoneyExact(10000)).toBe("₹10,000");
    expect(formatMoneyExact(18450)).toBe("₹18,450");
  });
  it("maps raw enums for people", () => {
    expect(displayLabel("TERMINAL_FAILURE")).toBe("Couldn’t process");
    expect(displayLabel("AWAITING_REVIEW")).toBe("Needs review");
    expect(displayLabel("BILLS_READ")).toBe("Bills");
  });
  it("strips demo prefixes from visible names without changing stored values", () => {
    expect(presentName("Demo Registry — Vijay Nagar")).toBe("Registry — Vijay Nagar");
    expect(presentName("Vijay Nagar House")).toBe("Vijay Nagar House");
    expect(presentName("Synthetic demo dataset")).toBe("Added by you");
    expect(presentName("Synthetic Indore riverfront district")).toBe("Indore riverfront district");
  });
  it("survives stress-length labels", () => {
    const fixtures = layoutStressFixtures();
    expect(fixtures.property.length).toBeGreaterThan(40);
    expect(fixtures.amount).toBe("₹99.99Cr");
    expect(fixtures.task.length).toBeGreaterThan(40);
    expect(fixtures.property).toContain("Scheme No. 140");
    expect(fixtures.person).toContain("Venkateshwaran");
  });
  it("formats stored dates for people without changing the value", () => {
    expect(presentDate("2026-09-14", "long")).toBe("14 Sep 2026");
    expect(presentDate("2026-09-14")).toMatch(/14 Sep/);
    expect(presentDate("2026-09-14T10:42:00.000Z", "datetime")).not.toMatch(/T10:42/);
    expect(presentDate("2026-09-14T10:42:00.000Z", "datetime")).not.toMatch(/2026-09-14T/);
  });
  it("labels document status without exposing scan internals", () => {
    expect(documentStatusLabel({ scanStatus: "clean", reviewStatus: "confirmed" })).toBe("Reviewed");
    expect(documentStatusLabel({ scanStatus: "pending" })).toBe("Scanning");
  });
});

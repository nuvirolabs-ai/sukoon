import { describe, expect, it } from "vitest";
import { paiseToRupees, rupeesToPaise } from "@/lib/money";

describe("money boundary", () => {
  it("stores rupees as exact integer paise", () => {
    expect(rupeesToPaise("1250.50")).toBe(BigInt(125050));
    expect(rupeesToPaise(0)).toBe(BigInt(0));
    expect(paiseToRupees(BigInt(125050))).toBe(1250.5);
  });

  it("rejects invalid or over-precise input", () => {
    expect(() => rupeesToPaise("-1")).toThrow();
    expect(() => rupeesToPaise("1.234")).toThrow();
    expect(() => rupeesToPaise("not-money")).toThrow();
  });
});

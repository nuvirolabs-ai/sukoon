import { rupeesToPaise } from "@/lib/money";

/**
 * Money constants used by the local synthetic dataset.
 * Values are deliberately strings so the seed never passes a floating-point
 * rupee amount through an integer-paise field by accident.
 */
export const DEMO_MONEY_EXPECTATIONS = {
  electricityTotal: "4850",
  propertyTaxTotal: "18450",
  propertyTaxPayment: "10000",
  propertyTaxRemaining: "8450",
  waterTotal: "730",
  constructionPlannedBudget: "12000000",
  constructionRecordedSpend: "2690000",
} as const;

/** Every seed-side rupee literal that is intentionally converted to paise. */
export const DEMO_RUPEE_INPUTS = [
  "4850", "18450", "10000", "730", "2200", "25000", "38500", "5850",
  "1200000", "850000", "640000", "12000000", "2690000", "390", "398",
  "61000", "60500", "66", "68", "1764", "1800",
] as const;

export function demoRupees(value: string | number) {
  return String(value);
}

export function demoPaise(value: string | number) {
  return rupeesToPaise(String(value));
}

export function demoRemainingPaise(totalRupees: string | number, paidRupees: string | number) {
  return demoPaise(totalRupees) - demoPaise(paidRupees);
}

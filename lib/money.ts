/** Convert a user-entered rupee amount to exact paise without storing floats. */
export function rupeesToPaise(value: unknown): bigint {
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Money must be finite.");
  const text = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error("Money must be a non-negative amount with at most two decimals.");
  const [whole, fraction = ""] = text.split(".");
  const paise = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  if (paise > BigInt(Number.MAX_SAFE_INTEGER) * BigInt(100)) throw new Error("Money amount is too large.");
  return paise;
}

export function paiseToRupees(value: bigint | number | null | undefined) {
  if (value === null || value === undefined) return undefined;
  const paise = typeof value === "bigint" ? value : BigInt(value);
  const rupees = Number(paise) / 100;
  return Number.isSafeInteger(Number(paise)) ? rupees : Number(rupees.toFixed(2));
}

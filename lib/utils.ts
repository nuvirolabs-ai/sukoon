import { formatMoneyCompact } from "@/lib/ui-content";

export function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
export function inr(n: number) {
  return formatMoneyCompact(n);
}
export function cx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

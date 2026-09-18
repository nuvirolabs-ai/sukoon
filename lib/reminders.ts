import type { AppState, Reminder } from "./types";
import { healthFor } from "./health";

/** Build local derived reminders from bills + insurance + rent expiry + missing mutation. */
export function buildAutoReminders(s: AppState): Reminder[] {
  const out: Reminder[] = [];
  for (const b of s.bills) {
    if (b.status === "paid") continue;
    out.push({
      id: `auto-bill-${b.id}`,
      propertyId: b.propertyId,
      kind: b.type === "Property tax" || b.type === "Diversion tax" ? "tax" : "bill",
      title: `${b.title} — ₹${b.amount.toLocaleString("en-IN")}`,
      dueDate: b.dueDate,
    });
  }
  for (const p of s.properties) {
    if (p.insuranceUntil) {
      out.push({ id: `auto-ins-${p.id}`, propertyId: p.id, kind: "insurance", title: `Insurance renews ${p.insuranceUntil}`, dueDate: p.insuranceUntil });
    }
    const h = healthFor(p.id, s);
    if (h.docs.missing.includes("Naamantaran (mutation)")) {
      out.push({ id: `auto-mut-${p.id}`, propertyId: p.id, kind: "mutation", title: "Mutation record missing — review before any transfer", dueDate: new Date().toISOString().slice(0, 10) });
    }
  }
  for (const tn of s.tenants) {
    if (tn.status !== "active") continue;
    const daysLeft = Math.ceil((new Date(tn.endDate).getTime() - Date.now()) / 86400000);
    if (daysLeft <= 90) {
      out.push({ id: `auto-rent-${tn.id}`, propertyId: tn.propertyId, kind: "rent-expiry", title: `Rent agreement ends ${tn.endDate} (${tn.name})`, dueDate: tn.endDate });
    }
  }
  // merge with manual reminders, de-dupe by id
  const manual = s.reminders.filter((r) => !r.id.startsWith("auto-"));
  const seen = new Set<string>();
  const all = [...manual, ...out].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  return all.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function waShare(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

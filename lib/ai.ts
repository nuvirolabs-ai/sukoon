import { healthFor } from "./health";
import { inr } from "./utils";
import type { AppState } from "./types";

function healthLabel(propertyId: string, s: AppState) {
  const health = healthFor(propertyId, s);
  return health.assessment === "NOT_ASSESSED" ? "not assessed" : `${health.score}/100`;
}

export function answerQuery(q: string, propertyId: string | null, s: AppState): string {
  const query = q.toLowerCase();
  const props = propertyId ? s.properties.filter((p) => p.id === propertyId) : s.properties;
  if (!props.length) return "Add a property first — then I can summarize its current local passport, bills and vault records.";

  const scope = props.length === 1 ? props[0] : null;

  const pendingBills = s.bills.filter(
    (b) => (!propertyId || b.propertyId === propertyId) && (b.status === "pending" || b.status === "overdue")
  );
  const totalDue = pendingBills.reduce((a, b) => a + b.amount, 0);

  if (/bill|due|pending|obligation|tax|emi|pay/.test(query)) {
    if (!pendingBills.length) return scope ? `No pending bills for ${scope.name}. All clear.` : "No pending bills across your properties. All clear.";
    const lines = pendingBills.slice(0, 8).map((b) => {
      const p = s.properties.find((x) => x.id === b.propertyId)?.name ?? "";
      return `• ${b.title} (${b.type}) — ${inr(b.amount)} due ${b.dueDate} [${b.status}] ${p ? `— ${p}` : ""}`;
    });
    return `${scope ? `Pending for ${scope.name}` : `Pending across ${props.length} properties`} — total ${inr(totalDue)}:\n${lines.join("\n")}`;
  }

  if (/missing|gap|document|compliance|vault|paper|noc|mutation|registry/.test(query)) {
    if (!scope) {
      return props.map((p) => {
        const h = healthFor(p.id, s);
        return `• ${p.name}: ${h.docs.have} vault record${h.docs.have === 1 ? "" : "s"} — record readiness ${healthLabel(p.id, s)}`;
      }).join("\n");
    }
    const h = healthFor(scope.id, s);
    return `${scope.name}: ${h.docs.have} vault record${h.docs.have === 1 ? "" : "s"}. Record readiness is ${healthLabel(scope.id, s)} until a published checklist assessment is available.`;
  }

  if (/spend|invest|renovat|repair|maintenance|cost|capital/.test(query)) {
    const ms = s.maintenance.filter((m) => !propertyId || m.propertyId === propertyId);
    const total = ms.reduce((a, m) => a + (m.finalCost ?? m.quote ?? 0), 0);
    if (!ms.length) return "No maintenance spend logged yet. Add one from the property → Maintenance tab.";
    const since2021 = ms.filter((m) => m.dateReported >= "2021-01-01").reduce((a, m) => a + (m.finalCost ?? m.quote ?? 0), 0);
    return `Logged ${ms.length} job${ms.length > 1 ? "s" : ""}${scope ? ` for ${scope.name}` : ""} — total ${inr(total)} (since 2021: ${inr(since2021)}).`;
  }

  if (/bundle|export|due diligence|lawyer|ca|share/.test(query)) {
    if (!scope) return "Open a property → Share tab to generate a due-diligence bundle link with role scopes.";
    const h = healthFor(scope.id, s);
    return `For ${scope.name}:\n• Record readiness ${healthLabel(scope.id, s)}\n• Vault records ${h.docs.have}\n• Bills pending ${h.finance.pending}, overdue ${h.finance.overdue}\nSharing is identity-bound and capability-scoped; no public file link or unfiltered export is created.`;
  }

  if (/health|score/.test(query)) {
    return props.map((p) => `• ${p.name}: ${healthLabel(p.id, s)}`).join("\n");
  }

  if (/buy|checklist|guide|do/.test(query)) {
    return "Buyer education draft: review the title chain, mutation records, applicable society or authority records, approved versus actual construction, current official charges, physical measurements, and written transaction terms with a qualified local professional. Sukoon does not verify or approve a transaction.";
  }

  if (/construct|build|material|stage/.test(query)) {
    return "Construction tools, material rates, vendor directories, professional bookings and floor plans are deferred. Sukoon does not provide live construction advice or current market data.";
  }

  return scope
    ? `${scope.name}: record readiness ${healthLabel(scope.id, s)}, ${pendingBills.length} pending bills (${inr(totalDue)}). Ask me: "pending bills?", "missing docs?", or "spend since 2021?". Answers are based on current local records and are not professional advice.`
    : `You have ${props.length} properties, ${pendingBills.length} pending bills (${inr(totalDue)}). Open a property and ask about its vault, bills or health.`;
}

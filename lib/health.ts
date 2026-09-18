import type { AppState } from "./types";

export interface HealthBreakdown {
  assessment: "NOT_ASSESSED" | "RECORD_READINESS";
  score: number;
  docs: { have: number; need: number; missing: string[] };
  finance: { pending: number; overdue: number };
  risk: { insured: boolean; issues: string[] };
  maint: { lastDone?: string; open: number };
  actions: string[];
}

export function healthFor(propertyId: string, s: AppState): HealthBreakdown {
  const docs = s.docs.filter((d) => d.propertyId === propertyId);

  const bills = s.bills.filter((b) => b.propertyId === propertyId);
  const pending = bills.filter((b) => b.status === "pending").length;
  const overdue = bills.filter((b) => b.status === "overdue").length;

  const prop = s.properties.find((p) => p.id === propertyId);
  const insured = !!prop?.insuranceUntil && prop.insuranceUntil >= new Date().toISOString().slice(0, 10);
  const riskIssues: string[] = [];
  if (!insured) riskIssues.push("Home insurance missing/expired");
  if (prop?.loanActive && (prop.loanBalance ?? 0) > 0) riskIssues.push("Active loan — keep EC clean");

  const maint = s.maintenance.filter((m) => m.propertyId === propertyId);
  const open = maint.filter((m) => m.status !== "resolved").length;
  const lastDone = maint
    .filter((m) => m.status === "resolved")
    .sort((a, b) => (a.dateReported < b.dateReported ? 1 : -1))[0]?.dateReported;

  // A local AppState snapshot cannot know which published, versioned rules
  // apply. Never turn a universal-looking document list into a legal score;
  // the S13 API is the source of truth for rule-backed record readiness.
  const assessment = "NOT_ASSESSED" as const;
  const score = 0;

  const actions: string[] = [];
  if (overdue) actions.push(`Clear ${overdue} overdue bill${overdue > 1 ? "s" : ""}`);
  else if (pending) actions.push(`Pay ${pending} pending bill${pending > 1 ? "s" : ""}`);
  if (!insured) actions.push("Renew home insurance");
  if (open) actions.push(`Resolve ${open} open maintenance`);
  if (!lastDone) actions.push("Log first maintenance record");
  if (!actions.length) actions.push("Add a reviewed checklist to assess record readiness.");

  return {
    assessment,
    score,
    docs: { have: docs.length, need: docs.length, missing: [] },
    finance: { pending, overdue },
    risk: { insured, issues: riskIssues },
    maint: { lastDone, open },
    actions,
  };
}

import { displayLabel, formatMoneyCompact, presentName } from "@/lib/ui-content";

export type PurchaseCandidate = {
  id: string;
  name: string;
  propertyType: string | null;
  location: string | null;
  areaValue: string | null;
  areaUnit: string | null;
  askingPricePaise: string | null;
  budgetPaise: string | null;
  source: string | null;
  notes: string | null;
  stage: string;
  version: number;
  entries: Array<{ id: string; kind: string; body: string; createdAt: string }>;
};

export type PurchaseWorkspace = { id: string; name: string; candidates: PurchaseCandidate[] };

export type PurchaseRow = PurchaseCandidate & { workspaceId: string; workspaceName: string };

export function splitPurchaseName(name: string) {
  const parts = name.split(/\s+[—–-]\s+/);
  if (parts.length >= 2) return { title: parts[0]!, subtitle: parts.slice(1).join(" — ") };
  return { title: name, subtitle: "" };
}

export function lastActivityMs(candidate: PurchaseCandidate) {
  const stamps = candidate.entries.map((entry) => Date.parse(entry.createdAt)).filter((value) => Number.isFinite(value));
  return stamps.length ? Math.max(...stamps) : 0;
}

export function isPracticeWorkspace(name: string) {
  return /disposable|motion flat/i.test(name);
}

export function flattenPurchaseRows(workspaces: PurchaseWorkspace[]): PurchaseRow[] {
  return workspaces.flatMap((workspace) => workspace.candidates.map((candidate) => ({ ...candidate, workspaceId: workspace.id, workspaceName: workspace.name })));
}

export function sortRecentlyActive(rows: PurchaseRow[]) {
  return [...rows].sort((a, b) => lastActivityMs(b) - lastActivityMs(a) || a.name.localeCompare(b.name));
}

export function partitionPurchaseRows(workspaces: PurchaseWorkspace[]) {
  const rows = sortRecentlyActive(flattenPurchaseRows(workspaces));
  const practice = rows.filter((row) => isPracticeWorkspace(row.workspaceName) || isPracticeWorkspace(row.name));
  const rest = rows.filter((row) => !practice.includes(row));
  return {
    active: rest.filter((row) => row.stage !== "NOT_PROCEEDING"),
    archived: rest.filter((row) => row.stage === "NOT_PROCEEDING"),
    practice,
  };
}

export function purchaseMeta(candidate: PurchaseCandidate) {
  const type = presentName(candidate.propertyType || "Property");
  const location = presentName(candidate.location || "Location not entered");
  return `${type} · ${location}`;
}

export function askingCopy(candidate: PurchaseCandidate) {
  return candidate.askingPricePaise ? `${formatMoneyCompact(Number(candidate.askingPricePaise) / 100)} asking` : "Asking not entered";
}

export function stageCopy(stage: string) {
  return displayLabel(stage);
}

export function rupeesInput(value: string | null) {
  if (value === null) return "";
  return `${BigInt(value) / 100n}.${(BigInt(value) % 100n).toString().padStart(2, "0")}`;
}

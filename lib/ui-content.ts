/** Consumer presentation helpers. Do not change stored money, enums or authorization. */

const STATUS_LABELS: Record<string, string> = {
  villa: "Independent house",
  flat: "Apartment",
  plot: "Plot",
  agri: "Agricultural land",
  commercial: "Commercial",
  IN_PROGRESS: "In progress",
  in_progress: "In progress",
  NON_FINANCIAL: "Reminder only",
  USER_REPORTED: "Added by you",
  OWNER_REPORTED: "Added by you",
  USER_ENTERED: "Added by you",
  PROPERTY_BASIC_READ: "Property details",
  BILLS_READ: "Bills",
  MAINTENANCE_READ: "Maintenance",
  TIMELINE_READ: "Timeline",
  HEALTH_READ: "Record readiness",
  DOCUMENT_LIST: "Documents",
  DOCUMENT_METADATA_READ: "Document details",
  DOCUMENT_PREVIEW: "Preview",
  CONSTRUCTION_PROJECT_READ: "Construction",
  CONSTRUCTION_TASK_READ: "Construction tasks",
  CONSTRUCTION_DOCUMENT_READ: "Construction documents",
  CONSTRUCTION_DOCUMENT: "Construction document",
  CONSTRUCTION_UPDATE_READ: "Site updates",
  CONSTRUCTION_MATERIAL_READ: "Materials",
  CONSTRUCTION_CONTACT_READ: "People",
  CONSTRUCTION_BUDGET_READ: "Budget",
  CONSTRUCTION_COST_READ: "Spend",
  confirmed: "Reviewed",
  CONFIRMED: "Reviewed",
  scan_pending: "Scanning",
  SCAN_PENDING: "Scanning",
  unavailable: "Scan unavailable",
  awaiting_review: "Needs review",
  AWAITING_REVIEW: "Needs review",
  TERMINAL_FAILURE: "Couldn’t process",
  terminal_failure: "Couldn’t process",
  INFORMATION_GATHERING: "Due diligence",
  REVIEWING: "Reviewing",
  ON_HOLD: "On hold",
  NOT_PROCEEDING: "Not proceeding",
  OPEN: "Open",
  OVERDUE: "Overdue",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESOLVED: "Resolved",
  PLANNED: "Planned",
  ACTIVE: "Active",
  PLANNING: "Planning",
  APPROVALS: "Approvals",
  READY: "Ready",
  SKIPPED: "Skipped",
  TODO: "To do",
  BLOCKED: "Blocked",
  DONE: "Done",
  FAMILY: "Family",
  LAWYER: "Legal advisor",
  ARCHITECT: "Architect",
  CA: "Accountant",
  BUYER: "Buyer",
  BROKER: "Broker",
  RECEIVED: "Received",
  REQUESTED: "Requested",
  USER_REVIEWED: "Reviewed",
  DOCUMENT_REQUEST: "Document request",
  QUESTION: "Question",
  ANSWER: "Answered",
  RESOLVE: "Resolved",
  REOPEN: "Reopened",
  RECEIVE: "Received",
  REVIEW: "Reviewed",
  BUYER_UPLOADED: "Added by you",
  BUYER_REPORTED_SELLER: "From seller",
  USER_NOTE: "Note",
  PAYABLE: "Payable",
  RECEIVABLE: "Receivable",
  GENERATED: "From your schedule",
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
  paid: "Paid",
  pending: "Due",
  overdue: "Overdue",
  RECORDED: "Recorded",
  reversed: "Reversed",
  REVERSED: "Reversed",
  vault: "Documents",
  bills: "Bills",
  maint: "Maintenance",
  rent: "Rent",
  timeline: "Timeline",
  share: "Sharing",
  export: "Exports",
  plan: "Plan",
  budget: "Budget",
  materials: "Materials",
  documents: "Documents",
  updates: "Site",
  people: "People",
  handover: "Handover",
};

export function formatMoneyCompact(rupees: number) {
  if (!Number.isFinite(rupees)) return "—";
  const sign = rupees < 0 ? "−" : "";
  const abs = Math.abs(rupees);
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(2)}L`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

export function formatMoneyExact(rupees: number) {
  if (!Number.isFinite(rupees)) return "—";
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2 })}`;
}

export function formatPaiseCompact(paise: string | number | bigint | null | undefined) {
  if (paise === null || paise === undefined || paise === "") return undefined;
  const rupees = Number(paise) / 100;
  if (!Number.isFinite(rupees)) return undefined;
  return formatMoneyCompact(rupees);
}

export function formatPaiseExact(paise: string | number | bigint | null | undefined) {
  if (paise === null || paise === undefined || paise === "") return undefined;
  const rupees = Number(paise) / 100;
  if (!Number.isFinite(rupees)) return undefined;
  return formatMoneyExact(rupees);
}

export function displayLabel(value: string) {
  if (STATUS_LABELS[value]) return STATUS_LABELS[value];
  const mapped = STATUS_LABELS[value.toUpperCase()] || STATUS_LABELS[value.toLowerCase()];
  if (mapped) return mapped;
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase());
}

export function presentName(value: string) {
  return value
    .replace(/\bSynthetic demo dataset\b/gi, "Added by you")
    .replace(/\bOwner[- ]entered synthetic\b/gi, "Added by you")
    .replace(/^\s*Demo\s+/i, "")
    .replace(/\bSynthetic\s+/gi, "")
    .replace(/\b(dummy|synthetic|fixture|mock data|test user|sample data)\b/gi, "")
    .replace(/\s*[—–-]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function presentStoredText(value?: string | null) {
  if (!value) return "";
  const cleaned = presentName(value.replace(/\bSynthetic demo\s*\/\s*/i, ""));
  return cleaned;
}

export function dayGreeting(name?: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

export function parseConsumerDate(value: string) {
  const trimmed = value.trim();
  const day = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (day && trimmed.length === 10) {
    return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function presentDate(value: string, style: "short" | "long" | "datetime" = "short") {
  const date = parseConsumerDate(value);
  if (!date) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const start = (stamp: Date) => new Date(stamp.getFullYear(), stamp.getMonth(), stamp.getDate());
  const delta = Math.round((start(date).getTime() - start(now).getTime()) / 86400000);
  const dayMonth = `${date.getDate()} ${months[date.getMonth()]}`;
  const withYear = `${dayMonth} ${date.getFullYear()}`;
  if (style === "datetime") {
    const time = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    if (delta === 0) return `Today, ${time}`;
    if (delta === -1) return `Yesterday, ${time}`;
    return `${dayMonth}, ${time}`;
  }
  if (style === "short" && date.getFullYear() === now.getFullYear()) return dayMonth;
  return withYear;
}

export function shortDate(value: string) {
  return presentDate(value, "short");
}

export function dueCopy(value: string) {
  const date = parseConsumerDate(value);
  if (!date) return value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1 && days <= 14) return `Due in ${days} days`;
  if (days < 0 && days >= -14) return `${Math.abs(days)}d overdue`;
  return `Due ${shortDate(value)}`;
}

export function activityGroupName(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stamp = new Date(date);
  stamp.setHours(0, 0, 0, 0);
  const delta = Math.round((stamp.getTime() - today.getTime()) / 86400000);
  if (delta === 0) return "Today";
  if (delta > 0) return "Upcoming";
  if (delta >= -6) return "This week";
  if (stamp.getMonth() === today.getMonth() && stamp.getFullYear() === today.getFullYear()) {
    return stamp.toLocaleDateString("en-IN", { month: "long" });
  }
  return "Earlier";
}

export function groupByActivity<T extends { date: string }>(items: T[]) {
  const order = ["Today", "This week", "Upcoming"];
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const name = activityGroupName(item.date);
    const rows = groups.get(name) ?? [];
    rows.push(item);
    groups.set(name, rows);
  }
  const named = [...groups.keys()].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.localeCompare(b);
  });
  return named.map((name) => ({ name, rows: groups.get(name) ?? [] })).filter((group) => group.rows.length);
}

export function attentionTitle(title: string, type?: string) {
  const cleaned = presentName(title)
    .replace(/ remains open$/i, "")
    .replace(/ needs review$/i, "")
    .replace(/ access expires soon$/i, " access ending");
  if (type === "document") return "Document";
  return cleaned;
}

export function documentStatusLabel(document: { scanStatus?: string | null; processingState?: string | null; reviewStatus?: string | null }) {
  if (document.scanStatus === "unavailable" || document.scanStatus === "infected" || document.scanStatus === "failed") return "Couldn’t process";
  if (document.scanStatus && document.scanStatus !== "clean") return "Scanning";
  if (document.processingState === "ready" && document.reviewStatus === "in_review") return "Needs review";
  if (document.reviewStatus === "confirmed") return "Reviewed";
  return "Needs review";
}

export function layoutStressFixtures() {
  return {
    property: "Premium Independent Residence — Scheme No. 140 Extension",
    document: "Registered Agreement for Sale and Property Transfer Documentation",
    amount: formatMoneyCompact(99.99 * 10_000_000),
    locality: "Maharana Pratap Nagar Scheme No. 54 near Bombay Hospital",
    person: "Adv. Rajeshwar Prasad Venkateshwaran",
    task: "First-floor reinforced concrete slab shuttering and reinforcement inspection",
  };
}

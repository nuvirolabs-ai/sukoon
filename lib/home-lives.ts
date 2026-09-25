import { filterGuidanceForCaps, projectGuidanceForRole, sortGuidance, type GuidanceRow } from "@/lib/construction-guidance";
import { formatINR } from "@/lib/construction-os";
import { shortLabel } from "@/lib/home-life-session";

export { shortLabel } from "@/lib/home-life-session";

/**
 * Home V2 `lives` projection.
 *
 * Ranking is a sort over guidance, obligations, maintenance, reminders, and
 * documents Sukoon already stores. It does not score, persist, or call a model.
 * `composeHomeLives` is the only place that order is decided.
 */

export type HomeAsk = {
  tier: number;
  ruleKey: string;
  title: string;
  reason: string;
  href: string;
  subjectId: string;
  dueDate: string | null;
  eyebrow: string;
  actionLabel: string;
  meta: string | null;
};

export type HomeLatestChange = {
  title: string;
  sentence: string;
  href: string;
  date: string;
  subjectId: string;
};

export type HomeLifeSummary = {
  phaseWord: string | null;
  headline: string | null;
  detail: string | null;
  caption: string | null;
  progressPercent: number | null;
  situation: string | null;
};

export type HomeLife = {
  id: string;
  kind: "house" | "buying" | "selling";
  propertyId: string | null;
  projectId: string | null;
  candidateId: string | null;
  saleId: string | null;
  title: string;
  location: string | null;
  shortLabel: string;
  status: string;
  dot: boolean;
  destinationHref: string;
  summary: HomeLifeSummary;
  asks: HomeAsk[];
  moreCount: number;
  moreHref: string;
  latestChange: HomeLatestChange | null;
};

export type HomeGuidanceInput = {
  id: string;
  ruleKey: string;
  subjectType: string;
  subjectId: string;
  type: string;
  priority: string;
  title: string;
  reason: string;
  actionType: string;
  createdAt: Date | string;
  relevantUntil?: string | null;
};

export type HomeUpdateInput = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  createdAt: string;
};

export type HomeTimelineInput = {
  id: string;
  propertyId: string;
  title: string;
  detail: string | null;
  date: string;
  createdAt: string;
};

export type HomeLivesInput = {
  today: string;
  properties: Array<{ id: string; name: string; city: string | null; area: string | null }>;
  projects: Array<{
    id: string;
    propertyId: string;
    stageName: string | null;
    milestoneName: string | null;
    progressPercent: number | null;
    guidance: HomeGuidanceInput[];
    updates: HomeUpdateInput[];
  }>;
  obligations: Array<{ id: string; propertyId: string; label: string; remainingPaise: string; dueDate: string }>;
  maintenance: Array<{ id: string; propertyId: string; task: string; status: string; dateReported: string }>;
  reminders: Array<{ id: string; propertyId: string | null; title: string; scheduledAt: string; href: string }>;
  documents: Array<{ id: string; propertyId: string; title: string; scanStatus: string; reviewStatus: string }>;
  timeline: HomeTimelineInput[];
  purchases: Array<{
    id: string;
    name: string;
    location: string | null;
    phase: string;
    linkedPropertyId: string | null;
    askingPricePaise: string | null;
    latestBuyerOfferPaise: string | null;
    reportedCounterPaise: string | null;
    agreed: boolean;
    netPricePaidPaise: string | null;
    termsPricePaise: string | null;
    handoverItems: Array<{ label: string; disposition: string }>;
  }>;
  sales: Array<{
    id: string;
    propertyId: string | null;
    prospects: Array<{
      id: string;
      name: string;
      privateNotes: string;
      nextVisit: string | null;
      visitNotes: string | null;
      offers: Array<{ amountPaise: string; offeredOn: string; status: string }>;
    }>;
  }>;
  transactionGuidance: Array<{
    ruleKey: string;
    subjectId: string;
    title: string;
    href: string;
    dueDate: string | null;
    relevanceKey: string;
  }>;
  visits: Array<{
    id: string;
    candidateId: string | null;
    prospectId: string | null;
    startsOn: string;
    contactName: string | null;
    notes: string;
    status: string;
  }>;
};

type Candidate = {
  tier: number;
  group: number;
  index: number;
  ruleKey: string;
  subjectId: string;
  title: string;
  reason: string;
  href: string;
  dueDate: string | null;
  eyebrow: string;
  actionLabel: string;
  meta: string | null;
};

const PRESENTATION: Record<string, { eyebrow: string; actionLabel: string }> = {
  G01: { eyebrow: "Decision", actionLabel: "Review the layout" },
  G10: { eyebrow: "Invoice", actionLabel: "Review the invoice" },
  G05: { eyebrow: "Inspection", actionLabel: "See the inspection" },
  G04: { eyebrow: "Delivery", actionLabel: "See the delivery" },
  G07: { eyebrow: "Delivery", actionLabel: "See the delivery" },
  G06: { eyebrow: "Inspection", actionLabel: "See the inspection" },
  TX02: { eyebrow: "Question", actionLabel: "Answer" },
  TX09: { eyebrow: "Visit", actionLabel: "See the visit" },
  TX10: { eyebrow: "Handover", actionLabel: "See what’s left" },
  TX01: { eyebrow: "Paper", actionLabel: "See the request" },
  TX05: { eyebrow: "Offer", actionLabel: "Review the reply" },
  obligation: { eyebrow: "Bill", actionLabel: "See the bill" },
  maintenance: { eyebrow: "Repair", actionLabel: "See the repair" },
  document: { eyebrow: "Paper", actionLabel: "Review this paper" },
  reminder: { eyebrow: "Reminder", actionLabel: "Open" },
};

const PHASE_WORDS: Record<string, string> = {
  NEGOTIATING: "Talking",
  HANDOVER: "Moving in",
  CONSIDERING: "Looking",
  INFORMATION_GATHERING: "Looking",
  REVIEWING: "Looking",
  TERMS_RECORDED: "Agreed",
  PRE_COMPLETION: "Agreed",
  COMPLETED_RECORDED: "Done",
};

const QUESTION_STOP = new Set(["which", "what", "when", "where", "who", "are", "the", "is", "a", "an", "current", "how", "do", "does", "of", "for", "this", "that", "on"]);

const TIER5 = new Set(["TX02", "TX01", "TX09", "TX10"]);

export function formatHomePaise(paise: bigint): string {
  const negative = paise < 0n;
  const abs = negative ? -paise : paise;
  if (abs >= 100000n * 100n) return formatINR(negative ? -abs : abs);
  const rupees = Number(abs) / 100;
  const formatted = rupees.toLocaleString("en-IN", { maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2 });
  return `${negative ? "-" : ""}₹${formatted}`;
}

export function formatStoredDate(iso: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const label = `${d} ${months[m - 1]}`;
  return y === new Date().getUTCFullYear() ? label : `${label} ${y}`;
}

export function emptyHomeLivesInput(today = new Date().toISOString().slice(0, 10)): HomeLivesInput {
  return {
    today,
    properties: [],
    projects: [],
    obligations: [],
    maintenance: [],
    reminders: [],
    documents: [],
    timeline: [],
    purchases: [],
    sales: [],
    transactionGuidance: [],
    visits: [],
  };
}

function paise(value: string | null | undefined): bigint | null {
  if (value === null || value === undefined || value === "") return null;
  try { return BigInt(value); } catch { return null; }
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function lowerFirst(value: string): string {
  const text = value.trim();
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function sentenceCase(value: string): string {
  const text = value.trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : text;
}

function firstName(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value.trim();
}

function oneSentence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  const sentence = (match?.[0] ?? trimmed).trim();
  if (!sentence) return trimmed;
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function shortageReason(reason: string): string {
  const match = reason.match(/(\d[\d,]*\s+received against\s+\d[\d,]*)/i);
  return match ? `${match[1]}.` : oneSentence(reason);
}

function moneyToken(value: string): string | null {
  return value.match(/₹[\d,]+(?:\.\d+)?(?:Cr|L|K)?/)?.[0] ?? null;
}

function g04Token(title: string): string | null {
  const match = title.match(/^\d+\s+([a-z][a-z-]*)\s+\S+\s+were short\./i);
  return match?.[1]?.toLowerCase() ?? null;
}

function presentation(ruleKey: string): { eyebrow: string; actionLabel: string } {
  return PRESENTATION[ruleKey] ?? { eyebrow: "Next", actionLabel: "Open" };
}

function guidanceHref(projectId: string, actionType: string): string {
  switch (actionType) {
    case "OPEN_DECISION":
      return `/construction/${projectId}?tab=more#decisions`;
    case "OPEN_INSPECTION":
    case "OPEN_DELIVERY":
    case "OPEN_ISSUE":
    case "OPEN_SITE_UPDATE":
      return `/construction/${projectId}?tab=site`;
    case "OPEN_MONEY_RECORD":
      return `/construction/${projectId}?tab=money`;
    default:
      return `/construction/${projectId}?tab=now`;
  }
}

function asGuidanceRow(row: HomeGuidanceInput): GuidanceRow {
  return {
    id: row.id,
    ruleKey: row.ruleKey,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    type: row.type,
    priority: row.priority,
    title: row.title,
    reason: row.reason,
    consequence: null,
    actionType: row.actionType,
    actionTarget: null,
    relevanceKey: row.id,
    status: "ACTIVE",
    provenance: null,
    relevantUntil: row.relevantUntil ?? null,
    resolvedAt: null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

function sortedGuidance(rows: HomeGuidanceInput[]): GuidanceRow[] {
  const ownerCaps = { plan: true, financial: true, materials: true, site: true, documents: true, handover: true };
  return sortGuidance(projectGuidanceForRole(filterGuidanceForCaps(rows.map(asGuidanceRow), ownerCaps), "OWNER"));
}

function titlesOverlap(a: string, b: string): boolean {
  const left = a.toLowerCase().replace(/[.?]/g, "").trim();
  const right = b.toLowerCase().replace(/[.?]/g, "").trim();
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function shortQuestion(title: string): string {
  const words = title.replace(/[?.,]/g, "").split(/\s+/).filter((word) => word && !QUESTION_STOP.has(word.toLowerCase()));
  return `${(words[0] ?? "open").toLowerCase()} question`;
}

function inspectionParts(title: string): { name: string; when: string | null } {
  const match = title.match(/^(.*)\s+is\s+(today|tomorrow|on\s+.+)\.$/i);
  if (!match) return { name: title.replace(/\.$/, ""), when: null };
  return { name: match[1] ?? title, when: (match[2] ?? "").replace(/^on\s+/i, "") };
}

function presentCandidate(candidate: Candidate): HomeAsk {
  const base = presentation(candidate.ruleKey);
  let title = candidate.title.replace(/\s+needs approval\.$/i, "").replace(/\s+needs review\.$/i, "").trim();
  const reason = candidate.ruleKey === "G04" ? shortageReason(candidate.reason) : candidate.ruleKey.startsWith("G") ? oneSentence(candidate.reason) : candidate.reason;
  let meta = candidate.meta;
  if (candidate.ruleKey === "G05" || candidate.ruleKey === "G11") {
    const parts = inspectionParts(candidate.title);
    title = parts.name;
    meta = meta ?? parts.when ?? (candidate.dueDate ? formatStoredDate(candidate.dueDate) : null);
  }
  if (candidate.ruleKey === "G10") meta = meta ?? moneyToken(candidate.reason);
  return {
    tier: candidate.tier,
    ruleKey: candidate.ruleKey,
    title,
    reason,
    href: candidate.href,
    subjectId: candidate.subjectId,
    dueDate: candidate.dueDate,
    eyebrow: candidate.eyebrow || base.eyebrow,
    actionLabel: candidate.actionLabel || base.actionLabel,
    meta,
  };
}

/** Rank, drop FYI, and collapse duplicate subjects. Returns every kept ask, not only the three Home draws. */
export function rankHomeCandidates(candidates: Candidate[]): Candidate[] {
  const sorted = [...candidates].sort((a, b) => a.tier - b.tier || a.group - b.group || a.index - b.index);
  const g04Tokens = sorted.filter((row) => row.ruleKey === "G04").map((row) => g04Token(row.title)).filter((token): token is string => Boolean(token));
  const hasAboveTier7 = sorted.some((row) => row.tier < 7);
  const pool = hasAboveTier7 ? sorted.filter((row) => row.tier !== 7) : sorted;
  const kept: Candidate[] = [];
  const subjects = new Set<string>();
  for (const row of pool) {
    if (row.ruleKey === "G07") {
      const token = g04Tokens.find((item) => row.title.toLowerCase().includes(item));
      if (token) continue;
    }
    if (subjects.has(row.subjectId)) continue;
    if (row.ruleKey === "reminder" && kept.some((ask) => titlesOverlap(ask.title, row.title))) continue;
    subjects.add(row.subjectId);
    kept.push(row);
  }
  return kept;
}

function latestOffer(offers: HomeLivesInput["sales"][number]["prospects"][number]["offers"]) {
  return [...offers].filter((offer) => offer.status !== "WITHDRAWN").sort((a, b) => (a.offeredOn < b.offeredOn ? 1 : a.offeredOn > b.offeredOn ? -1 : 0))[0] ?? null;
}

function prospectsByOffer(prospects: HomeLivesInput["sales"][number]["prospects"]) {
  return [...prospects].sort((a, b) => {
    const left = latestOffer(a.offers);
    const right = latestOffer(b.offers);
    const leftAmount = paise(left?.amountPaise) ?? 0n;
    const rightAmount = paise(right?.amountPaise) ?? 0n;
    if (leftAmount !== rightAmount) return leftAmount > rightAmount ? -1 : 1;
    const leftOn = left?.offeredOn ?? "";
    const rightOn = right?.offeredOn ?? "";
    return leftOn < rightOn ? 1 : leftOn > rightOn ? -1 : a.name.localeCompare(b.name);
  });
}

function privacyCaption(prospects: HomeLivesInput["sales"][number]["prospects"]): string | null {
  for (const prospect of prospects) {
    const match = prospect.privateNotes.match(/not shared with\s+([^.]+)/i);
    const other = match?.[1]?.trim();
    if (!other) continue;
    return `${firstName(other)} cannot see ${firstName(prospect.name)}'s offer.`;
  }
  return null;
}

function changeSentence(description: string | null | undefined, title: string): string {
  const body = (description ?? "").replace(/^[\w-]+\s+synthetic history\.\s*/i, "").trim();
  if (!body) return title.endsWith(".") ? title : `${title}.`;
  return oneSentence(body);
}

function civilDate(value: string): string {
  return value.slice(0, 10);
}

export function selectLatestChange(input: {
  updates: Array<HomeUpdateInput & { href: string }>;
  timeline: Array<HomeTimelineInput & { href: string }>;
  askSubjectIds: Set<string>;
  askTitles: string[];
  shortageTokens: string[];
}): HomeLatestChange | null {
  type Row = { subjectId: string; title: string; description: string | null; date: string; createdAt: string; href: string; kind: "site" | "timeline" };
  const rows: Row[] = [
    ...input.updates.map((update) => ({
      subjectId: update.id,
      title: update.title,
      description: update.description,
      date: civilDate(update.occurredAt),
      createdAt: update.createdAt,
      href: update.href,
      kind: "site" as const,
    })),
    ...input.timeline.map((event) => ({
      subjectId: event.id,
      title: event.title,
      description: event.detail,
      date: civilDate(event.date),
      createdAt: event.createdAt,
      href: event.href,
      kind: "timeline" as const,
    })),
  ];
  const visible = rows.filter((row) => {
    if (input.askSubjectIds.has(row.subjectId)) return false;
    if (input.askTitles.some((title) => titlesOverlap(title, row.title))) return false;
    const haystack = `${row.title} ${row.description ?? ""}`.toLowerCase();
    const echoesShortage = input.shortageTokens.some((token) => haystack.includes(token) && /short|received|deliver/.test(haystack));
    if (echoesShortage) return false;
    return true;
  });
  visible.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
    if (a.kind !== b.kind) return a.kind === "site" ? -1 : 1;
    return 0;
  });
  const winner = visible[0];
  if (!winner) return null;
  return {
    title: winner.title,
    sentence: changeSentence(winner.description, winner.title),
    href: winner.href,
    date: winner.date,
    subjectId: winner.subjectId,
  };
}

function compareLives(a: HomeLife, b: HomeLife): number {
  const tierA = a.asks[0]?.tier ?? 99;
  const tierB = b.asks[0]?.tier ?? 99;
  if (tierA !== tierB) return tierA - tierB;
  const dueA = a.asks[0]?.dueDate ?? "9999-99-99";
  const dueB = b.asks[0]?.dueDate ?? "9999-99-99";
  if (dueA !== dueB) return dueA < dueB ? -1 : 1;
  return a.title.localeCompare(b.title);
}

function locationOf(property: { area: string | null; city: string | null } | undefined, fallback: string | null): string | null {
  if (!property) return fallback;
  const parts = [property.area, property.city].filter(Boolean);
  return parts.length ? parts.join(", ") : fallback;
}

export function composeHomeLives(input: HomeLivesInput): { lives: HomeLife[]; defaultLifeId: string | null } {
  const weekEnd = addDays(input.today, 7);
  const guidanceFor = (project: HomeLivesInput["projects"][number]) => sortedGuidance(project.guidance).filter((row) => row.type !== "FYI");
  const txFor = (subjectIds: Set<string>) => input.transactionGuidance.filter((row) => subjectIds.has(row.subjectId));

  const houseLives: HomeLife[] = input.properties.map((property) => {
    const projects = input.projects.filter((project) => project.propertyId === property.id);
    const sale = input.sales.find((item) => item.propertyId === property.id) ?? null;
    const subjectIds = new Set<string>(sale?.prospects.map((prospect) => prospect.id) ?? []);
    if (sale) subjectIds.add(sale.id);
    const candidates: Candidate[] = [];
    let index = 0;
    for (const project of projects) {
      for (const row of guidanceFor(project)) {
        const tier = row.type === "BLOCKING" ? 0 : row.type === "DECISION" ? 2 : row.type === "DUE" ? 3 : row.type === "EXCEPTION" ? 4 : null;
        if (tier === null) continue;
        const copy = presentation(row.ruleKey);
        candidates.push({
          tier,
          group: 0,
          index: index++,
          ruleKey: row.ruleKey,
          subjectId: row.subjectId,
          title: row.title,
          reason: row.reason,
          href: guidanceHref(project.id, row.actionType),
          dueDate: row.relevantUntil ?? null,
          eyebrow: copy.eyebrow,
          actionLabel: copy.actionLabel,
          meta: null,
        });
      }
    }
    pushTransactionCandidates(candidates, txFor(subjectIds), sale?.id ?? null, input);
    pushHouseholdCandidates(candidates, input, property.id, weekEnd);
    return finishLife({
      id: `house:${property.id}`,
      kind: "house",
      propertyId: property.id,
      projectId: projects[0]?.id ?? null,
      candidateId: null,
      saleId: sale?.id ?? null,
      title: property.name,
      location: locationOf(property, null),
      destinationHref: projects[0] ? `/construction/${projects[0].id}?tab=now` : `/property/${property.id}`,
      moreHref: projects[0] ? `/construction/${projects[0].id}?tab=now` : `/property/${property.id}`,
      candidates,
      property,
      projects,
      sale,
      purchase: null,
      input,
    });
  });

  const buyingLives: HomeLife[] = input.purchases
    .filter((purchase) => !purchase.linkedPropertyId && purchase.phase !== "COMPLETED_RECORDED")
    .map((purchase) => {
      const candidates: Candidate[] = [];
      pushTransactionCandidates(candidates, txFor(new Set([purchase.id])), null, input, purchase);
      return finishLife({
        id: `buying:${purchase.id}`,
        kind: "buying",
        propertyId: null,
        projectId: null,
        candidateId: purchase.id,
        saleId: null,
        title: purchase.name,
        location: purchase.location,
        destinationHref: `/buy-sell/purchases/${purchase.id}`,
        moreHref: `/buy-sell/purchases/${purchase.id}`,
        candidates,
        property: null,
        projects: [],
        sale: null,
        purchase,
        input,
      });
    });

  const sellingLives: HomeLife[] = input.sales
    .filter((sale) => !sale.propertyId)
    .map((sale) => {
      const subjectIds = new Set<string>([sale.id, ...sale.prospects.map((prospect) => prospect.id)]);
      const candidates: Candidate[] = [];
      pushTransactionCandidates(candidates, txFor(subjectIds), sale.id, input);
      const title = sale.prospects[0]?.name ? `Sale` : "Sale";
      return finishLife({
        id: `selling:${sale.id}`,
        kind: "selling",
        propertyId: null,
        projectId: null,
        candidateId: null,
        saleId: sale.id,
        title,
        location: null,
        destinationHref: `/buy-sell/sales/${sale.id}`,
        moreHref: `/buy-sell/sales/${sale.id}`,
        candidates,
        property: null,
        projects: [],
        sale,
        purchase: null,
        input,
      });
    });

  const houses = [...houseLives].sort(compareLives);
  const buying = [...buyingLives].sort(compareLives);
  const selling = [...sellingLives].sort(compareLives);
  const lives = [...houses, ...buying, ...selling];
  const defaultLife = [...lives].sort(compareLives)[0] ?? null;
  return { lives, defaultLifeId: defaultLife && defaultLife.asks.length ? defaultLife.id : (lives[0]?.id ?? null) };
}

function pushTransactionCandidates(
  candidates: Candidate[],
  rows: HomeLivesInput["transactionGuidance"],
  saleId: string | null,
  input: HomeLivesInput,
  purchase?: HomeLivesInput["purchases"][number],
) {
  const tx05 = rows.filter((row) => row.ruleKey === "TX05");
  tx05.forEach((row, index) => {
    const copy = presentation(row.ruleKey);
    candidates.push({
      tier: 2, group: 1, index, ruleKey: row.ruleKey, subjectId: row.subjectId, title: row.title, reason: row.title,
      href: saleHref(row.href, saleId), dueDate: row.dueDate, eyebrow: copy.eyebrow, actionLabel: copy.actionLabel, meta: null,
    });
  });
  const tier5 = rows.filter((row) => TIER5.has(row.ruleKey)).map((row, index) => ({ row, index }));
  tier5.sort((a, b) => {
    if (a.row.dueDate === b.row.dueDate) return a.index - b.index;
    if (!a.row.dueDate) return 1;
    if (!b.row.dueDate) return -1;
    return a.row.dueDate < b.row.dueDate ? -1 : 1;
  });
  for (const item of tier5) {
    const row = item.row;
    const copy = presentation(row.ruleKey);
    const visit = input.visits.find((entry) => entry.id === row.relevanceKey)
      ?? input.visits.find((entry) => entry.status === "PLANNED" && (entry.prospectId === row.subjectId || entry.candidateId === row.subjectId));
    const prospect = input.sales.flatMap((sale) => sale.prospects).find((entry) => entry.id === row.subjectId);
    const openItems = (purchase?.handoverItems ?? []).filter((entry) => entry.disposition === "OPEN");
    let title = row.title;
    let reason = row.dueDate ? `Due ${formatStoredDate(row.dueDate)}.` : oneSentence(row.title);
    let meta: string | null = row.dueDate ? formatStoredDate(row.dueDate) : null;
    let subjectId = row.relevanceKey || row.subjectId;
    if (row.ruleKey === "TX10" && openItems.length) {
      title = openItems[0]?.label ?? title;
      reason = openItems.length > 1 ? `${openItems.length - 1} other items are still open.` : "Still open.";
      subjectId = `handover:${purchase?.id ?? row.subjectId}`;
      meta = null;
    }
    if (row.ruleKey === "TX09") {
      title = prospect?.name || "Visit";
      const notes = prospect?.visitNotes || visit?.notes || "";
      const when = row.dueDate ? formatStoredDate(row.dueDate) : null;
      reason = /no invitation was sent/i.test(notes) && when ? `${when}. Nothing was sent.` : when ? `${when}.` : oneSentence(notes || row.title);
      meta = when;
      subjectId = visit?.id || row.relevanceKey || row.subjectId;
    }
    if (row.ruleKey === "TX02") {
      title = row.title;
      reason = row.dueDate ? `Due ${formatStoredDate(row.dueDate)}.` : "No answer is recorded.";
      meta = null;
      subjectId = row.relevanceKey || row.subjectId;
    }
    candidates.push({
      tier: 5,
      group: 0,
      index: item.index,
      ruleKey: row.ruleKey,
      subjectId,
      title,
      reason,
      href: row.ruleKey === "TX09" ? saleHref(row.href, saleId) : row.href,
      dueDate: row.dueDate,
      eyebrow: copy.eyebrow,
      actionLabel: copy.actionLabel,
      meta,
    });
  }
}

function saleHref(href: string, saleId: string | null): string {
  if (saleId && (href === "/buy-sell/sales" || href.endsWith("/buy-sell/sales"))) return `/buy-sell/sales/${saleId}`;
  return href;
}

function pushHouseholdCandidates(candidates: Candidate[], input: HomeLivesInput, propertyId: string, weekEnd: string) {
  const overdue = input.obligations.filter((item) => item.propertyId === propertyId && paise(item.remainingPaise) && item.dueDate < input.today);
  overdue.forEach((item, index) => candidates.push(obligationCandidate(item, 1, index)));
  const dueSoon = input.obligations.filter((item) => item.propertyId === propertyId && paise(item.remainingPaise) && item.dueDate >= input.today && item.dueDate <= weekEnd);
  dueSoon.forEach((item, index) => candidates.push(obligationCandidate(item, 6, index)));
  const active = input.maintenance.filter((item) => item.propertyId === propertyId && item.status === "IN_PROGRESS");
  active.forEach((item, index) => candidates.push(maintenanceCandidate(item, 3, index)));
  const later = input.maintenance.filter((item) => item.propertyId === propertyId && (item.status === "PLANNED" || item.status === "OPEN"));
  later.forEach((item, index) => candidates.push(maintenanceCandidate(item, 7, index)));
  const reminderEnd = addDays(input.today, 7);
  input.reminders
    .filter((item) => item.propertyId === propertyId && civilDate(item.scheduledAt) >= input.today && civilDate(item.scheduledAt) <= reminderEnd)
    .forEach((item, index) => {
      const copy = presentation("reminder");
      candidates.push({
        tier: 7, group: 1, index, ruleKey: "reminder", subjectId: item.id, title: item.title, reason: `Due ${formatStoredDate(item.scheduledAt)}.`,
        href: item.href, dueDate: civilDate(item.scheduledAt), eyebrow: copy.eyebrow, actionLabel: copy.actionLabel, meta: formatStoredDate(item.scheduledAt),
      });
    });
  input.documents
    .filter((item) => item.propertyId === propertyId && item.scanStatus === "clean" && item.reviewStatus !== "confirmed")
    .forEach((item, index) => {
      const copy = presentation("document");
      candidates.push({
        tier: 8, group: 0, index, ruleKey: "document", subjectId: item.id, title: item.title, reason: "Confirm the source record before it contributes to readiness.",
        href: `/property/${propertyId}/documents/${item.id}`, dueDate: null, eyebrow: copy.eyebrow, actionLabel: copy.actionLabel, meta: null,
      });
    });
}

function obligationCandidate(item: HomeLivesInput["obligations"][number], tier: number, index: number): Candidate {
  const copy = presentation("obligation");
  const amount = paise(item.remainingPaise);
  const formatted = amount === null ? null : formatHomePaise(amount);
  const due = formatStoredDate(item.dueDate);
  return {
    tier, group: 0, index, ruleKey: "obligation", subjectId: item.id, title: item.label,
    reason: formatted ? `${formatted} still open · due ${due}.` : `Due ${due}.`,
    href: `/property/${item.propertyId}?tab=bills`,
    dueDate: item.dueDate, eyebrow: copy.eyebrow, actionLabel: copy.actionLabel,
    meta: formatted ? `${formatted} · due ${due}` : due,
  };
}

function maintenanceCandidate(item: HomeLivesInput["maintenance"][number], tier: number, index: number): Candidate {
  const copy = presentation("maintenance");
  const reported = item.dateReported ? formatStoredDate(item.dateReported) : null;
  return {
    tier, group: tier === 3 ? 1 : 0, index, ruleKey: "maintenance", subjectId: item.id, title: item.task,
    reason: reported ? `Reported ${reported}.` : `Maintenance is ${item.status.toLowerCase().replaceAll("_", " ")}.`,
    href: `/property/${item.propertyId}?tab=maint`,
    dueDate: item.dateReported ? civilDate(item.dateReported) : null,
    eyebrow: copy.eyebrow, actionLabel: copy.actionLabel, meta: null,
  };
}

function finishLife(args: {
  id: string;
  kind: HomeLife["kind"];
  propertyId: string | null;
  projectId: string | null;
  candidateId: string | null;
  saleId: string | null;
  title: string;
  location: string | null;
  destinationHref: string;
  moreHref: string;
  candidates: Candidate[];
  property: HomeLivesInput["properties"][number] | null;
  projects: HomeLivesInput["projects"];
  sale: HomeLivesInput["sales"][number] | null;
  purchase: HomeLivesInput["purchases"][number] | null;
  input: HomeLivesInput;
}): HomeLife {
  const ranked = rankHomeCandidates(args.candidates);
  const shown = ranked.slice(0, 3).map(presentCandidate);
  const primary = shown[0] ?? null;
  const project = args.projects[0] ?? null;
  const orderedProspects = args.sale ? prospectsByOffer(args.sale.prospects) : [];
  const summary = buildSummary({
    title: args.title,
    project,
    saleProspects: orderedProspects,
    purchase: args.purchase,
    primary,
    calm: shown.length === 0,
  });
  const shortageTokens = ranked.map((row) => g04Token(row.title)).filter((token): token is string => Boolean(token));
  const askSubjectIds = new Set(ranked.map((row) => row.subjectId));
  const askTitles = shown.map((row) => row.title);
  const updates = (project?.updates ?? []).map((update) => ({ ...update, href: `/construction/${project?.id}?tab=site` }));
  const timeline = args.input.timeline
    .filter((event) => event.propertyId === args.propertyId)
    .map((event) => ({ ...event, href: args.propertyId ? `/property/${args.propertyId}` : event.id }));
  const latestChange = args.propertyId || project
    ? selectLatestChange({ updates, timeline, askSubjectIds, askTitles, shortageTokens })
    : selectLatestChange({ updates: [], timeline, askSubjectIds, askTitles, shortageTokens });
  return {
    id: args.id,
    kind: args.kind,
    propertyId: args.propertyId,
    projectId: args.projectId,
    candidateId: args.candidateId,
    saleId: args.saleId,
    title: args.title,
    location: args.location,
    shortLabel: shortLabel(args.title),
    status: statusLine({ title: args.title, project, prospects: orderedProspects, purchase: args.purchase, primary, maintenance: args.input.maintenance.filter((item) => item.propertyId === args.propertyId) }),
    dot: primary ? primary.tier <= 4 : false,
    destinationHref: args.destinationHref,
    summary,
    asks: shown,
    moreCount: Math.max(0, ranked.length - shown.length),
    moreHref: args.moreHref,
    latestChange,
  };
}

function buildSummary(args: {
  title: string;
  project: HomeLivesInput["projects"][number] | null;
  saleProspects: HomeLivesInput["sales"][number]["prospects"];
  purchase: HomeLivesInput["purchases"][number] | null;
  primary: HomeAsk | null;
  calm: boolean;
}): HomeLifeSummary {
  const empty: HomeLifeSummary = { phaseWord: null, headline: null, detail: null, caption: null, progressPercent: null, situation: null };
  if (args.saleProspects.length) {
    const parts = args.saleProspects.flatMap((prospect) => {
      const offer = latestOffer(prospect.offers);
      const amount = paise(offer?.amountPaise);
      return amount === null ? [] : [`${prospect.name} ${formatHomePaise(amount)}`];
    });
    return {
      phaseWord: "Selling",
      headline: parts.length ? parts.join(" · ") : null,
      detail: null,
      caption: privacyCaption(args.saleProspects),
      progressPercent: null,
      situation: args.calm ? `${args.title} is quiet.` : null,
    };
  }
  if (args.project?.stageName) {
    const milestone = args.project.milestoneName;
    const progress = args.project.progressPercent;
    return {
      phaseWord: null,
      headline: args.calm ? "Nothing needs you." : `On ${args.project.stageName}`,
      detail: !args.calm && milestone && progress !== null ? `Preparing the ${lowerFirst(milestone)} · ${progress}%` : null,
      caption: null,
      progressPercent: progress,
      situation: args.calm && milestone ? `The build is on the ${lowerFirst(milestone)}.` : args.calm ? `${args.title} is quiet.` : null,
    };
  }
  if (args.purchase) {
    const phaseWord = PHASE_WORDS[args.purchase.phase] ?? null;
    const offer = paise(args.purchase.latestBuyerOfferPaise);
    const counter = paise(args.purchase.reportedCounterPaise);
    const net = paise(args.purchase.netPricePaidPaise);
    const terms = paise(args.purchase.termsPricePaise);
    const moving = args.purchase.phase === "HANDOVER";
    let headline: string | null = null;
    let caption: string | null = null;
    if (moving && net !== null && terms !== null) {
      headline = `${formatHomePaise(net)} recorded toward ${formatHomePaise(terms)}`;
      caption = "Entered by you, not a bank receipt.";
    } else if (offer && counter) {
      headline = `You offered ${formatHomePaise(offer)}. Their last reply was ${formatHomePaise(counter)}.`;
      caption = args.purchase.agreed ? null : "No agreed price is recorded.";
    } else if (offer) {
      headline = `You offered ${formatHomePaise(offer)}.`;
      caption = args.purchase.agreed ? null : "No agreed price is recorded.";
    }
    return {
      phaseWord,
      headline: args.calm ? "Nothing needs you." : headline,
      detail: null,
      caption: args.calm ? null : caption,
      progressPercent: null,
      situation: args.calm ? `${args.title} is quiet.` : null,
    };
  }
  if (args.calm) {
    return { ...empty, headline: "Nothing needs you.", situation: `${args.title} is quiet.` };
  }
  if (args.primary?.ruleKey === "maintenance") {
    return { ...empty, headline: `${sentenceCase(args.primary.title)} is still open.` };
  }
  return { ...empty, headline: shortLabel(args.title) };
}

function statusLine(args: {
  title: string;
  project: HomeLivesInput["projects"][number] | null;
  prospects: HomeLivesInput["sales"][number]["prospects"];
  purchase: HomeLivesInput["purchases"][number] | null;
  primary: HomeAsk | null;
  maintenance: HomeLivesInput["maintenance"];
}): string {
  if (args.project?.milestoneName) return `Building · ${lowerFirst(args.project.milestoneName)}`;
  if (args.project?.stageName) return `Building · ${lowerFirst(args.project.stageName)}`;
  if (args.prospects.length) {
    const top = args.prospects[0];
    const offer = top ? latestOffer(top.offers) : null;
    const amount = paise(offer?.amountPaise);
    if (top && amount !== null) return `Selling · ${top.name} ${formatHomePaise(amount)}`;
    return "Selling";
  }
  if (args.purchase?.phase === "HANDOVER") {
    const open = args.purchase.handoverItems.find((item) => item.disposition === "OPEN");
    return open ? `Moving in · ${open.label} open` : "Moving in";
  }
  if (args.purchase) {
    const phaseWord = PHASE_WORDS[args.purchase.phase] ?? "Buying";
    if (args.primary?.ruleKey === "TX02") return `${phaseWord} · ${shortQuestion(args.primary.title)}`;
    if (args.primary?.ruleKey === "TX09" && args.primary.dueDate) return `${phaseWord} · visit ${formatStoredDate(args.primary.dueDate)}`;
    if (args.primary) return `${phaseWord} · ${args.primary.title}`;
    return phaseWord;
  }
  const repair = args.maintenance.find((item) => item.status === "IN_PROGRESS");
  if (repair) return `${sentenceCase(repair.task)} open`;
  if (!args.primary) return "Quiet";
  return args.primary.title;
}

export function composeSharedLives(
  properties: Array<{ id: string; name: string; city: string | null; area: string | null }>,
  activity: Array<{ id: string; propertyId: string; title: string; detail?: string | null; date: string; createdAt?: string }>,
): { lives: HomeLife[]; defaultLifeId: string | null } {
  const lives = properties.map((property) => {
    const events = activity.filter((item) => item.propertyId === property.id);
    const newest = [...events].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1))[0];
    const life: HomeLife = {
      id: `house:${property.id}`,
      kind: "house",
      propertyId: property.id,
      projectId: null,
      candidateId: null,
      saleId: null,
      title: property.name,
      location: locationOf(property, null),
      shortLabel: shortLabel(property.name),
      status: "Shared with you",
      dot: false,
      destinationHref: `/shared/${property.id}`,
      summary: { phaseWord: null, headline: "Shared with you.", detail: null, caption: null, progressPercent: null, situation: null },
      asks: [],
      moreCount: 0,
      moreHref: `/shared/${property.id}`,
      latestChange: newest ? { title: newest.title, sentence: changeSentence(newest.detail, newest.title), href: `/shared/${property.id}`, date: civilDate(newest.date), subjectId: newest.id } : null,
    };
    return life;
  });
  return { lives, defaultLifeId: lives[0]?.id ?? null };
}

/** Old payloads stay intact. `lives` is additive. */
export function withHomeLives<T extends object>(projection: T, lives: HomeLife[] | null, defaultLifeId: string | null): T & { lives: HomeLife[] | null; defaultLifeId: string | null } {
  return { ...projection, lives, defaultLifeId };
}

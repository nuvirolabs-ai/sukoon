import { createHash } from "node:crypto";
import path from "node:path";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { createObligationForUser, listObligationsForUser } from "@/lib/obligations";
import { recordPaymentForUser } from "@/lib/payments";
import { createMaintenanceForUser, updateMaintenanceForUser } from "@/lib/maintenance";
import { createManualReminderForUser } from "@/lib/durable-reminders";
import { mutateConstructionForUser } from "@/lib/construction";
import { purchaseCommand } from "@/lib/purchases";
import { recordPurchaseEvidence } from "@/lib/purchase-evidence";

export const DEMO_ENRICHMENT_NAMESPACE = "SUKOON_DEMO_ENRICHMENT_V1" as const;
export const DEMO_ENRICHMENT_DATABASE = "sukoon_demo_staging" as const;
export const DEMO_ENRICHMENT_ANCHOR_DATE = "2026-09-22" as const;

type Db = PrismaClient;
type PropertySlot = "primary" | "secondary" | "construction";
type DateRange = { start: string; end: string };

export type DemoLegacyBillPlan = {
  key: string;
  propertySlot: PropertySlot;
  title: string;
  type: string;
  amountPaise: string;
  dueDate: string;
  status: string;
  paidDate: string | null;
  recurring: string;
  notes: string;
};

export type DemoObligationPlan = {
  key: string;
  propertySlot: PropertySlot;
  label: string;
  type: string;
  direction: "PAYABLE" | "NON_FINANCIAL";
  amountPaise: string | null;
  dueDate: string;
  status: "paid" | "partial" | "overdue" | "upcoming";
  paymentAmountPaise: string | null;
  paymentDate: string | null;
  reminder: boolean;
};

export type DemoMaintenancePlan = {
  key: string;
  propertySlot: PropertySlot;
  title: string;
  category: string;
  status: "RESOLVED" | "IN_PROGRESS" | "PLANNED" | "CANCELLED";
  dateReported: string;
  dateStarted: string | null;
  dateCompleted: string | null;
  estimatedAmountPaise: string | null;
  finalAmountPaise: string | null;
  warrantyExpiry: string | null;
  location: string;
  notes: string;
};

export type DemoReminderPlan = {
  key: string;
  propertySlot: PropertySlot;
  title: string;
  kind: string;
  dueDate: string;
  done: boolean;
  body: string;
};

export type DemoTimelinePlan = {
  key: string;
  propertySlot: PropertySlot;
  date: string;
  title: string;
  detail: string;
  kind: string;
};

export type DemoConstructionEventPlan = {
  key: string;
  date: string;
  eventType: string;
  title: string;
  payload: Record<string, unknown>;
};

export type DemoConstructionUpdatePlan = {
  key: string;
  date: string;
  title: string;
  description: string;
};

export type DemoPurchaseEntryPlan = {
  key: string;
  kind: "NOTE" | "QUESTION" | "DOCUMENT_REQUEST";
  body: string;
  dateOffset: number;
};

export type DemoEnrichmentPlan = {
  namespace: typeof DEMO_ENRICHMENT_NAMESPACE;
  asOf: string;
  dateRange: DateRange;
  legacyBills: DemoLegacyBillPlan[];
  obligations: DemoObligationPlan[];
  maintenance: DemoMaintenancePlan[];
  reminders: DemoReminderPlan[];
  timeline: DemoTimelinePlan[];
  constructionEvents: DemoConstructionEventPlan[];
  constructionUpdates: DemoConstructionUpdatePlan[];
  purchaseEntries: DemoPurchaseEntryPlan[];
  documents: [];
};

export type DemoEnrichmentReport = {
  namespace: typeof DEMO_ENRICHMENT_NAMESPACE;
  ownerEmail: string;
  database: string;
  asOf: string;
  dateRange: DateRange;
  created: Record<string, number>;
  skipped: Record<string, number>;
  conflicts: string[];
  documentsCreated: 0;
  documentsTouched: false;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function stableDemoEnrichmentId(kind: string, label: string) {
  return `sukoon-demo-enrichment-v1-${slug(kind)}-${hash(`${DEMO_ENRICHMENT_NAMESPACE}:${kind}:${label}`).slice(0, 24)}`;
}

export function stableDemoEnrichmentKey(kind: string, label: string) {
  return `${DEMO_ENRICHMENT_NAMESPACE}:${kind}:${label}`;
}

function stableRequestKey(kind: string, label: string) {
  return `SUKOON-DEMO-ENRICHMENT-V1-${slug(kind)}-${hash(`${DEMO_ENRICHMENT_NAMESPACE}:${kind}:${label}`).slice(0, 24)}`;
}

function dateOnly(value: Date | string) {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : value;
  if (!Number.isFinite(date.getTime())) throw new Error("DEMO_ENRICHMENT_DATE_INVALID");
  return date.toISOString().slice(0, 10);
}

function shift(value: Date | string, days: number) {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateOnly(date);
}

function atNoon(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(atNoon(value));
}

function rupees(value: number) {
  return String(Math.round(value * 100));
}

function addBill(
  list: DemoLegacyBillPlan[],
  input: Omit<DemoLegacyBillPlan, "key" | "notes"> & { key: string; notes?: string },
) {
  list.push({ ...input, notes: input.notes ?? `${DEMO_ENRICHMENT_NAMESPACE} · owner-entered synthetic history; not provider-verified.` });
}

export function buildDemoEnrichmentPlan(asOf: Date | string = DEMO_ENRICHMENT_ANCHOR_DATE): DemoEnrichmentPlan {
  const anchor = dateOnly(asOf);
  const legacyBills: DemoLegacyBillPlan[] = [];
  const obligations: DemoObligationPlan[] = [];
  const maintenance: DemoMaintenancePlan[] = [];
  const reminders: DemoReminderPlan[] = [];
  const timeline: DemoTimelinePlan[] = [];
  const constructionEvents: DemoConstructionEventPlan[] = [];
  const constructionUpdates: DemoConstructionUpdatePlan[] = [];

  const electricityOffsets = [-270, -240, -210, -180, -150, -120, -90, -60, -30, 7];
  electricityOffsets.forEach((offset, index) => {
    const dueDate = shift(anchor, offset);
    const late = offset === -90;
    const upcoming = offset > 0;
    const label = upcoming ? "Electricity · current cycle" : `Electricity · ${monthLabel(dueDate)}`;
    const amount = 4100 + (index % 4) * 275;
    const paidDate = upcoming ? null : late ? shift(dueDate, 9) : shift(dueDate, -2);
    addBill(legacyBills, { key: `electricity-${dueDate}`, propertySlot: "primary", title: label, type: "Electricity", amountPaise: rupees(amount), dueDate, status: upcoming ? "pending" : "paid", paidDate, recurring: "monthly" });
    obligations.push({ key: `electricity-${dueDate}`, propertySlot: "primary", label, type: "Utility", direction: "PAYABLE", amountPaise: rupees(amount), dueDate, status: upcoming ? "upcoming" : "paid", paymentAmountPaise: upcoming ? null : rupees(amount), paymentDate: paidDate, reminder: upcoming });
  });

  [-230, -170, -110, -50].forEach((offset, index) => {
    const dueDate = shift(anchor, offset);
    const amount = 620 + index * 45;
    const label = `Water · ${monthLabel(dueDate)}`;
    addBill(legacyBills, { key: `water-${dueDate}`, propertySlot: "primary", title: label, type: "Water", amountPaise: rupees(amount), dueDate, status: "paid", paidDate: shift(dueDate, -1), recurring: "monthly" });
    obligations.push({ key: `water-${dueDate}`, propertySlot: "primary", label, type: "Utility", direction: "PAYABLE", amountPaise: rupees(amount), dueDate, status: "paid", paymentAmountPaise: rupees(amount), paymentDate: shift(dueDate, -1), reminder: false });
  });

  const taxDate = shift(anchor, -160);
  addBill(legacyBills, { key: `property-tax-${taxDate}`, propertySlot: "primary", title: "Property tax · annual record", type: "Property tax", amountPaise: rupees(100000), dueDate: taxDate, status: "pending", paidDate: null, recurring: "yearly", notes: `${DEMO_ENRICHMENT_NAMESPACE} · ₹45,000 self-reported partial payment; balance remains. No government reconciliation.` });
  obligations.push({ key: `property-tax-${taxDate}`, propertySlot: "primary", label: "Property tax · annual record", type: "Property tax", direction: "PAYABLE", amountPaise: rupees(100000), dueDate: taxDate, status: "partial", paymentAmountPaise: rupees(45000), paymentDate: shift(taxDate, 4), reminder: true });

  [-210, -120, 15].forEach((offset, index) => {
    const dueDate = shift(anchor, offset);
    const amount = 2300 + index * 100;
    const upcoming = offset > 0;
    const label = upcoming ? "Society maintenance · next cycle" : `Society maintenance · ${monthLabel(dueDate)}`;
    addBill(legacyBills, { key: `society-${dueDate}`, propertySlot: "secondary", title: label, type: "Society maintenance", amountPaise: rupees(amount), dueDate, status: upcoming ? "pending" : "paid", paidDate: upcoming ? null : shift(dueDate, -3), recurring: "quarterly" });
    obligations.push({ key: `society-${dueDate}`, propertySlot: "secondary", label, type: "Society maintenance", direction: "PAYABLE", amountPaise: rupees(amount), dueDate, status: upcoming ? "upcoming" : "paid", paymentAmountPaise: upcoming ? null : rupees(amount), paymentDate: upcoming ? null : shift(dueDate, -3), reminder: upcoming });
  });

  const insuranceDate = shift(anchor, 45);
  addBill(legacyBills, { key: "insurance-renewal", propertySlot: "primary", title: "Insurance renewal · upcoming", type: "Insurance", amountPaise: rupees(0), dueDate: insuranceDate, status: "pending", paidDate: null, recurring: "yearly", notes: `${DEMO_ENRICHMENT_NAMESPACE} · reminder only; no provider renewal or payment is claimed.` });
  obligations.push({ key: "insurance-renewal", propertySlot: "primary", label: "Insurance renewal · upcoming", type: "Renewal", direction: "NON_FINANCIAL", amountPaise: null, dueDate: insuranceDate, status: "upcoming", paymentAmountPaise: null, paymentDate: null, reminder: true });
  obligations.push({ key: "financing-follow-up", propertySlot: "primary", label: "Home-loan follow-up · financing stage", type: "Follow-up", direction: "NON_FINANCIAL", amountPaise: null, dueDate: shift(anchor, 30), status: "upcoming", paymentAmountPaise: null, paymentDate: null, reminder: true });

  const maintenanceRows: Array<Omit<DemoMaintenancePlan, "key" | "notes"> & { key: string }> = [
    { key: "ac-servicing-2025", propertySlot: "primary", title: "AC servicing", category: "Appliance", status: "RESOLVED", dateReported: shift(anchor, -275), dateStarted: shift(anchor, -274), dateCompleted: shift(anchor, -273), estimatedAmountPaise: rupees(3200), finalAmountPaise: rupees(2800), warrantyExpiry: shift(anchor, -90), location: "Living room", },
    { key: "plumbing-leak-2026", propertySlot: "primary", title: "Plumbing leak", category: "Plumbing", status: "RESOLVED", dateReported: shift(anchor, -230), dateStarted: shift(anchor, -229), dateCompleted: shift(anchor, -226), estimatedAmountPaise: rupees(6500), finalAmountPaise: rupees(5800), warrantyExpiry: shift(anchor, -40), location: "Kitchen", },
    { key: "purifier-service-2026", propertySlot: "primary", title: "Water purifier servicing", category: "Appliance", status: "RESOLVED", dateReported: shift(anchor, -175), dateStarted: shift(anchor, -174), dateCompleted: shift(anchor, -174), estimatedAmountPaise: rupees(1600), finalAmountPaise: rupees(1400), warrantyExpiry: shift(anchor, -20), location: "Utility area", },
    { key: "pest-control-2026", propertySlot: "secondary", title: "Pest-control treatment", category: "Pest Control", status: "RESOLVED", dateReported: shift(anchor, -125), dateStarted: shift(anchor, -124), dateCompleted: shift(anchor, -123), estimatedAmountPaise: rupees(2400), finalAmountPaise: rupees(2200), warrantyExpiry: shift(anchor, -60), location: "Apartment", },
    { key: "inverter-maintenance-2026", propertySlot: "secondary", title: "Inverter and battery maintenance", category: "Electrical", status: "CANCELLED", dateReported: shift(anchor, -80), dateStarted: null, dateCompleted: null, estimatedAmountPaise: rupees(1800), finalAmountPaise: null, warrantyExpiry: null, location: "Utility balcony", },
    { key: "electrical-repair-2026", propertySlot: "primary", title: "Electrical repair", category: "Electrical", status: "IN_PROGRESS", dateReported: shift(anchor, -35), dateStarted: shift(anchor, -33), dateCompleted: null, estimatedAmountPaise: rupees(4200), finalAmountPaise: null, warrantyExpiry: null, location: "Study", },
    { key: "bathroom-fitting-2026", propertySlot: "primary", title: "Bathroom fitting repair", category: "Plumbing", status: "PLANNED", dateReported: shift(anchor, -4), dateStarted: null, dateCompleted: null, estimatedAmountPaise: rupees(7200), finalAmountPaise: null, warrantyExpiry: null, location: "Guest bathroom", },
    { key: "ac-service-next", propertySlot: "primary", title: "AC service · next recommended visit", category: "Appliance", status: "PLANNED", dateReported: shift(anchor, 8), dateStarted: null, dateCompleted: null, estimatedAmountPaise: rupees(3500), finalAmountPaise: null, warrantyExpiry: null, location: "Living room", },
  ];
  maintenance.push(...maintenanceRows.map((item) => ({ ...item, notes: `${DEMO_ENRICHMENT_NAMESPACE} · owner-entered service history; no invoice or provider verification.` })));

  const reminderRows: Array<Omit<DemoReminderPlan, "key" | "body"> & { key: string }> = [
    { key: "property-tax-follow-up", propertySlot: "primary", title: "Property tax balance follow-up", kind: "bill", dueDate: shift(anchor, -120), done: true },
    { key: "ac-service-completed", propertySlot: "primary", title: "AC service follow-up", kind: "maintenance", dueDate: shift(anchor, -270), done: true },
    { key: "society-payment-record", propertySlot: "secondary", title: "Society payment record", kind: "bill", dueDate: shift(anchor, -120), done: true },
    { key: "insurance-renewal", propertySlot: "primary", title: "Insurance renewal approaching", kind: "insurance", dueDate: insuranceDate, done: false },
    { key: "reinforcement-inspection", propertySlot: "construction", title: "Reinforcement inspection follow-up", kind: "construction", dueDate: shift(anchor, 10), done: false },
    { key: "steel-delivery", propertySlot: "construction", title: "Steel procurement check-in", kind: "construction", dueDate: shift(anchor, 14), done: false },
    { key: "legal-document-follow-up", propertySlot: "primary", title: "Purchase review follow-up", kind: "purchase", dueDate: shift(anchor, 21), done: false },
    { key: "financing-follow-up", propertySlot: "primary", title: "Financing follow-up", kind: "purchase", dueDate: shift(anchor, 30), done: false },
  ];
  reminders.push(...reminderRows.map((item) => ({ ...item, body: `${item.title} · self-entered synthetic reminder; no external delivery or official deadline is claimed.` })));

  const timelineRows: Array<[PropertySlot, number, string, string, string]> = [
    ["primary", -290, "Ownership records organised", "Synthetic owner-entered passport activity started.", "property"],
    ["primary", -250, "Electricity payment recorded", "Monthly household bill marked paid by the account holder.", "bill"],
    ["primary", -220, "AC service completed", "Cooling system service logged; no invoice attached.", "maintenance"],
    ["primary", -190, "Water bill recorded", "Water usage payment recorded by the account holder.", "bill"],
    ["primary", -160, "Annual property tax noted", "Partial self-reported payment remains outstanding; no government reconciliation.", "bill"],
    ["primary", -130, "Plumbing leak resolved", "Kitchen leak repair marked resolved by the account holder.", "maintenance"],
    ["primary", -100, "Electricity payment recorded late", "The bill was paid after its recorded due date.", "bill"],
    ["primary", -70, "Water purifier serviced", "Service visit recorded without an invoice or provider claim.", "maintenance"],
    ["primary", -40, "Electrical repair opened", "Study repair remains in progress.", "maintenance"],
    ["primary", -12, "Bathroom fitting repair planned", "Owner recorded a follow-up for the guest bathroom.", "maintenance"],
    ["primary", -2, "Insurance renewal added", "Future reminder recorded; no renewal has occurred.", "reminder"],
    ["primary", 7, "Electricity cycle upcoming", "Current household bill is awaiting owner action.", "bill"],
    ["secondary", -280, "Palm Meadows records reviewed", "Apartment records were reorganised in the synthetic workspace.", "property"],
    ["secondary", -235, "Society payment recorded", "Quarterly society maintenance marked paid by the account holder.", "bill"],
    ["secondary", -190, "Water usage pattern recorded", "Synthetic apartment utility history added.", "bill"],
    ["secondary", -145, "Pest control completed", "Treatment marked complete without a fabricated invoice.", "maintenance"],
    ["secondary", -100, "Insurance note added", "Existing property insurance context retained; no provider lookup claimed.", "property"],
    ["secondary", -55, "Society payment recorded", "A later quarterly society record was entered.", "bill"],
    ["secondary", -18, "Inverter service cancelled", "Owner cancelled the planned maintenance visit.", "maintenance"],
    ["secondary", 15, "Society maintenance upcoming", "Next quarterly record is waiting for owner action.", "bill"],
    ["construction", -300, "Construction project initiated", "Mehta Residence planning activity recorded in the synthetic project.", "construction"],
    ["construction", -270, "Excavation completed", "Owner-recorded progression; no site inspection claim.", "construction"],
    ["construction", -240, "Foundation work completed", "Historical stage activity recorded.", "construction"],
    ["construction", -210, "Plinth work completed", "Historical stage activity recorded.", "construction"],
    ["construction", -180, "Ground-floor structure progressed", "Synthetic site update; no professional certification.", "construction"],
    ["construction", -150, "Reinforcement inspection recorded", "Inspection record is owner-entered and not a certification.", "construction"],
    ["construction", -120, "Contractor payment discussion noted", "Historical spend baseline retained; no new payment is created here.", "construction"],
    ["construction", -90, "Steel requirement identified", "TMT steel need was added to the working plan.", "construction"],
    ["construction", -60, "Cement shortage noted", "Material availability issue remains visible for follow-up.", "construction"],
    ["construction", -45, "Electrical layout decision opened", "Owner decision remains blocking until selected.", "construction"],
    ["construction", -30, "Ground-floor slab completed", "Historical progress recorded in the project timeline.", "construction"],
    ["construction", -14, "First-floor columns started", "Synthetic site update; no construction approval claim.", "construction"],
    ["construction", -7, "Flooring change approved", "Synthetic change record includes an estimated cost/time impact.", "construction"],
    ["construction", -2, "First-floor slab preparation", "Recent site update recorded for the active RCC / Structure stage.", "construction"],
    ["construction", 8, "First-floor slab milestone upcoming", "Future milestone is owner-entered and not a contractor commitment.", "construction"],
    ["construction", 28, "Steel procurement check-in", "Future follow-up for a material requirement.", "construction"],
  ];
  timeline.push(...timelineRows.map(([propertySlot, offset, title, detail, kind], index) => ({ key: `timeline-${index + 1}`, propertySlot, date: shift(anchor, offset), title, detail: `${detail} ${DEMO_ENRICHMENT_NAMESPACE}.`, kind })));

  const constructionEventRows: Array<[number, string, string]> = [
    [-300, "PROJECT_STARTED", "Project initiated"],
    [-270, "EXCAVATION_COMPLETED", "Excavation completed"],
    [-240, "FOUNDATION_COMPLETED", "Foundation completed"],
    [-210, "PLINTH_COMPLETED", "Plinth completed"],
    [-180, "GROUND_FLOOR_STRUCTURE_COMPLETED", "Ground-floor structural work completed"],
    [-150, "INSPECTION_RECORDED", "Reinforcement inspection recorded"],
    [-120, "CONTRACTOR_REVIEW_NOTED", "Contractor invoice review noted"],
    [-90, "MATERIAL_REQUIREMENT_ADDED", "Steel requirement added"],
    [-60, "MATERIAL_SHORTAGE_REPORTED", "Cement shortage reported"],
    [-7, "CHANGE_APPROVED", "Flooring change approved"],
  ];
  constructionEvents.push(...constructionEventRows.map(([offset, eventType, title], index) => ({ key: `construction-event-${index + 1}`, date: shift(anchor, offset), eventType, title, payload: { namespace: DEMO_ENRICHMENT_NAMESPACE, synthetic: true, recordedDate: shift(anchor, offset) } })));

  const constructionUpdateRows: Array<[number, string, string]> = [
    [-270, "Excavation completed", "Owner-recorded excavation update; no engineering certification."],
    [-240, "Foundation work completed", "Historical site log entry for the synthetic project."],
    [-210, "Plinth work completed", "Historical site log entry for the synthetic project."],
    [-180, "Ground-floor structure progressed", "Owner-entered progress note; no contractor/provider response claimed."],
    [-150, "Reinforcement inspection follow-up", "Inspection was recorded for follow-up, not as approval."],
    [-90, "Steel requirement coordinated", "Material requirement was recorded for procurement discussion."],
    [-30, "Ground-floor slab completed", "Historical site log entry for the synthetic project."],
    [-2, "First-floor slab preparation underway", "Recent owner-entered site update for the active RCC / Structure stage."],
  ];
  constructionUpdates.push(...constructionUpdateRows.map(([offset, title, description], index) => ({ key: `construction-update-${index + 1}`, date: shift(anchor, offset), title, description: `${description} ${DEMO_ENRICHMENT_NAMESPACE}.` })));

  const purchaseEntries: DemoPurchaseEntryPlan[] = [
    { key: "negotiation-initial-offer", kind: "NOTE", body: "Initial buyer offer recorded at ₹1.68 Cr — synthetic commercial discussion only; not binding.", dateOffset: -55 },
    { key: "negotiation-counter", kind: "NOTE", body: "Seller counter-offer recorded at ₹1.75 Cr — reported discussion, not a verified seller response.", dateOffset: -42 },
    { key: "negotiation-current", kind: "NOTE", body: "Current discussion position recorded around ₹1.72 Cr — synthetic and non-binding.", dateOffset: -28 },
    { key: "possession-expectation", kind: "NOTE", body: "Possession expectation noted for the synthetic review; no contractual or legal conclusion is recorded.", dateOffset: -21 },
    { key: "parking-question", kind: "QUESTION", body: "Can the seller confirm the parking allocation and inclusion terms?", dateOffset: -18 },
    { key: "latest-tax-request", kind: "DOCUMENT_REQUEST", body: "Latest property-tax receipt requested; no document has been delivered or verified.", dateOffset: -14 },
    { key: "professional-review", kind: "NOTE", body: "Professional/legal review requested; no legal opinion or government verification is present.", dateOffset: -8 },
    { key: "financing-stage", kind: "NOTE", body: "Financing discussion is in progress; no lender response or payment success is claimed.", dateOffset: -3 },
    { key: "next-action", kind: "NOTE", body: "Next action: follow up on parking, tax receipt, and financing questions by the recorded future reminder date.", dateOffset: 7 },
  ];

  return {
    namespace: DEMO_ENRICHMENT_NAMESPACE,
    asOf: anchor,
    dateRange: { start: shift(anchor, -300), end: shift(anchor, 60) },
    legacyBills,
    obligations,
    maintenance,
    reminders,
    timeline,
    constructionEvents,
    constructionUpdates,
    purchaseEntries,
    documents: [],
  };
}

function databaseName(raw: string | undefined) {
  try {
    const url = new URL(raw ?? "");
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") return null;
    return decodeURIComponent(url.pathname.slice(1));
  } catch {
    return null;
  }
}

export function assertDemoEnrichmentEnvironment(
  env: NodeJS.Dict<string> = process.env,
  actualDatabaseName?: string,
  options: { testOnly?: boolean } = {},
) {
  if (env.APP_ENV !== "staging" || env.NODE_ENV !== "production" || env.SUKOON_RUNTIME_PROFILE !== "STAGING") throw new Error("DEMO_ENRICHMENT_STAGING_REQUIRED");
  if (env.SUKOON_DEMO_ENRICHMENT_CONFIRMATION !== DEMO_ENRICHMENT_NAMESPACE) throw new Error("DEMO_ENRICHMENT_CONFIRMATION_REQUIRED");
  if (env.SUKOON_DATA_DIR && path.resolve(env.SUKOON_DATA_DIR) === path.resolve(".data")) throw new Error("DEMO_ENRICHMENT_LOCAL_DATA_FORBIDDEN");
  const configured = databaseName(env.DATABASE_URL);
  const allowedTestDatabase = options.testOnly && actualDatabaseName && /^sukoon_s02_test_[a-zA-Z0-9_-]+$/.test(actualDatabaseName);
  if (configured !== DEMO_ENRICHMENT_DATABASE || (actualDatabaseName !== undefined && actualDatabaseName !== DEMO_ENRICHMENT_DATABASE && !allowedTestDatabase)) throw new Error("DEMO_ENRICHMENT_DATABASE_SCOPE_INVALID");
}

function increment(target: Record<string, number>, key: string) {
  target[key] = (target[key] ?? 0) + 1;
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_key, entry) => typeof entry === "bigint" ? entry.toString() : entry)) as Prisma.InputJsonValue;
}

async function actualDatabase(db: Db) {
  const rows = await db.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  return rows[0]?.name ?? "";
}

function assertSameWorkspace(existing: { workspaceId: string; propertyId?: string | null }, workspaceId: string, propertyId?: string) {
  if (existing.workspaceId !== workspaceId || (propertyId !== undefined && existing.propertyId !== propertyId)) throw new Error("DEMO_ENRICHMENT_ID_COLLISION");
}

export async function runDemoEnrichment(options: {
  db?: Db;
  env?: NodeJS.Dict<string>;
  actualDatabaseName?: string;
  testOnly?: boolean;
  asOf?: Date | string;
} = {}): Promise<DemoEnrichmentReport> {
  const db = options.db ?? defaultPrisma;
  const env = options.env ?? process.env;
  const currentDatabase = options.actualDatabaseName ?? await actualDatabase(db);
  assertDemoEnrichmentEnvironment(env, currentDatabase, { testOnly: options.testOnly });
  const ownerEmail = (env.SUKOON_STAGING_REVIEW_EMAIL ?? "akshay-review@sukoon.local").trim().toLowerCase();
  const owner = await db.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) throw new Error("DEMO_ENRICHMENT_OWNER_MISSING");
  const workspace = await db.workspace.findUnique({ where: { ownerUserId: owner.id } });
  if (!workspace) throw new Error("DEMO_ENRICHMENT_WORKSPACE_MISSING");
  const properties = await db.property.findMany({ where: { workspaceId: workspace.id, status: "active", name: { in: ["Vijay Nagar House", "Palm Meadows Apartment", "Super Corridor Plot"] } } });
  const byName = new Map(properties.map((property) => [property.name, property]));
  const required = ["Vijay Nagar House", "Palm Meadows Apartment", "Super Corridor Plot"];
  if (required.some((name) => !byName.has(name))) throw new Error(`DEMO_ENRICHMENT_BASELINE_PROPERTY_MISSING:${required.filter((name) => !byName.has(name)).join(",")}`);
  const propertyBySlot = { primary: byName.get("Vijay Nagar House")!, secondary: byName.get("Palm Meadows Apartment")!, construction: byName.get("Super Corridor Plot")! };
  // The versioned anchor is intentional: rerunning the seed later must reconcile
  // the same records rather than silently creating a new month's history.
  const plan = buildDemoEnrichmentPlan(options.asOf ?? DEMO_ENRICHMENT_ANCHOR_DATE);
  const created: Record<string, number> = {};
  const skipped: Record<string, number> = {};
  const conflicts: string[] = [];
  const markExisting = (kind: string) => increment(skipped, kind);
  const markCreated = (kind: string) => increment(created, kind);

  for (const item of plan.legacyBills) {
    const property = propertyBySlot[item.propertySlot];
    const id = stableDemoEnrichmentId("bill", item.key);
    const existing = await db.bill.findUnique({ where: { id } });
    if (existing) { assertSameWorkspace(existing, workspace.id, property.id); markExisting("legacyBills"); continue; }
    await db.bill.create({ data: { id, workspaceId: workspace.id, propertyId: property.id, type: item.type, title: item.title, amountPaise: BigInt(item.amountPaise), dueDate: item.dueDate, paidDate: item.paidDate, status: item.status, recurring: item.recurring, notes: item.notes, createdAt: atNoon(item.dueDate) } });
    markCreated("legacyBills");
  }

  for (const item of plan.reminders) {
    const property = propertyBySlot[item.propertySlot];
    const id = stableDemoEnrichmentId("reminder", item.key);
    const existing = await db.reminder.findUnique({ where: { id } });
    if (existing) { assertSameWorkspace(existing, workspace.id, property.id); markExisting("reminders"); continue; }
    await db.reminder.create({ data: { id, workspaceId: workspace.id, propertyId: property.id, kind: item.kind, title: item.title, dueDate: item.dueDate, done: item.done, createdAt: atNoon(item.dueDate) } });
    markCreated("reminders");
  }

  for (const item of plan.reminders.filter((reminder) => !reminder.done)) {
    const idempotencyKey = stableRequestKey("reminder", item.key);
    const existing = await db.durableReminder.findUnique({ where: { idempotencyKey: `${idempotencyKey}:IN_APP` } });
    if (existing) {
      assertSameWorkspace(existing, workspace.id, propertyBySlot[item.propertySlot].id);
      markExisting("durableReminders");
      continue;
    }
    await createManualReminderForUser(owner.id, propertyBySlot[item.propertySlot].id, {
      title: item.title,
      body: item.body,
      scheduledDate: item.dueDate,
      sourceType: "FUTURE_EVENT",
      sourceId: stableDemoEnrichmentKey("reminder-source", item.key),
      timezone: "Asia/Kolkata",
      localTime: "09:00",
      channels: ["IN_APP"],
      idempotencyKey,
      deepLink: `/property/${propertyBySlot[item.propertySlot].id}?tab=overview`,
    });
    markCreated("durableReminders");
  }

  for (const item of plan.timeline) {
    const property = propertyBySlot[item.propertySlot];
    const id = stableDemoEnrichmentId("timeline", item.key);
    const existing = await db.timelineEvent.findUnique({ where: { id } });
    if (existing) { assertSameWorkspace(existing, workspace.id, property.id); markExisting("timeline"); continue; }
    await db.timelineEvent.create({ data: { id, workspaceId: workspace.id, propertyId: property.id, date: item.date, title: item.title, detail: item.detail, kind: item.kind, createdAt: atNoon(item.date) } });
    markCreated("timeline");
  }

  for (const item of plan.obligations) {
    const property = propertyBySlot[item.propertySlot];
    const requestKey = stableRequestKey("obligation", item.key);
    const previous = await db.idempotencyRecord.findUnique({ where: { principalUserId_action_requestKey: { principalUserId: owner.id, action: "obligation.create", requestKey } } });
    let obligationId: string;
    if (previous) {
      const response = previous.response as { obligationId?: string };
      if (!response.obligationId) throw new Error("DEMO_ENRICHMENT_IDEMPOTENCY_RECEIPT_INVALID");
      obligationId = response.obligationId;
      markExisting("obligations");
    } else {
      const result = await createObligationForUser(owner.id, property.id, {
        type: item.type,
        label: item.label,
        direction: item.direction,
        amountPaise: item.amountPaise ?? undefined,
        currency: "INR",
        dueDate: item.dueDate,
        timezone: "Asia/Kolkata",
        recurrenceType: "once",
        requestKey,
        reminderConfig: item.reminder ? { enabled: true, beforeDays: [7], localTime: "09:00", channels: ["IN_APP"] } : undefined,
        notes: `${DEMO_ENRICHMENT_NAMESPACE} · self-entered synthetic record; no external reconciliation.`,
      });
      obligationId = result.id;
      markCreated("obligations");
    }
    if (item.paymentAmountPaise) {
      const paymentKey = stableRequestKey("payment", item.key);
      const payment = await db.obligationPayment.findUnique({ where: { idempotencyKey: paymentKey } });
      if (payment) { assertSameWorkspace(payment, workspace.id, property.id); markExisting("payments"); }
      else {
        const occurrence = await db.obligationOccurrence.findFirst({ where: { obligationId, workspaceId: workspace.id }, orderBy: { dueDate: "asc" } });
        if (!occurrence) throw new Error("DEMO_ENRICHMENT_OCCURRENCE_MISSING");
        await recordPaymentForUser(owner.id, occurrence.id, { amountPaise: item.paymentAmountPaise, currency: "INR", paymentDate: item.paymentDate ?? item.dueDate, method: "Owner-recorded synthetic payment", idempotencyKey: paymentKey, notes: `${DEMO_ENRICHMENT_NAMESPACE} · self-reported; not payment-provider verified.` });
        markCreated("payments");
      }
    }
  }

  for (const item of plan.obligations) await listObligationsForUser(owner.id, propertyBySlot[item.propertySlot].id, "all", plan.asOf);

  for (const item of plan.maintenance) {
    const property = propertyBySlot[item.propertySlot];
    const createKey = stableRequestKey("maintenance", item.key);
    const updateKey = stableRequestKey("maintenance-update", item.key);
    let row = await db.maintenance.findUnique({ where: { idempotencyKey: createKey } });
    if (!row) {
      const initialStatus = item.status === "RESOLVED" ? "IN_PROGRESS" : item.status === "CANCELLED" ? "OPEN" : item.status;
      const result = await createMaintenanceForUser(owner.id, property.id, { title: item.title, category: item.category, status: initialStatus, provider: "Synthetic owner-entered service", dateReported: item.dateReported, dateStarted: item.dateStarted, dateCompleted: null, estimatedAmount: item.estimatedAmountPaise ? BigInt(item.estimatedAmountPaise) : null, finalAmount: item.finalAmountPaise ? BigInt(item.finalAmountPaise) : null, warrantyExpiry: item.warrantyExpiry, location: item.location, notes: item.notes }, createKey);
      row = await db.maintenance.findUniqueOrThrow({ where: { id: result.maintenance.id } });
      markCreated("maintenance");
    } else {
      assertSameWorkspace(row, workspace.id, property.id);
      markExisting("maintenance");
    }
    if (row.status !== item.status && (item.status === "RESOLVED" || item.status === "CANCELLED")) {
      const priorUpdate = await db.maintenanceEvent.findUnique({ where: { idempotencyKey: updateKey } });
      if (priorUpdate) { markExisting("maintenanceUpdates"); continue; }
      await updateMaintenanceForUser(owner.id, row.id, row.version, { title: item.title, category: item.category, status: item.status, dateReported: item.dateReported, dateStarted: item.dateStarted, dateCompleted: item.dateCompleted, estimatedAmount: item.estimatedAmountPaise ? BigInt(item.estimatedAmountPaise) : null, finalAmount: item.finalAmountPaise ? BigInt(item.finalAmountPaise) : null, warrantyExpiry: item.warrantyExpiry, location: item.location, provider: "Synthetic owner-entered service", notes: item.notes }, updateKey);
      markCreated("maintenanceUpdates");
    } else if (row.status !== item.status) {
      conflicts.push(`maintenance:${item.key}:existing_status_${row.status}`);
    }
  }

  const project = await db.constructionProject.findFirst({ where: { workspaceId: workspace.id, propertyId: propertyBySlot.construction.id, name: "Mehta Residence", archivedAt: null } });
  if (!project) conflicts.push("construction:Mehta Residence_missing");
  if (project) {
    const stages = await db.constructionStage.findMany({ where: { projectId: project.id, workspaceId: workspace.id }, orderBy: { sequence: "asc" } });
    const activeStage = stages.find((stage) => stage.status === "IN_PROGRESS") ?? stages.at(-1);
    for (const item of plan.constructionEvents) {
      const requestKey = stableRequestKey("construction-history", item.key);
      const existing = await db.constructionEvent.findUnique({ where: { projectId_requestKey: { projectId: project.id, requestKey } } });
      if (existing) { markExisting("constructionEvents"); continue; }
      await db.constructionEvent.create({ data: { id: stableDemoEnrichmentId("construction-event", item.key), workspaceId: workspace.id, projectId: project.id, actorId: owner.id, eventType: item.eventType, title: item.title, visibility: "PROJECT", payload: json(item.payload), requestKey, payloadHash: hash(JSON.stringify(item.payload)), createdAt: atNoon(item.date) } });
      markCreated("constructionEvents");
    }
    for (const item of plan.constructionUpdates) {
      const id = stableDemoEnrichmentId("construction-update", item.key);
      const existing = await db.constructionUpdate.findUnique({ where: { id } });
      if (existing) { markExisting("constructionUpdates"); continue; }
      await db.constructionUpdate.create({ data: { id, workspaceId: workspace.id, projectId: project.id, stageId: activeStage?.id ?? null, title: item.title, description: item.description, issueStatus: "NONE", createdBy: owner.id, occurredAt: atNoon(item.date), createdAt: atNoon(item.date) } });
      markCreated("constructionUpdates");
    }
    await enrichConstructionState({ db, ownerId: owner.id, workspaceId: workspace.id, projectId: project.id, propertyId: propertyBySlot.construction.id, activeStageId: activeStage?.id ?? null, created, skipped, conflicts });
  }

  const purchaseWorkspace = await db.purchaseWorkspace.findFirst({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" }, include: { candidates: { orderBy: { createdAt: "asc" } } } });
  const candidate = purchaseWorkspace?.candidates[0];
  if (!purchaseWorkspace || !candidate) conflicts.push("purchase:existing_candidate_missing");
  if (purchaseWorkspace && candidate) await enrichPurchase({ db, ownerId: owner.id, workspaceId: workspace.id, ownerEmail, purchaseWorkspaceId: purchaseWorkspace.id, candidateId: candidate.id, candidateVersion: candidate.version, created, skipped, conflicts, plan });

  return { namespace: DEMO_ENRICHMENT_NAMESPACE, ownerEmail, database: currentDatabase, asOf: plan.asOf, dateRange: plan.dateRange, created, skipped, conflicts, documentsCreated: 0, documentsTouched: false };
}

async function constructionAction(args: { db: Db; ownerId: string; projectId: string; action: string; semanticKey: string; body: Record<string, unknown>; created: Record<string, number>; skipped: Record<string, number> }) {
  const requestKey = stableRequestKey("construction-action", args.semanticKey);
  const existing = await args.db.constructionEvent.findUnique({ where: { projectId_requestKey: { projectId: args.projectId, requestKey } } });
  if (existing) { increment(args.skipped, "constructionActions"); return null; }
  const project = await args.db.constructionProject.findUniqueOrThrow({ where: { id: args.projectId } });
  await mutateConstructionForUser(args.ownerId, args.projectId, { ...args.body, action: args.action, version: project.version, idempotencyKey: requestKey });
  increment(args.created, "constructionActions");
  return args.db.constructionEvent.findUnique({ where: { projectId_requestKey: { projectId: args.projectId, requestKey } } });
}

async function enrichConstructionState(args: { db: Db; ownerId: string; workspaceId: string; projectId: string; propertyId: string; activeStageId: string | null; created: Record<string, number>; skipped: Record<string, number>; conflicts: string[] }) {
  const { db, projectId, activeStageId } = args;
  const existingDecision = await db.constructionDecision.findFirst({ where: { projectId, title: "Electrical layout decision" } });
  if (!existingDecision) await constructionAction({ ...args, action: "DECISION_CREATE", semanticKey: "electrical-layout-decision", body: { stageId: activeStageId, title: "Electrical layout decision", assignedTo: "Rohan Shah", dueDate: "2026-10-02", context: `${DEMO_ENRICHMENT_NAMESPACE} · choose the electrical layout before rough-in; no professional approval is implied.`, options: [{ label: "Proceed with current layout", description: "Synthetic option for owner discussion.", estimatedCostImpactPaise: "0", estimatedScheduleImpactDays: 0 }, { label: "Revise outlet plan", description: "Synthetic alternative for owner discussion.", estimatedCostImpactPaise: "850000", estimatedScheduleImpactDays: 7 }] } });
  const cementIssue = await db.constructionIssue.findFirst({ where: { projectId, title: "Cement shortage" } });
  if (!cementIssue) {
    await constructionAction({ ...args, action: "ISSUE_CREATE", semanticKey: "cement-shortage", body: { stageId: activeStageId, title: "Cement shortage", description: `${DEMO_ENRICHMENT_NAMESPACE} · delivery availability needs owner follow-up; no supplier response is claimed.`, severity: "HIGH", scheduleImpactDays: 6, costImpactPaise: "0" } });
    const createdIssue = await db.constructionIssue.findFirst({ where: { projectId, title: "Cement shortage" } });
    if (createdIssue) await constructionAction({ ...args, action: "ISSUE_UPDATE", semanticKey: "cement-shortage-action-required", body: { issueId: createdIssue.id, status: "ACTION_REQUIRED", description: createdIssue.description, title: createdIssue.title, severity: createdIssue.severity, assignedTo: "BuildCraft Contractors" } });
  }
  const contractorIssue = await db.constructionIssue.findFirst({ where: { projectId, title: "Contractor invoice review" } });
  if (!contractorIssue) {
    await constructionAction({ ...args, action: "ISSUE_CREATE", semanticKey: "contractor-invoice-review", body: { stageId: activeStageId, title: "Contractor invoice review", description: `${DEMO_ENRICHMENT_NAMESPACE} · owner review pending for a synthetic contractor entry; no payment approval is recorded.`, severity: "MEDIUM", scheduleImpactDays: 0, costImpactPaise: "0" } });
    const createdIssue = await db.constructionIssue.findFirst({ where: { projectId, title: "Contractor invoice review" } });
    if (createdIssue) await constructionAction({ ...args, action: "ISSUE_UPDATE", semanticKey: "contractor-invoice-review-action-required", body: { issueId: createdIssue.id, status: "ACTION_REQUIRED", description: createdIssue.description, title: createdIssue.title, severity: createdIssue.severity, assignedTo: "BuildCraft Contractors" } });
  }
  const inspection = await db.constructionInspection.findFirst({ where: { projectId, title: "Reinforcement inspection follow-up" } });
  if (!inspection) await constructionAction({ ...args, action: "INSPECTION_RECORD", semanticKey: "reinforcement-inspection", body: { stageId: activeStageId, performedBy: "Owner-recorded synthetic inspection", performedAt: "2026-10-02", title: "Reinforcement inspection follow-up", status: "SCHEDULED", result: "RECHECK_REQUIRED", notes: `${DEMO_ENRICHMENT_NAMESPACE} · scheduled owner follow-up, not professional certification.` } });
  const flooringChange = await db.constructionChange.findFirst({ where: { projectId, title: "Approved flooring change" } });
  if (!flooringChange) {
    await constructionAction({ ...args, action: "CHANGE_PROPOSE", semanticKey: "approved-flooring-change-propose", body: { stageId: activeStageId, title: "Approved flooring change", reason: `${DEMO_ENRICHMENT_NAMESPACE} · synthetic owner preference change.`, originalScope: "Standard flooring allowance", revisedScope: "Updated flooring selection", estimatedCostImpactPaise: "175000", estimatedScheduleImpactDays: 5 } });
    const change = await db.constructionChange.findFirst({ where: { projectId, title: "Approved flooring change" } });
    if (change) {
      await constructionAction({ ...args, action: "CHANGE_IMPACT", semanticKey: "approved-flooring-change-impact", body: { changeId: change.id, estimatedCostImpactPaise: "175000", estimatedScheduleImpactDays: 5 } });
      await constructionAction({ ...args, action: "CHANGE_DECIDE", semanticKey: "approved-flooring-change-approve", body: { changeId: change.id, decision: "APPROVE", actualCostImpactPaise: "175000", actualScheduleImpactDays: 5 } });
    }
  }
  let steel = await db.materialRequirement.findFirst({ where: { projectId, name: "TMT Steel" } });
  if (!steel) {
    await constructionAction({ ...args, action: "MATERIAL_CREATE", semanticKey: "tmt-steel", body: { stageId: activeStageId, category: "Structure", name: "TMT Steel", quantity: "7.2", unit: "tonnes", requiredByDate: "2026-10-06", estimatedUnitRatePaise: "61000", status: "QUOTE_REQUIRED" } });
    steel = await db.materialRequirement.findFirst({ where: { projectId, name: "TMT Steel" } });
  }
  if (steel) {
    const procurement = await db.procurementNeed.findUnique({ where: { projectId_materialId: { projectId, materialId: steel.id } } });
    if (!procurement) await constructionAction({ ...args, action: "PROCUREMENT_SET", semanticKey: "tmt-steel-procurement", body: { materialId: steel.id, status: "QUOTE_REQUIRED", notes: `${DEMO_ENRICHMENT_NAMESPACE} · active procurement discussion; no supplier quote or external order is claimed.` } });
  }
  const milestones = [
    ["First-floor slab casting", "2026-10-04"],
    ["Electrical rough-in start", "2026-10-20"],
  ] as const;
  for (const [name, plannedDate] of milestones) {
    if (!await db.constructionMilestone.findFirst({ where: { projectId, name } })) await constructionAction({ ...args, action: "MILESTONE_CREATE", semanticKey: `milestone-${slug(name)}`, body: { stageId: activeStageId, name, plannedDate, status: "PLANNED", description: `${DEMO_ENRICHMENT_NAMESPACE} · owner-entered future milestone.` } });
  }
}

async function enrichPurchase(args: { db: Db; ownerId: string; workspaceId: string; ownerEmail: string; purchaseWorkspaceId: string; candidateId: string; candidateVersion: number; created: Record<string, number>; skipped: Record<string, number>; conflicts: string[]; plan: DemoEnrichmentPlan }) {
  const principal = { userId: args.ownerId, workspaceId: args.workspaceId, email: args.ownerEmail, role: "owner" as const };
  const updateKey = stableRequestKey("purchase-candidate", "negotiation-position");
  const existingHistory = await args.db.purchaseEntry.findUnique({ where: { requestKey: updateKey } });
  if (!existingHistory) {
    try {
      await purchaseCommand(principal, { action: "update-candidate", candidateId: args.candidateId, version: args.candidateVersion, name: "Riverfront Residency — Unit 1204", propertyType: "3 BHK Apartment", location: "Synthetic Indore riverfront district", askingPrice: "18000000", budget: "17200000", source: "Synthetic seller discussion", notes: `${DEMO_ENRICHMENT_NAMESPACE} · asking ₹1.80 Cr; current discussion around ₹1.72 Cr; not binding and not legally verified.`, stage: "REVIEWING", requestKey: updateKey });
      increment(args.created, "purchaseCandidateUpdates");
    } catch (error) {
      args.conflicts.push(`purchase:candidate_update:${error instanceof Error ? error.message : "conflict"}`);
    }
  } else increment(args.skipped, "purchaseCandidateUpdates");
  for (const item of args.plan.purchaseEntries) {
    const requestKey = stableRequestKey("purchase-entry", item.key);
    const existing = await args.db.purchaseEntry.findUnique({ where: { requestKey } });
    let entryId: string;
    if (existing) { if (existing.workspaceId !== args.workspaceId || existing.candidateId !== args.candidateId) throw new Error("DEMO_ENRICHMENT_ID_COLLISION"); entryId = existing.id; increment(args.skipped, "purchaseEntries"); }
    else {
      const result = await purchaseCommand(principal, { action: "add-entry", candidateId: args.candidateId, kind: item.kind, body: item.body, requestKey });
      entryId = result.id;
      await args.db.purchaseEntry.update({ where: { id: entryId }, data: { createdAt: atNoon(shift(args.plan.asOf, item.dateOffset)) } });
      increment(args.created, "purchaseEntries");
    }
    if (item.key === "parking-question") {
      const answerKey = stableRequestKey("purchase-answer", item.key);
      const prior = await args.db.purchaseEvidenceEvent.findUnique({ where: { requestKey: answerKey } });
      if (prior) increment(args.skipped, "purchaseNotes");
      else {
        const fresh = await args.db.purchaseEntry.findUniqueOrThrow({ where: { id: entryId } });
        await recordPurchaseEvidence(principal, { candidateId: args.candidateId, entryId, version: fresh.version, action: "ANSWER", note: "Owner note: response still awaited; no seller response is represented.", source: "USER_NOTE", requestKey: answerKey });
        increment(args.created, "purchaseNotes");
      }
    }
  }
}

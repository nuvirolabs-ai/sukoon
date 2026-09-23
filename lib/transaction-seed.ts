import { createHash } from "node:crypto";
import path from "node:path";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { purchaseCommand } from "@/lib/purchases";
import { recordPurchaseEvidence } from "@/lib/purchase-evidence";
import { transactionCommand } from "@/lib/transactions";
import { shiftScenarioDate } from "@/lib/construction-populate";

export const TRANSACTION_DEMO_NAMESPACE = "SUKOON_TRANSACTION_DEMO_V1" as const;
const DATABASE = "sukoon_demo_staging";

type Db = PrismaClient;
type Counts = Record<string, number>;
export type TransactionSeedReport = {
  namespace: typeof TRANSACTION_DEMO_NAMESPACE;
  operation: "plan" | "apply" | "verify";
  anchorDate: string;
  created: Counts;
  skipped: Counts;
  conflicts: string[];
  checks: Array<{ id: string; status: "PASS" | "FAIL"; detail: string }>;
};

function key(label: string) {
  return `txn${createHash("sha256").update(`${TRANSACTION_DEMO_NAMESPACE}:${label}`).digest("hex").slice(0, 24)}`;
}
function bump(target: Counts, name: string) { target[name] = (target[name] ?? 0) + 1; }

export function assertTransactionSeedEnvironment(env: NodeJS.Dict<string> = process.env, actualDatabaseName?: string, options: { testOnly?: boolean } = {}) {
  if (env.APP_ENV !== "staging" || env.NODE_ENV !== "production" || env.SUKOON_RUNTIME_PROFILE !== "STAGING") throw new Error("TRANSACTION_SEED_STAGING_REQUIRED");
  if (env.SUKOON_TRANSACTION_DEMO_CONFIRMATION !== TRANSACTION_DEMO_NAMESPACE) throw new Error("TRANSACTION_SEED_CONFIRMATION_REQUIRED");
  if (env.SUKOON_DATA_DIR && path.resolve(env.SUKOON_DATA_DIR) === path.resolve(".data")) throw new Error("TRANSACTION_SEED_LOCAL_DATA_FORBIDDEN");
  let configured: string | null = null;
  try { configured = decodeURIComponent(new URL(env.DATABASE_URL ?? "").pathname.slice(1)); } catch { configured = null; }
  const allowedTest = options.testOnly && actualDatabaseName && /^sukoon_s02_test_[a-zA-Z0-9_-]+$/.test(actualDatabaseName);
  if (configured !== DATABASE || (actualDatabaseName !== undefined && actualDatabaseName !== DATABASE && !allowedTest)) throw new Error("TRANSACTION_SEED_DATABASE_SCOPE_INVALID");
}

async function manifest(db: Db, workspaceId: string, subjectType: string, anchor: string, operation: "plan" | "apply") {
  const existing = await db.scenarioManifest.findUnique({ where: { namespace_workspaceId_subjectType: { namespace: TRANSACTION_DEMO_NAMESPACE, workspaceId, subjectType } } });
  const fingerprint = createHash("sha256").update(`${TRANSACTION_DEMO_NAMESPACE}:${subjectType}:${anchor}`).digest("hex");
  if (existing && existing.anchorDate !== anchor) return { anchor: existing.anchorDate, conflict: "anchor_conflict" as const };
  if (existing && existing.fingerprint !== fingerprint) return { anchor: existing.anchorDate, conflict: "fingerprint_conflict" as const };
  if (operation === "apply" && !existing) {
    await db.scenarioManifest.create({ data: { id: `scenario-${createHash("sha256").update(`${workspaceId}:${subjectType}`).digest("hex").slice(0, 24)}`, namespace: TRANSACTION_DEMO_NAMESPACE, workspaceId, subjectType, anchorDate: anchor, fingerprint, status: "APPLIED", report: { subjectType } } });
  }
  return { anchor: existing?.anchorDate ?? anchor, conflict: null };
}

export async function runTransactionSeed(options: { operation?: "plan" | "apply" | "verify"; db?: Db; env?: NodeJS.Dict<string>; actualDatabaseName?: string; testOnly?: boolean; anchorDate?: string } = {}): Promise<TransactionSeedReport> {
  const db = options.db ?? defaultPrisma;
  const env = options.env ?? process.env;
  const operation = options.operation ?? "plan";
  const rows = options.actualDatabaseName ? [{ name: options.actualDatabaseName }] : await db.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assertTransactionSeedEnvironment(env, rows[0]?.name, { testOnly: options.testOnly });
  const ownerEmail = (env.SUKOON_STAGING_REVIEW_EMAIL ?? "akshay-review@sukoon.local").trim().toLowerCase();
  const owner = await db.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) throw new Error("TRANSACTION_SEED_OWNER_MISSING");
  const workspace = await db.workspace.findUnique({ where: { ownerUserId: owner.id } });
  if (!workspace) throw new Error("TRANSACTION_SEED_WORKSPACE_MISSING");
  const principal = { userId: owner.id, workspaceId: workspace.id, email: owner.email, role: "owner" as const };
  const stored = await db.scenarioManifest.findFirst({ where: { namespace: TRANSACTION_DEMO_NAMESPACE, workspaceId: workspace.id } });
  const anchor = stored?.anchorDate ?? options.anchorDate ?? "2026-09-23";
  const report: TransactionSeedReport = { namespace: TRANSACTION_DEMO_NAMESPACE, operation, anchorDate: anchor, created: {}, skipped: {}, conflicts: [], checks: [] };
  if (operation === "plan") {
    report.checks.push({ id: "plan", status: "PASS", detail: "Read-only plan. Apply writes only inside this workspace." });
    return report;
  }
  for (const subject of ["BUY_ACTIVE", "SELL_ACTIVE", "HANDOVER_REHEARSAL"]) {
    const result = await manifest(db, workspace.id, subject, anchor, operation === "verify" ? "plan" : "apply");
    report.anchorDate = result.anchor;
    if (result.conflict) report.conflicts.push(`${subject}:${result.conflict}`);
  }
  if (report.conflicts.length) return report;
  if (operation === "apply") {
    await seedBuy(db, principal, report.anchorDate, report);
    await seedSale(db, principal, report.anchorDate, report);
    await seedHandover(db, principal, report.anchorDate, report);
  }
  await verify(db, workspace.id, report);
  return report;
}

async function seedBuy(db: Db, principal: { userId: string; workspaceId: string; email: string; role: "owner" }, anchor: string, report: TransactionSeedReport) {
  const on = (days: number) => shiftScenarioDate(anchor, days);
  let candidate = await db.purchaseCandidate.findFirst({ where: { workspaceId: principal.workspaceId, name: "Riverfront Residency — Unit 1204" } });
  const candidateExisted = Boolean(candidate);
  if (!candidate) {
    const workspace = await purchaseCommand(principal, { action: "create-workspace", name: "Riverfront purchase", requestKey: key("buy-workspace") });
    const created = await purchaseCommand(principal, { action: "add-candidate", purchaseWorkspaceId: workspace.id, name: "Riverfront Residency — Unit 1204", propertyType: "flat", location: "Synthetic Indore riverfront", askingPrice: "18000000", budget: "17200000", source: "Owner-entered synthetic discussion", notes: "Private buyer target stays in this workspace.", stage: "REVIEWING", requestKey: key("buy-candidate") });
    candidate = await db.purchaseCandidate.findUniqueOrThrow({ where: { id: created.id } });
    bump(report.created, "candidate");
  } else bump(report.skipped, "candidate");
  const fresh = await db.purchaseCandidate.findUniqueOrThrow({ where: { id: candidate.id } });
  if (fresh.askingPricePaise === null) {
    await purchaseCommand(principal, { action: "update-candidate", candidateId: fresh.id, version: fresh.version, name: fresh.name, propertyType: fresh.propertyType, location: fresh.location, askingPrice: "18000000", budget: "17200000", source: fresh.source, notes: fresh.notes, stage: "REVIEWING", requestKey: key("buy-asking") });
  }
  await transactionCommand(principal, { action: "set-phase", candidateId: fresh.id, version: (await db.purchaseCandidate.findUniqueOrThrow({ where: { id: fresh.id } })).version, phase: "NEGOTIATING", lifecycle: "ACTIVE", requestKey: key("buy-phase") });
  const first = await transactionCommand(principal, { action: "record-offer", candidateId: fresh.id, amountRupees: "16800000", authorSource: "OWNER_ENTERED", offeredOn: on(-21), status: "RECORDED", terms: { note: "Initial buyer offer" }, requestKey: key("buy-offer-1") });
  const counter = await transactionCommand(principal, { action: "record-offer", candidateId: fresh.id, amountRupees: "17500000", authorSource: "OWNER_REPORTED_SELLER", offeredOn: on(-14), previousOfferId: first.id, status: "RECORDED", terms: { note: "Owner-recorded seller counter. The seller did not submit this in Sukoon." }, requestKey: key("buy-offer-2") });
  await transactionCommand(principal, { action: "record-offer", candidateId: fresh.id, amountRupees: "17200000", authorSource: "OWNER_ENTERED", offeredOn: on(-7), previousOfferId: counter.id, status: "RECORDED", terms: { note: "Latest buyer offer" }, requestKey: key("buy-offer-3") });
  await transactionCommand(principal, { action: "set-financing", candidateId: fresh.id, status: "EXPLORING", sourceOfFunds: "Intended home loan", requestedRupees: "11800000", conditions: "", requestKey: key("buy-finance") });
  await transactionCommand(principal, { action: "add-visit", candidateId: fresh.id, startsOn: on(2), contactName: "Owner-recorded visit", notes: "Planned privately. No invitation was sent.", requestKey: key("buy-visit") });
  const parking = await purchaseCommand(principal, { action: "add-entry", candidateId: fresh.id, kind: "QUESTION", body: "Which parking space is allocated?", dueDate: on(1), requestKey: key("q-parking") });
  await purchaseCommand(principal, { action: "add-entry", candidateId: fresh.id, kind: "QUESTION", body: "What are the current society dues?", requestKey: key("q-dues") });
  const appliances = await purchaseCommand(principal, { action: "add-entry", candidateId: fresh.id, kind: "QUESTION", body: "Are the listed appliances included?", requestKey: key("q-appliances") });
  const applianceRow = await db.purchaseEntry.findUniqueOrThrow({ where: { id: appliances.id } });
  if (applianceRow.state === "OPEN") {
    await recordPurchaseEvidence(principal, { candidateId: fresh.id, entryId: appliances.id, version: applianceRow.version, action: "ANSWER", note: "You recorded the seller's response: refrigerator and chimney were described as included.", source: "USER_NOTE", requestKey: key("q-appliances-answer") });
    const answered = await db.purchaseEntry.findUniqueOrThrow({ where: { id: appliances.id } });
    await recordPurchaseEvidence(principal, { candidateId: fresh.id, entryId: appliances.id, version: answered.version, action: "RESOLVE", note: "Owner marked this recorded response resolved.", source: "USER_NOTE", requestKey: key("q-appliances-resolve") });
  }
  await purchaseCommand(principal, { action: "add-entry", candidateId: fresh.id, kind: "DOCUMENT_REQUEST", body: "Latest tax receipt", dueDate: on(3), requestKey: key("req-tax") });
  await purchaseCommand(principal, { action: "add-entry", candidateId: fresh.id, kind: "DOCUMENT_REQUEST", body: "Seller ownership paper", requestKey: key("req-ownership") });
  await purchaseCommand(principal, { action: "add-entry", candidateId: fresh.id, kind: "DOCUMENT_REQUEST", body: "Parking allocation record", requestKey: key("req-parking") });
  await purchaseCommand(principal, { action: "add-entry", candidateId: fresh.id, kind: "NOTE", body: "Parking: one space is claimed. Supporting paper is not added.", requestKey: key("note-parking") });
  void parking;
  bump(candidateExisted ? report.skipped : report.created, "buy-scene");
}

async function seedSale(db: Db, principal: { userId: string; workspaceId: string; email: string; role: "owner" }, anchor: string, report: TransactionSeedReport) {
  const on = (days: number) => shiftScenarioDate(anchor, days);
  const property = await db.property.findFirst({ where: { workspaceId: principal.workspaceId, name: "Palm Meadows Apartment", status: "active" } });
  if (!property) {
    report.conflicts.push("sale:Palm Meadows Apartment_missing");
    return;
  }
  const saleExisted = Boolean(await db.saleWorkspace.findUnique({ where: { requestKey: key("sale-workspace") } }));
  const sale = await transactionCommand(principal, { action: "create-sale", propertyId: property.id, askingPrice: "8500000", possessionTargetDate: on(60), description: "Private sale preparation. This does not publish a listing.", requestKey: key("sale-workspace") });
  const priya = await transactionCommand(principal, { action: "add-prospect", saleWorkspaceId: sale.id, name: "Priya Shah", source: "Owner-entered enquiry", privateNotes: "Seller-only note. Not visible to the other prospect.", requestKey: key("prospect-priya") });
  const nikhil = await transactionCommand(principal, { action: "add-prospect", saleWorkspaceId: sale.id, name: "Nikhil Jain", source: "Owner-entered enquiry", privateNotes: "Separate prospect. Offer is not shared with Priya Shah.", requestKey: key("prospect-nikhil") });
  await transactionCommand(principal, { action: "record-offer", prospectId: priya.id, amountRupees: "8100000", authorSource: "OWNER_REPORTED_BUYER", offeredOn: on(-5), status: "RECORDED", terms: { source: "Owner recorded Priya Shah's offer" }, requestKey: key("offer-priya") });
  await transactionCommand(principal, { action: "record-offer", prospectId: nikhil.id, amountRupees: "8300000", authorSource: "OWNER_REPORTED_BUYER", offeredOn: on(-2), status: "RECORDED", terms: { source: "Owner recorded Nikhil Jain's offer" }, requestKey: key("offer-nikhil") });
  await transactionCommand(principal, { action: "add-visit", prospectId: nikhil.id, startsOn: on(3), contactName: "Nikhil Jain", notes: "Planned visit. No message was sent.", requestKey: key("visit-nikhil") });
  await transactionCommand(principal, { action: "add-visit", prospectId: priya.id, startsOn: on(-4), contactName: "Priya Shah", notes: "Owner recorded a completed visit conversation.", requestKey: key("visit-priya") });
  await db.transactionVisit.updateMany({ where: { requestKey: key("visit-priya") }, data: { status: "COMPLETED" } });
  const room = await transactionCommand(principal, { action: "invite", subjectType: "SALE", subjectId: sale.id, roleLabel: "VIEWER", inviteeEmail: "unaccepted-preview@sukoon.local", expiresInDays: 7, requestKey: key("sale-invite-unused") });
  const grant = await db.dealGrant.findUnique({ where: { id: room.id } });
  if (grant && grant.status !== "REVOKED") await transactionCommand(principal, { action: "revoke-grant", grantId: room.id, requestKey: key("sale-invite-revoke") });
  await transactionCommand(principal, { action: "add-note", audience: "AUTHOR_PRIVATE", body: "Saved for your follow-up: maintenance dues information. This was not sent to a buyer.", requestKey: key("sale-followup") });
  bump(saleExisted ? report.skipped : report.created, "sale-scene");
}

async function seedHandover(db: Db, principal: { userId: string; workspaceId: string; email: string; role: "owner" }, anchor: string, report: TransactionSeedReport) {
  const on = (days: number) => shiftScenarioDate(anchor, days);
  let candidate = await db.purchaseCandidate.findFirst({ where: { workspaceId: principal.workspaceId, name: "Lakeview Apartment — Unit 502" } });
  const candidateExisted = Boolean(candidate);
  if (!candidate) {
    const workspace = await purchaseCommand(principal, { action: "create-workspace", name: "Lakeview handover rehearsal", requestKey: key("handover-workspace") });
    const created = await purchaseCommand(principal, { action: "add-candidate", purchaseWorkspaceId: workspace.id, name: "Lakeview Apartment — Unit 502", propertyType: "flat", location: "Synthetic lake district", areaValue: "1180", areaUnit: "sqft", askingPrice: "17300000", source: "Separate handover rehearsal", stage: "REVIEWING", requestKey: key("handover-candidate") });
    candidate = await db.purchaseCandidate.findUniqueOrThrow({ where: { id: created.id } });
  }
  const version = (await db.purchaseCandidate.findUniqueOrThrow({ where: { id: candidate.id } })).version;
  await transactionCommand(principal, { action: "set-phase", candidateId: candidate.id, version, phase: "HANDOVER", lifecycle: "ACTIVE", requestKey: key("handover-phase") });
  await transactionCommand(principal, { action: "revise-terms", candidateId: candidate.id, snapshot: { priceRupees: "17300000", reportedBy: "OWNER_REPORTED", registrationVerified: false }, requestKey: key("handover-terms") });
  for (const line of [["token", "500000", "Token"], ["milestone", "11800000", "Milestone"], ["completion", "5000000", "Completion"]] as const) {
    await transactionCommand(principal, { action: "add-plan-line", candidateId: candidate.id, amountRupees: line[1], label: line[2], classification: "PRICE", dueDate: on(14), requestKey: key(`plan-${line[0]}`) });
  }
  await transactionCommand(principal, { action: "record-money", candidateId: candidate.id, amountRupees: "200000", kind: "POSTED", allocation: "PRICE", occurredOn: on(-20), source: "OWNER_REPORTED", note: "Self-reported token portion.", requestKey: key("money-1") });
  await transactionCommand(principal, { action: "record-money", candidateId: candidate.id, amountRupees: "100000", kind: "POSTED", allocation: "PRICE", occurredOn: on(-10), source: "OWNER_REPORTED", note: "Self-reported token portion.", requestKey: key("money-2") });
  await transactionCommand(principal, { action: "update-handover", candidateId: candidate.id, status: "IN_PROGRESS", plannedDate: on(14), items: [
    { label: "Keys", disposition: "OPEN" },
    { label: "Meter readings", disposition: "OPEN" },
    { label: "Included fixtures", disposition: "OPEN" },
    { label: "Pending dues", disposition: "OPEN" },
  ], requestKey: key("handover-items") });
  bump(candidateExisted ? report.skipped : report.created, "handover-scene");
}

async function verify(db: Db, workspaceId: string, report: TransactionSeedReport) {
  const buy = await db.purchaseCandidate.findFirst({ where: { workspaceId, name: "Riverfront Residency — Unit 1204" }, include: { entries: true } });
  const offers = buy ? await db.offerRevision.count({ where: { candidateId: buy.id } }) : 0;
  const payments = buy ? await db.transactionMoneyRecord.count({ where: { candidateId: buy.id } }) : 0;
  const sale = await db.saleWorkspace.findFirst({ where: { workspaceId }, include: { prospects: true, property: true } });
  const lake = await db.purchaseCandidate.findFirst({ where: { workspaceId, name: "Lakeview Apartment — Unit 502" } });
  const money = lake ? await db.transactionMoneyRecord.findMany({ where: { candidateId: lake.id } }) : [];
  const net = money.reduce((sum, row) => sum + (row.kind === "POSTED" ? row.amountPaise : -row.amountPaise), 0n);
  const push = (id: string, ok: boolean, detail: string) => report.checks.push({ id, status: ok ? "PASS" : "FAIL", detail });
  push("T01", Boolean(buy) && buy?.linkedPropertyId == null, "Riverfront remains a candidate.");
  push("T04", offers === 3, `Riverfront offers ${offers}.`);
  push("T06", payments === 0, "Negotiating scene has no recorded payment.");
  push("T12", (sale?.prospects.length ?? 0) === 2, `Sale prospects ${sale?.prospects.length ?? 0} on ${sale?.property.name ?? "missing"}.`);
  push("T07", net === 30000000n, `Handover net price payments ${net.toString()} paise.`);
}

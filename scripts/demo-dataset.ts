// SYNTHETIC DEMO DATASET v1. Development-only, local database only.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// The runner composes several domain DTOs with generated Prisma shapes; its runtime guards
// are the safety boundary while the imported domain functions remain typed.
// @ts-nocheck
import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { createPropertyForUser } from "../lib/property-repository";
import { createDocumentForUser } from "../lib/vault-repository";
import { confirmManualDocumentReview } from "../lib/document-review";
import { runDocumentJobOnce, localDocumentProcessingDependencies, documentProcessingDependenciesForEnvironment } from "../lib/document-processing";
import { createMaintenanceForUser, updateMaintenanceForUser, linkMaintenanceDocumentForUser } from "../lib/maintenance";
import { createObligationForUser, markOccurrenceCompletedForUser, updateObligationForUser } from "../lib/obligations";
import { recordPaymentForUser } from "../lib/payments";
import { purchaseCommand, purchaseSnapshot } from "../lib/purchases";
import { recordPurchaseEvidence } from "../lib/purchase-evidence";
import { createConstructionForUser, mutateConstructionForUser } from "../lib/construction";
import { createShareInvitationForUser, acceptShareInvitationForUser, revokeShareForUser } from "../lib/sharing";
import { createPrivacyRequest } from "../lib/privacy-requests";
import { requestAccountExport, runAccountExportOnce } from "../lib/account-export";
import { JobOwnershipError } from "../lib/worker";
import { demoPaise, demoRupees, DEMO_MONEY_EXPECTATIONS } from "../lib/demo-money";
import { createRuleDraftForOperator, transitionRuleForOperator, updateRuleDraftForOperator } from "../lib/rules";
import { evaluatePropertyHealthForUser } from "../lib/assessment";
import { assertStagingSeedEnvironment, stagingSeedCapabilities, STAGING_DATABASE_NAME } from "../lib/staging-seed-policy";

const VERSION = "1";
const reviewSeed = process.argv[2] === "client-review";
const seedPrefix = reviewSeed ? "client-review-v1" : "demo-v1";
const OWNER = reviewSeed ? (process.env.SUKOON_CLIENT_REVIEW_EMAIL ?? "akshay-review@sukoon.local") : "demo-owner@sukoon.local";
const PERSONAS = {
  owner: OWNER, lawyer: reviewSeed ? "akshay-review-lawyer@sukoon.local" : "demo-lawyer@sukoon.local", architect: reviewSeed ? "akshay-review-architect@sukoon.local" : "demo-architect@sukoon.local", coowner: reviewSeed ? "akshay-review-coowner@sukoon.local" : "demo-coowner@sukoon.local", buyer: reviewSeed ? "akshay-review-buyer@sukoon.local" : "demo-buyer@sukoon.local", operator: reviewSeed ? "akshay-review-operator@sukoon.local" : "demo-operator@sukoon.local",
};
const APPROVED_DB = "sukoon_s02_local_20260911";
const stagingSeed = process.env.APP_ENV === "staging" && process.env.SUKOON_RUNTIME_PROFILE === "STAGING";
const root = path.resolve(process.env.SUKOON_DATA_DIR ?? ".data");
const markerDir = path.join(root, "synthetic-demo");
const markerPath = path.join(markerDir, reviewSeed ? `${seedPrefix}.json` : "dataset-v1.json");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const id = (label) => `${seedPrefix}-${sha(label).slice(0, 24)}`;
const key = (label) => `${seedPrefix}-${label}`;
const today = new Date();
const iso = (days) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
const at = (days) => new Date(today.getTime() + days * 86400000);
const paise = (rupees) => demoPaise(String(rupees));
const j = (value) => JSON.parse(JSON.stringify(value, (_k, v) => typeof v === "bigint" ? v.toString() : v));
const syntheticPdf = (title) => {
  const safe = title.replace(/[()\\]/g, "");
  const stream = `BT /F1 16 Tf 54 760 Td (${safe}) Tj 0 -28 Td /F1 10 Tf (SYNTHETIC DEMO DATASET - no real people, addresses or documents) Tj ET`;
  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) { offsets.push(Buffer.byteLength(pdf)); pdf += object; }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
};
async function demoBytes(title) {
  if (stagingSeed || reviewSeed) return syntheticPdf(title);
  try { return await readFile(path.resolve("output/pdf/t01-purchase-evidence-synthetic.pdf")); }
  catch { return syntheticPdf(title); }
}

async function guard() {
  const row = await prisma.$queryRaw`SELECT current_database() AS name`;
  if (stagingSeed) {
    assertStagingSeedEnvironment(process.env, row[0]?.name);
    return;
  }
  if (reviewSeed) {
    if (process.env.NODE_ENV === "production" || process.env.APP_ENV !== "local" || process.env.SUKOON_RUNTIME_PROFILE !== "CLIENT_REVIEW") throw new Error("DEMO_CLIENT_REVIEW_ONLY");
    if (row[0]?.name !== APPROVED_DB) throw new Error(`DEMO_DATABASE_NOT_APPROVED:${row[0]?.name}`);
    if (root !== path.resolve(".data")) throw new Error(`DEMO_STORAGE_ROOT_NOT_APPROVED:${root}`);
    return;
  }
  if (process.env.NODE_ENV === "production" || process.env.APP_ENV !== "local") throw new Error("DEMO_LOCAL_ONLY");
  if (row[0]?.name !== APPROVED_DB) throw new Error(`DEMO_DATABASE_NOT_APPROVED:${row[0]?.name}`);
  if (root !== path.resolve(".data")) throw new Error(`DEMO_STORAGE_ROOT_NOT_APPROVED:${root}`);
}
async function user(email, name, role = "owner") { return prisma.user.upsert({ where: { email }, update: { name, role }, create: { id: id(`user:${email}`), email, name, role, emailVerified: true } }); }
async function workspace(ownerUserId, name) { return prisma.workspace.upsert({ where: { ownerUserId }, update: { name }, create: { id: id(`workspace:${ownerUserId}`), ownerUserId, name } }); }
async function property(ownerId, data) {
  const ws = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: ownerId } });
  const existing = await prisma.property.findFirst({ where: { workspaceId: ws.id, name: data.name } });
  if (existing) return existing;
  return (await createPropertyForUser(ownerId, { ...data, jurisdiction: "Synthetic demo / Indore", ownershipAssertion: "self_asserted", ownershipProvenance: "SYNTHETIC DEMO DATASET v1 - owner-entered, not government verified" })).property;
}
async function document(ownerId, propertyId, label, category, storage) {
  const ws = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: ownerId } });
  const prior = await prisma.propertyDoc.findFirst({ where: { workspaceId: ws.id, propertyId, name: label, deletedAt: null } });
  if (prior) return prior;
  const result = await createDocumentForUser({ userId: ownerId, propertyId, category, displayName: label, filename: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`, mimeType: "application/pdf", bytes: await demoBytes(label), storage, idempotencyKey: key(`doc-${sha(`${propertyId}:${label}`).slice(0, 24)}`) });
  return result.document;
}
async function processDocs(ownerId) {
  if (stagingSeed) {
    const ws = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: ownerId } });
    const clean = await prisma.propertyDoc.findMany({ where: { workspaceId: ws.id, name: { startsWith: "Demo" }, scanStatus: "clean", reviewStatus: "awaiting_review" } });
    for (const doc of clean) await confirmManualDocumentReview({ userId: ownerId, documentId: doc.id, documentVersion: doc.version, category: doc.type });
    return { queuedForWorker: true, cleanReviewed: clean.length };
  }
  const deps = localDocumentProcessingDependencies();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const ws = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: ownerId } });
  for (let i = 0; i < 240; i++) {
    let job = null;
    try { job = await runDocumentJobOnce(`synthetic-demo-seed-${VERSION}`, deps); }
    catch (error) { if (!(error instanceof JobOwnershipError)) throw error; }
    const pending = await prisma.propertyDoc.count({ where: { workspaceId: ws.id, name: { startsWith: "Demo" }, scanStatus: { not: "clean" } } });
    if (!pending) break;
    if (!job) await wait(250);
  }
  const pending = await prisma.propertyDoc.count({ where: { workspaceId: ws.id, name: { startsWith: "Demo" }, scanStatus: { not: "clean" } } });
  if (pending) throw new Error(`DEMO_DOCUMENT_PROCESSING_TIMEOUT:${pending}`);
  const docs = await prisma.propertyDoc.findMany({ where: { workspaceId: ws.id, name: { startsWith: "Demo" }, scanStatus: "clean", reviewStatus: "awaiting_review" } });
  for (const doc of docs) await confirmManualDocumentReview({ userId: ownerId, documentId: doc.id, documentVersion: doc.version, category: doc.type });
}
async function timeline(ws, propertyId, title, detail, date = iso(0), kind = "demo") { await prisma.timelineEvent.upsert({ where: { id: id(`timeline:${propertyId}:${title}`) }, update: { detail, date }, create: { id: id(`timeline:${propertyId}:${title}`), workspaceId: ws, propertyId, title, detail, date, kind } }); }

const DEMO_RULE_SOURCE = "Synthetic demo content — not legal advice — v1";
async function ensureDemoRule(operatorId, input) {
  let rule = await prisma.checklistRule.findFirst({ where: { stableKey: input.stableKey, status: { in: ["DRAFT", "IN_REVIEW", "PUBLISHED"] } }, orderBy: { version: "desc" } });
  if (!rule) rule = await createRuleDraftForOperator(operatorId, input);
  if (rule.status === "PUBLISHED") return rule;
  if (rule.status === "DRAFT") {
    await transitionRuleForOperator(operatorId, rule.id, "submit", rule.revision);
    rule = await prisma.checklistRule.findUniqueOrThrow({ where: { id: rule.id } });
  }
  if (rule.status === "IN_REVIEW") {
    rule = await updateRuleDraftForOperator(operatorId, rule.id, { sourceName: DEMO_RULE_SOURCE, sourceReference: { kind: "synthetic_demo", dataset: "SYNTHETIC DEMO DATASET v1", reviewedFor: "local demo readiness walkthrough" }, sourcePublishedDate: iso(0), reviewer: "Synthetic demo operator", reviewedAt: at(0) }, rule.revision);
    return transitionRuleForOperator(operatorId, rule.id, "publish", rule.revision);
  }
  throw new Error(`DEMO_RULE_UNEXPECTED_STATUS:${input.stableKey}:${rule.status}`);
}
async function seed() {
  await guard();
  const capabilities = stagingSeedCapabilities();
  const documentsAvailable = capabilities.documents === "available";
  const dependencies = stagingSeed ? documentProcessingDependenciesForEnvironment() : localDocumentProcessingDependencies();
  if (!stagingSeed) await mkdir(markerDir, { recursive: true, mode: 0o700 });
  const owner = await user(PERSONAS.owner, reviewSeed ? "Akshay Review" : "Aarav Mehta"), lawyer = await user(PERSONAS.lawyer, "Synthetic Lawyer"), architect = await user(PERSONAS.architect, "Synthetic Architect"), coowner = await user(PERSONAS.coowner, "Synthetic Co-owner"), buyer = await user(PERSONAS.buyer, "Synthetic Buyer"), operator = await user(PERSONAS.operator, "Synthetic Operator", "operator"); void buyer; void operator;
  const ws = await workspace(owner.id, reviewSeed ? "SUKOON CLIENT REVIEW — synthetic dataset" : "SYNTHETIC DEMO DATASET v1 — Aarav Mehta");
  const displayName = reviewSeed ? "Akshay Review" : "Aarav Mehta";
  const p1 = await property(owner.id, { name: "Vijay Nagar House", type: "villa", city: "Indore", area: "Vijay Nagar", address: "Synthetic Vijay Nagar, Indore", areaValue: "2450", areaUnit: "sqft", areaType: "built_up", ownerName: displayName, purchaseDate: "2019-06-15", purchaseValue: "14500000", loanActive: true, loanBalance: "4250000", insuranceUntil: iso(120), occupancy: "self", coOwners: "Naina Mehta" });
  const p2 = await property(owner.id, { name: "Palm Meadows Apartment", type: "flat", city: "Indore", area: "Synthetic township", address: "Synthetic Palm Meadows, Indore", areaValue: "1650", areaUnit: "sqft", areaType: "carpet", ownerName: displayName, purchaseDate: "2022-03-20", purchaseValue: "9200000", insuranceUntil: iso(300), occupancy: "self" });
  const p3 = await property(owner.id, { name: "Super Corridor Plot", type: "plot", city: "Indore", area: "Super Corridor", address: "Synthetic Super Corridor, Indore", areaValue: "2400", areaUnit: "sqft", areaType: "plot", plotSizeSqft: 2400, ownerName: displayName, purchaseDate: "2024-01-10", purchaseValue: "6500000", occupancy: "vacant" });
  const docs = {};
  if (documentsAvailable) for (const [label, category, prop] of [
    ["Demo Registry — Vijay Nagar", "Registry", p1],
    ["Demo Mutation — Vijay Nagar", "Naamantaran (mutation)", p1],
    ["Demo Property Tax Receipt — Vijay Nagar", "Tax receipt", p1],
    ["Demo Insurance Policy — Vijay Nagar", "Insurance", p1],
    ["Demo Sanction Map — Vijay Nagar", "Sanction map", p1],
    ["Demo Electricity Bill — Vijay Nagar", "Other", p1],
    ["Demo Water Bill — Vijay Nagar", "Other", p1],
    ["Demo Waterproofing Invoice — Vijay Nagar", "Receipt", p1],
    ["Demo Maintenance Warranty — Vijay Nagar", "Insurance", p1],
    ["Demo Registry — Palm Meadows", "Registry", p2],
    ["Demo Society NOC — Palm Meadows", "NOC", p2],
    ["Demo Insurance — Palm Meadows", "Insurance", p2],
    ["Demo Registry — Super Corridor", "Registry", p3],
    ["Demo Sanction Map — Super Corridor", "Sanction map", p3],
    ["Demo Architectural Plan — Super Corridor", "Property info", p3],
    ["Demo Structural Drawing — Super Corridor", "Other", p3],
    ["Demo Foundation Invoice — Super Corridor", "Receipt", p3],
  ]) docs[label] = await document(owner.id, prop.id, label, category, dependencies.storage);
  if (documentsAvailable) {
    await processDocs(owner.id);
    await document(owner.id, p1.id, "Demo Document Awaiting Review", "Other", dependencies.storage);
    const failed = await document(owner.id, p1.id, "Demo Quarantined Example", "Other", dependencies.storage);
    await prisma.propertyDoc.update({ where: { id: failed.id }, data: { notes: "Synthetic demonstration: leave quarantined until the ordinary worker is available." } });
  }
  // Bills and owner-entered obligations use the existing tables and relative dates.
  const billRows = [["Property Tax", 18450, 18, "pending"], ["Electricity", 4850, 7, "pending"], ["Water", 730, -5, "paid"], ["Society maintenance", 2200, -12, "paid"]];
  for (const [title, amount, days, status] of billRows) await prisma.bill.upsert({ where: { id: id(`bill:${title}`) }, update: { dueDate: iso(days), status }, create: { id: id(`bill:${title}`), workspaceId: ws.id, propertyId: p1.id, type: title === "Property Tax" ? "Property tax" : title, title, amountPaise: paise(amount), dueDate: iso(days), status, paidDate: status === "paid" ? iso(days - 2) : null, notes: "SYNTHETIC DEMO DATASET v1" } });
  for (const [title, amount, days, prop] of [["Property Tax", "18450", 18, p1], ["Electricity", "4850", 7, p1], ["Insurance renewal", null, 120, p1], ["Society maintenance", "2200", 35, p2], ["Loan instalment", "25000", 28, p1]]) {
    const existing = await prisma.obligation.findFirst({ where: { workspaceId: ws.id, propertyId: prop.id, label: title } });
    const obligationInput = { type: title === "Insurance renewal" ? "Renewal" : "Utility", label: title, direction: amount === null ? "NON_FINANCIAL" : "PAYABLE", amount: amount === null ? undefined : demoRupees(amount), currency: "INR", dueDate: iso(days), timezone: "Asia/Kolkata", recurrenceType: title === "Loan instalment" ? "quarterly" : "once", requestKey: key(`obligation-${sha(title).slice(0, 20)}`) };
    if (!existing) await createObligationForUser(owner.id, prop.id, obligationInput);
    else if ((existing.amountPaise === null ? null : existing.amountPaise.toString()) !== (amount === null ? null : paise(amount).toString()) || existing.dueDate !== iso(days)) await updateObligationForUser(owner.id, existing.id, existing.version, obligationInput);
  }
  const waterOb = await prisma.obligation.findFirst({ where: { workspaceId: ws.id, propertyId: p1.id, label: "Water" } });
  if (!waterOb) {
    const ob = await createObligationForUser(owner.id, p1.id, { type: "Utility", label: "Water", direction: "PAYABLE", amount: demoRupees(DEMO_MONEY_EXPECTATIONS.waterTotal), currency: "INR", dueDate: iso(-5), timezone: "Asia/Kolkata", recurrenceType: "once", requestKey: key("obligation-water") });
    const occ = await prisma.obligationOccurrence.findFirstOrThrow({ where: { obligationId: ob.id } });
    await recordPaymentForUser(owner.id, occ.id, { amount: demoRupees(DEMO_MONEY_EXPECTATIONS.waterTotal), currency: "INR", paymentDate: iso(-5), method: "Owner-recorded demo payment", idempotencyKey: key("water-payment") });
  } else {
    if (waterOb.amountPaise?.toString() !== paise(DEMO_MONEY_EXPECTATIONS.waterTotal).toString()) {
      await updateObligationForUser(owner.id, waterOb.id, waterOb.version, { type: "Utility", label: "Water", direction: "PAYABLE", amount: demoRupees(DEMO_MONEY_EXPECTATIONS.waterTotal), currency: "INR", dueDate: iso(-5), timezone: "Asia/Kolkata", recurrenceType: "once" });
      const repaired = await prisma.obligationOccurrence.findFirstOrThrow({ where: { obligationId: waterOb.id }, orderBy: { dueDate: "asc" } });
      await prisma.obligationOccurrence.update({ where: { id: repaired.id }, data: { amountPaise: paise(DEMO_MONEY_EXPECTATIONS.waterTotal), status: "OPEN", version: { increment: 1 } } });
    }
    const repaired = await prisma.obligationOccurrence.findFirstOrThrow({ where: { obligationId: waterOb.id }, orderBy: { dueDate: "asc" }, include: { payments: { where: { status: "RECORDED", reversalOfId: null } } } });
    const paid = repaired.payments.reduce((total, payment) => total + payment.amountPaise, 0n);
    if (paid < paise(DEMO_MONEY_EXPECTATIONS.waterTotal)) await recordPaymentForUser(owner.id, repaired.id, { amount: demoRupees(DEMO_MONEY_EXPECTATIONS.waterTotal), currency: "INR", paymentDate: iso(-5), method: "Owner-recorded demo payment", idempotencyKey: key("water-payment") });
    const paidOcc = await prisma.obligationOccurrence.findUniqueOrThrow({ where: { id: repaired.id } });
    if (paidOcc.status !== "COMPLETED") await markOccurrenceCompletedForUser(owner.id, repaired.id, paidOcc.version);
  }
  const taxOb = await prisma.obligation.findFirstOrThrow({ where: { workspaceId: ws.id, propertyId: p1.id, label: "Property Tax" } });
  const taxOcc = await prisma.obligationOccurrence.findFirstOrThrow({ where: { obligationId: taxOb.id }, orderBy: { dueDate: "asc" }, include: { payments: { where: { status: "RECORDED", reversalOfId: null } } } });
  const taxPaid = taxOcc.payments.reduce((total, payment) => total + payment.amountPaise, 0n);
  if (taxPaid < paise(DEMO_MONEY_EXPECTATIONS.propertyTaxPayment)) {
    const payment = { amount: demoRupees(DEMO_MONEY_EXPECTATIONS.propertyTaxPayment), currency: "INR", paymentDate: iso(-1), method: "Owner-recorded demo payment", idempotencyKey: key("property-tax-payment"), notes: "Synthetic owner-entered self-reported payment; no provider verification." };
    if (documentsAvailable) {
      const taxReceiptVersion = await prisma.documentVersion.findFirstOrThrow({ where: { documentId: docs["Demo Property Tax Receipt — Vijay Nagar"].id, version: 1 } });
      await recordPaymentForUser(owner.id, taxOcc.id, { ...payment, receiptDocumentId: docs["Demo Property Tax Receipt — Vijay Nagar"].id, receiptDocumentVersionId: taxReceiptVersion.id });
    } else await recordPaymentForUser(owner.id, taxOcc.id, payment);
  }
  for (const [title, kind, days, state] of [["Electricity due soon", "bill", 7, "unread"], ["Property tax payment", "bill", 18, "read"], ["Insurance renewal approaching", "insurance", 120, "snoozed"], ["Maintenance warranty expiry", "maintenance", 90, "upcoming"]]) await prisma.reminder.upsert({ where: { id: id(`reminder:${title}`) }, update: { dueDate: iso(days) }, create: { id: id(`reminder:${title}`), workspaceId: ws.id, propertyId: p1.id, kind, title, dueDate: iso(days), done: state === "read" } });
  for (const [title, category, status, amount, days] of [["Terrace Waterproofing", "Waterproofing", "RESOLVED", 38500, -20], ["Bathroom Leakage", "Plumbing", "RESOLVED", 5850, -45], ["Electrical Check", "Electrical", "IN_PROGRESS", null, -2], ["Exterior Painting", "Painting", "PLANNED", null, 30]]) {
    const found = await prisma.maintenance.findFirst({ where: { workspaceId: ws.id, propertyId: p1.id, task: title } });
    if (!found) { let m = await createMaintenanceForUser(owner.id, p1.id, { title, category, status: status === "RESOLVED" ? "IN_PROGRESS" : "OPEN", provider: "Synthetic owner-entered service", dateReported: iso(days), finalAmount: amount === null ? undefined : String(amount), warrantyExpiry: title === "Terrace Waterproofing" ? iso(90) : undefined, notes: "SYNTHETIC DEMO DATASET v1" }, key(`maint-${sha(title).slice(0, 20)}`)); if (status !== "OPEN") m = await updateMaintenanceForUser(owner.id, m.maintenance.id, m.maintenance.version, { title, category, status, dateReported: iso(days), finalAmount: amount === null ? undefined : String(amount), warrantyExpiry: title === "Terrace Waterproofing" ? iso(90) : undefined, notes: "SYNTHETIC DEMO DATASET v1" }, key(`maint-update-${sha(title).slice(0, 20)}`)); }
  }
  const wp = await prisma.maintenance.findFirst({ where: { workspaceId: ws.id, propertyId: p1.id, task: "Terrace Waterproofing" } }); if (documentsAvailable && wp && docs["Demo Waterproofing Invoice — Vijay Nagar"].scanStatus === "clean") await linkMaintenanceDocumentForUser(owner.id, wp.id, { documentId: docs["Demo Waterproofing Invoice — Vijay Nagar"].id, linkType: "INVOICE" });
  // Active Construction project, with a derived-looking but owner-entered record set.
  let project = await prisma.constructionProject.findFirst({ where: { workspaceId: ws.id, propertyId: p3.id, name: "Mehta Residence" } });
  if (!project) project = await createConstructionForUser(owner.id, { propertyId: p3.id, name: "Mehta Residence", projectType: "NEW_HOME", builtUpArea: "4800", areaUnit: "sqft", floorCount: 3, qualityLevel: "STANDARD", estimatedBudgetPaise: String(paise(12000000)), startDate: iso(-120), targetCompletionDate: iso(360), requirements: "Synthetic G+2 residence; owner-entered requirements.", idempotencyKey: key("construction-mehta") });
  const stages = await prisma.constructionStage.findMany({ where: { projectId: project.id }, orderBy: { sequence: "asc" } });
  const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "IN_PROGRESS", "NOT_STARTED", "NOT_STARTED", "NOT_STARTED"];
  for (let i = 0; i < stages.length; i++) await prisma.constructionStage.update({ where: { id: stages[i].id }, data: { status: statuses[i] ?? "NOT_STARTED", actualStart: i < 6 ? iso(-120 + i * 15) : null, actualEnd: i < 5 ? iso(-30 + i * 6) : null } });
  const stage = stages[5] ?? stages.at(-1); const taskSeed = [["Foundation excavation", "DONE"], ["Footing reinforcement", "DONE"], ["Ground-floor slab", "DONE"], ["First-floor columns", "DONE"], ["First-floor slab casting", "IN_PROGRESS"], ["Electrical conduit planning", "TODO"], ["Material delivery coordination", "BLOCKED"]];
  for (const [title, status] of taskSeed) { const old = await prisma.constructionTask.findFirst({ where: { projectId: project.id, title } }); if (old) await prisma.constructionTask.update({ where: { id: old.id }, data: { status, dueDate: status === "TODO" ? iso(14) : iso(-10), notes: "SYNTHETIC DEMO DATASET v1" } }); else await prisma.constructionTask.create({ data: { id: id(`task:${title}`), workspaceId: ws.id, projectId: project.id, stageId: stage.id, title, status, dueDate: status === "TODO" ? iso(14) : iso(-10), source: "SYNTHETIC_DEMO_DATASET" } }); }
  await prisma.constructionTask.updateMany({ where: { projectId: project.id, stageId: { in: stages.slice(0, 5).map((entry) => entry.id) } }, data: { status: "DONE", completedAt: at(-1), notes: "SYNTHETIC DEMO DATASET v1 — completed workflow record." } });
  if (project.status !== "ACTIVE") {
    await mutateConstructionForUser(owner.id, project.id, { action: "PROJECT_STATUS", status: "ACTIVE", version: project.version, idempotencyKey: key("construction-active") });
    project = await prisma.constructionProject.findUniqueOrThrow({ where: { id: project.id } });
  }
  const budgetRows = [["Civil Work", "3200000"], ["Cement", "900000"], ["Steel", "2800000"], ["Labour", "2400000"], ["Architect", "450000"], ["Electrical", "800000"], ["Plumbing", "650000"], ["Flooring", "300000"], ["Painting", "300000"], ["Fixtures", "200000"]];
  for (const [category, amount] of budgetRows) await prisma.constructionBudgetItem.upsert({ where: { id: id(`budget:${category}`) }, update: { estimatedPaise: paise(amount), notes: "Synthetic owner-entered planning estimate; planned budget total is ₹1.20 Cr." }, create: { id: id(`budget:${category}`), workspaceId: ws.id, projectId: project.id, category, estimatedPaise: paise(amount), notes: "Synthetic owner-entered planning estimate; planned budget total is ₹1.20 Cr." } });
  const materials = [["Cement", "800", "bags", "398", "390"], ["TMT Steel", "7.2", "tonnes", "60500", "61000"], ["AAC Blocks", "1200", "blocks", "68", "66"], ["Sand", "80", "tonnes", "1800", "1764"]];
  for (const [name, quantity, unit, currentRate, previousRate] of materials) {
    const m = await prisma.materialRequirement.upsert({ where: { id: id(`material:${name}`) }, update: { quantity, requiredByDate: iso(21), estimatedUnitRatePaise: paise(currentRate) }, create: { id: id(`material:${name}`), workspaceId: ws.id, projectId: project.id, stageId: stage?.id, category: "Structure", name, quantity, unit, requiredByDate: iso(21), estimatedUnitRatePaise: paise(currentRate), provenance: "USER_ENTERED", status: "PLANNED" } });
    for (const [suffix, rate, date] of [["old", previousRate, -30], ["current", currentRate, -2]]) await prisma.materialPriceEntry.upsert({ where: { id: id(`price:${name}:${suffix}`) }, update: { unit, pricePaise: paise(rate), recordedDate: iso(date), provenance: "USER_ENTERED" }, create: { id: id(`price:${name}:${suffix}`), workspaceId: ws.id, projectId: project.id, materialId: m.id, location: "Indore", recordedDate: iso(date), unit, pricePaise: paise(rate), provenance: "USER_ENTERED" } });
  }
  const constructionDocumentLinks = documentsAvailable ? [[docs["Demo Sanction Map — Super Corridor"], stages[3] ?? stage], [docs["Demo Architectural Plan — Super Corridor"], stages[4] ?? stage], [docs["Demo Structural Drawing — Super Corridor"], stage], [docs["Demo Foundation Invoice — Super Corridor"], stage]] : [];
  for (const [constructionDoc, linkStage] of constructionDocumentLinks) {
    const version = await prisma.documentVersion.findFirst({ where: { documentId: constructionDoc.id, version: constructionDoc.version, scanStatus: "clean" } });
    if (!version) continue;
    const existingLink = await prisma.constructionDocumentLink.findUnique({ where: { projectId_documentVersionId: { projectId: project.id, documentVersionId: version.id } } });
    if (!existingLink) {
      const currentProject = await prisma.constructionProject.findUniqueOrThrow({ where: { id: project.id }, select: { version: true } });
      await mutateConstructionForUser(owner.id, project.id, { action: "DOCUMENT_LINK", version: currentProject.version, idempotencyKey: key(`construction-document-${sha(constructionDoc.id).slice(0, 20)}`), documentId: constructionDoc.id, documentVersionId: version.id, stageId: linkStage?.id, category: "CONSTRUCTION_DOCUMENT" });
    }
  }
  const activeArchitectProjectShare = await prisma.shareLink.findFirst({ where: { workspaceId: ws.id, propertyId: p3.id, inviteeEmail: PERSONAS.architect, revokedAt: null, acceptedAt: { not: null } } });
  if (!activeArchitectProjectShare) {
    const constructionScopes = [
      { capability: "PROPERTY_BASIC_READ" },
      { capability: "CONSTRUCTION_PROJECT_READ" },
      { capability: "CONSTRUCTION_TASK_READ" },
      { capability: "CONSTRUCTION_DOCUMENT_READ" },
      { capability: "CONSTRUCTION_UPDATE_READ" },
      ...constructionDocumentLinks.flatMap(([constructionDoc]) => [{ capability: "DOCUMENT_METADATA_READ", documentId: constructionDoc.id }, { capability: "DOCUMENT_PREVIEW", documentId: constructionDoc.id }]),
    ];
    const invitation = await createShareInvitationForUser(owner.id, p3.id, { inviteeEmail: PERSONAS.architect, role: "ARCHITECT", scopes: constructionScopes, expiresAt: at(180).toISOString(), note: "SYNTHETIC DEMO DATASET v1 — construction read-only scoped access" });
    await acceptShareInvitationForUser(architect.id, PERSONAS.architect, invitation.invitationToken);
  }
  const readinessRules = documentsAvailable ? [
    ["registry", "Registry record", "Registry", "The synthetic owner-entered registry record is present in the local demo vault."],
    ["mutation", "Mutation record", "Naamantaran (mutation)", "The synthetic owner-entered mutation record is present in the local demo vault."],
    ["tax-receipt", "Property tax receipt", "Tax receipt", "The synthetic owner-entered property tax receipt is present in the local demo vault."],
    ["sanction-map", "Sanction map", "Sanction map", "The synthetic owner-entered sanction map is present in the local demo vault."],
    ["insurance", "Insurance record", "Insurance", "The synthetic owner-entered insurance record is present in the local demo vault."],
    ["society-noc", "Society NOC", "NOC", "No synthetic NOC has been added to this property; this is intentionally shown as missing."],
    ["ownership-context", "Ownership context", "NOC", "Applicability remains unknown until the synthetic ownership context is entered by the owner.", "demo_context_not_entered"],
  ] : [["documents-unavailable", "Document evidence", "Registry", "Hosted document upload and scanning are temporarily unavailable in this staging checkpoint; no document is being represented as verified."]];
  for (const [ruleKey, title, evidenceCategory, description, ownershipContext] of readinessRules) await ensureDemoRule(operator.id, { stableKey: `${seedPrefix}-readiness.${ruleKey}`, contentType: "checklist", title, description: `${description} Synthetic demo content only; not legal advice; not production content.`, category: "SYNTHETIC_DEMO", jurisdiction: "Synthetic demo / Indore", propertyType: "villa", ownershipContext: ownershipContext ?? undefined, evidenceCategory, requiresConfirmation: true, effectiveFrom: "2026-01-01" });
  const latestReadiness = await prisma.assessmentSnapshot.findFirst({ where: { workspaceId: ws.id, propertyId: p1.id }, orderBy: { evaluatedAt: "desc" }, include: { items: { select: { id: true } } } });
  if (!latestReadiness || latestReadiness.items.length === 0) await evaluatePropertyHealthForUser(owner.id, p1.id);
  for (const [name, company, role] of [["Rohan Shah", "Synthetic Design Studio", "Architect"], ["BuildCraft Contractors", "BuildCraft Contractors", "Contractor"], ["Anil Deshmukh", "Synthetic Structural Practice", "Structural Engineer"], ["Indore Building Materials", "Indore Building Materials", "Supplier"]]) await prisma.constructionContact.upsert({ where: { id: id(`contact:${name}`) }, update: {}, create: { id: id(`contact:${name}`), workspaceId: ws.id, projectId: project.id, name, company, role, provenance: "OWNER_ENTERED_SYNTHETIC" } });
  for (const [title, detail, days] of [["Foundation completed", "Owner-recorded synthetic update", -60], ["Ground floor slab completed", "Owner-recorded synthetic update", -35], ["First-floor columns started", "Owner-recorded synthetic update", -20], ["Work paused due to rain", "Synthetic issue note; no external weather claim", -14], ["Work resumed", "Owner-recorded synthetic update", -8], ["Current slab preparation underway", "Owner-recorded synthetic update", -1]]) await prisma.constructionUpdate.upsert({ where: { id: id(`update:${title}`) }, update: {}, create: { id: id(`update:${title}`), workspaceId: ws.id, projectId: project.id, stageId: stage?.id, title, description: detail, createdBy: owner.id, occurredAt: at(days) } });
  const existingCost = await prisma.constructionCost.count({ where: { projectId: project.id } }); if (!existingCost) for (const [title, amount] of [["Foundation contractor payment", 1200000], ["Steel procurement", 850000], ["Cement and labour", 640000]]) { const led = await prisma.expenseLedgerEntry.create({ data: { id: id(`ledger:${title}`), workspaceId: ws.id, propertyId: p3.id, amountPaise: paise(amount), currency: "INR", entryType: "CONSTRUCTION_COST", canonicalKey: id(`canonical:${title}`), actorUserId: owner.id } }); await prisma.constructionCost.create({ data: { id: id(`cost:${title}`), workspaceId: ws.id, projectId: project.id, stageId: stage?.id, title, source: "OWNER_ENTERED_SYNTHETIC", recordedDate: iso(-20), ledgerEntryId: led.id } }); }
  // Explicit scoped grants, accepted through the existing invitation service.
  const shareSeeds = [
    [PERSONAS.coowner, "FAMILY", coowner, [{ capability: "PROPERTY_BASIC_READ" }, { capability: "BILLS_READ" }, ...(documentsAvailable ? [{ capability: "DOCUMENT_LIST" }, { capability: "DOCUMENT_METADATA_READ" }, { capability: "DOCUMENT_PREVIEW", documentId: docs["Demo Registry — Vijay Nagar"].id }] : [])]],
    [PERSONAS.lawyer, "LAWYER", lawyer, [{ capability: "PROPERTY_BASIC_READ" }, ...(documentsAvailable ? [{ capability: "DOCUMENT_LIST" }, { capability: "DOCUMENT_METADATA_READ" }, { capability: "DOCUMENT_PREVIEW", documentId: docs["Demo Registry — Vijay Nagar"].id }, { capability: "DOCUMENT_PREVIEW", documentId: docs["Demo Mutation — Vijay Nagar"].id }] : [])]],
    [PERSONAS.architect, "ARCHITECT", architect, [{ capability: "PROPERTY_BASIC_READ" }, ...(documentsAvailable ? [{ capability: "DOCUMENT_LIST" }, { capability: "DOCUMENT_METADATA_READ" }, { capability: "DOCUMENT_PREVIEW", documentId: docs["Demo Sanction Map — Vijay Nagar"].id }] : [])]],
  ];
  for (const [email, role, user, scopes] of shareSeeds) { const existing = await prisma.shareLink.findFirst({ where: { workspaceId: ws.id, propertyId: p1.id, inviteeEmail: email, revokedAt: null } }); if (!existing) { const inv = await createShareInvitationForUser(owner.id, p1.id, { inviteeEmail: email, role, scopes, expiresAt: at(180).toISOString(), note: "SYNTHETIC DEMO DATASET v1 — scoped access" }); await acceptShareInvitationForUser(user.id, email, inv.invitationToken); } }
  const architectShare = await prisma.shareLink.findFirst({ where: { workspaceId: ws.id, propertyId: p1.id, inviteeEmail: PERSONAS.architect, revokedAt: null } }); if (architectShare) { await prisma.shareLinkScope.deleteMany({ where: { shareLinkId: architectShare.id } }); const architectScopes = [{ scopeType: "PROPERTY_BASIC_READ" }, ...(documentsAvailable ? [{ scopeType: "DOCUMENT_LIST", documentId: docs["Demo Sanction Map — Vijay Nagar"].id }, { scopeType: "DOCUMENT_METADATA_READ", documentId: docs["Demo Sanction Map — Vijay Nagar"].id }, { scopeType: "DOCUMENT_PREVIEW", documentId: docs["Demo Sanction Map — Vijay Nagar"].id }] : [])]; await prisma.shareLinkScope.createMany({ data: architectScopes.map((scope) => ({ id: randomUUID(), shareLinkId: architectShare.id, ...scope })) }); }
  const revoked = await prisma.shareLink.findFirst({ where: { workspaceId: ws.id, propertyId: p1.id, inviteeEmail: "demo-revoked@sukoon.local" } }); if (!revoked) { const inv = await createShareInvitationForUser(owner.id, p1.id, { inviteeEmail: "demo-revoked@sukoon.local", role: "FAMILY", scopes: [{ capability: "PROPERTY_BASIC_READ" }], expiresAt: at(30).toISOString(), note: "Synthetic revoked-history example" }); await revokeShareForUser(owner.id, inv.invitation.id); }
  // Private purchase organizer, still not an owned property.
  const principal = { userId: owner.id, workspaceId: ws.id, email: OWNER, role: "owner" as const };
  let purchase = (await purchaseSnapshot(principal))[0]; if (!purchase) { const pw = await purchaseCommand(principal, { action: "create-workspace", name: "Riverfront Residency — Unit 1204", requestKey: key("purchase-workspace") }); const candidate = await purchaseCommand(principal, { action: "add-candidate", purchaseWorkspaceId: pw.id, name: "Riverfront Residency — Unit 1204", propertyType: "3 BHK Apartment", location: "Synthetic Indore riverfront district", askingPrice: "15200000", budget: "14000000", source: "External search / seller reference", notes: "Private due diligence only; not owned and no seller access", stage: "INFORMATION_GATHERING", requestKey: key("purchase-candidate") }); await purchaseCommand(principal, { action: "add-entry", candidateId: candidate.id, kind: "DOCUMENT_REQUEST", body: "Seller Registry — requested, not externally delivered", requestKey: key("purchase-request") }); await purchaseCommand(principal, { action: "add-entry", candidateId: candidate.id, kind: "DOCUMENT_REQUEST", body: "Society NOC — requested, missing", requestKey: key("purchase-noc") }); await purchaseCommand(principal, { action: "add-entry", candidateId: candidate.id, kind: "QUESTION", body: "Which parking allocation belongs to Unit 1204?", requestKey: key("purchase-question") }); await purchaseCommand(principal, { action: "add-entry", candidateId: candidate.id, kind: "QUESTION", body: "Has the latest tax receipt been issued?", requestKey: key("purchase-question-2") }); purchase = (await purchaseSnapshot(principal))[0]; }
  const candidate = purchase.candidates[0], requestEntry = candidate.entries.find(e => e.kind === "DOCUMENT_REQUEST"), question = candidate.entries.find(e => e.kind === "QUESTION");
  if (documentsAvailable) { const pdoc = await createDocumentForUser({ userId: owner.id, purchaseCandidateId: candidate.id, category: "Registry", displayName: "Demo Seller Registry — received", filename: "demo-seller-registry.pdf", mimeType: "application/pdf", bytes: syntheticPdf("Demo Seller Registry"), storage: dependencies.storage, idempotencyKey: key("purchase-doc") }); await processDocs(owner.id); const pv = await prisma.documentVersion.findFirstOrThrow({ where: { documentId: pdoc.document.id, version: 1 } }); if (pv.scanStatus === "clean") { await confirmManualDocumentReview({ userId: owner.id, documentId: pdoc.document.id, documentVersion: 1, category: "Registry" }); await recordPurchaseEvidence(principal, { candidateId: candidate.id, entryId: requestEntry.id, version: 0, action: "RECEIVE", note: "Buyer received this local synthetic upload; not authenticated seller sharing.", source: "BUYER_REPORTED_SELLER", documentVersionId: pv.id, requestKey: key("evidence-receive") }); await recordPurchaseEvidence(principal, { candidateId: candidate.id, entryId: requestEntry.id, version: 1, action: "REVIEW", note: "User reviewed synthetic registry; no legal clearance.", source: "USER_NOTE", documentVersionId: pv.id, requestKey: key("evidence-review") }); } }
  await recordPurchaseEvidence(principal, { candidateId: candidate.id, entryId: question.id, version: 0, action: "ANSWER", note: "Synthetic demo answer: allocation remains unknown without authenticated evidence.", source: "USER_NOTE", requestKey: key("question-answer") }); await recordPurchaseEvidence(principal, { candidateId: candidate.id, entryId: question.id, version: 1, action: "RESOLVE", note: "Resolved for demo walkthrough; not a verified fact.", source: "USER_NOTE", requestKey: key("question-resolve") }); await recordPurchaseEvidence(principal, { candidateId: candidate.id, entryId: question.id, version: 2, action: "REOPEN", note: "Reopened because actual allocation is still unknown.", source: "USER_NOTE", requestKey: key("question-reopen") });
  await timeline(ws.id, p1.id, "Synthetic demo dataset created", "Owner-entered demo records; no government or live-provider verification."); await timeline(ws.id, p3.id, "Construction demo activity", "Mehta Residence synthetic progress and owner-entered spend.");
  // Add a real account export via its durable workflow, if one is not already present.
  const exportRequest = reviewSeed || !documentsAvailable ? null : await prisma.privacyRequest.findFirst({ where: { userId: owner.id, kind: "EXPORT_ACCOUNT" } }); if (!exportRequest && !reviewSeed && documentsAvailable) { const req = await createPrivacyRequest(owner.id, { kind: "EXPORT_ACCOUNT", requestKey: key("export-request"), confirmed: true }); await requestAccountExport(owner.id, req.id, { confirmed: true, scope: "account-owned-records-v1", expiresAt: at(7).toISOString() }); if (!stagingSeed) await runAccountExportOnce("synthetic-demo-export", dependencies.storage); }
  if (!stagingSeed) await writeFile(markerPath, JSON.stringify({ dataset: "SYNTHETIC DEMO DATASET", version: VERSION, seededAt: today.toISOString(), owner: OWNER, database: APPROVED_DB, storageRoot: root, personas: PERSONAS, properties: [p1.id, p2.id, p3.id], activeProject: project.id, purchaseCandidateId: candidate.id }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(j({ status: stagingSeed ? "SEEDED_PARTIAL_STAGING" : "SEEDED", dataset: "SYNTHETIC DEMO DATASET", version: VERSION, signIn: stagingSeed ? (capabilities.email === "available" ? "Use the approved staging SMTP flow; no local sandbox mailbox is used." : "Hosted SMTP is unavailable; no local access-code login is enabled.") : "http://localhost:3100/ then enter email, Send OTP, use the code shown by local sandbox, Open passport", personas: PERSONAS, properties: [p1, p2, p3], activeProject: project, purchaseCandidateId: candidate.id, ...(stagingSeed ? { database: STAGING_DATABASE_NAME, documentProcessing: documentsAvailable ? "queued for the independent staging worker" : "unavailable until private storage and scanning are provisioned", documents: documentsAvailable ? "available" : "unavailable", storage: documentsAvailable ? "private S3-compatible staging storage" : "not provisioned" } : { markerPath }) })));
}
async function reset() {
  if (stagingSeed) throw new Error("DEMO_RESET_LOCAL_ONLY");
  await guard(); let marker = { dataset: "SYNTHETIC DEMO DATASET", version: VERSION, database: APPROVED_DB, storageRoot: root }; try { marker = JSON.parse(await readFile(markerPath, "utf8")); } catch {} if (marker.dataset !== "SYNTHETIC DEMO DATASET" || marker.version !== VERSION || marker.database !== APPROVED_DB || marker.storageRoot !== root) throw new Error("DEMO_MARKER_MISMATCH");
  const demoEmails = Object.values(PERSONAS); const rows = await prisma.user.findMany({ where: { email: { in: demoEmails } }, select: { id: true, email: true } }); if (rows.some(r => r.id !== id(`user:${r.email}`))) throw new Error("DEMO_RESET_REFUSES_UNEXPECTED_IDENTITY");
  const ownerRow = rows.find(r => r.email === OWNER); if (ownerRow) { const workspaceIds = (await prisma.workspace.findMany({ where: { ownerUserId: ownerRow.id }, select: { id: true } })).map(w => w.id); if (workspaceIds.length !== 1 || workspaceIds[0] !== id(`workspace:${ownerRow.id}`)) throw new Error("DEMO_RESET_WORKSPACE_NOT_EXACT"); }
  for (const uid of rows.map(r => r.id)) { const files = await import("node:fs/promises").then(fs => fs.readdir(path.join(root, uid)).catch(() => [])); for (const file of files) await rm(path.join(root, uid, file), { recursive: true, force: true }); await rm(path.join(root, uid), { recursive: true, force: true }); }
  await prisma.user.deleteMany({ where: { id: { in: rows.map(r => r.id) } } }); await rm(markerDir, { recursive: true, force: true }); console.log(JSON.stringify({ status: "RESET", deletedDemoEmails: rows.map(r => r.email), preservedOtherAccounts: true }));
}
async function main() { if (process.argv[2] === "reset") await reset(); else if (!process.argv[2] || process.argv[2] === "seed" || process.argv[2] === "staging" || process.argv[2] === "client-review") await seed(); else throw new Error("USE_SEED_OR_RESET"); }
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

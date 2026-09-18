// CONSTRUCTION_AB_V1 canonical seed. V1-only, local database only.
//
// Seeds real domain records (never UI hardcoding) for the canonical
// acceptance scenario: Super Corridor Plot / Mehta Residence. All personas,
// money, dates and documents are synthetic. Documents are processed by the
// ordinary local worker pipeline (real scan), never fixture verdicts.
//
// Reseed is safe: fixed idempotency keys replay identically, and an explicit
// scoped wipe removes only this synthetic project's construction rows before
// rebuilding when prior mutations diverged.
import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { createPropertyForUser } from "../lib/property-repository";
import { createDocumentForUser } from "../lib/vault-repository";
import { confirmManualDocumentReview } from "../lib/document-review";
import {
  runDocumentJobOnce,
  localDocumentProcessingDependencies,
} from "../lib/document-processing";
import {
  createConstructionForUser,
  mutateConstructionForUser,
} from "../lib/construction";

const SCENARIO_ID = "CONSTRUCTION_AB_V1";
const OWNER_EMAIL = "construction-ab-owner@example.com";
const PERSONAS = [
  { name: "Aarav Mehta", email: OWNER_EMAIL, role: "OWNER", company: "" },
  { name: "Ankit Shah", email: "construction-ab-architect@example.com", role: "ARCHITECT", company: "Shah Studio" },
  { name: "Neha Kulkarni", email: "construction-ab-engineer@example.com", role: "STRUCTURAL_ENGINEER", company: "Kulkarni Structurals" },
  { name: "Ravi Sharma", email: "construction-ab-contractor@example.com", role: "CONTRACTOR", company: "Ravi Buildcon" },
  { name: "Priya Nair", email: "construction-ab-pm@example.com", role: "PROJECT_MANAGER", company: "Sukoon PM (synthetic)" },
];
const K = (label: string) => `ab-v1-${label}`;
const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

async function guard() {
  if (process.env.NODE_ENV === "production" || process.env.APP_ENV !== "local")
    throw new Error("AB_SEED_LOCAL_ONLY");
  const row = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (!/^sukoon_s02_local_[a-zA-Z0-9_-]+$/.test(row[0]?.name ?? ""))
    throw new Error(`AB_SEED_DATABASE_NOT_APPROVED:${row[0]?.name ?? "<empty>"}`);
}

async function ensureUser(email: string, name: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: { id: `ab-v1-${createHash("sha256").update(email).digest("hex").slice(0, 16)}`, email, name, role: "owner", emailVerified: true },
  });
}

async function wipeScoped(projectId: string, workspaceId: string, propertyId: string) {
  // Scoped to this synthetic scenario project only. Deleting the project row
  // cascades to every construction child table (composite project FKs).
  // Canonical ledger rows are removed explicitly (Restrict guard), then the
  // project, its reminders and its construction timeline entries.
  const costs = await prisma.constructionCost.findMany({ where: { projectId }, select: { ledgerEntryId: true } });
  const ledgerIds = costs.flatMap((c) => (c.ledgerEntryId ? [c.ledgerEntryId] : []));
  // Delete the project first: cascade removes costs (releasing the Restrict
  // guard), then orphaned canonical ledger rows for this scenario go.
  await prisma.constructionProject.deleteMany({ where: { id: projectId, workspaceId } });
  if (ledgerIds.length)
    await prisma.expenseLedgerEntry.deleteMany({
      where: { workspaceId, propertyId, OR: [{ id: { in: ledgerIds } }, { reversalOfId: { in: ledgerIds } }, { replacementForId: { in: ledgerIds } }] },
    });
  await prisma.durableReminder.deleteMany({ where: { workspaceId, idempotencyKey: { startsWith: `construction:${projectId}:` } } });
  await prisma.timelineEvent.deleteMany({ where: { workspaceId, propertyId, id: { startsWith: "construction:" } } });
}

function syntheticPdf(title: string): Uint8Array {
  const safe = title.replace(/[()\\]/g, "");
  const stream = `BT /F1 16 Tf 54 760 Td (${safe}) Tj 0 -28 Td /F1 10 Tf (SYNTHETIC CONSTRUCTION_AB_V1 - no real people, addresses or documents) Tj ET`;
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
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

async function main() {
  await guard();
  const owner = await ensureUser(OWNER_EMAIL, "Aarav Mehta");
  for (const persona of PERSONAS.slice(1)) await ensureUser(persona.email, persona.name);
  const workspace = await prisma.workspace.upsert({
    where: { ownerUserId: owner.id },
    update: {},
    create: { id: `ab-v1-workspace-${owner.id.slice(0, 8)}`, ownerUserId: owner.id, name: "AB V1 Household" },
  });

  let property = await prisma.property.findFirst({ where: { workspaceId: workspace.id, name: "Super Corridor Plot" } });
  if (!property) {
    const created = await createPropertyForUser(owner.id, {
        name: "Super Corridor Plot",
        type: "plot",
        city: "Indore",
        area: "Super Corridor",
        address: "Synthetic plot for construction acceptance",
        jurisdiction: "Synthetic demo / Indore",
        areaValue: "4800",
        areaUnit: "sqft",
        areaType: "plot",
        ownerName: "Aarav Mehta",
        ownershipAssertion: "self_asserted",
        ownershipProvenance: "SYNTHETIC CONSTRUCTION_AB_V1 - owner-entered, not government verified",
        identifiers: [],
      });
    property = await prisma.property.findUniqueOrThrow({ where: { id: (created.property as { id: string }).id } });
  }
  const prop = property as NonNullable<typeof property>;

  const projectId = `build-${createHash("sha256").update(JSON.stringify([owner.id, K("project")])).digest("hex").slice(0, 32)}`;
  const existing = await prisma.constructionProject.findFirst({ where: { id: projectId } });
  if (existing) {
    console.log("AB seed: scoped reset of prior scenario mutations…");
    await wipeScoped(projectId, workspace.id, prop.id);
  }
  {
    await createConstructionForUser(owner.id, {
      propertyId: prop.id,
      name: "Mehta Residence",
      projectType: "NEW_HOME",
      builtUpArea: "4800",
      areaUnit: "sqft",
      floorCount: 3,
      qualityLevel: "STANDARD",
      estimatedBudgetPaise: "1200000000",
      startDate: day(-120),
      targetCompletionDate: day(240),
      requirements: "G+2 residence for Aarav Mehta. Synthetic owner-entered requirements only.",
      idempotencyKey: K("project"),
    });
  }

  const { getConstructionForUser } = await import("../lib/construction");
  let view = await getConstructionForUser(owner.id, projectId, true);
  if (view.status === "PLANNING") {
    view = await mutateConstructionForUser(owner.id, projectId, { action: "PROJECT_STATUS", status: "ACTIVE", version: view.version, idempotencyKey: K("status-active") });
  }
  const cmd = async (action: string, data: Record<string, unknown> = {}) => {
    view = await mutateConstructionForUser(owner.id, projectId, { action, version: view.version, idempotencyKey: K(`${view.version}-${action}-${createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 12)}`), ...data });
    return view;
  };
  const stageByName = (name: string) => view.stages.find((s) => s.name === name)!;
  const tasksIn = (stageId: string) => view.tasks.filter((t) => t.stageId === stageId);

  // Team (synthetic personas).
  for (const persona of PERSONAS) {
    await cmd("CONTACT_CREATE", { name: persona.name, company: persona.company, role: persona.role, email: persona.email, notes: "SYNTHETIC CONSTRUCTION_AB_V1 persona. Added by owner; no verification implied." });
  }

  // Journey: complete everything through Foundation; RCC / Structure active.
  for (const name of ["Pre-Construction", "Survey & Site Preparation", "Design", "Approvals", "Foundation"]) {
    const stage = stageByName(name);
    if (["NOT_STARTED", "READY"].includes(stage.status)) await cmd("STAGE_UPDATE", { stageId: stage.id, status: "IN_PROGRESS" });
    for (const task of tasksIn(stage.id)) {
      if (!["DONE", "CANCELLED"].includes(task.status)) await cmd("TASK_UPDATE", { stageId: stage.id, taskId: task.id, status: "DONE" });
    }
    const fresh = stageByName(name);
    if (!["COMPLETED", "SKIPPED"].includes(fresh.status)) await cmd("STAGE_UPDATE", { stageId: stage.id, status: "COMPLETED" });
  }
  const rcc = stageByName("RCC / Structure");
  if (["NOT_STARTED", "READY"].includes(rcc.status)) await cmd("STAGE_UPDATE", { stageId: rcc.id, status: "IN_PROGRESS" });
  for (const task of tasksIn(rcc.id)) {
    if (task.title === "Record structural work" && task.status !== "DONE")
      await cmd("TASK_UPDATE", { stageId: rcc.id, taskId: task.id, status: "DONE" });
  }

  // Current work state.
  await cmd("TASK_CREATE", { stageId: rcc.id, title: "Beam reinforcement for first-floor slab", status: "DONE" });
  await cmd("TASK_CREATE", { stageId: rcc.id, title: "Electrical conduit preparation", status: "IN_PROGRESS" });
  await cmd("TASK_CREATE", { stageId: rcc.id, title: "Slab reinforcement preparation", status: "IN_PROGRESS" });
  await cmd("TASK_CREATE", { stageId: rcc.id, title: "Slab casting", plannedStart: undefined });
  const conduit = view.tasks.find((t) => t.title === "Electrical conduit preparation")!;
  if (!view.tasks.some((t) => t.title === "Slab casting")) throw new Error("AB_SEED_TASK_MISSING");

  await cmd("MILESTONE_CREATE", { stageId: rcc.id, name: "First-floor slab", plannedDate: day(4), description: "First-floor slab casting. Depends on electrical layout decision, conduit work and reinforcement inspection." });
  const slabMilestone = view.milestones.find((m) => m.name === "First-floor slab")!;
  await cmd("MILESTONE_UPDATE", { milestoneId: slabMilestone.id, status: "IN_PROGRESS" });

  await cmd("PLAN_VERSION_CREATE", { label: "Baseline G+2 plan", notes: "Seeded baseline for the acceptance scenario." });
  const planV1 = view.planVersions.find((p) => p.versionNumber === 1)!;
  await cmd("PLAN_VERSION_ACTIVATE", { planVersionId: planV1.id });

  // Blocking decision.
  await cmd("DECISION_CREATE", {
    title: "Electrical layout approval",
    context: "Requested by Ankit Shah (Architect). Slab casting is recorded for slab week and conduit work depends on this decision.",
    assignedTo: "Aarav Mehta",
    workItemId: conduit.id,
    dueDate: day(3),
    options: [
      { label: "Approve layout v3 as shared", description: "Proceed with the architect's latest shared layout.", estimatedCostImpactPaise: "0", estimatedScheduleImpactDays: 0 },
      { label: "Request changes to switch positions", description: "Two switch positions move; adds conduit rework.", estimatedCostImpactPaise: "1500000", estimatedScheduleImpactDays: 2 },
    ],
  });
  const decision = view.decisions.find((d) => d.title === "Electrical layout approval")!;

  // Inspection tomorrow (scheduled, not yet recorded as complete).
  await cmd("INSPECTION_RECORD", {
    title: "Reinforcement inspection",
    performedBy: "Neha Kulkarni",
    performedAt: day(1),
    status: "SCHEDULED",
    stageId: rcc.id,
    workItemId: conduit.id,
    notes: "Scheduled reinforcement check before slab casting. Recorded observation only; not a certification.",
  });
  const inspection = view.inspections.find((i) => i.title === "Reinforcement inspection")!;

  // Dependencies: decision -> conduit -> slab; inspection -> slab.
  await cmd("DEPENDENCY_CREATE", { predecessorType: "DECISION", predecessorId: decision.id, successorType: "WORK_ITEM", successorId: conduit.id });
  await cmd("DEPENDENCY_CREATE", { predecessorType: "WORK_ITEM", predecessorId: conduit.id, successorType: "MILESTONE", successorId: slabMilestone.id });
  await cmd("DEPENDENCY_CREATE", { predecessorType: "INSPECTION", predecessorId: inspection.id, successorType: "MILESTONE", successorId: slabMilestone.id });

  // Money: categories + ₹26.90L recorded spend.
  await cmd("BUDGET_SET", { category: "Structure", estimatedPaise: "600000000" });
  await cmd("BUDGET_SET", { category: "Materials", estimatedPaise: "400000000" });
  await cmd("BUDGET_SET", { category: "Labour and services", estimatedPaise: "200000000" });
  const budgetOf = (category: string) => view.budgets.find((b) => b.category === category)!.id;
  const foundationStage = stageByName("Foundation");
  await cmd("COST_RECORD", { source: "USER_RECORDED_EXPENSE", title: "Foundation contractor payment", amountPaise: "120000000", recordedDate: day(-20), stageId: foundationStage.id, budgetItemId: budgetOf("Structure") });
  await cmd("COST_RECORD", { source: "USER_RECORDED_EXPENSE", title: "Steel procurement", amountPaise: "85000000", recordedDate: day(-12), stageId: rcc.id, budgetItemId: budgetOf("Materials") });
  await cmd("COST_RECORD", { source: "USER_RECORDED_EXPENSE", title: "Cement and labour", amountPaise: "64000000", recordedDate: day(-6), stageId: rcc.id, budgetItemId: budgetOf("Labour and services") });

  // Invoice awaiting owner review (commitment, not spend).
  await cmd("COMMITMENT_CREATE", { title: "Contractor invoice — Ravi Buildcon", amountPaise: "24000000", vendorOrPersonId: "Ravi Buildcon", expectedBy: day(7), sourceType: "INVOICE", status: "DRAFT", notes: "Awaiting owner review. No payment implied." });

  // Cement order + short delivery (400 ordered, 390 received).
  await cmd("MATERIAL_CREATE", { category: "Cement", name: "Cement", quantity: "400", unit: "bags", requiredByDate: day(2), estimatedUnitRatePaise: "38000" });
  const cement = view.materials.find((m) => m.name === "Cement")!;
  await cmd("ORDER_PLACE", { materialRequirementId: cement.id, supplierName: "Ravi Buildcon", orderedQuantity: "400", unit: "bags", totalPaise: "15200000", expectedDelivery: day(2) });
  const cementOrder = view.orders.find((o) => o.materialRequirementId === cement.id)!;
  await cmd("DELIVERY_RECORD", { orderId: cementOrder.id, expectedQuantity: "400", receivedQuantity: "390", unit: "bags", receivedBy: "Ravi Sharma", receivedAt: day(0), notes: "Challan count verified at site." });

  // Steel requirement + three recorded quotes (no live market rates).
  await cmd("MATERIAL_CREATE", { category: "Steel", name: "TMT steel", quantity: "2.8", unit: "tonnes", requiredByDate: day(8), estimatedUnitRatePaise: "6050000" });
  const steel = view.materials.find((m) => m.name === "TMT steel")!;
  await cmd("QUOTE_RECORD", { materialRequirementId: steel.id, supplierName: "Supplier A", quantity: "2.8", unit: "tonnes", unitRatePaise: "6020000", totalPaise: "16856000", deliveryDate: day(1) });
  await cmd("QUOTE_RECORD", { materialRequirementId: steel.id, supplierName: "Supplier B", quantity: "2.8", unit: "tonnes", unitRatePaise: "5980000", totalPaise: "16744000", deliveryDate: day(3) });
  await cmd("QUOTE_RECORD", { materialRequirementId: steel.id, supplierName: "Supplier C", quantity: "2.8", unit: "tonnes", unitRatePaise: "6100000", totalPaise: "17080000", deliveryDate: day(0) });

  // Approved change: bedroom flooring upgrade.
  const flooringTask = view.tasks.find((t) => t.title === "Record flooring work");
  await cmd("CHANGE_PROPOSE", {
    title: "Bedroom flooring upgrade",
    reason: "Owner chose premium finish for two bedrooms.",
    originalScope: "Flooring at Rs.120 per sq ft.",
    revisedScope: "Flooring at Rs.190 per sq ft for two bedrooms.",
    estimatedCostImpactPaise: "18200000",
    estimatedScheduleImpactDays: 3,
    affectedWorkItemIds: flooringTask ? [flooringTask.id] : [],
  });
  const change = view.changes.find((c) => c.title === "Bedroom flooring upgrade")!;
  await cmd("CHANGE_DECIDE", { changeId: change.id, decision: "APPROVE" });

  // Site update yesterday with 6 photos.
  await cmd("UPDATE_CREATE", {
    stageId: rcc.id,
    title: "Beam reinforcement completed",
    description: "Beam reinforcement completed. Electrical conduit work started.",
    occurredDate: day(-1),
    photoRefs: ["site:beam-1", "site:beam-2", "site:beam-3", "site:conduit-1", "site:conduit-2", "site:overview-1"],
    weatherNote: "Rain delayed morning work by two hours.",
  });

  // Structural drawing: two genuine revisions through the Vault pipeline.
  // Idempotent across reseeds: Vault rows keep the latest upload's
  // idempotency key, so identity here is content-based (clean versions of
  // this synthetic property's drawing), never key-based.
  const deps = localDocumentProcessingDependencies();
  async function pumpClean(documentId: string) {
    for (let i = 0; i < 120; i++) {
      try { await runDocumentJobOnce("ab-v1-seed", deps); } catch { break; }
      const pending = await prisma.documentVersion.count({ where: { documentId, scanStatus: { not: "clean" } } });
      if (!pending) break;
    }
  }
  async function loadDrawing() {
    return prisma.propertyDoc.findFirst({
      where: { workspaceId: workspace.id, propertyId: prop.id, name: "Structural Drawing", deletedAt: null },
      include: { versions: { orderBy: { version: "asc" } } },
    });
  }
  // One-time convergence: an earlier reseed left a single-revision duplicate;
  // keep the richest record, drop the poorer synthetic duplicate.
  const dupes = await prisma.propertyDoc.findMany({
    where: { workspaceId: workspace.id, propertyId: prop.id, name: "Structural Drawing", deletedAt: null },
    include: { versions: true },
  });
  if (dupes.length > 1) {
    dupes.sort((a, b) => b.versions.filter((v) => v.scanStatus === "clean").length - a.versions.filter((v) => v.scanStatus === "clean").length);
    for (const dupe of dupes.slice(1)) {
      await prisma.documentVersion.deleteMany({ where: { documentId: dupe.id } });
      await prisma.propertyDoc.delete({ where: { id: dupe.id } });
      console.log(`AB seed: removed duplicate drawing ${dupe.id}`);
    }
  }
  const contentKey = (rev: string) => `ab-v1-drawing-${createHash("sha256").update(syntheticPdf(`Structural Drawing ${rev}`)).digest("hex").slice(0, 20)}`;
  let drawing = await loadDrawing();
  if (!drawing) {
    const c1 = await createDocumentForUser({
      userId: owner.id, propertyId: prop.id, category: "Sanction map",
      displayName: "Structural Drawing", filename: "structural-drawing-rev1.pdf",
      mimeType: "application/pdf", bytes: syntheticPdf("Structural Drawing rev 1"),
      idempotencyKey: contentKey("rev 1"),
    });
    drawing = await prisma.propertyDoc.findUniqueOrThrow({ where: { id: c1.document.id }, include: { versions: { orderBy: { version: "asc" } } } });
  }
  await pumpClean(drawing.id);
  drawing = (await loadDrawing())!;
  let clean = drawing.versions.filter((v) => v.scanStatus === "clean");
  if (clean.length < 2) {
    await createDocumentForUser({
      userId: owner.id, propertyId: prop.id, category: "Sanction map",
      displayName: "Structural Drawing", filename: "structural-drawing-rev2.pdf",
      mimeType: "application/pdf", bytes: syntheticPdf("Structural Drawing rev 2"),
      idempotencyKey: contentKey("rev 2"), replaceDocumentId: drawing.id,
    });
    await pumpClean(drawing.id);
    drawing = (await loadDrawing())!;
    clean = drawing.versions.filter((v) => v.scanStatus === "clean");
  }
  if (clean.length < 2) throw new Error("AB_SEED_SCAN_NOT_CLEAN");
  const [rv1, rv2] = clean.slice(-2);
  await confirmManualDocumentReview({ userId: owner.id, documentId: drawing.id, documentVersion: rv2.version, category: "Sanction map" }).catch(() => undefined);
  await cmd("DOCUMENT_LINK", { documentId: drawing.id, documentVersionId: rv1.id, category: "Drawing", contextType: "STAGE", contextId: rcc.id, label: "Structural Drawing" });
  await cmd("DOCUMENT_LINK", { documentId: drawing.id, documentVersionId: rv2.id, category: "Drawing", contextType: "MILESTONE", contextId: slabMilestone.id, label: "Structural Drawing" });

  // Final read + semantic manifest (stable facts only; no UUIDs/timestamps).
  view = await getConstructionForUser(owner.id, projectId, true);
  const manifest = {
    scenarioId: SCENARIO_ID,
    seededAt: day(0),
    property: { name: "Super Corridor Plot" },
    project: { name: "Mehta Residence", type: "NEW_HOME", status: view.status },
    budget: { basePlannedPaise: view.money?.basePlannedPaise, recordedSpendPaise: view.money?.recordedSpendPaise, currentApprovedPaise: view.money?.currentApprovedPaise },
    stage: { current: view.currentStage?.name, milestone: view.milestones.find((m) => m.name === "First-floor slab")?.status },
    work: view.tasks.filter((t) => ["Beam reinforcement for first-floor slab", "Electrical conduit preparation", "Slab reinforcement preparation", "Slab casting"].includes(t.title)).map((t) => ({ title: t.title, status: t.status })),
    decision: { title: "Electrical layout approval", status: view.decisions.find((d) => d.title === "Electrical layout approval")?.status },
    delivery: { ordered: "400", received: "390", shortage: "10" },
    change: { title: "Bedroom flooring upgrade", status: view.changes.find((c) => c.title === "Bedroom flooring upgrade")?.status, estimatedCostImpactPaise: "18200000", estimatedScheduleImpactDays: 3 },
    inspection: { title: "Reinforcement inspection", status: view.inspections.find((i) => i.title === "Reinforcement inspection")?.status },
    material: { name: "TMT steel", quantity: "2.8", unit: "tonnes", quotes: view.supplierQuotes.length },
    siteUpdate: { photoCount: 6 },
    document: { name: "Structural Drawing", revisions: 2 },
    expectedGuidance: ["G01", "G02", "G04", "G05", "G10", "G12", "G13", "G14"],
    guidance: view.guidance.map((g) => ({ rule: g.ruleKey, type: g.type, title: g.title })),
  };
  const checksum = createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
  await mkdir(path.resolve("output/construction-ab-v1"), { recursive: true });
  await writeFile(path.resolve("output/construction-ab-v1/manifest.json"), JSON.stringify({ ...manifest, checksum }, null, 2));
  console.log(JSON.stringify({ scenario: SCENARIO_ID, projectId, checksum, guidance: manifest.guidance.length }, null, 2));
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });

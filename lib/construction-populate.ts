import { createHash } from "node:crypto";
import path from "node:path";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { ConstructionError, createConstructionForUser, getConstructionForUser, mutateConstructionForUser } from "@/lib/construction";

export const CONSTRUCTION_POPULATE_NAMESPACE = "SUKOON_CONSTRUCTION_POPULATE_V2" as const;
export const CONSTRUCTION_POPULATE_DATABASE = "sukoon_demo_staging" as const;
export const CONSTRUCTION_POPULATE_DEFAULT_ANCHOR = "2026-09-23" as const;
export const CONSTRUCTION_POPULATE_RECORDED_PAISE = 269000000n;
const SUBJECT = "CONSTRUCTION_PROJECT";

type Db = PrismaClient;
type Counts = Record<string, number>;

export type ConstructionPopulateReport = {
  namespace: typeof CONSTRUCTION_POPULATE_NAMESPACE;
  operation: "plan" | "apply" | "verify";
  database: string;
  ownerEmail: string;
  workspaceId: string | null;
  propertyId: string | null;
  projectId: string | null;
  anchorDate: string;
  fingerprint: string;
  created: Counts;
  skipped: Counts;
  reused: Counts;
  conflicts: string[];
  documentsTouched: false;
  money: {
    recordedSpendPaise: string | null;
    approvedChangePaise: string | null;
    outstandingCommitmentPaise: string | null;
    currentApprovedPaise: string | null;
    progressPercent: number | null;
  };
  checks: Array<{ id: string; status: "PASS" | "FAIL" | "NOT_RUN"; detail: string }>;
};

const COST_LINES = [
  ["design-fees", "Design and professional fees", "18000000", -220, "Design"],
  ["site-prep-1", "Site preparation, first record", "14000000", -190, "Site preparation"],
  ["site-prep-2", "Site preparation, second record", "10000000", -185, "Site preparation"],
  ["foundation-1", "Foundation and plinth, first record", "40000000", -160, "Foundation"],
  ["foundation-2", "Foundation and plinth, second record", "35000000", -150, "Foundation"],
  ["rcc-concrete", "RCC concrete", "50000000", -40, "RCC"],
  ["rcc-formwork", "RCC formwork", "36000000", -30, "RCC"],
  ["steel-consumed-1", "Steel already consumed, first record", "26000000", -25, "Steel"],
  ["steel-consumed-2", "Steel already consumed, second record", "20000000", -20, "Steel"],
  ["early-services", "Early services work", "8000000", -90, "Services"],
  ["site-setup", "Site setup", "7000000", -200, "Site setup"],
  ["site-misc", "Site miscellaneous", "5000000", -15, "Site setup"],
] as const;

export function shiftScenarioDate(anchor: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) throw new Error("CONSTRUCTION_POPULATE_ANCHOR_INVALID");
  const date = new Date(`${anchor}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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

export function assertConstructionPopulateEnvironment(env: NodeJS.Dict<string> = process.env, actualDatabaseName?: string, options: { testOnly?: boolean } = {}) {
  if (env.APP_ENV !== "staging" || env.NODE_ENV !== "production" || env.SUKOON_RUNTIME_PROFILE !== "STAGING") throw new Error("CONSTRUCTION_POPULATE_STAGING_REQUIRED");
  if (env.SUKOON_CONSTRUCTION_POPULATE_CONFIRMATION !== CONSTRUCTION_POPULATE_NAMESPACE) throw new Error("CONSTRUCTION_POPULATE_CONFIRMATION_REQUIRED");
  if (env.SUKOON_DATA_DIR && path.resolve(env.SUKOON_DATA_DIR) === path.resolve(".data")) throw new Error("CONSTRUCTION_POPULATE_LOCAL_DATA_FORBIDDEN");
  const configured = databaseName(env.DATABASE_URL);
  const allowedTestDatabase = options.testOnly && actualDatabaseName && /^sukoon_s02_test_[a-zA-Z0-9_-]+$/.test(actualDatabaseName);
  if (configured !== CONSTRUCTION_POPULATE_DATABASE || (actualDatabaseName !== undefined && actualDatabaseName !== CONSTRUCTION_POPULATE_DATABASE && !allowedTestDatabase)) throw new Error("CONSTRUCTION_POPULATE_DATABASE_SCOPE_INVALID");
}

function bump(target: Counts, key: string) {
  target[key] = (target[key] ?? 0) + 1;
}

function requestKey(label: string) {
  const digest = createHash("sha256").update(`${CONSTRUCTION_POPULATE_NAMESPACE}:${label}`).digest("hex").slice(0, 20);
  return `SUKOON-CP2-${label}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 90) + `-${digest}`.slice(0, 120);
}

function scenarioFingerprint(anchor: string, builtUpArea: string, areaUnit: string) {
  return createHash("sha256").update(JSON.stringify({
    namespace: CONSTRUCTION_POPULATE_NAMESPACE,
    anchor,
    builtUpArea,
    areaUnit,
    costs: COST_LINES.map((line) => line.slice(0, 3)),
    cement: ["400", "390"],
    steel: "2.8",
    flooringPaise: "18200000",
    invoicePaise: "24000000",
    documents: 0,
  })).digest("hex");
}

function emptyReport(operation: ConstructionPopulateReport["operation"], database: string, ownerEmail: string, anchor: string): ConstructionPopulateReport {
  return {
    namespace: CONSTRUCTION_POPULATE_NAMESPACE,
    operation,
    database,
    ownerEmail,
    workspaceId: null,
    propertyId: null,
    projectId: null,
    anchorDate: anchor,
    fingerprint: "",
    created: {},
    skipped: {},
    reused: {},
    conflicts: [],
    documentsTouched: false,
    money: { recordedSpendPaise: null, approvedChangePaise: null, outstandingCommitmentPaise: null, currentApprovedPaise: null, progressPercent: null },
    checks: [],
  };
}

async function actualDatabase(db: Db) {
  const rows = await db.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  return rows[0]?.name ?? "";
}

export async function runConstructionPopulate(options: {
  operation?: "plan" | "apply" | "verify";
  db?: Db;
  env?: NodeJS.Dict<string>;
  actualDatabaseName?: string;
  testOnly?: boolean;
  anchorDate?: string;
} = {}): Promise<ConstructionPopulateReport> {
  const db = options.db ?? defaultPrisma;
  const env = options.env ?? process.env;
  const operation = options.operation ?? "plan";
  const currentDatabase = options.actualDatabaseName ?? await actualDatabase(db);
  assertConstructionPopulateEnvironment(env, currentDatabase, { testOnly: options.testOnly });
  const ownerEmail = (env.SUKOON_STAGING_REVIEW_EMAIL ?? "akshay-review@sukoon.local").trim().toLowerCase();
  const owner = await db.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) throw new Error("CONSTRUCTION_POPULATE_OWNER_MISSING");
  const workspace = await db.workspace.findUnique({ where: { ownerUserId: owner.id } });
  if (!workspace) throw new Error("CONSTRUCTION_POPULATE_WORKSPACE_MISSING");
  const manifest = await db.scenarioManifest.findUnique({ where: { namespace_workspaceId_subjectType: { namespace: CONSTRUCTION_POPULATE_NAMESPACE, workspaceId: workspace.id, subjectType: SUBJECT } } });
  const anchor = manifest?.anchorDate ?? options.anchorDate ?? CONSTRUCTION_POPULATE_DEFAULT_ANCHOR;
  const report = emptyReport(operation, currentDatabase, ownerEmail, anchor);
  report.workspaceId = workspace.id;
  const properties = await db.property.findMany({ where: { workspaceId: workspace.id, name: "Super Corridor Plot", status: "active" } });
  if (properties.length !== 1) {
    report.conflicts.push(properties.length === 0 ? "property:Super Corridor Plot_missing" : "property:Super Corridor Plot_ambiguous");
    return report;
  }
  const property = properties[0]!;
  report.propertyId = property.id;
  const areaUnit = property.areaUnit === "sqm" ? "sqm" : "sqft";
  const builtUpArea = property.areaValue && /^\d+(\.\d{1,3})?$/.test(property.areaValue) && Number(property.areaValue) > 0 && (property.areaUnit === "sqft" || property.areaUnit === "sqm") ? property.areaValue : "";
  if (!builtUpArea) {
    report.conflicts.push("property:built_up_area_not_owner_entered");
    return report;
  }
  report.fingerprint = scenarioFingerprint(anchor, builtUpArea, areaUnit);
  if (manifest && manifest.fingerprint !== report.fingerprint) {
    report.conflicts.push("scenario:fingerprint_conflict");
    return report;
  }
  if (manifest && manifest.anchorDate !== anchor) report.conflicts.push("scenario:anchor_conflict");
  const projects = await db.constructionProject.findMany({ where: { workspaceId: workspace.id, propertyId: property.id, name: "Mehta Residence" } });
  const active = projects.filter((project) => project.archivedAt === null);
  if (active.length > 1) {
    report.conflicts.push("construction:Mehta Residence_ambiguous");
    return report;
  }
  if (active.length === 0 && projects.length > 0) {
    report.conflicts.push("construction:Mehta Residence_archived_only");
    return report;
  }
  const docsBefore = await db.propertyDoc.count({ where: { workspaceId: workspace.id } });
  if (operation === "plan") {
    report.projectId = active[0]?.id ?? null;
    report.checks.push({ id: "A01", status: "PASS", detail: "Plan read the target workspace without writing." });
    report.checks.push({ id: "A02", status: active.length === 0 ? "NOT_RUN" : "PASS", detail: active.length === 0 ? "Project is absent; apply would create one scoped project." : "Existing active project would be reused." });
    return report;
  }

  if (operation === "apply") {
    if (!manifest) {
      await db.scenarioManifest.create({
        data: {
          id: `scenario-${createHash("sha256").update(`${workspace.id}:${CONSTRUCTION_POPULATE_NAMESPACE}`).digest("hex").slice(0, 24)}`,
          namespace: CONSTRUCTION_POPULATE_NAMESPACE,
          workspaceId: workspace.id,
          subjectType: SUBJECT,
          anchorDate: anchor,
          fingerprint: report.fingerprint,
          status: "APPLYING",
          report: { documents: 0 },
        },
      });
      bump(report.created, "manifest");
    } else bump(report.skipped, "manifest");
    let projectId = active[0]?.id;
    if (!projectId) {
      await createConstructionForUser(owner.id, {
        propertyId: property.id,
        name: "Mehta Residence",
        projectType: "NEW_HOME",
        builtUpArea,
        areaUnit,
        floorCount: 3,
        qualityLevel: "STANDARD",
        estimatedBudgetPaise: "1200000000",
        startDate: shiftScenarioDate(anchor, -240),
        targetCompletionDate: shiftScenarioDate(anchor, 400),
        requirements: `${CONSTRUCTION_POPULATE_NAMESPACE} synthetic G+2 home. Built-up area is the owner-entered property figure. Flooring rates are separate estimates and are not multiplied into this area.`,
        idempotencyKey: requestKey("project"),
      });
      const created = await db.constructionProject.findFirst({ where: { workspaceId: workspace.id, propertyId: property.id, name: "Mehta Residence", archivedAt: null } });
      if (!created) throw new Error("CONSTRUCTION_POPULATE_PROJECT_NOT_CREATED");
      projectId = created.id;
      bump(report.created, "project");
    } else bump(report.reused, "project");
    report.projectId = projectId;
    await populateProject({ db, ownerId: owner.id, projectId, anchor, report });
    await db.scenarioManifest.update({
      where: { namespace_workspaceId_subjectType: { namespace: CONSTRUCTION_POPULATE_NAMESPACE, workspaceId: workspace.id, subjectType: SUBJECT } },
      data: { subjectId: projectId, status: report.conflicts.length ? "CONFLICT" : "APPLIED", anchorDate: anchor, report: { created: report.created, skipped: report.skipped, reused: report.reused, conflicts: report.conflicts } },
    });
  } else {
    report.projectId = active[0]?.id ?? null;
  }

  const docsAfter = await db.propertyDoc.count({ where: { workspaceId: workspace.id } });
  if (docsAfter !== docsBefore) report.conflicts.push("documents:unexpected_write");
  if (report.projectId) await fillObserved(db, owner.id, report.projectId, report);
  if (operation === "verify" || operation === "apply") addChecks(report, docsAfter === docsBefore);
  return report;
}

async function fillObserved(db: Db, ownerId: string, projectId: string, report: ConstructionPopulateReport) {
  const view = await getConstructionForUser(ownerId, projectId, false);
  report.money = {
    recordedSpendPaise: view.money?.recordedSpendPaise ?? null,
    approvedChangePaise: view.money?.approvedChangeDeltaPaise ?? null,
    outstandingCommitmentPaise: view.money?.outstandingCommitmentPaise ?? null,
    currentApprovedPaise: view.money?.currentApprovedPaise ?? null,
    progressPercent: view.progressPercent,
  };
}

function addChecks(report: ConstructionPopulateReport, documentsUnchanged: boolean) {
  const push = (id: string, ok: boolean, detail: string) => report.checks.push({ id, status: ok ? "PASS" : "FAIL", detail });
  push("project-visible", Boolean(report.projectId), report.projectId ? "Active Mehta Residence is attached to Super Corridor Plot." : "Project was not found.");
  push("documents-unchanged", documentsUnchanged, documentsUnchanged ? "No document rows were added." : "Document count changed.");
  push("money-recorded", report.money.recordedSpendPaise !== null, `Recorded spend ${report.money.recordedSpendPaise ?? "unknown"} paise. Progress ${report.money.progressPercent ?? "unknown"}% from the engine.`);
  push("anchor-stable", Boolean(report.anchorDate), `Anchor ${report.anchorDate}.`);
}

async function populateProject(args: { db: Db; ownerId: string; projectId: string; anchor: string; report: ConstructionPopulateReport }) {
  const { db, ownerId, projectId, anchor, report } = args;
  const on = (days: number) => shiftScenarioDate(anchor, days);
  const existingCosts = await db.constructionCost.count({ where: { projectId } });
  const namespacedCosts = await db.constructionEvent.count({ where: { projectId, requestKey: { startsWith: "SUKOON-CP2-cost-" } } });
  const preserveMoney = existingCosts > 0 && namespacedCosts === 0;
  if (preserveMoney) report.conflicts.push("money:existing_spend_preserved");

  const act = async (label: string, action: string, body: Record<string, unknown>) => {
    const key = requestKey(label);
    const existing = await db.constructionEvent.findUnique({ where: { projectId_requestKey: { projectId, requestKey: key } } });
    if (existing) {
      bump(report.skipped, action);
      return;
    }
    const project = await db.constructionProject.findUniqueOrThrow({ where: { id: projectId } });
    try {
      await mutateConstructionForUser(ownerId, projectId, { ...body, action, version: project.version, idempotencyKey: key });
      bump(report.created, action);
    } catch (error) {
      const code = error instanceof ConstructionError ? error.code : "CONSTRUCTION_POPULATE_STEP_FAILED";
      report.conflicts.push(`${label}:${code}`);
    }
  };

  const project = await db.constructionProject.findUniqueOrThrow({ where: { id: projectId } });
  if (project.status === "PLANNING") await act("status-active", "PROJECT_STATUS", { status: "ACTIVE" });
  else bump(report.reused, "PROJECT_STATUS");

  let view = await getConstructionForUser(ownerId, projectId, true);
  const stageNamed = (name: string) => view.stages.find((stage) => stage.name === name);
  for (const name of ["Pre-Construction", "Survey & Site Preparation", "Design", "Approvals", "Foundation"]) {
    const stage = stageNamed(name);
    if (!stage) {
      report.conflicts.push(`stage:${name}_missing`);
      continue;
    }
    if (["COMPLETED", "SKIPPED"].includes(stage.status)) {
      bump(report.reused, "STAGE_UPDATE");
      continue;
    }
    if (["NOT_STARTED", "READY"].includes(stage.status)) await act(`stage-start-${name}`, "STAGE_UPDATE", { stageId: stage.id, status: "IN_PROGRESS" });
    view = await getConstructionForUser(ownerId, projectId, true);
    const open = view.stages.find((item) => item.id === stage.id);
    if (open && ["IN_PROGRESS", "BLOCKED"].includes(open.status)) {
      for (const task of view.tasks.filter((task) => task.stageId === stage.id && !["DONE", "CANCELLED"].includes(task.status))) {
        await act(`task-done-${task.id}`, "TASK_UPDATE", { stageId: stage.id, taskId: task.id, status: "DONE" });
      }
      await act(`stage-complete-${name}`, "STAGE_UPDATE", { stageId: stage.id, status: "COMPLETED" });
    }
    view = await getConstructionForUser(ownerId, projectId, true);
  }

  const rcc = view.stages.find((stage) => stage.name === "RCC / Structure");
  if (!rcc) {
    report.conflicts.push("stage:RCC / Structure_missing");
    return;
  }
  if (["NOT_STARTED", "READY"].includes(rcc.status)) await act("stage-start-rcc", "STAGE_UPDATE", { stageId: rcc.id, status: "IN_PROGRESS" });
  view = await getConstructionForUser(ownerId, projectId, true);
  const rccNow = view.stages.find((stage) => stage.id === rcc.id)!;
  const ensureTask = async (title: string, status: string) => {
    let task = view.tasks.find((item) => item.stageId === rccNow.id && item.title === title);
    if (!task) {
      await act(`task-create-${title}`, "TASK_CREATE", { stageId: rccNow.id, title, status: status === "DONE" ? "TODO" : status });
      view = await getConstructionForUser(ownerId, projectId, true);
      task = view.tasks.find((item) => item.stageId === rccNow.id && item.title === title);
    } else bump(report.reused, "TASK_CREATE");
    if (task && task.status !== status && !["DONE", "CANCELLED"].includes(task.status)) await act(`task-status-${title}`, "TASK_UPDATE", { stageId: rccNow.id, taskId: task.id, status });
    return view.tasks.find((item) => item.stageId === rccNow.id && item.title === title);
  };
  const beam = await ensureTask("Beam reinforcement for first-floor slab", "DONE");
  const conduit = await ensureTask("Electrical conduit preparation", "IN_PROGRESS");
  await ensureTask("Slab reinforcement preparation", "IN_PROGRESS");
  await ensureTask("Slab casting", "TODO");

  if (!view.milestones.some((item) => item.name === "First-floor slab")) {
    await act("milestone-slab", "MILESTONE_CREATE", { stageId: rccNow.id, name: "First-floor slab", plannedDate: on(4), status: "PLANNED", description: "Current slab preparation. Synthetic owner-entered milestone." });
  }
  view = await getConstructionForUser(ownerId, projectId, true);
  const slab = view.milestones.find((item) => item.name === "First-floor slab");
  if (slab && slab.status === "PLANNED") await act("milestone-slab-progress", "MILESTONE_UPDATE", { milestoneId: slab.id, status: "IN_PROGRESS" });

  for (const contact of [
    ["Architect", "Ankit Shah", "ARCHITECT", "Shah Studio"],
    ["Contractor", "Ravi Sharma", "CONTRACTOR", "Ravi Buildcon"],
    ["Structural engineer", "Neha Kulkarni", "STRUCTURAL_ENGINEER", "Kulkarni Structurals"],
  ] as const) {
    if (!view.contacts.some((item) => item.name === contact[1])) await act(`contact-${contact[2]}`, "CONTACT_CREATE", { name: contact[1], company: contact[3], role: contact[2], notes: "Synthetic contact. Adding this contact grants no access." });
  }

  if (!view.decisions.some((item) => item.title === "Plinth level confirmation")) {
    await act("decision-plinth", "DECISION_CREATE", {
      stageId: view.stages.find((stage) => stage.name === "Foundation")?.id,
      title: "Plinth level confirmation",
      context: "Earlier owner-recorded decision. Synthetic history.",
      assignedTo: "Aarav Mehta",
      dueDate: on(-140),
      options: [{ label: "Confirm the marked plinth", description: "Proceed with the marked level.", estimatedCostImpactPaise: "0", estimatedScheduleImpactDays: 0 }],
    });
    view = await getConstructionForUser(ownerId, projectId, true);
    const plinth = view.decisions.find((item) => item.title === "Plinth level confirmation");
    const option = plinth?.options?.[0];
    if (plinth && plinth.status === "OPEN" && option) await act("decision-plinth-record", "DECISION_RECORD", { decisionId: plinth.id, selectedOptionId: option.id, decisionComment: "Owner recorded the earlier confirmation." });
  }

  if (!view.decisions.some((item) => item.title === "Electrical layout approval")) {
    await act("decision-electrical", "DECISION_CREATE", {
      stageId: rccNow.id,
      workItemId: conduit?.id,
      title: "Electrical layout approval",
      context: "Blocking decision for conduit work and the first-floor slab. No professional certification is implied.",
      assignedTo: "Aarav Mehta",
      dueDate: on(2),
      options: [
        { label: "Approve the shared layout", description: "Proceed with the current conduit route.", estimatedCostImpactPaise: "0", estimatedScheduleImpactDays: 0 },
        { label: "Request switch-position changes", description: "Adds conduit rework.", estimatedCostImpactPaise: "1500000", estimatedScheduleImpactDays: 2 },
      ],
    });
  }
  view = await getConstructionForUser(ownerId, projectId, true);
  const electrical = view.decisions.find((item) => item.title === "Electrical layout approval");
  const slabNow = view.milestones.find((item) => item.name === "First-floor slab");
  const conduitNow = view.tasks.find((item) => item.title === "Electrical conduit preparation");
  if (electrical && conduitNow) await act("dependency-decision-conduit", "DEPENDENCY_CREATE", { predecessorType: "DECISION", predecessorId: electrical.id, successorType: "WORK_ITEM", successorId: conduitNow.id });
  if (conduitNow && slabNow) await act("dependency-conduit-slab", "DEPENDENCY_CREATE", { predecessorType: "WORK_ITEM", predecessorId: conduitNow.id, successorType: "MILESTONE", successorId: slabNow.id });

  const issue = async (title: string, status: "OPEN" | "RESOLVED", description: string, when: string) => {
    if (view.issues?.some((item) => item.title === title) || await db.constructionIssue.findFirst({ where: { projectId, title } })) {
      bump(report.reused, "ISSUE_CREATE");
      return;
    }
    await act(`issue-${title}`, "ISSUE_CREATE", { stageId: rccNow.id, title, description: `${description} Recorded for ${when}.`, severity: "MEDIUM", scheduleImpactDays: 0, costImpactPaise: "0" });
    if (status === "RESOLVED") {
      const row = await db.constructionIssue.findFirst({ where: { projectId, title } });
      if (row) await act(`issue-resolve-${title}`, "ISSUE_UPDATE", { issueId: row.id, status: "RESOLVED", resolution: "Owner recorded this as resolved in the synthetic history." });
    }
  };
  await issue("Excavation water cleared", "RESOLVED", "Earlier site issue.", on(-180));
  await issue("Plinth shuttering alignment", "RESOLVED", "Earlier alignment issue.", on(-145));
  if (!await db.constructionIssue.findFirst({ where: { projectId, title: "Cement delivery shortage" } })) {
    await act("issue-cement", "ISSUE_CREATE", { stageId: rccNow.id, title: "Cement delivery shortage", description: "400 bags were expected and 390 were received. 10 bags remain outstanding.", severity: "HIGH", scheduleImpactDays: 1, costImpactPaise: "0", assignedTo: "Ravi Sharma" });
  }

  if (!view.inspections.some((item) => item.title === "Foundation inspection record")) {
    await act("inspection-foundation", "INSPECTION_RECORD", { stageId: view.stages.find((stage) => stage.name === "Foundation")?.id, title: "Foundation inspection record", performedBy: "Neha Kulkarni", performedAt: on(-155), status: "RECORDED", result: "PASS_RECORDED", notes: "Earlier owner-recorded check. Not a certification." });
  }
  if (!view.inspections.some((item) => item.title === "Reinforcement inspection")) {
    await act("inspection-reinforcement", "INSPECTION_RECORD", { stageId: rccNow.id, title: "Reinforcement inspection", performedBy: "Neha Kulkarni", performedAt: on(1), status: "SCHEDULED", result: "RECORDED", notes: "Scheduled reinforcement check. It has not been performed." });
  }

  const budgetId = async (category: string, estimatedPaise: string) => {
    if (!view.budgets.some((item) => item.category === category)) await act(`budget-${category}`, "BUDGET_SET", { category, estimatedPaise });
    view = await getConstructionForUser(ownerId, projectId, true);
    return view.budgets.find((item) => item.category === category)?.id;
  };
  if (!preserveMoney) {
    const categories = [...new Set(COST_LINES.map((line) => line[4]))];
    const budgetIds = new Map<string, string | undefined>();
    for (const category of categories) budgetIds.set(category, await budgetId(category, "0"));
    for (const [key, title, amount, offset, category] of COST_LINES) {
      const stageName = category === "Design" ? "Design" : category === "Foundation" ? "Foundation" : "RCC / Structure";
      const stage = view.stages.find((item) => item.name === stageName) ?? rccNow;
      await act(`cost-${key}`, "COST_RECORD", { source: "USER_RECORDED_EXPENSE", title, amountPaise: amount, recordedDate: on(offset), stageId: stage.id, budgetItemId: budgetIds.get(category) });
    }
  }

  if (!await db.constructionCommitment.findFirst({ where: { projectId, title: "Contractor invoice — Ravi Buildcon" } })) {
    await act("invoice-review", "COMMITMENT_CREATE", { title: "Contractor invoice — Ravi Buildcon", amountPaise: "24000000", vendorOrPersonId: "Ravi Buildcon", expectedBy: on(7), sourceType: "INVOICE", status: "DRAFT", notes: "Awaiting owner review. Approval of this review does not record a payment." });
  }

  if (!view.materials.some((item) => item.name === "Cement")) {
    await act("material-cement", "MATERIAL_CREATE", { stageId: rccNow.id, category: "Cement", name: "Cement", quantity: "400", unit: "bags", requiredByDate: on(0), estimatedUnitRatePaise: "38000" });
  }
  view = await getConstructionForUser(ownerId, projectId, true);
  const cement = view.materials.find((item) => item.name === "Cement");
  if (cement && !view.orders.some((item) => item.materialRequirementId === cement.id)) {
    await act("order-cement", "ORDER_PLACE", { materialRequirementId: cement.id, supplierName: "Ravi Buildcon", orderedQuantity: "400", unit: "bags", totalPaise: "15200000", expectedDelivery: on(0) });
  }
  view = await getConstructionForUser(ownerId, projectId, true);
  const cementOrder = cement ? view.orders.find((item) => item.materialRequirementId === cement.id) : undefined;
  if (cementOrder && !view.deliveries.some((item) => item.orderId === cementOrder.id)) {
    await act("delivery-cement", "DELIVERY_RECORD", { orderId: cementOrder.id, expectedQuantity: "400", receivedQuantity: "390", unit: "bags", receivedBy: "Ravi Sharma", receivedAt: on(-1), notes: "Challan count at site. 10 bags still outstanding. This delivery does not create spend." });
  }

  if (!view.materials.some((item) => item.name === "River sand")) {
    await act("material-sand", "MATERIAL_CREATE", { category: "Sand", name: "River sand", quantity: "12", unit: "tonnes", requiredByDate: on(-170), estimatedUnitRatePaise: "90000" });
    view = await getConstructionForUser(ownerId, projectId, true);
    const sand = view.materials.find((item) => item.name === "River sand");
    if (sand) {
      await act("quote-sand-a", "QUOTE_RECORD", { materialRequirementId: sand.id, supplierName: "Sand Supplier A", quantity: "12", unit: "tonnes", unitRatePaise: "90000", totalPaise: "1080000", deliveryDate: on(-172) });
      await act("quote-sand-b", "QUOTE_RECORD", { materialRequirementId: sand.id, supplierName: "Sand Supplier B", quantity: "12", unit: "tonnes", unitRatePaise: "94000", totalPaise: "1128000", deliveryDate: on(-171) });
      view = await getConstructionForUser(ownerId, projectId, true);
      const chosen = view.supplierQuotes.find((item) => item.materialRequirementId === sand.id && item.supplierName === "Sand Supplier A");
      if (chosen) await act("quote-sand-select", "QUOTE_SELECT", { quoteId: chosen.id });
      if (!view.orders.some((item) => item.materialRequirementId === sand.id)) await act("order-sand", "ORDER_PLACE", { materialRequirementId: sand.id, supplierName: "Sand Supplier A", orderedQuantity: "12", unit: "tonnes", totalPaise: "1080000", expectedDelivery: on(-168) });
      view = await getConstructionForUser(ownerId, projectId, true);
      const sandOrder = view.orders.find((item) => item.materialRequirementId === sand.id);
      if (sandOrder) await act("delivery-sand", "DELIVERY_RECORD", { orderId: sandOrder.id, expectedQuantity: "12", receivedQuantity: "12", unit: "tonnes", receivedBy: "Ravi Sharma", receivedAt: on(-168), notes: "Completed earlier delivery." });
    }
  }
  view = await getConstructionForUser(ownerId, projectId, true);
  const sandMaterial = view.materials.find((item) => item.name === "River sand");
  const sandOrderNow = sandMaterial ? view.orders.find((item) => item.materialRequirementId === sandMaterial.id) : undefined;
  const sandCommitmentId = sandOrderNow && "commitmentId" in sandOrderNow && typeof sandOrderNow.commitmentId === "string" ? sandOrderNow.commitmentId : null;
  if (sandCommitmentId) {
    const commitment = view.commitments.find((item) => item.id === sandCommitmentId);
    if (commitment && commitment.status !== "FULFILLED" && commitment.status !== "CANCELLED") {
      await act("commitment-sand-close", "COMMITMENT_UPDATE", { commitmentId: sandCommitmentId, status: "FULFILLED", notes: "Historical delivery closed. Its cost stays inside the recorded spend categories." });
    }
  }

  if (!view.materials.some((item) => item.name === "TMT steel")) {
    await act("material-steel", "MATERIAL_CREATE", { stageId: rccNow.id, category: "Steel", name: "TMT steel", quantity: "2.8", unit: "tonnes", requiredByDate: on(8), estimatedUnitRatePaise: "6050000" });
  }
  view = await getConstructionForUser(ownerId, projectId, true);
  const steel = view.materials.find((item) => item.name === "TMT steel");
  if (steel) {
    for (const quote of [
      ["a", "Steel Supplier A", "6020000", "16856000", 6],
      ["b", "Steel Supplier B", "5980000", "16744000", 8],
      ["c", "Steel Supplier C", "6100000", "17080000", 5],
    ] as const) {
      if (!view.supplierQuotes.some((item) => item.materialRequirementId === steel.id && item.supplierName === quote[1])) {
        await act(`quote-steel-${quote[0]}`, "QUOTE_RECORD", { materialRequirementId: steel.id, supplierName: quote[1], quantity: "2.8", unit: "tonnes", unitRatePaise: quote[2], totalPaise: quote[3], deliveryDate: on(quote[4]) });
      }
    }
  }

  if (!view.changes.some((item) => item.title === "Bedroom flooring upgrade")) {
    await act("change-flooring", "CHANGE_PROPOSE", {
      title: "Bedroom flooring upgrade",
      reason: "Owner-entered estimate. The ₹120/sq ft and ₹190/sq ft rates are recorded separately from the ₹1,82,000 package impact.",
      originalScope: "Flooring estimate at ₹120 per sq ft.",
      revisedScope: "Flooring estimate at ₹190 per sq ft for the stated bedroom scope.",
      estimatedCostImpactPaise: "18200000",
      estimatedScheduleImpactDays: 3,
    });
    const change = await db.constructionChange.findFirst({ where: { projectId, title: "Bedroom flooring upgrade" } });
    if (change) await act("change-flooring-approve", "CHANGE_DECIDE", { changeId: change.id, decision: "APPROVE" });
  }

  const notes = [
    ["note-setup", "Project setup recorded", "Requirements and the G+2 intent were recorded.", -240, "Pre-Construction"],
    ["note-design", "Design discussion recorded", "Design notes were entered by the owner.", -220, "Design"],
    ["note-excavation", "Excavation underway", "Excavation was recorded as in progress.", -190, "Survey & Site Preparation"],
    ["note-foundation", "Foundation concrete recorded", "Foundation concrete was recorded.", -160, "Foundation"],
    ["note-plinth", "Plinth work recorded", "Plinth work followed the earlier confirmation.", -130, "Foundation"],
    ["note-ground", "Ground-floor structure recorded", "Ground-floor structural work was recorded.", -90, "RCC / Structure"],
    ["note-slab-prep", "First-floor slab preparation", "Slab preparation is the current milestone.", -10, "RCC / Structure"],
    ["note-yesterday", "Beam reinforcement completed", "Beam reinforcement was completed. Electrical conduit work has started. No site photo is attached.", -1, "RCC / Structure"],
    ["note-weather", "Morning delay recorded", "Weather delayed the morning start. This note is not a photograph.", -3, "RCC / Structure"],
    ["note-steel-need", "Steel requirement noted", "2.8 tonnes of TMT steel are required later. Quotes are recorded and none is selected.", -2, "RCC / Structure"],
  ] as const;
  for (const [key, title, description, offset, stageName] of notes) {
    if (view.updates.some((item) => item.title === title)) {
      bump(report.reused, "UPDATE_CREATE");
      continue;
    }
    const stage = view.stages.find((item) => item.name === stageName);
    await act(key, "UPDATE_CREATE", { stageId: stage?.id, title, description: `${CONSTRUCTION_POPULATE_NAMESPACE} synthetic history. ${description}`, occurredDate: on(offset), weatherNote: offset === -1 ? "Recorded site condition only." : "" });
  }

  await act("reminder-decision", "REMINDER_SET", { kind: "APPROVAL_FOLLOWUP", title: "Electrical layout decision due", dueDate: on(2) });
  await act("reminder-inspection", "REMINDER_SET", { kind: "MILESTONE", title: "Reinforcement inspection scheduled", dueDate: on(1) });
  await act("reminder-slab", "REMINDER_SET", { kind: "MILESTONE", title: "First-floor slab milestone", dueDate: on(4) });
  await act("reminder-steel", "REMINDER_SET", { kind: "MATERIAL", title: "TMT steel required", dueDate: on(8) });
  void beam;
}

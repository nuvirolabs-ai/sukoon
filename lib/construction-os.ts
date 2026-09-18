import { randomUUID } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { ConstructionError } from "@/lib/construction";

// Construction OS Core 1.0 — delta domain handlers.
//
// This module implements the canonical objects that did not exist in V1
// (plan versions, milestones, dependencies, decisions, issues, inspections,
// changes, commitments, quotes, orders, deliveries, guidance backing rows,
// handover records) plus the deterministic money engine. It is invoked from
// `mutateConstructionForUser` inside the same transaction, so the existing
// project lock, idempotency, versioning and audit pipeline apply unchanged.
//
// NOTE on imports: `lib/construction.ts` imports `handleOsAction` from here,
// while this module imports shared transactional helpers back from there.
// The cycle is safe: both sides only call imported functions at request time,
// never during module evaluation.

type Tx = Prisma.TransactionClient;
type Input = Record<string, unknown>;

export interface OsProject {
  id: string;
  workspaceId: string;
  propertyId: string | null;
}

export interface OsDerivedEvent {
  suffix: string;
  eventType: string;
  payload: unknown;
  visibility: string;
}

export interface OsOutcome {
  result: unknown;
  eventType: string;
  visibility: string;
  derived?: OsDerivedEvent[];
}

// ---------------------------------------------------------------------------
// Local validators (mirror lib/construction.ts semantics; kept local so this
// module never depends on unexported helpers).
// ---------------------------------------------------------------------------

function fail(message: string, code = "CONSTRUCTION_INVALID", status = 400): never {
  throw new ConstructionError(code, message, status);
}
function missing(): never {
  throw new ConstructionError("CONSTRUCTION_NOT_FOUND", "Construction record not found.", 404);
}
function object(raw: unknown): Input {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("A request object is required.");
  return raw as Input;
}
function text(value: unknown, label: string, max = 200, optional = false): string {
  if ((value === undefined || value === null || value === "") && optional) return "";
  if (typeof value !== "string" || !value.trim() || value.length > max) return fail(`${label} is invalid.`);
  return value.trim();
}
function choice(value: unknown, values: readonly string[], label: string) {
  const result = text(value, label);
  if (!values.includes(result)) return fail(`${label} is invalid.`);
  return result;
}
function paise(value: unknown, optional = false): bigint {
  if (optional && (value === undefined || value === "" || value === null)) return 0n;
  if (!/^(0|[1-9]\d{0,14})$/.test(String(value))) return fail("Money must be a non-negative integer number of paise.");
  return BigInt(String(value));
}
function dateOnly(value: unknown, optional = true): string | null {
  if (!value && optional) return null;
  const s = text(value, "Date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s)
    return fail("Use a valid calendar date.");
  return s;
}
function intIn(value: unknown, min: number, max: number, label: string, optional = false): number | null {
  if ((value === undefined || value === null || value === "") && optional) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return fail(`${label} is invalid.`);
  return n;
}
function strArray(value: unknown, label: string, maxItems = 100): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxItems) return fail(`${label} is invalid.`);
  return value.map((entry) => text(entry, label, 200));
}
function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
}
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Canonical reference checks
// ---------------------------------------------------------------------------

const PREDECESSOR_TYPES = ["STAGE", "WORK_ITEM", "MILESTONE", "DECISION", "INSPECTION"] as const;
const SUCCESSOR_TYPES = ["STAGE", "WORK_ITEM", "MILESTONE", "INSPECTION"] as const;
const DOCUMENT_CONTEXTS = [
  "PROJECT", "STAGE", "MILESTONE", "WORK_ITEM", "DECISION", "ISSUE",
  "INSPECTION", "CHANGE", "COMMITMENT", "EXPENSE", "MATERIAL", "ORDER",
  "DELIVERY", "HANDOVER",
] as const;

async function requireStage(tx: Tx, where: { projectId: string; workspaceId: string }, id: string | null) {
  if (!id) return null;
  const row = await tx.constructionStage.findFirst({ where: { ...where, id } });
  if (!row) return missing();
  return row;
}
async function requireTask(tx: Tx, where: { projectId: string; workspaceId: string }, id: string | null) {
  if (!id) return null;
  const row = await tx.constructionTask.findFirst({ where: { ...where, id } });
  if (!row) return missing();
  return row;
}

function terminalStatus(type: string, status: string): boolean {
  if (type === "STAGE") return ["COMPLETED", "SKIPPED"].includes(status);
  if (type === "WORK_ITEM") return status === "DONE";
  if (type === "MILESTONE") return ["DONE", "SKIPPED", "CANCELLED"].includes(status);
  if (type === "DECISION") return ["DECIDED", "CANCELLED", "EXPIRED"].includes(status);
  if (type === "INSPECTION") return true; // a recorded inspection is evidence
  return false;
}

async function endpointStatus(
  tx: Tx,
  where: { projectId: string; workspaceId: string },
  type: string,
  id: string,
): Promise<string | null> {
  if (type === "STAGE") return (await tx.constructionStage.findFirst({ where: { ...where, id } }))?.status ?? null;
  if (type === "WORK_ITEM") return (await tx.constructionTask.findFirst({ where: { ...where, id } }))?.status ?? null;
  if (type === "MILESTONE") return (await tx.constructionMilestone.findFirst({ where: { ...where, id } }))?.status ?? null;
  if (type === "DECISION") return (await tx.constructionDecision.findFirst({ where: { ...where, id } }))?.status ?? null;
  if (type === "INSPECTION") return (await tx.constructionInspection.findFirst({ where: { ...where, id } })) ? "RECORDED" : null;
  return null;
}

export async function predecessorSatisfied(
  tx: Tx,
  where: { projectId: string; workspaceId: string },
  type: string,
  id: string,
): Promise<boolean> {
  const status = await endpointStatus(tx, where, type, id);
  if (status === null) return false;
  return terminalStatus(type, status);
}

async function successorSatisfied(
  tx: Tx,
  where: { projectId: string; workspaceId: string },
  type: string,
  id: string,
): Promise<boolean> {
  const deps = await tx.constructionDependency.findMany({
    where: { ...where, successorType: type, successorId: id, dependencyType: "FINISH_TO_START" },
  });
  for (const d of deps) {
    if (!(await predecessorSatisfied(tx, where, d.predecessorType, d.predecessorId))) return false;
  }
  return true;
}

async function assertNoCycle(
  tx: Tx,
  where: { projectId: string; workspaceId: string },
  predecessorType: string,
  predecessorId: string,
  successorType: string,
  successorId: string,
) {
  // Walk backwards from the predecessor through existing dependency edges;
  // reaching the successor means the new edge would close a cycle.
  const key = (t: string, i: string) => `${t}:${i}`;
  const target = key(successorType, successorId);
  const stack: Array<[string, string]> = [[predecessorType, predecessorId]];
  const seen = new Set<string>();
  while (stack.length) {
    const [t, i] = stack.pop()!;
    const k = key(t, i);
    if (k === target) return fail("This dependency would create a cycle.", "CONSTRUCTION_INVALID", 409);
    if (seen.has(k)) continue;
    seen.add(k);
    const incoming = await tx.constructionDependency.findMany({
      where: { ...where, successorType: t, successorId: i },
      select: { predecessorType: true, predecessorId: true },
    });
    for (const edge of incoming) stack.push([edge.predecessorType, edge.predecessorId]);
  }
}

// ---------------------------------------------------------------------------
// Money engine (canonical §5). Recorded spend remains computed by the existing
// spendRows; this module adds planned / approved / committed / projected.
// ---------------------------------------------------------------------------

export interface MoneySummary {
  basePlannedPaise: string;
  latestTargetPaise: string;
  approvedChangeDeltaPaise: string;
  currentApprovedPaise: string;
  committedPaise: string;
  outstandingCommitmentPaise: string;
  recordedSpendPaise: string;
  remainingVsApprovedPaise: string;
  projectedFinalPaise: string;
  projectionBasis: string;
  explanations: string[];
}

export function formatINR(paise: bigint): string {
  const negative = paise < 0n;
  const abs = negative ? -paise : paise;
  const rupees = Number(abs) / 100;
  let out: string;
  if (abs >= 10000000n * 100n) out = `₹${(rupees / 10000000).toFixed(2)}Cr`;
  else if (abs >= 100000n * 100n) out = `₹${(rupees / 100000).toFixed(2)}L`;
  else if (abs >= 1000n * 100n) out = `₹${(rupees / 1000).toFixed(1)}K`;
  else out = `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return negative ? `-${out}` : out;
}

export async function computeMoneySummary(
  tx: Tx,
  project: { id: string; workspaceId: string; initialBudgetPaise: bigint; budgetPaise: bigint },
  propertyId: string,
  costs: Array<{ id: string; ledgerEntryId: string | null; obligationId: string | null; commitmentId?: string | null }>,
  recordedTotal: bigint,
  spendOf: (costId: string) => bigint,
): Promise<MoneySummary> {
  const where = { projectId: project.id, workspaceId: project.workspaceId };
  const changes = await tx.constructionChange.findMany({ where });
  let delta = 0n;
  const explanations: string[] = [];
  for (const c of changes) {
    if (!["APPROVED", "IMPLEMENTED"].includes(c.status)) continue;
    const impact =
      c.status === "IMPLEMENTED" && c.actualCostImpactPaise !== null
        ? c.actualCostImpactPaise
        : c.estimatedCostImpactPaise;
    delta += impact;
    if (impact !== 0n) {
      const basis = c.status === "IMPLEMENTED" && c.actualCostImpactPaise !== null ? "actual" : "estimated";
      explanations.push(`${c.title} ${impact >= 0n ? "+" : "−"}${formatINR(impact >= 0n ? impact : -impact).slice(1)} (${basis}, ${c.status.toLowerCase()})`);
    }
  }
  const commitments = await tx.constructionCommitment.findMany({ where });
  let committed = 0n;
  for (const cm of commitments) {
    if (!["ACTIVE", "PARTIALLY_FULFILLED"].includes(cm.status)) continue;
    const linked = costs
      .filter((c) => c.commitmentId === cm.id)
      .reduce((n, c) => n + spendOf(c.id), 0n);
    const outstanding = cm.amountPaise - linked > 0n ? cm.amountPaise - linked : 0n;
    committed += outstanding;
  }
  const currentApproved = project.budgetPaise + delta;
  return {
    basePlannedPaise: project.initialBudgetPaise.toString(),
    latestTargetPaise: project.budgetPaise.toString(),
    approvedChangeDeltaPaise: delta.toString(),
    currentApprovedPaise: currentApproved.toString(),
    committedPaise: committed.toString(),
    outstandingCommitmentPaise: committed.toString(),
    recordedSpendPaise: recordedTotal.toString(),
    remainingVsApprovedPaise: (currentApproved - recordedTotal).toString(),
    projectedFinalPaise: currentApproved.toString(),
    projectionBasis: "APPROVED_BUDGET",
    explanations,
  };
}

/** Recompute PARTIALLY_FULFILLED / FULFILLED after linked actuals change. */
export async function refreshCommitmentFulfillment(
  tx: Tx,
  where: { projectId: string; workspaceId: string },
  propertyId: string,
  commitmentId: string,
  spendOfCostIds: (ids: string[]) => Promise<Map<string, bigint>>,
): Promise<"FULFILLED" | "PARTIALLY_FULFILLED" | "ACTIVE" | null> {
  const cm = await tx.constructionCommitment.findFirst({ where: { ...where, id: commitmentId } });
  if (!cm || !["ACTIVE", "PARTIALLY_FULFILLED"].includes(cm.status)) return null;
  const linked = await tx.constructionCost.findMany({ where: { ...where, commitmentId }, select: { id: true } });
  if (!linked.length) return null;
  const amounts = await spendOfCostIds(linked.map((c) => c.id));
  let total = 0n;
  for (const v of amounts.values()) total += v;
  const next = total >= cm.amountPaise ? "FULFILLED" : total > 0n ? "PARTIALLY_FULFILLED" : "ACTIVE";
  if (next !== cm.status) {
    await tx.constructionCommitment.update({ where: { id: cm.id }, data: { status: next } });
    return next;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Derived dependency events (emitted alongside work completions/reopens).
// ---------------------------------------------------------------------------

export async function derivedDependencyEvents(
  tx: Tx,
  where: { projectId: string; workspaceId: string },
): Promise<OsDerivedEvent[]> {
  // Recompute per-successor satisfaction and emit one deterministic event per
  // successor whose *aggregate* state we can describe. To avoid event spam,
  // only successors with at least one dependency are considered, and the
  // suffix pins the successor so repeats collapse onto one requestKey only
  // when the outcome is identical (satisfied vs unsatisfied differ by suffix).
  const deps = await tx.constructionDependency.findMany({ where });
  const successors = new Map<string, { type: string; id: string }>();
  for (const d of deps) successors.set(`${d.successorType}:${d.successorId}`, { type: d.successorType, id: d.successorId });
  const out: OsDerivedEvent[] = [];
  for (const s of successors.values()) {
    const satisfied = await successorSatisfied(tx, where, s.type, s.id);
    out.push({
      suffix: `dep:${s.type}:${s.id}:${satisfied ? "satisfied" : "unsatisfied"}`,
      eventType: satisfied ? "DEPENDENCY_SATISFIED" : "DEPENDENCY_UNSATISFIED",
      payload: { successorType: s.type, successorId: s.id, satisfied },
      visibility: "PROJECT",
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main dispatcher for Construction OS Core 1.0 actions. Returns null when the
// action is not owned by this module (caller falls through to legacy logic).
// ---------------------------------------------------------------------------

export async function handleOsAction(args: {
  tx: Tx;
  userId: string;
  project: OsProject;
  where: { projectId: string; workspaceId: string };
  action: string;
  v: Input;
  base: { id: string; workspaceId: string; projectId: string };
  key: string;
  current: { version: number; budgetPaise: bigint; initialBudgetPaise: bigint; startDate: string };
}): Promise<OsOutcome | null> {
  const { tx, userId, project, where, action, v, base } = args;
  const workspaceId = project.workspaceId;
  const projectId = project.id;

  // ---------------- Plan versions ----------------
  if (action === "PLAN_VERSION_CREATE") {
    const last = await tx.constructionPlanVersion.aggregate({ where, _max: { versionNumber: true } });
    const versionNumber = (last._max.versionNumber ?? 0) + 1;
    const row = await tx.constructionPlanVersion.create({
      data: {
        ...base,
        versionNumber,
        label: text(v.label, "Version label", 200, true),
        notes: text(v.notes, "Notes", 2000, true),
        createdBy: userId,
        status: "DRAFT",
      },
    });
    return { result: row, eventType: "PROJECT_PLAN_VERSION_CREATED", visibility: "PROJECT" };
  }
  if (action === "PLAN_VERSION_ACTIVATE") {
    const id = text(v.planVersionId, "Plan version");
    const row = await tx.constructionPlanVersion.findFirst({ where: { ...where, id } });
    if (!row) return missing();
    if (row.status === "ACTIVE") return fail("This plan version is already active.", "INVALID_TRANSITION", 409);
    if (!["DRAFT"].includes(row.status)) return fail("Only a draft plan version can be activated.", "INVALID_TRANSITION", 409);
    await tx.constructionPlanVersion.updateMany({ where: { ...where, status: "ACTIVE" }, data: { status: "SUPERSEDED", supersededAt: new Date() } });
    const active = await tx.constructionPlanVersion.update({
      where: { id: row.id },
      data: { status: "ACTIVE", activatedAt: new Date() },
    });
    await tx.constructionProject.update({ where: { id: projectId }, data: { currentPlanVersionId: row.id } });
    return {
      result: active,
      eventType: "PROJECT_PLAN_VERSION_ACTIVATED",
      visibility: "PROJECT",
      derived: [{ suffix: `plan:superseded:${row.id}`, eventType: "PROJECT_PLAN_VERSION_SUPERSEDED", payload: { activatedVersionId: row.id }, visibility: "PROJECT" }],
    };
  }

  // ---------------- Milestones ----------------
  if (action === "MILESTONE_CREATE" || action === "MILESTONE_UPDATE") {
    const milestoneId = action === "MILESTONE_UPDATE" ? text(v.milestoneId, "Milestone") : null;
    const existing = milestoneId ? await tx.constructionMilestone.findFirst({ where: { ...where, id: milestoneId } }) : null;
    if (action === "MILESTONE_UPDATE" && !existing) return missing();
    const stageId = v.stageId === undefined ? (existing?.stageId ?? null) : (() => { const s = text(v.stageId, "Stage", 100, true); return s || null; })();
    if (stageId) await requireStage(tx, where, stageId);
    const plannedDate = v.plannedDate === undefined ? (existing?.plannedDate ?? null) : dateOnly(v.plannedDate);
    const actualDate = v.actualDate === undefined ? (existing?.actualDate ?? null) : dateOnly(v.actualDate);
    const status = choice(v.status ?? existing?.status ?? "PLANNED", ["PLANNED", "READY", "IN_PROGRESS", "BLOCKED", "DONE", "SKIPPED", "CANCELLED"], "Milestone status");
    const allowed: Record<string, string[]> = {
      PLANNED: ["READY", "IN_PROGRESS", "BLOCKED", "SKIPPED", "CANCELLED"],
      READY: ["IN_PROGRESS", "BLOCKED", "DONE", "SKIPPED", "CANCELLED"],
      IN_PROGRESS: ["BLOCKED", "DONE", "SKIPPED", "CANCELLED"],
      BLOCKED: ["READY", "IN_PROGRESS", "SKIPPED", "CANCELLED"],
      DONE: [], SKIPPED: [], CANCELLED: [],
    };
    if (existing && status !== existing.status && !allowed[existing.status]?.includes(status))
      return fail("Invalid milestone transition.", "INVALID_TRANSITION", 409);
    const data = {
      stageId,
      name: text(v.name ?? existing?.name, "Milestone name"),
      description: text(v.description ?? existing?.description ?? "", "Description", 2000, true),
      plannedDate, actualDate, status,
    };
    let row;
    if (existing) {
      row = await tx.constructionMilestone.update({ where: { id: existing.id }, data });
    } else {
      const max = await tx.constructionMilestone.aggregate({ where, _max: { sequence: true } });
      row = await tx.constructionMilestone.create({ data: { ...base, ...data, sequence: (max._max.sequence ?? 0) + 1 } });
      if (["READY", "IN_PROGRESS", "DONE"].includes(status) && !(await successorSatisfied(tx, where, "MILESTONE", row.id)))
        return fail("Linked requirements are not satisfied yet.", "DEPENDENCY_BLOCKED", 409);
    }
    if (existing && ["READY", "IN_PROGRESS", "DONE"].includes(status) && !(await successorSatisfied(tx, where, "MILESTONE", row.id)))
      return fail("Linked requirements are not satisfied yet.", "DEPENDENCY_BLOCKED", 409);
    const eventType = status === "DONE" ? "MILESTONE_COMPLETED" : "MILESTONE_READY";
    return { result: row, eventType, visibility: "PROJECT" };
  }

  // ---------------- Dependencies ----------------
  if (action === "DEPENDENCY_CREATE") {
    const predecessorType = choice(v.predecessorType, PREDECESSOR_TYPES, "Predecessor type");
    const successorType = choice(v.successorType, SUCCESSOR_TYPES, "Successor type");
    const predecessorId = text(v.predecessorId, "Predecessor");
    const successorId = text(v.successorId, "Successor");
    if (predecessorType === successorType && predecessorId === successorId)
      return fail("A record cannot depend on itself.");
    const dependencyType = choice(v.dependencyType ?? "FINISH_TO_START", ["FINISH_TO_START"], "Dependency type");
    if ((await endpointStatus(tx, where, predecessorType, predecessorId)) === null) return missing();
    if ((await endpointStatus(tx, where, successorType, successorId)) === null) return missing();
    const duplicate = await tx.constructionDependency.findFirst({
      where: { ...where, predecessorType, predecessorId, successorType, successorId },
    });
    if (duplicate) return fail("This dependency already exists.", "DUPLICATE_DEPENDENCY", 409);
    await assertNoCycle(tx, where, predecessorType, predecessorId, successorType, successorId);
    const row = await tx.constructionDependency.create({
      data: { ...base, predecessorType, predecessorId, successorType, successorId, dependencyType, notes: text(v.notes, "Notes", 2000, true) },
    });
    const satisfied = await predecessorSatisfied(tx, where, predecessorType, predecessorId);
    return {
      result: row,
      eventType: satisfied ? "DEPENDENCY_SATISFIED" : "DEPENDENCY_UNSATISFIED",
      visibility: "PROJECT",
    };
  }
  if (action === "DEPENDENCY_DELETE") {
    const id = text(v.dependencyId, "Dependency");
    const row = await tx.constructionDependency.findFirst({ where: { ...where, id } });
    if (!row) return missing();
    await tx.constructionDependency.delete({ where: { id: row.id } });
    return { result: { id: row.id, removed: true }, eventType: "DEPENDENCY_SATISFIED", visibility: "PROJECT" };
  }

  // ---------------- Decisions ----------------
  if (action === "DECISION_CREATE") {
    const stageId = (() => { const s = text(v.stageId, "Stage", 100, true); return s || null; })();
    const workItemId = (() => { const s = text(v.workItemId, "Work item", 100, true); return s || null; })();
    if (stageId) await requireStage(tx, where, stageId);
    if (workItemId) await requireTask(tx, where, workItemId);
    const dueDate = dateOnly(v.dueDate);
    const row = await tx.constructionDecision.create({
      data: {
        ...base,
        stageId, workItemId,
        requestedBy: userId,
        assignedTo: text(v.assignedTo, "Assigned person"),
        title: text(v.title, "Decision title"),
        context: text(v.context, "Context", 4000, true),
        dueDate,
        status: "OPEN",
      },
    });
    const options = Array.isArray(v.options) ? v.options : [];
    if (options.length > 10) return fail("A decision supports at most 10 options.");
    for (const raw of options) {
      const o = object(raw);
      await tx.constructionDecisionOption.create({
        data: {
          id: randomUUID(), workspaceId, projectId,
          decisionId: row.id,
          label: text(o.label, "Option label"),
          description: text(o.description, "Option description", 2000, true),
          estimatedCostImpactPaise: paise(o.estimatedCostImpactPaise, true),
          estimatedScheduleImpactDays: intIn(o.estimatedScheduleImpactDays ?? 0, -3650, 3650, "Schedule impact") ?? 0,
          attachmentDocumentIds: jsonValue(strArray(o.attachmentDocumentIds, "Attachment")),
        },
      });
    }
    return { result: await tx.constructionDecision.findFirstOrThrow({ where: { ...where, id: row.id }, include: { options: true } }), eventType: "DECISION_REQUESTED", visibility: "PROJECT" };
  }
  if (action === "DECISION_UPDATE") {
    const id = text(v.decisionId, "Decision");
    const row = await tx.constructionDecision.findFirst({ where: { ...where, id } });
    if (!row) return missing();
    if (!["OPEN"].includes(row.status)) return fail("Only an open decision can be updated.", "INVALID_TRANSITION", 409);
    const dueDate = v.dueDate === undefined ? row.dueDate : dateOnly(v.dueDate);
    const dueChanged = dueDate !== row.dueDate;
    const data: Record<string, unknown> = {
      title: v.title === undefined ? row.title : text(v.title, "Decision title"),
      context: v.context === undefined ? row.context : text(v.context, "Context", 4000, true),
      assignedTo: v.assignedTo === undefined ? row.assignedTo : text(v.assignedTo, "Assigned person"),
      dueDate,
    };
    if (v.stageId !== undefined) {
      const s = text(v.stageId, "Stage", 100, true) || null;
      if (s) await requireStage(tx, where, s);
      data.stageId = s;
    }
    if (v.workItemId !== undefined) {
      const s = text(v.workItemId, "Work item", 100, true) || null;
      if (s) await requireTask(tx, where, s);
      data.workItemId = s;
    }
    if (Array.isArray(v.addOptions)) {
      const current = await tx.constructionDecisionOption.count({ where: { ...where, decisionId: id } });
      const incoming = v.addOptions as unknown[];
      if (current + incoming.length > 10) return fail("A decision supports at most 10 options.");
      for (const raw of incoming) {
        const o = object(raw);
        await tx.constructionDecisionOption.create({
          data: {
            id: randomUUID(), workspaceId, projectId, decisionId: id,
            label: text(o.label, "Option label"),
            description: text(o.description, "Option description", 2000, true),
            estimatedCostImpactPaise: paise(o.estimatedCostImpactPaise, true),
            estimatedScheduleImpactDays: intIn(o.estimatedScheduleImpactDays ?? 0, -3650, 3650, "Schedule impact") ?? 0,
            attachmentDocumentIds: jsonValue(strArray(o.attachmentDocumentIds, "Attachment")),
          },
        });
      }
    }
    const updated = await tx.constructionDecision.update({ where: { id: row.id }, data });
    return { result: updated, eventType: dueChanged ? "DECISION_DUE_CHANGED" : "DECISION_REQUESTED", visibility: "PROJECT" };
  }
  if (action === "DECISION_RECORD" || action === "DECISION_DEFER" || action === "DECISION_CANCEL") {
    const id = text(v.decisionId, "Decision");
    const row = await tx.constructionDecision.findFirst({ where: { ...where, id }, include: { options: true } });
    if (!row) return missing();
    if (!["OPEN"].includes(row.status)) return fail("This decision is already closed.", "INVALID_TRANSITION", 409);
    if (action === "DECISION_RECORD") {
      const selectedOptionId = text(v.selectedOptionId, "Selected option", 100, true) || null;
      if (selectedOptionId && !row.options.some((o) => o.id === selectedOptionId)) return missing();
      const updated = await tx.constructionDecision.update({
        where: { id: row.id },
        data: { status: "DECIDED", selectedOptionId, decisionComment: text(v.decisionComment, "Decision note", 2000, true), decidedAt: new Date() },
      });
      return {
        result: updated,
        eventType: "DECISION_RECORDED",
        visibility: "PROJECT",
        derived: await derivedDependencyEvents(tx, where),
      };
    }
    if (action === "DECISION_DEFER") {
      const updated = await tx.constructionDecision.update({
        where: { id: row.id },
        data: { status: "DEFERRED", decisionComment: text(v.decisionComment, "Decision note", 2000, true) },
      });
      return { result: updated, eventType: "DECISION_DEFERRED", visibility: "PROJECT" };
    }
    const updated = await tx.constructionDecision.update({ where: { id: row.id }, data: { status: "CANCELLED" } });
    return { result: updated, eventType: "DECISION_CANCELLED", visibility: "PROJECT" };
  }

  // ---------------- Issues (first-class, separate from WorkItem) ----------------
  if (action === "ISSUE_CREATE") {
    const stageId = (() => { const s = text(v.stageId, "Stage", 100, true); return s || null; })();
    const workItemId = (() => { const s = text(v.workItemId, "Work item", 100, true); return s || null; })();
    if (stageId) await requireStage(tx, where, stageId);
    if (workItemId) await requireTask(tx, where, workItemId);
    const row = await tx.constructionIssue.create({
      data: {
        ...base, stageId, workItemId,
        title: text(v.title, "Issue title"),
        description: text(v.description, "Description", 5000, true),
        severity: choice(v.severity ?? "MEDIUM", ["LOW", "MEDIUM", "HIGH", "CRITICAL"], "Severity"),
        status: "OPEN",
        reportedBy: userId,
        assignedTo: text(v.assignedTo, "Assigned person", 200, true) || null,
        costImpactPaise: v.costImpactPaise === undefined ? null : paise(v.costImpactPaise),
        scheduleImpactDays: intIn(v.scheduleImpactDays ?? null, 0, 3650, "Schedule impact", true),
        photoRefs: jsonValue(strArray(v.photoRefs, "Photo")),
        attachmentDocumentIds: jsonValue(strArray(v.attachmentDocumentIds, "Attachment")),
      },
    });
    return { result: row, eventType: "ISSUE_OPENED", visibility: "PROJECT" };
  }
  if (action === "ISSUE_UPDATE") {
    const id = text(v.issueId, "Issue");
    const row = await tx.constructionIssue.findFirst({ where: { ...where, id } });
    if (!row) return missing();
    const status = choice(v.status ?? row.status, ["OPEN", "INVESTIGATING", "ACTION_REQUIRED", "RESOLVED", "CLOSED"], "Issue status");
    const allowed: Record<string, string[]> = {
      OPEN: ["INVESTIGATING", "ACTION_REQUIRED", "RESOLVED", "CLOSED"],
      INVESTIGATING: ["ACTION_REQUIRED", "RESOLVED", "OPEN", "CLOSED"],
      ACTION_REQUIRED: ["INVESTIGATING", "RESOLVED", "OPEN"],
      RESOLVED: ["CLOSED", "ACTION_REQUIRED", "OPEN"],
      CLOSED: ["OPEN"],
    };
    if (status !== row.status && !allowed[row.status]?.includes(status))
      return fail("Invalid issue transition.", "INVALID_TRANSITION", 409);
    const assignedTo = v.assignedTo === undefined ? row.assignedTo : text(v.assignedTo, "Assigned person", 200, true) || null;
    const assignedChanged = assignedTo !== row.assignedTo;
    const resolution = v.resolution === undefined ? row.resolution : text(v.resolution, "Resolution", 4000, true);
    if (["RESOLVED", "CLOSED"].includes(status) && !resolution) return fail("Record a resolution before closing this issue.");
    const updated = await tx.constructionIssue.update({
      where: { id: row.id },
      data: {
        status,
        assignedTo,
        title: v.title === undefined ? row.title : text(v.title, "Issue title"),
        description: v.description === undefined ? row.description : text(v.description, "Description", 5000, true),
        severity: v.severity === undefined ? row.severity : choice(v.severity, ["LOW", "MEDIUM", "HIGH", "CRITICAL"], "Severity"),
        costImpactPaise: v.costImpactPaise === undefined ? row.costImpactPaise : paise(v.costImpactPaise),
        scheduleImpactDays: v.scheduleImpactDays === undefined ? row.scheduleImpactDays : intIn(v.scheduleImpactDays, 0, 3650, "Schedule impact"),
        resolution,
        resolvedAt: ["RESOLVED", "CLOSED"].includes(status) ? (row.resolvedAt ?? new Date()) : null,
        photoRefs: v.photoRefs === undefined ? undefined : jsonValue(strArray(v.photoRefs, "Photo")),
      },
    });
    let eventType = "ISSUE_UPDATED";
    if (status !== row.status) {
      if (status === "ACTION_REQUIRED") eventType = "ISSUE_ACTION_REQUIRED";
      else if (status === "RESOLVED") eventType = "ISSUE_RESOLVED";
      else if (status === "CLOSED") eventType = "ISSUE_CLOSED";
      else if (row.status === "RESOLVED" || row.status === "CLOSED") eventType = "ISSUE_REOPENED";
    } else if (assignedChanged) eventType = "ISSUE_ASSIGNED";
    const derived: OsDerivedEvent[] = [];
    if (assignedChanged && eventType !== "ISSUE_ASSIGNED")
      derived.push({ suffix: `issue:${id}:assigned`, eventType: "ISSUE_ASSIGNED", payload: { issueId: id, assignedTo }, visibility: "PROJECT" });
    return { result: updated, eventType, visibility: "PROJECT", derived };
  }

  // ---------------- Inspections ----------------
  if (action === "INSPECTION_RECORD") {
    const stageId = (() => { const s = text(v.stageId, "Stage", 100, true); return s || null; })();
    const workItemId = (() => { const s = text(v.workItemId, "Work item", 100, true); return s || null; })();
    if (stageId) await requireStage(tx, where, stageId);
    if (workItemId) await requireTask(tx, where, workItemId);
    const performedAtRaw = text(v.performedAt, "Inspection date", 30);
    const performedAt = new Date(performedAtRaw.length === 10 ? `${performedAtRaw}T12:00:00.000Z` : performedAtRaw);
    if (!Number.isFinite(performedAt.getTime())) return fail("Use a valid inspection date.");
    const result = choice(v.result ?? "RECORDED", ["RECORDED", "PASS_RECORDED", "CONCERN_RECORDED", "RECHECK_REQUIRED"], "Inspection result");
    const status = choice(v.status ?? (performedAt.getTime() > Date.now() ? "SCHEDULED" : "RECORDED"), ["SCHEDULED", "RECORDED", "CANCELLED"], "Inspection status");
    const issueIds = strArray(v.issueIds, "Issue");
    for (const issueId of issueIds) {
      if (!(await tx.constructionIssue.findFirst({ where: { ...where, id: issueId } }))) return missing();
    }
    // Consumer copy must not overstate the inspection's meaning: RECORDED by
    // default, never "approved/certified".
    const row = await tx.constructionInspection.create({
      data: {
        ...base, stageId, workItemId,
        performedBy: text(v.performedBy, "Recorded by"),
        performedAt,
        title: text(v.title, "Inspection title"),
        status, result,
        notes: text(v.notes, "Notes", 4000, true),
        checklist: v.checklist === undefined ? undefined : jsonValue(v.checklist),
        issueIds: jsonValue(issueIds),
        documentIds: jsonValue(strArray(v.documentIds, "Document")),
        photoRefs: jsonValue(strArray(v.photoRefs, "Photo")),
      },
    });
    const eventType =
      result === "CONCERN_RECORDED" ? "INSPECTION_CONCERN_RECORDED"
      : result === "RECHECK_REQUIRED" ? "INSPECTION_RECHECK_REQUIRED"
      : "INSPECTION_RECORDED";
    return { result: row, eventType, visibility: "PROJECT" };
  }

  // ---------------- Changes ----------------
  if (action === "CHANGE_PROPOSE") {
    const stageId = (() => { const s = text(v.stageId, "Stage", 100, true); return s || null; })();
    if (stageId) await requireStage(tx, where, stageId);
    const row = await tx.constructionChange.create({
      data: {
        ...base, stageId,
        title: text(v.title, "Change title"),
        reason: text(v.reason, "Reason", 4000),
        requestedBy: userId,
        originalScope: text(v.originalScope, "Original scope", 4000, true),
        revisedScope: text(v.revisedScope, "Revised scope", 4000, true),
        estimatedCostImpactPaise: paise(v.estimatedCostImpactPaise, true),
        estimatedScheduleImpactDays: intIn(v.estimatedScheduleImpactDays ?? 0, -3650, 3650, "Schedule impact") ?? 0,
        affectedWorkItemIds: jsonValue(strArray(v.affectedWorkItemIds, "Work item")),
        documentIds: jsonValue(strArray(v.documentIds, "Document")),
        status: "PROPOSED",
      },
    });
    return { result: row, eventType: "CHANGE_PROPOSED", visibility: "PROJECT" };
  }
  if (action === "CHANGE_IMPACT" || action === "CHANGE_DECIDE") {
    const id = text(v.changeId, "Change");
    const row = await tx.constructionChange.findFirst({ where: { ...where, id } });
    if (!row) return missing();
    if (action === "CHANGE_IMPACT") {
      if (!["PROPOSED", "IMPACT_RECORDED"].includes(row.status)) return fail("Impact can only be recorded while a change is proposed.", "INVALID_TRANSITION", 409);
      const updated = await tx.constructionChange.update({
        where: { id: row.id },
        data: {
          status: "IMPACT_RECORDED",
          estimatedCostImpactPaise: v.estimatedCostImpactPaise === undefined ? row.estimatedCostImpactPaise : paise(v.estimatedCostImpactPaise),
          estimatedScheduleImpactDays: v.estimatedScheduleImpactDays === undefined ? row.estimatedScheduleImpactDays : (intIn(v.estimatedScheduleImpactDays, -3650, 3650, "Schedule impact") ?? 0),
          actualCostImpactPaise: v.actualCostImpactPaise === undefined ? row.actualCostImpactPaise : paise(v.actualCostImpactPaise),
          actualScheduleImpactDays: v.actualScheduleImpactDays === undefined ? row.actualScheduleImpactDays : intIn(v.actualScheduleImpactDays, -3650, 3650, "Schedule impact"),
        },
      });
      return { result: updated, eventType: "CHANGE_IMPACT_RECORDED", visibility: "PROJECT" };
    }
    const decision = choice(v.decision, ["SUBMIT", "APPROVE", "REJECT", "IMPLEMENT", "CANCEL"], "Change decision");
    const transitions: Record<string, string[]> = {
      SUBMIT: ["PROPOSED", "IMPACT_RECORDED"],
      APPROVE: ["PROPOSED", "IMPACT_RECORDED", "AWAITING_DECISION"],
      REJECT: ["PROPOSED", "IMPACT_RECORDED", "AWAITING_DECISION"],
      IMPLEMENT: ["APPROVED"],
      CANCEL: ["PROPOSED", "IMPACT_RECORDED", "AWAITING_DECISION", "APPROVED"],
    };
    if (!transitions[decision]?.includes(row.status)) return fail("Invalid change transition.", "INVALID_TRANSITION", 409);
    const next = decision === "SUBMIT" ? "AWAITING_DECISION" : decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : decision === "IMPLEMENT" ? "IMPLEMENTED" : "CANCELLED";
    const updated = await tx.constructionChange.update({
      where: { id: row.id },
      data: {
        status: next,
        approvedBy: ["APPROVE", "REJECT"].includes(decision) ? userId : row.approvedBy,
        decidedAt: ["APPROVE", "REJECT"].includes(decision) ? new Date() : row.decidedAt,
        implementedAt: decision === "IMPLEMENT" ? new Date() : row.implementedAt,
        actualCostImpactPaise: v.actualCostImpactPaise === undefined ? row.actualCostImpactPaise : paise(v.actualCostImpactPaise),
        actualScheduleImpactDays: v.actualScheduleImpactDays === undefined ? row.actualScheduleImpactDays : intIn(v.actualScheduleImpactDays, -3650, 3650, "Schedule impact"),
      },
    });
    const eventType =
      next === "APPROVED" ? "CHANGE_APPROVED"
      : next === "REJECTED" ? "CHANGE_REJECTED"
      : next === "IMPLEMENTED" ? "CHANGE_IMPLEMENTED"
      : next === "CANCELLED" ? "CHANGE_CANCELLED"
      : "CHANGE_AWAITING_DECISION";
    return { result: updated, eventType, visibility: "PROJECT" };
  }

  // ---------------- Commitments ----------------
  if (action === "COMMITMENT_CREATE") {
    const amount = paise(v.amountPaise);
    if (amount <= 0n) return fail("Commitment amount must be positive.");
    const budgetCategoryId = text(v.budgetCategoryId, "Budget category", 100, true) || null;
    if (budgetCategoryId && !(await tx.constructionBudgetItem.findFirst({ where: { ...where, id: budgetCategoryId } }))) return missing();
    const row = await tx.constructionCommitment.create({
      data: {
        ...base,
        budgetCategoryId,
        vendorOrPersonId: text(v.vendorOrPersonId, "Vendor", 200, true) || null,
        title: text(v.title, "Commitment title"),
        amountPaise: amount,
        currency: "INR",
        status: choice(v.status ?? "ACTIVE", ["DRAFT", "ACTIVE"], "Commitment status"),
        expectedBy: dateOnly(v.expectedBy),
        sourceType: text(v.sourceType, "Source type", 60, true) || null,
        sourceId: text(v.sourceId, "Source", 200, true) || null,
        notes: text(v.notes, "Notes", 2000, true),
      },
    });
    return { result: row, eventType: "COMMITMENT_CREATED", visibility: "PROJECT" };
  }
  if (action === "COMMITMENT_UPDATE") {
    const id = text(v.commitmentId, "Commitment");
    const row = await tx.constructionCommitment.findFirst({ where: { ...where, id } });
    if (!row) return missing();
    const status = choice(v.status ?? row.status, ["DRAFT", "ACTIVE", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"], "Commitment status");
    const allowed: Record<string, string[]> = {
      DRAFT: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"],
      PARTIALLY_FULFILLED: ["FULFILLED", "CANCELLED"],
      FULFILLED: [], CANCELLED: [],
    };
    if (status !== row.status && !allowed[row.status]?.includes(status))
      return fail("Invalid commitment transition.", "INVALID_TRANSITION", 409);
    if (status === "CANCELLED") {
      const linked = await tx.constructionCost.count({ where: { ...where, commitmentId: id } });
      if (linked) return fail("A commitment with recorded spend cannot be cancelled. Record a correction instead.", "COMMITMENT_HAS_SPEND", 409);
    }
    const updated = await tx.constructionCommitment.update({
      where: { id: row.id },
      data: {
        status,
        title: v.title === undefined ? row.title : text(v.title, "Commitment title"),
        expectedBy: v.expectedBy === undefined ? row.expectedBy : dateOnly(v.expectedBy),
        notes: v.notes === undefined ? row.notes : text(v.notes, "Notes", 2000, true),
      },
    });
    const eventType = status === "FULFILLED" ? "COMMITMENT_FULFILLED" : status === "CANCELLED" ? "COMMITMENT_CANCELLED" : "COMMITMENT_UPDATED";
    return { result: updated, eventType, visibility: "PROJECT" };
  }

  // ---------------- Procurement: quotes / orders / deliveries ----------------
  if (action === "QUOTE_RECORD") {
    const materialRequirementId = text(v.materialRequirementId, "Material requirement");
    const req = await tx.materialRequirement.findFirst({ where: { ...where, id: materialRequirementId } });
    if (!req) return missing();
    const qty = (() => {
      const raw = String(v.quantity);
      if (!/^[0-9]{1,10}(\.\d{1,3})?$/.test(raw) || Number(raw) <= 0) return fail("Quantity must be positive with at most three decimals.");
      return raw;
    })();
    const unit = text(v.unit, "Unit", 40);
    if (unit !== req.unit) return fail("Quote unit must match the material requirement unit.");
    const unitRate = paise(v.unitRatePaise);
    if (unitRate <= 0n) return fail("Unit rate must be positive.");
    const tax = paise(v.taxPaise, true);
    const delivery = paise(v.deliveryChargePaise, true);
    const row = await tx.supplierQuote.create({
      data: {
        ...base, materialRequirementId,
        supplierName: text(v.supplierName, "Supplier"),
        supplierId: text(v.supplierId, "Supplier", 200, true) || null,
        quantity: qty as unknown as Prisma.Decimal,
        unit, unitRatePaise: unitRate, taxPaise: tax, deliveryChargePaise: delivery,
        totalPaise: v.totalPaise === undefined ? unitRate * BigInt(Math.round(Number(qty) * 1000)) / 1000n + tax + delivery : paise(v.totalPaise),
        deliveryDate: dateOnly(v.deliveryDate),
        validUntil: dateOnly(v.validUntil),
        documentId: text(v.documentId, "Document", 200, true) || null,
        status: "RECEIVED",
      },
    });
    if (req.status === "PLANNED") await tx.materialRequirement.update({ where: { id: req.id }, data: { status: "QUOTE_REQUIRED" } });
    return { result: row, eventType: "SUPPLIER_QUOTE_RECORDED", visibility: "PROJECT" };
  }
  if (action === "QUOTE_SELECT") {
    const id = text(v.quoteId, "Quote");
    const quote = await tx.supplierQuote.findFirst({ where: { ...where, id } });
    if (!quote) return missing();
    if (quote.status === "SELECTED") return fail("This quote is already selected.", "INVALID_TRANSITION", 409);
    if (!["RECEIVED"].includes(quote.status)) return fail("Only a received quote can be selected.", "INVALID_TRANSITION", 409);
    await tx.supplierQuote.updateMany({ where: { ...where, materialRequirementId: quote.materialRequirementId, status: "RECEIVED" }, data: { status: "REJECTED" } });
    const selected = await tx.supplierQuote.update({ where: { id: quote.id }, data: { status: "SELECTED" } });
    await tx.materialRequirement.update({ where: { id: quote.materialRequirementId }, data: { status: "SELECTED" } });
    return { result: selected, eventType: "SUPPLIER_QUOTE_SELECTED", visibility: "PROJECT" };
  }
  if (action === "ORDER_PLACE") {
    const materialRequirementId = text(v.materialRequirementId, "Material requirement", 100, true) || null;
    if (materialRequirementId && !(await tx.materialRequirement.findFirst({ where: { ...where, id: materialRequirementId } }))) return missing();
    const qty = (() => {
      const raw = String(v.orderedQuantity);
      if (!/^[0-9]{1,10}(\.\d{1,3})?$/.test(raw) || Number(raw) <= 0) return fail("Ordered quantity must be positive with at most three decimals.");
      return raw;
    })();
    const total = paise(v.totalPaise);
    if (total <= 0n) return fail("Order total must be positive.");
    const commitmentId = text(v.commitmentId, "Commitment", 100, true) || null;
    if (commitmentId && !(await tx.constructionCommitment.findFirst({ where: { ...where, id: commitmentId } }))) return missing();
    const order = await tx.constructionOrder.create({
      data: {
        ...base, materialRequirementId, commitmentId,
        supplierName: text(v.supplierName, "Supplier"),
        supplierId: text(v.supplierId, "Supplier", 200, true) || null,
        orderedQuantity: qty as unknown as Prisma.Decimal,
        unit: text(v.unit, "Unit", 40),
        totalPaise: total,
        expectedDelivery: dateOnly(v.expectedDelivery),
        documentId: text(v.documentId, "Document", 200, true) || null,
        status: "PLACED",
      },
    });
    const derived: OsDerivedEvent[] = [];
    // An order is agreed future spend: mirror it as an ACTIVE commitment so
    // the money engine distinguishes committed from recorded spend. The title
    // names the material so owners recognize it (not just the vendor).
    let commitment = commitmentId ? await tx.constructionCommitment.findFirst({ where: { ...where, id: commitmentId } }) : null;
    if (!commitment) {
      const materialName = materialRequirementId
        ? (await tx.materialRequirement.findFirst({ where: { ...where, id: materialRequirementId }, select: { name: true } }))?.name ?? null
        : null;
      commitment = await tx.constructionCommitment.create({
        data: {
          id: `${order.id}:commit`, workspaceId, projectId,
          title: materialName ? `${materialName} order — ${order.supplierName}` : `Order — ${order.supplierName}`,
          amountPaise: total, currency: "INR", status: "ACTIVE",
          expectedBy: order.expectedDelivery,
          sourceType: "ORDER", sourceId: order.id,
          notes: "",
        },
      });
      await tx.constructionOrder.update({ where: { id: order.id }, data: { commitmentId: commitment.id } });
      derived.push({ suffix: `order:${order.id}:commitment`, eventType: "COMMITMENT_CREATED", payload: { orderId: order.id, commitmentId: commitment.id, amountPaise: total.toString() }, visibility: "PROJECT" });
    }
    if (materialRequirementId) {
      await tx.materialRequirement.update({ where: { id: materialRequirementId }, data: { status: "ORDERED" } });
    }
    return { result: { ...order, commitmentId: commitment.id }, eventType: "ORDER_PLACED", visibility: "PROJECT", derived };
  }
  if (action === "ORDER_CANCEL") {
    const id = text(v.orderId, "Order");
    const order = await tx.constructionOrder.findFirst({ where: { ...where, id } });
    if (!order) return missing();
    if (!["PLACED", "PARTIALLY_DELIVERED"].includes(order.status)) return fail("Only an open order can be cancelled.", "INVALID_TRANSITION", 409);
    const derived: OsDerivedEvent[] = [];
    if (order.commitmentId) {
      const linked = await tx.constructionCost.count({ where: { ...where, commitmentId: order.commitmentId } });
      if (!linked) {
        await tx.constructionCommitment.updateMany({ where: { ...where, id: order.commitmentId }, data: { status: "CANCELLED" } });
        derived.push({ suffix: `order:${order.id}:commitment-cancelled`, eventType: "COMMITMENT_CANCELLED", payload: { orderId: order.id, commitmentId: order.commitmentId }, visibility: "PROJECT" });
      }
    }
    const updated = await tx.constructionOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    return { result: updated, eventType: "ORDER_CANCELLED", visibility: "PROJECT", derived };
  }
  if (action === "DELIVERY_RECORD") {
    const orderId = text(v.orderId, "Order", 100, true) || null;
    const order = orderId ? await tx.constructionOrder.findFirst({ where: { ...where, id: orderId } }) : null;
    if (orderId && !order) return missing();
    const materialRequirementId =
      text(v.materialRequirementId, "Material requirement", 100, true) || order?.materialRequirementId || null;
    if (materialRequirementId && !(await tx.materialRequirement.findFirst({ where: { ...where, id: materialRequirementId } }))) return missing();
    const dec = (raw: unknown, label: string, allowZero: boolean) => {
      const s = String(raw);
      if (!/^[0-9]{1,10}(\.\d{1,3})?$/.test(s) || Number(s) < 0 || (!allowZero && Number(s) <= 0)) return fail(`${label} is invalid.`);
      return s;
    };
    const expected = v.expectedQuantity === undefined || v.expectedQuantity === null || v.expectedQuantity === ""
      ? (order ? order.orderedQuantity.toString() : null)
      : dec(v.expectedQuantity, "Expected quantity", true);
    const received = dec(v.receivedQuantity, "Received quantity", true);
    const row = await tx.constructionDelivery.create({
      data: {
        ...base, orderId, materialRequirementId,
        supplierName: text(v.supplierName, "Supplier", 200, true) || order?.supplierName || null,
        expectedQuantity: (expected ?? null) as unknown as Prisma.Decimal | null,
        receivedQuantity: received as unknown as Prisma.Decimal,
        unit: text(v.unit, "Unit", 40),
        receivedBy: text(v.receivedBy ?? userId, "Received by", 200, true) || userId,
        receivedAt: v.receivedAt ? new Date(`${text(v.receivedAt, "Received date", 30)}T12:00:00.000Z`) : new Date(),
        condition: text(v.condition, "Condition", 200, true) || null,
        challanDocumentId: text(v.challanDocumentId, "Challan", 200, true) || null,
        photoRefs: jsonValue(strArray(v.photoRefs, "Photo")),
        notes: text(v.notes, "Notes", 2000, true),
      },
    });
    const short = expected !== null && Number(received) < Number(expected);
    const partial = order ? Number(received) < Number(order.orderedQuantity.toString()) : short;
    if (order) {
      await tx.constructionOrder.update({
        where: { id: order.id },
        data: { status: Number(received) <= 0 ? order.status : partial ? "PARTIALLY_DELIVERED" : "DELIVERED" },
      });
    }
    if (materialRequirementId) {
      await tx.materialRequirement.update({
        where: { id: materialRequirementId },
        data: { status: partial ? "PARTIALLY_RECEIVED" : "RECEIVED" },
      });
    }
    // A shortage is recorded as evidence. No supplier fault is inferred.
    const eventType = short ? "DELIVERY_SHORTAGE_RECORDED" : partial ? "MATERIAL_PARTIALLY_DELIVERED" : "MATERIAL_DELIVERED";
    return {
      result: { ...row, shortage: short ? String(Number(expected!) - Number(received)) : "0" },
      eventType,
      visibility: "PROJECT",
    };
  }

  // ---------------- Document context ----------------
  if (action === "DOCUMENT_UNLINK") {
    const id = text(v.linkId, "Document link");
    const row = await tx.constructionDocumentLink.findFirst({ where: { ...where, id } });
    if (!row) return missing();
    await tx.constructionDocumentLink.delete({ where: { id: row.id } });
    return { result: { id: row.id, removed: true }, eventType: "CONSTRUCTION_DOCUMENT_UNLINKED", visibility: "DOCUMENT" };
  }
  if (action === "DOCUMENT_CONTEXT_SET") {
    const id = text(v.linkId, "Document link");
    const row = await tx.constructionDocumentLink.findFirst({ where: { ...where, id } });
    if (!row) return missing();
    const contextType = choice(v.contextType ?? row.contextType, DOCUMENT_CONTEXTS, "Context type");
    const contextId = text(v.contextId, "Context", 100, true) || null;
    if (contextId) {
      const exists =
        contextType === "STAGE" ? await tx.constructionStage.findFirst({ where: { ...where, id: contextId } })
        : contextType === "MILESTONE" ? await tx.constructionMilestone.findFirst({ where: { ...where, id: contextId } })
        : contextType === "WORK_ITEM" ? await tx.constructionTask.findFirst({ where: { ...where, id: contextId } })
        : contextType === "DECISION" ? await tx.constructionDecision.findFirst({ where: { ...where, id: contextId } })
        : contextType === "ISSUE" ? await tx.constructionIssue.findFirst({ where: { ...where, id: contextId } })
        : contextType === "INSPECTION" ? await tx.constructionInspection.findFirst({ where: { ...where, id: contextId } })
        : contextType === "CHANGE" ? await tx.constructionChange.findFirst({ where: { ...where, id: contextId } })
        : contextType === "COMMITMENT" ? await tx.constructionCommitment.findFirst({ where: { ...where, id: contextId } })
        : contextType === "EXPENSE" ? await tx.constructionCost.findFirst({ where: { ...where, id: contextId } })
        : contextType === "MATERIAL" ? await tx.materialRequirement.findFirst({ where: { ...where, id: contextId } })
        : contextType === "ORDER" ? await tx.constructionOrder.findFirst({ where: { ...where, id: contextId } })
        : contextType === "DELIVERY" ? await tx.constructionDelivery.findFirst({ where: { ...where, id: contextId } })
        : contextType === "HANDOVER" ? await tx.constructionHandover.findFirst({ where: { ...where, id: contextId } })
        : true;
      if (!exists) return missing();
    }
    const updated = await tx.constructionDocumentLink.update({
      where: { id: row.id },
      data: { contextType, contextId, label: text(v.label ?? row.label, "Label", 200, true) },
    });
    return { result: updated, eventType: "CONSTRUCTION_DOCUMENT_LINKED", visibility: "DOCUMENT" };
  }

  // ---------------- Handover ----------------
  if (action === "HANDOVER_START" || action === "HANDOVER_UPDATE" || action === "HANDOVER_COMPLETE") {
    let handover = await tx.constructionHandover.findUnique({ where: { projectId } });
    if (action === "HANDOVER_START") {
      if (handover && handover.status === "COMPLETED") return fail("Handover is already complete.", "INVALID_TRANSITION", 409);
      handover = handover
        ? await tx.constructionHandover.update({ where: { id: handover.id }, data: { status: "IN_PROGRESS", handoverDate: dateOnly(v.handoverDate) ?? handover.handoverDate, notes: v.notes === undefined ? handover.notes : text(v.notes, "Notes", 4000, true) } })
        : await tx.constructionHandover.create({ data: { ...base, status: "IN_PROGRESS", handoverDate: dateOnly(v.handoverDate), notes: text(v.notes, "Notes", 4000, true) } });
      return { result: handover, eventType: "HANDOVER_STARTED", visibility: "PROJECT" };
    }
    if (!handover) return fail("Start handover before recording handover details.", "HANDOVER_NOT_STARTED", 409);
    if (handover.status === "COMPLETED") return fail("Handover is already complete.", "INVALID_TRANSITION", 409);
    if (action === "HANDOVER_UPDATE") {
      const prevSnags = new Set<string>(Array.isArray(handover.snagItemIds) ? (handover.snagItemIds as string[]) : []);
      const snagItemIds = v.snagItemIds === undefined ? [...prevSnags] : strArray(v.snagItemIds, "Snag item");
      for (const snagId of snagItemIds) {
        if (!(await tx.constructionIssue.findFirst({ where: { ...where, id: snagId } }))) return missing();
      }
      const addedDocs = v.finalDocumentIds !== undefined || v.warranties !== undefined || v.manuals !== undefined;
      const addedSnags = snagItemIds.filter((s) => !prevSnags.has(s));
      const resolvedSnags = [...prevSnags].filter((s) => !snagItemIds.includes(s));
      const updated = await tx.constructionHandover.update({
        where: { id: handover.id },
        data: {
          status: "IN_PROGRESS",
          finalPhotoRefs: v.finalPhotoRefs === undefined ? undefined : jsonValue(strArray(v.finalPhotoRefs, "Photo")),
          finalDocumentIds: v.finalDocumentIds === undefined ? undefined : jsonValue(strArray(v.finalDocumentIds, "Document")),
          warranties: v.warranties === undefined ? undefined : jsonValue(v.warranties),
          manuals: v.manuals === undefined ? undefined : jsonValue(v.manuals),
          professionalRecords: v.professionalRecords === undefined ? undefined : jsonValue(v.professionalRecords),
          snagItemIds: jsonValue(snagItemIds),
          notes: v.notes === undefined ? handover.notes : text(v.notes, "Notes", 4000, true),
        },
      });
      const derived: OsDerivedEvent[] = [];
      for (const s of addedSnags) derived.push({ suffix: `snag:open:${s}`, eventType: "SNAG_ITEM_OPENED", payload: { handoverId: handover.id, issueId: s }, visibility: "PROJECT" });
      for (const s of resolvedSnags) derived.push({ suffix: `snag:resolved:${s}`, eventType: "SNAG_ITEM_RESOLVED", payload: { handoverId: handover.id, issueId: s }, visibility: "PROJECT" });
      return {
        result: updated,
        eventType: addedDocs ? "HANDOVER_DOCUMENT_ADDED" : addedSnags.length ? "SNAG_ITEM_OPENED" : resolvedSnags.length ? "SNAG_ITEM_RESOLVED" : "HANDOVER_STARTED",
        visibility: "PROJECT",
        derived,
      };
    }
    // HANDOVER_COMPLETE: snapshot spend, keep full history (never delete).
    const handoverDate = dateOnly(v.handoverDate, false)!;
    const issues = await tx.constructionIssue.findMany({ where: { ...where, status: { in: ["OPEN", "INVESTIGATING", "ACTION_REQUIRED"] } }, select: { id: true } });
    const openSnags = (Array.isArray(handover.snagItemIds) ? (handover.snagItemIds as string[]) : []).filter((s) => issues.some((i) => i.id === s));
    if (openSnags.length || issues.length)
      return fail("Resolve open issues and snag items before completing handover.", "HANDOVER_OPEN_ITEMS", 409);
    const costs = await tx.constructionCost.findMany({ where: { ...where }, select: { id: true, ledgerEntryId: true, obligationId: true } });
    // Recorded spend snapshot uses the same canonical ledger math as Budget.
    const { spendRows } = await import("@/lib/construction");
    const amounts = await spendRows(tx, workspaceId, project.propertyId ?? "", costs);
    const spend = amounts.reduce((n, c) => n + c.amountPaise, 0n);
    const updated = await tx.constructionHandover.update({
      where: { id: handover.id },
      data: { status: "COMPLETED", handoverDate, finalRecordedSpendPaise: spend, completedAt: new Date() },
    });
    return { result: updated, eventType: "HANDOVER_COMPLETED", visibility: "PROJECT" };
  }

  return null;
}

export const OS_ACTION_NAMES = [
  "PLAN_VERSION_CREATE", "PLAN_VERSION_ACTIVATE",
  "MILESTONE_CREATE", "MILESTONE_UPDATE",
  "DEPENDENCY_CREATE", "DEPENDENCY_DELETE",
  "DECISION_CREATE", "DECISION_UPDATE", "DECISION_RECORD", "DECISION_DEFER", "DECISION_CANCEL",
  "ISSUE_CREATE", "ISSUE_UPDATE",
  "INSPECTION_RECORD",
  "CHANGE_PROPOSE", "CHANGE_IMPACT", "CHANGE_DECIDE",
  "COMMITMENT_CREATE", "COMMITMENT_UPDATE",
  "QUOTE_RECORD", "QUOTE_SELECT",
  "ORDER_PLACE", "ORDER_CANCEL",
  "DELIVERY_RECORD",
  "DOCUMENT_UNLINK", "DOCUMENT_CONTEXT_SET",
  "HANDOVER_START", "HANDOVER_UPDATE", "HANDOVER_COMPLETE",
];

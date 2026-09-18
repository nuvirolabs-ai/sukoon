import { createHash, randomUUID } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getActiveSharesForUser, shareScopeAllows } from "@/lib/authz";
import { formatINR, todayIso } from "@/lib/construction-os";

// Construction OS Core 1.0 — deterministic Guidance Engine.
//
// Guidance is derived from stored facts only. Re-evaluation is idempotent:
// every candidate carries a relevanceKey (rule + subject + relevant state) so
// repeats update the active row instead of duplicating it. Resolving the
// underlying state resolves guidance. Role projection rewords the same truth;
// it never invents facts and never leaks unauthorized rows (filter first).

type Tx = Prisma.TransactionClient;

export type GuidanceRow = {
  id: string;
  ruleKey: string;
  subjectType: string;
  subjectId: string;
  type: string;
  priority: string;
  title: string;
  reason: string;
  consequence: string | null;
  actionType: string;
  actionTarget: string | null;
  relevanceKey: string;
  status: string;
  provenance: unknown;
  relevantUntil: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface Candidate {
  ruleKey: string;
  subjectType: string;
  subjectId: string;
  type: "BLOCKING" | "DECISION" | "DUE" | "EXCEPTION" | "FYI";
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  title: string;
  reason: string;
  consequence?: string;
  actionType: string;
  actionTarget?: string;
  relevanceKey: string;
  relevantUntil?: string | null;
  provenance: Record<string, unknown>;
}

const DAY = 86400000;
const isoDay = (offset: number) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);

/** Owner-readable day copy. Stored facts stay ISO; only the sentence changes. */
export function humanDay(iso: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const that = new Date(y, m - 1, d);
  const now = new Date();
  const startOf = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const delta = Math.round((startOf(that).getTime() - startOf(now).getTime()) / DAY);
  if (delta === 0) return "today";
  if (delta === 1) return "tomorrow";
  if (delta === -1) return "yesterday";
  if (delta > 1 && delta <= 14) return `in ${delta} days`;
  if (delta < -1 && delta >= -14) return `${Math.abs(delta)} days ago`;
  const label = `${d} ${months[m - 1]}`;
  return y === now.getFullYear() ? label : `${label} ${y}`;
}

function shortHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

function isTerminalIssue(status: string) {
  return ["RESOLVED", "CLOSED"].includes(status);
}

function currentStageOf(stages: Array<{ id: string; status: string }>): string | null {
  return (
    stages.find((s) => s.status === "IN_PROGRESS")?.id ??
    stages.find((s) => !["COMPLETED", "SKIPPED"].includes(s.status))?.id ??
    null
  );
}

// ---------------------------------------------------------------------------
// Re-evaluation: compute desired ACTIVE set, upsert, resolve the rest.
// ---------------------------------------------------------------------------

export async function reevaluateConstructionGuidance(
  tx: Tx,
  project: { id: string; workspaceId: string; propertyId: string | null },
): Promise<void> {
  const where = { projectId: project.id, workspaceId: project.workspaceId };
  const evaluatedAt = new Date().toISOString();
  const candidates: Candidate[] = [];

  const [stages, tasks, decisions, issues, inspections, changes, commitments, requirements, deliveries, updates, handovers, events] =
    await Promise.all([
      tx.constructionStage.findMany({ where }),
      tx.constructionTask.findMany({ where }),
      tx.constructionDecision.findMany({ where, include: { options: true } }),
      tx.constructionIssue.findMany({ where }),
      tx.constructionInspection.findMany({ where }),
      tx.constructionChange.findMany({ where }),
      tx.constructionCommitment.findMany({ where }),
      tx.materialRequirement.findMany({ where }),
      tx.constructionDelivery.findMany({ where, orderBy: { receivedAt: "desc" } }),
      tx.constructionUpdate.findMany({ where, orderBy: { occurredAt: "desc" }, take: 20 }),
      tx.constructionHandover.findMany({ where: { projectId: project.id } }),
      tx.constructionEvent.findMany({ where: { ...where, eventType: "CONSTRUCTION_DOCUMENT_VERSION_CHANGED" }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
  const currentStageId = currentStageOf(stages);
  const unfinishedWork = new Set<string>();
  for (const t of tasks) if (!["DONE", "CANCELLED"].includes(t.status)) unfinishedWork.add(`WORK_ITEM:${t.id}`);
  for (const s of stages) if (!["COMPLETED", "SKIPPED"].includes(s.status)) unfinishedWork.add(`STAGE:${s.id}`);
  const deps = await tx.constructionDependency.findMany({ where });

  const successorLabel = (type: string, id: string): string => {
    if (type === "WORK_ITEM") return tasks.find((t) => t.id === id)?.title ?? "planned work";
    if (type === "STAGE") return stages.find((s) => s.id === id)?.name ?? "a later stage";
    if (type === "MILESTONE") return "the next milestone";
    return "planned work";
  };

  // G01 — blocking decision: OPEN decision that gates unfinished work.
  for (const d of decisions) {
    if (d.status !== "OPEN") continue;
    const linkedSuccessors = deps
      .filter((dep) => dep.predecessorType === "DECISION" && dep.predecessorId === d.id)
      .map((dep) => `${dep.successorType}:${dep.successorId}`)
      .filter((k) => unfinishedWork.has(k));
    const contextWork =
      linkedSuccessors.length > 0
        ? linkedSuccessors.map((k) => { const [t, i] = k.split(/:(.+)/); return successorLabel(t, i); })
        : d.workItemId && unfinishedWork.has(`WORK_ITEM:${d.workItemId}`)
          ? [tasks.find((t) => t.id === d.workItemId)?.title ?? "planned work"]
          : d.stageId && unfinishedWork.has(`STAGE:${d.stageId}`)
            ? [stages.find((s) => s.id === d.stageId)?.name ?? "the current stage"]
            : [];
    if (contextWork.length) {
      const first = contextWork[0];
      candidates.push({
        ruleKey: "G01", subjectType: "DECISION", subjectId: d.id,
        type: "BLOCKING", priority: "HIGH",
        title: `${d.title} needs approval.`,
        reason: `${first} depends on this decision.${d.dueDate ? ` A decision is recorded as due ${humanDay(d.dueDate)}.` : ""}`,
        consequence: "Dependent work cannot complete until this is decided.",
        actionType: "OPEN_DECISION", actionTarget: d.id,
        relevanceKey: `G01:DECISION:${d.id}:OPEN:${shortHash([d.dueDate, contextWork])}`,
        relevantUntil: d.dueDate,
        provenance: { ruleKey: "G01", evaluatedAt, triggerFacts: { status: d.status, dueDate: d.dueDate, blocked: contextWork }, sourceObjectIds: [d.id] },
      });
    }
    // G02 — decision due soon / overdue.
    if (d.dueDate && d.dueDate <= isoDay(3)) {
      const overdue = d.dueDate < todayIso();
      candidates.push({
        ruleKey: "G02", subjectType: "DECISION", subjectId: d.id,
        type: "DECISION", priority: overdue ? "HIGH" : "NORMAL",
        title: `${d.title} is ${overdue ? "overdue" : "due soon"}.`,
        reason: overdue ? `This decision was due ${humanDay(d.dueDate)}.` : `This decision is due ${humanDay(d.dueDate)}.`,
        actionType: "OPEN_DECISION", actionTarget: d.id,
        relevanceKey: `G02:DECISION:${d.id}:${d.dueDate}`,
        relevantUntil: d.dueDate,
        provenance: { ruleKey: "G02", evaluatedAt, triggerFacts: { dueDate: d.dueDate }, sourceObjectIds: [d.id] },
      });
    }
  }

  // G03 — blocked work surfaces its recorded reason. Never invent one.
  for (const t of tasks) {
    if (t.status !== "BLOCKED") continue;
    candidates.push({
      ruleKey: "G03", subjectType: "WORK_ITEM", subjectId: t.id,
      type: "EXCEPTION", priority: "HIGH",
      title: `${t.title} is blocked.`,
      reason: t.notes?.trim() ? t.notes.trim().slice(0, 280) : "No blocker reason has been recorded yet.",
      actionType: "OPEN_WORK_ITEM", actionTarget: t.id,
      relevanceKey: `G03:WORK_ITEM:${t.id}:BLOCKED:${shortHash(t.notes ?? "")}`,
      provenance: { ruleKey: "G03", evaluatedAt, triggerFacts: { status: t.status }, sourceObjectIds: [t.id] },
    });
  }
  for (const s of stages) {
    if (s.status !== "BLOCKED") continue;
    candidates.push({
      ruleKey: "G03", subjectType: "STAGE", subjectId: s.id,
      type: "EXCEPTION", priority: "HIGH",
      title: `${s.name} is blocked.`,
      reason: s.notes?.trim() ? s.notes.trim().slice(0, 280) : "No blocker reason has been recorded yet.",
      actionType: "OPEN_PROJECT_STAGE", actionTarget: s.id,
      relevanceKey: `G03:STAGE:${s.id}:BLOCKED:${shortHash(s.notes ?? "")}`,
      provenance: { ruleKey: "G03", evaluatedAt, triggerFacts: { status: s.status }, sourceObjectIds: [s.id] },
    });
  }

  // G04 — delivery shortage: received < expected is evidence, not fault.
  for (const dv of deliveries) {
    if (dv.expectedQuantity === null) continue;
    const expected = Number(dv.expectedQuantity.toString());
    const received = Number(dv.receivedQuantity.toString());
    if (!(received < expected)) continue;
    const short = expected - received;
    const materialName = dv.materialRequirementId
      ? (requirements.find((m) => m.id === dv.materialRequirementId)?.name ?? null)
      : null;
    const name = dv.supplierName ? `${dv.supplierName} delivery` : "A delivery";
    candidates.push({
      ruleKey: "G04", subjectType: "DELIVERY", subjectId: dv.id,
      type: "EXCEPTION", priority: "HIGH",
      title: materialName ? `${short} ${materialName.toLowerCase()} ${dv.unit} were short.` : `${short} ${dv.unit} were short.`,
      reason: `${received} received against ${expected} recorded as ${dv.orderId ? "ordered" : "expected"}.`,
      consequence: `${name} did not match the recorded quantity.`,
      actionType: "OPEN_DELIVERY", actionTarget: dv.id,
      relevanceKey: `G04:DELIVERY:${dv.id}:${received}/${expected}`,
      provenance: { ruleKey: "G04", evaluatedAt, triggerFacts: { expected, received }, sourceObjectIds: [dv.id] },
    });
  }

  // G05 — inspection due; G06 — recorded concern (scoped wording only).
  for (const insp of inspections) {
    if (insp.status === "CANCELLED") continue;
    const day = new Date(insp.performedAt).toISOString().slice(0, 10);
    if (insp.status === "SCHEDULED" && day >= todayIso() && day <= isoDay(2)) {
      const label = day === todayIso() ? "today" : day === isoDay(1) ? "tomorrow" : humanDay(day);
      candidates.push({
        ruleKey: "G05", subjectType: "INSPECTION", subjectId: insp.id,
        type: "DUE", priority: "HIGH",
        title: `${insp.title} is ${day === todayIso() || day === isoDay(1) ? label : `on ${label}`}.`,
        reason: `Recorded for ${humanDay(day)} by ${insp.performedBy}.`,
        actionType: "OPEN_INSPECTION", actionTarget: insp.id,
        relevanceKey: `G05:INSPECTION:${insp.id}:${day}`,
        relevantUntil: day,
        provenance: { ruleKey: "G05", evaluatedAt, triggerFacts: { performedAt: day }, sourceObjectIds: [insp.id] },
      });
    }
    if ((insp.result === "CONCERN_RECORDED" || insp.result === "RECHECK_REQUIRED") && insp.status !== "CANCELLED") {
      candidates.push({
        ruleKey: "G06", subjectType: "INSPECTION", subjectId: insp.id,
        type: "EXCEPTION", priority: "HIGH",
        title: insp.result === "RECHECK_REQUIRED" ? `${insp.title} needs a recheck.` : `One concern was recorded in ${insp.title}.`,
        reason: insp.notes?.trim() ? insp.notes.trim().slice(0, 280) : `Recorded by ${insp.performedBy}. This is a recorded observation, not a certification.`,
        actionType: "OPEN_INSPECTION", actionTarget: insp.id,
        relevanceKey: `G06:INSPECTION:${insp.id}:${insp.result}`,
        provenance: { ruleKey: "G06", evaluatedAt, triggerFacts: { result: insp.result }, sourceObjectIds: [insp.id] },
      });
    }
  }

  // G07 — open issue on the current stage.
  for (const issue of issues) {
    if (isTerminalIssue(issue.status)) continue;
    const onCurrent =
      (issue.stageId && issue.stageId === currentStageId) ||
      (issue.workItemId && tasks.some((t) => t.id === issue.workItemId && t.stageId === currentStageId));
    if (!onCurrent) continue;
    candidates.push({
      ruleKey: "G07", subjectType: "ISSUE", subjectId: issue.id,
      type: "EXCEPTION", priority: issue.severity === "CRITICAL" ? "CRITICAL" : issue.severity === "HIGH" ? "HIGH" : "NORMAL",
      title: `${issue.title} needs attention.`,
      reason: `Recorded as ${issue.status.toLowerCase().replaceAll("_", " ")}${issue.assignedTo ? `, with ${issue.assignedTo}` : ""}.`,
      actionType: "OPEN_ISSUE", actionTarget: issue.id,
      relevanceKey: `G07:ISSUE:${issue.id}:${issue.status}`,
      provenance: { ruleKey: "G07", evaluatedAt, triggerFacts: { status: issue.status, severity: issue.severity }, sourceObjectIds: [issue.id] },
    });
  }

  // G08/G09 — approved change impacts use exact stored numbers only.
  for (const c of changes) {
    if (!["APPROVED", "IMPLEMENTED"].includes(c.status)) continue;
    const cost = c.status === "IMPLEMENTED" && c.actualCostImpactPaise !== null ? c.actualCostImpactPaise : c.estimatedCostImpactPaise;
    if (cost !== 0n) {
      candidates.push({
        ruleKey: "G08", subjectType: "CHANGE", subjectId: c.id,
        type: "FYI", priority: "NORMAL",
        title: `${c.title} changed the approved project cost by ${formatINR(cost < 0n ? -cost : cost)}.`,
        reason: `${cost >= 0n ? "+" : "−"}${formatINR(cost >= 0n ? cost : -cost).slice(1)} ${c.status === "IMPLEMENTED" && c.actualCostImpactPaise !== null ? "actual" : "estimated"} impact, ${c.status.toLowerCase()}.`,
        actionType: "OPEN_MONEY_RECORD", actionTarget: c.id,
        relevanceKey: `G08:CHANGE:${c.id}:${c.status}:${cost.toString()}`,
        provenance: { ruleKey: "G08", evaluatedAt, triggerFacts: { status: c.status, impactPaise: cost.toString() }, sourceObjectIds: [c.id] },
      });
    }
    const days = c.status === "IMPLEMENTED" && c.actualScheduleImpactDays !== null ? c.actualScheduleImpactDays : c.estimatedScheduleImpactDays;
    if (days !== 0) {
      candidates.push({
        ruleKey: "G09", subjectType: "CHANGE", subjectId: c.id,
        type: "FYI", priority: "NORMAL",
        title: `${c.title} adds ${Math.abs(days)} recorded day${Math.abs(days) === 1 ? "" : "s"} to the plan.`,
        reason: "Recorded schedule impact only. Actual delay is not inferred.",
        actionType: "OPEN_MONEY_RECORD", actionTarget: c.id,
        relevanceKey: `G09:CHANGE:${c.id}:${c.status}:${days}`,
        provenance: { ruleKey: "G09", evaluatedAt, triggerFacts: { status: c.status, days }, sourceObjectIds: [c.id] },
      });
    }
  }

  // G10 — invoice / owner review. Never implies payment due.
  for (const cm of commitments) {
    if (cm.status === "DRAFT" && (cm.sourceType === "INVOICE" || cm.sourceType === "BILL")) {
      candidates.push({
        ruleKey: "G10", subjectType: "COMMITMENT", subjectId: cm.id,
        type: "DECISION", priority: "HIGH",
        title: `${cm.title} needs review.`,
        reason: `${formatINR(cm.amountPaise)} recorded${cm.vendorOrPersonId ? ` from ${cm.vendorOrPersonId}` : ""}. No payment is implied.`,
        actionType: "OPEN_MONEY_RECORD", actionTarget: cm.id,
        relevanceKey: `G10:COMMITMENT:${cm.id}:DRAFT`,
        provenance: { ruleKey: "G10", evaluatedAt, triggerFacts: { status: cm.status, amountPaise: cm.amountPaise.toString() }, sourceObjectIds: [cm.id] },
      });
    }
    // G11 — outstanding commitment near its recorded expected date.
    if (["ACTIVE", "PARTIALLY_FULFILLED"].includes(cm.status) && cm.expectedBy && cm.expectedBy <= isoDay(7)) {
      candidates.push({
        ruleKey: "G11", subjectType: "COMMITMENT", subjectId: cm.id,
        type: "DUE", priority: "NORMAL",
        title: `${cm.title} is expected ${humanDay(cm.expectedBy)}.`,
        reason: `${formatINR(cm.amountPaise)} recorded as committed.`,
        actionType: "OPEN_MONEY_RECORD", actionTarget: cm.id,
        relevanceKey: `G11:COMMITMENT:${cm.id}:${cm.expectedBy}`,
        relevantUntil: cm.expectedBy,
        provenance: { ruleKey: "G11", evaluatedAt, triggerFacts: { expectedBy: cm.expectedBy }, sourceObjectIds: [cm.id] },
      });
    }
  }

  // G12 — material required soon.
  for (const m of requirements) {
    if (["RECEIVED", "CANCELLED"].includes(m.status)) continue;
    if (!m.requiredByDate || m.requiredByDate > isoDay(10)) continue;
    candidates.push({
      ruleKey: "G12", subjectType: "MATERIAL", subjectId: m.id,
      type: m.requiredByDate <= isoDay(3) ? "DUE" : "FYI", priority: m.requiredByDate <= isoDay(3) ? "HIGH" : "NORMAL",
      title: `${m.name} is needed soon.`,
      reason: `${m.quantity.toString()} ${m.unit} recorded as required ${humanDay(m.requiredByDate)}.`,
      actionType: "OPEN_DELIVERY", actionTarget: m.id,
      relevanceKey: `G12:MATERIAL:${m.id}:${m.requiredByDate}:${m.status}`,
      relevantUntil: m.requiredByDate,
      provenance: { ruleKey: "G12", evaluatedAt, triggerFacts: { requiredByDate: m.requiredByDate }, sourceObjectIds: [m.id] },
    });
  }

  // G13 — newer linked document revision available.
  for (const e of events) {
    const payload = (e.payload ?? {}) as Record<string, unknown>;
    candidates.push({
      ruleKey: "G13", subjectType: "DOCUMENT", subjectId: String(payload.id ?? e.id),
      type: "FYI", priority: "NORMAL",
      title: "A newer structural drawing is available.",
      reason: "A newer revision was linked after work was planned. Re-review only where the workflow requires it.",
      actionType: "OPEN_DOCUMENT", actionTarget: String(payload.id ?? ""),
      relevanceKey: `G13:DOCUMENT:${String(payload.id ?? e.id)}:${e.id}`,
      provenance: { ruleKey: "G13", evaluatedAt, triggerFacts: { eventId: e.id }, sourceObjectIds: [String(payload.id ?? "")] },
    });
  }

  // G14 — recent site photos.
  for (const u of updates) {
    const photos = Array.isArray(u.photoRefs) ? (u.photoRefs as unknown[]).length : 0;
    if (!photos) continue;
    const day = new Date(u.occurredAt).toISOString().slice(0, 10);
    if (day < isoDay(-2)) continue;
    const label = day === todayIso() ? "today" : day === isoDay(-1) ? "yesterday" : `on ${day}`;
    candidates.push({
      ruleKey: "G14", subjectType: "SITE_UPDATE", subjectId: u.id,
      type: "FYI", priority: "LOW",
      title: `${photos} site photo${photos === 1 ? " was" : "s were"} added ${label}.`,
      reason: u.title.slice(0, 200),
      actionType: "OPEN_SITE_UPDATE", actionTarget: u.id,
      relevanceKey: `G14:SITE_UPDATE:${u.id}`,
      provenance: { ruleKey: "G14", evaluatedAt, triggerFacts: { photoCount: photos }, sourceObjectIds: [u.id] },
    });
  }

  // G16/G17 — handover open items / missing evidence (only once started).
  for (const h of handovers) {
    if (h.status !== "IN_PROGRESS") continue;
    const snags = Array.isArray(h.snagItemIds) ? (h.snagItemIds as string[]).length : 0;
    const openIssues = issues.filter((i) => !isTerminalIssue(i.status)).length;
    if (snags + openIssues > 0) {
      candidates.push({
        ruleKey: "G16", subjectType: "HANDOVER", subjectId: h.id,
        type: "DUE", priority: "NORMAL",
        title: `${snags + openIssues} handover item${snags + openIssues === 1 ? " is" : "s are"} still open.`,
        reason: "Open snag items and issues must be dispositioned before handover completes.",
        actionType: "OPEN_HANDOVER", actionTarget: h.id,
        relevanceKey: `G16:HANDOVER:${h.id}:${snags + openIssues}`,
        provenance: { ruleKey: "G16", evaluatedAt, triggerFacts: { open: snags + openIssues }, sourceObjectIds: [h.id] },
      });
    }
    const missing: string[] = [];
    if (!Array.isArray(h.finalDocumentIds) || (h.finalDocumentIds as unknown[]).length === 0) missing.push("final drawings");
    if (!Array.isArray(h.warranties) || (h.warranties as unknown[]).length === 0) missing.push("warranties");
    if (missing.length) {
      candidates.push({
        ruleKey: "G17", subjectType: "HANDOVER", subjectId: h.id,
        type: "FYI", priority: "LOW",
        title: `${missing.join(" and ")} ${missing.length === 1 ? "has" : "have"} not been added to the handover record.`,
        reason: "“Not added” means not recorded here — not that it does not exist.",
        actionType: "OPEN_HANDOVER", actionTarget: h.id,
        relevanceKey: `G17:HANDOVER:${h.id}:${shortHash(missing)}`,
        provenance: { ruleKey: "G17", evaluatedAt, triggerFacts: { missing }, sourceObjectIds: [h.id] },
      });
    }
  }

  // G15 needs money facts; it is evaluated by the caller hook with canonical
  // ledger totals (see evaluateBudgetGuidance below).
  await persistCandidates(tx, project, candidates, evaluatedAt, "MAIN");
}

export async function evaluateBudgetGuidance(
  tx: Tx,
  project: { id: string; workspaceId: string },
  facts: { recordedPaise: bigint; currentApprovedPaise: bigint; categoryOverruns: string[] },
): Promise<void> {
  const evaluatedAt = new Date().toISOString();
  const candidates: Candidate[] = [];
  if (facts.recordedPaise > facts.currentApprovedPaise) {
    candidates.push({
      ruleKey: "G15", subjectType: "PROJECT", subjectId: project.id,
      type: "EXCEPTION", priority: "HIGH",
      title: `Recorded spend is above the approved amount by ${formatINR(facts.recordedPaise - facts.currentApprovedPaise)}.`,
      reason: `${formatINR(facts.recordedPaise)} recorded against ${formatINR(facts.currentApprovedPaise)} approved.`,
      actionType: "OPEN_MONEY_RECORD",
      relevanceKey: `G15:PROJECT:${project.id}:${facts.recordedPaise.toString()}:${facts.currentApprovedPaise.toString()}`,
      provenance: { ruleKey: "G15", evaluatedAt, triggerFacts: { recordedPaise: facts.recordedPaise.toString(), approvedPaise: facts.currentApprovedPaise.toString() }, sourceObjectIds: [project.id] },
    });
  }
  for (const line of facts.categoryOverruns) {
    candidates.push({
      ruleKey: "G15", subjectType: "BUDGET_CATEGORY", subjectId: shortHash(line),
      type: "EXCEPTION", priority: "NORMAL",
      title: line,
      reason: "Recorded spend and commitments for this category are above the approved amount.",
      actionType: "OPEN_MONEY_RECORD",
      relevanceKey: `G15:BUDGET_CATEGORY:${shortHash(line)}`,
      provenance: { ruleKey: "G15", evaluatedAt, triggerFacts: { line }, sourceObjectIds: [project.id] },
    });
  }
  await persistCandidates(tx, project, candidates, evaluatedAt, "BUDGET");
}

async function persistCandidates(
  tx: Tx,
  project: { id: string; workspaceId: string },
  candidates: Candidate[],
  evaluatedAt: string,
  scope: "MAIN" | "BUDGET",
) {
  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c.relevanceKey)) continue;
    seen.add(c.relevanceKey);
    const existing = await tx.constructionGuidance.findUnique({
      where: { projectId_relevanceKey: { projectId: project.id, relevanceKey: c.relevanceKey } },
    });
    if (existing) {
      if (existing.status !== "ACTIVE" || existing.title !== c.title || existing.reason !== c.reason) {
        await tx.constructionGuidance.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE", title: c.title, reason: c.reason,
            consequence: c.consequence ?? null, priority: c.priority, type: c.type,
            actionType: c.actionType, actionTarget: c.actionTarget ?? null,
            relevantUntil: c.relevantUntil ?? null, resolvedAt: null,
            provenance: { ...(c.provenance as object), evaluatedAt },
          },
        });
      } else {
        await tx.constructionGuidance.update({ where: { id: existing.id }, data: { provenance: { ...(c.provenance as object), evaluatedAt } } });
      }
      continue;
    }
    await tx.constructionGuidance.create({
      data: {
        id: randomUUID(),
        workspaceId: project.workspaceId,
        projectId: project.id,
        ruleKey: c.ruleKey, subjectType: c.subjectType, subjectId: c.subjectId,
        type: c.type, priority: c.priority, title: c.title, reason: c.reason,
        consequence: c.consequence ?? null,
        actionType: c.actionType, actionTarget: c.actionTarget ?? null,
        relevanceKey: c.relevanceKey, status: "ACTIVE",
        provenance: { ...(c.provenance as object), evaluatedAt },
        relevantUntil: c.relevantUntil ?? null,
      },
    });
  }
  // Resolve ACTIVE rows that are no longer desired. Each pass owns its
  // rules: MAIN owns everything except G15, BUDGET owns G15 only.
  const active = await tx.constructionGuidance.findMany({
    where: {
      projectId: project.id,
      status: "ACTIVE",
      ruleKey: scope === "MAIN" ? { not: "G15" } : "G15",
    },
    select: { id: true, relevanceKey: true },
  });
  for (const row of active) {
    if (!seen.has(row.relevanceKey)) {
      await tx.constructionGuidance.update({ where: { id: row.id }, data: { status: "RESOLVED", resolvedAt: new Date() } });
    }
  }
}

// ---------------------------------------------------------------------------
// Read-time: capability filtering + role projection.
// ---------------------------------------------------------------------------

export type ProjectRole =
  | "OWNER" | "ARCHITECT" | "STRUCTURAL_ENGINEER" | "CONTRACTOR"
  | "PROJECT_MANAGER" | "ELECTRICAL_CONSULTANT" | "PLUMBING_CONSULTANT"
  | "INTERIOR_DESIGNER" | "SUPPLIER" | "VIEWER" | "CUSTOM";

export interface GuidanceCaps {
  plan: boolean;
  financial: boolean;
  materials: boolean;
  site: boolean;
  documents: boolean;
  handover: boolean;
}

const FINANCIAL_RULES = new Set(["G08", "G09", "G10", "G11", "G15"]);

export function filterGuidanceForCaps(rows: GuidanceRow[], caps: GuidanceCaps): GuidanceRow[] {
  return rows.filter((r) => {
    if (FINANCIAL_RULES.has(r.ruleKey) && !caps.financial) return false;
    if (r.ruleKey === "G13" && !caps.documents) return false;
    if ((r.ruleKey === "G04" || r.ruleKey === "G12") && !caps.materials) return false;
    if (r.ruleKey === "G14" && !caps.site) return false;
    if ((r.ruleKey === "G16" || r.ruleKey === "G17") && !caps.handover) return false;
    if (["G01", "G02", "G03", "G05", "G06", "G07"].includes(r.ruleKey) && !caps.plan) return false;
    return true;
  });
}

export async function resolveProjectRole(
  tx: Tx,
  userId: string,
  isOwner: boolean,
  where: { projectId: string; workspaceId: string },
): Promise<ProjectRole> {
  if (isOwner) return "OWNER";
  const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (user?.email) {
    const contact = await tx.constructionContact.findFirst({ where: { ...where, email: user.email } });
    if (contact) {
      const map: Record<string, ProjectRole> = {
        OWNER: "OWNER",
        ARCHITECT: "ARCHITECT",
        STRUCTURAL_ENGINEER: "STRUCTURAL_ENGINEER",
        CONTRACTOR: "CONTRACTOR",
        PROJECT_MANAGER: "PROJECT_MANAGER",
        ELECTRICIAN: "ELECTRICAL_CONSULTANT",
        PLUMBER: "PLUMBING_CONSULTANT",
        INTERIOR_DESIGNER: "INTERIOR_DESIGNER",
        SUPPLIER: "SUPPLIER",
        VIEWER: "VIEWER",
        CUSTOM: "VIEWER",
        OTHER: "VIEWER",
      };
      return map[contact.role] ?? "VIEWER";
    }
  }
  try {
    const grants = await getActiveSharesForUser(userId);
    const project = await tx.constructionProject.findFirst({ where: { id: where.projectId }, select: { propertyId: true, workspaceId: true } });
    const role = grants.find(
      (g) => g.propertyId === project?.propertyId && g.workspaceId === project?.workspaceId && shareScopeAllows(g, "CONSTRUCTION_PROJECT_READ"),
    ) as { role?: string } | undefined;
    const r = String(role?.role ?? "").toUpperCase();
    if (["ARCHITECT", "CONTRACTOR", "PROJECT_MANAGER"].includes(r)) return r as ProjectRole;
  } catch {
    // Role hint is best-effort; authorization itself never depends on it.
  }
  return "VIEWER";
}

export function projectGuidanceForRole(rows: GuidanceRow[], role: ProjectRole): GuidanceRow[] {
  if (role === "OWNER") return rows;
  return rows.map((r) => {
    if (r.ruleKey === "G01") {
      if (role === "ARCHITECT")
        return { ...r, title: r.title.replace("needs approval.", "is awaiting owner approval."), reason: `${r.reason} Preparation downstream remains blocked until the owner decides.` };
      if (role === "CONTRACTOR")
        return { ...r, title: r.title.replace("needs approval.", "is pending — execution is blocked."), reason: `${r.reason} Related execution work cannot complete until this is decided.` };
      if (role === "PROJECT_MANAGER")
        return { ...r, title: `Blocking decision: ${r.title}`, reason: r.reason };
    }
    if (r.ruleKey === "G10" && role !== "PROJECT_MANAGER") {
      return { ...r, title: r.title.replace("needs review.", "is waiting for owner review.") };
    }
    if (r.ruleKey === "G04" && role === "CONTRACTOR") {
      return { ...r, consequence: `${r.consequence ?? ""} Follow up with the supplier on the recorded shortage.`.trim() };
    }
    return r;
  });
}

const GUIDANCE_ORDER: Record<string, number> = { BLOCKING: 0, DECISION: 1, DUE: 2, EXCEPTION: 3, FYI: 4 };
const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

export function sortGuidance(rows: GuidanceRow[]): GuidanceRow[] {
  return [...rows].sort(
    (a, b) =>
      (GUIDANCE_ORDER[a.type] ?? 9) - (GUIDANCE_ORDER[b.type] ?? 9) ||
      (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) ||
      (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : 1),
  );
}

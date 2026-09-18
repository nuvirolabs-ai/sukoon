import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { evaluateRuleApplicability } from "@/lib/rules";
import { Prisma } from "@/lib/generated/prisma/client";
import { getWorkspaceForUser } from "@/lib/repository";
import {
  getActiveSharesForUser,
  shareScopeAllows,
  type ShareCapability,
} from "@/lib/authz";
import {
  CONSTRUCTION_TEMPLATE,
  CONSTRUCTION_TEMPLATE_VERSION,
} from "@/lib/construction-template";
import {
  handleOsAction,
  derivedDependencyEvents,
  computeMoneySummary,
  refreshCommitmentFulfillment,
} from "@/lib/construction-os";
import {
  reevaluateConstructionGuidance,
  evaluateBudgetGuidance,
  resolveProjectRole,
  filterGuidanceForCaps,
  projectGuidanceForRole,
  sortGuidance,
} from "@/lib/construction-guidance";

type DB = Prisma.TransactionClient;
type Input = Record<string, unknown>;
export class ConstructionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const fail = (
  message: string,
  code = "CONSTRUCTION_INVALID",
  status = 400,
): never => {
  throw new ConstructionError(code, message, status);
};
const missing = (): never =>
  fail("Construction record not found.", "CONSTRUCTION_NOT_FOUND", 404);
const today = () => new Date().toISOString().slice(0, 10);
function object(raw: unknown): Input {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return fail("A request object is required.");
  return raw as Input;
}
function text(
  value: unknown,
  label: string,
  max = 200,
  optional = false,
): string {
  if ((value === undefined || value === null || value === "") && optional)
    return "";
  if (typeof value !== "string" || !value.trim() || value.length > max)
    return fail(`${label} is invalid.`);
  return value.trim();
}
function choice(value: unknown, values: readonly string[], label: string) {
  const result = text(value, label);
  if (!values.includes(result)) return fail(`${label} is invalid.`);
  return result;
}
function money(value: unknown, optional = false) {
  if (optional && (value === undefined || value === "")) return 0n;
  if (!/^(0|[1-9]\d{0,14})$/.test(String(value)))
    return fail("Money must be a non-negative integer number of paise.");
  return BigInt(String(value));
}
function date(value: unknown, optional = true) {
  if (!value && optional) return null;
  const s = text(value, "Date", 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    !Number.isFinite(Date.parse(s)) ||
    new Date(s).toISOString().slice(0, 10) !== s
  )
    return fail("Use a valid calendar date.");
  return s;
}
function quantity(value: unknown) {
  if (!/^[0-9]{1,10}(\.\d{1,3})?$/.test(String(value)) || Number(value) <= 0)
    return fail(
      "Area or quantity must be positive with at most three decimals.",
    );
  return new Prisma.Decimal(String(value));
}
function optionalId(value: unknown) {
  return text(value, "Record ID", 100, true) || null;
}
function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_k, v) =>
      typeof v === "bigint" ? v.toString() : v,
    ),
  );
}
function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function access(
  db: DB,
  userId: string,
  projectId: string,
  write = false,
  includeArchived = false,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role === "operator") return missing();
  const workspace = await db.workspace.findUnique({
    where: { ownerUserId: userId },
  });
  const grants = write ? [] : await getActiveSharesForUser(userId);
  const scopes = grants.filter((g) =>
    shareScopeAllows(g, "CONSTRUCTION_PROJECT_READ"),
  );
  const project = await db.constructionProject.findFirst({
    where: {
      id: projectId,
      ...(includeArchived ? {} : { archivedAt: null }),
      property: { status: "active" },
      OR: [
        ...(workspace ? [{ workspaceId: workspace.id }] : []),
        ...scopes.map((g) => ({
          workspaceId: g.workspaceId,
          propertyId: g.propertyId,
        })),
      ],
    },
  });
  if (
    !project ||
    !project.propertyId ||
    (write && workspace?.id !== project.workspaceId)
  )
    return missing();
  const owner = workspace?.id === project.workspaceId;
  if (project.archivedAt && !owner) return missing();
  return {
    project,
    propertyId: project.propertyId,
    owner,
    can: (cap: ShareCapability) =>
      owner ||
      scopes.some(
        (g) =>
          g.propertyId === project.propertyId &&
          g.workspaceId === project.workspaceId &&
          shareScopeAllows(g, cap),
      ),
    grants: scopes.filter((g) => g.propertyId === project.propertyId),
  };
}

async function appendEvent(
  db: DB,
  project: { id: string; workspaceId: string; propertyId: string | null },
  userId: string,
  action: string,
  key: string,
  payloadHash: string,
  payload: unknown,
  visibility = "PROJECT",
) {
  const id = randomUUID();
  await db.constructionEvent.create({
    data: {
      id,
      projectId: project.id,
      workspaceId: project.workspaceId,
      actorId: userId,
      eventType: action,
      title: action.replaceAll("_", " "),
      visibility,
      payload: json(payload),
      requestKey: key,
      payloadHash,
    },
  });
  await db.timelineEvent.create({
    data: {
      id: `construction:${id}`,
      workspaceId: project.workspaceId,
      propertyId: project.propertyId!,
      date: today(),
      title: "Construction history updated",
      detail:
        "Owner recorded a construction event. Open Construction for authorized details.",
      kind: "construction",
    },
  });
}

export async function createConstructionForUser(userId: string, raw: unknown) {
  const v = object(raw);
  const propertyId = text(v.propertyId, "Property");
  const key = text(v.idempotencyKey, "Request key", 120);
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return missing();
  const property = await prisma.property.findFirst({
    where: { id: propertyId, workspaceId: workspace.id, status: "active" },
  });
  if (!property) return missing();
  const name = text(v.name, "Project name");
  const projectType = choice(
    v.projectType,
    ["NEW_HOME", "RENOVATION", "EXTENSION", "REBUILD"],
    "Project type",
  );
  const builtUpArea = quantity(v.builtUpArea);
  const areaUnit = choice(v.areaUnit, ["sqft", "sqm"], "Area unit");
  const floors = Number(v.floorCount);
  if (!Number.isInteger(floors) || floors < 1 || floors > 100)
    return fail("Floor count must be between 1 and 100.");
  const qualityLevel = choice(
    v.qualityLevel,
    ["BASIC", "STANDARD", "PREMIUM", "CUSTOM"],
    "Quality level",
  );
  const budget = money(v.estimatedBudgetPaise);
  const startDate = date(v.startDate, false)!;
  const end = date(v.targetCompletionDate);
  if (end && end < startDate)
    return fail("Target completion must follow the start date.");
  const requirements = {
    source: "USER_ENTERED_REQUIREMENTS",
    description: text(v.requirements, "Requirements", 4000, true),
  };
  const id = `build-${hash([userId, key]).slice(0, 32)}`;
  const payloadHash = hash(v);
  await prisma.$transaction(
    async (tx) => {
      // Serialize create retries across processes without changing existing workspace data.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
      const existing = await tx.constructionEvent.findUnique({
        where: { projectId_requestKey: { projectId: id, requestKey: key } },
      });
      if (existing) {
        if (existing.payloadHash !== payloadHash)
          return fail(
            "Request key was used for another payload.",
            "IDEMPOTENCY_CONFLICT",
            409,
          );
        return;
      }
      const project = await tx.constructionProject.create({
        data: {
          id,
          workspaceId: workspace.id,
          propertyId,
          name,
          plotSizeSqft: property.plotSizeSqft ?? 0,
          spec: qualityLevel,
          budgetPaise: budget,
          initialBudgetPaise: budget,
          currentStage: 0,
          stageStatus: {},
          startDate,
          projectType,
          targetCompletionDate: end,
          builtUpArea,
          areaUnit,
          floorCount: floors,
          qualityLevel,
          requirements,
          createdBy: userId,
          templateVersion: CONSTRUCTION_TEMPLATE_VERSION,
        },
      });
      let previous: string | null = null;
      for (const [
        index,
        [stageName, tasks],
      ] of CONSTRUCTION_TEMPLATE.entries()) {
        const stageId = randomUUID();
        await tx.constructionStage.create({
          data: {
            id: stageId,
            workspaceId: workspace.id,
            projectId: id,
            name: stageName,
            sequence: index + 1,
            dependsOnId: previous,
            status: index === 0 ? "READY" : "NOT_STARTED",
            description:
              "Configured workflow suggestion; owner records progress and evidence.",
            source: "CONFIGURED_TEMPLATE",
          },
        });
        await tx.constructionTask.createMany({
          data: tasks.map((title, taskIndex) => ({
            id: randomUUID(),
            workspaceId: workspace.id,
            projectId: id,
            stageId,
            title,
            sequence: taskIndex + 1,
            source: "CONFIGURED_TEMPLATE",
          })),
        });
        previous = stageId;
        if (index === 0)
          await tx.constructionProject.update({
            where: { id },
            data: { currentStageId: stageId },
          });
      }
      await appendEvent(
        tx,
        project,
        userId,
        "PROJECT_CREATED",
        key,
        payloadHash,
        { name, templateVersion: CONSTRUCTION_TEMPLATE_VERSION },
      );
    },
    { timeout: 15000 },
  );
  return getConstructionForUser(userId, id);
}

export async function spendRows(
  db: DB,
  workspaceId: string,
  propertyId: string,
  costs: Array<{
    id: string;
    ledgerEntryId: string | null;
    obligationId: string | null;
  }>,
) {
  const entries = costs.length
    ? await db.expenseLedgerEntry.findMany({
        where: {
          workspaceId,
          propertyId,
          OR: [
            {
              reversalOfId: {
                in: costs.flatMap((c) =>
                  c.ledgerEntryId ? [c.ledgerEntryId] : [],
                ),
              },
            },
            {
              id: {
                in: costs.flatMap((c) =>
                  c.ledgerEntryId ? [c.ledgerEntryId] : [],
                ),
              },
            },
            {
              obligationId: {
                in: costs.flatMap((c) =>
                  c.obligationId ? [c.obligationId] : [],
                ),
              },
              entryType: {
                in: ["OBLIGATION_PAYMENT", "OBLIGATION_PAYMENT_REVERSAL"],
              },
            },
          ],
        },
        include: { payment: { select: { reversalOfId: true } } },
      })
    : [];
  // An invoice link follows its canonical ledger (including payment reversals).
  // Individual linked payment reversals are included even when they arrive later.
  const paymentIds = entries.flatMap((e) => (e.paymentId ? [e.paymentId] : []));
  const reversals = paymentIds.length
    ? await db.expenseLedgerEntry.findMany({
        where: {
          workspaceId,
          propertyId,
          payment: { reversalOfId: { in: paymentIds } },
        },
        include: { payment: { select: { reversalOfId: true } } },
      })
    : [];
  const unique = [
    ...new Map([...entries, ...reversals].map((e) => [e.id, e])).values(),
  ];
  return costs.map((c) => ({
    id: c.id,
    amountPaise: unique
      .filter((e) =>
        c.obligationId
          ? e.obligationId === c.obligationId
          : e.id === c.ledgerEntryId ||
            e.reversalOfId === c.ledgerEntryId ||
            !!(
              e.payment?.reversalOfId &&
              entries.some(
                (original) =>
                  original.id === c.ledgerEntryId &&
                  original.paymentId === e.payment?.reversalOfId,
              )
            ),
      )
      .reduce((sum, e) => sum + e.amountPaise, 0n),
  }));
}

async function checklist(db: DB, propertyId: string, workspaceId: string) {
  const property = await db.property.findUniqueOrThrow({
    where: { id: propertyId },
  });
  const candidates = await db.checklistRule.findMany({
    where: {
      status: "PUBLISHED",
      category: "CONSTRUCTION",
      contentType: "checklist",
      effectiveFrom: { lte: today() },
      AND: [
        {
          OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: today() } }],
        },
      ],
      reviewer: { not: null },
      reviewedAt: { not: null },
    },
  });
  const rules = candidates.filter(
    (r) => evaluateRuleApplicability(r, property) !== "NOT_APPLICABLE",
  );
  const docs = await db.propertyDoc.findMany({
    where: { workspaceId, propertyId, archivedAt: null, deletedAt: null },
    select: { type: true, scanStatus: true, reviewStatus: true },
  });
  return rules.map((r) => {
    const matches = docs.filter((d) => d.type === r.evidenceCategory);
    return {
      id: r.id,
      title: r.title,
      sourceName: r.sourceName,
      sourceReference: r.sourceReference,
      status:
        evaluateRuleApplicability(r, property) === "UNKNOWN"
          ? "UNKNOWN"
          : matches.some(
                (d) =>
                  d.scanStatus === "clean" && d.reviewStatus === "confirmed",
              )
            ? "DOCUMENT_AVAILABLE"
            : matches.length
              ? "UNDER_REVIEW"
              : "MISSING_FROM_CONFIGURED_CHECKLIST",
      requirementState:
        evaluateRuleApplicability(r, property) === "UNKNOWN"
          ? "UNKNOWN"
          : "KNOWN_REQUIREMENT",
    };
  });
}

export async function getConstructionForUser(
  userId: string,
  projectId: string,
  includeArchived = false,
) {
  return prisma.$transaction(
    async (tx) => {
      const a = await access(tx, userId, projectId, false, includeArchived);
      const p = a.project;
      const where = { projectId, workspaceId: p.workspaceId };
      const stages = await tx.constructionStage.findMany({
        where,
        orderBy: { sequence: "asc" },
      });
      const tasks = a.can("CONSTRUCTION_TASK_READ")
        ? await tx.constructionTask.findMany({
            where,
            orderBy: [{ sequence: "asc" }, { title: "asc" }],
          })
        : [];
      const allTaskStates = await tx.constructionTask.groupBy({
        by: ["stageId", "status"],
        where,
        _count: true,
      });
      const stageRows = stages.map((s) => {
        const states = allTaskStates.filter(
          (t) => t.stageId === s.id && t.status !== "CANCELLED",
        );
        const total = states.reduce((n, t) => n + t._count, 0);
        const done = states
          .filter((t) => t.status === "DONE")
          .reduce((n, t) => n + t._count, 0);
        return {
          ...s,
          progressPercent: total
            ? Math.floor((done * 100) / total)
            : s.status === "COMPLETED"
              ? 100
              : 0,
        };
      });
      const counted = stageRows.filter((s) => s.status !== "SKIPPED");
      const progressPercent = counted.length
        ? Math.floor(
            counted.reduce((n, s) => n + s.progressPercent, 0) / counted.length,
          )
        : 0;
      const budgets = a.can("CONSTRUCTION_BUDGET_READ")
        ? await tx.constructionBudgetItem.findMany({ where })
        : [];
      const costs = a.can("CONSTRUCTION_COST_READ")
        ? await tx.constructionCost.findMany({
            where,
            include: {
              ledgerEntry: {
                include: {
                  reversals: true,
                  replacements: { include: { constructionCost: true } },
                  replacementFor: { include: { constructionCost: true } },
                },
              },
            },
          })
        : [];
      const amounts = await spendRows(tx, p.workspaceId, a.propertyId, costs);
      const spent = amounts.reduce((n, c) => n + c.amountPaise, 0n);
      const materials = a.can("CONSTRUCTION_MATERIAL_READ")
        ? await tx.materialRequirement.findMany({
            where,
            orderBy: { requiredByDate: "asc" },
          })
        : [];
      const prices =
        a.can("CONSTRUCTION_BUDGET_READ") && a.can("CONSTRUCTION_MATERIAL_READ")
          ? await tx.materialPriceEntry.findMany({
              where,
              orderBy: [{ recordedDate: "desc" }, { createdAt: "desc" }],
            })
          : [];
      const procurement = a.can("CONSTRUCTION_MATERIAL_READ")
        ? await tx.procurementNeed.findMany({ where })
        : [];
      const contacts = a.can("CONSTRUCTION_CONTACT_READ")
        ? await tx.constructionContact.findMany({ where })
        : [];
      const updates = a.can("CONSTRUCTION_UPDATE_READ")
        ? await tx.constructionUpdate.findMany({
            where,
            orderBy: { occurredAt: "desc" },
          })
        : [];
      // Construction OS Core 1.0 collections. Plan objects follow task
      // capability; money-adjacent procurement follows material capability;
      // commitments follow budget capability; handover stays owner-only.
      const canPlan = a.can("CONSTRUCTION_TASK_READ");
      const canMoney = a.can("CONSTRUCTION_BUDGET_READ") && a.can("CONSTRUCTION_COST_READ");
      const [planVersions, milestones, dependencies, decisions, issues, inspections, changes] = canPlan
        ? await Promise.all([
            tx.constructionPlanVersion.findMany({ where, orderBy: { versionNumber: "asc" } }),
            tx.constructionMilestone.findMany({ where, orderBy: [{ sequence: "asc" }, { name: "asc" }] }),
            tx.constructionDependency.findMany({ where, orderBy: { createdAt: "asc" } }),
            tx.constructionDecision.findMany({ where, orderBy: { createdAt: "desc" }, include: { options: { orderBy: { createdAt: "asc" } } } }),
            tx.constructionIssue.findMany({ where, orderBy: { reportedAt: "desc" } }),
            tx.constructionInspection.findMany({ where, orderBy: { performedAt: "desc" } }),
            tx.constructionChange.findMany({ where, orderBy: { requestedAt: "desc" } }),
          ])
        : [[], [], [], [], [], [], []];
      const commitments = a.can("CONSTRUCTION_BUDGET_READ")
        ? await tx.constructionCommitment.findMany({ where, orderBy: { committedAt: "desc" } })
        : [];
      const [quotes, orders, deliveries] = a.can("CONSTRUCTION_MATERIAL_READ")
        ? await Promise.all([
            tx.supplierQuote.findMany({ where, orderBy: { createdAt: "desc" } }),
            tx.constructionOrder.findMany({ where, orderBy: { orderedAt: "desc" } }),
            tx.constructionDelivery.findMany({ where, orderBy: { receivedAt: "desc" } }),
          ])
        : [[], [], []];
      const handover = a.owner
        ? await tx.constructionHandover.findUnique({ where: { projectId } })
        : null;
      const money = canMoney
        ? await computeMoneySummary(
            tx,
            { id: projectId, workspaceId: p.workspaceId, initialBudgetPaise: p.initialBudgetPaise, budgetPaise: p.budgetPaise },
            a.propertyId,
            costs,
            spent,
            (id) => amounts.find((entry) => entry.id === id)?.amountPaise ?? 0n,
          )
        : null;
      const role = await resolveProjectRole(tx, userId, a.owner, where);
      const guidanceCaps = {
        plan: canPlan,
        financial: canMoney,
        materials: a.can("CONSTRUCTION_MATERIAL_READ"),
        site: a.can("CONSTRUCTION_UPDATE_READ"),
        documents: a.can("CONSTRUCTION_DOCUMENT_READ"),
        handover: a.owner,
      };
      const guidanceRows = await tx.constructionGuidance.findMany({
        where: { ...where, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      });
      const guidance = sortGuidance(
        projectGuidanceForRole(filterGuidanceForCaps(guidanceRows, guidanceCaps), role),
      );
      const eventVisibilities = [
        "PROJECT",
        ...(a.can("CONSTRUCTION_TASK_READ") ? ["TASK"] : []),
        ...(a.can("CONSTRUCTION_BUDGET_READ") ? ["BUDGET"] : []),
        ...(a.can("CONSTRUCTION_COST_READ") ? ["COST"] : []),
        ...(a.can("CONSTRUCTION_UPDATE_READ") ? ["UPDATE"] : []),
        ...(a.can("CONSTRUCTION_MATERIAL_READ") ? ["MATERIAL"] : []),
        ...(a.can("CONSTRUCTION_CONTACT_READ") ? ["CONTACT"] : []),
        ...(a.owner ? ["DOCUMENT"] : []),
      ];
      const events = await tx.constructionEvent.findMany({
        where: { ...where, visibility: { in: eventVisibilities } },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      const links = a.can("CONSTRUCTION_DOCUMENT_READ")
        ? await tx.constructionDocumentLink.findMany({ where })
        : [];
      const documents = [];
      for (const link of links) {
        const d = await tx.propertyDoc.findFirst({
          where: {
            id: link.documentId,
            workspaceId: p.workspaceId,
            propertyId: a.propertyId,
            archivedAt: null,
            deletedAt: null,
            scanStatus: "clean",
          },
        });
        if (
          !d ||
          (!a.owner &&
            !a.grants.some(
              (g) =>
                shareScopeAllows(g, "DOCUMENT_METADATA_READ", d) ||
                shareScopeAllows(g, "DOCUMENT_PREVIEW", d),
            ))
        )
          continue;
        const version = await tx.documentVersion.findFirst({
          where: {
            id: link.documentVersionId,
            documentId: d.id,
            scanStatus: "clean",
          },
        });
        if (!version) continue;
        documents.push({
          ...link,
          title: d.displayName || d.name,
          reviewStatus: d.reviewStatus,
          version: version.version,
          href: a.owner
            ? `/property/${a.propertyId}?tab=vault&document=${d.id}`
            : `/shared/${a.propertyId}?document=${d.id}`,
        });
      }
      const configuredChecklist = a.owner
        ? await checklist(tx, a.propertyId, p.workspaceId)
        : [];
      const currentStage =
        stageRows.find((s) => s.status === "IN_PROGRESS") ??
        stageRows.find((s) => !["COMPLETED", "SKIPPED"].includes(s.status));
      const attention = [
        ...tasks
          .filter((t) => t.status === "BLOCKED")
          .map((t) => ({ type: "BLOCKED_TASK", title: t.title, tab: "plan" })),
        ...stageRows
          .filter(
            (s) =>
              s.expectedEnd &&
              s.expectedEnd < today() &&
              !["COMPLETED", "SKIPPED"].includes(s.status),
          )
          .map((s) => ({ type: "OVERDUE_STAGE", title: s.name, tab: "plan" })),
        ...updates
          .filter((u) => u.issueStatus === "OPEN")
          .map((u) => ({ type: "SITE_ISSUE", title: u.title, tab: "updates" })),
        ...configuredChecklist
          .filter((r) => r.status !== "DOCUMENT_AVAILABLE")
          .map((r) => ({ type: r.status, title: r.title, tab: "documents" })),
        ...(a.can("CONSTRUCTION_COST_READ") &&
        a.can("CONSTRUCTION_BUDGET_READ") &&
        spent > p.budgetPaise
          ? [
              {
                type: "BUDGET_VARIANCE",
                title: "Recorded spend exceeds planned budget",
                tab: "budget",
              },
            ]
          : []),
        ...materials
          .filter(
            (m) =>
              m.requiredByDate &&
              m.requiredByDate <=
                new Date(Date.now() + 7 * 86400000)
                  .toISOString()
                  .slice(0, 10) &&
              !["RECEIVED", "CANCELLED"].includes(m.status),
          )
          .map((m) => ({
            type: "MATERIAL_DUE",
            title: m.name,
            tab: "materials",
          })),
      ];
      const financial = a.can("CONSTRUCTION_BUDGET_READ");
      return {
        id: p.id,
        propertyId: a.propertyId,
        name: p.name,
        projectType: p.projectType,
        status: p.status,
        version: p.version,
        owner: a.owner,
        startDate: p.startDate,
        targetCompletionDate: p.targetCompletionDate,
        builtUpArea: p.builtUpArea?.toString() ?? null,
        areaUnit: p.areaUnit,
        floorCount: p.floorCount,
        qualityLevel: p.qualityLevel,
        requirements: a.owner ? p.requirements : undefined,
        archivedAt: p.archivedAt,
        completedAt: p.completedAt,
        completionSummary: a.owner ? p.completionSummary : undefined,
        templateVersion: p.templateVersion,
        estimatedBudgetPaise: financial ? p.budgetPaise.toString() : undefined,
        initialBudgetPaise: financial
          ? p.initialBudgetPaise.toString()
          : undefined,
        recordedSpendPaise: a.can("CONSTRUCTION_COST_READ")
          ? spent.toString()
          : undefined,
        remainingPlannedPaise:
          financial && a.can("CONSTRUCTION_COST_READ")
            ? (p.budgetPaise - spent).toString()
            : undefined,
        daysElapsed: Math.max(
          0,
          Math.floor(
            ((p.completedAt?.getTime() ?? Date.now()) -
              Date.parse(p.startDate)) /
              86400000,
          ),
        ),
        progressPercent,
        currentStage,
        stages: stageRows,
        tasks: tasks.map((t) => ({
          ...t,
          estimatePaise: financial ? t.estimatePaise.toString() : undefined,
          actualCostPaise: a.can("CONSTRUCTION_COST_READ")
            ? costs
                .filter((c) => c.taskId === t.id)
                .reduce(
                  (n, c) =>
                    n + (amounts.find((a) => a.id === c.id)?.amountPaise ?? 0n),
                  0n,
                )
                .toString()
            : undefined,
        })),
        budgets: budgets.map((b) => ({
          ...b,
          estimatedPaise: b.estimatedPaise.toString(),
          recordedPaise: a.can("CONSTRUCTION_COST_READ")
            ? costs
                .filter((c) => c.budgetItemId === b.id)
                .reduce(
                  (n, c) =>
                    n + (amounts.find((a) => a.id === c.id)?.amountPaise ?? 0n),
                  0n,
                )
                .toString()
            : undefined,
        })),
        costs: costs.map(({ ledgerEntry, ...c }) => ({
          ...c,
          originalAmountPaise: ledgerEntry?.amountPaise.toString(),
          replacesCostId:
            ledgerEntry?.replacementFor?.constructionCost?.id ?? null,
          correction: ledgerEntry?.reversals[0]
            ? {
                reversalLedgerEntryId: ledgerEntry.reversals[0].id,
                amountPaise: ledgerEntry.reversals[0].amountPaise.toString(),
                reason: ledgerEntry.reversals[0].correctionReason,
                actorUserId: a.owner
                  ? ledgerEntry.reversals[0].actorUserId
                  : undefined,
                createdAt: ledgerEntry.reversals[0].createdAt,
                replacementCostId:
                  ledgerEntry.replacements[0]?.constructionCost?.id ?? null,
              }
            : null,
          amountPaise: (
            amounts.find((a) => a.id === c.id)?.amountPaise ?? 0n
          ).toString(),
        })),
        materials: materials.map((m) => ({
          ...m,
          quantity: m.quantity.toString(),
          estimatedUnitRatePaise: financial
            ? m.estimatedUnitRatePaise.toString()
            : undefined,
          actualUnitRatePaise: a.can("CONSTRUCTION_COST_READ")
            ? m.actualUnitRatePaise?.toString()
            : undefined,
          estimatedTotalPaise: financial
            ? m.quantity.mul(m.estimatedUnitRatePaise.toString()).toFixed(0)
            : undefined,
        })),
        prices: prices.map((p) => ({
          ...p,
          pricePaise: p.pricePaise.toString(),
        })),
        procurement,
        contacts,
        updates,
        documents,
        planVersions,
        milestones,
        dependencies,
        decisions: decisions.map((d) => ({
          ...d,
          options: d.options.map((o) => ({
            ...o,
            estimatedCostImpactPaise: o.estimatedCostImpactPaise.toString(),
          })),
        })),
        issues: issues.map((i) => ({
          ...i,
          costImpactPaise: i.costImpactPaise?.toString() ?? null,
        })),
        inspections,
        changes: changes.map((c) => ({
          ...c,
          estimatedCostImpactPaise: c.estimatedCostImpactPaise.toString(),
          actualCostImpactPaise: c.actualCostImpactPaise?.toString() ?? null,
        })),
        commitments: commitments.map((c) => ({
          ...c,
          amountPaise: c.amountPaise.toString(),
        })),
        supplierQuotes: quotes.map((q) => ({
          ...q,
          quantity: q.quantity.toString(),
          unitRatePaise: q.unitRatePaise.toString(),
          taxPaise: q.taxPaise.toString(),
          deliveryChargePaise: q.deliveryChargePaise.toString(),
          totalPaise: q.totalPaise.toString(),
        })),
        orders: orders.map((o) => ({
          ...o,
          orderedQuantity: o.orderedQuantity.toString(),
          totalPaise: o.totalPaise.toString(),
        })),
        deliveries: deliveries.map((d) => ({
          ...d,
          expectedQuantity: d.expectedQuantity?.toString() ?? null,
          receivedQuantity: d.receivedQuantity.toString(),
        })),
        handover: handover
          ? {
              ...handover,
              finalRecordedSpendPaise: handover.finalRecordedSpendPaise?.toString() ?? null,
            }
          : null,
        money,
        guidance,
        role,
        configuredChecklist,
        checklistState: configuredChecklist.length ? "CONFIGURED" : "UNKNOWN",
        events: events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          title: e.title,
          createdAt: e.createdAt,
          payload: a.owner ? e.payload : undefined,
        })),
        attention,
        nextSteps: tasks
          .filter(
            (t) =>
              ["TODO", "IN_PROGRESS"].includes(t.status) &&
              t.stageId === currentStage?.id,
          )
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            title: t.title,
            href: `/construction/${p.id}?tab=plan`,
          })),
        capabilities: {
          tasks: a.can("CONSTRUCTION_TASK_READ"),
          documents: a.can("CONSTRUCTION_DOCUMENT_READ"),
          budget: financial,
          cost: a.can("CONSTRUCTION_COST_READ"),
          materials: a.can("CONSTRUCTION_MATERIAL_READ"),
          updates: a.can("CONSTRUCTION_UPDATE_READ"),
          contacts: a.can("CONSTRUCTION_CONTACT_READ"),
        },
      };
    },
    { timeout: 15000 },
  );
}

export type ConstructionView = Awaited<
  ReturnType<typeof getConstructionForUser>
>;
export async function listConstructionForUser(
  userId: string,
  propertyId?: string,
  archived = false,
) {
  const workspace = await getWorkspaceForUser(userId);
  const grants = await getActiveSharesForUser(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "operator") return [];
  const rows = await prisma.constructionProject.findMany({
    where: {
      ...(propertyId ? { propertyId } : {}),
      archivedAt: archived ? { not: null } : null,
      property: { status: "active" },
      OR: [
        ...(workspace ? [{ workspaceId: workspace.id }] : []),
        ...grants
          .filter((g) => shareScopeAllows(g, "CONSTRUCTION_PROJECT_READ"))
          .map((g) => ({
            workspaceId: g.workspaceId,
            propertyId: g.propertyId,
          })),
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const result = [];
  for (const p of rows)
    result.push(await getConstructionForUser(userId, p.id, archived));
  return result;
}

export async function reminder(
  tx: DB,
  p: { id: string; workspaceId: string; propertyId: string | null },
  sourceId: string,
  title: string,
  due: string | null,
  cancelled = false,
) {
  const key = `construction:${p.id}:${sourceId}`;
  if (!due || cancelled) {
    await tx.durableReminder.updateMany({
      where: { idempotencyKey: key },
      data: { state: "CANCELLED", failureState: "SOURCE_CHANGED" },
    });
    return;
  }
  const scheduledAt = new Date(`${due}T03:30:00.000Z`);
  await tx.durableReminder.upsert({
    where: { idempotencyKey: key },
    create: {
      id: randomUUID(),
      workspaceId: p.workspaceId,
      propertyId: p.propertyId!,
      sourceType: "CONSTRUCTION",
      sourceId,
      offsetDays: 0,
      scheduledAt,
      timezone: "Asia/Kolkata",
      localTime: "09:00",
      channel: "IN_APP",
      idempotencyKey: key,
      deepLink: `/construction/${p.id}`,
      title,
      body: "Owner-entered construction follow-up.",
    },
    update: { scheduledAt, title, state: "SCHEDULED", failureState: null },
  });
}

export async function mutateConstructionForUser(
  userId: string,
  projectId: string,
  raw: unknown,
) {
  const v = object(raw);
  const action = text(v.action, "Action");
  const key = text(v.idempotencyKey, "Request key", 120);
  const payloadHash = hash(v);
  await prisma.$transaction(
    async (tx) => {
      const a = await access(tx, userId, projectId, true, true);
      const p = a.project;
      // Parent row lock serializes idempotency, version checks, dependencies and all children.
      await tx.$queryRaw`SELECT id FROM "ConstructionProject" WHERE id=${projectId} FOR UPDATE`;
      const existing = await tx.constructionEvent.findUnique({
        where: { projectId_requestKey: { projectId, requestKey: key } },
      });
      if (existing) {
        if (existing.payloadHash !== payloadHash)
          return fail(
            "Request key was used for another payload.",
            "IDEMPOTENCY_CONFLICT",
            409,
          );
        return;
      }
      const current = await tx.constructionProject.findUniqueOrThrow({
        where: { id: projectId },
      });
      if (!Number.isInteger(v.version) || v.version !== current.version)
        return fail(
          "Project changed. Reload before saving.",
          "CONSTRUCTION_VERSION_CONFLICT",
          409,
        );
      if (current.archivedAt && action !== "RESTORE")
        return fail(
          "Restore this project before editing.",
          "PROJECT_ARCHIVED",
          409,
        );
      if (
        ["COMPLETED", "CANCELLED"].includes(current.status) &&
        !["ARCHIVE", "RESTORE", "COST_CORRECT", "COST_REVERSE", "HANDOVER_UPDATE", "HANDOVER_COMPLETE", "DOCUMENT_CONTEXT_SET"].includes(action)
      )
        return fail(
          "Completed or cancelled project history is read-only.",
          "PROJECT_CLOSED",
          409,
        );
      const where = { projectId, workspaceId: p.workspaceId };
      const base = { ...where, id: randomUUID() };
      const stageId = optionalId(v.stageId);
      const taskId = optionalId(v.taskId);
      const contactId = optionalId(v.contactId);
      if (
        stageId &&
        !(await tx.constructionStage.findFirst({
          where: { ...where, id: stageId },
        }))
      )
        return missing();
      if (
        taskId &&
        !(await tx.constructionTask.findFirst({
          where: { ...where, id: taskId, ...(stageId ? { stageId } : {}) },
        }))
      )
        return missing();
      if (
        contactId &&
        !(await tx.constructionContact.findFirst({
          where: { ...where, id: contactId },
        }))
      )
        return missing();
      let visibility = "PROJECT";
      let result: unknown = {};
      let eventType: string | null = null;
      const derivedEvents: Array<{
        suffix: string;
        eventType: string;
        payload: unknown;
        visibility: string;
      }> = [];
      if (action === "PROJECT_UPDATE") {
        const end = date(v.targetCompletionDate);
        if (end && end < current.startDate)
          return fail("Target completion must follow start date.");
        await tx.constructionProject.update({
          where: { id: projectId },
          data: {
            name: text(v.name, "Name"),
            targetCompletionDate: end,
            notes: text(v.notes, "Notes", 4000, true),
          },
        });
      } else if (action === "PROJECT_STATUS") {
        const status = choice(
          v.status,
          ["PLANNING", "APPROVALS", "ACTIVE", "ON_HOLD", "CANCELLED"],
          "Status",
        );
        const transitions: Record<string, string[]> = {
          PLANNING: ["APPROVALS", "ACTIVE", "ON_HOLD", "CANCELLED"],
          APPROVALS: ["ACTIVE", "ON_HOLD", "CANCELLED"],
          ACTIVE: ["ON_HOLD", "CANCELLED"],
          ON_HOLD: ["PLANNING", "APPROVALS", "ACTIVE", "CANCELLED"],
        };
        if (!transitions[current.status]?.includes(status))
          return fail("Invalid project transition.", "INVALID_TRANSITION", 409);
        await tx.constructionProject.update({
          where: { id: projectId },
          data: { status },
        });
        if (status === "CANCELLED")
          await tx.durableReminder.updateMany({
            where: {
              workspaceId: p.workspaceId,
              idempotencyKey: { startsWith: `construction:${projectId}:` },
            },
            data: { state: "CANCELLED" },
          });
        result = { status };
        if (status === "ON_HOLD") eventType = "CONSTRUCTION_PROJECT_PAUSED";
        else if (current.status === "ON_HOLD") eventType = "CONSTRUCTION_PROJECT_RESUMED";
        else eventType = "CONSTRUCTION_PROJECT_UPDATED";
      } else if (action === "ARCHIVE" || action === "RESTORE") {
        await tx.constructionProject.update({
          where: { id: projectId },
          data: { archivedAt: action === "ARCHIVE" ? new Date() : null },
        });
        if (action === "ARCHIVE")
          await tx.durableReminder.updateMany({
            where: {
              workspaceId: p.workspaceId,
              idempotencyKey: { startsWith: `construction:${projectId}:` },
            },
            data: { state: "CANCELLED" },
          });
      } else if (action === "STAGE_CREATE") {
        const dep = optionalId(v.dependsOnId);
        if (
          dep &&
          !(await tx.constructionStage.findFirst({
            where: { ...where, id: dep },
          }))
        )
          return missing();
        const last = await tx.constructionStage.aggregate({
          where,
          _max: { sequence: true },
        });
        const start = date(v.expectedStart),
          end = date(v.expectedEnd);
        if (start && end && end < start)
          return fail("Stage end must follow start.");
        result = await tx.constructionStage.create({
          data: {
            ...base,
            name: text(v.name, "Stage name"),
            description: text(v.description, "Description", 2000, true),
            sequence: (last._max.sequence ?? 0) + 1,
            dependsOnId: dep,
            expectedStart: start,
            expectedEnd: end,
            status: dep ? "NOT_STARTED" : "READY",
          },
        });
        await reminder(tx, p, base.id, text(v.name, "Stage name"), end);
      } else if (action === "STAGE_UPDATE") {
        if (!stageId) return missing();
        const s = await tx.constructionStage.findUniqueOrThrow({
          where: { id: stageId },
        });
        const status = choice(
          v.status,
          [
            "NOT_STARTED",
            "READY",
            "IN_PROGRESS",
            "BLOCKED",
            "COMPLETED",
            "SKIPPED",
          ],
          "Stage status",
        );
        const allowed: Record<string, string[]> = {
          NOT_STARTED: ["READY", "IN_PROGRESS", "SKIPPED"],
          READY: ["IN_PROGRESS", "BLOCKED", "SKIPPED"],
          IN_PROGRESS: ["BLOCKED", "COMPLETED", "SKIPPED"],
          BLOCKED: ["IN_PROGRESS", "SKIPPED"],
          COMPLETED: [],
          SKIPPED: [],
        };
        if (status !== s.status && !allowed[s.status]?.includes(status))
          return fail("Invalid stage transition.", "INVALID_TRANSITION", 409);
        if (
          ["READY", "IN_PROGRESS", "COMPLETED"].includes(status) &&
          s.dependsOnId
        ) {
          const dep = await tx.constructionStage.findFirst({
            where: { ...where, id: s.dependsOnId },
          });
          if (!dep || !["COMPLETED", "SKIPPED"].includes(dep.status))
            return fail(
              "Complete or explicitly skip the preceding stage.",
              "DEPENDENCY_BLOCKED",
              409,
            );
        }
        if (
          status === "COMPLETED" &&
          (await tx.constructionTask.count({
            where: {
              ...where,
              stageId,
              required: true,
              status: { notIn: ["DONE", "CANCELLED"] },
            },
          }))
        )
          return fail(
            "Required tasks remain unresolved.",
            "UNRESOLVED_TASKS",
            409,
          );
        if (
          status === "SKIPPED" &&
          !text(v.notes, "Reason for skipping", 4000, true)
        )
          return fail("Record a reason before skipping this stage.");
        const start =
            v.expectedStart === undefined
              ? s.expectedStart
              : date(v.expectedStart),
          end =
            v.expectedEnd === undefined ? s.expectedEnd : date(v.expectedEnd);
        if (start && end && end < start)
          return fail("Stage end must follow start.");
        await tx.constructionStage.update({
          where: { id: stageId },
          data: {
            status,
            notes:
              v.notes === undefined
                ? s.notes
                : text(v.notes, "Notes", 4000, true),
            expectedStart: start,
            expectedEnd: end,
            actualStart:
              status === "IN_PROGRESS"
                ? (s.actualStart ?? today())
                : s.actualStart,
            actualEnd: ["COMPLETED", "SKIPPED"].includes(status)
              ? today()
              : null,
          },
        });
        if (status === "SKIPPED")
          await tx.constructionTask.updateMany({
            where: { ...where, stageId, status: { not: "DONE" } },
            data: { status: "CANCELLED" },
          });
        await reminder(
          tx,
          p,
          stageId,
          s.name,
          end,
          ["COMPLETED", "SKIPPED"].includes(status),
        );
        if (["COMPLETED", "SKIPPED"].includes(status)) {
          await tx.constructionStage.updateMany({
            where: { ...where, dependsOnId: stageId, status: "NOT_STARTED" },
            data: { status: "READY" },
          });
          const children = await tx.constructionTask.findMany({
            where: { ...where, stageId },
          });
          for (const t of children)
            await reminder(tx, p, t.id, t.title, null, true);
        }
        result = { stageId, status };
        if (status !== s.status) {
          eventType =
            status === "COMPLETED" ? "CONSTRUCTION_STAGE_COMPLETED"
            : status === "BLOCKED" ? "CONSTRUCTION_STAGE_BLOCKED"
            : status === "IN_PROGRESS" ? "CONSTRUCTION_STAGE_STARTED"
            : status === "READY" ? "CONSTRUCTION_STAGE_READY"
            : null;
        }
        if (["COMPLETED", "SKIPPED"].includes(status) || ["COMPLETED", "SKIPPED"].includes(s.status))
          derivedEvents.push(...(await derivedDependencyEvents(tx, where)));
      } else if (action === "TASK_CREATE" || action === "TASK_UPDATE") {
        visibility = "TASK";
        const task = taskId
          ? await tx.constructionTask.findFirst({
              where: { ...where, id: taskId },
            })
          : null;
        if (action === "TASK_UPDATE" && !task) return missing();
        const sid = stageId ?? task?.stageId;
        if (!sid) return fail("Select a stage.");
        const stage = await tx.constructionStage.findFirst({
          where: { ...where, id: sid },
        });
        if (!stage) return missing();
        if (["COMPLETED", "SKIPPED"].includes(stage.status))
          return fail("This stage is closed.", "INVALID_TRANSITION", 409);
        const status = choice(
          v.status ?? task?.status ?? "TODO",
          ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"],
          "Task status",
        );
        if (
          status === "DONE" &&
          !["IN_PROGRESS", "BLOCKED"].includes(stage.status)
        )
          return fail(
            "Start the stage before completing tasks.",
            "INVALID_TRANSITION",
            409,
          );
        if (task?.status === "DONE" && status === "DONE") return; // Semantic retry adds no event or version.
        if (task && ["DONE", "CANCELLED"].includes(task.status))
          return fail(
            "Closed tasks are historical; create a follow-up task.",
            "INVALID_TRANSITION",
            409,
          );
        const dep =
          v.dependsOnId === undefined
            ? (task?.dependsOnId ?? null)
            : optionalId(v.dependsOnId);
        if (dep) {
          const dependency = await tx.constructionTask.findFirst({
            where: { ...where, id: dep },
          });
          if (!dependency || dep === task?.id) return missing();
          let next = dependency;
          const seen = new Set<string>(task ? [task.id] : []);
          while (next) {
            if (seen.has(next.id))
              return fail("Task dependencies cannot form a cycle.");
            seen.add(next.id);
            if (!next.dependsOnId) break;
            const row = await tx.constructionTask.findFirst({
              where: { ...where, id: next.dependsOnId },
            });
            if (!row) break;
            next = row;
          }
          if (
            ["IN_PROGRESS", "DONE"].includes(status) &&
            dependency.status !== "DONE"
          )
            return fail(
              "Complete the dependency first.",
              "DEPENDENCY_BLOCKED",
              409,
            );
        }
        const due =
          v.dueDate === undefined ? (task?.dueDate ?? null) : date(v.dueDate);
        const data = {
          stageId: sid,
          sequence:
            task?.sequence ??
            ((
              await tx.constructionTask.aggregate({
                where: { ...where, stageId: sid },
                _max: { sequence: true },
              })
            )._max.sequence ?? 0) + 1,
          title:
            v.title === undefined
              ? (task?.title ?? text(v.title, "Title"))
              : text(v.title, "Title"),
          description:
            v.description === undefined
              ? (task?.description ?? "")
              : text(v.description, "Description", 4000, true),
          status,
          priority: choice(
            v.priority ?? task?.priority ?? "NORMAL",
            ["LOW", "NORMAL", "HIGH"],
            "Priority",
          ),
          dueDate: due,
          assignedContactId:
            v.contactId === undefined ? task?.assignedContactId : contactId,
          dependsOnId: dep,
          estimatePaise:
            v.estimatePaise === undefined
              ? (task?.estimatePaise ?? 0n)
              : money(v.estimatePaise),
          notes:
            v.notes === undefined
              ? (task?.notes ?? "")
              : text(v.notes, "Notes", 4000, true),
          required:
            typeof v.required === "boolean"
              ? v.required
              : (task?.required ?? true),
          completedAt: status === "DONE" ? new Date() : null,
        };
        const saved = task
          ? await tx.constructionTask.update({ where: { id: task.id }, data })
          : await tx.constructionTask.create({ data: { ...base, ...data } });
        result = { id: saved.id, status };
        await reminder(
          tx,
          p,
          saved.id,
          saved.title,
          due,
          ["DONE", "CANCELLED"].includes(status),
        );
        // Canonical work-item lifecycle events; the legacy action stays in
        // the payload for audit continuity.
        if (!task) eventType = "WORK_ITEM_READY";
        else if (status !== task.status) {
          eventType =
            status === "DONE" ? "WORK_ITEM_COMPLETED"
            : status === "BLOCKED" ? "WORK_ITEM_BLOCKED"
            : status === "CANCELLED" ? "WORK_ITEM_CANCELLED"
            : status === "IN_PROGRESS" && task.status === "TODO" ? "WORK_ITEM_STARTED"
            : "WORK_ITEM_REOPENED";
        }
        if (["DONE", "CANCELLED"].includes(status) || (task && ["DONE", "CANCELLED"].includes(task.status)))
          derivedEvents.push(...(await derivedDependencyEvents(tx, where)));
      } else if (action === "BUDGET_SET") {
        visibility = "BUDGET";
        const budgetId = optionalId(v.budgetItemId);
        if (
          budgetId &&
          !(await tx.constructionBudgetItem.findFirst({
            where: { ...where, id: budgetId },
          }))
        )
          return missing();
        const data = {
          category: text(v.category, "Category"),
          estimatedPaise: money(v.estimatedPaise),
          stageId,
          notes: text(v.notes, "Notes", 2000, true),
        };
        result = budgetId
          ? await tx.constructionBudgetItem.update({
              where: { id: budgetId },
              data,
            })
          : await tx.constructionBudgetItem.create({
              data: { ...base, ...data },
            });
        if (v.projectBudgetPaise !== undefined)
          await tx.constructionProject.update({
            where: { id: projectId },
            data: { budgetPaise: money(v.projectBudgetPaise) },
          });
        eventType = "BUDGET_UPDATED";
      } else if (action === "COST_CORRECT" || action === "COST_REVERSE") {
        visibility = "COST";
        const cost = await tx.constructionCost.findFirst({
          where: { ...where, id: text(v.costId, "Expense") },
          include: { ledgerEntry: true },
        });
        if (!cost) return missing();
        if (
          cost.source !== "USER_RECORDED_EXPENSE" ||
          !cost.ledgerEntry ||
          cost.ledgerEntry.entryType !== "CONSTRUCTION_OWNER_EXPENSE"
        )
          return fail(
            "Correct linked payments in Bills, then refresh Construction records.",
            "USE_PAYMENT_WORKFLOW",
            409,
          );
        const original = cost.ledgerEntry;
        if (
          await tx.expenseLedgerEntry.findUnique({
            where: { reversalOfId: original.id },
          })
        )
          return fail(
            "This expense has already been reversed or corrected. Refresh records to see its history.",
            "EXPENSE_ALREADY_CORRECTED",
            409,
          );
        const reason = text(v.reason, "Correction reason", 2000);
        if (v.confirmed !== true)
          return fail("Confirm the reversal of the original expense.");
        const replacementAmount =
          action === "COST_CORRECT" ? money(v.amountPaise) : 0n;
        if (
          action === "COST_CORRECT" &&
          (replacementAmount <= 0n ||
            replacementAmount === original.amountPaise)
        )
          return fail(
            "Enter a different positive amount, or use Reverse entry to remove its spend.",
          );
        const audit = {
          workspaceId: p.workspaceId,
          propertyId: a.propertyId,
          currency: original.currency,
          correctionReason: reason,
          actorUserId: userId,
        };
        const reversal = await tx.expenseLedgerEntry.create({
          data: {
            ...audit,
            id: randomUUID(),
            amountPaise: -original.amountPaise,
            entryType: "CONSTRUCTION_OWNER_EXPENSE_REVERSAL",
            canonicalKey: `construction-reversal:${original.id}`,
            reversalOfId: original.id,
          },
        });
        let replacementCostId: string | null = null;
        if (action === "COST_CORRECT") {
          const replacement = await tx.expenseLedgerEntry.create({
            data: {
              ...audit,
              id: randomUUID(),
              amountPaise: replacementAmount,
              entryType: "CONSTRUCTION_OWNER_EXPENSE",
              canonicalKey: `construction-replacement:${original.id}`,
              replacementForId: original.id,
            },
          });
          const nextCost = await tx.constructionCost.create({
            data: {
              ...base,
              stageId: cost.stageId,
              taskId: cost.taskId,
              budgetItemId: cost.budgetItemId,
              documentLinkId: cost.documentLinkId,
              title: cost.title,
              source: "USER_RECORDED_EXPENSE",
              ledgerEntryId: replacement.id,
              recordedDate: cost.recordedDate,
            },
          });
          replacementCostId = nextCost.id;
        }
        result = {
          costId: cost.id,
          originalLedgerEntryId: original.id,
          originalAmountPaise: original.amountPaise.toString(),
          reversalLedgerEntryId: reversal.id,
          replacementCostId,
          replacementAmountPaise: replacementAmount.toString(),
          reason,
          actorUserId: userId,
          correctedAt: reversal.createdAt.toISOString(),
          handoverSnapshotPreserved: current.status === "COMPLETED",
        };
        derivedEvents.push({
          suffix: `expense:reversed:${cost.id}`,
          eventType: "CONSTRUCTION_EXPENSE_REVERSED",
          payload: { costId: cost.id, reversalLedgerEntryId: reversal.id },
          visibility: "COST",
        });
      } else if (action === "COST_RECORD") {
        visibility = "COST";
        const source = choice(
          v.source,
          ["USER_RECORDED_EXPENSE", "LINKED_PAYMENT", "LINKED_INVOICE"],
          "Cost source",
        );
        const budgetItemId = optionalId(v.budgetItemId),
          documentLinkId = optionalId(v.documentLinkId),
          commitmentId = optionalId(v.commitmentId);
        if (
          budgetItemId &&
          !(await tx.constructionBudgetItem.findFirst({
            where: { ...where, id: budgetItemId },
          }))
        )
          return missing();
        if (
          commitmentId &&
          !(await tx.constructionCommitment.findFirst({
            where: { ...where, id: commitmentId },
          }))
        )
          return missing();
        if (
          documentLinkId &&
          !(await tx.constructionDocumentLink.findFirst({
            where: { ...where, id: documentLinkId },
          }))
        )
          return missing();
        let ledgerEntryId: string | null = null,
          obligationId: string | null = null;
        if (source === "USER_RECORDED_EXPENSE") {
          const amount = money(v.amountPaise);
          if (amount <= 0n) return fail("Recorded expense must be positive.");
          const entry = await tx.expenseLedgerEntry.create({
            data: {
              id: randomUUID(),
              workspaceId: p.workspaceId,
              propertyId: a.propertyId,
              amountPaise: amount,
              currency: "INR",
              entryType: "CONSTRUCTION_OWNER_EXPENSE",
              actorUserId: userId,
              canonicalKey: `construction:${projectId}:${key}`,
            },
          });
          ledgerEntryId = entry.id;
        } else if (source === "LINKED_PAYMENT") {
          const entry = await tx.expenseLedgerEntry.findFirst({
            where: {
              id: text(v.ledgerEntryId, "Ledger entry"),
              workspaceId: p.workspaceId,
              propertyId: a.propertyId,
              entryType: "OBLIGATION_PAYMENT",
              payment: { status: "RECORDED", reversalOfId: null },
            },
          });
          if (!entry) return missing();
          const accountingLock = `construction-accounting:${entry.obligationId ?? entry.id}`;
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${accountingLock}))`;
          if (
            await tx.constructionCost.findFirst({
              where: {
                OR: [
                  { ledgerEntryId: entry.id },
                  ...(entry.obligationId
                    ? [{ obligationId: entry.obligationId }]
                    : []),
                ],
              },
            })
          )
            return fail(
              "This expense is already assigned to Construction.",
              "DUPLICATE_EXPENSE",
              409,
            );
          ledgerEntryId = entry.id;
        } else {
          obligationId = text(v.obligationId, "Invoice obligation");
          const obligation = await tx.obligation.findFirst({
            where: {
              id: obligationId,
              workspaceId: p.workspaceId,
              propertyId: a.propertyId,
              direction: "PAYABLE",
              currency: "INR",
            },
          });
          if (!obligation) return missing();
          const accountingLock = `construction-accounting:${obligationId}`;
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${accountingLock}))`;
          const entries = await tx.expenseLedgerEntry.findMany({
            where: {
              workspaceId: p.workspaceId,
              propertyId: a.propertyId,
              obligationId,
            },
            select: { id: true },
          });
          if (
            await tx.constructionCost.findFirst({
              where: {
                OR: [
                  { obligationId },
                  { ledgerEntryId: { in: entries.map((e) => e.id) } },
                ],
              },
            })
          )
            return fail(
              "This invoice or its payments are already assigned.",
              "DUPLICATE_EXPENSE",
              409,
            );
        }
        result = await tx.constructionCost.create({
          data: {
            ...base,
            stageId,
            taskId,
            budgetItemId,
            documentLinkId,
            commitmentId,
            title: text(v.title, "Cost title"),
            source,
            ledgerEntryId,
            obligationId,
            recordedDate: date(v.recordedDate, false)!,
          },
        });
        if (commitmentId) {
          const narrowed = await tx.constructionCost.findMany({
            where,
            select: { id: true, ledgerEntryId: true, obligationId: true },
          });
          const narrowedAmounts = await spendRows(
            tx,
            p.workspaceId,
            a.propertyId,
            narrowed,
          );
          const byId = new Map(narrowedAmounts.map((r) => [r.id, r.amountPaise]));
          const transition = await refreshCommitmentFulfillment(
            tx,
            where,
            a.propertyId,
            commitmentId,
            async (ids) => new Map(ids.map((id) => [id, byId.get(id) ?? 0n])),
          );
          if (transition === "FULFILLED")
            derivedEvents.push({
              suffix: `commitment:${commitmentId}:fulfilled`,
              eventType: "COMMITMENT_FULFILLED",
              payload: { commitmentId },
              visibility: "COST",
            });
        }
        eventType = "CONSTRUCTION_EXPENSE_RECORDED";
      } else if (action === "MATERIAL_CREATE" || action === "MATERIAL_UPDATE") {
        visibility = "MATERIAL";
        const materialId = optionalId(v.materialId);
        const m = materialId
          ? await tx.materialRequirement.findFirst({
              where: { ...where, id: materialId },
            })
          : null;
        if (action === "MATERIAL_UPDATE" && !m) return missing();
        const data = {
          stageId: stageId ?? m?.stageId,
          category: text(v.category ?? m?.category, "Category"),
          name: text(v.name ?? m?.name, "Material"),
          quantity: quantity(v.quantity ?? m?.quantity.toString()),
          unit: text(v.unit ?? m?.unit, "Unit", 40),
          requiredByDate:
            v.requiredByDate === undefined
              ? (m?.requiredByDate ?? null)
              : date(v.requiredByDate),
          estimatedUnitRatePaise:
            v.estimatedUnitRatePaise === undefined
              ? (m?.estimatedUnitRatePaise ?? 0n)
              : money(v.estimatedUnitRatePaise),
          actualUnitRatePaise:
            v.actualUnitRatePaise === undefined
              ? m?.actualUnitRatePaise
              : money(v.actualUnitRatePaise),
          supplierContactId: contactId ?? m?.supplierContactId,
          status: choice(
            v.status ?? m?.status ?? "PLANNED",
            [
              "PLANNED",
              "QUOTE_REQUIRED",
              "QUOTING",
              "SELECTED",
              "ORDERED",
              "ORDERED_EXTERNALLY",
              "PARTIALLY_RECEIVED",
              "RECEIVED",
              "CANCELLED",
            ],
            "Material status",
          ),
          provenance: "USER_ENTERED",
        };
        result = m
          ? await tx.materialRequirement.update({ where: { id: m.id }, data })
          : await tx.materialRequirement.create({ data: { ...base, ...data } });
        const id = m?.id ?? base.id;
        await reminder(
          tx,
          p,
          id,
          data.name,
          data.requiredByDate,
          ["RECEIVED", "CANCELLED"].includes(data.status),
        );
      } else if (action === "PRICE_RECORD") {
        visibility = "BUDGET";
        const materialId = text(v.materialId, "Material");
        const m = await tx.materialRequirement.findFirst({
          where: { ...where, id: materialId },
        });
        if (!m) return missing();
        if (v.unit !== m.unit)
          return fail("Price unit must match the material requirement unit.");
        result = await tx.materialPriceEntry.create({
          data: {
            ...base,
            materialId,
            brand: text(v.brand, "Brand", 100, true),
            grade: text(v.grade, "Grade", 100, true),
            dealer: text(v.dealer, "Dealer", 200, true),
            location: text(v.location, "Location"),
            recordedDate: date(v.recordedDate, false)!,
            unit: m.unit,
            pricePaise: money(v.pricePaise),
          },
        });
      } else if (action === "PROCUREMENT_SET") {
        visibility = "MATERIAL";
        const materialId = text(v.materialId, "Material");
        const m = await tx.materialRequirement.findFirst({
          where: { ...where, id: materialId },
        });
        if (!m) return missing();
        const status = choice(
          v.status,
          [
            "PLANNED",
            "QUOTE_REQUIRED",
            "ORDERED",
            "ORDERED_EXTERNALLY",
            "PARTIALLY_DELIVERED",
            "RECEIVED",
            "CANCELLED",
          ],
          "Procurement status",
        );
        result = await tx.procurementNeed.upsert({
          where: { projectId_materialId: { projectId, materialId } },
          create: {
            ...base,
            materialId,
            status,
            supplierContactId: contactId,
            notes: text(v.notes, "Notes", 2000, true),
          },
          update: {
            status,
            supplierContactId: contactId,
            notes: text(v.notes, "Notes", 2000, true),
          },
        });
        await tx.materialRequirement.update({
          where: { id: materialId },
          data: { status },
        });
        await reminder(
          tx,
          p,
          materialId,
          m.name,
          m.requiredByDate,
          ["RECEIVED", "CANCELLED"].includes(status),
        );
      } else if (action === "CONTACT_CREATE" || action === "CONTACT_UPDATE") {
        visibility = "CONTACT";
        if (action === "CONTACT_UPDATE" && !contactId) return missing();
        const email = text(v.email, "Email", 320, true);
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return fail("Email is invalid.");
        const data = {
          name: text(v.name, "Name"),
          company: text(v.company, "Company", 200, true),
          role: choice(
            v.role,
            [
              "OWNER",
              "ARCHITECT",
              "STRUCTURAL_ENGINEER",
              "CONTRACTOR",
              "PROJECT_MANAGER",
              "ELECTRICIAN",
              "PLUMBER",
              "INTERIOR_DESIGNER",
              "SUPPLIER",
              "VIEWER",
              "CUSTOM",
              "OTHER",
            ],
            "Contact role",
          ),
          phone: text(v.phone, "Phone", 40, true),
          email,
          notes: text(v.notes, "Notes", 2000, true),
        };
        result = contactId
          ? await tx.constructionContact.update({
              where: { id: contactId },
              data,
            })
          : await tx.constructionContact.create({ data: { ...base, ...data } });
      } else if (action === "UPDATE_CREATE" || action === "ISSUE_RESOLVE") {
        visibility = "UPDATE";
        if (action === "ISSUE_RESOLVE") {
          const id = text(v.updateId, "Site update");
          if (
            !(await tx.constructionUpdate.findFirst({
              where: { ...where, id, issueStatus: "OPEN" },
            }))
          )
            return missing();
          result = await tx.constructionUpdate.update({
            where: { id },
            data: { issueStatus: "RESOLVED" },
          });
        } else {
          const photoRefs = Array.isArray(v.photoRefs)
            ? (v.photoRefs as unknown[]).map((entry) => {
                if (typeof entry !== "string" || !entry.trim() || entry.length > 500)
                  return fail("Site photo references are invalid.");
                return entry.trim();
              })
            : [];
          if (photoRefs.length > 50) return fail("A site update supports at most 50 photos.");
          const idList = (value: unknown, label: string) => {
            if (value === undefined || value === null) return null;
            if (!Array.isArray(value) || value.length > 100) return fail(`${label} is invalid.`);
            return value.map((entry) => {
              if (typeof entry !== "string" || !entry.trim() || entry.length > 100)
                return fail(`${label} is invalid.`);
              return entry.trim();
            });
          };
          const workerCount =
            v.workerCount === undefined || v.workerCount === null || v.workerCount === ""
              ? null
              : Number(v.workerCount);
          if (workerCount !== null && (!Number.isInteger(workerCount) || workerCount < 0 || workerCount > 10000))
            return fail("Worker count is invalid.");
          result = await tx.constructionUpdate.create({
            data: {
              ...base,
              stageId,
              title: text(v.title, "Title"),
              description: text(v.description, "Description", 5000),
              occurredAt: new Date(
                `${date(v.occurredDate, false)}T12:00:00.000Z`,
              ),
              createdBy: userId,
              issueStatus: v.issue === true ? "OPEN" : "NONE",
              photoRefs: photoRefs.length ? photoRefs : undefined,
              workerCount,
              weatherNote: text(v.weatherNote, "Weather note", 500, true) || null,
              workCompletedIds: idList(v.workCompletedIds, "Completed work") ?? undefined,
              decisionRequestIds: idList(v.decisionRequestIds, "Decision") ?? undefined,
              deliveryIds: idList(v.deliveryIds, "Delivery") ?? undefined,
            },
          });
          eventType = photoRefs.length ? "SITE_PHOTOS_ADDED" : "SITE_UPDATE_ADDED";
        }
      } else if (action === "DOCUMENT_LINK") {
        visibility = "DOCUMENT";
        const documentId = text(v.documentId, "Document");
        const versionId = text(v.documentVersionId, "Document version");
        const updateId = optionalId(v.updateId);
        if (
          updateId &&
          !(await tx.constructionUpdate.findFirst({
            where: { ...where, id: updateId },
          }))
        )
          return missing();
        const d = await tx.propertyDoc.findFirst({
          where: {
            id: documentId,
            workspaceId: p.workspaceId,
            propertyId: a.propertyId,
            archivedAt: null,
            deletedAt: null,
            scanStatus: "clean",
          },
        });
        if (!d) return missing();
        if (
          !(await tx.documentVersion.findFirst({
            where: {
              id: versionId,
              documentId,
              workspaceId: p.workspaceId,
              scanStatus: "clean",
            },
          }))
        )
          return missing();
        const contextType = (() => {
          const raw = v.contextType;
          if (raw === undefined || raw === null || raw === "") return "PROJECT";
          const value = text(raw, "Context type", 40);
          if (
            ![
              "PROJECT", "STAGE", "MILESTONE", "WORK_ITEM", "DECISION", "ISSUE",
              "INSPECTION", "CHANGE", "COMMITMENT", "EXPENSE", "MATERIAL",
              "ORDER", "DELIVERY", "HANDOVER",
            ].includes(value)
          )
            return fail("Context type is invalid.");
          return value;
        })();
        const contextId = optionalId(v.contextId);
        if (
          await tx.constructionDocumentLink.findFirst({
            where: {
              projectId,
              documentVersionId: versionId,
              contextType,
              contextId,
            },
          })
        )
          return fail(
            "This version is already linked here.",
            "DOCUMENT_ALREADY_LINKED",
            409,
          );
        // Linking a newer clean version of an already-linked document is a
        // version change, not a first link: downstream guidance reevaluates.
        const priorSameDoc = await tx.constructionDocumentLink.findFirst({
          where: { ...where, documentId },
        });
        result = await tx.constructionDocumentLink.create({
          data: {
            ...base,
            stageId,
            taskId,
            updateId,
            documentId,
            documentVersionId: versionId,
            category: text(v.category, "Category"),
            contextType,
            contextId,
            label: text(v.label, "Label", 200, true),
          },
        });
        eventType = priorSameDoc
          ? "CONSTRUCTION_DOCUMENT_VERSION_CHANGED"
          : "CONSTRUCTION_DOCUMENT_LINKED";
      } else if (action === "REMINDER_SET") {
        const due = date(v.dueDate, false)!;
        const label = text(v.title, "Reminder title");
        const kind = choice(
          v.kind,
          [
            "WARRANTY",
            "APPROVAL_FOLLOWUP",
            "DOCUMENT_FOLLOWUP",
            "MILESTONE",
            "TASK",
            "MATERIAL",
          ],
          "Reminder kind",
        );
        await reminder(tx, p, `${kind}:${key}`, label, due);
        result = { kind, due, title: label };
      } else if (action === "COMPLETE") {
        if (v.confirmed !== true)
          return fail("Explicit owner confirmation is required.");
        const stages = await tx.constructionStage.findMany({ where });
        const unresolvedTasks = await tx.constructionTask.count({
          where: {
            ...where,
            required: true,
            status: { notIn: ["DONE", "CANCELLED"] },
          },
        });
        const issues = await tx.constructionUpdate.count({
          where: { ...where, issueStatus: "OPEN" },
        });
        const openDomainIssues = await tx.constructionIssue.count({
          where: {
            ...where,
            status: { in: ["OPEN", "INVESTIGATING", "ACTION_REQUIRED"] },
          },
        });
        const rules = await checklist(tx, a.propertyId, p.workspaceId);
        if (
          unresolvedTasks ||
          issues ||
          openDomainIssues ||
          stages.some((s) => !["COMPLETED", "SKIPPED"].includes(s.status)) ||
          rules.some((r) => r.status !== "DOCUMENT_AVAILABLE")
        )
          return fail(
            "Resolve required tasks, stages, configured checklist items and site issues before handover.",
            "CLOSEOUT_UNRESOLVED",
            409,
          );
        const completionDate = date(v.completionDate, false)!;
        if (completionDate < current.startDate || completionDate > today())
          return fail(
            "Completion date must fall between the recorded start and today.",
          );
        const costs = await tx.constructionCost.findMany({ where });
        const amounts = await spendRows(tx, p.workspaceId, a.propertyId, costs);
        const summary = {
          statement: "Project marked complete by owner.",
          started: current.startDate,
          completed: completionDate,
          recordedDurationDays: Math.floor(
            (Date.parse(completionDate) - Date.parse(current.startDate)) /
              86400000,
          ),
          initialBudgetPaise: current.initialBudgetPaise.toString(),
          latestEstimatedBudgetPaise: current.budgetPaise.toString(),
          recordedSpendPaise: amounts
            .reduce((n, c) => n + c.amountPaise, 0n)
            .toString(),
          milestones: stages.map((s) => ({
            id: s.id,
            name: s.name,
            status: s.status,
          })),
          documents: await tx.constructionDocumentLink.findMany({ where }),
          professionals: await tx.constructionContact.findMany({ where }),
          handoff: text(v.handoff, "Maintenance and warranty handoff", 4000),
          majorEvents: await tx.constructionEvent.findMany({
            where,
            select: { id: true, eventType: true, createdAt: true },
            orderBy: { createdAt: "asc" },
          }),
          checklistState: rules.length ? "CONFIGURED" : "UNKNOWN",
          ownerSummary: text(v.summary, "Project summary", 4000),
        };
        await tx.constructionProject.update({
          where: { id: projectId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(`${completionDate}T12:00:00.000Z`),
            completionSummary: json(summary),
          },
        });
        await tx.durableReminder.updateMany({
          where: {
            workspaceId: p.workspaceId,
            idempotencyKey: { startsWith: `construction:${projectId}:` },
            NOT: { sourceId: { startsWith: "WARRANTY:" } },
          },
          data: { state: "CANCELLED" },
        });
        result = summary;
      } else {
        // Construction OS Core 1.0 delta actions share the same project
        // lock, idempotency, versioning and audit pipeline.
        const outcome = await handleOsAction({
          tx,
          userId,
          project: { id: p.id, workspaceId: p.workspaceId, propertyId: a.propertyId },
          where,
          action,
          v,
          base,
          key,
          current: {
            version: current.version,
            budgetPaise: current.budgetPaise,
            initialBudgetPaise: current.initialBudgetPaise,
            startDate: current.startDate,
          },
        });
        if (!outcome) return fail("Unknown construction action.");
        result = outcome.result;
        eventType = outcome.eventType;
        visibility = outcome.visibility;
        if (outcome.derived) derivedEvents.push(...outcome.derived);
      }
      const stages = await tx.constructionStage.findMany({
        where,
        orderBy: { sequence: "asc" },
      });
      const next =
        stages.find((s) => s.status === "IN_PROGRESS") ??
        stages.find((s) => !["COMPLETED", "SKIPPED"].includes(s.status));
      await tx.constructionProject.update({
        where: { id: projectId },
        data: { version: { increment: 1 }, currentStageId: next?.id ?? null },
      });
      // Every meaningful change follows: persist → audit → domain event →
      // guidance reevaluation, reusing the existing durable worker/reminder
      // path (no second queue).
      await appendEvent(
        tx,
        p,
        userId,
        eventType ?? action,
        key,
        payloadHash,
        { action, ...(result && typeof result === "object" ? (result as Record<string, unknown>) : { result }) },
        visibility,
      );
      for (const derived of derivedEvents) {
        const derivedKey = `${key}#${derived.suffix}`;
        const derivedHash = hash(derived.payload);
        const seen = await tx.constructionEvent.findUnique({
          where: { projectId_requestKey: { projectId, requestKey: derivedKey } },
        });
        if (!seen)
          await appendEvent(
            tx,
            p,
            userId,
            derived.eventType,
            derivedKey,
            derivedHash,
            { action, ...(derived.payload && typeof derived.payload === "object" ? (derived.payload as Record<string, unknown>) : {}) },
            derived.visibility,
          );
      }
      await reevaluateConstructionGuidance(tx, {
        id: p.id,
        workspaceId: p.workspaceId,
        propertyId: a.propertyId,
      });
      // Budget-threshold guidance uses the same canonical ledger math as the
      // Money surface, evaluated on post-command state inside this tx.
      const moneyCosts = await tx.constructionCost.findMany({
        where,
        select: { id: true, ledgerEntryId: true, obligationId: true, commitmentId: true, budgetItemId: true },
      });
      const moneyAmounts = await spendRows(tx, p.workspaceId, a.propertyId, moneyCosts);
      const moneyById = new Map(moneyAmounts.map((r) => [r.id, r.amountPaise]));
      const recordedTotal = [...moneyById.values()].reduce((n, c) => n + c, 0n);
      const freshBudget = await tx.constructionProject.findUniqueOrThrow({
        where: { id: projectId },
        select: { budgetPaise: true, initialBudgetPaise: true },
      });
      const moneySummary = await computeMoneySummary(
        tx,
        { id: projectId, workspaceId: p.workspaceId, initialBudgetPaise: freshBudget.initialBudgetPaise, budgetPaise: freshBudget.budgetPaise },
        a.propertyId,
        moneyCosts,
        recordedTotal,
        (id) => moneyById.get(id) ?? 0n,
      );
      const budgetItems = await tx.constructionBudgetItem.findMany({ where });
      const categoryOverruns: string[] = [];
      for (const item of budgetItems) {
        const assigned = moneyCosts
          .filter((c) => c.budgetItemId === item.id)
          .reduce((n, c) => n + (moneyById.get(c.id) ?? 0n), 0n);
        if (assigned > item.estimatedPaise)
          categoryOverruns.push(`${item.category} is above its approved amount.`);
      }
      await evaluateBudgetGuidance(
        tx,
        { id: projectId, workspaceId: p.workspaceId },
        { recordedPaise: recordedTotal, currentApprovedPaise: BigInt(moneySummary.currentApprovedPaise), categoryOverruns },
      );
    },
    { timeout: 20000 },
  );
  return getConstructionForUser(userId, projectId, true);
}

export async function constructionSearchForUser(
  userId: string,
  query: string,
  propertyId?: string,
) {
  if (!query.trim()) return [];
  const projects = await listConstructionForUser(userId, propertyId);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return projects
    .flatMap((p) =>
      [
        {
          id: p.id,
          title: p.name,
          kind: "construction_project",
          tab: "overview",
        },
        ...p.stages.map((s) => ({
          id: s.id,
          title: s.name,
          kind: "construction_stage",
          tab: "plan",
        })),
        ...p.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          kind: "construction_task",
          tab: "plan",
        })),
        ...p.materials.map((m) => ({
          id: m.id,
          title: m.name,
          kind: "construction_material",
          tab: "materials",
        })),
        ...p.contacts.map((c) => ({
          id: c.id,
          title: c.name,
          kind: "construction_contact",
          tab: "people",
        })),
      ]
        .filter((r) => terms.every((t) => r.title.toLowerCase().includes(t)))
        .map((r) => ({
          ...r,
          propertyId: p.propertyId,
          subtitle: p.name,
          href: `/construction/${p.id}?tab=${r.tab}`,
        })),
    )
    .slice(0, 100);
}

export async function constructionAnswerForUser(
  userId: string,
  projectId: string,
  question: string,
  options?: { beforeFinalization?: () => Promise<void> },
) {
  if (!question.trim() || question.length > 2000)
    return fail("Ask a question of at most 2,000 characters.");
  const p = await getConstructionForUser(userId, projectId);
  const q = question.toLowerCase();
  let answer =
    "This question is not supported by the authorized construction records.";
  let tab = "overview";
  if (/create|delete|pay |edit|update |share |send |upload/.test(q))
    answer =
      "Construction answers are read only. Use the project forms to record changes.";
  else if (/spend|spent|cost/.test(q) && p.capabilities.cost) {
    answer = `Recorded construction spend is ₹${new Prisma.Decimal(p.recordedSpendPaise!).div(100).toFixed(2)} from the canonical expense ledger.`;
    tab = "budget";
  } else if (/missing|document|checklist/.test(q) && p.owner) {
    answer = p.configuredChecklist.length
      ? `${p.configuredChecklist.filter((r) => r.status !== "DOCUMENT_AVAILABLE").length} items need attention in the current configured construction checklist.`
      : "Construction checklist requirements are unknown: no applicable reviewed construction checklist is configured.";
    tab = "documents";
  } else if (/material/.test(q) && p.capabilities.materials) {
    answer =
      p.materials
        .filter((m) => !["RECEIVED", "CANCELLED"].includes(m.status))
        .map(
          (m) =>
            `${m.name}: ${m.quantity} ${m.unit}, required ${m.requiredByDate ?? "date not entered"} (owner entered)`,
        )
        .slice(0, 5)
        .join("; ") || "No pending material requirements are recorded.";
    tab = "materials";
  } else if (/next milestone|next stage/.test(q)) {
    const next = p.stages.find(
      (s) =>
        s.sequence > (p.currentStage?.sequence ?? 0) &&
        !["COMPLETED", "SKIPPED"].includes(s.status),
    );
    answer = next
      ? `Next recorded milestone: ${next.name}. Target: ${next.expectedEnd ?? "not entered"}.`
      : "No further milestone is recorded.";
    tab = "plan";
  } else if (/task|pending|next/.test(q) && p.capabilities.tasks) {
    answer =
      p.nextSteps.map((t) => t.title).join("; ") ||
      "No pending next-step task is recorded.";
    tab = "plan";
  } else if (/stage|milestone/.test(q)) {
    answer = p.currentStage
      ? `Current recorded stage: ${p.currentStage.name} (${p.currentStage.status}). Overall milestone-derived progress: ${p.progressPercent}%.`
      : "All stages are complete or explicitly skipped.";
    tab = "plan";
  }
  if (options?.beforeFinalization) await options.beforeFinalization();
  const current = await getConstructionForUser(userId, projectId);
  if (JSON.stringify(current.capabilities) !== JSON.stringify(p.capabilities))
    return missing();
  return {
    answer,
    providerEnvironment: "structured_no_model",
    estimatedCostPaise: null,
    actualCostPaise: null,
    citations: [
      {
        kind: "construction",
        id: p.id,
        title: p.name,
        recordType: "construction_project",
        href: `/construction/${p.id}?tab=${tab}`,
        versionId: undefined as string | undefined,
        page: undefined as number | undefined,
        chunk: undefined as number | undefined,
      },
    ],
    sourceCount: 1,
    outputState: "STRUCTURED_CONSTRUCTION",
  };
}

import type { Principal } from "@/lib/authz";
import { reevaluateConstructionGuidance } from "@/lib/construction-guidance";
import { composeHomeLives, type HomeLivesInput } from "@/lib/home-lives";
import { prisma } from "@/lib/prisma";
import { buyerStory, evaluateTransactionGuidance, sellerStory } from "@/lib/transactions";

type OwnerFacts = {
  properties: HomeLivesInput["properties"];
  obligations: HomeLivesInput["obligations"];
  maintenance: HomeLivesInput["maintenance"];
  reminders: HomeLivesInput["reminders"];
  documents: HomeLivesInput["documents"];
};

function quantityText(value: { toString(): string } | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = value.toString();
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

function textPaise(value: bigint | null | undefined): string | null {
  return value === null || value === undefined ? null : value.toString();
}

function termsPricePaise(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const price = (snapshot as { priceRupees?: unknown }).priceRupees;
  if (price === undefined || price === null || price === "") return null;
  try { return (BigInt(String(price)) * 100n).toString(); } catch { return null; }
}

function progressOf(
  stages: Array<{ id: string; name: string; status: string }>,
  counts: Array<{ stageId: string; status: string; _count: number }>,
) {
  const rows = stages.map((stage) => {
    const states = counts.filter((row) => row.stageId === stage.id && row.status !== "CANCELLED");
    const total = states.reduce((sum, row) => sum + row._count, 0);
    const done = states.filter((row) => row.status === "DONE").reduce((sum, row) => sum + row._count, 0);
    const progressPercent = total ? Math.floor((done * 100) / total) : stage.status === "COMPLETED" ? 100 : 0;
    return { ...stage, progressPercent };
  });
  const counted = rows.filter((stage) => stage.status !== "SKIPPED");
  const progressPercent = counted.length ? Math.floor(counted.reduce((sum, stage) => sum + stage.progressPercent, 0) / counted.length) : 0;
  const current = rows.find((stage) => stage.status === "IN_PROGRESS") ?? rows.find((stage) => !["COMPLETED", "SKIPPED"].includes(stage.status));
  return { progressPercent, stageName: current?.name ?? null };
}

export async function loadOwnerHomeLives(userId: string, workspaceId: string, facts: OwnerFacts) {
  const today = new Date().toISOString().slice(0, 10);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const principal: Principal = { userId, workspaceId, email: user?.email ?? "", role: "owner" };
  const guidance = await evaluateTransactionGuidance(workspaceId, new Date()).catch(() => []);
  const [projects, candidates, sales, visits, timeline, payments, entries] = await Promise.all([
    prisma.constructionProject.findMany({
      where: { workspaceId, propertyId: { not: null }, archivedAt: null, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      select: { id: true, propertyId: true },
    }),
    prisma.purchaseCandidate.findMany({
      where: { workspaceId, lifecycle: { not: "ARCHIVED" } },
      select: { id: true, name: true, location: true, transactionPhase: true, stage: true, linkedPropertyId: true, askingPricePaise: true },
    }),
    prisma.saleWorkspace.findMany({
      where: { workspaceId, lifecycle: { not: "ARCHIVED" } },
      select: { id: true, propertyId: true },
    }),
    prisma.transactionVisit.findMany({
      where: { workspaceId },
      select: { id: true, candidateId: true, prospectId: true, startsOn: true, contactName: true, notes: true, status: true },
    }),
    prisma.timelineEvent.findMany({
      where: { workspaceId, property: { status: "active" } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 40,
      select: { id: true, propertyId: true, title: true, detail: true, date: true, createdAt: true },
    }),
    prisma.transactionMoneyRecord.findMany({
      where: { workspaceId, reversalOfId: null },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: { id: true, candidateId: true, saleWorkspaceId: true, amountPaise: true, occurredOn: true, note: true, createdAt: true },
    }),
    prisma.purchaseEntry.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, candidateId: true, kind: true, body: true, dueDate: true, createdAt: true },
    }),
  ]);

  const projectIds = projects.map((project) => project.id);
  const [materials, deliveries, quotes] = await Promise.all([
    prisma.materialRequirement.findMany({ where: { projectId: { in: projectIds } }, take: 40, select: { id: true, projectId: true, name: true } }),
    prisma.constructionDelivery.findMany({ where: { projectId: { in: projectIds } }, take: 40, select: { id: true, projectId: true, materialRequirementId: true, expectedQuantity: true, receivedQuantity: true, unit: true } }),
    prisma.supplierQuote.findMany({ where: { projectId: { in: projectIds }, status: { not: "WITHDRAWN" } }, take: 40, select: { projectId: true, materialRequirementId: true } }),
  ]);
  const materialName = new Map(materials.map((row) => [row.id, row.name]));
  const quotedIds = new Set(quotes.map((row) => `${row.projectId}:${row.materialRequirementId}`));

  const projectRows: HomeLivesInput["projects"] = [];
  for (const project of projects) {
    if (!project.propertyId) continue;
    await prisma.$transaction((tx) => reevaluateConstructionGuidance(tx, { id: project.id, workspaceId, propertyId: project.propertyId })).catch(() => undefined);
    const [guidanceRows, stages, counts, milestones, updates] = await Promise.all([
      prisma.constructionGuidance.findMany({ where: { projectId: project.id, status: "ACTIVE" } }),
      prisma.constructionStage.findMany({ where: { projectId: project.id }, orderBy: { sequence: "asc" }, select: { id: true, name: true, status: true } }),
      prisma.constructionTask.groupBy({ by: ["stageId", "status"], where: { projectId: project.id }, _count: true }),
      prisma.constructionMilestone.findMany({ where: { projectId: project.id }, orderBy: { sequence: "asc" }, select: { name: true, status: true } }),
      prisma.constructionUpdate.findMany({ where: { projectId: project.id }, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], take: 20, select: { id: true, title: true, description: true, occurredAt: true, createdAt: true, photoRefs: true } }),
    ]);
    const progress = progressOf(stages, counts);
    const milestone = milestones.find((item) => item.status === "IN_PROGRESS") ?? milestones.find((item) => !["DONE", "SKIPPED", "CANCELLED"].includes(item.status));
    projectRows.push({
      id: project.id,
      propertyId: project.propertyId,
      stageName: progress.stageName,
      milestoneName: milestone?.name ?? null,
      progressPercent: progress.progressPercent,
      guidance: guidanceRows.map((row) => ({
        id: row.id,
        ruleKey: row.ruleKey,
        subjectType: row.subjectType,
        subjectId: row.subjectId,
        type: row.type,
        priority: row.priority,
        title: row.title,
        reason: row.reason,
        actionType: row.actionType,
        createdAt: row.createdAt,
        relevantUntil: row.relevantUntil,
      })),
      stages: stages.map((stage) => ({ name: stage.name, status: stage.status })),
      updates: updates.map((update) => ({
        id: update.id,
        title: update.title,
        description: update.description,
        occurredAt: update.occurredAt.toISOString(),
        createdAt: update.createdAt.toISOString(),
        photoRefs: Array.isArray(update.photoRefs) ? update.photoRefs.filter((item): item is string => typeof item === "string") : [],
      })),
      deliveries: deliveries.flatMap((row) => {
        if (row.projectId !== project.id || !row.materialRequirementId) return [];
        const name = materialName.get(row.materialRequirementId);
        const expected = quantityText(row.expectedQuantity);
        const received = quantityText(row.receivedQuantity);
        if (!name || !expected || !received) return [];
        return [{ id: row.id, materialName: name, expected, received, unit: row.unit }];
      }),
      quotedMaterialNames: materials.flatMap((row) => row.projectId === project.id && quotedIds.has(`${row.projectId}:${row.id}`) ? [row.name] : []),
    });
  }

  const purchases: HomeLivesInput["purchases"] = [];
  for (const candidate of candidates) {
    const story = await buyerStory(principal, candidate.id).catch(() => null);
    const commercial = story && "commercial" in story ? story.commercial : null;
    const money = story && "money" in story ? story.money : null;
    const terms = story && "terms" in story ? story.terms : null;
    const handover = story && "handover" in story ? story.handover : null;
    purchases.push({
      id: candidate.id,
      name: candidate.name,
      location: candidate.location,
      phase: candidate.transactionPhase ?? candidate.stage,
      linkedPropertyId: candidate.linkedPropertyId,
      askingPricePaise: textPaise(commercial?.askingPricePaise ?? candidate.askingPricePaise),
      latestBuyerOfferPaise: textPaise(commercial?.latestBuyerOfferPaise ?? null),
      reportedCounterPaise: textPaise(commercial?.reportedCounterPaise ?? null),
      agreed: commercial?.agreed ?? false,
      netPricePaidPaise: textPaise(money?.netPricePaidPaise ?? null),
      termsPricePaise: termsPricePaise(terms?.snapshot),
      handoverItems: (handover?.items ?? []).map((item) => ({ label: item.label, disposition: item.disposition })),
    });
  }

  const saleRows: HomeLivesInput["sales"] = [];
  for (const sale of sales) {
    const story = await sellerStory(principal, sale.id).catch(() => null);
    const prospects = story && "prospects" in story ? story.prospects : [];
    saleRows.push({
      id: sale.id,
      propertyId: sale.propertyId,
      prospects: prospects.map((prospect) => {
        const planned = visits.find((visit) => visit.prospectId === prospect.id && visit.status === "PLANNED");
        return {
          id: prospect.id,
          name: prospect.name,
          privateNotes: prospect.privateNotes,
          nextVisit: prospect.nextVisit,
          visitNotes: planned?.notes ?? null,
          offers: prospect.offers.map((offer) => ({ amountPaise: offer.amountPaise.toString(), offeredOn: offer.offeredOn, status: offer.status })),
        };
      }),
    });
  }

  return composeHomeLives({
    today,
    properties: facts.properties,
    projects: projectRows,
    obligations: facts.obligations,
    maintenance: facts.maintenance,
    reminders: facts.reminders,
    documents: facts.documents,
    timeline: timeline.map((event) => ({
      id: event.id,
      propertyId: event.propertyId,
      title: event.title,
      detail: event.detail,
      date: event.date,
      createdAt: event.createdAt.toISOString(),
    })),
    purchases,
    sales: saleRows,
    transactionGuidance: guidance.map((row) => ({
      ruleKey: row.ruleKey,
      subjectId: row.subjectId,
      title: row.title,
      href: row.href,
      dueDate: row.dueDate,
      relevanceKey: row.relevanceKey,
    })),
    visits: visits.map((visit) => ({
      id: visit.id,
      candidateId: visit.candidateId,
      prospectId: visit.prospectId,
      startsOn: visit.startsOn,
      contactName: visit.contactName,
      notes: visit.notes,
      status: visit.status,
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      candidateId: payment.candidateId,
      saleId: payment.saleWorkspaceId,
      amountPaise: payment.amountPaise.toString(),
      occurredOn: payment.occurredOn,
      note: payment.note,
      createdAt: payment.createdAt.toISOString(),
    })),
    entries: entries.map((entry) => ({
      id: entry.id,
      candidateId: entry.candidateId,
      kind: entry.kind,
      body: entry.body,
      dueDate: entry.dueDate,
      createdAt: entry.createdAt.toISOString(),
    })),
  });
}

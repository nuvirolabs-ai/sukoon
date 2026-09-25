import { prisma } from "@/lib/prisma";
import { getWorkspaceForUser } from "@/lib/repository";
import { getActiveSharesForUser, shareScopeAllows } from "@/lib/authz";
import { listPublishedEducation } from "@/lib/education";
import { composeSharedLives, withHomeLives } from "@/lib/home-lives";
import { loadOwnerHomeLives } from "@/lib/home-lives-load";

function rupees(value: bigint) { return Number(value) / 100; }
export async function getHomeProjectionForUser(userId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) {
    const grants = await getActiveSharesForUser(userId);
    const hasSharedHistory = grants.length > 0 || await prisma.shareLink.count({ where: { inviteeUserId: userId } }) > 0;
    if (!hasSharedHistory) return withHomeLives({ mode: "owner" as const, properties: [], summary: { propertyCount: 0, portfolioValuePaise: "0", outstandingPaise: "0", unreadAttention: 0, openMaintenance: 0, pendingDocumentReview: 0 }, attention: [], activity: [], education: { currentCount: (await listPublishedEducation()).length }, scope: "No property records yet. Add your first Property Passport; no sample data is created." }, [], null);
    const ids = [...new Set(grants.filter((grant) => shareScopeAllows(grant, "PROPERTY_BASIC_READ")).map((grant) => grant.propertyId))];
    const properties = await prisma.property.findMany({ where: { id: { in: ids }, status: "active" }, select: { id: true, name: true, type: true, city: true, area: true, address: true } });
    const activity = (await Promise.all(properties.flatMap((property) => grants.filter((grant) => grant.propertyId === property.id && shareScopeAllows(grant, "TIMELINE_READ")).map((grant) => prisma.timelineEvent.findMany({ where: { workspaceId: grant.workspaceId, propertyId: property.id }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 3, select: { id: true, propertyId: true, date: true, title: true, detail: true, kind: true } }).catch(() => []))))).flat().map((item) => ({ ...item, href: `/shared/${item.propertyId}` })).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 8);
    const sharedLives = composeSharedLives(properties.map((property) => ({ id: property.id, name: property.name, city: property.city, area: property.area })), activity);
    return withHomeLives({ mode: "shared" as const, properties, summary: { propertyCount: properties.length }, attention: [], activity, education: { currentCount: (await listPublishedEducation()).length }, scope: "Only records explicitly shared with this identity are shown." }, sharedLives.lives, sharedLives.defaultLifeId);
  }
  const [properties, reminders, docs, occurrences, maintenance, shares, timeline, assessments] = await Promise.all([
    prisma.property.findMany({ where: { workspaceId: workspace.id, status: "active" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, type: true, city: true, area: true, address: true, purchaseValuePaise: true, occupancy: true, photoUrl: true } }),
    prisma.durableReminder.findMany({ where: { workspaceId: workspace.id, readAt: null, state: { notIn: ["CANCELLED", "DELIVERED"] } }, orderBy: { scheduledAt: "asc" }, take: 20, select: { id: true, propertyId: true, title: true, body: true, scheduledAt: true, deepLink: true } }),
    prisma.propertyDoc.findMany({ where: { workspaceId: workspace.id, property: { status: "active" }, deletedAt: null, archivedAt: null }, select: { id: true, propertyId: true, name: true, displayName: true, reviewStatus: true, scanStatus: true } }),
    prisma.obligationOccurrence.findMany({ where: { workspaceId: workspace.id, property: { status: "active" }, status: { not: "COMPLETED" } }, include: { payments: { where: { status: "RECORDED", reversalOfId: null }, select: { amountPaise: true } }, obligation: { select: { label: true } } }, orderBy: { dueDate: "asc" }, take: 100 }),
    prisma.maintenance.findMany({ where: { workspaceId: workspace.id, property: { status: "active" }, status: { notIn: ["COMPLETED", "CANCELLED", "RESOLVED"] } }, select: { id: true, propertyId: true, task: true, status: true, dateReported: true }, orderBy: { dateReported: "desc" }, take: 50 }),
    prisma.shareLink.findMany({ where: { workspaceId: workspace.id, revokedAt: null }, select: { id: true, propertyId: true, role: true, expiresAt: true, acceptedAt: true }, orderBy: { expiresAt: "asc" } }),
    prisma.timelineEvent.findMany({ where: { workspaceId: workspace.id, property: { status: "active" } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 8, select: { id: true, propertyId: true, date: true, title: true, detail: true, kind: true } }),
    prisma.assessmentSnapshot.findMany({ where: { workspaceId: workspace.id, property: { status: "active" } }, orderBy: { evaluatedAt: "desc" }, select: { propertyId: true, assessment: true, score: true, evaluatedAt: true } }),
  ]);
  // Batched owner-only record counts. No per-property queries or copied records.
  const activeWhere = { workspaceId: workspace.id, property: { status: "active" } };
  const [billCounts, maintenanceCounts, timelineCounts, reminderCounts, people, projects, savedReminders] = await Promise.all([
    prisma.bill.groupBy({ by: ["propertyId"], where: activeWhere, _count: true }),
    prisma.maintenance.groupBy({ by: ["propertyId"], where: activeWhere, _count: true }),
    prisma.timelineEvent.groupBy({ by: ["propertyId"], where: activeWhere, _count: true }),
    prisma.reminder.groupBy({ by: ["propertyId"], where: { ...activeWhere, done: false }, _count: true }),
    prisma.shareLink.findMany({ where: { ...activeWhere, revokedAt: null, acceptedAt: { not: null }, expiresAt: { gt: new Date().toISOString() } }, select: { id: true, propertyId: true, role: true, inviteeEmail: true } }),
    prisma.constructionProject.findMany({where:{...activeWhere,archivedAt:null,status:{notIn:["COMPLETED","CANCELLED"]}},select:{id:true,propertyId:true,name:true,status:true}}),
    prisma.reminder.findMany({where:{...activeWhere,done:false},orderBy:{dueDate:"asc"},select:{id:true,propertyId:true,title:true,dueDate:true}}),
  ]);
  const nextOccurrences = occurrences.filter((o,i,all)=>all.findIndex(candidate=>candidate.obligationId===o.obligationId)===i);
  const pending = occurrences.map((occurrence) => ({ ...occurrence, remaining: Math.max(0, Number(occurrence.amountPaise ?? 0n) - Number(occurrence.payments.reduce((sum, payment) => sum + payment.amountPaise, 0n))) })).filter((occurrence) => occurrence.remaining > 0);
  const assessmentByProperty = new Map<string, typeof assessments[number]>();
  for (const assessment of assessments) if (!assessmentByProperty.has(assessment.propertyId)) assessmentByProperty.set(assessment.propertyId, assessment);
  const propertyDtos = properties.map((property) => { const assessment = assessmentByProperty.get(property.id); return { id: property.id, name: property.name, type: property.type, city: property.city, area: property.area, address: property.address, purchaseValue: property.purchaseValuePaise === null ? null : rupees(property.purchaseValuePaise), readiness: assessment ? { assessment: assessment.assessment, score: assessment.score, evaluatedAt: assessment.evaluatedAt.toISOString() } : { assessment: "NOT_ASSESSED", score: null, evaluatedAt: null }, records: {
    documents: docs.filter(d => d.propertyId === property.id).length,
    bills: billCounts.find(c => c.propertyId === property.id)?._count ?? 0,
    maintenance: maintenanceCounts.find(c => c.propertyId === property.id)?._count ?? 0,
    openMaintenance: maintenance.filter(m => m.propertyId === property.id).length,
    timeline: timelineCounts.find(c => c.propertyId === property.id)?._count ?? 0,
    reminders: reminderCounts.find(c => c.propertyId === property.id)?._count ?? 0,
  }, savedReminders:savedReminders.filter(r=>r.propertyId===property.id), projects:projects.filter(p=>p.propertyId===property.id), people: people.filter(s => s.propertyId === property.id), upcoming: nextOccurrences.filter(o => o.propertyId === property.id).map(o => ({ id: o.id, title: o.obligation.label, dueDate: o.dueDate, amountPaise: o.amountPaise === null ? null : String(Math.max(0, Number(o.amountPaise) - Number(o.payments.reduce((n,p) => n+p.amountPaise,0n)))) })).filter(o => o.amountPaise === null || Number(o.amountPaise)>0).slice(0,4) }; });
  const attention = [
    ...reminders.map((item) => ({ id: item.id, type: "reminder", title: item.title, detail: item.body, propertyId: item.propertyId, href: item.deepLink, date: item.scheduledAt.toISOString() })),
    ...pending.filter((item,index,all)=>all.findIndex(o=>o.obligationId===item.obligationId)===index).map((item) => ({ id: item.id, type: "obligation", title: `${item.obligation.label} remains open`, amountPaise: String(item.remaining), detail: `₹${(item.remaining / 100).toFixed(2)} recorded outstanding; due ${item.dueDate}.`, propertyId: item.propertyId, href: `/property/${item.propertyId}?tab=bills&occurrence=${item.id}`, date: item.dueDate })),
    ...occurrences.filter(o=>o.amountPaise===null).map(item=>({id:item.id,type:"reminder",title:item.obligation.label,detail:"Reminder only · no payable amount entered",propertyId:item.propertyId,href:`/property/${item.propertyId}?tab=bills&occurrence=${item.id}`,date:item.dueDate})),
    ...docs.filter((doc) => doc.reviewStatus !== "confirmed" && doc.scanStatus === "clean").slice(0, 10).map((doc) => ({ id: doc.id, type: "document", title: `${doc.displayName || doc.name} needs review`, detail: "Confirm the source record before it contributes to readiness.", propertyId: doc.propertyId, href: `/property/${doc.propertyId}?tab=vault&document=${doc.id}`, date: new Date().toISOString() })),
    ...maintenance.map((item) => ({ id: item.id, type: "maintenance", title: item.task, detail: `Maintenance is ${item.status.toLowerCase()}.`, propertyId: item.propertyId, href: `/property/${item.propertyId}?tab=maint`, date: item.dateReported })),
    ...shares.filter((share) => share.acceptedAt && new Date(share.expiresAt).getTime() <= Date.now() + 30 * 86400000).map((share) => ({ id: share.id, type: "share", title: `${share.role} access expires soon`, detail: `Shared access ends ${share.expiresAt}.`, propertyId: share.propertyId, href: `/property/${share.propertyId}?tab=share`, date: share.expiresAt })),
  ];
  const outstanding = pending.filter((item, index, all) => all.findIndex((occurrence) => occurrence.obligationId === item.obligationId) === index);
  let lives = null;
  let defaultLifeId: string | null = null;
  try {
    const projected = await loadOwnerHomeLives(userId, workspace.id, {
      properties: properties.map((property) => ({ id: property.id, name: property.name, city: property.city, area: property.area, photoUrl: property.photoUrl })),
      obligations: outstanding.map((item) => ({ id: item.id, propertyId: item.propertyId, label: item.obligation.label, remainingPaise: String(item.remaining), dueDate: item.dueDate })),
      maintenance: maintenance.map((item) => ({ id: item.id, propertyId: item.propertyId, task: item.task, status: item.status, dateReported: item.dateReported })),
      reminders: reminders.map((item) => ({ id: item.id, propertyId: item.propertyId, title: item.title, scheduledAt: item.scheduledAt.toISOString(), href: item.deepLink })),
      documents: docs.flatMap((doc) => doc.propertyId ? [{ id: doc.id, propertyId: doc.propertyId, title: doc.displayName || doc.name, scanStatus: doc.scanStatus, reviewStatus: doc.reviewStatus }] : []),
    });
    lives = projected.lives;
    defaultLifeId = projected.defaultLifeId;
  } catch {
    lives = null;
    defaultLifeId = null;
  }
  return withHomeLives({ mode: "owner" as const, properties: propertyDtos, summary: { propertyCount: properties.length, portfolioValuePaise: properties.reduce((sum, property) => sum + (property.purchaseValuePaise ?? 0n), 0n).toString(), outstandingPaise: String(pending.reduce((sum, item) => sum + item.remaining, 0)), unreadAttention: attention.length, openMaintenance: maintenance.length, pendingDocumentReview: docs.filter((doc) => doc.reviewStatus !== "confirmed").length }, attention, activity: timeline, education: { currentCount: (await listPublishedEducation()).length }, scope: "Owner projection from current workspace records." }, lives, defaultLifeId);
}

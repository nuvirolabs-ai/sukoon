import { prisma } from "@/lib/prisma";
import { getWorkspaceForUser } from "@/lib/repository";
import { getActiveSharesForUser, shareScopeAllows } from "@/lib/authz";
import { listPublishedEducation } from "@/lib/education";

// Separate, paged history keeps the mixed current feed useful without dropping
// older lifecycle records. Shared access uses the existing timeline capability.
export async function getUpdatesHistoryForUser(userId: string, page: number) {
  const workspace = await getWorkspaceForUser(userId);
  const grants = workspace ? [] : await getActiveSharesForUser(userId);
  const where = workspace ? { workspaceId: workspace.id } : { OR: grants.filter(g=>shareScopeAllows(g,"TIMELINE_READ")).map(g=>({workspaceId:g.workspaceId,propertyId:g.propertyId})) };
  const [rows,total] = await Promise.all([
    prisma.timelineEvent.findMany({where,orderBy:[{date:"desc"},{createdAt:"desc"},{id:"desc"}],skip:page*25,take:26,select:{id:true,propertyId:true,date:true,title:true,detail:true,kind:true}}),
    prisma.timelineEvent.count({where}),
  ]);
  return {total,nextPage:rows.length>25?page+1:null,items:rows.slice(0,25).map(item=>({...item,type:"timeline",href:workspace?`/property/${item.propertyId}?tab=timeline`:`/shared/${item.propertyId}`}))};
}

export async function getUpdatesForUser(userId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) {
    const grants = await getActiveSharesForUser(userId);
    const timeline = (await Promise.all(grants.filter((grant) => shareScopeAllows(grant, "TIMELINE_READ")).map((grant) => prisma.timelineEvent.findMany({ where: { workspaceId: grant.workspaceId, propertyId: grant.propertyId }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 10, select: { id: true, propertyId: true, date: true, title: true, detail: true, kind: true } })))).flat().map((item) => ({ id: item.id, type: "shared_timeline", title: item.title, detail: item.detail, date: item.date, href: `/shared/${item.propertyId}` }));
    return { mode: "shared" as const, items: timeline, education: await listPublishedEducation(), scope: "Shared timeline records and current published education only." };
  }
  const [reminders, timeline, maintenance, maintenanceRecords, docs, shares, education] = await Promise.all([
    prisma.durableReminder.findMany({ where: { workspaceId: workspace.id, state: { notIn: ["CANCELLED"] } }, orderBy: { scheduledAt: "desc" }, take: 20, select: { id: true, propertyId: true, title: true, body: true, scheduledAt: true, deepLink: true, readAt: true } }),
    prisma.timelineEvent.findMany({ where: { workspaceId: workspace.id }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 20, select: { id: true, propertyId: true, date: true, title: true, detail: true, kind: true } }),
    prisma.maintenanceEvent.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, propertyId: true, maintenanceId: true, eventType: true, toStatus: true, createdAt: true } }),
    prisma.maintenance.findMany({ where: { workspaceId: workspace.id }, orderBy: { updatedAt: "desc" }, take: 20, select: { id: true, propertyId: true, task: true, status: true, updatedAt: true } }),
    prisma.propertyDoc.findMany({ where: { workspaceId: workspace.id, archivedAt: null, deletedAt: null, reviewStatus: { not: "confirmed" } }, orderBy: { updatedAt: "desc" }, take: 20, select: { id: true, propertyId: true, name: true, displayName: true, updatedAt: true } }),
    prisma.shareLink.findMany({ where: { workspaceId: workspace.id, revokedAt: null }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, propertyId: true, role: true, createdAt: true } }),
    listPublishedEducation(),
  ]);
  const items = [
    ...reminders.map((item) => ({ id: item.id, type: "reminder", title: item.title, detail: item.body, date: item.scheduledAt.toISOString(), href: item.deepLink, read: Boolean(item.readAt) })),
    ...timeline.map((item) => ({ id: item.id, type: "timeline", title: item.title, detail: item.detail, date: item.date, href: `/property/${item.propertyId}?tab=timeline`, read: true })),
    ...maintenance.map((item) => ({ id: item.id, type: "maintenance", title: `Maintenance ${item.eventType.toLowerCase()}`, detail: item.toStatus ?? "Lifecycle event recorded.", date: item.createdAt.toISOString(), href: `/property/${item.propertyId}?tab=maint`, read: true })),
    ...maintenanceRecords.map((item) => ({ id: item.id, type: "maintenance", title: item.task, detail: `Maintenance is ${item.status.toLowerCase()}.`, date: item.updatedAt.toISOString(), href: `/property/${item.propertyId}?tab=maint`, read: true })),
    ...docs.map((item) => ({ id: item.id, type: "document_review", title: `${item.displayName || item.name} needs review`, detail: "A source record is awaiting confirmation.", date: item.updatedAt.toISOString(), href: `/property/${item.propertyId}?tab=vault&document=${item.id}`, read: false })),
    ...shares.map((item) => ({ id: item.id, type: "share", title: `${item.role} sharing activity`, detail: "An identity-bound property share is active.", date: item.createdAt.toISOString(), href: `/property/${item.propertyId}?tab=share`, read: true })),
  ].sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 50);
  return { mode: "owner" as const, items, education, scope: "Current workspace reminders, lifecycle records, and published education." };
}

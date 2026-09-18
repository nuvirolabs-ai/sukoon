import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { emptyState } from "@/lib/store";
import { normalizeState } from "@/lib/server-store";
import { paiseToRupees, rupeesToPaise } from "@/lib/money";
import type { AppState, Bill, ConstructionProject, Listing, Maintenance, Property, PropertyDoc, Reminder, ShareLink, Tenant, Booking, TimelineEvent } from "@/lib/types";

type Db = PrismaClient | Prisma.TransactionClient;

export type DurableState = { state: AppState; version: number; workspaceId: string | null };

export class StateVersionConflict extends Error {
  constructor() {
    super("This workspace changed in another request. Reload before saving again.");
    this.name = "StateVersionConflict";
  }
}

export class StateOwnershipError extends Error {
  constructor() {
    super("The requested state contains a resource outside this workspace.");
    this.name = "StateOwnershipError";
  }
}

function money(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return rupeesToPaise(value);
}

function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (!value || typeof value !== "object") return undefined;
  return value as Prisma.InputJsonValue;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function findOrCreateWorkspace(db: Db, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === "operator") throw new StateOwnershipError();
  const existing = await db.workspace.findUnique({ where: { ownerUserId: userId } });
  if (existing) return existing;
  return db.workspace.create({
    data: { id: randomUUID(), ownerUserId: userId, name: "My Sukoon workspace" },
  });
}

export async function ensureWorkspace(userId: string) {
  return findOrCreateWorkspace(prisma, userId);
}

export async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { ownerUserId: userId, owner: { role: "owner" } } });
}

export function mapProperty(row: Prisma.PropertyModel): Property {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Property["type"],
    city: row.city,
    area: row.area,
    address: row.address,
    jurisdiction: row.jurisdiction || undefined,
    areaValue: row.areaValue ?? undefined,
    areaUnit: row.areaUnit as Property["areaUnit"],
    areaType: row.areaType as Property["areaType"],
    ownershipAssertion: "self_asserted",
    ownershipProvenance: row.ownershipProvenance || undefined,
    identifiers: Array.isArray(row.identifiers) ? row.identifiers as unknown as Property["identifiers"] : undefined,
    carpetAreaSqft: row.carpetAreaSqft ?? undefined,
    plotSizeSqft: row.plotSizeSqft ?? undefined,
    ownerName: row.ownerName,
    purchaseDate: row.purchaseDate ?? undefined,
    purchaseValue: paiseToRupees(row.purchaseValuePaise),
    loanActive: row.loanActive,
    loanBalance: paiseToRupees(row.loanBalancePaise),
    insuranceUntil: row.insuranceUntil ?? undefined,
    createdAt: row.createdAt.toISOString(),
    occupancy: row.occupancy as Property["occupancy"],
    photoUrl: row.photoUrl ?? undefined,
    coOwners: row.coOwners ?? undefined,
    rentAmount: paiseToRupees(row.rentAmountPaise),
    status: row.status as Property["status"],
    version: row.version,
  };
}

function mapDoc(row: Prisma.PropertyDocModel): PropertyDoc {
  if (!row.propertyId) throw new StateOwnershipError();
  return {
    id: row.id,
    propertyId: row.propertyId,
    type: row.type as PropertyDoc["type"],
    name: row.displayName || row.name,
    originalFilename: row.originalFilename || row.name,
    displayName: row.displayName || row.name,
    subtype: row.subtype ?? undefined,
    uploadDate: row.uploadDate,
    uploadedBy: row.uploadedBy ?? undefined,
    uploadedAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sizeKb: Math.ceil(row.sizeBytes / 1024),
    sizeBytes: row.sizeBytes,
    sha256: row.sha256 || undefined,
    storageKey: row.storageKey,
    mimeType: row.mimeType as PropertyDoc["mimeType"],
    processingState: row.processingState as PropertyDoc["processingState"],
    scanStatus: row.scanStatus as PropertyDoc["scanStatus"],
    reviewStatus: row.reviewStatus as PropertyDoc["reviewStatus"],
    provenance: row.provenance,
    archivedAt: row.archivedAt?.toISOString(),
    deletedAt: row.deletedAt?.toISOString(),
    version: row.version,
    verified: row.verified,
    notes: row.notes ?? undefined,
    extracted: row.extracted && typeof row.extracted === "object" ? row.extracted as Record<string, string> : undefined,
  };
}

function mapBill(row: Prisma.BillModel): Bill {
  return { id: row.id, propertyId: row.propertyId, type: row.type as Bill["type"], title: row.title, amount: paiseToRupees(row.amountPaise) ?? 0, dueDate: row.dueDate, paidDate: row.paidDate ?? undefined, status: row.status as Bill["status"], receiptDocId: row.receiptDocId ?? undefined, recurring: row.recurring as Bill["recurring"], notes: row.notes ?? undefined };
}

function mapMaintenance(row: Prisma.MaintenanceModel): Maintenance {
  return { id: row.id, propertyId: row.propertyId, task: row.task, dateReported: row.dateReported, provider: row.provider ?? undefined, quote: paiseToRupees(row.quotePaise), finalCost: paiseToRupees(row.finalCostPaise), status: row.status as Maintenance["status"], warrantyUntil: row.warrantyUntil ?? undefined, notes: row.notes ?? undefined };
}

function mapTimeline(row: Prisma.TimelineEventModel): TimelineEvent {
  return { id: row.id, propertyId: row.propertyId, date: row.date, title: row.title, detail: row.detail ?? undefined, kind: row.kind as TimelineEvent["kind"] };
}

function mapShare(row: Prisma.ShareLinkModel & { scopes?: Prisma.ShareLinkScopeModel[] }): ShareLink {
  // The raw bearer token is intentionally not persisted. This stable label
  // keeps the existing local preview UI honest: it is not a secure share URL.
  return { id: row.id, propertyId: row.propertyId, role: row.role as ShareLink["role"], token: `local-${row.id.slice(0, 8)}`, expiresAt: row.expiresAt, scopes: row.scopes?.some((scope) => scope.scopeType === "all") ? ["all"] : (row.scopes?.map((scope) => scope.docType).filter(Boolean) as ShareLink["scopes"]) || [], note: row.note ?? undefined };
}

function mapTenant(row: Prisma.TenantModel): Tenant {
  return { id: row.id, propertyId: row.propertyId, name: row.name, phone: row.phone ?? undefined, rentAmount: paiseToRupees(row.rentAmountPaise) ?? 0, deposit: paiseToRupees(row.depositPaise), startDate: row.startDate, endDate: row.endDate, status: row.status as Tenant["status"], agreementDocId: row.agreementDocId ?? undefined };
}

function mapBooking(row: Prisma.BookingModel): Booking {
  return { id: row.id, propertyId: row.propertyId, category: row.category as Booking["category"], vendor: row.vendor ?? undefined, date: row.date, status: row.status as Booking["status"], cost: paiseToRupees(row.costPaise), rating: row.rating ?? undefined };
}

function mapReminder(row: Prisma.ReminderModel): Reminder {
  return { id: row.id, propertyId: row.propertyId, kind: row.kind as Reminder["kind"], title: row.title, dueDate: row.dueDate, done: row.done };
}

function mapListing(row: Prisma.ListingModel): Listing {
  return { id: row.id, propertyId: row.propertyId ?? undefined, title: row.title, city: row.city, type: row.type as Listing["type"], price: paiseToRupees(row.pricePaise) ?? 0, carpetAreaSqft: row.carpetAreaSqft ?? undefined, verified: row.verified, healthScore: row.healthScore ?? undefined, contactMasked: row.contactMasked, description: row.description, createdAt: row.createdAt.toISOString(), mine: true };
}

function mapProject(row: Prisma.ConstructionProjectModel): ConstructionProject {
  return { id: row.id, propertyId: row.propertyId ?? undefined, name: row.name, plotSizeSqft: row.plotSizeSqft, spec: row.spec, budget: paiseToRupees(row.budgetPaise) ?? 0, currentStage: row.currentStage, stageStatus: row.stageStatus as Record<number, "pending" | "active" | "done">, startDate: row.startDate, notes: row.notes ?? undefined };
}

export async function readStateForUser(userId: string): Promise<DurableState> {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return { state: emptyState(), version: 0, workspaceId: null };
  const [properties, docs, bills, maintenance, timeline, shares, tenants, bookings, reminders, listings, projects] = await Promise.all([
    prisma.property.findMany({ where: { workspaceId: workspace.id, status: "active" }, orderBy: { createdAt: "asc" } }),
    prisma.propertyDoc.findMany({ where: { workspaceId: workspace.id, propertyId: { not: null } }, orderBy: { createdAt: "asc" } }),
    prisma.bill.findMany({ where: { workspaceId: workspace.id }, orderBy: { dueDate: "asc" } }),
    prisma.maintenance.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } }),
    prisma.timelineEvent.findMany({ where: { workspaceId: workspace.id }, orderBy: { date: "asc" } }),
    prisma.shareLink.findMany({ where: { workspaceId: workspace.id }, include: { scopes: true }, orderBy: { createdAt: "asc" } }),
    prisma.tenant.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } }),
    prisma.booking.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } }),
    prisma.reminder.findMany({ where: { workspaceId: workspace.id }, orderBy: { dueDate: "asc" } }),
    prisma.listing.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } }),
    prisma.constructionProject.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } }),
  ]);
  const state: AppState = {
    ...emptyState(),
    properties: properties.map(mapProperty),
    docs: docs.map(mapDoc),
    bills: bills.map(mapBill),
    maintenance: maintenance.map(mapMaintenance),
    timeline: timeline.map(mapTimeline),
    shares: shares.map(mapShare),
    tenants: tenants.map(mapTenant),
    bookings: bookings.map(mapBooking),
    reminders: reminders.map(mapReminder),
    listings: listings.map(mapListing),
    projects: projects.map(mapProject),
    lang: workspace.lang === "hi" ? "hi" : "en",
    referralCode: workspace.referralCode.slice(0, 64),
  };
  return { state, version: workspace.version, workspaceId: workspace.id };
}

function propertyData(item: Property) {
  return { name: item.name, type: item.type, city: item.city, area: item.area, address: item.address, jurisdiction: item.jurisdiction ?? "", areaValue: item.areaValue ?? null, areaUnit: item.areaUnit ?? null, areaType: item.areaType ?? null, ownershipAssertion: "self_asserted", ownershipProvenance: item.ownershipProvenance ?? "", identifiers: asJson(item.identifiers) ?? undefined, carpetAreaSqft: item.carpetAreaSqft ?? null, plotSizeSqft: item.plotSizeSqft ?? null, ownerName: item.ownerName, purchaseDate: item.purchaseDate ?? null, purchaseValuePaise: money(item.purchaseValue), loanActive: Boolean(item.loanActive), loanBalancePaise: money(item.loanBalance), insuranceUntil: item.insuranceUntil ?? null, occupancy: item.occupancy ?? null, photoUrl: item.photoUrl ?? null, coOwners: item.coOwners ?? null, rentAmountPaise: money(item.rentAmount), status: "active" };
}

async function propertyExists(tx: Prisma.TransactionClient, workspaceId: string, propertyId: string) {
  return Boolean(await tx.property.findFirst({ where: { id: propertyId, workspaceId, status: "active" }, select: { id: true } }));
}

export async function replaceStateForUser(userId: string, incoming: unknown, expectedVersion: number) {
  const state = normalizeState(incoming);
  await prisma.$transaction(async (tx) => {
    const workspace = await findOrCreateWorkspace(tx, userId);
    const claimed = await tx.workspace.updateMany({ where: { id: workspace.id, ownerUserId: userId, version: expectedVersion }, data: { version: { increment: 1 }, lang: state.lang, referralCode: state.referralCode } });
    if (claimed.count !== 1) throw new StateVersionConflict();

    const propertyIds = state.properties.map((item) => item.id);
    for (const item of state.properties) {
      const current = await tx.property.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      if (current) await tx.property.update({ where: { id: current.id }, data: propertyData(item) });
      else {
        const foreign = await tx.property.findUnique({ where: { id: item.id }, select: { workspaceId: true } });
        if (foreign) throw new StateOwnershipError();
        await tx.property.create({ data: { id: item.id, workspaceId: workspace.id, ...propertyData(item) } });
      }
    }
    await tx.property.updateMany({ where: { workspaceId: workspace.id, id: { notIn: propertyIds } }, data: { status: "archived" } });

    const validDocs = state.docs.filter((item) => propertyIds.includes(item.propertyId) && item.storageKey);
    for (const item of validDocs) {
      if (!(await propertyExists(tx, workspace.id, item.propertyId))) continue;
      const current = await tx.propertyDoc.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      if (current?.purchaseCandidateId) throw new StateOwnershipError();
      const data = { propertyId: item.propertyId, type: item.type, name: item.name, uploadDate: item.uploadDate, sizeBytes: Math.max(1, Math.round((item.sizeKb ?? 1) * 1024)), storageKey: item.storageKey as string, mimeType: item.mimeType ?? "application/octet-stream", processingState: item.processingState ?? "awaiting_review", verified: Boolean(item.verified), notes: item.notes ?? null, extracted: asJson(item.extracted) ?? undefined };
      if (current) await tx.propertyDoc.update({ where: { id: current.id }, data });
      else await tx.propertyDoc.create({ data: { id: item.id, workspaceId: workspace.id, ...data } });
    }
    await tx.propertyDoc.deleteMany({ where: { workspaceId: workspace.id, purchaseCandidateId: null, id: { notIn: validDocs.map((item) => item.id) } } });

    const bills = state.bills.filter((item) => propertyIds.includes(item.propertyId));
    for (const item of bills) {
      if (!(await propertyExists(tx, workspace.id, item.propertyId))) continue;
      const current = await tx.bill.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      const data = { propertyId: item.propertyId, type: item.type, title: item.title, amountPaise: money(item.amount) ?? BigInt(0), dueDate: item.dueDate, paidDate: item.paidDate ?? null, status: item.status, receiptDocId: item.receiptDocId ?? null, recurring: item.recurring ?? null, notes: item.notes ?? null };
      if (current) await tx.bill.update({ where: { id: current.id }, data }); else await tx.bill.create({ data: { id: item.id, workspaceId: workspace.id, ...data } });
    }
    await tx.bill.deleteMany({ where: { workspaceId: workspace.id, id: { notIn: bills.map((item) => item.id) } } });

    const maintenance = state.maintenance.filter((item) => propertyIds.includes(item.propertyId));
    for (const item of maintenance) {
      if (!(await propertyExists(tx, workspace.id, item.propertyId))) continue;
      const current = await tx.maintenance.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      const data = { propertyId: item.propertyId, task: item.task, dateReported: item.dateReported, provider: item.provider ?? null, quotePaise: money(item.quote), finalCostPaise: money(item.finalCost), status: item.status, warrantyUntil: item.warrantyUntil ?? null, notes: item.notes ?? null };
      if (current) await tx.maintenance.update({ where: { id: current.id }, data }); else await tx.maintenance.create({ data: { id: item.id, workspaceId: workspace.id, ...data } });
    }
    await tx.maintenance.deleteMany({ where: { workspaceId: workspace.id, id: { notIn: maintenance.map((item) => item.id) } } });

    const timeline = state.timeline.filter((item) => propertyIds.includes(item.propertyId));
    for (const item of timeline) {
      if (item.id.startsWith("construction:") || item.kind === "construction") continue;
      if (!(await propertyExists(tx, workspace.id, item.propertyId))) continue;
      const current = await tx.timelineEvent.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      const data = { propertyId: item.propertyId, date: item.date, title: item.title, detail: item.detail ?? null, kind: item.kind };
      if (current) await tx.timelineEvent.update({ where: { id: current.id }, data }); else await tx.timelineEvent.create({ data: { id: item.id, workspaceId: workspace.id, ...data } });
    }
    await tx.timelineEvent.deleteMany({ where: { workspaceId: workspace.id, NOT: { id: { startsWith: "construction:" } }, id: { notIn: timeline.map((item) => item.id) } } });

    const shares = state.shares.filter((item) => propertyIds.includes(item.propertyId));
    for (const item of shares) {
      if (!(await propertyExists(tx, workspace.id, item.propertyId))) continue;
      const current = await tx.shareLink.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      // Accepted/pending identity invitations belong to the S18 capability API.
      if (current?.inviteeEmail) continue;
      const data = { propertyId: item.propertyId, grantorId: userId, role: item.role, tokenHash: hashToken(item.token), expiresAt: item.expiresAt, note: item.note ?? null };
      if (current) {
        await tx.shareLink.update({ where: { id: current.id }, data });
        await tx.shareLinkScope.deleteMany({ where: { shareLinkId: current.id } });
        await tx.shareLinkScope.createMany({ data: item.scopes[0] === "all" ? [{ id: randomUUID(), shareLinkId: current.id, scopeType: "all" }] : item.scopes.map((docType) => ({ id: randomUUID(), shareLinkId: current.id, scopeType: "doc_type", docType })) });
      } else await tx.shareLink.create({ data: { id: item.id, workspaceId: workspace.id, ...data, scopes: { create: item.scopes[0] === "all" ? [{ id: randomUUID(), scopeType: "all" }] : item.scopes.map((docType) => ({ id: randomUUID(), scopeType: "doc_type", docType })) } } });
    }
    await tx.shareLink.deleteMany({ where: { workspaceId: workspace.id, inviteeEmail: "", id: { notIn: shares.map((item) => item.id) } } });

    const tenants = state.tenants.filter((item) => propertyIds.includes(item.propertyId));
    for (const item of tenants) {
      if (!(await propertyExists(tx, workspace.id, item.propertyId))) continue;
      const current = await tx.tenant.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      const data = { propertyId: item.propertyId, name: item.name, phone: item.phone ?? null, rentAmountPaise: money(item.rentAmount) ?? BigInt(0), depositPaise: money(item.deposit), startDate: item.startDate, endDate: item.endDate, status: item.status, agreementDocId: item.agreementDocId ?? null };
      if (current) await tx.tenant.update({ where: { id: current.id }, data }); else await tx.tenant.create({ data: { id: item.id, workspaceId: workspace.id, ...data } });
    }
    await tx.tenant.deleteMany({ where: { workspaceId: workspace.id, id: { notIn: tenants.map((item) => item.id) } } });

    const bookings = state.bookings.filter((item) => propertyIds.includes(item.propertyId));
    for (const item of bookings) {
      if (!(await propertyExists(tx, workspace.id, item.propertyId))) continue;
      const current = await tx.booking.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      const data = { propertyId: item.propertyId, category: item.category, vendor: item.vendor ?? null, date: item.date, status: item.status, costPaise: money(item.cost), rating: item.rating ?? null };
      if (current) await tx.booking.update({ where: { id: current.id }, data }); else await tx.booking.create({ data: { id: item.id, workspaceId: workspace.id, ...data } });
    }
    await tx.booking.deleteMany({ where: { workspaceId: workspace.id, id: { notIn: bookings.map((item) => item.id) } } });

    const reminders = state.reminders.filter((item) => propertyIds.includes(item.propertyId));
    for (const item of reminders) {
      if (!(await propertyExists(tx, workspace.id, item.propertyId))) continue;
      const current = await tx.reminder.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      const data = { propertyId: item.propertyId, kind: item.kind, title: item.title, dueDate: item.dueDate, done: Boolean(item.done) };
      if (current) await tx.reminder.update({ where: { id: current.id }, data }); else await tx.reminder.create({ data: { id: item.id, workspaceId: workspace.id, ...data } });
    }
    await tx.reminder.deleteMany({ where: { workspaceId: workspace.id, id: { notIn: reminders.map((item) => item.id) } } });

    for (const item of state.listings) {
      const current = await tx.listing.findFirst({ where: { id: item.id, workspaceId: workspace.id } });
      const data = { propertyId: item.propertyId ?? null, title: item.title, city: item.city, type: item.type, pricePaise: money(item.price) ?? BigInt(0), carpetAreaSqft: item.carpetAreaSqft ?? null, verified: Boolean(item.verified), healthScore: item.healthScore ?? null, contactMasked: item.contactMasked, description: item.description };
      if (current) await tx.listing.update({ where: { id: current.id }, data }); else await tx.listing.create({ data: { id: item.id, workspaceId: workspace.id, ...data } });
    }
    await tx.listing.deleteMany({ where: { workspaceId: workspace.id, id: { notIn: state.listings.map((item) => item.id) } } });

    // Construction owns versioned mutations and append-only events. Legacy
    // whole-state clients may read a compatibility projection, never replace it.

    return { version: expectedVersion + 1, workspaceId: workspace.id };
  }, { timeout: 15000 });
  return readStateForUser(userId);
}

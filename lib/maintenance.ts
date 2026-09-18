import { randomUUID } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { getWorkspaceForUser } from "@/lib/repository";
import { prisma } from "@/lib/prisma";
import { rupeesToPaise } from "@/lib/money";

export const MAINTENANCE_CATEGORIES = ["Plumbing", "Electrical", "Waterproofing", "Painting", "Structural", "Pest Control", "Appliance", "Society", "Common Area", "Renovation", "Other"] as const;
export const MAINTENANCE_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const MAINTENANCE_STATUSES = ["OPEN", "PLANNED", "IN_PROGRESS", "RESOLVED", "CANCELLED"] as const;
export const MAINTENANCE_DOCUMENT_LINK_TYPES = ["INVOICE", "WARRANTY", "QUOTATION", "COMPLETION", "PHOTO"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];
export type MaintenanceDocumentLinkType = (typeof MAINTENANCE_DOCUMENT_LINK_TYPES)[number];

const transitions: Record<MaintenanceStatus, readonly MaintenanceStatus[]> = {
  OPEN: ["PLANNED", "IN_PROGRESS", "CANCELLED"],
  PLANNED: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["OPEN", "RESOLVED", "CANCELLED"],
  RESOLVED: ["OPEN"],
  CANCELLED: ["OPEN"],
};

export class MaintenanceInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "MaintenanceInputError";
    this.code = code;
    this.status = status;
  }
}

function text(value: unknown, label: string, required = false, max = 2_000) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new MaintenanceInputError("MAINTENANCE_INPUT_INVALID", `${label} is required.`);
    return null;
  }
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > max) throw new MaintenanceInputError("MAINTENANCE_INPUT_INVALID", `${label} is invalid.`);
  return value.trim();
}

function dateOnly(value: unknown, label: string, fallback?: string) {
  const result = text(value ?? fallback, label, true, 10) as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new MaintenanceInputError("MAINTENANCE_DATE_INVALID", `${label} must be YYYY-MM-DD.`);
  const parsed = new Date(`${result}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw new MaintenanceInputError("MAINTENANCE_DATE_INVALID", `${label} is not a real calendar date.`);
  return result;
}

function money(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  try {
    if (typeof value === "bigint") return value;
    const amount = rupeesToPaise(value as string | number);
    if (amount === null || amount < 0n) throw new Error("negative");
    return amount;
  } catch { throw new MaintenanceInputError("MAINTENANCE_AMOUNT_INVALID", `${label} must be zero or a positive rupee value.`); }
}

function choice<T extends string>(value: unknown, values: readonly T[], label: string, fallback: T) {
  const result = value === undefined || value === null || value === "" ? fallback : value;
  if (typeof result !== "string" || !values.includes(result as T)) throw new MaintenanceInputError("MAINTENANCE_CHOICE_INVALID", `${label} is invalid.`);
  return result as T;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item)) as Prisma.InputJsonValue;
}

function today() { return new Date().toISOString().slice(0, 10); }

type MaintenanceInput = {
  title: string;
  category: string;
  description: string | null;
  dateReported: string;
  location: string | null;
  priority: string;
  estimatedAmount: bigint | null;
  finalAmount: bigint | null;
  provider: string | null;
  contactDetails: string | null;
  dateStarted: string | null;
  dateCompleted: string | null;
  warrantyExpiry: string | null;
  notes: string | null;
  status: MaintenanceStatus;
};

function parseInput(raw: unknown, existing?: { task: string; category: string; description: string | null; dateReported: string; location: string | null; priority: string; quotePaise: bigint | null; finalCostPaise: bigint | null; provider: string | null; contactDetails: string | null; dateStarted: string | null; dateCompleted: string | null; warrantyUntil: string | null; notes: string | null; status: string }) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new MaintenanceInputError("MAINTENANCE_INPUT_INVALID", "A maintenance record is required.");
  const source = raw as Record<string, unknown>;
  const current = existing;
  const status = choice(source.status ?? current?.status, MAINTENANCE_STATUSES, "Status", "OPEN");
  const dateReported = dateOnly(source.dateReported ?? current?.dateReported, "Reported date", today());
  const dateStartedValue = source.dateStarted === null ? null : source.dateStarted ?? current?.dateStarted;
  const dateCompletedValue = source.dateCompleted === null ? null : source.dateCompleted ?? current?.dateCompleted;
  const warrantyValue = source.warrantyExpiry === null ? null : source.warrantyExpiry ?? current?.warrantyUntil;
  return {
    title: text(source.title ?? source.task ?? current?.task, "Title", true, 180) as string,
    category: choice(source.category ?? current?.category, MAINTENANCE_CATEGORIES, "Category", "Other"),
    description: text(source.description ?? current?.description, "Description", false, 4_000),
    dateReported,
    location: text(source.location ?? current?.location, "Location", false, 300),
    priority: choice(source.priority ?? current?.priority, MAINTENANCE_PRIORITIES, "Priority", "NORMAL"),
    estimatedAmount: money(source.estimatedAmount ?? source.quote ?? source.quotePaise ?? current?.quotePaise, "Estimated amount"),
    finalAmount: money(source.finalAmount ?? source.finalCost ?? source.finalCostPaise ?? current?.finalCostPaise, "Final amount"),
    provider: text(source.provider ?? current?.provider, "Provider", false, 240),
    contactDetails: text(source.contactDetails ?? current?.contactDetails, "Provider contact", false, 500),
    dateStarted: dateStartedValue === null || dateStartedValue === undefined ? null : dateOnly(dateStartedValue, "Start date"),
    dateCompleted: dateCompletedValue === null || dateCompletedValue === undefined ? null : dateOnly(dateCompletedValue, "Completion date"),
    warrantyExpiry: warrantyValue === null || warrantyValue === undefined ? null : dateOnly(warrantyValue, "Warranty expiry"),
    notes: text(source.notes ?? current?.notes, "Notes", false, 4_000),
    status,
  } satisfies MaintenanceInput;
}

function amount(value: bigint | null) { return value === null ? null : Number(value) / 100; }

function mapMaintenance(row: {
  id: string; propertyId: string; task: string; category: string; description: string | null; dateReported: string; location: string | null; priority: string; quotePaise: bigint | null; finalCostPaise: bigint | null; provider: string | null; contactDetails: string | null; dateStarted: string | null; dateCompleted: string | null; warrantyUntil: string | null; notes: string | null; status: string; source: string; version: number; createdAt: Date; updatedAt: Date;
  documentLinks?: Array<{ id: string; documentId: string; documentVersionId: string | null; linkType: string; createdAt: Date; document: { id: string; type: string; name: string; displayName: string; version: number; sha256: string; scanStatus: string; archivedAt: Date | null; deletedAt: Date | null } }>;
  invoiceObligation?: { id: string; label: string; amountPaise: bigint | null; currency: string; active: boolean } | null;
}) {
  return {
    id: row.id, propertyId: row.propertyId, title: row.task, task: row.task, category: row.category, description: row.description,
    dateReported: row.dateReported, location: row.location, priority: row.priority, estimatedAmount: amount(row.quotePaise), finalAmount: amount(row.finalCostPaise),
    provider: row.provider, contactDetails: row.contactDetails, dateStarted: row.dateStarted, dateCompleted: row.dateCompleted, warrantyExpiry: row.warrantyUntil,
    notes: row.notes, status: row.status, source: row.source, version: row.version, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    invoiceObligation: row.invoiceObligation ? { id: row.invoiceObligation.id, label: row.invoiceObligation.label, amount: amount(row.invoiceObligation.amountPaise), currency: row.invoiceObligation.currency, active: row.invoiceObligation.active } : null,
    documentLinks: row.documentLinks?.map((link) => ({ id: link.id, documentId: link.documentId, documentVersionId: link.documentVersionId, linkType: link.linkType, createdAt: link.createdAt.toISOString(), document: { id: link.document.id, type: link.document.type, name: link.document.displayName || link.document.name, version: link.document.version, sha256: link.document.sha256, scanStatus: link.document.scanStatus } })) ?? [],
  };
}

async function ownerProperty(userId: string, propertyId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new MaintenanceInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" }, select: { id: true } });
  if (!property) throw new MaintenanceInputError("PROPERTY_NOT_FOUND", "Property not found.", 404);
  return workspace;
}

async function ownedMaintenance(userId: string, maintenanceId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new MaintenanceInputError("MAINTENANCE_NOT_FOUND", "Maintenance record not found.", 404);
  const row = await prisma.maintenance.findFirst({ where: { id: maintenanceId, workspaceId: workspace.id, property: { status: "active" } } });
  if (!row) throw new MaintenanceInputError("MAINTENANCE_NOT_FOUND", "Maintenance record not found.", 404);
  return { workspace, row };
}

async function readMaintenance(maintenanceId: string, workspaceId: string) {
  const row = await prisma.maintenance.findFirst({ where: { id: maintenanceId, workspaceId }, include: { invoiceObligation: { select: { id: true, label: true, amountPaise: true, currency: true, active: true } }, documentLinks: { orderBy: { createdAt: "asc" }, include: { document: { select: { id: true, type: true, name: true, displayName: true, version: true, sha256: true, scanStatus: true, archivedAt: true, deletedAt: true } } } } } });
  if (!row) throw new MaintenanceInputError("MAINTENANCE_NOT_FOUND", "Maintenance record not found.", 404);
  return mapMaintenance(row);
}

export async function listMaintenanceForUser(userId: string, propertyId: string, view = "all") {
  const workspace = await ownerProperty(userId, propertyId);
  if (!["open", "in_progress", "completed", "all"].includes(view)) throw new MaintenanceInputError("MAINTENANCE_VIEW_INVALID", "Maintenance view is invalid.");
  const status = view === "open" ? "OPEN" : view === "in_progress" ? "IN_PROGRESS" : view === "completed" ? "RESOLVED" : undefined;
  const rows = await prisma.maintenance.findMany({ where: { workspaceId: workspace.id, propertyId, ...(status ? { status } : {}) }, orderBy: [{ dateReported: "desc" }, { createdAt: "desc" }], include: { invoiceObligation: { select: { id: true, label: true, amountPaise: true, currency: true, active: true } }, documentLinks: { orderBy: { createdAt: "asc" }, include: { document: { select: { id: true, type: true, name: true, displayName: true, version: true, sha256: true, scanStatus: true, archivedAt: true, deletedAt: true } } } } } });
  const all = await prisma.maintenance.findMany({ where: { workspaceId: workspace.id, propertyId }, select: { status: true, finalCostPaise: true, warrantyUntil: true } });
  return { items: rows.map(mapMaintenance), summary: { openIssues: all.filter((item) => ["OPEN", "PLANNED", "IN_PROGRESS"].includes(item.status)).length, maintenanceSpend: amount(all.reduce((sum, item) => sum + (item.finalCostPaise ?? 0n), 0n)), upcomingWarranty: all.filter((item) => item.warrantyUntil && item.warrantyUntil >= today()).length } };
}

export async function getMaintenanceForUser(userId: string, maintenanceId: string) {
  const { workspace } = await ownedMaintenance(userId, maintenanceId);
  return readMaintenance(maintenanceId, workspace.id);
}

export async function createMaintenanceForUser(userId: string, propertyId: string, raw: unknown, idempotencyKey = "") {
  const workspace = await ownerProperty(userId, propertyId);
  const input = parseInput(raw);
  const key = idempotencyKey.trim().slice(0, 160) || null;
  if (key) {
    const duplicate = await prisma.maintenance.findUnique({ where: { idempotencyKey: key } });
    if (duplicate) {
      if (duplicate.workspaceId !== workspace.id || duplicate.propertyId !== propertyId) throw new MaintenanceInputError("IDEMPOTENCY_CONFLICT", "This idempotency key belongs to another record.", 409);
      return { maintenance: await readMaintenance(duplicate.id, workspace.id), duplicate: true };
    }
  }
  const id = randomUUID();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.maintenance.create({ data: { id, workspaceId: workspace.id, propertyId, task: input.title, category: input.category, description: input.description, dateReported: input.dateReported, location: input.location, priority: input.priority, quotePaise: input.estimatedAmount, finalCostPaise: input.finalAmount, provider: input.provider, contactDetails: input.contactDetails, dateStarted: input.dateStarted, dateCompleted: input.dateCompleted, warrantyUntil: input.warrantyExpiry, notes: input.notes, status: input.status, source: "OWNER_REPORTED", idempotencyKey: key } });
      await tx.maintenanceEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, maintenanceId: id, eventType: "CREATED", toStatus: input.status, detail: jsonValue({ source: "OWNER_REPORTED", title: input.title }), idempotencyKey: `maintenance:${id}:created` } });
      await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, date: input.dateReported, title: "Maintenance reported", detail: `${input.title} · ${input.category}`, kind: "maintenance" } });
    });
  } catch (error: unknown) {
    if (key && error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const duplicate = await prisma.maintenance.findUnique({ where: { idempotencyKey: key } });
      if (duplicate) return { maintenance: await readMaintenance(duplicate.id, workspace.id), duplicate: true };
    }
    throw error;
  }
  return { maintenance: await readMaintenance(id, workspace.id), duplicate: false };
}

export async function updateMaintenanceForUser(userId: string, maintenanceId: string, expectedVersion: number, raw: unknown, idempotencyKey = "") {
  const { workspace, row } = await ownedMaintenance(userId, maintenanceId);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) throw new MaintenanceInputError("MAINTENANCE_VERSION_INVALID", "Maintenance version is required.");
  const parsed = parseInput(raw, row);
  const input = { ...parsed, dateStarted: parsed.dateStarted ?? (parsed.status === "IN_PROGRESS" ? today() : row.dateStarted), dateCompleted: parsed.dateCompleted ?? (parsed.status === "RESOLVED" ? today() : row.dateCompleted) };
  const key = idempotencyKey.trim().slice(0, 160) || `maintenance:${maintenanceId}:v${expectedVersion}:${JSON.stringify(raw)}`;
  const priorEvent = await prisma.maintenanceEvent.findUnique({ where: { idempotencyKey: key } });
  if (priorEvent?.maintenanceId === maintenanceId) return { maintenance: await readMaintenance(maintenanceId, workspace.id), duplicate: true };
  if (row.version !== expectedVersion) throw new MaintenanceInputError("MAINTENANCE_VERSION_CONFLICT", "This maintenance record changed in another request. Reload before saving again.", 409);
  if (input.status !== row.status && !transitions[row.status as MaintenanceStatus]?.includes(input.status)) throw new MaintenanceInputError("MAINTENANCE_TRANSITION_INVALID", `Cannot move maintenance from ${row.status} to ${input.status}.`, 409);
  const eventType = input.status === row.status ? "UPDATED" : "STATUS_CHANGED";
  const changed = { status: input.status, title: input.title, category: input.category, description: input.description, dateReported: input.dateReported, location: input.location, priority: input.priority, estimatedAmount: input.estimatedAmount, finalAmount: input.finalAmount, provider: input.provider, contactDetails: input.contactDetails, dateStarted: input.dateStarted, dateCompleted: input.dateCompleted, warrantyExpiry: input.warrantyExpiry, notes: input.notes };
  try {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.maintenance.updateMany({ where: { id: maintenanceId, workspaceId: workspace.id, version: expectedVersion }, data: { task: input.title, category: input.category, description: input.description, dateReported: input.dateReported, location: input.location, priority: input.priority, quotePaise: input.estimatedAmount, finalCostPaise: input.finalAmount, provider: input.provider, contactDetails: input.contactDetails, dateStarted: input.dateStarted, dateCompleted: input.dateCompleted, warrantyUntil: input.warrantyExpiry, notes: input.notes, status: input.status, version: { increment: 1 } } });
      if (locked.count !== 1) throw new MaintenanceInputError("MAINTENANCE_VERSION_CONFLICT", "This maintenance record changed in another request. Reload before saving again.", 409);
      await tx.maintenanceEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: row.propertyId, maintenanceId, eventType, fromStatus: row.status, toStatus: input.status, detail: jsonValue(changed), idempotencyKey: key } });
      await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: row.propertyId, date: input.dateCompleted ?? input.dateReported, title: input.status === row.status ? "Maintenance record updated" : `Maintenance ${input.status.toLowerCase().replaceAll("_", " ")}`, detail: input.title, kind: "maintenance" } });
    });
  } catch (error: unknown) {
    if (error instanceof MaintenanceInputError) throw error;
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return { maintenance: await readMaintenance(maintenanceId, workspace.id), duplicate: true };
    throw error;
  }
  return { maintenance: await readMaintenance(maintenanceId, workspace.id), duplicate: false };
}

export async function linkMaintenanceDocumentForUser(userId: string, maintenanceId: string, raw: unknown) {
  const { workspace, row } = await ownedMaintenance(userId, maintenanceId);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new MaintenanceInputError("MAINTENANCE_DOCUMENT_INVALID", "A document link is required.");
  const input = raw as Record<string, unknown>;
  const documentId = text(input.documentId, "Document", true, 120) as string;
  const linkType = choice(input.linkType, MAINTENANCE_DOCUMENT_LINK_TYPES, "Link type", "PHOTO");
  const document = await prisma.propertyDoc.findFirst({ where: { id: documentId, workspaceId: workspace.id, propertyId: row.propertyId, archivedAt: null, deletedAt: null, scanStatus: "clean" }, select: { id: true, type: true, name: true, displayName: true, version: true, sha256: true, scanStatus: true, archivedAt: true, deletedAt: true } });
  if (!document) throw new MaintenanceInputError("DOCUMENT_NOT_FOUND", "The document is not an active clean document in this property.", 404);
  const documentVersionId = input.documentVersionId === undefined || input.documentVersionId === null || input.documentVersionId === "" ? null : text(input.documentVersionId, "Document version", true, 120);
  if (documentVersionId) {
    const version = await prisma.documentVersion.findFirst({ where: { id: documentVersionId, workspaceId: workspace.id, documentId, scanStatus: "clean" }, select: { id: true } });
    if (!version) throw new MaintenanceInputError("DOCUMENT_VERSION_NOT_FOUND", "The document version is not available.", 404);
  }
  const existing = await prisma.maintenanceDocumentLink.findUnique({ where: { maintenanceId_documentId_linkType: { maintenanceId, documentId, linkType } }, include: { document: { select: { id: true, type: true, name: true, displayName: true, version: true, sha256: true, scanStatus: true, archivedAt: true, deletedAt: true } } } });
  if (existing) return { link: { id: existing.id, documentId: existing.documentId, documentVersionId: existing.documentVersionId, linkType: existing.linkType, createdAt: existing.createdAt.toISOString(), document }, duplicate: true };
  const eventKey = `maintenance:${maintenanceId}:document:${documentId}:${linkType}`;
  await prisma.$transaction(async (tx) => {
    await tx.maintenanceDocumentLink.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: row.propertyId, maintenanceId, documentId, documentVersionId, linkType } });
    await tx.maintenanceEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: row.propertyId, maintenanceId, eventType: "DOCUMENT_LINKED", detail: jsonValue({ documentId, linkType }), idempotencyKey: eventKey } });
    await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: row.propertyId, date: today(), title: "Maintenance document linked", detail: `${linkType} · ${document.displayName || document.name}`, kind: "maintenance" } });
  });
  return { link: { id: (await prisma.maintenanceDocumentLink.findUniqueOrThrow({ where: { maintenanceId_documentId_linkType: { maintenanceId, documentId, linkType } } })).id, documentId, documentVersionId, linkType, createdAt: new Date().toISOString(), document }, duplicate: false };
}

export async function listMaintenanceDocumentsForUser(userId: string, maintenanceId: string) {
  const { workspace } = await ownedMaintenance(userId, maintenanceId);
  const row = await prisma.maintenanceDocumentLink.findMany({ where: { maintenanceId, workspaceId: workspace.id }, orderBy: { createdAt: "asc" }, include: { document: { select: { id: true, type: true, name: true, displayName: true, version: true, sha256: true, scanStatus: true, archivedAt: true, deletedAt: true } } } });
  return row.filter((link) => !link.document.archivedAt && !link.document.deletedAt).map((link) => ({ id: link.id, documentId: link.documentId, documentVersionId: link.documentVersionId, linkType: link.linkType, createdAt: link.createdAt.toISOString(), document: { id: link.document.id, type: link.document.type, name: link.document.displayName || link.document.name, version: link.document.version, sha256: link.document.sha256, scanStatus: link.document.scanStatus } }));
}

import { randomUUID } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureWorkspace, getWorkspaceForUser, mapProperty, readStateForUser } from "@/lib/repository";
import { paiseToRupees, rupeesToPaise } from "@/lib/money";
import { cancelRemindersForProperty } from "@/lib/durable-reminders";
import type { AreaType, AreaUnit, PropertyIdentifier, PropertyType } from "@/lib/types";

const PROPERTY_TYPES = new Set<PropertyType>(["flat", "plot", "villa", "commercial", "agri"]);
const AREA_UNITS = new Set<AreaUnit>(["sqft", "sqm", "acre", "hectare", "other"]);
const AREA_TYPES = new Set<AreaType>(["carpet", "built_up", "plot", "land", "other"]);

export class PropertyInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PropertyInputError";
  }
}

export class PropertyNotFoundError extends Error {
  constructor() {
    super("Resource not found.");
    this.name = "PropertyNotFoundError";
  }
}

export class PropertyVersionConflict extends Error {
  constructor() {
    super("This property changed in another request. Reload before saving again.");
    this.name = "PropertyVersionConflict";
  }
}

type PropertyPayload = {
  name: string;
  type: PropertyType;
  city: string;
  area: string;
  address: string;
  jurisdiction: string;
  areaValue: string;
  areaUnit: AreaUnit;
  areaType: AreaType;
  ownershipAssertion: "self_asserted";
  ownershipProvenance: string;
  identifiers: PropertyIdentifier[];
  ownerName: string;
  purchaseDate: string | null;
  purchaseValuePaise: bigint | null;
  carpetAreaSqft: number | null;
  plotSizeSqft: number | null;
  loanActive: boolean;
  loanBalancePaise: bigint | null;
  insuranceUntil: string | null;
  occupancy: string | null;
  photoUrl: string | null;
  coOwners: string | null;
  rentAmountPaise: bigint | null;
};

function recordOf(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new PropertyInputError("A property object is required.");
  return input as Record<string, unknown>;
}

function text(source: Record<string, unknown>, key: string, label: string, required = true, max = 500) {
  const value = source[key];
  if (value === undefined || value === null || value === "") {
    if (required) throw new PropertyInputError(`${label} is required.`);
    return "";
  }
  if (typeof value !== "string" || value.trim().length > max) throw new PropertyInputError(`${label} is invalid.`);
  const result = value.trim();
  if (required && !result) throw new PropertyInputError(`${label} is required.`);
  return result;
}

function optionalText(source: Record<string, unknown>, key: string, label: string, max = 500) {
  const value = source[key];
  if (value === undefined || value === null || value === "") return null;
  return text(source, key, label, true, max);
}
function optionalCalendarDate(source: Record<string, unknown>, key: string, label: string) {
  const value = optionalText(source, key, label, 10);
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new PropertyInputError(`${label} must be a real YYYY-MM-DD calendar date.`);
  return value;
}

function positiveInt(source: Record<string, unknown>, key: string, label: string) {
  const value = source[key];
  if (value === undefined || value === null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number) || number <= 0 || number > 10_000_000) throw new PropertyInputError(`${label} is invalid.`);
  return number;
}

function areaValue(source: Record<string, unknown>) {
  const value = text(source, "areaValue", "Area value", true, 32);
  if (!/^\d+(?:\.\d{1,4})?$/.test(value) || Number(value) <= 0) throw new PropertyInputError("Area value must be a positive number.");
  return value;
}

function oneOf<T extends string>(source: Record<string, unknown>, key: string, label: string, values: Set<T>): T {
  const value = text(source, key, label, true, 40) as T;
  if (!values.has(value)) throw new PropertyInputError(`${label} is invalid.`);
  return value;
}

function identifiers(source: Record<string, unknown>): PropertyIdentifier[] {
  const value = source.identifiers;
  if (value === undefined || value === null || value === "") return [];
  if (!Array.isArray(value) || value.length > 10) throw new PropertyInputError("Identifiers are invalid.");
  return value.map((item) => {
    const entry = recordOf(item);
    return { label: text(entry, "label", "Identifier label", true, 80), value: text(entry, "value", "Identifier value", true, 160) };
  });
}

function money(source: Record<string, unknown>, key: string, label: string) {
  const value = source[key];
  if (value === undefined || value === null || value === "") return null;
  try { return rupeesToPaise(value); } catch { throw new PropertyInputError(`${label} is invalid.`); }
}

export function parsePropertyPayload(input: unknown): PropertyPayload {
  const source = recordOf(input);
  const assertion = source.ownershipAssertion === undefined ? "self_asserted" : source.ownershipAssertion;
  if (assertion !== "self_asserted") throw new PropertyInputError("Ownership can only be recorded as owner-asserted, not government verified.");
  const occupancy = optionalText(source, "occupancy", "Occupancy", 32);
  if (occupancy && !["self", "rented", "vacant"].includes(occupancy)) throw new PropertyInputError("Occupancy is invalid.");
  return {
    name: text(source, "name", "Property name", true, 160),
    type: oneOf(source, "type", "Property type", PROPERTY_TYPES),
    city: text(source, "city", "City", true, 120),
    area: text(source, "area", "Locality", true, 160),
    address: text(source, "address", "Address", true, 500),
    jurisdiction: text(source, "jurisdiction", "Jurisdiction", true, 160),
    areaValue: areaValue(source),
    areaUnit: oneOf(source, "areaUnit", "Area unit", AREA_UNITS),
    areaType: oneOf(source, "areaType", "Area type", AREA_TYPES),
    ownershipAssertion: "self_asserted",
    ownershipProvenance: text(source, "ownershipProvenance", "Ownership source", true, 240),
    identifiers: identifiers(source),
    ownerName: text(source, "ownerName", "Owner name", true, 160),
    purchaseDate: optionalText(source, "purchaseDate", "Purchase date", 32),
    purchaseValuePaise: money(source, "purchaseValue", "Purchase value"),
    carpetAreaSqft: positiveInt(source, "carpetAreaSqft", "Carpet area"),
    plotSizeSqft: positiveInt(source, "plotSizeSqft", "Plot size"),
    loanActive: source.loanActive === true,
    loanBalancePaise: money(source, "loanBalance", "Loan balance"),
    insuranceUntil: optionalCalendarDate(source, "insuranceUntil", "Insurance date"),
    occupancy,
    photoUrl: optionalText(source, "photoUrl", "Photo", 2_000_000),
    coOwners: optionalText(source, "coOwners", "Co-owners", 500),
    rentAmountPaise: money(source, "rentAmount", "Rent amount"),
  };
}

function propertyData(payload: PropertyPayload) {
  return {
    name: payload.name,
    type: payload.type,
    city: payload.city,
    area: payload.area,
    address: payload.address,
    jurisdiction: payload.jurisdiction,
    areaValue: payload.areaValue,
    areaUnit: payload.areaUnit,
    areaType: payload.areaType,
    ownershipAssertion: payload.ownershipAssertion,
    ownershipProvenance: payload.ownershipProvenance,
    identifiers: payload.identifiers as unknown as Prisma.InputJsonValue,
    ownerName: payload.ownerName,
    purchaseDate: payload.purchaseDate,
    purchaseValuePaise: payload.purchaseValuePaise,
    carpetAreaSqft: payload.carpetAreaSqft,
    plotSizeSqft: payload.plotSizeSqft,
    loanActive: payload.loanActive,
    loanBalancePaise: payload.loanBalancePaise,
    insuranceUntil: payload.insuranceUntil,
    occupancy: payload.occupancy,
    photoUrl: payload.photoUrl,
    coOwners: payload.coOwners,
    rentAmountPaise: payload.rentAmountPaise,
  };
}

function safeHistoryValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const HISTORY_FIELDS = ["name", "type", "city", "area", "address", "jurisdiction", "areaValue", "areaUnit", "areaType", "ownershipAssertion", "ownershipProvenance", "identifiers", "ownerName", "purchaseDate", "purchaseValuePaise", "coOwners", "loanActive", "loanBalancePaise", "insuranceUntil"] as const;

function historyRows(userId: string, workspaceId: string, propertyId: string, before: Record<string, unknown> | null, after: Record<string, unknown>, source: string) {
  return HISTORY_FIELDS.flatMap((field) => {
    const previous = before?.[field];
    const next = after[field];
    const serialise = (value: unknown) => JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? nested.toString() : nested);
    if (before && serialise(previous) === serialise(next)) return [];
    return [{ id: randomUUID(), workspaceId, propertyId, actorUserId: userId, field, previousValue: safeHistoryValue(previous), nextValue: safeHistoryValue(next), source }];
  });
}

function timelineData(workspaceId: string, propertyId: string, title: string, detail: string) {
  return { id: randomUUID(), workspaceId, propertyId, date: new Date().toISOString().slice(0, 10), title, detail, kind: "other" };
}

function toPayloadDefaults(row: Prisma.PropertyModel) {
  return {
    name: row.name,
    type: row.type,
    city: row.city,
    area: row.area,
    address: row.address,
    jurisdiction: row.jurisdiction,
    areaValue: row.areaValue,
    areaUnit: row.areaUnit,
    areaType: row.areaType,
    ownershipAssertion: row.ownershipAssertion,
    ownershipProvenance: row.ownershipProvenance,
    identifiers: row.identifiers,
    ownerName: row.ownerName,
    purchaseDate: row.purchaseDate,
    purchaseValue: paiseToRupees(row.purchaseValuePaise),
    carpetAreaSqft: row.carpetAreaSqft,
    plotSizeSqft: row.plotSizeSqft,
    loanActive: row.loanActive,
    loanBalance: paiseToRupees(row.loanBalancePaise),
    insuranceUntil: row.insuranceUntil,
    occupancy: row.occupancy,
    photoUrl: row.photoUrl,
    coOwners: row.coOwners,
    rentAmount: paiseToRupees(row.rentAmountPaise),
  };
}

export async function createPropertyForUser(userId: string, input: unknown) {
  const payload = parsePropertyPayload(input);
  const workspace = await ensureWorkspace(userId);
  const propertyId = randomUUID();
  const row = await prisma.$transaction(async (tx) => {
    const property = await tx.property.create({ data: { id: propertyId, workspaceId: workspace.id, status: "active", ...propertyData(payload) } });
    await tx.propertyHistory.createMany({ data: historyRows(userId, workspace.id, property.id, null, property as unknown as Record<string, unknown>, "created") });
    await tx.timelineEvent.create({ data: timelineData(workspace.id, property.id, "Passport created", "Owner-entered property identity; ownership is self-asserted and not government verified.") });
    await tx.workspace.update({ where: { id: workspace.id }, data: { version: { increment: 1 } } });
    return property;
  });
  return { property: mapProperty(row), durable: await readStateForUser(userId) };
}

export async function updatePropertyForUser(userId: string, propertyId: string, expectedVersion: number, input: unknown) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new PropertyNotFoundError();
  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: "active" } });
    if (!current) throw new PropertyNotFoundError();
    if (current.version !== expectedVersion) throw new PropertyVersionConflict();
    const payload = parsePropertyPayload({ ...toPayloadDefaults(current), ...recordOf(input) });
    const updated = await tx.property.updateMany({ where: { id: propertyId, workspaceId: workspace.id, status: "active", version: expectedVersion }, data: { ...propertyData(payload), version: { increment: 1 } } });
    if (updated.count !== 1) throw new PropertyVersionConflict();
    const after = await tx.property.findUniqueOrThrow({ where: { id: propertyId } });
    const changes = historyRows(userId, workspace.id, propertyId, current as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>, "edited");
    if (changes.length) {
      await tx.propertyHistory.createMany({ data: changes });
      await tx.timelineEvent.create({ data: timelineData(workspace.id, propertyId, "Passport details updated", `${changes.length} identity field${changes.length === 1 ? "" : "s"} changed.`) });
    }
    await tx.workspace.update({ where: { id: workspace.id }, data: { version: { increment: 1 } } });
    return after;
  });
  return { property: mapProperty(row), durable: await readStateForUser(userId) };
}

export async function archivePropertyForUser(userId: string, propertyId: string, expectedVersion: number) {
  return setArchivedForUser(userId, propertyId, expectedVersion, "archived");
}

export async function restorePropertyForUser(userId: string, propertyId: string, expectedVersion: number) {
  return setArchivedForUser(userId, propertyId, expectedVersion, "active");
}

async function setArchivedForUser(userId: string, propertyId: string, expectedVersion: number, status: "active" | "archived") {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new PropertyNotFoundError();
  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id, status: status === "archived" ? "active" : "archived" } });
    if (!current) throw new PropertyNotFoundError();
    if (current.version !== expectedVersion) throw new PropertyVersionConflict();
    const result = await tx.property.updateMany({ where: { id: propertyId, workspaceId: workspace.id, status: current.status, version: expectedVersion }, data: { status, version: { increment: 1 } } });
    if (result.count !== 1) throw new PropertyVersionConflict();
    await tx.propertyHistory.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId, actorUserId: userId, field: "status", previousValue: current.status, nextValue: status, source: status === "archived" ? "archived" : "restored" } });
    await tx.timelineEvent.create({ data: timelineData(workspace.id, propertyId, status === "archived" ? "Passport archived" : "Passport restored", status === "archived" ? "Associated private records were retained." : "Passport returned to the active property list.") });
    await tx.workspace.update({ where: { id: workspace.id }, data: { version: { increment: 1 } } });
    return tx.property.findUniqueOrThrow({ where: { id: propertyId } });
  });
  if (status === "archived") await cancelRemindersForProperty(workspace.id, propertyId, "The property was archived.");
  return { property: mapProperty(row), durable: await readStateForUser(userId) };
}

export async function listPropertiesForUser(userId: string, includeArchived: boolean) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return [];
  const rows = await prisma.property.findMany({ where: { workspaceId: workspace.id, ...(includeArchived ? {} : { status: "active" }) }, orderBy: { createdAt: "asc" } });
  return rows.map(mapProperty);
}

export async function propertyHistoryForUser(userId: string, propertyId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new PropertyNotFoundError();
  const property = await prisma.property.findFirst({ where: { id: propertyId, workspaceId: workspace.id } });
  if (!property) throw new PropertyNotFoundError();
  return prisma.propertyHistory.findMany({ where: { propertyId, workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
}

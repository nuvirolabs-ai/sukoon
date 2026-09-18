import { mkdirSync } from "node:fs";
import path from "node:path";
import { emptyState } from "./store";
import type { AppState, PropertyDoc } from "./types";

/**
 * Development-only object-byte adapter. Authentication and domain metadata do
 * not use this filesystem path: Better Auth and PostgreSQL own those records.
 * A production object-storage adapter is still a release gate.
 */
const stateRoot = path.resolve(process.env.SUKOON_DATA_DIR || path.join(process.cwd(), ".data"));

export function localStorageRoot() {
  return stateRoot;
}

export function getUserFilePath(userId: string, propertyId: string, docId: string, extension: string) {
  const safe = [userId, propertyId, docId].every((value) => /^[a-zA-Z0-9_-]+$/.test(value));
  if (!safe || !["pdf", "jpg", "png"].includes(extension)) return null;
  const directory = path.join(stateRoot, "files", userId, propertyId);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  return path.join(directory, `${docId}.${extension}`);
}

export function normalizeState(input: unknown): AppState {
  const base = emptyState();
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<AppState>;
  const properties = Array.isArray(raw.properties) ? raw.properties : [];
  const propertyIds = new Set(properties.map((property) => typeof property?.id === "string" ? property.id : "").filter(Boolean));
  const childBelongsToProperty = (item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const propertyId = (item as { propertyId?: unknown }).propertyId;
    return typeof propertyId === "string" && propertyIds.has(propertyId);
  };
  const onlyOwnedChildren = <T>(items: unknown): T[] => Array.isArray(items) ? items.filter(childBelongsToProperty) as T[] : [];
  const docs = onlyOwnedChildren<PropertyDoc>(raw.docs);

  return {
    properties: properties.filter((property) => property && typeof property === "object" && typeof property.id === "string"),
    docs,
    bills: onlyOwnedChildren(raw.bills),
    maintenance: onlyOwnedChildren(raw.maintenance),
    timeline: onlyOwnedChildren(raw.timeline),
    shares: onlyOwnedChildren(raw.shares),
    tenants: onlyOwnedChildren(raw.tenants),
    reminders: onlyOwnedChildren(raw.reminders),
    bookings: onlyOwnedChildren(raw.bookings),
    projects: Array.isArray(raw.projects) ? raw.projects.filter((project) => !project || typeof project !== "object" || !("propertyId" in project) || childBelongsToProperty(project)) as AppState["projects"] : [],
    listings: Array.isArray(raw.listings) ? raw.listings : [],
    lang: raw.lang === "hi" ? "hi" : "en",
    referralCode: typeof raw.referralCode === "string" ? raw.referralCode.slice(0, 64) : "",
  };
}

import { getActiveSharesForUser, shareScopeAllows } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getWorkspaceForUser } from "@/lib/repository";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Prisma as PrismaTypes } from "@/lib/generated/prisma/client";

const MAX_QUERY_LENGTH = 120;
const MAX_SEARCHABLE_TEXT = 60_000;

export class SearchInputError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "SearchInputError";
    this.code = code;
    this.status = status;
  }
}

type SearchFilters = { propertyId?: string; documentType?: string };
type TextChunk = { page: number | null; text: string };

function cleanQuery(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > MAX_QUERY_LENGTH) throw new SearchInputError("SEARCH_QUERY_INVALID", "Search text is too long.");
  return value.trim().replace(/\s+/g, " ");
}

function cleanFilter(value: string | null, label: string, max = 120) {
  if (!value) return undefined;
  if (value.length > max) throw new SearchInputError("SEARCH_FILTER_INVALID", `${label} is invalid.`);
  return value.trim() || undefined;
}

function termsOf(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function matches(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.every((term) => normalized.includes(term));
}

function parsedChunks(value: unknown): TextChunk[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.text !== "string" || !candidate.text.trim()) return [];
    return [{ page: typeof candidate.page === "number" ? candidate.page : null, text: candidate.text.trim() }];
  });
}

function searchableText(chunks: TextChunk[]) {
  return chunks.map((chunk) => chunk.text).join("\n").slice(0, MAX_SEARCHABLE_TEXT);
}

function sourceType(versionSource: string) {
  if (versionSource === "fixture_ai") return "document_extracted_fixture";
  if (versionSource === "document_extracted") return "document_extracted";
  return "owner_entered_document";
}

function jsonValue(value: unknown): PrismaTypes.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as PrismaTypes.InputJsonValue;
}

/**
 * Rebuilds the private projection synchronously before a search. This keeps
 * the Phase 1 implementation PostgreSQL-only and makes archive/delete/review
 * changes visible without trusting a stale external index.
 */
export async function reconcileSearchProjections(workspaceId: string) {
  const [properties, documents] = await Promise.all([
    prisma.property.findMany({ where: { workspaceId, status: "active" }, select: { id: true, name: true, type: true, city: true, area: true, address: true, jurisdiction: true, identifiers: true } }),
    prisma.propertyDoc.findMany({
      where: { workspaceId, property: { status: "active" }, archivedAt: null, deletedAt: null, scanStatus: "clean", reviewStatus: "confirmed" },
      select: {
        id: true, propertyId: true, type: true, name: true, displayName: true, originalFilename: true, version: true,
        archivedAt: true, deletedAt: true, reviewStatus: true,
        versions: { where: { scanStatus: "clean", reviewStatus: "confirmed" }, orderBy: { version: "desc" }, take: 1, select: { id: true, version: true, displayName: true, originalFilename: true, source: true, reviewStatus: true, scanStatus: true } },
        parsingRuns: { where: { status: "succeeded" }, orderBy: { createdAt: "desc" }, select: { documentVersionId: true, textChars: true, textChunks: true } },
      },
    }),
  ]);

  const desiredIds: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const property of properties) {
      const id = `search:property:${property.id}`;
      desiredIds.push(id);
      const identifiers = Array.isArray(property.identifiers) ? JSON.stringify(property.identifiers) : "";
      await tx.searchProjection.upsert({
        where: { id },
        create: { id, workspaceId, propertyId: property.id, entityType: "PROPERTY", sourceType: "property_passport", title: property.name, category: property.type, searchableText: `${property.name} ${property.type} ${property.city} ${property.area} ${property.address} ${property.jurisdiction} ${identifiers}`.slice(0, MAX_SEARCHABLE_TEXT), searchableTextChars: 0, reviewState: "owner_record", visibilityState: "ACTIVE" },
        update: { title: property.name, category: property.type, searchableText: `${property.name} ${property.type} ${property.city} ${property.area} ${property.address} ${property.jurisdiction} ${identifiers}`.slice(0, MAX_SEARCHABLE_TEXT), searchableTextChars: 0, reviewState: "owner_record", visibilityState: "ACTIVE", archivedAt: null, deletedAt: null },
      });
    }
    for (const document of documents) {
      if (!document.propertyId) continue; // Purchase evidence is not an owned-property search projection.
      const version = document.versions[0];
      if (!version) continue;
      const chunks = parsedChunks(document.parsingRuns.find((run) => run.documentVersionId === version.id)?.textChunks);
      const text = searchableText(chunks);
      const id = `search:document:${document.id}:v${version.version}`;
      desiredIds.push(id);
      await tx.searchProjection.upsert({
        where: { id },
        create: { id, workspaceId, propertyId: document.propertyId, documentId: document.id, documentVersionId: version.id, entityType: "DOCUMENT", sourceType: sourceType(version.source), title: version.displayName || version.originalFilename || document.displayName || document.name, category: document.type, searchableText: text || null, searchableChunks: chunks.length ? jsonValue(chunks) : undefined, searchableTextChars: text.length, reviewState: document.reviewStatus, visibilityState: "ACTIVE" },
        update: { propertyId: document.propertyId, documentVersionId: version.id, sourceType: sourceType(version.source), title: version.displayName || version.originalFilename || document.displayName || document.name, category: document.type, searchableText: text || null, searchableChunks: chunks.length ? jsonValue(chunks) : Prisma.JsonNull, searchableTextChars: text.length, reviewState: document.reviewStatus, visibilityState: "ACTIVE", archivedAt: null, deletedAt: null },
      });
    }
    await tx.searchProjection.deleteMany({ where: { workspaceId, id: { notIn: desiredIds } } });
  });
}

function textSnippet(text: string | null, query: string) {
  if (!text) return undefined;
  const needle = query.toLowerCase().split(/\s+/).find(Boolean) ?? "";
  const index = text.toLowerCase().indexOf(needle);
  const start = Math.max(0, index < 0 ? 0 : index - 70);
  const end = Math.min(text.length, start + 180);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ")}${end < text.length ? "…" : ""}`;
}

function propertyResult(property: { id: string; name: string; type: string; city: string; area: string; address: string }, shared?: { shareId: string; role: string; expiresAt: string }) {
  return { kind: "property" as const, id: property.id, title: property.name, subtitle: `${property.type} · ${property.area}, ${property.city}`, href: shared ? `/shared/${property.id}` : `/property/${property.id}`, ...(shared ?? {}) };
}

function documentResult(row: { id: string; documentId: string | null; propertyId: string; title: string; category: string | null; sourceType: string; documentVersionId: string | null; searchableText: string | null; propertyName?: string }, query: string, shared?: { shareId: string; role: string; expiresAt: string }, includeSnippet = true) {
  const documentId = row.documentId ?? row.id.replace(/^search:document:/, "").replace(/:v[^:]+$/, "");
  return { kind: "document" as const, id: documentId, versionId: row.documentVersionId, propertyId: row.propertyId, propertyName: row.propertyName, title: row.title, category: row.category, sourceType: row.sourceType, snippet: includeSnippet ? textSnippet(row.searchableText, query) : undefined, href: shared ? `/shared/${row.propertyId}?document=${documentId}` : `/property/${row.propertyId}?tab=vault&document=${documentId}`, ...(shared ?? {}) };
}

function recordResult(row: { id: string; propertyId: string; title: string; detail: string; kind: "obligation" | "maintenance" }, query: string, shared = false) {
  return { kind: row.kind, id: row.id, propertyId: row.propertyId, title: row.title, subtitle: row.detail, href: `${shared ? "/shared" : "/property"}/${row.propertyId}?tab=${row.kind === "obligation" ? "bills" : "maint"}`, queryMatched: query };
}

async function ownedSearch(userId: string, workspaceId: string, query: string, filters: SearchFilters) {
  await reconcileSearchProjections(workspaceId);
  if (!query) return { mode: "owner" as const, query, filters, properties: [], documents: [], records: [], counts: { properties: 0, documents: 0, records: 0 } };
  const terms = termsOf(query);
  const propertyRows = await prisma.property.findMany({ where: { workspaceId, status: "active", ...(filters.propertyId ? { id: filters.propertyId } : {}) }, select: { id: true, name: true, type: true, city: true, area: true, address: true } });
  const properties = propertyRows.filter((row) => matches(`${row.name} ${row.type} ${row.city} ${row.area} ${row.address}`, terms)).map((row) => propertyResult(row));
  const projections = await prisma.searchProjection.findMany({ where: { workspaceId, entityType: "DOCUMENT", visibilityState: "ACTIVE", ...(filters.propertyId ? { propertyId: filters.propertyId } : {}), ...(filters.documentType ? { category: filters.documentType } : {}), OR: terms.map((term) => ({ OR: [{ title: { contains: term, mode: "insensitive" as const } }, { category: { contains: term, mode: "insensitive" as const } }, { searchableText: { contains: term, mode: "insensitive" as const } }] })) }, orderBy: { updatedAt: "desc" } });
  const documents = projections.filter((row) => matches(`${row.title} ${row.category ?? ""} ${row.searchableText ?? ""}`, terms)).map((row) => documentResult(row, query, undefined, true));
  const [obligations, maintenance] = await Promise.all([
    prisma.obligation.findMany({ where: { workspaceId, ...(filters.propertyId ? { propertyId: filters.propertyId } : {}) }, select: { id: true, propertyId: true, label: true, type: true, dueDate: true, direction: true } }),
    prisma.maintenance.findMany({ where: { workspaceId, ...(filters.propertyId ? { propertyId: filters.propertyId } : {}) }, select: { id: true, propertyId: true, task: true, category: true, provider: true, status: true } }),
  ]);
  const records = [...obligations.filter((row) => matches(`${row.label} ${row.type} ${row.direction} ${row.dueDate}`, terms)).map((row) => recordResult({ id: row.id, propertyId: row.propertyId, title: row.label, detail: `${row.type} · ${row.direction} · due ${row.dueDate}`, kind: "obligation" }, query)), ...maintenance.filter((row) => matches(`${row.task} ${row.category} ${row.provider ?? ""} ${row.status}`, terms)).map((row) => recordResult({ id: row.id, propertyId: row.propertyId, title: row.task, detail: `${row.category} · ${row.status}`, kind: "maintenance" }, query))];
  return { mode: "owner" as const, query, filters, properties, documents, records, counts: { properties: properties.length, documents: documents.length, records: records.length } };
}

async function sharedSearch(userId: string, query: string, filters: SearchFilters) {
  if (!query) return { mode: "shared" as const, query, filters, properties: [], documents: [], records: [], counts: { properties: 0, documents: 0, records: 0 } };
  const terms = termsOf(query);
  const grants = await getActiveSharesForUser(userId);
  await Promise.all([...new Set(grants.map((grant) => grant.workspaceId))].map((workspaceId) => reconcileSearchProjections(workspaceId)));
  const sharedProperties = await prisma.property.findMany({ where: { id: { in: grants.map((grant) => grant.propertyId) }, status: "active", ...(filters.propertyId ? { id: filters.propertyId } : {}) }, select: { id: true, name: true, type: true, city: true, area: true, address: true } });
  const properties = sharedProperties.flatMap((property) => grants.filter((grant) => grant.propertyId === property.id && shareScopeAllows(grant, "PROPERTY_BASIC_READ")).filter(() => matches(`${property.name} ${property.type} ${property.city} ${property.area} ${property.address}`, terms)).map((grant) => propertyResult(property, { shareId: grant.id, role: grant.role, expiresAt: grant.expiresAt })));
  const projectionRows = await prisma.searchProjection.findMany({
    where: {
      propertyId: { in: sharedProperties.map((property) => property.id) },
      entityType: "DOCUMENT",
      visibilityState: "ACTIVE",
      ...(filters.documentType ? { category: filters.documentType } : {}),
      OR: terms.map((term) => ({ OR: [{ title: { contains: term, mode: "insensitive" as const } }, { category: { contains: term, mode: "insensitive" as const } }, { searchableText: { contains: term, mode: "insensitive" as const } }] })),
    },
  });
  const documents = projectionRows.flatMap((row) => grants.filter((grant) => grant.propertyId === row.propertyId && (shareScopeAllows(grant, "DOCUMENT_LIST", { id: row.documentId ?? "", type: row.category ?? "" }) || shareScopeAllows(grant, "DOCUMENT_METADATA_READ", { id: row.documentId ?? "", type: row.category ?? "" }) || shareScopeAllows(grant, "DOCUMENT_PREVIEW", { id: row.documentId ?? "", type: row.category ?? "" }))).filter((grant) => matches(`${row.title} ${row.category ?? ""} ${shareScopeAllows(grant, "DOCUMENT_PREVIEW", { id: row.documentId ?? "", type: row.category ?? "" }) ? row.searchableText ?? "" : ""}`, terms)).map((grant) => documentResult({ ...row, propertyName: sharedProperties.find((property) => property.id === row.propertyId)?.name }, query, { shareId: grant.id, role: grant.role, expiresAt: grant.expiresAt }, false)));
  const [obligations, maintenance] = await Promise.all([
    prisma.obligation.findMany({ where: { propertyId: { in: sharedProperties.map((property) => property.id) }, workspaceId: { in: [...new Set(grants.map((grant) => grant.workspaceId))] } }, select: { id: true, propertyId: true, label: true, type: true, dueDate: true, direction: true } }),
    prisma.maintenance.findMany({ where: { propertyId: { in: sharedProperties.map((property) => property.id) }, workspaceId: { in: [...new Set(grants.map((grant) => grant.workspaceId))] } }, select: { id: true, propertyId: true, task: true, category: true, provider: true, status: true } }),
  ]);
  const records = [
    ...obligations.filter((row) => grants.some((grant) => grant.propertyId === row.propertyId && shareScopeAllows(grant, "BILLS_READ")) && matches(`${row.label} ${row.type} ${row.direction} ${row.dueDate}`, terms)).map((row) => recordResult({ id: row.id, propertyId: row.propertyId, title: row.label, detail: `${row.type} · ${row.direction} · due ${row.dueDate}`, kind: "obligation" }, query, true)),
    ...maintenance.filter((row) => grants.some((grant) => grant.propertyId === row.propertyId && shareScopeAllows(grant, "MAINTENANCE_READ")) && matches(`${row.task} ${row.category} ${row.provider ?? ""} ${row.status}`, terms)).map((row) => recordResult({ id: row.id, propertyId: row.propertyId, title: row.task, detail: `${row.category} · ${row.status}`, kind: "maintenance" }, query, true)),
  ];
  return { mode: "shared" as const, query, filters, properties, documents, records, counts: { properties: properties.length, documents: documents.length, records: records.length } };
}

async function baseSearchForUser(userId: string, rawQuery: unknown, rawFilters: { propertyId?: string | null; documentType?: string | null } = {}) {
  const query = cleanQuery(rawQuery);
  const filters = { propertyId: cleanFilter(rawFilters.propertyId ?? null, "Property filter"), documentType: cleanFilter(rawFilters.documentType ?? null, "Document type") };
  const workspace = await getWorkspaceForUser(userId);
  if (workspace) return ownedSearch(userId, workspace.id, query, filters);
  if ((await getActiveSharesForUser(userId)).length) return sharedSearch(userId, query, filters);
  throw new SearchInputError("SEARCH_FORBIDDEN", "Private search is not available for this account.", 403);
}

export async function searchForUser(userId: string, rawQuery: unknown, rawFilters: { propertyId?: string | null; documentType?: string | null } = {}) {
  const result=await baseSearchForUser(userId,rawQuery,rawFilters);
  const {constructionSearchForUser}=await import("@/lib/construction");
  const construction=rawFilters.documentType?[]:await constructionSearchForUser(userId,result.query,rawFilters.propertyId||undefined);
  // Recheck after retrieval; withdrawn intelligence must not leak via cached text or match counts.
  const suppressed = await prisma.propertyDoc.findMany({ where: { id: { in: result.documents.map(row => row.id) }, workspace: { processingControl: { isNot: null } } }, select: { id: true } });
  const denied = new Set(suppressed.map(row => row.id));
  const documents = result.documents.filter(row => !denied.has(row.id));
  return {...result,documents,records:[...result.records,...construction],counts:{...result.counts,documents:documents.length,records:result.counts.records+construction.length}};
}

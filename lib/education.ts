import { prisma } from "@/lib/prisma";

function today() { return new Date().toISOString().slice(0, 10); }
function currentWhere(asOf = today()) { return { status: "PUBLISHED", effectiveFrom: { lte: asOf }, OR: [{ expiresAt: null }, { expiresAt: { gte: asOf } }] }; }
function bodyLines(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").slice(0, 40);
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => typeof item === "string" ? [`${key}: ${item}`] : []).slice(0, 40);
  return [];
}
function dto(row: { id: string; slug: string; contentType: string; title: string; summary: string; body: unknown; sourceName: string; sourceReference: unknown; reviewer: string; reviewedAt: Date; effectiveFrom: string; expiresAt: string | null; version: number }) {
  return { ...row, body: bodyLines(row.body), reviewedAt: row.reviewedAt.toISOString(), sourceReference: row.sourceReference };
}

export async function listPublishedEducation(asOf = today()) {
  const rows = await prisma.educationContent.findMany({ where: currentWhere(asOf), orderBy: [{ effectiveFrom: "desc" }, { title: "asc" }] });
  return rows.map(dto);
}

export async function getPublishedEducation(slug: string, asOf = today()) {
  const row = await prisma.educationContent.findFirst({ where: { slug, ...currentWhere(asOf) } });
  return row ? dto(row) : null;
}

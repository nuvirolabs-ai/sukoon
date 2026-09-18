import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasTrustedOrigin } from "@/lib/request-origin";
import { prisma } from "@/lib/prisma";
import { PROCESSING_NOTICE, withdrawIntelligence } from "@/lib/processing-consent";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  const workspace = await prisma.workspace.findUnique({ where: { ownerUserId: session.user.id }, include: { processingControl: true } });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return NextResponse.json({ data: { noticeVersion: PROCESSING_NOTICE, withdrawnAt: workspace?.processingControl?.withdrawnAt ?? null, available: user?.role === "owner" } }, { headers });
}
export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403, headers });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  try {
    const body = await request.json();
    if (body?.confirmed !== true || body?.noticeVersion !== PROCESSING_NOTICE) return NextResponse.json({ error: { code: "PROCESSING_NOTICE_REQUIRED" } }, { status: 400, headers });
    const result = await withdrawIntelligence(session.user.id, body.noticeVersion);
    return NextResponse.json({ data: { withdrawnAt: result.withdrawnAt, noticeVersion: result.noticeVersion } }, { headers });
  } catch (error) {
    return NextResponse.json({ error: { code: error instanceof SyntaxError ? "INVALID_JSON" : "PROCESSING_CONTROL_UNAVAILABLE" } }, { status: error instanceof SyntaxError ? 400 : 503, headers });
  }
}

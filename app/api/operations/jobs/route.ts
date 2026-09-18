import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasTrustedOrigin } from "@/lib/request-origin";
import { cancelFailedDocumentJob, OperationsAccessError } from "@/lib/operations";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403, headers });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  try {
    const body = await request.json();
    if (body?.action !== "cancel" || typeof body.id !== "string" || body.id.length > 100) return NextResponse.json({ error: { code: "JOB_ACTION_INVALID" } }, { status: 400, headers });
    return NextResponse.json({ data: await cancelFailedDocumentJob(session.user.id, body.id) }, { headers });
  } catch (error) { if (error instanceof OperationsAccessError) return NextResponse.json({ error: { code: error.code } }, { status: error.status, headers }); return NextResponse.json({ error: { code: "JOB_CONTROL_UNAVAILABLE" } }, { status: error instanceof SyntaxError ? 400 : 503, headers }); }
}

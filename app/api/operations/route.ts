import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OperationsAccessError, operationsSnapshot } from "@/lib/operations";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  try { return NextResponse.json({ data: await operationsSnapshot(session.user.id) }, { headers }); }
  catch (error) {
    if (error instanceof OperationsAccessError) return NextResponse.json({ error: { code: error.code } }, { status: error.status, headers });
    return NextResponse.json({ error: { code: "OPERATIONS_UNAVAILABLE" } }, { status: 503, headers });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listOwnerSessions, revokeOtherOwnerSessions } from "@/lib/privacy-sessions";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  return NextResponse.json({ data: { sessions: await listOwnerSessions(session.user.id, session.session.id) } }, { headers });
}
export async function POST(request: Request) {
  // This cookie-authenticated mutation accepts only same-origin browser requests.
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403, headers });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  try { return NextResponse.json({ data: await revokeOtherOwnerSessions(session.user.id, session.session.id) }, { headers }); }
  catch { return NextResponse.json({ error: { code: "SESSION_CONTROL_UNAVAILABLE" } }, { status: 409, headers }); }
}

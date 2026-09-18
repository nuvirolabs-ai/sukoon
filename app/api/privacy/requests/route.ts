import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasTrustedOrigin } from "@/lib/request-origin";
import { cancelPrivacyRequest, createPrivacyRequest, listPrivacyRequests, PrivacyRequestError } from "@/lib/privacy-requests";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  return NextResponse.json({ data: { requests: await listPrivacyRequests(session.user.id) } }, { headers });
}
export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403, headers });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON" } }, { status: 400, headers }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: { code: "INVALID_PRIVACY_REQUEST" } }, { status: 400, headers });
  const body = input as Record<string, unknown>;
  try {
    if (body.action === "cancel" && typeof body.id === "string") return NextResponse.json({ data: await cancelPrivacyRequest(session.user.id, body.id) }, { headers });
    if (typeof body.kind !== "string" || typeof body.requestKey !== "string" || (body.propertyId !== undefined && typeof body.propertyId !== "string")) throw new PrivacyRequestError("INVALID_PRIVACY_REQUEST", 400);
    const result = await createPrivacyRequest(session.user.id, { kind: body.kind, requestKey: body.requestKey, propertyId: body.propertyId as string | undefined, confirmed: body.confirmed === true });
    return NextResponse.json({ data: result }, { status: 202, headers });
  } catch (error) {
    if (error instanceof PrivacyRequestError) return NextResponse.json({ error: { code: error.code } }, { status: error.status, headers });
    return NextResponse.json({ error: { code: "PRIVACY_REQUEST_UNAVAILABLE" } }, { status: 503, headers });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasTrustedOrigin } from "@/lib/request-origin";
import { confirmSyntheticErasure } from "@/lib/privacy-erasure";
import { ErasureGateError } from "@/lib/erasure-gate";
import { PrivacyRequestError } from "@/lib/privacy-requests";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403, headers });
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
    const body = await request.json();
    if (!body || Object.keys(body).some(key => !["requestId", "confirmed", "policy"].includes(key)) || typeof body.requestId !== "string" || typeof body.policy !== "string") throw new PrivacyRequestError("ERASURE_INPUT_INVALID", 400);
    return NextResponse.json({ data: await confirmSyntheticErasure(session.user.id, body.requestId, body.confirmed === true, body.policy) }, { status: 202, headers });
  } catch (error) {
    return NextResponse.json({ error: { code: error instanceof ErasureGateError || error instanceof PrivacyRequestError ? error.code : "ERASURE_UNAVAILABLE" } }, { status: error instanceof ErasureGateError || error instanceof PrivacyRequestError ? error.status : 503, headers });
  }
}

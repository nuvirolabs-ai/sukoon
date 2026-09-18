import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readStateForUser } from "@/lib/repository";
import { assertErasureReady } from "@/lib/erasure-gate";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function currentAuth(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function GET(request: Request) {
  try { assertErasureReady(); } catch { return errorResponse("ERASURE_RECOVERY_REQUIRED", "Synthetic recovery is not yet verified.", 503); }
  const session = await currentAuth(request);
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  const durable = await readStateForUser(session.user.id);
  try { assertErasureReady(); } catch { return errorResponse("ERASURE_RECOVERY_REQUIRED", "Synthetic recovery is not yet verified.", 503); }
  return NextResponse.json({ data: { user: session.user, expiresAt: session.session.expiresAt, state: durable.state, version: durable.version, environment: process.env.APP_ENV === "local" ? "local" : "configured" } }, { headers: { "Cache-Control": "no-store" } });
}

/** Email OTP is deliberately handled by Better Auth's maintained endpoints. */
export async function POST() {
  return errorResponse("AUTH_FLOW_REQUIRED", "Request and verify an email OTP through the maintained authentication flow.", 405);
}

export async function DELETE(request: Request) {
  const result = await auth.api.signOut({ headers: request.headers, returnHeaders: true });
  return NextResponse.json({ data: { signedOut: true } }, { headers: result.headers });
}

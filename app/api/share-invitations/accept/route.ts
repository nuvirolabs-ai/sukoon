import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { acceptShareInvitationForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { const body = await request.json() as { token?: unknown }; return NextResponse.json({ data: { share: await acceptShareInvitationForUser(session.user.id, session.user.email, body.token) } }); }
  catch (error: unknown) { if (error instanceof SharingInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

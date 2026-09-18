import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createShareInvitationForUser, listOwnedSharesForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
function errorResponse(error: SharingInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { const { id } = await context.params; return NextResponse.json({ data: { shares: await listOwnedSharesForUser(session.user.id, id) } }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error: unknown) { if (error instanceof SharingInputError) return errorResponse(error); throw error; }
}

export async function POST(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { const { id } = await context.params; return NextResponse.json({ data: await createShareInvitationForUser(session.user.id, id, await request.json()) }, { status: 201 }); }
  catch (error: unknown) { if (error instanceof SharingInputError) return errorResponse(error); throw error; }
}

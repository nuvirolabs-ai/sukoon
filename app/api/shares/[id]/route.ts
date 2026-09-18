import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeShareForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { const { id } = await context.params; return NextResponse.json({ data: { share: await revokeShareForUser(session.user.id, id) } }); }
  catch (error: unknown) { if (error instanceof SharingInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

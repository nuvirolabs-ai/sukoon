import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listSharedDocumentsForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { const { id } = await context.params; return NextResponse.json({ data: { documents: await listSharedDocumentsForUser(session.user.id, id) } }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error: unknown) { if (error instanceof SharingInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchSharedForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { return NextResponse.json({ data: await searchSharedForUser(session.user.id, new URL(request.url).searchParams.get("q") || "") }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error: unknown) { if (error instanceof SharingInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

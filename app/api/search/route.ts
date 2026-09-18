import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchForUser, SearchInputError } from "@/lib/search";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const url = new URL(request.url);
  try {
    const data = await searchForUser(session.user.id, url.searchParams.get("q"), { propertyId: url.searchParams.get("propertyId"), documentType: url.searchParams.get("documentType") });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    if (error instanceof SearchInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    throw error;
  }
}

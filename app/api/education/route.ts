import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listPublishedEducation } from "@/lib/education";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  return NextResponse.json({ data: { education: await listPublishedEducation() } }, { headers: { "Cache-Control": "no-store" } });
}

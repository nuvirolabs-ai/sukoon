import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPublishedEducation } from "@/lib/education";

export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const content = await getPublishedEducation((await context.params).slug);
  if (!content) return NextResponse.json({ error: { code: "EDUCATION_NOT_FOUND", message: "Current published education was not found." } }, { status: 404 });
  return NextResponse.json({ data: { content } }, { headers: { "Cache-Control": "no-store" } });
}

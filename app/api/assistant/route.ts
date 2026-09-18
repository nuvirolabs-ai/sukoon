import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { answerAssistantForUser, AssistantInputError } from "@/lib/assistant";
import { ConstructionError } from "@/lib/construction";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const body = await request.json() as { question?: unknown; propertyId?: unknown; projectId?: string };
    return NextResponse.json({ data: await answerAssistantForUser(session.user.id, body.question, body.propertyId, {projectId:body.projectId}) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { if (error instanceof AssistantInputError || error instanceof ConstructionError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

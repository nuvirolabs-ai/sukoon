import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { evaluatePropertyHealthForUser, listAssessmentHistoryForUser, AssessmentInputError } from "@/lib/assessment";
import { getWorkspaceForUser } from "@/lib/repository";
import { evaluateSharedHealthForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

function errorResponse(error: AssessmentInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    if (!(await getWorkspaceForUser(session.user.id))) {
      if (url.searchParams.get("history") === "true") throw new SharingInputError("SHARED_HEALTH_HISTORY_UNAVAILABLE", "Shared health history is not available.", 404);
      return NextResponse.json({ data: { snapshot: await evaluateSharedHealthForUser(session.user.id, id) } }, { headers: { "Cache-Control": "no-store" } });
    }
    if (url.searchParams.get("history") === "true") return NextResponse.json({ data: { snapshots: await listAssessmentHistoryForUser(session.user.id, id) } }, { headers: { "Cache-Control": "no-store" } });
    // A read is a deterministic assessment run: changed passport or vault
    // evidence must produce a new immutable snapshot rather than return a
    // stale prior result.
    const snapshot = await evaluatePropertyHealthForUser(session.user.id, id, url.searchParams.get("asOf") || undefined);
    return NextResponse.json({ data: { snapshot } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { if (error instanceof AssessmentInputError) return errorResponse(error); if (error instanceof SharingInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

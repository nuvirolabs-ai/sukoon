import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getObligationForUser, markOccurrenceCompletedForUser, setObligationActiveForUser, updateObligationForUser, ObligationInputError } from "@/lib/obligations";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
function errorResponse(error: ObligationInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { const { id } = await context.params; return NextResponse.json({ data: { obligation: await getObligationForUser(session.user.id, id) } }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error: unknown) { if (error instanceof ObligationInputError) return errorResponse(error); throw error; }
}

export async function PATCH(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json() as { version?: number; obligation?: unknown };
    if (!Number.isInteger(body.version)) throw new ObligationInputError("OBLIGATION_VERSION_INVALID", "Obligation version is required.");
    return NextResponse.json({ data: { obligation: await updateObligationForUser(session.user.id, id, body.version as number, body.obligation ?? body) } });
  } catch (error: unknown) { if (error instanceof ObligationInputError) return errorResponse(error); throw error; }
}

export async function POST(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json() as { action?: string; version?: number; occurrenceId?: string; occurrenceVersion?: number };
    if (body.action === "deactivate" || body.action === "reactivate") {
      if (!Number.isInteger(body.version)) throw new ObligationInputError("OBLIGATION_VERSION_INVALID", "Obligation version is required.");
      return NextResponse.json({ data: { obligation: await setObligationActiveForUser(session.user.id, id, body.action === "reactivate", body.version as number) } });
    }
    if (body.action === "complete-occurrence" && body.occurrenceId && Number.isInteger(body.occurrenceVersion)) return NextResponse.json({ data: { occurrence: await markOccurrenceCompletedForUser(session.user.id, body.occurrenceId, body.occurrenceVersion as number) } });
    throw new ObligationInputError("OBLIGATION_ACTION_INVALID", "Obligation action is invalid.");
  } catch (error: unknown) { if (error instanceof ObligationInputError) return errorResponse(error); throw error; }
}

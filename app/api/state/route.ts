import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureWorkspace, getWorkspaceForUser, readStateForUser, replaceStateForUser, StateOwnershipError, StateVersionConflict } from "@/lib/repository";
import { getActiveSharesForUser } from "@/lib/authz";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function currentAuth(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function GET(request: Request) {
  const session = await currentAuth(request);
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  const durable = await readStateForUser(session.user.id);
  return NextResponse.json({ data: { state: durable.state, version: durable.version } }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const session = await currentAuth(request);
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("INVALID_REQUEST", "A state payload is required.", 400); }
  if (!body || typeof body !== "object" || !("state" in body) || !("version" in body)) return errorResponse("VERSION_REQUIRED", "A workspace version is required for writes.", 409);
  const expectedVersion = (body as { version?: unknown }).version;
  if (!Number.isInteger(expectedVersion) || Number(expectedVersion) < 0) return errorResponse("INVALID_VERSION", "A valid workspace version is required.", 400);
  try {
    if (!(await getWorkspaceForUser(session.user.id)) && (await getActiveSharesForUser(session.user.id)).length) return errorResponse("SHARED_ACCOUNT_READ_ONLY", "A shared account cannot write owner state.", 403);
    if (!(await getWorkspaceForUser(session.user.id))) await ensureWorkspace(session.user.id);
    const saved = await replaceStateForUser(session.user.id, (body as { state: unknown }).state, Number(expectedVersion));
    return NextResponse.json({ data: { state: saved.state, version: saved.version } });
  } catch (error: unknown) {
    if (error instanceof StateVersionConflict) return errorResponse("STATE_VERSION_CONFLICT", error.message, 409);
    if (error instanceof StateOwnershipError) return errorResponse("RESOURCE_NOT_FOUND", "Resource not found.", 404);
    throw error;
  }
}

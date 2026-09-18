import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMaintenanceForUser, MaintenanceInputError, updateMaintenanceForUser } from "@/lib/maintenance";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
function errorResponse(error: MaintenanceInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { const { id } = await context.params; return NextResponse.json({ data: { maintenance: await getMaintenanceForUser(session.user.id, id) } }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error: unknown) { if (error instanceof MaintenanceInputError) return errorResponse(error); throw error; }
}

export async function PATCH(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json() as { version?: number; maintenance?: unknown };
    if (!Number.isInteger(body.version)) throw new MaintenanceInputError("MAINTENANCE_VERSION_INVALID", "Maintenance version is required.");
    const result = await updateMaintenanceForUser(session.user.id, id, body.version as number, body.maintenance ?? body, request.headers.get("Idempotency-Key") || "");
    return NextResponse.json({ data: result }, { status: result.duplicate ? 200 : 200 });
  } catch (error: unknown) { if (error instanceof MaintenanceInputError) return errorResponse(error); throw error; }
}

export async function POST(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json() as { action?: string; version?: number; input?: Record<string, unknown> };
    if (!body.action || !["plan", "progress", "resolve", "reopen", "cancel", "correct"].includes(body.action)) throw new MaintenanceInputError("MAINTENANCE_ACTION_INVALID", "Maintenance action is invalid.");
    if (!Number.isInteger(body.version)) throw new MaintenanceInputError("MAINTENANCE_VERSION_INVALID", "Maintenance version is required.");
    const statusByAction = { plan: "PLANNED", progress: "IN_PROGRESS", resolve: "RESOLVED", reopen: "OPEN", cancel: "CANCELLED" } as const;
    const input = { ...(body.input || {}), ...(body.action === "correct" ? {} : { status: statusByAction[body.action as keyof typeof statusByAction] }) };
    const result = await updateMaintenanceForUser(session.user.id, id, body.version as number, input, request.headers.get("Idempotency-Key") || `maintenance-action:${id}:${body.version}:${body.action}`);
    return NextResponse.json({ data: result });
  } catch (error: unknown) { if (error instanceof MaintenanceInputError) return errorResponse(error); throw error; }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createMaintenanceForUser, listMaintenanceForUser, MaintenanceInputError } from "@/lib/maintenance";

export const runtime = "nodejs";

function errorResponse(error: MaintenanceInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const url = new URL(request.url);
  const propertyId = url.searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: { code: "PROPERTY_REQUIRED", message: "A property is required." } }, { status: 400 });
  try { return NextResponse.json({ data: await listMaintenanceForUser(session.user.id, propertyId, url.searchParams.get("view") || "all") }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error: unknown) { if (error instanceof MaintenanceInputError) return errorResponse(error); throw error; }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const propertyId = new URL(request.url).searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: { code: "PROPERTY_REQUIRED", message: "A property is required." } }, { status: 400 });
  try { const result = await createMaintenanceForUser(session.user.id, propertyId, await request.json(), request.headers.get("Idempotency-Key") || ""); return NextResponse.json({ data: result }, { status: result.duplicate ? 200 : 201 }); }
  catch (error: unknown) { if (error instanceof MaintenanceInputError) return errorResponse(error); throw error; }
}

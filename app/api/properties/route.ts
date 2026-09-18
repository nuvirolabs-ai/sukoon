import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPropertyForUser, listPropertiesForUser, PropertyInputError } from "@/lib/property-repository";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
  const properties = await listPropertiesForUser(session.user.id, includeArchived);
  return NextResponse.json({ data: { properties } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("INVALID_REQUEST", "A property payload is required.", 400); }
  try {
    const created = await createPropertyForUser(session.user.id, body);
    return NextResponse.json({ data: { property: created.property, state: created.durable.state, version: created.durable.version } }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof PropertyInputError) return errorResponse("INVALID_PROPERTY", error.message, 400);
    throw error;
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { archivePropertyForUser, PropertyInputError, PropertyNotFoundError, PropertyVersionConflict, restorePropertyForUser, updatePropertyForUser } from "@/lib/property-repository";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function readVersion(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { throw new PropertyInputError("A versioned property payload is required."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new PropertyInputError("A versioned property payload is required.");
  const source = body as Record<string, unknown>;
  const version = source.version;
  if (!Number.isInteger(version) || Number(version) < 0) return { version: null, payload: null };
  return { version: Number(version), payload: source.property && typeof source.property === "object" ? source.property : source };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  const { id } = await context.params;
  try {
    const parsed = await readVersion(request);
    if (parsed.version === null || !parsed.payload) return errorResponse("VERSION_REQUIRED", "A property version is required for writes.", 409);
    const updated = await updatePropertyForUser(session.user.id, id, parsed.version, parsed.payload);
    return NextResponse.json({ data: { property: updated.property, state: updated.durable.state, version: updated.durable.version } });
  } catch (error: unknown) {
    if (error instanceof PropertyInputError) return errorResponse("INVALID_PROPERTY", error.message, 400);
    if (error instanceof PropertyVersionConflict) return errorResponse("PROPERTY_VERSION_CONFLICT", error.message, 409);
    if (error instanceof PropertyNotFoundError) return errorResponse("RESOURCE_NOT_FOUND", "Resource not found.", 404);
    throw error;
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  const { id } = await context.params;
  const action = new URL(request.url).pathname.endsWith("/restore") ? "restore" : "archive";
  try {
    const parsed = await readVersion(request);
    if (parsed.version === null) return errorResponse("VERSION_REQUIRED", "A property version is required for writes.", 409);
    const result = action === "restore"
      ? await restorePropertyForUser(session.user.id, id, parsed.version)
      : await archivePropertyForUser(session.user.id, id, parsed.version);
    return NextResponse.json({ data: { property: result.property, state: result.durable.state, version: result.durable.version } });
  } catch (error: unknown) {
    if (error instanceof PropertyInputError) return errorResponse("INVALID_PROPERTY", error.message, 400);
    if (error instanceof PropertyVersionConflict) return errorResponse("PROPERTY_VERSION_CONFLICT", error.message, 409);
    if (error instanceof PropertyNotFoundError) return errorResponse("RESOURCE_NOT_FOUND", "Resource not found.", 404);
    throw error;
  }
}

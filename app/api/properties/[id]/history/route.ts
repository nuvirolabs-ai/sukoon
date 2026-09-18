import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { propertyHistoryForUser, PropertyNotFoundError } from "@/lib/property-repository";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const history = await propertyHistoryForUser(session.user.id, id);
    return NextResponse.json({ data: { history: history.map((entry) => ({ id: entry.id, field: entry.field, previousValue: entry.previousValue, nextValue: entry.nextValue, source: entry.source, createdAt: entry.createdAt.toISOString() })) } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    if (error instanceof PropertyNotFoundError) return NextResponse.json({ error: { code: "RESOURCE_NOT_FOUND", message: "Resource not found." } }, { status: 404 });
    throw error;
  }
}

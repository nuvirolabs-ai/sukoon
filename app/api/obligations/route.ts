import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createObligationForUser, listObligationsForUser, ObligationInputError } from "@/lib/obligations";

export const runtime = "nodejs";
function errorResponse(error: ObligationInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const url = new URL(request.url);
  const propertyId = url.searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: { code: "PROPERTY_REQUIRED", message: "A property is required." } }, { status: 400 });
  try {
    const rawView = url.searchParams.get("view") ?? "all";
    if (!["upcoming", "overdue", "completed", "all"].includes(rawView)) throw new ObligationInputError("VIEW_INVALID", "Obligation view is invalid.");
    const obligations = await listObligationsForUser(session.user.id, propertyId, rawView as "upcoming" | "overdue" | "completed" | "all", url.searchParams.get("asOf") || undefined);
    return NextResponse.json({ data: { obligations } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { if (error instanceof ObligationInputError) return errorResponse(error); throw error; }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const propertyId = new URL(request.url).searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: { code: "PROPERTY_REQUIRED", message: "A property is required." } }, { status: 400 });
  try { return NextResponse.json({ data: { obligation: await createObligationForUser(session.user.id, propertyId, await request.json()) } }, { status: 201 }); }
  catch (error: unknown) { if (error instanceof ObligationInputError) return errorResponse(error); throw error; }
}

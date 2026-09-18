import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRuleDraftForOperator, listPublishedRulesForProperty, RuleInputError } from "@/lib/rules";

export const runtime = "nodejs";

function errorResponse(error: RuleInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const url = new URL(request.url);
  try {
    const rules = await listPublishedRulesForProperty(session.user.id, url.searchParams.get("propertyId") || undefined, url.searchParams.get("asOf") || undefined);
    return NextResponse.json({ data: { rules } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { if (error instanceof RuleInputError) return errorResponse(error); throw error; }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const rule = await createRuleDraftForOperator(session.user.id, await request.json());
    return NextResponse.json({ data: { rule } }, { status: 201 });
  } catch (error: unknown) { if (error instanceof RuleInputError) return errorResponse(error); throw error; }
}

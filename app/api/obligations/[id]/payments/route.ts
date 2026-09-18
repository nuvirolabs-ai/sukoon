import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOccurrencePaymentSummaryForUser, recordPaymentForUser, PaymentInputError } from "@/lib/payments";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
function errorResponse(error: PaymentInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const occurrenceId = new URL(request.url).searchParams.get("occurrenceId") || id;
    return NextResponse.json({ data: { summary: await getOccurrencePaymentSummaryForUser(session.user.id, occurrenceId) } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { if (error instanceof PaymentInputError) return errorResponse(error); throw error; }
}

export async function POST(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const result = await recordPaymentForUser(session.user.id, id, await request.json());
    return NextResponse.json({ data: result }, { status: result.duplicate ? 200 : 201 });
  } catch (error: unknown) { if (error instanceof PaymentInputError) return errorResponse(error); throw error; }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reversePaymentForUser, PaymentInputError } from "@/lib/payments";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
function errorResponse(error: PaymentInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function POST(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json() as { idempotencyKey?: unknown };
    if (typeof body.idempotencyKey !== "string") throw new PaymentInputError("PAYMENT_INPUT_INVALID", "Idempotency key is required.");
    return NextResponse.json({ data: await reversePaymentForUser(session.user.id, id, body.idempotencyKey) });
  } catch (error: unknown) { if (error instanceof PaymentInputError) return errorResponse(error); throw error; }
}

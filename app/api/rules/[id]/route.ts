import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasTrustedOrigin } from "@/lib/request-origin";
import { requireLocalOperator, OperationsAccessError } from "@/lib/operations";
import { supersedeRuleForOperator, transitionRuleForOperator, updateRuleDraftForOperator, RuleInputError, type RuleInput } from "@/lib/rules";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
function errorResponse(error: RuleInputError | OperationsAccessError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status, headers: { "Cache-Control": "no-store" } }); }
function revision(value: unknown): number { if (!Number.isInteger(value) || Number(value) < 1) throw new RuleInputError("RULE_REVISION_REQUIRED", "Supply the current revision.", 409); return Number(value); }

export async function PATCH(request: Request, context: Context) {
  if (!hasTrustedOrigin(request)) return errorResponse(new RuleInputError("ORIGIN_REQUIRED", "Same origin required.", 403));
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { await requireLocalOperator(session.user.id); const { id } = await context.params; const body = await request.json(); return NextResponse.json({ data: { rule: await updateRuleDraftForOperator(session.user.id, id, body, revision(body?.revision)) } }); }
  catch (error: unknown) { if (error instanceof RuleInputError || error instanceof OperationsAccessError) return errorResponse(error); throw error; }
}

export async function POST(request: Request, context: Context) {
  if (!hasTrustedOrigin(request)) return errorResponse(new RuleInputError("ORIGIN_REQUIRED", "Same origin required.", 403));
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    await requireLocalOperator(session.user.id);
    const { id } = await context.params;
    const body = await request.json() as { action?: string; input?: Record<string, unknown>; revision?: number };
    const expected = revision(body.revision);
    if (body.action === "supersede") return NextResponse.json({ data: { rule: await supersedeRuleForOperator(session.user.id, id, (body.input ?? {}) as RuleInput, expected) } }, { status: 201 });
    if (!["submit", "publish", "expire", "retire"].includes(body.action ?? "")) throw new RuleInputError("RULE_ACTION_INVALID", "Rule action is invalid.");
    return NextResponse.json({ data: { rule: await transitionRuleForOperator(session.user.id, id, body.action as "submit" | "publish" | "expire" | "retire", expected) } });
  } catch (error: unknown) { if (error instanceof RuleInputError || error instanceof OperationsAccessError) return errorResponse(error); throw error; }
}

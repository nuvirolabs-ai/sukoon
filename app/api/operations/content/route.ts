import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasTrustedOrigin } from "@/lib/request-origin";
import { listRulesForOperator, createRuleDraftForOperator, updateRuleDraftForOperator, transitionRuleForOperator, RuleInputError, type RuleInput } from "@/lib/rules";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  try { return NextResponse.json({ data: await listRulesForOperator(session.user.id) }, { headers }); }
  catch (error) { if (error instanceof RuleInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status, headers }); throw error; }
}
export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403, headers });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") throw new RuleInputError("RULE_INPUT_INVALID", "Invalid input.");
    if (body.action === "create") return NextResponse.json({ data: await createRuleDraftForOperator(session.user.id, body.input as RuleInput) }, { status: 201, headers });
    if (typeof body.id !== "string" || !Number.isInteger(body.revision) || body.revision < 1) throw new RuleInputError("RULE_REVISION_REQUIRED", "Refresh and supply the current revision.", 409);
    if (body.action === "edit") return NextResponse.json({ data: await updateRuleDraftForOperator(session.user.id, body.id, body.input, body.revision) }, { headers });
    if (!["submit", "publish", "retire", "expire"].includes(body.action)) throw new RuleInputError("RULE_ACTION_INVALID", "Invalid action.");
    return NextResponse.json({ data: await transitionRuleForOperator(session.user.id, body.id, body.action, body.revision) }, { headers });
  } catch (error) { if (error instanceof RuleInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status, headers }); if (error instanceof SyntaxError || error instanceof TypeError) return NextResponse.json({ error: { code: "RULE_INPUT_INVALID" } }, { status: 400, headers }); throw error; }
}

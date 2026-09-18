import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasTrustedOrigin } from "@/lib/request-origin";
import { downloadAccountExport, requestAccountExport } from "@/lib/account-export";
import { PrivacyRequestError } from "@/lib/privacy-requests";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
type Context = { params: Promise<{ id: string }> };
function failure(error: unknown) { return NextResponse.json({ error: { code: error instanceof PrivacyRequestError ? error.code : "ACCOUNT_EXPORT_UNAVAILABLE" } }, { status: error instanceof PrivacyRequestError ? error.status : error instanceof SyntaxError ? 400 : 503, headers }); }
export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  try { const bytes = await downloadAccountExport(session.user.id, (await context.params).id); return new Response(bytes as BodyInit, { headers: { ...headers, "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="sukoon-account-records.zip"' } }); } catch (error) { return failure(error); }
}
export async function POST(request: Request, context: Context) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403, headers });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED" } }, { status: 401, headers });
  try { const body = await request.json(); return NextResponse.json({ data: await requestAccountExport(session.user.id, (await context.params).id, { confirmed: body?.confirmed === true, scope: body?.scope, expiresAt: body?.expiresAt }) }, { status: 202, headers }); } catch (error) { return failure(error); }
}

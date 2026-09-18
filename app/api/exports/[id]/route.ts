import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ExportInputError, getExportPackageForUser } from "@/lib/exports";

export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { return NextResponse.json({ data: await getExportPackageForUser(session.user.id, (await context.params).id) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error: unknown) { if (error instanceof ExportInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

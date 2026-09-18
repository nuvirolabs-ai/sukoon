import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createExportPackageForUser, ExportInputError, listExportPackagesForUser } from "@/lib/exports";

export const runtime = "nodejs";
function errorResponse(error: ExportInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse(new ExportInputError("AUTHENTICATION_REQUIRED", "Sign in required.", 401));
  return NextResponse.json({ data: { exports: await listExportPackagesForUser(session.user.id) } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse(new ExportInputError("AUTHENTICATION_REQUIRED", "Sign in required.", 401));
  try { return NextResponse.json({ data: await createExportPackageForUser(session.user.id, await request.json()) }, { status: 201 }); }
  catch (error: unknown) { if (error instanceof ExportInputError) return errorResponse(error); throw error; }
}

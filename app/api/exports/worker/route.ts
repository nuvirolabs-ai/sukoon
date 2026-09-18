import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runExportWorkerOnce } from "@/lib/exports";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  return NextResponse.json({ data: await runExportWorkerOnce(`local-export-worker:${session.user.id}`) });
}

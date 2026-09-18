import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runSharedOperationWorkerOnce } from "@/lib/sharing";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  void session;
  const result = await runSharedOperationWorkerOnce(`shared-api-${Date.now()}`);
  return NextResponse.json({ data: { result, note: "Local worker boundary only; no external provider was called." } });
}

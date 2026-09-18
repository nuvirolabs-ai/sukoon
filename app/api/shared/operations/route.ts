import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startSharedDocumentOperationForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { const body = await request.json() as { shareId?: unknown; propertyId?: unknown; documentId?: unknown }; if (typeof body.shareId !== "string" || typeof body.propertyId !== "string" || typeof body.documentId !== "string") throw new SharingInputError("OPERATION_INPUT_INVALID", "Share, property, and document are required."); return NextResponse.json({ data: { operation: await startSharedDocumentOperationForUser(session.user.id, body.shareId, body.propertyId, body.documentId) } }, { status: 202 }); }
  catch (error: unknown) { if (error instanceof SharingInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

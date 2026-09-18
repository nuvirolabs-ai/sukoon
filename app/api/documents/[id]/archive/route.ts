import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { archiveDocumentForUser, VaultInputError } from "@/lib/vault-repository";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: { code: "STORAGE_PROVIDER_UNAVAILABLE", message: "Private object storage is not configured outside local development." } }, { status: 503 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const { id } = await context.params;
  try { return NextResponse.json({ data: await archiveDocumentForUser(session.user.id, id) }); }
  catch (error: unknown) { if (error instanceof VaultInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

import { documentDisposition } from "@/lib/document-disposition";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSharedDocumentBytesForUser, getSharedDocumentMetadataForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    if (new URL(request.url).searchParams.get("metadata") === "true") return NextResponse.json({ data: { document: await getSharedDocumentMetadataForUser(session.user.id, id) } }, { headers: { "Cache-Control": "no-store" } });
    const document = await getSharedDocumentBytesForUser(session.user.id, id);
    return new NextResponse(Buffer.from(document.bytes), { headers: { "Content-Type": document.mimeType, "Content-Disposition": documentDisposition("inline", document.name), "Cache-Control": "private, no-store", "X-Content-SHA256": document.sha256 } });
  } catch (error: unknown) { if (error instanceof SharingInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

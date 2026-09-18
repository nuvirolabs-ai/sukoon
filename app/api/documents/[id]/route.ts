import { documentDisposition } from "@/lib/document-disposition";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readStateForUser } from "@/lib/repository";
import { getDocumentDetailsForUser, getProtectedDocumentBytes, deleteDocumentForUser, VaultInputError, VaultStorageError } from "@/lib/vault-repository";
import { getWorkspaceForUser } from "@/lib/repository";
import { getSharedDocumentBytesForUser, getSharedDocumentMetadataForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function currentSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return errorResponse("STORAGE_PROVIDER_UNAVAILABLE", "Private object storage is not configured outside local development.", 503);
  const session = await currentSession(request);
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  const { id } = await context.params;
  try {
    if (!(await getWorkspaceForUser(session.user.id))) {
      if (new URL(request.url).searchParams.get("metadata") === "true") return NextResponse.json({ data: { document: await getSharedDocumentMetadataForUser(session.user.id, id) } }, { headers: { "Cache-Control": "no-store" } });
      const document = await getSharedDocumentBytesForUser(session.user.id, id);
      const disposition = new URL(request.url).searchParams.get("download") === "true" ? "attachment" : "inline";
      return new NextResponse(Buffer.from(document.bytes), { headers: { "Content-Type": document.mimeType, "Content-Disposition": documentDisposition(disposition, document.name), "Cache-Control": "private, no-store", "X-Content-SHA256": document.sha256 } });
    }
    if (new URL(request.url).searchParams.get("metadata") === "true") {
      return NextResponse.json({ data: await getDocumentDetailsForUser(session.user.id, id) }, { headers: { "Cache-Control": "no-store" } });
    }
    const document = await getProtectedDocumentBytes(session.user.id, id, undefined, new URL(request.url).searchParams.get("versionId") ?? undefined);
    const disposition = new URL(request.url).searchParams.get("download") === "true" ? "attachment" : "inline";
    return new NextResponse(Buffer.from(document.bytes), { headers: { "Content-Type": document.mimeType, "Content-Disposition": documentDisposition(disposition, document.name), "Cache-Control": "private, no-store", "X-Content-SHA256": document.sha256 } });
  } catch (error: unknown) {
    if (error instanceof VaultInputError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof VaultStorageError) return errorResponse("STORAGE_INTEGRITY_FAILURE", error.message, 503);
    if (error instanceof SharingInputError) return errorResponse(error.code, error.message, error.status);
    throw error;
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return errorResponse("STORAGE_PROVIDER_UNAVAILABLE", "Private object storage is not configured outside local development.", 503);
  const session = await currentSession(request);
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  const { id } = await context.params;
  try {
    const result = await deleteDocumentForUser(session.user.id, id);
    const durable = await readStateForUser(session.user.id);
    return NextResponse.json({ data: { state: durable.state, version: durable.version, deleted: true, jobVersion: result.version } });
  } catch (error: unknown) {
    if (error instanceof VaultInputError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof VaultStorageError) return errorResponse("STORAGE_PROVIDER_UNAVAILABLE", error.message, 503);
    throw error;
  }
}

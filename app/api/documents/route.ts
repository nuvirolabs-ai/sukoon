import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readStateForUser } from "@/lib/repository";
import { createDocumentForUser, listDocumentsForUser, listPurchaseDocumentsForUser, VaultInputError, VaultStorageError } from "@/lib/vault-repository";
import { getWorkspaceForUser } from "@/lib/repository";
import { listSharedDocumentsForUser, SharingInputError } from "@/lib/sharing";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  const url = new URL(request.url);
  const propertyId = url.searchParams.get("propertyId");
  const candidateId = url.searchParams.get("purchaseCandidateId");
  if (candidateId) {
    if (propertyId) return errorResponse("INVALID_CONTEXT", "Select one document context.", 400);
    try { return NextResponse.json({ data: { documents: await listPurchaseDocumentsForUser(session.user.id, candidateId) } }, { headers: { "Cache-Control": "private, no-store" } }); }
    catch (error) { if (error instanceof VaultInputError) return errorResponse(error.code, error.message, error.status); throw error; }
  }
  if (!propertyId) return errorResponse("PROPERTY_REQUIRED", "A property is required.", 400);
  try {
    if (!(await getWorkspaceForUser(session.user.id))) return NextResponse.json({ data: { documents: await listSharedDocumentsForUser(session.user.id, propertyId) } }, { headers: { "Cache-Control": "no-store" } });
    const documents = await listDocumentsForUser(session.user.id, propertyId, url.searchParams.get("includeArchived") === "true");
    return NextResponse.json({ data: { documents } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    if (error instanceof VaultInputError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof SharingInputError) return errorResponse(error.code, error.message, error.status);
    throw error;
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return errorResponse("STORAGE_PROVIDER_UNAVAILABLE", "Private object storage is not configured outside local development.", 503);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse("AUTHENTICATION_REQUIRED", "Sign in required.", 401);
  let form: FormData;
  try { form = await request.formData(); } catch { return errorResponse("INVALID_UPLOAD", "A multipart file upload is required.", 400); }
  const propertyId = form.get("propertyId");
  const purchaseCandidateId = form.get("purchaseCandidateId");
  const category = form.get("type");
  const file = form.get("file");
  if ((typeof propertyId === "string" && !!propertyId) === (typeof purchaseCandidateId === "string" && !!purchaseCandidateId)) return errorResponse("CONTEXT_REQUIRED", "Select exactly one property or purchase candidate.", 400);
  if (typeof category !== "string") return errorResponse("INVALID_DOCUMENT_TYPE", "Choose a supported document category.", 400);
  if (!(file instanceof File)) return errorResponse("INVALID_UPLOAD", "Choose a PDF, JPEG, or PNG file.", 400);
  try {
    const result = await createDocumentForUser({
      userId: session.user.id,
      propertyId: typeof propertyId === "string" ? propertyId : null,
      purchaseCandidateId: typeof purchaseCandidateId === "string" ? purchaseCandidateId : null,
      category,
      subtype: typeof form.get("subtype") === "string" ? String(form.get("subtype")) : undefined,
      displayName: typeof form.get("displayName") === "string" ? String(form.get("displayName")) : undefined,
      idempotencyKey: request.headers.get("Idempotency-Key") || (typeof form.get("idempotencyKey") === "string" ? String(form.get("idempotencyKey")) : ""),
      replaceDocumentId: typeof form.get("replaceDocumentId") === "string" && String(form.get("replaceDocumentId")) ? String(form.get("replaceDocumentId")) : undefined,
      filename: file.name,
      mimeType: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    const durable = await readStateForUser(session.user.id);
    return NextResponse.json({ data: { document: result.document, state: durable.state, version: durable.version, duplicate: result.duplicate } }, { status: result.duplicate ? 200 : 201 });
  } catch (error: unknown) {
    if (error instanceof VaultInputError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof VaultStorageError) return errorResponse("STORAGE_PROVIDER_UNAVAILABLE", error.message, 503);
    throw error;
  }
}

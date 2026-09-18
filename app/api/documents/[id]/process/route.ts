import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { queueDocumentStageForUser } from "@/lib/document-processing";
import { VaultInputError } from "@/lib/vault-repository";
import { ProcessingWithdrawnError } from "@/lib/processing-consent";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403 });
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: { code: "WORKER_PROVIDER_UNAVAILABLE", message: "Document processing is not configured outside local development." } }, { status: 503 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const stage = body && typeof body === "object" && "stage" in body && typeof body.stage === "string" ? body.stage : "scan";
  if (!(["scan", "parse", "ocr", "extract"] as string[]).includes(stage)) return NextResponse.json({ error: { code: "INVALID_PROCESSING_STAGE", message: "Choose scan, parse, OCR, or extract." } }, { status: 400 });
  try {
    const retryKey = body && typeof body === "object" && "retryKey" in body ? body.retryKey : undefined;
    if (retryKey !== undefined && typeof retryKey !== "string") return NextResponse.json({ error: { code: "INVALID_RETRY" } }, { status: 400 });
    const result = await queueDocumentStageForUser({ userId: session.user.id, documentId: id, stage: stage as "scan" | "parse" | "ocr" | "extract", retryKey });
    return NextResponse.json({ data: { jobId: result.job.id, status: result.job.status, duplicate: result.duplicate, stage } }, { status: result.duplicate ? 200 : 202 });
  } catch (error: unknown) {
    if (error instanceof VaultInputError || error instanceof ProcessingWithdrawnError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    throw error;
  }
}

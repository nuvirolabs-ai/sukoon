import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { confirmManualDocumentReview, getReviewForUser, reviewProposalForUser, ReviewInputError, type ReviewAction } from "@/lib/document-review";
import { VaultInputError } from "@/lib/vault-repository";
import { ProcessingWithdrawnError } from "@/lib/processing-consent";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try { return NextResponse.json({ data: await getReviewForUser(session.user.id, (await context.params).id) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error: unknown) { if (error instanceof ReviewInputError || error instanceof VaultInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: { code: "INVALID_REVIEW", message: "A review action is required." } }, { status: 400 }); }
  try {
    if (body.action === "manual_confirm") {
      if (!Number.isInteger(body.documentVersion) || typeof body.category !== "string") return NextResponse.json({ error: { code: "INVALID_REVIEW", message: "Document version and category are required." } }, { status: 400 });
      return NextResponse.json({ data: await confirmManualDocumentReview({ userId: session.user.id, documentId: (await context.params).id, documentVersion: body.documentVersion as number, category: body.category }) });
    }
    const result = await reviewProposalForUser({ userId: session.user.id, documentId: (await context.params).id, proposalId: typeof body.proposalId === "string" ? body.proposalId : "", action: body.action as ReviewAction, value: body.value, propertyVersion: typeof body.propertyVersion === "number" ? body.propertyVersion : undefined });
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    if (error instanceof ReviewInputError || error instanceof VaultInputError || error instanceof ProcessingWithdrawnError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    throw error;
  }
}

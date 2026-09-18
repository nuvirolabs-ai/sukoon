import { NextResponse } from "next/server";
import { requirePrincipal, AuthorizationError } from "@/lib/authz";
import { previewPurchaseImport } from "@/lib/purchase-import-preview";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const principal = await requirePrincipal(request);
    if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: { code: "ORIGIN_REQUIRED" } }, { status: 403 });
    let input: unknown;
    try { input = await request.json(); } catch { input = null; }
    if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ error: { code: "IMPORT_SELECTION_INVALID" } }, { status: 400 });
    return NextResponse.json({ data: await previewPurchaseImport(principal, input as Record<string, unknown>) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    throw error;
  }
}

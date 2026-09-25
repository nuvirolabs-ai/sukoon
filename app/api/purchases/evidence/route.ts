import { requirePrincipal, AuthorizationError } from "@/lib/authz";
import { hasTrustedOrigin } from "@/lib/request-origin";
import { purchaseEvidence, recordPurchaseEvidence } from "@/lib/purchase-evidence";
export const runtime = "nodejs";
async function handle(request: Request) {
  try {
    const principal = await requirePrincipal(request);
    if (request.method === "GET") return Response.json({ data: await purchaseEvidence(principal, new URL(request.url).searchParams.get("candidateId") ?? "") }, { headers: { "Cache-Control": "private, no-store" } });
    if (!hasTrustedOrigin(request)) return Response.json({ error: { message: "Same-origin request required." } }, { status: 403 });
    let input; try { input = await request.json(); } catch { return Response.json({ error: { message: "Invalid JSON." } }, { status: 400 }); }
    if (!input || typeof input !== "object" || Array.isArray(input)) return Response.json({ error: { message: "Object required." } }, { status: 400 });
    return Response.json({ data: await recordPurchaseEvidence(principal, input) });
  } catch (error) { if (error instanceof AuthorizationError) return Response.json({ error: { message: error.message } }, { status: error.status }); throw error; }
}
export const GET = handle;
export const POST = handle;

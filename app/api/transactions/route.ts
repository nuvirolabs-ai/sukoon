import { requirePrincipal, AuthorizationError } from "@/lib/authz";
import { buyerStory, sellerStory, transactionCommand } from "@/lib/transactions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, (_key, value) => typeof value === "bigint" ? value.toString() : value), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });

async function principal(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new AuthorizationError("AUTHENTICATION_REQUIRED", 401, "Sign in required.");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "owner") throw new AuthorizationError("TRANSACTION_ACCESS_DENIED", 403, "Transaction access denied.");
  return requirePrincipal(request);
}

export async function GET(request: Request) {
  try {
    const actor = await principal(request);
    const url = new URL(request.url);
    if (url.searchParams.get("saleId")) return json({ data: await sellerStory(actor, url.searchParams.get("saleId")!) });
    const candidateId = url.searchParams.get("candidateId");
    if (!candidateId) return json({ error: { message: "Choose a purchase or sale." } }, 400);
    return json({ data: await buyerStory(actor, candidateId) });
  } catch (error) {
    if (error instanceof AuthorizationError) return json({ error: { code: error.code, message: error.message } }, error.status);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: { message: "Same-origin request required." } }, 403);
    const actor = await principal(request);
    let input: unknown;
    try { input = await request.json(); } catch { return json({ error: { message: "Invalid JSON." } }, 400); }
    if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: { message: "Object required." } }, 400);
    return json({ data: await transactionCommand(actor, input as Record<string, unknown>) });
  } catch (error) {
    if (error instanceof AuthorizationError) return json({ error: { code: error.code, message: error.message } }, error.status);
    throw error;
  }
}

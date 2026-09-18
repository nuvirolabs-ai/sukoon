import { requirePrincipal, AuthorizationError } from "@/lib/authz";
import { purchaseCommand, purchaseSnapshot } from "@/lib/purchases";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, (_key, value) => typeof value === "bigint" ? value.toString() : value), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });
async function handle(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new AuthorizationError("AUTHENTICATION_REQUIRED", 401, "Sign in required.");
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== "owner") throw new AuthorizationError("PURCHASE_ACCESS_DENIED", 403, "Purchase access denied.");
    if (request.method === "GET") {
      const workspace = await prisma.workspace.findUnique({ where: { ownerUserId: session.user.id }, select: { id: true } });
      const id = new URL(request.url).searchParams.get("id") ?? undefined;
      if (!workspace) { if (id) throw new AuthorizationError("PURCHASE_NOT_FOUND", 404, "Purchase not found."); return json({ data: [] }); }
      return json({ data: await purchaseSnapshot(await requirePrincipal(request), id) });
    }
    if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: { message: "Same-origin request required." } }, 403);
    let input: unknown; try { input = await request.json(); } catch { return json({ error: { message: "Invalid JSON." } }, 400); }
    if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: { message: "Object required." } }, 400);
    // A new buyer needs an account container, never a fabricated owned property.
    if ((input as Record<string, unknown>).action === "create-workspace") await prisma.workspace.upsert({ where: { ownerUserId: session.user.id }, update: {}, create: { id: randomUUID(), ownerUserId: session.user.id, name: "My Sukoon workspace" } });
    const principal = await requirePrincipal(request);
    return json({ data: await purchaseCommand(principal, input as Record<string, unknown>) });
  } catch (error) { if (error instanceof AuthorizationError) return json({ error: { code: error.code, message: error.message } }, error.status); throw error; }
}
export const GET = handle;
export const POST = handle;

import { requirePrincipal, AuthorizationError } from "@/lib/authz";
import { sellerStory } from "@/lib/transactions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, (_key, value) => typeof value === "bigint" ? value.toString() : value), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new AuthorizationError("AUTHENTICATION_REQUIRED", 401, "Sign in required.");
    const actor = await requirePrincipal(request);
    const id = new URL(request.url).searchParams.get("id");
    if (id) return json({ data: await sellerStory(actor, id) });
    const sales = await prisma.saleWorkspace.findMany({ where: { workspaceId: actor.workspaceId }, include: { property: { select: { name: true } }, prospects: { select: { id: true } } }, orderBy: { createdAt: "desc" } });
    return json({ data: sales.map((sale) => ({ id: sale.id, propertyName: sale.property.name, phase: sale.phase, askingPricePaise: sale.askingPricePaise, prospects: sale.prospects.length })) });
  } catch (error) {
    if (error instanceof AuthorizationError) return json({ error: { code: error.code, message: error.message } }, error.status);
    throw error;
  }
}

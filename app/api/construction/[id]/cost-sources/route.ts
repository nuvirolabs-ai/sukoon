import { auth } from "@/lib/auth";
import { ConstructionError, getConstructionForUser } from "@/lib/construction";
import { prisma } from "@/lib/prisma";
import { getWorkspaceForUser } from "@/lib/repository";
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    return Response.json(
      { error: { message: "Sign in required." } },
      { status: 401 },
    );
  try {
    const p = await getConstructionForUser(
      session.user.id,
      (await ctx.params).id,
    );
    const w = await getWorkspaceForUser(session.user.id);
    if (!p.owner || !w)
      throw new ConstructionError(
        "CONSTRUCTION_NOT_FOUND",
        "Construction record not found.",
        404,
      );
    const invoices = await prisma.obligation.findMany({
      where: {
        workspaceId: w.id,
        propertyId: p.propertyId,
        direction: "PAYABLE",
        currency: "INR",
      },
      select: { id: true, label: true },
    });
    const payments = await prisma.expenseLedgerEntry.findMany({
      where: {
        workspaceId: w.id,
        propertyId: p.propertyId,
        entryType: "OBLIGATION_PAYMENT",
        payment: { status: "RECORDED", reversalOfId: null },
      },
      select: { id: true, amountPaise: true, createdAt: true },
    });
    return Response.json(
      {
        data: {
          invoices: invoices.map((i) => ({ value: i.id, label: i.label })),
          payments: payments.map((p) => ({
            value: p.id,
            label: `₹${Number(p.amountPaise) / 100} · ${p.createdAt.toISOString().slice(0, 10)}`,
          })),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof ConstructionError)
      return Response.json(
        { error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    throw e;
  }
}

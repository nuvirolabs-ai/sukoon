import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ensureWorkspace, readStateForUser, replaceStateForUser, StateVersionConflict } from "@/lib/repository";
import { emptyState } from "@/lib/store";

const ownerId = "db-foundation-owner";
const otherId = "db-foundation-other";

beforeAll(async () => {
  await prisma.user.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.user.createMany({ data: [
    { id: ownerId, name: "Owner", email: "db-owner@example.com", emailVerified: true },
    { id: otherId, name: "Other", email: "db-other@example.com", emailVerified: true },
  ] });
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.outboxEvent.deleteMany();
});

describe("S02 PostgreSQL foundation", () => {
  it("persists an owned property and exact minor-unit money", async () => {
    const state = emptyState();
    state.lang = "hi";
    state.referralCode = "LOCAL-OWNER";
    state.properties.push({ id: "property-owner-1", name: "Owner home", type: "flat", city: "Pune", area: "Kothrud", address: "Private address", ownerName: "Owner", createdAt: new Date().toISOString(), purchaseValue: 1250.5 });
    state.bills.push({ id: "bill-owner-1", propertyId: "property-owner-1", type: "Property tax", title: "Tax", amount: 1250.5, dueDate: "2026-10-01", status: "pending" });

    const saved = await replaceStateForUser(ownerId, state, 0);
    expect(saved.state.properties).toHaveLength(1);
    expect(saved.state.bills[0]?.amount).toBe(1250.5);
    expect(saved.state.lang).toBe("hi");
    expect(saved.state.referralCode).toBe("LOCAL-OWNER");
    expect(await prisma.property.findUnique({ where: { id: "property-owner-1" }, select: { purchaseValuePaise: true } })).toMatchObject({ purchaseValuePaise: BigInt(125050) });
    expect(await prisma.bill.findUnique({ where: { id: "bill-owner-1" }, select: { amountPaise: true } })).toMatchObject({ amountPaise: BigInt(125050) });
  });

  it("does not expose owner records to another workspace and protects versions", async () => {
    const other = await readStateForUser(otherId);
    expect(other.state.properties).toEqual([]);
    expect(other.state.bills).toEqual([]);
    await expect(replaceStateForUser(ownerId, emptyState(), 0)).rejects.toBeInstanceOf(StateVersionConflict);
  });

  it("rejects a cross-workspace child insert at the database foreign key", async () => {
    const ownerWorkspace = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: ownerId } });
    const otherWorkspace = await ensureWorkspace(otherId);
    await expect(prisma.bill.create({ data: { id: "cross-workspace-bill", workspaceId: otherWorkspace.id, propertyId: "property-owner-1", type: "Property tax", title: "Should fail", amountPaise: BigInt(100), dueDate: "2026-10-01", status: "pending" } })).rejects.toThrow();
    expect(ownerWorkspace.id).not.toBe(otherWorkspace.id);
  });
});

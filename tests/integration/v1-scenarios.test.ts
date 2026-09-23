import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { CONSTRUCTION_POPULATE_NAMESPACE, CONSTRUCTION_POPULATE_RECORDED_PAISE, runConstructionPopulate } from "@/lib/construction-populate";
import { TRANSACTION_DEMO_NAMESPACE, runTransactionSeed } from "@/lib/transaction-seed";
import { dealProjection, transactionCommand } from "@/lib/transactions";
import type { Principal } from "@/lib/authz";

const ownerId = randomUUID();
const otherId = randomUUID();
const email = `v1-review-${ownerId}@sukoon.local`;
const workspaceId = randomUUID();
const otherWorkspaceId = randomUUID();
const principal: Principal = { userId: ownerId, workspaceId, email, role: "owner" };
const other: Principal = { userId: otherId, workspaceId: otherWorkspaceId, email: `other-${otherId}@example.com`, role: "owner" };

const constructionEnv = {
  APP_ENV: "staging",
  NODE_ENV: "production",
  SUKOON_RUNTIME_PROFILE: "STAGING",
  SUKOON_CONSTRUCTION_POPULATE_CONFIRMATION: CONSTRUCTION_POPULATE_NAMESPACE,
  SUKOON_STAGING_REVIEW_EMAIL: email,
  DATABASE_URL: "postgresql://localhost/sukoon_demo_staging",
};
const transactionEnv = {
  ...constructionEnv,
  SUKOON_TRANSACTION_DEMO_CONFIRMATION: TRANSACTION_DEMO_NAMESPACE,
};

beforeAll(async () => {
  await prisma.user.create({ data: { id: ownerId, email, name: "Synthetic review owner", emailVerified: true, role: "owner" } });
  await prisma.workspace.create({ data: { id: workspaceId, ownerUserId: ownerId, name: "Synthetic review workspace" } });
  await prisma.user.create({ data: { id: otherId, email: other.email, name: "Ordinary account", emailVerified: true, role: "owner" } });
  await prisma.workspace.create({ data: { id: otherWorkspaceId, ownerUserId: otherId, name: "Ordinary workspace" } });
  await prisma.property.create({ data: { id: randomUUID(), workspaceId, name: "Super Corridor Plot", type: "plot", city: "Indore", area: "Super Corridor", address: "Synthetic Super Corridor", ownerName: "Aarav Mehta", areaValue: "2400", areaUnit: "sqft", status: "active" } });
  await prisma.property.create({ data: { id: randomUUID(), workspaceId, name: "Palm Meadows Apartment", type: "flat", city: "Indore", area: "Palm Meadows", address: "Synthetic Palm Meadows", ownerName: "Aarav Mehta", areaValue: "1450", areaUnit: "sqft", status: "active" } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
});

it("creates one Mehta Residence and does not duplicate it or its costs on a second apply", async () => {
  const first = await runConstructionPopulate({ operation: "apply", env: constructionEnv, testOnly: true, anchorDate: "2026-09-23" });
  expect(first.conflicts, first.conflicts.join(",")).toEqual([]);
  expect(first.money.recordedSpendPaise).toBe(CONSTRUCTION_POPULATE_RECORDED_PAISE.toString());
  expect(first.money.progressPercent).not.toBe(31);
  const projectId = first.projectId!;
  const costs = await prisma.constructionCost.count({ where: { projectId } });
  const docs = await prisma.propertyDoc.count({ where: { workspaceId } });
  const second = await runConstructionPopulate({ operation: "apply", env: constructionEnv, testOnly: true });
  expect(second.conflicts, second.conflicts.join(",")).toEqual([]);
  expect(await prisma.constructionProject.count({ where: { workspaceId, name: "Mehta Residence", archivedAt: null } })).toBe(1);
  expect(await prisma.constructionCost.count({ where: { projectId } })).toBe(costs);
  expect(await prisma.propertyDoc.count({ where: { workspaceId } })).toBe(docs);
  expect(second.money.recordedSpendPaise).toBe(CONSTRUCTION_POPULATE_RECORDED_PAISE.toString());
  expect(second.money.approvedChangePaise).toBe("18200000");
  expect(second.money.outstandingCommitmentPaise).toBe("15200000");
  const cement = await prisma.constructionIssue.findFirst({ where: { projectId, title: "Cement delivery shortage" } });
  expect(cement?.status).toBe("OPEN");
  const electrical = await prisma.constructionDecision.findFirst({ where: { projectId, title: "Electrical layout approval" } });
  expect(electrical?.status).toBe("OPEN");
  const flooring = await prisma.constructionChange.findFirst({ where: { projectId, title: "Bedroom flooring upgrade" } });
  expect(flooring?.status).toBe("APPROVED");
  expect(flooring?.estimatedCostImpactPaise).toBe(18200000n);
  const inspection = await prisma.constructionInspection.findFirst({ where: { projectId, title: "Reinforcement inspection" } });
  expect(inspection?.status).toBe("SCHEDULED");
  const invoice = await prisma.constructionCommitment.findFirst({ where: { projectId, title: "Contractor invoice — Ravi Buildcon" } });
  expect(invoice?.status).toBe("DRAFT");
  expect(await prisma.supplierQuote.count({ where: { projectId, supplierName: { startsWith: "Steel Supplier" } } })).toBe(3);
  expect(await prisma.constructionProject.count({ where: { workspaceId: otherWorkspaceId } })).toBe(0);
}, 120000);

it("seeds the three transaction scenes once and keeps a second apply from adding offers or payments", async () => {
  const first = await runTransactionSeed({ operation: "apply", env: transactionEnv, testOnly: true, anchorDate: "2026-09-23" });
  expect(first.conflicts, first.conflicts.join(",")).toEqual([]);
  expect(first.checks.filter((check) => check.status !== "PASS").map((check) => `${check.id}:${check.detail}`)).toEqual([]);
  const buy = await prisma.purchaseCandidate.findFirstOrThrow({ where: { workspaceId, name: "Riverfront Residency — Unit 1204" } });
  expect(buy.linkedPropertyId).toBeNull();
  expect(await prisma.offerRevision.count({ where: { candidateId: buy.id } })).toBe(3);
  expect(await prisma.transactionMoneyRecord.count({ where: { candidateId: buy.id } })).toBe(0);
  const lake = await prisma.purchaseCandidate.findFirstOrThrow({ where: { workspaceId, name: "Lakeview Apartment — Unit 502" } });
  const handoverMoney = await prisma.transactionMoneyRecord.findMany({ where: { candidateId: lake.id } });
  expect(handoverMoney.reduce((sum, row) => sum + (row.kind === "POSTED" ? row.amountPaise : -row.amountPaise), 0n)).toBe(30000000n);
  const offers = await prisma.offerRevision.count({ where: { workspaceId } });
  const payments = await prisma.transactionMoneyRecord.count({ where: { workspaceId } });
  const second = await runTransactionSeed({ operation: "apply", env: transactionEnv, testOnly: true });
  expect(second.conflicts).toEqual([]);
  expect(second.checks.every((check) => check.status === "PASS")).toBe(true);
  expect(await prisma.offerRevision.count({ where: { workspaceId } })).toBe(offers);
  expect(await prisma.transactionMoneyRecord.count({ where: { workspaceId } })).toBe(payments);
  expect(await prisma.purchaseCandidate.count({ where: { workspaceId: otherWorkspaceId } })).toBe(0);
  await expect(transactionCommand(principal, { action: "link-passport", candidateId: buy.id, requestKey: `passport-${randomUUID()}`, confirmed: false })).rejects.toThrow(/CONFIRMATION|Passport/i);
  const sale = await prisma.saleWorkspace.findFirstOrThrow({ where: { workspaceId }, include: { prospects: true } });
  expect(sale.prospects).toHaveLength(2);
  const room = await prisma.dealRoom.findFirst({ where: { workspaceId, subjectId: sale.id } });
  expect(await dealProjection(otherId, room?.id ?? "missing")).toBeNull();
}, 120000);

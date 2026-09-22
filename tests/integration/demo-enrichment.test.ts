import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createPropertyForUser } from "@/lib/property-repository";
import { createConstructionForUser } from "@/lib/construction";
import { purchaseCommand } from "@/lib/purchases";
import {
  DEMO_ENRICHMENT_ANCHOR_DATE,
  DEMO_ENRICHMENT_NAMESPACE,
  buildDemoEnrichmentPlan,
  runDemoEnrichment,
} from "@/lib/demo-enrichment";

describe("staging demo enrichment", () => {
  const email = `demo-enrichment-${randomUUID()}@example.com`;
  let ownerId = "";
  let workspaceId = "";

  beforeAll(async () => {
    ownerId = randomUUID();
    await prisma.user.create({ data: { id: ownerId, email, name: "Synthetic Enrichment Owner", emailVerified: true } });
    const workspace = await prisma.workspace.create({ data: { id: randomUUID(), ownerUserId: ownerId, name: "Synthetic enrichment workspace" } });
    workspaceId = workspace.id;
    const propertyInput = (name: string, type: "villa" | "flat" | "plot") => ({
      name,
      type,
      city: "Indore",
      area: `Synthetic ${name}`,
      address: `Synthetic ${name}`,
      jurisdiction: "Synthetic demo jurisdiction",
      areaValue: "2400",
      areaUnit: "sqft",
      areaType: type === "plot" ? "plot" : "built_up",
      ownerName: "Synthetic Enrichment Owner",
      ownershipAssertion: "self_asserted",
      ownershipProvenance: "Synthetic baseline fixture",
      identifiers: [],
    });
    await createPropertyForUser(ownerId, propertyInput("Vijay Nagar House", "villa"));
    await createPropertyForUser(ownerId, propertyInput("Palm Meadows Apartment", "flat"));
    const construction = await createPropertyForUser(ownerId, propertyInput("Super Corridor Plot", "plot"));
    await createConstructionForUser(ownerId, {
      propertyId: construction.property.id,
      name: "Mehta Residence",
      projectType: "NEW_HOME",
      builtUpArea: "3600",
      areaUnit: "sqft",
      floorCount: 2,
      qualityLevel: "STANDARD",
      estimatedBudgetPaise: "1200000000",
      startDate: "2026-01-01",
      targetCompletionDate: "2027-09-12",
      requirements: "Synthetic construction requirements",
      idempotencyKey: randomUUID(),
    });
    const principal = { userId: ownerId, workspaceId, email, role: "owner" as const };
    const purchase = await purchaseCommand(principal, { action: "create-workspace", name: "Riverfront Residency — Unit 1204", requestKey: randomUUID() });
    await purchaseCommand(principal, { action: "add-candidate", purchaseWorkspaceId: purchase.id, name: "Riverfront Residency — Unit 1204", propertyType: "3 BHK Apartment", location: "Synthetic Indore", askingPrice: "15200000", budget: "14000000", stage: "INFORMATION_GATHERING", requestKey: randomUUID() });
  });

  afterAll(async () => {
    if (ownerId) await prisma.user.deleteMany({ where: { id: ownerId } });
  });

  it("adds the deterministic plan, preserves document absence, and is idempotent", async () => {
    const [{ name: actualDatabaseName }] = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    const env = {
      APP_ENV: "staging",
      NODE_ENV: "production",
      SUKOON_RUNTIME_PROFILE: "STAGING",
      SUKOON_DEMO_ENRICHMENT_CONFIRMATION: DEMO_ENRICHMENT_NAMESPACE,
      DATABASE_URL: "postgresql://isolated-test/sukoon_demo_staging",
      SUKOON_STAGING_REVIEW_EMAIL: email,
    };
    const plan = buildDemoEnrichmentPlan(DEMO_ENRICHMENT_ANCHOR_DATE);
    const first = await runDemoEnrichment({ db: prisma, env, actualDatabaseName, testOnly: true, asOf: DEMO_ENRICHMENT_ANCHOR_DATE });
    expect(first.conflicts).toEqual([]);
    expect(first.documentsCreated).toBe(0);
    expect(first.documentsTouched).toBe(false);
    expect(first.created.legacyBills).toBe(plan.legacyBills.length);
    expect(first.created.obligations).toBe(plan.obligations.length);
    expect(first.created.maintenance).toBe(plan.maintenance.length);
    expect(first.created.constructionEvents).toBe(plan.constructionEvents.length);
    expect(first.created.purchaseEntries).toBe(plan.purchaseEntries.length);
    expect(first.created.durableReminders).toBeGreaterThan(0);
    expect(await prisma.propertyDoc.count({ where: { workspaceId } })).toBe(0);

    const enrichedBillCount = await prisma.bill.count({ where: { workspaceId, id: { startsWith: "sukoon-demo-enrichment-v1-" } } });
    const enrichedTimelineCount = await prisma.timelineEvent.count({ where: { workspaceId, id: { startsWith: "sukoon-demo-enrichment-v1-" } } });
    const second = await runDemoEnrichment({ db: prisma, env, actualDatabaseName, testOnly: true, asOf: DEMO_ENRICHMENT_ANCHOR_DATE });
    expect(second.conflicts).toEqual([]);
    expect(second.created).toEqual({});
    expect(second.skipped.legacyBills).toBe(plan.legacyBills.length);
    expect(second.skipped.obligations).toBe(plan.obligations.length);
    expect(second.skipped.maintenance).toBe(plan.maintenance.length);
    expect(second.skipped.constructionEvents).toBe(plan.constructionEvents.length);
    expect(second.skipped.purchaseEntries).toBe(plan.purchaseEntries.length);
    expect(await prisma.bill.count({ where: { workspaceId, id: { startsWith: "sukoon-demo-enrichment-v1-" } } })).toBe(enrichedBillCount);
    expect(await prisma.timelineEvent.count({ where: { workspaceId, id: { startsWith: "sukoon-demo-enrichment-v1-" } } })).toBe(enrichedTimelineCount);
    expect(await prisma.propertyDoc.count({ where: { workspaceId } })).toBe(0);
  }, 30_000);
});

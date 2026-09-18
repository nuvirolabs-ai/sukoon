import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { clearLocalMailbox, readLocalOtp } from "@/lib/auth-mailbox";
import { prisma } from "@/lib/prisma";
import { createPropertyForUser } from "@/lib/property-repository";
import {
  createConstructionForUser,
  getConstructionForUser,
  listConstructionForUser,
  mutateConstructionForUser,
  constructionAnswerForUser,
  type ConstructionView,
} from "@/lib/construction";
import { createObligationForUser } from "@/lib/obligations";
import { recordPaymentForUser } from "@/lib/payments";
import { POST as reversePaymentRoute } from "@/app/api/payments/[id]/reverse/route";
import {
  createShareInvitationForUser,
  acceptShareInvitationForUser,
  revokeShareForUser,
} from "@/lib/sharing";
import { searchForUser } from "@/lib/search";
import { answerAssistantForUser } from "@/lib/assistant";
import { readStateForUser, replaceStateForUser } from "@/lib/repository";
import {
  POST as createRoute,
  GET as listRoute,
} from "@/app/api/construction/route";
import {
  GET as projectRoute,
  POST as mutationRoute,
} from "@/app/api/construction/[id]/route";
import { GET as costsRoute } from "@/app/api/construction/[id]/cost-sources/route";
import { GET as homeRoute } from "@/app/api/home/route";
import { GET as updatesRoute } from "@/app/api/updates/route";
import { materialPricing } from "@/lib/construction-template";

const handlers = toNextJsHandler(auth);
it("shows an empty personal Home, not shared access, for a fresh sandbox account", async () => {
  const fresh = await login(`construction-empty-${randomUUID()}@example.com`);
  const response = await homeRoute(req("/api/home", fresh.cookie));
  expect(response.status).toBe(200);
  const home = (await response.json()).data;
  expect(home.mode).toBe("owner");
  expect(home.properties).toEqual([]);
  expect(home.summary.propertyCount).toBe(0);
  expect(await prisma.workspace.count({ where: { ownerUserId: fresh.id } })).toBe(0);
});
const day = new Date().toISOString().slice(0, 10);
const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
let owner = "",
  other = "",
  architect = "",
  operator = "",
  cookie = "",
  otherCookie = "",
  architectCookie = "";
let property = "",
  otherProperty = "",
  ownerSecondProperty = "",
  doc = "",
  docVersion = "",
  foreignDoc = "",
  foreignVersion = "",
  grant = "";
let p: ConstructionView;
let invoice = "",
  payment = "",
  ledger = "";
const req = (url: string, cookie = "", body?: unknown) =>
  new Request(`http://localhost:3100${url}`, {
    headers: { cookie, "Content-Type": "application/json" },
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
async function login(email: string) {
  await handlers.POST(
    req("/api/auth/email-otp/send-verification-otp", "", {
      email,
      type: "sign-in",
    }),
  );
  const otp = readLocalOtp(email)?.otp;
  expect(otp).toMatch(/^\d{6}$/);
  const r = await handlers.POST(
    req("/api/auth/sign-in/email-otp", "", { email, otp }),
  );
  expect(r.ok).toBe(true);
  return {
    id: (await prisma.user.findUniqueOrThrow({ where: { email } })).id,
    cookie: r.headers.get("set-cookie")!.split(";", 1)[0],
  };
}
function setup(propertyId = property, key = randomUUID()) {
  return {
    propertyId,
    name: "G+2 Residential Home",
    projectType: "NEW_HOME",
    builtUpArea: "3600",
    areaUnit: "sqft",
    floorCount: 3,
    qualityLevel: "STANDARD",
    estimatedBudgetPaise: "1200000000",
    startDate: day,
    targetCompletionDate: "2027-09-12",
    requirements:
      "3 bedrooms, 3 bathrooms, parking and terrace. Owner requirements only.",
    idempotencyKey: key,
  };
}
async function change(action: string, data: Record<string, unknown> = {}) {
  p = await mutateConstructionForUser(owner, p.id, {
    action,
    version: p.version,
    idempotencyKey: randomUUID(),
    ...data,
  });
  return p;
}
async function propertyFor(userId: string, name: string) {
  return (
    await createPropertyForUser(userId, {
      name,
      type: "plot",
      city: "Pune",
      area: "Kothrud",
      address: "Synthetic construction plot",
      jurisdiction: "India / Maharashtra / Pune",
      areaValue: "1200",
      areaUnit: "sqft",
      areaType: "plot",
      ownerName: "Synthetic owner",
      ownershipAssertion: "self_asserted",
      ownershipProvenance: "Owner-entered synthetic construction fixture",
      identifiers: [],
    })
  ).property.id;
}
async function documentFor(propertyId: string, userId: string) {
  const w = await prisma.workspace.findUniqueOrThrow({
    where: { ownerUserId: userId },
  });
  const id = randomUUID(),
    version = randomUUID();
  await prisma.propertyDoc.create({
    data: {
      id,
      workspaceId: w.id,
      propertyId,
      type: "Sanction Plan",
      name: "Owner supplied sanctioned-plan record.pdf",
      displayName: "Plan source",
      uploadDate: day,
      sizeBytes: 10,
      storageKey: `fixture/${id}`,
      mimeType: "application/pdf",
      scanStatus: "clean",
      reviewStatus: "confirmed",
      processingState: "ready",
      uploadedBy: userId,
      version: 1,
    },
  });
  await prisma.documentVersion.create({
    data: {
      id: version,
      documentId: id,
      workspaceId: w.id,
      version: 1,
      originalFilename: "plan.pdf",
      displayName: "Plan source",
      mimeType: "application/pdf",
      sizeBytes: 10,
      sha256: "a".repeat(64),
      storageKey: `fixture/${id}`,
      scanStatus: "clean",
      reviewStatus: "confirmed",
      processingState: "ready",
      source: "user_uploaded",
      uploadedBy: userId,
    },
  });
  return { id, version };
}

beforeAll(async () => {
  await prisma.user.deleteMany();
  clearLocalMailbox();
  const a = await login("construction-owner@example.com"),
    b = await login("construction-other@example.com"),
    c = await login("construction-architect@example.com"),
    o = await login("construction-operator@example.com");
  owner = a.id;
  cookie = a.cookie;
  other = b.id;
  otherCookie = b.cookie;
  architect = c.id;
  architectCookie = c.cookie;
  operator = o.id;
  await prisma.user.update({
    where: { id: operator },
    data: { role: "operator" },
  });
  property = await propertyFor(owner, "Construction Plot");
  ownerSecondProperty = await propertyFor(owner, "Other Owner Plot");
  otherProperty = await propertyFor(other, "Other User Plot");
  const d = await documentFor(property, owner),
    f = await documentFor(ownerSecondProperty, owner);
  doc = d.id;
  docVersion = d.version;
  foreignDoc = f.id;
  foreignVersion = f.version;
});
afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.checklistRule.deleteMany({
    where: { stableKey: { startsWith: "construction-test-" } },
  });
  clearLocalMailbox();
});

describe("Construction OS connected persistent foundation", () => {
  it("has an empty real state, requires authentication, and creates a G+2 plan once", async () => {
    expect(await listConstructionForUser(owner)).toEqual([]);
    expect((await listRoute(req("/api/construction"))).status).toBe(401);
    const body = setup();
    const r = await createRoute(req("/api/construction", cookie, body));
    expect(r.status).toBe(201);
    p = (await r.json()).data;
    expect(p.estimatedBudgetPaise).toBe("1200000000");
    expect(p.progressPercent).toBe(0);
    expect(p.stages).toHaveLength(17);
    expect(p.tasks.length).toBeGreaterThan(20);
    expect(p.floorCount).toBe(3);
    expect(p.templateVersion).toBe("home-workflow-v1");
    const duplicate = await createConstructionForUser(owner, body);
    expect(duplicate.id).toBe(p.id);
    expect(
      await prisma.constructionEvent.count({ where: { projectId: p.id } }),
    ).toBe(1);
    await expect(
      createConstructionForUser(owner, { ...body, name: "changed" }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
  it("rejects invalid setup, area, budget, wrong property and forged owner", async () => {
    for (const invalid of [
      { builtUpArea: "-1" },
      { builtUpArea: "1.1234" },
      { estimatedBudgetPaise: "1.25" },
      { estimatedBudgetPaise: "-1" },
      { floorCount: 0 },
      { targetCompletionDate: "2025-01-01" },
      { startDate: "2026-02-31" },
    ])
      await expect(
        createConstructionForUser(owner, { ...setup(), ...invalid }),
      ).rejects.toMatchObject({ code: "CONSTRUCTION_INVALID" });
    await expect(
      createConstructionForUser(owner, setup(otherProperty)),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      createConstructionForUser(other, {
        ...setup(),
        ownerId: owner,
        workspaceId: (
          await prisma.workspace.findUniqueOrThrow({
            where: { ownerUserId: owner },
          })
        ).id,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("enforces stage dependencies, child completion and optimistic versions", async () => {
    await expect(
      change("STAGE_UPDATE", {
        stageId: p.stages[4].id,
        status: "IN_PROGRESS",
      }),
    ).rejects.toMatchObject({ code: "DEPENDENCY_BLOCKED" });
    await change("STAGE_UPDATE", {
      stageId: p.stages[0].id,
      status: "IN_PROGRESS",
      expectedEnd: future,
    });
    await expect(
      change("STAGE_UPDATE", { stageId: p.stages[0].id, status: "COMPLETED" }),
    ).rejects.toMatchObject({ code: "UNRESOLVED_TASKS" });
    const task = p.tasks.find((t) => t.stageId === p.stages[0].id)!;
    await change("TASK_UPDATE", { taskId: task.id, status: "DONE" });
    const before = p.events.length,
      version = p.version;
    await change("TASK_UPDATE", { taskId: task.id, status: "DONE" });
    expect(p.events).toHaveLength(before);
    expect(p.version).toBe(version);
    await expect(
      mutateConstructionForUser(owner, p.id, {
        action: "PROJECT_STATUS",
        status: "ACTIVE",
        version: 0,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "CONSTRUCTION_VERSION_CONFLICT" });
    for (const t of p.tasks.filter(
      (t) => t.stageId === p.stages[0].id && t.status !== "DONE",
    ))
      await change("TASK_UPDATE", { taskId: t.id, status: "DONE" });
    await change("STAGE_UPDATE", {
      stageId: p.stages[0].id,
      status: "COMPLETED",
    });
    expect(p.stages[1].status).toBe("READY");
    expect(p.progressPercent).toBeGreaterThan(0);
  });
  it("links a clean Vault version, rejects another property and duplicate links", async () => {
    await expect(
      change("DOCUMENT_LINK", {
        documentId: foreignDoc,
        documentVersionId: foreignVersion,
        category: "Plan",
      }),
    ).rejects.toMatchObject({ status: 404 });
    await change("DOCUMENT_LINK", {
      documentId: doc,
      documentVersionId: docVersion,
      category: "Sanction Plan",
      stageId: p.stages[3].id,
    });
    expect(p.documents[0]).toMatchObject({
      documentId: doc,
      documentVersionId: docVersion,
      version: 1,
    });
    await expect(
      change("DOCUMENT_LINK", {
        documentId: doc,
        documentVersionId: docVersion,
        category: "Plan",
      }),
    ).rejects.toMatchObject({ code: "DOCUMENT_ALREADY_LINKED" });
    expect(p.checklistState).toBe("UNKNOWN");
  });
  it("evaluates construction documents with the S12 applicability engine and truthful review states", async () => {
    const ruleId = randomUUID();
    await prisma.checklistRule.create({
      data: {
        id: ruleId,
        stableKey: "construction-test-plan",
        version: 1,
        contentType: "checklist",
        title: "Synthetic configured plan record",
        description: "Fixture only",
        category: "CONSTRUCTION",
        propertyType: "residential_plot",
        jurisdiction: "India / Maharashtra / Pune",
        evidenceCategory: "Sanction Plan",
        effectiveFrom: "2026-01-01",
        status: "PUBLISHED",
        reviewer: "Synthetic reviewer",
        reviewedAt: new Date(),
        sourceName: "Synthetic reviewed content",
        sourceReference: { fixture: true },
      },
    });
    let view = await getConstructionForUser(owner, p.id);
    expect(view.configuredChecklist[0].status).toBe("DOCUMENT_AVAILABLE");
    await prisma.propertyDoc.update({
      where: { id: doc },
      data: { reviewStatus: "awaiting_review" },
    });
    view = await getConstructionForUser(owner, p.id);
    expect(view.configuredChecklist[0].status).toBe("UNDER_REVIEW");
    await prisma.propertyDoc.update({
      where: { id: doc },
      data: { archivedAt: new Date() },
    });
    view = await getConstructionForUser(owner, p.id);
    expect(view.configuredChecklist[0].status).toBe(
      "MISSING_FROM_CONFIGURED_CHECKLIST",
    );
    expect(view.documents).toEqual([]);
    await prisma.propertyDoc.update({
      where: { id: doc },
      data: { archivedAt: null, reviewStatus: "confirmed" },
    });
    await prisma.checklistRule.update({
      where: { id: ruleId },
      data: { status: "DRAFT" },
    });
    expect(
      (await getConstructionForUser(owner, p.id)).configuredChecklist,
    ).toEqual([]);
    await prisma.checklistRule.update({
      where: { id: ruleId },
      data: { status: "PUBLISHED", effectiveUntil: "2025-01-01" },
    });
    expect(
      (await getConstructionForUser(owner, p.id)).configuredChecklist,
    ).toEqual([]);
    await prisma.checklistRule.delete({ where: { id: ruleId } });
  });
  it("adds Foundation milestone and ₹5 lakh estimate without treating estimates as spend", async () => {
    await change("STAGE_CREATE", {
      name: "Foundation owner milestone",
      description: "Owner's additional recorded milestone",
      dependsOnId: p.stages[0].id,
      expectedEnd: future,
    });
    const foundation = p.stages.find(
      (s) => s.name === "Foundation owner milestone",
    )!;
    await change("BUDGET_SET", {
      category: "Civil Work",
      stageId: foundation.id,
      estimatedPaise: "50000000",
      projectBudgetPaise: "1200000000",
    });
    expect(p.budgets[0].estimatedPaise).toBe("50000000");
    expect(p.recordedSpendPaise).toBe("0");
    const o = await createObligationForUser(owner, property, {
      type: "Construction invoice",
      label: "Foundation invoice",
      direction: "PAYABLE",
      amountPaise: "50000000",
      currency: "INR",
      dueDate: day,
      timezone: "Asia/Kolkata",
      recurrenceType: "once",
    });
    invoice = o.id;
    const occurrence = await prisma.obligationOccurrence.findFirstOrThrow({
      where: { obligationId: invoice },
    });
    const paid = await recordPaymentForUser(owner, occurrence.id, {
      amountPaise: "10000000",
      currency: "INR",
      paymentDate: day,
      method: "Owner-recorded bank payment",
      idempotencyKey: "construction-payment",
    });
    payment = paid.payment.id;
    ledger = (
      await prisma.expenseLedgerEntry.findUniqueOrThrow({
        where: { paymentId: payment },
      })
    ).id;
    const input = {
      action: "COST_RECORD",
      version: p.version,
      idempotencyKey: "construction-invoice-link",
      source: "LINKED_INVOICE",
      title: "Foundation invoice",
      recordedDate: day,
      obligationId: invoice,
      budgetItemId: p.budgets[0].id,
      stageId: foundation.id,
    };
    p = await mutateConstructionForUser(owner, p.id, input);
    expect(p.recordedSpendPaise).toBe("10000000");
    p = await mutateConstructionForUser(owner, p.id, input);
    expect(
      await prisma.expenseLedgerEntry.count({ where: { paymentId: payment } }),
    ).toBe(1);
    await expect(
      change("COST_RECORD", {
        source: "LINKED_PAYMENT",
        title: "Duplicate payment",
        recordedDate: day,
        ledgerEntryId: ledger,
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_EXPENSE" });
    await expect(
      change("COST_RECORD", {
        source: "LINKED_INVOICE",
        title: "Duplicate invoice",
        recordedDate: day,
        obligationId: invoice,
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_EXPENSE" });
  });
  it("records manual expense once under concurrent retry and follows canonical reversals", async () => {
    const input = {
      action: "COST_RECORD",
      version: p.version,
      idempotencyKey: "manual-cost-once",
      source: "USER_RECORDED_EXPENSE",
      title: "Owner recorded site expense",
      recordedDate: day,
      amountPaise: "250000",
    };
    const rows = await Promise.all([
      mutateConstructionForUser(owner, p.id, input),
      mutateConstructionForUser(owner, p.id, input),
    ]);
    p = rows[1];
    expect(p.recordedSpendPaise).toBe("10250000");
    expect(
      await prisma.expenseLedgerEntry.count({
        where: { canonicalKey: `construction:${p.id}:manual-cost-once` },
      }),
    ).toBe(1);
    expect(
      await prisma.constructionEvent.count({
        where: { projectId: p.id, requestKey: "manual-cost-once" },
      }),
    ).toBe(1);
    for (let retry = 0; retry < 2; retry++) {
      const reversed = await reversePaymentRoute(new Request(`http://localhost:3100/api/payments/${payment}/reverse`, {
        method: "POST", headers: { cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: `bills-reverse:${payment}` }),
      }), { params: Promise.resolve({ id: payment }) });
      expect(reversed.status).toBe(200);
      expect((await reversed.json()).data.duplicate).toBe(retry === 1);
    }
    expect(await prisma.obligationPayment.count({ where: { reversalOfId: payment } })).toBe(1);
    p = await getConstructionForUser(owner, p.id);
    expect(p.recordedSpendPaise).toBe("250000");
    const occurrence = await prisma.obligationOccurrence.findFirstOrThrow({
      where: { obligationId: invoice },
    });
    await recordPaymentForUser(owner, occurrence.id, {
      amountPaise: "10000000",
      currency: "INR",
      paymentDate: day,
      method: "Corrected owner record",
      idempotencyKey: "construction-payment-corrected",
    });
    p = await getConstructionForUser(owner, p.id);
    expect(p.recordedSpendPaise).toBe("10250000");
  });
  it("validates materials, preserves manual price history and tracks procurement", async () => {
    for (const quantity of ["0", "-2", "1.2222", "NaN"])
      await expect(
        change("MATERIAL_CREATE", {
          category: "Cement",
          name: "Cement requirement",
          quantity,
          unit: "bag",
        }),
      ).rejects.toMatchObject({ code: "CONSTRUCTION_INVALID" });
    await change("MATERIAL_CREATE", {
      category: "Cement",
      name: "PPC cement",
      quantity: "800",
      unit: "bag",
      requiredByDate: future,
      estimatedUnitRatePaise: "39000",
      provenance: "APPROVED_PROVIDER",
    });
    const m = p.materials[0];
    expect(m.provenance).toBe("USER_ENTERED");
    expect(m.estimatedTotalPaise).toBe("31200000");
    await change("PRICE_RECORD", {
      materialId: m.id,
      brand: "Synthetic PPC",
      grade: "PPC",
      dealer: "Owner-entered dealer",
      location: "Pune",
      recordedDate: day,
      unit: "bag",
      pricePaise: "38000",
    });
    await change("PRICE_RECORD", {
      materialId: m.id,
      brand: "Synthetic PPC",
      location: "Pune",
      recordedDate: future,
      unit: "bag",
      pricePaise: "39000",
    });
    expect(p.prices.map((x) => x.pricePaise)).toEqual(["39000", "38000"]);
    await expect(
      change("PRICE_RECORD", {
        materialId: m.id,
        location: "Pune",
        recordedDate: day,
        unit: "tonne",
        pricePaise: "39000",
      }),
    ).rejects.toMatchObject({ code: "CONSTRUCTION_INVALID" });
    await change("PROCUREMENT_SET", {
      materialId: m.id,
      status: "QUOTE_REQUIRED",
      notes: "Contact supplier externally",
    });
    expect(p.procurement[0].status).toBe("QUOTE_REQUIRED");
    expect(
      (
        await materialPricing.latest({
          material: "Cement",
          location: "Pune",
          unit: "bag",
        })
      ).state,
    ).toBe("UNAVAILABLE");
  });
  it("adds manual architect, site evidence, task reminder and Property Timeline events", async () => {
    await change("CONTACT_CREATE", {
      name: "Synthetic Architect",
      company: "Owner-entered studio",
      role: "ARCHITECT",
      email: "architect@example.com",
      phone: "0000000000",
    });
    expect(p.contacts[0].provenance).toBe("OWNER_ENTERED");
    await change("UPDATE_CREATE", {
      stageId: p.stages[1].id,
      title: "Site preparation started",
      description: "Owner recorded site progress; no certification.",
      occurredDate: day,
    });
    expect(p.updates[0].title).toBe("Site preparation started");
    await change("TASK_CREATE", {
      stageId: p.stages[1].id,
      title: "Review site survey with architect",
      dueDate: future,
      contactId: p.contacts[0].id,
    });
    expect(
      await prisma.durableReminder.count({
        where: {
          propertyId: property,
          sourceType: "CONSTRUCTION",
          title: "Review site survey with architect",
          state: "SCHEDULED",
        },
      }),
    ).toBe(1);
    const events = await prisma.constructionEvent.count({
      where: { projectId: p.id },
    });
    expect(
      await prisma.timelineEvent.count({
        where: { propertyId: property, id: { startsWith: "construction:" } },
      }),
    ).toBe(events);
    const home = await homeRoute(req("/api/home", cookie));
    expect(JSON.stringify(await home.json())).toContain(
      "Review site survey with architect",
    );
    expect((await updatesRoute(req("/api/updates", cookie))).status).toBe(200);
  });
  it("extends authorized search and the S20 structured assistant with exact ledger totals", async () => {
    expect(
      (await searchForUser(owner, "G+2")).records.some((r) => r.id === p.id),
    ).toBe(true);
    expect((await searchForUser(owner, "PPC cement")).records).toHaveLength(1);
    const stage = await answerAssistantForUser(
      owner,
      "What stage is my project at?",
      property,
      { projectId: p.id },
    );
    expect(stage.answer).toContain("Survey & Site Preparation");
    const nextMilestone = await answerAssistantForUser(
      owner,
      "What is the next milestone?",
      property,
      { projectId: p.id },
    );
    expect(nextMilestone.answer).toContain("Next recorded milestone: Design");
    expect(nextMilestone.answer).toContain("not entered");
    expect(nextMilestone.citations[0].href).toContain("tab=plan");
    const spend = await answerAssistantForUser(
      owner,
      "How much construction spend?",
      property,
      { projectId: p.id },
    );
    expect(spend.answer).toContain("₹102500.00");
    expect(spend.citations[0].href).toContain("tab=budget");
    expect(
      (
        await constructionAnswerForUser(
          owner,
          p.id,
          "What materials are required next?",
        )
      ).answer,
    ).toContain("800 bag");
    expect(
      (
        await constructionAnswerForUser(
          owner,
          p.id,
          "What documents are missing?",
        )
      ).answer,
    ).toContain("unknown");
    expect(
      (
        await constructionAnswerForUser(
          owner,
          p.id,
          "Design structural beam sizes",
        )
      ).answer,
    ).toContain("not supported");
    await expect(
      answerAssistantForUser(owner, "Current stage?", ownerSecondProperty, {
        projectId: p.id,
      }),
    ).rejects.toMatchObject({ code: "PROPERTY_NOT_FOUND" });
  });
  it("shares architect plan/site scope without budgets, payments, contacts or hidden document counts", async () => {
    const invite = await createShareInvitationForUser(owner, property, {
      inviteeEmail: "construction-architect@example.com",
      role: "ARCHITECT",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      scopes: [
        { capability: "PROPERTY_BASIC_READ" },
        { capability: "CONSTRUCTION_PROJECT_READ" },
        { capability: "CONSTRUCTION_TASK_READ" },
        { capability: "CONSTRUCTION_UPDATE_READ" },
        { capability: "CONSTRUCTION_DOCUMENT_READ" },
        { capability: "DOCUMENT_METADATA_READ", documentId: doc },
        { capability: "DOCUMENT_PREVIEW", documentId: doc },
      ],
    });
    const accepted = await acceptShareInvitationForUser(
      architect,
      "construction-architect@example.com",
      invite.invitationToken,
    );
    grant = accepted.id;
    const view = await getConstructionForUser(architect, p.id);
    expect(view.owner).toBe(false);
    expect(view.tasks.length).toBeGreaterThan(0);
    expect(view.updates).toHaveLength(1);
    expect(view.documents).toHaveLength(1);
    expect(view.budgets).toEqual([]);
    expect(view.costs).toEqual([]);
    expect(view.contacts).toEqual([]);
    expect(view.estimatedBudgetPaise).toBeUndefined();
    expect(view.recordedSpendPaise).toBeUndefined();
    expect(view.tasks.every((t) => t.estimatePaise === undefined)).toBe(true);
    expect(view.completionSummary).toBeUndefined();
    expect(
      (await searchForUser(architect, "Synthetic Architect")).records,
    ).toEqual([]);
    expect((await searchForUser(architect, "G+2")).records).toHaveLength(1);
    expect(
      (
        await costsRoute(
          req(`/api/construction/${p.id}/cost-sources`, architectCookie),
          ctx(p.id),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await constructionAnswerForUser(
          architect,
          p.id,
          "How much construction spend?",
        )
      ).answer,
    ).toContain("not supported");
    await expect(
      mutateConstructionForUser(architect, p.id, {
        action: "PROJECT_STATUS",
        status: "ACTIVE",
        version: p.version,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("denies User B and operator plus all guessed cross-project child IDs", async () => {
    expect(
      (
        await projectRoute(
          req(`/api/construction/${p.id}`, otherCookie),
          ctx(p.id),
        )
      ).status,
    ).toBe(404);
    await expect(getConstructionForUser(operator, p.id)).rejects.toMatchObject({
      status: 404,
    });
    expect(await listConstructionForUser(other)).toEqual([]);
    const otherProject = await createConstructionForUser(
      other,
      setup(otherProperty),
    );
    const cases = [
      {
        action: "STAGE_UPDATE",
        stageId: p.stages[0].id,
        status: "IN_PROGRESS",
      },
      { action: "TASK_UPDATE", taskId: p.tasks[0].id, status: "DONE" },
      { action: "MATERIAL_UPDATE", materialId: p.materials[0].id },
      {
        action: "BUDGET_SET",
        budgetItemId: p.budgets[0].id,
        category: "guess",
        estimatedPaise: "0",
      },
      { action: "ISSUE_RESOLVE", updateId: p.updates[0].id },
      {
        action: "COST_RECORD",
        source: "USER_RECORDED_EXPENSE",
        title: "guess",
        recordedDate: day,
        amountPaise: "100",
        documentLinkId: p.documents[0].id,
      },
      { action: "CONTACT_UPDATE", contactId: p.contacts[0].id, name: "guess" },
    ];
    for (const attack of cases) {
      const response = await mutationRoute(
        req(`/api/construction/${otherProject.id}`, otherCookie, {
          ...attack,
          version: otherProject.version,
          idempotencyKey: randomUUID(),
        }),
        ctx(otherProject.id),
      );
      expect(response.status).toBe(404);
      expect(JSON.stringify(await response.json())).not.toContain(p.name);
    }
    expect(
      (await searchForUser(other, "G+2")).records.every((r) => r.id !== p.id),
    ).toBe(true);
    await expect(
      constructionAnswerForUser(other, p.id, "Reveal construction records"),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("supports pause/resume, task dependencies and rejects dependency cycles", async () => {
    await change("PROJECT_STATUS", { status: "ACTIVE" });
    await change("PROJECT_STATUS", { status: "ON_HOLD" });
    expect(p.status).toBe("ON_HOLD");
    await change("PROJECT_STATUS", { status: "ACTIVE" });
    await change("STAGE_UPDATE", {
      stageId: p.stages[1].id,
      status: "IN_PROGRESS",
    });
    await change("TASK_CREATE", {
      stageId: p.stages[1].id,
      title: "Dependency A",
    });
    const first = p.tasks.find((t) => t.title === "Dependency A")!;
    await change("TASK_CREATE", {
      stageId: p.stages[1].id,
      title: "Dependency B",
      dependsOnId: first.id,
    });
    const second = p.tasks.find((t) => t.title === "Dependency B")!;
    await expect(
      change("TASK_UPDATE", { taskId: second.id, status: "DONE" }),
    ).rejects.toMatchObject({ code: "DEPENDENCY_BLOCKED" });
    await expect(
      change("TASK_UPDATE", { taskId: first.id, dependsOnId: second.id }),
    ).rejects.toMatchObject({ code: "CONSTRUCTION_INVALID" });
    await change("TASK_UPDATE", { taskId: first.id, status: "DONE" });
    await change("TASK_UPDATE", { taskId: second.id, status: "DONE" });
    expect(p.tasks.find((t) => t.id === second.id)?.status).toBe("DONE");
  });
  it("suppresses an assistant answer when a specific capability is removed during processing", async () => {
    const scope = await prisma.shareLinkScope.create({
      data: {
        id: randomUUID(),
        shareLinkId: grant,
        scopeType: "CONSTRUCTION_COST_READ",
      },
    });
    expect(
      (await constructionAnswerForUser(architect, p.id, "Construction spend?"))
        .answer,
    ).toContain("102500.00");
    await expect(
      constructionAnswerForUser(architect, p.id, "Construction spend?", {
        beforeFinalization: async () => {
          await prisma.shareLinkScope.delete({ where: { id: scope.id } });
        },
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (await getConstructionForUser(architect, p.id)).recordedSpendPaise,
    ).toBeUndefined();
  });
  it("supports multiple projects, archives/restores and preserves history through legacy state saves", async () => {
    const second = await createConstructionForUser(
      owner,
      setup(ownerSecondProperty),
    );
    expect(await listConstructionForUser(owner)).toHaveLength(2);
    expect(
      (await getConstructionForUser(architect, p.id)).tasks.length,
    ).toBeGreaterThan(0);
    const archived = await mutateConstructionForUser(owner, second.id, {
      action: "ARCHIVE",
      version: second.version,
      idempotencyKey: randomUUID(),
    });
    expect(archived.archivedAt).toBeTruthy();
    expect(await listConstructionForUser(owner)).toHaveLength(1);
    expect(await listConstructionForUser(owner, undefined, true)).toHaveLength(
      1,
    );
    await expect(
      mutateConstructionForUser(owner, second.id, {
        action: "PROJECT_STATUS",
        status: "ACTIVE",
        version: archived.version,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "PROJECT_ARCHIVED" });
    await mutateConstructionForUser(owner, second.id, {
      action: "RESTORE",
      version: archived.version,
      idempotencyKey: randomUUID(),
    });
    const old = await readStateForUser(owner);
    old.state.projects = [];
    old.state.timeline = old.state.timeline.filter(
      (t) => !t.id.startsWith("construction:"),
    );
    await replaceStateForUser(owner, old.state, old.version);
    expect(await listConstructionForUser(owner)).toHaveLength(2);
    expect(
      await prisma.timelineEvent.count({
        where: { id: { startsWith: "construction:" } },
      }),
    ).toBeGreaterThan(0);
  });
  it("rejects unresolved handover and creates a durable owner-confirmed completion summary", async () => {
    await expect(
      change("COMPLETE", {
        confirmed: true,
        completionDate: day,
        summary: "Test",
        handoff: "Warranty follow-ups",
      }),
    ).rejects.toMatchObject({ code: "CLOSEOUT_UNRESOLVED" });
    await change("UPDATE_CREATE", {
      title: "Rain pause",
      description: "Owner recorded open issue",
      occurredDate: day,
      issue: true,
    });
    const issue = p.updates.find((u) => u.issueStatus === "OPEN")!;
    for (const s of p.stages.filter(
      (s) => !["COMPLETED", "SKIPPED"].includes(s.status),
    ))
      await change("STAGE_UPDATE", {
        stageId: s.id,
        status: "SKIPPED",
        notes:
          "Synthetic owner explicitly excludes this stage for close-out test.",
      });
    await expect(
      change("COMPLETE", {
        confirmed: true,
        completionDate: day,
        summary: "Test",
        handoff: "Warranty follow-ups",
      }),
    ).rejects.toMatchObject({ code: "CLOSEOUT_UNRESOLVED" });
    await change("ISSUE_RESOLVE", { updateId: issue.id });
    await change("REMINDER_SET", {
      kind: "WARRANTY",
      title: "Review owner-recorded waterproofing warranty",
      dueDate: future,
    });
    await change("COMPLETE", {
      confirmed: true,
      completionDate: day,
      summary:
        "Synthetic owner-confirmed handover; only Pre-Construction completed, remaining stages explicitly skipped.",
      handoff: "Review waterproofing warranty and maintenance records.",
    });
    expect(p.status).toBe("COMPLETED");
    expect(p.completionSummary).toMatchObject({
      statement: "Project marked complete by owner.",
      initialBudgetPaise: "1200000000",
      recordedSpendPaise: "10250000",
    });
    expect(
      await prisma.durableReminder.count({
        where: { sourceId: { startsWith: "WARRANTY:" }, state: "SCHEDULED" },
      }),
    ).toBe(1);
    await expect(
      change("TASK_CREATE", { stageId: p.stages[0].id, title: "Late edit" }),
    ).rejects.toMatchObject({ code: "PROJECT_CLOSED" });
    await prisma.$disconnect();
    await prisma.$connect();
    const restored = await getConstructionForUser(owner, p.id);
    expect(restored.completionSummary).toEqual(p.completionSummary);
    expect(restored.costs).toHaveLength(2);
    expect(restored.prices).toHaveLength(2);
  });
  it("revokes construction, search, assistant and document context on next request", async () => {
    expect((await getConstructionForUser(architect, p.id)).id).toBe(p.id);
    await expect(
      constructionAnswerForUser(architect, p.id, "What stage?", {
        beforeFinalization: async () => {
          await revokeShareForUser(owner, grant);
        },
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (
        await projectRoute(
          req(`/api/construction/${p.id}`, architectCookie),
          ctx(p.id),
        )
      ).status,
    ).toBe(404);
    expect(await listConstructionForUser(architect)).toEqual([]);
    await expect(searchForUser(architect, "G+2")).rejects.toMatchObject({
      code: "SEARCH_FORBIDDEN",
    });
  });
});

describe("Construction canonical expense corrections", () => {
  let cp: ConstructionView;
  let originalCostId = "";
  let correctionRequest: Record<string, unknown>;
  const edit = async (action: string, fields: Record<string, unknown> = {}) => {
    cp = await mutateConstructionForUser(owner, cp.id, {
      action,
      version: cp.version,
      idempotencyKey: randomUUID(),
      ...fields,
    });
    return cp;
  };
  it("corrects ₹25,000 to ₹2,500 with retained original, ledger, budget, assistant and audit agreement", async () => {
    cp = await createConstructionForUser(owner, setup(ownerSecondProperty));
    await edit("BUDGET_SET", {
      category: "Site work",
      estimatedPaise: "50000000",
      stageId: cp.stages[0].id,
    });
    await edit("COST_RECORD", {
      source: "USER_RECORDED_EXPENSE",
      title: "Amount typo",
      amountPaise: "2500000",
      recordedDate: day,
      budgetItemId: cp.budgets[0].id,
      stageId: cp.stages[0].id,
      taskId: cp.tasks.find((t) => t.stageId === cp.stages[0].id)!.id,
    });
    originalCostId = cp.costs[0].id;
    const original = await prisma.expenseLedgerEntry.findUniqueOrThrow({
      where: { id: cp.costs[0].ledgerEntryId! },
    });
    correctionRequest = {
      action: "COST_CORRECT",
      costId: originalCostId,
      amountPaise: "250000",
      reason: "Extra zero entered; original receipt was ₹2,500",
      confirmed: true,
      version: cp.version,
      idempotencyKey: "correction-example",
    };
    const response = await mutationRoute(
      req(`/api/construction/${cp.id}`, cookie, correctionRequest),
      ctx(cp.id),
    );
    expect(response.status).toBe(200);
    cp = (await response.json()).data;
    expect(cp.recordedSpendPaise).toBe("250000");
    expect(cp.budgets[0].recordedPaise).toBe("250000");
    expect(
      cp.tasks.find((t) => t.id === cp.costs[0].taskId)?.actualCostPaise,
    ).toBe("250000");
    expect(cp.costs.reduce((n, c) => n + BigInt(c.amountPaise), 0n)).toBe(
      250000n,
    );
    expect(cp.costs.find((c) => c.id === originalCostId)).toMatchObject({
      originalAmountPaise: "2500000",
      amountPaise: "0",
      correction: { actorUserId: owner, reason: correctionRequest.reason },
    });
    expect(
      await prisma.expenseLedgerEntry.findUniqueOrThrow({
        where: { id: original.id },
      }),
    ).toEqual(original);
    const rows = await prisma.expenseLedgerEntry.findMany({
      where: { propertyId: ownerSecondProperty },
    });
    expect(
      rows.map((e) => e.amountPaise).sort((a, b) => Number(a - b)),
    ).toEqual([-2500000n, 250000n, 2500000n]);
    expect(rows.reduce((n, e) => n + e.amountPaise, 0n)).toBe(250000n);
    expect(
      (await constructionAnswerForUser(owner, cp.id, "Recorded spend?")).answer,
    ).toContain("₹2500.00");
    expect(
      cp.events.filter((e) => e.eventType === "COST_CORRECT"),
    ).toHaveLength(1);
    await prisma.$disconnect();
    await prisma.$connect();
    expect((await getConstructionForUser(owner, cp.id)).costs).toEqual(
      cp.costs.map((c) => ({
        ...c,
        correction: c.correction
          ? { ...c.correction, createdAt: new Date(c.correction.createdAt) }
          : null,
      })),
    );
  });
  it("replays correction keys once and rejects conflicting/stale concurrent corrections", async () => {
    const before = await prisma.expenseLedgerEntry.count({
      where: { propertyId: ownerSecondProperty },
    });
    await Promise.all([
      mutateConstructionForUser(owner, cp.id, correctionRequest),
      mutateConstructionForUser(owner, cp.id, correctionRequest),
    ]);
    expect(
      await prisma.expenseLedgerEntry.count({
        where: { propertyId: ownerSecondProperty },
      }),
    ).toBe(before);
    await expect(
      mutateConstructionForUser(owner, cp.id, {
        ...correctionRequest,
        amountPaise: "100",
      }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    await expect(
      edit("COST_REVERSE", {
        costId: originalCostId,
        reason: "Again",
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: "EXPENSE_ALREADY_CORRECTED" });
    const replacement = cp.costs.find(
      (c) => c.replacesCostId === originalCostId,
    )!;
    const shared = {
      action: "COST_CORRECT",
      costId: replacement.id,
      version: cp.version,
      confirmed: true,
      reason: "Concurrent edit",
    };
    const results = await Promise.allSettled([
      mutateConstructionForUser(owner, cp.id, {
        ...shared,
        amountPaise: "240000",
        idempotencyKey: "race-a",
      }),
      mutateConstructionForUser(owner, cp.id, {
        ...shared,
        amountPaise: "230000",
        idempotencyKey: "race-b",
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult)
        .reason.code,
    ).toBe("CONSTRUCTION_VERSION_CONFLICT");
    expect(
      await prisma.expenseLedgerEntry.count({
        where: { reversalOfId: replacement.ledgerEntryId },
      }),
    ).toBe(1);
    cp = await getConstructionForUser(owner, cp.id);
  });
  it("requires owner, reason, positive changed amount and confirmation; linked costs redirect to Bills", async () => {
    const active = cp.costs.find((c) => !c.correction)!;
    for (const fields of [
      { amountPaise: "-1", reason: "Negative", confirmed: true },
      { amountPaise: "0", reason: "Zero", confirmed: true },
      {
        amountPaise: active.originalAmountPaise,
        reason: "No change",
        confirmed: true,
      },
      { amountPaise: "100", reason: "", confirmed: true },
      { amountPaise: "100", reason: "Unconfirmed" },
    ]) {
      await expect(
        edit("COST_CORRECT", { costId: active.id, ...fields }),
      ).rejects.toMatchObject({ status: 400 });
    }
    for (const user of [other, architect, operator])
      await expect(
        mutateConstructionForUser(user, cp.id, {
          action: "COST_REVERSE",
          costId: active.id,
          version: cp.version,
          idempotencyKey: randomUUID(),
          reason: "Unauthorized",
          confirmed: true,
        }),
      ).rejects.toMatchObject({ status: 404 });
    expect(
      (
        await mutationRoute(
          req(`/api/construction/${cp.id}`, otherCookie, {
            action: "COST_REVERSE",
            costId: active.id,
            version: cp.version,
            idempotencyKey: randomUUID(),
            reason: "Unauthorized",
            confirmed: true,
          }),
          ctx(cp.id),
        )
      ).status,
    ).toBe(404);
    await expect(
      edit("COST_REVERSE", {
        costId: p.costs[0].id,
        reason: "Wrong project",
        confirmed: true,
      }),
    ).rejects.toMatchObject({ status: 404 });
    const invoiceCost = p.costs.find((c) => c.source === "LINKED_INVOICE")!;
    await expect(
      change("COST_REVERSE", {
        costId: invoiceCost.id,
        reason: "Must use Bills",
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: "USE_PAYMENT_WORKFLOW" });
  });
  it("reverses the active replacement once, prevents archived edits and nets the property ledger to zero", async () => {
    const active = cp.costs.find((c) => !c.correction)!;
    await edit("ARCHIVE");
    await expect(
      edit("COST_REVERSE", {
        costId: active.id,
        reason: "Archived",
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: "PROJECT_ARCHIVED" });
    await edit("RESTORE");
    const input = {
      action: "COST_REVERSE",
      costId: active.id,
      reason: "Duplicate charge removed",
      confirmed: true,
      version: cp.version,
      idempotencyKey: "reverse-final-once",
    };
    await Promise.all([
      mutateConstructionForUser(owner, cp.id, input),
      mutateConstructionForUser(owner, cp.id, input),
    ]);
    cp = await getConstructionForUser(owner, cp.id);
    expect(cp.recordedSpendPaise).toBe("0");
    expect(cp.budgets[0].recordedPaise).toBe("0");
    expect(
      (
        await prisma.expenseLedgerEntry.aggregate({
          where: { propertyId: ownerSecondProperty },
          _sum: { amountPaise: true },
        })
      )._sum.amountPaise,
    ).toBe(0n);
    expect(cp.costs).toHaveLength(3);
    expect(cp.costs.every((c) => c.correction)).toBe(true);
  });
  it("allows audited post-handover corrections without rewriting the historical snapshot", async () => {
    const snapshot = JSON.stringify(p.completionSummary);
    const manual = p.costs.find((c) => c.source === "USER_RECORDED_EXPENSE")!;
    await change("COST_CORRECT", {
      costId: manual.id,
      amountPaise: "200000",
      reason: "Late receipt reconciliation",
      confirmed: true,
    });
    expect(p.recordedSpendPaise).toBe("10200000");
    expect(JSON.stringify(p.completionSummary)).toBe(snapshot);
    expect(p.status).toBe("COMPLETED");
    await expect(
      change("TASK_CREATE", {
        stageId: p.stages[0].id,
        title: "Still read only",
      }),
    ).rejects.toMatchObject({ code: "PROJECT_CLOSED" });
  });
});

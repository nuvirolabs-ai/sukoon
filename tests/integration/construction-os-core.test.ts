import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { readLocalOtp } from "@/lib/auth-mailbox";
import { prisma } from "@/lib/prisma";
import {
  createConstructionForUser,
  getConstructionForUser,
  mutateConstructionForUser,
  type ConstructionView,
} from "@/lib/construction";
import { createPropertyForUser } from "@/lib/property-repository";
import {
  createShareInvitationForUser,
  acceptShareInvitationForUser,
} from "@/lib/sharing";

const handlers = toNextJsHandler(auth);
const day = new Date().toISOString().slice(0, 10);
const req = (url: string, cookie = "", body?: unknown) =>
  new Request(`http://localhost:3100${url}`, {
    headers: { cookie, "Content-Type": "application/json" },
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
  });

async function login(email: string) {
  await handlers.POST(
    req("/api/auth/email-otp/send-verification-otp", "", { email, type: "sign-in" }),
  );
  const otp = readLocalOtp(email)?.otp;
  expect(otp).toMatch(/^\d{6}$/);
  const r = await handlers.POST(req("/api/auth/sign-in/email-otp", "", { email, otp }));
  expect(r.ok).toBe(true);
  return {
    id: (await prisma.user.findUniqueOrThrow({ where: { email } })).id,
    cookie: r.headers.get("set-cookie")!.split(";", 1)[0],
  };
}

async function propertyFor(userId: string, name: string) {
  return (
    await createPropertyForUser(userId, {
      name,
      type: "plot",
      city: "Pune",
      area: "Kothrud",
      address: "Synthetic OS core plot",
      jurisdiction: "India / Maharashtra / Pune",
      areaValue: "1200",
      areaUnit: "sqft",
      areaType: "plot",
      ownerName: "Synthetic owner",
      ownershipAssertion: "self_asserted",
      ownershipProvenance: "Owner-entered synthetic OS core fixture",
      identifiers: [],
    })
  ).property.id;
}

let owner = "";
let property = "";
let p: ConstructionView;

async function change(action: string, data: Record<string, unknown> = {}) {
  p = await mutateConstructionForUser(owner, p.id, {
    action,
    version: p.version,
    idempotencyKey: randomUUID(),
    ...data,
  });
  return p;
}

async function freshProject(name: string) {
  const created = await createConstructionForUser(owner, {
    propertyId: property,
    name,
    projectType: "NEW_HOME",
    builtUpArea: "3600",
    areaUnit: "sqft",
    floorCount: 2,
    qualityLevel: "STANDARD",
    estimatedBudgetPaise: "1200000000",
    startDate: day,
    targetCompletionDate: "2027-09-12",
    requirements: "Synthetic OS core fixture.",
    idempotencyKey: randomUUID(),
  });
  p = await getConstructionForUser(owner, created.id, true);
  await change("PROJECT_STATUS", { status: "ACTIVE" });
  return p;
}

describe("Construction OS Core 1.0", async () => {
  owner = (await login(`os-core-${randomUUID()}@example.com`)).id;
  property = await propertyFor(owner, `OS Core Plot ${randomUUID().slice(0, 8)}`);
  await freshProject(`OS Core Home ${randomUUID().slice(0, 8)}`);

  it("versions the plan with a single active version", async () => {
    await change("PLAN_VERSION_CREATE", { label: "Baseline" });
    const v1 = p.planVersions.find((v) => v.versionNumber === 1)!;
    expect(v1.status).toBe("DRAFT");
    await change("PLAN_VERSION_ACTIVATE", { planVersionId: v1.id });
    expect(p.planVersions.find((v) => v.id === v1.id)!.status).toBe("ACTIVE");
    await change("PLAN_VERSION_CREATE", { label: "Revision" });
    const v2 = p.planVersions.find((v) => v.versionNumber === 2)!;
    await change("PLAN_VERSION_ACTIVATE", { planVersionId: v2.id });
    expect(p.planVersions.filter((v) => v.status === "ACTIVE")).toHaveLength(1);
    expect(p.planVersions.find((v) => v.id === v1.id)!.status).toBe("SUPERSEDED");
    const types = p.events.map((e) => e.eventType);
    expect(types).toContain("PROJECT_PLAN_VERSION_CREATED");
    expect(types).toContain("PROJECT_PLAN_VERSION_ACTIVATED");
    expect(types).toContain("PROJECT_PLAN_VERSION_SUPERSEDED");
  });

  it("runs milestone and dependency state machines with cycle protection", async () => {
    await change("MILESTONE_CREATE", { name: "Slab", plannedDate: day });
    const milestone = p.milestones.find((m) => m.name === "Slab")!;
    expect(milestone.status).toBe("PLANNED");
    await expect(change("MILESTONE_UPDATE", { milestoneId: milestone.id, status: "DONE" })).rejects.toThrow();
    await change("MILESTONE_UPDATE", { milestoneId: milestone.id, status: "READY" });
    const stage = p.stages[0];
    await change("DEPENDENCY_CREATE", {
      predecessorType: "MILESTONE",
      predecessorId: milestone.id,
      successorType: "STAGE",
      successorId: stage.id,
    });
    expect(p.events.map((e) => e.eventType)).toContain("DEPENDENCY_UNSATISFIED");
    await expect(
      change("DEPENDENCY_CREATE", {
        predecessorType: "STAGE",
        predecessorId: stage.id,
        successorType: "MILESTONE",
        successorId: milestone.id,
      }),
    ).rejects.toThrow(/cycle/i);
    await expect(
      change("DEPENDENCY_CREATE", {
        predecessorType: "MILESTONE",
        predecessorId: milestone.id,
        successorType: "STAGE",
        successorId: stage.id,
      }),
    ).rejects.toThrow(/already exists/i);
  });

  it("makes decisions first-class and resolves blocking guidance on record", async () => {
    const stage = p.stages[0];
    const task = p.tasks.find((t) => t.stageId === stage.id)!;
    await change("DECISION_CREATE", {
      title: "Layout approval",
      context: "Needed before work starts.",
      assignedTo: "Owner",
      workItemId: task.id,
      dueDate: day,
      options: [{ label: "Approve" }, { label: "Revise", estimatedCostImpactPaise: "500000", estimatedScheduleImpactDays: 1 }],
    });
    const decision = p.decisions.find((d) => d.title === "Layout approval")!;
    expect(decision.options).toHaveLength(2);
    expect(p.events.map((e) => e.eventType)).toContain("DECISION_REQUESTED");
    const blocking = p.guidance.filter((g) => g.ruleKey === "G01" && g.status === "ACTIVE");
    expect(blocking).toHaveLength(1);
    expect(blocking[0].type).toBe("BLOCKING");
    const before = p.guidance.length;
    await change("PROJECT_UPDATE", { name: p.name, targetCompletionDate: "2027-09-12", notes: "" });
    expect(p.guidance.filter((g) => g.ruleKey === "G01" && g.status === "ACTIVE")).toHaveLength(1);
    expect(p.guidance.length).toBe(before);
    await change("DECISION_RECORD", { decisionId: decision.id, selectedOptionId: decision.options[0].id, decisionComment: "Approved." });
    expect(p.events.map((e) => e.eventType)).toContain("DECISION_RECORDED");
    expect(p.guidance.filter((g) => g.ruleKey === "G01" && g.status === "ACTIVE")).toHaveLength(0);
  });

  it("keeps issues separate from work items with a guarded lifecycle", async () => {
    await change("ISSUE_CREATE", { title: "Seepage", description: "Wall damp.", severity: "HIGH" });
    const issue = p.issues.find((i) => i.title === "Seepage")!;
    expect(issue.status).toBe("OPEN");
    await expect(change("ISSUE_UPDATE", { issueId: issue.id, status: "CLOSED" })).rejects.toThrow(/resolution/i);
    await change("ISSUE_UPDATE", { issueId: issue.id, status: "INVESTIGATING", assignedTo: "Contractor" });
    expect(p.events.map((e) => e.eventType)).toContain("ISSUE_ASSIGNED");
    await change("ISSUE_UPDATE", { issueId: issue.id, status: "ACTION_REQUIRED" });
    expect(p.events.map((e) => e.eventType)).toContain("ISSUE_ACTION_REQUIRED");
    await change("ISSUE_UPDATE", { issueId: issue.id, status: "RESOLVED", resolution: "Re-plastered and observed dry." });
    expect(p.events.map((e) => e.eventType)).toContain("ISSUE_RESOLVED");
  });

  it("records inspections without certification language", async () => {
    await change("INSPECTION_RECORD", {
      title: "Beam check",
      performedBy: "Engineer",
      performedAt: day,
      result: "CONCERN_RECORDED",
      notes: "Honeycombing observed at one joint.",
    });
    expect(p.events.map((e) => e.eventType)).toContain("INSPECTION_CONCERN_RECORDED");
    const concern = p.guidance.find((g) => g.ruleKey === "G06" && g.status === "ACTIVE");
    expect(concern?.title).toMatch(/concern was recorded/i);
    expect(JSON.stringify(p.guidance)).not.toMatch(/certified|approved structure|compliant/i);
  });

  it("manages changes from proposal to implementation with money effects", async () => {
    await change("CHANGE_PROPOSE", {
      title: "Flooring upgrade",
      reason: "Owner preference.",
      originalScope: "Rs.120 per sq ft",
      revisedScope: "Rs.190 per sq ft",
      estimatedCostImpactPaise: "18200000",
      estimatedScheduleImpactDays: 3,
    });
    const proposed = p.changes.find((c) => c.title === "Flooring upgrade")!;
    expect(p.money?.approvedChangeDeltaPaise).toBe("0");
    await change("CHANGE_DECIDE", { changeId: proposed.id, decision: "APPROVE" });
    expect(p.events.map((e) => e.eventType)).toContain("CHANGE_APPROVED");
    expect(p.money?.approvedChangeDeltaPaise).toBe("18200000");
    expect(p.money?.currentApprovedPaise).toBe("1218200000");
    expect(p.money?.projectedFinalPaise).toBe("1218200000");
    expect(p.money?.explanations.join(" ")).toMatch(/Flooring upgrade/);
    await change("CHANGE_DECIDE", { changeId: proposed.id, decision: "IMPLEMENT", actualCostImpactPaise: "18000000" });
    expect(p.money?.approvedChangeDeltaPaise).toBe("18000000");
  });

  it("distinguishes committed from recorded spend and fulfills commitments", async () => {
    await change("COMMITMENT_CREATE", { title: "Steel order", amountPaise: "50000000", expectedBy: day });
    const commitment = p.commitments.find((c) => c.title === "Steel order")!;
    expect(p.money?.committedPaise).toBe("50000000");
    expect(p.money?.recordedSpendPaise).toBe("0");
    await change("COST_RECORD", {
      source: "USER_RECORDED_EXPENSE",
      title: "Steel advance",
      amountPaise: "20000000",
      recordedDate: day,
      commitmentId: commitment.id,
    });
    expect(p.commitments.find((c) => c.id === commitment.id)!.status).toBe("PARTIALLY_FULFILLED");
    expect(p.money?.committedPaise).toBe("30000000");
    expect(p.money?.recordedSpendPaise).toBe("20000000");
    await change("COST_RECORD", {
      source: "USER_RECORDED_EXPENSE",
      title: "Steel balance",
      amountPaise: "30000000",
      recordedDate: day,
      commitmentId: commitment.id,
    });
    expect(p.commitments.find((c) => c.id === commitment.id)!.status).toBe("FULFILLED");
    expect(p.events.map((e) => e.eventType)).toContain("COMMITMENT_FULFILLED");
    expect(p.events.map((e) => e.eventType)).toContain("CONSTRUCTION_EXPENSE_RECORDED");
  });

  it("emits shortage evidence for short deliveries", async () => {
    await change("MATERIAL_CREATE", { category: "Cement", name: "Cement", quantity: "400", unit: "bags", requiredByDate: day });
    const cement = p.materials.find((m) => m.name === "Cement")!;
    await change("ORDER_PLACE", { materialRequirementId: cement.id, supplierName: "Depot", orderedQuantity: "400", unit: "bags", totalPaise: "15200000" });
    const order = p.orders.find((o) => o.materialRequirementId === cement.id)!;
    expect(order.commitmentId).toBeTruthy();
    await change("DELIVERY_RECORD", { orderId: order.id, expectedQuantity: "400", receivedQuantity: "390", unit: "bags" });
    expect(p.events.map((e) => e.eventType)).toContain("DELIVERY_SHORTAGE_RECORDED");
    const shortage = p.guidance.find((g) => g.ruleKey === "G04" && g.status === "ACTIVE");
    expect(shortage?.title).toMatch(/10 cement bags were short/);
    expect(shortage?.reason).toMatch(/390 received against 400/);
  });

  it("runs quotes, selection and full delivery without a marketplace", async () => {
    const steel = p.materials.find((m) => m.name === "Cement")!;
    await change("QUOTE_RECORD", { materialRequirementId: steel.id, supplierName: "A", quantity: "10", unit: "bags", unitRatePaise: "38000" });
    const quote = p.supplierQuotes.find((q) => q.supplierName === "A")!;
    await change("QUOTE_SELECT", { quoteId: quote.id });
    expect(p.supplierQuotes.find((q) => q.id === quote.id)!.status).toBe("SELECTED");
    expect(p.events.map((e) => e.eventType)).toContain("SUPPLIER_QUOTE_SELECTED");
  });

  it("emits canonical work events and blocked-work guidance", async () => {
    const stage = p.stages[0];
    if (["NOT_STARTED", "READY"].includes(stage.status))
      await change("STAGE_UPDATE", { stageId: stage.id, status: "IN_PROGRESS" });
    await change("TASK_CREATE", { stageId: stage.id, title: "Blocked probe" });
    const task = p.tasks.find((t) => t.title === "Blocked probe")!;
    await change("TASK_UPDATE", { stageId: stage.id, taskId: task.id, status: "BLOCKED", notes: "Waiting on drawings." });
    expect(p.events.map((e) => e.eventType)).toContain("WORK_ITEM_BLOCKED");
    const blocked = p.guidance.find((g) => g.ruleKey === "G03" && g.subjectId === task.id && g.status === "ACTIVE");
    expect(blocked?.reason).toMatch(/Waiting on drawings/);
    await change("TASK_UPDATE", { stageId: stage.id, taskId: task.id, status: "IN_PROGRESS" });
    expect(p.guidance.filter((g) => g.ruleKey === "G03" && g.subjectId === task.id && g.status === "ACTIVE")).toHaveLength(0);
  });

  it("links documents contextually and unlinks them", async () => {
    const w = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: owner } });
    const docId = randomUUID().replaceAll("-", "");
    const v1 = randomUUID().replaceAll("-", "");
    await prisma.propertyDoc.create({
      data: {
        id: docId, workspaceId: w.id, propertyId: property, type: "Sanction map",
        name: "Drawing.pdf", displayName: "Structural Drawing", uploadDate: day,
        sizeBytes: 10, storageKey: `synthetic/${docId}`, mimeType: "application/pdf",
        scanStatus: "clean", reviewStatus: "awaiting_review", processingState: "ready",
        provenance: "user_uploaded", uploadedBy: owner, version: 1, verified: false, idempotencyKey: randomUUID(),
      },
    });
    await prisma.documentVersion.create({
      data: {
        id: v1, workspaceId: w.id, documentId: docId, version: 1,
        originalFilename: "Drawing.pdf", displayName: "Structural Drawing",
        mimeType: "application/pdf", sizeBytes: 10, sha256: randomUUID(),
        storageKey: `synthetic/${docId}/${v1}`, scanStatus: "clean",
        processingState: "ready", reviewStatus: "awaiting_review",
        source: "user_uploaded", uploadedBy: owner, uploadedAt: new Date(),
      },
    });
    await change("DOCUMENT_LINK", { documentId: docId, documentVersionId: v1, category: "Drawing" });
    const link = p.documents.find((d) => d.documentId === docId)!;
    await change("DOCUMENT_CONTEXT_SET", { linkId: link.id, contextType: "STAGE", contextId: p.stages[0].id, label: "Structural Drawing" });
    expect(p.documents.find((d) => d.id === link.id)?.contextType).toBe("STAGE");
    await change("DOCUMENT_UNLINK", { linkId: link.id });
    expect(p.events.map((e) => e.eventType)).toContain("CONSTRUCTION_DOCUMENT_UNLINKED");
    expect(p.documents.find((d) => d.id === link.id)).toBeUndefined();
  });

  it("collects handover evidence and gates completion on open items", async () => {
    await change("HANDOVER_START", { notes: "Close-out begun." });
    expect(p.events.map((e) => e.eventType)).toContain("HANDOVER_STARTED");
    await change("ISSUE_CREATE", { title: "Snag paint", description: "Touch up." });
    const snag = p.issues.find((i) => i.title === "Snag paint")!;
    await change("HANDOVER_UPDATE", { snagItemIds: [snag.id], warranties: [{ item: "Pump", years: 2 }] });
    expect(p.events.map((e) => e.eventType)).toContain("SNAG_ITEM_OPENED");
    await expect(change("HANDOVER_COMPLETE", { handoverDate: day })).rejects.toThrow(/open/i);
    await change("ISSUE_UPDATE", { issueId: snag.id, status: "RESOLVED", resolution: "Repainted." });
    await change("HANDOVER_UPDATE", { snagItemIds: [] });
    await change("HANDOVER_COMPLETE", { handoverDate: day });
    expect(p.events.map((e) => e.eventType)).toContain("HANDOVER_COMPLETED");
    expect(p.handover?.status).toBe("COMPLETED");
    expect(p.handover?.finalRecordedSpendPaise).toBe(p.money?.recordedSpendPaise);
  });

describe("Construction OS order/commitment and document-context invariants", async () => {
  const email = `os-invariant-${randomUUID()}@example.com`;
  const who = await login(email);
  const oid = who.id;
  const prop = await propertyFor(oid, `Invariant Plot ${randomUUID().slice(0, 8)}`);
  const created = await createConstructionForUser(oid, {
    propertyId: prop,
    name: `Invariant Home ${randomUUID().slice(0, 8)}`,
    projectType: "NEW_HOME",
    builtUpArea: "1000",
    areaUnit: "sqft",
    floorCount: 1,
    qualityLevel: "STANDARD",
    estimatedBudgetPaise: "500000000",
    startDate: day,
    targetCompletionDate: "2027-09-12",
    requirements: "Synthetic invariant fixture.",
    idempotencyKey: randomUUID(),
  });
  let v = await getConstructionForUser(oid, created.id, true);
  const run = async (action: string, data: Record<string, unknown> = {}) => {
    v = await mutateConstructionForUser(oid, v.id, {
      action,
      version: v.version,
      idempotencyKey: randomUUID(),
      ...data,
    });
    return v;
  };

  it("creates exactly one commitment per order and never duplicates", async () => {
    await run("MATERIAL_CREATE", { category: "Sand", name: "Sand", quantity: "100", unit: "bags", requiredByDate: day });
    const sand = v.materials.find((m) => m.name === "Sand")!;
    await run("ORDER_PLACE", { materialRequirementId: sand.id, supplierName: "Depot", orderedQuantity: "100", unit: "bags", totalPaise: "5000000" });
    await run("ORDER_PLACE", { materialRequirementId: sand.id, supplierName: "Depot", orderedQuantity: "50", unit: "bags", totalPaise: "2500000" });
    expect(v.orders).toHaveLength(2);
    expect(v.commitments).toHaveLength(2);
    expect(new Set(v.commitments.map((c) => c.id)).size).toBe(2);
    expect(v.commitments.every((c) => c.title.includes("Sand"))).toBe(true);
    expect(v.money?.committedPaise).toBe("7500000");
  });

  it("cancels the mirrored commitment with a spent guard and keeps spend exact", async () => {
    const big = v.orders.find((o) => o.totalPaise === "5000000")!;
    const small = v.orders.find((o) => o.totalPaise === "2500000")!;
    await run("ORDER_CANCEL", { orderId: small.id });
    expect(v.orders.find((o) => o.id === small.id)!.status).toBe("CANCELLED");
    expect(v.commitments.find((c) => c.id === small.commitmentId)!.status).toBe("CANCELLED");
    expect(v.events.map((e) => e.eventType)).toContain("COMMITMENT_CANCELLED");
    expect(v.money?.committedPaise).toBe("5000000");
    await run("COST_RECORD", {
      source: "USER_RECORDED_EXPENSE", title: "Sand part", amountPaise: "1000000",
      recordedDate: day, commitmentId: big.commitmentId,
    });
    await run("ORDER_CANCEL", { orderId: big.id });
    // Spend exists: the commitment survives cancellation of the order row.
    expect(v.commitments.find((c) => c.id === big.commitmentId)!.status).toBe("PARTIALLY_FULFILLED");
    expect(v.money?.recordedSpendPaise).toBe("1000000");
    expect(v.money?.committedPaise).toBe("4000000");
  });

  it("keeps partial delivery from changing committed totals silently", async () => {
    const big = v.orders.find((o) => o.totalPaise === "5000000")!;
    await run("DELIVERY_RECORD", { orderId: big.id, expectedQuantity: "50", receivedQuantity: "20", unit: "bags" });
    expect(v.events.map((e) => e.eventType)).toContain("DELIVERY_SHORTAGE_RECORDED");
    expect(v.commitments.find((c) => c.id === big.commitmentId)!.status).toBe("PARTIALLY_FULFILLED");
    // Outstanding = 5000000 − 1000000 linked actuals; delivery alone moves nothing.
    expect(v.money?.committedPaise).toBe("4000000");
    expect(v.money?.recordedSpendPaise).toBe("1000000");
  });

  it("links one Vault version in several contexts but never twice in one", async () => {
    const w = await prisma.workspace.findUniqueOrThrow({ where: { ownerUserId: oid } });
    const docId = randomUUID().replaceAll("-", "");
    const versionId = randomUUID().replaceAll("-", "");
    await prisma.propertyDoc.create({
      data: {
        id: docId, workspaceId: w.id, propertyId: prop, type: "Sanction map",
        name: "Plan.pdf", displayName: "Plan", uploadDate: day,
        sizeBytes: 10, storageKey: `synthetic/${docId}`, mimeType: "application/pdf",
        scanStatus: "clean", reviewStatus: "awaiting_review", processingState: "ready",
        provenance: "user_uploaded", uploadedBy: oid, version: 1, verified: false, idempotencyKey: randomUUID(),
      },
    });
    await prisma.documentVersion.create({
      data: {
        id: versionId, workspaceId: w.id, documentId: docId, version: 1,
        originalFilename: "Plan.pdf", displayName: "Plan",
        mimeType: "application/pdf", sizeBytes: 10, sha256: randomUUID(),
        storageKey: `synthetic/${docId}/${versionId}`, scanStatus: "clean",
        processingState: "ready", reviewStatus: "awaiting_review",
        source: "user_uploaded", uploadedBy: oid, uploadedAt: new Date(),
      },
    });
    const stageId = v.stages[0].id;
    await run("DOCUMENT_LINK", { documentId: docId, documentVersionId: versionId, category: "Drawing", contextType: "STAGE", contextId: stageId, label: "Plan" });
    await expect(
      run("DOCUMENT_LINK", { documentId: docId, documentVersionId: versionId, category: "Drawing", contextType: "STAGE", contextId: stageId, label: "Plan" }),
    ).rejects.toThrow(/already linked here/i);
    await run("DOCUMENT_LINK", { documentId: docId, documentVersionId: versionId, category: "Drawing", contextType: "PROJECT", label: "Plan" });
    expect(v.documents.filter((d) => d.documentVersionId === versionId)).toHaveLength(2);
    const links = await prisma.constructionDocumentLink.count({ where: { projectId: v.id, documentVersionId: versionId } });
    expect(links).toBe(2);
    const bytes = await prisma.propertyDoc.count({ where: { id: docId } });
    expect(bytes).toBe(1);
  });
});

  it("projects the same truth per role and enforces authorization", async () => {
    const stranger = await login(`os-stranger-${randomUUID()}@example.com`);
    await expect(getConstructionForUser(stranger.id, p.id)).rejects.toThrow();
    const archEmail = `os-arch-${randomUUID()}@example.com`;
    const architect = await login(archEmail);
    await change("CONTACT_CREATE", { name: "Arch Persona", role: "ARCHITECT", email: archEmail });
    const invitation = await createShareInvitationForUser(owner, property, {
      inviteeEmail: archEmail,
      role: "ARCHITECT",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      scopes: [
        { capability: "CONSTRUCTION_PROJECT_READ" },
        { capability: "CONSTRUCTION_TASK_READ" },
        { capability: "CONSTRUCTION_UPDATE_READ" },
        { capability: "CONSTRUCTION_MATERIAL_READ" },
      ],
      note: "OS core fixture",
    });
    await acceptShareInvitationForUser(architect.id, archEmail, invitation.invitationToken);
    const asArchitect = await getConstructionForUser(architect.id, p.id);
    expect(asArchitect.role).toBe("ARCHITECT");
    expect(asArchitect.money).toBeNull();
    expect(asArchitect.guidance.some((g) => ["G08", "G10", "G15"].includes(g.ruleKey))).toBe(false);
  });
});

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { AuthorizationError, type Principal, authorizeProperty, authorizePurchaseCandidate } from "@/lib/authz";
import { rupeesToPaise } from "@/lib/money";
import { createPropertyForUser } from "@/lib/property-repository";

const fail = (code: string, status = 400): never => { throw new AuthorizationError(code, status, code.replaceAll("_", " ")); };
const PHASES = ["CONSIDERING", "INFORMATION_GATHERING", "REVIEWING", "NEGOTIATING", "TERMS_RECORDED", "PRE_COMPLETION", "HANDOVER", "COMPLETED_RECORDED"] as const;
const LIFECYCLES = ["ACTIVE", "ON_HOLD", "NOT_PROCEEDING", "ARCHIVED"] as const;
const OFFER_STATUSES = ["DRAFT", "RECORDED", "COUNTERED", "WITHDRAWN", "EXPIRED", "AGREEMENT_REPORTED"] as const;
const ROLES = ["BUYER", "SELLER", "BUYER_LAWYER", "BROKER", "FINANCE_ADVISER", "VIEWER"] as const;

function text(value: unknown, required = false, max = 2000) {
  if (value === undefined || value === null || value === "") { if (required) return fail("VALUE_REQUIRED"); return null; }
  if (typeof value !== "string" || !value.trim() || value.length > max) return fail("INVALID_TEXT");
  return value.trim();
}
function requestKey(value: unknown) {
  const key = text(value, true, 100)!;
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key)) return fail("REQUEST_KEY_REQUIRED");
  return key;
}
function rupees(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  try { return rupeesToPaise(value); } catch { return fail("INVALID_AMOUNT"); }
}
function dateOnly(value: unknown, required = false) {
  const raw = text(value, required, 10);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fail("INVALID_DATE");
  return raw;
}
function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function json(value: unknown) {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item));
}

export function netPricePaidPaise(rows: Array<{ kind: string; allocation: string; amountPaise: bigint }>) {
  return rows.reduce((total, row) => {
    if (row.allocation !== "PRICE") return total;
    if (row.kind === "POSTED") return total + row.amountPaise;
    if (row.kind === "REVERSAL" || row.kind === "REFUND") return total - row.amountPaise;
    return total;
  }, 0n);
}

async function prior<T extends { id: string; payloadHash?: string; workspaceId?: string }>(model: { findUnique: (args: { where: { requestKey: string } }) => Promise<T | null> }, key: string, payloadHash: string, workspaceId: string) {
  const existing = await model.findUnique({ where: { requestKey: key } });
  if (!existing) return null;
  if (existing.workspaceId && existing.workspaceId !== workspaceId) return fail("REQUEST_CONFLICT", 409);
  if (existing.payloadHash && existing.payloadHash !== payloadHash) return fail("REQUEST_CONFLICT", 409);
  return existing;
}

export async function transactionCommand(principal: Principal, input: Record<string, unknown>) {
  const action = text(input.action, true, 40)!;
  const key = requestKey(input.requestKey);
  if (action === "create-sale") return createSale(principal, input, key);
  if (action === "add-prospect") return addProspect(principal, input, key);
  if (action === "record-offer") return recordOffer(principal, input, key);
  if (action === "revise-terms") return reviseTerms(principal, input, key);
  if (action === "acknowledge-terms") return acknowledgeTerms(principal, input, key);
  if (action === "set-financing") return setFinancing(principal, input, key);
  if (action === "add-plan-line") return addPlanLine(principal, input, key);
  if (action === "record-money") return recordMoney(principal, input, key);
  if (action === "add-visit") return addVisit(principal, input, key);
  if (action === "set-phase") return setPhase(principal, input);
  if (action === "update-handover") return updateHandover(principal, input);
  if (action === "link-passport") return linkPassport(principal, input, key);
  if (action === "invite") return invite(principal, input, key);
  if (action === "accept-invite") return acceptInvite(principal, input);
  if (action === "revoke-grant") return revokeGrant(principal, input);
  if (action === "add-note") return addNote(principal, input, key);
  if (action === "disclose") return disclose(principal, input, key);
  if (action === "revoke-disclosure") return revokeDisclosure(principal, input);
  return fail("INVALID_TRANSACTION_ACTION");
}

async function createSale(principal: Principal, input: Record<string, unknown>, key: string) {
  const propertyId = text(input.propertyId, true, 100)!;
  const property = await authorizeProperty(principal, propertyId);
  if (!property) return fail("PROPERTY_NOT_FOUND", 404);
  const possessionTargetDate = dateOnly(input.possessionTargetDate);
  const description = text(input.description) ?? "";
  const existing = await prisma.saleWorkspace.findUnique({ where: { requestKey: key } });
  if (existing) {
    if (existing.workspaceId !== principal.workspaceId || existing.propertyId !== propertyId) return fail("REQUEST_CONFLICT", 409);
    return { id: existing.id, duplicate: true };
  }
  const row = await prisma.saleWorkspace.create({
    data: { id: randomUUID(), workspaceId: principal.workspaceId, propertyId, askingPricePaise: rupees(input.askingPrice), possessionTargetDate, description, requestKey: key },
  });
  return { id: row.id, duplicate: false };
}

async function addProspect(principal: Principal, input: Record<string, unknown>, key: string) {
  const saleWorkspaceId = text(input.saleWorkspaceId, true, 100)!;
  const sale = await prisma.saleWorkspace.findFirst({ where: { id: saleWorkspaceId, workspaceId: principal.workspaceId } });
  if (!sale) return fail("SALE_NOT_FOUND", 404);
  const name = text(input.name, true, 200)!;
  const existing = await prisma.saleProspect.findUnique({ where: { requestKey: key } });
  if (existing) {
    if (existing.workspaceId !== principal.workspaceId || existing.name !== name) return fail("REQUEST_CONFLICT", 409);
    return { id: existing.id, duplicate: true };
  }
  const row = await prisma.saleProspect.create({
    data: { id: randomUUID(), saleWorkspaceId, workspaceId: principal.workspaceId, name, source: text(input.source, false, 500), privateNotes: text(input.privateNotes) ?? "", requestKey: key },
  });
  return { id: row.id, duplicate: false };
}

async function recordOffer(principal: Principal, input: Record<string, unknown>, key: string) {
  const amountPaise = rupees(input.amountRupees);
  if (amountPaise === null || amountPaise <= 0n) return fail("INVALID_AMOUNT");
  const authorSource = text(input.authorSource, true, 80)!;
  if (!["OWNER_ENTERED", "OWNER_REPORTED_SELLER", "OWNER_REPORTED_BUYER", "PARTICIPANT_SUBMITTED"].includes(authorSource)) return fail("INVALID_OFFER_SOURCE");
  const offeredOn = dateOnly(input.offeredOn, true)!;
  const status = text(input.status ?? "RECORDED", true, 40)!;
  if (!OFFER_STATUSES.includes(status as typeof OFFER_STATUSES[number])) return fail("INVALID_OFFER_STATUS");
  const candidateId = text(input.candidateId);
  const prospectId = text(input.prospectId);
  if (Boolean(candidateId) === Boolean(prospectId)) return fail("OFFER_SUBJECT_REQUIRED");
  if (candidateId && !await authorizePurchaseCandidate(principal, candidateId)) return fail("CANDIDATE_NOT_FOUND", 404);
  const prospect = prospectId ? await prisma.saleProspect.findFirst({ where: { id: prospectId, workspaceId: principal.workspaceId } }) : null;
  if (prospectId && !prospect) return fail("PROSPECT_NOT_FOUND", 404);
  const termsSnapshot = input.terms && typeof input.terms === "object" ? input.terms : {};
  const payloadHash = hash({ amountPaise: amountPaise.toString(), authorSource, offeredOn, status, candidateId, prospectId, termsSnapshot, previousOfferId: input.previousOfferId ?? null });
  const existing = await prisma.offerRevision.findUnique({ where: { requestKey: key } });
  if (existing) {
    if (existing.workspaceId !== principal.workspaceId || existing.payloadHash !== payloadHash) return fail("REQUEST_CONFLICT", 409);
    return { id: existing.id, duplicate: true };
  }
  return prisma.$transaction(async (tx) => {
    if (typeof input.previousOfferId === "string") {
      const previous = await tx.offerRevision.findFirst({ where: { id: input.previousOfferId, workspaceId: principal.workspaceId } });
      if (!previous) return fail("PREVIOUS_OFFER_NOT_FOUND", 404);
      if (previous.status === "RECORDED") await tx.offerRevision.update({ where: { id: previous.id }, data: { status: "COUNTERED" } });
    }
    const row = await tx.offerRevision.create({
      data: {
        id: randomUUID(), workspaceId: principal.workspaceId, candidateId, prospectId, saleWorkspaceId: prospect?.saleWorkspaceId ?? null,
        amountPaise, authorSource, previousOfferId: text(input.previousOfferId), status, termsSnapshot: json(termsSnapshot), offeredOn, requestKey: key, payloadHash,
      },
    });
    return { id: row.id, duplicate: false };
  });
}

async function reviseTerms(principal: Principal, input: Record<string, unknown>, key: string) {
  const candidateId = text(input.candidateId);
  const saleWorkspaceId = text(input.saleWorkspaceId);
  if (Boolean(candidateId) === Boolean(saleWorkspaceId)) return fail("TERMS_SUBJECT_REQUIRED");
  if (candidateId && !await authorizePurchaseCandidate(principal, candidateId)) return fail("CANDIDATE_NOT_FOUND", 404);
  if (saleWorkspaceId && !await prisma.saleWorkspace.findFirst({ where: { id: saleWorkspaceId, workspaceId: principal.workspaceId } })) return fail("SALE_NOT_FOUND", 404);
  const snapshot = input.snapshot;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return fail("TERMS_SNAPSHOT_REQUIRED");
  const payloadHash = hash({ candidateId, saleWorkspaceId, snapshot });
  const existing = await prisma.termsRevision.findUnique({ where: { requestKey: key } });
  if (existing) {
    if (existing.payloadHash !== payloadHash || existing.workspaceId !== principal.workspaceId) return fail("REQUEST_CONFLICT", 409);
    return { id: existing.id, duplicate: true };
  }
  const revision = (await prisma.termsRevision.count({ where: { workspaceId: principal.workspaceId, ...(candidateId ? { candidateId } : { saleWorkspaceId }) } })) + 1;
  const row = await prisma.termsRevision.create({ data: { id: randomUUID(), workspaceId: principal.workspaceId, candidateId, saleWorkspaceId, revision, snapshot: json(snapshot), requestKey: key, payloadHash } });
  return { id: row.id, revision, duplicate: false };
}

async function acknowledgeTerms(principal: Principal, input: Record<string, unknown>, key: string) {
  void key;
  const termsRevisionId = text(input.termsRevisionId, true, 100)!;
  const terms = await prisma.termsRevision.findFirst({ where: { id: termsRevisionId, workspaceId: principal.workspaceId } });
  if (!terms) return fail("TERMS_NOT_FOUND", 404);
  const acknowledgementType = text(input.acknowledgementType, true, 80)!;
  if (acknowledgementType !== "REPORTED_OUTSIDE_SUKOON") return fail("ACKNOWLEDGEMENT_IS_NOT_EXECUTION");
  const existing = await prisma.termsAcknowledgement.findFirst({ where: { termsRevisionId, actorUserId: principal.userId, acknowledgementType } });
  if (existing) return { id: existing.id, duplicate: true };
  const row = await prisma.termsAcknowledgement.create({ data: { id: randomUUID(), workspaceId: principal.workspaceId, termsRevisionId, actorUserId: principal.userId, acknowledgementType } });
  return { id: row.id, duplicate: false, meaning: "Recorded report of an outside discussion. Not an e-signature or government confirmation." };
}

async function setFinancing(principal: Principal, input: Record<string, unknown>, key: string) {
  const candidateId = text(input.candidateId, true, 100)!;
  if (!await authorizePurchaseCandidate(principal, candidateId)) return fail("CANDIDATE_NOT_FOUND", 404);
  const status = text(input.status, true, 40)!;
  if (!["NOT_STARTED", "EXPLORING", "APPLICATION_RECORDED", "SANCTION_REPORTED", "DISBURSEMENT_REPORTED", "DECLINED_REPORTED", "CANCELLED"].includes(status)) return fail("INVALID_FINANCING_STATUS");
  const data = {
    status,
    sourceOfFunds: text(input.sourceOfFunds, false, 200),
    requestedPaise: rupees(input.requestedRupees),
    sanctionedPaise: rupees(input.sanctionedRupees),
    disbursedPaise: rupees(input.disbursedRupees),
    conditions: text(input.conditions) ?? "",
  };
  const existing = await prisma.financingCase.findUnique({ where: { requestKey: key } });
  if (existing) {
    if (existing.workspaceId !== principal.workspaceId || existing.candidateId !== candidateId) return fail("REQUEST_CONFLICT", 409);
    return { id: existing.id, duplicate: true, paymentCreated: false };
  }
  const row = await prisma.financingCase.upsert({
    where: { candidateId_workspaceId: { candidateId, workspaceId: principal.workspaceId } },
    create: { id: randomUUID(), workspaceId: principal.workspaceId, candidateId, requestKey: key, ...data },
    update: { ...data, version: { increment: 1 } },
  });
  const payments = await prisma.transactionMoneyRecord.count({ where: { candidateId, workspaceId: principal.workspaceId } });
  return { id: row.id, duplicate: false, paymentCreated: false, moneyRecords: payments };
}

async function addPlanLine(principal: Principal, input: Record<string, unknown>, key: string) {
  const amountPaise = rupees(input.amountRupees);
  if (amountPaise === null || amountPaise <= 0n) return fail("INVALID_AMOUNT");
  const classification = text(input.classification, true, 20)!;
  if (!["PRICE", "ADDITIONAL"].includes(classification)) return fail("INVALID_CLASSIFICATION");
  const candidateId = text(input.candidateId);
  const saleWorkspaceId = text(input.saleWorkspaceId);
  if (Boolean(candidateId) === Boolean(saleWorkspaceId)) return fail("PLAN_SUBJECT_REQUIRED");
  if (candidateId && !await authorizePurchaseCandidate(principal, candidateId)) return fail("CANDIDATE_NOT_FOUND", 404);
  if (saleWorkspaceId && !await prisma.saleWorkspace.findFirst({ where: { id: saleWorkspaceId, workspaceId: principal.workspaceId } })) return fail("SALE_NOT_FOUND", 404);
  const payloadHash = hash({ amountPaise: amountPaise.toString(), classification, candidateId, saleWorkspaceId, label: input.label, dueDate: input.dueDate ?? null });
  const existing = await prior(prisma.paymentPlanLine, key, payloadHash, principal.workspaceId);
  if (existing) return { id: existing.id, duplicate: true, paymentCreated: false };
  const row = await prisma.paymentPlanLine.create({ data: { id: randomUUID(), workspaceId: principal.workspaceId, candidateId, saleWorkspaceId, label: text(input.label, true, 200)!, amountPaise, dueDate: dateOnly(input.dueDate), classification, requestKey: key, payloadHash } });
  return { id: row.id, duplicate: false, paymentCreated: false };
}

async function recordMoney(principal: Principal, input: Record<string, unknown>, key: string) {
  const amountPaise = rupees(input.amountRupees);
  if (amountPaise === null || amountPaise <= 0n) return fail("INVALID_AMOUNT");
  const kind = text(input.kind, true, 20)!;
  if (!["POSTED", "REVERSAL", "REFUND"].includes(kind)) return fail("INVALID_MONEY_KIND");
  const allocation = text(input.allocation, true, 20)!;
  if (!["PRICE", "ADDITIONAL"].includes(allocation)) return fail("INVALID_ALLOCATION");
  const candidateId = text(input.candidateId);
  const saleWorkspaceId = text(input.saleWorkspaceId);
  if (Boolean(candidateId) === Boolean(saleWorkspaceId)) return fail("MONEY_SUBJECT_REQUIRED");
  if (candidateId && !await authorizePurchaseCandidate(principal, candidateId)) return fail("CANDIDATE_NOT_FOUND", 404);
  if (saleWorkspaceId && !await prisma.saleWorkspace.findFirst({ where: { id: saleWorkspaceId, workspaceId: principal.workspaceId } })) return fail("SALE_NOT_FOUND", 404);
  const payloadHash = hash({ amountPaise: amountPaise.toString(), kind, allocation, candidateId, saleWorkspaceId, occurredOn: input.occurredOn, reversalOfId: input.reversalOfId ?? null });
  const existing = await prisma.transactionMoneyRecord.findUnique({ where: { requestKey: key } });
  if (existing) {
    if (existing.workspaceId !== principal.workspaceId || hash({ amountPaise: existing.amountPaise.toString(), kind: existing.kind, allocation: existing.allocation, candidateId: existing.candidateId, saleWorkspaceId: existing.saleWorkspaceId, occurredOn: existing.occurredOn, reversalOfId: existing.reversalOfId }) !== payloadHash) return fail("REQUEST_CONFLICT", 409);
    return { id: existing.id, duplicate: true };
  }
  if ((kind === "REVERSAL" || kind === "REFUND") && typeof input.reversalOfId === "string") {
    const original = await prisma.transactionMoneyRecord.findFirst({ where: { id: input.reversalOfId, workspaceId: principal.workspaceId, kind: "POSTED" } });
    if (!original) return fail("ORIGINAL_PAYMENT_NOT_FOUND", 404);
  }
  const row = await prisma.transactionMoneyRecord.create({
    data: { id: randomUUID(), workspaceId: principal.workspaceId, candidateId, saleWorkspaceId, amountPaise, kind, allocation, reversalOfId: text(input.reversalOfId), occurredOn: dateOnly(input.occurredOn, true)!, source: text(input.source, true, 80) ?? "OWNER_REPORTED", requestKey: key, note: text(input.note) ?? "" },
  });
  return { id: row.id, duplicate: false, providerConfirmation: false };
}

async function addVisit(principal: Principal, input: Record<string, unknown>, key: string) {
  const candidateId = text(input.candidateId);
  const prospectId = text(input.prospectId);
  if (Boolean(candidateId) === Boolean(prospectId)) return fail("VISIT_SUBJECT_REQUIRED");
  if (candidateId && !await authorizePurchaseCandidate(principal, candidateId)) return fail("CANDIDATE_NOT_FOUND", 404);
  if (prospectId && !await prisma.saleProspect.findFirst({ where: { id: prospectId, workspaceId: principal.workspaceId } })) return fail("PROSPECT_NOT_FOUND", 404);
  const startsOn = dateOnly(input.startsOn, true)!;
  const payloadHash = hash({ candidateId, prospectId, startsOn, contactName: input.contactName ?? null, notes: input.notes ?? "" });
  const existing = await prior(prisma.transactionVisit, key, payloadHash, principal.workspaceId);
  if (existing) return { id: existing.id, duplicate: true, invitationSent: false };
  const row = await prisma.transactionVisit.create({ data: { id: randomUUID(), workspaceId: principal.workspaceId, candidateId, prospectId, startsOn, contactName: text(input.contactName, false, 200), notes: text(input.notes) ?? "", observations: text(input.observations) ?? "", status: "PLANNED", requestKey: key, payloadHash } });
  return { id: row.id, duplicate: false, invitationSent: false };
}

async function setPhase(principal: Principal, input: Record<string, unknown>) {
  const phase = text(input.phase, true, 40)!;
  const lifecycle = text(input.lifecycle ?? "ACTIVE", true, 40)!;
  if (!PHASES.includes(phase as typeof PHASES[number]) || !LIFECYCLES.includes(lifecycle as typeof LIFECYCLES[number])) return fail("INVALID_PHASE");
  const candidateId = text(input.candidateId);
  const saleWorkspaceId = text(input.saleWorkspaceId);
  if (candidateId) {
    const current = await prisma.purchaseCandidate.findFirst({ where: { id: candidateId, workspaceId: principal.workspaceId } });
    if (!current) return fail("CANDIDATE_NOT_FOUND", 404);
    if (current.transactionPhase === phase && current.lifecycle === lifecycle) return { id: candidateId, phase, duplicate: true, ownershipChanged: false, paymentCreated: false };
    if (!Number.isInteger(input.version)) return fail("VERSION_REQUIRED", 409);
    const legacy = ["CONSIDERING", "INFORMATION_GATHERING", "REVIEWING", "ON_HOLD", "NOT_PROCEEDING"].includes(phase) ? phase : undefined;
    const changed = await prisma.purchaseCandidate.updateMany({ where: { id: candidateId, workspaceId: principal.workspaceId, version: input.version as number }, data: { transactionPhase: phase, lifecycle, ...(legacy && phase !== "ON_HOLD" && phase !== "NOT_PROCEEDING" ? { stage: legacy } : {}), ...(phase === "ON_HOLD" ? { stage: "ON_HOLD" } : {}), ...(phase === "NOT_PROCEEDING" ? { stage: "NOT_PROCEEDING" } : {}), version: { increment: 1 } } });
    if (changed.count !== 1) return fail("VERSION_CONFLICT", 409);
    return { id: candidateId, phase, ownershipChanged: false, paymentCreated: false };
  }
  if (!saleWorkspaceId) return fail("PHASE_SUBJECT_REQUIRED");
  const currentSale = await prisma.saleWorkspace.findFirst({ where: { id: saleWorkspaceId, workspaceId: principal.workspaceId } });
  if (!currentSale) return fail("SALE_NOT_FOUND", 404);
  if (currentSale.phase === phase && currentSale.lifecycle === lifecycle) return { id: saleWorkspaceId, phase, duplicate: true, ownershipChanged: false, paymentCreated: false };
  if (!Number.isInteger(input.version)) return fail("VERSION_REQUIRED", 409);
  const changed = await prisma.saleWorkspace.updateMany({ where: { id: saleWorkspaceId, workspaceId: principal.workspaceId, version: input.version as number }, data: { phase, lifecycle, version: { increment: 1 } } });
  if (changed.count !== 1) return fail("VERSION_CONFLICT", 409);
  return { id: saleWorkspaceId, phase, ownershipChanged: false, paymentCreated: false };
}

async function updateHandover(principal: Principal, input: Record<string, unknown>) {
  const candidateId = text(input.candidateId);
  const saleWorkspaceId = text(input.saleWorkspaceId);
  if (Boolean(candidateId) === Boolean(saleWorkspaceId)) return fail("HANDOVER_SUBJECT_REQUIRED");
  if (candidateId && !await authorizePurchaseCandidate(principal, candidateId)) return fail("CANDIDATE_NOT_FOUND", 404);
  if (saleWorkspaceId && !await prisma.saleWorkspace.findFirst({ where: { id: saleWorkspaceId, workspaceId: principal.workspaceId } })) return fail("SALE_NOT_FOUND", 404);
  const status = text(input.status ?? "IN_PROGRESS", true, 40)!;
  if (!["NOT_STARTED", "IN_PROGRESS", "COMPLETED_RECORDED"].includes(status)) return fail("INVALID_HANDOVER_STATUS");
  const items = Array.isArray(input.items) ? input.items : [];
  if (status === "COMPLETED_RECORDED" && input.confirmed !== true) return fail("HANDOVER_CONFIRMATION_REQUIRED");
  const normalized: Array<{ label: string; disposition: string; note: string }> = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") return fail("INVALID_HANDOVER_ITEM");
    const item = raw as Record<string, unknown>;
    const label = text(item.label, true, 200)!;
    const disposition = text(item.disposition ?? "OPEN", true, 40)!;
    if (!["OPEN", "DONE_REPORTED", "WAIVED_WITH_REASON", "DISPUTED"].includes(disposition)) return fail("INVALID_HANDOVER_ITEM");
    const note = text(item.note) ?? "";
    if (disposition === "WAIVED_WITH_REASON" && !note) return fail("WAIVER_REASON_REQUIRED");
    normalized.push({ label, disposition, note });
  }
  const plannedDate = dateOnly(input.plannedDate);
  const existing = await prisma.transactionHandover.findFirst({
    where: { workspaceId: principal.workspaceId, ...(candidateId ? { candidateId } : { saleWorkspaceId }) },
    include: { items: true },
  });
  if (existing && existing.status === status && (existing.plannedDate ?? null) === plannedDate && existing.items.length === normalized.length && normalized.every((item) => existing.items.some((row) => row.label === item.label && row.disposition === item.disposition && row.note === item.note))) {
    return { id: existing.id, registrationVerified: false, duplicate: true };
  }
  const handover = await prisma.transactionHandover.upsert({
    where: candidateId ? { candidateId_workspaceId: { candidateId, workspaceId: principal.workspaceId } } : { saleWorkspaceId_workspaceId: { saleWorkspaceId: saleWorkspaceId!, workspaceId: principal.workspaceId } },
    create: { id: randomUUID(), workspaceId: principal.workspaceId, candidateId, saleWorkspaceId, status, plannedDate: dateOnly(input.plannedDate) },
    update: { status, plannedDate: dateOnly(input.plannedDate), version: { increment: 1 }, ...(status === "COMPLETED_RECORDED" ? { snapshot: json({ confirmedAt: new Date().toISOString(), by: principal.userId }) } : {}) },
  });
  for (const item of normalized) {
    await prisma.transactionHandoverItem.upsert({
      where: { handoverId_label: { handoverId: handover.id, label: item.label } },
      create: { id: randomUUID(), handoverId: handover.id, workspaceId: principal.workspaceId, label: item.label, disposition: item.disposition, note: item.note },
      update: { disposition: item.disposition, note: item.note },
    });
  }
  return { id: handover.id, registrationVerified: false };
}

async function linkPassport(principal: Principal, input: Record<string, unknown>, key: string) {
  if (input.confirmed !== true) return fail("PASSPORT_CONFIRMATION_REQUIRED");
  const candidateId = text(input.candidateId, true, 100)!;
  const candidate = await authorizePurchaseCandidate(principal, candidateId);
  if (!candidate) return fail("CANDIDATE_NOT_FOUND", 404);
  if (candidate.transactionPhase !== "COMPLETED_RECORDED" && candidate.transactionPhase !== "HANDOVER") return fail("ACQUISITION_NOT_RECORDED", 409);
  if (candidate.linkedPropertyId) return { id: candidate.linkedPropertyId, duplicate: true, bytesCopied: false };
  if (!candidate.areaValue || !candidate.areaUnit) return fail("PASSPORT_AREA_REQUIRED", 409);
  const existing = await prisma.property.findFirst({ where: { workspaceId: principal.workspaceId, name: candidate.name, status: "active" } });
  if (existing) {
    await prisma.purchaseCandidate.update({ where: { id: candidate.id }, data: { linkedPropertyId: existing.id } });
    return { id: existing.id, duplicate: true, bytesCopied: false };
  }
  const created = await createPropertyForUser(principal.userId, {
    name: candidate.name,
    type: candidate.propertyType === "plot" ? "plot" : "flat",
    city: "Recorded from purchase",
    area: candidate.location ?? "Recorded from purchase",
    address: candidate.location ?? "Owner-entered from the purchase record",
    jurisdiction: "Owner-entered purchase record. Not government verified.",
    areaValue: candidate.areaValue,
    areaUnit: candidate.areaUnit,
    areaType: "built_up",
    ownerName: "Owner-asserted",
    ownershipAssertion: "self_asserted",
    ownershipProvenance: `Created from purchase candidate ${candidate.id} after explicit confirmation. Request ${key}. Not a transfer of a seller passport.`,
    identifiers: [],
  });
  const propertyId = (created.property as { id: string }).id;
  await prisma.purchaseCandidate.update({ where: { id: candidate.id }, data: { linkedPropertyId: propertyId } });
  return { id: propertyId, duplicate: false, bytesCopied: false, byteImport: "UNAVAILABLE_UNTIL_STORAGE_AND_SCAN" };
}

const ROLE_CAPABILITIES: Record<string, string[]> = {
  BUYER: ["SHARED_FACTS", "OWN_OFFERS", "SHARED_TERMS", "SCHEDULE"],
  SELLER: ["SHARED_FACTS", "SHARED_TERMS", "DISCLOSURE", "SCHEDULE"],
  BUYER_LAWYER: ["SELECTED_PAPERS", "ASSIGNED_QUESTIONS"],
  BROKER: ["PHASE", "VISITS", "SHARED_TERMS", "ASSIGNED_REQUESTS"],
  FINANCE_ADVISER: ["SELECTED_FINANCING"],
  VIEWER: ["NAMED_SUBJECTS"],
};

async function invite(principal: Principal, input: Record<string, unknown>, key: string) {
  const subjectType = text(input.subjectType, true, 20)!;
  const subjectId = text(input.subjectId, true, 100)!;
  const roleLabel = text(input.roleLabel, true, 40)!;
  if (!ROLES.includes(roleLabel as typeof ROLES[number]) || !["CANDIDATE", "SALE"].includes(subjectType)) return fail("INVALID_INVITE");
  const email = text(input.inviteeEmail, true, 320)!.toLowerCase();
  if (subjectType === "CANDIDATE" && !await authorizePurchaseCandidate(principal, subjectId)) return fail("CANDIDATE_NOT_FOUND", 404);
  if (subjectType === "SALE" && !await prisma.saleWorkspace.findFirst({ where: { id: subjectId, workspaceId: principal.workspaceId } })) return fail("SALE_NOT_FOUND", 404);
  const existing = await prisma.dealGrant.findUnique({ where: { requestKey: key } });
  if (existing) return { id: existing.id, duplicate: true, emailSent: false };
  const room = await prisma.dealRoom.upsert({
    where: { workspaceId_subjectType_subjectId: { workspaceId: principal.workspaceId, subjectType, subjectId } },
    create: { id: randomUUID(), workspaceId: principal.workspaceId, subjectType, subjectId },
    update: {},
  });
  const token = randomBytes(32).toString("base64url");
  const days = Number(input.expiresInDays ?? 7);
  if (!Number.isInteger(days) || days < 1 || days > 30) return fail("INVALID_EXPIRY");
  const grant = await prisma.dealGrant.create({
    data: { id: randomUUID(), roomId: room.id, workspaceId: principal.workspaceId, inviteeEmail: email, roleLabel, capabilities: ROLE_CAPABILITIES[roleLabel] ?? [], status: "INVITED", tokenHash: hash(token), expiresAt: new Date(Date.now() + days * 86400000), requestKey: key },
  });
  return { id: grant.id, invitationCreated: true, emailSent: false, token };
}

export async function acceptInvite(principal: Principal, input: Record<string, unknown>) {
  const token = text(input.token, true, 200)!;
  const grant = await prisma.dealGrant.findFirst({ where: { tokenHash: hash(token) } });
  if (!grant || grant.status !== "INVITED") return fail("INVITE_NOT_FOUND", 404);
  if (grant.expiresAt.getTime() <= Date.now()) {
    await prisma.dealGrant.update({ where: { id: grant.id }, data: { status: "EXPIRED" } });
    return fail("INVITE_EXPIRED", 409);
  }
  if (grant.inviteeEmail !== principal.email.toLowerCase()) return fail("INVITE_IDENTITY_MISMATCH", 403);
  await prisma.dealGrant.update({ where: { id: grant.id }, data: { status: "ACCEPTED", inviteeUserId: principal.userId, acceptedAt: new Date(), tokenHash: hash(randomBytes(32).toString("hex")) } });
  return { id: grant.id, accepted: true };
}

async function revokeGrant(principal: Principal, input: Record<string, unknown>) {
  const id = text(input.grantId, true, 100)!;
  const grant = await prisma.dealGrant.findFirst({ where: { id, workspaceId: principal.workspaceId } });
  if (!grant) return fail("GRANT_NOT_FOUND", 404);
  await prisma.dealGrant.update({ where: { id }, data: { status: "REVOKED", revokedAt: new Date() } });
  return { id, revoked: true };
}

async function addNote(principal: Principal, input: Record<string, unknown>, key: string) {
  const audience = text(input.audience ?? "AUTHOR_PRIVATE", true, 40)!;
  if (!["AUTHOR_PRIVATE", "ROOM"].includes(audience)) return fail("INVALID_NOTE_AUDIENCE");
  const roomId = text(input.roomId);
  if (audience === "ROOM") {
    if (!roomId) return fail("ROOM_REQUIRED");
    const allowed = await prisma.dealRoom.findFirst({ where: { id: roomId, workspaceId: principal.workspaceId } }) || await prisma.dealGrant.findFirst({ where: { roomId, inviteeUserId: principal.userId, status: "ACCEPTED", revokedAt: null, expiresAt: { gt: new Date() } } });
    if (!allowed) return fail("ROOM_NOT_FOUND", 404);
  }
  const existing = await prisma.dealNote.findUnique({ where: { requestKey: key } });
  if (existing) {
    if (existing.authorUserId !== principal.userId) return fail("REQUEST_CONFLICT", 409);
    return { id: existing.id, duplicate: true };
  }
  const room = roomId ? await prisma.dealRoom.findUnique({ where: { id: roomId } }) : null;
  const row = await prisma.dealNote.create({ data: { id: randomUUID(), roomId, workspaceId: room?.workspaceId ?? principal.workspaceId, authorUserId: principal.userId, audience, body: text(input.body, true)!, requestKey: key } });
  return { id: row.id, duplicate: false };
}

async function disclose(principal: Principal, input: Record<string, unknown>, key: string) {
  const roomId = text(input.roomId, true, 100)!;
  const room = await prisma.dealRoom.findFirst({ where: { id: roomId, workspaceId: principal.workspaceId } });
  if (!room) return fail("ROOM_NOT_FOUND", 404);
  const existing = await prisma.dealDisclosure.findUnique({ where: { requestKey: key } });
  if (existing) return { id: existing.id, duplicate: true };
  const row = await prisma.dealDisclosure.create({ data: { id: randomUUID(), roomId, workspaceId: principal.workspaceId, factKey: text(input.factKey, true, 80)!, factValue: text(input.factValue, true, 500)!, expiresAt: input.expiresAt ? new Date(String(input.expiresAt)) : null, requestKey: key } });
  return { id: row.id, duplicate: false, documentsAttached: false };
}

async function revokeDisclosure(principal: Principal, input: Record<string, unknown>) {
  const id = text(input.disclosureId, true, 100)!;
  const row = await prisma.dealDisclosure.findFirst({ where: { id, workspaceId: principal.workspaceId } });
  if (!row) return fail("DISCLOSURE_NOT_FOUND", 404);
  await prisma.dealDisclosure.update({ where: { id }, data: { revokedAt: new Date() } });
  return { id, revoked: true };
}

export async function dealProjection(userId: string, roomId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const grant = await prisma.dealGrant.findFirst({ where: { roomId, inviteeUserId: userId, status: "ACCEPTED", revokedAt: null, expiresAt: { gt: new Date() } } });
  const room = await prisma.dealRoom.findUnique({ where: { id: roomId }, include: { disclosures: true, notes: true } });
  if (!room || !grant || !user) return null;
  const disclosures = room.disclosures.filter((item) => !item.revokedAt && (!item.expiresAt || item.expiresAt.getTime() > Date.now()));
  const notes = room.notes.filter((note) => note.audience === "ROOM" || note.authorUserId === userId);
  const privateBudgets = 0;
  const competingOffers = grant.roleLabel === "SELLER" ? await prisma.offerRevision.count({ where: { saleWorkspaceId: room.subjectType === "SALE" ? room.subjectId : undefined, workspaceId: room.workspaceId } }) : 0;
  return {
    roomId,
    role: grant.roleLabel,
    disclosures: disclosures.map((item) => ({ factKey: item.factKey, factValue: item.factValue })),
    notes: notes.map((note) => ({ id: note.id, body: note.audience === "AUTHOR_PRIVATE" ? note.body : note.body, audience: note.audience })),
    privateBudgetsVisible: privateBudgets,
    competingOfferCount: grant.roleLabel === "SELLER" ? competingOffers : 0,
    byteDownload: false,
  };
}

export async function buyerStory(principal: Principal, candidateId: string) {
  const candidate = await authorizePurchaseCandidate(principal, candidateId);
  if (!candidate) return fail("CANDIDATE_NOT_FOUND", 404);
  const [offers, terms, financing, plan, money, visits, handover, entries] = await Promise.all([
    prisma.offerRevision.findMany({ where: { candidateId, workspaceId: principal.workspaceId }, orderBy: { offeredOn: "asc" } }),
    prisma.termsRevision.findMany({ where: { candidateId, workspaceId: principal.workspaceId }, orderBy: { revision: "desc" }, include: { acknowledgements: true } }),
    prisma.financingCase.findUnique({ where: { candidateId_workspaceId: { candidateId, workspaceId: principal.workspaceId } } }),
    prisma.paymentPlanLine.findMany({ where: { candidateId, workspaceId: principal.workspaceId }, orderBy: { dueDate: "asc" } }),
    prisma.transactionMoneyRecord.findMany({ where: { candidateId, workspaceId: principal.workspaceId } }),
    prisma.transactionVisit.findMany({ where: { candidateId, workspaceId: principal.workspaceId }, orderBy: { startsOn: "asc" } }),
    prisma.transactionHandover.findUnique({ where: { candidateId_workspaceId: { candidateId, workspaceId: principal.workspaceId } }, include: { items: true } }),
    prisma.purchaseEntry.findMany({ where: { candidateId, workspaceId: principal.workspaceId }, include: { events: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const guidance = await evaluateTransactionGuidance(principal.workspaceId, new Date());
  const net = netPricePaidPaise(money);
  const latest = [...offers].reverse().find((offer) => offer.authorSource !== "OWNER_REPORTED_SELLER" && offer.status !== "WITHDRAWN");
  const counter = [...offers].reverse().find((offer) => offer.authorSource === "OWNER_REPORTED_SELLER");
  return {
    candidate: { id: candidate.id, name: candidate.name, location: candidate.location, stage: candidate.stage, phase: candidate.transactionPhase ?? candidate.stage, lifecycle: candidate.lifecycle, askingPricePaise: candidate.askingPricePaise, budgetPaise: candidate.budgetPaise, linkedPropertyId: candidate.linkedPropertyId },
    whereWeAre: candidate.transactionPhase ?? candidate.stage,
    needsAttention: guidance.filter((item) => item.subjectId === candidateId).slice(0, 3),
    known: entries.map((entry) => ({ id: entry.id, kind: entry.kind, body: entry.body, state: entry.state, dueDate: entry.dueDate, events: entry.events.map((event) => ({ action: event.action, source: event.source, note: event.note })) })),
    commercial: { askingPricePaise: candidate.askingPricePaise, latestBuyerOfferPaise: latest?.amountPaise ?? null, reportedCounterPaise: counter?.amountPaise ?? null, agreed: false, offers: offers.map((offer) => ({ id: offer.id, amountPaise: offer.amountPaise, offeredOn: offer.offeredOn, authorSource: offer.authorSource, status: offer.status })) },
    terms: terms[0] ? { id: terms[0].id, revision: terms[0].revision, snapshot: terms[0].snapshot, acknowledgements: terms[0].acknowledgements.length } : null,
    nextDate: visits.find((visit) => visit.status === "PLANNED")?.startsOn ?? handover?.plannedDate ?? null,
    financing: financing ? { status: financing.status, requestedPaise: financing.requestedPaise, sanctionedPaise: financing.sanctionedPaise, disbursedPaise: financing.disbursedPaise } : null,
    money: { netPricePaidPaise: net, plannedPaise: plan.reduce((sum, line) => sum + line.amountPaise, 0n), lines: plan.map((line) => ({ label: line.label, amountPaise: line.amountPaise, dueDate: line.dueDate, classification: line.classification })), records: money.length },
    handover,
    guidance: guidance.filter((item) => item.subjectId === candidateId),
  };
}

export async function sellerStory(principal: Principal, saleWorkspaceId: string) {
  const sale = await prisma.saleWorkspace.findFirst({ where: { id: saleWorkspaceId, workspaceId: principal.workspaceId }, include: { property: true, prospects: { orderBy: { createdAt: "asc" } } } });
  if (!sale) return fail("SALE_NOT_FOUND", 404);
  const [offers, visits, guidance] = await Promise.all([
    prisma.offerRevision.findMany({ where: { workspaceId: principal.workspaceId, prospectId: { in: sale.prospects.map((item) => item.id) } }, orderBy: { offeredOn: "asc" } }),
    prisma.transactionVisit.findMany({ where: { workspaceId: principal.workspaceId, prospectId: { in: sale.prospects.map((item) => item.id) } } }),
    evaluateTransactionGuidance(principal.workspaceId, new Date()),
  ]);
  return {
    sale: { id: sale.id, propertyName: sale.property.name, askingPricePaise: sale.askingPricePaise, phase: sale.phase, lifecycle: sale.lifecycle, possessionTargetDate: sale.possessionTargetDate },
    prospects: sale.prospects.map((prospect) => ({
      id: prospect.id,
      name: prospect.name,
      source: prospect.source,
      status: prospect.status,
      privateNotes: prospect.privateNotes,
      offers: offers.filter((offer) => offer.prospectId === prospect.id).map((offer) => ({ amountPaise: offer.amountPaise, offeredOn: offer.offeredOn, authorSource: offer.authorSource, status: offer.status })),
      nextVisit: visits.find((visit) => visit.prospectId === prospect.id && visit.status === "PLANNED")?.startsOn ?? null,
    })),
    needsAttention: guidance.filter((item) => item.subjectId === sale.id || sale.prospects.some((prospect) => prospect.id === item.subjectId)).slice(0, 3),
    publishedListing: false,
  };
}

export async function evaluateTransactionGuidance(workspaceId: string, asOf: Date) {
  const [entries, offers, visits, handovers, plans, financing] = await Promise.all([
    prisma.purchaseEntry.findMany({ where: { workspaceId, kind: { in: ["QUESTION", "DOCUMENT_REQUEST"] } }, include: { events: true } }),
    prisma.offerRevision.findMany({ where: { workspaceId, status: "RECORDED", authorSource: "OWNER_REPORTED_SELLER" } }),
    prisma.transactionVisit.findMany({ where: { workspaceId, status: "PLANNED" } }),
    prisma.transactionHandover.findMany({ where: { workspaceId }, include: { items: true } }),
    prisma.paymentPlanLine.findMany({ where: { workspaceId } }),
    prisma.financingCase.findMany({ where: { workspaceId } }),
  ]);
  const wanted: Array<{ ruleKey: string; subjectType: string; subjectId: string; relevanceKey: string; title: string; href: string; dueDate: string | null; fingerprint: string }> = [];
  for (const entry of entries) {
    if (entry.kind === "DOCUMENT_REQUEST" && entry.state === "OPEN" && entry.dueDate && entry.dueDate <= asOf.toISOString().slice(0, 10)) {
      wanted.push({ ruleKey: "TX01", subjectType: "ENTRY", subjectId: entry.candidateId, relevanceKey: entry.id, title: `Follow up on ${entry.body}`, href: `/buy-sell/purchases/${entry.candidateId}/documents`, dueDate: entry.dueDate, fingerprint: entry.dueDate });
    }
    if (entry.kind === "QUESTION" && entry.state === "OPEN" && !entry.events.some((event) => event.action === "ANSWER")) {
      wanted.push({ ruleKey: "TX02", subjectType: "ENTRY", subjectId: entry.candidateId, relevanceKey: entry.id, title: entry.body, href: `/buy-sell/purchases/${entry.candidateId}/questions`, dueDate: entry.dueDate, fingerprint: entry.state });
    }
    if (entry.kind === "QUESTION" && entry.state === "ANSWERED") {
      wanted.push({ ruleKey: "TX03", subjectType: "ENTRY", subjectId: entry.candidateId, relevanceKey: entry.id, title: "Read the recorded response", href: `/buy-sell/purchases/${entry.candidateId}/questions`, dueDate: null, fingerprint: "ANSWERED" });
    }
  }
  for (const offer of offers) {
    wanted.push({ ruleKey: "TX05", subjectType: "OFFER", subjectId: offer.candidateId ?? offer.prospectId ?? offer.id, relevanceKey: offer.id, title: "Review the reported counter", href: offer.candidateId ? `/buy-sell/purchases/${offer.candidateId}` : `/buy-sell/sales/${offer.saleWorkspaceId}`, dueDate: offer.offeredOn, fingerprint: offer.amountPaise.toString() });
  }
  for (const visit of visits) {
    wanted.push({ ruleKey: "TX09", subjectType: "VISIT", subjectId: visit.candidateId ?? visit.prospectId ?? visit.id, relevanceKey: visit.id, title: "View the planned visit", href: visit.candidateId ? `/buy-sell/purchases/${visit.candidateId}` : "/buy-sell/sales", dueDate: visit.startsOn, fingerprint: visit.startsOn });
  }
  for (const handover of handovers) {
    const open = handover.items.filter((item) => item.disposition === "OPEN");
    if (open.length) wanted.push({ ruleKey: "TX10", subjectType: "HANDOVER", subjectId: handover.candidateId ?? handover.saleWorkspaceId ?? handover.id, relevanceKey: handover.id, title: "Check open handover items", href: handover.candidateId ? `/buy-sell/purchases/${handover.candidateId}` : "/buy-sell/sales", dueDate: handover.plannedDate, fingerprint: open.map((item) => item.label).join("|") });
  }
  for (const line of plans) {
    if (line.dueDate && line.dueDate <= new Date(asOf.getTime() + 7 * 86400000).toISOString().slice(0, 10)) {
      wanted.push({ ruleKey: "TX08", subjectType: "PLAN", subjectId: line.candidateId ?? line.saleWorkspaceId ?? line.id, relevanceKey: line.id, title: `Review planned payment: ${line.label}`, href: line.candidateId ? `/buy-sell/purchases/${line.candidateId}` : "/buy-sell/sales", dueDate: line.dueDate, fingerprint: line.amountPaise.toString() });
    }
  }
  for (const item of financing) {
    if (item.conditions && item.status === "APPLICATION_RECORDED") {
      wanted.push({ ruleKey: "TX07", subjectType: "FINANCING", subjectId: item.candidateId, relevanceKey: item.id, title: "Follow up on the financing condition", href: `/buy-sell/purchases/${item.candidateId}`, dueDate: null, fingerprint: item.conditions });
    }
  }
  const candidates = await prisma.purchaseCandidate.findMany({ where: { workspaceId, transactionPhase: "COMPLETED_RECORDED", linkedPropertyId: null } });
  for (const candidate of candidates) {
    wanted.push({ ruleKey: "TX13", subjectType: "CANDIDATE", subjectId: candidate.id, relevanceKey: candidate.id, title: "Review details before adding this purchase to Properties", href: `/buy-sell/purchases/${candidate.id}`, dueDate: null, fingerprint: "UNLINKED" });
  }
  const activeKeys = new Set<string>();
  for (const item of wanted) {
    const idKey = `${item.ruleKey}:${item.subjectId}:${item.relevanceKey}`;
    activeKeys.add(idKey);
    await prisma.transactionGuidance.upsert({
      where: { workspaceId_ruleKey_subjectType_subjectId_relevanceKey: { workspaceId, ruleKey: item.ruleKey, subjectType: item.subjectType, subjectId: item.subjectId, relevanceKey: item.relevanceKey } },
      create: { id: randomUUID(), workspaceId, ruleKey: item.ruleKey, subjectType: item.subjectType, subjectId: item.subjectId, relevanceKey: item.relevanceKey, title: item.title, href: item.href, dueDate: item.dueDate, state: "ACTIVE", sourceFingerprint: item.fingerprint, evaluatedAt: asOf },
      update: { title: item.title, href: item.href, dueDate: item.dueDate, state: "ACTIVE", sourceFingerprint: item.fingerprint, evaluatedAt: asOf },
    });
  }
  const current = await prisma.transactionGuidance.findMany({ where: { workspaceId, state: "ACTIVE" } });
  for (const row of current) {
    if (!activeKeys.has(`${row.ruleKey}:${row.subjectId}:${row.relevanceKey}`)) await prisma.transactionGuidance.update({ where: { id: row.id }, data: { state: "CLOSED", evaluatedAt: asOf } });
  }
  return prisma.transactionGuidance.findMany({ where: { workspaceId, state: "ACTIVE" }, orderBy: { dueDate: "asc" } });
}

export async function transactionSearchForUser(workspaceId: string, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const matches = (value: string) => terms.every((term) => value.toLowerCase().includes(term));
  const [candidates, sales, entries] = await Promise.all([
    prisma.purchaseCandidate.findMany({ where: { workspaceId }, select: { id: true, name: true, location: true, stage: true, transactionPhase: true } }),
    prisma.saleWorkspace.findMany({ where: { workspaceId }, include: { property: { select: { name: true } }, prospects: { select: { id: true, name: true, source: true } } } }),
    prisma.purchaseEntry.findMany({ where: { workspaceId, kind: { in: ["QUESTION", "DOCUMENT_REQUEST", "NOTE"] } }, select: { id: true, candidateId: true, body: true, kind: true } }),
  ]);
  const purchaseHits = candidates.filter((row) => matches(`${row.name} ${row.location ?? ""} ${row.transactionPhase ?? row.stage}`)).map((row) => ({ kind: "purchase" as const, id: row.id, title: row.name, subtitle: row.transactionPhase ?? row.stage, href: `/buy-sell/purchases/${row.id}` }));
  const questionHits = entries.filter((row) => matches(row.body)).map((row) => ({ kind: "question" as const, id: row.id, title: row.body, subtitle: row.kind, href: `/buy-sell/purchases/${row.candidateId}/questions` }));
  const saleHits = sales.flatMap((sale) => {
    const rows: Array<{ kind: "sale" | "prospect"; id: string; title: string; subtitle: string; href: string }> = [];
    if (matches(sale.property.name)) rows.push({ kind: "sale", id: sale.id, title: sale.property.name, subtitle: sale.phase, href: `/buy-sell/sales/${sale.id}` });
    for (const prospect of sale.prospects) {
      if (matches(`${prospect.name} ${prospect.source ?? ""}`)) rows.push({ kind: "prospect", id: prospect.id, title: prospect.name, subtitle: "Interested buyer", href: `/buy-sell/sales/${sale.id}` });
    }
    return rows;
  });
  return [...purchaseHits, ...saleHits, ...questionHits];
}

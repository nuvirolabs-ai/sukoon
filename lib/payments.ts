import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getWorkspaceForUser } from "@/lib/repository";
import { rupeesToPaise } from "@/lib/money";
import { assertDateOnly } from "@/lib/obligations";
import { reconcileRemindersForObligation } from "@/lib/durable-reminders";

export class PaymentInputError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "PaymentInputError";
    this.code = code;
    this.status = status;
  }
}

type PaymentInput = {
  amount?: unknown;
  amountPaise?: unknown;
  currency?: unknown;
  paymentDate?: unknown;
  method?: unknown;
  idempotencyKey?: unknown;
  receiptDocumentId?: unknown;
  receiptDocumentVersionId?: unknown;
  notes?: unknown;
  expectedOccurrenceVersion?: unknown;
};

function text(value: unknown, label: string, max = 200) {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > max) throw new PaymentInputError("PAYMENT_INPUT_INVALID", `${label} is invalid.`);
  return value.trim();
}

function parseAmount(input: PaymentInput) {
  try {
    const value = input.amountPaise !== undefined && input.amountPaise !== null && input.amountPaise !== "" ? BigInt(String(input.amountPaise)) : rupeesToPaise(input.amount);
    if (value <= 0n) throw new Error("non-positive");
    return value;
  } catch { throw new PaymentInputError("PAYMENT_AMOUNT_INVALID", "Payment amount must be a positive integer number of paise or rupee value."); }
}

function dto(payment: { id: string; occurrenceId: string; amountPaise: bigint; currency: string; paymentDate: string; method: string; status: string; source: string; notes: string | null; idempotencyKey: string; receiptDocumentId: string | null; receiptDocumentVersionId: string | null; reversedAt: Date | null; reversalOfId: string | null; createdAt: Date }) {
  return { ...payment, amountPaise: payment.amountPaise.toString(), amount: Number(payment.amountPaise) / 100, reversedAt: payment.reversedAt?.toISOString() ?? null };
}

async function occurrenceForUser(userId: string, occurrenceId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new PaymentInputError("OCCURRENCE_NOT_FOUND", "Occurrence not found.", 404);
  const occurrence = await prisma.obligationOccurrence.findFirst({ where: { id: occurrenceId, workspaceId: workspace.id }, include: { obligation: true, property: true } });
  if (!occurrence || occurrence.property.status !== "active") throw new PaymentInputError("OCCURRENCE_NOT_FOUND", "Occurrence not found.", 404);
  return { workspace, occurrence };
}

async function validateReceipt(tx: Prisma.TransactionClient, workspaceId: string, propertyId: string, documentId: string | null, versionId: string | null) {
  if (!documentId && !versionId) return;
  if (!documentId || !versionId) throw new PaymentInputError("RECEIPT_REFERENCE_INVALID", "Receipt document and version are both required.");
  const document = await tx.propertyDoc.findFirst({ where: { id: documentId, workspaceId, propertyId, archivedAt: null, deletedAt: null, scanStatus: "clean" } });
  if (!document) throw new PaymentInputError("RECEIPT_NOT_AVAILABLE", "Receipt must be an active clean document in this property's vault.", 422);
  const version = await tx.documentVersion.findFirst({ where: { id: versionId, workspaceId, documentId, scanStatus: "clean" } });
  if (!version) throw new PaymentInputError("RECEIPT_NOT_AVAILABLE", "Receipt version is not an available clean vault version.", 422);
}

async function activePaid(tx: Prisma.TransactionClient, occurrenceId: string) {
  const payments = await tx.obligationPayment.findMany({ where: { occurrenceId, status: "RECORDED", reversalOfId: null }, select: { amountPaise: true } });
  return payments.reduce((sum, payment) => sum + payment.amountPaise, 0n);
}

async function summaryFor(tx: Prisma.TransactionClient | typeof prisma, occurrenceId: string) {
  const occurrence = await tx.obligationOccurrence.findUniqueOrThrow({ where: { id: occurrenceId }, include: { payments: { orderBy: { createdAt: "asc" }, select: { id: true, occurrenceId: true, amountPaise: true, currency: true, paymentDate: true, method: true, status: true, source: true, notes: true, idempotencyKey: true, receiptDocumentId: true, receiptDocumentVersionId: true, reversedAt: true, reversalOfId: true, createdAt: true } } } });
  const paidPaise = await activePaid(tx, occurrenceId);
  const remainingPaise = occurrence.amountPaise === null ? null : occurrence.amountPaise - paidPaise;
  return { occurrence: { id: occurrence.id, obligationId: occurrence.obligationId, propertyId: occurrence.propertyId, cycleKey: occurrence.cycleKey, dueDate: occurrence.dueDate, amountPaise: occurrence.amountPaise?.toString() ?? null, currency: occurrence.currency, status: occurrence.status, version: occurrence.version }, originalAmountPaise: occurrence.amountPaise?.toString() ?? null, paidPaise: paidPaise.toString(), remainingPaise: remainingPaise?.toString() ?? null, payments: occurrence.payments.map(dto) };
}

export async function getOccurrencePaymentSummaryForUser(userId: string, occurrenceId: string) {
  await occurrenceForUser(userId, occurrenceId);
  return summaryFor(prisma, occurrenceId);
}

export async function recordPaymentForUser(userId: string, occurrenceId: string, rawInput: PaymentInput) {
  const { workspace, occurrence } = await occurrenceForUser(userId, occurrenceId);
  if (occurrence.obligation.direction === "NON_FINANCIAL" || occurrence.amountPaise === null) throw new PaymentInputError("PAYMENT_NOT_APPLICABLE", "Non-financial obligations do not accept monetary payment records.", 422);
  const amount = parseAmount(rawInput);
  const currency = text(rawInput.currency, "Currency", 3);
  if (!/^[A-Z]{3}$/.test(currency) || currency !== occurrence.currency) throw new PaymentInputError("CURRENCY_MISMATCH", "Payment currency must match the obligation currency.");
  const paymentDate = assertDateOnly(rawInput.paymentDate, "Payment date");
  const method = text(rawInput.method, "Payment method", 80);
  const idempotencyKey = text(rawInput.idempotencyKey, "Idempotency key", 160);
  const receiptDocumentId = rawInput.receiptDocumentId ? text(rawInput.receiptDocumentId, "Receipt document", 80) : null;
  const receiptDocumentVersionId = rawInput.receiptDocumentVersionId ? text(rawInput.receiptDocumentVersionId, "Receipt version", 80) : null;
  const notes = rawInput.notes ? text(rawInput.notes, "Notes", 2_000) : null;
  const expected = rawInput.expectedOccurrenceVersion === undefined || rawInput.expectedOccurrenceVersion === null || rawInput.expectedOccurrenceVersion === "" ? null : Number(rawInput.expectedOccurrenceVersion);
  if (expected !== null && (!Number.isInteger(expected) || expected < 0)) throw new PaymentInputError("OCCURRENCE_VERSION_INVALID", "Occurrence version is invalid.");

  const duplicate = await prisma.obligationPayment.findUnique({ where: { idempotencyKey } });
  if (duplicate) {
    if (duplicate.workspaceId !== workspace.id || duplicate.occurrenceId !== occurrenceId || duplicate.amountPaise !== amount || duplicate.currency !== currency || duplicate.paymentDate !== paymentDate || duplicate.method !== method || duplicate.receiptDocumentId !== receiptDocumentId || duplicate.receiptDocumentVersionId !== receiptDocumentVersionId) throw new PaymentInputError("IDEMPOTENCY_CONFLICT", "This idempotency key was already used for a different payment.", 409);
    return { payment: dto(duplicate), summary: await summaryFor(prisma, occurrenceId), duplicate: true };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.obligationOccurrence.findUnique({ where: { id: occurrenceId }, include: { obligation: true } });
      if (!current || current.workspaceId !== workspace.id || current.obligation.direction === "NON_FINANCIAL") throw new PaymentInputError("OCCURRENCE_NOT_FOUND", "Occurrence not found.", 404);
      if (current.status === "CANCELLED" || !current.obligation.active) throw new PaymentInputError("OCCURRENCE_INACTIVE", "Cancelled occurrences and inactive schedules do not accept new payments.", 409);
      if (expected !== null && current.version !== expected) throw new PaymentInputError("OCCURRENCE_VERSION_CONFLICT", "This occurrence changed in another request. Reload before recording payment.", 409);
      const paidBefore = await activePaid(tx, occurrenceId);
      if (paidBefore + amount > (current.amountPaise ?? 0n)) throw new PaymentInputError("PAYMENT_OVERPAYMENT", "Payment cannot exceed the outstanding occurrence amount.", 409);
      const locked = await tx.obligationOccurrence.updateMany({ where: { id: occurrenceId, workspaceId: workspace.id, version: current.version }, data: { version: { increment: 1 } } });
      if (locked.count !== 1) throw new PaymentInputError("OCCURRENCE_VERSION_CONFLICT", "This occurrence changed in another request. Reload before recording payment.", 409);
      await validateReceipt(tx, workspace.id, occurrence.propertyId, receiptDocumentId, receiptDocumentVersionId);
      const payment = await tx.obligationPayment.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: current.propertyId, obligationId: current.obligationId, occurrenceId, amountPaise: amount, currency, paymentDate, method, status: "RECORDED", source: "USER_ENTERED", notes, idempotencyKey, receiptDocumentId, receiptDocumentVersionId } });
      const paidAfter = paidBefore + amount;
      const status = paidAfter >= (current.amountPaise ?? 0n) ? "COMPLETED" : current.dueDate < new Date().toISOString().slice(0, 10) ? "OVERDUE" : "OPEN";
      await tx.obligationOccurrence.update({ where: { id: occurrenceId }, data: { status } });
      await tx.expenseLedgerEntry.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: current.propertyId, paymentId: payment.id, obligationId: current.obligationId, occurrenceId, amountPaise: amount, currency, entryType: "OBLIGATION_PAYMENT", canonicalKey: `payment:${payment.id}` } });
      await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: workspace.id, propertyId: current.propertyId, date: paymentDate, title: "Payment recorded", detail: `${method} payment recorded against ${current.obligation.label}.`, kind: "tax" } });
      return { payment, summary: await summaryFor(tx, occurrenceId) };
    });
    await reconcileRemindersForObligation(occurrence.obligationId);
    return { ...result, payment: dto(result.payment), duplicate: false };
  } catch (error: unknown) {
    if (error instanceof PaymentInputError) throw error;
    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002") throw new PaymentInputError("IDEMPOTENCY_CONFLICT", "This idempotency key was already used.", 409);
    throw error;
  }
}

export async function reversePaymentForUser(userId: string, paymentId: string, idempotencyKey: string) {
  const { workspace } = await occurrenceForUser(userId, (await prisma.obligationPayment.findUnique({ where: { id: paymentId }, select: { occurrenceId: true } }))?.occurrenceId ?? "");
  const key = text(idempotencyKey, "Idempotency key", 160);
  const existing = await prisma.obligationPayment.findUnique({ where: { idempotencyKey: key } });
  if (existing) {
    if (existing.workspaceId !== workspace.id || existing.reversalOfId !== paymentId) throw new PaymentInputError("IDEMPOTENCY_CONFLICT", "This idempotency key was already used for a different correction.", 409);
    return { payment: dto(existing), duplicate: true, summary: await summaryFor(prisma, existing.occurrenceId) };
  }
  const payment = await prisma.obligationPayment.findFirst({ where: { id: paymentId, workspaceId: workspace.id } });
  if (!payment) throw new PaymentInputError("PAYMENT_NOT_FOUND", "Payment not found.", 404);
  if (payment.status !== "RECORDED" || payment.reversalOfId) throw new PaymentInputError("PAYMENT_ALREADY_REVERSED", "This payment was already reversed.", 409);
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.obligationPayment.findFirst({ where: { id: paymentId, workspaceId: workspace.id, status: "RECORDED", reversalOfId: null } });
    if (!current) throw new PaymentInputError("PAYMENT_ALREADY_REVERSED", "This payment was already reversed.", 409);
    const reversed = await tx.obligationPayment.update({ where: { id: paymentId }, data: { status: "REVERSED", reversedAt: new Date(), version: { increment: 1 } } });
    const correction = await tx.obligationPayment.create({ data: { id: randomUUID(), workspaceId: current.workspaceId, propertyId: current.propertyId, obligationId: current.obligationId, occurrenceId: current.occurrenceId, amountPaise: current.amountPaise, currency: current.currency, paymentDate: new Date().toISOString().slice(0, 10), method: "reversal", status: "REVERSAL", source: "USER_ENTERED_CORRECTION", notes: `Reversal of ${current.id}`, idempotencyKey: key, reversalOfId: current.id } });
    await tx.expenseLedgerEntry.create({ data: { id: randomUUID(), workspaceId: current.workspaceId, propertyId: current.propertyId, paymentId: correction.id, obligationId: current.obligationId, occurrenceId: current.occurrenceId, amountPaise: -current.amountPaise, currency: current.currency, entryType: "OBLIGATION_PAYMENT_REVERSAL", canonicalKey: `reversal:${current.id}` } });
    const paid = await activePaid(tx, current.occurrenceId);
    const occurrence = await tx.obligationOccurrence.findUniqueOrThrow({ where: { id: current.occurrenceId } });
    const status = paid >= (occurrence.amountPaise ?? 0n) ? "COMPLETED" : occurrence.dueDate < new Date().toISOString().slice(0, 10) ? "OVERDUE" : "OPEN";
    await tx.obligationOccurrence.update({ where: { id: occurrence.id }, data: { status, version: { increment: 1 } } });
    await tx.timelineEvent.create({ data: { id: randomUUID(), workspaceId: current.workspaceId, propertyId: current.propertyId, date: correction.paymentDate, title: "Payment reversed", detail: `Payment ${current.id} was reversed with an explicit correction entry.`, kind: "tax" } });
    return { reversed, correction, summary: await summaryFor(tx, current.occurrenceId) };
  });
  await reconcileRemindersForObligation(payment.obligationId);
  return { payment: dto(result.correction), reversedPayment: dto(result.reversed), summary: result.summary, duplicate: false };
}

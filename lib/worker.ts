import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type JobStatus = "queued" | "processing" | "succeeded" | "retryable_failure" | "terminal_failure";
export type JobRecord = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
  idempotencyKey: string | null;
  correlationId: string | null;
  status: string;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  lastError: unknown;
  deadLetteredAt: Date | null;
  createdAt: Date;
};

export class JobInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobInputError";
  }
}

export class JobOwnershipError extends Error {
  constructor(message = "The worker does not own this job claim.") {
    super(message);
    this.name = "JobOwnershipError";
  }
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  try { return JSON.parse(JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? nested.toString() : nested)) as Prisma.InputJsonValue; } catch { throw new JobInputError("Job payload must be JSON serializable."); }
}

function payloadHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload, (_key, nested) => typeof nested === "bigint" ? nested.toString() : nested)).digest("hex");
}

export function sanitizeWorkerError(error: unknown) {
  const source = error instanceof Error ? error : new Error("Unknown worker failure.");
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "WORKER_FAILURE";
  return { code: code.slice(0, 80), message: source.message.slice(0, 240), retryable: true };
}

export function retryDelayMs(attempt: number) {
  return Math.min(60_000, 100 * (2 ** Math.max(0, attempt - 1)));
}

function toJobRecord(row: { id: string; aggregateType: string; aggregateId: string; eventType: string; payload: unknown; idempotencyKey: string | null; correlationId: string | null; status: string; attempts: number; maxAttempts: number; nextAttemptAt: Date; lockedAt: Date | null; lockedBy: string | null; startedAt: Date | null; completedAt: Date | null; lastError: unknown; deadLetteredAt: Date | null; createdAt: Date }): JobRecord {
  return row;
}

export async function enqueueJob(input: {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
  idempotencyKey: string;
  correlationId?: string;
  maxAttempts?: number;
  nextAttemptAt?: Date;
}, db: Prisma.TransactionClient = prisma) {
  if (!input.idempotencyKey.trim()) throw new JobInputError("An idempotency key is required.");
  const maxAttempts = input.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) throw new JobInputError("Job attempts must be between 1 and 10.");
  const hash = payloadHash(input.payload);
  const existing = await db.outboxEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) {
    if (existing.eventType !== input.eventType || existing.aggregateId !== input.aggregateId || existing.payload && payloadHash(existing.payload) !== hash) throw new JobInputError("The idempotency key was already used for a different job.");
    return { job: toJobRecord(existing), duplicate: true };
  }
  try {
    const created = await db.outboxEvent.create({ data: {
      id: randomUUID(),
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      eventType: input.eventType,
      payload: jsonValue(input.payload),
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId ?? randomUUID(),
      maxAttempts,
      nextAttemptAt: input.nextAttemptAt ?? new Date(),
      status: "queued",
    } });
    return { job: toJobRecord(created), duplicate: false };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const raced = await db.outboxEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (raced) return { job: toJobRecord(raced), duplicate: true };
    }
    throw error;
  }
}

export async function claimNextJob(workerId: string, leaseMs = 30_000, eventTypes?: string[]) {
  if (!workerId.trim()) throw new JobInputError("A worker ID is required.");
  const boundedLease = Math.max(100, Math.min(300_000, Math.floor(leaseMs)));
  return prisma.$transaction(async (tx) => {
    const candidates = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "OutboxEvent"
      WHERE (
        "status" IN ('queued', 'retryable_failure')
        OR ("status" = 'processing' AND "lockedAt" IS NOT NULL AND "lockedAt" < NOW() - (${boundedLease} * INTERVAL '1 millisecond'))
      )
      AND "nextAttemptAt" <= NOW()
      AND "attempts" < "maxAttempts"
      ${eventTypes?.length ? Prisma.sql`AND "eventType" IN (${Prisma.join(eventTypes)})` : Prisma.empty}
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);
    const id = candidates[0]?.id;
    if (!id) return null;
    const now = new Date();
    const current = await tx.outboxEvent.findUniqueOrThrow({ where: { id } });
    const claimed = await tx.outboxEvent.update({ where: { id }, data: { status: "processing", attempts: { increment: 1 }, lockedAt: now, lockedBy: workerId, startedAt: current.startedAt ?? now } });
    return toJobRecord(claimed);
  });
}

export async function completeJob(jobId: string, workerId: string) {
  const result = await prisma.outboxEvent.updateMany({ where: { id: jobId, status: "processing", lockedBy: workerId }, data: { status: "succeeded", completedAt: new Date(), processedAt: new Date(), lockedAt: null, lockedBy: null } });
  if (result.count !== 1) throw new JobOwnershipError();
}

export async function failJob(jobId: string, workerId: string, error: unknown) {
  const job = await prisma.outboxEvent.findFirst({ where: { id: jobId, status: "processing", lockedBy: workerId } });
  if (!job) throw new JobOwnershipError();
  const terminal = job.attempts >= job.maxAttempts;
  const failure = sanitizeWorkerError(error);
  await prisma.outboxEvent.update({ where: { id: jobId }, data: {
    status: terminal ? "terminal_failure" : "retryable_failure",
    lastError: failure,
    nextAttemptAt: terminal ? job.nextAttemptAt : new Date(Date.now() + retryDelayMs(job.attempts)),
    deadLetteredAt: terminal ? new Date() : null,
    lockedAt: null,
    lockedBy: null,
  } });
  return terminal ? "terminal_failure" as const : "retryable_failure" as const;
}

export async function releaseJob(jobId: string, workerId: string) {
  const result = await prisma.outboxEvent.updateMany({ where: { id: jobId, status: "processing", lockedBy: workerId }, data: { status: "retryable_failure", nextAttemptAt: new Date(), lockedAt: null, lockedBy: null, lastError: { code: "WORKER_RELEASED", message: "Worker released the claim during shutdown.", retryable: true } } });
  if (result.count !== 1) throw new JobOwnershipError();
}

export async function recordJobEffect(input: { jobId: string; effectKey: string; aggregateType: string; aggregateId: string; result?: unknown }) {
  if (!input.effectKey.trim()) throw new JobInputError("A job effect key is required.");
  return prisma.jobEffect.upsert({
    where: { effectKey: input.effectKey },
    update: {},
    create: { id: randomUUID(), jobId: input.jobId, effectKey: input.effectKey, aggregateType: input.aggregateType, aggregateId: input.aggregateId, result: input.result === undefined ? undefined : jsonValue(input.result) },
  });
}

export async function runWorkerOnce(workerId: string, handler: (job: JobRecord) => Promise<void>, options?: { leaseMs?: number; eventTypes?: string[] }) {
  const job = await claimNextJob(workerId, options?.leaseMs, options?.eventTypes);
  if (!job) return null;
  try {
    await handler(job);
    await completeJob(job.id, workerId);
    return { jobId: job.id, status: "succeeded" as const };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "PROCESSING_WITHDRAWN") {
      await prisma.outboxEvent.updateMany({ where: { id: job.id, status: "processing", lockedBy: workerId }, data: { status: "cancelled", lockedAt: null, lockedBy: null, lastError: { code: "PROCESSING_WITHDRAWN", providerDataNotRecalled: true } } });
      return { jobId: job.id, status: "cancelled" as const };
    }
    const status = await failJob(job.id, workerId, error);
    return { jobId: job.id, status };
  }
}

export class DurableWorker {
  private stopping = false;
  private active: Promise<unknown> | null = null;

  constructor(private readonly workerId: string, private readonly options: { pollMs?: number; leaseMs?: number } = {}) {}

  async runOnce(handler: (job: JobRecord) => Promise<void>) {
    if (this.stopping) return null;
    const current = runWorkerOnce(this.workerId, handler, { leaseMs: this.options.leaseMs });
    this.active = current;
    try { return await current; } finally { this.active = null; }
  }

  async start(handler: (job: JobRecord) => Promise<void>) {
    this.stopping = false;
    while (!this.stopping) {
      await this.runOnce(handler);
      if (!this.stopping) await new Promise((resolve) => setTimeout(resolve, this.options.pollMs ?? 500));
    }
  }

  async stop() {
    this.stopping = true;
    await this.active;
  }
}

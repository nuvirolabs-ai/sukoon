import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { prisma } from "@/lib/prisma";
import { enqueueJob, recordJobEffect, runWorkerOnce } from "@/lib/worker";
import {runReminderWorkerOnce} from "@/lib/durable-reminders";
import {runDocumentJobOnce} from "@/lib/document-processing";

async function cleanup() {
  await prisma.outboxEvent.deleteMany({ where: { idempotencyKey: { startsWith: "s08-" } } });
}

beforeAll(cleanup);
afterEach(cleanup);
afterAll(cleanup);

describe("S08 durable PostgreSQL worker", () => {
  it("specialized workers do not claim or fail another handler's events", async () => {
    const row=await enqueueJob({aggregateType:"synthetic",aggregateId:"not-a-document-or-reminder",eventType:"OTHER_OPERATION",payload:{},idempotencyKey:"s08-handler-isolation"});
    await runReminderWorkerOnce("s08-only-reminders");
    await runDocumentJobOnce("s08-only-documents");
    expect(await prisma.outboxEvent.findUniqueOrThrow({where:{id:row.job.id}})).toMatchObject({attempts:0,status:"queued",lockedBy:null});
  });
  it("deduplicates enqueue by idempotency key and rejects payload reuse", async () => {
    const first = await enqueueJob({ aggregateType: "synthetic", aggregateId: "aggregate-1", eventType: "synthetic.effect", payload: { value: "one" }, idempotencyKey: "s08-duplicate" });
    const duplicate = await enqueueJob({ aggregateType: "synthetic", aggregateId: "aggregate-1", eventType: "synthetic.effect", payload: { value: "one" }, idempotencyKey: "s08-duplicate" });
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.job.id).toBe(first.job.id);
    await expect(enqueueJob({ aggregateType: "synthetic", aggregateId: "aggregate-1", eventType: "synthetic.effect", payload: { value: "two" }, idempotencyKey: "s08-duplicate" })).rejects.toThrow(/idempotency key/);
  });

  it("retries bounded failures and dead-letters after the attempt limit", async () => {
    const created = await enqueueJob({ aggregateType: "synthetic", aggregateId: "aggregate-2", eventType: "synthetic.retry", payload: { value: "retry" }, idempotencyKey: "s08-retry", maxAttempts: 2 });
    const first = await runWorkerOnce("s08-retry-worker", async () => { throw Object.assign(new Error("temporary provider failure"), { code: "PROVIDER_TEMPORARY" }); }, { leaseMs: 100 });
    expect(first?.status).toBe("retryable_failure");
    const afterFirst = await prisma.outboxEvent.findUniqueOrThrow({ where: { id: created.job.id } });
    expect(afterFirst.status).toBe("retryable_failure");
    expect(afterFirst.lastError).toEqual({ code: "PROVIDER_TEMPORARY", message: "temporary provider failure", retryable: true });
    await prisma.outboxEvent.update({ where: { id: created.job.id }, data: { nextAttemptAt: new Date() } });
    const second = await runWorkerOnce("s08-retry-worker", async () => { throw new Error("terminal provider failure"); }, { leaseMs: 100 });
    expect(second?.status).toBe("terminal_failure");
    const terminal = await prisma.outboxEvent.findUniqueOrThrow({ where: { id: created.job.id } });
    expect(terminal.attempts).toBe(2);
    expect(terminal.deadLetteredAt).toBeTruthy();
  });

  it("reclaims a job after a worker child process exits and records exactly one final effect", async () => {
    const created = await enqueueJob({ aggregateType: "synthetic", aggregateId: "aggregate-3", eventType: "synthetic.effect", payload: { value: "recover" }, idempotencyKey: "s08-reclaim" });
    const child = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/worker-crash-fixture.ts", "s08-crashed-worker", "100"], { cwd: process.cwd(), env: { ...process.env, APP_ENV: "test", NODE_ENV: "test" }, encoding: "utf8" });
    expect(child.status, child.stderr || child.stdout).toBe(0);
    expect(child.stdout).toContain(created.job.id);
    expect((await prisma.outboxEvent.findUniqueOrThrow({ where: { id: created.job.id } })).status).toBe("processing");
    await new Promise((resolve) => setTimeout(resolve, 140));
    const recovered = await runWorkerOnce("s08-restarted-worker", async (job) => {
      await recordJobEffect({ jobId: job.id, effectKey: "s08-effect-once", aggregateType: job.aggregateType, aggregateId: job.aggregateId, result: { applied: true } });
    }, { leaseMs: 100 });
    expect(recovered?.status).toBe("succeeded");
    expect(await prisma.jobEffect.count({ where: { effectKey: "s08-effect-once" } })).toBe(1);
    expect(await runWorkerOnce("s08-third-worker", async () => undefined, { leaseMs: 100 })).toBeNull();
    const final = await prisma.outboxEvent.findUniqueOrThrow({ where: { id: created.job.id } });
    expect(final.status).toBe("succeeded");
    expect(final.completedAt).toBeTruthy();
  });
});

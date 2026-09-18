import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { assertErasureReady, erasureConfig, erasureObjectWrite, drainErasureObjectWrites, SYNTHETIC_ERASURE_POLICY } from "@/lib/erasure-gate";

const run = randomBytes(8).toString("hex"), database = `sukoon_s02_local_erasure_${run}`;
const root = path.resolve(".data/erasure-tests", run, "objects"), ledger = path.resolve(".data/erasure-ledgers", run);
mkdirSync(root, { recursive: true }); mkdirSync(path.join(ledger, "instructions"), { recursive: true });
const value = { version: 1, run, policy: SYNTHETIC_ERASURE_POLICY, registeredUsers: [], targets: { [database]: { ready: true, nonce: run, completed: [] } }, deletions: [] };
function write() { writeFileSync(path.join(ledger, "ledger.json"), JSON.stringify(value)); }
write(); writeFileSync(path.join(root, ".erasure-target.json"), JSON.stringify({ run, database, nonce: run }));
const env = { APP_ENV: "local", NODE_ENV: "development", DATABASE_URL: `postgresql://localhost/${database}`, SUKOON_ERASURE_RUN_ID: run, SUKOON_SYNTHETIC_ERASURE: SYNTHETIC_ERASURE_POLICY, SUKOON_DATA_DIR: root, SUKOON_ERASURE_LEDGER_DIR: ledger };
function configure() { vi.unstubAllEnvs(); for (const [key, val] of Object.entries(env)) vi.stubEnv(key, val); }
afterAll(() => vi.unstubAllEnvs());
describe("synthetic erasure execution and object fences (no database deletion)", () => {
  it("rejects ordinary database, wrong root, hosted mode and absent explicit policy", () => {
    for (const [key, val] of [["DATABASE_URL", "postgresql://localhost/sukoon_s02_local_20260911"], ["SUKOON_DATA_DIR", path.resolve(".data")], ["NODE_ENV", "production"], ["SUKOON_SYNTHETIC_ERASURE", ""]]) {
      configure(); vi.stubEnv(key, val); expect(erasureConfig).toThrow(); expect(assertErasureReady).toThrow();
    }
  });
  it("requires independent complete ledger and matching target marker", () => {
    configure(); expect(assertErasureReady).not.toThrow();
    renameSync(path.join(ledger, "instructions"), path.join(ledger, "missing-instructions"));
    try { expect(assertErasureReady).toThrow(); } finally { renameSync(path.join(ledger, "missing-instructions"), path.join(ledger, "instructions")); }
    value.targets[database].nonce = "wrong"; write(); expect(assertErasureReady).toThrow(); value.targets[database].nonce = run; write();
  });
  it("drains an already-started write but refuses new writes while fenced", async () => {
    configure();
    let entered!: () => void, finish!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; }), released = new Promise<void>(resolve => { finish = resolve; });
    const writing = erasureObjectWrite(async () => { entered(); await released; return "finished"; });
    await started;
    value.targets[database].ready = false; write();
    await expect(erasureObjectWrite(async () => "must not run")).rejects.toThrow();
    let drained = false; const draining = drainErasureObjectWrites().then(() => { drained = true; });
    await new Promise(resolve => setTimeout(resolve, 60)); expect(drained).toBe(false);
    finish(); expect(await writing).toBe("finished"); await draining; expect(drained).toBe(true);
    value.targets[database].ready = true; write();
  });
});

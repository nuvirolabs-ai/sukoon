import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync, realpathSync, readdirSync } from "node:fs";
import path from "node:path";
import { mkdir, readdir, unlink, writeFile, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export const SYNTHETIC_ERASURE_POLICY = "synthetic-erasure-v1-no-content-retained";
export class ErasureGateError extends Error { code = "ERASURE_RECOVERY_REQUIRED"; status = 503; constructor() { super("Synthetic environment unavailable until erasure recovery is verified."); } }
const maintenance = new AsyncLocalStorage<boolean>();
function enabled() { return new URL(process.env.DATABASE_URL ?? "invalid:").pathname.includes("_erasure_") || !!process.env.SUKOON_SYNTHETIC_ERASURE; }
/** Cross-process leases let the executor drain writes started before the fence. */
export async function erasureObjectWrite<T>(work: () => Promise<T>): Promise<T> {
  if (!enabled()) return work();
  assertErasureReady();
  const folder = path.join(erasureConfig().ledger, "object-writers");
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const file = path.join(folder, randomUUID());
  await writeFile(file, String(process.pid), { mode: 0o600, flag: "wx" });
  try { assertErasureReady(); return await work(); } finally { await unlink(file); }
}
export async function drainErasureObjectWrites() {
  const folder = path.join(erasureConfig().ledger, "object-writers");
  await mkdir(folder, { recursive: true, mode: 0o700 });
  for (let attempt = 0; attempt < 100; attempt++) {
    const writers = await readdir(folder);
    if (!writers.length) return;
    for (const name of writers) {
      if (!/^[a-f0-9-]+$/.test(name)) throw new ErasureGateError();
      const file = path.join(folder, name);
      try {
        const pid = Number(await readFile(file, "utf8"));
        if (!Number.isInteger(pid) || pid < 1) throw new ErasureGateError();
        try { process.kill(pid, 0); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error; await unlink(file); }
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new ErasureGateError();
}
export function erasureMaintenance<T>(work: () => T): T { return maintenance.run(true, work); }
export function erasureConfig() {
  const url = new URL(process.env.DATABASE_URL ?? "invalid:");
  const run = process.env.SUKOON_ERASURE_RUN_ID ?? "";
  const database = url.pathname.slice(1);
  const expected = `sukoon_s02_local_erasure_${run}`;
  if (process.env.SUKOON_SYNTHETIC_ERASURE !== SYNTHETIC_ERASURE_POLICY || process.env.APP_ENV !== "local" || process.env.NODE_ENV === "production" || !/^[a-f0-9]{16}$/.test(run) || ![expected, `${expected}_restore`].includes(database) || !["localhost", "127.0.0.1"].includes(url.hostname)) throw new ErasureGateError();
  const base = path.join(process.cwd(), ".data", "erasure-tests", run);
  const root = path.join(base, database.endsWith("_restore") ? "restored-objects" : "objects");
  const ledger = path.join(process.cwd(), ".data", "erasure-ledgers", run);
  if (process.env.SUKOON_DATA_DIR !== root || process.env.SUKOON_ERASURE_LEDGER_DIR !== ledger) throw new ErasureGateError();
  if (realpathSync(root) !== root || realpathSync(ledger) !== ledger) throw new ErasureGateError();
  return { run, database, root, ledger, base };
}
export type ErasureManifest = { requestId: string; userId: string; kind: "DELETE_ACCOUNT" | "DELETE_PROPERTY"; rows: Record<string, string[]>; keys: string[] };
export type ErasureLedger = { version: 1; run: string; policy: string; registeredUsers: string[]; targets: Record<string, { ready: boolean; nonce: string; completed: string[]; pendingRequest?: string }>; deletions: ErasureManifest[] };
export function readErasureLedger(): ErasureLedger {
  const config = erasureConfig();
  const value = JSON.parse(readFileSync(path.join(config.ledger, "ledger.json"), "utf8")) as ErasureLedger;
  if (value.version !== 1 || value.run !== config.run || value.policy !== SYNTHETIC_ERASURE_POLICY || !Array.isArray(value.registeredUsers) || !Array.isArray(value.deletions) || !value.targets?.[config.database]) throw new ErasureGateError();
  const marker = JSON.parse(readFileSync(path.join(config.root, ".erasure-target.json"), "utf8"));
  if (marker.run !== config.run || marker.database !== config.database || marker.nonce !== value.targets[config.database].nonce) throw new ErasureGateError();
  const instructions = readdirSync(path.join(config.ledger, "instructions"));
  if (instructions.length !== value.deletions.length || new Set(value.deletions.map(row => row.requestId)).size !== instructions.length) throw new ErasureGateError();
  for (const row of value.deletions) {
    if (!/^[a-zA-Z0-9_-]+$/.test(row.requestId) || !["DELETE_ACCOUNT", "DELETE_PROPERTY"].includes(row.kind) || !value.registeredUsers.includes(row.userId) || !Array.isArray(row.keys) || !row.rows || JSON.stringify(JSON.parse(readFileSync(path.join(config.ledger, "instructions", `${row.requestId}.json`), "utf8"))) !== JSON.stringify(row)) throw new ErasureGateError();
  }
  const pending = value.targets[config.database].pendingRequest;
  if (pending && !value.deletions.some(row => row.requestId === pending)) throw new ErasureGateError();
  return value;
}
export function assertErasureReady() {
  const database = new URL(process.env.DATABASE_URL ?? "invalid:").pathname;
  if (!database.includes("_erasure_") && !process.env.SUKOON_SYNTHETIC_ERASURE) return;
  if (maintenance.getStore()) return;
  try {
    const ledger = readErasureLedger(), config = erasureConfig(), target = ledger.targets[config.database];
    if (!target.ready || ledger.deletions.some(row => !target.completed.includes(row.requestId))) throw new ErasureGateError();
  } catch { throw new ErasureGateError(); }
}

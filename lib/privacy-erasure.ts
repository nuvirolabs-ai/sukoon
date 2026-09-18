import { open, readFile, rename, unlink, mkdir, rmdir, lstat, realpath, readdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { enqueueJob, runWorkerOnce } from "@/lib/worker";
import { PrivacyRequestError } from "@/lib/privacy-requests";
import { erasureConfig, erasureMaintenance, readErasureLedger, drainErasureObjectWrites, SYNTHETIC_ERASURE_POLICY, type ErasureLedger, type ErasureManifest } from "@/lib/erasure-gate";

/** Atomic replacement plus file and directory fsync. No document contents are written here. */
export async function durableErasureJson(file: string, value: unknown) {
  const temporary = `${file}.${process.pid}.tmp`;
  const handle = await open(temporary, "w", 0o600);
  try { await handle.writeFile(JSON.stringify(value)); await handle.sync(); } finally { await handle.close(); }
  await rename(temporary, file);
  const directory = await open(path.dirname(file), "r"); try { await directory.sync(); } finally { await directory.close(); }
}
async function locked<T>(work: () => Promise<T>) {
  const config = erasureConfig(), lock = path.join(config.ledger, "executor.lock");
  try { await mkdir(lock, { mode: 0o700 }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const pid = Number(await readFile(path.join(lock, "pid"), "utf8"));
    if (!Number.isInteger(pid) || pid < 1) throw new Error("ERASURE_LOCK_INVALID");
    try { process.kill(pid, 0); throw new Error("ERASURE_EXECUTOR_BUSY"); }
    catch (busy) { if ((busy as NodeJS.ErrnoException).code !== "ESRCH") throw busy; }
    await unlink(path.join(lock, "pid")); await rmdir(lock); await mkdir(lock, { mode: 0o700 });
  }
  const owner = await open(path.join(lock, "pid"), "wx", 0o600); await owner.writeFile(String(process.pid)); await owner.sync(); await owner.close();
  try { return await erasureMaintenance(work); } finally { await unlink(path.join(lock, "pid")); await rmdir(lock); }
}
async function writeLedger(value: ErasureLedger) { await durableErasureJson(path.join(erasureConfig().ledger, "ledger.json"), value); }
const identifier = (value: string) => { if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("ERASURE_IDENTIFIER_INVALID"); return `"${value}"`; };
type Edge = { child: string; column: string; parent: string };
async function children(tx: Prisma.TransactionClient) {
  // Only FK components referencing globally unique primary id, not companion workspaceId columns.
  return tx.$queryRaw<Edge[]>(Prisma.sql`SELECT c.relname AS child, a.attname AS "column", p.relname AS parent FROM pg_constraint f JOIN pg_class c ON c.oid=f.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_class p ON p.oid=f.confrelid CROSS JOIN LATERAL unnest(f.conkey, f.confkey) AS k(childnum,parentnum) JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=k.childnum JOIN pg_attribute b ON b.attrelid=p.oid AND b.attnum=k.parentnum WHERE f.contype='f' AND n.nspname='public' AND b.attname='id'`);
}
const primaryKey = (table: string) => table === "ProcessingControl" ? "workspaceId" : "id";
async function closure(tx: Prisma.TransactionClient, rows: Record<string, string[]>) {
  const edges = await children(tx);
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;
    for (const edge of edges) {
      if (!rows[edge.parent]?.length) continue;
      const found = await tx.$queryRawUnsafe<{ id: string }[]>(`SELECT ${identifier(primaryKey(edge.child))} AS id FROM ${identifier(edge.child)} WHERE ${identifier(edge.column)} = ANY($1::text[])`, rows[edge.parent]);
      const next = [...new Set([...(rows[edge.child] ?? []), ...found.map(row => row.id)])];
      if (next.length > (rows[edge.child]?.length ?? 0)) { rows[edge.child] = next; changed = true; }
    }
    if (Object.values(rows).reduce((n, ids) => n + ids.length, 0) > 10000) throw new Error("ERASURE_MANIFEST_TOO_LARGE");
    if (!changed) return;
  }
  throw new Error("ERASURE_GRAPH_UNBOUNDED");
}
async function manifestFor(userId: string, requestId: string): Promise<ErasureManifest> {
  const ledger = readErasureLedger(), config = erasureConfig();
  const database = await prisma.$queryRaw<{ name: string }[]>(Prisma.sql`SELECT current_database() AS name`);
  if (database[0]?.name !== config.database || !ledger.registeredUsers.includes(userId)) throw new PrivacyRequestError("ERASURE_TEST_OWNERSHIP_REQUIRED", 403);
  // Every account in this target must have been registered by the trusted empty-environment fixture provisioner.
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.some(user => !ledger.registeredUsers.includes(user.id))) throw new PrivacyRequestError("ERASURE_UNREGISTERED_DATA", 403);
  return prisma.$transaction(async tx => {
    const request = await tx.privacyRequest.findFirst({ where: { id: requestId, userId, status: "AWAITING_POLICY", kind: { in: ["DELETE_ACCOUNT", "DELETE_PROPERTY"] } } });
    if (!request) throw new PrivacyRequestError("ERASURE_REQUEST_NOT_EXECUTABLE", 409);
    const rows: Record<string, string[]> = {};
    if (request.kind === "DELETE_ACCOUNT") {
      rows.user = [userId];
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
      rows.ShareLink = (await tx.shareLink.findMany({ where: { OR: [{ inviteeUserId: userId }, { inviteeEmail: user.email }] }, select: { id: true } })).map(row => row.id);
      rows.verification = (await tx.verification.findMany({ where: { identifier: { endsWith: user.email } }, select: { id: true } })).map(row => row.id);
    } else {
      const property = await tx.property.findFirst({ where: { id: request.propertyId!, workspace: { ownerUserId: userId } }, select: { id: true } });
      if (!property) throw new PrivacyRequestError("RESOURCE_NOT_FOUND", 404);
      rows.Property = [property.id];
      // An account-wide artifact may contain this property; invalidate its artifact and metadata too.
      rows.PrivacyRequest = (await tx.privacyRequest.findMany({ where: { userId, kind: "EXPORT_ACCOUNT" }, select: { id: true } })).map(row => row.id);
      rows.session = (await tx.session.findMany({ where: { userId }, select: { id: true } })).map(row => row.id);
    }
    await closure(tx, rows);
    const sources = new Set(Object.values(rows).flat());
    // Scoped receipts can contain entire response bodies without a property FK.
    // Remove only receipts with an exact target identifier, not every owner receipt.
    function referencesTarget(value: unknown): boolean {
      if (typeof value === "string") return sources.has(value);
      if (Array.isArray(value)) return value.some(referencesTarget);
      return !!value && typeof value === "object" && Object.values(value).some(referencesTarget);
    }
    const receipts = await tx.idempotencyRecord.findMany({ take: 10001 });
    if (receipts.length > 10000) throw new Error("ERASURE_MANIFEST_TOO_LARGE");
    rows.IdempotencyRecord = [...new Set([...(rows.IdempotencyRecord ?? []), ...receipts.filter(row => referencesTarget(row.response)).map(row => row.id)])];
    const jobs = await tx.outboxEvent.findMany({ take: 10001 });
    if (jobs.length > 10000) throw new Error("ERASURE_MANIFEST_TOO_LARGE");
    rows.OutboxEvent = jobs.filter(job => job.eventType !== "ERASE_PRIVACY_REQUEST" && (sources.has(job.aggregateId) || referencesTarget(job.payload))).map(job => job.id);
    await closure(tx, rows);
    const versions = await tx.documentVersion.findMany({ where: { id: { in: rows.DocumentVersion ?? [] } }, select: { storageKey: true } });
    const documents = await tx.propertyDoc.findMany({ where: { id: { in: rows.PropertyDoc ?? [] } }, select: { storageKey: true } });
    const exports = await tx.exportPackage.findMany({ where: { id: { in: rows.ExportPackage ?? [] } }, select: { id: true, workspaceId: true, artifactStorageKey: true } });
    const accounts = await tx.privacyRequest.findMany({ where: { id: { in: rows.PrivacyRequest ?? [] }, kind: "EXPORT_ACCOUNT" }, select: { id: true, artifactKey: true } });
    const keys = [...new Set([...documents.map(v => v.storageKey), ...versions.map(v => v.storageKey), ...exports.flatMap(e => [e.artifactStorageKey, `exports/${e.workspaceId}/${e.id}.zip`]), ...accounts.flatMap(e => [e.artifactKey, `account-exports/${e.id}.zip`])].filter((key): key is string => Boolean(key)))];
    // Include interrupted uploads/exports whose opaque scoped path exists but
    // whose final metadata write never committed. Only this isolated root is walked.
    let visited = 0;
    async function inventory(directory: string, prefix = "") {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (++visited > 10000) throw new Error("ERASURE_OBJECT_INVENTORY_LIMIT");
        if (entry.isSymbolicLink()) throw new Error("ERASURE_SYMLINK_DENIED");
        const key = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) await inventory(path.join(directory, entry.name), key);
        else if (key.includes("/") && key.split("/").some(part => sources.has(part) || sources.has(part.replace(/\.[^.]+$/, "")))) keys.push(key);
      }
    }
    await inventory(config.root);
    if (keys.length > 2000) throw new Error("ERASURE_OBJECT_LIMIT");
    for (const key of keys) await safeObject(key);
    return { requestId, userId, kind: request.kind as ErasureManifest["kind"], rows, keys: [...new Set(keys)] };
  }, { isolationLevel: "Serializable", timeout: 30000 });
}
async function safeObject(key: string) {
  const root = erasureConfig().root;
  if (!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)+$/.test(key) || key.split("/").some(part => part === "." || part === "..")) throw new Error("ERASURE_OBJECT_PATH_INVALID");
  const target = path.resolve(root, key);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("ERASURE_OBJECT_PATH_INVALID");
  let ancestor = target;
  while (ancestor !== root) {
    try { const info = await lstat(ancestor); if (info.isSymbolicLink() || await realpath(ancestor) !== ancestor) throw new Error("ERASURE_SYMLINK_DENIED"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    ancestor = path.dirname(ancestor);
  }
  return target;
}
export async function confirmSyntheticErasure(userId: string, requestId: string, confirmed: boolean, policy: string) {
  erasureConfig();
  if (!confirmed || policy !== SYNTHETIC_ERASURE_POLICY) throw new PrivacyRequestError("ERASURE_CONFIRMATION_REQUIRED", 400);
  return locked(async () => {
    const ledger = readErasureLedger();
    const existing = ledger.deletions.find(row => row.requestId === requestId);
    if (existing) { if (existing.userId !== userId) throw new PrivacyRequestError("RESOURCE_NOT_FOUND", 404); return { id: requestId, status: ledger.targets[erasureConfig().database].completed.includes(requestId) ? "ERASED" : "ERASING", duplicate: true }; }
    // Reject invalid requests before fencing. Then freeze database writes and
    // recollect the manifest; a late worker cannot add rows after inventory.
    await manifestFor(userId, requestId);
    ledger.targets[erasureConfig().database].ready = false;
    await writeLedger(ledger);
    const fenced = await prisma.$executeRaw(Prisma.sql`UPDATE "SyntheticErasureEnvironment" SET fenced = true WHERE run = ${erasureConfig().run}`);
    if (fenced !== 1) throw new Error("ERASURE_DATABASE_IDENTITY_MISMATCH");
    await drainErasureObjectWrites();
    const manifest = await manifestFor(userId, requestId);
    ledger.deletions.push(manifest);
    await prisma.$transaction(async tx => {
      await tx.$executeRaw(Prisma.sql`SELECT set_config('sukoon.erasure_executor', ${erasureConfig().run}, true)`);
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "PrivacyRequest" WHERE "id" = ${requestId} FOR UPDATE`);
      const current = await tx.privacyRequest.findFirst({ where: { id: requestId, userId, status: "AWAITING_POLICY" } });
      if (!current) throw new PrivacyRequestError("ERASURE_REQUEST_NOT_EXECUTABLE", 409);
      await durableErasureJson(path.join(erasureConfig().ledger, "instructions", `${requestId}.json`), manifest);
      await writeLedger(ledger); // durable instruction while cancellation is serialized, BEFORE cleanup
      const changed = await tx.privacyRequest.updateMany({ where: { id: requestId, userId, status: "AWAITING_POLICY" }, data: { status: "ERASING" } });
      if (!changed.count) throw new Error("ERASURE_CONFIRMATION_RACE");
      await enqueueJob({ aggregateType: "privacy_request", aggregateId: requestId, eventType: "ERASE_PRIVACY_REQUEST", payload: { requestId }, idempotencyKey: `privacy-erasure:${requestId}` }, tx);
    }, { timeout: 30000 });
    return { id: requestId, status: "ERASING", duplicate: false };
  });
}
export async function replaySyntheticErasures(options: { stopAfterDatabase?: boolean } = {}) {
  return locked(async () => {
    const config = erasureConfig(), ledger = readErasureLedger();
    ledger.targets[config.database].ready = false; await writeLedger(ledger);
    const identity = await prisma.$queryRaw<{ run: string }[]>(Prisma.sql`SELECT run FROM "SyntheticErasureEnvironment"`);
    if (identity.length !== 1 || identity[0].run !== config.run) throw new Error("ERASURE_DATABASE_IDENTITY_MISMATCH");
    if ((await prisma.user.findMany({ select: { id: true } })).some(user => !ledger.registeredUsers.includes(user.id))) throw new Error("ERASURE_UNREGISTERED_DATA");
    await prisma.$executeRaw(Prisma.sql`UPDATE "SyntheticErasureEnvironment" SET fenced = true WHERE run = ${config.run}`);
    await drainErasureObjectWrites();
    for (const manifest of ledger.deletions) {
      // Replay idempotently even if a stale restored checkpoint says the instruction completed.
      await prisma.$transaction(async tx => {
        await tx.$executeRaw(Prisma.sql`SELECT set_config('sukoon.erasure_executor', ${config.run}, true)`);
        for (const table of ["OutboxEvent", "IdempotencyRecord", "ShareLink", "ExportPackage", "PrivacyRequest", "verification", "session", "Property", "user"]) {
          const ids = manifest.rows[table]; if (!ids?.length) continue;
          await tx.$executeRawUnsafe(`DELETE FROM ${identifier(table)} WHERE "id" = ANY($1::text[])`, ids);
        }
      }, { timeout: 30000 });
      await durableErasureJson(path.join(config.ledger, `${config.database}-${manifest.requestId}.progress.json`), { requestId: manifest.requestId, phase: "DATABASE_REMOVED" });
      if (options.stopAfterDatabase) return { status: "INTERRUPTED", requestId: manifest.requestId };
      for (const key of manifest.keys) {
        const file = await safeObject(key);
        try {
          await unlink(file);
          const directory = await open(path.dirname(file), "r"); try { await directory.sync(); } finally { await directory.close(); }
        } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      }
      for (const [table, ids] of Object.entries(manifest.rows)) {
        if (!ids.length) continue;
        const count = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*)::bigint AS count FROM ${identifier(table)} WHERE ${identifier(primaryKey(table))} = ANY($1::text[])`, ids);
        if (count[0].count !== 0n) throw new Error("ERASURE_RECORD_VERIFICATION_FAILED");
      }
      for (const key of manifest.keys) {
        try { await lstat(await safeObject(key)); throw new Error("ERASURE_OBJECT_REMAINS"); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      }
      await prisma.$transaction(async tx => {
        await tx.$executeRaw(Prisma.sql`SELECT set_config('sukoon.erasure_executor', ${config.run}, true)`);
        await tx.privacyRequest.updateMany({ where: { id: manifest.requestId, kind: "DELETE_PROPERTY" }, data: { status: "ERASED", completedAt: new Date() } });
      });
      await durableErasureJson(path.join(config.ledger, `${config.database}-${manifest.requestId}.progress.json`), { requestId: manifest.requestId, phase: "VERIFIED" });
      ledger.targets[config.database].completed = [...new Set([...ledger.targets[config.database].completed, manifest.requestId])];
      await writeLedger(ledger);
    }
    await prisma.$executeRaw(Prisma.sql`UPDATE "SyntheticErasureEnvironment" SET fenced = false WHERE run = ${config.run}`);
    ledger.targets[config.database].ready = true; await writeLedger(ledger);
    return { status: "VERIFIED", instructions: ledger.deletions.length };
  });
}
export async function runErasureWorkerOnce(workerId: string) {
  erasureConfig();
  // Dedicated handler alone enters maintenance. Ordinary queue workers remain fenced.
  return erasureMaintenance(() => runWorkerOnce(workerId, async () => { await replaySyntheticErasures(); }, { eventTypes: ["ERASE_PRIVACY_REQUEST"] }));
}

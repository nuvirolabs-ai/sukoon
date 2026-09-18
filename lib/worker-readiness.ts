import { spawn } from "node:child_process";
import path from "node:path";
import { assertProviderConfiguration } from "@/lib/providers";

export type WorkerReadinessResult = { ready: true; environment: "staging" };

export function assertWorkerEnvironment(env: NodeJS.ProcessEnv = process.env) {
  if (env.APP_ENV !== "staging" || env.NODE_ENV !== "production" || env.SUKOON_RUNTIME_PROFILE !== "STAGING") throw new Error("WORKER_STAGING_ONLY");
  if (env.SUKOON_DATA_DIR) throw new Error("WORKER_LOCAL_DATA_FORBIDDEN");
  let databaseName = "";
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    databaseName = decodeURIComponent(url.pathname.slice(1));
    if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || databaseName !== "sukoon_demo_staging") throw new Error("WORKER_DATABASE_SCOPE_INVALID");
  } catch (error) {
    if (error instanceof Error && error.message === "WORKER_DATABASE_SCOPE_INVALID") throw error;
    throw new Error("WORKER_DATABASE_SCOPE_INVALID");
  }
  void databaseName;
  try { assertProviderConfiguration(env); } catch { throw new Error("WORKER_PROVIDER_CONFIGURATION_INVALID"); }
}

export async function checkWorkerReadiness(env: NodeJS.ProcessEnv = process.env, checks: { migrationsReady: () => Promise<boolean> } = { migrationsReady: checkPrismaMigrationStatus }) {
  assertWorkerEnvironment(env);
  let migrationsReady: boolean;
  try { migrationsReady = await checks.migrationsReady(); } catch { throw new Error("WORKER_MIGRATIONS_UNAVAILABLE"); }
  if (!migrationsReady) throw new Error("WORKER_MIGRATIONS_NOT_READY");
  return { ready: true, environment: "staging" } as WorkerReadinessResult;
}

export function checkPrismaMigrationStatus() {
  return new Promise<boolean>((resolve, reject) => {
    const binary = path.resolve("node_modules/.bin/prisma");
    const child = spawn(binary, ["migrate", "status"], { shell: false, env: { ...process.env, CI: "1" }, stdio: ["ignore", "ignore", "ignore"] });
    child.on("error", () => reject(new Error("WORKER_MIGRATIONS_UNAVAILABLE")));
    child.on("close", (code) => resolve(code === 0));
  });
}

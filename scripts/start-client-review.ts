import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { signatureSnapshot } from "../lib/clamav-scanner";
import { CLIENT_REVIEW_MAC_PORT, CLIENT_REVIEW_LOCAL_SERVICE, CLIENT_REVIEW_NEXT_DIST_DIR, isReusableLocalWorkerHeartbeat, validateClientReviewFunnelOutput, validateClientReviewFunnelStatus, validateTailscaleState } from "../lib/client-review-launch";
import { clientReviewOrigin } from "../lib/runtime-profile";
import { clientReviewAuthConfigured } from "../lib/client-review-auth";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
loadEnv({ path: path.resolve(root, ".env.client-review.local") });
loadEnv({ path: path.resolve(root, ".env") });

function clientReviewEnvironment(): NodeJS.ProcessEnv & { SUKOON_CLIENT_REVIEW_ORIGIN: string } {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const origin = clientReviewOrigin(env);
  if (!origin) throw new Error("CLIENT_REVIEW_FUNNEL_ORIGIN_REQUIRED");
  Object.assign(env, {
    APP_ENV: "local",
    NODE_ENV: "development",
    SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW",
    SUKOON_CLIENT_REVIEW_ORIGIN: origin,
    SUKOON_ANDROID_SERVER_URL: origin,
    NEXT_PUBLIC_SUKOON_API_BASE_URL: origin,
    BETTER_AUTH_URL: origin,
    BETTER_AUTH_TRUSTED_ORIGINS: origin,
    SUKOON_TRUSTED_ORIGINS: origin,
    NEXT_PUBLIC_SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW",
    SUKOON_NEXT_DIST_DIR: CLIENT_REVIEW_NEXT_DIST_DIR,
    SUKOON_DATA_DIR: env.SUKOON_DATA_DIR || ".data",
  });
  return env as NodeJS.ProcessEnv & { SUKOON_CLIENT_REVIEW_ORIGIN: string };
}

function requiredTailscale(command: string) {
  const result = spawnSync(command, ["status", "--json"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  if (result.status !== 0 || !result.stdout) throw new Error("CLIENT_REVIEW_TAILSCALE_UNAVAILABLE");
  try { return JSON.parse(result.stdout) as unknown; } catch { throw new Error("CLIENT_REVIEW_TAILSCALE_STATUS_INVALID"); }
}

function assertLocalDatabase(env: NodeJS.ProcessEnv) {
  let url: URL;
  try { url = new URL(env.DATABASE_URL ?? ""); } catch { throw new Error("CLIENT_REVIEW_DATABASE_SCOPE_INVALID"); }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/sukoon_s02_local_[a-zA-Z0-9_]+$/.test(url.pathname)) throw new Error("CLIENT_REVIEW_DATABASE_SCOPE_INVALID");
}

function assertLocalMigrations(env: NodeJS.ProcessEnv) {
  const result = spawnSync(process.execPath, [path.resolve(root, "node_modules/prisma/build/index.js"), "migrate", "status"], { cwd: root, env: { ...env, CI: "1" }, encoding: "utf8", stdio: "ignore" });
  if (result.status !== 0) throw new Error("CLIENT_REVIEW_MIGRATIONS_NOT_READY");
}

async function assertLocalScanner(env: NodeJS.ProcessEnv) {
  const binary = env.SUKOON_CLAMSCAN_PATH?.trim() || "/opt/homebrew/bin/clamscan";
  const database = env.SUKOON_CLAMAV_DATABASE?.trim() || "";
  if (env.SUKOON_LOCAL_SCANNER !== "clamav" || !path.isAbsolute(binary) || !path.isAbsolute(database) || !existsSync(binary) || !existsSync(database)) throw new Error("CLIENT_REVIEW_SCANNER_CONFIGURATION_INVALID");
  const version = spawnSync(binary, ["--version"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  if (version.status !== 0 || !/^ClamAV\s+/i.test(version.stdout ?? "")) throw new Error("CLIENT_REVIEW_SCANNER_UNAVAILABLE");
  await signatureSnapshot(database);
}

async function waitForLocalHealth() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${CLIENT_REVIEW_MAC_PORT}/api/health`, { cache: "no-store" });
      if (response.ok) return;
    } catch { /* the Next process may still be compiling */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("CLIENT_REVIEW_LOCAL_APP_NOT_READY");
}

async function waitForPublicHealth(origin: string) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/api/health`, { cache: "no-store" });
      if (response.ok) return;
    } catch { /* Funnel may still be establishing the public route */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("CLIENT_REVIEW_PUBLIC_HEALTH_NOT_READY");
}

async function localWorkerIsReusable() {
  try {
    const { latestWorkerHeartbeat } = await import("../lib/worker-heartbeat");
    return isReusableLocalWorkerHeartbeat(await latestWorkerHeartbeat(120_000, "local"));
  } catch {
    return false;
  }
}

async function waitForLocalWorker() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await localWorkerIsReusable()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("CLIENT_REVIEW_WORKER_NOT_READY");
}

function waitForFunnelOutput(child: ChildProcess, origin: string) {
  return new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error("CLIENT_REVIEW_FUNNEL_NOT_READY")), 30_000);
    child.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
      process.stdout.write(chunk);
      if (!output.includes("Available on the internet:")) return;
      try { validateClientReviewFunnelOutput(output, origin); clearTimeout(timer); resolve(); } catch { /* wait for the complete route line */ }
    });
    child.once("error", () => { clearTimeout(timer); reject(new Error("CLIENT_REVIEW_TAILSCALE_UNAVAILABLE")); });
    child.once("exit", (code) => { if (code !== null) { clearTimeout(timer); reject(new Error("CLIENT_REVIEW_FUNNEL_STOPPED")); } });
  });
}

function existingFunnel(tailscale: string, origin: string) {
  const result = spawnSync(tailscale, ["funnel", "status", "--json"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  if (result.status !== 0 || !result.stdout) return false;
  try { validateClientReviewFunnelStatus(JSON.parse(result.stdout), origin); return true; } catch { return false; }
}

function stopChildren(children: ChildProcess[]) {
  for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
}

async function main() {
  const env = clientReviewEnvironment();
  const tailscale = env.TAILSCALE_PATH?.trim() || "tailscale";
  const tailscaleState = requiredTailscale(tailscale);
  validateTailscaleState(tailscaleState, env.SUKOON_CLIENT_REVIEW_ORIGIN);
  assertLocalDatabase(env);
  assertLocalMigrations(env);
  await assertLocalScanner(env);
  if (!clientReviewAuthConfigured(env)) throw new Error("CLIENT_REVIEW_LOGIN_CONFIGURATION_REQUIRED");

  const children: ChildProcess[] = [];
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    stopChildren(children);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  const next = spawn(process.execPath, [path.resolve(root, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(CLIENT_REVIEW_MAC_PORT)], { cwd: root, env, stdio: "inherit" });
  children.push(next);
  const workerReused = await localWorkerIsReusable();
  const worker = workerReused ? null : spawn(process.execPath, [path.resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/run-local-worker.ts"], { cwd: root, env, stdio: "inherit" });
  if (worker) children.push(worker);
  await waitForLocalHealth();
  await waitForLocalWorker();

  if (!existingFunnel(tailscale, env.SUKOON_CLIENT_REVIEW_ORIGIN)) {
    const tunnelProcess = spawn(tailscale, ["funnel", "--https=443", CLIENT_REVIEW_LOCAL_SERVICE], { cwd: root, env, stdio: ["ignore", "pipe", "inherit"] });
    children.push(tunnelProcess);
    await waitForFunnelOutput(tunnelProcess, env.SUKOON_CLIENT_REVIEW_ORIGIN);
  }
  await waitForPublicHealth(env.SUKOON_CLIENT_REVIEW_ORIGIN);
  console.log("SUKOON CLIENT REVIEW READY");
  console.log(`PUBLIC URL: ${env.SUKOON_CLIENT_REVIEW_ORIGIN}`);
  console.log("DATABASE: healthy");
  console.log(`WORKER: healthy${workerReused ? "/reused" : ""}`);
  console.log("SCANNER: healthy");
  console.log("FUNNEL: healthy");
  console.log("REVIEW LOGIN: configured");

  for (const child of children) {
    child.once("exit", (code, signal) => {
      if (stopping) return;
      console.error(`Client review process stopped before shutdown (${signal || code || "unknown"}).`);
      stop();
      process.exitCode = 1;
    });
  }
  await new Promise<void>((resolve) => {
    const check = () => stopping ? resolve() : setTimeout(check, 250);
    check();
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "CLIENT_REVIEW_STARTUP_FAILED");
  process.exitCode = 1;
});

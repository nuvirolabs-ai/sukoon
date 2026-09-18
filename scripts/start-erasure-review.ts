import "dotenv/config";
import path from "node:path";
import { spawn } from "node:child_process";
async function main() {
  const run = process.argv[2];
  if (!/^[a-f0-9]{16}$/.test(run ?? "")) throw new Error("Explicit run id required");
  const restored = process.argv.includes("--restore"), port = restored ? "3104" : "3103";
  const url = new URL(process.env.DATABASE_URL!); url.pathname = `/sukoon_s02_local_erasure_${run}${restored ? "_restore" : ""}`;
  Object.assign(process.env, { APP_ENV: "local", NODE_ENV: "development", DATABASE_URL: url.href, BETTER_AUTH_URL: `http://127.0.0.1:${port}`, SUKOON_ERASURE_RUN_ID: run, SUKOON_SYNTHETIC_ERASURE: "synthetic-erasure-v1-no-content-retained", SUKOON_ERASURE_RESTORE_REVIEW: restored ? "1" : "0", SUKOON_DATA_DIR: path.resolve(".data/erasure-tests", run, restored ? "restored-objects" : "objects"), SUKOON_ERASURE_LEDGER_DIR: path.resolve(".data/erasure-ledgers", run), SUKOON_ACCEPTANCE_SESSION_SECONDS: "300" });
  const { assertErasureReady } = await import("../lib/erasure-gate"); assertErasureReady();
  const args = process.argv.includes("--purge-auth") ? ["tsx", "scripts/erasure-acceptance.ts", "purge-auth"] : process.argv.includes("--http-check") ? ["tsx", "scripts/erasure-acceptance.ts", "restored-http"] : process.argv.includes("--ownership-seed") ? ["tsx", "scripts/erasure-acceptance.ts", "browser-o01-seed"] : process.argv.includes("--seed") ? ["tsx", "scripts/erasure-acceptance.ts", "browser-seed"] : process.argv.includes("--exports") ? ["tsx", "scripts/erasure-acceptance.ts", "browser-exports"] : ["next", "dev", "--port", port, "--hostname", "127.0.0.1"];
  const child = spawn("npx", args, { env: process.env, stdio: "inherit" });
  child.on("exit", code => { process.exitCode = code ?? 1; });
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => child.kill(signal));
}
main().catch(() => { console.error("Synthetic review startup refused. Verify the run and recovery readiness."); process.exitCode = 1; });

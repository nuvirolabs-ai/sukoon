import "dotenv/config";
import { replaySyntheticErasures, runErasureWorkerOnce } from "../lib/privacy-erasure";
import { prisma } from "../lib/prisma";

async function main() {
  if (process.argv.includes("--queue")) {
    const result = await runErasureWorkerOnce(`synthetic-erasure-${process.pid}`);
    if (!result || result.status !== "succeeded") throw new Error("ERASURE_QUEUE_NOT_SUCCEEDED");
    console.log(JSON.stringify({ queueStatus: result.status })); await prisma.$disconnect(); return;
  }
  const result = await replaySyntheticErasures({ stopAfterDatabase: process.argv.includes("--interrupt-after-database") });
  console.log(JSON.stringify(result));
  await prisma.$disconnect();
  // Explicit process boundary, after DB commit but before any object removal.
  process.exitCode = result.status === "INTERRUPTED" ? 75 : 0;
}
main().catch(async () => { console.error("ERASURE_WORKER_FAILED: recovery remains fenced; inspect the private checkpoint."); await prisma.$disconnect(); process.exitCode = 1; });

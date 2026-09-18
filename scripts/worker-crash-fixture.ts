import { claimNextJob } from "../lib/worker";

const workerId = process.argv[2] ?? "s08-child-worker";
const leaseMs = Number(process.argv[3] ?? "100");

void (async () => {
  const job = await claimNextJob(workerId, leaseMs);
  if (!job) {
    console.error("No job was claimable.");
    process.exit(2);
  }
  console.log(job.id);
  // This child intentionally exits after claiming and before applying its effect.
  // The restarted worker must reclaim the expired PostgreSQL lease safely.
  process.exit(0);
})();

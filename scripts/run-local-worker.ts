import "dotenv/config";
import { checkPrismaMigrationStatus } from "../lib/worker-readiness";
import { markWorkerHeartbeat } from "../lib/worker-heartbeat";

// Entry point only: use the existing durable queue and ordinary provider bindings.
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "invalid:");
  if (
    process.env.APP_ENV !== "local" ||
    process.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/^\/sukoon_s02_local_[a-zA-Z0-9_]+$/.test(url.pathname)
  ) {
    throw new Error(
      "Local worker requires APP_ENV=local and an isolated localhost sukoon_s02_local_* database.",
    );
  }
  if (process.env.SUKOON_RUNTIME_PROFILE === "CLIENT_REVIEW" && !await checkPrismaMigrationStatus()) throw new Error("CLIENT_REVIEW_MIGRATIONS_NOT_READY");
  const { prisma } = await import("../lib/prisma");
  const { clientReviewReminderWorkerDependencies, localReminderWorkerDependencies, runReminderWorkerOnce } = await import("../lib/durable-reminders");
  const { runDocumentJobOnce } = await import("../lib/document-processing");
  const { runAccountExportOnce } = await import("../lib/account-export");
  let stopping = false;
  process.on("SIGINT", () => {
    stopping = true;
  });
  process.on("SIGTERM", () => {
    stopping = true;
  });
  const workerId = `local-${process.pid}`;
  await markWorkerHeartbeat({ workerId, environment: "local", status: "starting" });
  const reminderDependencies = process.env.SUKOON_RUNTIME_PROFILE === "CLIENT_REVIEW"
    ? clientReviewReminderWorkerDependencies()
    : localReminderWorkerDependencies();
  console.log(
    `Local worker running: durable in-app reminders and document stages. Scanner selection: ${process.env.SUKOON_LOCAL_SCANNER === "clamav" ? "ClamAV (each verdict requires runtime evidence)" : "unavailable"}. OCR/AI unavailable; no test adapters enabled.`,
  );
  try {
    while (!stopping) {
      const reminder = await runReminderWorkerOnce(`${workerId}-reminders`, reminderDependencies);
      const document = stopping
        ? null
        : await runDocumentJobOnce(`${workerId}-documents`);
      const accountExport = stopping ? null : await runAccountExportOnce(`${workerId}-account-export`);
      await markWorkerHeartbeat({ workerId, environment: "local", status: "running", completedAt: new Date() });
      for (const result of [reminder, document, accountExport])
        if (result) console.log(JSON.stringify(result));
      if (!reminder && !document && !accountExport && !stopping)
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } finally {
    await markWorkerHeartbeat({ workerId, environment: "local", status: "stopped", completedAt: new Date() }).catch(() => undefined);
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Local worker stopped. Check the local environment and database; no provider success is assumed.",
  );
  process.exitCode = 1;
});

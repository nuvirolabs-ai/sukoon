import "dotenv/config";
import { documentProcessingDependenciesForEnvironment } from "../lib/document-processing";
import { stagingReminderWorkerDependencies } from "../lib/durable-reminders";
import { runAccountExportOnce } from "../lib/account-export";
import { markWorkerHeartbeat } from "../lib/worker-heartbeat";
import { checkWorkerReadiness } from "../lib/worker-readiness";

async function main() {
  await checkWorkerReadiness();
  const { prisma } = await import("../lib/prisma");
  const documentDependencies = documentProcessingDependenciesForEnvironment();
  const reminderDependencies = stagingReminderWorkerDependencies();
  const workerId = `staging-${process.env.RENDER_INSTANCE_ID ?? process.pid}`;
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  await markWorkerHeartbeat({ workerId, status: "starting" });
  console.log("Staging worker running: reminders, document stages and account exports. ClamAV is private-network restricted; OCR, AI, push and unapproved connectors remain unavailable.");
  try {
    while (!stopping) {
      const reminder = await (await import("../lib/durable-reminders")).runReminderWorkerOnce(`${workerId}-reminders`, reminderDependencies);
      const document = stopping ? null : await (await import("../lib/document-processing")).runDocumentJobOnce(`${workerId}-documents`, documentDependencies);
      const accountExport = stopping ? null : await runAccountExportOnce(`${workerId}-account-exports`, documentDependencies.storage);
      await markWorkerHeartbeat({ workerId, status: "running", completedAt: new Date() });
      for (const result of [reminder, document, accountExport]) if (result) console.log(JSON.stringify(result));
      if (!reminder && !document && !accountExport && !stopping) await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  } finally {
    await markWorkerHeartbeat({ workerId, status: "stopped", completedAt: new Date() }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("Staging worker stopped before consuming jobs. Migration/provider readiness was not assumed.");
  process.exitCode = 1;
});

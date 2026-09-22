import "dotenv/config";
import { prisma } from "@/lib/prisma";
import {
  DEMO_ENRICHMENT_ANCHOR_DATE,
  DEMO_ENRICHMENT_NAMESPACE,
  runDemoEnrichment,
} from "@/lib/demo-enrichment";

async function main() {
  const report = await runDemoEnrichment({
    asOf: DEMO_ENRICHMENT_ANCHOR_DATE,
  });
  console.log(JSON.stringify(report));
}

main()
  .catch((error: unknown) => {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
    const message = error instanceof Error ? error.message : "DEMO_ENRICHMENT_FAILED";
    console.error(JSON.stringify({ namespace: DEMO_ENRICHMENT_NAMESPACE, status: "FAILED", code, message }));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

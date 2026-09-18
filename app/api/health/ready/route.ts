import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { documentProcessingDependenciesForEnvironment } from "@/lib/document-processing";
import { latestWorkerHeartbeat } from "@/lib/worker-heartbeat";
import { checkPrismaMigrationStatus } from "@/lib/worker-readiness";
import { prisma } from "@/lib/prisma";
import { providerConfiguration, redactedProviderHealth } from "@/lib/providers";

export const runtime = "nodejs";

function response(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return response({ error: "AUTHENTICATION_REQUIRED" }, 401);
  const operator = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!operator || !(["owner", "admin"] as string[]).includes(operator.role)) return response({ error: "OPERATOR_ACCESS_REQUIRED" }, 403);
  const configuration = providerConfiguration();
  if (configuration.errors.length) return response({ status: "unavailable", providers: redactedProviderHealth() }, 503);
  const checks = { database: false, migrations: false, storage: { ready: false as boolean }, scanner: { ready: false as boolean }, worker: null as Awaited<ReturnType<typeof latestWorkerHeartbeat>> };
  try { await prisma.$queryRaw`SELECT 1`; checks.database = true; } catch { /* redacted below */ }
  checks.migrations = await checkPrismaMigrationStatus().catch(() => false);
  try {
    const dependencies = documentProcessingDependenciesForEnvironment();
    checks.storage = await ("probe" in dependencies.storage && typeof dependencies.storage.probe === "function" ? dependencies.storage.probe() : { ready: false, reason: "STORAGE_PROBE_UNAVAILABLE" });
    checks.scanner = await ("probe" in dependencies.scanner && typeof dependencies.scanner.probe === "function" ? dependencies.scanner.probe() : { ready: false, reason: "SCANNER_PROBE_UNAVAILABLE" });
  } catch { checks.storage = { ready: false }; checks.scanner = { ready: false }; }
  checks.worker = await latestWorkerHeartbeat().catch(() => null);
  const ready = checks.database && checks.migrations && checks.storage.ready && checks.scanner.ready && Boolean(checks.worker);
  return response({ status: ready ? "ready" : "degraded", environment: "staging", checks, optionalProviders: redactedProviderHealth().providers }, ready ? 200 : 503);
}

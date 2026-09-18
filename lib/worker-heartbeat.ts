import { prisma } from "@/lib/prisma";

export type WorkerHeartbeatStatus = "starting" | "running" | "stopping" | "stopped";
export type WorkerHeartbeatEnvironment = "staging" | "local";

export function heartbeatIdentity(workerId: string, environment: WorkerHeartbeatEnvironment = "staging") {
  return `${environment}:${workerId}`;
}

export function heartbeatUpdate(input: { workerId: string; environment?: WorkerHeartbeatEnvironment; status: WorkerHeartbeatStatus; now?: Date }) {
  const environment = input.environment ?? "staging";
  return { id: heartbeatIdentity(input.workerId, environment), environment, status: input.status, lastSeenAt: input.now ?? new Date() };
}

export async function markWorkerHeartbeat(input: { workerId: string; environment?: WorkerHeartbeatEnvironment; status: WorkerHeartbeatStatus; completedAt?: Date; now?: Date }) {
  const update = heartbeatUpdate(input);
  return prisma.workerHeartbeat.upsert({
    where: { id: update.id },
    update: { environment: update.environment, status: update.status, lastSeenAt: update.lastSeenAt, ...(input.completedAt ? { lastCompletedAt: input.completedAt } : {}) },
    create: { ...update, startedAt: input.now ?? new Date(), ...(input.completedAt ? { lastCompletedAt: input.completedAt } : {}) },
  });
}

export async function latestWorkerHeartbeat(maxAgeMs = 120_000, environment: WorkerHeartbeatEnvironment = "staging") {
  const row = await prisma.workerHeartbeat.findFirst({ where: { environment, lastSeenAt: { gt: new Date(Date.now() - maxAgeMs) } }, orderBy: { lastSeenAt: "desc" }, select: { status: true, lastSeenAt: true, lastCompletedAt: true } });
  return row;
}

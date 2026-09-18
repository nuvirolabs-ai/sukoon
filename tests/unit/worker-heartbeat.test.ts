import { describe, expect, it } from "vitest";
import { heartbeatIdentity, heartbeatUpdate } from "@/lib/worker-heartbeat";
import { isReusableLocalWorkerHeartbeat } from "@/lib/client-review-launch";

describe("staging worker heartbeat", () => {
  it("uses a stable staging identity and stores no payload or secret data", () => {
    expect(heartbeatIdentity("worker-123", "staging")).toBe("staging:worker-123");
    const update = heartbeatUpdate({ workerId: "worker-123", status: "running", now: new Date("2026-09-17T08:00:00.000Z") });
    expect(update).toEqual({ id: "staging:worker-123", environment: "staging", status: "running", lastSeenAt: new Date("2026-09-17T08:00:00.000Z") });
    expect(JSON.stringify(update)).not.toMatch(/document|secret|token|payload/i);
  });

  it("supports a separate local worker namespace without changing staging defaults", () => {
    expect(heartbeatIdentity("worker-123", "local")).toBe("local:worker-123");
    expect(heartbeatUpdate({ workerId: "worker-123", environment: "local", status: "running", now: new Date("2026-09-17T08:00:00.000Z") })).toEqual({
      id: "local:worker-123",
      environment: "local",
      status: "running",
      lastSeenAt: new Date("2026-09-17T08:00:00.000Z"),
    });
  });

  it("only reuses a recent running or starting local heartbeat", () => {
    const now = new Date("2026-09-17T08:00:00.000Z");
    expect(isReusableLocalWorkerHeartbeat({ status: "running", lastSeenAt: now }, now)).toBe(true);
    expect(isReusableLocalWorkerHeartbeat({ status: "starting", lastSeenAt: new Date(now.getTime() - 119_999) }, now)).toBe(true);
    expect(isReusableLocalWorkerHeartbeat({ status: "stopped", lastSeenAt: now }, now)).toBe(false);
    expect(isReusableLocalWorkerHeartbeat({ status: "running", lastSeenAt: new Date(now.getTime() - 120_001) }, now)).toBe(false);
    expect(isReusableLocalWorkerHeartbeat(null, now)).toBe(false);
  });
});

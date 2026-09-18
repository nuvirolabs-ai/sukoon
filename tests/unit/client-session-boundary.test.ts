import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppState } from "@/lib/types";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules(); });
const privateState = { properties: [{ id: "private-owner-record" }] } as unknown as AppState;
async function ready(expiresAt?: string) {
  const store = await import("@/lib/client-store");
  const request = vi.fn()
    .mockResolvedValueOnce(Response.json({ data: {} }))
    .mockResolvedValueOnce(Response.json({ data: { state: privateState, version: 1, expiresAt, user: { email: "synthetic@example.com" } } }));
  vi.stubGlobal("fetch", request);
  await store.verifyOtp("synthetic@example.com", "test-only");
  expect(store.getSnapshot().status).toBe("ready");
  return { store, request };
}
describe("client account boundary", () => {
  it("drops private state at the server-issued expiry without a navigation or database edit", async () => {
    vi.useFakeTimers();
    const { store } = await ready(new Date(Date.now() + 30000).toISOString());
    await vi.advanceTimersByTimeAsync(29999);
    expect(store.getSnapshot().status).toBe("ready");
    await vi.advanceTimersByTimeAsync(1);
    expect(store.getSnapshot()).toMatchObject({ status: "signed-out", state: null, email: null });
  });
  it("clears private state before sign-out completes, and reports a server failure honestly", async () => {
    const { store, request } = await ready();
    let resolve!: (value: Response) => void;
    request.mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }));
    const pending = store.signOut();
    expect(store.getSnapshot()).toMatchObject({ status: "loading", state: null, email: null });
    resolve(new Response(null, { status: 503 })); await pending;
    expect(store.getSnapshot()).toMatchObject({ status: "error", state: null, email: null });
    expect(store.getSnapshot().error).toMatch(/could not be confirmed/);
  });
  it("discards queued writes on sign-out and cannot restore state from late in-flight replies", async () => {
    const { store, request } = await ready();
    let resolve!: (value: Response) => void;
    request.mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }));
    const pending = store.persistState(privateState);
    await Promise.resolve();
    const queued = store.persistState(privateState);
    request.mockResolvedValueOnce(Response.json({ data: { signedOut: true } }));
    await store.signOut();
    resolve(Response.json({ data: { state: privateState, version: 2 } }));
    await pending; await queued;
    expect(store.getSnapshot()).toMatchObject({ status: "signed-out", state: null, email: null });
    expect(request).toHaveBeenCalledTimes(4); // sign-in + session + one write + sign-out, no queued write
  });
});

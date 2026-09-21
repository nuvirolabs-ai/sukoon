"use client";

import type { AppState } from "./types";

export type ClientSnapshot = {
  status: "loading" | "signed-out" | "ready" | "error" | "unreachable";
  state: AppState | null;
  email: string | null;
  version: number;
  error?: string;
};

const runtimeProfile = process.env.NEXT_PUBLIC_SUKOON_RUNTIME_PROFILE;
export const clientReviewClient = runtimeProfile === "CLIENT_REVIEW";
export const stagingReviewClient = runtimeProfile === "STAGING";
export const reviewCodeClient = clientReviewClient || stagingReviewClient;

let snapshot: ClientSnapshot = { status: "loading", state: null, email: null, version: 0 };
const SERVER_SNAPSHOT: ClientSnapshot = { status: "loading", state: null, email: null, version: 0 };
const listeners = new Set<() => void>();
let loadStarted = false;
let writeQueue = Promise.resolve();
// Invalidates in-flight reads/writes when the account boundary changes.
let accountEpoch = 0;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
function armExpiry(expiresAt?: string) {
  if (expiryTimer) clearTimeout(expiryTimer);
  if (!expiresAt) return;
  const delay = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(delay)) return;
  const epoch = accountEpoch;
  expiryTimer = setTimeout(() => {
    if (epoch !== accountEpoch) return;
    accountEpoch++;
    publish({ status: "signed-out", state: null, email: null, version: 0 });
  }, Math.max(0, Math.min(delay, 2147483647)));
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return snapshot;
}

export function getServerSnapshot(): ClientSnapshot {
  return SERVER_SNAPSHOT;
}

function publish(next: ClientSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function startClientStore() {
  if (loadStarted || typeof window === "undefined") return;
  loadStarted = true;
  const epoch = accountEpoch;
  void fetch("/api/session", { cache: "no-store" })
    .then(async (response) => {
      if (epoch !== accountEpoch) return;
      if (response.status === 401) {
        publish({ status: "signed-out", state: null, email: null, version: 0 });
        return;
      }
      const body = await response.json() as { data?: { state: AppState; version: number; expiresAt?: string; user: { email: string } }; error?: { message?: string } };
      if (epoch !== accountEpoch) return;
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Could not load the local session.");
      publish({ status: "ready", state: body.data.state, email: body.data.user.email, version: body.data.version });
      armExpiry(body.data.expiresAt);
    })
    .catch((error: unknown) => {
      if (epoch !== accountEpoch) return;
      publish({
        status: "unreachable",
        state: snapshot.state,
        email: snapshot.email,
        version: snapshot.version,
        error: error instanceof Error ? error.message : "Could not reach Sukoon.",
      });
    });
}

export function retrySession() {
  loadStarted = false;
  if (snapshot.status !== "ready") publish({ status: "loading", state: snapshot.state, email: snapshot.email, version: snapshot.version, error: undefined });
  startClientStore();
}

async function parseResponse(response: Response) {
  const body = await response.json() as { data?: { state?: AppState; version?: number; expiresAt?: string; user?: { email: string } }; error?: { message?: string }; message?: string };
  if (!response.ok) throw new Error(body.error?.message || body.message || "Authentication was unavailable.");
  return body;
}

export async function requestOtp(email: string) {
  const response = await fetch("/api/auth/email-otp/send-verification-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), type: "sign-in" }),
  });
  await parseResponse(response);
  let sandboxOtp: string | undefined;
  const sandboxResponse = await fetch(`/api/auth/dev-mailbox?email=${encodeURIComponent(email.trim())}`, { cache: "no-store" });
  if (sandboxResponse.ok) {
    const sandboxBody = await sandboxResponse.json() as { data?: { otp?: string } };
    sandboxOtp = sandboxBody.data?.otp;
  }
  return { sandboxOtp };
}

export async function signInClientReview(email: string, accessCode: string) {
  return signInReviewEndpoint("/api/auth/client-review/sign-in", email, accessCode);
}

export async function signInStagingReview(email: string, accessCode: string) {
  return signInReviewEndpoint("/api/auth/staging-review/sign-in", email, accessCode);
}

async function signInReviewEndpoint(path: string, email: string, accessCode: string) {
  const epoch = ++accountEpoch;
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), accessCode }),
  });
  await parseResponse(response);
  const sessionResponse = await fetch("/api/session", { cache: "no-store" });
  const sessionBody = await parseResponse(sessionResponse);
  if (epoch !== accountEpoch) return;
  if (!sessionBody.data?.state || !sessionBody.data.user) throw new Error("Authentication succeeded but the session could not be loaded.");
  publish({ status: "ready", state: sessionBody.data.state, email: sessionBody.data.user.email, version: sessionBody.data.version ?? 0 });
  armExpiry(sessionBody.data.expiresAt);
}

export async function verifyOtp(email: string, otp: string) {
  const epoch = ++accountEpoch;
  const response = await fetch("/api/auth/sign-in/email-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
  });
  await parseResponse(response);
  const sessionResponse = await fetch("/api/session", { cache: "no-store" });
  const sessionBody = await parseResponse(sessionResponse);
  if (epoch !== accountEpoch) return;
  if (!sessionBody.data?.state || !sessionBody.data.user) throw new Error("Authentication succeeded but the session could not be loaded.");
  publish({ status: "ready", state: sessionBody.data.state, email: sessionBody.data.user.email, version: sessionBody.data.version ?? 0 });
  armExpiry(sessionBody.data.expiresAt);
}

export async function signOut() {
  const epoch = ++accountEpoch;
  // Remove private UI synchronously, before the network round trip completes.
  publish({ status: "loading", state: null, email: null, version: 0 });
  try {
    const response = await fetch("/api/session", { method: "DELETE" });
    if (!response.ok && response.status !== 401) throw new Error("Server sign-out could not be confirmed. Retry after reconnecting.");
    if (epoch === accountEpoch) publish({ status: "signed-out", state: null, email: null, version: 0 });
  } catch (error) {
    if (epoch === accountEpoch) publish({ status: "error", state: null, email: null, version: 0, error: error instanceof Error ? error.message : "Sign-out unavailable." });
  }
}

export function replaceState(state: AppState, version = snapshot.version) {
  if (snapshot.status === "ready") publish({ ...snapshot, state, version });
}

export function persistState(state: AppState) {
  const epoch = accountEpoch;
  const expectedVersion = snapshot.version;
  writeQueue = writeQueue.then(async () => {
    if (epoch !== accountEpoch || snapshot.status !== "ready") return;
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, version: expectedVersion }),
    });
    if (epoch !== accountEpoch) return;
    if (response.status === 401) {
      publish({ status: "signed-out", state: null, email: null, version: 0 });
      return;
    }
    const body = await response.json() as { data?: { state: AppState; version: number }; error?: { message?: string } };
    if (epoch !== accountEpoch) return;
    if (!response.ok || !body.data) throw new Error(body.error?.message || "Could not save your changes.");
    if (snapshot.status === "ready") publish({ ...snapshot, state: body.data.state, version: body.data.version });
  }).catch((error: unknown) => {
    if (epoch !== accountEpoch || snapshot.status !== "ready") return;
    publish({ ...snapshot, error: error instanceof Error ? error.message : "Could not save your changes." });
  });
  return writeQueue;
}

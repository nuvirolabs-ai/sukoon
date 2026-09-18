/** Short sessions are only for a separately created disposable acceptance database. */
export function sessionLifetimeSeconds(env: Record<string, string | undefined> = process.env) {
  if (env.APP_ENV === "local" && env.NODE_ENV !== "production" && env.SUKOON_RUNTIME_PROFILE === "CLIENT_REVIEW") return 30 * 24 * 60 * 60;
  const value = env.SUKOON_ACCEPTANCE_SESSION_SECONDS;
  if (!value) return 604800;
  const database = new URL(env.DATABASE_URL ?? "invalid:");
  const origin = new URL(env.BETTER_AUTH_URL ?? "invalid:");
  const seconds = Number(value);
  const erasureRun = env.SUKOON_ERASURE_RUN_ID;
  const erasureTarget = /^[a-f0-9]{16}$/.test(erasureRun ?? "") && [`/sukoon_s02_local_erasure_${erasureRun}`, `/sukoon_s02_local_erasure_${erasureRun}_restore`].includes(database.pathname) && env.SUKOON_SYNTHETIC_ERASURE === "synthetic-erasure-v1-no-content-retained";
  if (env.APP_ENV !== "local" || env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(database.hostname) || (!/^\/sukoon_s02_local_acceptance_[a-zA-Z0-9_]+$/.test(database.pathname) && !erasureTarget) || origin.hostname !== "127.0.0.1" || origin.port === "3100" || !Number.isInteger(seconds) || seconds < 30 || seconds > 300) throw new Error("ACCEPTANCE_SESSION_SCOPE_INVALID");
  return seconds;
}

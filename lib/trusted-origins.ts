import { configuredPublicOrigin, isHostedRuntime } from "@/lib/runtime-profile";

function addOrigin(origins: Set<string>, raw?: string | null) {
  if (!raw) return;
  for (const part of raw.split(",")) {
    const value = part.trim();
    if (!value) continue;
    try { origins.add(new URL(value).origin); } catch { /* ignore invalid entries */ }
  }
}

/** Same-origin allowlist for Better Auth and mutating API routes. Explicit env only; never inferred from the request Origin. */
export function trustedOriginList(env: NodeJS.Dict<string> = process.env): string[] {
  const origins = new Set<string>();
  addOrigin(origins, env.BETTER_AUTH_URL);
  addOrigin(origins, env.BETTER_AUTH_TRUSTED_ORIGINS);
  addOrigin(origins, env.SUKOON_TRUSTED_ORIGINS);
  addOrigin(origins, env.SUKOON_ANDROID_SERVER_URL);
  addOrigin(origins, env.NEXT_PUBLIC_SUKOON_API_BASE_URL);
  addOrigin(origins, configuredPublicOrigin(env));
  if (!isHostedRuntime(env) && env.APP_ENV !== "production") {
    addOrigin(origins, "http://localhost:3100");
    addOrigin(origins, "http://127.0.0.1:3100");
  }
  if (isHostedRuntime(env)) return [...origins].filter((origin) => origin.startsWith("https://"));
  return [...origins];
}

export function isTrustedOriginHeader(origin: string | null, env: NodeJS.Dict<string> = process.env): boolean {
  if (!origin) return false;
  try { return trustedOriginList(env).includes(new URL(origin).origin); } catch { return false; }
}

export type SukoonRuntimeProfile = "LOCAL_WEB" | "ANDROID_DEVICE_DEV" | "CLIENT_REVIEW" | "STAGING" | "PRODUCTION";

const PROFILES = new Set<SukoonRuntimeProfile>(["LOCAL_WEB", "ANDROID_DEVICE_DEV", "CLIENT_REVIEW", "STAGING", "PRODUCTION"]);

function readProfile(env: NodeJS.Dict<string>): SukoonRuntimeProfile | undefined {
  const value = env.SUKOON_RUNTIME_PROFILE;
  return value && PROFILES.has(value as SukoonRuntimeProfile) ? value as SukoonRuntimeProfile : undefined;
}

/** Hosted release profiles must never fall back to local/Tailscale HTTP. */
export function isHostedRuntime(env: NodeJS.Dict<string> = process.env): boolean {
  const profile = readProfile(env);
  return profile === "CLIENT_REVIEW" || profile === "STAGING" || profile === "PRODUCTION" || env.APP_ENV === "staging" || env.APP_ENV === "production";
}

export function isClientReviewEnvironment(env: NodeJS.Dict<string> = process.env): boolean {
  return readProfile(env) === "CLIENT_REVIEW" && env.APP_ENV === "local" && env.NODE_ENV !== "production";
}

/** Funnel owns the public hostname; do not ship a guessed or old provider URL. */
export function clientReviewOrigin(env: NodeJS.Dict<string> = process.env): string | undefined {
  const raw = env.SUKOON_CLIENT_REVIEW_ORIGIN?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash) return undefined;
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.ts\.net$/i.test(url.hostname)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function resolveSukoonRuntimeProfile(env: NodeJS.Dict<string> = process.env): SukoonRuntimeProfile {
  const explicit = readProfile(env);
  if (explicit) return explicit;
  if (env.APP_ENV === "production") return "PRODUCTION";
  if (env.APP_ENV === "staging") return "STAGING";
  if (env.SUKOON_ANDROID_SERVER_URL || env.NEXT_PUBLIC_SUKOON_API_BASE_URL) return "ANDROID_DEVICE_DEV";
  return "LOCAL_WEB";
}

export function configuredPublicOrigin(env: NodeJS.Dict<string> = process.env): string | undefined {
  for (const raw of [env.SUKOON_ANDROID_SERVER_URL, env.NEXT_PUBLIC_SUKOON_API_BASE_URL, env.BETTER_AUTH_URL]) {
    if (!raw) continue;
    try { return new URL(raw).origin; } catch { /* ignore invalid */ }
  }
  return undefined;
}

export function androidServerUrl(env: NodeJS.Dict<string> = process.env): string | undefined {
  const profile = readProfile(env);
  const hosted = isHostedRuntime(env);
  const expectedClientReviewOrigin = profile === "CLIENT_REVIEW" ? clientReviewOrigin(env) : undefined;
  const raw = env.SUKOON_ANDROID_SERVER_URL || env.NEXT_PUBLIC_SUKOON_API_BASE_URL || expectedClientReviewOrigin;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (profile === "CLIENT_REVIEW" && (!expectedClientReviewOrigin || url.origin !== expectedClientReviewOrigin)) return undefined;
    if (hosted && url.protocol !== "https:") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

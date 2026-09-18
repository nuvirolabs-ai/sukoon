import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

loadEnv({ path: ".env.android.local" });

function localDevHosts() {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  for (const raw of [
    process.env.SUKOON_ANDROID_SERVER_URL,
    process.env.NEXT_PUBLIC_SUKOON_API_BASE_URL,
    process.env.SUKOON_TRUSTED_ORIGINS,
    process.env.BETTER_AUTH_TRUSTED_ORIGINS,
  ]) {
    if (!raw) continue;
    for (const part of raw.split(",")) {
      try {
        hosts.add(new URL(part.trim()).hostname);
      } catch {
        /* ignore invalid entries */
      }
    }
  }
  return [...hosts];
}

const hosted = process.env.APP_ENV === "production" || process.env.APP_ENV === "staging"
  || process.env.SUKOON_RUNTIME_PROFILE === "PRODUCTION"
  || process.env.SUKOON_RUNTIME_PROFILE === "STAGING";

const configuredDistDir = process.env.SUKOON_NEXT_DIST_DIR?.trim();
const nextDistDir = configuredDistDir === ".next" || configuredDistDir === ".next-client-review" || configuredDistDir === ".next-acceptance" || configuredDistDir === ".next-erasure-restored"
  ? configuredDistDir
  : process.env.SUKOON_ACCEPTANCE_SESSION_SECONDS
    ? process.env.SUKOON_ERASURE_RESTORE_REVIEW === "1" ? ".next-erasure-restored" : ".next-acceptance"
    : undefined;

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(!hosted ? { allowedDevOrigins: localDevHosts() } : {}),
  // Keep concurrent local profiles in separate development directories.
  ...(nextDistDir ? { distDir: nextDistDir } : {}),
};

export default nextConfig;

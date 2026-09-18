import path from "node:path";
import { validatePrivateStorageEndpoint } from "@/lib/s3-object-storage";
import { validatePrivateScannerEndpoint } from "@/lib/clamd-scanner";
import { assertProviderConfiguration } from "@/lib/providers";

export const STAGING_DATABASE_NAME = "sukoon_demo_staging";
export const STAGING_SEED_CONFIRMATION = "CLIENT_DEMO_SYNTHETIC_V1";

function databaseName(raw: string | undefined) {
  try {
    const url = new URL(raw ?? "");
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") return null;
    return decodeURIComponent(url.pathname.slice(1));
  } catch {
    return null;
  }
}

/** The staging dataset is deliberately an explicit, post-deploy operation. */
export function assertStagingSeedEnvironment(env: NodeJS.ProcessEnv = process.env, actualDatabaseName?: string) {
  if (env.APP_ENV !== "staging" || env.NODE_ENV !== "production" || env.SUKOON_RUNTIME_PROFILE !== "STAGING") throw new Error("STAGING_SEED_PROFILE_REQUIRED");
  if (env.SUKOON_STAGING_SEED_CONFIRMATION !== STAGING_SEED_CONFIRMATION) throw new Error("STAGING_SEED_CONFIRMATION_REQUIRED");
  if (env.SUKOON_DATA_DIR && path.resolve(env.SUKOON_DATA_DIR) === path.resolve(".data")) throw new Error("STAGING_SEED_LOCAL_DATA_FORBIDDEN");
  if (databaseName(env.DATABASE_URL) !== STAGING_DATABASE_NAME || (actualDatabaseName !== undefined && actualDatabaseName !== STAGING_DATABASE_NAME)) throw new Error("STAGING_SEED_DATABASE_SCOPE_INVALID");
  if (env.SUKOON_STORAGE_PROVIDER !== "remote" || !env.SUKOON_STORAGE_BUCKET?.startsWith("sukoon-demo-staging")) throw new Error("STAGING_SEED_STORAGE_SCOPE_INVALID");
  if (env.SUKOON_SCANNER_PROVIDER !== "remote") throw new Error("STAGING_SEED_SCANNER_SCOPE_INVALID");
  if (env.SUKOON_EMAIL_PROVIDER !== "remote" || env.SUKOON_AUTH_MAILBOX === "memory" || env.SUKOON_AUTH_MAILBOX === "sandbox") throw new Error("STAGING_SEED_EMAIL_SCOPE_INVALID");
  try { validatePrivateStorageEndpoint(env.SUKOON_STORAGE_ENDPOINT ?? ""); } catch { throw new Error("STAGING_SEED_STORAGE_ENDPOINT_INVALID"); }
  try { validatePrivateScannerEndpoint(env.SUKOON_CLAMAV_ENDPOINT ?? ""); } catch { throw new Error("STAGING_SEED_SCANNER_ENDPOINT_INVALID"); }
  try { assertProviderConfiguration(env); } catch { throw new Error("STAGING_SEED_PROVIDER_CONFIGURATION_INVALID"); }
}

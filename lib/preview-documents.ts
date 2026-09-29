import { prisma } from "@/lib/prisma";
import type { AdapterEnvironment, ObjectStoragePort, ObjectToStore, ProviderResult } from "@/lib/providers";

const STORAGE_KEY = /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/;

/** Owner-entered files for the public staging preview. Production cannot enable this. */
export function previewDocumentsEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.SUKOON_PUBLIC_PREVIEW === "1"
    && env.APP_ENV === "staging"
    && env.NODE_ENV === "production"
    && env.SUKOON_RUNTIME_PROFILE === "STAGING"
    && env.SUKOON_PREVIEW_DOCUMENT_STORE === "postgres";
}

export function hostedPrivateStorageClosed(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV === "production" && !previewDocumentsEnabled(env);
}

function safeKey(storageKey: string) {
  return STORAGE_KEY.test(storageKey) ? storageKey : null;
}

/** Postgres bytes for the preview workspace. This adapter never returns a clean scan. */
export class PostgresPreviewObjectStorage implements ObjectStoragePort {
  readonly id = "preview-postgres";
  readonly environment: AdapterEnvironment = "sandbox";

  async put(object: ObjectToStore): Promise<ProviderResult<{ storageKey: string }>> {
    const storageKey = safeKey(object.storageKey);
    if (!storageKey) return { outcome: "unavailable", reason: "PREVIEW_STORAGE_KEY_UNSAFE" };
    try {
      const bytes = Uint8Array.from(object.bytes);
      await prisma.previewObject.upsert({
        where: { storageKey },
        create: { storageKey, bytes, contentType: object.contentType.slice(0, 120) },
        update: { bytes, contentType: object.contentType.slice(0, 120) },
      });
      return { outcome: "available", value: { storageKey } };
    } catch {
      return { outcome: "unavailable", reason: "PREVIEW_DOCUMENT_STORE_UNAVAILABLE" };
    }
  }

  async get(storageKey: string): Promise<ProviderResult<{ bytes: Uint8Array; contentType: string }>> {
    const key = safeKey(storageKey);
    if (!key) return { outcome: "unavailable", reason: "PREVIEW_STORAGE_KEY_UNSAFE" };
    try {
      const row = await prisma.previewObject.findUnique({ where: { storageKey: key } });
      if (!row) return { outcome: "unavailable", reason: "PREVIEW_OBJECT_MISSING" };
      return { outcome: "available", value: { bytes: new Uint8Array(row.bytes), contentType: row.contentType } };
    } catch {
      return { outcome: "unavailable", reason: "PREVIEW_DOCUMENT_STORE_UNAVAILABLE" };
    }
  }

  async delete(storageKey: string): Promise<ProviderResult<{ storageKey: string }>> {
    const key = safeKey(storageKey);
    if (!key) return { outcome: "unavailable", reason: "PREVIEW_STORAGE_KEY_UNSAFE" };
    try {
      await prisma.previewObject.deleteMany({ where: { storageKey: key } });
      return { outcome: "available", value: { storageKey: key } };
    } catch {
      return { outcome: "unavailable", reason: "PREVIEW_DOCUMENT_STORE_UNAVAILABLE" };
    }
  }
}

export function previewObjectStorage(): ObjectStoragePort | null {
  return previewDocumentsEnabled() ? new PostgresPreviewObjectStorage() : null;
}

import { describe, expect, it } from "vitest";
import { hostedPrivateStorageClosed, previewDocumentsEnabled } from "@/lib/preview-documents";

const stagingPreview = {
  SUKOON_PUBLIC_PREVIEW: "1",
  APP_ENV: "staging",
  NODE_ENV: "production",
  SUKOON_RUNTIME_PROFILE: "STAGING",
  SUKOON_PREVIEW_DOCUMENT_STORE: "postgres",
} as NodeJS.ProcessEnv;

describe("preview document store gate", () => {
  it("opens only for the flagged staging preview", () => {
    expect(previewDocumentsEnabled(stagingPreview)).toBe(true);
    expect(hostedPrivateStorageClosed(stagingPreview)).toBe(false);
  });

  it("stays closed in production and when any flag is missing", () => {
    expect(previewDocumentsEnabled({ ...stagingPreview, APP_ENV: "production" })).toBe(false);
    expect(previewDocumentsEnabled({ ...stagingPreview, SUKOON_PUBLIC_PREVIEW: "0" })).toBe(false);
    expect(previewDocumentsEnabled({ ...stagingPreview, SUKOON_PREVIEW_DOCUMENT_STORE: undefined })).toBe(false);
    expect(hostedPrivateStorageClosed({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(true);
    expect(hostedPrivateStorageClosed({ NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBe(false);
  });
});

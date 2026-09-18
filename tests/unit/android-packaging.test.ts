import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { appPathFromDeepLink } from "@/lib/deep-links";
import { androidServerUrl, resolveSukoonRuntimeProfile } from "@/lib/runtime-profile";
import { isTrustedOriginHeader, trustedOriginList } from "@/lib/trusted-origins";

describe("Android packaging origin and deep-link boundaries", () => {
  const clientReviewOrigin = "https://tanutejass-macbook-pro.tail535562.ts.net";
  it("keeps local web as the default profile and never treats Tailscale HTTP as production", () => {
    expect(resolveSukoonRuntimeProfile({ APP_ENV: "local" })).toBe("LOCAL_WEB");
    expect(resolveSukoonRuntimeProfile({ APP_ENV: "local", SUKOON_ANDROID_SERVER_URL: "http://100.64.0.1:3100" })).toBe("ANDROID_DEVICE_DEV");
    expect(resolveSukoonRuntimeProfile({ SUKOON_RUNTIME_PROFILE: "PRODUCTION", SUKOON_ANDROID_SERVER_URL: "http://100.64.0.1:3100" })).toBe("PRODUCTION");
    expect(androidServerUrl({ SUKOON_RUNTIME_PROFILE: "PRODUCTION", SUKOON_ANDROID_SERVER_URL: "http://100.64.0.1:3100" })).toBeUndefined();
    expect(androidServerUrl({ SUKOON_RUNTIME_PROFILE: "PRODUCTION", SUKOON_ANDROID_SERVER_URL: "https://app.example.test" })).toBe("https://app.example.test");
  });

  it("keeps client review on the fixed HTTPS origin and emits a separate debug artifact", () => {
    expect(resolveSukoonRuntimeProfile({ SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW", APP_ENV: "local" })).toBe("CLIENT_REVIEW");
    expect(androidServerUrl({ SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW", APP_ENV: "local", SUKOON_CLIENT_REVIEW_ORIGIN: clientReviewOrigin })).toBe(clientReviewOrigin);
    expect(androidServerUrl({ SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW", APP_ENV: "local", SUKOON_CLIENT_REVIEW_ORIGIN: clientReviewOrigin, SUKOON_ANDROID_SERVER_URL: "http://127.0.0.1:3100" })).toBeUndefined();
    const build = readFileSync("scripts/build-client-review-apk.mjs", "utf8");
    expect(build).toContain("Sukoon-Client-Review.apk");
    expect(build).toContain('SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW"');
    expect(build).toContain("build-android-apk.mjs");
    expect(readFileSync("scripts/build-android-apk.mjs", "utf8")).toContain("assembleDebug");
  });

  it("trusts only an explicit Android development origin plus local web, not the request attacker", () => {
    const env = { APP_ENV: "local", BETTER_AUTH_URL: "http://localhost:3100", SUKOON_ANDROID_SERVER_URL: "http://100.64.0.1:3100" };
    expect(trustedOriginList(env)).toEqual(expect.arrayContaining(["http://localhost:3100", "http://127.0.0.1:3100", "http://100.64.0.1:3100"]));
    expect(isTrustedOriginHeader("http://100.64.0.1:3100", env)).toBe(true);
    expect(isTrustedOriginHeader("https://attacker.invalid", env)).toBe(false);
    expect(isTrustedOriginHeader(null, env)).toBe(false);
    expect(trustedOriginList({ APP_ENV: "production", BETTER_AUTH_URL: "https://app.example.test", SUKOON_ANDROID_SERVER_URL: "http://100.64.0.1:3100" })).toEqual(["https://app.example.test"]);
  });

  it("maps synthetic Sukoon deep links onto existing routes and rejects unsafe targets", () => {
    expect(appPathFromDeepLink("sukoon://home")).toBe("/");
    expect(appPathFromDeepLink("sukoon://properties")).toBe("/properties");
    expect(appPathFromDeepLink("sukoon://property/abc-123")).toBe("/property/abc-123");
    expect(appPathFromDeepLink("sukoon://vault")).toBe("/vault");
    expect(appPathFromDeepLink("sukoon://share/invite-token")).toBe("/share/invite-token");
    expect(appPathFromDeepLink("sukoon://buy-sell/purchases")).toBe("/buy-sell/purchases");
    expect(appPathFromDeepLink("sukoon://buy-sell/purchases/abc/documents")).toBe("/buy-sell/purchases/abc/documents");
    expect(appPathFromDeepLink("sukoon://property/abc/documents/def")).toBe("/property/abc/documents/def");
    expect(appPathFromDeepLink("https://evil.invalid/vault", "http://localhost:3100")).toBeNull();
    expect(appPathFromDeepLink("sukoon://javascript:alert(1)")).toBeNull();
  });
});

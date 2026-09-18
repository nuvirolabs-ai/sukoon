import { describe, expect, it } from "vitest";
import { clientReviewOrigin, isClientReviewEnvironment, androidServerUrl, resolveSukoonRuntimeProfile } from "@/lib/runtime-profile";
import { trustedOriginList } from "@/lib/trusted-origins";
import { isClientReviewAuthEnvironment, isEmailDeliveryConfigured, isLocalAuthEnvironment } from "@/lib/auth-mailbox";
import { clientReviewSmtpConfigured } from "@/lib/smtp-mailbox";
import { CLIENT_REVIEW_UNAVAILABLE_MESSAGE, clientSafeError } from "@/lib/client-review";
import { validateClientReviewFunnelOutput, validateClientReviewFunnelStatus, validateTailscaleState } from "@/lib/client-review-launch";

const CLIENT_REVIEW_TEST_ORIGIN = "https://tanutejass-macbook-pro.tail535562.ts.net";

const clientReviewEnv = {
  APP_ENV: "local",
  NODE_ENV: "development",
  SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW",
  SUKOON_CLIENT_REVIEW_ORIGIN: CLIENT_REVIEW_TEST_ORIGIN,
  SUKOON_ANDROID_SERVER_URL: CLIENT_REVIEW_TEST_ORIGIN,
  BETTER_AUTH_URL: CLIENT_REVIEW_TEST_ORIGIN,
  BETTER_AUTH_TRUSTED_ORIGINS: CLIENT_REVIEW_TEST_ORIGIN,
  SUKOON_TRUSTED_ORIGINS: CLIENT_REVIEW_TEST_ORIGIN,
};

describe("Sukoon CLIENT_REVIEW profile", () => {
  it("resolves to the fixed HTTPS origin and never accepts a cleartext client-review URL", () => {
    expect(resolveSukoonRuntimeProfile(clientReviewEnv)).toBe("CLIENT_REVIEW");
    expect(isClientReviewEnvironment(clientReviewEnv)).toBe(true);
    expect(clientReviewOrigin(clientReviewEnv)).toBe(CLIENT_REVIEW_TEST_ORIGIN);
    expect(androidServerUrl(clientReviewEnv)).toBe(CLIENT_REVIEW_TEST_ORIGIN);
    expect(androidServerUrl({ ...clientReviewEnv, SUKOON_ANDROID_SERVER_URL: "http://127.0.0.1:3100" })).toBeUndefined();
    expect(clientReviewOrigin({ ...clientReviewEnv, SUKOON_CLIENT_REVIEW_ORIGIN: "https://demo.sukoon.nuvirolabs.com" })).toBeUndefined();
    expect(clientReviewOrigin({ ...clientReviewEnv, SUKOON_CLIENT_REVIEW_ORIGIN: "http://tanutejass-macbook-pro.tail535562.ts.net" })).toBeUndefined();
  });

  it("trusts only the exact public origin and keeps local origins out", () => {
    expect(trustedOriginList(clientReviewEnv)).toEqual([CLIENT_REVIEW_TEST_ORIGIN]);
    expect(trustedOriginList({ ...clientReviewEnv, BETTER_AUTH_TRUSTED_ORIGINS: `${CLIENT_REVIEW_TEST_ORIGIN},https://attacker.invalid` })).toEqual([CLIENT_REVIEW_TEST_ORIGIN, "https://attacker.invalid"]);
  });

  it("does not require SMTP or treat client review as the sandbox mailbox", () => {
    expect(isLocalAuthEnvironment(clientReviewEnv)).toBe(false);
    expect(isClientReviewAuthEnvironment(clientReviewEnv)).toBe(true);
    expect(clientReviewSmtpConfigured(clientReviewEnv)).toBe(false);
    expect(isEmailDeliveryConfigured(clientReviewEnv)).toBe(false);
    expect(isEmailDeliveryConfigured({ ...clientReviewEnv, APP_ENV: "local", SUKOON_RUNTIME_PROFILE: "LOCAL_WEB" })).toBe(true);
  });

  it("renders a stable connection message without leaking transport errors", () => {
    expect(clientSafeError(new TypeError(`Failed to fetch from ${CLIENT_REVIEW_TEST_ORIGIN}/api/session`))).toBe(CLIENT_REVIEW_UNAVAILABLE_MESSAGE);
    expect(clientSafeError(new Error("Email delivery is not configured for this environment."))).toBe("Email sign-in is temporarily unavailable. Check the configured sign-in email service.");
  });

  it("accepts only the observed Tailscale node and exact local proxy output", () => {
    expect(validateTailscaleState({
      Self: { DNSName: "tanutejass-macbook-pro.tail535562.ts.net." },
      CurrentTailnet: { MagicDNSEnabled: true },
    }, CLIENT_REVIEW_TEST_ORIGIN)).toEqual({ origin: CLIENT_REVIEW_TEST_ORIGIN });
    expect(() => validateTailscaleState({
      Self: { DNSName: "tanutejass-macbook-pro.tail535562.ts.net." },
      CurrentTailnet: { MagicDNSEnabled: false },
    }, CLIENT_REVIEW_TEST_ORIGIN)).toThrow("CLIENT_REVIEW_TAILSCALE_MAGICDNS_REQUIRED");
    expect(validateClientReviewFunnelOutput(`Available on the internet:\n${CLIENT_REVIEW_TEST_ORIGIN}\n|-- / proxy http://127.0.0.1:3110`, CLIENT_REVIEW_TEST_ORIGIN)).toEqual({ origin: CLIENT_REVIEW_TEST_ORIGIN, localService: "http://127.0.0.1:3110" });
    expect(() => validateClientReviewFunnelOutput(`Available on the internet:\n${CLIENT_REVIEW_TEST_ORIGIN}\n|-- / proxy http://127.0.0.1:5432`, CLIENT_REVIEW_TEST_ORIGIN)).toThrow("CLIENT_REVIEW_FUNNEL_TARGET_INVALID");
    expect(validateClientReviewFunnelStatus({ Foreground: { node: { Web: { [`${new URL(CLIENT_REVIEW_TEST_ORIGIN).hostname}:443`]: { Handlers: { "/": { Proxy: "http://127.0.0.1:3110" } } } }, AllowFunnel: { [`${new URL(CLIENT_REVIEW_TEST_ORIGIN).hostname}:443`]: true } } } }, CLIENT_REVIEW_TEST_ORIGIN)).toEqual({ origin: CLIENT_REVIEW_TEST_ORIGIN, localService: "http://127.0.0.1:3110" });
    expect(() => validateClientReviewFunnelStatus({ Foreground: {} }, CLIENT_REVIEW_TEST_ORIGIN)).toThrow("CLIENT_REVIEW_FUNNEL_STATUS_TARGET_INVALID");
  });

  it("accepts the current Tailscale 1.102 funnel status shape", () => {
    const host = `${new URL(CLIENT_REVIEW_TEST_ORIGIN).hostname}:443`;
    expect(validateClientReviewFunnelStatus({
      TCP: { "443": { HTTPS: true } },
      Web: { [host]: { Handlers: { "/": { Proxy: "http://127.0.0.1:3110" } } } },
      AllowFunnel: { [host]: true },
    }, CLIENT_REVIEW_TEST_ORIGIN)).toEqual({ origin: CLIENT_REVIEW_TEST_ORIGIN, localService: "http://127.0.0.1:3110" });
  });
});

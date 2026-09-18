import { describe, expect, it } from "vitest";
import { SmtpEmailAdapter, smtpConfigFromEnvironment, validateSmtpConfig } from "@/lib/smtp-mailbox";

const smtpEnv = {
  APP_ENV: "staging",
  NODE_ENV: "production",
  SUKOON_RUNTIME_PROFILE: "STAGING",
  SUKOON_EMAIL_PROVIDER: "remote",
  SUKOON_SMTP_HOST: "smtp.example.test",
  SUKOON_SMTP_PORT: "587",
  SUKOON_SMTP_TLS_MODE: "starttls",
  SUKOON_SMTP_USERNAME: "demo-user",
  SUKOON_SMTP_PASSWORD: "demo-secret",
  SUKOON_EMAIL_FROM: "Sukoon Demo <demo@example.test>",
} as const;

describe("staging SMTP email adapter", () => {
  it("requires TLS and a verified sender without accepting local or plaintext delivery", () => {
    expect(smtpConfigFromEnvironment(smtpEnv)).toMatchObject({ host: "smtp.example.test", port: 587, tlsMode: "starttls" });
    expect(() => validateSmtpConfig({ ...smtpEnv, SUKOON_SMTP_TLS_MODE: "none" })).toThrow("SMTP_TLS_REQUIRED");
    expect(() => validateSmtpConfig({ ...smtpEnv, SUKOON_SMTP_HOST: "localhost" })).toThrow("SMTP_HOST_INVALID");
    expect(() => validateSmtpConfig({ ...smtpEnv, SUKOON_EMAIL_FROM: "not-an-email" })).toThrow("SMTP_FROM_INVALID");
    expect(() => smtpConfigFromEnvironment({ APP_ENV: "local", SUKOON_EMAIL_PROVIDER: "sandbox" })).toThrow("SMTP_CONFIGURATION_INCOMPLETE");
  });

  it("sends through the injected transport, supports bounded idempotent replay and does not return message content", async () => {
    const messages: Array<Record<string, unknown>> = [];
    const adapter = new SmtpEmailAdapter(smtpConfigFromEnvironment(smtpEnv), {
      sendMail: async (message) => { messages.push(message); return { messageId: "smtp-message-1" }; },
    });
    const first = await adapter.send({ to: "client@example.test", subject: "Your Sukoon sign-in code", text: "123456", idempotencyKey: "otp-request-1" });
    const replay = await adapter.send({ to: "client@example.test", subject: "Your Sukoon sign-in code", text: "different-content", idempotencyKey: "otp-request-1" });
    expect(first).toEqual({ outcome: "available", value: { messageId: "smtp-message-1" } });
    expect(replay).toEqual(first);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ to: "client@example.test", subject: "Your Sukoon sign-in code", text: "123456" });
    expect(JSON.stringify(first)).not.toContain("123456");
  });

  it("maps transport errors to a bounded unavailable result without exposing provider details", async () => {
    const adapter = new SmtpEmailAdapter(smtpConfigFromEnvironment(smtpEnv), { sendMail: async () => { throw new Error("provider password and private response"); } });
    const result = await adapter.send({ to: "client@example.test", subject: "code", text: "123456" });
    expect(result).toEqual({ outcome: "unavailable", reason: "EMAIL_DELIVERY_UNAVAILABLE" });
    expect(JSON.stringify(result)).not.toContain("password");
  });
});

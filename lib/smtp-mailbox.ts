import nodemailer from "nodemailer";
import type { AdapterEnvironment, ProviderResult, TransactionalEmailPort } from "@/lib/providers";
import { isClientReviewEnvironment } from "@/lib/runtime-profile";

export type SmtpConfig = { host: string; port: number; tlsMode: "tls" | "starttls"; username: string; password: string; from: string };
export type SmtpMessage = { from: string; to: string; subject: string; text: string; headers?: Record<string, string> };
export type SmtpTransport = { sendMail(message: SmtpMessage): Promise<{ messageId?: string }> };

const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function senderAddress(value: string) {
  const match = /<([^<>]+)>/.exec(value);
  return (match?.[1] ?? value).trim();
}

export function validateSmtpConfig(env: NodeJS.Dict<string>): SmtpConfig {
  const allowed = (env.APP_ENV === "staging" && env.SUKOON_RUNTIME_PROFILE === "STAGING" && env.NODE_ENV === "production") || isClientReviewEnvironment(env);
  if (!allowed || env.SUKOON_EMAIL_PROVIDER !== "remote") throw new Error("SMTP_CONFIGURATION_INCOMPLETE");
  const host = env.SUKOON_SMTP_HOST?.trim() ?? "";
  const port = Number(env.SUKOON_SMTP_PORT);
  const tlsMode = env.SUKOON_SMTP_TLS_MODE === "tls" || env.SUKOON_SMTP_TLS_MODE === "starttls" ? env.SUKOON_SMTP_TLS_MODE : null;
  const from = env.SUKOON_EMAIL_FROM?.trim() ?? "";
  if (!host || host === "localhost" || host === "127.0.0.1" || host.includes("://")) throw new Error("SMTP_HOST_INVALID");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT_INVALID");
  if (!tlsMode) throw new Error("SMTP_TLS_REQUIRED");
  if (!env.SUKOON_SMTP_USERNAME || !env.SUKOON_SMTP_PASSWORD) throw new Error("SMTP_CREDENTIALS_MISSING");
  if (!emailPattern.test(senderAddress(from))) throw new Error("SMTP_FROM_INVALID");
  return { host, port, tlsMode, username: env.SUKOON_SMTP_USERNAME, password: env.SUKOON_SMTP_PASSWORD, from };
}

export function smtpConfigFromEnvironment(env: NodeJS.Dict<string> = process.env) {
  try { return validateSmtpConfig(env); } catch { throw new Error("SMTP_CONFIGURATION_INCOMPLETE"); }
}

function createNodemailerTransport(config: SmtpConfig): SmtpTransport {
  return nodemailer.createTransport({ host: config.host, port: config.port, secure: config.tlsMode === "tls", requireTLS: config.tlsMode === "starttls", auth: { user: config.username, pass: config.password } });
}

export class SmtpEmailAdapter implements TransactionalEmailPort {
  readonly id = "staging-smtp";
  readonly environment: AdapterEnvironment = "remote";
  private readonly delivered = new Map<string, string>();
  private readonly transport: SmtpTransport;

  constructor(private readonly config: SmtpConfig, transport?: SmtpTransport) {
    this.transport = transport ?? createNodemailerTransport(config);
  }

  async send(input: { to: string; subject: string; text: string; idempotencyKey?: string }): Promise<ProviderResult<{ messageId: string }>> {
    if (!emailPattern.test(input.to.trim())) return { outcome: "unavailable", reason: "EMAIL_RECIPIENT_INVALID" };
    if (input.idempotencyKey) {
      const prior = this.delivered.get(input.idempotencyKey);
      if (prior) return { outcome: "available", value: { messageId: prior } };
    }
    try {
      const result = await this.transport.sendMail({ from: this.config.from, to: input.to.trim(), subject: input.subject.slice(0, 160), text: input.text, headers: input.idempotencyKey ? { "X-Sukoon-Idempotency-Key": input.idempotencyKey } : undefined });
      if (!result.messageId) return { outcome: "unavailable", reason: "EMAIL_DELIVERY_UNAVAILABLE" };
      if (input.idempotencyKey) this.delivered.set(input.idempotencyKey, result.messageId);
      return { outcome: "available", value: { messageId: result.messageId } };
    } catch {
      return { outcome: "unavailable", reason: "EMAIL_DELIVERY_UNAVAILABLE" };
    }
  }
}

export function stagingSmtpConfigured(env: NodeJS.Dict<string> = process.env) {
  try { validateSmtpConfig(env); return true; } catch { return false; }
}

export function clientReviewSmtpConfigured(env: NodeJS.Dict<string> = process.env) {
  if (!isClientReviewEnvironment(env)) return false;
  try { validateSmtpConfig(env); return true; } catch { return false; }
}

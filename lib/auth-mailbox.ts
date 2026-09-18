import { assertErasureReady, readErasureLedger } from "@/lib/erasure-gate";
import { createHash } from "node:crypto";
import { SmtpEmailAdapter, smtpConfigFromEnvironment, stagingSmtpConfigured } from "@/lib/smtp-mailbox";
import { isClientReviewEnvironment } from "@/lib/runtime-profile";
type MailboxMessage = {
  otp: string;
  expiresAt: number;
  type: string;
};

const messages = new Map<string, MailboxMessage>();
let erasureRevision: number | undefined;
function fenceMailbox() {
  assertErasureReady();
  if (!process.env.SUKOON_SYNTHETIC_ERASURE) return;
  const revision = readErasureLedger().deletions.length;
  if (erasureRevision !== revision) { messages.clear(); erasureRevision = revision; }
}

export function isLocalAuthEnvironment(env: NodeJS.Dict<string> = process.env) {
  return (env.APP_ENV === "local" || env.APP_ENV === "test") && env.NODE_ENV !== "production" && !isClientReviewEnvironment(env);
}

export function isStagingAuthEnvironment(env: NodeJS.Dict<string> = process.env) {
  return env.APP_ENV === "staging" && env.SUKOON_RUNTIME_PROFILE === "STAGING" && env.NODE_ENV === "production";
}

export function isClientReviewAuthEnvironment(env: NodeJS.Dict<string> = process.env) {
  return isClientReviewEnvironment(env);
}

export function isEmailDeliveryConfigured(env: NodeJS.Dict<string> = process.env) {
  return isLocalAuthEnvironment(env) || (isStagingAuthEnvironment(env) && stagingSmtpConfigured(env));
}

export async function deliverVerificationOtp(data: { email: string; otp: string; type: string }) {
  fenceMailbox();
  if (isLocalAuthEnvironment()) {
    messages.set(data.email.trim().toLowerCase(), { otp: data.otp, type: data.type, expiresAt: Date.now() + 5 * 60 * 1000 });
    return;
  }
  const remoteSmtp = isStagingAuthEnvironment() && stagingSmtpConfigured();
  if (!remoteSmtp) throw new Error("Email delivery is not configured for this environment.");
  const idempotencyKey = createHash("sha256").update(`${data.email.trim().toLowerCase()}\0${data.type}\0${data.otp}`).digest("hex");
  const result = await new SmtpEmailAdapter(smtpConfigFromEnvironment()).send({ to: data.email, subject: "Your Sukoon sign-in code", text: `Your Sukoon sign-in code is ${data.otp}. It expires in 5 minutes.`, idempotencyKey });
  if (result.outcome === "unavailable") throw new Error("Email delivery is not configured for this environment.");
}

export function readLocalOtp(email: string) {
  fenceMailbox();
  if (!isLocalAuthEnvironment()) return null;
  const key = email.trim().toLowerCase();
  const message = messages.get(key);
  if (!message || message.expiresAt <= Date.now()) {
    messages.delete(key);
    return null;
  }
  return { otp: message.otp, type: message.type, expiresAt: new Date(message.expiresAt).toISOString() };
}

export function clearLocalMailbox() {
  messages.clear();
}

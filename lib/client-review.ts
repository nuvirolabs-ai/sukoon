import { clientReviewOrigin, isClientReviewEnvironment } from "@/lib/runtime-profile";

export { clientReviewOrigin, isClientReviewEnvironment };

export const CLIENT_REVIEW_MAC_PORT = 3110;
export const CLIENT_REVIEW_UNAVAILABLE_MESSAGE = "Unable to reach Sukoon right now.";
export const CLIENT_REVIEW_EMAIL_UNAVAILABLE_MESSAGE = "Email sign-in is temporarily unavailable. Check the configured sign-in email service.";

const transportError = /(?:failed to fetch|network|connection|cloudflare|webview|err_|localhost|127\.0\.0\.1|stack|econn|timeout)/i;

export function clientSafeError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message || transportError.test(message)) return CLIENT_REVIEW_UNAVAILABLE_MESSAGE;
  if (/email delivery is not configured/i.test(message)) return CLIENT_REVIEW_EMAIL_UNAVAILABLE_MESSAGE;
  return message.replace(/[\r\n]+/g, " ").slice(0, 240);
}

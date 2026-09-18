import { clientReviewOrigin } from "@/lib/runtime-profile";

export const CLIENT_REVIEW_MAC_PORT = 3110;
export const CLIENT_REVIEW_LOCAL_SERVICE = `http://127.0.0.1:${CLIENT_REVIEW_MAC_PORT}` as const;
export const CLIENT_REVIEW_NEXT_DIST_DIR = ".next-client-review" as const;

function expectedOrigin(value: string) {
  const origin = clientReviewOrigin({ SUKOON_CLIENT_REVIEW_ORIGIN: value });
  if (!origin) throw new Error("CLIENT_REVIEW_FUNNEL_ORIGIN_INVALID");
  return origin;
}

export function validateTailscaleState(value: unknown, expected: string) {
  const origin = expectedOrigin(expected);
  if (!value || typeof value !== "object") throw new Error("CLIENT_REVIEW_TAILSCALE_STATUS_INVALID");
  const state = value as { Self?: { DNSName?: unknown }; CurrentTailnet?: { MagicDNSEnabled?: unknown } };
  if (state.CurrentTailnet?.MagicDNSEnabled !== true) throw new Error("CLIENT_REVIEW_TAILSCALE_MAGICDNS_REQUIRED");
  const dnsName = typeof state.Self?.DNSName === "string" ? state.Self.DNSName.replace(/\.$/, "") : "";
  if (`https://${dnsName}` !== origin) throw new Error("CLIENT_REVIEW_TAILSCALE_ORIGIN_MISMATCH");
  return { origin };
}

export function validateClientReviewFunnelOutput(output: string, expected: string) {
  const origin = expectedOrigin(expected);
  if (!output.includes("Available on the internet:") || !output.includes(origin)) throw new Error("CLIENT_REVIEW_FUNNEL_ORIGIN_UNCONFIRMED");
  if (!output.includes(`|-- / proxy ${CLIENT_REVIEW_LOCAL_SERVICE}`)) throw new Error("CLIENT_REVIEW_FUNNEL_TARGET_INVALID");
  if (/tcp:\/\/|127\.0\.0\.1:(?:5432|3110)(?!\b)/i.test(output.replace(CLIENT_REVIEW_LOCAL_SERVICE, ""))) throw new Error("CLIENT_REVIEW_FUNNEL_TARGET_INVALID");
  return { origin, localService: CLIENT_REVIEW_LOCAL_SERVICE };
}

export function validateClientReviewFunnelStatus(value: unknown, expected: string) {
  const origin = expectedOrigin(expected);
  if (!value || typeof value !== "object") throw new Error("CLIENT_REVIEW_FUNNEL_STATUS_INVALID");
  type FunnelStatusNode = { Web?: Record<string, { Handlers?: Record<string, { Proxy?: unknown }> }>; AllowFunnel?: Record<string, unknown> };
  const root = value as FunnelStatusNode & { Foreground?: Record<string, FunnelStatusNode> };
  const expectedHost = `${new URL(origin).hostname}:443`;
  const statusNodes = root.Foreground ? Object.values(root.Foreground) : [root];
  const matchingNode = statusNodes.find((node) => node.Web?.[expectedHost]?.Handlers?.["/"]?.Proxy === CLIENT_REVIEW_LOCAL_SERVICE && node.AllowFunnel?.[expectedHost] === true);
  if (!matchingNode) throw new Error("CLIENT_REVIEW_FUNNEL_STATUS_TARGET_INVALID");
  return { origin, localService: CLIENT_REVIEW_LOCAL_SERVICE };
}

export function isReusableLocalWorkerHeartbeat(value: { status?: unknown; lastSeenAt?: Date | string } | null | undefined, now = new Date(), maxAgeMs = 120_000) {
  if (!value || (value.status !== "running" && value.status !== "starting")) return false;
  const lastSeenAt = value.lastSeenAt instanceof Date ? value.lastSeenAt : new Date(value.lastSeenAt ?? "");
  return Number.isFinite(lastSeenAt.getTime()) && now.getTime() - lastSeenAt.getTime() < maxAgeMs;
}

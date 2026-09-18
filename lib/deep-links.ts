const SAFE_APP_PATH = /^\/(?:$|[a-z0-9][\w\-./]*)$/i;

/** Map an Android custom-scheme or https app-link URL onto an in-app path. Authorization still runs after navigation. */
export function appPathFromDeepLink(raw: string, currentOrigin?: string): string | null {
  let parsed: URL;
  try { parsed = new URL(raw); } catch { return null; }
  if (parsed.protocol === "sukoon:") {
    const host = parsed.hostname.toLowerCase();
    const rest = parsed.pathname === "/" ? "" : parsed.pathname;
    const path = !host || host === "home" ? `/${rest === "/" ? "" : rest.replace(/^\//, "")}` : `/${host}${rest}`;
    const normalized = path.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    if (normalized === "/home") return `/${parsed.search}${parsed.hash}`;
    return SAFE_APP_PATH.test(normalized) ? `${normalized}${parsed.search}${parsed.hash}` : null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (currentOrigin && parsed.origin !== currentOrigin) {
    const allowed = (process.env.NEXT_PUBLIC_SUKOON_APP_LINK_HOST || "").split(",").map((value) => value.trim()).filter(Boolean);
    if (!allowed.includes(parsed.host)) return null;
  }
  const path = `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  return SAFE_APP_PATH.test(parsed.pathname || "/") ? path : null;
}

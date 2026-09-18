import { isTrustedOriginHeader, trustedOriginList } from "@/lib/trusted-origins";

/** Next dev may normalize the route URL host; compare with the configured public auth origin plus explicit Android/dev extras. */
export function hasTrustedOrigin(request: Request, env: NodeJS.Dict<string> = process.env) {
  const origin = request.headers.get("origin");
  if (isTrustedOriginHeader(origin, env)) return true;
  const configured = env.BETTER_AUTH_URL;
  try {
    return origin === new URL(configured || request.url).origin && trustedOriginList(env).includes(origin);
  } catch {
    return false;
  }
}

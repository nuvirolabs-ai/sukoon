import { APIError, betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { deliverVerificationOtp, isEmailDeliveryConfigured } from "@/lib/auth-mailbox";
import { sessionLifetimeSeconds } from "@/lib/session-policy";
import { trustedOriginList } from "@/lib/trusted-origins";
import { clientReviewAuthPlugin, stagingReviewAuthPlugin } from "@/lib/client-review-auth";

const localTransportGuard = {
  id: "sukoon-local-email-transport-guard",
  version: "1.0.0",
  hooks: {
    before: [{
      matcher: (context: { path?: string }) => context.path === "/email-otp/send-verification-otp",
      handler: async () => {
        if (!isEmailDeliveryConfigured()) throw APIError.fromStatus("SERVICE_UNAVAILABLE", { message: "Email delivery is not configured for this environment." });
      },
    }],
  },
};

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters.");
  }
  return betterAuth({
  appName: "Sukoon",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3100",
  trustedOrigins: trustedOriginList(),
  secret,
  database: prismaAdapter(prisma, { provider: "postgresql", transaction: true }),
  session: {
    expiresIn: sessionLifetimeSeconds(),
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  plugins: [localTransportGuard, clientReviewAuthPlugin(), stagingReviewAuthPlugin(),
    emailOTP({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 5,
      storeOTP: "hashed",
      resendStrategy: "rotate",
      async sendVerificationOTP(data) {
        await deliverVerificationOtp(data);
      },
    }),
  ],
});
}

type Auth = ReturnType<typeof createAuth>;

const configuredSecret = process.env.BETTER_AUTH_SECRET;
let deferredAuth: Auth | undefined;
export const auth: Auth = configuredSecret && configuredSecret.length >= 32
  ? createAuth()
  : new Proxy({} as Auth, {
      get(_target, prop, receiver) {
        deferredAuth ??= createAuth();
        const value = Reflect.get(deferredAuth, prop, receiver);
        return typeof value === "function" ? value.bind(deferredAuth) : value;
      },
    });

export default auth;

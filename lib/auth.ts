import { APIError, betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { deliverVerificationOtp, isEmailDeliveryConfigured } from "@/lib/auth-mailbox";
import { sessionLifetimeSeconds } from "@/lib/session-policy";
import { trustedOriginList } from "@/lib/trusted-origins";
import { clientReviewAuthPlugin } from "@/lib/client-review-auth";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters.");
}

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

export const auth = betterAuth({
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
  plugins: [localTransportGuard, clientReviewAuthPlugin(),
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

export default auth;

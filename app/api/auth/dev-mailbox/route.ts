import { NextResponse } from "next/server";
import { isLocalAuthEnvironment, readLocalOtp } from "@/lib/auth-mailbox";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isLocalAuthEnvironment()) return NextResponse.json({ error: { code: "AUTH_PROVIDER_UNAVAILABLE", message: "The local sandbox mailbox is disabled outside local development." } }, { status: 503 });
  const email = new URL(request.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: { code: "INVALID_EMAIL", message: "An email address is required." } }, { status: 400 });
  const message = readLocalOtp(email);
  if (!message) return NextResponse.json({ error: { code: "OTP_NOT_AVAILABLE", message: "No current sandbox message is available." } }, { status: 404 });
  return NextResponse.json({ data: message, environment: "local" }, { headers: { "Cache-Control": "no-store" } });
}

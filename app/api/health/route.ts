import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Public process liveness only. Optional providers must not take healthy
  // unrelated routes out of service or disclose configuration anonymously.
  return NextResponse.json({ data: { status: "alive" } }, { headers: { "Cache-Control": "no-store" } });
}

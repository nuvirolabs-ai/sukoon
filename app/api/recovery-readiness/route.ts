import { NextResponse } from "next/server";
import { assertErasureReady } from "@/lib/erasure-gate";
export const runtime = "nodejs";
export async function GET() {
  try { assertErasureReady(); return NextResponse.json({ data: { available: true } }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ data: { available: false, code: "RECOVERY_REQUIRED" } }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}

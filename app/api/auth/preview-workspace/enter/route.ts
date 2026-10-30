import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, status: true, message: "Preview workspace unlocked" });
}

export async function GET() {
  return NextResponse.json({ ok: true, status: true, message: "Preview workspace unlocked" });
}

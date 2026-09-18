import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { downloadExportForUser, ExportInputError } from "@/lib/exports";

export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const result = await downloadExportForUser(session.user.id, (await context.params).id);
    return new NextResponse(Buffer.from(result.bytes), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${result.filename}"`, "Content-Length": String(result.bytes.byteLength), "X-Artifact-SHA256": result.sha256, "Cache-Control": "private, no-store" } });
  } catch (error: unknown) { if (error instanceof ExportInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

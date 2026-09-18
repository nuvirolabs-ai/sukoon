import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listNotificationPreferencesForUser, ReminderInputError, setNotificationPreferencesForUser } from "@/lib/durable-reminders";

export const runtime = "nodejs";
function errorResponse(error: ReminderInputError) { return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse(new ReminderInputError("AUTHENTICATION_REQUIRED", "Sign in required.", 401));
  try { return NextResponse.json({ data: { preferences: await listNotificationPreferencesForUser(session.user.id) } }); }
  catch (error: unknown) { if (error instanceof ReminderInputError) return errorResponse(error); throw error; }
}
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse(new ReminderInputError("AUTHENTICATION_REQUIRED", "Sign in required.", 401));
  try { return NextResponse.json({ data: { preferences: await setNotificationPreferencesForUser(session.user.id, await request.json()) } }); }
  catch (error: unknown) { if (error instanceof ReminderInputError) return errorResponse(error); throw error; }
}

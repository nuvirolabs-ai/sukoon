import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createManualReminderForUser, listRemindersForUser, markAllRemindersReadForUser, ReminderInputError, setNotificationPreferencesForUser } from "@/lib/durable-reminders";

export const runtime = "nodejs";

function errorResponse(error: ReminderInputError) {
  return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const url = new URL(request.url);
  try {
    const reminders = await listRemindersForUser(session.user.id, url.searchParams.get("propertyId") || undefined, url.searchParams.get("state") || undefined);
    return NextResponse.json({ data: { reminders } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { if (error instanceof ReminderInputError) return errorResponse(error); throw error; }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const body = await request.json() as { action?: string; propertyId?: unknown; preferences?: unknown; title?: unknown; scheduledDate?: unknown; localTime?: unknown; channels?: unknown; sourceType?: unknown; sourceId?: unknown; deepLink?: unknown; body?: unknown; timezone?: unknown; idempotencyKey?: unknown };
    if (body.action === "preferences") return NextResponse.json({ data: { preferences: await setNotificationPreferencesForUser(session.user.id, body.preferences) } });
    if (body.action === "create") {
      const propertyId = body.propertyId;
      if (typeof propertyId !== "string") throw new ReminderInputError("PROPERTY_INVALID", "Property is invalid.");
      return NextResponse.json({ data: { reminders: await createManualReminderForUser(session.user.id, propertyId, body) } }, { status: 201 });
    }
    if (body.action !== "mark-all-read") throw new ReminderInputError("REMINDER_ACTION_INVALID", "Reminder action is invalid.");
    const propertyId = body.propertyId === undefined ? undefined : typeof body.propertyId === "string" ? body.propertyId : (() => { throw new ReminderInputError("PROPERTY_INVALID", "Property is invalid."); })();
    return NextResponse.json({ data: { result: await markAllRemindersReadForUser(session.user.id, propertyId) } });
  } catch (error: unknown) { if (error instanceof ReminderInputError) return errorResponse(error); throw error; }
}

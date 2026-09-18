import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actOnReminderForUser, ReminderInputError, type ReminderAction } from "@/lib/durable-reminders";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json() as { action?: string; until?: unknown };
    if (!["read", "unread", "snooze", "dismiss"].includes(body.action ?? "")) throw new ReminderInputError("REMINDER_ACTION_INVALID", "Reminder action is invalid.");
    const action = body.action as ReminderAction;
    return NextResponse.json({ data: { reminder: await actOnReminderForUser(session.user.id, id, action, body.until) } });
  } catch (error: unknown) { if (error instanceof ReminderInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

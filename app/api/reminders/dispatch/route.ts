import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runReminderWorkerOnce, ReminderInputError } from "@/lib/durable-reminders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  try {
    const results = [];
    for (let index = 0; index < 20; index += 1) {
      const result = await runReminderWorkerOnce(`api-reminder-worker-${session.user.id}`);
      if (!result) break;
      results.push(result);
    }
    return NextResponse.json({ data: { results, providerNote: "In-app delivery is persisted locally; email is sandbox-captured and push is unavailable until configured." } });
  } catch (error: unknown) { if (error instanceof ReminderInputError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }); throw error; }
}

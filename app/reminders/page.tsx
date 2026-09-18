"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Disclosure, displayLabel, shortDate } from "@/components/consumer";
import { EmptyState, ErrorState, PageHead, StatusPill } from "@/components/ui";
import { AnimatedSegment } from "@/components/motion/AnimatedSegment";
import { ListSkeleton } from "@/components/motion/Skeleton";

type DurableReminder = {
  id: string;
  propertyId: string;
  sourceType: string;
  sourceId: string;
  offsetDays: number;
  scheduledAt: string;
  timezone: string;
  localTime: string;
  channel: string;
  state: string;
  readAt: string | null;
  snoozedUntil: string | null;
  attemptCount: number;
  deliveredAt: string | null;
  failureState: string | null;
  failureReason: string | null;
  deepLink: string;
  title: string;
  body: string;
};

function tone(state: string): "neutral" | "success" | "warning" | "danger" { return state === "DELIVERED" ? "success" : state === "FAILED_TERMINAL" || state === "CANCELLED" ? "danger" : state === "READY" || state === "DISPATCHING" ? "warning" : "neutral"; }

export default function RemindersPage() {
  const [reminders, setReminders] = useState<DurableReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      await fetch("/api/reminders/dispatch", { method: "POST" });
      const response = await fetch("/api/reminders", { cache: "no-store" });
      const body = await response.json() as { data?: { reminders: DurableReminder[] }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Reminders could not be loaded.");
      setReminders(body.data.reminders);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Reminders could not be loaded."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const action = async (id: string, actionName: "read" | "unread" | "snooze" | "dismiss", until?: string) => {
    const response = await fetch(`/api/reminders/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName, until }) });
    if (!response.ok) { const body = await response.json() as { error?: { message?: string } }; setError(body.error?.message || "Reminder action could not be saved."); return; }
    await load();
  };

  const markAllRead = async () => {
    const response = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark-all-read" }) });
    if (!response.ok) { setError("Reminders could not be marked read."); return; }
    await load();
  };

  const visible = unreadOnly ? reminders.filter((reminder) => !reminder.readAt) : reminders;
  return <div>
    <PageHead title="Reminders" sub="Your upcoming reminders and follow-ups" />
    <div className="space-y-3 pb-6">
      <div className="surface p-4 text-[13px] text-ink-muted">Reminders are based on records you entered. They are not official deadlines.</div>
      <div className="flex gap-2 items-center"><AnimatedSegment label="Reminder filter" value={unreadOnly ? "unread" : "all"} onChange={(v) => setUnreadOnly(v === "unread")} options={[{ value: "all", label: "All" }, { value: "unread", label: "Unread" }]} /><button onClick={() => void markAllRead()} className="motion-pressable ml-auto min-h-11 rounded-full border border-line bg-white px-3 text-[13px]">Mark all read</button></div>
      {loading ? <ListSkeleton rows={3} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && !visible.length ? <EmptyState title={unreadOnly ? "No unread reminders" : "No reminders"} detail="Enable reminders when you record an obligation from a property Bills tab." /> : null}
      {visible.map((reminder) => <Disclosure key={reminder.id} title={reminder.title} detail={`${shortDate(reminder.scheduledAt)} · ${reminder.readAt?"Read":"Unread"}`}><div className="space-y-4">
        <div className="flex items-start justify-between gap-2"><div><p className="text-[13px] font-semibold">{reminder.title}</p><p className="mt-1 text-[13px] text-ink-muted">{reminder.channel} • {reminder.offsetDays === 0 ? "on due date" : `${Math.abs(reminder.offsetDays)} day${Math.abs(reminder.offsetDays) === 1 ? "" : "s"} before due`} • {reminder.timezone} at {reminder.localTime}</p></div><StatusPill tone={tone(reminder.state)}>{displayLabel(reminder.state)}</StatusPill></div>
        <p className="mt-2 text-[14px]">{reminder.body}</p>
        <p className="mt-1 text-[12px] text-ink-muted">Target {reminder.scheduledAt.slice(0, 16).replace("T", " ")} UTC • attempts {reminder.attemptCount}{reminder.failureReason ? ` • ${reminder.failureReason}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-[13px]"><Link href={reminder.deepLink} className="underline">Open source record →</Link>{reminder.readAt ? <button onClick={() => void action(reminder.id, "unread")} className="underline">Mark unread</button> : <button onClick={() => void action(reminder.id, "read")} className="underline">Mark read</button>}{!(["CANCELLED", "FAILED_TERMINAL"].includes(reminder.state)) ? <button onClick={() => void action(reminder.id, "snooze", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())} className="underline">Snooze 1 day</button> : null}{reminder.state !== "CANCELLED" ? <button onClick={() => void action(reminder.id, "dismiss")} className="text-red-700 underline">Dismiss</button> : null}</div>
      </div></Disclosure>)}
    </div>
  </div>;
}

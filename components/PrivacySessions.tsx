"use client";
import { useState } from "react";
import { Button, Surface } from "@/components/ui";

type SessionSummary = { id: string; current: boolean; createdAt: string; expiresAt: string };
export function PrivacySessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [message, setMessage] = useState("View active sign-ins without exposing session tokens or device fingerprints.");
  const [busy, setBusy] = useState(false);
  async function run(revoke = false) {
    setBusy(true); setSessions([]);
    try {
      if (revoke) {
        const result = await fetch("/api/privacy/sessions", { method: "POST" });
        if (!result.ok) throw new Error("Could not revoke other sessions. Sign in again if your session expired.");
      }
      const response = await fetch("/api/privacy/sessions", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load sessions. Sign in again if your session expired.");
      setSessions((await response.json()).data.sessions);
      setMessage(revoke ? "Other sessions revoked. Already downloaded files cannot be recalled." : "Active sessions loaded. Dates identify sign-ins, not verified devices.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Session controls unavailable."); }
    finally { setBusy(false); }
  }
  return <Surface><h2 className="font-serif text-[18px]">Active sessions</h2><p role="status" className="text-[14px]">{message}</p>
    <div className="my-2 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void run()}>View sessions</Button><Button variant="quiet" disabled={busy} onClick={() => void run(true)}>Sign out other sessions</Button></div>
    {sessions.map(session => <p className="text-[14px]" key={session.id}>{session.current ? "This session" : "Other session"} · Started {new Date(session.createdAt).toLocaleString()} · Expires {new Date(session.expiresAt).toLocaleString()}</p>)}
  </Surface>;
}

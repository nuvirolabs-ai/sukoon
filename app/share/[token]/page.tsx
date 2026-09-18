"use client";

import { useState } from "react";
import Link from "next/link";

export default function ShareInvitationPage() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const accept = async () => {
    setMessage("");
    const response = await fetch("/api/share-invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const body = await response.json() as { error?: { message?: string }; data?: unknown };
    setMessage(response.ok ? "Invitation accepted. Open Shared with me from your signed-in account." : body.error?.message || "Invitation could not be accepted.");
  };
  return <div className="mx-auto max-w-md space-y-4 pt-8 pb-6"><p className="text-[13px] tracking-widest text-ink-muted">SUKOON INVITATION</p><div className="surface bg-white p-5"><p className="text-[20px] font-medium">Sign in before accepting</p><p className="mt-2 text-[14px] text-ink-muted">Access is bound to the signed-in email, expires, and can be revoked.</p><input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste invitation token" className="mt-3 h-11 w-full rounded-xl border border-line px-3 text-[15px]" /><button onClick={() => void accept()} className="mt-2 h-11 w-full rounded-full bg-forest text-[15px] text-white">Accept invitation</button>{message ? <p role="status" className="mt-2 rounded-xl bg-[#fffaf3] p-2 text-[13px]">{message}</p> : null}</div><Link href="/" className="block text-center text-[14px] underline">Return home</Link></div>;
}

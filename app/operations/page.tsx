"use client";

import { useState } from "react";
import { Button, PageHead, Surface } from "@/components/ui";
import { OperationsContent } from "@/components/OperationsContent";

type Snapshot = {
  providers: Record<string, { status: string; environment: string }>;
  providerEvidence: string; retryPolicy: string;
  queue: { status: string; count: number }[];
  failures: { id: string; handler: string; failureReason: string; canCancel: boolean; status: string; attempts: number; maxAttempts: number }[];
};
export default function OperationsPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState("Local operator access required. No private file access is granted here.");
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true); setData(null);
    try {
      const response = await fetch("/api/operations", { cache: "no-store" });
      if (!response.ok) { setMessage(response.status === 401 ? "Sign in required." : response.status === 403 ? "Operator access denied. Hosted access requires stronger authentication." : "Operations are temporarily unavailable."); return; }
      const body = await response.json(); setData(body.data); setMessage("Snapshot loaded. Refresh to obtain current counts.");
    } catch { setMessage("Could not load operations."); } finally { setBusy(false); }
  }
  async function cancel(id: string) {
    setBusy(true);
    try { const response = await fetch("/api/operations/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "cancel" }) }); if (!response.ok) throw new Error("Cancellation denied or source changed. Refresh diagnostics."); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Cancellation unavailable."); }
    finally { setBusy(false); }
  }
  return <div><PageHead title="Operations" sub="Restricted support diagnostics" /><div className="ops-block space-y-3 pb-6">
    <Surface><p role="status">{message}</p><Button disabled={busy} onClick={() => void load()}>Refresh diagnostics</Button></Surface>
    {data && <OperationsContent />}
    {data && <><Surface><h2>Provider configuration</h2><p>{data.providerEvidence}</p>{Object.entries(data.providers).map(([key, value]) => <p key={key}>{key}: {value.status} ({value.environment})</p>)}</Surface>
      <Surface><h2>Queue counts</h2>{data.queue.length ? data.queue.map(row => <p key={row.status}>{row.status}: {row.count}</p>) : <p>No queued records.</p>}</Surface>
      <Surface><h2>Latest failure references (maximum 50)</h2><p>{data.retryPolicy}</p>{data.failures.map(row => <div key={row.id} className="break-all"><p>{row.id}: {row.handler} · {row.status}, attempt {row.attempts}/{row.maxAttempts} · {row.failureReason}</p>{row.canCancel && <Button disabled={busy} variant="quiet" onClick={() => void cancel(row.id)}>Cancel failed job</Button>}</div>)}</Surface></>}
  </div></div>;
}

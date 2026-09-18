"use client";
import { useState } from "react";
import { Button, Surface } from "@/components/ui";
export function ProcessingControl() {
  const [state, setState] = useState<{ noticeVersion: string; withdrawnAt: string | null; available: boolean } | null>(null);
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function act(withdraw = false) {
    setBusy(true);
    try {
      if (withdraw) { const response = await fetch("/api/privacy/processing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true, noticeVersion: state?.noticeVersion }) }); if (!response.ok) throw new Error("Withdrawal was not confirmed. Reload the control."); }
      const response = await fetch("/api/privacy/processing", { cache: "no-store" }); if (!response.ok) throw new Error("Processing controls unavailable."); setState((await response.json()).data); setMessage(withdraw ? "Future document intelligence stopped. Existing data has not been deleted." : "Control loaded.");
    } catch (error) { setState(null); setMessage(error instanceof Error ? error.message : "Unavailable."); } finally { setBusy(false); }
  }
  return <Surface><h2>Document intelligence</h2><p>Withdrawal stops local parsing, OCR and AI work, suppresses extracted output and cancels pending affected work. It does not recall information already sent to a provider or delete stored data. Scanning, original documents and manual classification remain separate. No live OCR or AI is enabled by this control.</p><p>No re-enable workflow is currently available.</p><p role="status">{message}</p><Button disabled={busy} variant="quiet" onClick={() => void act()}>Load processing control</Button>{state?.withdrawnAt ? <p>Withdrawn: {state.withdrawnAt}</p> : state?.available && <form onSubmit={event => { event.preventDefault(); void act(true); }}><label><input type="checkbox" required /> I confirm withdrawal of future document intelligence processing.</label><Button disabled={busy}>Withdraw document intelligence</Button></form>}</Surface>;
}

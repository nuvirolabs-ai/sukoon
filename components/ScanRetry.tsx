"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";

export function ScanRetry({ documentId }: { documentId: string }) {
  const key = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function retry() {
    setBusy(true);
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch(`/api/documents/${documentId}/process`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: "scan", retryKey: key.current }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Scan retry unavailable.");
      setMessage("Scan retry recorded for the same bytes. Access remains blocked until the worker records a permitted verdict. Refresh after processing.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Retry unavailable."); }
    finally { setBusy(false); }
  }
  return <div><Button variant="quiet" disabled={busy} onClick={() => void retry()}>Retry unavailable scan</Button><p role="status" className="text-[13px]">{message}</p></div>;
}

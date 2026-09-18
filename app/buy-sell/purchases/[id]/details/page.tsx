"use client";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { ErrorState, PageHead } from "@/components/ui";
import { PurchaseSkeleton } from "@/components/motion/Skeleton";
import { useToast } from "@/components/motion/Toast";
import { CandidateForm, PurchaseIdentity, findCandidate, usePurchaseWorkspaces } from "@/components/PurchaseWorkspace";

export default function PurchaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { rows, error, setError, loading, load } = usePurchaseWorkspaces();
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const request = useRef<{ payload: string; key: string } | null>(null);
  const found = findCandidate(rows, id);

  async function command(payload: Record<string, unknown>) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const serialized = JSON.stringify(payload);
      if (!request.current || request.current.payload !== serialized) request.current = { payload: serialized, key: crypto.randomUUID() };
      const response = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestKey: request.current.key }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not save.");
      request.current = null;
      await load();
      notify("Saved to workspace");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Save unavailable.";
      setError(message);
      notify(message, "error");
    } finally { setBusy(false); }
  }

  if (loading) return <div><PageHead title="Details" backHref={`/buy-sell/purchases/${id}`} backLabel="Overview" /><PurchaseSkeleton /></div>;
  if (!found) return <div><PageHead title="Details" backHref="/buy-sell/purchases" backLabel="Purchases" /><ErrorState message={error || "This purchase workspace is no longer available."} /></div>;
  const { candidate } = found;

  return (
    <div>
      <PageHead title="Property details" backHref={`/buy-sell/purchases/${candidate.id}`} backLabel="Overview" />
      <div className="space-y-4 pb-8">
        <PurchaseIdentity candidate={candidate} />
        {error ? <p role="alert">{error}</p> : null}
        <CandidateForm key={candidate.version} busy={busy} candidate={candidate} save={(input) => command({ ...input, action: "update-candidate", candidateId: candidate.id, version: candidate.version })} />
      </div>
    </div>
  );
}

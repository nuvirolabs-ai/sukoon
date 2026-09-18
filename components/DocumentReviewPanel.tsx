"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";
import { useToast } from "@/components/motion/Toast";
import type { AppState, PropertyDoc } from "@/lib/types";
import { DOCUMENT_TAXONOMY } from "@/lib/types";
import { displayLabel } from "@/lib/ui-content";

type ReviewState = {
  aiRuns: Array<{ id: string; status: string; method: string; providerEnvironment: string; proposals: Array<{ id: string; fieldName: string; proposedValue: unknown; state: string; sourcePage?: number | null; sourceChunk?: string | null; extractionMethod: string }> }>;
};

export function ManualDocumentReview({ document, onConfirmed }: { document: { id: string; type: string; version?: number }; onConfirmed?: () => void }) {
  const { replace } = useStore();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Keep an unresolved upload distinct from an owner deliberately choosing
  // the explicit Other document type.
  const [category, setCategory] = useState(document.type === "Other" ? "" : document.type);
  async function confirm() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/documents/${document.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "manual_confirm", category, documentVersion: document.version }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Review could not be saved.");
      const stateResponse = await fetch("/api/state", { cache: "no-store" });
      const stateBody = await stateResponse.json() as { data?: { state: AppState; version: number } };
      if (stateResponse.ok && stateBody.data) replace(stateBody.data.state, stateBody.data.version);
      onConfirmed?.();
      notify("Document reviewed");
    } catch (e) { const message = e instanceof Error ? e.message : "Review failed."; setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2"><label className="block text-[13px] text-ink-muted">Review category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-white px-3 text-[16px]"><option value="">Not sure yet — choose a category</option>{DOCUMENT_TAXONOMY.map((item) => <option key={item} value={item}>{item === "Other" ? "Other document type" : displayLabel(item)}</option>)}</select></label>{!category ? <p className="text-[13px] text-ink-muted">Choose a category before marking this paper reviewed.</p> : null}<button disabled={busy || !category} onClick={() => void confirm()} className="motion-pressable text-[13px] underline">Confirm this category</button>{error ? <p role="alert" className="text-[13px] text-red-700">{error}</p> : null}</div>;
}

export function DocumentReview({ document, propertyId }: { document: PropertyDoc; propertyId: string }) {
  const { s, replace } = useStore();
  const property = s.properties.find((item) => item.id === propertyId);
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [busy, setBusy] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const load = async () => {
    setOpen(true); setError("");
    try {
      const response = await fetch(`/api/documents/${document.id}/review`, { cache: "no-store" });
      const body = await response.json() as { data?: ReviewState; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Review could not be loaded.");
      setReview(body.data);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Review could not be loaded."); }
  };

  const act = async (proposalId: string, action: "accept" | "edit" | "reject") => {
    setBusy(proposalId); setError("");
    try {
      const response = await fetch(`/api/documents/${document.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proposalId, action, value: drafts[proposalId], propertyVersion: property?.version }) });
      const body = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message || "Review action could not be saved.");
      const stateResponse = await fetch("/api/state", { cache: "no-store" });
      const stateBody = await stateResponse.json() as { data?: { state: typeof s; version: number } };
      if (stateResponse.ok && stateBody.data) replace(stateBody.data.state, stateBody.data.version);
      await load();
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Review action could not be saved."); }
    finally { setBusy(""); }
  };

  if (!open) return <button onClick={() => void load()} className="text-[13px] underline">Review extraction</button>;
  const proposals = review?.aiRuns.flatMap((run) => run.proposals.filter((proposal) => proposal.state === "proposed")) ?? [];
  return <div className="mt-2 w-full rounded-xl bg-white p-2 text-left"><div className="flex items-center justify-between gap-2"><p className="text-[13px] font-semibold">Source review</p><button onClick={() => setOpen(false)} className="text-[13px] underline">Close</button></div>{error ? <p className="mt-1 text-[13px] text-red-700">{error}</p> : null}{!review ? <p className="mt-1 text-[13px] text-ink-muted">Loading source-backed proposals…</p> : null}{review && !proposals.length ? <p className="mt-1 text-[13px] text-ink-muted">No pending proposals. AI output is never treated as a verified fact.</p> : null}{proposals.map((proposal) => <div key={proposal.id} className="mt-2 rounded-lg border border-line bg-white p-2"><p className="text-[14px] font-semibold">{proposal.fieldName}</p><p className="text-[13px] text-ink-muted">Document says: {String(proposal.proposedValue)}</p><p className="text-[13px] text-ink-muted">Source: {document.name}{proposal.sourcePage ? ` · page ${proposal.sourcePage}` : ""}</p>{proposal.sourceChunk ? <p className="mt-1 rounded-md bg-[#f3f0e8] p-1 text-[12px] text-ink-muted">Excerpt: {proposal.sourceChunk}</p> : null}<input className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-[14px]" placeholder="Edit before accepting" value={drafts[proposal.id] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [proposal.id]: event.target.value }))} /><div className="mt-1 flex gap-1"><Button variant="secondary" busy={busy === proposal.id} onClick={() => void act(proposal.id, "accept")}>Accept</Button><Button variant="secondary" busy={busy === proposal.id} onClick={() => void act(proposal.id, "edit")}>Edit + accept</Button><Button variant="quiet" busy={busy === proposal.id} onClick={() => void act(proposal.id, "reject")}>Reject</Button></div></div>)}</div>;
}

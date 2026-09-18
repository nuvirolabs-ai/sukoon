"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { displayLabel } from "@/components/consumer";
import { PURCHASE_STAGES } from "@/lib/purchase-stages";
import { purchaseMeta, rupeesInput, splitPurchaseName, type PurchaseCandidate } from "@/lib/purchase-presentation";

export function usePurchaseWorkspaces() {
  const [rows, setRows] = useState<Array<{ id: string; name: string; candidates: PurchaseCandidate[] }>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load(signal?: AbortSignal) {
    const response = await fetch("/api/purchases", { cache: "no-store", signal });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message || "Purchase workspaces unavailable.");
    if (!signal?.aborted) setRows(body.data);
    return body.data as Array<{ id: string; name: string; candidates: PurchaseCandidate[] }>;
  }
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/purchases", { cache: "no-store", signal: controller.signal }).then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "Purchase workspaces unavailable.");
        if (!controller.signal.aborted) setRows(body.data);
      }).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Purchase workspaces unavailable."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, []);
  return { rows, error, setError, loading, load };
}

export function findCandidate(workspaces: Array<{ id: string; name: string; candidates: PurchaseCandidate[] }>, id: string) {
  for (const workspace of workspaces) {
    const candidate = workspace.candidates.find((item) => item.id === id);
    if (candidate) return { workspace, candidate };
  }
  return null;
}

export function CandidateForm({ candidate, busy, save }: { candidate?: PurchaseCandidate; busy: boolean; save: (input: Record<string, unknown>) => Promise<void> }) {
  const defaults: Record<string, string> = {
    name: candidate?.name ?? "",
    propertyType: candidate?.propertyType ?? "",
    location: candidate?.location ?? "",
    areaValue: candidate?.areaValue ?? "",
    areaUnit: candidate?.areaUnit ?? "",
    askingPrice: rupeesInput(candidate?.askingPricePaise ?? null),
    budget: rupeesInput(candidate?.budgetPaise ?? null),
    source: candidate?.source ?? "",
    notes: candidate?.notes ?? "",
  };
  return (
    <form className="space-y-2 mt-3" onSubmit={(event) => { event.preventDefault(); void save(Object.fromEntries(new FormData(event.currentTarget))); }}>
      {[["name", "Candidate name"], ["propertyType", "Property type (optional)"], ["location", "Location (optional)"], ["areaValue", "Known area (optional)"], ["areaUnit", "Original unit: sqft, sqm, acre or hectare"], ["askingPrice", "Asking price ₹ (optional)"], ["budget", "Buyer budget ₹ (optional)"], ["source", "Source or seller reference (no access granted)"], ["notes", "Buyer notes (optional)"]].map(([name, label]) => (
        <label className="block text-sm" key={name}>{label}<input className="block border rounded p-2 w-full" name={name} defaultValue={defaults[name!]} required={name === "name"} maxLength={name === "notes" ? 2000 : 500} /></label>
      ))}
      <label className="block text-sm">Personal purchase stage
        <select className="block border rounded p-2" name="stage" defaultValue={candidate?.stage ?? "CONSIDERING"}>
          {PURCHASE_STAGES.map((stage) => <option key={stage} value={stage}>{displayLabel(stage)}</option>)}
        </select>
      </label>
      <Button busy={busy} type="submit">{candidate ? "Save candidate correction" : "Save candidate"}</Button>
    </form>
  );
}

export function PurchaseIdentity({ candidate }: { candidate: PurchaseCandidate }) {
  const { subtitle } = splitPurchaseName(candidate.name);
  return (
    <>
      {subtitle ? <p className="text-[17px] font-medium -mt-3 mb-1">{subtitle}</p> : null}
      <p className="text-[15px] text-ink-muted">{purchaseMeta(candidate)}</p>
    </>
  );
}

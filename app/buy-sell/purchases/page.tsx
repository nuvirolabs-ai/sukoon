"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, EmptyState, ErrorState, PageHead } from "@/components/ui";
import { Disclosure, GroupedList } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { PurchaseSkeleton } from "@/components/motion/Skeleton";
import { useToast } from "@/components/motion/Toast";
import { askingCopy, partitionPurchaseRows, purchaseComparison, purchaseMeta, splitPurchaseName, stageCopy, type PurchaseRow } from "@/lib/purchase-presentation";
import { usePurchaseWorkspaces } from "@/components/PurchaseWorkspace";

export default function PurchasesPage() {
  const { rows, error, setError, loading, load } = usePurchaseWorkspaces();
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const request = useRef<{ payload: string; key: string } | null>(null);

  async function command(payload: Record<string, unknown>) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const serialized = JSON.stringify(payload);
      if (!request.current || request.current.payload !== serialized) request.current = { payload: serialized, key: crypto.randomUUID() };
      const response = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestKey: request.current.key }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not save. Reload before retrying a version conflict.");
      request.current = null;
      await load();
      notify("Saved to workspace");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Save unavailable.";
      setError(message);
      notify(message, "error");
    } finally { setBusy(false); }
  }

  if (loading) return <div><PageHead title="Purchases" sub="A little closer to your next property" /><PurchaseSkeleton /></div>;
  const groups = partitionPurchaseRows(rows);

  return (
    <div>
      <PageHead title="Purchases" backHref="/buy-sell" backLabel="Buy / Sell" />
      <div className="pb-8 space-y-6">
        {error ? <ErrorState message={error} /> : null}
        {!groups.active.length && !groups.archived.length && !groups.practice.length ? <EmptyState title="No purchase workspaces yet" detail="Track a prospective property privately. Progress here does not establish ownership." /> : null}
        {groups.active.length ? (
          <section>
            <GroupedList>
              <AnimatedList stagger={false}>
                {groups.active.map((candidate) => <PurchaseJourneyRow key={candidate.id} candidate={candidate} />)}
              </AnimatedList>
            </GroupedList>
          </section>
        ) : null}
        {groups.archived.length ? (
          <section>
            <h2 className="section-heading"><span>Not proceeding</span></h2>
            <GroupedList>
              {groups.archived.map((candidate) => <PurchaseJourneyRow key={candidate.id} candidate={candidate} />)}
            </GroupedList>
          </section>
        ) : null}
        {groups.practice.length ? (
          <section>
            <h2 className="section-heading"><span>Other workspaces</span></h2>
            <GroupedList>
              {groups.practice.map((candidate) => <PurchaseJourneyRow key={candidate.id} candidate={candidate} />)}
            </GroupedList>
          </section>
        ) : null}
        {groups.active.length > 1 ? (
          <section>
            <h2 className="section-heading"><span>Compare</span></h2>
            <GroupedList>
              {purchaseComparison(groups.active).map((row) => (
                <div key={row.id} className="list-row">
                  <span className="row-copy">
                    <span className="row-title">{row.name}</span>
                    <span className="row-detail">{row.situation} · {row.asking} · {row.area} · {row.location}</span>
                  </span>
                </div>
              ))}
            </GroupedList>
            <p className="text-sm text-ink-muted">Missing values stay unknown. Areas are shown with their recorded unit and are not treated as equivalent.</p>
          </section>
        ) : null}
        <Disclosure title="New purchase workspace" detail="Add a property you’re considering">
          <p className="text-sm">Track a prospective property privately. Your progress does not establish ownership or legal clearance.</p>
          <form onSubmit={(event) => { event.preventDefault(); void command({ action: "create-workspace", name: new FormData(event.currentTarget).get("name") }); }} className="mt-3 space-y-2">
            <label className="block text-sm">Workspace name<input className="block border rounded p-2 w-full" name="name" required maxLength={200} /></label>
            <Button busy={busy} type="submit">Create private workspace</Button>
          </form>
        </Disclosure>
      </div>
    </div>
  );
}

function PurchaseJourneyRow({ candidate }: { candidate: PurchaseRow }) {
  const [summary, setSummary] = useState("Documents and questions");
  const { title, subtitle } = splitPurchaseName(candidate.name);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/purchases/evidence?candidateId=${candidate.id}`, { cache: "no-store" }).then(async (evidence) => {
      const body = await evidence.json();
      if (!evidence.ok) return;
      const entries = body.data as Array<{ kind: string; state: string }>;
      const docs = entries.filter((entry) => entry.kind === "DOCUMENT_REQUEST");
      const received = docs.filter((entry) => ["RECEIVED", "USER_REVIEWED"].includes(entry.state)).length;
      const open = entries.filter((entry) => entry.kind === "QUESTION" && entry.state !== "RESOLVED").length;
      if (!cancelled) setSummary(`${received} of ${docs.length} documents · ${open} open question${open === 1 ? "" : "s"}`);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [candidate.id]);
  return (
    <Link className="list-row route-continuity" href={`/buy-sell/purchases/${candidate.id}`} aria-label={`${candidate.name}. ${summary}`}>
      <span className="row-copy">
        <span className="row-title" title={title}>{title}</span>
        {subtitle ? <span className="row-detail">{subtitle}</span> : null}
        <span className="row-detail">{purchaseMeta(candidate)}</span>
        <span className="row-detail">{askingCopy(candidate)} · {stageCopy(candidate.transactionPhase || candidate.stage)}</span>
        <span className="row-detail">{summary}</span>
      </span>
      <ChevronRight size={18} aria-hidden="true" />
    </Link>
  );
}

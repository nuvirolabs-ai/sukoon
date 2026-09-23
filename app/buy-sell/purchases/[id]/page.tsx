"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ErrorState, PageHead } from "@/components/ui";
import { Disclosure, GroupedList, ListRow, Metric, displayLabel } from "@/components/consumer";
import { PurchaseSkeleton } from "@/components/motion/Skeleton";
import { useToast } from "@/components/motion/Toast";
import { inr } from "@/lib/utils";
import { purchaseMeta, splitPurchaseName } from "@/lib/purchase-presentation";
import { CandidateForm, findCandidate, usePurchaseWorkspaces } from "@/components/PurchaseWorkspace";
import { BuyerStory } from "@/components/TransactionStory";

type Evidence = { id: string; body: string; kind: string; state: string };

export default function PurchaseOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { rows, error, setError, loading, load } = usePurchaseWorkspaces();
  const [busy, setBusy] = useState(false);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const { notify } = useToast();
  const request = useRef<{ payload: string; key: string } | null>(null);
  const found = findCandidate(rows, id);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetch(`/api/purchases/evidence?candidateId=${id}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Evidence unavailable.");
      setEvidence(body.data);
    }).catch((reason) => { if (reason.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Evidence unavailable."); });
    return () => controller.abort();
  }, [id, setError]);

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

  if (loading) return <div><PageHead title="Purchase" backHref="/buy-sell/purchases" backLabel="Purchases" /><PurchaseSkeleton /></div>;
  if (error && !found) return <div><PageHead title="Purchase" backHref="/buy-sell/purchases" backLabel="Purchases" /><ErrorState message={error} /></div>;
  if (!found) return <div><PageHead title="Purchase" backHref="/buy-sell/purchases" backLabel="Purchases" /><ErrorState message="This purchase workspace is no longer available." /></div>;
  const { candidate } = found;
  const { title, subtitle } = splitPurchaseName(candidate.name);
  const docs = evidence.filter((entry) => entry.kind === "DOCUMENT_REQUEST");
  const received = docs.filter((entry) => ["RECEIVED", "USER_REVIEWED"].includes(entry.state)).length;
  const questions = evidence.filter((entry) => entry.kind === "QUESTION");
  const openQuestions = questions.filter((entry) => entry.state !== "RESOLVED");
  const detailsComplete = Boolean(candidate.name && candidate.propertyType && candidate.location && candidate.askingPricePaise);
  const nextDoc = docs.find((entry) => !["RECEIVED", "USER_REVIEWED"].includes(entry.state));
  const nextQuestion = openQuestions.find((entry) => entry.state === "OPEN") || openQuestions[0];
  const base = `/buy-sell/purchases/${candidate.id}`;

  return (
    <div>
      <PageHead title={title} sub={subtitle || undefined} backHref="/buy-sell/purchases" backLabel="Purchases" />
      <div className="space-y-6 pb-8">
        {error ? <p role="alert">{error}</p> : null}
        <p className="text-[15px] text-ink-muted">{purchaseMeta(candidate)}</p>
        <div className="metric-group">
          <Metric label="Asking" value={candidate.askingPricePaise ? inr(Number(candidate.askingPricePaise) / 100) : "Not entered"} />
          <Metric label="Your target" value={candidate.budgetPaise ? inr(Number(candidate.budgetPaise) / 100) : "Not entered"} />
        </div>
        <p className="text-[15px]">{displayLabel(candidate.transactionPhase || candidate.stage)}</p>
        <BuyerStory candidateId={candidate.id} />
        <section>
          <h2 className="section-heading">Progress</h2>
          <GroupedList>
            <ListRow title="Details" detail={detailsComplete ? "Complete" : "Needs details"} href={`${base}/details`} />
            <ListRow title="Documents" detail={`${received} / ${docs.length}`} href={`${base}/documents`} />
            <ListRow title="Questions" detail={`${openQuestions.length} open`} href={`${base}/questions`} />
            <ListRow title="Decision" detail={candidate.stage === "NOT_PROCEEDING" ? displayLabel(candidate.stage) : "Pending"} href={`${base}/details`} />
          </GroupedList>
        </section>
        {(nextDoc || nextQuestion) ? (
          <section>
            <h2 className="section-heading">Next</h2>
            <GroupedList>
              {nextDoc ? <ListRow title={nextDoc.body} detail={displayLabel(nextDoc.state)} href={`${base}/documents`} /> : null}
              {nextQuestion ? <ListRow title={nextQuestion.body} detail={displayLabel(nextQuestion.state)} href={`${base}/questions`} /> : null}
            </GroupedList>
          </section>
        ) : null}
        <a className="primary-disclosure motion-pressable" href={`${base}/documents`}>Continue due diligence <span aria-hidden="true">→</span></a>
        <GroupedList>
          <ListRow title="Documents" href={`${base}/documents`} />
          <ListRow title="Questions" href={`${base}/questions`} />
          <ListRow title="Activity" href={`${base}/activity`} />
          <ListRow title="Property details" href={`${base}/details`} />
        </GroupedList>
        <details>
          <summary>Workspace options</summary>
          <Disclosure title="Add another property" detail="Same private workspace">
            <CandidateForm busy={busy} save={(input) => command({ ...input, action: "add-candidate", purchaseWorkspaceId: found.workspace.id })} />
          </Disclosure>
        </details>
      </div>
    </div>
  );
}

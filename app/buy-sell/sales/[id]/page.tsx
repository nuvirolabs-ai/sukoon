"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GroupedList, ListRow, Metric, displayLabel, formatPaiseCompact } from "@/components/consumer";
import { Button, ErrorState, PageHead } from "@/components/ui";

type Prospect = {
  id: string;
  name: string;
  source: string | null;
  status: string;
  privateNotes: string;
  offers: Array<{ amountPaise: string; offeredOn: string; authorSource: string; status: string }>;
  nextVisit: string | null;
};
type Story = {
  sale: { id: string; propertyName: string; askingPricePaise: string | null; phase: string; possessionTargetDate: string | null };
  prospects: Prospect[];
  needsAttention: Array<{ id: string; title: string; href: string; dueDate: string | null }>;
  publishedListing: false;
};

export default function SalePage() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/sales?id=${id}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message || "Sale unavailable.");
    setStory(body.data as Story);
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/sales?id=${id}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Sale unavailable.");
      setStory(body.data as Story);
    }).catch((reason) => { if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Sale unavailable."); });
    return () => controller.abort();
  }, [id]);

  async function command(payload: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestKey: crypto.randomUUID() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not save.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save.");
    } finally { setBusy(false); }
  }

  if (!story) return <div><PageHead title="Sale" backHref="/buy-sell/sales" backLabel="Selling" />{error ? <ErrorState message={error} /> : null}</div>;
  const attention = story.needsAttention.slice(0, 3);
  return (
    <div>
      <PageHead title={story.sale.propertyName} backHref="/buy-sell/sales" backLabel="Selling" />
      <div className="space-y-6 pb-8">
        {error ? <p role="alert">{error}</p> : null}
        <p className="text-[15px]">{displayLabel(story.sale.phase)} · Private sale · No public listing</p>
        <div className="metric-group">
          <Metric label="Asking" value={formatPaiseCompact(story.sale.askingPricePaise) ?? "Unknown"} />
          <Metric label="Expected timing" value={story.sale.possessionTargetDate ?? "Not entered"} />
        </div>
        <section>
          <h2 className="section-heading">What needs you</h2>
          {attention.length ? <GroupedList>{attention.map((item) => <ListRow key={item.id} href={item.href} title={item.title} detail={item.dueDate ?? "No date"} />)}</GroupedList> : <p className="text-[15px] text-ink-muted">Nothing in the current records needs a follow-up.</p>}
        </section>
        {story.prospects.map((prospect) => (
          <section key={prospect.id}>
            <h2 className="section-heading">{prospect.name}</h2>
            <p className="text-[15px] text-ink-muted">{prospect.source || "Source not entered"} · {displayLabel(prospect.status)}</p>
            {prospect.privateNotes ? <p className="text-[15px]">Your note: {prospect.privateNotes}</p> : null}
            <p className="text-[15px]">Next visit: {prospect.nextVisit ?? "None planned"}</p>
            {prospect.offers.length ? (
              <GroupedList>
                {prospect.offers.map((offer, index) => <ListRow key={`${prospect.id}-${index}`} title={formatPaiseCompact(offer.amountPaise) ?? offer.amountPaise} detail={`${offer.offeredOn} · ${displayLabel(offer.authorSource)}`} />)}
              </GroupedList>
            ) : <p className="text-[15px]">No offer recorded for this buyer.</p>}
            <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void command({ action: "record-offer", prospectId: prospect.id, amountRupees: form.get("amount"), authorSource: "OWNER_REPORTED_BUYER", offeredOn: form.get("date"), status: "RECORDED", terms: { source: "Owner recorded this buyer's offer" } }); }}>
              <label className="block text-sm">Record this buyer&apos;s offer in rupees<input className="block w-full rounded border p-2" name="amount" required inputMode="decimal" /></label>
              <label className="block text-sm">Date<input className="block w-full rounded border p-2" name="date" type="date" required /></label>
              <Button busy={busy} type="submit">Save offer</Button>
            </form>
          </section>
        ))}
        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void command({ action: "add-prospect", saleWorkspaceId: story.sale.id, name: form.get("name"), source: form.get("source"), privateNotes: form.get("notes") }); }}>
          <h2 className="section-heading">Add an interested buyer</h2>
          <label className="block text-sm">Name<input className="block w-full rounded border p-2" name="name" required maxLength={200} /></label>
          <label className="block text-sm">Source<input className="block w-full rounded border p-2" name="source" maxLength={200} /></label>
          <label className="block text-sm">Private note<input className="block w-full rounded border p-2" name="notes" maxLength={500} /></label>
          <Button busy={busy} type="submit">Save buyer</Button>
          <p className="text-sm text-ink-muted">Adding a name does not give that person access. Each buyer stays in a separate record.</p>
        </form>
      </div>
    </div>
  );
}

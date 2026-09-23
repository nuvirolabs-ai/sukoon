"use client";
import { useCallback, useEffect, useState } from "react";
import { GroupedList, ListRow, Metric, displayLabel, formatPaiseCompact } from "@/components/consumer";
import { Button } from "@/components/ui";

const PHASES = ["CONSIDERING", "INFORMATION_GATHERING", "REVIEWING", "NEGOTIATING", "TERMS_RECORDED", "PRE_COMPLETION", "HANDOVER", "COMPLETED_RECORDED"] as const;

type Guidance = { id: string; title: string; href: string; dueDate: string | null };
type Story = {
  candidate: { id: string; name: string; phase: string; askingPricePaise: string | null; linkedPropertyId: string | null };
  whereWeAre: string;
  needsAttention: Guidance[];
  known: Array<{ id: string; kind: string; body: string; state: string; dueDate: string | null; events: Array<{ action: string; source: string; note: string }> }>;
  commercial: { askingPricePaise: string | null; latestBuyerOfferPaise: string | null; reportedCounterPaise: string | null; offers: Array<{ id: string; amountPaise: string; offeredOn: string; authorSource: string; status: string }> };
  nextDate: string | null;
  money: { netPricePaidPaise: string; plannedPaise: string; records: number };
  handover: { plannedDate: string | null; status: string; items: Array<{ label: string; disposition: string }> } | null;
};

function money(paise: string | null | undefined) {
  return formatPaiseCompact(paise) ?? "Unknown";
}

function evidenceCopy(entry: Story["known"][number]) {
  if (entry.kind === "DOCUMENT_REQUEST" && entry.state === "OPEN") return "Requested; not yet available here";
  if (entry.kind === "QUESTION" && entry.state === "OPEN") return "Awaiting a recorded response";
  if (entry.kind === "QUESTION" && entry.state === "ANSWERED") return "You recorded a response";
  if (entry.kind === "QUESTION" && entry.state === "RESOLVED") return "Recorded response marked resolved";
  return displayLabel(entry.state);
}

export function BuyerStory({ candidateId }: { candidateId: string }) {
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    return fetch(`/api/transactions?candidateId=${candidateId}`, { cache: "no-store" }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Transaction record unavailable.");
      setStory(body.data as Story);
    });
  }, [candidateId]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/transactions?candidateId=${candidateId}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Transaction record unavailable.");
      setStory(body.data as Story);
    }).catch((reason) => { if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Transaction record unavailable."); });
    return () => controller.abort();
  }, [candidateId]);

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

  if (!story) return error ? <p role="alert">{error}</p> : null;
  const phaseIndex = PHASES.indexOf(story.whereWeAre as typeof PHASES[number]);
  const price = story.commercial.askingPricePaise;
  const paid = Number(story.money.netPricePaidPaise);
  const target = price ? Number(price) : 0;
  const ratio = target > 0 ? Math.max(0, Math.min(100, Math.round((paid / target) * 100))) : 0;
  const attention = story.needsAttention.slice(0, 3);

  return (
    <div className="space-y-6">
      {error ? <p role="alert">{error}</p> : null}
      <section>
        <h2 className="section-heading">Where we are</h2>
        <ol className="space-y-1 text-[15px]">
          {PHASES.map((phase, index) => (
            <li key={phase} aria-current={phase === story.whereWeAre ? "step" : undefined}>
              {index < phaseIndex ? "Done · " : phase === story.whereWeAre ? "Now · " : "Later · "}{displayLabel(phase)}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="section-heading">What needs you</h2>
        {attention.length ? (
          <GroupedList>
            {attention.map((item) => <ListRow key={item.id} href={item.href} title={item.title} detail={item.dueDate ?? "No date"} />)}
          </GroupedList>
        ) : <p className="text-[15px] text-ink-muted">Nothing in the current records needs a follow-up.</p>}
      </section>
      <section>
        <h2 className="section-heading">What we know</h2>
        <GroupedList>
          {story.known.filter((entry) => entry.kind !== "HISTORY").map((entry) => (
            <ListRow key={entry.id} title={entry.body} detail={evidenceCopy(entry)} href={`/buy-sell/purchases/${candidateId}/${entry.kind === "QUESTION" ? "questions" : "documents"}`} />
          ))}
        </GroupedList>
      </section>
      <section>
        <h2 className="section-heading">Commercial position</h2>
        <div className="metric-group">
          <Metric label="Asking" value={money(story.commercial.askingPricePaise)} />
          <Metric label="Your latest offer" value={money(story.commercial.latestBuyerOfferPaise)} />
          <Metric label="Reported counter" value={money(story.commercial.reportedCounterPaise)} />
        </div>
        <p className="mt-3 text-[15px]">Recorded price payments {money(story.money.netPricePaidPaise)} of {money(price)}. This is not a bank confirmation.</p>
        <div className="mt-2 h-2 bg-black/10" role="img" aria-label={`${ratio} percent of the asking price is recorded as paid`}>
          <div className="h-2 bg-ink" style={{ width: `${ratio}%` }} />
        </div>
        {story.commercial.offers.length ? (
          <GroupedList>
            {story.commercial.offers.map((offer) => <ListRow key={offer.id} title={money(offer.amountPaise)} detail={`${offer.offeredOn} · ${displayLabel(offer.authorSource)} · ${displayLabel(offer.status)}`} />)}
          </GroupedList>
        ) : null}
      </section>
      <section>
        <h2 className="section-heading">Next date</h2>
        <p className="text-[15px]">{story.nextDate ?? story.handover?.plannedDate ?? "No visit or handover date is recorded."}</p>
      </section>
      <details>
        <summary>Record an offer</summary>
        <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void command({ action: "record-offer", candidateId, amountRupees: form.get("amount"), authorSource: form.get("source"), offeredOn: form.get("date"), status: "RECORDED", terms: { note: "Owner-entered offer" } }); }}>
          <label className="block text-sm">Amount in rupees<input className="block w-full rounded border p-2" name="amount" required inputMode="decimal" /></label>
          <label className="block text-sm">Source<select className="block w-full rounded border p-2" name="source" defaultValue="OWNER_ENTERED"><option value="OWNER_ENTERED">Entered by you</option><option value="OWNER_REPORTED_SELLER">You recorded the seller&apos;s figure</option></select></label>
          <label className="block text-sm">Date<input className="block w-full rounded border p-2" name="date" type="date" required /></label>
          <Button busy={busy} type="submit">Save offer</Button>
        </form>
      </details>
      <details>
        <summary>Add a visit</summary>
        <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void command({ action: "add-visit", candidateId, startsOn: form.get("date"), contactName: form.get("contact"), notes: "Saved privately. No invitation was sent." }); }}>
          <label className="block text-sm">Date<input className="block w-full rounded border p-2" name="date" type="date" required /></label>
          <label className="block text-sm">Contact<input className="block w-full rounded border p-2" name="contact" maxLength={200} /></label>
          <Button busy={busy} type="submit">Save visit</Button>
        </form>
      </details>
      <details>
        <summary>Financing note</summary>
        <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void command({ action: "set-financing", candidateId, status: form.get("status"), sourceOfFunds: form.get("source"), requestedRupees: form.get("amount") }); }}>
          <label className="block text-sm">Status<select className="block w-full rounded border p-2" name="status" defaultValue="EXPLORING"><option value="EXPLORING">Exploring</option><option value="APPLICATION_RECORDED">Application recorded</option><option value="SANCTION_REPORTED">Sanction reported</option></select></label>
          <label className="block text-sm">Source of funds<input className="block w-full rounded border p-2" name="source" maxLength={200} /></label>
          <label className="block text-sm">Requested rupees<input className="block w-full rounded border p-2" name="amount" inputMode="decimal" /></label>
          <Button busy={busy} type="submit">Save financing</Button>
          <p className="text-sm text-ink-muted">Saving this does not record a payment or a lender decision.</p>
        </form>
      </details>
      <details>
        <summary>Record a payment</summary>
        <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void command({ action: "record-money", candidateId, amountRupees: form.get("amount"), kind: form.get("kind"), allocation: "PRICE", occurredOn: form.get("date"), source: "OWNER_REPORTED", note: "Self-reported. Not a bank confirmation." }); }}>
          <label className="block text-sm">Amount in rupees<input className="block w-full rounded border p-2" name="amount" required inputMode="decimal" /></label>
          <label className="block text-sm">Kind<select className="block w-full rounded border p-2" name="kind" defaultValue="POSTED"><option value="POSTED">Recorded as paid</option><option value="REVERSAL">Reversal</option><option value="REFUND">Refund</option></select></label>
          <label className="block text-sm">Date<input className="block w-full rounded border p-2" name="date" type="date" required /></label>
          <Button busy={busy} type="submit">Save payment record</Button>
        </form>
      </details>
      {(story.whereWeAre === "HANDOVER" || story.whereWeAre === "COMPLETED_RECORDED") && !story.candidate.linkedPropertyId ? (
        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (form.get("confirm") !== "yes") { setError("Confirm before creating a Passport."); return; } void command({ action: "link-passport", candidateId, confirmed: true }); }}>
          <label className="block text-sm"><input name="confirm" type="checkbox" value="yes" /> Create an owner-asserted Passport from this purchase. This does not copy documents.</label>
          <Button busy={busy} type="submit">Add to Properties</Button>
        </form>
      ) : null}
    </div>
  );
}

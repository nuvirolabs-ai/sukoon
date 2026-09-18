"use client";

import { Disclosure, GroupedList, ListRow, displayLabel, presentDate } from "@/components/consumer";
import { useEffect, useState, useRef } from "react";
import { Button, EmptyState, ErrorState, HealthRing, Skeleton, StatusPill } from "@/components/ui";
import { ListSkeleton } from "@/components/motion/Skeleton";
import { AnimatedSegment } from "@/components/motion/AnimatedSegment";
import { useToast } from "@/components/motion/Toast";
import { useStore } from "@/components/StoreProvider";
import { inr, todayISO } from "@/lib/utils";

type Occurrence = { id: string; cycleKey: string; dueDate: string; amountPaise: string | null; amount: number | null; currency: string; status: string; source: string; version: number };
type ReceiptDoc = { id: string; name: string; version?: number; versions?: Array<{ id: string; version: number }> };
type Obligation = { id: string; propertyId: string; type: string; label: string; direction: string; amountPaise: string | null; amount: number | null; currency: string; dueDate: string; timezone: string; recurrenceType: string; recurrenceDay: number | null; source: string; notes: string | null; reminderConfig: unknown; active: boolean; version: number; occurrences?: Occurrence[] };

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" { return status === "COMPLETED" ? "success" : status === "OVERDUE" ? "danger" : status === "OPEN" ? "warning" : "neutral"; }

export function ObligationsPanel({ propertyId }: { propertyId: string }) {
  const [view, setView] = useState<"upcoming" | "overdue" | "completed" | "all">("upcoming");
  const [items, setItems] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/obligations?propertyId=${encodeURIComponent(propertyId)}&view=${view}`, { cache: "no-store" });
      const body = await response.json() as { data?: { obligations: Obligation[] }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Obligations could not be loaded.");
      setItems(body.data.obligations);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Obligations could not be loaded."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/obligations?propertyId=${encodeURIComponent(propertyId)}&view=${view}`, { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as { data?: { obligations: Obligation[] }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Obligations could not be loaded.");
      if (!cancelled) { setItems(body.data.obligations); setLoading(false); }
    }).catch((reason: unknown) => { if (!cancelled) { setError(reason instanceof Error ? reason.message : "Obligations could not be loaded."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [propertyId, view, refreshKey]);

  return <div className="space-y-3">
    <Disclosure title="Add obligation" detail="Amount, due date and reminders"><CreateObligation propertyId={propertyId} onCreated={() => setRefreshKey((value) => value + 1)} /></Disclosure>
    <AnimatedSegment label="Obligation views" value={view} onChange={(v) => setView(v as typeof view)} options={["upcoming", "overdue", "completed", "all"].map((option) => ({ value: option, label: option[0]?.toUpperCase() + option.slice(1) }))} />
    {loading ? <ListSkeleton rows={2} /> : null}
    {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
    {!loading && !error && !items.length ? <EmptyState title={`No ${view === "all" ? "obligations" : view + " obligations"}`} detail="Only records you enter appear here. No gateway or automatic payment verification is connected." /> : null}
    {!loading && items.length ? <GroupedList>{items.map((obligation) => <ListRow key={obligation.id} title={obligation.label} detail={`${obligation.type} · ${displayLabel(obligation.direction)}`} href={`/property/${propertyId}/bills/${obligation.id}`} />)}</GroupedList> : null}
  </div>;
}

function CreateObligation({ propertyId, onCreated }: { propertyId: string; onCreated: () => void }) {
  const { s } = useStore();
  const { notify } = useToast();
  const insuranceDate = s.properties.find(property => property.id === propertyId)?.insuranceUntil;
  const request = useRef<{ key: string; payload: string } | null>(null);
  const [type, setType] = useState("Property tax"); const [label, setLabel] = useState(""); const [direction, setDirection] = useState("PAYABLE"); const [amount, setAmount] = useState(""); const [dueDate, setDueDate] = useState(todayISO()); const [recurrenceType, setRecurrenceType] = useState("once"); const [currency, setCurrency] = useState("INR"); const [timezone, setTimezone] = useState("Asia/Kolkata"); const [remindersEnabled, setRemindersEnabled] = useState(false); const [beforeDays, setBeforeDays] = useState("0,3,7"); const [localTime, setLocalTime] = useState("09:00"); const [emailChannel, setEmailChannel] = useState(false); const [pushChannel, setPushChannel] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const create = async () => {
    setBusy(true); setError("");
    try {
      const offsets = beforeDays.split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value));
      const channels = ["IN_APP", ...(emailChannel ? ["EMAIL"] : []), ...(pushChannel ? ["PUSH"] : [])];
      const payload = { type, label: label || type, direction, ...(direction === "NON_FINANCIAL" ? {} : { amount }), currency, dueDate, timezone, recurrenceType, reminderConfig: { enabled: remindersEnabled, beforeDays: offsets, localTime, channels } };
      const serialized = JSON.stringify(payload);
      if (!request.current || request.current.payload !== serialized) request.current = { key: crypto.randomUUID(), payload: serialized };
      const response = await fetch(`/api/obligations?propertyId=${encodeURIComponent(propertyId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestKey: request.current.key }) });
      const body = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message || "Obligation could not be saved.");
      request.current = null; setLabel(""); setAmount(""); onCreated();
      notify(remindersEnabled ? "Reminder added" : "Obligation added");
    } catch (reason: unknown) { const message = reason instanceof Error ? reason.message : "Obligation could not be saved."; setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  };
  return <div className="surface bg-white p-3 space-y-2">
    <p className="font-serif text-[16px]">Record an obligation</p><p className="text-[13px] text-ink-muted">Manual-first property record. A configured reminder is not proof of an official deadline or bill.</p>
    {insuranceDate ? <><Button variant="quiet" onClick={() => { setType("Insurance"); setLabel("Review insurance renewal"); setDirection("NON_FINANCIAL"); setDueDate(insuranceDate); setRecurrenceType("once"); }}>Use recorded insurance date</Button><p className="text-[13px]">This only fills the form. Review the date and reminder settings, then choose Add obligation.</p></> : null}
    <div className="grid grid-cols-2 gap-2"><select aria-label="Obligation type" value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-xl border border-line px-2 text-[14px]"><option>Property tax</option><option>Rent</option><option>Maintenance</option><option>Insurance</option><option>Loan instalment</option><option>Other</option></select><select aria-label="Obligation direction" value={direction} onChange={(event) => setDirection(event.target.value)} className="h-10 rounded-xl border border-line px-2 text-[14px]"><option value="PAYABLE">Payable</option><option value="RECEIVABLE">Receivable</option><option value="NON_FINANCIAL">Reminder only</option></select></div>
    <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label e.g. Property tax FY 2026" className="h-10 w-full rounded-xl border border-line px-3 text-[13px]" />
    <div className="grid grid-cols-2 gap-2"><input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={direction === "NON_FINANCIAL" ? "No amount" : "Amount ₹"} inputMode="decimal" disabled={direction === "NON_FINANCIAL"} className="h-10 rounded-xl border border-line px-3 text-[13px] disabled:bg-canvas" /><input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} placeholder="Currency" className="h-10 rounded-xl border border-line px-3 text-[13px]" /></div>
    <div className="grid grid-cols-2 gap-2"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-10 rounded-xl border border-line px-2 text-[14px]" /><select value={recurrenceType} onChange={(event) => setRecurrenceType(event.target.value)} className="h-10 rounded-xl border border-line px-2 text-[14px]"><option value="once">One-time</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>
    <input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Timezone e.g. Asia/Kolkata" className="h-10 w-full rounded-xl border border-line px-3 text-[13px]" />
    <label className="flex items-center gap-2 text-[14px] font-semibold"><input type="checkbox" checked={remindersEnabled} onChange={(event) => setRemindersEnabled(event.target.checked)} />Enable reminders</label>
    {remindersEnabled ? <div className="rounded-xl bg-white p-2 space-y-2"><p className="text-[12px] text-ink-muted">Offsets are days before due date. Delivery time is local to the property timezone.</p><div className="grid grid-cols-2 gap-2"><input value={beforeDays} onChange={(event) => setBeforeDays(event.target.value)} placeholder="0,3,7" className="h-9 rounded-lg border border-line px-2 text-[14px]" /><input value={localTime} onChange={(event) => setLocalTime(event.target.value)} placeholder="09:00" className="h-9 rounded-lg border border-line px-2 text-[14px]" /></div><label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={emailChannel} onChange={(event) => setEmailChannel(event.target.checked)} />Email sandbox capture</label><label className="flex items-center gap-2 text-[13px] text-ink-muted"><input type="checkbox" checked={pushChannel} onChange={(event) => setPushChannel(event.target.checked)} />Push provider boundary (currently unavailable)</label></div> : null}
    {error ? <p role="alert" className="rounded-xl bg-[#fff5f5] p-2 text-[13px] text-red-700">{error}</p> : null}<Button busy={busy} onClick={() => void create()} className="w-full">Add obligation</Button>
  </div>;
}

export function ObligationCard({ obligation, docs, onChanged }: { obligation: Obligation; docs: ReceiptDoc[]; onChanged: () => void }) {
  const [paymentOccurrence, setPaymentOccurrence] = useState<string | null>(null); const [error, setError] = useState("");
  const occurrences = obligation.occurrences ?? [];
  return <div className="rounded-2xl border border-line bg-white p-3">
    <ScheduleCorrection key={`${obligation.id}:${obligation.version}`} obligation={obligation} onChanged={onChanged} />
    <div className="flex items-start justify-between gap-2"><div><p className="text-[13px] font-semibold">{obligation.label}</p><p className="text-[13px] text-ink-muted">{obligation.type} • {displayLabel(obligation.direction)} • {obligation.recurrenceType} • {obligation.currency}</p></div><StatusPill tone={obligation.active ? "info" : "neutral"}>{obligation.active ? "Active" : "Inactive"}</StatusPill></div>
    {occurrences.map((occurrence) => <div key={occurrence.id} className="mt-2 rounded-xl bg-white p-2"><div className="flex items-center justify-between gap-2"><div><p className="text-[14px] font-semibold">Due {presentDate(occurrence.dueDate)} {occurrence.amount !== null ? `• ${inr(occurrence.amount)}` : ""}</p><p className="text-[12px] text-ink-muted">{occurrence.source === "GENERATED" ? "Generated from your recurrence" : "Entered by you"}</p></div><StatusPill tone={statusTone(occurrence.status)}>{displayLabel(occurrence.status)}</StatusPill></div>{obligation.active && occurrence.status !== "CANCELLED" && occurrence.status !== "COMPLETED" && obligation.direction !== "NON_FINANCIAL" ? <button onClick={() => setPaymentOccurrence(paymentOccurrence === occurrence.id ? null : occurrence.id)} className="mt-1 text-[13px] underline">Record payment</button> : null}{obligation.active && occurrence.status !== "CANCELLED" && occurrence.status !== "COMPLETED" && obligation.direction === "NON_FINANCIAL" ? <button onClick={async () => { const response = await fetch(`/api/obligations/${obligation.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete-occurrence", occurrenceId: occurrence.id, occurrenceVersion: occurrence.version }) }); if (!response.ok) setError("Occurrence could not be completed."); else onChanged(); }} className="mt-1 text-[13px] underline">Mark completed (self-reported)</button> : null}{paymentOccurrence === occurrence.id ? <PaymentForm occurrence={occurrence} docs={docs} onSaved={() => { setPaymentOccurrence(null); onChanged(); }} /> : null}</div>)}
    {obligation.direction !== "NON_FINANCIAL" ? occurrences.map((occurrence) => <PaymentHistory key={`${occurrence.id}:${occurrence.version}`} occurrenceId={occurrence.id} onChanged={onChanged} />) : null}
    {error ? <p className="mt-2 text-[13px] text-red-700">{error}</p> : null}<p className="mt-2 text-[12px] text-ink-muted">Timezone: {obligation.timezone} • Source: {obligation.source === "USER_ENTERED" ? "Added by you / self-reported" : obligation.source}</p>
  </div>;
}

export function PaymentHistory({ occurrenceId, onChanged }: { occurrenceId: string; onChanged: () => void }) {
  const [payments, setPayments] = useState<Array<{ id: string; amount: number; paymentDate: string; status: string; reversalOfId: string | null }>>([]);
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [confirmPayment, setConfirmPayment] = useState<string | null>(null);
  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/obligations/${occurrenceId}/payments`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Payment history could not be loaded.");
      setPayments(body.data.summary.payments); setOpen(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Payment history unavailable."); }
    finally { setBusy(false); }
  }
  async function reverse(id: string) {
    if (confirmPayment !== id) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/payments/${id}/reverse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idempotencyKey: `bills-reverse:${id}` }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Payment reversal could not be saved.");
      setPayments(body.data.summary.payments); onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Payment reversal unavailable."); }
    finally { setBusy(false); }
  }
  return <div className="mt-2 border-t border-line pt-2">
    <Button variant="quiet" busy={busy} onClick={() => void load()}>View payment history</Button>
    {error ? <p role="alert" className="text-[14px] text-red-700">{error}</p> : null}
    {open && !payments.length ? <p className="text-[14px]">No recorded payments.</p> : null}
    {open ? payments.map((payment) => <div key={payment.id} className="mt-2 rounded-xl border border-line p-2 text-[14px]">
      <p>{inr(payment.amount)} · {presentDate(payment.paymentDate)} · {displayLabel(payment.status)}</p>
      {payment.reversalOfId ? <p className="break-all">Reversal of {payment.reversalOfId}; original retained.</p> : null}
      {payment.status === "RECORDED" && !payment.reversalOfId ? confirmPayment === payment.id ? <div className="mt-2 space-y-2">
        <p>Reverse this recorded payment? The original and reversal will be retained. This changes records only; it does not move money. Linked Construction totals refresh from this payment.</p>
        <Button variant="secondary" busy={busy} onClick={() => void reverse(payment.id)}>Confirm payment reversal</Button>
        <Button variant="quiet" disabled={busy} onClick={() => setConfirmPayment(null)}>Cancel reversal</Button>
      </div> : <Button variant="quiet" busy={busy} onClick={() => setConfirmPayment(payment.id)}>Reverse payment</Button> : null}
    </div>) : null}
  </div>;
}

export function PaymentForm({ occurrence, docs, onSaved }: { occurrence: Occurrence; docs: ReceiptDoc[]; onSaved: () => void }) {
  const { notify } = useToast();
  const request = useRef<{ payload: string; key: string } | null>(null);
  const [amount, setAmount] = useState(occurrence.amount?.toString() ?? ""); const [date, setDate] = useState(todayISO()); const [method, setMethod] = useState("bank transfer"); const [receipt, setReceipt] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const save = async () => {
    setBusy(true); setError("");
    try {
      const selected = docs.find((doc) => doc.id === receipt);
      const selectedVersion = selected?.versions?.find((version) => version.version === (selected.version ?? 1));
      const payload = { amount, currency: occurrence.currency, paymentDate: date, method, expectedOccurrenceVersion: occurrence.version, ...(selected && selectedVersion ? { receiptDocumentId: selected.id, receiptDocumentVersionId: selectedVersion.id } : {}) };
      const serialized = JSON.stringify(payload);
      if (!request.current || request.current.payload !== serialized) request.current = { payload: serialized, key: `ui-${crypto.randomUUID()}` };
      const response = await fetch(`/api/obligations/${occurrence.id}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, idempotencyKey: request.current.key }) });
      const body = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message || "Payment could not be recorded.");
      notify("Payment recorded");
      onSaved();
    } catch (reason: unknown) { const message = reason instanceof Error ? reason.message : "Payment could not be recorded."; setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  };
  return <div className="mt-2 rounded-lg border border-line bg-white p-2"><div className="grid grid-cols-2 gap-2"><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Amount ₹" className="h-9 rounded-lg border border-line px-2 text-[14px]" /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-9 rounded-lg border border-line px-2 text-[14px]" /></div><input value={method} onChange={(event) => setMethod(event.target.value)} placeholder="Method" className="mt-2 h-9 w-full rounded-lg border border-line px-2 text-[14px]" />{docs.length ? <select value={receipt} onChange={(event) => setReceipt(event.target.value)} className="mt-2 h-9 w-full rounded-lg border border-line px-2 text-[14px]"><option value="">No receipt linked</option>{docs.map((doc) => <option key={doc.id} value={doc.id}>Receipt: {doc.name} v{doc.version ?? 1}</option>)}</select> : <p className="mt-2 text-[12px] text-ink-muted">Add a clean vault document to link a receipt.</p>}{error ? <p className="mt-1 text-[12px] text-red-700">{error}</p> : null}<Button busy={busy} onClick={() => void save()} className="mt-2 w-full">Save payment</Button></div>;
}

export function ScheduleCorrection({ obligation, onChanged }: { obligation: Obligation; onChanged: () => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const dueDate = String(form.get("dueDate"));
      const response = await fetch(`/api/obligations/${obligation.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: obligation.version, obligation: { label: form.get("label"), ...(obligation.direction !== "NON_FINANCIAL" ? { amount: form.get("amount") } : {}), dueDate, recurrenceDay: Number(dueDate.slice(-2)), recurrenceType: form.get("recurrenceType") } }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Correction unavailable.");
      onChanged(); setOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Correction unavailable."); }
    finally { setBusy(false); }
  }
  return <div className="mb-2">
    <Button variant="quiet" onClick={() => setOpen(!open)}>Correct schedule: {obligation.label}</Button>
    {open ? <form onSubmit={event => void save(event)} className="space-y-2 rounded-xl border border-line p-3 text-[14px]">
      <p>Correct unpaid occurrences only. Paid occurrences, payment history and the owner-entered loan balance are retained. This does not move money or confirm a lender balance.</p>
      <label className="block">Schedule label<input className="block border rounded p-2 w-full" name="label" defaultValue={obligation.label} required maxLength={200} /></label>
      {obligation.direction !== "NON_FINANCIAL" ? <label className="block">Corrected instalment amount ₹<input className="block border rounded p-2 w-full" name="amount" defaultValue={obligation.amount?.toString() ?? ""} inputMode="decimal" required /></label> : null}
      <label className="block">Schedule anchor date<input className="block border rounded p-2" type="date" name="dueDate" defaultValue={obligation.dueDate} required /></label>
      <label className="block">Corrected recurrence<select className="block border rounded p-2" name="recurrenceType" defaultValue={obligation.recurrenceType}><option value="once">One-time</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></label>
      {error ? <p role="alert">{error}</p> : null}<Button busy={busy} type="submit">Confirm schedule correction</Button>
    </form> : null}
  </div>;
}

export type AssessmentItemDto = { id: string; ruleStableKey: string; ruleVersion: number | null; requirement: string; applicability: string; evidenceState: string; contribution: string; result: string; suggestedAction: string | null; explanation: string; rule: { sourceName: string | null; sourceReference: unknown; sourcePublishedDate: string | null; reviewer: string | null; reviewedAt: string | null; status: string } | null };
export type AssessmentDto = { id: string; assessment: "RECORD_READINESS" | "NOT_ASSESSED"; score: number | null; applicableCount: number; satisfiedCount: number; unknownCount: number; evaluatedAt: string; items: AssessmentItemDto[] };

export function HealthAssessmentPanel({ propertyId }: { propertyId: string }) {
  const [snapshot, setSnapshot] = useState<AssessmentDto | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const response = await fetch(`/api/properties/${propertyId}/health`, { cache: "no-store" }); const body = await response.json() as { data?: { snapshot: AssessmentDto }; error?: { message?: string } }; if (!response.ok || !body.data) throw new Error(body.error?.message || "Health assessment could not be loaded."); setSnapshot(body.data.snapshot); } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Health assessment could not be loaded."); } finally { setLoading(false); } };
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/properties/${propertyId}/health`, { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as { data?: { snapshot: AssessmentDto }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Health assessment could not be loaded.");
      if (!cancelled) { setSnapshot(body.data.snapshot); setLoading(false); }
    }).catch((reason: unknown) => { if (!cancelled) { setError(reason instanceof Error ? reason.message : "Health assessment could not be loaded."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [propertyId]);
  if (loading) return <div className="surface bg-white p-4" role="status" aria-label="Loading assessment"><Skeleton className="h-5 w-2/3" /><Skeleton className="mt-2 h-3 w-full" /><Skeleton className="mt-2 h-3 w-1/2" /></div>;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!snapshot) return <EmptyState title="Record readiness not assessed" detail="No immutable assessment snapshot is available yet." />;
  return <section className="surface bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-serif text-[16px]">Record readiness {snapshot.assessment === "NOT_ASSESSED" ? "not assessed" : `${snapshot.score}/100`}</p><p className="mt-1 text-[13px] text-ink-muted">{snapshot.assessment === "NOT_ASSESSED" ? "No applicable published checklist is available." : `${snapshot.satisfiedCount}/${snapshot.applicableCount} known applicable requirements satisfied`} • {snapshot.unknownCount} unknown</p></div><HealthRing score={snapshot.score ?? undefined} /></div><p className="mt-2 rounded-xl bg-[#fffaf3] p-2 text-[13px] text-ink-muted">Deterministic record/document readiness from this Property Passport, confirmed vault evidence, and published typed rules. It is not legal, title, tax, or structural certification.</p><div className="mt-3 space-y-2">{snapshot.items.map((item) => <div key={item.id} className="rounded-xl border border-line bg-white p-2"><div className="flex items-start justify-between gap-2"><p className="text-[14px] font-semibold">{item.requirement}</p><StatusPill tone={item.evidenceState === "SATISFIED" ? "success" : item.evidenceState === "MISSING" ? "danger" : item.evidenceState === "NEEDS_REVIEW" ? "warning" : "neutral"}>{item.evidenceState}</StatusPill></div><p className="mt-1 text-[13px] text-ink-muted">{item.explanation}</p>{item.suggestedAction ? <p className="mt-1 text-[13px]">Next: {item.suggestedAction}</p> : null}<p className="mt-1 text-[12px] text-ink-muted">Rule {item.ruleStableKey} v{item.ruleVersion ?? "?"}{item.rule?.sourceName ? ` • source: ${item.rule.sourceName}` : " • source unavailable"}{item.rule?.reviewer ? ` • reviewed by ${item.rule.reviewer}` : ""}</p></div>)}</div><p className="mt-2 text-[12px] text-ink-muted">Snapshot {snapshot.id.slice(0, 8)} • evaluated {snapshot.evaluatedAt.slice(0, 10)} • immutable history retained</p></section>;
}

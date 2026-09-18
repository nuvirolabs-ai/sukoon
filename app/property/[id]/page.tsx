"use client";
import { OwnershipRecords } from "@/components/OwnershipRecords";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { Button, ErrorState, Input, PageHead, Sheet, Surface } from "@/components/ui";
import { Assistant } from "@/components/Assistant";
import { HealthAssessmentPanel, ObligationsPanel } from "@/components/ObligationsPanel";
import { MaintenancePanel } from "@/components/MaintenancePanel";
import { SharingPanel } from "@/components/SharingPanel";
import { PropertySwitcher } from "@/components/PropertySwitcher";
import { ExportPanel } from "@/components/ExportPanel";
import { healthFor } from "@/lib/health";
import { type Property, type TimelineEvent } from "@/lib/types";
import { randomId, todayISO, inr } from "@/lib/utils";
import { Disclosure, GroupedList, ListRow, SectionHeader, displayLabel, documentStatusLabel, activityTitle, groupByActivity, presentDate, shortDate } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { AnimatedSegment } from "@/components/motion/AnimatedSegment";
import { StatusTransition } from "@/components/motion/StatusTransition";
import { useToast } from "@/components/motion/Toast";
import { propertyTab } from "@/lib/navigation";
import { PropertyComposition, usePropertyComposition } from "@/components/PropertyComposition";
import { GuidedPaperFlow } from "@/components/GuidedPaperFlow";

export default function PassportPage() {
  return <Suspense fallback={<p className="p-6">Loading Property Passport…</p>}><PassportContent /></Suspense>;
}

function PassportContent() {
  const { id } = useParams<{ id: string }>();
  const { s, update, replace } = useStore();
  const { notify } = useToast();
  const composition = usePropertyComposition();
  const summary = composition.properties.find(p=>p.id===id);
  const r = useRouter();
  const searchParams = useSearchParams();
  const tab = propertyTab(searchParams.get("tab"));
  const [editOpen, setEditOpen] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; field: string; previousValue?: unknown; nextValue?: unknown; source: string; createdAt: string }>>([]);
  const [historyError, setHistoryError] = useState("");
  const p = s.properties.find((x) => x.id === id);
  useEffect(() => {
    const documentId = searchParams.get("document");
    if (documentId) r.replace(`/property/${id}/documents/${documentId}`);
  }, [id, r, searchParams]);
  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/properties/${id}/history`, { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as { data?: { history: typeof history }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "History could not be loaded.");
      if (!cancelled) setHistory(body.data.history);
    }).catch((reason: unknown) => { if (!cancelled) setHistoryError(reason instanceof Error ? reason.message : "History could not be loaded."); });
    return () => { cancelled = true; };
  }, [id]);
  if (!p) return <div className="p-6 text-sm">Property not found. <Link href="/properties" className="underline">Back</Link></div>;
  const h = healthFor(p.id, s);
  const timeline = s.timeline.filter((t) => t.propertyId === p.id).sort((a,b)=>a.date<b.date?1:-1);

  const addTimeline = (title: string, kind: TimelineEvent["kind"], detail?: string) =>
    update((st) => { st.timeline.push({ id: randomId(), propertyId: p.id, date: todayISO(), title, detail, kind }); return st; });

  const archive = async () => {
    if (!window.confirm("Archive this passport? Its private documents and history will be retained.")) return;
    setArchiving(true);
    setMutationError("");
    try {
      const response = await fetch(`/api/properties/${p.id}/archive`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: p.version ?? 0 }) });
      const body = await response.json() as { data?: { state: typeof s; version: number }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Passport could not be archived.");
      replace(body.data.state, body.data.version);
      r.push("/properties");
    } catch (reason: unknown) { setMutationError(reason instanceof Error ? reason.message : "Passport could not be archived."); }
    finally { setArchiving(false); }
  };

  return (
    <div>
      <PageHead title={tab === "overview" ? p.name : `${({vault:"Documents",bills:"Bills & payments",maint:"Maintenance",share:"Sharing",timeline:"Timeline",rent:"Rent",export:"Exports"} as Record<string,string>)[tab] || displayLabel(tab)}`} sub={tab === "overview" ? `${displayLabel(p.type)} · ${p.area}${p.city ? `, ${p.city}` : ""}` : p.name} backHref={tab !== "overview" ? `/property/${p.id}?tab=overview` : undefined} backLabel="Property" right={<PropertySwitcher currentId={p.id} tab={tab} />} />
      {tab !== "overview" && <div className="pb-2"><AnimatedSegment label="Property sections" value={tab} options={["overview","vault","bills","maint","rent","timeline","share","export"].map((v)=>({ value: v, label: v==="overview"?"Overview":v==="vault"?"Documents":v==="maint"?"Maintenance":v==="bills"?"Bills":displayLabel(v), href: `/property/${p.id}?tab=${v}` }))} /></div>}

      <div className="pb-6 space-y-3">
        {tab==="overview" && (
          <>
            <p className="text-[13px] text-ink-muted">Owner asserted</p>
            <div className="surface p-5">
              <p className="text-[13px] text-ink-muted">Record readiness</p>
              <p className="text-[32px] tracking-tight mt-1"><StatusTransition statusKey={(summary?.readiness.assessment??h.assessment) === "RECORD_READINESS" ? `score-${summary?.readiness.score??h.score}` : "not-assessed"}>{(summary?.readiness.assessment??h.assessment) === "RECORD_READINESS" ? `${summary?.readiness.score??h.score}%` : "Not assessed"}</StatusTransition></p>
              <Disclosure title="View readiness"><HealthAssessmentPanel propertyId={p.id}/></Disclosure>
            </div>
            <section className="guided-home-next surface" aria-labelledby="property-next-title">
              <p className="guided-eyebrow">Next for this property</p>
              <h2 id="property-next-title">{s.docs.some((document) => document.propertyId === p.id && !document.deletedAt && !document.archivedAt) ? "Keep reviewing your papers" : "Add your first paper"}</h2>
              <p>{s.docs.some((document) => document.propertyId === p.id && !document.deletedAt && !document.archivedAt) ? "Your papers, scan details and manual review live together here." : "Start with a PDF or photo. Nothing is shared until you choose to share it."}</p>
              <Link href={`/property/${p.id}?tab=vault`} className="primary-disclosure motion-pressable">Open documents <span aria-hidden="true">→</span></Link>
            </section>
            <GroupedList><AnimatedList>{[["vault","Documents",`${s.docs.filter(d=>d.propertyId===p.id).length}`],["bills","Bills & payments","Due, paid, reminders"],["maint","Maintenance",`${h.maint.open} active`],["timeline","Timeline",`${timeline.length}`],["share","Sharing","Who can see what"],["rent","Rent","Tenancies"],["export","Exports","Download records"]].map(([key,label,detail])=><ListRow key={key} title={label} detail={detail} href={`/property/${p.id}?tab=${key}`}/>)}</AnimatedList></GroupedList>
            {summary&&<PropertyComposition summary={summary}/>} {composition.error&&<p role="alert">{composition.error}</p>}
            <Disclosure title="Property details" detail="Ownership, area, loan">
            <Link href={`/construction?propertyId=${p.id}`} className="block rounded-2xl p-4 text-[15px]">Construction <span className="float-right text-ink-muted">→</span></Link>
            <div className="surface p-4 bg-white">
              <p className="text-[16px] font-medium">Signals</p>
              <p className="text-[13px] text-ink-muted mt-1">{h.docs.have} documents · {h.finance.pending} bills pending · {h.risk.insured ? "Insured" : "Insurance not recorded"} · {h.maint.open} open jobs</p>
            </div>
            <Surface className="space-y-2 text-[15px]">
              <p><span className="text-ink-muted">Owner</span> · {p.ownerName}</p>
              <p><span className="text-ink-muted">Address</span> · {p.address}</p>
              <p><span className="text-ink-muted">Area</span> · {p.areaValue ? `${p.areaValue} ${p.areaUnit ?? ""}` : "Not recorded"}</p>
              <p className="text-[13px] text-ink-muted">Owner asserted · not government verified</p>
              <p><b>Source:</b> {p.ownershipProvenance || "Not recorded"}</p>
              {p.identifiers?.map((identifier) => <p key={`${identifier.label}-${identifier.value}`}><b>{identifier.label}:</b> {identifier.value}</p>)}
              {p.purchaseValue?<p><b>Purchase:</b> {inr(p.purchaseValue)} {p.purchaseDate?`on ${p.purchaseDate}`:""}</p>:null}
              {p.loanActive?<p><b>Last entered loan balance:</b> {p.loanBalance === undefined ? "Not recorded" : inr(p.loanBalance)}</p>:null}
              <div className="pt-2 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit details</Button>
                <Button variant="danger" busy={archiving} onClick={() => void archive()}>Archive passport</Button>
                <Link href="/buy-sell" className="underline">Sell from passport →</Link>
              </div>
              {mutationError ? <ErrorState message={mutationError} /> : null}
            </Surface>
            <OwnershipRecords key={p.id} property={p} />
            <Surface tone="soft">
              <p className="text-[16px] font-medium">Identity history</p>
              {historyError ? <p className="mt-2 text-[13px] text-red-700">{historyError}</p> : null}
              <div className="mt-2 space-y-1">{history.slice(-5).reverse().map((entry) => <p key={entry.id} className="text-[13px] text-ink-muted">{presentDate(entry.createdAt)} · {displayLabel(entry.field)}</p>)}</div>
            </Surface>
            </Disclosure><Disclosure title="Ask Sukoon" detail="Questions about this property"><Assistant propertyId={p.id} /></Disclosure>
          </>
        )}

        {tab==="vault" && <VaultTab propertyId={p.id} />}
        {tab==="bills" && <BillsTab propertyId={p.id} />}
        {tab==="rent" && <RentTab propertyId={p.id} />}
        {tab==="maint" && <MaintenancePanel propertyId={p.id} />}

        {tab==="timeline" && (
          <div className="space-y-6">
            {groupByActivity(timeline).map((group) => (
              <section key={group.name}>
                <SectionHeader title={group.name} />
                <GroupedList>
                  <AnimatedList stagger={false}>
                    {group.rows.map((event) => (
                      <ListRow key={event.id} title={activityTitle(event.title, event.detail)} detail={shortDate(event.date)} />
                    ))}
                  </AnimatedList>
                </GroupedList>
              </section>
            ))}
            {!timeline.length && <p className="text-[14px] text-ink-muted">No events yet.</p>}
            <Disclosure title="Add event"><AddTimeline onAdd={(title, detail) => addTimeline(title, "other", detail)} /></Disclosure>
          </div>
        )}

        {tab==="share" && <SharingPanel propertyId={p.id} />}
        {tab==="export" && <ExportPanel propertyId={p.id} />}
        {tab==="ai" && <Assistant propertyId={p.id} />}
      </div>
      <PropertyEditSheet key={`${p.id}-${editOpen}-${p.version ?? 0}`} property={p} open={editOpen} onClose={() => setEditOpen(false)} onSaved={(data) => { replace(data.state, data.version); setEditOpen(false); notify("Passport updated"); }} />
    </div>
  );
}

function PropertyEditSheet({ property, open, onClose, onSaved }: { property: Property; open: boolean; onClose: () => void; onSaved: (data: { state: ReturnType<typeof useStore>["s"]; version: number }) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const firstIdentifier = property.identifiers?.[0];
  const [values, setValues] = useState(() => ({ name: property.name, address: property.address, area: property.area, city: property.city, jurisdiction: property.jurisdiction ?? "", ownerName: property.ownerName, areaValue: property.areaValue ?? "", areaUnit: property.areaUnit ?? "sqft", areaType: property.areaType ?? "other", ownershipProvenance: property.ownershipProvenance ?? "", identifierLabel: firstIdentifier?.label ?? "", identifierValue: firstIdentifier?.value ?? "", purchaseDate: property.purchaseDate ?? "", purchaseValue: property.purchaseValue?.toString() ?? "" }));
  const set = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError("");
    const identifiers = values.identifierLabel.trim() && values.identifierValue.trim() ? [{ label: values.identifierLabel.trim(), value: values.identifierValue.trim() }] : [];
    try {
      const response = await fetch(`/api/properties/${property.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: property.version ?? 0, property: { ...values, identifiers, ownershipAssertion: "self_asserted", purchaseValue: values.purchaseValue || undefined } }) });
      const body = await response.json() as { data?: { state: ReturnType<typeof useStore>["s"]; version: number }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Passport could not be updated.");
      onSaved(body.data);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Passport could not be updated."); }
    finally { setBusy(false); }
  };
  return <Sheet open={open} title="Edit passport details" onClose={onClose}><form className="space-y-3" onSubmit={(event) => void save(event)}><Input label="Property name" required value={values.name} onChange={(event) => set("name", event.target.value)} /><Input label="Full address" required value={values.address} onChange={(event) => set("address", event.target.value)} /><div className="grid grid-cols-2 gap-2"><Input label="Locality" required value={values.area} onChange={(event) => set("area", event.target.value)} /><Input label="City" required value={values.city} onChange={(event) => set("city", event.target.value)} /></div><Input label="Jurisdiction" required value={values.jurisdiction} onChange={(event) => set("jurisdiction", event.target.value)} /><Input label="Owner name" required value={values.ownerName} onChange={(event) => set("ownerName", event.target.value)} /><div className="grid grid-cols-2 gap-2"><Input label="Original area" required value={values.areaValue} onChange={(event) => set("areaValue", event.target.value)} /><label className="block text-[14px] font-semibold">Unit<select value={values.areaUnit} onChange={(event) => set("areaUnit", event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line px-2 text-[16px]"><option value="sqft">sq ft</option><option value="sqm">sq m</option><option value="acre">acre</option><option value="hectare">hectare</option><option value="other">Other</option></select></label></div><label className="block text-[14px] font-semibold">Area type<select value={values.areaType} onChange={(event) => set("areaType", event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line px-2 text-[16px]"><option value="carpet">Carpet</option><option value="built_up">Built-up</option><option value="plot">Plot</option><option value="land">Land</option><option value="other">Other</option></select></label><Input label="Ownership source" required value={values.ownershipProvenance} onChange={(event) => set("ownershipProvenance", event.target.value)} /><div className="grid grid-cols-2 gap-2"><Input label="Identifier label" value={values.identifierLabel} onChange={(event) => set("identifierLabel", event.target.value)} /><Input label="Identifier value" value={values.identifierValue} onChange={(event) => set("identifierValue", event.target.value)} /></div><div className="grid grid-cols-2 gap-2"><Input label="Purchase date" type="date" value={values.purchaseDate} onChange={(event) => set("purchaseDate", event.target.value)} /><Input label="Purchase value ₹" inputMode="decimal" value={values.purchaseValue} onChange={(event) => set("purchaseValue", event.target.value)} /></div>{error ? <ErrorState message={error} /> : null}<div className="flex gap-2"><Button variant="quiet" type="button" className="flex-1" onClick={onClose}>Cancel</Button><Button type="submit" className="flex-[2]" busy={busy}>Save changes</Button></div></form></Sheet>;
}

function AddTimeline({ onAdd }: { onAdd: (t: string, d?: string)=>void }) {
  const [t,setT]=useState(""); const [d,setD]=useState("");
  return (
    <div className="rounded-2xl border border-line bg-white p-3 space-y-2">
      <input value={t} onChange={(e)=>setT(e.target.value)} placeholder="Event title e.g. Tax paid 2025" className="h-10 w-full rounded-xl border border-line px-3 text-[13px]" />
      <input value={d} onChange={(e)=>setD(e.target.value)} placeholder="Detail (optional)" className="h-10 w-full rounded-xl border border-line px-3 text-[13px]" />
      <button onClick={()=>{ if(t.trim()){ onAdd(t,d); setT(""); setD(""); } }} className="h-10 w-full rounded-full bg-forest text-white text-[13px]">Add event</button>
    </div>
  );
}

// ---- Vault ----
function VaultTab({ propertyId }: { propertyId: string }) {
  const { s } = useStore();
  const property = s.properties.find((item) => item.id === propertyId);
  const [filter,setFilter]=useState("All");
  const [query, setQuery] = useState("");
  const docs = s.docs.filter((d)=>d.propertyId===propertyId && !d.deletedAt && !d.archivedAt);
  const visibleDocs = docs.filter((document) => {
    const matchesFilter = filter === "All" || (filter === "Reviewed" ? document.reviewStatus === "confirmed" && document.scanStatus === "clean" : document.reviewStatus !== "confirmed" || document.scanStatus !== "clean");
    const haystack = `${document.displayName || document.name} ${document.type}`.toLowerCase();
    return matchesFilter && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  });

  return (
    <div className="space-y-3">
      {property ? <GuidedPaperFlow property={property} /> : null}
      <div className="surface bg-white p-4 text-[13px] text-ink-muted">{docs.length} {docs.length === 1 ? "paper" : "papers"}</div>
      <label className="guided-search-field">Search papers
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or category" />
      </label>
      <AnimatedSegment label="Document filters" value={filter} onChange={setFilter} options={["All","Needs attention","Reviewed"].map((f)=>({ value: f, label: f }))} />
      <GroupedList><AnimatedList stagger={false}>{visibleDocs.map((d)=>(
        <ListRow key={d.id} href={`/property/${propertyId}/documents/${d.id}`} title={d.displayName || d.name} detail={`${d.type} · ${documentStatusLabel(d)} · ${presentDate(d.uploadDate)}`} />
      ))}</AnimatedList></GroupedList>
      {!visibleDocs.length ? <p className="p-5 text-[14px] text-ink-muted">No papers match this view.</p> : null}
    </div>
  );
}

// ---- Bills ----
function BillsTab({ propertyId }: { propertyId: string }) {
  return <ObligationsPanel propertyId={propertyId} />;
  /* Legacy AppState bills remain available in the dedicated legacy views; new property records use S14 obligations.
  const { s, update } = useStore();
  const [t,setT]=useState<BillType>("Property tax"); const [title,setTitle]=useState(""); const [amt,setAmt]=useState(""); const [due,setDue]=useState(todayISO());
  const bills=[...s.bills.filter((b)=>b.propertyId===propertyId)].sort((a,b)=>a.dueDate<b.dueDate?-1:1);
  return (
    <div className="space-y-2">
      <div className="surface bg-white p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={t} onChange={(e)=>setT(e.target.value as BillType)} className="h-10 rounded-xl border border-line px-2 text-[14px]">{BT.map((x)=><option key={x} value={x}>{x}</option>)}</select>
          <input type="date" value={due} onChange={(e)=>setDue(e.target.value)} className="h-10 rounded-xl border border-line px-2 text-[14px]" />
        </div>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title e.g. Property Tax Q3" className="h-10 w-full rounded-xl border border-line px-3 text-[13px]" />
        <div className="flex gap-2">
          <input value={amt} onChange={(e)=>setAmt(e.target.value)} placeholder="Amount ₹" inputMode="numeric" className="h-10 flex-1 rounded-xl border border-line px-3 text-[13px]" />
          <button onClick={()=>{ if(!amt){alert("Amount required");return;} update((st)=>{ st.bills.push({ id: randomId(), propertyId, type: t, title: title||t, amount: Number(amt), dueDate: due, status: due<todayISO()?"overdue":"pending", recurring: "once" }); st.timeline.push({ id: randomId(), propertyId, date: todayISO(), title: `Bill added: ${title||t} ₹${amt}`, kind: "tax" }); return st; }); setTitle(""); setAmt(""); }} className="h-10 rounded-full bg-forest text-white px-4 text-[13px]">Add</button>
        </div>
      </div>
      {bills.map((b)=>(
        <div key={b.id} className="rounded-2xl border border-line bg-white p-3 flex justify-between gap-2">
          <div>
              <p className="text-[13px] font-semibold">{b.title} <span className="ml-1 text-[12px] text-ink-muted">{displayLabel(b.status)}</span></p>
            <p className="text-[13px] text-ink-muted">{b.type} • {inr(b.amount)} • due {b.dueDate}{b.paidDate?` • paid ${b.paidDate}`:""}</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {b.status!=="paid"?<button className="text-[13px] underline" onClick={()=>update((st)=>{ const x=st.bills.find(y=>y.id===b.id); if(x){ x.status="paid"; x.paidDate=todayISO(); x.notes="Self-reported by account holder; not payment verification."; } st.timeline.push({ id: randomId(), propertyId, date: todayISO(), title: `Bill self-reported paid: ${b.title}`, detail: inr(b.amount).toString(), kind: "tax" }); return st; })}>Mark self-reported paid</button>:null}
            <button className="text-[13px] text-red-600 underline" onClick={()=>update((st)=>({ ...st, bills: st.bills.filter(y=>y.id!==b.id) }))}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  ); */
}

function RentTab({ propertyId }: { propertyId: string }) {
  const { s, update } = useStore();
  const [name,setName]=useState(""); const [rent,setRent]=useState(""); const [end,setEnd]=useState("2026-04-30");
  const tenants=s.tenants.filter(x=>x.propertyId===propertyId);
  const active=tenants.find(x=>x.status==="active");
  const add=()=>{
    if(!name||!rent){ alert("Tenant + rent required"); return; }
    update((st)=>{
      st.tenants.forEach(x=>{ if(x.propertyId===propertyId) x.status="exited"; });
      st.tenants.push({ id: randomId(), propertyId, name, rentAmount: Number(rent), startDate: todayISO(), endDate: end, status: "active" });
      st.bills.push({ id: randomId(), propertyId, type: "Rent", title: `Rent — ${name} (${new Date().toISOString().slice(0,7)})`, amount: Number(rent), dueDate: todayISO(), status: "pending", recurring: "monthly" });
      st.timeline.push({ id: randomId(), propertyId, date: todayISO(), title: `Tenant onboarded: ${name}`, detail: `₹${rent}/mo till ${end}`, kind: "other" });
      return st;
    });
    setName(""); setRent("");
  };
  const receipt=(tnId:string)=>{
    const tn=s.tenants.find(x=>x.id===tnId); if(!tn) return;
    const p=s.properties.find(x=>x.id===propertyId);
    const txt=`SELF-REPORTED RENT RECORD\nNot proof of payment\nProperty: ${p?.name}\nTenant: ${tn.name}\nAmount: ₹${tn.rentAmount.toLocaleString("en-IN")}\nMonth: ${new Date().toISOString().slice(0,7)}\nRecorded: ${todayISO()}\n— via SUKOON`;
    const blob=new Blob([txt],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`rent-receipt-${tn.name}.txt`; a.click();
    update((st)=>{ st.bills.push({ id: randomId(), propertyId, type: "Rent", title: `Rent self-reported received — ${tn.name}`, amount: tn.rentAmount, dueDate: todayISO(), paidDate: todayISO(), status: "paid", recurring: "monthly", notes: "Self-reported by account holder; not payment verification." }); return st; });
  };
  return (
    <div className="space-y-2">
      <div className="surface bg-white p-3">
        <p className="text-[13px] font-semibold">Rent collection {active?`• ${active.name} ₹${active.rentAmount.toLocaleString("en-IN")}/mo`:"• vacant"}</p>
        {active && <p className="text-[13px] text-ink-muted">Agreement till {active.endDate} • deposit is not recorded in this local flow • a local reminder is derived at 90 days</p>}
      </div>
      <div className="surface bg-white p-3 space-y-2">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Tenant name" className="h-10 w-full rounded-xl border border-line px-3 text-[13px]" />
        <div className="flex gap-2">
          <input value={rent} onChange={(e)=>setRent(e.target.value)} placeholder="Rent ₹/mo" inputMode="numeric" className="h-10 flex-1 rounded-xl border border-line px-3 text-[13px]" />
          <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} className="h-10 rounded-xl border border-line px-2 text-[14px]" />
        </div>
        <button onClick={add} className="h-10 w-full rounded-full bg-forest text-white text-[13px]">Onboard tenant + create rent bill</button>
      </div>
      {tenants.map((x)=>(
        <div key={x.id} className="rounded-2xl border border-line bg-white p-3 flex justify-between gap-2">
          <div><p className="text-[13px] font-semibold">{x.name} <span className="text-[12px] bg-gray-100 rounded-full px-2 py-0.5">{x.status}</span></p><p className="text-[13px] text-ink-muted">₹{x.rentAmount.toLocaleString("en-IN")}/mo • {x.startDate} → {x.endDate}</p></div>
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={()=>receipt(x.id)} className="text-[13px] underline">Record receipt</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Rent due ₹${x.rentAmount} for ${new Date().toISOString().slice(0,7)} — ${s.properties.find(p=>p.id===propertyId)?.name}.`)}`} target="_blank" className="text-[13px] underline">Share reminder</a>
          </div>
        </div>
      ))}
    </div>
  );
}

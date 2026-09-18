"use client";
import { useEffect, useRef, useState } from "react";
import { Disclosure, GroupedList, Metric, SectionHeader, displayLabel, presentDate } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { FlashOnChange } from "@/components/motion/FlashOnChange";
import { StatusTransition } from "@/components/motion/StatusTransition";
import { useToast } from "@/components/motion/Toast";
import { Button } from "@/components/ui";
type Version = { id: string; version: number; sha256: string; scanStatus: string; reviewStatus: string };
type Doc = { id: string; name: string; type: string; version: number; scanStatus: string; processingState: string; reviewStatus: string; versions: Version[] };
type Entry = { id: string; body: string; kind: string; state: string; version: number; events: Array<{ id: string; action: string; note: string; source: string; actorUserId: string; createdAt: string; documentVersionId: string | null; evidence: { documentId: string; version: number; sha256: string; current: boolean; available: boolean; scanStatus: string; reviewStatus: string } | null }> };
export function PurchaseEvidencePanel({ candidateId, summaryOnly=false, mode="all" }: { candidateId: string; summaryOnly?:boolean; mode?:"all"|"documents"|"questions"|"overview" }) {
  const [loaded,setLoaded]=useState(false);
  const [docs, setDocs] = useState<Doc[]>([]), [entries, setEntries] = useState<Entry[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false), [status, setStatus] = useState(""), [scan, setScan] = useState("");
  const { notify } = useToast();
  const retry = useRef<{ body: string; key: string } | null>(null);
  async function reload() {
    const [d, e] = await Promise.all([fetch(`/api/documents?purchaseCandidateId=${candidateId}`, { cache: "no-store" }), fetch(`/api/purchases/evidence?candidateId=${candidateId}`, { cache: "no-store" })]);
    const db = await d.json(), eb = await e.json(); if (!d.ok || !e.ok) throw new Error(db.error?.message || eb.error?.message || "Evidence unavailable."); setDocs(db.data.documents); setEntries(eb.data); setLoaded(true);
  }
  useEffect(() => { let cancelled = false;
    Promise.all([fetch(`/api/documents?purchaseCandidateId=${candidateId}`, { cache: "no-store" }), fetch(`/api/purchases/evidence?candidateId=${candidateId}`, { cache: "no-store" })]).then(async ([d, e]) => { const db = await d.json(), eb = await e.json(); if (!d.ok || !e.ok) throw new Error(db.error?.message || eb.error?.message || "Evidence unavailable."); if (!cancelled) { setDocs(db.data.documents); setEntries(eb.data); setLoaded(true); } }).catch(reason => { if (!cancelled) setError(reason.message); });
    return () => { cancelled = true; };
  }, [candidateId]);
  async function run(work: () => Promise<void>) { if (busy) return; setBusy(true); setError(""); try { await work(); await reload(); notify("Evidence saved"); } catch (reason) { const message = reason instanceof Error ? reason.message : "Evidence action unavailable."; setError(message); notify(message, "error"); } finally { setBusy(false); } }
  function requestKey(body: string) { if (!retry.current || retry.current.body !== body) retry.current = { body, key: crypto.randomUUID() }; return retry.current.key; }
  async function post(url: string, payload: Record<string, unknown>) { const body = { ...payload, requestKey: requestKey(JSON.stringify(payload)) }; const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || "Action failed."); retry.current = null; }
  if(summaryOnly){
    const received = loaded?`${entries.filter(e=>e.kind==="DOCUMENT_REQUEST"&&["RECEIVED","USER_REVIEWED"].includes(e.state)).length} of ${entries.filter(e=>e.kind==="DOCUMENT_REQUEST").length}`:"…";
    const open = loaded?String(entries.filter(e=>e.kind==="QUESTION"&&e.state!=="RESOLVED").length):"…";
    return error?<p role="alert">{error}</p>:<div className="metric-group"><Metric label="Documents received" value={<FlashOnChange value={received}>{received}</FlashOnChange>}/><Metric label="Open questions" value={<FlashOnChange value={open}>{open}</FlashOnChange>}/></div>;
  }
  const visibleEntries = entries.filter(e=>mode==="all"||(mode==="overview"?["DOCUMENT_REQUEST","QUESTION"].includes(e.kind):e.kind===(mode==="questions"?"QUESTION":"DOCUMENT_REQUEST")));
  const uploadForm = (
    <form className="space-y-2" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(async () => { const file = form.get("file"); if (!(file instanceof File) || !file.size) throw new Error("Select a PDF, JPEG or PNG."); const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())), b => b.toString(16).padStart(2, "0")).join(""); form.set("purchaseCandidateId", candidateId); form.set("type", "Other"); const key = requestKey(JSON.stringify({ candidateId, hash, replacement: form.get("replaceDocumentId"), name: file.name })); const response = await fetch("/api/documents", { method: "POST", headers: { "Idempotency-Key": key }, body: form }); const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Upload failed."); retry.current = null; setStatus("Uploaded into quarantine. Refresh status after the ordinary worker scans this version."); }); }}>
      <label className="block text-sm">Candidate document<input aria-label="Candidate document" className="block w-full" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required /></label>
      <label className="block text-sm">Upload context<select className="block border rounded p-2" name="replaceDocumentId"><option value="">New candidate document</option>{docs.map(d => <option key={d.id} value={d.id}>Replace {d.name} (retain version history)</option>)}</select></label>
      <Button busy={busy} type="submit">Upload to private quarantine</Button>
    </form>
  );
  return <div className="min-w-0 space-y-4 pt-1 [&_select]:w-full [&_select]:min-w-0 [&_select]:max-w-full">
    {mode==="documents" || mode==="all" ? <Disclosure title="Upload a document" detail="Private quarantine until reviewed">{uploadForm}</Disclosure> : null}
    {mode==="all" ? <Button variant="quiet" busy={busy} onClick={() => void run(async () => {})}>Refresh evidence status</Button> : null}
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    {status ? <p role="status" className="text-sm">{status}</p> : null}
    {mode==="overview"&&<SectionHeader title="Received documents" detail={loaded?String(docs.length):"Loading…"}/>}
    {mode==="documents" || mode==="questions" ? <GroupedList>{visibleEntries.map(entry => <Disclosure key={`${entry.id}:${entry.version}`} title={entry.body} detail={displayLabel(entry.state)}><EntryBody entry={entry} docs={docs} busy={busy} run={run} post={post} candidateId={candidateId} /></Disclosure>)}</GroupedList> : null}
    {(mode==="questions"||mode==="documents"?[]:docs).map(doc => <Disclosure key={doc.id} title={doc.name} detail={displayLabel(doc.reviewStatus)}><div className="space-y-4 text-sm"><p>Security scan · {doc.scanStatus === "clean" ? "No threats detected" : displayLabel(doc.scanStatus)}</p>
      <details><summary>Security & provenance</summary><Button variant="quiet" busy={busy} onClick={() => void run(async () => { const response = await fetch(`/api/documents/${doc.id}?metadata=true`, { cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Scan evidence unavailable."); setScan(JSON.stringify(body.data.scanEvidence, null, 2)); })}>Inspect scan evidence</Button></details>
      {doc.scanStatus === "clean" ? <form onSubmit={event => { event.preventDefault(); const category = new FormData(event.currentTarget).get("category"); void run(async () => { await post(`/api/documents/${doc.id}/review`, { action: "manual_confirm", documentVersion: doc.version, category }); setStatus("Category confirmed by you. This is not verification of the document or its contents."); }); }}><label>Manual category<select className="block border rounded p-2" name="category" defaultValue={doc.type}>{["Other", "Property info", "Sanction map", "Measurement", "Registry", "Loan agreement", "Receipt"].map(c => <option key={c}>{c}</option>)}</select></label><Button busy={busy} type="submit">Confirm category for v{doc.version}</Button></form> : <Button variant="quiet" busy={busy} onClick={() => void run(async () => { await post(`/api/documents/${doc.id}/process`, { stage: "scan", retryKey: requestKey(`scan:${doc.id}:${doc.version}`) }); })}>Request audited scan retry</Button>}
      {doc.versions.map(v => <div key={v.id} className="border-t pt-2"><p>v{v.version} · {v.version === doc.version ? "Current" : "Previous"} · {displayLabel(v.scanStatus)} · {displayLabel(v.reviewStatus)}</p>{v.scanStatus === "clean" && v.reviewStatus === "confirmed" ? <div className="flex gap-4"><a className="underline" target="_blank" rel="noreferrer" href={`/api/documents/${doc.id}?versionId=${v.id}`}>Preview v{v.version}</a><a className="underline" href={`/api/documents/${doc.id}?versionId=${v.id}&download=true`}>Download v{v.version}</a></div> : <p>Preview/download unavailable until this version passes scan and manual category confirmation.</p>}</div>)}
    </div></Disclosure>)}
    {scan ? <details open><summary>Recorded scanner evidence</summary><pre className="text-[12px] whitespace-pre-wrap break-all">{scan}</pre></details> : null}
    {mode==="overview"&&<SectionHeader title="Requests & questions" detail={`${entries.filter(e=>["DOCUMENT_REQUEST","QUESTION"].includes(e.kind)).length} records`}/>}
    {mode==="all"||mode==="overview"?<AnimatedList stagger={false}>{visibleEntries.map(entry => <Disclosure key={`${entry.id}:${entry.version}`} title={entry.body} detail={`${displayLabel(entry.kind)} · ${displayLabel(entry.state)}`}><EntryBody entry={entry} docs={docs} busy={busy} run={run} post={post} candidateId={candidateId} /></Disclosure>)}</AnimatedList>:null}
  </div>;
}

function EntryBody({ entry, docs, busy, run, post, candidateId }: { entry: Entry; docs: Doc[]; busy: boolean; run: (work: () => Promise<void>) => Promise<void>; post: (url: string, payload: Record<string, unknown>) => Promise<void>; candidateId: string }) {
  return <section className="space-y-4 text-sm"><p>Status: <StatusTransition statusKey={entry.state}>{displayLabel(entry.state)}</StatusTransition>. Not externally delivered or legally cleared.</p>
      <form className="space-y-2" onSubmit={event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); void run(() => post("/api/purchases/evidence", { ...data, candidateId, entryId: entry.id, version: entry.version })); }}>
        <label>Evidence action<select className="block border rounded p-2" name="action">{(entry.kind === "QUESTION" ? ["ANSWER", "RESOLVE", "REOPEN"] : ["RECEIVE", "REVIEW"]).map(action => <option key={action} value={action}>{displayLabel(action)}</option>)}</select></label>
        <label>Exact evidence version<select className="block border rounded p-2 w-full" name="documentVersionId"><option value="">No evidence reference (questions only)</option>{docs.flatMap(d => d.versions.map(v => <option key={v.id} value={v.id}>{d.name} v{v.version} · {displayLabel(v.scanStatus)} · {displayLabel(v.reviewStatus)}</option>))}</select></label>
        <label>Source assertion<select className="block border rounded p-2" name="source"><option value="BUYER_UPLOADED">Uploaded by me</option><option value="BUYER_REPORTED_SELLER">I say this came from the seller (not authenticated sharing)</option><option value="USER_NOTE">My note</option></select></label><label>Review or answer note<textarea className="block border rounded p-2 w-full" name="note" maxLength={2000} required /></label><Button type="submit" busy={busy}>Save evidence action</Button>
      </form>
      <details className="motion-expand"><summary>View activity</summary><div className="motion-expand__body"><div>{entry.events.map(e => <div key={e.id} className="border-t pt-2"><p>{displayLabel(e.action)} · {presentDate(e.createdAt, "datetime")} · {displayLabel(e.source)}</p><p>{e.note}</p>{e.evidence ? <p>Source v{e.evidence.version} · {e.evidence.current ? "Current" : "Previous"} · {e.evidence.available ? "Available for review" : "Not accessible for review"}</p> : null}</div>)}</div></div></details>
      </section>;
}

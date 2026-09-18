"use client";
import { useRef, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { Button, Surface } from "@/components/ui";

type RequestSummary = { id: string; kind: string; propertyId: string | null; status: string; createdAt: string; expiresAt: string | null; failureCode: string | null };
export function PrivacyRequests() {
  const { s } = useStore();
  const [kind, setKind] = useState("EXPORT_ACCOUNT");
  const [propertyId, setPropertyId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [rows, setRows] = useState<RequestSummary[]>([]);
  const [message, setMessage] = useState("Deletion remains request-only. A local account-owned records archive can be separately confirmed below. It excludes original file bytes, extracted/AI text, authentication secrets and other owners' shared records. It is not a complete statutory disclosure or a selected-document package.");
  const [busy, setBusy] = useState(false);
  const key = useRef<string | null>(null);
  async function load() {
    const response = await fetch("/api/privacy/requests", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load your privacy requests.");
    setRows((await response.json()).data.requests);
  }
  async function action(body?: object) {
    setBusy(true); setRows([]);
    try {
      if (body) {
        const response = await fetch("/api/privacy/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!response.ok) throw new Error(`Privacy request could not be recorded (${response.status}). No deletion was performed.`);
        setMessage("Request status recorded. No deletion was performed. Cancelling an export blocks subsequent downloads; the worker removes its artifact.");
      }
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Privacy controls unavailable."); }
    finally { setBusy(false); }
  }
  async function generate(id: string, form: HTMLFormElement) {
    setBusy(true);
    try {
      const expiry = String(new FormData(form).get("expiry"));
      const response = await fetch(`/api/privacy/exports/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true, scope: "account-owned-records-v1", expiresAt: new Date(expiry).toISOString() }) });
      if (!response.ok) throw new Error("Export was not queued. Check confirmation and choose an expiry between one minute and seven days ahead.");
      setMessage("Account records export queued. The local worker must generate it; refresh requests for progress. No original files or derived text are included."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export unavailable."); } finally { setBusy(false); }
  }
  return <Surface><h2 className="font-serif text-[18px]">Privacy requests</h2><p className="text-[14px]">Account-owned records v1 includes your profile, owned property/Construction records, financial records, document/version metadata and outgoing share scopes. It excludes original file bytes, parsed/OCR/AI output, authentication secrets and other owners’ shared records. This is not a complete statutory disclosure. Deletion remains request-only.</p><p className="text-[14px]" role="status">{message}</p>
    <form className="my-3 space-y-2" onSubmit={event => { event.preventDefault(); key.current ??= crypto.randomUUID(); void action({ kind, ...(kind === "DELETE_PROPERTY" ? { propertyId } : {}), confirmed, requestKey: key.current }); }}>
      <label className="block text-[14px]">Request type<select className="block w-full rounded border p-2" value={kind} onChange={event => { setKind(event.target.value); setConfirmed(false); key.current = null; }}><option value="EXPORT_ACCOUNT">Account data export request</option><option value="DELETE_ACCOUNT">Account deletion request</option><option value="DELETE_PROPERTY">Property deletion request</option></select></label>
      {kind === "DELETE_PROPERTY" && <label className="block text-[14px]">Property<select required value={propertyId} onChange={event => { setPropertyId(event.target.value); setConfirmed(false); key.current = null; }}><option value="">Choose a property</option>{s.properties.map(property => <option value={property.id} key={property.id}>{property.name}</option>)}</select></label>}
      <label className="block text-[14px]"><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> I am submitting a request, not authorizing immediate deletion or confirming export completion.</label>
      <Button disabled={busy || !confirmed} type="submit">Record privacy request</Button>
    </form>
    <Button variant="quiet" disabled={busy} onClick={() => void action()}>View my requests</Button>
    {rows.map(row => <div className="mt-2 text-[14px]" key={row.id}><p>{row.kind} · {row.status} · {new Date(row.createdAt).toLocaleString()}</p>{row.failureCode && <p>{row.failureCode}</p>}{row.expiresAt && <p>Download expiry: {new Date(row.expiresAt).toLocaleString()}</p>}
      {row.kind === "EXPORT_ACCOUNT" && row.status === "AWAITING_POLICY" && <form onSubmit={event => { event.preventDefault(); void generate(row.id, event.currentTarget); }}><label>Archive download expiry<input type="datetime-local" name="expiry" required className="block border" /></label><label><input type="checkbox" required /> I confirm generation of account-owned records v1 with the exclusions above.</label><Button disabled={busy}>Generate account records archive</Button></form>}
      {row.status === "READY" && <a href={`/api/privacy/exports/${row.id}`} className="underline">Download account records archive</a>}
      {["AWAITING_POLICY", "QUEUED", "PROCESSING", "READY", "FAILED"].includes(row.status) && <Button variant="quiet" disabled={busy} onClick={() => void action({ action: "cancel", id: row.id })}>Cancel request</Button>}</div>)}
  </Surface>;
}

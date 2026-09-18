"use client";
import { useState } from "react";
import { Button, Surface } from "@/components/ui";
type Rule = { id: string; version: number; revision: number; title: string; description: string; status: string; sourceName: string | null; reviewer: string | null; auditEvents: { id: string; action: string; createdAt: string }[] };
export function OperationsContent() {
  const [rules, setRules] = useState<Rule[]>([]), [message, setMessage] = useState("Publish only reviewed, authorized content. This workflow is not legal approval."), [busy, setBusy] = useState(false);
  async function act(body?: object) {
    setBusy(true);
    try {
      if (body) { const r = await fetch("/api/operations/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const result = await r.json(); if (!r.ok) throw new Error(result.error?.message || "Content change denied."); }
      const r = await fetch("/api/operations/content", { cache: "no-store" }); const result = await r.json(); if (!r.ok) throw new Error(result.error?.message || "Content access denied."); setRules(result.data); setMessage("Current revisions and audit loaded.");
    } catch (error) { setRules([]); setMessage(error instanceof Error ? error.message : "Content unavailable."); } finally { setBusy(false); }
  }
  return <Surface><h2>Content review</h2><p role="status">{message}</p><Button disabled={busy} onClick={() => void act()}>Load content queue</Button>
    <details><summary>Create a draft</summary><form onSubmit={event => { event.preventDefault(); const f = new FormData(event.currentTarget); void act({ action: "create", input: { stableKey: f.get("key"), title: f.get("title"), description: f.get("description"), category: "operator-entered", contentType: "explanation", effectiveFrom: f.get("effectiveFrom") } }); }}>
      <label>Stable key<input name="key" required maxLength={120} className="block border" /></label><label>Title<input name="title" required maxLength={200} className="block border" /></label><label>Content<textarea name="description" required maxLength={2000} className="block border" /></label><label>Effective from<input name="effectiveFrom" type="date" required className="block border" /></label><Button disabled={busy}>Create draft</Button>
    </form></details>
    {rules.map(rule => <article className="my-4 border-t pt-2" key={`${rule.id}:${rule.revision}`}><h3>{rule.title}</h3><p>Version {rule.version} · Revision {rule.revision} · {rule.status}</p><p>{rule.description}</p><p>Source: {rule.sourceName ?? "Missing"} · Reviewer: {rule.reviewer ?? "Missing"}</p>
      {["DRAFT", "IN_REVIEW"].includes(rule.status) && <form onSubmit={event => { event.preventDefault(); const f = new FormData(event.currentTarget); void act({ action: "edit", id: rule.id, revision: rule.revision, input: { title: f.get("title"), description: f.get("description") } }); }}><label>Draft title<input name="title" required defaultValue={rule.title} className="block border" /></label><label>Draft content<textarea name="description" required defaultValue={rule.description} className="block border" /></label><p>Content changes invalidate prior review and return this revision to draft.</p><Button disabled={busy}>Save draft changes</Button></form>}
      {["DRAFT", "IN_REVIEW"].includes(rule.status) && <form onSubmit={event => { event.preventDefault(); const f = new FormData(event.currentTarget); void act({ action: "edit", id: rule.id, revision: rule.revision, input: { sourceName: f.get("source"), sourceReference: { reference: f.get("reference") }, reviewer: f.get("reviewer"), reviewedAt: f.get("date") } }); }}>
        <label>Source name<input name="source" required defaultValue={rule.sourceName ?? ""} className="block border" /></label><label>Source reference<input name="reference" required className="block border" /></label><label>Reviewer<input name="reviewer" required defaultValue={rule.reviewer ?? ""} className="block border" /></label><label>Review date<input type="datetime-local" name="date" required className="block border" /></label><Button disabled={busy}>Record review evidence</Button>
      </form>}
      {(rule.status === "DRAFT" ? ["submit"] : rule.status === "IN_REVIEW" ? ["publish"] : rule.status === "PUBLISHED" ? ["retire", "expire"] : []).map(action => <Button variant="quiet" disabled={busy} key={action} onClick={() => void act({ action, id: rule.id, revision: rule.revision })}>{action}</Button>)}
      <details><summary>Audit history</summary>{rule.auditEvents.map(entry => <p key={entry.id}>{entry.action} · {entry.createdAt}</p>)}</details>
    </article>)}
  </Surface>;
}

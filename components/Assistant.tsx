"use client";
import { useState } from "react";
import { Send } from "lucide-react";

type Citation = { id: string; title: string; href: string; recordType: string; page?: number; chunk?: number };
type Message = { q: string; answer: string; citations: Citation[]; provider?: string };

export function Assistant({ propertyId }: { propertyId?: string | null }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<Message[]>([]);
  const ask = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true); setError(""); setQ("");
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, propertyId }) });
      const body = await response.json() as { data?: { answer: string; citations: Citation[]; providerEnvironment: string }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "The assistant could not answer.");
      setLog((current) => [...current, { q: text, answer: body.data!.answer, citations: body.data!.citations, provider: body.data!.providerEnvironment }]);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "The assistant could not answer."); }
    finally { setBusy(false); }
  };
  return (
    <div className="surface bg-white p-3">
      <p className="font-serif text-[16px]">Ask your passport</p>
      <p className="text-[13px] text-ink-muted mb-2">Authorized records only • read-only • every answer shows sources</p>
      <div className="space-y-2 max-h-72 overflow-auto">
        {!log.length && <p className="rounded-2xl bg-white border border-line text-[14px] px-3 py-2 text-ink-muted">Ask about pending obligations, maintenance spend, missing records, or an approved document excerpt.</p>}
        {log.map((m, i) => (
          <div key={i} className="space-y-1">
            <div className="ml-auto w-fit max-w-[90%] rounded-2xl bg-forest text-white text-[14px] px-3 py-2">{m.q}</div>
            <div className="w-fit max-w-[95%] rounded-2xl bg-white border border-line text-[14px] px-3 py-2 whitespace-pre-line">
              {m.answer}
              {m.citations.length ? <div className="mt-2 border-t border-line pt-1 text-[13px] text-ink-muted"><span>Sources: </span>{m.citations.map((source, index) => <span key={`${source.id}-${index}`}>{index ? " · " : ""}<a className="underline" href={source.href}>{source.title}{source.page ? ` p.${source.page}` : ""}</a></span>)}</div> : null}
              {m.provider ? <p className="mt-1 text-[12px] text-ink-muted">Provider boundary: {m.provider}</p> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 flex-wrap">{["Pending bills?", "Missing docs?", "Maintenance spend?", "Summarize registry"].map((chip) => <button key={chip} onClick={() => void ask(chip)} className="rounded-full border border-line bg-white px-2.5 py-1.5 text-[13px]">{chip}</button>)}</div>
      {error ? <p className="mt-2 text-[13px] text-red-700">{error}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        <input value={q} disabled={busy} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void ask(q)} placeholder={busy ? "Reading authorized records…" : "Type a question…"} className="h-10 flex-1 rounded-full border border-line bg-white px-3 text-[13px] outline-none" />
        <button disabled={busy} onClick={() => void ask(q)} className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

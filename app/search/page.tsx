"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Disclosure, GroupedList, ListRow, SectionHeader } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { useSearchParams } from "next/navigation";
import { PageHead } from "@/components/ui";

type Result = { kind: string; id: string; title: string; subtitle?: string; category?: string | null; sourceType?: string; snippet?: string; href: string; propertyName?: string };
type SearchResponse = { mode: "owner" | "shared"; counts: { properties: number; documents: number; records: number }; properties: Result[]; documents: Result[]; records: Result[] };

function Inner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [propertyId, setPropertyId] = useState(params.get("propertyId") || "");
  const [documentType, setDocumentType] = useState(params.get("documentType") || "");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setError("");
      void fetch(`/api/search?q=${encodeURIComponent(q)}${propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : ""}${documentType ? `&documentType=${encodeURIComponent(documentType)}` : ""}`, { cache: "no-store" }).then(async (response) => {
        const body = await response.json() as { data?: SearchResponse; error?: { message?: string } };
        if (!response.ok || !body.data) throw new Error(body.error?.message || "Search could not be loaded.");
        setData(body.data);
      }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Search could not be loaded."));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [q, propertyId, documentType]);
  const all = [...(data?.properties || []), ...(data?.documents || []), ...(data?.records || [])];
  return <div><PageHead title="Search" /><div className="space-y-3 pb-6">
    <div className="motion-search">
      <div className="motion-search__field shadow-pill">
        <SearchIcon size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />
        <input ref={inputRef} aria-label="Search your records" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Search a property, document, obligation, maintenance…" />
        {q ? <button type="button" aria-label="Clear search" className="icon-button motion-pressable !h-9 !w-9" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(""); inputRef.current?.focus(); }}><X size={16} /></button> : null}
      </div>
      <button type="button" className={`motion-search__cancel motion-pressable${focused || q ? " is-visible" : ""}`} onClick={() => { setQ(""); inputRef.current?.blur(); }} tabIndex={focused || q ? 0 : -1}>Cancel</button>
    </div>
    <Disclosure title="Search filters"><div className="grid grid-cols-2 gap-2"><input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="Property ID filter" aria-label="Property ID filter" className="h-10 rounded-xl border border-line px-3 text-[14px]" /><input value={documentType} onChange={(e) => setDocumentType(e.target.value)} placeholder="Document type filter" aria-label="Document type filter" className="h-10 rounded-xl border border-line px-3 text-[14px]" /></div></Disclosure>
    {error ? <p className="rounded-2xl bg-[#fff5f5] p-3 text-[14px] text-red-700">{error}</p> : null}
    {!q.trim() && !error ? <p className="surface bg-white p-4 text-[14px] text-ink-muted">Find a property, document, bill or maintenance record. Only records you can access appear here.</p> : null}
    {q.trim() && !error && data && !all.length ? <p className="surface bg-white p-4 text-[14px] text-ink-muted">No matching records. Try a different name or adjust your filters.</p> : null}
    {([['Properties', data?.properties || []], ['Documents', data?.documents || []], ['Bills', (data?.records || []).filter((item) => item.kind === "obligation")], ['Maintenance', (data?.records || []).filter((item) => item.kind === "maintenance")]] as Array<[string, Result[]]>).map(([heading, rows]) => rows.length ? <section key={heading} className="space-y-2 motion-results"><SectionHeader title={heading} detail={String(rows.length)}/><GroupedList><AnimatedList stagger={false}>{rows.map(item=><ListRow key={`${item.kind}-${item.id}`} href={item.href} title={item.title} detail={item.propertyName || item.category || undefined}/>)}</AnimatedList></GroupedList></section> : null)}
  </div></div>;
}
export default function SearchPage() { return <Suspense><Inner /></Suspense>; }

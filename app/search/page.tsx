"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { GroupedList, ListRow, SectionHeader, dueCopy, displayLabel } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { useSearchParams } from "next/navigation";
import { PageHead } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";
import Image from "next/image";
import Link from "next/link";
import { Scene, SCENE, placeImage } from "@/components/PlaceCover";

type Result = { kind: string; id: string; title: string; subtitle?: string; category?: string | null; sourceType?: string; snippet?: string; href: string; propertyName?: string };
type SearchResponse = { mode: "owner" | "shared"; counts: { properties: number; documents: number; records: number }; properties: Result[]; documents: Result[]; records: Result[] };

function resultDetail(item: Result) {
  const raw = item.propertyName || item.subtitle || item.category || "";
  if (!raw) return undefined;
  const parts = raw.split(" · ").flatMap((part) => {
    if (/financial/i.test(part)) return [];
    const due = /^due\s+(\d{4}-\d{2}-\d{2})/i.exec(part);
    return [due ? dueCopy(due[1]) : part];
  });
  if (parts.length && /^(villa|flat|plot|commercial|agri)$/i.test(parts[0])) parts[0] = displayLabel(parts[0]);
  return parts.join(" · ");
}

function Inner() {
  const { s } = useStore();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [propertyId, setPropertyId] = useState(params.get("propertyId") || "");
  const [documentType, setDocumentType] = useState(params.get("documentType") || "");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const papers = s.docs.filter((doc) => !doc.deletedAt && !doc.archivedAt);
  const categories = [...new Set(papers.map((doc) => doc.type))].sort((a, b) => a.localeCompare(b));
  const ideas = [...s.properties.map((property) => property.area), ...categories].filter((value, index, list) => value && list.indexOf(value) === index).slice(0, 6);
  const browsing = !q.trim();

  useEffect(() => {
    if (!q.trim()) {
      setData(null);
      setError("");
      setPending(false);
      return;
    }
    let cancelled = false;
    setPending(true);
    const timer = window.setTimeout(() => {
      setError("");
      void fetch(`/api/search?q=${encodeURIComponent(q)}${propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : ""}${documentType ? `&documentType=${encodeURIComponent(documentType)}` : ""}`, { cache: "no-store" }).then(async (response) => {
        const body = await response.json() as { data?: SearchResponse; error?: { message?: string } };
        if (!response.ok || !body.data) throw new Error(body.error?.message || "Search could not be loaded.");
        if (!cancelled) setData(body.data);
      }).catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Search could not be loaded."); }).finally(() => { if (!cancelled) setPending(false); });
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [q, propertyId, documentType]);

  const scopedProperties = s.properties.filter((property) => !propertyId || property.id === propertyId);
  const scopedPapers = papers
    .filter((doc) => (!propertyId || doc.propertyId === propertyId) && (!documentType || doc.type === documentType))
    .slice()
    .sort((a, b) => (b.uploadDate || "").localeCompare(a.uploadDate || ""));
  const comingUp = s.bills
    .filter((bill) => bill.status !== "paid" && (!propertyId || bill.propertyId === propertyId))
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const all = [...(data?.properties || []), ...(data?.documents || []), ...(data?.records || [])];

  return <div><PageHead title="Explore" /><div className="space-y-3 pb-6">
    <div className="motion-search">
      <div className="motion-search__field shadow-pill">
        <SearchIcon size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />
        <input ref={inputRef} aria-label="Search your records" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Search a property, location, document..." />
        {q ? <button type="button" aria-label="Clear search" className="icon-button motion-pressable !h-9 !w-9" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(""); inputRef.current?.focus(); }}><X size={16} /></button> : null}
      </div>
      <button type="button" className={`motion-search__cancel motion-pressable${focused || q ? " is-visible" : ""}`} onClick={() => { setQ(""); inputRef.current?.blur(); }} tabIndex={focused || q ? 0 : -1}>Cancel</button>
    </div>
    <div className="explore-filters">
      <label>Property
        <select aria-label="Property" value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
          <option value="">All properties</option>
          {s.properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
        </select>
      </label>
      <label>Paper
        <select aria-label="Paper category" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
          <option value="">All papers</option>
          {categories.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>
    </div>
    {error ? <p className="rounded-2xl bg-[#fff5f5] p-3 text-[14px] text-red-700">{error}</p> : null}
    {browsing && !error ? (
      <>
        {browsing && !propertyId && !documentType ? <Scene src={SCENE.papers}><p>Explore</p><strong>Find a property, a paper, or a date</strong></Scene> : null}
        {ideas.length ? <div className="explore-ideas" aria-label="Try searching">{ideas.map((idea) => <button key={idea} type="button" onClick={() => setQ(idea)}>{idea}</button>)}</div> : null}
        {scopedProperties.length ? <section className="space-y-2"><SectionHeader title="Properties" detail={String(scopedProperties.length)} /><div className="paper-stack">{scopedProperties.map((property) => <Link key={property.id} href={`/property/${property.id}`} className="explore-place motion-pressable"><span className="explore-place__photo"><Image src={placeImage(property)} alt="" fill sizes="92px" style={{ objectFit: "cover" }} /></span><span><strong>{property.name}</strong><span>{displayLabel(property.type)} · {property.area}{property.city ? `, ${property.city}` : ""}</span></span></Link>)}</div></section> : null}
        {scopedPapers.length ? <section className="space-y-2"><SectionHeader title="Papers" detail={String(scopedPapers.length)} /><div className="paper-stack">{scopedPapers.slice(0, 6).map((doc) => {
          const property = s.properties.find((item) => item.id === doc.propertyId);
          return <Link key={doc.id} href={`/property/${doc.propertyId}/documents/${doc.id}`} className="paper-card motion-pressable"><span className="paper-card__thumb"><Image src={SCENE.papers} alt="" fill sizes="76px" style={{ objectFit: "cover" }} /></span><span className="paper-card__body"><strong>{doc.displayName || doc.name}</strong><span>{doc.type}{property ? ` · ${property.name}` : ""}</span></span><span className="paper-card__go" aria-hidden="true">→</span></Link>;
        })}{scopedPapers.length > 6 ? <ListRow href="/vault" title="All papers" detail={`${scopedPapers.length} in the vault`} /> : null}</div></section> : null}
        {comingUp.length && !documentType ? <section className="space-y-2"><SectionHeader title="Coming up" /><GroupedList><AnimatedList stagger={false}>{comingUp.map((bill) => {
          const property = s.properties.find((item) => item.id === bill.propertyId);
          return <ListRow key={bill.id} href={`/property/${bill.propertyId}?tab=bills`} title={bill.title} detail={`${property?.name || "Property"} · ${dueCopy(bill.dueDate)}`} />;
        })}</AnimatedList></GroupedList></section> : null}
        {!scopedProperties.length && !scopedPapers.length ? <p className="surface bg-white p-4 text-[14px] text-ink-muted">Nothing in this view yet.</p> : null}
      </>
    ) : null}
    {q.trim() && pending && !data && !error ? <p className="px-1 text-[14px] text-ink-muted">Looking through your records…</p> : null}
    {q.trim() && !error && data && !all.length ? <p className="surface bg-white p-4 text-[14px] text-ink-muted">Nothing matches that. Try a property, a locality, or a paper such as insurance.</p> : null}
    {q.trim() ? ([[ "Properties", data?.properties || [] ], [ "Papers", data?.documents || [] ], [ "Bills", (data?.records || []).filter((item) => item.kind === "obligation") ], [ "Build", (data?.records || []).filter((item) => item.kind.startsWith("construction")) ], [ "Maintenance", (data?.records || []).filter((item) => item.kind === "maintenance") ]] as Array<[string, Result[]]>).map(([heading, rows]) => rows.length ? <section key={heading} className="space-y-2 motion-results"><SectionHeader title={heading} detail={String(rows.length)} /><GroupedList><AnimatedList stagger={false}>{rows.map((item) => <ListRow key={`${item.kind}-${item.id}`} href={item.href} title={item.title} detail={resultDetail(item)} />)}</AnimatedList></GroupedList></section> : null) : null}
  </div></div>;
}

export default function SearchPage() { return <Suspense><Inner /></Suspense>; }

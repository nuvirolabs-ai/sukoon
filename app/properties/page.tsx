"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { Button, EmptyState, ErrorState, PageHead } from "@/components/ui";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { displayLabel, dueCopy, presentName } from "@/components/consumer";
import { inr } from "@/lib/utils";
import type { Property } from "@/lib/types";
import { usePropertyComposition } from "@/components/PropertyComposition";
import { NextBar, Scene, placeImage } from "@/components/PlaceCover";
import Image from "next/image";

function ListInner() {
  const { s, replace } = useStore();
  const composition = usePropertyComposition();
  const router = useRouter();
  const sp = useSearchParams();
  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const type = sp.get("type");
  const city = sp.get("city");
  const props = s.properties.filter((p) => (!type || p.type === type) && (!city || p.city.toLowerCase() === city.toLowerCase()));
  useEffect(() => {
    if (!showArchived) return;
    let cancelled = false;
    void fetch("/api/properties?includeArchived=true", { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as { data?: { properties: Property[] }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Archived passports could not be loaded.");
      if (!cancelled) setArchived(body.data.properties.filter((property) => property.status === "archived"));
    }).catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Archived passports could not be loaded."); });
    return () => { cancelled = true; };
  }, [showArchived]);

  const restore = async (property: Property) => {
    setRestoring(property.id);
    setError("");
    try {
      const response = await fetch(`/api/properties/${property.id}/restore`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: property.version ?? 0 }) });
      const body = await response.json() as { data?: { state: typeof s; version: number }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Passport could not be restored.");
      replace(body.data.state, body.data.version);
      setArchived((items) => items.filter((item) => item.id !== property.id));
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Passport could not be restored."); }
    finally { setRestoring(null); }
  };
  return (
    <div>
      <PageHead title="Properties" sub={`${props.length} ${props.length === 1 ? "property" : "properties"}`} right={<Link href="/property/new" className="motion-pressable inline-flex min-h-11 items-center rounded-full bg-forest text-white text-[14px] px-4 py-2">Add</Link>} />
      <div className="space-y-3">
        <AnimatedList className="space-y-3">
        {props.map((p) => {
          const summary = composition.properties.find((x) => x.id === p.id);
          const docs = s.docs.filter((d) => d.propertyId === p.id).length;
          const nextBill = s.bills.filter((b) => b.propertyId === p.id && b.status !== "paid").slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
          const project = summary?.projects[0];
          return (
            <Link key={p.id} href={`/property/${p.id}`} className="place-card motion-pressable route-continuity">
              <div className="place-card__photo">
                <Image src={placeImage(p)} alt="" fill sizes="390px" style={{ objectFit: "cover" }} />
                <span className="place-card__chip">{displayLabel(p.type)}</span>
              </div>
              <div className="place-card__body">
                <strong>{p.name}</strong>
                <p className="place-card__meta">{presentName(p.area)}{p.city ? `, ${p.city}` : ""}{p.purchaseValue ? ` · ${inr(p.purchaseValue)}` : ""}</p>
                <p className="place-card__meta">{docs} {docs === 1 ? "paper" : "papers"}{nextBill ? ` · ${nextBill.title} · ${dueCopy(nextBill.dueDate)}` : ""}{project ? ` · ${project.name}` : ""}</p>
                <span className="place-card__next">{project ? `Open · ${project.name}` : "Open this property"}</span>
              </div>
            </Link>
          );
        })}
        </AnimatedList>
        {!props.length && type === "commercial" ? <div className="space-y-3 pb-next"><Scene src="/places/place-house.png"><p>Commercial</p><strong>No commercial property yet</strong></Scene><NextBar kicker="On this account" title="A house, a flat, and a plot in Indore" href="/properties" action="See them" /></div> : !props.length ? <EmptyState title={type || city ? "No matching properties" : "No properties yet"} detail={type || city ? "Nothing in your records matches this filter." : "Add a property passport. Nothing is created until you do."} action={!type && !city ? <Button onClick={() => router.push("/property/new")}>Add property</Button> : <Link href="/properties" className="inline-flex min-h-11 items-center text-[15px] underline">All properties</Link>} /> : null}
        {error ? <ErrorState message={error} /> : null}
        <button type="button" onClick={() => setShowArchived((value) => !value)} className="min-h-11 text-sm text-ink-muted">{showArchived ? "Hide archived" : "Show archived"}</button>
        {showArchived && <div className="space-y-2"><p className="text-[12px] text-ink-muted">Archived</p>{archived.map((property) => <div key={property.id} className="surface bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[17px] font-medium">{property.name}</p><p className="text-[13px] text-ink-muted">{property.area}, {property.city}</p></div><Button variant="secondary" busy={restoring === property.id} onClick={() => void restore(property)}>Restore</Button></div></div>)}{!archived.length ? <p className="text-[14px] text-ink-muted">None archived.</p> : null}</div>}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return <Suspense><ListInner /></Suspense>;
}

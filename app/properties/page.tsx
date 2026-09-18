"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { Button, EmptyState, ErrorState, PageHead } from "@/components/ui";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { StatusTransition } from "@/components/motion/StatusTransition";
import { healthFor } from "@/lib/health";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { displayLabel, presentName } from "@/components/consumer";
import { inr } from "@/lib/utils";
import type { Property } from "@/lib/types";
import { usePropertyComposition } from "@/components/PropertyComposition";

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
  const props = type ? s.properties.filter((p) => p.type === type) : s.properties;
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
          const h = healthFor(p.id, s);
          const summary = composition.properties.find((x) => x.id === p.id);
          const docs = s.docs.filter((d) => d.propertyId === p.id).length;
          const due = s.bills.filter((b) => b.propertyId === p.id && b.status !== "paid").length;
          const readiness = (summary?.readiness.assessment ?? h.assessment) === "NOT_ASSESSED" ? "Not assessed" : `${summary?.readiness.score ?? h.score}% ready`;
          const project = summary?.projects[0];
          return (
            <Link key={p.id} href={`/property/${p.id}`} className="block surface property-card p-5 motion-pressable route-continuity">
              <div className="flex gap-3 items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-[18px] font-medium leading-snug min-w-0">{p.name}</p>
                  <p className="mt-1 text-[13px] text-ink-muted">{displayLabel(p.type)} · {presentName(p.area)}</p>
                  {p.purchaseValue ? <p className="mt-3 text-[17px] tracking-tight">{inr(p.purchaseValue)} <span className="text-[13px] text-ink-muted font-normal">purchase value</span></p> : null}
                  <p className="mt-2 text-[13px] text-ink-muted">{docs} documents{summary ? ` · ${summary.upcoming.length} upcoming` : due ? ` · ${due} upcoming` : ""}{summary?.records.openMaintenance ? ` · ${summary.records.openMaintenance} maintenance` : ""}</p>
                  <p className="mt-2 text-[13px] text-forest"><StatusTransition statusKey={readiness}>{readiness}</StatusTransition></p>
                  {project ? <p className="mt-3 rounded-xl bg-mint/40 px-3 py-2 text-[13px] text-forest">Active build · {project.name}</p> : null}
                </div>
                <span aria-hidden="true" className="text-ink-muted text-xl leading-none mt-1">›</span>
              </div>
            </Link>
          );
        })}
        </AnimatedList>
        {!props.length && <EmptyState title="No properties yet" detail="Add a property passport. Nothing is created until you do." action={!type ? <Button onClick={() => router.push("/property/new")}>Add property</Button> : undefined} />}
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

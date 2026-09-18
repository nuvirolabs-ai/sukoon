"use client";

import { useEffect, useState } from "react";
import { GroupedList, ListRow, displayLabel, shortDate } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { EmptyState, ErrorState, PageHead } from "@/components/ui";
import { ListSkeleton } from "@/components/motion/Skeleton";

type SharedProperty = { property: { id: string; name: string; type: string; city: string; area: string; address: string }; shareId: string; role: string; expiresAt: string };
export default function SharedWithMePage() {
  const [items, setItems] = useState<SharedProperty[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => { void fetch("/api/shared/properties", { cache: "no-store" }).then(async (response) => { const body = await response.json() as { data?: { properties: SharedProperty[] }; error?: { message?: string } }; if (!response.ok || !body.data) throw new Error(body.error?.message || "Shared properties could not be loaded."); setItems(body.data.properties); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Shared properties could not be loaded.")).finally(() => setLoading(false)); }, 0); return () => window.clearTimeout(timer); }, []);
  return <div><PageHead title="Shared with me" /><div className="space-y-3 pb-6">{loading ? <ListSkeleton rows={2} /> : null}{error ? <ErrorState message={error} /> : null}{!loading && !error && !items.length ? <EmptyState title="Nothing shared with you" detail="When an owner shares a property with you, it will appear here." /> : null}<GroupedList><AnimatedList>{items.map((item) => <ListRow key={item.shareId} href={`/shared/${item.property.id}`} title={item.property.name} detail={`${displayLabel(item.role)} · ${item.property.area}, ${item.property.city} · Until ${shortDate(item.expiresAt)}`}/>)}</AnimatedList></GroupedList></div></div>;
}

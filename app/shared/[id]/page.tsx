"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Disclosure, GroupedList, ListRow, SectionHeader, displayLabel, dueCopy } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { ListSkeleton } from "@/components/motion/Skeleton";
import { useParams } from "next/navigation";
import { ErrorState, PageHead } from "@/components/ui";

export default function SharedPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch(`/api/shared/properties/${id}`, { cache: "no-store" }).then(async (response) => {
        const body = await response.json() as { data?: Record<string, unknown>; error?: { message?: string } };
        if (!response.ok || !body.data) throw new Error(body.error?.message || "Shared property is no longer available.");
        setData(body.data);
      }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Shared property is no longer available."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id]);
  if (!data && !error) return <div className="pt-6"><PageHead title="Shared property" sub="Loading shared records" /><ListSkeleton rows={3} /></div>;
  if (error) return <div className="pt-6"><ErrorState message={error} /><Link href="/shared" className="text-[15px] inline-flex min-h-11 items-center">Back to Shared with me</Link></div>;
  const property = data?.property as { name: string; type: string; area: string; city: string; address: string };
  const documents = Array.isArray(data?.documents) ? data.documents as Array<{ id: string; name: string; type: string }> : null;
  const bills = Array.isArray(data?.bills) ? data.bills as Array<{ label: string; dueDate: string }> : null;
  return (
    <div>
      <PageHead title={property.name} sub="Shared with you" backHref="/shared" backLabel="Shared with me" />
      <div className="space-y-4 pb-6">
        <p className="text-[15px] text-ink-muted">{displayLabel(property.type)} · {property.area}, {property.city}</p>
        <Disclosure title="Property details"><p>{property.address}</p></Disclosure>
        {documents ? (
          <section>
            <SectionHeader title="Shared documents" detail={String(documents.length)} />
            <GroupedList>
              <AnimatedList stagger={false}>
                {documents.map((doc) => <ListRow key={doc.id} title={doc.name} detail={doc.type} href={`/shared/${id}/documents/${doc.id}`} />)}
              </AnimatedList>
            </GroupedList>
          </section>
        ) : null}
        {bills ? (
          <section>
            <SectionHeader title="Shared bills" />
            <GroupedList>
              {bills.map((bill) => <ListRow key={bill.label + bill.dueDate} title={bill.label} detail={dueCopy(bill.dueDate)} />)}
            </GroupedList>
          </section>
        ) : null}
        <Link href="/shared" className="text-[14px] underline">Back to Shared with me</Link>
      </div>
    </div>
  );
}

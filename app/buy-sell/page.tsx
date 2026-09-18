"use client";
import { useEffect, useState } from "react";
import { GroupedList, ListRow, SectionHeader } from "@/components/consumer";
import { EmptyState, PageHead } from "@/components/ui";

type Content = { slug: string; title: string; summary: string; sourceName: string; reviewedAt: string };
export default function BuySell() {
  const [education, setEducation] = useState<Content[]>([]);
  useEffect(() => { void fetch("/api/education", { cache: "no-store" }).then(async (response) => { const body = await response.json() as { data?: { education: Content[] } }; if (response.ok && body.data) setEducation(body.data.education); }); }, []);
  return (
    <div>
      <PageHead title="Buy / Sell" />
      <div className="space-y-6 pb-6">
        <GroupedList>
          <ListRow href="/buy-sell/purchases" title="Purchase workspaces" detail="Private buying journeys" />
        </GroupedList>
        <section>
          <SectionHeader title="Guides" />
          {education.length ? (
            <GroupedList>
              {education.map((row) => <ListRow key={row.slug} href={`/guides/${row.slug}`} title={row.title} detail={row.summary} />)}
            </GroupedList>
          ) : (
            <EmptyState title="No current guides" detail="Reviewed buyer education will appear here when published." />
          )}
        </section>
        <EmptyState title="Marketplace not connected" detail="Sukoon does not publish listings or process a sale. Private workspaces stay separate from any public listing." />
      </div>
    </div>
  );
}

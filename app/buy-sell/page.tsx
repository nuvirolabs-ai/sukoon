"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GroupedList, ListRow, SectionHeader } from "@/components/consumer";
import { EmptyState, PageHead } from "@/components/ui";
import { NextBar, Scene } from "@/components/PlaceCover";

type Content = { slug: string; title: string; summary: string; sourceName: string; reviewedAt: string };
export default function BuySell() {
  const [education, setEducation] = useState<Content[]>([]);
  useEffect(() => { void fetch("/api/education", { cache: "no-store" }).then(async (response) => { const body = await response.json() as { data?: { education: Content[] } }; if (response.ok && body.data) setEducation(body.data.education); }); }, []);
  return (
    <div>
      <PageHead title="Buy / Sell" />
      <div className="space-y-6 pb-6 pb-next">
        <Scene src="/places/place-flat.png"><p>Private buying</p><strong>A purchase stays with you</strong></Scene>
        <Link href="/buy-sell/purchases" className="guided-home-next scene-next block">
          <p className="guided-eyebrow">Next</p>
          <h2>Open a private purchase</h2>
          <p>A workspace stays on this account. Sukoon does not publish a listing or take a payment.</p>
          <span className="primary-disclosure">Open purchases <span aria-hidden="true">→</span></span>
        </Link>
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
        <p className="next-quiet">Public listings are off. Nothing here is a marketplace or a checkout.</p>
        <NextBar kicker="Next" title="Purchase workspaces" href="/buy-sell/purchases" action="Open" />
      </div>
    </div>
  );
}

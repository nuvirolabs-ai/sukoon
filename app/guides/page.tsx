"use client";
import { useEffect, useState } from "react";
import { GroupedList, ListRow } from "@/components/consumer";
import { EmptyState, PageHead } from "@/components/ui";

type Content = { slug: string; title: string; summary: string; sourceName: string; reviewer: string; reviewedAt: string; effectiveFrom: string; expiresAt: string | null };
export default function Guides() {
  const [rows, setRows] = useState<Content[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { void fetch("/api/education", { cache: "no-store" }).then(async (response) => { const body = await response.json() as { data?: { education: Content[] }; error?: { message?: string } }; if (!response.ok || !body.data) throw new Error(body.error?.message || "Education could not be loaded."); setRows(body.data.education); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Education could not be loaded.")); }, []);
  return (
    <div>
      <PageHead title="Guides" sub="Reviewed information only" />
      <div className="space-y-4 pb-6">
        {error ? <p className="text-[14px] text-red-700">{error}</p> : null}
        {rows.length ? (
          <GroupedList>
            {rows.map((row) => <ListRow key={row.slug} href={`/guides/${row.slug}`} title={row.title} detail={row.summary} />)}
          </GroupedList>
        ) : !error ? (
          <EmptyState title="No current guides" detail="Unpublished and expired content stays hidden." />
        ) : null}
      </div>
    </div>
  );
}

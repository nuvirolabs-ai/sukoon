"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/ui";
import { presentDate } from "@/lib/ui-content";

type Content = { title: string; summary: string; body: string[]; sourceName: string; sourceReference: unknown; reviewer: string; reviewedAt: string; effectiveFrom: string; expiresAt: string | null };
export default function GuidePost() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { if (!slug) return; void fetch(`/api/education/${encodeURIComponent(slug)}`, { cache: "no-store" }).then(async (response) => { const body = await response.json() as { data?: { content: Content }; error?: { message?: string } }; if (!response.ok || !body.data) throw new Error(body.error?.message || "Current education was not found."); setContent(body.data.content); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Current education was not found.")); }, [slug]);
  if (error) return <div className="p-6 text-sm">{error} <Link href="/guides" className="underline">All guides</Link></div>;
  if (!content) return <div className="p-6 text-sm text-ink-muted">Loading current education…</div>;
  return <div><PageHead title={content.title} sub={content.summary} /><div className="space-y-3 pb-6"><div className="surface bg-white p-4 text-[14px] text-ink-muted">Source: {content.sourceName} · reviewed {presentDate(content.reviewedAt, "long")}</div>{content.body.map((line, index) => <p key={index} className="surface bg-white p-4 text-[15px] leading-6">{line}</p>)}<Link href="/guides" className="flex h-11 items-center justify-center rounded-full border border-line text-[15px]">All guides</Link></div></div>;
}

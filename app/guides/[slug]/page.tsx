"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/ui";
import { presentDate } from "@/lib/ui-content";
import { NextBar, Scene, SCENE } from "@/components/PlaceCover";

type Content = { title: string; summary: string; body: string[]; sourceName: string; sourceReference: unknown; reviewer: string; reviewedAt: string; effectiveFrom: string; expiresAt: string | null };
export default function GuidePost() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { if (!slug) return; void fetch(`/api/education/${encodeURIComponent(slug)}`, { cache: "no-store" }).then(async (response) => { const body = await response.json() as { data?: { content: Content }; error?: { message?: string } }; if (!response.ok || !body.data) throw new Error(body.error?.message || "Current education was not found."); setContent(body.data.content); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Current education was not found.")); }, [slug]);
  if (error) return <div className="p-6 text-sm">{error} <Link href="/guides" className="underline">All guides</Link></div>;
  if (!content) return <div className="p-6 text-sm text-ink-muted">Loading current education…</div>;
  const next = slug?.includes("vault") ? { href: "/vault", title: "Open your vault", action: "Open" } : slug?.includes("construction") ? { href: "/construction", title: "Open the build", action: "Open" } : { href: "/properties", title: "Open your properties", action: "Open" };
  return (
    <div>
      <PageHead title={content.title} sub={content.summary} backHref="/guides" backLabel="Guides" />
      <div className="space-y-3 pb-6">
        <Scene src={SCENE.papers}><p>Guide</p><strong>Read it, then open the record</strong></Scene>
        <p className="next-quiet">How Sukoon works. This is not legal, tax, or circle-rate advice. Source: {content.sourceName} · reviewed {presentDate(content.reviewedAt, "long")}</p>
        <article className="guide-article">
          {content.body.map((line, index) => <p key={index}>{line}</p>)}
        </article>
        <Link href="/guides" className="back-pill">All guides</Link>
        <NextBar kicker="Use this" title={next.title} href={next.href} action={next.action} />
      </div>
    </div>
  );
}

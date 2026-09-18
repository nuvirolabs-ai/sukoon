"use client";
import Link from "next/link";
import { Search, Bell, UserRound, Files, Hammer, House, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { DevAccountHint, GroupedList, ListRow, SectionHeader, activityTitle, attentionTitle, dueCopy, shortDate } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { HomeSkeleton } from "@/components/motion/Skeleton";
import { StatusTransition } from "@/components/motion/StatusTransition";
import { dayGreeting, displayLabel, formatPaiseCompact, presentName } from "@/lib/ui-content";
import { inr } from "@/lib/utils";

type HomeData = {
  mode: string;
  summary: { propertyCount: number; portfolioValuePaise?: string; pendingDocumentReview?: number };
  attention: Array<{ type: string; id: string; title: string; detail: string; href: string; date: string; amountPaise?: string }>;
  activity: Array<{ id: string; title: string; detail?: string; date: string; propertyId: string }>;
};
type Project = { id: string; name: string; status: string; archivedAt?: string; progressPercent: number; currentStage?: { name: string } | null };
type Purchase = { id: string; name: string; candidates: Array<{ name: string; stage: string }> };

export default function HomePage() {
  const { s } = useStore();
  const [home, setHome] = useState<HomeData | null>(null);
  const [projectRows, setProjects] = useState<Project[] | null>(null);
  const [purchaseRows, setPurchases] = useState<Purchase[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/home", { cache: "no-store", signal: controller.signal }).then(async (r) => {
      const b = await r.json();
      if (!r.ok) throw Error(b.error?.message || "Home unavailable");
      setHome(b.data);
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    fetch("/api/construction", { cache: "no-store", signal: controller.signal }).then(async (r) => {
      if (r.ok) {
        const b = await r.json();
        setProjects(b.data.filter((p: Project) => !p.archivedAt && !["COMPLETED", "CANCELLED"].includes(p.status)));
      }
    }).catch(() => {});
    fetch("/api/purchases", { cache: "no-store", signal: controller.signal }).then(async (r) => {
      if (r.ok) {
        const b = await r.json();
        setPurchases(b.data);
      }
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  const project = projectRows?.[0];
  const purchase = purchaseRows?.[0];
  const ownerName = s.properties.find((p) => p.ownerName)?.ownerName?.split(" ")[0];
  const activeProperty = s.properties.find((property) => property.status !== "archived") || s.properties[0];
  const paperToReview = s.docs.find((document) => document.propertyId === activeProperty?.id && document.scanStatus === "clean" && document.reviewStatus !== "confirmed" && !document.deletedAt && !document.archivedAt);
  const nextAction = home?.mode === "shared"
    ? { title: "See shared records", detail: "Open the property and documents shared with you", href: "/shared", label: "View shared records" }
    : paperToReview
      ? { title: "Finish a paper", detail: `${presentName(paperToReview.displayName || paperToReview.name)} needs your review`, href: `/property/${paperToReview.propertyId}/documents/${paperToReview.id}`, label: "Review this paper" }
      : activeProperty
        ? { title: "Keep your records together", detail: `${presentName(activeProperty.name)} · papers, bills and more`, href: `/property/${activeProperty.id}?tab=vault`, label: "Open documents" }
        : { title: "Start your property record", detail: "Add a property before adding papers", href: "/property/new", label: "Add a property" };
  const loaded = home !== null && projectRows !== null && purchaseRows !== null;
  if (!loaded && !error) return <HomeSkeleton />;
  const modules = [
    { title: "Vault", href: "/vault", state: `${s.docs.length} documents`, detail: home?.summary.pendingDocumentReview ? `${home.summary.pendingDocumentReview} needs review` : "All reviewed", Icon: Files },
    { title: "Construction", href: project ? `/construction/${project.id}` : "/construction", state: presentName(project?.name || "No active build"), detail: project ? `${project.currentStage?.name || displayLabel(project.status)} · ${project.progressPercent}%` : "Plans and materials", Icon: Hammer },
    { title: "Buy / Sell", href: purchase ? "/buy-sell/purchases" : "/buy-sell", state: presentName(purchase?.candidates[0]?.name || purchase?.name || "No workspace yet"), detail: purchase?.candidates[0] ? displayLabel(purchase.candidates[0].stage) : "Private buying", Icon: House },
    { title: "Updates", href: "/updates", state: "Recent activity", detail: `${s.timeline.length} events`, Icon: Newspaper },
  ];
  return (
    <div className="home-content" aria-busy={!loaded}>
      <header className="home-toolbar">
        <span className="brand-wordmark" aria-label="Sukoon">SUK<span style={{ color: "#2563eb" }}>OO</span>N</span>
        <div className="flex">
          <Link href="/search" aria-label="Search" className="icon-button motion-pressable"><Search size={21} /></Link>
          <Link href="/reminders" aria-label="Notifications" className="icon-button motion-pressable"><Bell size={21} /></Link>
          <Link href="/profile" aria-label="Profile" className="icon-button motion-pressable"><UserRound size={21} /></Link>
        </div>
      </header>
      <p className="home-greeting">{home?.mode === "shared" ? "Shared with you" : dayGreeting(ownerName)}</p>
      <section className="guided-home-next surface" aria-labelledby="home-next-title">
        <p className="guided-eyebrow">Next</p>
        <h2 id="home-next-title">{nextAction.title}</h2>
        <p>{nextAction.detail}</p>
        <Link href={nextAction.href} className="primary-disclosure motion-pressable">{nextAction.label} <span aria-hidden="true">→</span></Link>
      </section>
      <section className="portfolio-hero">
        <h1>Your properties</h1>
        <p className="portfolio-value">{home ? home.mode === "shared" ? home.summary.propertyCount : inr(Number(home.summary.portfolioValuePaise || 0) / 100) : "…"}</p>
        <Link href={home?.mode === "shared" ? "/shared" : "/properties"} className="inline-flex min-h-11 items-center gap-2 text-[15px] text-ink-muted">
          {home?.summary.propertyCount ?? "—"} properties <span aria-hidden>→</span>
        </Link>
      </section>
      <SectionHeader title="Needs attention" href="/updates?view=attention" detail="View all" />
      <GroupedList>
        <AnimatedList>
          {home?.attention.slice(0, 4).map((item) => (
            <ListRow
              key={item.id}
              title={attentionTitle(item.title, item.type)}
              detail={item.type === "document" ? "Needs review" : dueCopy(item.date)}
              value={item.amountPaise ? formatPaiseCompact(item.amountPaise) : undefined}
              href={item.href}
            />
          ))}
        </AnimatedList>
      </GroupedList>
      {home && !home.attention.length ? <p className="p-5 text-ink-muted"><StatusTransition statusKey="caught-up">You’re all caught up.</StatusTransition></p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <SectionHeader title="Property life" />
      <div className="category-grid">
        {modules.map(({ title, href, state, detail, Icon }) => (
          <Link className="category-tile motion-pressable" key={title} href={href}>
            <Icon size={22} strokeWidth={1.6} />
            <div className="min-w-0">
              <strong>{title}</strong>
              <span className="block">{state}</span>
              <small>{detail}</small>
            </div>
          </Link>
        ))}
      </div>
      <SectionHeader title="Recent activity" href="/updates" />
      <GroupedList>
        <AnimatedList>
          {home?.activity.slice(0, 4).map((item) => (
            <ListRow
              key={item.id}
              title={activityTitle(item.title, item.detail)}
              detail={s.properties.find((p) => p.id === item.propertyId)?.name}
              value={shortDate(item.date)}
              href={home.mode === "shared" ? `/shared/${item.propertyId}` : `/property/${item.propertyId}?tab=timeline`}
            />
          ))}
        </AnimatedList>
        {home && !home.activity.length ? <p className="p-5 text-ink-muted">Activity will appear here.</p> : null}
      </GroupedList>
      <DevAccountHint />
    </div>
  );
}

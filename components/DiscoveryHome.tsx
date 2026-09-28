"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, House, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { dayGreeting, dueCopy, presentName } from "@/lib/ui-content";

const CARDS = [
  {
    title: "Vault",
    copy: "All your property documents, safe & organized.",
    href: "/vault",
    art: "/home/vault.png",
    tone: "vault",
  },
  {
    title: "Construction",
    copy: "Plan. Track. Build. With confidence.",
    href: "/construction",
    art: "/home/construction.png",
    tone: "construction",
  },
  {
    title: "Buy / Sell",
    copy: "Verified properties. Smarter decisions.",
    href: "/buy-sell",
    art: "/home/buy-sell.png",
    tone: "buy",
  },
  {
    title: "Updates",
    copy: "Market trends, legal changes, tax deadlines and more.",
    href: "/updates",
    art: "/home/updates.png",
    tone: "updates",
  },
] as const;

function profileMark(email: string, ownerName?: string) {
  const source = (ownerName || email.split("@")[0] || "You").replace(/[._-]+/g, " ").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "You").slice(0, 2).toUpperCase();
}

function PlotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <path d="M8 13.2V7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 8.2 5.2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 6.6 11 8.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="4.2" r="1.7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export type DiscoveryToday = {
  greeting: string;
  summary: string;
  actions: { href: string; label: string }[];
};

export function DiscoveryHomeView({ mark, today }: { mark: string; today?: DiscoveryToday | null }) {
  return (
    <div className="discovery-home">
      <section className="discovery-hero" aria-label="Sukoon">
        <Image className="discovery-hero__photo" src="/home/hero.png" alt="" fill priority sizes="430px" style={{ objectFit: "cover", objectPosition: "center 42%" }} />
        <Link href="/profile" className="discovery-mark" aria-label="Profile">
          {mark}
        </Link>
        <Image className="discovery-hero__logo" src="/brand/sukoon-logo.png" alt="Sukoon. Escape the chaos." width={456} height={144} priority />
      </section>

      <form className="discovery-search" action="/search" role="search">
        <Search size={18} aria-hidden="true" />
        <input name="q" type="search" enterKeyHint="search" placeholder="Search a property, location, document..." aria-label="Search a property, location, or document" />
        <Link href="/search" className="discovery-search__filter" aria-label="Search filters">
          <SlidersHorizontal size={18} aria-hidden="true" />
        </Link>
      </form>

      <div className="discovery-chips">
        <Link className="discovery-chip" href="/properties?city=Indore">
          <MapPin size={15} aria-hidden="true" /> Indore
        </Link>
        <Link className="discovery-chip" href="/properties?type=flat">
          <House size={15} aria-hidden="true" /> Flat
        </Link>
        <Link className="discovery-chip is-selected" href="/properties?type=plot" aria-current="true">
          <PlotIcon /> Plot
        </Link>
        <Link className="discovery-chip" href="/properties?type=commercial">
          <Building2 size={15} aria-hidden="true" /> Commercial
        </Link>
      </div>

      {today ? (
        <section className="discovery-today" aria-label="Today">
          <strong>{today.greeting}</strong>
          <p>{today.summary}</p>
          {today.actions.length ? (
            <div className="discovery-today__actions">
              {today.actions.map((action) => <Link key={action.href + action.label} href={action.href}>{action.label}</Link>)}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="discovery-grid">
        {CARDS.map((card) => (
          <Link key={card.title} href={card.href} className={`discovery-card is-${card.tone}`}>
            <strong>{card.title}</strong>
            <p>{card.copy}</p>
            <span className="discovery-card__go" aria-hidden="true"><ArrowRight size={16} /></span>
            <Image className="discovery-card__art" src={card.art} alt="" width={1024} height={1024} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DiscoveryHome() {
  const { s, email } = useStore();
  const ownerName = presentName(s.properties.find((property) => property.ownerName)?.ownerName || "");
  const papers = s.docs
    .filter((doc) => !doc.deletedAt && !doc.archivedAt)
    .slice()
    .sort((a, b) => (b.uploadDate || "").localeCompare(a.uploadDate || ""));
  const featured = papers.find((doc) => /registry|sale deed|deed/i.test(`${doc.type} ${doc.displayName || ""} ${doc.name}`)) ?? papers[0];
  const nextBill = s.bills.filter((bill) => bill.status !== "paid").slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const project = s.projects[0];
  const first = ownerName.split(/\s+/).filter(Boolean)[0];
  const today = {
    greeting: dayGreeting(first),
    summary: `${s.properties.length} ${s.properties.length === 1 ? "property" : "properties"} · ${papers.length} ${papers.length === 1 ? "paper" : "papers"} filed`,
    actions: [
      { href: nextBill ? `/property/${nextBill.propertyId}?tab=bills` : "/vault", label: nextBill ? `${nextBill.title} · ${dueCopy(nextBill.dueDate)}` : papers.length ? "Open your papers" : "Add a paper" },
      featured ? { href: `/property/${featured.propertyId}/documents/${featured.id}`, label: featured.displayName || featured.name } : { href: "/vault", label: "Vault" },
      project ? { href: `/construction/${project.id}`, label: project.name } : { href: "/reminders", label: "Reminders" },
    ],
  };
  return <DiscoveryHomeView mark={profileMark(email, ownerName)} today={today} />;
}

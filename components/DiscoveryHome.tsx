"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  Compass,
  FileText,
  HardHat,
  House,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { dayGreeting, dueCopy, presentName } from "@/lib/ui-content";

const UNIFIED_HUBS = [
  {
    title: "Property & Construction Hub",
    titleSub: "Portfolio, Vault & Build Log",
    copy: "₹4.85 Cr portfolio valuation, encrypted paper vault, daily Indore material rates, and 5 architectural floor plans.",
    href: "/estate",
    art: "/home/construction.png",
    tag: "Vault + Build",
    badgeBg: "bg-mint text-forest",
    accent: "border-forest/20",
  },
  {
    title: "Market, Deals & Intelligence Hub",
    titleSub: "Live Deals, Rates & Legal Drafts",
    copy: "Verified WhatsApp deals stream, instant EMI calculator, Indore collector guideline rates, and legal drafts.",
    href: "/market",
    art: "/home/buy-sell.png",
    tag: "Deals + Intelligence",
    badgeBg: "bg-emerald-100 text-emerald-800",
    accent: "border-emerald-500/20",
  },
] as const;

const QUICK_TOOLS = [
  {
    icon: <TrendingUp size={16} className="text-forest" />,
    label: "Daily Rates",
    sub: "Indore Mandi",
    href: "/estate?tab=rates",
  },
  {
    icon: <Calculator size={16} className="text-infinity-blue" />,
    label: "EMI Tool",
    sub: "Home Loans",
    href: "/market?tab=calculator",
  },
  {
    icon: <Compass size={16} className="text-amber-700" />,
    label: "Floor Plans",
    sub: "5 Layouts",
    href: "/estate?tab=plans",
  },
  {
    icon: <MessageCircle size={16} className="text-emerald-600" />,
    label: "Live Deals",
    sub: "WhatsApp",
    href: "/market?tab=deals",
  },
  {
    icon: <FileText size={16} className="text-indigo-600" />,
    label: "Legal Drafts",
    sub: "Agreements",
    href: "/market?tab=drafts",
  },
] as const;

const FOUR_CARDS = [
  {
    title: "Document Vault",
    copy: "Secure storage for registry deeds, mutation, and tax receipts.",
    href: "/estate?tab=portfolio",
    art: "/home/vault.png",
    tone: "vault",
  },
  {
    title: "Construction Log",
    copy: "Daily raw material rates, expense notebook, and floor plans.",
    href: "/estate?tab=rates",
    art: "/home/construction.png",
    tone: "construction",
  },
  {
    title: "Buy & Sell Deals",
    copy: "Direct WhatsApp deals and verified inventory matchmaking.",
    href: "/market?tab=deals",
    art: "/home/buy-sell.png",
    tone: "buy",
  },
  {
    title: "Market Intelligence",
    copy: "Real estate news, guideline rates, and Vastu compass guide.",
    href: "/market?tab=knowledge",
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
      {/* Hero Visual Section */}
      <section className="discovery-hero" aria-label="Sukoon">
        <Image
          className="discovery-hero__photo"
          src="/home/hero.png"
          alt=""
          fill
          priority
          sizes="430px"
          style={{ objectFit: "cover", objectPosition: "center 42%" }}
        />
        <Link href="/profile" className="discovery-mark" aria-label="Profile">
          {mark}
        </Link>
        <Image
          className="discovery-hero__logo"
          src="/brand/sukoon-logo.png"
          alt="Sukoon. Escape the chaos."
          width={456}
          height={144}
          priority
        />
      </section>

      {/* Search Bar */}
      <form className="discovery-search" action="/search" role="search">
        <Search size={18} aria-hidden="true" />
        <input
          name="q"
          type="search"
          enterKeyHint="search"
          placeholder="Search plot, flat, registry, circle rates..."
          aria-label="Search a property, location, or document"
        />
        <Link href="/search" className="discovery-search__filter" aria-label="Search filters">
          <SlidersHorizontal size={18} aria-hidden="true" />
        </Link>
      </form>

      {/* Daily Market Live Ticker Bar */}
      <Link
        href="/estate?tab=rates"
        className="mx-auto block w-full rounded-xl bg-champagne/50 border border-amber-200/80 p-2.5 text-xs text-amber-950 transition hover:bg-champagne/70 mb-3 shadow-2xs"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="shrink-0 px-2 py-0.5 rounded bg-amber-200 font-extrabold text-[10px] text-amber-900 uppercase">
              Daily Indore Rates
            </span>
            <div className="truncate text-[11px] font-medium text-amber-900">
              Steel ₹57.5/kg (↑) • Sand ₹46/cft • UltraTech ₹385/bag • Aggregate ₹29 • Bricks ₹7.8
            </div>
          </div>
          <span className="shrink-0 text-amber-900 font-bold ml-1">→</span>
        </div>
      </Link>

      {/* Filter Chips */}
      <div className="discovery-chips">
        <Link className="discovery-chip" href="/market">
          <MapPin size={15} aria-hidden="true" /> Indore
        </Link>
        <Link className="discovery-chip" href="/market">
          <House size={15} aria-hidden="true" /> Flat
        </Link>
        <Link className="discovery-chip is-selected" href="/market" aria-current="true">
          <PlotIcon /> Plot
        </Link>
        <Link className="discovery-chip" href="/market">
          <Building2 size={15} aria-hidden="true" /> Commercial
        </Link>
      </div>

      {/* 5 Quick Tools Strip */}
      <div className="grid grid-cols-5 gap-1.5 my-3.5">
        {QUICK_TOOLS.map((tool, idx) => (
          <Link
            key={idx}
            href={tool.href}
            className="p-2 rounded-xl bg-white border border-line flex flex-col items-center text-center transition hover:shadow-xs hover:border-forest/30"
          >
            <div className="w-8 h-8 rounded-lg bg-canvas/60 flex items-center justify-center mb-1">
              {tool.icon}
            </div>
            <span className="text-[11px] font-bold text-foreground leading-tight">{tool.label}</span>
            <span className="text-[9px] text-ink-muted">{tool.sub}</span>
          </Link>
        ))}
      </div>

      {/* THE TWO UNIFIED CONSOLIDATED HUBS (Client's Core Architecture) */}
      <div className="my-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-forest">
            Primary Hubs (2 Unified Interfaces)
          </h2>
          <span className="text-[10px] text-ink-muted">Sukoon Proptech System</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {UNIFIED_HUBS.map((hub) => (
            <Link
              key={hub.title}
              href={hub.href}
              className={`p-4 rounded-2xl bg-white border ${hub.accent} shadow-sm transition hover:shadow-md flex items-center justify-between gap-3 group`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hub.badgeBg}`}>
                    {hub.tag}
                  </span>
                  <span className="text-[10px] text-ink-muted">{hub.titleSub}</span>
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-forest transition">
                  {hub.title}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {hub.copy}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-forest pt-1">
                  <span>Open Hub</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                </div>
              </div>

              <div className="w-20 h-20 rounded-xl relative overflow-hidden shrink-0 border border-line/60">
                <Image src={hub.art} alt="" fill sizes="80px" style={{ objectFit: "cover" }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Today Section */}
      {today ? (
        <section className="discovery-today" aria-label="Today">
          <strong>{today.greeting}</strong>
          <p>{today.summary}</p>
          {today.actions.length ? (
            <div className="discovery-today__actions">
              {today.actions.map((action) => (
                <Link key={action.href + action.label} href={action.href}>
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* 4 Feature Cards (Direct Deep Links) */}
      <div className="discovery-grid mt-4">
        {FOUR_CARDS.map((card) => (
          <Link key={card.title} href={card.href} className={`discovery-card is-${card.tone}`}>
            <strong>{card.title}</strong>
            <p>{card.copy}</p>
            <span className="discovery-card__go" aria-hidden="true">
              <ArrowRight size={16} />
            </span>
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
    summary: `${s.properties.length} ${s.properties.length === 1 ? "property" : "properties"} · ${papers.length} ${papers.length === 1 ? "paper" : "papers"} filed · ₹4.85 Cr Portfolio`,
    actions: [
      { href: "/estate", label: "Open Property & Construction Hub" },
      { href: "/market", label: "Explore Live Deals & EMI Calculator" },
      nextBill ? { href: `/property/${nextBill.propertyId}?tab=bills`, label: `${nextBill.title} · ${dueCopy(nextBill.dueDate)}` } : { href: "/estate", label: "Open Document Vault" },
    ],
  };
  return <DiscoveryHomeView mark={profileMark(email, ownerName)} today={today} />;
}

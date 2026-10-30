"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  FolderLock,
  Hammer,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { presentName } from "@/lib/ui-content";

const FOUR_CORE_FEATURES = [
  {
    id: "vault",
    title: "Vault",
    subtitle: "Papers, Deeds & Records",
    desc: "Registry deed, mutation, tax receipts, and property portfolio details.",
    href: "/vault",
    icon: FolderLock,
    art: "/home/vault.png",
    accent: "border-forest/20 hover:border-forest/50",
    badge: "Papers & Records",
    badgeBg: "bg-mint text-forest",
    iconBg: "bg-emerald-50 text-forest",
  },
  {
    id: "construction",
    title: "Construction",
    subtitle: "0 to 1 Build Guide & Accounts",
    desc: "28-step construction roadmap, expense notebook & daily mandi rates.",
    href: "/construction",
    icon: Hammer,
    art: "/home/construction.png",
    accent: "border-amber-500/20 hover:border-amber-500/50",
    badge: "Build Guide",
    badgeBg: "bg-amber-100 text-amber-900",
    iconBg: "bg-amber-50 text-amber-800",
  },
  {
    id: "buy-sell",
    title: "Buy & Sell",
    subtitle: "Verified Deals & Listings",
    desc: "Direct verified property listings, sell your plot & circle rates.",
    href: "/buy-sell",
    icon: Building2,
    art: "/home/buy-sell.png",
    accent: "border-blue-500/20 hover:border-blue-500/50",
    badge: "Marketplace",
    badgeBg: "bg-blue-100 text-blue-900",
    iconBg: "bg-blue-50 text-blue-800",
  },
  {
    id: "knowledge",
    title: "Knowledge",
    subtitle: "News, Dictionary & Drafts",
    desc: "Real estate dictionary, Indore market news, legal drafts & podcasts.",
    href: "/updates",
    icon: BookOpen,
    art: "/home/updates.png",
    accent: "border-indigo-500/20 hover:border-indigo-500/50",
    badge: "Learning Hub",
    badgeBg: "bg-indigo-100 text-indigo-900",
    iconBg: "bg-indigo-50 text-indigo-800",
  },
] as const;

function profileMark(email: string, ownerName?: string) {
  const source = (ownerName || email.split("@")[0] || "You").replace(/[._-]+/g, " ").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "You").slice(0, 2).toUpperCase();
}

export function DiscoveryHomeView({ mark = "TS" }: { mark?: string }) {
  return (
    <div className="mx-auto max-w-[430px] min-h-[92dvh] px-5 pt-4 pb-24 flex flex-col justify-start">
      {/* 1. Header with Sukoon Logo and Profile */}
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1
            className="text-[34px] font-bold tracking-tight text-foreground leading-none"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            SUK<span className="text-forest">OO</span>N
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted font-bold mt-1">
            Escape The Chaos
          </p>
        </div>

        <Link
          href="/profile"
          className="h-10 w-10 rounded-full bg-forest text-white flex items-center justify-center font-bold text-xs shadow-xs hover:opacity-95 transition"
          aria-label="Profile"
        >
          {mark}
        </Link>
      </header>

      {/* 2. Search Bar */}
      <section className="mb-6" aria-label="Search">
        <form
          action="/search"
          method="GET"
          role="search"
          className="relative flex items-center w-full"
        >
          <Search
            size={18}
            className="absolute left-3.5 text-ink-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            name="q"
            type="search"
            enterKeyHint="search"
            placeholder="Search properties, papers, construction, market..."
            aria-label="Search"
            className="h-12 w-full rounded-2xl border border-line bg-white pl-10 pr-11 text-[14px] text-foreground placeholder:text-ink-muted/80 shadow-2xs outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
          />
          <Link
            href="/search"
            className="absolute right-3 text-ink-muted hover:text-forest transition p-1"
            aria-label="Search filters"
          >
            <SlidersHorizontal size={17} />
          </Link>
        </form>
      </section>

      {/* 3. The 4 Feature Icons (The Only 4 Core Pillars) */}
      <section aria-label="Features" className="flex-1 flex flex-col justify-start">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Choose what you want to do
          </p>
          <span className="text-[10px] text-forest font-semibold flex items-center gap-1">
            <Sparkles size={11} /> 4 Core Features
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {FOUR_CORE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.id}
                href={feat.href}
                className={`group relative p-4 rounded-3xl bg-white border ${feat.accent} shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between min-h-[175px]`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl ${feat.iconBg} flex items-center justify-center transition group-hover:scale-105`}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${feat.badgeBg}`}
                    >
                      {feat.badge}
                    </span>
                  </div>

                  <h2 className="text-[17px] font-bold text-foreground leading-tight group-hover:text-forest transition">
                    {feat.title}
                  </h2>
                  <p className="text-[12px] font-semibold text-ink-muted mt-0.5 line-clamp-1">
                    {feat.subtitle}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-forest">
                  <span>Open</span>
                  <div className="w-6 h-6 rounded-full bg-canvas/80 flex items-center justify-center group-hover:bg-forest group-hover:text-white transition">
                    <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quiet Reassurance Status Strip */}
        <div className="mt-6 p-3.5 rounded-2xl bg-[#fbfaf7] border border-line/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-forest shrink-0 animate-pulse" />
            <div className="truncate text-xs">
              <span className="font-bold text-foreground">Super Corridor Plot 108</span>
              <span className="text-ink-muted ml-1.5 font-normal">· Build Step 18 in progress</span>
            </div>
          </div>
          <Link
            href="/construction"
            className="text-[11px] font-bold text-forest shrink-0 hover:underline"
          >
            View →
          </Link>
        </div>
      </section>
    </div>
  );
}

export function DiscoveryHome() {
  const { s, email } = useStore();
  const ownerName = presentName(s.properties.find((property) => property.ownerName)?.ownerName || "");
  const mark = profileMark(email, ownerName);

  return <DiscoveryHomeView mark={mark} />;
}

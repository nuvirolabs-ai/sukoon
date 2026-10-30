"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  FileText,
  Hammer,
  MapPin,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useStore, useOptionalStore } from "@/components/StoreProvider";
import { presentName } from "@/lib/ui-content";
import {
  ALL_AVAILABLE_SHORTCUTS,
  useFavorites,
  type ShortcutItem,
} from "@/lib/favorites";
import { useSelectedCity } from "@/lib/city";
import { IOSFolderFavorites } from "@/components/IOSFolderFavorites";

function profileMark(email: string, ownerName?: string) {
  const source = (ownerName || email.split("@")[0] || "You").replace(/[._-]+/g, " ").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "You").slice(0, 2).toUpperCase();
}

function ShortcutIcon({ type, className = "w-10 h-10" }: { type: ShortcutItem["iconType"]; className?: string }) {
  switch (type) {
    case "guidelines":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <rect height="28" rx="3" width="22" x="9" y="6" />
          <path d="M15 13h10M15 18h10M15 23h6" />
          <path d="M23 27l2 2 4-4" />
        </svg>
      );
    case "post-deal":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M6 18l12-10 16 13" />
          <path d="M10 15v17h20V19" />
          <circle cx="24" cy="25" r="5.5" />
          <path d="M24 22.5v5M21.5 25h5" />
        </svg>
      );
    case "accounts":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <rect height="26" rx="3" width="22" x="9" y="7" />
          <path d="M14 7v26M18 14h8M18 20h8M18 26h5" />
        </svg>
      );
    case "rates":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M6 32h28M8 26l7-10 6 6 10-12" />
          <path d="M25 10h6v6" />
        </svg>
      );
    case "journey":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <circle cx="12" cy="12" r="3" />
          <circle cx="28" cy="20" r="3" />
          <circle cx="14" cy="28" r="3" />
          <path d="M14 14l12 4M26 22l-10 4" strokeDasharray="2 2" />
        </svg>
      );
    case "site":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M20 6a10 10 0 0 0-10 10v4h20v-4a10 10 0 0 0-10-10z" />
          <path d="M7 20h26v4H7zM20 6v6" />
        </svg>
      );
    case "dictionary":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M8 8h16a4 4 0 0 1 4 4v20a4 4 0 0 0-4-4H8z" />
          <path d="M8 8v20a4 4 0 0 1 4-4h16" />
          <path d="M13 14h8M13 18h6" />
        </svg>
      );
    case "drafts":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M10 6h14l8 8v20H10z" />
          <path d="M24 6v8h8M16 18h10M16 23h10M16 28h6" />
        </svg>
      );
    case "media":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M10 20a10 10 0 0 1 20 0v6a3 3 0 0 1-3 3h-2v-8h3v-1a8 8 0 0 0-16 0v1h3v8h-2a3 3 0 0 1-3-3z" />
        </svg>
      );
    case "docs":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <rect height="28" rx="2" width="22" x="9" y="6" />
          <path d="M14 13h12M14 18h12M14 23h8" />
        </svg>
      );
    case "details":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M20 6c-5 0-9 4-9 9 0 7 9 19 9 19s9-12 9-19c0-5-4-9-9-9z" />
          <circle cx="20" cy="15" r="3.5" />
        </svg>
      );
    case "portfolio":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <rect height="24" rx="2" width="24" x="8" y="10" />
          <path d="M14 10V6h12v4M8 18h24M18 18v6h4v-6" />
        </svg>
      );
    case "single-paper":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <rect height="26" rx="2" width="20" x="8" y="7" />
          <circle cx="24" cy="25" r="5" />
          <path d="M28 29l4 4" />
        </svg>
      );
    case "buy":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M6 16.5 20 6l14 10.5" />
          <path d="M9 14.5V33h22V14.5" />
          <circle cx="20" cy="22" r="3" />
        </svg>
      );
    case "matchmaking":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M11 20a9 9 0 0 1 18 0M11 20l4-4M11 20l4 4M29 20l-4-4M29 20l-4 4" />
          <path d="M20 7v6M20 27v6" />
          <circle cx="20" cy="20" r="3" />
        </svg>
      );
    case "trending":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M7 27l8-8 6 6 12-12" />
          <path d="M25 13h8v8" />
          <path d="M7 33h26" />
        </svg>
      );
    case "power-docs":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M10 6h14l8 8v20H10z" />
          <path d="M24 6v8h8" />
          <path d="M16 18h10M16 23h10M16 28h5" />
          <circle cx="27" cy="27" r="3" />
        </svg>
      );
    case "news":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M8 8h22a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" />
          <path d="M12 14h8M12 18h8M12 22h16M12 26h16M24 14h4v4h-4z" />
        </svg>
      );
    case "blogs":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M8 8h16a4 4 0 0 1 4 4v20a4 4 0 0 0-4-4H8z" />
          <path d="M8 8v20a4 4 0 0 1 4-4h16" />
          <path d="M14 14h8M14 18h6M14 22h4" />
        </svg>
      );
    case "dos-donts":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M20 6l13 5v8c0 9-6 15-13 17C13 34 7 28 7 19v-8z" />
          <path d="M15 19l3 3 7-7" />
        </svg>
      );
    case "podcasts":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <rect height="22" rx="4" width="28" x="6" y="9" />
          <path d="M17 15l9 5-9 5z" />
        </svg>
      );
    case "vastu":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="14" />
          <polygon points="20,10 23,17 20,20 17,17" fill="currentColor" opacity="0.3" />
          <polygon points="20,30 17,23 20,20 23,23" fill="currentColor" opacity="0.3" />
          <path d="M20 7v26M7 20h26" />
        </svg>
      );
    case "trends":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M6 30h28M8 24l8-8 6 4 10-12" />
          <path d="M26 8h6v6" />
          <rect height="8" rx="1" width="5" x="12" y="22" />
          <rect height="12" rx="1" width="5" x="20" y="18" />
        </svg>
      );
    case "dealers":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M6 14l14-7 14 7v18H6V14z" />
          <path d="M6 14h28M15 32V20h10v12" />
          <circle cx="20" cy="13" r="2.5" />
        </svg>
      );
    case "architects":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <circle cx="20" cy="10" r="3" />
          <path d="M18 13l-8 20M22 13l8 20M12 26h16" />
        </svg>
      );
    case "engineers":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <path d="M10 32V12l10-6 10 6v20" />
          <path d="M10 18h20M10 25h20M20 6v26" />
        </svg>
      );
    case "plans":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <rect x="7" y="7" width="26" height="26" rx="2" />
          <path d="M7 19h13v14M20 7v12M20 23h13" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="10" />
        </svg>
      );
  }
}

function SearchItemIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case "building":
      return <Building2 className={className} />;
    case "doc":
      return <FileText className={className} />;
    case "construction":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 3v3" />
          <circle cx="12" cy="5" r="1.5" />
          <path d="m10.5 7.5-6 13.5M13.5 7.5l6 13.5" />
          <path d="M7 16h10" />
        </svg>
      );
    case "hammer":
      return <Hammer className={className} />;
    case "trending":
      return <TrendingUp className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    default:
      return <Search className={className} />;
  }
}

interface SearchSuggestionItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Property" | "Vault Paper" | "Core Feature" | "Tool" | "Market";
  href: string;
  icon: "building" | "doc" | "construction" | "trending" | "sparkles" | "hammer";
  keywords: string;
}

export function DiscoveryHomeView({ mark = "AK" }: { mark?: string }) {
  const store = useOptionalStore();
  const s = store?.s;
  const { favoriteItems, favoriteIds, toggleFavorite } = useFavorites();
  const [customizeModal, setCustomizeModal] = useState(false);
  const { city, changeCity, allCities } = useSelectedCity();
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allSearchItems = useMemo<SearchSuggestionItem[]>(() => {
    const items: SearchSuggestionItem[] = [
      // Core Features & Tools
      {
        id: "feat-vault",
        title: "Vault",
        subtitle: "Papers, Registry & Land Records",
        category: "Core Feature",
        href: "/vault",
        icon: "doc",
        keywords: "vault document paper registry sale deed namantaran khasra khatoni record file",
      },
      {
        id: "feat-construction",
        title: "Construction Journey",
        subtitle: "0 to 1 Build, 28 Milestones & Progress",
        category: "Core Feature",
        href: "/construction",
        icon: "construction",
        keywords: "construction build milestones 0 to 1 contractor architect plan foundation slab site",
      },
      {
        id: "feat-rates",
        title: "Daily Material Rates",
        subtitle: "Live Indore Rates for Cement, TMT Steel, Sand, Bricks",
        category: "Tool",
        href: "/construction",
        icon: "hammer",
        keywords: "rates daily material cement steel tmt sand bricks cost price mandi indore",
      },
      {
        id: "feat-buysell",
        title: "Buy & Sell Marketplace",
        subtitle: "Verified Direct Listings & Deals",
        category: "Core Feature",
        href: "/buy-sell",
        icon: "trending",
        keywords: "buy sell marketplace property plot flat house land post deal direct listing",
      },
      {
        id: "feat-matchmaker",
        title: "Matchmaker",
        subtitle: "Buy / Sell Match Algorithm",
        category: "Tool",
        href: "/buy-sell",
        icon: "sparkles",
        keywords: "matchmaker buyer seller match direct pair find property",
      },
      {
        id: "feat-notary",
        title: "Notary Draft Generator",
        subtitle: "Affidavits, Rent Agreements & Undertakings",
        category: "Tool",
        href: "/drafts",
        icon: "doc",
        keywords: "notary draft affidavit undertaking stamp agreement rent power of attorney",
      },
      {
        id: "feat-stocks",
        title: "Indian Stock Market",
        subtitle: "Nifty, Sensex, Realty Stocks & Indices",
        category: "Market",
        href: "/stocks",
        icon: "trending",
        keywords: "stocks share market nifty sensex realty dlf godrej oberoi bse nse",
      },
      {
        id: "feat-insights",
        title: "Insights & Legal Guides",
        subtitle: "Property Diligence, Stamp Duty & Bye-laws",
        category: "Core Feature",
        href: "/updates",
        icon: "sparkles",
        keywords: "insights knowledge rules checklist guidelines stamp duty circle rate bye laws",
      },
      {
        id: "feat-guidelines",
        title: "Property Guidelines",
        subtitle: "Step-by-Step Purchase & Due Diligence Checklist",
        category: "Tool",
        href: "/guideline",
        icon: "doc",
        keywords: "guidelines checklist due diligence rules legal verification",
      },
      {
        id: "feat-bills",
        title: "Property Tax & Utility Bills",
        subtitle: "Municipal Tax, Electricity & Maintenance",
        category: "Tool",
        href: "/bills",
        icon: "doc",
        keywords: "tax property tax bill municipal electricity maintenance dues receipt",
      },
    ];

    // Add User Properties
    if (s?.properties?.length) {
      for (const prop of s.properties) {
        items.push({
          id: `prop-${prop.id}`,
          title: prop.name,
          subtitle: `${prop.type.toUpperCase()} · ${prop.area}, ${prop.city}`,
          category: "Property",
          href: `/property/${prop.id}`,
          icon: "building",
          keywords: `${prop.name} ${prop.type} ${prop.area} ${prop.city} ${prop.address || ""}`.toLowerCase(),
        });
      }
    }

    // Add User Vault Documents
    if (s?.docs?.length) {
      for (const doc of s.docs) {
        if (doc.deletedAt || doc.archivedAt) continue;
        const propName = s.properties.find((p) => p.id === doc.propertyId)?.name;
        const docTitle = doc.displayName || doc.name || doc.type;
        items.push({
          id: `doc-${doc.id}`,
          title: docTitle,
          subtitle: `${doc.type}${propName ? ` · ${propName}` : ""}`,
          category: "Vault Paper",
          href: "/vault",
          icon: "doc",
          keywords: `${docTitle} ${doc.type} ${doc.subtype || ""} ${propName || ""}`.toLowerCase(),
        });
      }
    }

    return items;
  }, [s]);

  const popularTags = ["Plot 108", "Property Tax", "Notary Draft", "Stock Market", "Cement Rates", "Matchmaker"];

  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    return allSearchItems
      .filter((item) => {
        const fullText = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
        return tokens.every((tok) => fullText.includes(tok));
      })
      .slice(0, 6);
  }, [allSearchItems, searchQuery]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen px-5 pt-3 pb-28 flex flex-col justify-between relative">
      <div>
        {/* 1. Header with Centered Sukoon Logo, City Selector & Profile (Native Mobile Optimized) */}
        <header className="relative flex items-center justify-between mb-7 pt-2.5 min-h-[48px] px-0.5">
          {/* Top Left: City Selector */}
          <button
            type="button"
            onClick={() => setCityModalOpen(true)}
            aria-label="Select City"
            className="tap-scale relative z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-sand/80 hover:bg-sand border border-line text-[#1B2922] text-[11px] font-bold transition focus:outline-none shadow-2xs shrink-0"
          >
            <MapPin size={11} className="text-[#1E5637] shrink-0" />
            <span className="max-w-[62px] truncate">{city}</span>
            <ChevronDown size={10} className="text-ink-muted shrink-0" />
          </button>

          {/* Center Brand Identity - Centered with Mathematical Precision & Safe Margins */}
          <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none z-0 px-24">
            <div className="h-6.5 sm:h-7 flex items-center justify-center overflow-visible">
              <Image
                src="/images/sukoon-brand-logo.png"
                alt="Sukoon"
                width={342}
                height={79}
                priority
                className="h-6.5 sm:h-7 w-auto object-contain select-none mix-blend-multiply"
              />
            </div>
            <p className="sublogo-tracking text-[7.5px] sm:text-[8px] font-semibold text-[#6E7B73] uppercase mt-0.5 leading-none tracking-[0.24em] select-none whitespace-nowrap">
              Escape the Chaos
            </p>
          </div>

          {/* Top Right: User Profile Avatar Badge */}
          <Link
            href="/profile"
            aria-label="User Profile"
            className="tap-scale relative z-10 w-9 h-9 rounded-full bg-[#182C22] text-[#F3F6F4] font-semibold text-xs flex items-center justify-center shadow-sm border border-emerald-950/10 focus:outline-none shrink-0"
          >
            {mark}
          </Link>
        </header>

        {/* 2. Expandable Apple Search Bar with Live Auto-Suggestions */}
        <section aria-label="Search" className="mb-7 relative z-40 flex justify-center">
          {searchExpanded && (
            <div
              className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[1px]"
              onClick={() => {
                setSearchExpanded(false);
                setSearchQuery("");
              }}
            />
          )}

          <div className={`relative z-40 transition-all duration-300 ${searchExpanded ? "w-full" : "w-auto"}`}>
            {!searchExpanded ? (
              /* Collapsed Small Apple Pill */
              <button
                type="button"
                onClick={() => {
                  setSearchExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 60);
                }}
                aria-label="Open search"
                className="tap-scale flex items-center justify-center gap-2 w-44 sm:w-52 py-2 px-4 rounded-full bg-white/95 hover:bg-white border border-[#E5DFD3] shadow-2xs hover:shadow-xs hover:border-forest/30 transition-all duration-200 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#6E7D73]" strokeWidth={2.2} />
                <span className="text-[13px] font-medium text-[#6E7D73]">Search...</span>
              </button>
            ) : (
              /* Expanded Search Bar + Live Auto-Suggestions Dropdown */
              <div className="w-full">
                <form
                  action="/search"
                  method="GET"
                  role="search"
                  className="relative flex items-center w-full bg-white rounded-full px-4 py-2.5 border border-forest/30 shadow-[0_4px_18px_rgba(27,61,47,0.08)] ring-2 ring-forest/10 transition-all duration-300"
                >
                  <Search className="w-4 h-4 text-[#486354] flex-shrink-0 mr-2.5" strokeWidth={2.2} />
                  <input
                    ref={searchInputRef}
                    name="q"
                    type="search"
                    enterKeyHint="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchExpanded(false);
                        setSearchQuery("");
                      }
                    }}
                    placeholder="Search properties, papers, construction, market..."
                    aria-label="Search"
                    autoFocus
                    className="w-full bg-transparent border-none p-0 text-[13.5px] text-[#22332A] placeholder-[#8E9D94] font-normal leading-normal truncate focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 !outline-none !shadow-none"
                    style={{ outline: "none", boxShadow: "none" }}
                  />

                  {searchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="p-1 rounded-full text-ink-muted hover:text-foreground shrink-0 mr-1"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchExpanded(false);
                    }}
                    className="tap-scale ml-1.5 text-[11px] font-bold text-forest hover:opacity-80 px-2.5 py-1 rounded-full bg-sand/80 shrink-0"
                  >
                    Cancel
                  </button>
                </form>

                {/* Live Auto-Suggestions Floating Panel */}
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl rounded-2xl border border-[#E2DBD0] shadow-[0_14px_36px_rgba(27,61,47,0.14)] p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
                  {searchQuery.trim().length === 0 ? (
                    /* When Query is Empty: Popular Searches & Suggested Shortcuts */
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[10px] font-bold tracking-wider text-[#7C8B82] uppercase">
                          Popular Searches
                        </span>
                        <span className="text-[10px] font-medium text-forest">Quick Tap</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3 px-0.5">
                        {popularTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSearchQuery(tag);
                              searchInputRef.current?.focus();
                            }}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-sand/70 hover:bg-sand text-[#2C4136] border border-line/60 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-[#F0ECE1] pt-2">
                        <span className="text-[10px] font-bold tracking-wider text-[#7C8B82] uppercase block mb-1.5 px-1">
                          Suggested Shortcuts
                        </span>
                        <div className="space-y-1">
                          {allSearchItems.slice(0, 4).map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setSearchExpanded(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-sand/60 transition group text-left"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-mint/50 flex items-center justify-center text-forest shrink-0">
                                  <SearchItemIcon icon={item.icon} className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[12.5px] font-semibold text-[#1B2922] truncate group-hover:text-forest">
                                    {item.title}
                                  </p>
                                  <p className="text-[10.5px] text-[#7C8B82] truncate">{item.subtitle}</p>
                                </div>
                              </div>
                              <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded bg-sand/80 text-[#52665B] shrink-0 ml-2">
                                {item.category}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* When Query is Typed: Live Filtered Auto-Suggestions */
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[10px] font-bold tracking-wider text-[#7C8B82] uppercase">
                          Auto-Suggestions ({filteredSuggestions.length})
                        </span>
                        <span className="text-[10px] text-ink-muted">Tap to open</span>
                      </div>

                      {filteredSuggestions.length > 0 ? (
                        <div className="space-y-1">
                          {filteredSuggestions.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setSearchExpanded(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-sand/60 transition group text-left"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-mint/50 flex items-center justify-center text-forest shrink-0">
                                  <SearchItemIcon icon={item.icon} className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[12.5px] font-semibold text-[#1B2922] truncate group-hover:text-forest">
                                    {item.title}
                                  </p>
                                  <p className="text-[10.5px] text-[#7C8B82] truncate">{item.subtitle}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded bg-sand/80 text-[#52665B]">
                                  {item.category}
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#8E9D94] group-hover:text-forest transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </div>
                            </Link>
                          ))}

                          <Link
                            href={`/search?q=${encodeURIComponent(searchQuery)}`}
                            onClick={() => {
                              setSearchExpanded(false);
                              setSearchQuery("");
                            }}
                            className="mt-2 block w-full text-center py-2 px-3 rounded-xl bg-forest/8 hover:bg-forest/12 text-forest text-[11.5px] font-bold transition"
                          >
                            Search all records for &ldquo;{searchQuery}&rdquo; &rarr;
                          </Link>
                        </div>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-[12.5px] text-[#486354] font-medium">
                            No direct matches for &ldquo;{searchQuery}&rdquo;
                          </p>
                          <p className="text-[11px] text-[#7C8B82] mt-0.5 mb-3">
                            Search the full vault and marketplace records
                          </p>
                          <Link
                            href={`/search?q=${encodeURIComponent(searchQuery)}`}
                            onClick={() => {
                              setSearchExpanded(false);
                              setSearchQuery("");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold shadow-sm hover:opacity-90 transition"
                          >
                            <Search className="w-3 h-3" />
                            Full Search for &ldquo;{searchQuery}&rdquo;
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Core Features Section: 2 Rows, No Big Boxes, Clean Icons Only */}
        <section aria-label="Core Features">
          {/* Section Header Label: Non-colliding, elegant mobile-first header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[#3D6650] text-[11px] leading-none select-none">✦</span>
              <h2 className="text-[11px] font-bold tracking-[0.1em] text-[#697A71] uppercase">
                Core Modules
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-[#486354] px-2 py-0.5 rounded-full bg-mint/50 border border-forest/15">
              4 Features
            </span>
          </div>

          {/* Row 1: Vault & Construction | Row 2: Buy & Sell & Insights */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 px-3 py-1">
            {/* Feature 1: Vault */}
            <Link
              href="/vault"
              className="tap-scale group flex flex-col items-center text-center focus:outline-none py-1.5"
            >
              <div className="w-13 h-13 rounded-2xl bg-white shadow-[0_4px_16px_rgba(30,86,55,0.18),0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8E2D5] flex items-center justify-center text-[#1E5637] mb-2 transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_8px_22px_rgba(30,86,55,0.28)]">
                <svg className="w-8 h-8 drop-shadow-[0_2px_4px_rgba(30,86,55,0.30)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 40 40">
                  <rect height="28" rx="2" width="26" x="7" y="6" />
                  <path d="M13 6V30" />
                  <path d="M18 13h10M18 18h7" />
                  <circle cx="24" cy="26" r="3.5" strokeWidth="1.6" />
                  <path d="M24 25v2M24 29.5v3M26.5 31h-2.5" />
                </svg>
              </div>
              <span className="text-[13.5px] font-bold text-[#1B2922] leading-tight block">Vault</span>
              <span className="text-[11px] font-medium text-[#7C8B82] leading-tight mt-0.5">Papers &amp; Records</span>
            </Link>

            {/* Feature 2: Construction */}
            <Link
              href="/construction"
              className="tap-scale group flex flex-col items-center text-center focus:outline-none py-1.5"
            >
              <div className="w-13 h-13 rounded-2xl bg-white shadow-[0_4px_16px_rgba(178,99,21,0.20),0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8E2D5] flex items-center justify-center text-[#B26315] mb-2 transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_8px_22px_rgba(178,99,21,0.30)]">
                <svg className="w-8 h-8 drop-shadow-[0_2px_4px_rgba(178,99,21,0.30)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 40 40">
                  <path d="M20 5v4" />
                  <circle cx="20" cy="9" r="2.5" />
                  <path d="m18 11.5-9 22.5M22 11.5l9 22.5" />
                  <path d="M12.5 25.5h15" strokeDasharray="1 0" />
                  <path d="M16 23.5a9 9 0 0 1 8 0" />
                  <path d="M20 23.5V34" />
                </svg>
              </div>
              <span className="text-[13.5px] font-bold text-[#1B2922] leading-tight block">Construction</span>
              <span className="text-[11px] font-medium text-[#7C8B82] leading-tight mt-0.5">0 to 1 Build</span>
            </Link>

            {/* Feature 3: Buy & Sell */}
            <Link
              href="/buy-sell"
              className="tap-scale group flex flex-col items-center text-center focus:outline-none py-1.5"
            >
              <div className="w-13 h-13 rounded-2xl bg-white shadow-[0_4px_16px_rgba(30,87,164,0.20),0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8E2D5] flex items-center justify-center text-[#1E57A4] mb-2 transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_8px_22px_rgba(30,87,164,0.30)]">
                <svg className="w-8 h-8 drop-shadow-[0_2px_4px_rgba(30,87,164,0.30)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 40 40">
                  <path d="M6 16.5 20 6l14 10.5" />
                  <path d="M9 14.5V33h22V14.5" />
                  <path d="M15 33V22h10v11" />
                  <path d="M20 22v11" />
                  <circle cx="27" cy="12" r="2" />
                  <path d="M27 14v4M29 16h-2" />
                </svg>
              </div>
              <span className="text-[13.5px] font-bold text-[#1B2922] leading-tight block">Buy &amp; Sell</span>
              <span className="text-[11px] font-medium text-[#7C8B82] leading-tight mt-0.5">Marketplace</span>
            </Link>

            {/* Feature 4: Insights (New Name for Knowledge) */}
            <Link
              href="/updates"
              className="tap-scale group flex flex-col items-center text-center focus:outline-none py-1.5"
            >
              <div className="w-13 h-13 rounded-2xl bg-white shadow-[0_4px_16px_rgba(85,60,154,0.20),0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8E2D5] flex items-center justify-center text-[#553C9A] mb-2 transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_8px_22px_rgba(85,60,154,0.30)]">
                <svg className="w-8 h-8 drop-shadow-[0_2px_4px_rgba(85,60,154,0.30)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 40 40">
                  <path d="M20 13v20M20 13C17 10 9 10 6 12v20c3-2 11-2 14 1M20 13c3-3 11-3 14-1v20c-3-2-11-2-14 1" />
                  <path d="M20 4v4M14 6l2 2M26 6l-2 2" />
                </svg>
              </div>
              <span className="text-[13.5px] font-bold text-[#1B2922] leading-tight block">Insights</span>
              <span className="text-[11px] font-medium text-[#7C8B82] leading-tight mt-0.5">Guides &amp; News</span>
            </Link>
          </div>
        </section>

        {/* Elegant Partition between Core Features & My Favorites */}
        <div className="relative my-7 flex items-center justify-center select-none" aria-hidden="true">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#DDD6C8] to-transparent" />
          </div>
          <div className="relative px-3.5 py-0.5 rounded-full bg-canvas flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#A8B7AD]" />
            <span className="text-[10px] text-[#7A8E82] font-serif italic tracking-widest uppercase">
              ✦
            </span>
            <span className="w-1 h-1 rounded-full bg-[#A8B7AD]" />
          </div>
        </div>

        {/* 4. My Favorites Section: iPhone-Style App Folder */}
        <IOSFolderFavorites
          favoriteItems={favoriteItems}
          onOpenCustomize={() => setCustomizeModal(true)}
          renderIcon={(type, className) => <ShortcutIcon type={type} className={className} />}
        />
      </div>

      {/* CUSTOMIZE FAVORITES MODAL */}
      {customizeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-line pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Customize Home Shortcuts
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Pick any feature detailing to show on your Home Screen
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizeModal(false)}
                className="p-1 rounded-full text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {ALL_AVAILABLE_SHORTCUTS.map((shortcut) => {
                const isSelected = favoriteIds.includes(shortcut.id);
                return (
                  <button
                    key={shortcut.id}
                    type="button"
                    onClick={() => toggleFavorite(shortcut.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-mint/40 border-forest text-foreground"
                        : "bg-white border-line hover:border-forest/30 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ color: shortcut.color }}
                      >
                        <ShortcutIcon type={shortcut.iconType} className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-foreground">
                            {shortcut.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                            {shortcut.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {shortcut.subtitle}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition ${
                        isSelected
                          ? "bg-forest text-white border-forest"
                          : "border-line text-transparent"
                      }`}
                    >
                      <Check size={13} strokeWidth={2.5} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-line shrink-0">
              <button
                type="button"
                onClick={() => setCustomizeModal(false)}
                className="w-full py-3 rounded-2xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* City Selection Modal */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl relative space-y-3.5">
            <button
              type="button"
              onClick={() => setCityModalOpen(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-foreground p-1 rounded-full bg-sand/60"
            >
              <X size={18} />
            </button>

            <div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                <MapPin size={11} /> Select Location
              </span>
              <h3 className="text-base font-serif font-bold text-[#1B2922] mt-1.5">
                Choose Your City
              </h3>
              <p className="text-xs text-ink-muted">
                Properties, daily material rates and market updates will customize for this city.
              </p>
            </div>

            {/* Indian Cities Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {allCities.map((c) => {
                const isSelected = city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      changeCity(c);
                      setCityModalOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-forest text-white border-forest shadow-2xs font-bold"
                        : "bg-white text-[#1B2922] border-line hover:border-forest/40"
                    }`}
                  >
                    <span className="text-xs">{c}</span>
                    {isSelected && <Check size={14} className="text-white" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-1 text-center">
              <span className="text-[10px] text-ink-muted">
                Active City: <strong>{city}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DiscoveryHome() {
  const { s, email } = useStore();
  const ownerName = presentName(s.properties.find((property) => property.ownerName)?.ownerName || "");
  const mark = profileMark(email, ownerName);

  return <DiscoveryHomeView mark={mark} />;
}

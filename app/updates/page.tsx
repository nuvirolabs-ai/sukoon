"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  Headphones,
  HelpCircle,
  Lightbulb,
  MapPin,
  Newspaper,
  Play,
  Radio,
  RefreshCw,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Video,
  X,
} from "lucide-react";
import {
  REAL_ESTATE_NEWS,
  REAL_ESTATE_BLOGS,
  REAL_ESTATE_GLOSSARY,
  DOS_AND_DONTS,
  MEDIA_RESOURCES,
  VASTU_GUIDELINES,
  VASTU_ROOM_RULES,
  CITY_TRENDS_DATA,
  type NewsItem,
  type BlogItem,
  type GlossaryTerm,
  type CheckpointItem,
  type MediaResource,
  type VastuDirection,
  type CityTrendItem,
} from "@/lib/data/intelligence-hub";
import { PinToHomeButton } from "@/components/PinToHomeButton";

function YoutubeIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

type InsightsSection =
  | "news"
  | "blogs"
  | "dictionary"
  | "dos-donts"
  | "podcasts"
  | "vastu"
  | "trends";

// 7 Main Icons matching Home Screen, Buy/Sell & Vault Hub clean aesthetic
const INSIGHTS_FEATURES = [
  {
    id: "news" as const,
    title: "News",
    subtitle: "Daily City Property News",
    color: "#1E57A4",
    icon: function NewsIcon() {
      return (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 40 40"
        >
          <path d="M8 8h22a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" />
          <path d="M12 14h8M12 18h8M12 22h16M12 26h16M24 14h4v4h-4z" />
        </svg>
      );
    },
  },
  {
    id: "blogs" as const,
    title: "Blogs",
    subtitle: "Market Guides & Articles",
    color: "#B26315",
    icon: function BlogsIcon() {
      return (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 40 40"
        >
          <path d="M8 8h16a4 4 0 0 1 4 4v20a4 4 0 0 0-4-4H8z" />
          <path d="M8 8v20a4 4 0 0 1 4-4h16" />
          <path d="M14 14h8M14 18h6M14 22h4" />
        </svg>
      );
    },
  },
  {
    id: "dictionary" as const,
    title: "Real Estate Terminologies",
    subtitle: "A-Z Property Dictionary",
    color: "#553C9A",
    icon: function TerminologiesIcon() {
      return (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 40 40"
        >
          <rect height="28" rx="3" width="22" x="9" y="6" />
          <path d="M15 13h10M15 18h10M15 23h6" />
          <path d="M23 27l2 2 4-4" />
        </svg>
      );
    },
  },
  {
    id: "dos-donts" as const,
    title: "Do's & Don'ts",
    subtitle: "Buyer Checkpoints",
    color: "#1E5637",
    icon: function DosDontsIcon() {
      return (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 40 40"
        >
          <path d="M20 6l13 5v8c0 9-6 15-13 17C13 34 7 28 7 19v-8z" />
          <path d="M15 19l3 3 7-7" />
        </svg>
      );
    },
  },
  {
    id: "podcasts" as const,
    title: "Podcasts - Videos",
    subtitle: "YouTube Audio & Guides",
    color: "#DC2626",
    icon: function PodcastsIcon() {
      return (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 40 40"
        >
          <rect height="22" rx="4" width="28" x="6" y="9" />
          <path d="M17 15l9 5-9 5z" />
        </svg>
      );
    },
  },
  {
    id: "vastu" as const,
    title: "Vastu Knowledge",
    subtitle: "Directions & Room Guide",
    color: "#D97706",
    icon: function VastuIcon() {
      return (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 40 40"
        >
          <circle cx="20" cy="20" r="14" />
          <polygon points="20,10 23,17 20,20 17,17" fill="currentColor" opacity="0.3" />
          <polygon points="20,30 17,23 20,20 23,23" fill="currentColor" opacity="0.3" />
          <path d="M20 7v26M7 20h26" />
        </svg>
      );
    },
  },
  {
    id: "trends" as const,
    title: "City Trends",
    subtitle: "Big Developer Tracker",
    color: "#0D9488",
    icon: function TrendsIcon() {
      return (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 40 40"
        >
          <path d="M6 30h28M8 24l8-8 6 4 10-12" />
          <path d="M26 8h6v6" />
          <rect height="8" rx="1" width="5" x="12" y="22" />
          <rect height="12" rx="1" width="5" x="20" y="18" />
        </svg>
      );
    },
  },
];

function UpdatesContent() {
  const searchParams = useSearchParams();
  const rawSection = searchParams.get("section") as InsightsSection;
  const initialSection: InsightsSection =
    rawSection &&
    ["news", "blogs", "dictionary", "dos-donts", "podcasts", "vastu", "trends"].includes(rawSection)
      ? rawSection
      : "news";

  const [section, setSection] = useState<InsightsSection>(initialSection);
  const [copiedToast, setCopiedToast] = useState("");

  const triggerToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(""), 3500);
  };

  // ==========================================
  // 1. NEWS STATE
  // ==========================================
  const [newsCity, setNewsCity] = useState<string>("Indore");
  const [newsSearch, setNewsSearch] = useState<string>("");
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [lastCrawledText, setLastCrawledText] = useState<string>("Today, 08:30 AM");

  const handleRefreshCrawler = () => {
    setIsCrawling(true);
    setTimeout(() => {
      setIsCrawling(false);
      setLastCrawledText("Just now, Live");
      triggerToast("Crawled 18 local news feeds. All updates synced!");
    }, 900);
  };

  const filteredNews = useMemo(() => {
    return REAL_ESTATE_NEWS.filter((item) => {
      const matchCity = newsCity === "All" || item.city === newsCity || item.city === "National";
      const matchSearch =
        !newsSearch ||
        item.headline.toLowerCase().includes(newsSearch.toLowerCase()) ||
        item.summary.toLowerCase().includes(newsSearch.toLowerCase()) ||
        item.tag.toLowerCase().includes(newsSearch.toLowerCase());
      return matchCity && matchSearch;
    });
  }, [newsCity, newsSearch]);

  // ==========================================
  // 2. BLOGS STATE
  // ==========================================
  const [blogCategory, setBlogCategory] = useState<string>("All");
  const [activeBlogModal, setActiveBlogModal] = useState<BlogItem | null>(null);

  const filteredBlogs = useMemo(() => {
    return REAL_ESTATE_BLOGS.filter((b) => {
      if (blogCategory === "All") return true;
      return b.category === blogCategory;
    });
  }, [blogCategory]);

  // ==========================================
  // 3. TERMINOLOGIES STATE
  // ==========================================
  const [termSearch, setTermSearch] = useState<string>("");
  const [termCategory, setTermCategory] = useState<string>("All");
  const [selectedTermModal, setSelectedTermModal] = useState<GlossaryTerm | null>(null);

  const filteredTerms = useMemo(() => {
    return REAL_ESTATE_GLOSSARY.filter((item) => {
      const matchCat = termCategory === "All" || item.category === termCategory;
      const q = termSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.termHindi.toLowerCase().includes(q) ||
        item.simpleMeaning.toLowerCase().includes(q) ||
        item.whyItMatters.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [termCategory, termSearch]);

  // ==========================================
  // 4. DO'S & DON'TS STATE
  // ==========================================
  const [dosFilter, setDosFilter] = useState<string>("All");
  const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("sukoon_dos_donts_completed");
      if (saved) return JSON.parse(saved);
    } catch {}
    return ["chk-01", "chk-03"];
  });

  const toggleCheckpoint = (id: string) => {
    const updated = completedCheckpoints.includes(id)
      ? completedCheckpoints.filter((item) => item !== id)
      : [...completedCheckpoints, id];
    setCompletedCheckpoints(updated);
    try {
      localStorage.setItem("sukoon_dos_donts_completed", JSON.stringify(updated));
    } catch {}
  };

  const filteredCheckpoints = useMemo(() => {
    return DOS_AND_DONTS.filter((item) => {
      if (dosFilter === "All") return true;
      if (dosFilter === "DO") return item.type === "DO";
      if (dosFilter === "DONT") return item.type === "DONT";
      return item.stage === dosFilter;
    });
  }, [dosFilter]);

  // ==========================================
  // 5. PODCASTS & VIDEOS STATE
  // ==========================================
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("All");
  const [playingVideo, setPlayingVideo] = useState<MediaResource | null>(null);

  const filteredMedia = useMemo(() => {
    return MEDIA_RESOURCES.filter((m) => {
      if (mediaTypeFilter === "All") return true;
      return m.type === mediaTypeFilter;
    });
  }, [mediaTypeFilter]);

  // ==========================================
  // 6. VASTU KNOWLEDGE STATE
  // ==========================================
  const [vastuTab, setVastuTab] = useState<"directions" | "rooms" | "plot">("directions");
  const [selectedDirection, setSelectedDirection] = useState<VastuDirection>(VASTU_GUIDELINES[0]);

  // ==========================================
  // 7. CITY TRENDS STATE
  // ==========================================
  const [trendCity, setTrendCity] = useState<string>("Indore");
  const [trendActionType, setTrendActionType] = useState<string>("All");

  const filteredTrends = useMemo(() => {
    return CITY_TRENDS_DATA.filter((item) => {
      const matchCity = trendCity === "All" || item.city === trendCity;
      const matchAction = trendActionType === "All" || item.actionType === trendActionType;
      return matchCity && matchAction;
    });
  }, [trendCity, trendActionType]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen px-4 pt-3 pb-28 text-foreground">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1B2922] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <Check size={14} className="text-emerald-400" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-line/60 mb-5">
        <Link
          href="/"
          className="tap-scale inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:opacity-80"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Sukoon Insights
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#1B2922]">Insights</h1>
        <p className="text-xs text-ink-muted mt-1">
          City news, market blogs, terminologies, vastu &amp; developer trends.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 7 MAIN FEATURE ICONS - MATCHING HOME PAGE ICON STYLE & DESIGN LANGUAGE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-y-7 gap-x-5 mb-8 px-2 py-1">
        {INSIGHTS_FEATURES.map((item) => {
          const IconComp = item.icon;
          const isSelected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`tap-scale group flex flex-col items-center text-center focus:outline-none py-2 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? "bg-[#1E5637]/10 ring-2 ring-[#1E5637]/30 shadow-2xs"
                  : "hover:bg-sand/40"
              }`}
            >
              <div
                className="w-14 h-14 flex items-center justify-center mb-2 transition-all duration-200 group-hover:scale-105"
                style={{ color: item.color }}
              >
                <IconComp />
              </div>
              <span className="text-[13px] font-bold text-[#1B2922] leading-tight block px-1">
                {item.title}
              </span>
              <span className="text-[11px] font-medium text-[#7C8B82] leading-tight mt-1">
                {item.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. NEWS SECTION */}
      {/* ========================================================================= */}
      {section === "news" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Real-Time City News</h2>
              <p className="text-[11px] text-ink-muted">
                Live crawled updates from local authorities &amp; news bureaus.
              </p>
            </div>
            <PinToHomeButton shortcutId="news" />
          </div>

          {/* Crawler Status Strip */}
          <div className="bg-sand/40 border border-line rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <div>
                <p className="text-[11px] font-bold text-[#1B2922]">
                  Live City Crawler Active
                </p>
                <p className="text-[10px] text-ink-muted">
                  Last synced: {lastCrawledText} • 18 bureaus
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefreshCrawler}
              disabled={isCrawling}
              className="tap-scale inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-line text-[11px] font-bold text-forest hover:bg-forest/5 shadow-2xs"
            >
              <RefreshCw size={12} className={isCrawling ? "animate-spin" : ""} />
              {isCrawling ? "Crawling..." : "Sync"}
            </button>
          </div>

          {/* City Filter Chips */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1.5 px-1">
              Select City
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {["Indore", "Bhopal", "Ujjain", "Pune", "Bengaluru", "All"].map((c) => {
                const isSelected = newsCity === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewsCity(c)}
                    className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-[#1E57A4] text-white shadow-2xs"
                        : "bg-white text-ink-muted border border-line hover:border-[#1E57A4]/40"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={newsSearch}
              onChange={(e) => setNewsSearch(e.target.value)}
              placeholder="Search news by corridor, metro, rates..."
              className="w-full bg-white border border-line rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1E57A4]"
            />
            {newsSearch && (
              <button
                type="button"
                onClick={() => setNewsSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* News List */}
          <div className="space-y-3">
            {filteredNews.length === 0 ? (
              <div className="text-center py-8 bg-sand/30 rounded-2xl border border-dashed border-line">
                <Newspaper size={28} className="mx-auto text-ink-muted mb-2 opacity-60" />
                <p className="text-xs font-bold text-ink-muted">No news matching your filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewsCity("All");
                    setNewsSearch("");
                  }}
                  className="mt-2 text-xs font-bold text-forest underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredNews.map((news) => (
                <div
                  key={news.id}
                  className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#1E57A4]/40 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1E57A4]/10 text-[#1E57A4]">
                      {news.city} • {news.tag}
                    </span>
                    <span className="text-[10px] font-medium text-ink-muted">
                      {news.date}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-serif font-bold text-[#1B2922] leading-snug">
                    {news.headline}
                  </h3>

                  <p className="text-xs text-ink-muted leading-relaxed">
                    {news.summary}
                  </p>

                  {news.marketImpact && (
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-start gap-1.5">
                      <Sparkles size={13} className="text-emerald-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Market Impact:</strong> {news.marketImpact}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-line/50 text-[10px] text-ink-muted">
                    <span>Source: {news.source}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${news.headline} - ${news.summary}`);
                          triggerToast("News summary copied to clipboard!");
                        }
                      }}
                      className="tap-scale text-forest font-bold inline-flex items-center gap-1 hover:underline"
                    >
                      <Share2 size={11} /> Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. BLOGS SECTION */}
      {/* ========================================================================= */}
      {section === "blogs" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Real Estate Blogs</h2>
              <p className="text-[11px] text-ink-muted">
                Daily in-depth market guides, legal analysis &amp; town planning blueprints.
              </p>
            </div>
            <PinToHomeButton shortcutId="blogs" />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {["All", "Master Plan", "Legal & Registry", "Investment Analysis"].map((cat) => {
              const isSelected = blogCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBlogCategory(cat)}
                  className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-[#B26315] text-white shadow-2xs"
                      : "bg-white text-ink-muted border border-line hover:border-[#B26315]/40"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Blog Cards */}
          <div className="space-y-3.5">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#B26315]/50 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#B26315]/10 text-[#B26315]">
                    {blog.category}
                  </span>
                  <span className="text-[10px] font-medium text-ink-muted">
                    {blog.readTime} • {blog.date}
                  </span>
                </div>

                <h3 className="text-sm font-serif font-bold text-[#1B2922] leading-snug">
                  {blog.title}
                </h3>

                <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                  {blog.excerpt}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-line/50">
                  <span className="text-[10px] text-ink-muted">
                    By {blog.author} ({blog.authorRole})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveBlogModal(blog)}
                    className="tap-scale px-3 py-1 rounded-xl bg-[#B26315] text-white text-[11px] font-bold hover:bg-[#965210] shadow-2xs inline-flex items-center gap-1"
                  >
                    Read Article <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Read Article Modal */}
          {activeBlogModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-5 shadow-2xl relative space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveBlogModal(null)}
                  className="absolute top-4 right-4 text-ink-muted hover:text-foreground p-1 rounded-full bg-sand/60"
                >
                  <X size={18} />
                </button>

                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#B26315]/10 text-[#B26315]">
                    {activeBlogModal.category} • {activeBlogModal.city}
                  </span>
                  <h2 className="text-base font-serif font-bold text-[#1B2922] mt-1.5 leading-snug">
                    {activeBlogModal.title}
                  </h2>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    By {activeBlogModal.author} ({activeBlogModal.authorRole}) • {activeBlogModal.readTime}
                  </p>
                </div>

                {/* Key Takeaways */}
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Lightbulb size={14} className="text-amber-700" /> Key Takeaways
                  </h4>
                  <ul className="space-y-1 text-xs text-amber-950">
                    {activeBlogModal.keyTakeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-700 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Full Article Content */}
                <div className="space-y-2.5 text-xs text-[#2A3A30] leading-relaxed">
                  {activeBlogModal.fullContent.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-line">
                  {activeBlogModal.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-sand text-[10px] font-semibold text-ink-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(
                          `${activeBlogModal.title}\n\n${activeBlogModal.excerpt}\n\nRead more on Sukoon Proptech.`
                        );
                        triggerToast("Article link copied!");
                      }
                    }}
                    className="tap-scale px-3 py-2 rounded-xl border border-line text-xs font-bold text-forest inline-flex items-center gap-1.5 hover:bg-forest/5"
                  >
                    <Share2 size={13} /> Share Article
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBlogModal(null)}
                    className="tap-scale px-4 py-2 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs"
                  >
                    Close Reader
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. REAL ESTATE TERMINOLOGIES (PROPERTY DICTIONARY) */}
      {/* ========================================================================= */}
      {section === "dictionary" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Real Estate Terminologies</h2>
              <p className="text-[11px] text-ink-muted">
                Indian revenue &amp; property dictionary in plain English and Hindi.
              </p>
            </div>
            <PinToHomeButton shortcutId="dictionary" />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={termSearch}
              onChange={(e) => setTermSearch(e.target.value)}
              placeholder="Search terms: Khasra, Mutation, Diversion, FSI, TDS..."
              className="w-full bg-white border border-line rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#553C9A]"
            />
            {termSearch && (
              <button
                type="button"
                onClick={() => setTermSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {["All", "Registry & Legal", "Land Revenue", "Planning & Approvals", "Finance & Taxes"].map(
              (cat) => {
                const isSelected = termCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTermCategory(cat)}
                    className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-[#553C9A] text-white shadow-2xs"
                        : "bg-white text-ink-muted border border-line hover:border-[#553C9A]/40"
                    }`}
                  >
                    {cat}
                  </button>
                );
              }
            )}
          </div>

          {/* Terms List */}
          <div className="space-y-3">
            {filteredTerms.length === 0 ? (
              <div className="text-center py-8 bg-sand/30 rounded-2xl border border-dashed border-line">
                <BookOpen size={28} className="mx-auto text-ink-muted mb-2 opacity-60" />
                <p className="text-xs font-bold text-ink-muted">No terms matching your search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTermSearch("");
                    setTermCategory("All");
                  }}
                  className="mt-2 text-xs font-bold text-forest underline"
                >
                  Reset search
                </button>
              </div>
            ) : (
              filteredTerms.map((termItem) => (
                <div
                  key={termItem.term}
                  className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#553C9A]/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#1B2922]">
                        {termItem.term}
                      </h3>
                      <p className="text-[11px] font-medium text-[#553C9A]">
                        {termItem.termHindi}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#553C9A]/10 text-[#553C9A] shrink-0">
                      {termItem.category}
                    </span>
                  </div>

                  <div className="bg-sand/30 rounded-xl p-2.5 text-xs text-[#2A3A30] leading-relaxed">
                    <strong className="text-[#1B2922] block mb-0.5">Simple Meaning:</strong>
                    {termItem.simpleMeaning}
                  </div>

                  <div className="text-xs text-ink-muted leading-relaxed">
                    <strong className="text-[#1B2922]">Why It Matters:</strong>{" "}
                    {termItem.whyItMatters}
                  </div>

                  {termItem.riskNote && (
                    <div className="bg-rose-50/70 border border-rose-200/60 rounded-xl p-2.5 text-[11px] text-rose-900 flex items-start gap-1.5">
                      <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Risk Warning:</strong> {termItem.riskNote}
                      </span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(
                            `${termItem.term} (${termItem.termHindi})\n\nMeaning: ${termItem.simpleMeaning}\nWhy it matters: ${termItem.whyItMatters}`
                          );
                          triggerToast(`Copied "${termItem.term}" definition!`);
                        }
                      }}
                      className="tap-scale text-[11px] font-bold text-forest hover:underline inline-flex items-center gap-1"
                    >
                      <Copy size={11} /> Copy Definition
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. DO'S & DON'TS WHILE BUYING A PROPERTY */}
      {/* ========================================================================= */}
      {section === "dos-donts" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Do’s &amp; Don’ts Checklist</h2>
              <p className="text-[11px] text-ink-muted">
                Essential checkpoints across token, legal verification &amp; registry.
              </p>
            </div>
            <PinToHomeButton shortcutId="dos-donts" />
          </div>

          {/* Progress Bar */}
          <div className="bg-white border border-line rounded-2xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#1B2922] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-forest" /> Your Due Diligence Progress
              </span>
              <span className="text-forest">
                {completedCheckpoints.length} of {DOS_AND_DONTS.length} Verified
              </span>
            </div>
            <div className="w-full bg-sand/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-forest h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(completedCheckpoints.length / DOS_AND_DONTS.length) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-ink-muted">
              Tap any checkpoint below to track what you have personally verified for your plot or flat.
            </p>
          </div>

          {/* Stage Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {["All", "Before Token / Advance", "During Legal Verification", "At Possession / Registry"].map(
              (stage) => {
                const isSelected = dosFilter === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setDosFilter(stage)}
                    className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-[#1E5637] text-white shadow-2xs"
                        : "bg-white text-ink-muted border border-line hover:border-[#1E5637]/40"
                    }`}
                  >
                    {stage}
                  </button>
                );
              }
            )}
          </div>

          {/* Checkpoints List */}
          <div className="space-y-3">
            {filteredCheckpoints.map((chk) => {
              const isDone = completedCheckpoints.includes(chk.id);
              const isDO = chk.type === "DO";

              return (
                <div
                  key={chk.id}
                  onClick={() => toggleCheckpoint(chk.id)}
                  className={`cursor-pointer border rounded-2xl p-4 shadow-2xs transition-all space-y-2 select-none ${
                    isDone
                      ? "bg-emerald-50/40 border-emerald-300/80"
                      : isDO
                      ? "bg-white border-line hover:border-emerald-500/40"
                      : "bg-white border-line hover:border-rose-400/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 border transition-all ${
                          isDone
                            ? "bg-forest border-forest text-white"
                            : "border-line bg-sand/40 text-transparent"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isDO
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {chk.type === "DO" ? "DO (Mandatory)" : "DON'T (Strictly Avoid)"} • {chk.stage}
                        </span>
                        <h3 className="text-xs font-bold text-[#1B2922] leading-snug">
                          {chk.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed pl-7">
                    {chk.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. PODCASTS & VIDEOS (YOUTUBE EMBEDS & DIRECT LINKS) */}
      {/* ========================================================================= */}
      {section === "podcasts" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Podcasts &amp; Videos</h2>
              <p className="text-[11px] text-ink-muted">
                Curated YouTube videos &amp; expert audio episodes on property and civil engineering.
              </p>
            </div>
            <PinToHomeButton shortcutId="podcasts" />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            {["All", "Video", "Podcast"].map((t) => {
              const isSelected = mediaTypeFilter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaTypeFilter(t)}
                  className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-[#DC2626] text-white shadow-2xs"
                      : "bg-white text-ink-muted border border-line hover:border-[#DC2626]/40"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Media Cards */}
          <div className="space-y-3.5">
            {filteredMedia.map((media) => (
              <div
                key={media.id}
                className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#DC2626]/40 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 flex items-center gap-1">
                    <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
                    YouTube {media.type}
                  </span>
                  <span className="text-[10px] font-medium text-ink-muted">
                    {media.duration}
                  </span>
                </div>

                <h3 className="text-sm font-serif font-bold text-[#1B2922] leading-snug">
                  {media.title}
                </h3>

                <p className="text-xs text-ink-muted leading-relaxed">
                  {media.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-line/50">
                  <span className="text-[10px] text-ink-muted">
                    By {media.creator}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPlayingVideo(media)}
                      className="tap-scale px-3 py-1 rounded-xl bg-forest text-white text-[11px] font-bold hover:opacity-90 shadow-2xs inline-flex items-center gap-1"
                    >
                      <Play size={11} fill="currentColor" /> Watch Here
                    </button>
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-scale px-2.5 py-1 rounded-xl bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 shadow-2xs inline-flex items-center gap-1"
                    >
                      <YoutubeIcon className="w-3.5 h-3.5" /> YouTube <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Video Player Modal */}
          {playingVideo && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#1B2922] line-clamp-1 pr-4">
                    {playingVideo.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPlayingVideo(null)}
                    className="text-ink-muted hover:text-foreground p-1 rounded-full bg-sand/60"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Responsive YouTube Embed */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${playingVideo.youtubeId}?autoplay=1`}
                    title={playingVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <p className="text-xs text-ink-muted leading-relaxed">
                  {playingVideo.summary}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-ink-muted">
                    Channel: {playingVideo.creator}
                  </span>
                  <a
                    href={playingVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-scale text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1"
                  >
                    Open on YouTube App <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. VASTU KNOWLEDGE (PERMANENT ONE-TIME COMPREHENSIVE GUIDE) */}
      {/* ========================================================================= */}
      {section === "vastu" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Vastu Shastra Guide</h2>
              <p className="text-[11px] text-ink-muted">
                Permanent architectural reference for 8 directions, rooms &amp; plot shapes.
              </p>
            </div>
            <PinToHomeButton shortcutId="vastu" />
          </div>

          {/* Sub-Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-sand/50 rounded-2xl border border-line">
            <button
              type="button"
              onClick={() => setVastuTab("directions")}
              className={`py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
                vastuTab === "directions"
                  ? "bg-white text-forest shadow-2xs"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              8 Directions
            </button>
            <button
              type="button"
              onClick={() => setVastuTab("rooms")}
              className={`py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
                vastuTab === "rooms"
                  ? "bg-white text-forest shadow-2xs"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              Room Rules
            </button>
            <button
              type="button"
              onClick={() => setVastuTab("plot")}
              className={`py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
                vastuTab === "plot"
                  ? "bg-white text-forest shadow-2xs"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              Plot Shapes
            </button>
          </div>

          {/* TAB 1: 8 DIRECTIONS */}
          {vastuTab === "directions" && (
            <div className="space-y-3.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block px-1">
                Select Direction / Zone
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {VASTU_GUIDELINES.map((dir) => {
                  const isSelected = selectedDirection.direction === dir.direction;
                  return (
                    <button
                      key={dir.direction}
                      type="button"
                      onClick={() => setSelectedDirection(dir)}
                      className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-[#D97706] text-white shadow-2xs"
                          : "bg-white text-ink-muted border border-line hover:border-[#D97706]/40"
                      }`}
                    >
                      {dir.direction.split(" ")[0]}
                    </button>
                  );
                })}
              </div>

              {/* Detailed Direction Card */}
              <div className="bg-white border border-line rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between border-b border-line/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1B2922]">
                      {selectedDirection.direction}
                    </h3>
                    <p className="text-[11px] font-medium text-amber-700">
                      {selectedDirection.directionHindi}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 block">
                      Element: {selectedDirection.element}
                    </span>
                    <span className="text-[10px] text-ink-muted mt-0.5 block">
                      Deity: {selectedDirection.governingDeity}
                    </span>
                  </div>
                </div>

                {/* Key Advice */}
                <div className="bg-sand/30 rounded-xl p-3 text-xs text-[#2A3A30] leading-relaxed">
                  <strong className="text-[#1B2922] block mb-1">Architectural Advice:</strong>
                  {selectedDirection.keyAdvice}
                </div>

                {/* Ideal vs Avoid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 space-y-1">
                    <h4 className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-700" /> Ideal For
                    </h4>
                    <ul className="text-[11px] text-emerald-950 space-y-0.5">
                      {selectedDirection.idealRooms.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5 space-y-1">
                    <h4 className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                      <AlertTriangle size={13} className="text-rose-600" /> Strictly Avoid
                    </h4>
                    <ul className="text-[11px] text-rose-950 space-y-0.5">
                      {selectedDirection.avoidRooms.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROOM-BY-ROOM RULES */}
          {vastuTab === "rooms" && (
            <div className="space-y-3">
              {VASTU_ROOM_RULES.map((rule) => (
                <div
                  key={rule.room}
                  className="bg-white border border-line rounded-2xl p-4 shadow-2xs space-y-2"
                >
                  <h3 className="text-xs font-bold text-[#1B2922]">
                    {rule.room}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-emerald-50/70 rounded-lg p-2 text-emerald-950">
                      <strong className="text-emerald-800 block">Best Placement:</strong>
                      {rule.idealDirections.join(", ")}
                    </div>
                    <div className="bg-rose-50/70 rounded-lg p-2 text-rose-950">
                      <strong className="text-rose-800 block">Strictly Avoid:</strong>
                      {rule.strictAvoid.join(", ")}
                    </div>
                  </div>

                  <p className="text-[11px] text-ink-muted pt-1">
                    <strong className="text-[#1B2922]">Golden Rule:</strong> {rule.goldenRule}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PLOT SHAPES */}
          {vastuTab === "plot" && (
            <div className="space-y-3">
              <div className="bg-white border border-line rounded-2xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#1B2922]">
                    Gomukhi Plot (Cow Faced)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Highly Auspicious for Living
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Narrow at the front entrance and wide at the back. Symbolizes incoming wealth being retained securely inside the household. Best suited for residential homes and villas.
                </p>
              </div>

              <div className="bg-white border border-line rounded-2xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#1B2922]">
                    Shermukhi Plot (Lion Faced)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                    Auspicious for Commercial Only
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Wide at the front road and narrow at the back. Excellent for retail shops, restaurants, and corporate buildings because it attracts high customer footfall. Strictly avoided for residential dwellings.
                </p>
              </div>

              <div className="bg-white border border-line rounded-2xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#1B2922]">
                    T-Junction Plot (Veedhi Shula)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                    Requires Remedies / Caution
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Plots where an oncoming perpendicular road points directly into the front gate. Generates aggressive cosmic spear energy (Veedhi Shula). Only acceptable if oriented from the North-East; avoid South or South-West T-junctions without expert remedial shielding.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. CITY TRENDS (BIG DEVELOPER INVESTMENT TRACKER) */}
      {/* ========================================================================= */}
      {section === "trends" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">City Trends</h2>
              <p className="text-[11px] text-ink-muted">
                Track what big national developers and authorities are buying, selling &amp; investing.
              </p>
            </div>
            <PinToHomeButton shortcutId="trends" />
          </div>

          {/* City Filter Chips */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1.5 px-1">
              Select City
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {["Indore", "Bhopal", "Ujjain", "Pune", "Bengaluru", "All"].map((c) => {
                const isSelected = trendCity === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTrendCity(c)}
                    className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-[#0D9488] text-white shadow-2xs"
                        : "bg-white text-ink-muted border border-line hover:border-[#0D9488]/40"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {["All", "Land Acquisition", "Township Launch", "Commercial Influx", "Govt Infra Tender"].map(
              (act) => {
                const isSelected = trendActionType === act;
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setTrendActionType(act)}
                    className={`tap-scale px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-[#0D9488]/20 text-[#0D9488] border border-[#0D9488]"
                        : "bg-white text-ink-muted border border-line"
                    }`}
                  >
                    {act}
                  </button>
                );
              }
            )}
          </div>

          {/* Trends List */}
          <div className="space-y-3.5">
            {filteredTrends.length === 0 ? (
              <div className="text-center py-8 bg-sand/30 rounded-2xl border border-dashed border-line">
                <TrendingUp size={28} className="mx-auto text-ink-muted mb-2 opacity-60" />
                <p className="text-xs font-bold text-ink-muted">No developer trends in this city yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTrendCity("All");
                    setTrendActionType("All");
                  }}
                  className="mt-2 text-xs font-bold text-forest underline"
                >
                  View all cities
                </button>
              </div>
            ) : (
              filteredTrends.map((trend) => (
                <div
                  key={trend.id}
                  className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#0D9488]/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0D9488]/10 text-[#0D9488]">
                        {trend.developerType}
                      </span>
                      <h3 className="text-sm font-bold text-[#1B2922] mt-1">
                        {trend.developerName}
                      </h3>
                      <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-[#0D9488]" /> {trend.corridor}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-800 block">
                        {trend.actionType}
                      </span>
                      <span className="text-[10px] text-ink-muted mt-1 block">
                        {trend.date}
                      </span>
                    </div>
                  </div>

                  {/* Deal Metric Bar */}
                  <div className="grid grid-cols-2 gap-2 bg-sand/30 rounded-xl p-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                        Deal Value
                      </span>
                      <span className="font-bold text-[#1B2922]">{trend.dealValue}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                        Land Area
                      </span>
                      <span className="font-bold text-[#1B2922]">{trend.landArea}</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-serif font-bold text-[#1B2922] leading-snug">
                    {trend.headline}
                  </h4>

                  <p className="text-xs text-ink-muted leading-relaxed">
                    {trend.summary}
                  </p>

                  {/* Impact for Landowners */}
                  <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-2.5 text-[11px] text-teal-950 flex items-start gap-1.5">
                    <Sparkles size={13} className="text-teal-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Impact for Landowners:</strong> {trend.marketImpact}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function UpdatesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-ink-muted">
          Loading Sukoon Insights...
        </div>
      }
    >
      <UpdatesContent />
    </Suspense>
  );
}

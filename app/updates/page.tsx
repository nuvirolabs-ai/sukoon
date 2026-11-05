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
  | "trends"
  | "compass";

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
    color: "#195A50",
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
    id: "compass" as const,
    title: "Vastu Compass",
    subtitle: "Live Direction & Shubh Disha",
    color: "#EB725B",
    icon: function CompassIcon() {
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
          <path d="M20 6v4M20 30v4M6 20h4M30 20h4" strokeWidth="1.8" />
          <polygon points="20,10 24,19 20,28 16,19" fill="#EB725B" fillOpacity="0.85" stroke="#195A50" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="2.5" fill="#195A50" />
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

const ROOM_VASTU_GUIDE = [
  {
    id: "entrance",
    name: "Main Entrance (मुख्य द्वार)",
    best: "North, North-East (Ishan), East",
    avoid: "South-West (Nairruti), South",
    tips: "Entrance in North brings Kubera wealth; NE brings spiritual peace. Keep it well-lit, elevated slightly above road level, and clutter-free.",
    badge: "Auspicious in North/East",
  },
  {
    id: "mandir",
    name: "Mandir / Pooja Room (पूजा घर)",
    best: "North-East (Ishan Kon)",
    avoid: "South, South-West, Under Staircase, Adjacent to Toilet",
    tips: "Ishan kon has supreme cosmic energy. Faces of idols should face West or East, devotee faces East while praying. Keep Mandir on ground level with white or cream tones.",
    badge: "100% Divine in Ishan",
  },
  {
    id: "kitchen",
    name: "Kitchen (रसोईघर)",
    best: "South-East (Agni Kon) or North-West (Vayu)",
    avoid: "North-East, South-West, Directly below toilet",
    tips: "Cook should face East while cooking. Sink should be in North-East (water element) and Stove in South-East (fire element) to avoid element clash.",
    badge: "Agni Kon Ideal",
  },
  {
    id: "master_bedroom",
    name: "Master Bedroom (मास्टर बेडरूम)",
    best: "South-West (Nairruti Kon)",
    avoid: "North-East, North-West",
    tips: "Head of the family must anchor in Nairruti kon for stability, leadership, and sound sleep. Sleep with head towards South or East.",
    badge: "Nairruti Anchor",
  },
  {
    id: "study",
    name: "Study & Kids Room (अध्ययन कक्ष)",
    best: "East, North-East, West",
    avoid: "South-West, South",
    tips: "Children should face North or East while studying to enhance concentration, memory recall, and academic clarity.",
    badge: "East / North-East",
  },
  {
    id: "living",
    name: "Living Room (बैठक)",
    best: "North, East, North-West",
    avoid: "South-West",
    tips: "Guests should be seated in NW or East; owner faces East or North. Keeps guest energy peaceful and harmonious.",
    badge: "North / East / NW",
  },
  {
    id: "toilet",
    name: "Toilet / Washroom (शौचालय)",
    best: "North-West (Vayu) or West of South",
    avoid: "North-East (Strict Vastu Dosha), South-West, Center (Brahmasthan)",
    tips: "Never construct toilet in North-East as it drains positive magnetic energy and prosperity. Keep exhaust fan towards East or North.",
    badge: "NW / West Permissible",
  },
  {
    id: "tank",
    name: "Overhead Water Tank (पानी की टंकी)",
    best: "South-West (Nairruti) or West",
    avoid: "North-East, South-East",
    tips: "Heavy water storage on SW adds required physical weight to the South-West corner, which strengthens family stability.",
    badge: "South-West Heavy",
  },
];

function getVastuDirection(deg: number) {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) {
    return {
      code: "N",
      name: "North • उत्तर (Uttar)",
      deity: "Lord Kubera (कुबेर)",
      element: "Water (जल तत्व)",
      color: "#195A50",
      vastuSummary: "Treasury, wealth inflow, main door, expansive windows, open green lawn.",
      vibe: "Wealth & New Opportunities",
      score: "98% Auspicious",
    };
  }
  if (normalized >= 22.5 && normalized < 67.5) {
    return {
      code: "NE",
      name: "North-East • ईशान (Ishan Kon)",
      deity: "Lord Shiva (ईशान / महादेव)",
      element: "Water & Space (जल / आकाश तत्व)",
      color: "#195A50",
      vastuSummary: "Pooja Ghar, meditation zone, water fountain, open terrace, underground water tank.",
      vibe: "Supreme Cosmic Energy & Peace",
      score: "100% Divine & Sacred",
    };
  }
  if (normalized >= 67.5 && normalized < 112.5) {
    return {
      code: "E",
      name: "East • पूर्व (Purva)",
      deity: "Lord Indra / Surya (सूर्य / इंद्र)",
      element: "Air & Fire (अग्नि / सूर्य ऊर्जा)",
      color: "#195A50",
      vastuSummary: "Main gate, study room, balcony, morning sunlight court.",
      vibe: "Health, Vitality & Fame",
      score: "95% Auspicious",
    };
  }
  if (normalized >= 112.5 && normalized < 157.5) {
    return {
      code: "SE",
      name: "South-East • आग्नेय (Agni Kon)",
      deity: "Lord Agni (अग्नि देव)",
      element: "Fire (अग्नि तत्व)",
      color: "#EB725B",
      vastuSummary: "Kitchen cooktop, electrical meter, inverter, boiler, heating appliances.",
      vibe: "Energy, Passion & Health",
      score: "Ideal for Kitchen",
    };
  }
  if (normalized >= 157.5 && normalized < 202.5) {
    return {
      code: "S",
      name: "South • दक्षिण (Dakshin)",
      deity: "Lord Yama (यम)",
      element: "Earth (पृथ्वी तत्व)",
      color: "#195A50",
      vastuSummary: "Heavy furniture, high boundary wall, store room, internal staircase.",
      vibe: "Discipline, Endurance & Rest",
      score: "Auspicious if Elevated & Heavy",
    };
  }
  if (normalized >= 202.5 && normalized < 247.5) {
    return {
      code: "SW",
      name: "South-West • नैऋत्य (Nairruti Kon)",
      deity: "Nairruti / Ancestors (पितृ / नैऋत्य)",
      element: "Earth (पृथ्वी तत्व)",
      color: "#EB725B",
      vastuSummary: "Master bedroom, head of family, heavy almirah / cash locker, overhead tank.",
      vibe: "Leadership, Authority & Strength",
      score: "Anchor of the Household",
    };
  }
  if (normalized >= 247.5 && normalized < 292.5) {
    return {
      code: "W",
      name: "West • पश्चिम (Pashchim)",
      deity: "Lord Varuna (वरुण देव)",
      element: "Space & Water (आकाश / जल)",
      color: "#195A50",
      vastuSummary: "Dining room, children study, overhead tank, home library.",
      vibe: "Prosperity, Stability & Gains",
      score: "Good for Dining & Study",
    };
  }
  return {
    code: "NW",
    name: "North-West • वायव्य (Vayu Kon)",
    deity: "Lord Vayu (वायु देव)",
    element: "Air (वायु तत्व)",
    color: "#EB725B",
    vastuSummary: "Guest room, married daughters room, car garage, finished merchandise storage.",
    vibe: "Motion, Travel & Social Ties",
    score: "Perfect for Guests & Movement",
  };
}

function UpdatesContent() {
  const searchParams = useSearchParams();
  const rawSection = searchParams.get("section") as InsightsSection;
  const initialSection: InsightsSection | null =
    rawSection &&
    ["news", "blogs", "dictionary", "dos-donts", "podcasts", "vastu", "trends", "compass"].includes(rawSection)
      ? rawSection
      : null;

  const [section, setSection] = useState<InsightsSection | null>(initialSection);
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

  // ==========================================
  // 8. VASTU COMPASS UTILITY STATE
  // ==========================================
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [selectedRoomCheck, setSelectedRoomCheck] = useState<string>("entrance");

  const toggleSensor = async () => {
    if (typeof window === "undefined") return;
    if (isSensorActive) {
      setIsSensorActive(false);
      return;
    }
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        // @ts-expect-error iOS Safari permission API
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        // @ts-expect-error iOS Safari permission API
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          triggerToast("Sensor permission denied");
          return;
        }
      }

      const handler = (e: DeviceOrientationEvent) => {
        // @ts-expect-error webkitCompassHeading
        let heading = e.webkitCompassHeading;
        if (heading === undefined && e.alpha !== null) {
          heading = 360 - e.alpha;
        }
        if (typeof heading === "number") {
          setCompassHeading(Math.round(heading));
          setIsSensorActive(true);
        }
      };

      window.addEventListener("deviceorientation", handler, true);
      setIsSensorActive(true);
      triggerToast("Live Compass sensor connected");
    } catch {
      triggerToast("Device orientation not available. Use manual dial.");
    }
  };

  const currentVastu = useMemo(() => getVastuDirection(compassHeading), [compassHeading]);
  const activeRoomGuide = useMemo(
    () => ROOM_VASTU_GUIDE.find((r) => r.id === selectedRoomCheck),
    [selectedRoomCheck]
  );

  const handleCopyCompassReport = () => {
    const text = "🧭 SUKOON VASTU COMPASS DIRECTION REPORT\n\nCurrent Heading: " + compassHeading + "° (" + currentVastu.name + ")\nDeity: " + currentVastu.deity + " • Element: " + currentVastu.element + "\nVibe: " + currentVastu.vibe + "\nBest Uses: " + currentVastu.vastuSummary + "\nScore: " + currentVastu.score + "\n\nSelected Room: " + (activeRoomGuide ? activeRoomGuide.name : "") + "\n• Best Direction: " + (activeRoomGuide ? activeRoomGuide.best : "") + "\n• Avoid: " + (activeRoomGuide ? activeRoomGuide.avoid : "") + "\n• Vastu Advice: " + (activeRoomGuide ? activeRoomGuide.tips : "") + "\n\n— Generated via Sukoon Proptech (https://sukoonproptech.com)";
    navigator.clipboard?.writeText(text);
    triggerToast("Vastu Direction Guidance copied!");
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen px-4 pt-3 pb-28 text-foreground">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#195A50] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <Check size={14} className="text-emerald-400" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-line/60 mb-5">
        {section === null ? (
          <Link
            href="/"
            className="tap-scale inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:opacity-80"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setSection(null)}
            className="tap-scale inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:opacity-80"
          >
            <ArrowLeft size={16} /> Back to Insights Hub
          </button>
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          {section === null
            ? "Sukoon Insights"
            : section === "news"
            ? "Real-Time News"
            : section === "blogs"
            ? "Market Blogs"
            : section === "dictionary"
            ? "Dictionary"
            : section === "dos-donts"
            ? "Do's & Don'ts"
            : section === "podcasts"
            ? "Podcasts & Media"
            : section === "vastu"
            ? "Vastu Knowledge"
            : section === "compass"
            ? "Vastu Compass"
            : "Developer Trends"}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: FOLDER HUB VIEW (ONLY DISPLAYED WHEN NO FOLDER IS OPENED) */}
      {/* ========================================================================= */}
      {section === null && (
        <div className="animate-in fade-in duration-200">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-[#195A50]">Insights Hub</h1>
            <p className="text-xs text-[#7D8C83] mt-1 leading-relaxed">
              Tap a folder below to explore live city news, real estate guides, legal terminology, vastu &amp; developer trends.
            </p>
          </div>

          {/* 7 MAIN FOLDER ICONS - TACTILE SQUIRCLE CARDS */}
          <div className="grid grid-cols-2 gap-3.5 mb-8">
            {INSIGHTS_FEATURES.map((item) => {
              const IconComp = item.icon;
              const isAccent = item.id === "blogs" || item.id === "vastu" || item.id === "compass";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className="tap-scale group flex flex-col justify-between text-left p-4 rounded-3xl bg-white border border-[#E9DCCF] shadow-[0_6px_20px_rgba(25,90,80,0.05)] hover:border-[#195A50]/40 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <div
                      className="w-13 h-13 rounded-2xl flex items-center justify-center mb-3 bg-[#FBEBE2] border border-[#E9DCCF] group-hover:scale-105 transition-transform"
                      style={{ color: isAccent ? "#EB725B" : "#195A50" }}
                    >
                      <IconComp />
                    </div>
                    <span className="text-xs font-bold text-[#195A50] leading-tight block">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-medium text-[#7D8C83] leading-tight mt-1 block">
                      {item.subtitle}
                    </span>
                  </div>
                  <div className="mt-3.5 pt-2 border-t border-[#E9DCCF] flex items-center justify-between text-[10px] font-bold text-[#195A50]">
                    <span>Open Folder</span>
                    <ChevronRight size={12} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: INSIDE THE FOLDER (SHOWS ONLY THE ACTIVE FEATURE DETAIL) */}
      {/* ========================================================================= */}
      {/* 1. NEWS SECTION */}
      {/* ========================================================================= */}
      {section === "news" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#195A50]">Real-Time City News</h2>
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
                <p className="text-[11px] font-bold text-[#195A50]">
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

                  <h3 className="text-[13px] font-serif font-bold text-[#195A50] leading-snug">
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
              <h2 className="text-sm font-bold text-[#195A50]">Real Estate Blogs</h2>
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

                <h3 className="text-sm font-serif font-bold text-[#195A50] leading-snug">
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
                  <h2 className="text-base font-serif font-bold text-[#195A50] mt-1.5 leading-snug">
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
              <h2 className="text-sm font-bold text-[#195A50]">Real Estate Terminologies</h2>
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
                      <h3 className="text-sm font-bold text-[#195A50]">
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
                    <strong className="text-[#195A50] block mb-0.5">Simple Meaning:</strong>
                    {termItem.simpleMeaning}
                  </div>

                  <div className="text-xs text-ink-muted leading-relaxed">
                    <strong className="text-[#195A50]">Why It Matters:</strong>{" "}
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
              <h2 className="text-sm font-bold text-[#195A50]">Do’s &amp; Don’ts Checklist</h2>
              <p className="text-[11px] text-ink-muted">
                Essential checkpoints across token, legal verification &amp; registry.
              </p>
            </div>
            <PinToHomeButton shortcutId="dos-donts" />
          </div>

          {/* Progress Bar */}
          <div className="bg-white border border-line rounded-2xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#195A50] flex items-center gap-1.5">
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
                        ? "bg-[#195A50] text-white shadow-2xs"
                        : "bg-white text-ink-muted border border-line hover:border-[#195A50]/40"
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
                        <h3 className="text-xs font-bold text-[#195A50] leading-snug">
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
              <h2 className="text-sm font-bold text-[#195A50]">Podcasts &amp; Videos</h2>
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

                <h3 className="text-sm font-serif font-bold text-[#195A50] leading-snug">
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
                  <h3 className="text-xs font-bold text-[#195A50] line-clamp-1 pr-4">
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
              <h2 className="text-sm font-bold text-[#195A50]">Vastu Shastra Guide</h2>
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
                    <h3 className="text-sm font-bold text-[#195A50]">
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
                  <strong className="text-[#195A50] block mb-1">Architectural Advice:</strong>
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
                  <h3 className="text-xs font-bold text-[#195A50]">
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
                    <strong className="text-[#195A50]">Golden Rule:</strong> {rule.goldenRule}
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
                  <h3 className="text-xs font-bold text-[#195A50]">
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
                  <h3 className="text-xs font-bold text-[#195A50]">
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
                  <h3 className="text-xs font-bold text-[#195A50]">
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
              <h2 className="text-sm font-bold text-[#195A50]">City Trends</h2>
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
                      <h3 className="text-sm font-bold text-[#195A50] mt-1">
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
                      <span className="font-bold text-[#195A50]">{trend.dealValue}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                        Land Area
                      </span>
                      <span className="font-bold text-[#195A50]">{trend.landArea}</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-serif font-bold text-[#195A50] leading-snug">
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

      {/* ========================================================================= */}
      {/* SECTION 8: VASTU COMPASS UTILITY */}
      {/* ========================================================================= */}
      {section === "compass" && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#EB725B]/15 text-[#EB725B]">
                Interactive Utility
              </span>
              <h2 className="text-xl font-serif font-bold text-[#195A50] mt-1">
                Vastu Compass
              </h2>
              <p className="text-xs text-[#7D8C83]">
                Live direction reader, room zones &amp; Shubh Disha matrix.
              </p>
            </div>

            <PinToHomeButton shortcutId="compass" />
          </div>

          {/* Real-time Compass Dial Card */}
          <div className="bg-white rounded-3xl border border-[#E9DCCF] p-5 shadow-[0_6px_20px_rgba(25,90,80,0.05)] text-center space-y-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E9DCCF]">
              <span className="font-bold text-[#195A50] flex items-center gap-1.5">
                <Compass size={15} className="text-[#EB725B]" /> Direction Dial
              </span>
              <button
                type="button"
                onClick={toggleSensor}
                className={"tap-scale px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 " + (isSensorActive ? "bg-[#195A50] text-white" : "bg-[#FBEBE2] text-[#195A50] border border-[#E9DCCF] hover:bg-[#F6C6AF]")}
              >
                <Radio size={12} className={isSensorActive ? "animate-pulse" : ""} />
                {isSensorActive ? "Live Sensor ON" : "Use Phone Compass"}
              </button>
            </div>

            {/* Circular Compass Visual */}
            <div className="relative w-56 h-56 mx-auto flex items-center justify-center my-2 select-none">
              {/* Outer Dial Circle with Degree Markers */}
              <div
                className="w-full h-full rounded-full border-4 border-[#E9DCCF] bg-linear-to-b from-[#FFF7EF] to-[#FBEBE2] relative flex items-center justify-center shadow-inner transition-transform duration-300 ease-out"
                style={{ transform: "rotate(" + (-compassHeading) + "deg)" }}
              >
                {/* 8 Cardinal Points */}
                <span className="absolute top-2 font-bold text-xs text-[#EB725B]">N</span>
                <span className="absolute right-2 font-bold text-xs text-[#195A50]">E</span>
                <span className="absolute bottom-2 font-bold text-xs text-[#195A50]">S</span>
                <span className="absolute left-2 font-bold text-xs text-[#195A50]">W</span>

                <span className="absolute top-5 right-5 font-semibold text-[9px] text-[#7D8C83]">NE</span>
                <span className="absolute bottom-5 right-5 font-semibold text-[9px] text-[#7D8C83]">SE</span>
                <span className="absolute bottom-5 left-5 font-semibold text-[9px] text-[#7D8C83]">SW</span>
                <span className="absolute top-5 left-5 font-semibold text-[9px] text-[#7D8C83]">NW</span>

                {/* Sub-degree tick marks */}
                <div className="absolute inset-4 rounded-full border border-dashed border-[#E9DCCF] pointer-events-none" />
              </div>

              {/* Fixed Needle Overlay pointing straight Up */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-36 relative flex flex-col justify-between items-center">
                  {/* North Needle (Red/Coral) */}
                  <div className="w-0 h-0 border-x-[7px] border-x-transparent border-b-[60px] border-b-[#EB725B] drop-shadow-sm" />
                  {/* South Needle (Evergreen) */}
                  <div className="w-0 h-0 border-x-[7px] border-x-transparent border-t-[60px] border-t-[#195A50] drop-shadow-sm" />
                </div>
                {/* Pivot Center Pin */}
                <div className="absolute w-5 h-5 rounded-full bg-white border-2 border-[#195A50] shadow-md flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#EB725B]" />
                </div>
              </div>
            </div>

            {/* Readout Numbers & Current Vastu Zone */}
            <div className="space-y-1">
              <div className="text-3xl font-serif font-black text-[#195A50] tracking-tight">
                {compassHeading}°
              </div>
              <div className="text-sm font-bold text-[#EB725B]">
                {currentVastu.name}
              </div>
              <p className="text-[11px] text-[#7D8C83]">
                Deity: <strong>{currentVastu.deity}</strong> • Element: <strong>{currentVastu.element}</strong>
              </p>
            </div>

            {/* Quick Direction Selector Buttons */}
            <div className="pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7D8C83] mb-2">
                Quick Orient / Tap Direction
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { label: "North (0°)", deg: 0 },
                  { label: "NE (45°)", deg: 45 },
                  { label: "East (90°)", deg: 90 },
                  { label: "SE (135°)", deg: 135 },
                  { label: "South (180°)", deg: 180 },
                  { label: "SW (225°)", deg: 225 },
                  { label: "West (270°)", deg: 270 },
                  { label: "NW (315°)", deg: 315 },
                ].map((item) => (
                  <button
                    key={item.deg}
                    type="button"
                    onClick={() => {
                      setCompassHeading(item.deg);
                      setIsSensorActive(false);
                    }}
                    className={"tap-scale py-1.5 px-1 rounded-xl text-[11px] font-semibold border transition " + (Math.abs(compassHeading - item.deg) <= 22 ? "bg-[#195A50] text-white border-[#195A50] shadow-xs" : "bg-[#FFF7EF] text-[#195A50] border-[#E9DCCF] hover:bg-[#FBEBE2]")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Direction Vastu Suitability Box */}
            <div className="bg-[#FFF7EF] border border-[#E9DCCF] rounded-2xl p-3.5 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D8C83]">
                  Directional Energy
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#195A50]/10 text-[#195A50]">
                  {currentVastu.score}
                </span>
              </div>
              <p className="font-semibold text-[#195A50] leading-snug">
                {currentVastu.vibe}
              </p>
              <p className="text-[11px] text-[#7D8C83] leading-relaxed">
                <strong>Best Uses:</strong> {currentVastu.vastuSummary}
              </p>
            </div>
          </div>

          {/* Room-by-Room Vastu Decision Engine */}
          <div className="bg-white rounded-3xl border border-[#E9DCCF] p-5 shadow-[0_6px_20px_rgba(25,90,80,0.05)] space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-[#195A50]">
                Room-by-Room Direction Guidance
              </h3>
              <p className="text-[11px] text-[#7D8C83]">
                Select any room or feature of your property to inspect its ideal Vastu zone:
              </p>
            </div>

            {/* Horizontal Room Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {ROOM_VASTU_GUIDE.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoomCheck(r.id)}
                  className={"tap-scale shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition " + (selectedRoomCheck === r.id ? "bg-[#195A50] text-white border-[#195A50] shadow-xs" : "bg-[#FFF7EF] text-[#195A50] border-[#E9DCCF] hover:bg-[#FBEBE2]")}
                >
                  {r.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Active Room Guide Detail */}
            {activeRoomGuide && (
              <div className="bg-[#FFF7EF] border border-[#E9DCCF] rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E9DCCF]">
                  <h4 className="font-serif font-bold text-sm text-[#195A50]">
                    {activeRoomGuide.name}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EB725B]/15 text-[#EB725B]">
                    {activeRoomGuide.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-white border border-[#E9DCCF] rounded-xl p-2.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-700" /> Best Direction
                    </span>
                    <p className="font-bold text-xs text-[#195A50]">{activeRoomGuide.best}</p>
                  </div>
                  <div className="bg-white border border-[#E9DCCF] rounded-xl p-2.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                      <AlertTriangle size={12} className="text-rose-700" /> Strictly Avoid
                    </span>
                    <p className="font-bold text-xs text-rose-900">{activeRoomGuide.avoid}</p>
                  </div>
                </div>

                <div className="text-[11.5px] text-[#7D8C83] leading-relaxed bg-white/70 p-3 rounded-xl border border-[#E9DCCF]">
                  <strong className="text-[#195A50]">Vastu Rule &amp; Practical Advice:</strong>{" "}
                  {activeRoomGuide.tips}
                </div>
              </div>
            )}

            {/* Action Bar: Copy Summary */}
            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyCompassReport}
                className="tap-scale inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#195A50] text-white text-xs font-semibold shadow-xs hover:bg-[#103B34]"
              >
                <Copy size={13} /> Copy Direction Summary
              </button>
            </div>
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

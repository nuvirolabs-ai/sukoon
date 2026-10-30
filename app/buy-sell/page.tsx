"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  Flame,
  Handshake,
  Heart,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Printer,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";
import {
  BANK_LOAN_DETAILS,
  BankLoanDetail,
  DAILY_WHATSAPP_DEALS,
  INDORE_GUIDELINE_RATES,
  LEGAL_DRAFT_TEMPLATES,
  LegalDraftTemplate,
  MULTI_CITY_GUIDELINE_RATES,
  REGISTERED_ASSOCIATES,
  RegisteredAssociate,
  WhatsAppDeal,
} from "@/lib/data/market-hub";
import { PinToHomeButton } from "@/components/PinToHomeButton";

type BuySellSection = "matchmaking" | "power-docs" | "post-deals" | "trending";

interface BuyerRequirement {
  id: string;
  type: string;
  sizeSqft: string;
  city: string;
  society: string;
  budget: string;
  phone: string;
  date: string;
}

interface UserPostedDeal {
  id: string;
  title: string;
  type: string;
  society: string;
  city: string;
  sizeSqft: string;
  priceFormatted: string;
  facing: string;
  sellerName: string;
  phone: string;
  highlights: string[];
  date: string;
}

// 4 Main Icons for Buy / Sell Hub matching Home Page clean aesthetic
const BUY_SELL_FEATURES = [
  {
    id: "matchmaking" as const,
    title: "Buy a property, Sell a property",
    subtitle: "Property Matchmaking",
    color: "#1E57A4",
    icon: function MatchmakingIcon() {
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
          <path d="M11 20a9 9 0 0 1 18 0M11 20l4-4M11 20l4 4M29 20l-4-4M29 20l-4 4" />
          <path d="M20 7v6M20 27v6" />
          <circle cx="20" cy="20" r="3" />
        </svg>
      );
    },
  },
  {
    id: "power-docs" as const,
    title: "Power docs",
    subtitle: "EMI, Loans & Drafting",
    color: "#553C9A",
    icon: function PowerDocsIcon() {
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
          <path d="M10 6h14l8 8v20H10z" />
          <path d="M24 6v8h8" />
          <path d="M16 18h10M16 23h10M16 28h5" />
          <circle cx="27" cy="27" r="3" />
        </svg>
      );
    },
  },
  {
    id: "post-deals" as const,
    title: "Post a Deal",
    subtitle: "Direct Seller Listing",
    color: "#B26315",
    icon: function PostDealIcon() {
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
          <path d="M15 15h6M18 12v6" />
        </svg>
      );
    },
  },
  {
    id: "trending" as const,
    title: "Trending deals",
    subtitle: "Area & Society Search",
    color: "#1E5637",
    icon: function TrendingIcon() {
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
          <path d="M7 27l8-8 6 6 12-12" />
          <path d="M25 13h8v8" />
          <path d="M7 33h26" />
        </svg>
      );
    },
  },
];

function BuySellContent() {
  const searchParams = useSearchParams();
  const rawParam = searchParams.get("section") || "";

  // Map backward compatibility links to new 4 sections
  const initialSection = useMemo<BuySellSection>(() => {
    if (rawParam === "matchmaking" || rawParam === "buy") return "matchmaking";
    if (rawParam === "power-docs" || rawParam === "listing" || rawParam === "guidelines")
      return "power-docs";
    if (rawParam === "post-deals" || rawParam === "sell" || rawParam === "add")
      return "post-deals";
    if (rawParam === "trending") return "trending";
    return "matchmaking";
  }, [rawParam]);

  const [section, setSection] = useState<BuySellSection>(initialSection);

  // SECTION 1: MATCHMAKING STATE
  const [matchMode, setMatchMode] = useState<"buy" | "sell">("buy");
  const [reqType, setReqType] = useState("Plot");
  const [reqSize, setReqSize] = useState("1,500 sq ft");
  const [reqCity, setReqCity] = useState("Indore");
  const [reqSociety, setReqSociety] = useState("");
  const [reqBudget, setReqBudget] = useState("₹50L - ₹1 Cr");
  const [reqPhone, setReqPhone] = useState("");
  const [reqSuccessMsg, setReqSuccessMsg] = useState("");
  const [postedRequirements, setPostedRequirements] = useState<BuyerRequirement[]>([]);

  // SECTION 2: POWER DOCS SUB-TABS STATE
  type PowerDocTab = "emi" | "loans" | "guideline" | "associates" | "drafting";
  const [powerTab, setPowerTab] = useState<PowerDocTab>("emi");

  // EMI Calculator State
  const [loanAmount, setLoanAmount] = useState(5000000); // 50 Lakhs
  const [interestRate, setInterestRate] = useState(8.5); // 8.5%
  const [loanTenureYears, setLoanTenureYears] = useState(20); // 20 years

  // Guideline Values Multi-City State
  const [selectedCityName, setSelectedCityName] = useState("Indore");
  const [guidelineSearch, setGuidelineSearch] = useState("");

  // Editable Legal Drafting State
  const [selectedDraftId, setSelectedDraftId] = useState<string>("draft-rental");
  const [draftVariables, setDraftVariables] = useState<Record<string, string>>({
    landlordName: "Akshay Sharma",
    tenantName: "Rahul Verma",
    propertyAddress: "Flat 302, Scheme 54, Vijay Nagar, Indore",
    monthlyRent: "18500",
    securityDeposit: "37000",
    agreementDate: "2026-11-01",
    sellerName: "Vikas Trivedi",
    buyerName: "Akshay Sharma",
    propertyDescription: "Plot No. 14, Scheme 54, PU-4, Indore (Area: 3,200 sq.ft)",
    totalDealAmount: "28500000",
    advanceTokenAmount: "2500000",
    registryDeadline: "2026-12-15",
    vendorName: "Vikas Trivedi",
    vendeeName: "Akshay Sharma",
    khasraNumber: "Khasra No. 142/2/1",
    subDistrict: "Tehsil Indore, District Indore (M.P.)",
    saleValue: "5200000",
    eastBoundary: "Colony 30 Feet Cement Road",
    westBoundary: "Plot No. 15",
    northBoundary: "Plot No. 22",
    southBoundary: "Open Park Boundary",
    advocateName: "Adv. Rajesh Saxena (High Court Bar)",
    clientName: "Akshay Sharma",
    propertyDetail: "Plot No. 14, Sector B, Scheme 140, Indore (Area 1,500 sq.ft)",
    cityDistrict: "Indore (M.P.)",
    advocateContact: "+91 98260 11223",
    publishedDate: "30-10-2026",
    deponentName: "Akshay Sharma",
    fatherOrSpouseName: "Late Shri R. K. Sharma",
    deponentAge: "42",
    deponentAddress: "Scheme 54, Vijay Nagar, Indore (M.P.)",
    purposeOfAffidavit: "Namantaran (Mutation), Title Clearance & Municipal Record Update",
    notaryCity: "Indore (M.P.)",
    affidavitDate: "30-10-2026",
  });
  const [copiedDraft, setCopiedDraft] = useState(false);

  // SECTION 3: POST DEALS STATE
  const [postTab, setPostTab] = useState<"form" | "my-deals">("form");
  const [dealTitle, setDealTitle] = useState("");
  const [dealType, setDealType] = useState("Plot");
  const [dealSociety, setDealSociety] = useState("");
  const [dealCity, setDealCity] = useState("Indore");
  const [dealSize, setDealSize] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [dealFacing, setDealFacing] = useState("East Facing");
  const [dealSellerName, setDealSellerName] = useState("");
  const [dealPhone, setDealPhone] = useState("");
  const [dealSuccessMsg, setDealSuccessMsg] = useState("");
  const [userPostedDeals, setUserPostedDeals] = useState<UserPostedDeal[]>([]);

  // SECTION 4: TRENDING DEALS STATE
  const [areaSearch, setAreaSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Load saved buyer requirements & user posted deals from localStorage
  useEffect(() => {
    try {
      const savedReqs = localStorage.getItem("sukoon_buyer_requirements");
      if (savedReqs) setPostedRequirements(JSON.parse(savedReqs));

      const savedDeals = localStorage.getItem("sukoon_user_posted_deals");
      if (savedDeals) setUserPostedDeals(JSON.parse(savedDeals));
    } catch {}
  }, []);

  // Save buyer requirements
  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSociety && !reqSize) return;

    const newReq: BuyerRequirement = {
      id: "req-" + Date.now(),
      type: reqType,
      sizeSqft: reqSize,
      city: reqCity,
      society: reqSociety || "Any preferred area in " + reqCity,
      budget: reqBudget,
      phone: reqPhone || "+91 98260 00000",
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    const updated = [newReq, ...postedRequirements];
    setPostedRequirements(updated);
    try {
      localStorage.setItem("sukoon_buyer_requirements", JSON.stringify(updated));
    } catch {}

    setReqSuccessMsg("Requirement posted! Sukoon matchmaker will notify you of verified matches.");
    setTimeout(() => setReqSuccessMsg(""), 5000);
  };

  const handleDeleteRequirement = (id: string) => {
    const updated = postedRequirements.filter((r) => r.id !== id);
    setPostedRequirements(updated);
    try {
      localStorage.setItem("sukoon_buyer_requirements", JSON.stringify(updated));
    } catch {}
  };

  // Save posted deal
  const handlePostDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle || !dealPrice || !dealSociety) return;

    const newDeal: UserPostedDeal = {
      id: "user-deal-" + Date.now(),
      title: dealTitle,
      type: dealType,
      society: dealSociety,
      city: dealCity,
      sizeSqft: dealSize || "1,500 sq ft",
      priceFormatted: dealPrice.startsWith("₹") ? dealPrice : `₹${dealPrice}`,
      facing: dealFacing,
      sellerName: dealSellerName || "Direct Owner",
      phone: dealPhone || "+91 98260 00000",
      highlights: [
        "100% Clear Freehold Title",
        "Mutation (Namantaran) Done",
        "Direct Seller Listing on Sukoon",
      ],
      date: "Today, Just now",
    };

    const updated = [newDeal, ...userPostedDeals];
    setUserPostedDeals(updated);
    try {
      localStorage.setItem("sukoon_user_posted_deals", JSON.stringify(updated));
    } catch {}

    setDealSuccessMsg("Deal successfully posted! You can see it below in 'My Posted Deals'.");
    setDealTitle("");
    setDealSociety("");
    setDealPrice("");
    setDealSize("");
    setPostTab("my-deals");
    setTimeout(() => setDealSuccessMsg(""), 5000);
  };

  const handleDeleteDeal = (id: string) => {
    const updated = userPostedDeals.filter((d) => d.id !== id);
    setUserPostedDeals(updated);
    try {
      localStorage.setItem("sukoon_user_posted_deals", JSON.stringify(updated));
    } catch {}
  };

  // EMI Calculations
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = loanTenureYears * 12;
  const emiNumerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths);
  const emiDenominator = Math.pow(1 + monthlyRate, totalMonths) - 1;
  const calculatedEmi = Math.round(emiNumerator / emiDenominator);
  const totalPayment = Math.round(calculatedEmi * totalMonths);
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const principalShare = Math.round((loanAmount / totalPayment) * 100);

  // Live Matching Properties for Matchmaking
  const liveMatchingDeals = useMemo(() => {
    return DAILY_WHATSAPP_DEALS.filter((deal) => {
      if (reqType !== "Any" && !deal.type.toLowerCase().includes(reqType.toLowerCase())) {
        // loose match
      }
      if (reqSociety.trim()) {
        const needle = reqSociety.toLowerCase();
        return (
          deal.location.toLowerCase().includes(needle) ||
          deal.title.toLowerCase().includes(needle) ||
          deal.city.toLowerCase().includes(needle)
        );
      }
      return true;
    }).slice(0, 4);
  }, [reqType, reqSociety]);

  // Combined Deals Feed for Trending Deals (System + User Posted)
  const trendingFilteredDeals = useMemo(() => {
    const query = areaSearch.toLowerCase().trim();

    const systemList = DAILY_WHATSAPP_DEALS.filter((d) => {
      const matchesArea =
        !query ||
        d.location.toLowerCase().includes(query) ||
        d.title.toLowerCase().includes(query) ||
        d.city.toLowerCase().includes(query);
      const matchesType = typeFilter === "All" || d.type.toLowerCase().includes(typeFilter.toLowerCase());
      return matchesArea && matchesType;
    });

    const userList = userPostedDeals
      .filter((d) => {
        const matchesArea =
          !query ||
          d.society.toLowerCase().includes(query) ||
          d.title.toLowerCase().includes(query) ||
          d.city.toLowerCase().includes(query);
        const matchesType = typeFilter === "All" || d.type.toLowerCase().includes(typeFilter.toLowerCase());
        return matchesArea && matchesType;
      })
      .map((d) => ({
        id: d.id,
        title: d.title,
        location: `${d.society}, ${d.city}`,
        city: d.city,
        priceFormatted: d.priceFormatted,
        pricePaise: 0n,
        type: d.type as any,
        dimensions: d.sizeSqft,
        areaSqft: 1500,
        facing: d.facing,
        reraApproved: true,
        clearTitle: true,
        postedDate: d.date,
        postedBy: `${d.sellerName} (Direct Seller)`,
        agencyOrSeller: "Direct Sukoon Seller",
        whatsappMessage: `Hello, I saw your deal "${d.title}" posted on Sukoon. Is it still available?`,
        phone: d.phone,
        whatsapp: d.phone.replace(/[^0-9]/g, ""),
        highlights: d.highlights,
        image: "/places/place-plot.png",
      }));

    return [...userList, ...systemList];
  }, [areaSearch, typeFilter, userPostedDeals]);

  // Selected Draft Template
  const activeTemplate = useMemo(() => {
    return (
      LEGAL_DRAFT_TEMPLATES.find((t) => t.id === selectedDraftId) || LEGAL_DRAFT_TEMPLATES[0]
    );
  }, [selectedDraftId]);

  // Compiled Template Output
  const compiledDraftText = useMemo(() => {
    let result = activeTemplate.templateContent;
    Object.entries(draftVariables).forEach(([key, val]) => {
      result = result.replaceAll(`{{${key}}}`, val || `[${key}]`);
    });
    return result;
  }, [activeTemplate, draftVariables]);

  const handleCopyDraft = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(compiledDraftText);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 3000);
    }
  };

  const handlePrintDraft = () => {
    if (typeof window !== "undefined") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${activeTemplate.title} - Sukoon Legal Drafting</title>
              <style>
                body { font-family: Georgia, serif; line-height: 1.6; padding: 40px; color: #111; }
                h1 { font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #222; padding-bottom: 8px; }
                pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; }
              </style>
            </head>
            <body>
              <h1>${activeTemplate.title}</h1>
              <p><em>${activeTemplate.titleSubtitle} · Generated on Sukoon</em></p>
              <pre>${compiledDraftText}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen px-4 pt-3 pb-28 text-foreground">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-line/60 mb-5">
        <Link
          href="/"
          className="tap-scale inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:opacity-80"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Sukoon Marketplace
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#1B2922]">Buy &amp; Sell Hub</h1>
        <p className="text-xs text-ink-muted mt-1">
          Direct marketplace, matchmaking &amp; verified real estate tools.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 4 MAIN FEATURE ICONS - MATCHING HOME PAGE ICON STYLE & DESIGN LANGUAGE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-y-7 gap-x-6 mb-8 px-2 py-1">
        {BUY_SELL_FEATURES.map((item) => {
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
      {/* OPTION 1: BUY A PROPERTY, SELL A PROPERTY (PROPERTY MATCHMAKING) */}
      {/* ========================================================================= */}
      {section === "matchmaking" && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Property Matchmaker</h2>
              <p className="text-[11px] text-ink-muted">
                Intelligent buyer requirement matching with direct sellers.
              </p>
            </div>
            <PinToHomeButton shortcutId="matchmaking" />
          </div>

          {/* Toggle Choice: I want to Buy vs I want to Sell */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F2EC] rounded-2xl border border-line">
            <button
              type="button"
              onClick={() => setMatchMode("buy")}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                matchMode === "buy"
                  ? "bg-white text-forest shadow-xs font-extrabold"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              <Compass size={14} /> I want to Buy
            </button>
            <button
              type="button"
              onClick={() => setMatchMode("sell")}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                matchMode === "sell"
                  ? "bg-white text-forest shadow-xs font-extrabold"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              <Tag size={14} /> I want to Sell
            </button>
          </div>

          {/* I WANT TO BUY FLOW */}
          {matchMode === "buy" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-forest">
                  <Sparkles size={14} />
                  <span>Tell us your requirement (2-3 quick questions)</span>
                </div>

                {reqSuccessMsg && (
                  <div className="p-3 rounded-xl bg-mint text-forest text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{reqSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveRequirement} className="space-y-3">
                  {/* Q1: Property Type */}
                  <div>
                    <label className="text-[11px] font-bold text-ink-muted block mb-1.5">
                      1. Property Type
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["Plot", "Villa", "Flat", "Commercial"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setReqType(t)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                            reqType === t
                              ? "bg-forest text-white border-forest"
                              : "bg-sand/30 border-line text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Size & Society */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-ink-muted block mb-1">
                        2. Required Size
                      </label>
                      <input
                        type="text"
                        value={reqSize}
                        onChange={(e) => setReqSize(e.target.value)}
                        placeholder="e.g. 1,500 sq ft"
                        className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-ink-muted block mb-1">
                        City
                      </label>
                      <select
                        value={reqCity}
                        onChange={(e) => setReqCity(e.target.value)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest bg-white"
                      >
                        <option value="Indore">Indore</option>
                        <option value="Bhopal">Bhopal</option>
                        <option value="Ujjain">Ujjain</option>
                        <option value="Pune">Pune</option>
                        <option value="Bengaluru">Bengaluru</option>
                      </select>
                    </div>
                  </div>

                  {/* Q3: Area / Society with Quick Chips */}
                  <div>
                    <label className="text-[11px] font-bold text-ink-muted block mb-1">
                      Preferred Area / Society
                    </label>
                    <input
                      type="text"
                      value={reqSociety}
                      onChange={(e) => setReqSociety(e.target.value)}
                      placeholder="e.g. Omaxe City, Super Corridor, DLF, Vijay Nagar"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {["Super Corridor", "Omaxe City", "DLF Gardencity", "Vijay Nagar", "Bypass"].map(
                        (chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setReqSociety(chip)}
                            className="px-2 py-0.5 rounded-full bg-[#EEECE6] text-[10px] text-ink-muted hover:text-forest transition"
                          >
                            + {chip}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Q4: Budget & Contact */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-ink-muted block mb-1">
                        3. Budget Range
                      </label>
                      <select
                        value={reqBudget}
                        onChange={(e) => setReqBudget(e.target.value)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest bg-white"
                      >
                        <option value="Under ₹50L">Under ₹50 Lakhs</option>
                        <option value="₹50L - ₹1 Cr">₹50L - ₹1 Crore</option>
                        <option value="₹1 Cr - ₹2 Cr">₹1 Cr - ₹2 Crore</option>
                        <option value="₹2 Cr+">₹2 Crore+</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-ink-muted block mb-1">
                        WhatsApp / Phone
                      </label>
                      <input
                        type="tel"
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        placeholder="+91 98..."
                        className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="tap-scale w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} /> Submit Requirement &amp; Get Matches
                  </button>
                </form>
              </div>

              {/* LIVE MATCHING PROPERTIES ON APP */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-forest uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={13} /> Found {liveMatchingDeals.length} Matching Properties
                  </span>
                  <span className="text-[10px] text-ink-muted">Title Clear</span>
                </div>

                <div className="space-y-2.5">
                  {liveMatchingDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 uppercase">
                              98% Match
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
                              {deal.type}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-foreground leading-snug">
                            {deal.title}
                          </h3>
                          <p className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {deal.location}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-forest">{deal.priceFormatted}</span>
                          <span className="text-[10px] block text-ink-muted">{deal.dimensions}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-line/60">
                        <span className="text-[10px] text-forest font-semibold flex items-center gap-1">
                          <ShieldCheck size={12} /> Registry Ready
                        </span>
                        <a
                          href={`https://wa.me/${deal.whatsapp}?text=${encodeURIComponent(
                            deal.whatsappMessage
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-95"
                        >
                          <MessageCircle size={12} /> Inquire
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* USER'S POSTED REQUIREMENTS */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-[#1B2922] mb-2 px-1">
                  My Posted Requirements ({postedRequirements.length})
                </h3>
                {postedRequirements.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#F8F7F3] border border-dashed border-line text-center text-xs text-ink-muted">
                    No requirements posted yet. Use the form above to post your requirement.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {postedRequirements.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-white border border-line shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-mint text-forest uppercase">
                              {req.type}
                            </span>
                            <span className="text-[11px] font-bold text-foreground">
                              {req.society}
                            </span>
                          </div>
                          <p className="text-[10px] text-ink-muted mt-0.5">
                            {req.sizeSqft} · Budget: {req.budget} · Posted {req.date}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRequirement(req.id)}
                          className="p-1.5 text-ink-muted hover:text-red-600 transition"
                          title="Remove requirement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* I WANT TO SELL FLOW */}
          {matchMode === "sell" && (
            <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                Seller Portal
              </span>
              <h3 className="text-sm font-bold text-foreground">Sell Your Property Fast on Sukoon</h3>
              <p className="text-xs text-ink-muted">
                Post your property deal directly so verified buyers looking for matching properties can connect with you instantly.
              </p>

              <div className="p-3 rounded-xl bg-sand/30 border border-line space-y-1 text-xs">
                <div className="font-bold text-forest flex items-center gap-1">
                  <CheckCircle2 size={13} /> Zero Brokerage Direct Deals
                </div>
                <div className="font-bold text-forest flex items-center gap-1">
                  <CheckCircle2 size={13} /> Title Check Guarantee by Sukoon
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSection("post-deals")}
                className="tap-scale w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
              >
                Go to "Post a Deal" Form <ChevronRight size={14} />
              </button>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* OPTION 2: POWER DOCS (EMI, LOANS, GUIDELINES, ASSOCIATES & DRAFTING) */}
      {/* ========================================================================= */}
      {section === "power-docs" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Power Docs</h2>
              <p className="text-[11px] text-ink-muted">
                Calculators, bank loans, circle rates, associates &amp; legal drafting.
              </p>
            </div>
            <PinToHomeButton shortcutId="power-docs" />
          </div>

          {/* 5 Sub-Tabs inside Power Docs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "emi", label: "EMI Calculator", icon: Calculator },
              { id: "loans", label: "Loan Details", icon: Landmark },
              { id: "guideline", label: "Guideline Value", icon: Building },
              { id: "associates", label: "Top Associates", icon: UserCheck },
              { id: "drafting", label: "Editable Drafting", icon: FileText },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isTabActive = powerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPowerTab(tab.id as PowerDocTab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isTabActive
                      ? "bg-forest text-white shadow-2xs"
                      : "bg-[#EEECE6] text-ink-muted hover:text-foreground"
                  }`}
                >
                  <TabIcon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* POWER DOC 1: EMI CALCULATOR */}
          {powerTab === "emi" && (
            <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                  Financial Calculator
                </span>
                <h3 className="text-sm font-bold text-foreground mt-1">Home Loan EMI Estimator</h3>
                <p className="text-xs text-ink-muted">
                  Calculate monthly installments, total interest &amp; principal share.
                </p>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-ink-muted">Loan Amount</span>
                    <span className="text-forest">₹{(loanAmount / 100000).toFixed(1)} Lakhs</span>
                  </div>
                  <input
                    type="range"
                    min={500000}
                    max={20000000}
                    step={100000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-forest cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-ink-muted">
                    <span>₹5L</span>
                    <span>₹1 Cr</span>
                    <span>₹2 Cr</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-ink-muted">Interest Rate (% p.a.)</span>
                    <span className="text-forest">{interestRate.toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min={6.5}
                    max={14.0}
                    step={0.05}
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full accent-forest cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-ink-muted">
                    <span>6.5%</span>
                    <span>8.5% (Avg)</span>
                    <span>14.0%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-ink-muted">Loan Tenure</span>
                    <span className="text-forest">{loanTenureYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                    className="w-full accent-forest cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-ink-muted">
                    <span>5 Yrs</span>
                    <span>20 Yrs</span>
                    <span>30 Yrs</span>
                  </div>
                </div>
              </div>

              {/* Calculated Results */}
              <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-line space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted font-bold">Monthly EMI</span>
                  <span className="text-lg font-bold text-forest">
                    ₹{calculatedEmi.toLocaleString("en-IN")}/mo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-xs">
                  <div>
                    <span className="text-[10px] text-ink-muted block">Total Interest</span>
                    <span className="font-bold text-foreground">
                      ₹{(totalInterest / 100000).toFixed(2)} Lakhs
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-ink-muted block">Total Payment</span>
                    <span className="font-bold text-foreground">
                      ₹{(totalPayment / 100000).toFixed(2)} Lakhs
                    </span>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div className="pt-1">
                  <div className="h-2 w-full bg-amber-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${principalShare}%` }}
                      className="bg-forest h-full"
                      title="Principal Share"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-ink-muted mt-1">
                    <span className="text-forest">● Principal ({principalShare}%)</span>
                    <span className="text-amber-800">● Interest ({100 - principalShare}%)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPowerTab("loans")}
                className="tap-scale w-full py-2 rounded-xl bg-sand/50 text-forest text-xs font-bold border border-forest/20 hover:bg-forest hover:text-white transition"
              >
                Compare Bank Loan Offers →
              </button>
            </div>
          )}

          {/* POWER DOC 2: LOAN DETAILS (BANK OFFERS WITH ATTRACTIVE INFO) */}
          {powerTab === "loans" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-1">
                <h3 className="text-xs font-bold text-foreground">Top Bank Home Loans</h3>
                <p className="text-[11px] text-ink-muted">
                  Competitive interest rates &amp; instant executive connect.
                </p>
              </div>

              {BANK_LOAN_DETAILS.map((bank) => (
                <div
                  key={bank.id}
                  className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{bank.bankName}</h4>
                      <p className="text-[10px] text-ink-muted">
                        Processing Fee: {bank.processingFee}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-forest">
                        {bank.interestRateMin.toFixed(2)}% - {bank.interestRateMax.toFixed(2)}%
                      </span>
                      <span className="text-[9px] block text-ink-muted">Interest p.a.</span>
                    </div>
                  </div>

                  <ul className="space-y-1 text-[11px] text-[#4A5D52] bg-[#F9F9F7] p-2 rounded-xl border border-line/40">
                    {bank.specialFeatures.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check size={11} className="text-forest shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-1 border-t border-line/60">
                    <span className="text-[10px] text-ink-muted">Max: {bank.maxTenureYears} Years</span>
                    <a
                      href={`https://wa.me/919826000000?text=${encodeURIComponent(
                        `Hello, I would like to apply for a Home Loan with ${bank.bankName} through Sukoon.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-95"
                    >
                      <MessageCircle size={12} /> Connect on WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* POWER DOC 3: GUIDELINE VALUE (ACROSS COUNTRY & CITY SELECTOR) */}
          {powerTab === "guideline" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2">
                <h3 className="text-xs font-bold text-foreground">
                  Official Collector Guideline Rates (Circle Rates)
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Official sub-registrar benchmark rates for stamp duty &amp; registration across India.
                </p>

                {/* City Selector */}
                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">Select City</label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {MULTI_CITY_GUIDELINE_RATES.map((c) => (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => setSelectedCityName(c.city)}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                          selectedCityName === c.city
                            ? "bg-forest text-white border-forest"
                            : "bg-white text-ink-muted border-line hover:border-forest/40"
                        }`}
                      >
                        {c.city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locality Search */}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                  />
                  <input
                    type="text"
                    value={guidelineSearch}
                    onChange={(e) => setGuidelineSearch(e.target.value)}
                    placeholder="Search locality e.g. Vijay Nagar, Whitefield..."
                    className="h-8 w-full rounded-xl border border-line pl-8 pr-3 text-xs outline-none focus:border-forest"
                  />
                </div>
              </div>

              {/* State Stamp Duty Note */}
              {(() => {
                const currentGroup =
                  MULTI_CITY_GUIDELINE_RATES.find((c) => c.city === selectedCityName) ||
                  MULTI_CITY_GUIDELINE_RATES[0];
                return (
                  <div className="p-2.5 rounded-xl bg-sand/40 border border-line text-[11px] text-ink-muted space-y-0.5">
                    <span className="font-bold text-forest block">
                      📍 {currentGroup.city} ({currentGroup.state}) Stamp Duty Structure:
                    </span>
                    <p>{currentGroup.stampDutyNote}</p>
                  </div>
                );
              })()}

              {/* Locality Rate Cards */}
              <div className="space-y-2">
                {(() => {
                  const currentGroup =
                    MULTI_CITY_GUIDELINE_RATES.find((c) => c.city === selectedCityName) ||
                    MULTI_CITY_GUIDELINE_RATES[0];
                  const filtered = currentGroup.rates.filter(
                    (r) =>
                      !guidelineSearch ||
                      r.locality.toLowerCase().includes(guidelineSearch.toLowerCase()) ||
                      r.zone.toLowerCase().includes(guidelineSearch.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="p-4 rounded-xl bg-white border border-line text-center text-xs text-ink-muted">
                        No locality found matching "{guidelineSearch}".
                      </div>
                    );
                  }

                  return filtered.map((rate) => (
                    <div
                      key={rate.id}
                      className="p-3 rounded-2xl bg-white border border-line shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{rate.locality}</h4>
                          <p className="text-[10px] text-ink-muted">{rate.zone}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-line/50 text-center">
                        <div className="p-1.5 rounded-lg bg-[#F8F7F3]">
                          <span className="text-[9px] text-ink-muted block">Residential</span>
                          <span className="text-[11px] font-bold text-forest">
                            ₹{rate.residentialPlotRate}/sqft
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#F8F7F3]">
                          <span className="text-[9px] text-ink-muted block">Commercial</span>
                          <span className="text-[11px] font-bold text-amber-800">
                            ₹{rate.commercialPlotRate}/sqft
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#F8F7F3]">
                          <span className="text-[9px] text-ink-muted block">Flat / Built-up</span>
                          <span className="text-[11px] font-bold text-[#1E57A4]">
                            ₹{rate.flatBuiltUpRate}/sqft
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* POWER DOC 4: TOP REGISTERED ASSOCIATES (VERIFIED AGENTS DIRECTORY) */}
          {powerTab === "associates" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-1">
                <h3 className="text-xs font-bold text-foreground">Top Registered Associates</h3>
                <p className="text-[11px] text-ink-muted">
                  RERA verified agents &amp; channel partners with high closing track records.
                </p>
              </div>

              {REGISTERED_ASSOCIATES.map((assoc) => (
                <div
                  key={assoc.id}
                  className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-foreground">{assoc.name}</h4>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 text-[9px] font-bold flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted">{assoc.agency}</p>
                      <p className="text-[10px] text-forest font-semibold mt-0.5">
                        {assoc.reraNumber}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-800">★ {assoc.rating}</span>
                      <span className="text-[10px] block text-ink-muted">
                        {assoc.dealsClosed}+ Deals
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {assoc.primeAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-[#EEECE6] text-[10px] text-ink-muted"
                      >
                        {area}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-line/60">
                    <span className="text-[10px] text-ink-muted">
                      {assoc.experienceYears} Years Experience
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/${assoc.whatsapp}?text=${encodeURIComponent(
                          `Hello ${assoc.name}, I found your verified profile on Sukoon and would like to consult on properties in ${assoc.primeAreas[0]}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-full bg-forest text-white text-[10px] font-bold flex items-center gap-1 hover:opacity-95"
                      >
                        <MessageCircle size={11} /> WhatsApp
                      </a>
                      <a
                        href={`tel:${assoc.phone}`}
                        className="px-2.5 py-1 rounded-full bg-[#EEECE6] text-foreground text-[10px] font-bold flex items-center gap-1 hover:bg-sand"
                      >
                        <Phone size={11} /> Call
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* POWER DOC 5: EDITABLE DRAFTING (RENTAL, BUY/SELL, REGISTRY, JAHIR SUCHNA) */}
          {powerTab === "drafting" && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                  Legal Agreement Generator
                </span>
                <h3 className="text-xs font-bold text-foreground mt-1">
                  Editable Real Estate Agreements
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Fill in parties &amp; amounts, live preview draft, then copy or print.
                </p>
              </div>

              {/* 5 Draft Pickers */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "draft-rental", title: "Rental Agreement", sub: "11-Month Tenancy" },
                  { id: "draft-sale-agreement", title: "Buy / Sell Agreement", sub: "Bayana / Advance" },
                  { id: "draft-registry", title: "Registry Agreement", sub: "Sale Deed Clauses" },
                  { id: "draft-jahir-suchna", title: "Jahir Suchna Doc", sub: "Public Title Notice" },
                  { id: "draft-notary", title: "Notary", sub: "Affidavit & Undertaking" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDraftId(d.id)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      selectedDraftId === d.id
                        ? "bg-forest text-white border-forest shadow-2xs"
                        : "bg-white border-line text-foreground hover:border-forest/40"
                    }`}
                  >
                    <p className="text-xs font-bold leading-tight">{d.title}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        selectedDraftId === d.id ? "text-white/80" : "text-ink-muted"
                      }`}
                    >
                      {d.sub}
                    </p>
                  </button>
                ))}
              </div>

              {/* Variable Form Inputs */}
              <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-foreground">
                  Customize Agreement Details: {activeTemplate.title}
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  {activeTemplate.variables.map((v) => (
                    <div key={v.key} className={v.type === "date" ? "" : "col-span-2 sm:col-span-1"}>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        {v.label}
                      </label>
                      <input
                        type={v.type === "number" ? "number" : v.type === "date" ? "date" : "text"}
                        value={draftVariables[v.key] ?? v.defaultValue}
                        onChange={(e) =>
                          setDraftVariables({ ...draftVariables, [v.key]: e.target.value })
                        }
                        className="h-8 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  ))}
                </div>

                {/* Actions: Copy and Print */}
                <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    className="tap-scale flex-1 py-2 rounded-xl bg-forest text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-95"
                  >
                    {copiedDraft ? (
                      <>
                        <Check size={13} /> Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy Draft Text
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintDraft}
                    className="tap-scale px-3 py-2 rounded-xl bg-[#EEECE6] text-foreground text-xs font-bold flex items-center gap-1 hover:bg-sand"
                    title="Print / Save as PDF"
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>

              {/* Formatted Text Preview */}
              <div className="p-4 rounded-2xl bg-[#F8F7F3] border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    Live Agreement Preview
                  </span>
                  <span className="text-[10px] text-forest font-semibold">Legally Formatted</span>
                </div>
                <pre className="text-[11px] text-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto p-2 bg-white rounded-xl border border-line/60">
                  {compiledDraftText}
                </pre>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* OPTION 3: POST A DEAL (DIRECT SELLER LISTING) */}
      {/* ========================================================================= */}
      {section === "post-deals" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Post Deals</h2>
              <p className="text-[11px] text-ink-muted">
                Direct seller listing · Free title verification by Sukoon.
              </p>
            </div>
            <PinToHomeButton shortcutId="post-deal" />
          </div>

          {/* Sub-tabs: Post New Deal vs My Posted Deals */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F2EC] rounded-2xl border border-line">
            <button
              type="button"
              onClick={() => setPostTab("form")}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                postTab === "form"
                  ? "bg-white text-forest shadow-xs font-extrabold"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              <Plus size={13} /> Post New Deal
            </button>
            <button
              type="button"
              onClick={() => setPostTab("my-deals")}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                postTab === "my-deals"
                  ? "bg-white text-forest shadow-xs font-extrabold"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              <FileCheck size={13} /> My Posted Deals ({userPostedDeals.length})
            </button>
          </div>

          {/* POST NEW DEAL FORM */}
          {postTab === "form" && (
            <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                  Verified Seller Listing
                </span>
                <h3 className="text-sm font-bold text-foreground mt-1">Post Your Property Deal</h3>
                <p className="text-xs text-ink-muted">
                  Direct connection with genuine buyers without any middleman commission.
                </p>
              </div>

              {dealSuccessMsg && (
                <div className="p-3 rounded-xl bg-mint text-forest text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{dealSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handlePostDeal} className="space-y-3">
                {/* Property Type */}
                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">
                    Property Type
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["Plot", "House", "Flat", "Commercial"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDealType(t)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                          dealType === t
                            ? "bg-forest text-white border-forest"
                            : "bg-sand/30 border-line text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deal Headline */}
                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">
                    Deal Headline / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    placeholder="e.g. 1,500 sq ft East Facing Plot near Metro"
                    className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                  />
                </div>

                {/* Society & City */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Colony / Society
                    </label>
                    <input
                      type="text"
                      required
                      value={dealSociety}
                      onChange={(e) => setDealSociety(e.target.value)}
                      placeholder="e.g. Omaxe City 1"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      City
                    </label>
                    <select
                      value={dealCity}
                      onChange={(e) => setDealCity(e.target.value)}
                      className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest bg-white"
                    >
                      <option value="Indore">Indore</option>
                      <option value="Bhopal">Bhopal</option>
                      <option value="Ujjain">Ujjain</option>
                      <option value="Pune">Pune</option>
                    </select>
                  </div>
                </div>

                {/* Dimensions & Expected Price */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Size / Dimensions
                    </label>
                    <input
                      type="text"
                      value={dealSize}
                      onChange={(e) => setDealSize(e.target.value)}
                      placeholder="e.g. 1500 sq ft (30×50)"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Expected Price (₹)
                    </label>
                    <input
                      type="text"
                      required
                      value={dealPrice}
                      onChange={(e) => setDealPrice(e.target.value)}
                      placeholder="e.g. ₹67.50 Lakhs"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                </div>

                {/* Facing */}
                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">Facing</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["East Facing", "North Facing", "Corner", "West Facing"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setDealFacing(f)}
                        className={`py-1 rounded-xl text-[10px] font-bold border transition ${
                          dealFacing === f
                            ? "bg-forest text-white border-forest"
                            : "bg-sand/30 border-line text-foreground"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seller Name & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Seller Name
                    </label>
                    <input
                      type="text"
                      value={dealSellerName}
                      onChange={(e) => setDealSellerName(e.target.value)}
                      placeholder="Your Name"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      WhatsApp / Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={dealPhone}
                      onChange={(e) => setDealPhone(e.target.value)}
                      placeholder="+91 98..."
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="tap-scale w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                >
                  <Send size={13} /> Post Deal to Sukoon Marketplace
                </button>
              </form>
            </div>
          )}

          {/* MY POSTED DEALS VIEW */}
          {postTab === "my-deals" && (
            <div className="space-y-3">
              {userPostedDeals.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-dashed border-line text-center space-y-2">
                  <Tag size={28} className="mx-auto text-ink-muted" />
                  <h3 className="text-xs font-bold text-foreground">No Deals Posted Yet</h3>
                  <p className="text-[11px] text-ink-muted">
                    List your plot, villa, flat or commercial property directly to genuine buyers.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPostTab("form")}
                    className="tap-scale px-4 py-1.5 rounded-full bg-forest text-white text-xs font-bold inline-flex items-center gap-1 mt-2"
                  >
                    <Plus size={13} /> Post Your First Deal
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userPostedDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
                              🟢 Live &amp; Verified
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 uppercase">
                              {deal.type}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-foreground">{deal.title}</h4>
                          <p className="text-[10px] text-ink-muted mt-0.5">
                            📍 {deal.society}, {deal.city} · {deal.facing}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-forest">
                            {deal.priceFormatted}
                          </span>
                          <span className="text-[10px] block text-ink-muted">{deal.sizeSqft}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-line/60">
                        <span className="text-[10px] text-ink-muted">{deal.date}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Check out my verified property listing on Sukoon: ${deal.title} (${deal.priceFormatted}) in ${deal.society}, ${deal.city}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-full bg-[#EEECE6] text-foreground text-[10px] font-bold flex items-center gap-1 hover:bg-sand"
                          >
                            <Share2 size={11} /> Share
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="p-1 text-ink-muted hover:text-red-600 transition"
                            title="Delete Deal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* OPTION 4: TRENDING DEALS (AREA & SOCIETY SEARCH WITH LIVE CARDS) */}
      {/* ========================================================================= */}
      {section === "trending" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Trending Deals</h2>
              <p className="text-[11px] text-ink-muted">
                Search areas &amp; societies for verified live deals.
              </p>
            </div>
            <PinToHomeButton shortcutId="trending" />
          </div>

          {/* Search Bar for Areas like Omaxe City, DLF, etc. */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              placeholder="Search area or society e.g. Omaxe City, DLF, Super Corridor..."
              className="h-10 w-full rounded-2xl border border-line pl-10 pr-9 text-xs outline-none focus:border-forest bg-white shadow-2xs"
            />
            {areaSearch && (
              <button
                type="button"
                onClick={() => setAreaSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Area Filter Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              "All Deals",
              "Omaxe City",
              "DLF Gardencity",
              "Super Corridor",
              "Vijay Nagar",
              "Bypass",
              "Scheme 140",
              "Silicon City",
            ].map((chip) => {
              const isChipActive =
                (chip === "All Deals" && !areaSearch) ||
                areaSearch.toLowerCase() === chip.toLowerCase();
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAreaSearch(chip === "All Deals" ? "" : chip)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                    isChipActive
                      ? "bg-forest text-white border-forest shadow-2xs"
                      : "bg-white text-ink-muted border-line hover:border-forest/40"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Property Type Filter Chips */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[11px] font-bold text-ink-muted">
              Showing {trendingFilteredDeals.length} Verified Deals
            </span>
            <div className="flex items-center gap-1">
              {["All", "Plot", "House", "Flat", "Commercial"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    typeFilter === t
                      ? "bg-forest text-white"
                      : "text-ink-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Deal Cards Feed */}
          <div className="space-y-3">
            {trendingFilteredDeals.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-line text-center space-y-2">
                <Search size={24} className="mx-auto text-ink-muted" />
                <h3 className="text-xs font-bold text-foreground">
                  No Deals Found in "{areaSearch}"
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Try checking other prime areas like Omaxe City, DLF Gardencity, or Super Corridor.
                </p>
                <button
                  type="button"
                  onClick={() => setAreaSearch("")}
                  className="tap-scale px-3 py-1 rounded-full bg-forest text-white text-xs font-bold inline-flex items-center gap-1 mt-1"
                >
                  View All Deals
                </button>
              </div>
            ) : (
              trendingFilteredDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
                          {deal.type}
                        </span>
                        <span className="text-[10px] text-ink-muted flex items-center gap-0.5">
                          <MapPin size={10} /> {deal.location}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-foreground leading-snug">
                        {deal.title}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-forest">{deal.priceFormatted}</span>
                      <span className="text-[10px] block text-ink-muted">{deal.dimensions}</span>
                    </div>
                  </div>

                  {deal.highlights && deal.highlights.length > 0 && (
                    <div className="p-2 rounded-xl bg-[#F8F7F3] border border-line/50 text-[10px] text-ink-muted flex flex-wrap gap-x-3 gap-y-1">
                      {deal.highlights.slice(0, 2).map((h, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Check size={11} className="text-forest" /> {h}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-line/60 text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-forest font-semibold">
                      <ShieldCheck size={14} /> Title Clear &amp; Mutation Done
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/${deal.whatsapp}?text=${encodeURIComponent(
                          deal.whatsappMessage
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-95"
                      >
                        <MessageCircle size={13} /> Inquire
                      </a>
                      <a
                        href={`tel:${deal.phone}`}
                        className="px-2.5 py-1.5 rounded-full bg-[#EEECE6] text-foreground text-[11px] font-bold flex items-center gap-1 hover:bg-sand"
                      >
                        <Phone size={13} /> Call
                      </a>
                    </div>
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

export default function BuySellPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-ink-muted">
          Loading Buy &amp; Sell Hub...
        </div>
      }
    >
      <BuySellContent />
    </Suspense>
  );
}

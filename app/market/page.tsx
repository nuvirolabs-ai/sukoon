"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  Home,
  Info,
  MapPin,
  MessageCircle,
  Newspaper,
  Phone,
  PlusCircle,
  Radio,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Video,
  X,
} from "lucide-react";
import {
  DAILY_WHATSAPP_DEALS,
  INDORE_GUIDELINE_RATES,
  REGISTERED_ASSOCIATES,
  BANK_LOAN_DETAILS,
  LEGAL_DRAFT_TEMPLATES,
  type WhatsAppDeal,
  type LegalDraftTemplate,
} from "@/lib/data/market-hub";
import {
  REAL_ESTATE_NEWS,
  REAL_ESTATE_STOCKS,
  REAL_ESTATE_GLOSSARY,
  DOS_AND_DONTS,
  VASTU_GUIDELINES,
  MEDIA_RESOURCES,
} from "@/lib/data/intelligence-hub";

type ActiveTab = "deals" | "post" | "calculator" | "drafts" | "knowledge";

function MarketContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as ActiveTab | null;

  const [tab, setTab] = useState<ActiveTab>(() => {
    if (urlTab && ["deals", "post", "calculator", "drafts", "knowledge"].includes(urlTab)) {
      return urlTab;
    }
    return "deals";
  });

  useEffect(() => {
    if (urlTab && ["deals", "post", "calculator", "drafts", "knowledge"].includes(urlTab)) {
      setTab(urlTab);
    }
  }, [urlTab]);

  const [dealTypeFilter, setDealTypeFilter] = useState<string>("All");
  const [deals, setDeals] = useState<WhatsAppDeal[]>(DAILY_WHATSAPP_DEALS);

  // New Deal Form State
  const [postTitle, setPostTitle] = useState("");
  const [postLocation, setPostLocation] = useState("");
  const [postPrice, setPostPrice] = useState("");
  const [postType, setPostType] = useState<WhatsAppDeal["type"]>("Plot");
  const [postDimensions, setPostDimensions] = useState("");
  const [postPhone, setPostPhone] = useState("");
  const [postPostedSuccess, setPostPostedSuccess] = useState(false);

  // EMI Calculator State
  const [loanAmountLakhs, setLoanAmountLakhs] = useState<number>(35); // in Lakhs
  const [interestRate, setInterestRate] = useState<number>(8.5); // %
  const [loanTenureYears, setLoanTenureYears] = useState<number>(20); // years

  // Selected Guideline Locality
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string>(INDORE_GUIDELINE_RATES[0].id);

  // Legal Drafts State
  const [selectedDraftId, setSelectedDraftId] = useState<string>(LEGAL_DRAFT_TEMPLATES[0].id);
  const [draftVars, setDraftVars] = useState<Record<string, string>>({
    landlordName: "Akshay Sharma",
    tenantName: "Rahul Verma",
    propertyAddress: "Flat 302, Scheme 54, Vijay Nagar, Indore",
    monthlyRent: "18500",
    securityDeposit: "37000",
    agreementDate: "2026-11-01",
    sellerName: "Vikas Trivedi",
    buyerName: "Akshay Sharma",
    propertyDescription: "Plot No. 14, Scheme 54, PU-4, Indore (Area: 3200 sq.ft)",
    totalDealAmount: "28500000",
    advanceTokenAmount: "2500000",
    registryDeadline: "2026-12-15",
    propertyLocality: "Indore (M.P.)",
  });
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Calculate EMI
  const principal = loanAmountLakhs * 100000;
  const monthlyRate = interestRate / (12 * 100);
  const totalMonths = loanTenureYears * 12;
  const emi = Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - principal;

  // Handle Post Deal
  const handlePostDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postLocation || !postPrice || !postPhone) return;

    const newDeal: WhatsAppDeal = {
      id: `deal-${Date.now()}`,
      title: postTitle,
      location: postLocation,
      city: "Indore",
      priceFormatted: `₹${postPrice}`,
      pricePaise: 0n,
      type: postType,
      dimensions: postDimensions || "Standard Size",
      areaSqft: 1000,
      facing: "Main Road",
      reraApproved: true,
      clearTitle: true,
      postedDate: "Just now",
      postedBy: "Direct Owner / Agent",
      agencyOrSeller: "Sukoon Verified User",
      whatsappMessage: `Hello, regarding your post: ${postTitle} in ${postLocation} for ₹${postPrice} on Sukoon.`,
      phone: postPhone,
      whatsapp: postPhone.replace(/\D/g, ""),
      highlights: [
        "100% Clear Title Verification",
        "Direct Contact on WhatsApp & Phone",
        "Immediate Registry / Deal Ready",
      ],
      image: postType === "Plot" ? "/places/place-plot.png" : "/places/place-house.png",
    };

    setDeals([newDeal, ...deals]);
    setPostTitle("");
    setPostLocation("");
    setPostPrice("");
    setPostDimensions("");
    setPostPhone("");
    setPostPostedSuccess(true);
    setTimeout(() => {
      setPostPostedSuccess(false);
      setTab("deals");
    }, 2000);
  };

  const filteredDeals = dealTypeFilter === "All"
    ? deals
    : deals.filter((d) => d.type.toLowerCase() === dealTypeFilter.toLowerCase());

  const selectedGuideline = INDORE_GUIDELINE_RATES.find((g) => g.id === selectedGuidelineId) || INDORE_GUIDELINE_RATES[0];
  const selectedDraft = LEGAL_DRAFT_TEMPLATES.find((d) => d.id === selectedDraftId) || LEGAL_DRAFT_TEMPLATES[0];

  // Render processed draft text
  const getProcessedDraftText = () => {
    let text = selectedDraft.templateContent;
    Object.keys(draftVars).forEach((key) => {
      const val = draftVars[key] || "";
      text = text.replaceAll(`{{${key}}}`, val);
    });
    return text;
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(getProcessedDraftText());
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  return (
    <div className="app-workspace py-4 max-w-[540px] mx-auto min-h-screen text-foreground pb-24">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-4 pb-3 border-b border-line">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:opacity-80 transition"
        >
          <ArrowLeft size={18} />
          <span>Home</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
          <MessageCircle size={14} className="text-emerald-600" />
          <span>Live Market &amp; Deals</span>
        </div>
      </header>

      {/* Main Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-forest mb-1">
          Market, Deals &amp; Intelligence Hub
        </h1>
        <p className="text-xs text-ink-muted">
          Market, Deals &amp; Intelligence — WhatsApp Deals, EMI Tool, Circle Rates &amp; Legal Drafts
        </p>
      </div>

      {/* 5-Tab Navigation Pill Bar */}
      <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-5 text-xs font-semibold">
        <button
          onClick={() => setTab("deals")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "deals"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <MessageCircle size={14} className={tab === "deals" ? "text-mint" : "text-emerald-600"} />
          <span>Live Deals Feed</span>
        </button>

        <button
          onClick={() => setTab("post")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "post"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <PlusCircle size={14} />
          <span>Post a Deal</span>
        </button>

        <button
          onClick={() => setTab("calculator")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "calculator"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <Calculator size={14} />
          <span>EMI &amp; Circle Rates</span>
        </button>

        <button
          onClick={() => setTab("drafts")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "drafts"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <FileText size={14} />
          <span>Legal Drafts</span>
        </button>

        <button
          onClick={() => setTab("knowledge")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "knowledge"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <Compass size={14} />
          <span>Market Intelligence</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: WHATSAPP DEALS FEED
          ========================================================================= */}
      {tab === "deals" && (
        <div className="space-y-4">
          {/* WhatsApp Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle size={22} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-950">
                  Indore Property WhatsApp Deals Stream
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Direct verified deals updated daily — connect instantly on WhatsApp.
                </p>
              </div>
            </div>
            <button
              onClick={() => setTab("post")}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition"
            >
              + Post Deal
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {["All", "Plot", "Independent House", "Flat", "Commercial"].map((t) => (
              <button
                key={t}
                onClick={() => setDealTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full font-medium transition ${
                  dealTypeFilter === t
                    ? "bg-forest text-white"
                    : "bg-white text-ink-muted border border-line"
                }`}
              >
                {t === "All" ? "All Properties" : t}
              </button>
            ))}
          </div>

          {/* Deals Cards Stream */}
          <div className="space-y-3.5">
            {filteredDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden transition hover:shadow-md"
              >
                {/* Header Strip */}
                <div className="p-3.5 border-b border-line/60 flex items-center justify-between bg-canvas/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Verified Listing
                    </span>
                    <span className="text-[11px] text-ink-muted">{deal.postedDate}</span>
                  </div>
                  <span className="text-xs font-bold text-forest">{deal.type}</span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {deal.title}
                    </h3>
                    <p className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                      <MapPin size={13} className="text-forest shrink-0" />
                      <span>{deal.location}</span>
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between bg-canvas/40 p-2.5 rounded-xl border border-line/50">
                    <div>
                      <span className="text-[10px] text-ink-muted block uppercase">Demand Price</span>
                      <span className="text-lg font-black text-forest">{deal.priceFormatted}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-ink-muted block uppercase">Dimensions</span>
                      <span className="text-xs font-bold text-foreground">{deal.dimensions} ({deal.areaSqft} sqft)</span>
                    </div>
                  </div>

                  {/* Highlights Bullet List */}
                  <ul className="space-y-1 text-xs text-ink-muted">
                    {deal.highlights.map((hl, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Posted By & Actions */}
                  <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
                    <div className="text-xs text-ink-muted truncate">
                      <span className="block font-semibold text-foreground text-[11px]">{deal.postedBy}</span>
                      <span className="text-[10px] text-ink-muted">{deal.agencyOrSeller}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${deal.phone}`}
                        className="p-2 rounded-xl bg-canvas text-forest hover:bg-mint transition"
                        title="Call"
                      >
                        <Phone size={16} />
                      </a>
                      <a
                        href={`https://api.whatsapp.com/send?phone=${deal.whatsapp}&text=${encodeURIComponent(
                          deal.whatsappMessage
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp Chat</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: POST A DEAL
          ========================================================================= */}
      {tab === "post" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Post a Deal in 30 Seconds</span>
            </h3>
            <p className="text-[11px] text-emerald-800 leading-relaxed mt-1">
              Post property details just like a WhatsApp group message. Instantly reaches verified Indore buyers and investors.
            </p>
          </div>

          <form onSubmit={handlePostDeal} className="p-5 rounded-2xl bg-white border border-line shadow-xs space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-ink-muted block mb-1">
                Property Listing Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1,000 sq.ft East-facing plot on Super Corridor"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-ink-muted block mb-1">
                  Property Type
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as WhatsAppDeal["type"])}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                >
                  <option value="Plot">Plot</option>
                  <option value="Independent House">Independent House / Villa</option>
                  <option value="Flat">Flat / Apartment</option>
                  <option value="Commercial">Commercial / Shop</option>
                  <option value="Agriculture">Agricultural Land</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted block mb-1">
                  Demand Price (₹)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 48 Lakhs"
                  value={postPrice}
                  onChange={(e) => setPostPrice(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-ink-muted block mb-1">
                  Location / Colony
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Super Corridor Phase 2"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted block mb-1">
                  Dimensions / Plot Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20 x 50 (1,000 sq.ft)"
                  value={postDimensions}
                  onChange={(e) => setPostDimensions(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted block mb-1">
                WhatsApp Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 98260 12345"
                value={postPhone}
                onChange={(e) => setPostPhone(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Send size={16} />
              <span>Post Deal to Live Stream</span>
            </button>
          </form>

          {postPostedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-center text-xs animate-fade-in">
              🎉 Your deal was posted successfully! It is now live in the verified deals feed.
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: EMI & GUIDELINE CALCULATOR
          ========================================================================= */}
      {tab === "calculator" && (
        <div className="space-y-5">
          {/* EMI Calculator Card */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-sm font-bold text-forest flex items-center gap-1.5">
                <Calculator size={18} />
                <span>Home Loan EMI Calculator</span>
              </h3>
              <span className="text-[11px] text-ink-muted">Estimate Monthly Installment</span>
            </div>

            {/* Slider 1: Loan Amount */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-muted">Loan Amount:</span>
                <span className="font-extrabold text-forest">₹{loanAmountLakhs} Lakhs</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="1"
                value={loanAmountLakhs}
                onChange={(e) => setLoanAmountLakhs(parseInt(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            {/* Slider 2: Interest Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-muted">Interest Rate:</span>
                <span className="font-extrabold text-forest">{interestRate}% p.a.</span>
              </div>
              <input
                type="range"
                min="7.5"
                max="13.0"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            {/* Slider 3: Tenure */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-muted">Loan Tenure:</span>
                <span className="font-extrabold text-forest">{loanTenureYears} Years ({totalMonths} Months)</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={loanTenureYears}
                onChange={(e) => setLoanTenureYears(parseInt(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            {/* Result Display Box */}
            <div className="p-4 rounded-xl bg-mint/50 border border-emerald-200 text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                Estimated Monthly EMI
              </span>
              <div className="text-3xl font-black text-forest">
                ₹{emi.toLocaleString("en-IN")}<span className="text-xs font-normal text-ink-muted">/mo</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-ink-muted border-t border-emerald-200/60 mt-2">
                <div>
                  <span className="block text-[10px]">Principal Amount</span>
                  <span className="font-bold text-foreground">₹{principal.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="block text-[10px]">Total Interest Payable</span>
                  <span className="font-bold text-amber-800">₹{totalInterest.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Loan Comparison */}
          <div>
            <h3 className="text-xs font-bold text-forest uppercase tracking-wider mb-2">
              Top Bank Home Loan Offers
            </h3>
            <div className="bg-white rounded-xl border border-line divide-y divide-line overflow-hidden shadow-xs">
              {BANK_LOAN_DETAILS.map((bank) => (
                <div key={bank.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{bank.bankName}</h4>
                    <p className="text-[11px] text-ink-muted">Processing Fee: {bank.processingFee}</p>
                    <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      ✓ {bank.specialFeatures[0]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-forest">
                      {bank.interestRateMin}% - {bank.interestRateMax}%
                    </span>
                    <span className="block text-[10px] text-ink-muted">Tenure: Up to 30 Years</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indore Collector Guideline Rates Section */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-xs space-y-3">
            <div className="border-b border-line pb-2">
              <h3 className="text-sm font-bold text-forest">
                Indore Collector Guideline Rates (Circle Rates)
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Official government base valuation per sq.ft for stamp duty and registry
              </p>
            </div>

            {/* Area Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted block">
                Select Locality in Indore:
              </label>
              <select
                value={selectedGuidelineId}
                onChange={(e) => setSelectedGuidelineId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-lg border border-line bg-canvas/30 focus:bg-white"
              >
                {INDORE_GUIDELINE_RATES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.locality}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Area Rate Card */}
            <div className="bg-canvas/50 p-3.5 rounded-xl border border-line/60 space-y-2">
              <div className="text-xs text-ink-muted font-medium">{selectedGuideline.zone}</div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-white border border-line">
                  <span className="text-[10px] text-ink-muted block">Residential Plot</span>
                  <span className="text-xs font-black text-forest">₹{selectedGuideline.residentialPlotRate}/sqft</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-line">
                  <span className="text-[10px] text-ink-muted block">Commercial Plot</span>
                  <span className="text-xs font-black text-forest">₹{selectedGuideline.commercialPlotRate}/sqft</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-line">
                  <span className="text-[10px] text-ink-muted block">Flat Built-up</span>
                  <span className="text-xs font-black text-forest">₹{selectedGuideline.flatBuiltUpRate}/sqft</span>
                </div>
              </div>
              <p className="text-[10px] text-ink-muted italic pt-1">
                * {selectedGuideline.notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: QUICK EDITABLE LEGAL DRAFTINGS
          ========================================================================= */}
      {tab === "drafts" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-champagne/40 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            📜 <strong>Ready-to-Use Legal Draft Templates:</strong> Fill in key transaction terms and generate customized legal agreements in 1 click.
          </div>

          {/* Template Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {LEGAL_DRAFT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelectedDraftId(tmpl.id)}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition ${
                  selectedDraftId === tmpl.id
                    ? "bg-forest text-white"
                    : "bg-white text-foreground border border-line"
                }`}
              >
                {tmpl.title}
              </button>
            ))}
          </div>

          {/* Editable Variables Input Form */}
          <div className="p-4 rounded-xl bg-white border border-line shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-forest uppercase tracking-wider">
              Customize Agreement Details:
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {selectedDraft.variables.map((variable) => (
                <div key={variable.key}>
                  <label className="text-[11px] font-semibold text-ink-muted block mb-0.5">
                    {variable.label}
                  </label>
                  <input
                    type={variable.type}
                    value={draftVars[variable.key] ?? variable.defaultValue}
                    onChange={(e) =>
                      setDraftVars({
                        ...draftVars,
                        [variable.key]: e.target.value,
                      })
                    }
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rendered Agreement Preview Box */}
          <div className="p-4 rounded-2xl bg-white border border-line shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h4 className="text-xs font-bold text-forest">
                {selectedDraft.title} — Generated Agreement
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyDraft}
                  className="px-2.5 py-1 rounded bg-canvas text-forest text-xs font-bold flex items-center gap-1 hover:bg-mint transition"
                >
                  <Copy size={13} />
                  <span>{copiedDraft ? "Copied!" : "Copy Draft"}</span>
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getProcessedDraftText())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 transition"
                >
                  <Share2 size={13} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <pre className="p-3.5 rounded-xl bg-canvas/40 border border-line/60 font-sans text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {getProcessedDraftText()}
            </pre>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: VASTU, NEWS & KNOWLEDGE
          ========================================================================= */}
      {tab === "knowledge" && (
        <div className="space-y-5">
          {/* Vastu Shastra Guide Section */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-xs space-y-3">
            <div className="border-b border-line pb-2">
              <h3 className="text-sm font-bold text-forest flex items-center gap-1.5">
                <Compass size={18} />
                <span>Basic Vastu Shastra Principles</span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Key Vastu orientation guidelines for home construction and plot selection
              </p>
            </div>

            <div className="space-y-2.5">
              {VASTU_GUIDELINES.map((v, i) => (
                <div key={i} className="p-3 rounded-xl bg-canvas/30 border border-line/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-forest">{v.direction}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
                      {v.element}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground leading-relaxed">{v.keyAdvice}</p>
                  <div className="text-[10px] text-ink-muted">
                    <strong className="text-forest">Best Suited For:</strong> {v.idealRooms.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Estate News Section */}
          <div>
            <h3 className="text-xs font-bold text-forest uppercase tracking-wider mb-2 flex items-center gap-1">
              <Newspaper size={14} />
              <span>Real Estate News &amp; Infrastructure</span>
            </h3>
            <div className="space-y-2.5">
              {REAL_ESTATE_NEWS.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-white border border-line shadow-xs">
                  <div className="flex items-center justify-between text-[10px] text-ink-muted mb-1">
                    <span className="font-bold text-infinity-blue">{item.tag}</span>
                    <span>{item.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground leading-snug">{item.headline}</h4>
                  <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">{item.summary}</p>
                  <span className="text-[10px] text-ink-muted block mt-1.5">Source: {item.source}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Market Real Estate & REITs */}
          <div className="p-4 rounded-xl bg-white border border-line shadow-xs">
            <h3 className="text-xs font-bold text-forest uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp size={14} />
              <span>Real Estate Stocks &amp; REITs</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {REAL_ESTATE_STOCKS.map((stk) => (
                <div key={stk.symbol} className="p-2.5 rounded-lg bg-canvas/40 border border-line">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-foreground">{stk.symbol}</span>
                    <span
                      className={`text-[11px] font-black ${
                        stk.isPositive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {stk.change}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-forest mt-0.5">{stk.price}</div>
                  <span className="text-[10px] text-ink-muted block">{stk.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real Estate Glossary */}
          <div className="p-4 rounded-xl bg-white border border-line shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-forest uppercase tracking-wider mb-1 flex items-center gap-1">
              <HelpCircle size={14} />
              <span>Real Estate Layman&apos;s Dictionary</span>
            </h3>
            <div className="space-y-2 text-xs">
              {REAL_ESTATE_GLOSSARY.map((g, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-canvas/30 border border-line/50">
                  <span className="font-bold text-forest block">{g.term}</span>
                  <p className="text-[11px] text-foreground mt-0.5">{g.simpleMeaning}</p>
                  <p className="text-[10px] text-ink-muted mt-1 font-medium italic">
                    💡 {g.whyItMatters}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Do's and Don'ts Checklist */}
          <div className="p-4 rounded-xl bg-white border border-line shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-forest uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldAlert size={14} />
              <span>Property Buyer Checklist (Do&apos;s &amp; Don&apos;ts)</span>
            </h3>
            <div className="space-y-1.5 text-xs">
              {DOS_AND_DONTS.map((chk) => (
                <div key={chk.id} className="p-2.5 rounded-lg bg-canvas/30 border border-line/50 flex items-start gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      chk.type === "DO" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {chk.type}
                  </span>
                  <div>
                    <h5 className="font-bold text-foreground text-[11px]">{chk.title}</h5>
                    <p className="text-[10px] text-ink-muted mt-0.5">{chk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video Resources & Podcasts */}
          <div className="p-4 rounded-xl bg-white border border-line shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-forest uppercase tracking-wider mb-1 flex items-center gap-1">
              <Video size={14} />
              <span>Educational Videos &amp; Podcasts</span>
            </h3>
            <div className="space-y-2">
              {MEDIA_RESOURCES.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-canvas/30 border border-line flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-infinity-blue">{m.type} • {m.duration}</span>
                    <h5 className="text-xs font-bold text-foreground leading-snug">{m.title}</h5>
                    <p className="text-[10px] text-ink-muted mt-0.5">{m.creator}</p>
                  </div>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-mint text-forest text-xs font-bold shrink-0 hover:bg-forest hover:text-white transition"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-muted">Loading Market Hub...</div>}>
      <MarketContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileText,
  HardHat,
  Hammer,
  House,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  QrCode,
  Scan,
  Share2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";
import {
  DAILY_MATERIAL_RATES,
  AUTHORIZED_DEALERS,
  AUTHORIZED_ARCHITECTS,
  CONCEPTUAL_PLANS,
  INITIAL_QUICK_EXPENSES,
  type QuickExpense,
  type ConceptualPlan,
} from "@/lib/data/construction-hub";

type ActiveTab = "portfolio" | "rates" | "expenses" | "plans" | "directory";

function EstateContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as ActiveTab | null;

  const [tab, setTab] = useState<ActiveTab>(() => {
    if (urlTab && ["portfolio", "rates", "expenses", "plans", "directory"].includes(urlTab)) {
      return urlTab;
    }
    return "portfolio";
  });

  useEffect(() => {
    if (urlTab && ["portfolio", "rates", "expenses", "plans", "directory"].includes(urlTab)) {
      setTab(urlTab);
    }
  }, [urlTab]);

  const [materialFilter, setMaterialFilter] = useState<string>("All");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-20-50");
  const [expenses, setExpenses] = useState<QuickExpense[]>(INITIAL_QUICK_EXPENSES);

  // Quick expense form state
  const [agencyName, setAgencyName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<QuickExpense["category"]>("Material");
  const [note, setNote] = useState("");
  const [showExpenseToast, setShowExpenseToast] = useState(false);

  // Selected paper preview modal
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  // Add Paper modal
  const [addPaperModal, setAddPaperModal] = useState(false);
  const [newPaperTitle, setNewPaperTitle] = useState("");
  const [paperAddedSuccess, setPaperAddedSuccess] = useState(false);

  // Handle adding a new quick expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName || !amount) return;
    const newEntry: QuickExpense = {
      id: `exp-${Date.now()}`,
      agencyName,
      amount: parseFloat(amount),
      category,
      date: "Today, Just now",
      note: note || undefined,
    };
    setExpenses([newEntry, ...expenses]);
    setAgencyName("");
    setAmount("");
    setNote("");
    setShowExpenseToast(true);
    setTimeout(() => setShowExpenseToast(false), 3000);
  };

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);

  const filteredRates = materialFilter === "All"
    ? DAILY_MATERIAL_RATES
    : DAILY_MATERIAL_RATES.filter((r) => r.category.toLowerCase() === materialFilter.toLowerCase());

  const selectedPlan = CONCEPTUAL_PLANS.find((p) => p.id === selectedPlanId) || CONCEPTUAL_PLANS[1];

  return (
    <div className="app-workspace py-4 max-w-[540px] mx-auto min-h-screen text-foreground pb-24">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-4 pb-3 border-b border-line">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:opacity-80 transition"
        >
          <ArrowLeft size={18} />
          <span>होम (Home)</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint text-forest text-xs font-semibold">
          <ShieldCheck size={14} />
          <span>सत्यापित प्रॉपर्टी हब (Verified Hub)</span>
        </div>
      </header>

      {/* Main Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-forest mb-1">
          प्रॉपर्टी और निर्माण हब
        </h1>
        <p className="text-xs text-ink-muted">
          My Property &amp; Construction — पोर्टफोलियो, कागज़ात, दैनिक भाव व खर्चा डायरी
        </p>
      </div>

      {/* 5-Tab Navigation Pill Bar */}
      <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-5 text-xs font-semibold">
        <button
          onClick={() => setTab("portfolio")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "portfolio"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <Wallet size={14} />
          <span>पोर्टफोलियो व कागज़</span>
        </button>

        <button
          onClick={() => setTab("rates")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "rates"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <TrendingUp size={14} />
          <span>दैनिक मंडी भाव (Rates)</span>
        </button>

        <button
          onClick={() => setTab("expenses")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "expenses"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <Layers size={14} />
          <span>खर्चा डायरी (Notebook)</span>
        </button>

        <button
          onClick={() => setTab("plans")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "plans"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <Compass size={14} />
          <span>मकान के नक्शे (Plans)</span>
        </button>

        <button
          onClick={() => setTab("directory")}
          className={`px-3.5 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
            tab === "directory"
              ? "bg-forest text-white shadow-sm"
              : "bg-white text-foreground border border-line"
          }`}
        >
          <HardHat size={14} />
          <span>डीलर व आर्किटेक्ट</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: PORTFOLIO & VAULT (पोर्टफोलियो और सुरक्षित कागज़)
          ========================================================================= */}
      {tab === "portfolio" && (
        <div className="space-y-4">
          {/* Wealth Portfolio Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-forest to-[#142e23] text-white shadow-md relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-mint opacity-90">
                  सुखून प्रॉपर्टी पोर्टफोलियो (Total Portfolio)
                </span>
                <div className="text-3xl font-extrabold mt-1">₹4.85 Crore</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-xs font-semibold text-mint">
                2 संपत्तियां (2 Assets)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15 text-xs">
              <div>
                <span className="text-white/60 block text-[10px]">कुल निवेश (Invested)</span>
                <span className="font-bold text-white">₹4.30 Cr</span>
              </div>
              <div>
                <span className="text-white/60 block text-[10px]">शुद्ध लाभ (Gain)</span>
                <span className="font-bold text-mint">+₹55 Lakh (+12.8%)</span>
              </div>
              <div>
                <span className="text-white/60 block text-[10px]">मासिक किराया (Rent)</span>
                <span className="font-bold text-white">₹18,500/माह</span>
              </div>
            </div>
          </div>

          {/* Properties Inset List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-forest uppercase tracking-wide">
                आपकी संपत्तियां (Your Properties)
              </h2>
              <span className="text-xs text-ink-muted">100% क्लियर टाइटल</span>
            </div>

            <div className="space-y-2.5">
              {/* Property 1 */}
              <div className="p-4 rounded-xl bg-white border border-line shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-mint text-forest flex items-center justify-center shrink-0">
                      <House size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Vijay Nagar House</h3>
                      <p className="text-xs text-ink-muted">Plot 14, Scheme 54, PU-4 • 3,200 sq.ft Villa</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                          ✓ रजिस्ट्री व नामांतरण पूर्ण
                        </span>
                        <span className="text-[11px] text-ink-muted">वैल्यू: ₹3.40 Cr</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property 2 */}
              <div className="p-4 rounded-xl bg-white border border-line shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky text-infinity-blue flex items-center justify-center shrink-0">
                      <Hammer size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Super Corridor Plot 108</h3>
                      <p className="text-xs text-ink-muted">Super Corridor Phase 2 • 4,500 sq.ft Plot</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-semibold">
                          🏗️ निर्माण चालू (Stage 3 स्लैब क्यूरिंग)
                        </span>
                        <span className="text-[11px] text-ink-muted">बजट: ₹1.45 Cr</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vaulted Papers Directory */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-forest uppercase tracking-wide">
                वॉल्टेड कागज़ात (Safe Vault Papers)
              </h2>
              <button
                onClick={() => setAddPaperModal(true)}
                className="text-xs font-bold text-forest hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                <span>कागज़ जोड़ें (Add Paper)</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-line divide-y divide-line overflow-hidden shadow-xs">
              {/* Paper 1 */}
              <div className="p-3.5 flex items-center justify-between hover:bg-canvas/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">पंजीकृत विक्रय पत्र (Sale Deed)</h4>
                    <p className="text-[11px] text-ink-muted">Book 1, Vol 4092, Page 88 • Sub-Registrar Indore</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewDoc("deed")}
                    className="px-2.5 py-1 rounded-md bg-canvas text-forest text-xs font-semibold hover:bg-mint transition"
                  >
                    देखें
                  </button>
                  <a
                    href="https://api.whatsapp.com/send?text=विजय+नगर+मकान+की+रजिस्ट्री+सत्यापित+प्रतिलिपि+सुखून+वॉल्ट+पर+सुरक्षित+है।"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                    title="WhatsApp पर भेजें"
                  >
                    <Share2 size={16} />
                  </a>
                </div>
              </div>

              {/* Paper 2 */}
              <div className="p-3.5 flex items-center justify-between hover:bg-canvas/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">नगर निगम नामांतरण प्रमाणपत्र (Mutation)</h4>
                    <p className="text-[11px] text-ink-muted">IMC-MUT-2021-9921 • Indore Municipal Corp</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewDoc("mutation")}
                    className="px-2.5 py-1 rounded-md bg-canvas text-forest text-xs font-semibold hover:bg-mint transition"
                  >
                    देखें
                  </button>
                  <a
                    href="https://api.whatsapp.com/send?text=नगर+निगम+इंदौर+नामांतरण+प्रमाणपत्र+प्रतिलिपि"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                  >
                    <Share2 size={16} />
                  </a>
                </div>
              </div>

              {/* Paper 3 */}
              <div className="p-3.5 flex items-center justify-between hover:bg-canvas/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">संपत्ति कर रसीद (Tax Assessment FY 2026-27)</h4>
                    <p className="text-[11px] text-ink-muted">IMC-PT-2026-54-0014 • ₹8,450 चुकता रसीद</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewDoc("tax")}
                    className="px-2.5 py-1 rounded-md bg-canvas text-forest text-xs font-semibold hover:bg-mint transition"
                  >
                    देखें
                  </button>
                  <a
                    href="https://api.whatsapp.com/send?text=नगर+निगम+संपत्ति+कर+रसीद+2026-27"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                  >
                    <Share2 size={16} />
                  </a>
                </div>
              </div>

              {/* Paper 4 */}
              <div className="p-3.5 flex items-center justify-between hover:bg-canvas/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky text-infinity-blue flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">T&amp;CP स्वीकृत भवन निर्माण नक्शा (NOC)</h4>
                    <p className="text-[11px] text-ink-muted">T&amp;CP-IND-B-4402 • टाउन एंड कंट्री प्लानिंग</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewDoc("sanction")}
                    className="px-2.5 py-1 rounded-md bg-canvas text-forest text-xs font-semibold hover:bg-mint transition"
                  >
                    देखें
                  </button>
                  <a
                    href="https://api.whatsapp.com/send?text=टी+एंड+सीपी+स्वीकृत+भवन+नक्शा"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                  >
                    <Share2 size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DAILY RAW MATERIAL RATES (आज के मंडी भाव)
          ========================================================================= */}
      {tab === "rates" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-champagne/40 border border-amber-200 flex items-start gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="text-xs font-bold text-amber-900">
                इंदौर दैनिक निर्माण सामग्री भाव (Real-Time Market Ticker)
              </h3>
              <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                लोहा मंडी, देवास नाका और नेमावर रोड से प्रतिदिन सुबह 10 बजे अपडेट किए जाते हैं। ताकि मकान बनाते समय कोई आपसे अधिक दाम न ले सके।
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {["All", "Steel", "Sand", "Cement", "Aggregates", "Bricks"].map((cat) => (
              <button
                key={cat}
                onClick={() => setMaterialFilter(cat)}
                className={`px-3 py-1.5 rounded-full font-medium transition ${
                  materialFilter === cat
                    ? "bg-forest text-white"
                    : "bg-white text-ink-muted border border-line"
                }`}
              >
                {cat === "All" ? "सभी भाव (All)" : cat}
              </button>
            ))}
          </div>

          {/* Material Rate Cards Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredRates.map((mat) => (
              <div
                key={mat.id}
                className="p-4 rounded-xl bg-white border border-line shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">{mat.nameHindi}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                      {mat.category}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{mat.brandOrType}</p>
                  <p className="text-[10px] text-ink-muted mt-1">
                    📍 {mat.marketLocation} • {mat.lastUpdated}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-forest">
                    ₹{mat.currentRate}
                  </div>
                  <div className="text-[10px] text-ink-muted">{mat.unitHindi}</div>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[11px] font-bold">
                    {mat.trend === "up" && (
                      <span className="text-red-600 flex items-center">
                        <TrendingUp size={12} /> +₹{mat.changeAmount}
                      </span>
                    )}
                    {mat.trend === "down" && (
                      <span className="text-emerald-600 flex items-center">
                        <TrendingDown size={12} /> -₹{Math.abs(mat.changeAmount)}
                      </span>
                    )}
                    {mat.trend === "stable" && (
                      <span className="text-ink-muted">स्थिर (Stable)</span>
                    )}
                  </div>

                  <a
                    href={`https://api.whatsapp.com/send?phone=919826012345&text=${encodeURIComponent(
                      `नमस्ते, मुझे सुखून ऐप पर आज का ${mat.nameHindi} का भाव ₹${mat.currentRate} ${mat.unitHindi} दिखा। मुझे इसके ऑर्डर की जानकारी चाहिए।`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition"
                  >
                    <MessageCircle size={12} />
                    <span>ऑर्डर करें</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: QUICK EXPENSES NOTEBOOK (खर्चा डायरी)
          ========================================================================= */}
      {tab === "expenses" && (
        <div className="space-y-4">
          {/* Total Spent Banner */}
          <div className="p-4 rounded-xl bg-forest text-white flex items-center justify-between">
            <div>
              <span className="text-xs text-white/70 block">कुल दर्ज खर्चा (Total Spent)</span>
              <span className="text-2xl font-black">₹{totalSpent.toLocaleString("en-IN")}</span>
            </div>
            <div className="text-right text-xs text-mint">
              <span>{expenses.length} प्रविष्टियां दर्ज</span>
            </div>
          </div>

          {/* Quick Expense Entry Form */}
          <div className="p-4 rounded-xl bg-white border border-line shadow-xs">
            <h3 className="text-sm font-bold text-forest mb-3 flex items-center gap-1.5">
              <span>✏️</span>
              <span>नया खर्चा दर्ज करें (Quick Expense Notebook)</span>
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-muted block mb-1">
                  ठेकेदार / एजेंसी / सामग्री का नाम (Agency Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. शर्मा सरिया स्टोर्स / मुकेश मिस्त्री"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-ink-muted block mb-1">
                    रकम ₹ (Amount)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="उदा. 25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted block mb-1">
                    श्रेणी (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as QuickExpense["category"])}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                  >
                    <option value="Material">सामग्री (Material)</option>
                    <option value="Labor">मजदूरी (Labor)</option>
                    <option value="Equipment">मशीनरी (Equipment)</option>
                    <option value="Contractor">ठेकेदार (Contractor)</option>
                    <option value="Miscellaneous">अन्य (Misc)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted block mb-1">
                  टिप्पणी (Note - Optional)
                </label>
                <input
                  type="text"
                  placeholder="उदा. 50 बोरी सीमेंट प्रथम तल स्लैब हेतु"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-forest text-white font-bold text-sm shadow-xs hover:opacity-95 transition"
              >
                + खर्चा जोड़ें (Save Expense)
              </button>
            </form>

            {showExpenseToast && (
              <div className="mt-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-md">
                ✓ खर्चा डायरी में सफलतापूर्वक दर्ज हुआ!
              </div>
            )}
          </div>

          {/* Expenses History List */}
          <div>
            <h3 className="text-xs font-bold text-forest uppercase tracking-wider mb-2">
              खर्चा इतिहास (Recent Expenses)
            </h3>
            <div className="bg-white rounded-xl border border-line divide-y divide-line overflow-hidden shadow-xs">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-3.5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground">{exp.agencyName}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                        {exp.category}
                      </span>
                    </div>
                    {exp.note && <p className="text-[11px] text-ink-muted mt-0.5">{exp.note}</p>}
                    <span className="text-[10px] text-ink-muted block mt-1">📅 {exp.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-forest">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CONCEPTUAL FLOOR PLANS (मकान के नक्शे)
          ========================================================================= */}
      {tab === "plans" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-sky/40 border border-blue-200 text-xs text-blue-900 leading-relaxed">
            📐 <strong>वास्तु-सम्मत मानक नक्शे (Standard Floor Plans):</strong> इंदौर व मध्य प्रदेश में सर्वाधिक बनने वाले 5 प्लॉट साइज़ के नक्शे। 1-क्लिक में देखें और अपने ठेकेदार/आर्किटेक्ट को WhatsApp पर भेजें।
          </div>

          {/* Plot Size Selector Buttons */}
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {CONCEPTUAL_PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center ${
                  selectedPlanId === plan.id
                    ? "bg-forest text-white shadow-sm"
                    : "bg-white text-foreground border border-line"
                }`}
              >
                <span>{plan.dimensions}</span>
                <span className="text-[10px] font-normal opacity-80">{plan.plotAreaSqft} sqft</span>
              </button>
            ))}
          </div>

          {/* Selected Plan Details Card */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-infinity-blue bg-blue-50 px-2 py-0.5 rounded">
                  {selectedPlan.dimensions} प्लॉट साइज़ ({selectedPlan.plotAreaSqft} वर्गफीट)
                </span>
                <h3 className="text-base font-bold text-forest mt-1.5">{selectedPlan.title}</h3>
                <p className="text-xs text-ink-muted mt-0.5">{selectedPlan.configuration}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 block">✓ 100% वास्तु सम्मत</span>
                <span className="text-[11px] text-ink-muted">{selectedPlan.facing}</span>
              </div>
            </div>

            {/* Estimated Cost & Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-canvas/40 p-3 rounded-xl border border-line/60">
              <div>
                <span className="text-ink-muted block text-[10px]">अनुमानित निर्माण लागत (Cost)</span>
                <span className="font-extrabold text-forest">{selectedPlan.estimatedCost}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[10px]">बिल्ट-अप एरिया (Built-up)</span>
                <span className="font-extrabold text-foreground">{selectedPlan.builtUpSqft} sq.ft</span>
              </div>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              {selectedPlan.description}
            </p>

            {/* Room Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-forest uppercase tracking-wider mb-2">
                तल अनुसार कमरों का विवरण (Layout Breakdown)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-canvas/30 border border-line/60">
                  <span className="font-bold text-forest block mb-1">ग्राउंड फ्लोर (Ground Floor):</span>
                  <ul className="list-disc list-inside space-y-0.5 text-ink-muted text-[11px]">
                    {selectedPlan.roomDetails.groundFloor.map((rm, idx) => (
                      <li key={idx}>{rm}</li>
                    ))}
                  </ul>
                </div>

                {selectedPlan.roomDetails.firstFloor && (
                  <div className="p-3 rounded-lg bg-canvas/30 border border-line/60">
                    <span className="font-bold text-forest block mb-1">प्रथम तल (First Floor):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-ink-muted text-[11px]">
                      {selectedPlan.roomDetails.firstFloor.map((rm, idx) => (
                        <li key={idx}>{rm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `सुकून ऐप पर ${selectedPlan.dimensions} (${selectedPlan.plotAreaSqft} sqft) का वास्तु-सम्मत नक्शा: ${selectedPlan.title}। अनुमानित लागत: ${selectedPlan.estimatedCost}।`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <MessageCircle size={16} />
              <span>ठेकेदार / आर्किटेक्ट को WhatsApp पर नक्शा भेजें</span>
            </a>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: VERIFIED DIRECTORY (डीलर और आर्किटेक्ट)
          ========================================================================= */}
      {tab === "directory" && (
        <div className="space-y-5">
          {/* Architects Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-forest uppercase tracking-wider">
                पंजीकृत आर्किटेक्ट (Authorized Architects)
              </h2>
              <span className="text-xs text-ink-muted">Indore COA Registered</span>
            </div>

            <div className="space-y-2.5">
              {AUTHORIZED_ARCHITECTS.map((arch) => (
                <div key={arch.id} className="p-4 rounded-xl bg-white border border-line shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground">{arch.name}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-xs text-forest font-medium">{arch.firm} • {arch.experienceYears} Years Exp</p>
                      <p className="text-[11px] text-ink-muted mt-1">{arch.specialization}</p>
                      <p className="text-[10px] text-ink-muted mt-0.5">📍 {arch.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
                    <a
                      href={`tel:${arch.phone}`}
                      className="flex-1 py-1.5 rounded-lg bg-canvas text-forest text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-mint transition"
                    >
                      <Phone size={14} />
                      <span>कॉल करें</span>
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?phone=${arch.whatsapp}&text=${encodeURIComponent(
                        `नमस्ते ${arch.name}, मुझे सुखून ऐप पर आपका प्रोफाइल दिखा। मुझे इंदौर में मकान निर्माण एवं नक्शे हेतु परामर्श चाहिए।`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp परामर्श</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Material Dealers Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-forest uppercase tracking-wider">
                अधिकृत सामग्री डीलर (Material Dealers)
              </h2>
              <span className="text-xs text-ink-muted">Wholesale Rates</span>
            </div>

            <div className="space-y-2.5">
              {AUTHORIZED_DEALERS.map((dlr) => (
                <div key={dlr.id} className="p-4 rounded-xl bg-white border border-line shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground">{dlr.businessName}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                          ✓ {dlr.rating} ★
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted">{dlr.name} • {dlr.location}</p>
                      <p className="text-[11px] text-forest font-medium mt-1">{dlr.specialty}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {dlr.categories.map((cat, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
                    <a
                      href={`tel:${dlr.phone}`}
                      className="flex-1 py-1.5 rounded-lg bg-canvas text-forest text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-mint transition"
                    >
                      <Phone size={14} />
                      <span>कॉल करें</span>
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?phone=${dlr.whatsapp}&text=${encodeURIComponent(
                        `नमस्ते ${dlr.name}, मुझे सुखून ऐप पर आपकी दुकान ${dlr.businessName} का विवरण मिला। मुझे निर्माण सामग्री के थोक भाव चाहिए।`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp भाव</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAPER PREVIEW MODAL
          ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-sm font-bold text-forest">
                {previewDoc === "deed" && "रजिस्ट्री विक्रय पत्र (Sale Deed)"}
                {previewDoc === "mutation" && "नगर निगम नामांतरण प्रमाणपत्र"}
                {previewDoc === "tax" && "संपत्ति कर रसीद FY 2026-27"}
                {previewDoc === "sanction" && "भवन निर्माण स्वीकृति नक्शा"}
              </h3>
              <button onClick={() => setPreviewDoc(null)} className="text-ink-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-dashed border-line text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <ShieldCheck size={28} />
              </div>
              <h4 className="text-xs font-bold text-foreground">सत्यापित व एन्क्रिप्टेड डिजिटल प्रति</h4>
              <p className="text-[11px] text-ink-muted">
                यह दस्तावेज़ सुखून प्राइवेट वॉल्ट में सुरक्षित है। इसका डिजिटल चेकसम प्रमाणित है।
              </p>
              <div className="text-[10px] font-mono bg-white p-2 rounded border border-line text-ink-muted">
                SHA-256: 8f4b12...a99c01 (Verified Offline)
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="flex-1 py-2 rounded-xl bg-forest text-white text-xs font-bold"
              >
                बंद करें
              </button>
              <a
                href="https://api.whatsapp.com/send?text=सुखून+वॉल्ट+से+सत्यापित+प्रॉपर्टी+दस्तावेज़"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Share2 size={14} />
                <span>शेयर</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD PAPER MODAL
          ========================================================================= */}
      {addPaperModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-sm font-bold text-forest">नया कागज़ जोड़ें (Add Paper)</h3>
              <button onClick={() => { setAddPaperModal(false); setPaperAddedSuccess(false); }} className="text-ink-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {paperAddedSuccess ? (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-sm font-bold text-foreground">कागज़ सुरक्षित वॉल्ट में जुड़ गया!</h4>
                <p className="text-xs text-ink-muted">
                  आपका दस्तावेज़ सुरक्षित रूप से सेव हो गया है।
                </p>
                <button
                  onClick={() => { setAddPaperModal(false); setPaperAddedSuccess(false); }}
                  className="mt-3 px-6 py-2 rounded-xl bg-forest text-white text-xs font-bold"
                >
                  ठीक है
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-ink-muted block mb-1">
                    कागज़ का नाम (Document Title)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. बिजली कनेक्शन एनओसी / डायवर्सन ऑर्डर"
                    value={newPaperTitle}
                    onChange={(e) => setNewPaperTitle(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                  />
                </div>

                <div className="p-6 rounded-xl border-2 border-dashed border-forest/40 bg-canvas/30 text-center space-y-2 cursor-pointer hover:bg-mint/20 transition">
                  <Scan size={32} className="mx-auto text-forest" />
                  <span className="text-xs font-bold text-forest block">
                    कैमरे से फोटो खींचें या फाइल चुनें
                  </span>
                  <span className="text-[10px] text-ink-muted block">
                    PDF, JPG, PNG (ऑटो कॉर्नर डिटेक्शन सक्रिय)
                  </span>
                </div>

                <button
                  onClick={() => setPaperAddedSuccess(true)}
                  className="w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold hover:opacity-95 transition"
                >
                  वॉल्ट में सुरक्षित करें (Encrypt &amp; Save)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EstatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-muted">लोड हो रहा है...</div>}>
      <EstateContent />
    </Suspense>
  );
}

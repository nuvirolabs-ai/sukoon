"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  House,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  Send,
  ShieldCheck,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  DAILY_WHATSAPP_DEALS,
  INDORE_GUIDELINE_RATES,
} from "@/lib/data/market-hub";

type BuySellSection = "buy" | "sell" | "add" | "listing";

const BUY_SELL_ICONS = [
  {
    id: "buy",
    label: "Buy a Property",
    sub: "Browse Verified Deals",
    icon: Compass,
    accent: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "sell",
    label: "Sell a Property",
    sub: "Direct to Genuine Buyers",
    icon: Tag,
    accent: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "add",
    label: "Add a Property",
    sub: "Onboard to Your Passport",
    icon: PlusCircle,
    accent: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "listing",
    label: "Submit a Listing",
    sub: "Rates & Valuation",
    icon: Building,
    accent: "bg-purple-50 text-purple-800 border-purple-200",
  },
] as const;

function BuySellContent() {
  const searchParams = useSearchParams();
  const initialSection = (searchParams.get("section") as BuySellSection) || "buy";
  const [section, setSection] = useState<BuySellSection>(initialSection);

  // Sell form state
  const [sellType, setSellType] = useState("Plot");
  const [sellLocation, setSellLocation] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellContact, setSellContact] = useState("");
  const [sellSuccess, setSellSuccess] = useState(false);

  // Add property form state
  const [addName, setAddName] = useState("");
  const [addArea, setAddArea] = useState("");
  const [addLoc, setAddLoc] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  // Listing filter
  const [areaFilter, setAreaFilter] = useState("All");

  return (
    <div className="mx-auto max-w-[430px] min-h-screen px-4 pt-3 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-line/60 mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:opacity-80"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Sukoon Marketplace
        </span>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Buy &amp; Sell Hub
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          What would you like to do with property today?
        </p>
      </div>

      {/* 4 Feature Choice Icons */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {BUY_SELL_ICONS.map((item) => {
          const Icon = item.icon;
          const isSelected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id as BuySellSection)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "bg-forest text-white border-forest shadow-sm"
                  : "bg-white border-line hover:border-forest/40 text-foreground"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                  isSelected ? "bg-white/20 text-white" : item.accent
                }`}
              >
                <Icon size={18} />
              </div>
              <p className="text-[13px] font-bold leading-tight">{item.label}</p>
              <p
                className={`text-[10px] mt-0.5 ${
                  isSelected ? "text-white/80" : "text-ink-muted"
                }`}
              >
                {item.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: BUY A PROPERTY */}
      {section === "buy" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest">
              Verified Properties for Sale (Indore)
            </h2>
            <span className="text-[10px] text-ink-muted">Title Guaranteed</span>
          </div>

          <div className="space-y-2.5">
            {DAILY_WHATSAPP_DEALS.map((deal) => (
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
                    <h3 className="text-xs font-bold text-foreground">{deal.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-forest">{deal.priceFormatted}</span>
                    <span className="text-[10px] block text-ink-muted">{deal.dimensions}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-line/60 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-forest font-semibold">
                    <ShieldCheck size={14} /> Title Clear &amp; Mutation Done
                  </div>
                  <a
                    href={`https://wa.me/919826000000?text=${encodeURIComponent(
                      `Hello, I am interested in: ${deal.title} in ${deal.location} listed on Sukoon (${deal.priceFormatted}). Please share details.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-95"
                  >
                    <MessageCircle size={13} /> Inquire
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: SELL A PROPERTY */}
      {section === "sell" && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                Direct Seller Listing
              </span>
              <h2 className="text-sm font-bold text-foreground mt-1">
                Post Your Property for Sale
              </h2>
              <p className="text-xs text-ink-muted">
                Connect directly with verified buyers without brokerage clutter.
              </p>
            </div>

            {sellSuccess ? (
              <div className="p-4 rounded-2xl bg-mint text-forest text-xs font-bold text-center space-y-1">
                <CheckCircle2 size={24} className="mx-auto" />
                <p>Listing submitted! Sukoon team will verify title within 4 hours.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!sellLocation || !sellPrice) return;
                  setSellSuccess(true);
                  setTimeout(() => setSellSuccess(false), 4000);
                }}
                className="space-y-2.5"
              >
                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">
                    Property Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Plot", "Flat", "Bungalow"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSellType(t)}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          sellType === t
                            ? "bg-forest text-white border-forest"
                            : "bg-canvas border-line text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">
                    Location / Colony in Indore
                  </label>
                  <input
                    type="text"
                    required
                    value={sellLocation}
                    onChange={(e) => setSellLocation(e.target.value)}
                    placeholder="e.g. Super Corridor Near Metro Station"
                    className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Expected Price (₹)
                    </label>
                    <input
                      type="text"
                      required
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      placeholder="e.g. ₹95 Lakhs"
                      className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Your Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={sellContact}
                      onChange={(e) => setSellContact(e.target.value)}
                      placeholder="+91 98..."
                      className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                >
                  <Send size={13} /> Submit Listing
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* SECTION 3: ADD A PROPERTY */}
      {section === "add" && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                Asset Passport
              </span>
              <h2 className="text-sm font-bold text-foreground mt-1">
                Onboard New Property to Sukoon
              </h2>
              <p className="text-xs text-ink-muted">
                Add an asset to manage its papers, taxes, construction &amp; history.
              </p>
            </div>

            {addSuccess ? (
              <div className="p-4 rounded-2xl bg-mint text-forest text-xs font-bold text-center space-y-1">
                <CheckCircle2 size={24} className="mx-auto" />
                <p>Property added to your Sukoon Passport!</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!addName) return;
                  setAddSuccess(true);
                  setTimeout(() => setAddSuccess(false), 3000);
                }}
                className="space-y-2.5"
              >
                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">
                    Property Name / Nickname
                  </label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Rau Bypass Plot or Ujjain Road Land"
                    className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Plot / Flat Area
                    </label>
                    <input
                      type="text"
                      value={addArea}
                      onChange={(e) => setAddArea(e.target.value)}
                      placeholder="e.g. 1500 sq ft"
                      className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      City / Tehsil
                    </label>
                    <input
                      type="text"
                      value={addLoc}
                      onChange={(e) => setAddLoc(e.target.value)}
                      placeholder="Indore"
                      className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
                >
                  + Create Property Record
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* SECTION 4: SUBMIT A LISTING & GUIDELINE RATES */}
      {section === "listing" && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest">
              Official Collector Guideline Rates (Indore 2026)
            </h2>
            <p className="text-xs text-ink-muted">
              Benchmark circle rates used by sub-registrars for stamp duty calculation.
            </p>
          </div>

          <div className="space-y-2">
            {INDORE_GUIDELINE_RATES.map((rate, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-foreground">{rate.locality}</h3>
                  <p className="text-[10px] text-ink-muted">
                    Residential: ₹{rate.residentialPlotRate}/sqft
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-forest">₹{rate.commercialPlotRate}/sqft</span>
                  <span className="text-[9px] block text-ink-muted">Commercial</span>
                </div>
              </div>
            ))}
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

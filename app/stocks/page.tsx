"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Search,
  Building2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

export interface IndianStockItem {
  symbol: string;
  exchange: "NSE" | "BSE";
  name: string;
  sector: "Realty" | "REIT" | "Cement" | "Steel & Pipes";
  currentPrice: number;
  changeValue: number;
  changePercent: number;
  isPositive: boolean;
  marketCap: string;
  low52W: number;
  high52W: number;
  peRatio: number;
  dividendYield: string;
  highlights: string;
}

export const INDIAN_STOCK_MARKET_DATA: IndianStockItem[] = [
  // --- REAL ESTATE DEVELOPERS ---
  {
    symbol: "DLF",
    exchange: "NSE",
    name: "DLF Limited",
    sector: "Realty",
    currentPrice: 892.4,
    changeValue: 20.9,
    changePercent: 2.4,
    isPositive: true,
    marketCap: "₹2.21 Lakh Cr",
    low52W: 510.0,
    high52W: 967.6,
    peRatio: 52.4,
    dividendYield: "0.56%",
    highlights: "India's largest listed real estate developer by market capitalization.",
  },
  {
    symbol: "GODREJPROP",
    exchange: "NSE",
    name: "Godrej Properties Ltd",
    sector: "Realty",
    currentPrice: 2840.15,
    changeValue: 50.2,
    changePercent: 1.8,
    isPositive: true,
    marketCap: "₹78,950 Cr",
    low52W: 1680.0,
    high52W: 3150.0,
    peRatio: 68.2,
    dividendYield: "0.00%",
    highlights: "Leading pan-India residential booking sales across NCR, MMR & Bengaluru.",
  },
  {
    symbol: "LODHA",
    exchange: "NSE",
    name: "Macrotech Developers (Lodha)",
    sector: "Realty",
    currentPrice: 1215.5,
    changeValue: 36.5,
    changePercent: 3.1,
    isPositive: true,
    marketCap: "₹1.18 Lakh Cr",
    low52W: 780.0,
    high52W: 1380.0,
    peRatio: 44.8,
    dividendYield: "0.42%",
    highlights: "Dominant luxury residential developer in Mumbai Metropolitan Region.",
  },
  {
    symbol: "OBEROIRLTY",
    exchange: "NSE",
    name: "Oberoi Realty Limited",
    sector: "Realty",
    currentPrice: 1780.2,
    changeValue: 24.5,
    changePercent: 1.4,
    isPositive: true,
    marketCap: "₹64,720 Cr",
    low52W: 1080.0,
    high52W: 1940.0,
    peRatio: 32.5,
    dividendYield: "0.45%",
    highlights: "Premium high-margin luxury residential, retail malls & commercial towers.",
  },
  {
    symbol: "PRESTIGE",
    exchange: "NSE",
    name: "Prestige Estates Projects",
    sector: "Realty",
    currentPrice: 1640.8,
    changeValue: 35.3,
    changePercent: 2.2,
    isPositive: true,
    marketCap: "₹65,800 Cr",
    low52W: 720.0,
    high52W: 1780.0,
    peRatio: 48.1,
    dividendYield: "0.18%",
    highlights: "Major South India & Mumbai commercial hospitality and residential titan.",
  },
  {
    symbol: "PHOENIXLTD",
    exchange: "NSE",
    name: "The Phoenix Mills Ltd",
    sector: "Realty",
    currentPrice: 1560.4,
    changeValue: 12.4,
    changePercent: 0.8,
    isPositive: true,
    marketCap: "₹55,800 Cr",
    low52W: 980.0,
    high52W: 1720.0,
    peRatio: 51.6,
    dividendYield: "0.32%",
    highlights: "India's premier retail mall developer (Phoenix Palladium & Marketcities).",
  },
  {
    symbol: "BRIGADE",
    exchange: "NSE",
    name: "Brigade Enterprises Ltd",
    sector: "Realty",
    currentPrice: 1120.6,
    changeValue: 17.6,
    changePercent: 1.6,
    isPositive: true,
    marketCap: "₹26,100 Cr",
    low52W: 580.0,
    high52W: 1240.0,
    peRatio: 38.4,
    dividendYield: "0.22%",
    highlights: "Integrated townships, tech parks, and residential villas in Bengaluru.",
  },
  {
    symbol: "SOBHA",
    exchange: "NSE",
    name: "Sobha Limited",
    sector: "Realty",
    currentPrice: 1680.0,
    changeValue: 47.3,
    changePercent: 2.9,
    isPositive: true,
    marketCap: "₹15,920 Cr",
    low52W: 740.0,
    high52W: 1850.0,
    peRatio: 46.2,
    dividendYield: "0.18%",
    highlights: "Backward-integrated German construction quality benchmark across India.",
  },
  {
    symbol: "SUNTECK",
    exchange: "NSE",
    name: "Sunteck Realty Limited",
    sector: "Realty",
    currentPrice: 495.3,
    changeValue: 5.8,
    changePercent: 1.2,
    isPositive: true,
    marketCap: "₹7,250 Cr",
    low52W: 360.0,
    high52W: 550.0,
    peRatio: 34.0,
    dividendYield: "0.30%",
    highlights: "Signature luxury developments at BKC, Oshiwara District Center & Naigaon.",
  },

  // --- REITS & YIELD ASSETS ---
  {
    symbol: "EMBASSY",
    exchange: "NSE",
    name: "Embassy Office Parks REIT",
    sector: "REIT",
    currentPrice: 388.5,
    changeValue: 2.3,
    changePercent: 0.6,
    isPositive: true,
    marketCap: "₹36,800 Cr",
    low52W: 310.0,
    high52W: 415.0,
    peRatio: 24.1,
    dividendYield: "6.8%",
    highlights: "Asia's first listed REIT. Grade-A office tech parks leased to global MNCs.",
  },
  {
    symbol: "NEXUS",
    exchange: "NSE",
    name: "Nexus Select Trust (Retail REIT)",
    sector: "REIT",
    currentPrice: 142.2,
    changeValue: 1.5,
    changePercent: 1.1,
    isPositive: true,
    marketCap: "₹21,550 Cr",
    low52W: 120.0,
    high52W: 154.0,
    peRatio: 18.5,
    dividendYield: "7.8%",
    highlights: "India's only retail mall REIT (Select Citywalk Delhi & 16 flagship malls).",
  },
  {
    symbol: "MINDSPACE",
    exchange: "NSE",
    name: "Mindspace Business Parks REIT",
    sector: "REIT",
    currentPrice: 348.2,
    changeValue: 1.4,
    changePercent: 0.4,
    isPositive: true,
    marketCap: "₹20,650 Cr",
    low52W: 300.0,
    high52W: 375.0,
    peRatio: 22.8,
    dividendYield: "6.5%",
    highlights: "K Raheja Corp backed tech parks in Hyderabad, Mumbai, Pune & Chennai.",
  },
  {
    symbol: "BIRET",
    exchange: "NSE",
    name: "Brookfield India Real Estate Trust",
    sector: "REIT",
    currentPrice: 262.1,
    changeValue: 2.3,
    changePercent: 0.9,
    isPositive: true,
    marketCap: "₹11,400 Cr",
    low52W: 220.0,
    high52W: 285.0,
    peRatio: 21.0,
    dividendYield: "7.2%",
    highlights: "Institutional Grade-A campus assets in NCR, Mumbai & Kolkata.",
  },

  // --- CEMENT & BUILDING MATERIALS ---
  {
    symbol: "ULTRACEMCO",
    exchange: "NSE",
    name: "UltraTech Cement Limited",
    sector: "Cement",
    currentPrice: 11240.0,
    changeValue: 165.0,
    changePercent: 1.5,
    isPositive: true,
    marketCap: "₹3.24 Lakh Cr",
    low52W: 8200.0,
    high52W: 11800.0,
    peRatio: 42.0,
    dividendYield: "0.62%",
    highlights: "World's 3rd largest cement manufacturer outside China; national market leader.",
  },
  {
    symbol: "AMBUJACEM",
    exchange: "NSE",
    name: "Ambuja Cements Limited",
    sector: "Cement",
    currentPrice: 578.4,
    changeValue: 5.1,
    changePercent: 0.9,
    isPositive: true,
    marketCap: "₹1.42 Lakh Cr",
    low52W: 410.0,
    high52W: 680.0,
    peRatio: 38.6,
    dividendYield: "0.35%",
    highlights: "Adani Group cement powerhouse with rapid capacity expansions across India.",
  },
  {
    symbol: "PIDILITIND",
    exchange: "NSE",
    name: "Pidilite Industries (Dr. Fixit)",
    sector: "Cement",
    currentPrice: 3120.0,
    changeValue: 40.0,
    changePercent: 1.3,
    isPositive: true,
    marketCap: "₹1.58 Lakh Cr",
    low52W: 2350.0,
    high52W: 3300.0,
    peRatio: 82.5,
    dividendYield: "0.51%",
    highlights: "Dominant construction waterproofing chemicals (Dr. Fixit) & adhesives monopoly.",
  },
  {
    symbol: "ASIANPAINT",
    exchange: "NSE",
    name: "Asian Paints Limited",
    sector: "Cement",
    currentPrice: 2980.0,
    changeValue: 14.8,
    changePercent: 0.5,
    isPositive: true,
    marketCap: "₹2.85 Lakh Cr",
    low52W: 2750.0,
    high52W: 3420.0,
    peRatio: 54.2,
    dividendYield: "1.12%",
    highlights: "India's largest decorative coatings & interior home finishing brand.",
  },

  // --- STEEL & PIPES ---
  {
    symbol: "TATASTEEL",
    exchange: "NSE",
    name: "Tata Steel Limited",
    sector: "Steel & Pipes",
    currentPrice: 152.4,
    changeValue: 1.8,
    changePercent: 1.2,
    isPositive: true,
    marketCap: "₹1.90 Lakh Cr",
    low52W: 115.0,
    high52W: 184.0,
    peRatio: 26.5,
    dividendYield: "2.36%",
    highlights: "Makers of Tata Tiscon Fe 550D TMT bars used in foundation & RCC framing.",
  },
  {
    symbol: "JSWSTEEL",
    exchange: "NSE",
    name: "JSW Steel Limited",
    sector: "Steel & Pipes",
    currentPrice: 948.0,
    changeValue: 14.9,
    changePercent: 1.6,
    isPositive: true,
    marketCap: "₹2.32 Lakh Cr",
    low52W: 720.0,
    high52W: 1040.0,
    peRatio: 28.1,
    dividendYield: "0.77%",
    highlights: "Largest private sector steel manufacturer supplying construction rebar.",
  },
  {
    symbol: "ASTRAL",
    exchange: "NSE",
    name: "Astral Limited (Plumbing & Pipes)",
    sector: "Steel & Pipes",
    currentPrice: 1860.5,
    changeValue: 31.0,
    changePercent: 1.7,
    isPositive: true,
    marketCap: "₹50,000 Cr",
    low52W: 1650.0,
    high52W: 2280.0,
    peRatio: 88.0,
    dividendYield: "0.22%",
    highlights: "Pioneer in CPVC & PVC plumbing, drainage and infrastructure piping.",
  },
];

export const MAJOR_INDICES = [
  {
    name: "NIFTY 50",
    value: "24,340.85",
    change: "+128.40",
    percent: "+0.53%",
    isPositive: true,
    exchange: "NSE",
  },
  {
    name: "SENSEX",
    value: "79,942.18",
    change: "+360.25",
    percent: "+0.45%",
    isPositive: true,
    exchange: "BSE",
  },
  {
    name: "NIFTY REALTY",
    value: "986.30",
    change: "+18.45",
    percent: "+1.91%",
    isPositive: true,
    exchange: "NSE",
  },
  {
    name: "NIFTY INFRA",
    value: "8,420.10",
    change: "+62.15",
    percent: "+0.74%",
    isPositive: true,
    exchange: "NSE",
  },
];

export default function StockMarketPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSector, setActiveSector] = useState<string>("All");

  const filteredStocks = useMemo(() => {
    return INDIAN_STOCK_MARKET_DATA.filter((stock) => {
      const matchesSector = activeSector === "All" || stock.sector === activeSector;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        stock.symbol.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.sector.toLowerCase().includes(q);
      return matchesSector && matchesSearch;
    });
  }, [searchQuery, activeSector]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen px-4 pt-3 pb-28 text-foreground space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-line/60">
        <Link
          href="/"
          className="tap-scale inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:opacity-80"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          NSE &amp; BSE Markets
        </span>
      </div>

      {/* Hero Title & Live Status */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-[#1B2922]">Stock Market Prices</h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>NSE / BSE Live</span>
          </span>
        </div>
        <p className="text-xs text-ink-muted">
          Live Indian equities: Real estate developers, REITs, cement &amp; construction steel.
        </p>
      </div>

      {/* Major Indian Indices Strip */}
      <div className="grid grid-cols-2 gap-2.5">
        {MAJOR_INDICES.map((idx) => (
          <div
            key={idx.name}
            className="p-3 rounded-2xl bg-white border border-line shadow-2xs space-y-1 hover:border-forest/40 transition"
          >
            <div className="flex items-center justify-between text-[10px] text-ink-muted font-bold">
              <span>{idx.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-sand/60 text-[9px]">{idx.exchange}</span>
            </div>
            <div className="text-sm font-black text-[#1B2922]">{idx.value}</div>
            <div
              className={`text-[10px] font-bold inline-flex items-center gap-0.5 ${
                idx.isPositive ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {idx.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{idx.change} ({idx.percent})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Indian stocks (DLF, Godrej, UltraTech, REIT)..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-line text-xs font-medium focus:outline-none focus:ring-1 focus:ring-forest shadow-2xs"
        />
      </div>

      {/* Sector Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          "All",
          "Realty",
          "REIT",
          "Cement",
          "Steel & Pipes",
        ].map((sec) => {
          const isSelected = activeSector === sec;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSector(sec)}
              className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isSelected
                  ? "bg-forest text-white shadow-2xs"
                  : "bg-white text-ink-muted border border-line hover:border-forest/40"
              }`}
            >
              {sec === "All" ? "All Indian Equities" : sec}
            </button>
          );
        })}
      </div>

      {/* Stocks List */}
      <div className="space-y-3">
        {filteredStocks.length === 0 ? (
          <div className="p-8 text-center bg-sand/30 rounded-3xl border border-dashed border-line text-xs text-ink-muted space-y-1">
            <BarChart3 size={24} className="mx-auto opacity-50 mb-1" />
            <p className="font-bold">No stocks match your query.</p>
            <p className="text-[11px]">Try searching by company name or ticker symbol.</p>
          </div>
        ) : (
          filteredStocks.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-forest/40 transition space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-[#1B2922]">
                      {stock.symbol}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sand/80 text-ink-muted">
                      {stock.exchange}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        stock.sector === "Realty"
                          ? "bg-emerald-50 text-emerald-800"
                          : stock.sector === "REIT"
                          ? "bg-blue-50 text-blue-800"
                          : stock.sector === "Cement"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {stock.sector}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-[#1B2922] mt-0.5">
                    {stock.name}
                  </h3>
                  <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                    {stock.highlights}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-[#1B2922] block font-mono">
                    ₹{stock.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                      stock.isPositive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {stock.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    <span>{stock.isPositive ? `+${stock.changePercent}%` : `${stock.changePercent}%`}</span>
                  </span>
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div className="pt-2 border-t border-line/60 grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-ink-muted block">Market Cap</span>
                  <strong className="text-[#1B2922] font-semibold">{stock.marketCap}</strong>
                </div>
                <div>
                  <span className="text-ink-muted block">52W Range</span>
                  <strong className="text-[#1B2922] font-semibold">
                    ₹{stock.low52W} - ₹{stock.high52W}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-ink-muted block">
                    {stock.sector === "REIT" ? "Distribution Yield" : "P/E Ratio"}
                  </span>
                  <strong className="text-forest font-semibold">
                    {stock.sector === "REIT" ? stock.dividendYield : `${stock.peRatio}x`}
                  </strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Real Estate Correlation Educational Tip */}
      <div className="p-4 rounded-3xl bg-sand/30 border border-line space-y-2 text-xs">
        <div className="flex items-center gap-2 text-[#1B2922] font-bold">
          <Sparkles size={15} className="text-[#1E5637]" />
          <span>Why Indian Stock Prices Matter For Real Estate</span>
        </div>
        <p className="text-[11px] text-[#2A3A30] leading-relaxed">
          The <strong>NIFTY Realty Index</strong> and input materials like <strong>UltraTech Cement</strong> and <strong>Tata Steel</strong> serve as leading indicators for property prices and construction costs across Tier-1 and Tier-2 Indian cities like Indore, Mumbai and NCR.
        </p>
      </div>
    </div>
  );
}

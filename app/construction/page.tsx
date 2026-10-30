"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  Hammer,
  HardHat,
  Layers,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ConstructionJourneyView } from "@/components/ConstructionJourneyView";
import {
  DAILY_MATERIAL_RATES,
  INITIAL_QUICK_EXPENSES,
  type QuickExpense,
} from "@/lib/data/construction-hub";
import { PinToHomeButton } from "@/components/PinToHomeButton";

type ConstructionSection = "journey" | "accounts" | "site" | "rates";

const CONSTRUCTION_ICONS = [
  {
    id: "journey",
    label: "Build Journey",
    sub: "28 Steps (0 to 1)",
    icon: Hammer,
    accent: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "accounts",
    label: "Expense Notebook",
    sub: "Accounts & Bills Ledger",
    icon: BookOpen,
    accent: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "site",
    label: "Site Progress Log",
    sub: "Daily Inspection & Notes",
    icon: HardHat,
    accent: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "rates",
    label: "Material Rates",
    sub: "Indore Mandi & Estimator",
    icon: TrendingUp,
    accent: "bg-purple-50 text-purple-800 border-purple-200",
  },
] as const;

function ConstructionContent() {
  const searchParams = useSearchParams();
  const initialSection =
    (searchParams.get("section") as ConstructionSection) || "journey";
  const [section, setSection] = useState<ConstructionSection>(initialSection);

  // Expense notebook state
  const [expenses, setExpenses] = useState<QuickExpense[]>(INITIAL_QUICK_EXPENSES);
  const [agencyName, setAgencyName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<QuickExpense["category"]>("Material");
  const [note, setNote] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Material rates calculator state
  const [builtupSqft, setBuiltupSqft] = useState(1500);

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!agencyName || !val || isNaN(val)) return;

    const newExp: QuickExpense = {
      id: `exp-${Date.now()}`,
      agencyName,
      category,
      amount: val,
      date: new Date().toISOString().split("T")[0],
      note: note || undefined,
    };

    setExpenses([newExp, ...expenses]);
    setAgencyName("");
    setAmount("");
    setNote("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

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
          Sukoon Construction
        </span>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Construction Hub
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Select what you want to manage for your home build
        </p>
      </div>

      {/* 4 Feature Choice Icons */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {CONSTRUCTION_ICONS.map((item) => {
          const Icon = item.icon;
          const isSelected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id as ConstructionSection)}
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

      {/* SECTION 1: 0 TO 1 BUILD JOURNEY */}
      {section === "journey" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Home Building Roadmap</span>
            <PinToHomeButton shortcutId="journey" />
          </div>
          <ConstructionJourneyView />
        </section>
      )}

      {/* SECTION 2: EXPENSE NOTEBOOK (ACCOUNTS) */}
      {section === "accounts" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Notebook &amp; Accounts</span>
            <PinToHomeButton shortcutId="accounts" />
          </div>
          {/* Running Total Card */}
          <div className="p-4 rounded-2xl bg-forest text-white shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/80">
                Total Expenses Logged
              </span>
              <div className="text-2xl font-serif font-bold">
                ₹{totalSpent.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-white/80 mt-0.5">
                {expenses.length} entries in your notebook
              </p>
            </div>
            <Wallet size={28} className="text-white/80" />
          </div>

          {/* Quick Expense Entry Form */}
          <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-foreground">
              Add Expense / Contractor Payment
            </h3>

            {showToast && (
              <div className="p-2.5 rounded-xl bg-mint text-forest text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Expense saved to notebook!
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-ink-muted block mb-1">
                  Agency / Contractor / Supplier
                </label>
                <input
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. UltraTech Cement Depot, Electrician Suresh"
                  className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 45000"
                    className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-muted block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as QuickExpense["category"])
                    }
                    className="h-10 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest bg-white"
                  >
                    <option value="Material">Material</option>
                    <option value="Labor">Labour</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Miscellaneous">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-muted block mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. 100 bags 53-grade OPC cement delivered"
                  className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
              >
                + Record Entry in Notebook
              </button>
            </form>
          </div>

          {/* Ledger History */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-ink-muted px-1">Recent Entries</h3>
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-2xl bg-white border border-line shadow-2xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-canvas text-forest uppercase">
                      {exp.category}
                    </span>
                    <span className="text-[10px] text-ink-muted">{exp.date}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {exp.agencyName}
                  </p>
                  {exp.note && (
                    <p className="text-[10px] text-ink-muted">{exp.note}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground">
                    ₹{exp.amount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] block text-forest font-bold">
                    Recorded
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: SITE PROGRESS LOG */}
      {section === "site" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Daily Inspection Log</span>
            <PinToHomeButton shortcutId="site" />
          </div>
          <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                  Current Milestone
                </span>
                <h3 className="text-sm font-bold text-foreground mt-1">
                  Step 18: Roof Slab Curing
                </h3>
              </div>
              <Clock size={20} className="text-amber-600" />
            </div>
            <p className="text-xs text-ink-muted">
              Pond curing with 3 inches of standing water for 21 days. Day 9 of 21.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-ink-muted px-1">
              Daily Inspection Checklist
            </h3>
            <div className="p-3.5 rounded-2xl bg-white border border-line text-xs space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-forest focus:ring-forest"
                />
                <span>Water bunds (kiaris) fully filled with no leakage</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-forest focus:ring-forest"
                />
                <span>Shuttering prop verticality checked in ground floor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-forest focus:ring-forest" />
                <span>Ceiling conduit line continuity tested before wall chasing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-forest focus:ring-forest" />
                <span>Next cement &amp; sand batch delivery confirmed</span>
              </label>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: MATERIAL RATES & ESTIMATOR */}
      {section === "rates" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Market Rates</span>
            <PinToHomeButton shortcutId="rates" />
          </div>
          <div className="p-4 rounded-2xl bg-champagne/60 border border-amber-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                Daily Mandi Rates
              </span>
              <span className="text-[10px] text-amber-800">Indore Market Today</span>
            </div>
            <p className="text-xs text-amber-950">
              Verified rates from authorized dealers in Loha Mandi and Dewas Naka.
            </p>
          </div>

          {/* Rates Table */}
          <div className="space-y-2">
            {DAILY_MATERIAL_RATES.map((rate) => (
              <div
                key={rate.id}
                className="p-3 rounded-2xl bg-white border border-line shadow-2xs flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-foreground">{rate.name}</p>
                  <p className="text-[10px] text-ink-muted">{rate.brandOrType}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-forest">₹{rate.currentRate}</span>
                  <span className="text-[9px] block text-ink-muted">{rate.unitShort}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Builtup Cost Calculator */}
          <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-forest" />
              <h3 className="text-xs font-bold text-foreground">
                Estimated Construction Cost
              </h3>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-muted">Built-up Area:</span>
                <strong className="text-foreground">{builtupSqft} sq. ft.</strong>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={builtupSqft}
                onChange={(e) => setBuiltupSqft(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-canvas text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-muted">Standard Finish (~₹1,750/sqft):</span>
                <strong>₹{(builtupSqft * 1750).toLocaleString("en-IN")}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Premium Finish (~₹2,200/sqft):</span>
                <strong className="text-forest">
                  ₹{(builtupSqft * 2200).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function ConstructionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-ink-muted">
          Loading Construction Hub...
        </div>
      }
    >
      <ConstructionContent />
    </Suspense>
  );
}

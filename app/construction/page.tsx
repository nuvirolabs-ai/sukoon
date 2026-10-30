"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  Folder,
  FolderOpen,
  Hammer,
  HardHat,
  Layers,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { ConstructionJourneyView } from "@/components/ConstructionJourneyView";
import { PinToHomeButton } from "@/components/PinToHomeButton";
import { useSelectedCity, INDIAN_CITIES } from "@/lib/city";

type ConstructionSection = "journey" | "site" | "accounts" | "rates";

// 4 Main Icons matching Home Screen, Buy/Sell, Vault & Insights clean aesthetic
const CONSTRUCTION_FEATURES = [
  {
    id: "journey" as const,
    title: "Build journey",
    subtitle: "28 Steps & Roadmap",
    color: "#B26315",
    icon: function BuildJourneyIcon() {
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
          <circle cx="12" cy="12" r="3" />
          <circle cx="28" cy="20" r="3" />
          <circle cx="14" cy="28" r="3" />
          <path d="M14 14l12 4M26 22l-10 4" strokeDasharray="2 2" />
        </svg>
      );
    },
  },
  {
    id: "site" as const,
    title: "Site visit minutes",
    subtitle: "Notes for Architect & Team",
    color: "#1E57A4",
    icon: function SiteMinutesIcon() {
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
          <rect height="26" rx="3" width="22" x="9" y="7" />
          <path d="M14 13h12M14 18h12M14 23h8" />
          <circle cx="26" cy="27" r="4.5" />
          <path d="M26 25v4M24 27h4" />
        </svg>
      );
    },
  },
  {
    id: "accounts" as const,
    title: "Expenses notebook",
    subtitle: "Smart Material Folders",
    color: "#1E5637",
    icon: function ExpensesNotebookIcon() {
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
          <path d="M7 11a3 3 0 0 1 3-3h6l3 3h11a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V11z" />
          <path d="M7 15h26" />
        </svg>
      );
    },
  },
  {
    id: "rates" as const,
    title: "Material rates",
    subtitle: "Daily Mandi & City Rates",
    color: "#553C9A",
    icon: function MaterialRatesIcon() {
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
          <path d="M6 32h28M8 26l7-10 6 6 10-12" />
          <path d="M25 10h6v6" />
        </svg>
      );
    },
  },
];

// ==========================================
// EXPENSE SMART FOLDER CATEGORIES & TYPES
// ==========================================
export type SmartFolderCategory =
  | "Steel"
  | "Iron"
  | "Cement"
  | "Pipe"
  | "Sand"
  | "Stone Chips"
  | "Labour"
  | "Miscellaneous";

export interface ExpenseRecord {
  id: string;
  category: SmartFolderCategory;
  agencyName: string;
  amount: number;
  date: string;
  note?: string;
}

const INITIAL_SMART_EXPENSES: ExpenseRecord[] = [
  {
    id: "exp-01",
    category: "Steel",
    agencyName: "Sharma Steel Traders (Loha Mandi)",
    amount: 320000,
    date: "2026-10-24",
    note: "4.5 MT Tata Tiscon Fe 550D for 1st Floor Roof Slab",
  },
  {
    id: "exp-02",
    category: "Steel",
    agencyName: "Moira TMT Depot",
    amount: 165000,
    date: "2026-10-12",
    note: "2.8 MT 16mm & 20mm column reinforcement bars",
  },
  {
    id: "exp-03",
    category: "Iron",
    agencyName: "Gupta Metal Fabrication Works",
    amount: 78000,
    date: "2026-10-18",
    note: "MS window safety grills and staircase railing frame fabrication",
  },
  {
    id: "exp-04",
    category: "Cement",
    agencyName: "UltraTech Cement Depot (Dewas Naka)",
    amount: 145000,
    date: "2026-10-22",
    note: "380 Bags UltraTech Super PPC for columns & beams",
  },
  {
    id: "exp-05",
    category: "Cement",
    agencyName: "Ambuja Kawach Building Store",
    amount: 65000,
    date: "2026-10-08",
    note: "170 Bags Ambuja Kawach Water-Shield Cement for basement",
  },
  {
    id: "exp-06",
    category: "Pipe",
    agencyName: "Supreme & Astral Plumbing World",
    amount: 92000,
    date: "2026-10-20",
    note: "1-inch CPVC hot/cold lines & 4-inch SWR drainage pipe lot",
  },
  {
    id: "exp-07",
    category: "Sand",
    agencyName: "Khandelwal Sand Suppliers",
    amount: 115000,
    date: "2026-10-15",
    note: "3 Dumpers Narmada double-screened river sand",
  },
  {
    id: "exp-08",
    category: "Sand",
    agencyName: "Rau Quarry M-Sand Unit",
    amount: 50000,
    date: "2026-10-05",
    note: "2 Trucks plaster-grade manufactured M-Sand",
  },
  {
    id: "exp-09",
    category: "Stone Chips",
    agencyName: "Bypass Stone Crushers Hub",
    amount: 120000,
    date: "2026-10-14",
    note: "20mm crushed basalt aggregate (Gitti) for roof slab mix",
  },
  {
    id: "exp-10",
    category: "Labour",
    agencyName: "Mukesh Civil Construction Contractor",
    amount: 280000,
    date: "2026-10-25",
    note: "Slab centering, shuttering props & bar-bending contract payment",
  },
  {
    id: "exp-11",
    category: "Labour",
    agencyName: "Shree Ram Masonry Gang",
    amount: 110000,
    date: "2026-10-10",
    note: "Plinth brickwork & footing casting labor wages",
  },
  {
    id: "exp-12",
    category: "Miscellaneous",
    agencyName: "City Tool & Mixer Machine Rental",
    amount: 35000,
    date: "2026-10-19",
    note: "Needle vibrator & diesel concrete mixer monthly rent",
  },
  {
    id: "exp-13",
    category: "Miscellaneous",
    agencyName: "Patidar Electrical Hardware",
    amount: 30000,
    date: "2026-10-09",
    note: "Water ponding curing submersible pump & PVC garden hose",
  },
];

const FOLDERS_CONFIG: {
  key: SmartFolderCategory;
  name: string;
  color: string;
  iconBg: string;
}[] = [
  { key: "Steel", name: "Steel & TMT", color: "#1E57A4", iconBg: "bg-blue-50 text-blue-700" },
  { key: "Iron", name: "Iron & Metal", color: "#475569", iconBg: "bg-slate-100 text-slate-700" },
  { key: "Cement", name: "Cement", color: "#B26315", iconBg: "bg-amber-50 text-amber-800" },
  { key: "Pipe", name: "Pipe & Plumbing", color: "#0D9488", iconBg: "bg-teal-50 text-teal-700" },
  { key: "Sand", name: "Sand (River & M-Sand)", color: "#D97706", iconBg: "bg-orange-50 text-orange-700" },
  { key: "Stone Chips", name: "Stone Chips (Gitti)", color: "#52525B", iconBg: "bg-zinc-100 text-zinc-700" },
  { key: "Labour", name: "Labour & Contractor", color: "#1E5637", iconBg: "bg-emerald-50 text-emerald-800" },
  { key: "Miscellaneous", name: "Miscellaneous / Other", color: "#7C3AED", iconBg: "bg-purple-50 text-purple-700" },
];

// ==========================================
// SITE VISIT MINUTES TYPES
// ==========================================
export interface SiteMinuteItem {
  id: string;
  title: string;
  stakeholder: "Architect" | "Interior" | "Civil Contractor" | "Electrician" | "Plumber" | "Self";
  priority: "High" | "Normal";
  dueDate?: string;
  isDone: boolean;
  notes?: string;
  createdAt: string;
}

const INITIAL_SITE_MINUTES: SiteMinuteItem[] = [
  {
    id: "min-01",
    title: "Confirm staircase riser height (6 inch vs 6.5 inch) and landing window clearance",
    stakeholder: "Architect",
    priority: "High",
    dueDate: "2026-11-03",
    isDone: false,
    createdAt: "2026-10-30",
  },
  {
    id: "min-02",
    title: "Verify kitchen island electrical conduit placement and hob exhaust duct cutout",
    stakeholder: "Interior",
    priority: "High",
    dueDate: "2026-11-05",
    isDone: false,
    createdAt: "2026-10-30",
  },
  {
    id: "min-03",
    title: "Maintain 3-inch standing water in terrace slab kiaris for 14 continuous days",
    stakeholder: "Civil Contractor",
    priority: "High",
    dueDate: "2026-11-08",
    isDone: true,
    createdAt: "2026-10-28",
  },
  {
    id: "min-04",
    title: "Sunken slab core cuts for master bathroom drainage to be inspected before chemical coat",
    stakeholder: "Plumber",
    priority: "High",
    dueDate: "2026-11-04",
    isDone: false,
    createdAt: "2026-10-29",
  },
  {
    id: "min-05",
    title: "Finalize living room false ceiling cove drop level (12 vs 15 inches)",
    stakeholder: "Interior",
    priority: "Normal",
    dueDate: "2026-11-07",
    isDone: false,
    createdAt: "2026-10-27",
  },
  {
    id: "min-06",
    title: "Mark compound boundary wall gate pillar footing alignment with surveyor najri map",
    stakeholder: "Architect",
    priority: "Normal",
    dueDate: "2026-11-09",
    isDone: false,
    createdAt: "2026-10-26",
  },
];

// ==========================================
// MATERIAL RATES SPECIFICATIONS & CITY MULTIPLIERS
// ==========================================
interface MaterialItemSpec {
  id: string;
  name: string;
  brandOrType: string;
  category: "Steel & Iron" | "Cement" | "Sand" | "Stone Chips" | "Bricks & Blocks" | "Pipes";
  unit: string;
  baseRateIndore: number;
  marketLocation: string;
  trend: "up" | "down" | "stable";
  change: string;
}

const ALL_MATERIAL_SPECS: MaterialItemSpec[] = [
  // Steel & Iron
  {
    id: "mat-s1",
    name: "TMT Steel Bars (Fe 550D)",
    brandOrType: "Tata Tiscon / Kamdhenu Fe 550D (12mm)",
    category: "Steel & Iron",
    unit: "per Metric Ton",
    baseRateIndore: 56800,
    marketLocation: "Loha Mandi, Indore",
    trend: "up",
    change: "+₹800",
  },
  {
    id: "mat-s2",
    name: "TMT Steel Bars (Fe 500D)",
    brandOrType: "Moira / Prime Gold Commercial Fe 500D",
    category: "Steel & Iron",
    unit: "per Metric Ton",
    baseRateIndore: 54200,
    marketLocation: "Loha Mandi, Indore",
    trend: "stable",
    change: "₹0",
  },
  {
    id: "mat-s3",
    name: "Binding Wire (18 Gauge)",
    brandOrType: "Annealed Shuttering Wire",
    category: "Steel & Iron",
    unit: "per Kg",
    baseRateIndore: 72,
    marketLocation: "Loha Mandi, Indore",
    trend: "up",
    change: "+₹2",
  },
  // Cement
  {
    id: "mat-c1",
    name: "UltraTech Super Cement",
    brandOrType: "PPC Grade 53 High Strength",
    category: "Cement",
    unit: "per 50kg Bag",
    baseRateIndore: 385,
    marketLocation: "Dewas Naka, Indore",
    trend: "up",
    change: "+₹5",
  },
  {
    id: "mat-c2",
    name: "Ambuja Kawach Cement",
    brandOrType: "Water-Shield Water-Resistant PPC",
    category: "Cement",
    unit: "per 50kg Bag",
    baseRateIndore: 375,
    marketLocation: "Dewas Naka, Indore",
    trend: "stable",
    change: "₹0",
  },
  {
    id: "mat-c3",
    name: "Birla White Cement",
    brandOrType: "Super White Fine Plaster Grade",
    category: "Cement",
    unit: "per 50kg Bag",
    baseRateIndore: 1050,
    marketLocation: "Dewas Naka, Indore",
    trend: "stable",
    change: "₹0",
  },
  // Sand
  {
    id: "mat-sa1",
    name: "Narmada River Sand",
    brandOrType: "Screened Natural Coarse Sand",
    category: "Sand",
    unit: "per CFT (cu.ft)",
    baseRateIndore: 48,
    marketLocation: "Nemawar Road Depot, Indore",
    trend: "up",
    change: "+₹2",
  },
  {
    id: "mat-sa2",
    name: "Crushed M-Sand (Manufactured)",
    brandOrType: "Double Washed Stone Dust Plaster Sand",
    category: "Sand",
    unit: "per CFT (cu.ft)",
    baseRateIndore: 34,
    marketLocation: "Rau Quarry Depot, Indore",
    trend: "stable",
    change: "₹0",
  },
  // Stone Chips
  {
    id: "mat-sc1",
    name: "Black Stone Chips (Gitti 20mm)",
    brandOrType: "Crushed Basalt Blue Metal (Roof Slab)",
    category: "Stone Chips",
    unit: "per CFT (cu.ft)",
    baseRateIndore: 38,
    marketLocation: "Bypass Stone Crushers, Indore",
    trend: "down",
    change: "-₹1",
  },
  {
    id: "mat-sc2",
    name: "Black Metal Aggregate (10mm)",
    brandOrType: "Fine Concrete Chipping Metal",
    category: "Stone Chips",
    unit: "per CFT (cu.ft)",
    baseRateIndore: 35,
    marketLocation: "Bypass Stone Crushers, Indore",
    trend: "stable",
    change: "₹0",
  },
  // Bricks & Blocks
  {
    id: "mat-b1",
    name: "Red Clay Kiln Bricks (Class 1)",
    brandOrType: "9\" x 4.5\" x 3\" Oven Baked Clay Brick",
    category: "Bricks & Blocks",
    unit: "per 1,000 Pcs",
    baseRateIndore: 8500,
    marketLocation: "Sanwer Road Bhattas, Indore",
    trend: "up",
    change: "+₹250",
  },
  {
    id: "mat-b2",
    name: "AAC Lightweight Blocks",
    brandOrType: "Autoclaved Aerated Concrete (4x8x24 inch)",
    category: "Bricks & Blocks",
    unit: "per Cubic Meter",
    baseRateIndore: 3400,
    marketLocation: "Pithampur Depot, Indore",
    trend: "stable",
    change: "₹0",
  },
  // Pipes
  {
    id: "mat-p1",
    name: "Astral CPVC Water Pipe (1 inch)",
    brandOrType: "SDR 11 Hot & Cold Plumbing (3m)",
    category: "Pipes",
    unit: "per 10-ft Pipe",
    baseRateIndore: 420,
    marketLocation: "Siyaganj Hardware, Indore",
    trend: "stable",
    change: "₹0",
  },
  {
    id: "mat-p2",
    name: "Supreme SWR Drainage Pipe (4 inch)",
    brandOrType: "Ring-Fit PVC Sewer Line (10-ft)",
    category: "Pipes",
    unit: "per 10-ft Pipe",
    baseRateIndore: 580,
    marketLocation: "Siyaganj Hardware, Indore",
    trend: "up",
    change: "+₹15",
  },
];

const CITY_RATE_MULTIPLIERS: Record<string, number> = {
  Indore: 1.0,
  Bhopal: 0.98,
  Ujjain: 0.99,
  Mumbai: 1.14,
  "Delhi-NCR": 1.05,
  Bengaluru: 1.11,
  Pune: 1.08,
  Hyderabad: 1.02,
  Chennai: 1.09,
  Kolkata: 0.97,
  Ahmedabad: 1.01,
  Jaipur: 0.98,
};

function ConstructionContent() {
  const searchParams = useSearchParams();
  const rawSection = searchParams.get("section") as ConstructionSection;
  const initialSection: ConstructionSection =
    rawSection && ["journey", "site", "accounts", "rates"].includes(rawSection)
      ? rawSection
      : "journey";

  const [section, setSection] = useState<ConstructionSection>(initialSection);
  const [toastMsg, setToastMsg] = useState("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Synchronized selected city across the entire application
  const { city: appSelectedCity, changeCity: setAppSelectedCity } = useSelectedCity();

  // ==========================================
  // EXPENSES NOTEBOOK (SMART FOLDERS) STATE
  // ==========================================
  const [expensesList, setExpensesList] = useState<ExpenseRecord[]>(() => {
    if (typeof window === "undefined") return INITIAL_SMART_EXPENSES;
    try {
      const saved = localStorage.getItem("sukoon_smart_expenses_v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SMART_EXPENSES;
  });

  const [activeFolderKey, setActiveFolderKey] = useState<SmartFolderCategory | null>(null);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [expenseAgency, setExpenseAgency] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<SmartFolderCategory>("Steel");
  const [expenseNote, setExpenseNote] = useState("");

  const totalSpentAll = useMemo(() => {
    return expensesList.reduce((sum, item) => sum + item.amount, 0);
  }, [expensesList]);

  const folderCategoryTotals = useMemo(() => {
    const map: Record<SmartFolderCategory, { total: number; count: number }> = {
      Steel: { total: 0, count: 0 },
      Iron: { total: 0, count: 0 },
      Cement: { total: 0, count: 0 },
      Pipe: { total: 0, count: 0 },
      Sand: { total: 0, count: 0 },
      "Stone Chips": { total: 0, count: 0 },
      Labour: { total: 0, count: 0 },
      Miscellaneous: { total: 0, count: 0 },
    };
    expensesList.forEach((item) => {
      if (map[item.category]) {
        map[item.category].total += item.amount;
        map[item.category].count += 1;
      }
    });
    return map;
  }, [expensesList]);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(expenseAmount.replace(/[^0-9]/g, ""));
    if (!expenseAgency.trim() || !val || isNaN(val)) return;

    const newRec: ExpenseRecord = {
      id: "exp-" + Date.now(),
      category: expenseCategory,
      agencyName: expenseAgency.trim(),
      amount: val,
      date: new Date().toISOString().split("T")[0],
      note: expenseNote.trim() || undefined,
    };

    const updated = [newRec, ...expensesList];
    setExpensesList(updated);
    try {
      localStorage.setItem("sukoon_smart_expenses_v2", JSON.stringify(updated));
    } catch {}

    triggerToast(`✓ Added ₹${val.toLocaleString("en-IN")} in ${expenseCategory} folder!`);
    setExpenseAgency("");
    setExpenseAmount("");
    setExpenseNote("");
    setAddExpenseModalOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expensesList.filter((e) => e.id !== id);
    setExpensesList(updated);
    try {
      localStorage.setItem("sukoon_smart_expenses_v2", JSON.stringify(updated));
    } catch {}
    triggerToast("Expense entry deleted.");
  };

  // ==========================================
  // SITE VISIT MINUTES STATE
  // ==========================================
  const [siteMinutes, setSiteMinutes] = useState<SiteMinuteItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_SITE_MINUTES;
    try {
      const saved = localStorage.getItem("sukoon_site_visit_minutes_v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SITE_MINUTES;
  });

  const [minuteRoleFilter, setMinuteRoleFilter] = useState<string>("All");
  const [newMinuteTitle, setNewMinuteTitle] = useState("");
  const [newMinuteRole, setNewMinuteRole] = useState<SiteMinuteItem["stakeholder"]>("Architect");
  const [newMinuteDueDate, setNewMinuteDueDate] = useState("2026-11-05");
  const [newMinutePriority, setNewMinutePriority] = useState<SiteMinuteItem["priority"]>("High");
  const [addMinuteModalOpen, setAddMinuteModalOpen] = useState(false);
  const [shareMinutesModalOpen, setShareMinutesModalOpen] = useState(false);

  const toggleMinuteDone = (id: string) => {
    const updated = siteMinutes.map((m) =>
      m.id === id ? { ...m, isDone: !m.isDone } : m
    );
    setSiteMinutes(updated);
    try {
      localStorage.setItem("sukoon_site_visit_minutes_v2", JSON.stringify(updated));
    } catch {}
  };

  const handleAddMinute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMinuteTitle.trim()) return;

    const newItem: SiteMinuteItem = {
      id: "min-" + Date.now(),
      title: newMinuteTitle.trim(),
      stakeholder: newMinuteRole,
      priority: newMinutePriority,
      dueDate: newMinuteDueDate,
      isDone: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [newItem, ...siteMinutes];
    setSiteMinutes(updated);
    try {
      localStorage.setItem("sukoon_site_visit_minutes_v2", JSON.stringify(updated));
    } catch {}

    setNewMinuteTitle("");
    setAddMinuteModalOpen(false);
    triggerToast(`✓ Added to-do for ${newMinuteRole}!`);
  };

  const filteredSiteMinutes = useMemo(() => {
    return siteMinutes.filter((m) => {
      if (minuteRoleFilter === "All") return true;
      if (minuteRoleFilter === "Pending") return !m.isDone;
      if (minuteRoleFilter === "Done") return m.isDone;
      return m.stakeholder === minuteRoleFilter;
    });
  }, [siteMinutes, minuteRoleFilter]);

  const shareableMinutesText = useMemo(() => {
    const openItems = siteMinutes.filter((m) => !m.isDone);
    const lines = [
      "📋 SITE VISIT MINUTES & ACTION POINTS",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "📍 Site: Super Corridor Plot 108",
      `🗓️ Inspection Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      "",
      "📌 DISCUSSION POINTS & TO-DO FOR ACTION:",
    ];

    if (openItems.length === 0) {
      lines.push("• All site discussion items have been addressed!");
    } else {
      openItems.forEach((item, idx) => {
        lines.push(`${idx + 1}. [${item.stakeholder}] ${item.title}`);
        if (item.dueDate) lines.push(`   Target Due: ${item.dueDate} (${item.priority} Priority)`);
      });
    }

    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("Sent via Sukoon Construction OS: https://sukoonproptech.com/construction?section=site");
    return lines.join("\n");
  }, [siteMinutes]);

  // ==========================================
  // MATERIAL RATES STATE
  // ==========================================
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<string>("All");
  const [estimatorBuiltupSqft, setEstimatorBuiltupSqft] = useState<number>(1500);

  const cityMultiplier = CITY_RATE_MULTIPLIERS[appSelectedCity] || 1.0;

  const dynamicMaterialRates = useMemo(() => {
    return ALL_MATERIAL_SPECS.map((spec) => {
      const adjusted = spec.baseRateIndore * cityMultiplier;
      const finalPrice =
        adjusted > 1000 ? Math.round(adjusted / 10) * 10 : Math.round(adjusted * 10) / 10;
      return {
        ...spec,
        currentRate: finalPrice,
      };
    });
  }, [cityMultiplier]);

  const filteredMaterials = useMemo(() => {
    if (materialCategoryFilter === "All") return dynamicMaterialRates;
    return dynamicMaterialRates.filter((m) => m.category === materialCategoryFilter);
  }, [dynamicMaterialRates, materialCategoryFilter]);

  // Estimated requirements for builtup area
  const estimatedCostData = useMemo(() => {
    // Thumb-rules for typical Indian RCC residential build per sq.ft:
    // Cement: ~0.4 bags/sq.ft
    // Steel: ~3.8 kg/sq.ft = ~0.0038 MT/sq.ft
    // Sand: ~1.8 CFT/sq.ft
    // Aggregate: ~1.3 CFT/sq.ft
    const cementBags = Math.round(estimatorBuiltupSqft * 0.4);
    const steelTons = Math.round(estimatorBuiltupSqft * 0.0038 * 10) / 10;
    const sandCft = Math.round(estimatorBuiltupSqft * 1.8);
    const aggCft = Math.round(estimatorBuiltupSqft * 1.3);

    const cementRate = (dynamicMaterialRates.find((m) => m.category === "Cement")?.currentRate || 385);
    const steelRate = (dynamicMaterialRates.find((m) => m.id === "mat-s1")?.currentRate || 56800);
    const sandRate = (dynamicMaterialRates.find((m) => m.id === "mat-sa1")?.currentRate || 48);
    const aggRate = (dynamicMaterialRates.find((m) => m.id === "mat-sc1")?.currentRate || 38);

    const totalEst =
      cementBags * cementRate +
      steelTons * steelRate +
      sandCft * sandRate +
      aggCft * aggRate;

    return {
      cementBags,
      steelTons,
      sandCft,
      aggCft,
      totalEst: Math.round(totalEst),
    };
  }, [estimatorBuiltupSqft, dynamicMaterialRates]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen px-4 pt-3 pb-28 text-foreground">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1B2922] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMsg}</span>
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
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            Sukoon Construction
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#1B2922]">Construction Hub</h1>
        <p className="text-xs text-ink-muted mt-1">
          Milestones, smart expense folders, site minutes &amp; material rates.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 4 MAIN FEATURE ICONS - MATCHING HOME PAGE ICON STYLE & DESIGN LANGUAGE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-y-7 gap-x-5 mb-8 px-2 py-1">
        {CONSTRUCTION_FEATURES.map((item) => {
          const IconComp = item.icon;
          const isSelected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                if (item.id !== "accounts") setActiveFolderKey(null);
              }}
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
      {/* 1. BUILD JOURNEY SECTION */}
      {/* ========================================================================= */}
      {section === "journey" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Build Journey (28 Steps)</h2>
              <p className="text-[11px] text-ink-muted">
                Minimal interactive roadmap. Tap any step to expand details.
              </p>
            </div>
            <PinToHomeButton shortcutId="journey" />
          </div>

          <ConstructionJourneyView />
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. EXPENSES NOTEBOOK (SMART FOLDERS) */}
      {/* ========================================================================= */}
      {section === "accounts" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Expenses Notebook</h2>
              <p className="text-[11px] text-ink-muted">
                Smart folders by construction material with consolidated totals.
              </p>
            </div>
            <PinToHomeButton shortcutId="accounts" />
          </div>

          {/* Overall Expenses Summary Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1E5637] to-[#133A24] text-white shadow-md space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Total Construction Spend
                </span>
                <h3 className="text-2xl font-black mt-0.5 text-white">
                  ₹{totalSpentAll.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-white/75 mt-0.5">
                  Super Corridor Plot 108 • 8 Active Material Folders
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExpenseCategory(activeFolderKey || "Steel");
                  setAddExpenseModalOpen(true);
                }}
                className="tap-scale px-3 py-1.5 rounded-xl bg-white text-forest text-xs font-bold shadow-2xs hover:bg-white/90 inline-flex items-center gap-1"
              >
                <Plus size={13} strokeWidth={3} /> Record Entry
              </button>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
              <span>Budget: ₹45.00 Lakh</span>
              <span>Remaining: ₹{(4500000 - totalSpentAll).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* IF INSIDE A SPECIFIC SMART FOLDER */}
          {activeFolderKey ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Back to all folders strip */}
              <div className="flex items-center justify-between bg-sand/40 border border-line p-3 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveFolderKey(null)}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline"
                >
                  <ArrowLeft size={14} /> Back to All Folders
                </button>
                <span className="text-xs font-bold text-[#1B2922]">
                  📂 {activeFolderKey} Folder
                </span>
              </div>

              {/* Folder Header */}
              <div className="bg-white border border-line rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    Consolidated {activeFolderKey} Spend
                  </span>
                  <h3 className="text-xl font-bold text-[#1B2922] mt-0.5">
                    ₹{(folderCategoryTotals[activeFolderKey]?.total || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    {folderCategoryTotals[activeFolderKey]?.count || 0} bills / transactions recorded
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setExpenseCategory(activeFolderKey);
                    setAddExpenseModalOpen(true);
                  }}
                  className="tap-scale px-3 py-2 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-90 inline-flex items-center gap-1"
                >
                  <Plus size={13} strokeWidth={3} /> Add {activeFolderKey}
                </button>
              </div>

              {/* List of entries inside this category folder */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#1B2922] px-1">
                  Transactions in {activeFolderKey}
                </h4>

                {expensesList.filter((e) => e.category === activeFolderKey).length === 0 ? (
                  <div className="p-6 text-center bg-sand/20 rounded-2xl border border-dashed border-line">
                    <p className="text-xs text-ink-muted font-bold">No entries in this folder yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseCategory(activeFolderKey);
                        setAddExpenseModalOpen(true);
                      }}
                      className="mt-2 text-xs font-bold text-forest underline"
                    >
                      + Add first entry
                    </button>
                  </div>
                ) : (
                  expensesList
                    .filter((e) => e.category === activeFolderKey)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-line rounded-2xl p-3.5 shadow-2xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-[#1B2922]">{item.agencyName}</h5>
                            <span className="text-[10px] text-ink-muted">{item.date}</span>
                          </div>
                          {item.note && (
                            <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                              {item.note}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-[#1B2922] block">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(item.id)}
                            className="text-[10px] text-rose-600 hover:underline inline-flex items-center gap-0.5 mt-1"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            /* SMART FOLDERS GRID VIEW (8 CATEGORIES) */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#1B2922]">Smart Construction Folders</span>
                <span className="text-[11px] text-ink-muted">Tap folder to open breakdown</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {FOLDERS_CONFIG.map((folder) => {
                  const stat = folderCategoryTotals[folder.key] || { total: 0, count: 0 };
                  return (
                    <button
                      key={folder.key}
                      type="button"
                      onClick={() => setActiveFolderKey(folder.key)}
                      className="tap-scale group bg-white border border-line hover:border-forest/50 rounded-2xl p-3.5 text-left shadow-2xs transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${folder.iconBg}`}
                        >
                          <Folder size={18} />
                        </div>
                        <span className="text-[10px] font-semibold text-ink-muted">
                          {stat.count} {stat.count === 1 ? "entry" : "entries"}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#1B2922] group-hover:text-forest transition leading-tight">
                        {folder.name}
                      </h4>

                      <p className="text-sm font-black text-[#1B2922] mt-1">
                        ₹{(stat.total / 100000).toFixed(2)} Lakh
                      </p>
                      <span className="text-[10px] text-ink-muted">till date</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Expense Modal */}
          {addExpenseModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl relative space-y-3.5">
                <button
                  type="button"
                  onClick={() => setAddExpenseModalOpen(false)}
                  className="absolute top-4 right-4 text-ink-muted hover:text-foreground p-1 rounded-full bg-sand/60"
                >
                  <X size={18} />
                </button>

                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    Smart Expense Ledger
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#1B2922] mt-1">
                    Record Construction Expense
                  </h3>
                </div>

                <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Material Folder / Category
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as SmartFolderCategory)}
                      className="w-full bg-sand/30 border border-line rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-forest"
                    >
                      {FOLDERS_CONFIG.map((f) => (
                        <option key={f.key} value={f.key}>
                          📂 {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Agency / Supplier / Contractor
                    </label>
                    <input
                      type="text"
                      required
                      value={expenseAgency}
                      onChange={(e) => setExpenseAgency(e.target.value)}
                      placeholder="e.g. UltraTech Depot Dewas Naka, Sharma Steel"
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Amount in Rupees (₹)
                    </label>
                    <input
                      type="text"
                      required
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="e.g. 85000"
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Note / Quantity / Specifications (Optional)
                    </label>
                    <input
                      type="text"
                      value={expenseNote}
                      onChange={(e) => setExpenseNote(e.target.value)}
                      placeholder="e.g. 100 bags PPC 53 cement for 1st floor roof"
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAddExpenseModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-line text-xs font-bold text-ink-muted hover:bg-sand/40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
                    >
                      Save to Folder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. SITE VISIT MINUTES */}
      {/* ========================================================================= */}
      {section === "site" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Site Visit Minutes</h2>
              <p className="text-[11px] text-ink-muted">
                To-do list for discussion points with your architect &amp; interior team.
              </p>
            </div>
            <PinToHomeButton shortcutId="site" />
          </div>

          {/* Header Action Strip */}
          <div className="bg-sand/40 border border-line rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-emerald-100 px-2 py-0.5 rounded-full">
                Active Site: Plot 108
              </span>
              <h3 className="text-xs font-bold text-[#1B2922] mt-1">
                {siteMinutes.filter((m) => !m.isDone).length} Open Action Points
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShareMinutesModalOpen(true)}
                className="tap-scale px-3 py-1.5 rounded-xl bg-white border border-line text-xs font-bold text-forest shadow-2xs hover:bg-forest/5 inline-flex items-center gap-1"
              >
                <Share2 size={13} /> Share with Team
              </button>

              <button
                type="button"
                onClick={() => setAddMinuteModalOpen(true)}
                className="tap-scale px-3 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-90 inline-flex items-center gap-1"
              >
                <Plus size={13} strokeWidth={3} /> Add Point
              </button>
            </div>
          </div>

          {/* Stakeholder Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {["All", "Pending", "Architect", "Interior", "Civil Contractor", "Plumber", "Done"].map((tab) => {
              const isSelected = minuteRoleFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMinuteRoleFilter(tab)}
                  className={`tap-scale px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    isSelected
                      ? "bg-[#1E57A4] text-white shadow-2xs"
                      : "bg-white text-ink-muted border border-line hover:border-[#1E57A4]/40"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Minutes List */}
          <div className="space-y-2.5">
            {filteredSiteMinutes.length === 0 ? (
              <div className="p-6 text-center bg-sand/20 rounded-2xl border border-dashed border-line">
                <ClipboardList size={26} className="mx-auto text-ink-muted mb-1.5 opacity-60" />
                <p className="text-xs font-bold text-ink-muted">No discussion points matching this filter.</p>
              </div>
            ) : (
              filteredSiteMinutes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleMinuteDone(item.id)}
                  className={`cursor-pointer rounded-2xl p-3.5 border transition-all select-none space-y-1.5 ${
                    item.isDone
                      ? "bg-amber-50/20 border-amber-300/80"
                      : "bg-white border-line hover:border-[#1E57A4]/40 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 border transition-all ${
                        item.isDone
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "border-line bg-sand/40 text-transparent hover:border-forest"
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                            item.stakeholder === "Architect"
                              ? "bg-blue-100 text-blue-800"
                              : item.stakeholder === "Interior"
                              ? "bg-purple-100 text-purple-800"
                              : item.stakeholder === "Civil Contractor"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-100 text-zinc-800"
                          }`}
                        >
                          @{item.stakeholder}
                        </span>
                        {item.priority === "High" && !item.isDone && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-md">
                            Priority Action
                          </span>
                        )}
                        {item.dueDate && (
                          <span className="text-[10px] text-ink-muted flex items-center gap-0.5">
                            <Calendar size={10} /> Target: {item.dueDate}
                          </span>
                        )}
                        {item.isDone && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">
                            ✓ Resolved
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs mt-1 leading-snug font-semibold ${
                          item.isDone ? "text-amber-600" : "text-[#1B2922]"
                        }`}
                      >
                        {item.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Minute Modal */}
          {addMinuteModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl relative space-y-3.5">
                <button
                  type="button"
                  onClick={() => setAddMinuteModalOpen(false)}
                  className="absolute top-4 right-4 text-ink-muted hover:text-foreground p-1 rounded-full bg-sand/60"
                >
                  <X size={18} />
                </button>

                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                    Site Visit Action Point
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#1B2922] mt-1">
                    Add Observation / To-Do
                  </h3>
                </div>

                <form onSubmit={handleAddMinute} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Observation / Discussion Point
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newMinuteTitle}
                      onChange={(e) => setNewMinuteTitle(e.target.value)}
                      placeholder="e.g. Check sunken slab waterproofing chemical application before laying pipe"
                      className="w-full bg-white border border-line rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#1E57A4]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Stakeholder
                      </label>
                      <select
                        value={newMinuteRole}
                        onChange={(e) =>
                          setNewMinuteRole(e.target.value as SiteMinuteItem["stakeholder"])
                        }
                        className="w-full bg-sand/30 border border-line rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Architect">Architect</option>
                        <option value="Interior">Interior Designer</option>
                        <option value="Civil Contractor">Civil Contractor</option>
                        <option value="Electrician">Electrician</option>
                        <option value="Plumber">Plumber</option>
                        <option value="Self">Self / Owner</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Priority
                      </label>
                      <select
                        value={newMinutePriority}
                        onChange={(e) =>
                          setNewMinutePriority(e.target.value as SiteMinuteItem["priority"])
                        }
                        className="w-full bg-sand/30 border border-line rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none"
                      >
                        <option value="High">High Priority</option>
                        <option value="Normal">Normal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Target Due Date
                    </label>
                    <input
                      type="date"
                      value={newMinuteDueDate}
                      onChange={(e) => setNewMinuteDueDate(e.target.value)}
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAddMinuteModalOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-line text-xs font-bold text-ink-muted hover:bg-sand/40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-[#1E57A4] text-white text-xs font-bold shadow-2xs hover:opacity-90"
                    >
                      Add to List
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Share Minutes Modal */}
          {shareMinutesModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl relative space-y-4">
                <button
                  type="button"
                  onClick={() => setShareMinutesModalOpen(false)}
                  className="absolute top-4 right-4 text-ink-muted hover:text-foreground p-1 rounded-full bg-sand/60"
                >
                  <X size={18} />
                </button>

                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                    Team Discussion
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#1B2922] mt-1">
                    Share Site Minutes
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Send open action points directly to your Architect, Interior or Contractor.
                  </p>
                </div>

                <div className="bg-sand/30 border border-line rounded-2xl p-3.5 text-xs font-mono text-[#1B2922] whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {shareableMinutesText}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(shareableMinutesText);
                        triggerToast("✓ Minutes copied to clipboard!");
                      }
                    }}
                    className="tap-scale flex-1 py-2.5 rounded-xl border border-line text-xs font-bold text-forest hover:bg-forest/5 flex items-center justify-center gap-1.5"
                  >
                    <Copy size={14} /> Copy Minutes
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareableMinutesText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-scale flex-1 py-2.5 rounded-xl bg-[#1E57A4] text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <Share2 size={14} /> Send on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. MATERIAL RATES & ESTIMATOR */}
      {/* ========================================================================= */}
      {section === "rates" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Daily Material Rates</h2>
              <p className="text-[11px] text-ink-muted">
                Mandi rates auto-adjusted across major Indian cities.
              </p>
            </div>
            <PinToHomeButton shortcutId="rates" />
          </div>

          {/* City Selection Strip */}
          <div className="bg-sand/40 border border-line rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                <MapPin size={12} className="text-forest" /> Current Market City
              </span>
              <span className="text-[11px] font-bold text-forest">
                {appSelectedCity} Mandi
              </span>
            </div>

            {/* City Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {INDIAN_CITIES.map((c) => {
                const isSelected = appSelectedCity === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAppSelectedCity(c)}
                    className={`tap-scale px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      isSelected
                        ? "bg-[#553C9A] text-white shadow-2xs"
                        : "bg-white text-ink-muted border border-line hover:border-[#553C9A]/40"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Material Category Filter Pills */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1.5 px-1">
              Select Material Category
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                "All",
                "Steel & Iron",
                "Cement",
                "Sand",
                "Stone Chips",
                "Bricks & Blocks",
                "Pipes",
              ].map((cat) => {
                const isSelected = materialCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMaterialCategoryFilter(cat)}
                    className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      isSelected
                        ? "bg-forest text-white shadow-2xs"
                        : "bg-white text-ink-muted border border-line hover:border-forest/40"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rates Table Cards */}
          <div className="space-y-2.5">
            {filteredMaterials.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#553C9A]/40 transition space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#553C9A]/10 text-[#553C9A]">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-[#1B2922] mt-1">{item.name}</h3>
                    <p className="text-[11px] text-ink-muted">{item.brandOrType}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-[#1B2922] block">
                      ₹{item.currentRate.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-ink-muted block">{item.unit}</span>
                    <span
                      className={`text-[10px] font-bold inline-block px-1.5 py-0.2 rounded mt-0.5 ${
                        item.trend === "up"
                          ? "bg-rose-50 text-rose-700"
                          : item.trend === "down"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-sand text-ink-muted"
                      }`}
                    >
                      {item.trend === "up" ? `▲ ${item.change}` : item.trend === "down" ? `▼ ${item.change}` : "━ Stable"}
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-line/50 flex items-center justify-between text-[10px] text-ink-muted">
                  <span>Authorized Depot: {item.marketLocation}</span>
                  <span className="font-semibold text-forest">Verified Today</span>
                </div>
              </div>
            ))}
          </div>

          {/* Material Cost Estimator for Built-up Area */}
          <div className="bg-sand/30 border border-line rounded-3xl p-4 space-y-3 mt-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" /> Material Quantity Estimator
                </h3>
                <p className="text-[10px] text-ink-muted">
                  Approximate consumption for {appSelectedCity} RCC build
                </p>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="100"
                  value={estimatorBuiltupSqft}
                  onChange={(e) => setEstimatorBuiltupSqft(Number(e.target.value) || 1000)}
                  className="w-20 bg-white border border-line rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-forest"
                />
                <span className="text-[10px] font-bold text-ink-muted">sq.ft</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded-xl p-2.5 border border-line">
                <span className="text-[10px] text-ink-muted block">Cement Required</span>
                <strong className="text-forest text-sm">{estimatedCostData.cementBags} Bags</strong>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-line">
                <span className="text-[10px] text-ink-muted block">Steel Required</span>
                <strong className="text-blue-800 text-sm">{estimatedCostData.steelTons} Metric Tons</strong>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-line">
                <span className="text-[10px] text-ink-muted block">Sand (Narmada/M-Sand)</span>
                <strong className="text-amber-800 text-sm">{estimatedCostData.sandCft} CFT</strong>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-line">
                <span className="text-[10px] text-ink-muted block">Stone Chips (20mm)</span>
                <strong className="text-zinc-800 text-sm">{estimatedCostData.aggCft} CFT</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-line/60 flex items-center justify-between">
              <span className="text-[11px] font-bold text-ink-muted">
                Estimated Raw Material Budget ({appSelectedCity}):
              </span>
              <span className="text-sm font-black text-forest">
                ₹{(estimatedCostData.totalEst / 100000).toFixed(2)} Lakh
              </span>
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

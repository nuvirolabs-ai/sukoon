"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Building,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Compass,
  Copy,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  Hammer,
  HardHat,
  Layers,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Ruler,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
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
import {
  AUTHORIZED_DEALERS,
  AUTHORIZED_ARCHITECTS,
  AUTHORIZED_CIVIL_ENGINEERS,
  CONCEPTUAL_PLANS,
  type MaterialDealer as DealerProfile,
  type ArchitectProfile,
  type CivilEngineerProfile,
  type ConceptualPlan,
} from "@/lib/data/construction-hub";

type ConstructionSection =
  | "journey"
  | "site"
  | "accounts"
  | "rates"
  | "dealers"
  | "architects"
  | "engineers"
  | "plans";

// 8 Main Icons matching Home Screen, Buy/Sell, Vault & Insights clean aesthetic
const CONSTRUCTION_FEATURES = [
  {
    id: "journey" as const,
    title: "Build journey",
    subtitle: "28 Steps & Roadmap",
    color: "#1E5637",
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
    color: "#2E7D52",
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
  {
    id: "dealers" as const,
    title: "Dealers",
    subtitle: "Material Suppliers",
    color: "#B26315",
    icon: function DealersIcon() {
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
          <path d="M6 14l14-7 14 7v18H6V14z" />
          <path d="M6 14h28M15 32V20h10v12" />
          <circle cx="20" cy="13" r="2.5" />
        </svg>
      );
    },
  },
  {
    id: "architects" as const,
    title: "Architects",
    subtitle: "COA Listed Architects",
    color: "#0D7490",
    icon: function ArchitectsIcon() {
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
          <circle cx="20" cy="10" r="3" />
          <path d="M18 13l-8 20M22 13l8 20M12 26h16" />
        </svg>
      );
    },
  },
  {
    id: "engineers" as const,
    title: "Civil engineers",
    subtitle: "Structural Consultants",
    color: "#C05621",
    icon: function CivilEngineersIcon() {
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
          <path d="M10 32V12l10-6 10 6v20" />
          <path d="M10 18h20M10 25h20M20 6v26" />
        </svg>
      );
    },
  },
  {
    id: "plans" as const,
    title: "Conceptual Layout plans",
    subtitle: "3D Elevations & Custom",
    color: "#319795",
    icon: function LayoutPlansIcon() {
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
          <rect x="7" y="7" width="26" height="26" rx="2" />
          <path d="M7 19h13v14M20 7v12M20 23h13" />
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
  imageUrl?: string;
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
    rawSection &&
    [
      "journey",
      "site",
      "accounts",
      "rates",
      "dealers",
      "architects",
      "engineers",
      "plans",
    ].includes(rawSection)
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
  const [newMinuteImage, setNewMinuteImage] = useState<string | null>(null);
  const [previewMinuteImage, setPreviewMinuteImage] = useState<string | null>(null);
  const [addMinuteModalOpen, setAddMinuteModalOpen] = useState(false);
  const [shareMinutesModalOpen, setShareMinutesModalOpen] = useState(false);

  const handleMinuteImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewMinuteImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

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
      imageUrl: newMinuteImage || undefined,
      isDone: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [newItem, ...siteMinutes];
    setSiteMinutes(updated);
    try {
      localStorage.setItem("sukoon_site_visit_minutes_v2", JSON.stringify(updated));
    } catch {}

    setNewMinuteTitle("");
    setNewMinuteImage(null);
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

  // ==========================================
  // DEALERS STATE & FILTERS
  // ==========================================
  const [dealerMaterialFilter, setDealerMaterialFilter] = useState<string>("All");

  const filteredDealers = useMemo(() => {
    if (dealerMaterialFilter === "All") return AUTHORIZED_DEALERS;
    return AUTHORIZED_DEALERS.filter(
      (d) =>
        d.categories.some((cat) =>
          cat.toLowerCase().includes(dealerMaterialFilter.toLowerCase())
        ) || d.specialty.toLowerCase().includes(dealerMaterialFilter.toLowerCase())
    );
  }, [dealerMaterialFilter]);

  // ==========================================
  // CONCEPTUAL PLANS STATE & CUSTOM PLAN MODAL
  // ==========================================
  const [planDimensionFilter, setPlanDimensionFilter] = useState<string>("All");
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [customPlanModalOpen, setCustomPlanModalOpen] = useState(false);

  const [customClientName, setCustomClientName] = useState("");
  const [customClientPhone, setCustomClientPhone] = useState("");
  const [customPlotDimensions, setCustomPlotDimensions] = useState("20x50 ft");
  const [customPlotFacing, setCustomPlotFacing] = useState("East");
  const [customConfiguration, setCustomConfiguration] = useState("3 BHK Duplex");
  const [customBudget, setCustomBudget] = useState("₹35 - ₹45 Lakhs");
  const [customNotes, setCustomNotes] = useState("");

  const filteredPlans = useMemo(() => {
    if (planDimensionFilter === "All") return CONCEPTUAL_PLANS;
    return CONCEPTUAL_PLANS.filter((p) =>
      p.dimensions.toLowerCase().includes(planDimensionFilter.toLowerCase().replace("x", "*"))
    );
  }, [planDimensionFilter]);

  const handleCustomPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientName.trim() || !customClientPhone.trim()) return;

    const newRequest = {
      id: "req-" + Date.now(),
      clientName: customClientName.trim(),
      clientPhone: customClientPhone.trim(),
      city: appSelectedCity,
      plotDimensions: customPlotDimensions.trim(),
      facing: customPlotFacing,
      configuration: customConfiguration,
      budget: customBudget,
      notes: customNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(
        localStorage.getItem("sukoon_custom_plan_requests") || "[]"
      );
      localStorage.setItem(
        "sukoon_custom_plan_requests",
        JSON.stringify([newRequest, ...existing])
      );
    } catch {}

    const whatsappMessage = [
      "📐 *NEW CUSTOM ARCHITECTURAL PLAN REQUEST*",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      `👤 *Client Name:* ${customClientName.trim()}`,
      `📞 *Phone/WhatsApp:* ${customClientPhone.trim()}`,
      `📍 *City:* ${appSelectedCity}`,
      `📏 *Plot Dimensions:* ${customPlotDimensions.trim()}`,
      `🧭 *Vastu Facing:* ${customPlotFacing}`,
      `🏡 *Configuration:* ${customConfiguration}`,
      `💰 *Estimated Budget:* ${customBudget}`,
      customNotes.trim() ? `📝 *Requirements:* ${customNotes.trim()}` : "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "Sent via Sukoon Construction Hub",
    ]
      .filter(Boolean)
      .join("\n");

    const waUrl = `https://api.whatsapp.com/send?phone=919109012345&text=${encodeURIComponent(
      whatsappMessage
    )}`;

    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }

    triggerToast("✓ Custom plan request sent! Connecting with architect on WhatsApp.");
    setCustomPlanModalOpen(false);
    setCustomNotes("");
  };

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
          Milestones, expense folders, site minutes, material rates, dealers, architects &amp; layout plans.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 8 MAIN FEATURE ICONS - MATCHING HOME PAGE ICON STYLE & DESIGN LANGUAGE */}
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
                      ? "bg-[#F4F8F5] border-[#C5DDD0]"
                      : "bg-white border-line hover:border-[#1E57A4]/40 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 border transition-all ${
                        item.isDone
                          ? "bg-forest border-forest text-white"
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
                          <span className="text-[9px] font-bold text-[#1E5637] bg-[#E8F2EC] border border-[#C5DDD0] px-1.5 py-0.2 rounded-md">
                            ✓ Resolved
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs mt-1 leading-snug font-semibold ${
                          item.isDone ? "text-[#1B2922]" : "text-[#1B2922]"
                        }`}
                      >
                        {item.title}
                      </p>

                      {/* Attached Inspection Photo */}
                      {item.imageUrl && (
                        <div className="mt-2 inline-block rounded-xl overflow-hidden border border-line/80 shadow-2xs">
                          <img
                            src={item.imageUrl}
                            alt="Inspection observation"
                            className="w-28 h-20 object-cover hover:opacity-90 transition cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewMinuteImage(item.imageUrl || null);
                            }}
                          />
                        </div>
                      )}
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

                  {/* Photo Upload Option for Site Inspection */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Attach Site Inspection Photo (Optional)
                    </label>
                    {newMinuteImage ? (
                      <div className="relative rounded-xl border border-[#C5DDD0] bg-[#F4F8F5] p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={newMinuteImage}
                            alt="Inspection Preview"
                            className="w-12 h-12 object-cover rounded-lg border border-[#A7CEB7]"
                          />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-[#1E5637] block truncate">
                              ✓ Photo Attached
                            </span>
                            <span className="text-[9px] text-[#7C8B82]">Tap X to remove or replace</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewMinuteImage(null)}
                          className="p-1 rounded-full bg-white border border-line text-ink-muted hover:text-rose-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#1E57A4]/50 bg-sand/20 hover:bg-sand/40 text-[#1E57A4] transition">
                        <Camera size={16} />
                        <span className="text-xs font-bold">Attach Site Photo / Camera</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleMinuteImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
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

          {/* Full Photo Preview Modal */}
          {previewMinuteImage && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
              onClick={() => setPreviewMinuteImage(null)}
            >
              <div className="relative max-w-lg w-full bg-black rounded-3xl overflow-hidden p-2 text-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setPreviewMinuteImage(null)}
                  className="absolute top-4 right-4 z-10 text-white bg-black/60 p-2 rounded-full hover:bg-black/90 transition"
                >
                  <X size={18} />
                </button>
                <img
                  src={previewMinuteImage}
                  alt="Site Inspection"
                  className="w-full max-h-[75vh] object-contain rounded-2xl mx-auto"
                />
                <p className="text-white/70 text-xs mt-2">Site Inspection Photo</p>
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

      {/* ========================================================================= */}
      {/* 5. DEALERS SECTION */}
      {/* ========================================================================= */}
      {section === "dealers" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Authorized Material Dealers</h2>
              <p className="text-[11px] text-ink-muted">
                Direct WhatsApp connect with verified construction material suppliers in {appSelectedCity}.
              </p>
            </div>
            <PinToHomeButton shortcutId="dealers" />
          </div>

          {/* Material Category Filter Pills */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1.5 px-1">
              Filter by Material
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {["All", "Steel", "Cement", "Sand", "Bricks", "Aggregate"].map((cat) => {
                const isSelected = dealerMaterialFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDealerMaterialFilter(cat)}
                    className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
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
          </div>

          {/* Dealers List Cards */}
          <div className="space-y-3">
            {filteredDealers.map((dealer) => (
              <div
                key={dealer.id}
                className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#B26315]/40 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <ShieldCheck size={11} /> Verified Dealer
                      </span>
                      <span className="text-[10px] text-ink-muted flex items-center gap-0.5">
                        <Star size={11} className="text-amber-500 fill-amber-500" /> {dealer.rating}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1B2922] mt-1.5 leading-snug">
                      {dealer.businessName}
                    </h3>
                    <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                      <span>👤 {dealer.name}</span>
                      <span>•</span>
                      <span>📍 {dealer.location}</span>
                    </p>
                  </div>
                </div>

                {/* Specialty Banner */}
                <div className="p-2.5 rounded-xl bg-sand/30 border border-line/70 text-[11px] text-[#2A3A30]">
                  <strong className="text-[#B26315]">Specialty: </strong>
                  <span>{dealer.specialty}</span>
                </div>

                {/* Categories supplied tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {dealer.categories.map((cat, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sand/60 text-[#1B2922] border border-line/60"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Action Buttons: WhatsApp & Phone */}
                <div className="pt-1 flex items-center gap-2 border-t border-line/60">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${dealer.whatsapp}&text=${encodeURIComponent(
                      `Hello ${dealer.name}, I found your listing on Sukoon Construction Hub. I am constructing a property in ${appSelectedCity} and would like to get rates and delivery details for ${dealer.categories.join(", ")}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-scale flex-1 py-2 px-3 rounded-xl bg-[#1E5637] text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={14} /> Connect on WhatsApp
                  </a>

                  <a
                    href={`tel:${dealer.phone}`}
                    className="tap-scale py-2 px-3.5 rounded-xl border border-line text-xs font-bold text-forest hover:bg-forest/5 flex items-center justify-center gap-1"
                  >
                    <Phone size={14} /> Call
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Supplier listing prompt */}
          <div className="bg-sand/30 border border-dashed border-line rounded-2xl p-4 text-center space-y-1.5">
            <p className="text-xs font-bold text-[#1B2922]">Are you an authorized material supplier?</p>
            <p className="text-[11px] text-ink-muted">
              Get listed on Sukoon Construction Hub and receive verified direct orders in {appSelectedCity}.
            </p>
            <a
              href={`https://api.whatsapp.com/send?phone=919109012345&text=${encodeURIComponent(
                `Hello Sukoon Team, I am a construction material dealer in ${appSelectedCity} and would like to register my dealership on the Sukoon App.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest underline mt-1"
            >
              Request Dealer Verification →
            </a>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. ARCHITECTS SECTION */}
      {/* ========================================================================= */}
      {section === "architects" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Listed Authorized Architects</h2>
              <p className="text-[11px] text-ink-muted">
                Council of Architecture (COA) registered residential &amp; luxury architects in {appSelectedCity}.
              </p>
            </div>
            <PinToHomeButton shortcutId="architects" />
          </div>

          {/* Guidance Banner */}
          <div className="p-3.5 rounded-2xl bg-sand/40 border border-line flex items-start gap-2.5">
            <Compass size={18} className="text-[#0D7490] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#2A3A30] leading-relaxed">
              <strong className="text-[#0D7490]">Architect Scope of Work: </strong>
              Working layout drawings, column orientation, municipal sanction submissions, 3D front elevations, and site execution visits.
            </div>
          </div>

          {/* Architects List Cards */}
          <div className="space-y-3">
            {AUTHORIZED_ARCHITECTS.map((arch) => (
              <div
                key={arch.id}
                className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#0D7490]/40 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 flex items-center gap-1">
                        <Award size={11} /> COA Certified Architect
                      </span>
                      <span className="text-[10px] text-ink-muted flex items-center gap-0.5">
                        <Star size={11} className="text-amber-500 fill-amber-500" /> {arch.rating}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1B2922] mt-1.5 leading-snug">
                      {arch.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#0D7490] mt-0.5">
                      {arch.firm}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      📍 {arch.location} • ⏳ {arch.experienceYears} Years Experience
                    </p>
                  </div>
                </div>

                {/* Specialization & Projects */}
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-sand/30 border border-line/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                      Core Specialization:
                    </span>
                    <p className="text-[11px] text-[#2A3A30] mt-0.5 font-medium leading-relaxed">
                      {arch.specialization}
                    </p>
                  </div>

                  <p className="text-[11px] text-ink-muted px-1">
                    🏛️ <strong>Portfolio:</strong> {arch.notableProjects}
                  </p>
                </div>

                {/* Action Buttons: WhatsApp & Call */}
                <div className="pt-1 flex items-center gap-2 border-t border-line/60">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${arch.whatsapp}&text=${encodeURIComponent(
                      `Hello ${arch.name}, I found your architectural profile on Sukoon Construction Hub. I am planning to build a house in ${appSelectedCity} and would like to discuss layout planning and 3D elevation drawings.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-scale flex-1 py-2 px-3 rounded-xl bg-[#0D7490] text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={14} /> Connect on WhatsApp
                  </a>

                  <a
                    href={`tel:${arch.phone}`}
                    className="tap-scale py-2 px-3.5 rounded-xl border border-line text-xs font-bold text-forest hover:bg-forest/5 flex items-center justify-center gap-1"
                  >
                    <Phone size={14} /> Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. CIVIL ENGINEERS SECTION */}
      {/* ========================================================================= */}
      {section === "engineers" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Listed Authorized Civil Engineers</h2>
              <p className="text-[11px] text-ink-muted">
                Chartered structural consultants, RCC bar-bending auditors &amp; soil test engineers in {appSelectedCity}.
              </p>
            </div>
            <PinToHomeButton shortcutId="engineers" />
          </div>

          {/* Quality Assurance Info Banner */}
          <div className="p-3.5 rounded-2xl bg-sand/40 border border-line flex items-start gap-2.5">
            <HardHat size={18} className="text-[#C05621] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#2A3A30] leading-relaxed">
              <strong className="text-[#C05621]">Structural Inspection Milestone: </strong>
              Have a qualified civil engineer audit your footing reinforcement, column ties, and slab beam steel mesh <em>before pouring concrete</em>.
            </div>
          </div>

          {/* Civil Engineers List Cards */}
          <div className="space-y-3">
            {AUTHORIZED_CIVIL_ENGINEERS.map((eng) => (
              <div
                key={eng.id}
                className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#C05621]/40 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 flex items-center gap-1">
                        <ShieldCheck size={11} /> Govt Approved Structural Engineer
                      </span>
                      <span className="text-[10px] text-ink-muted flex items-center gap-0.5">
                        <Star size={11} className="text-amber-500 fill-amber-500" /> {eng.rating}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1B2922] mt-1.5 leading-snug">
                      {eng.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#C05621] mt-0.5">
                      {eng.firm}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      📍 {eng.location} • 🏗️ {eng.experienceYears} Years Exp • {eng.projectsCompleted}+ Audits
                    </p>
                  </div>
                </div>

                {/* Qualifications & Specialization */}
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-sand/30 border border-line/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                      Engineering Qualifications:
                    </span>
                    <p className="text-[11px] text-[#2A3A30] mt-0.5 font-semibold">
                      {eng.qualifications}
                    </p>
                  </div>

                  <p className="text-[11px] text-[#2A3A30] px-1 leading-relaxed">
                    ⚙️ <strong>Specialization:</strong> {eng.specialization}
                  </p>
                </div>

                {/* Action Buttons: WhatsApp & Call */}
                <div className="pt-1 flex items-center gap-2 border-t border-line/60">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${eng.whatsapp}&text=${encodeURIComponent(
                      `Hello ${eng.name}, I found your structural civil engineering profile on Sukoon Construction Hub. I need consultancy / site reinforcement audit for my plot in ${appSelectedCity}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-scale flex-1 py-2 px-3 rounded-xl bg-[#C05621] text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={14} /> Connect on WhatsApp
                  </a>

                  <a
                    href={`tel:${eng.phone}`}
                    className="tap-scale py-2 px-3.5 rounded-xl border border-line text-xs font-bold text-forest hover:bg-forest/5 flex items-center justify-center gap-1"
                  >
                    <Phone size={14} /> Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. CONCEPTUAL LAYOUT PLANS SECTION & 3D ELEVATIONS */}
      {/* ========================================================================= */}
      {section === "plans" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Conceptual Layout Plans &amp; Elevations</h2>
              <p className="text-[11px] text-ink-muted">
                Pre-defined Vastu layouts with 3D elevations + Custom Plan drafting.
              </p>
            </div>
            <PinToHomeButton shortcutId="plans" />
          </div>

          {/* Make Custom Plan Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1E5637] to-[#133A24] text-white shadow-md space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Tailored To Your Plot
                </span>
                <h3 className="text-base font-serif font-bold text-white mt-0.5">
                  Need a Custom Floor Plan &amp; Elevation?
                </h3>
                <p className="text-[11px] text-white/80 mt-1 leading-relaxed">
                  Have unique plot dimensions or special requirements? Request our architectural team to draft a personalized Vastu plan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCustomPlanModalOpen(true)}
              className="tap-scale w-full py-2.5 rounded-xl bg-white text-forest text-xs font-bold shadow-2xs hover:bg-white/95 flex items-center justify-center gap-1.5"
            >
              <Ruler size={14} /> Make Custom Plan
            </button>
          </div>

          {/* Standard Dimension Filter Pills */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1.5 px-1">
              Filter by Standard Plot Dimensions
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                "All",
                "15x50",
                "20x50",
                "30x50",
                "30x60",
                "50x40",
                "40x60",
                "50x80",
              ].map((dim) => {
                const isSelected = planDimensionFilter === dim;
                return (
                  <button
                    key={dim}
                    type="button"
                    onClick={() => setPlanDimensionFilter(dim)}
                    className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      isSelected
                        ? "bg-[#319795] text-white shadow-2xs"
                        : "bg-white text-ink-muted border border-line hover:border-[#319795]/40"
                    }`}
                  >
                    {dim === "All" ? "All Sizes" : `${dim} ft`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Conceptual Plans with 3D Elevations */}
          <div className="space-y-4">
            {filteredPlans.map((plan) => {
              const isDetailsOpen = expandedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  className="bg-white border border-line rounded-2xl p-4 shadow-2xs hover:border-[#319795]/40 transition space-y-3"
                >
                  {/* Header: Dimension & Configuration */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#319795]/10 text-[#319795]">
                          {plan.dimensions.replace("*", " × ")} ft • {plan.plotAreaSqft.toLocaleString("en-IN")} sq.ft
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {plan.facing}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1B2922] mt-1.5 leading-snug">
                        {plan.title}
                      </h3>
                      <p className="text-xs font-medium text-ink-muted mt-0.5">
                        {plan.configuration} • {plan.floors}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-ink-muted block">Est. Cost</span>
                      <span className="text-xs font-bold text-forest">{plan.estimatedCost}</span>
                    </div>
                  </div>

                  {/* 3D Elevation Box */}
                  {plan.elevationStyle && (
                    <div className="p-3 rounded-xl bg-sand/30 border border-line/70 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#319795] flex items-center gap-1">
                        <Layers size={12} /> 3D Elevation Concept: {plan.elevationStyle}
                      </span>
                      <p className="text-[11px] text-[#2A3A30] leading-relaxed">
                        {plan.elevationDescription}
                      </p>
                    </div>
                  )}

                  {/* Highlights Features */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                      Layout Highlights:
                    </span>
                    <ul className="grid grid-cols-1 gap-1 text-[11px] text-[#2A3A30]">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="text-forest font-bold">•</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expandable Room Dimensions Accordion */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedPlanId(isDetailsOpen ? null : plan.id)}
                      className="text-xs font-bold text-forest inline-flex items-center gap-1 hover:underline"
                    >
                      {isDetailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{isDetailsOpen ? "Hide Room Dimensions" : "View Room Breakdown & Dimensions"}</span>
                    </button>

                    {isDetailsOpen && (
                      <div className="mt-2.5 p-3 rounded-xl bg-sand/20 border border-line space-y-2 text-xs animate-in fade-in">
                        <div>
                          <strong className="text-[11px] text-forest block mb-1">Ground Floor:</strong>
                          <ul className="space-y-0.5 text-[11px] text-[#2A3A30]">
                            {plan.roomDetails.groundFloor.map((r, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <span className="text-ink-muted">▪</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {plan.roomDetails.firstFloor && plan.roomDetails.firstFloor.length > 0 && (
                          <div className="pt-1.5 border-t border-line/60">
                            <strong className="text-[11px] text-forest block mb-1">First Floor:</strong>
                            <ul className="space-y-0.5 text-[11px] text-[#2A3A30]">
                              {plan.roomDetails.firstFloor.map((r, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <span className="text-ink-muted">▪</span> {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inquire on WhatsApp */}
                  <div className="pt-1 border-t border-line/60 flex items-center justify-between gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?phone=919109012345&text=${encodeURIComponent(
                        `Hello Sukoon Architecture Desk, I am interested in the ${plan.title} (${plan.dimensions.replace("*", "x")} ft layout). Please share the complete CAD floor plan, working drawings, and 3D elevation renderings for ${appSelectedCity}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-scale w-full py-2 px-3 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={14} /> Inquire About This Plan
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Plan Modal Form */}
          {customPlanModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl relative space-y-3.5 max-h-[90vh] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setCustomPlanModalOpen(false)}
                  className="absolute top-4 right-4 text-ink-muted hover:text-foreground p-1 rounded-full bg-sand/60"
                >
                  <X size={18} />
                </button>

                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    Architectural Desk
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#1B2922] mt-1">
                    Request Custom Layout Plan
                  </h3>
                  <p className="text-xs text-ink-muted">
                    We will draft a custom Vastu-aligned layout with 3D elevations.
                  </p>
                </div>

                <form onSubmit={handleCustomPlanSubmit} className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      WhatsApp / Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={customClientPhone}
                      onChange={(e) => setCustomClientPhone(e.target.value)}
                      placeholder="e.g. 98260 12345"
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Plot Size (Dimensions)
                      </label>
                      <input
                        type="text"
                        required
                        value={customPlotDimensions}
                        onChange={(e) => setCustomPlotDimensions(e.target.value)}
                        placeholder="e.g. 25x50 ft"
                        className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Plot Facing
                      </label>
                      <select
                        value={customPlotFacing}
                        onChange={(e) => setCustomPlotFacing(e.target.value)}
                        className="w-full bg-sand/30 border border-line rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none"
                      >
                        <option value="East">East Facing ☀️</option>
                        <option value="North">North Facing 🧭</option>
                        <option value="West">West Facing 🌅</option>
                        <option value="South">South Facing ⚡</option>
                        <option value="North-East">North-East (Ishanya)</option>
                        <option value="Corner">Corner Plot (Two Sides Open)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Configuration
                      </label>
                      <select
                        value={customConfiguration}
                        onChange={(e) => setCustomConfiguration(e.target.value)}
                        className="w-full bg-sand/30 border border-line rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none"
                      >
                        <option value="2 BHK Single Floor">2 BHK Ground Floor</option>
                        <option value="3 BHK Duplex">3 BHK Duplex (G+1)</option>
                        <option value="4 BHK Villa">4 BHK Luxury Villa</option>
                        <option value="5 BHK Grand Duplex">5 BHK Grand Mansion</option>
                        <option value="Commercial + Residential">Shop + House (Mixed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Target Budget
                      </label>
                      <select
                        value={customBudget}
                        onChange={(e) => setCustomBudget(e.target.value)}
                        className="w-full bg-sand/30 border border-line rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none"
                      >
                        <option value="₹25 - ₹35 Lakhs">₹25 - ₹35 Lakhs</option>
                        <option value="₹35 - ₹50 Lakhs">₹35 - ₹50 Lakhs</option>
                        <option value="₹50 - ₹75 Lakhs">₹50 - ₹75 Lakhs</option>
                        <option value="₹75 Lakhs - ₹1.2 Cr">₹75 Lakhs - ₹1.2 Cr</option>
                        <option value="Above ₹1.2 Cr">Above ₹1.2 Cr (Ultra Luxury)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Special Requirements / Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="e.g. Need 2 car parking, ground floor pooja room, home theatre, open central courtyard"
                      className="w-full bg-white border border-line rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomPlanModalOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-line text-xs font-bold text-ink-muted hover:bg-sand/40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
                    >
                      Submit &amp; Connect
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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

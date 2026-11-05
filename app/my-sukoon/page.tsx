"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Wallet,
  TrendingUp,
  Landmark,
  PiggyBank,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  Car,
  Building2,
  CreditCard,
  Compass,
  Plane,
  MapPin,
  Calendar,
  Luggage,
  CheckSquare,
  Square,
  Palmtree,
  Heart,
  Lock,
  Unlock,
  Smile,
  Camera,
  Sun,
  Target,
  Baby,
  CheckCircle2,
  User,
  Dumbbell,
  Book,
  Feather,
  Coffee,
  Plus,
  Trash2,
  Pencil,
  ChevronRight,
  Eye,
  EyeOff,
  Activity,
  Award,
  BookOpen,
  Clock,
  KeyRound,
  X,
  Share2,
  Sparkle,
  RotateCcw,
  Check,
} from "lucide-react";
import { useStore, useOptionalStore } from "@/components/StoreProvider";

// ==========================================
// PILLAR TYPES
// ==========================================

export type LifePillar = "finance" | "travel" | "love" | "kids" | "self";

// 1. Finance Types
export interface AssetEntry {
  id: string;
  category: "Bank FD" | "Mutual Funds" | "Equity / Stocks" | "Car / Vehicle" | "Real Estate" | "Gold / Other";
  name: string;
  institutionOrDetails: string;
  currentValue: number;
  monthlyAddition?: number;
  returnRate?: string;
  maturityDate?: string;
}

export interface LoanEntry {
  id: string;
  name: string;
  type: "Home Loan" | "Car Loan" | "Personal Loan" | "Education Loan";
  bank: string;
  totalAmount: number;
  remainingBalance: number;
  monthlyEmi: number;
  tenureRemainingMonths: number;
}

export interface InsuranceEntry {
  id: string;
  type: "Medical / Health" | "Personal Accident" | "Term Life Plan";
  provider: string;
  policyName: string;
  sumAssured: number;
  annualPremium: number;
  renewalDate: string;
  coveredMembers: string;
}

// 2. Travel Types
export interface BucketListItem {
  id: string;
  destination: string;
  countryOrState: string;
  category: "International" | "Domestic" | "Spiritual" | "Adventure";
  targetYear: string;
  estimatedBudget: number;
  savedBudget: number;
  gradientBg: string;
  whySpecial: string;
}

export interface FeaturedTrip {
  destination: string;
  dates: string;
  daysRemaining: number;
  tag: string;
  subtitle: string;
}

export interface PackingItem {
  id: string;
  task: string;
  done: boolean;
}

// 3. Love Types
export interface CoupleGoal {
  id: string;
  title: string;
  category: "Future Dream" | "Quality Time" | "Life Milestone" | "Wellness";
  targetTime: string;
  completed: boolean;
}

export interface CoupleMemory {
  id: string;
  title: string;
  date: string;
  location: string;
  note: string;
  gradientBg: string;
}

export interface HeartLog {
  id: string;
  type: "Shared Joy" | "Tough Day Overcome" | "Mutual Gratitude";
  date: string;
  reflection: string;
}

// 4. Kids Types
export interface KidsDailyRoutine {
  id: string;
  title: string;
  timeSlot: "Morning" | "Afternoon" | "Evening" | "Night";
  completed: boolean;
  category: "Homework" | "Reading" | "Sports" | "Discipline";
}

export interface KidsSkill {
  id: string;
  hobbyName: string;
  levelOrAcademy: string;
  schedule: string;
  childName: string;
  progressPercent: number;
}

export interface KidsAcademicSubject {
  subject: string;
  score: number;
}

// 5. Self Types
export interface ReadingBook {
  id: string;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  status: "reading" | "completed" | "want_to_read";
}

export interface PersonalHabit {
  id: string;
  title: string;
  frequency: "Daily" | "Weekly";
  completedToday: boolean;
  streakDays: number;
}

// ==========================================
// DEFAULT SEED DATA
// ==========================================

const DEFAULT_ASSETS: AssetEntry[] = [
  {
    id: "ast-1",
    category: "Bank FD",
    name: "Emergency Liquidity FD",
    institutionOrDetails: "HDFC Bank (7.4% p.a.)",
    currentValue: 1500000,
    returnRate: "7.4%",
    maturityDate: "18 Aug 2027",
  },
  {
    id: "ast-2",
    category: "Mutual Funds",
    name: "Flexi-Cap & Nifty 50 Index SIP",
    institutionOrDetails: "Parag Parikh & UTI Nifty 50",
    currentValue: 3450000,
    monthlyAddition: 45000,
    returnRate: "14.2% XIRR",
  },
  {
    id: "ast-3",
    category: "Equity / Stocks",
    name: "Bluechip Direct Equity Demat",
    institutionOrDetails: "Zerodha Demat Portfolio",
    currentValue: 2180000,
    returnRate: "16.8% XIRR",
  },
  {
    id: "ast-4",
    category: "Car / Vehicle",
    name: "Toyota Urban Cruiser Hyryder",
    institutionOrDetails: "Family Hybrid SUV (2024 Model)",
    currentValue: 1650000,
  },
];

const DEFAULT_LOANS: LoanEntry[] = [
  {
    id: "loan-car",
    name: "Vehicle Finance EMI",
    type: "Car Loan",
    bank: "HDFC Auto Finance",
    totalAmount: 1200000,
    remainingBalance: 480000,
    monthlyEmi: 18500,
    tenureRemainingMonths: 28,
  },
  {
    id: "loan-home-custom",
    name: "Home Extension Top-up",
    type: "Home Loan",
    bank: "SBI Home Finance",
    totalAmount: 1500000,
    remainingBalance: 950000,
    monthlyEmi: 14200,
    tenureRemainingMonths: 84,
  },
];

const DEFAULT_INSURANCE: InsuranceEntry[] = [
  {
    id: "ins-health",
    type: "Medical / Health",
    provider: "HDFC Ergo Optima Secure",
    policyName: "Family Health Floater",
    sumAssured: 2500000,
    annualPremium: 32000,
    renewalDate: "15 Oct 2027",
    coveredMembers: "Self, Spouse & 2 Children",
  },
  {
    id: "ins-term",
    type: "Term Life Plan",
    provider: "ICICI Prudential iProtect Smart",
    policyName: "Pure Term Life Cover",
    sumAssured: 25000000,
    annualPremium: 28500,
    renewalDate: "05 Dec 2027",
    coveredMembers: "Self (Nominee: Spouse)",
  },
  {
    id: "ins-accident",
    type: "Personal Accident",
    provider: "Tata AIG Comprehensive",
    policyName: "Accident & Critical Care Shield",
    sumAssured: 5000000,
    annualPremium: 9400,
    renewalDate: "20 Jan 2028",
    coveredMembers: "Self & Family",
  },
];

const DEFAULT_FEATURED_TRIP: FeaturedTrip = {
  destination: "Kerala Backwaters, Kumarakom & Munnar",
  dates: "24 Dec 2026 – 30 Dec 2026",
  daysRemaining: 50,
  tag: "Winter Family Holiday",
  subtitle: "7 Days • 2 Adults, 2 Kids • Fully Funded",
};

const DEFAULT_PACKING_LIST: PackingItem[] = [
  { id: "pk-1", task: "Kumarakom Lake Resort reservation confirmed", done: true },
  { id: "pk-2", task: "Houseboat sunset cruise slots booked", done: true },
  { id: "pk-3", task: "Kids warm-wear & medical essentials pack", done: true },
  { id: "pk-4", task: "Munnar tea museum & spice garden passes", done: false },
  { id: "pk-5", task: "Carry camera batteries & spare memory cards", done: false },
];

const DEFAULT_BUCKET_LIST: BucketListItem[] = [
  {
    id: "trip-switz",
    destination: "Swiss Alps & Interlaken",
    countryOrState: "Switzerland",
    category: "International",
    targetYear: "Summer 2027",
    estimatedBudget: 650000,
    savedBudget: 380000,
    gradientBg: "from-sky-800 via-blue-900 to-slate-900",
    whySpecial: "Dream train ride on Glacier Express with kids & wife.",
  },
  {
    id: "trip-kerala",
    destination: "Kumarakom & Munnar Hills",
    countryOrState: "Kerala, India",
    category: "Domestic",
    targetYear: "Dec 2026",
    estimatedBudget: 180000,
    savedBudget: 180000,
    gradientBg: "from-emerald-800 via-teal-900 to-green-950",
    whySpecial: "Private houseboat stay & winter spice plantation walk.",
  },
  {
    id: "trip-japan",
    destination: "Tokyo & Kyoto Cherry Blossoms",
    countryOrState: "Japan",
    category: "International",
    targetYear: "Spring 2028",
    estimatedBudget: 800000,
    savedBudget: 220000,
    gradientBg: "from-rose-800 via-pink-900 to-purple-950",
    whySpecial: "Experiencing Sakura bloom and bullet trains together.",
  },
  {
    id: "trip-kedarnath",
    destination: "Kedarnath & Badrinath Yatra",
    countryOrState: "Uttarakhand, India",
    category: "Spiritual",
    targetYear: "Sep 2027",
    estimatedBudget: 140000,
    savedBudget: 75000,
    gradientBg: "from-amber-800 via-orange-900 to-stone-900",
    whySpecial: "Peaceful Himalayan spiritual pilgrimage with family.",
  },
];

const DEFAULT_COUPLE_GOALS: CoupleGoal[] = [
  {
    id: "cg-1",
    title: "Weekly Unplugged Date Night (No Phones)",
    category: "Quality Time",
    targetTime: "Every Friday 8 PM",
    completed: true,
  },
  {
    id: "cg-2",
    title: "Annual Couple Retreat Without Gadgets",
    category: "Wellness",
    targetTime: "March 2027",
    completed: false,
  },
  {
    id: "cg-3",
    title: "Build our dream organic weekend garden",
    category: "Future Dream",
    targetTime: "Late 2027",
    completed: false,
  },
];

const DEFAULT_MEMORIES: CoupleMemory[] = [
  {
    id: "mem-1",
    title: "Our First Home Key Handover",
    date: "14 Feb 2026",
    location: "Vijay Nagar Residence, Indore",
    note: "Stepping onto the balcony with chai, knowing every sacrifice was worth this peace.",
    gradientBg: "from-emerald-900 via-emerald-800 to-stone-900",
  },
  {
    id: "mem-2",
    title: "Sunset Walk at Udaipur Lake",
    date: "04 Nov 2025",
    location: "Lake Pichola, Udaipur",
    note: "Just the two of us, laughing about college days and dreaming about the next decade.",
    gradientBg: "from-rose-900 via-amber-900 to-stone-900",
  },
];

const DEFAULT_HEART_LOGS: HeartLog[] = [
  {
    id: "hl-1",
    type: "Shared Joy",
    date: "01 Nov 2026",
    reflection: "We celebrated clearing our property legal registration cleanly. Having your calm support kept me grounded through the entire registration process.",
  },
  {
    id: "hl-2",
    type: "Tough Day Overcome",
    date: "18 Sep 2026",
    reflection: "Work was exhausting, but coming home and sharing a silent quiet cup of tea without judgment gave me pure sukoon.",
  },
];

const DEFAULT_KIDS_ROUTINES: KidsDailyRoutine[] = [
  { id: "kr-1", title: "Morning Surya Namaskar & 10-Min Breathing", timeSlot: "Morning", completed: true, category: "Discipline" },
  { id: "kr-2", title: "School Mathematics & Science Homework", timeSlot: "Afternoon", completed: true, category: "Homework" },
  { id: "kr-3", title: "Swimming Practice & Outdoor Sports (45 Min)", timeSlot: "Evening", completed: false, category: "Sports" },
  { id: "kr-4", title: "Read Bedtime Story Book & Pack Bag for Tomorrow", timeSlot: "Night", completed: false, category: "Reading" },
];

const DEFAULT_KIDS_SKILLS: KidsSkill[] = [
  { id: "ks-1", hobbyName: "Competitive Swimming", levelOrAcademy: "Shishukunj Sports Club", schedule: "Tue, Thu, Sat (5 PM)", childName: "Aarav", progressPercent: 78 },
  { id: "ks-2", hobbyName: "Chess Tactics & Strategy", levelOrAcademy: "Indore Chess Academy", schedule: "Sun Morning 10 AM", childName: "Aarav", progressPercent: 85 },
  { id: "ks-3", hobbyName: "Classical Kathak Dance & Arts", levelOrAcademy: "Nritya Niketan", schedule: "Wed & Fri (4 PM)", childName: "Ananya", progressPercent: 64 },
];

const DEFAULT_BOOKS: ReadingBook[] = [
  { id: "bk-1", title: "Atomic Habits", author: "James Clear", currentPage: 184, totalPages: 306, status: "reading" },
  { id: "bk-2", title: "The Psychology of Money", author: "Morgan Housel", currentPage: 242, totalPages: 242, status: "completed" },
  { id: "bk-3", title: "Autobiography of a Yogi", author: "Paramahansa Yogananda", currentPage: 90, totalPages: 520, status: "reading" },
];

const DEFAULT_HABITS: PersonalHabit[] = [
  { id: "hb-1", title: "7,500+ Daily Steps Walk", frequency: "Daily", completedToday: true, streakDays: 14 },
  { id: "hb-2", title: "15 Min Morning Meditation & Silence", frequency: "Daily", completedToday: true, streakDays: 21 },
  { id: "hb-3", title: "Zero Screen Time 30 Min Before Sleep", frequency: "Daily", completedToday: false, streakDays: 8 },
  { id: "hb-4", title: "Weekly Landscape Photography / Cycling", frequency: "Weekly", completedToday: true, streakDays: 5 },
];

// Helper: Format INR currency
function formatINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return "₹0";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(2).replace(/\.00$/, "")} Cr`;
  }
  if (amount >= 100000) {
    const lk = amount / 100000;
    return `₹${lk.toFixed(2).replace(/\.00$/, "")} Lakh`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function MySukoonPage() {
  const store = useOptionalStore();
  const properties = store?.s?.properties || [];

  // Active Life Pillar Tab (defaults to null for Folder View)
  const [activePillar, setActivePillar] = useState<LifePillar | null>(null);

  // Privacy & PIN Lock for "My Love My Life"
  const [isLoveLocked, setIsLoveLocked] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [savedPin, setSavedPin] = useState<string>(() => {
    if (typeof window === "undefined") return "1234";
    return localStorage.getItem("sukoon_mysukoon_pin") || "1234";
  });
  const [showPinChangeModal, setShowPinChangeModal] = useState<boolean>(false);
  const [newPinCandidate, setNewPinCandidate] = useState<string>("");

  // ==========================================
  // STATE MANAGEMENT WITH LOCALSTORAGE PERSISTENCE
  // ==========================================

  // Finance State
  const [assets, setAssets] = useState<AssetEntry[]>(() => {
    if (typeof window === "undefined") return DEFAULT_ASSETS;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_assets");
      return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
    } catch {
      return DEFAULT_ASSETS;
    }
  });

  const [loans, setLoans] = useState<LoanEntry[]>(() => {
    if (typeof window === "undefined") return DEFAULT_LOANS;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_loans");
      return saved ? JSON.parse(saved) : DEFAULT_LOANS;
    } catch {
      return DEFAULT_LOANS;
    }
  });

  const [insurance, setInsurance] = useState<InsuranceEntry[]>(() => {
    if (typeof window === "undefined") return DEFAULT_INSURANCE;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_insurance");
      return saved ? JSON.parse(saved) : DEFAULT_INSURANCE;
    } catch {
      return DEFAULT_INSURANCE;
    }
  });

  const [emergencyTarget, setEmergencyTarget] = useState<number>(() => {
    if (typeof window === "undefined") return 600000;
    const v = localStorage.getItem("sukoon_mysukoon_emergency_target");
    return v ? Number(v) : 600000;
  });

  const [emergencyCurrent, setEmergencyCurrent] = useState<number>(() => {
    if (typeof window === "undefined") return 480000;
    const v = localStorage.getItem("sukoon_mysukoon_emergency_current");
    return v ? Number(v) : 480000;
  });

  const [educationTarget, setEducationTarget] = useState<number>(() => {
    if (typeof window === "undefined") return 5000000;
    const v = localStorage.getItem("sukoon_mysukoon_education_target");
    return v ? Number(v) : 5000000;
  });

  const [educationCurrent, setEducationCurrent] = useState<number>(() => {
    if (typeof window === "undefined") return 1850000;
    const v = localStorage.getItem("sukoon_mysukoon_education_current");
    return v ? Number(v) : 1850000;
  });

  // Travel State
  const [travelAnnualTarget, setTravelAnnualTarget] = useState<number>(() => {
    if (typeof window === "undefined") return 350000;
    const v = localStorage.getItem("sukoon_mysukoon_travel_target");
    return v ? Number(v) : 350000;
  });

  const [travelAnnualSaved, setTravelAnnualSaved] = useState<number>(() => {
    if (typeof window === "undefined") return 245000;
    const v = localStorage.getItem("sukoon_mysukoon_travel_saved");
    return v ? Number(v) : 245000;
  });

  const [featuredTrip, setFeaturedTrip] = useState<FeaturedTrip>(() => {
    if (typeof window === "undefined") return DEFAULT_FEATURED_TRIP;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_featured_trip");
      return saved ? JSON.parse(saved) : DEFAULT_FEATURED_TRIP;
    } catch {
      return DEFAULT_FEATURED_TRIP;
    }
  });

  const [packingList, setPackingList] = useState<PackingItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PACKING_LIST;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_packing_list");
      return saved ? JSON.parse(saved) : DEFAULT_PACKING_LIST;
    } catch {
      return DEFAULT_PACKING_LIST;
    }
  });

  const [bucketList, setBucketList] = useState<BucketListItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_BUCKET_LIST;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_bucket_list");
      return saved ? JSON.parse(saved) : DEFAULT_BUCKET_LIST;
    } catch {
      return DEFAULT_BUCKET_LIST;
    }
  });

  // Love State
  const [coupleHoursThisWeek, setCoupleHoursThisWeek] = useState<number>(() => {
    if (typeof window === "undefined") return 5.5;
    const v = localStorage.getItem("sukoon_mysukoon_couple_hours");
    return v ? Number(v) : 5.5;
  });

  const [nextDateNight, setNextDateNight] = useState<string>(() => {
    if (typeof window === "undefined") return "Friday, 8:00 PM • Terrace candle dinner";
    return localStorage.getItem("sukoon_mysukoon_next_date") || "Friday, 8:00 PM • Terrace candle dinner";
  });

  const [specialAnniversary, setSpecialAnniversary] = useState<string>(() => {
    if (typeof window === "undefined") return "14 February • 100 Days until 10th milestone";
    return localStorage.getItem("sukoon_mysukoon_anniversary") || "14 February • 100 Days until 10th milestone";
  });

  const [intimacyScore, setIntimacyScore] = useState<number>(() => {
    if (typeof window === "undefined") return 92;
    const v = localStorage.getItem("sukoon_mysukoon_intimacy_score");
    return v ? Number(v) : 92;
  });

  const [coupleGoals, setCoupleGoals] = useState<CoupleGoal[]>(() => {
    if (typeof window === "undefined") return DEFAULT_COUPLE_GOALS;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_couple_goals");
      return saved ? JSON.parse(saved) : DEFAULT_COUPLE_GOALS;
    } catch {
      return DEFAULT_COUPLE_GOALS;
    }
  });

  const [coupleMemories, setCoupleMemories] = useState<CoupleMemory[]>(() => {
    if (typeof window === "undefined") return DEFAULT_MEMORIES;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_memories");
      return saved ? JSON.parse(saved) : DEFAULT_MEMORIES;
    } catch {
      return DEFAULT_MEMORIES;
    }
  });

  const [heartLogs, setHeartLogs] = useState<HeartLog[]>(() => {
    if (typeof window === "undefined") return DEFAULT_HEART_LOGS;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_heart_logs");
      return saved ? JSON.parse(saved) : DEFAULT_HEART_LOGS;
    } catch {
      return DEFAULT_HEART_LOGS;
    }
  });

  // Kids State
  const [activeChild, setActiveChild] = useState<string>("Aarav");
  const [childrenList, setChildrenList] = useState<string[]>(["Aarav", "Ananya"]);

  const [kidsRoutines, setKidsRoutines] = useState<KidsDailyRoutine[]>(() => {
    if (typeof window === "undefined") return DEFAULT_KIDS_ROUTINES;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_kids_routines");
      return saved ? JSON.parse(saved) : DEFAULT_KIDS_ROUTINES;
    } catch {
      return DEFAULT_KIDS_ROUTINES;
    }
  });

  const [kidsSkills, setKidsSkills] = useState<KidsSkill[]>(() => {
    if (typeof window === "undefined") return DEFAULT_KIDS_SKILLS;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_kids_skills");
      return saved ? JSON.parse(saved) : DEFAULT_KIDS_SKILLS;
    } catch {
      return DEFAULT_KIDS_SKILLS;
    }
  });

  const [academicGrades, setAcademicGrades] = useState<{
    overallGrade: string;
    schoolName: string;
    subjects: KidsAcademicSubject[];
    teacherRemarks: string;
  }>({
    overallGrade: "A+",
    schoolName: "The Shishukunj International School",
    subjects: [
      { subject: "Mathematics", score: 96 },
      { subject: "Science & Env", score: 92 },
      { subject: "English & Vocab", score: 94 },
    ],
    teacherRemarks: "Aarav shows remarkable creative problem solving and active sportsmanship in team drills.",
  });

  const [kidsHealth, setKidsHealth] = useState<{
    heightCm: number;
    weightKg: number;
    screenTimeMinutes: number;
    screenTimeLimit: number;
    bedtime: string;
  }>({
    heightCm: 134,
    weightKg: 28,
    screenTimeMinutes: 35,
    screenTimeLimit: 45,
    bedtime: "8:30 PM",
  });

  // Self State
  const [books, setBooks] = useState<ReadingBook[]>(() => {
    if (typeof window === "undefined") return DEFAULT_BOOKS;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_books");
      return saved ? JSON.parse(saved) : DEFAULT_BOOKS;
    } catch {
      return DEFAULT_BOOKS;
    }
  });

  const [habits, setHabits] = useState<PersonalHabit[]>(() => {
    if (typeof window === "undefined") return DEFAULT_HABITS;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_habits");
      return saved ? JSON.parse(saved) : DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [happinessScore, setHappinessScore] = useState<number>(() => {
    if (typeof window === "undefined") return 88;
    const v = localStorage.getItem("sukoon_mysukoon_happiness");
    return v ? Number(v) : 88;
  });

  const [dailySteps, setDailySteps] = useState<number>(7420);
  const [stepsGoal, setStepsGoal] = useState<number>(10000);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<number>(4);

  const [gratitudeNotes, setGratitudeNotes] = useState<string[]>([
    "Morning peaceful cup of ginger chai on the balcony with birds chirping.",
    "Watching Aarav complete his swimming lap with confidence.",
    "A quiet heart-to-heart evening discussion on our next family decade.",
  ]);
  const [newGratitudeText, setNewGratitudeText] = useState<string>("");

  // ==========================================
  // MODALS STATE SYSTEM (FOR ADDING & EDITING)
  // ==========================================
  type ModalType =
    | "asset"
    | "loan"
    | "insurance"
    | "target_funds"
    | "travel_budget"
    | "featured_trip"
    | "new_task"
    | "bucket_trip"
    | "couple_time"
    | "couple_goal"
    | "couple_memory"
    | "heart_log"
    | "kid_routine"
    | "kid_skill"
    | "kid_academic"
    | "kid_health"
    | "book"
    | "habit"
    | "fitness"
    | null;

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields State
  const [formField1, setFormField1] = useState<string>("");
  const [formField2, setFormField2] = useState<string>("");
  const [formField3, setFormField3] = useState<string>("");
  const [formField4, setFormField4] = useState<string>("");
  const [formField5, setFormField5] = useState<string>("");
  const [formNumber1, setFormNumber1] = useState<number>(0);
  const [formNumber2, setFormNumber2] = useState<number>(0);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string>("");
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // ==========================================
  // LOCALSTORAGE SYNC EFFECTS
  // ==========================================
  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_assets", JSON.stringify(assets));
      localStorage.setItem("sukoon_mysukoon_loans", JSON.stringify(loans));
      localStorage.setItem("sukoon_mysukoon_insurance", JSON.stringify(insurance));
      localStorage.setItem("sukoon_mysukoon_emergency_target", emergencyTarget.toString());
      localStorage.setItem("sukoon_mysukoon_emergency_current", emergencyCurrent.toString());
      localStorage.setItem("sukoon_mysukoon_education_target", educationTarget.toString());
      localStorage.setItem("sukoon_mysukoon_education_current", educationCurrent.toString());
      localStorage.setItem("sukoon_mysukoon_travel_target", travelAnnualTarget.toString());
      localStorage.setItem("sukoon_mysukoon_travel_saved", travelAnnualSaved.toString());
      localStorage.setItem("sukoon_mysukoon_featured_trip", JSON.stringify(featuredTrip));
      localStorage.setItem("sukoon_mysukoon_packing_list", JSON.stringify(packingList));
      localStorage.setItem("sukoon_mysukoon_bucket_list", JSON.stringify(bucketList));
      localStorage.setItem("sukoon_mysukoon_couple_hours", coupleHoursThisWeek.toString());
      localStorage.setItem("sukoon_mysukoon_next_date", nextDateNight);
      localStorage.setItem("sukoon_mysukoon_anniversary", specialAnniversary);
      localStorage.setItem("sukoon_mysukoon_intimacy_score", intimacyScore.toString());
      localStorage.setItem("sukoon_mysukoon_couple_goals", JSON.stringify(coupleGoals));
      localStorage.setItem("sukoon_mysukoon_memories", JSON.stringify(coupleMemories));
      localStorage.setItem("sukoon_mysukoon_heart_logs", JSON.stringify(heartLogs));
      localStorage.setItem("sukoon_mysukoon_kids_routines", JSON.stringify(kidsRoutines));
      localStorage.setItem("sukoon_mysukoon_kids_skills", JSON.stringify(kidsSkills));
      localStorage.setItem("sukoon_mysukoon_books", JSON.stringify(books));
      localStorage.setItem("sukoon_mysukoon_habits", JSON.stringify(habits));
      localStorage.setItem("sukoon_mysukoon_happiness", happinessScore.toString());
      localStorage.setItem("sukoon_mysukoon_pin", savedPin);
    } catch {}
  }, [
    assets,
    loans,
    insurance,
    emergencyTarget,
    emergencyCurrent,
    educationTarget,
    educationCurrent,
    travelAnnualTarget,
    travelAnnualSaved,
    featuredTrip,
    packingList,
    bucketList,
    coupleHoursThisWeek,
    nextDateNight,
    specialAnniversary,
    intimacyScore,
    coupleGoals,
    coupleMemories,
    heartLogs,
    kidsRoutines,
    kidsSkills,
    books,
    habits,
    happinessScore,
    savedPin,
  ]);

  // Derived Calculations
  const realEstateValuation = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.purchaseValue || 0), 0) || 27700000;
  }, [properties]);

  const propertyLoanBalance = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.loanBalance || 0), 0) || 4200000;
  }, [properties]);

  const totalFinancialAssets = useMemo(() => {
    return assets.reduce((sum, item) => sum + item.currentValue, 0);
  }, [assets]);

  const totalOtherLoans = useMemo(() => {
    return loans.reduce((sum, item) => sum + item.remainingBalance, 0);
  }, [loans]);

  const totalDebt = propertyLoanBalance + totalOtherLoans;
  const netFamilyWealth = realEstateValuation + totalFinancialAssets - totalDebt;

  const monthlyHomeEmi = 42000;
  const totalMonthlyEmi = monthlyHomeEmi + loans.reduce((sum, item) => sum + item.monthlyEmi, 0);

  // ==========================================
  // PIN & PRIVACY HANDLERS
  // ==========================================
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === savedPin) {
      setIsLoveLocked(false);
      setPinError("");
      setPinInput("");
      showToast("Life Sanctuary Unlocked");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPinInput("");
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinCandidate.length === 4) {
      setSavedPin(newPinCandidate);
      setShowPinChangeModal(false);
      setNewPinCandidate("");
      showToast("PIN Updated Successfully");
    }
  };

  // ==========================================
  // DYNAMIC MODAL OPENERS & SUBMIT HANDLERS
  // ==========================================

  // 1. ASSET MODAL
  const openAssetModal = (asset?: AssetEntry) => {
    if (asset) {
      setEditId(asset.id);
      setFormField1(asset.name);
      setFormField2(asset.category);
      setFormField3(asset.institutionOrDetails);
      setFormField4(asset.returnRate || "");
      setFormNumber1(asset.currentValue);
      setFormNumber2(asset.monthlyAddition || 0);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("Bank FD");
      setFormField3("");
      setFormField4("");
      setFormNumber1(250000);
      setFormNumber2(0);
    }
    setActiveModal("asset");
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === editId
            ? {
                ...a,
                name: formField1.trim(),
                category: formField2 as AssetEntry["category"],
                institutionOrDetails: formField3.trim() || "Active Asset",
                returnRate: formField4.trim() || undefined,
                currentValue: formNumber1,
                monthlyAddition: formNumber2 > 0 ? formNumber2 : undefined,
              }
            : a
        )
      );
      showToast("Asset updated successfully");
    } else {
      const newEntry: AssetEntry = {
        id: "ast-" + Date.now(),
        name: formField1.trim(),
        category: formField2 as AssetEntry["category"],
        institutionOrDetails: formField3.trim() || "Active Asset",
        returnRate: formField4.trim() || undefined,
        currentValue: formNumber1,
        monthlyAddition: formNumber2 > 0 ? formNumber2 : undefined,
      };
      setAssets([newEntry, ...assets]);
      showToast("New asset added to portfolio");
    }
    setActiveModal(null);
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    showToast("Asset removed");
  };

  // 2. LOAN MODAL
  const openLoanModal = (loan?: LoanEntry) => {
    if (loan) {
      setEditId(loan.id);
      setFormField1(loan.name);
      setFormField2(loan.type);
      setFormField3(loan.bank);
      setFormNumber1(loan.remainingBalance);
      setFormNumber2(loan.monthlyEmi);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("Car Loan");
      setFormField3("HDFC Bank");
      setFormNumber1(500000);
      setFormNumber2(15000);
    }
    setActiveModal("loan");
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setLoans((prev) =>
        prev.map((l) =>
          l.id === editId
            ? {
                ...l,
                name: formField1.trim(),
                type: formField2 as LoanEntry["type"],
                bank: formField3.trim(),
                remainingBalance: formNumber1,
                monthlyEmi: formNumber2,
              }
            : l
        )
      );
      showToast("Loan details updated");
    } else {
      const newLoan: LoanEntry = {
        id: "loan-" + Date.now(),
        name: formField1.trim(),
        type: formField2 as LoanEntry["type"],
        bank: formField3.trim(),
        totalAmount: formNumber1 * 1.2,
        remainingBalance: formNumber1,
        monthlyEmi: formNumber2,
        tenureRemainingMonths: 36,
      };
      setLoans([newLoan, ...loans]);
      showToast("New loan entry added");
    }
    setActiveModal(null);
  };

  const deleteLoan = (id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
    showToast("Loan removed");
  };

  // 3. INSURANCE MODAL
  const openInsuranceModal = (ins?: InsuranceEntry) => {
    if (ins) {
      setEditId(ins.id);
      setFormField1(ins.policyName);
      setFormField2(ins.type);
      setFormField3(ins.provider);
      setFormField4(ins.renewalDate);
      setFormField5(ins.coveredMembers);
      setFormNumber1(ins.sumAssured);
      setFormNumber2(ins.annualPremium);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("Medical / Health");
      setFormField3("Star Health");
      setFormField4("15 Dec 2027");
      setFormField5("Self & Family");
      setFormNumber1(2500000);
      setFormNumber2(28000);
    }
    setActiveModal("insurance");
  };

  const handleSaveInsurance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setInsurance((prev) =>
        prev.map((i) =>
          i.id === editId
            ? {
                ...i,
                policyName: formField1.trim(),
                type: formField2 as InsuranceEntry["type"],
                provider: formField3.trim(),
                renewalDate: formField4.trim(),
                coveredMembers: formField5.trim(),
                sumAssured: formNumber1,
                annualPremium: formNumber2,
              }
            : i
        )
      );
      showToast("Insurance updated");
    } else {
      const newIns: InsuranceEntry = {
        id: "ins-" + Date.now(),
        policyName: formField1.trim(),
        type: formField2 as InsuranceEntry["type"],
        provider: formField3.trim(),
        renewalDate: formField4.trim(),
        coveredMembers: formField5.trim(),
        sumAssured: formNumber1,
        annualPremium: formNumber2,
      };
      setInsurance([newIns, ...insurance]);
      showToast("New policy added");
    }
    setActiveModal(null);
  };

  const deleteInsurance = (id: string) => {
    setInsurance((prev) => prev.filter((i) => i.id !== id));
    showToast("Policy removed");
  };

  // 4. EMERGENCY & EDUCATION TARGET FUNDS MODAL
  const openTargetFundsModal = () => {
    setFormNumber1(emergencyCurrent);
    setFormNumber2(emergencyTarget);
    setFormField1(educationCurrent.toString());
    setFormField2(educationTarget.toString());
    setActiveModal("target_funds");
  };

  const handleSaveTargetFunds = (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyCurrent(formNumber1);
    setEmergencyTarget(formNumber2);
    setEducationCurrent(Number(formField1) || educationCurrent);
    setEducationTarget(Number(formField2) || educationTarget);
    showToast("Emergency & Education funds updated");
    setActiveModal(null);
  };

  // 5. FEATURED TRIP MODAL
  const openFeaturedTripModal = () => {
    setFormField1(featuredTrip.destination);
    setFormField2(featuredTrip.dates);
    setFormField3(featuredTrip.tag);
    setFormField4(featuredTrip.subtitle);
    setFormNumber1(featuredTrip.daysRemaining);
    setActiveModal("featured_trip");
  };

  const handleSaveFeaturedTrip = (e: React.FormEvent) => {
    e.preventDefault();
    setFeaturedTrip({
      destination: formField1.trim() || "Next Family Trip",
      dates: formField2.trim() || "Upcoming",
      tag: formField3.trim() || "Family Holiday",
      subtitle: formField4.trim() || "Fully Funded",
      daysRemaining: formNumber1 || 30,
    });
    showToast("Featured trip updated");
    setActiveModal(null);
  };

  // 6. PACKING LIST TASK ADD
  const handleAddPackingTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;
    const newTask: PackingItem = {
      id: "pk-" + Date.now(),
      task: formField1.trim(),
      done: false,
    };
    setPackingList([...packingList, newTask]);
    setFormField1("");
    setActiveModal(null);
    showToast("Task added to packing checklist");
  };

  const togglePackingTask = (id: string) => {
    setPackingList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deletePackingTask = (id: string) => {
    setPackingList((prev) => prev.filter((t) => t.id !== id));
    showToast("Checklist item removed");
  };

  // 7. BUCKET LIST TRIP MODAL
  const openBucketTripModal = (trip?: BucketListItem) => {
    if (trip) {
      setEditId(trip.id);
      setFormField1(trip.destination);
      setFormField2(trip.countryOrState);
      setFormField3(trip.category);
      setFormField4(trip.targetYear);
      setFormField5(trip.whySpecial);
      setFormNumber1(trip.estimatedBudget);
      setFormNumber2(trip.savedBudget);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("India");
      setFormField3("Domestic");
      setFormField4("2027");
      setFormField5("Unforgettable family memories.");
      setFormNumber1(250000);
      setFormNumber2(50000);
    }
    setActiveModal("bucket_trip");
  };

  const handleSaveBucketTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setBucketList((prev) =>
        prev.map((t) =>
          t.id === editId
            ? {
                ...t,
                destination: formField1.trim(),
                countryOrState: formField2.trim(),
                category: formField3 as BucketListItem["category"],
                targetYear: formField4.trim(),
                whySpecial: formField5.trim(),
                estimatedBudget: formNumber1,
                savedBudget: formNumber2,
              }
            : t
        )
      );
      showToast("Dream trip updated");
    } else {
      const newTrip: BucketListItem = {
        id: "trip-" + Date.now(),
        destination: formField1.trim(),
        countryOrState: formField2.trim(),
        category: formField3 as BucketListItem["category"],
        targetYear: formField4.trim(),
        whySpecial: formField5.trim(),
        estimatedBudget: formNumber1,
        savedBudget: formNumber2,
        gradientBg: "from-amber-800 via-orange-900 to-stone-900",
      };
      setBucketList([newTrip, ...bucketList]);
      showToast("Destination added to Bucket List");
    }
    setActiveModal(null);
  };

  const deleteBucketTrip = (id: string) => {
    setBucketList((prev) => prev.filter((t) => t.id !== id));
    showToast("Trip removed from bucket list");
  };

  // 8. COUPLE TIME MODAL
  const openCoupleTimeModal = () => {
    setFormNumber1(coupleHoursThisWeek);
    setFormField1(nextDateNight);
    setFormField2(specialAnniversary);
    setActiveModal("couple_time");
  };

  const handleSaveCoupleTime = (e: React.FormEvent) => {
    e.preventDefault();
    setCoupleHoursThisWeek(formNumber1);
    setNextDateNight(formField1.trim());
    setSpecialAnniversary(formField2.trim());
    showToast("Quality time schedule updated");
    setActiveModal(null);
  };

  // 9. COUPLE GOAL MODAL
  const openCoupleGoalModal = (goal?: CoupleGoal) => {
    if (goal) {
      setEditId(goal.id);
      setFormField1(goal.title);
      setFormField2(goal.category);
      setFormField3(goal.targetTime);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("Quality Time");
      setFormField3("Next Month");
    }
    setActiveModal("couple_goal");
  };

  const handleSaveCoupleGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setCoupleGoals((prev) =>
        prev.map((g) =>
          g.id === editId
            ? {
                ...g,
                title: formField1.trim(),
                category: formField2 as CoupleGoal["category"],
                targetTime: formField3.trim(),
              }
            : g
        )
      );
      showToast("Shared goal updated");
    } else {
      const newGoal: CoupleGoal = {
        id: "cg-" + Date.now(),
        title: formField1.trim(),
        category: formField2 as CoupleGoal["category"],
        targetTime: formField3.trim(),
        completed: false,
      };
      setCoupleGoals([newGoal, ...coupleGoals]);
      showToast("New shared goal added");
    }
    setActiveModal(null);
  };

  const toggleCoupleGoal = (id: string) => {
    setCoupleGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const deleteCoupleGoal = (id: string) => {
    setCoupleGoals((prev) => prev.filter((g) => g.id !== id));
    showToast("Goal removed");
  };

  // 10. COUPLE MEMORY MODAL
  const openMemoryModal = (mem?: CoupleMemory) => {
    if (mem) {
      setEditId(mem.id);
      setFormField1(mem.title);
      setFormField2(mem.date);
      setFormField3(mem.location);
      setFormField4(mem.note);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("Today");
      setFormField3("Indore");
      setFormField4("");
    }
    setActiveModal("couple_memory");
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setCoupleMemories((prev) =>
        prev.map((m) =>
          m.id === editId
            ? {
                ...m,
                title: formField1.trim(),
                date: formField2.trim(),
                location: formField3.trim(),
                note: formField4.trim(),
              }
            : m
        )
      );
      showToast("Memory updated");
    } else {
      const newMem: CoupleMemory = {
        id: "mem-" + Date.now(),
        title: formField1.trim(),
        date: formField2.trim(),
        location: formField3.trim(),
        note: formField4.trim() || "A precious moment etched in our life's quiet journey together.",
        gradientBg: "from-rose-950 via-rose-900 to-stone-900",
      };
      setCoupleMemories([newMem, ...coupleMemories]);
      showToast("Cherished memory saved");
    }
    setActiveModal(null);
  };

  const deleteMemory = (id: string) => {
    setCoupleMemories((prev) => prev.filter((m) => m.id !== id));
    showToast("Memory removed");
  };

  // 11. HEART LOG (UPS & DOWNS) MODAL
  const openHeartLogModal = () => {
    setFormField1("Shared Joy");
    setFormField2(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
    setFormField3("");
    setActiveModal("heart_log");
  };

  const handleSaveHeartLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField3.trim()) return;
    const newLog: HeartLog = {
      id: "hl-" + Date.now(),
      type: formField1 as HeartLog["type"],
      date: formField2.trim(),
      reflection: formField3.trim(),
    };
    setHeartLogs([newLog, ...heartLogs]);
    showToast("Reflection logged to private sanctuary");
    setActiveModal(null);
  };

  const deleteHeartLog = (id: string) => {
    setHeartLogs((prev) => prev.filter((l) => l.id !== id));
    showToast("Log entry removed");
  };

  // 12. KIDS ROUTINE MODAL
  const openKidRoutineModal = (routine?: KidsDailyRoutine) => {
    if (routine) {
      setEditId(routine.id);
      setFormField1(routine.title);
      setFormField2(routine.timeSlot);
      setFormField3(routine.category);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("Morning");
      setFormField3("Homework");
    }
    setActiveModal("kid_routine");
  };

  const handleSaveKidRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setKidsRoutines((prev) =>
        prev.map((r) =>
          r.id === editId
            ? {
                ...r,
                title: formField1.trim(),
                timeSlot: formField2 as KidsDailyRoutine["timeSlot"],
                category: formField3 as KidsDailyRoutine["category"],
              }
            : r
        )
      );
      showToast("Routine task updated");
    } else {
      const newRoutine: KidsDailyRoutine = {
        id: "kr-" + Date.now(),
        title: formField1.trim(),
        timeSlot: formField2 as KidsDailyRoutine["timeSlot"],
        category: formField3 as KidsDailyRoutine["category"],
        completed: false,
      };
      setKidsRoutines([...kidsRoutines, newRoutine]);
      showToast("New daily routine added");
    }
    setActiveModal(null);
  };

  const toggleKidRoutine = (id: string) => {
    setKidsRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const deleteKidRoutine = (id: string) => {
    setKidsRoutines((prev) => prev.filter((r) => r.id !== id));
    showToast("Task removed");
  };

  // 13. KIDS SKILL MODAL
  const openKidSkillModal = (skill?: KidsSkill) => {
    if (skill) {
      setEditId(skill.id);
      setFormField1(skill.hobbyName);
      setFormField2(skill.levelOrAcademy);
      setFormField3(skill.schedule);
      setFormField4(skill.childName);
      setFormNumber1(skill.progressPercent);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("Academy / Instructor");
      setFormField3("Mon, Wed, Fri");
      setFormField4(activeChild);
      setFormNumber1(60);
    }
    setActiveModal("kid_skill");
  };

  const handleSaveKidSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setKidsSkills((prev) =>
        prev.map((s) =>
          s.id === editId
            ? {
                ...s,
                hobbyName: formField1.trim(),
                levelOrAcademy: formField2.trim(),
                schedule: formField3.trim(),
                childName: formField4.trim(),
                progressPercent: formNumber1,
              }
            : s
        )
      );
      showToast("Hobby & Skill updated");
    } else {
      const newSkill: KidsSkill = {
        id: "ks-" + Date.now(),
        hobbyName: formField1.trim(),
        levelOrAcademy: formField2.trim(),
        schedule: formField3.trim(),
        childName: formField4.trim() || activeChild,
        progressPercent: formNumber1,
      };
      setKidsSkills([...kidsSkills, newSkill]);
      showToast("New skill academy registered");
    }
    setActiveModal(null);
  };

  const deleteKidSkill = (id: string) => {
    setKidsSkills((prev) => prev.filter((s) => s.id !== id));
    showToast("Skill removed");
  };

  // 14. KIDS ACADEMIC REPORT MODAL
  const openAcademicModal = () => {
    setFormField1(academicGrades.overallGrade);
    setFormField2(academicGrades.schoolName);
    setFormField3(academicGrades.teacherRemarks);
    setActiveModal("kid_academic");
  };

  const handleSaveAcademic = (e: React.FormEvent) => {
    e.preventDefault();
    setAcademicGrades({
      ...academicGrades,
      overallGrade: formField1.trim() || "A+",
      schoolName: formField2.trim() || "School",
      teacherRemarks: formField3.trim() || "Diligent and consistent progress.",
    });
    showToast("Academic report card updated");
    setActiveModal(null);
  };

  // 15. KIDS HEALTH & SCREEN TIME MODAL
  const openKidHealthModal = () => {
    setFormNumber1(kidsHealth.heightCm);
    setFormNumber2(kidsHealth.weightKg);
    setFormField1(kidsHealth.screenTimeMinutes.toString());
    setFormField2(kidsHealth.screenTimeLimit.toString());
    setFormField3(kidsHealth.bedtime);
    setActiveModal("kid_health");
  };

  const handleSaveKidHealth = (e: React.FormEvent) => {
    e.preventDefault();
    setKidsHealth({
      heightCm: formNumber1 || 134,
      weightKg: formNumber2 || 28,
      screenTimeMinutes: Number(formField1) || 30,
      screenTimeLimit: Number(formField2) || 45,
      bedtime: formField3.trim() || "8:30 PM",
    });
    showToast("Kids growth & health metrics updated");
    setActiveModal(null);
  };

  // 16. BOOK MODAL
  const openBookModal = (book?: ReadingBook) => {
    if (book) {
      setEditId(book.id);
      setFormField1(book.title);
      setFormField2(book.author);
      setFormNumber1(book.currentPage);
      setFormNumber2(book.totalPages);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("");
      setFormNumber1(1);
      setFormNumber2(250);
    }
    setActiveModal("book");
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === editId
            ? {
                ...b,
                title: formField1.trim(),
                author: formField2.trim(),
                currentPage: formNumber1,
                totalPages: formNumber2,
                status: formNumber1 >= formNumber2 ? "completed" : "reading",
              }
            : b
        )
      );
      showToast("Book progress updated");
    } else {
      const newBk: ReadingBook = {
        id: "bk-" + Date.now(),
        title: formField1.trim(),
        author: formField2.trim() || "Author",
        currentPage: formNumber1,
        totalPages: formNumber2,
        status: formNumber1 >= formNumber2 ? "completed" : "reading",
      };
      setBooks([newBk, ...books]);
      showToast("Book added to reading list");
    }
    setActiveModal(null);
  };

  const deleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    showToast("Book removed");
  };

  // 17. HABIT MODAL
  const openHabitModal = (habit?: PersonalHabit) => {
    if (habit) {
      setEditId(habit.id);
      setFormField1(habit.title);
      setFormField2(habit.frequency);
      setFormNumber1(habit.streakDays);
    } else {
      setEditId(null);
      setFormField1("");
      setFormField2("Daily");
      setFormNumber1(1);
    }
    setActiveModal("habit");
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField1.trim()) return;

    if (editId) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editId
            ? {
                ...h,
                title: formField1.trim(),
                frequency: formField2 as PersonalHabit["frequency"],
                streakDays: formNumber1,
              }
            : h
        )
      );
      showToast("Habit updated");
    } else {
      const newHabit: PersonalHabit = {
        id: "hb-" + Date.now(),
        title: formField1.trim(),
        frequency: formField2 as PersonalHabit["frequency"],
        completedToday: false,
        streakDays: formNumber1 || 1,
      };
      setHabits([...habits, newHabit]);
      showToast("New habit added to routine");
    }
    setActiveModal(null);
  };

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              completedToday: !h.completedToday,
              streakDays: !h.completedToday ? h.streakDays + 1 : Math.max(0, h.streakDays - 1),
            }
          : h
      )
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    showToast("Habit removed");
  };

  // 18. FITNESS & STEPS MODAL
  const openFitnessModal = () => {
    setFormNumber1(dailySteps);
    setFormNumber2(stepsGoal);
    setFormField1(weeklyWorkouts.toString());
    setActiveModal("fitness");
  };

  const handleSaveFitness = (e: React.FormEvent) => {
    e.preventDefault();
    setDailySteps(formNumber1);
    setStepsGoal(formNumber2);
    setWeeklyWorkouts(Number(formField1) || 4);
    showToast("Fitness progress updated");
    setActiveModal(null);
  };

  // Gratitude notes
  const handleAddGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGratitudeText.trim()) return;
    setGratitudeNotes([newGratitudeText.trim(), ...gratitudeNotes]);
    setNewGratitudeText("");
    showToast("Gratitude recorded");
  };

  const deleteGratitude = (index: number) => {
    setGratitudeNotes((prev) => prev.filter((_, i) => i !== index));
    showToast("Note removed");
  };

  // Reset to default sample data
  const handleResetDefaults = () => {
    if (confirm("Reset My Sukoon data back to the default curated sample data?")) {
      setAssets(DEFAULT_ASSETS);
      setLoans(DEFAULT_LOANS);
      setInsurance(DEFAULT_INSURANCE);
      setEmergencyTarget(600000);
      setEmergencyCurrent(480000);
      setEducationTarget(5000000);
      setEducationCurrent(1850000);
      setTravelAnnualTarget(350000);
      setTravelAnnualSaved(245000);
      setFeaturedTrip(DEFAULT_FEATURED_TRIP);
      setPackingList(DEFAULT_PACKING_LIST);
      setBucketList(DEFAULT_BUCKET_LIST);
      setCoupleGoals(DEFAULT_COUPLE_GOALS);
      setCoupleMemories(DEFAULT_MEMORIES);
      setHeartLogs(DEFAULT_HEART_LOGS);
      setKidsRoutines(DEFAULT_KIDS_ROUTINES);
      setKidsSkills(DEFAULT_KIDS_SKILLS);
      setBooks(DEFAULT_BOOKS);
      setHabits(DEFAULT_HABITS);
      setHappinessScore(88);
      showToast("Reset to sample data successfully");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen pb-32 text-foreground bg-canvas">
      {/* ========================================================================= */}
      {/* FLOATING TOAST NOTIFICATION */}
      {/* ========================================================================= */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1E5637] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check size={14} className="text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-md border-b border-line/60 px-4 py-3 flex items-center justify-between">
        {activePillar === null ? (
          <Link
            href="/"
            className="tap-scale inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:opacity-80 transition"
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setActivePillar(null)}
            className="tap-scale inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:opacity-80 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to My Sukoon</span>
          </button>
        )}

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8B82]">
            MY HAPPINESS · MY SUKOON
          </span>
          <span className="text-xs font-serif font-bold text-[#1B2922]">
            {activePillar === null
              ? "Life & Family Sanctuary"
              : activePillar === "finance"
              ? "Finance & Goals"
              : activePillar === "travel"
              ? "Holidays & Travel"
              : activePillar === "love"
              ? "Love & Life"
              : activePillar === "kids"
              ? "Kids & Growth"
              : "Self & Balance"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Lock / Unlock Status */}
          <button
            type="button"
            onClick={() => {
              if (!isLoveLocked) {
                setIsLoveLocked(true);
                showToast("Private Sanctuary Locked");
              } else {
                setActivePillar("love");
              }
            }}
            title={isLoveLocked ? "Private Sanctuary Locked" : "Click to Lock Private Life"}
            className={`tap-scale p-1.5 rounded-full border transition flex items-center gap-1 text-[11px] font-medium ${
              isLoveLocked
                ? "bg-white/80 border-[#E8E2D5] text-[#7C8B82] hover:text-forest"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {isLoveLocked ? <Lock size={14} /> : <Unlock size={14} className="text-emerald-700" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* LEVEL 1: FOLDER HUB VIEW (ONLY DISPLAYED WHEN NO PILLAR IS OPENED) */}
      {/* ========================================================================= */}
      {activePillar === null && (
        <div className="px-4 pt-4 space-y-5 animate-in fade-in duration-200">
          {/* SANCTUARY HERO GREETING BANNER */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1E5637] via-[#1B3D2F] to-[#0F291E] p-5 text-white shadow-xs">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-[10px] font-semibold text-emerald-100">
                  <Sparkles size={12} className="text-amber-300" />
                  <span>Life Harmony Folders</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  title="Reset sample values"
                  className="text-white/60 hover:text-white text-[10px] font-medium flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              </div>

              <h1 className="text-xl font-serif font-bold text-white tracking-tight mt-2">
                My Happiness, My Sukoon
              </h1>
              <p className="text-[12px] text-emerald-100/85 mt-1 leading-relaxed">
                Personalized life sanctuary for your wealth, holidays, relationship &amp; family growth.
              </p>

              {/* Quick KPI Bar */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-200/80">
                    Family Wealth
                  </span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {formatINR(netFamilyWealth)}
                  </span>
                </div>
                <div className="text-center border-x border-white/10">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-200/80">
                    Sukoon Index
                  </span>
                  <span className="text-sm font-bold text-amber-300 mt-0.5 block">
                    {happinessScore}% Serene
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-200/80">
                    Next Trip
                  </span>
                  <span className="text-sm font-bold text-white mt-0.5 block truncate px-1">
                    {featuredTrip.daysRemaining}d to go
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          <div>
            <h2 className="text-base font-serif font-bold text-[#1B2922]">5 Life Sanctuaries</h2>
            <p className="text-xs text-[#7C8B82] mt-0.5 leading-relaxed">
              Tap any folder below to enter its dedicated workspace.
            </p>
          </div>

          {/* 5 TACTILE SQUIRCLE FOLDER CARDS */}
          <div className="grid grid-cols-2 gap-3.5 pb-8">
            {/* Folder 1: Family Financial Planning */}
            <button
              type="button"
              onClick={() => setActivePillar("finance")}
              className="tap-scale group flex flex-col justify-between text-left p-4 rounded-3xl bg-white border border-[#E8E2D5] shadow-xs hover:border-[#1E5637]/50 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1E5637] border border-emerald-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Wallet size={22} />
                </div>
                <h3 className="text-xs font-bold text-[#1B2922] leading-snug">
                  Family Finance &amp; Goals
                </h3>
                <p className="text-[10px] text-[#7C8B82] mt-1 line-clamp-2">
                  Real Estate, FDs, Mutual Funds, Loans &amp; Insurance.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-line/40 flex items-center justify-between text-[10px] font-bold text-[#1E5637]">
                <span>{formatINR(netFamilyWealth)}</span>
                <ChevronRight size={12} />
              </div>
            </button>

            {/* Folder 2: Holiday & Travel Experiences */}
            <button
              type="button"
              onClick={() => setActivePillar("travel")}
              className="tap-scale group flex flex-col justify-between text-left p-4 rounded-3xl bg-white border border-[#E8E2D5] shadow-xs hover:border-amber-400/50 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Plane size={22} />
                </div>
                <h3 className="text-xs font-bold text-[#1B2922] leading-snug">
                  Holidays &amp; Travel
                </h3>
                <p className="text-[10px] text-[#7C8B82] mt-1 line-clamp-2">
                  Trip countdowns, vacation jar &amp; dream bucket list.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-line/40 flex items-center justify-between text-[10px] font-bold text-amber-700">
                <span>{featuredTrip.daysRemaining}d to go</span>
                <ChevronRight size={12} />
              </div>
            </button>

            {/* Folder 3: My Love My Life */}
            <button
              type="button"
              onClick={() => setActivePillar("love")}
              className="tap-scale group flex flex-col justify-between text-left p-4 rounded-3xl bg-white border border-[#E8E2D5] shadow-xs hover:border-rose-400/50 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform relative">
                  <Heart size={22} />
                  {isLoveLocked && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-700 text-white flex items-center justify-center text-[9px]">
                      <Lock size={9} />
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-[#1B2922] leading-snug">
                  My Love, My Life
                </h3>
                <p className="text-[10px] text-[#7C8B82] mt-1 line-clamp-2">
                  Quality time, couple goals, intimacy &amp; photo vault.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-line/40 flex items-center justify-between text-[10px] font-bold text-rose-700">
                <span>{isLoveLocked ? "Private Sanctuary" : "Unlocked"}</span>
                <ChevronRight size={12} />
              </div>
            </button>

            {/* Folder 4: Responsibilities Towards Kids */}
            <button
              type="button"
              onClick={() => setActivePillar("kids")}
              className="tap-scale group flex flex-col justify-between text-left p-4 rounded-3xl bg-white border border-[#E8E2D5] shadow-xs hover:border-blue-400/50 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Baby size={22} />
                </div>
                <h3 className="text-xs font-bold text-[#1B2922] leading-snug">
                  Kids &amp; Growth
                </h3>
                <p className="text-[10px] text-[#7C8B82] mt-1 line-clamp-2">
                  Daily homework, sports academies &amp; growth checks.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-line/40 flex items-center justify-between text-[10px] font-bold text-blue-700">
                <span>{kidsRoutines.filter((r) => r.completed).length}/{kidsRoutines.length} Done</span>
                <ChevronRight size={12} />
              </div>
            </button>

            {/* Folder 5: Work-Life Balance & Self Growth */}
            <button
              type="button"
              onClick={() => setActivePillar("self")}
              className="col-span-2 tap-scale group flex items-center justify-between text-left p-4 rounded-3xl bg-white border border-[#E8E2D5] shadow-xs hover:border-indigo-400/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Feather size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1B2922]">
                    Work-Life Balance &amp; Self Growth
                  </h3>
                  <p className="text-[10px] text-[#7C8B82] mt-0.5">
                    Personal health, reading desk, habits &amp; daily gratitude journal.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 shrink-0 ml-2">
                <span>{happinessScore}% Serene</span>
                <ChevronRight size={13} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: INSIDE THE FOLDER (SHOWS ONLY THE ACTIVE SANCTUARY) */}
      {/* ========================================================================= */}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="px-4 pt-4 space-y-6">

        {/* ####################################################################### */}
        {/* PILLAR 1: FAMILY FINANCIAL PLANNING */}
        {/* ####################################################################### */}
        {activePillar === "finance" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Philosophical Motto */}
            <div className="bg-sand/30 border border-[#E8E2D5] rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                  <Landmark size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1B2922]">Family Financial Freedom</h3>
                  <p className="text-[11px] text-[#7C8B82] leading-tight">
                    Manage savings, liquid assets, debt obligations &amp; family emergency buffers.
                  </p>
                </div>
              </div>
            </div>

            {/* Total Balance Sheet Card */}
            <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82]">
                    Total Family Balance Sheet
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#1B2922]">
                    {formatINR(netFamilyWealth)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => openAssetModal()}
                  className="tap-scale inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1E5637] text-white text-xs font-semibold shadow-xs hover:bg-[#164028] transition"
                >
                  <Plus size={14} /> Add Asset
                </button>
              </div>

              {/* Progress Bar of Gross Assets vs Loans */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#526359]">Gross Assets: {formatINR(realEstateValuation + totalFinancialAssets)}</span>
                  <span className="text-amber-800">Total Debt: {formatINR(totalDebt)}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#EFECE6] overflow-hidden flex">
                  <div
                    style={{
                      width: `${Math.min(100, Math.round((realEstateValuation / (realEstateValuation + totalFinancialAssets)) * 100))}%`,
                    }}
                    className="h-full bg-[#1E5637]"
                    title="Real Estate"
                  />
                  <div
                    style={{
                      width: `${Math.min(100, Math.round((totalFinancialAssets / (realEstateValuation + totalFinancialAssets)) * 100))}%`,
                    }}
                    className="h-full bg-emerald-400"
                    title="Liquid Assets"
                  />
                </div>
                <div className="flex items-center gap-4 text-[10px] font-semibold text-[#7C8B82] pt-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#1E5637]" /> Real Estate ({Math.round((realEstateValuation / (realEstateValuation + totalFinancialAssets)) * 100)}%)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Liquid &amp; FDs ({Math.round((totalFinancialAssets / (realEstateValuation + totalFinancialAssets)) * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-section 1: Savings & Assets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <PiggyBank size={16} className="text-forest" />
                  Savings &amp; Assets Portfolio
                </h3>
                <button
                  type="button"
                  onClick={() => openAssetModal()}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline"
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              {/* Real Estate synced from Vault */}
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-4 shadow-xs relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-1.5 py-0.5 rounded">
                        Auto-Synced from Vault
                      </div>
                      <h4 className="text-xs font-bold text-[#1B2922] mt-0.5">Real Estate Holdings</h4>
                      <p className="text-[11px] text-[#7C8B82]">
                        {properties.length} Properties in Indore (Vijay Nagar, Super Corridor, Omaxe)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-forest block">
                      {formatINR(realEstateValuation)}
                    </span>
                    <Link
                      href="/vault"
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#8C7A58] hover:underline"
                    >
                      View Vault <ChevronRight size={10} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Dynamic Assets List */}
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sand/60 text-[#1B2922] flex items-center justify-center shrink-0">
                      {asset.category === "Bank FD" && <Landmark size={15} />}
                      {asset.category === "Mutual Funds" && <TrendingUp size={15} />}
                      {asset.category === "Equity / Stocks" && <Wallet size={15} />}
                      {asset.category === "Car / Vehicle" && <Car size={15} />}
                      {asset.category === "Gold / Other" && <Sparkles size={15} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1B2922] leading-snug">{asset.name}</h4>
                      <p className="text-[10px] text-[#7C8B82]">
                        {asset.institutionOrDetails} {asset.returnRate ? `• ${asset.returnRate}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1B2922] block">
                        {formatINR(asset.currentValue)}
                      </span>
                      {asset.monthlyAddition && (
                        <span className="text-[9px] font-semibold text-emerald-700 block">
                          +{formatINR(asset.monthlyAddition)}/mo SIP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => openAssetModal(asset)}
                        title="Edit Asset"
                        className="p-1 hover:text-forest text-[#7C8B82]"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAsset(asset.id)}
                        title="Delete Asset"
                        className="p-1 hover:text-rose-700 text-[#7C8B82]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sub-section 2: Loan & EMI Management */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <CreditCard size={16} className="text-amber-800" />
                  Loan &amp; EMI Management
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-amber-800">
                    {formatINR(totalMonthlyEmi)}/mo
                  </span>
                  <button
                    type="button"
                    onClick={() => openLoanModal()}
                    className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              {/* Home Loan Card */}
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                      Linked to Vijay Nagar
                    </div>
                    <h4 className="text-xs font-bold text-[#1B2922] mt-0.5">Housing Finance EMI</h4>
                    <p className="text-[10px] text-[#7C8B82]">SBI Home Finance • 8.5% Floating</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#1B2922] block">₹42,000/mo</span>
                    <span className="text-[10px] text-[#7C8B82]">Bal: {formatINR(propertyLoanBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Other Loans */}
              {loans.map((loan) => (
                <div key={loan.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs flex items-center justify-between group">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded">
                      {loan.type}
                    </div>
                    <h4 className="text-xs font-bold text-[#1B2922] mt-0.5">{loan.name}</h4>
                    <p className="text-[10px] text-[#7C8B82]">
                      {loan.bank} • {loan.tenureRemainingMonths}m remaining
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1B2922] block">
                        {formatINR(loan.monthlyEmi)}/mo
                      </span>
                      <span className="text-[10px] text-[#7C8B82]">
                        Bal: {formatINR(loan.remainingBalance)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => openLoanModal(loan)}
                        title="Edit Loan"
                        className="p-1 hover:text-amber-800 text-[#7C8B82]"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLoan(loan.id)}
                        title="Delete Loan"
                        className="p-1 hover:text-rose-700 text-[#7C8B82]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sub-section 3: Insurance Portfolio */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-forest" />
                  Insurance Portfolio (Health, Term &amp; Accident)
                </h3>
                <button
                  type="button"
                  onClick={() => openInsuranceModal()}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline"
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {insurance.map((ins) => (
                  <div key={ins.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs flex items-center justify-between group">
                    <div>
                      <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-1.5 py-0.5 rounded">
                        {ins.type}
                      </div>
                      <h4 className="text-xs font-bold text-[#1B2922] mt-0.5">{ins.policyName}</h4>
                      <p className="text-[10px] text-[#7C8B82]">{ins.provider} • Renews {ins.renewalDate}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-forest block">
                          {formatINR(ins.sumAssured)} Cover
                        </span>
                        <span className="text-[9px] text-[#7C8B82]">
                          Prem: {formatINR(ins.annualPremium)}/yr
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => openInsuranceModal(ins)}
                          title="Edit Policy"
                          className="p-1 hover:text-forest text-[#7C8B82]"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteInsurance(ins.id)}
                          title="Delete Policy"
                          className="p-1 hover:text-rose-700 text-[#7C8B82]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section 4 & 5: Emergency Fund & Kids Education Target */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Target size={16} className="text-blue-700" />
                  Target Goal Funds
                </h3>
                <button
                  type="button"
                  onClick={openTargetFundsModal}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                  <Pencil size={12} /> Edit Targets
                </button>
              </div>

              {/* Emergency Fund Card */}
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-4 shadow-xs">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1B2922]">Emergency Health &amp; Crisis Fund</h4>
                      <p className="text-[10px] text-[#7C8B82]">Instant liquid buffer for unexpected expenses</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-forest">
                    {Math.round((emergencyCurrent / emergencyTarget) * 100)}% Funded
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden my-2">
                  <div
                    style={{ width: `${Math.min(100, (emergencyCurrent / emergencyTarget) * 100)}%` }}
                    className="h-full bg-[#1E5637] rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-[#526359]">
                  <span>Saved: {formatINR(emergencyCurrent)}</span>
                  <span>Target: {formatINR(emergencyTarget)}</span>
                </div>
              </div>

              {/* Kids Education Fund Card */}
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-4 shadow-xs">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1B2922]">Kids Higher Education Corpus</h4>
                      <p className="text-[10px] text-[#7C8B82]">College, university &amp; overseas study goal</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700">
                    {Math.round((educationCurrent / educationTarget) * 100)}% Funded
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden my-2">
                  <div
                    style={{ width: `${Math.min(100, (educationCurrent / educationTarget) * 100)}%` }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-[#526359]">
                  <span>Accumulated: {formatINR(educationCurrent)}</span>
                  <span>Goal: {formatINR(educationTarget)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ####################################################################### */}
        {/* PILLAR 2: HOLIDAY & TRAVEL EXPERIENCES */}
        {/* ####################################################################### */}
        {activePillar === "travel" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Philosophical Motto */}
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center shrink-0">
                <Compass size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1B2922]">Experiences Over Things</h3>
                <p className="text-[11px] text-[#7C8B82] leading-tight">
                  Travel bonds families and enriches the soul. Plan deliberately, fund steadily, and explore without financial guilt.
                </p>
              </div>
            </div>

            {/* Travel Budget & Savings Tracker */}
            <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82]">
                    Annual Vacation Savings Jar
                  </span>
                  <h3 className="text-lg font-bold text-[#1B2922]">
                    {formatINR(travelAnnualSaved)} <span className="text-xs font-normal text-[#7C8B82]">of {formatINR(travelAnnualTarget)}</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormNumber1(travelAnnualSaved);
                    setFormNumber2(travelAnnualTarget);
                    setActiveModal("travel_budget");
                  }}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 hover:bg-amber-100"
                >
                  <Pencil size={11} /> Edit Budget
                </button>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#EFECE6] overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (travelAnnualSaved / travelAnnualTarget) * 100)}%` }}
                  className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full"
                />
              </div>
              <p className="text-[11px] text-[#7C8B82] mt-2">
                Automated monthly vacation jar funds your family holidays smoothly without dipping into long-term wealth.
              </p>
            </div>

            {/* Active Next Trip on Mind */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Luggage size={16} className="text-amber-700" />
                  Next Trip on Mind (Featured Itinerary)
                </h3>
                <button
                  type="button"
                  onClick={openFeaturedTripModal}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                >
                  <Pencil size={12} /> Edit Trip
                </button>
              </div>

              {/* Styled Scenic Featured Card (Self-contained, gradient fallback so never broken) */}
              <div className="bg-white rounded-3xl border border-[#E8E2D5] overflow-hidden shadow-xs">
                <div className="relative h-44 w-full bg-linear-to-br from-teal-900 via-emerald-900 to-stone-900 p-5 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      {featuredTrip.tag}
                    </span>
                    <span className="text-xs font-bold text-white bg-amber-600 px-2.5 py-0.5 rounded-full shadow-xs">
                      {featuredTrip.daysRemaining} Days To Go
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold font-serif text-white tracking-tight">
                      {featuredTrip.destination}
                    </h4>
                    <p className="text-xs text-white/85 mt-0.5">
                      {featuredTrip.dates} • {featuredTrip.subtitle}
                    </p>
                  </div>
                </div>

                {/* Pre-Departure Checklist */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#1B2922] pb-2 border-b border-line/40">
                    <span>Pre-Departure Checklist</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormField1("");
                        setActiveModal("new_task");
                      }}
                      className="tap-scale inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      <Plus size={12} /> Add Task
                    </button>
                  </div>

                  <div className="space-y-2">
                    {packingList.map((item) => (
                      <div key={item.id} className="flex items-center justify-between group">
                        <button
                          type="button"
                          onClick={() => togglePackingTask(item.id)}
                          className="flex items-center gap-2.5 text-left text-xs text-[#526359] hover:text-[#1B2922] transition flex-1"
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                              item.done
                                ? "bg-amber-600 border-amber-600 text-white"
                                : "border-[#C9C3B5] bg-white"
                            }`}
                          >
                            {item.done && <CheckSquare size={12} />}
                          </div>
                          <span className={item.done ? "line-through text-[#7C8B82]" : "font-medium text-[#1B2922]"}>
                            {item.task}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePackingTask(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#7C8B82] hover:text-rose-700 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Bucket List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Palmtree size={16} className="text-amber-700" />
                  Family Travel Bucket List
                </h3>
                <button
                  type="button"
                  onClick={() => openBucketTripModal()}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  <Plus size={14} /> Add Dream Trip
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {bucketList.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-[#E8E2D5] overflow-hidden shadow-xs flex group">
                    {/* Visual Stylized Gradient Badge */}
                    <div className={`w-28 shrink-0 bg-linear-to-br ${item.gradientBg} p-3 flex flex-col justify-between text-white`}>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold leading-tight">
                        {item.targetYear}
                      </span>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#1B2922] leading-snug">{item.destination}</h4>
                          <span className="text-xs font-bold text-[#1B2922]">
                            {formatINR(item.estimatedBudget)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7C8B82] line-clamp-1 mt-0.5">{item.whySpecial}</p>
                      </div>

                      <div className="pt-2">
                        <div className="flex items-center justify-between text-[10px] text-[#7C8B82] mb-1">
                          <span>Saved: {formatINR(item.savedBudget)}</span>
                          <span className="font-semibold text-amber-700">
                            {Math.round((item.savedBudget / item.estimatedBudget) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (item.savedBudget / item.estimatedBudget) * 100)}%` }}
                            className="h-full bg-amber-600 rounded-full"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/30 mt-2 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openBucketTripModal(item)}
                          className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-0.5"
                        >
                          <Pencil size={10} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBucketTrip(item.id)}
                          className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ####################################################################### */}
        {/* PILLAR 3: MY LOVE MY LIFE (RELATIONSHIP & PARTNERSHIP) */}
        {/* ####################################################################### */}
        {activePillar === "love" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* If Locked, Show Discreet Privacy PIN Gate */}
            {isLoveLocked ? (
              <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto shadow-2xs">
                  <Lock size={26} />
                </div>

                <div>
                  <h3 className="text-base font-serif font-bold text-[#1B2922]">
                    Private Relationship Sanctuary
                  </h3>
                  <p className="text-xs text-[#7C8B82] max-w-xs mx-auto mt-1 leading-relaxed">
                    Couple memories, intimacy, and shared reflections are protected with your private PIN so you can comfortably show properties around others.
                  </p>
                </div>

                {/* PIN Input Form */}
                <form onSubmit={handlePinSubmit} className="max-w-xs mx-auto space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••"
                      className="w-32 text-center tracking-[0.5em] text-lg font-bold py-2 rounded-xl border border-[#C9C3B5] bg-canvas focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      type="submit"
                      className="tap-scale px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold shadow-xs hover:bg-rose-800 transition"
                    >
                      Unlock
                    </button>
                  </div>

                  {pinError && <p className="text-[11px] text-rose-600 font-semibold">{pinError}</p>}

                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoveLocked(false);
                        showToast("Unlocked via Instant Biometric Demo");
                      }}
                      className="text-[11px] font-semibold text-[#8C7A58] hover:underline"
                    >
                      Instant Review Unlock (Face ID Demo)
                    </button>
                  </div>
                  <p className="text-[10px] text-[#7C8B82]">Default PIN is 1234</p>
                </form>
              </div>
            ) : (
              /* UNLOCKED STATE: Full Relationship Sanctuary */
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header Lock Banner */}
                <div className="bg-rose-50/70 border border-rose-200/60 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <Heart size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#1B2922]">My Love, My Life</h3>
                      <p className="text-[10px] text-[#7C8B82]">Growing Stronger Together Every Day</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewPinCandidate("");
                        setShowPinChangeModal(true);
                      }}
                      className="text-[10px] font-semibold text-[#7C8B82] hover:text-[#1B2922]"
                    >
                      Change PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoveLocked(true);
                        showToast("Private Sanctuary Locked");
                      }}
                      className="tap-scale inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-white px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs hover:bg-rose-50"
                    >
                      <Lock size={12} /> Lock Now
                    </button>
                  </div>
                </div>

                {/* Sub-section 1: Time with Better Half */}
                <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82]">
                        Quality Time Tracker
                      </span>
                      <h4 className="text-sm font-bold text-[#1B2922]">Dedicated Couple Time This Week</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        {coupleHoursThisWeek} Hours Logged
                      </span>
                      <button
                        type="button"
                        onClick={openCoupleTimeModal}
                        className="text-[#7C8B82] hover:text-rose-700 p-1"
                        title="Edit couple time & dates"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-sand/30 rounded-2xl p-3 border border-[#E8E2D5]">
                      <span className="text-[10px] font-bold uppercase text-[#7C8B82] block">Next Date Night</span>
                      <span className="text-xs font-bold text-[#1B2922] mt-0.5 block">{nextDateNight}</span>
                    </div>
                    <div className="bg-sand/30 rounded-2xl p-3 border border-[#E8E2D5]">
                      <span className="text-[10px] font-bold uppercase text-[#7C8B82] block">Anniversary / Milestone</span>
                      <span className="text-xs font-bold text-rose-700 mt-0.5 block">{specialAnniversary}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-section 2: Communication & Shared Goals */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                      <Sparkles size={16} className="text-rose-700" />
                      Shared Life Visions &amp; Goals
                    </h3>
                    <button
                      type="button"
                      onClick={() => openCoupleGoalModal()}
                      className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline"
                    >
                      <Plus size={13} /> Add Goal
                    </button>
                  </div>

                  <div className="space-y-2">
                    {coupleGoals.map((cg) => (
                      <div key={cg.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3 shadow-xs flex items-center justify-between group">
                        <button
                          type="button"
                          onClick={() => toggleCoupleGoal(cg.id)}
                          className="flex items-center gap-2.5 text-left flex-1"
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border transition ${
                              cg.completed ? "bg-rose-700 border-rose-700 text-white" : "border-[#C9C3B5]"
                            }`}
                          >
                            {cg.completed && <CheckSquare size={10} />}
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${cg.completed ? "line-through text-[#7C8B82]" : "text-[#1B2922]"}`}>
                              {cg.title}
                            </h4>
                            <p className="text-[10px] text-[#7C8B82]">{cg.category} • {cg.targetTime}</p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => openCoupleGoalModal(cg)}
                            className="p-1 hover:text-rose-700 text-[#7C8B82]"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCoupleGoal(cg.id)}
                            className="p-1 hover:text-rose-700 text-[#7C8B82]"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-section 3: Memories to Cherish */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                      <Camera size={16} className="text-rose-700" />
                      Memories to Cherish
                    </h3>
                    <button
                      type="button"
                      onClick={() => openMemoryModal()}
                      className="tap-scale inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800"
                    >
                      <Plus size={14} /> Add Memory
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {coupleMemories.map((mem) => (
                      <div key={mem.id} className="bg-white rounded-3xl border border-[#E8E2D5] overflow-hidden shadow-xs group">
                        <div className={`h-28 w-full bg-linear-to-br ${mem.gradientBg} p-4 flex flex-col justify-end text-white`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                            {mem.date} • {mem.location}
                          </span>
                          <h4 className="text-sm font-bold">{mem.title}</h4>
                        </div>
                        <div className="p-3.5 flex items-start justify-between">
                          <p className="text-xs text-[#526359] italic leading-relaxed flex-1">
                            &ldquo;{mem.note}&rdquo;
                          </p>
                          <div className="flex items-center gap-1 ml-2 opacity-70 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => openMemoryModal(mem)}
                              className="p-1 text-[#7C8B82] hover:text-rose-700"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMemory(mem.id)}
                              className="p-1 text-[#7C8B82] hover:text-rose-700"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-section 4 & 5: Intimacy Space & Ups/Downs */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                    <Heart size={16} className="text-rose-700" />
                    Emotional &amp; Physical Intimacy Wellness
                  </h3>

                  <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#1B2922]">Intimacy &amp; Open Communication Wellness</span>
                      <span className="text-rose-700 font-bold">{intimacyScore}% Deep Alignment</span>
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={intimacyScore}
                      onChange={(e) => setIntimacyScore(Number(e.target.value))}
                      className="w-full accent-rose-700 h-2 bg-[#EFECE6] rounded-lg cursor-pointer"
                    />

                    <p className="text-[11px] text-[#7C8B82] leading-relaxed">
                      Maintaining affection, emotional vulnerability, listening without judgment, and regular closeness keeps the marriage rooted in peace.
                    </p>
                  </div>

                  {/* Ups & Downs Reflection Journal */}
                  <div className="bg-sand/30 rounded-3xl border border-[#E8E2D5] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1B2922]">Navigating Ups &amp; Downs Together</h4>
                      <button
                        type="button"
                        onClick={openHeartLogModal}
                        className="tap-scale inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:underline"
                      >
                        <Plus size={12} /> Log Reflection
                      </button>
                    </div>

                    <div className="space-y-2">
                      {heartLogs.map((log) => (
                        <div key={log.id} className="bg-white rounded-2xl p-3 border border-[#E8E2D5] shadow-2xs group flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-rose-800 mb-1">
                              <span>{log.type}</span>
                              <span className="text-[#7C8B82] font-normal">{log.date}</span>
                            </div>
                            <p className="text-xs text-[#526359] leading-relaxed">{log.reflection}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteHeartLog(log.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#7C8B82] hover:text-rose-700 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ####################################################################### */}
        {/* PILLAR 4: RESPONSIBILITIES TOWARDS KIDS */}
        {/* ####################################################################### */}
        {activePillar === "kids" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Philosophical Motto */}
            <div className="bg-blue-50/70 border border-blue-200/60 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center shrink-0">
                <Baby size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1B2922]">Nurturing the Next Generation</h3>
                <p className="text-[11px] text-[#7C8B82] leading-tight">
                  Channelizing energy in positive directions, balancing academic rigor with joyful hobbies, and mentoring lifelong values.
                </p>
              </div>
            </div>

            {/* Child Selector Tabs */}
            <div className="flex items-center gap-2">
              {childrenList.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setActiveChild(ch)}
                  className={`tap-scale px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                    activeChild === ch
                      ? "bg-[#0284C7] text-white shadow-xs"
                      : "bg-white text-[#526359] border border-[#E8E2D5]"
                  }`}
                >
                  <span>{ch}</span>
                </button>
              ))}
            </div>

            {/* Sub-section 1: Homework & Daily Routine */}
            <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82]">
                    Daily School &amp; Growth Routine
                  </span>
                  <h3 className="text-sm font-bold text-[#1B2922]">Today&apos;s Checklist ({activeChild})</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {kidsRoutines.filter((r) => r.completed).length}/{kidsRoutines.length} Done
                  </span>
                  <button
                    type="button"
                    onClick={() => openKidRoutineModal()}
                    className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {kidsRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#E8E2D5] bg-sand/20 group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleKidRoutine(routine.id)}
                      className="flex items-center gap-2.5 text-left flex-1"
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                          routine.completed
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-[#C9C3B5] bg-white"
                        }`}
                      >
                        {routine.completed && <CheckSquare size={12} />}
                      </div>
                      <span className={`text-xs font-medium ${routine.completed ? "line-through text-[#7C8B82]" : "text-[#1B2922]"}`}>
                        {routine.title}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#7C8B82] uppercase tracking-wider">
                        {routine.timeSlot}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                        <button
                          type="button"
                          onClick={() => openKidRoutineModal(routine)}
                          className="p-1 text-[#7C8B82] hover:text-blue-700"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteKidRoutine(routine.id)}
                          className="p-1 text-[#7C8B82] hover:text-rose-700"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section 2: Skill Development & Hobbies */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Award size={16} className="text-blue-700" />
                  Skill Development &amp; Hobbies
                </h3>
                <button
                  type="button"
                  onClick={() => openKidSkillModal()}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                  <Plus size={13} /> Add Hobby
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {kidsSkills.map((skill) => (
                  <div key={skill.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs group">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          {skill.childName}
                        </div>
                        <h4 className="text-xs font-bold text-[#1B2922] mt-1">{skill.hobbyName}</h4>
                        <p className="text-[10px] text-[#7C8B82]">{skill.levelOrAcademy} • {skill.schedule}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700">{skill.progressPercent}% Mastery</span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openKidSkillModal(skill)}
                            className="p-1 text-[#7C8B82] hover:text-blue-700"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteKidSkill(skill.id)}
                            className="p-1 text-[#7C8B82] hover:text-rose-700"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden mt-2">
                      <div style={{ width: `${skill.progressPercent}%` }} className="h-full bg-blue-600 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section 3: Tuition & Academic Performance Check */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <BookOpen size={16} className="text-blue-700" />
                  Tuition &amp; Academic Performance Check
                </h3>
                <button
                  type="button"
                  onClick={openAcademicModal}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                  <Pencil size={12} /> Edit Report
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-[#E8E2D5] p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-line/40 text-xs">
                  <span className="font-bold text-[#1B2922]">{academicGrades.schoolName}</span>
                  <span className="font-bold text-emerald-700">Overall: {academicGrades.overallGrade}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  {academicGrades.subjects.map((sub, i) => (
                    <div key={i} className="bg-sand/30 p-2 rounded-xl">
                      <span className="text-[10px] text-[#7C8B82] block truncate">{sub.subject}</span>
                      <span className="text-xs font-bold text-[#1B2922]">{sub.score} / 100</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#526359] italic pt-1">
                  Teacher note: &ldquo;{academicGrades.teacherRemarks}&rdquo;
                </p>
              </div>
            </div>

            {/* Sub-section 4 & 5: Health & Screen Time */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Clock size={16} className="text-blue-700" />
                  Health &amp; Routine Monitoring
                </h3>
                <button
                  type="button"
                  onClick={openKidHealthModal}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                  <Pencil size={12} /> Edit Metrics
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82] block">
                    Growth &amp; Pediatric Log
                  </span>
                  <span className="text-sm font-bold text-[#1B2922] mt-1 block">
                    {kidsHealth.heightCm} cm • {kidsHealth.weightKg} kg
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Healthy Growth Percentile</span>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82] block">
                    Screen Time Today
                  </span>
                  <span className="text-sm font-bold text-[#1B2922] mt-1 block">
                    {kidsHealth.screenTimeMinutes}m / {kidsHealth.screenTimeLimit}m
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                    Bedtime {kidsHealth.bedtime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ####################################################################### */}
        {/* PILLAR 5: PERSONAL WORK-LIFE BALANCE & SELF GROWTH */}
        {/* ####################################################################### */}
        {activePillar === "self" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Philosophical Motto */}
            <div className="bg-indigo-50/70 border border-indigo-200/60 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0">
                <Feather size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1B2922]">Inner Sukoon &amp; Self Actualization</h3>
                <p className="text-[11px] text-[#7C8B82] leading-tight">
                  You cannot pour from an empty cup. Nurture your personal health, feed your intellect, and celebrate daily gratitude.
                </p>
              </div>
            </div>

            {/* Happiness Index Score Gauge */}
            <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82]">
                    Daily Sukoon Index
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#1B2922]">
                    {happinessScore} / 100 <span className="text-xs font-normal text-emerald-700 font-sans font-semibold">• Serene &amp; Grounded</span>
                  </h3>
                </div>
                <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  {happinessScore}
                </div>
              </div>

              <div className="space-y-1.5">
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={happinessScore}
                  onChange={(e) => setHappinessScore(Number(e.target.value))}
                  className="w-full accent-emerald-700 h-2 bg-[#EFECE6] rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[#7C8B82] font-semibold">
                  <span>Stressed</span>
                  <span>Balanced</span>
                  <span>Peaceful (Sukoon)</span>
                </div>
              </div>
            </div>

            {/* Sub-section 1: Personal Health & Fitness */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Activity size={16} className="text-indigo-600" />
                  Health &amp; Wellness Routines
                </h3>
                <button
                  type="button"
                  onClick={openFitnessModal}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline"
                >
                  <Pencil size={12} /> Edit Metrics
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[#7C8B82] block">Daily Steps</span>
                  <span className="text-base font-bold text-[#1B2922] mt-0.5 block">{dailySteps.toLocaleString()}</span>
                  <span className="text-[10px] text-[#526359] block">Goal: {stepsGoal.toLocaleString()}</span>
                  <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden mt-2">
                    <div style={{ width: `${Math.min(100, (dailySteps / stepsGoal) * 100)}%` }} className="h-full bg-indigo-600 rounded-full" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[#7C8B82] block">Weekly Workouts</span>
                  <span className="text-base font-bold text-[#1B2922] mt-0.5 block">{weeklyWorkouts} of 5 Days</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Consistent Streak</span>
                  <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden mt-2">
                    <div style={{ width: `${Math.min(100, (weeklyWorkouts / 5) * 100)}%` }} className="h-full bg-emerald-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-section 2: Reading List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Book size={16} className="text-indigo-600" />
                  Self Growth &amp; Reading
                </h3>
                <button
                  type="button"
                  onClick={() => openBookModal()}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline"
                >
                  <Plus size={13} /> Add Book
                </button>
              </div>

              <div className="space-y-2.5">
                {books.map((book) => (
                  <div key={book.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs flex items-center justify-between group">
                    <div>
                      <h4 className="text-xs font-bold text-[#1B2922]">{book.title}</h4>
                      <p className="text-[10px] text-[#7C8B82]">{book.author} • Page {book.currentPage} of {book.totalPages}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-700 block">
                          {Math.round((book.currentPage / book.totalPages) * 100)}%
                        </span>
                        <span className="text-[9px] uppercase font-bold text-[#7C8B82]">
                          {book.status === "completed" ? "Done" : "Reading"}
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openBookModal(book)}
                          className="p-1 text-[#7C8B82] hover:text-indigo-700"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBook(book.id)}
                          className="p-1 text-[#7C8B82] hover:text-rose-700"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section 3: Personal Habits & Streaks */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Target size={16} className="text-indigo-600" />
                  Personal Habits &amp; Hobbies
                </h3>
                <button
                  type="button"
                  onClick={() => openHabitModal()}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline"
                >
                  <Plus size={13} /> Add Habit
                </button>
              </div>

              <div className="space-y-2">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-[#E8E2D5] bg-white shadow-2xs group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleHabit(habit.id)}
                      className="flex items-center gap-2.5 text-left flex-1"
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                          habit.completedToday
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-[#C9C3B5] bg-white"
                        }`}
                      >
                        {habit.completedToday && <CheckSquare size={12} />}
                      </div>
                      <span className={`text-xs font-medium ${habit.completedToday ? "line-through text-[#7C8B82]" : "text-[#1B2922]"}`}>
                        {habit.title}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {habit.streakDays}d Streak
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openHabitModal(habit)}
                          className="p-1 text-[#7C8B82] hover:text-indigo-700"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHabit(habit.id)}
                          className="p-1 text-[#7C8B82] hover:text-rose-700"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section 4: Daily Gratitude Journal */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                <Sparkle size={16} className="text-amber-600" />
                Daily Gratitude Journal (3 Things I Am Thankful For)
              </h3>

              <div className="bg-sand/30 rounded-3xl border border-[#E8E2D5] p-4 space-y-3">
                <form onSubmit={handleAddGratitude} className="flex gap-2">
                  <input
                    type="text"
                    value={newGratitudeText}
                    onChange={(e) => setNewGratitudeText(e.target.value)}
                    placeholder="Today I am grateful for..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#C9C3B5] bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                  <button
                    type="submit"
                    className="tap-scale px-3 py-2 rounded-xl bg-forest text-white text-xs font-semibold hover:opacity-90 transition"
                  >
                    Add
                  </button>
                </form>

                <div className="space-y-2">
                  {gratitudeNotes.map((g, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-2.5 border border-[#E8E2D5] text-xs text-[#526359] flex items-start justify-between shadow-2xs group">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-amber-600 font-bold">✨</span>
                        <p className="leading-relaxed">{g}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteGratitude(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#7C8B82] hover:text-rose-700 transition ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* UNIVERSAL MODAL SYSTEM */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 border border-[#E8E2D5] shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-line/60">
              <h3 className="text-sm font-bold text-[#1B2922]">
                {activeModal === "asset" && (editId ? "Edit Asset" : "Add Financial Asset")}
                {activeModal === "loan" && (editId ? "Edit Loan & EMI" : "Add Loan & EMI")}
                {activeModal === "insurance" && (editId ? "Edit Insurance Policy" : "Add Insurance Policy")}
                {activeModal === "target_funds" && "Edit Emergency & Education Targets"}
                {activeModal === "travel_budget" && "Edit Vacation Savings Budget"}
                {activeModal === "featured_trip" && "Edit Featured Itinerary"}
                {activeModal === "new_task" && "Add Pre-Departure Task"}
                {activeModal === "bucket_trip" && (editId ? "Edit Bucket List Trip" : "Add Dream Destination")}
                {activeModal === "couple_time" && "Edit Quality Time & Dates"}
                {activeModal === "couple_goal" && (editId ? "Edit Shared Goal" : "Add Shared Goal")}
                {activeModal === "couple_memory" && (editId ? "Edit Cherished Memory" : "Add Couple Memory")}
                {activeModal === "heart_log" && "Log Private Couple Reflection"}
                {activeModal === "kid_routine" && (editId ? "Edit Routine Task" : "Add Kid Routine Task")}
                {activeModal === "kid_skill" && (editId ? "Edit Skill Mastery" : "Add Kid Skill Academy")}
                {activeModal === "kid_academic" && "Edit Academic Mid-Term Report"}
                {activeModal === "kid_health" && "Edit Kids Growth & Routine Limits"}
                {activeModal === "book" && (editId ? "Edit Book Progress" : "Add Reading Book")}
                {activeModal === "habit" && (editId ? "Edit Habit & Streak" : "Add Personal Habit")}
                {activeModal === "fitness" && "Edit Daily Steps & Workout Goals"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. ASSET FORM */}
            {activeModal === "asset" && (
              <form onSubmit={handleSaveAsset} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Asset Category</label>
                  <select
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  >
                    <option value="Bank FD">Bank FD (Fixed Deposit)</option>
                    <option value="Mutual Funds">Mutual Funds (SIP / Lumpsum)</option>
                    <option value="Equity / Stocks">Direct Equity / Demat</option>
                    <option value="Car / Vehicle">Car / Automobile</option>
                    <option value="Gold / Other">Gold Sovereign / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Asset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Liquidity FD or Nifty 50 Index"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Institution / Details</label>
                  <input
                    type="text"
                    placeholder="e.g. SBI Bank or Zerodha"
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Current Valuation (₹)</label>
                  <input
                    type="number"
                    required
                    value={formNumber1 || ""}
                    onChange={(e) => setFormNumber1(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Monthly SIP Addition (₹) Optional</label>
                  <input
                    type="number"
                    value={formNumber2 || ""}
                    onChange={(e) => setFormNumber2(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-forest text-white text-xs font-semibold shadow-xs">Save</button>
                </div>
              </form>
            )}

            {/* 2. LOAN FORM */}
            {activeModal === "loan" && (
              <form onSubmit={handleSaveLoan} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Loan Type</label>
                  <select
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  >
                    <option value="Home Loan">Home Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Education Loan">Education Loan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Loan / Asset Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Car EMI or Personal Loan"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Financing Bank</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Auto Finance"
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Remaining Outstanding Balance (₹)</label>
                  <input
                    type="number"
                    required
                    value={formNumber1 || ""}
                    onChange={(e) => setFormNumber1(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Monthly EMI Outflow (₹)</label>
                  <input
                    type="number"
                    required
                    value={formNumber2 || ""}
                    onChange={(e) => setFormNumber2(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold shadow-xs">Save Loan</button>
                </div>
              </form>
            )}

            {/* 3. INSURANCE FORM */}
            {activeModal === "insurance" && (
              <form onSubmit={handleSaveInsurance} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Policy Type</label>
                  <select
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  >
                    <option value="Medical / Health">Medical / Health Floater</option>
                    <option value="Term Life Plan">Term Life Cover</option>
                    <option value="Personal Accident">Personal Accident &amp; Critical Care</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Policy Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Optima Secure Health"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Insurance Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Ergo or ICICI Prudential"
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Sum Assured (₹)</label>
                    <input
                      type="number"
                      required
                      value={formNumber1 || ""}
                      onChange={(e) => setFormNumber1(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Annual Premium (₹)</label>
                    <input
                      type="number"
                      required
                      value={formNumber2 || ""}
                      onChange={(e) => setFormNumber2(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Renewal Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Oct 2027"
                    value={formField4}
                    onChange={(e) => setFormField4(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-forest text-white text-xs font-semibold shadow-xs">Save Policy</button>
                </div>
              </form>
            )}

            {/* 4. TARGET FUNDS (EMERGENCY & EDUCATION) */}
            {activeModal === "target_funds" && (
              <form onSubmit={handleSaveTargetFunds} className="space-y-3">
                <div className="p-3 bg-sand/30 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-[#1B2922] block">Emergency Crisis Buffer</span>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Current Saved (₹)</label>
                    <input
                      type="number"
                      value={formNumber1 || ""}
                      onChange={(e) => setFormNumber1(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-white text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Target Buffer (₹)</label>
                    <input
                      type="number"
                      value={formNumber2 || ""}
                      onChange={(e) => setFormNumber2(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-white text-[#1B2922]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-blue-900 block">Kids Higher Education Corpus</span>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Accumulated Amount (₹)</label>
                    <input
                      type="number"
                      value={formField1}
                      onChange={(e) => setFormField1(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-white text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Target College Goal (₹)</label>
                    <input
                      type="number"
                      value={formField2}
                      onChange={(e) => setFormField2(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-white text-[#1B2922]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-xs">Save Targets</button>
                </div>
              </form>
            )}

            {/* 5. TRAVEL BUDGET MODAL */}
            {activeModal === "travel_budget" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setTravelAnnualSaved(formNumber1);
                  setTravelAnnualTarget(formNumber2);
                  showToast("Vacation budget jar updated");
                  setActiveModal(null);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Currently Saved in Vacation Jar (₹)</label>
                  <input
                    type="number"
                    value={formNumber1 || ""}
                    onChange={(e) => setFormNumber1(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Annual Vacation Target (₹)</label>
                  <input
                    type="number"
                    value={formNumber2 || ""}
                    onChange={(e) => setFormNumber2(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xs">Update Budget</button>
                </div>
              </form>
            )}

            {/* 6. FEATURED TRIP MODAL */}
            {activeModal === "featured_trip" && (
              <form onSubmit={handleSaveFeaturedTrip} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Destination Name</label>
                  <input
                    type="text"
                    required
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Travel Dates</label>
                  <input
                    type="text"
                    placeholder="e.g. 24 Dec 2026 – 30 Dec 2026"
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Holiday Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Winter Holiday"
                      value={formField3}
                      onChange={(e) => setFormField3(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Days Remaining</label>
                    <input
                      type="number"
                      value={formNumber1 || ""}
                      onChange={(e) => setFormNumber1(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Subtitle / Members</label>
                  <input
                    type="text"
                    placeholder="e.g. 7 Days • 2 Adults, 2 Kids"
                    value={formField4}
                    onChange={(e) => setFormField4(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xs">Save Itinerary</button>
                </div>
              </form>
            )}

            {/* 7. NEW PACKING TASK MODAL */}
            {activeModal === "new_task" && (
              <form onSubmit={handleAddPackingTask} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Task or Packing Item</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reserve safari jeep tickets"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xs">Add Item</button>
                </div>
              </form>
            )}

            {/* 8. BUCKET LIST TRIP MODAL */}
            {activeModal === "bucket_trip" && (
              <form onSubmit={handleSaveBucketTrip} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Destination Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swiss Alps or Amalfi Coast"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Category</label>
                    <select
                      value={formField3}
                      onChange={(e) => setFormField3(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    >
                      <option value="Domestic">Domestic</option>
                      <option value="International">International</option>
                      <option value="Spiritual">Spiritual</option>
                      <option value="Adventure">Adventure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Target Season / Year</label>
                    <input
                      type="text"
                      placeholder="e.g. Summer 2027"
                      value={formField4}
                      onChange={(e) => setFormField4(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Estimated Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={formNumber1 || ""}
                      onChange={(e) => setFormNumber1(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Saved So Far (₹)</label>
                    <input
                      type="number"
                      value={formNumber2 || ""}
                      onChange={(e) => setFormNumber2(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Why Special / Family Dream</label>
                  <textarea
                    rows={2}
                    placeholder="Why this destination matters to us..."
                    value={formField5}
                    onChange={(e) => setFormField5(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xs">Save Destination</button>
                </div>
              </form>
            )}

            {/* 9. COUPLE TIME MODAL */}
            {activeModal === "couple_time" && (
              <form onSubmit={handleSaveCoupleTime} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Logged Quality Hours This Week</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formNumber1 || ""}
                    onChange={(e) => setFormNumber1(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Next Date Night Plan</label>
                  <input
                    type="text"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Anniversary / Milestone</label>
                  <input
                    type="text"
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold shadow-xs">Update</button>
                </div>
              </form>
            )}

            {/* 10. COUPLE GOAL MODAL */}
            {activeModal === "couple_goal" && (
              <form onSubmit={handleSaveCoupleGoal} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Goal Category</label>
                  <select
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  >
                    <option value="Quality Time">Quality Time</option>
                    <option value="Future Dream">Future Dream</option>
                    <option value="Wellness">Wellness &amp; Health</option>
                    <option value="Life Milestone">Life Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Goal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unplugged date night every Friday"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Target Timeline</label>
                  <input
                    type="text"
                    placeholder="e.g. Every Friday 8 PM or Late 2027"
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold shadow-xs">Save Goal</button>
                </div>
              </form>
            )}

            {/* 11. COUPLE MEMORY MODAL */}
            {activeModal === "couple_memory" && (
              <form onSubmit={handleSaveMemory} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Memory Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. First Home Key Handover"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 14 Feb 2026"
                      value={formField2}
                      onChange={(e) => setFormField2(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Indore"
                      value={formField3}
                      onChange={(e) => setFormField3(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Heartfelt Note</label>
                  <textarea
                    rows={3}
                    placeholder="What made this moment unforgettable..."
                    value={formField4}
                    onChange={(e) => setFormField4(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold shadow-xs">Save Memory</button>
                </div>
              </form>
            )}

            {/* 12. HEART LOG MODAL */}
            {activeModal === "heart_log" && (
              <form onSubmit={handleSaveHeartLog} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Reflection Type</label>
                  <select
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  >
                    <option value="Shared Joy">Shared Joy</option>
                    <option value="Tough Day Overcome">Tough Day Overcome</option>
                    <option value="Mutual Gratitude">Mutual Gratitude</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Date</label>
                  <input
                    type="text"
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Private Mutual Reflection</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Log mutual support, how we navigated stress together, or words of love..."
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold shadow-xs">Save Entry</button>
                </div>
              </form>
            )}

            {/* 13. KIDS ROUTINE MODAL */}
            {activeModal === "kid_routine" && (
              <form onSubmit={handleSaveKidRoutine} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Time Slot</label>
                  <select
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Routine / Homework Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science project reading"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-xs">Save Task</button>
                </div>
              </form>
            )}

            {/* 14. KIDS SKILL MODAL */}
            {activeModal === "kid_skill" && (
              <form onSubmit={handleSaveKidSkill} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Child</label>
                  <input
                    type="text"
                    value={formField4}
                    onChange={(e) => setFormField4(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Hobby / Activity Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swimming or Piano Lessons"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Academy / Instructor</label>
                  <input
                    type="text"
                    placeholder="e.g. Shishukunj Sports Club"
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Weekly Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. Tue, Thu, Sat (5 PM)"
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Progress Mastery: {formNumber1}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={formNumber1}
                    onChange={(e) => setFormNumber1(Number(e.target.value))}
                    className="w-full accent-blue-700 h-2 bg-[#EFECE6] rounded-lg cursor-pointer"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-xs">Save Skill</button>
                </div>
              </form>
            )}

            {/* 15. KIDS ACADEMIC MODAL */}
            {activeModal === "kid_academic" && (
              <form onSubmit={handleSaveAcademic} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">School / Academy Name</label>
                  <input
                    type="text"
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Overall Term Grade</label>
                  <input
                    type="text"
                    placeholder="A+ or 94%"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Teacher Remarks</label>
                  <textarea
                    rows={3}
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-xs">Update Report</button>
                </div>
              </form>
            )}

            {/* 16. KIDS HEALTH MODAL */}
            {activeModal === "kid_health" && (
              <form onSubmit={handleSaveKidHealth} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={formNumber1 || ""}
                      onChange={(e) => setFormNumber1(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={formNumber2 || ""}
                      onChange={(e) => setFormNumber2(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Screen Time Used (min)</label>
                    <input
                      type="number"
                      value={formField1}
                      onChange={(e) => setFormField1(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Daily Limit (min)</label>
                    <input
                      type="number"
                      value={formField2}
                      onChange={(e) => setFormField2(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Bedtime Target</label>
                  <input
                    type="text"
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-xs">Save Health</button>
                </div>
              </form>
            )}

            {/* 17. BOOK MODAL */}
            {activeModal === "book" && (
              <form onSubmit={handleSaveBook} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Book Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Atomic Habits"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Author</label>
                  <input
                    type="text"
                    placeholder="e.g. James Clear"
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Current Page</label>
                    <input
                      type="number"
                      value={formNumber1 || ""}
                      onChange={(e) => setFormNumber1(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Total Pages</label>
                    <input
                      type="number"
                      value={formNumber2 || ""}
                      onChange={(e) => setFormNumber2(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                    />
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-semibold shadow-xs">Save Book</button>
                </div>
              </form>
            )}

            {/* 18. HABIT MODAL */}
            {activeModal === "habit" && (
              <form onSubmit={handleSaveHabit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Frequency</label>
                  <select
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  >
                    <option value="Daily">Daily Habit</option>
                    <option value="Weekly">Weekly Habit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Habit Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 Min Morning Silence"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Current Day Streak</label>
                  <input
                    type="number"
                    value={formNumber1 || ""}
                    onChange={(e) => setFormNumber1(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-semibold shadow-xs">Save Habit</button>
                </div>
              </form>
            )}

            {/* 19. FITNESS & STEPS MODAL */}
            {activeModal === "fitness" && (
              <form onSubmit={handleSaveFitness} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Daily Steps Logged</label>
                  <input
                    type="number"
                    value={formNumber1 || ""}
                    onChange={(e) => setFormNumber1(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Target Steps Goal</label>
                  <input
                    type="number"
                    value={formNumber2 || ""}
                    onChange={(e) => setFormNumber2(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Workouts Completed This Week (of 5)</label>
                  <input
                    type="number"
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]">Cancel</button>
                  <button type="submit" className="tap-scale px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-semibold shadow-xs">Save Metrics</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE PIN MODAL */}
      {/* ========================================================================= */}
      {showPinChangeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-4 border border-[#E8E2D5] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-line/60">
              <h3 className="text-sm font-bold text-[#1B2922]">Change 4-Digit PIN</h3>
              <button
                type="button"
                onClick={() => setShowPinChangeModal(false)}
                className="text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewPin} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">Enter New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={newPinCandidate}
                  onChange={(e) => setNewPinCandidate(e.target.value)}
                  className="w-full text-center tracking-[0.5em] text-lg font-bold py-2 rounded-xl border border-[#C9C3B5] bg-canvas focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinChangeModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPinCandidate.length !== 4}
                  className="tap-scale px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

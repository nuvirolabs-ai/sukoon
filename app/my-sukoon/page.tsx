"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { useStore, useOptionalStore } from "@/components/StoreProvider";

// ==========================================
// PILLAR TYPES & INITIAL DATA
// ==========================================

export type LifePillar = "finance" | "travel" | "love" | "kids" | "self";

// 1. Finance Pillar Types
interface AssetEntry {
  id: string;
  category: "Bank FD" | "Mutual Funds" | "Equity / Stocks" | "Car / Vehicle" | "Real Estate" | "Gold / Other";
  name: string;
  institutionOrDetails: string;
  currentValue: number;
  monthlyAddition?: number;
  returnRate?: string;
  maturityDate?: string;
}

interface LoanEntry {
  id: string;
  name: string;
  type: "Home Loan" | "Car Loan" | "Personal Loan" | "Education Loan";
  bank: string;
  totalAmount: number;
  remainingBalance: number;
  monthlyEmi: number;
  tenureRemainingMonths: number;
}

interface InsuranceEntry {
  id: string;
  type: "Medical / Health" | "Personal Accident" | "Term Life Plan";
  provider: string;
  policyName: string;
  sumAssured: number;
  annualPremium: number;
  renewalDate: string;
  coveredMembers: string;
}

// 2. Travel Pillar Types
interface BucketListItem {
  id: string;
  destination: string;
  countryOrState: string;
  category: "International" | "Domestic" | "Spiritual" | "Adventure";
  targetYear: string;
  estimatedBudget: number;
  savedBudget: number;
  photoUrl: string;
  whySpecial: string;
}

interface PackingItem {
  id: string;
  task: string;
  done: boolean;
}

// 3. Love & Life Types
interface CoupleGoal {
  id: string;
  title: string;
  category: "Future Dream" | "Quality Time" | "Life Milestone" | "Wellness";
  targetTime: string;
  completed: boolean;
}

interface CoupleMemory {
  id: string;
  title: string;
  date: string;
  location: string;
  photoUrl: string;
  note: string;
}

interface HeartLog {
  id: string;
  type: "Shared Joy" | "Tough Day Overcome" | "Mutual Gratitude";
  date: string;
  reflection: string;
}

// 4. Kids Pillar Types
interface KidsDailyRoutine {
  id: string;
  title: string;
  timeSlot: "Morning" | "Afternoon" | "Evening" | "Night";
  completed: boolean;
  category: "Homework" | "Reading" | "Sports" | "Discipline";
}

interface KidsSkill {
  id: string;
  hobbyName: string;
  levelOrAcademy: string;
  schedule: string;
  childName: string;
  progressPercent: number;
}

interface KidsAcademicRecord {
  id: string;
  subject: string;
  assessmentTitle: string;
  gradeOrScore: string;
  teacherRemarks: string;
}

// 5. Work-Life & Self Growth Types
interface ReadingBook {
  id: string;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  status: "reading" | "completed" | "want_to_read";
}

interface PersonalHabit {
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
    name: "Bluechip Direct Equity Basket",
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

const DEFAULT_BUCKET_LIST: BucketListItem[] = [
  {
    id: "trip-switz",
    destination: "Swiss Alps & Interlaken",
    countryOrState: "Switzerland",
    category: "International",
    targetYear: "Summer 2027",
    estimatedBudget: 650000,
    savedBudget: 380000,
    photoUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80",
    whySpecial: "Experiencing Sakura bloom and bullet trains together.",
  },
];

const DEFAULT_MEMORIES: CoupleMemory[] = [
  {
    id: "mem-1",
    title: "Our First Home Key Handover",
    date: "14 Feb 2026",
    location: "Vijay Nagar Residence, Indore",
    photoUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80",
    note: "Stepping onto the balcony with chai, knowing every sacrifice was worth this peace.",
  },
  {
    id: "mem-2",
    title: "Sunset Walk at Udaipur Lake",
    date: "04 Nov 2025",
    location: "Lake Pichola, Udaipur",
    photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    note: "Just the two of us, laughing about college days and dreaming about the next decade.",
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
  { id: "ks-1", hobbyName: "Competitive Swimming", levelOrAcademy: "Shishukunj Sports Club", schedule: "Tue, Thu, Sat (5 PM)", childName: "Aarav (9 Yrs)", progressPercent: 78 },
  { id: "ks-2", hobbyName: "Chess Tactics & Strategy", levelOrAcademy: "Indore Chess Academy", schedule: "Sun Morning 10 AM", childName: "Aarav (9 Yrs)", progressPercent: 85 },
  { id: "ks-3", hobbyName: "Classical Kathak Dance & Arts", levelOrAcademy: "Nritya Niketan", schedule: "Wed & Fri (4 PM)", childName: "Ananya (5 Yrs)", progressPercent: 64 },
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

// Format INR nicely
function formatINR(amount: number): string {
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

  // Active Life Pillar Tab
  const [activePillar, setActivePillar] = useState<LifePillar>("finance");

  // Privacy & PIN Lock for "My Love My Life"
  const [isLoveLocked, setIsLoveLocked] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [savedPin, setSavedPin] = useState<string>("1234");
  const [showPinSetupModal, setShowPinSetupModal] = useState<boolean>(false);
  const [newPinCandidate, setNewPinCandidate] = useState<string>("");

  // ==========================================
  // STATE MANAGEMENT WITH LOCALSTORAGE SYNC
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

  // Emergency Fund & Kids Education Target
  const [emergencyTarget, setEmergencyTarget] = useState<number>(600000);
  const [emergencyCurrent, setEmergencyCurrent] = useState<number>(480000);
  const [educationTarget, setEducationTarget] = useState<number>(5000000);
  const [educationCurrent, setEducationCurrent] = useState<number>(1850000);

  // Travel State
  const [bucketList, setBucketList] = useState<BucketListItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_BUCKET_LIST;
    try {
      const saved = localStorage.getItem("sukoon_mysukoon_bucket_list");
      return saved ? JSON.parse(saved) : DEFAULT_BUCKET_LIST;
    } catch {
      return DEFAULT_BUCKET_LIST;
    }
  });

  const [travelAnnualTarget, setTravelAnnualTarget] = useState<number>(350000);
  const [travelAnnualSaved, setTravelAnnualSaved] = useState<number>(245000);
  const [nextTripChecklist, setNextTripChecklist] = useState<PackingItem[]>([
    { id: "pk-1", task: "Kumarakom Lake Resort reservation confirmed", done: true },
    { id: "pk-2", task: "Houseboat sunset cruise slots booked", done: true },
    { id: "pk-3", task: "Kids warm-wear & medical essentials pack", done: true },
    { id: "pk-4", task: "Munnar tea museum & spice garden passes", done: false },
    { id: "pk-5", task: "Carry camera batteries & spare memory cards", done: false },
  ]);

  // Love State
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

  const [activeChild, setActiveChild] = useState<"Aarav" | "Ananya">("Aarav");

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

  const [happinessScore, setHappinessScore] = useState<number>(88);
  const [gratitudeNotes, setGratitudeNotes] = useState<string[]>([
    "Morning peaceful cup of ginger chai on the balcony with birds chirping.",
    "Watching Aarav complete his swimming lap with confidence.",
    "A quiet heart-to-heart evening discussion on our next family decade.",
  ]);
  const [newGratitudeText, setNewGratitudeText] = useState<string>("");

  // Modals
  const [addAssetModal, setAddAssetModal] = useState<boolean>(false);
  const [newAssetName, setNewAssetName] = useState<string>("");
  const [newAssetCategory, setNewAssetCategory] = useState<AssetEntry["category"]>("Bank FD");
  const [newAssetDetail, setNewAssetDetail] = useState<string>("");
  const [newAssetValue, setNewAssetValue] = useState<string>("");

  const [addTripModal, setAddTripModal] = useState<boolean>(false);
  const [newTripDest, setNewTripDest] = useState<string>("");
  const [newTripLocation, setNewTripLocation] = useState<string>("");
  const [newTripCategory, setNewTripCategory] = useState<BucketListItem["category"]>("Domestic");
  const [newTripYear, setNewTripYear] = useState<string>("2027");
  const [newTripBudget, setNewTripBudget] = useState<string>("");
  const [newTripWhy, setNewTripWhy] = useState<string>("");

  const [addMemoryModal, setAddMemoryModal] = useState<boolean>(false);
  const [newMemTitle, setNewMemTitle] = useState<string>("");
  const [newMemDate, setNewMemDate] = useState<string>("");
  const [newMemLocation, setNewMemLocation] = useState<string>("");
  const [newMemNote, setNewMemNote] = useState<string>("");

  // ==========================================
  // SMART CALCULATIONS & DERIVED VALUES
  // ==========================================

  // Smart Real Estate Value from Sukoon Vault properties
  const realEstateValuation = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.purchaseValue || 0), 0) || 27700000;
  }, [properties]);

  // Home Loan Balance from properties
  const propertyLoanBalance = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.loanBalance || 0), 0) || 4200000;
  }, [properties]);

  // Total Portfolio Net Worth (Real Estate + Financial Assets - Total Loans)
  const totalFinancialAssets = useMemo(() => {
    return assets.reduce((sum, item) => sum + item.currentValue, 0);
  }, [assets]);

  const totalOtherLoans = useMemo(() => {
    return loans.reduce((sum, item) => sum + item.remainingBalance, 0);
  }, [loans]);

  const totalDebt = propertyLoanBalance + totalOtherLoans;
  const netFamilyWealth = realEstateValuation + totalFinancialAssets - totalDebt;

  // Monthly Outflow (Home Loan EMI estimate + Car/other loans)
  const monthlyHomeEmi = 42000;
  const totalMonthlyEmi = monthlyHomeEmi + loans.reduce((sum, item) => sum + item.monthlyEmi, 0);

  // Sync back to local storage
  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_assets", JSON.stringify(assets));
    } catch {}
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_bucket_list", JSON.stringify(bucketList));
    } catch {}
  }, [bucketList]);

  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_memories", JSON.stringify(coupleMemories));
    } catch {}
  }, [coupleMemories]);

  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_couple_goals", JSON.stringify(coupleGoals));
    } catch {}
  }, [coupleGoals]);

  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_heart_logs", JSON.stringify(heartLogs));
    } catch {}
  }, [heartLogs]);

  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_kids_routines", JSON.stringify(kidsRoutines));
    } catch {}
  }, [kidsRoutines]);

  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_kids_skills", JSON.stringify(kidsSkills));
    } catch {}
  }, [kidsSkills]);

  useEffect(() => {
    try {
      localStorage.setItem("sukoon_mysukoon_habits", JSON.stringify(habits));
    } catch {}
  }, [habits]);

  // Handle PIN unlock
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === savedPin) {
      setIsLoveLocked(false);
      setPinError("");
      setPinInput("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPinInput("");
    }
  };

  const handleQuickUnlock = () => {
    setIsLoveLocked(false);
    setPinError("");
  };

  // Add Asset Handler
  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newAssetValue.replace(/[^0-9]/g, "")) || 100000;
    if (!newAssetName.trim()) return;

    const newEntry: AssetEntry = {
      id: "ast-" + Date.now(),
      name: newAssetName.trim(),
      category: newAssetCategory,
      institutionOrDetails: newAssetDetail.trim() || "Active Family Asset",
      currentValue: val,
    };

    setAssets([newEntry, ...assets]);
    setNewAssetName("");
    setNewAssetDetail("");
    setNewAssetValue("");
    setAddAssetModal(false);
  };

  // Add Trip Handler
  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const bud = Number(newTripBudget.replace(/[^0-9]/g, "")) || 200000;
    if (!newTripDest.trim()) return;

    const newTrip: BucketListItem = {
      id: "trip-" + Date.now(),
      destination: newTripDest.trim(),
      countryOrState: newTripLocation.trim() || "India",
      category: newTripCategory,
      targetYear: newTripYear.trim() || "2027",
      estimatedBudget: bud,
      savedBudget: Math.round(bud * 0.25),
      photoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
      whySpecial: newTripWhy.trim() || "Family lifetime memories and exploring cultures together.",
    };

    setBucketList([newTrip, ...bucketList]);
    setNewTripDest("");
    setNewTripLocation("");
    setNewTripBudget("");
    setNewTripWhy("");
    setAddTripModal(false);
  };

  // Add Couple Memory
  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemTitle.trim()) return;

    const newMem: CoupleMemory = {
      id: "mem-" + Date.now(),
      title: newMemTitle.trim(),
      date: newMemDate.trim() || "Today",
      location: newMemLocation.trim() || "Indore",
      photoUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80",
      note: newMemNote.trim() || "A precious moment etched in our life's quiet journey together.",
    };

    setCoupleMemories([newMem, ...coupleMemories]);
    setNewMemTitle("");
    setNewMemDate("");
    setNewMemLocation("");
    setNewMemNote("");
    setAddMemoryModal(false);
  };

  // Toggle routine item
  const toggleKidRoutine = (id: string) => {
    setKidsRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const togglePackingItem = (id: string) => {
    setNextTripChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
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

  // Add Gratitude note
  const handleAddGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGratitudeText.trim()) return;
    setGratitudeNotes([newGratitudeText.trim(), ...gratitudeNotes]);
    setNewGratitudeText("");
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen pb-32 text-foreground bg-canvas">
      {/* ========================================================================= */}
      {/* TOP HEADER: Clean Back Link, Sanctuary Title & Quick Lock Status */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-md border-b border-line/60 px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="tap-scale inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:opacity-80 transition"
        >
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8B82]">
            MY HAPPINESS · MY SUKOON
          </span>
          <span className="text-xs font-serif font-bold text-[#1B2922]">
            Life &amp; Family Sanctuary
          </span>
        </div>

        {/* Right Action: Privacy Indicator */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!isLoveLocked) {
                setIsLoveLocked(true);
              } else {
                setActivePillar("love");
              }
            }}
            title={isLoveLocked ? "Discreet Vault Locked" : "Click to Lock Private Life"}
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
      {/* SANCTUARY HERO GREETING BANNER */}
      {/* ========================================================================= */}
      <section className="px-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1E5637] via-[#1B3D2F] to-[#0F291E] p-5 text-white shadow-xs">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-[10px] font-semibold text-emerald-100 mb-2">
              <Sparkles size={12} className="text-amber-300" />
              <span>Personalized Life Harmony</span>
            </div>

            <h1 className="text-xl font-serif font-bold text-white tracking-tight">
              My Happiness, My Sukoon
            </h1>
            <p className="text-[12px] text-emerald-100/85 mt-1 leading-relaxed">
              Goal-oriented life journey for your wealth, travel dreams, relationship &amp; family growth.
            </p>

            {/* Quick KPI Pill Bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-200/80">
                  Family Net Worth
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
                  {happinessScore}% Peaceful
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-200/80">
                  Next Trip
                </span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  Kerala (50d)
                </span>
              </div>
            </div>
          </div>

          {/* Calming ambient background glow */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5 LIFE PILLARS HORIZONTAL SEGMENTED NAVIGATION */}
      {/* ========================================================================= */}
      <nav aria-label="Life Pillars" className="sticky top-[53px] z-20 bg-canvas/95 backdrop-blur-md px-4 py-2.5 border-b border-line/40">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Pillar 1: Family Financial Planning */}
          <button
            type="button"
            onClick={() => setActivePillar("finance")}
            className={`tap-scale shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activePillar === "finance"
                ? "bg-[#1E5637] text-white shadow-xs"
                : "bg-white/80 text-[#526359] border border-[#E8E2D5] hover:bg-white"
            }`}
          >
            <Wallet size={13} />
            <span>Finance &amp; Goals</span>
          </button>

          {/* Pillar 2: Holiday & Travel */}
          <button
            type="button"
            onClick={() => setActivePillar("travel")}
            className={`tap-scale shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activePillar === "travel"
                ? "bg-[#D97706] text-white shadow-xs"
                : "bg-white/80 text-[#526359] border border-[#E8E2D5] hover:bg-white"
            }`}
          >
            <Plane size={13} />
            <span>Holidays &amp; Travel</span>
          </button>

          {/* Pillar 3: My Love My Life */}
          <button
            type="button"
            onClick={() => setActivePillar("love")}
            className={`tap-scale shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activePillar === "love"
                ? "bg-[#BE185D] text-white shadow-xs"
                : "bg-white/80 text-[#526359] border border-[#E8E2D5] hover:bg-white"
            }`}
          >
            <Heart size={13} />
            <span>Love &amp; Life</span>
            {isLoveLocked && <Lock size={10} className="opacity-70 ml-0.5" />}
          </button>

          {/* Pillar 4: Responsibilities Towards Kids */}
          <button
            type="button"
            onClick={() => setActivePillar("kids")}
            className={`tap-scale shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activePillar === "kids"
                ? "bg-[#0284C7] text-white shadow-xs"
                : "bg-white/80 text-[#526359] border border-[#E8E2D5] hover:bg-white"
            }`}
          >
            <Baby size={13} />
            <span>Kids &amp; Growth</span>
          </button>

          {/* Pillar 5: Work-Life Balance & Self */}
          <button
            type="button"
            onClick={() => setActivePillar("self")}
            className={`tap-scale shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activePillar === "self"
                ? "bg-[#6366F1] text-white shadow-xs"
                : "bg-white/80 text-[#526359] border border-[#E8E2D5] hover:bg-white"
            }`}
          >
            <Feather size={13} />
            <span>Self &amp; Balance</span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA: DYNAMICALLY SWITCHED BASED ON PILLAR */}
      {/* ========================================================================= */}
      <main className="px-4 pt-4 space-y-6">

        {/* ####################################################################### */}
        {/* PILLAR 1: FAMILY FINANCIAL PLANNING & GOALS */}
        {/* ####################################################################### */}
        {activePillar === "finance" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Philosophical Motto */}
            <div className="bg-sand/30 border border-[#E8E2D5] rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                <Landmark size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1B2922]">Family Financial Freedom</h3>
                <p className="text-[11px] text-[#7C8B82] leading-tight">
                  Holistic wealth orchestration: Real estate foundation, liquid investments, zero debt anxiety &amp; secured future.
                </p>
              </div>
            </div>

            {/* Net Worth Summary Card */}
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
                  onClick={() => setAddAssetModal(true)}
                  className="tap-scale inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1E5637] text-white text-xs font-semibold shadow-xs hover:bg-[#164028] transition"
                >
                  <Plus size={14} /> Add Asset
                </button>
              </div>

              {/* Asset breakdown bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#526359]">Gross Assets: {formatINR(realEstateValuation + totalFinancialAssets)}</span>
                  <span className="text-amber-800">Total Loans: {formatINR(totalDebt)}</span>
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
                  Savings &amp; Asset Allocation
                </h3>
                <span className="text-[11px] font-semibold text-forest">
                  {assets.length + 1} Managed Assets
                </span>
              </div>

              {/* Smart Card: Real Estate (Cross-linked to Sukoon Vault) */}
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
                      View in Vault <ChevronRight size={10} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Dynamic Assets: Bank FD, Mutual Funds, Equity, Car */}
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs flex items-center justify-between">
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
                </div>
              ))}
            </div>

            {/* Sub-section 2: Loan Management (House, Car & Personal) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <CreditCard size={16} className="text-amber-800" />
                  Loan &amp; EMI Management
                </h3>
                <span className="text-[11px] font-semibold text-amber-800">
                  Total EMI: {formatINR(totalMonthlyEmi)}/mo
                </span>
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
                <div key={loan.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#1B2922]">{loan.name}</h4>
                    <p className="text-[10px] text-[#7C8B82]">
                      {loan.bank} • {loan.tenureRemainingMonths} months left
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#1B2922] block">
                      {formatINR(loan.monthlyEmi)}/mo
                    </span>
                    <span className="text-[10px] text-[#7C8B82]">
                      Bal: {formatINR(loan.remainingBalance)}
                    </span>
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
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {insurance.map((ins) => (
                  <div key={ins.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-1.5 py-0.5 rounded">
                        {ins.type}
                      </div>
                      <h4 className="text-xs font-bold text-[#1B2922] mt-0.5">{ins.policyName}</h4>
                      <p className="text-[10px] text-[#7C8B82]">{ins.provider} • Renews {ins.renewalDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-forest block">
                        {formatINR(ins.sumAssured)} Cover
                      </span>
                      <span className="text-[9px] text-[#7C8B82]">
                        Prem: {formatINR(ins.annualPremium)}/yr
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section 4 & 5: Emergency Fund & Kids Education Target */}
            <div className="grid grid-cols-1 gap-3 pt-2">
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
                  <span>Target: {formatINR(emergencyTarget)} (6 Mo Expenses)</span>
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
                      <p className="text-[10px] text-[#7C8B82]">12-year target for college, university &amp; overseas study</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700">
                    {Math.round((educationCurrent / educationTarget) * 100)}%
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
                    {formatINR(travelAnnualSaved)} <span className="text-xs font-normal text-[#7C8B82]">saved of {formatINR(travelAnnualTarget)}</span>
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
                  {Math.round((travelAnnualSaved / travelAnnualTarget) * 100)}% Ready
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#EFECE6] overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (travelAnnualSaved / travelAnnualTarget) * 100)}%` }}
                  className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full"
                />
              </div>
              <p className="text-[11px] text-[#7C8B82] mt-2">
                Automated SIP of ₹25,000/mo funds your family holidays without touching long-term retirement wealth.
              </p>
            </div>

            {/* Active Next Trip on Mind */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Luggage size={16} className="text-amber-700" />
                  Next Trip on Mind (Featured Itinerary)
                </h3>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Dec 2026 • 50 Days To Go
                </span>
              </div>

              <div className="bg-white rounded-3xl border border-[#E8E2D5] overflow-hidden shadow-xs">
                <div className="relative h-40 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&auto=format&fit=crop&q=80"
                    alt="Kerala Backwaters"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Winter Family Holiday
                    </span>
                    <h4 className="text-base font-bold">Kerala Backwaters, Kumarakom &amp; Munnar</h4>
                    <p className="text-xs text-white/80">7 Days • 2 Adults, 2 Kids • Fully Funded</p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#1B2922] pb-2 border-b border-line/40">
                    <span>Pre-Departure Checklist</span>
                    <span className="text-[11px] text-[#7C8B82]">
                      {nextTripChecklist.filter((t) => t.done).length}/{nextTripChecklist.length} Ready
                    </span>
                  </div>

                  <div className="space-y-2">
                    {nextTripChecklist.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => togglePackingItem(item.id)}
                        className="w-full flex items-center gap-2.5 text-left text-xs text-[#526359] hover:text-[#1B2922] transition"
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
                        <span className={item.done ? "line-through text-[#7C8B82]" : "font-medium"}>
                          {item.task}
                        </span>
                      </button>
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
                  onClick={() => setAddTripModal(true)}
                  className="tap-scale inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  <Plus size={14} /> Add Dream Destination
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {bucketList.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-[#E8E2D5] overflow-hidden shadow-xs flex">
                    <div className="relative w-28 h-28 shrink-0">
                      <Image
                        src={item.photoUrl}
                        alt={item.destination}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded">
                            {item.category} • {item.targetYear}
                          </span>
                          <span className="text-xs font-bold text-[#1B2922]">
                            {formatINR(item.estimatedBudget)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#1B2922] mt-1">{item.destination}</h4>
                        <p className="text-[10px] text-[#7C8B82] line-clamp-1">{item.whySpecial}</p>
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
                      onClick={handleQuickUnlock}
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
                      <p className="text-[10px] text-[#7C8B82]">9 Years of Partnership • Growing Stronger</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLoveLocked(true)}
                    className="tap-scale inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-white px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs hover:bg-rose-50"
                  >
                    <Lock size={12} /> Lock Now
                  </button>
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
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                      5.5 Hours Logged
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-sand/30 rounded-2xl p-3 border border-[#E8E2D5]">
                      <span className="text-[10px] font-bold uppercase text-[#7C8B82] block">Next Date Night</span>
                      <span className="text-xs font-bold text-[#1B2922] mt-0.5 block">Friday, 8:00 PM</span>
                      <span className="text-[10px] text-[#526359]">Terrace candle dinner &amp; music</span>
                    </div>
                    <div className="bg-sand/30 rounded-2xl p-3 border border-[#E8E2D5]">
                      <span className="text-[10px] font-bold uppercase text-[#7C8B82] block">Special Anniversary</span>
                      <span className="text-xs font-bold text-rose-700 mt-0.5 block">14 February</span>
                      <span className="text-[10px] text-[#526359]">100 Days until 10th milestone</span>
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
                  </div>

                  <div className="space-y-2">
                    {coupleGoals.map((cg) => (
                      <div key={cg.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border transition ${
                              cg.completed ? "bg-rose-700 border-rose-700 text-white" : "border-[#C9C3B5]"
                            }`}
                          >
                            {cg.completed && <CheckSquare size={10} />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#1B2922]">{cg.title}</h4>
                            <p className="text-[10px] text-[#7C8B82]">{cg.category} • {cg.targetTime}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-section 3: Memories to Cherish (Photo Vault) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                      <Camera size={16} className="text-rose-700" />
                      Memories to Cherish (Photo Vault)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAddMemoryModal(true)}
                      className="tap-scale inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800"
                    >
                      <Plus size={14} /> Add Memory
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {coupleMemories.map((mem) => (
                      <div key={mem.id} className="bg-white rounded-3xl border border-[#E8E2D5] overflow-hidden shadow-xs">
                        <div className="relative h-44 w-full">
                          <Image
                            src={mem.photoUrl}
                            alt={mem.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4 text-white">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                              {mem.date} • {mem.location}
                            </span>
                            <h4 className="text-sm font-bold">{mem.title}</h4>
                          </div>
                        </div>
                        <div className="p-3.5">
                          <p className="text-xs text-[#526359] italic leading-relaxed">
                            &ldquo;{mem.note}&rdquo;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-section 4 & 5: Physical Relationship, Intimacy & Ups/Downs */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                    <Heart size={16} className="text-rose-700" />
                    Emotional &amp; Physical Intimacy Space
                  </h3>

                  <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#1B2922]">Intimacy &amp; Open Communication Wellness</span>
                      <span className="text-rose-700 font-bold">Deep Alignment (92%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden">
                      <div style={{ width: "92%" }} className="h-full bg-linear-to-r from-rose-500 to-rose-700 rounded-full" />
                    </div>
                    <p className="text-[11px] text-[#7C8B82] leading-relaxed">
                      Maintaining affection, emotional vulnerability, listening without judgment, and regular physical closeness keeps the marriage rooted in peace.
                    </p>
                  </div>

                  {/* Ups & Downs Reflection Journal */}
                  <div className="bg-sand/30 rounded-3xl border border-[#E8E2D5] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1B2922]">Navigating Ups &amp; Downs Together</h4>
                      <span className="text-[10px] text-[#7C8B82]">Private Mutual Notes</span>
                    </div>

                    <div className="space-y-2">
                      {heartLogs.map((log) => (
                        <div key={log.id} className="bg-white rounded-2xl p-3 border border-[#E8E2D5] shadow-2xs">
                          <div className="flex items-center justify-between text-[10px] font-bold text-rose-800 mb-1">
                            <span>{log.type}</span>
                            <span className="text-[#7C8B82] font-normal">{log.date}</span>
                          </div>
                          <p className="text-xs text-[#526359] leading-relaxed">{log.reflection}</p>
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
              <button
                type="button"
                onClick={() => setActiveChild("Aarav")}
                className={`tap-scale px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                  activeChild === "Aarav"
                    ? "bg-[#0284C7] text-white shadow-xs"
                    : "bg-white text-[#526359] border border-[#E8E2D5]"
                }`}
              >
                <span>Aarav (Grade 4 • 9 Yrs)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChild("Ananya")}
                className={`tap-scale px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                  activeChild === "Ananya"
                    ? "bg-[#0284C7] text-white shadow-xs"
                    : "bg-white text-[#526359] border border-[#E8E2D5]"
                }`}
              >
                <span>Ananya (Kindergarten • 5 Yrs)</span>
              </button>
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
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {kidsRoutines.filter((r) => r.completed).length}/{kidsRoutines.length} Done
                </span>
              </div>

              <div className="space-y-2">
                {kidsRoutines.map((routine) => (
                  <button
                    key={routine.id}
                    type="button"
                    onClick={() => toggleKidRoutine(routine.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#E8E2D5] bg-sand/20 hover:bg-sand/40 transition text-left"
                  >
                    <div className="flex items-center gap-2.5">
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
                    </div>
                    <span className="text-[10px] font-bold text-[#7C8B82] uppercase tracking-wider">
                      {routine.timeSlot}
                    </span>
                  </button>
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
                <span className="text-[11px] font-semibold text-blue-700">3 Active Academies</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {kidsSkills.map((skill) => (
                  <div key={skill.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          {skill.childName}
                        </div>
                        <h4 className="text-xs font-bold text-[#1B2922] mt-1">{skill.hobbyName}</h4>
                        <p className="text-[10px] text-[#7C8B82]">{skill.levelOrAcademy} • {skill.schedule}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-700">{skill.progressPercent}% Skill Mastery</span>
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
              <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                <BookOpen size={16} className="text-blue-700" />
                Tuition &amp; Academic Performance Check
              </h3>

              <div className="bg-white rounded-3xl border border-[#E8E2D5] p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-line/40 text-xs">
                  <span className="font-bold text-[#1B2922]">Mid-Term Assessment Report (The Shishukunj)</span>
                  <span className="font-bold text-emerald-700">Overall Grade: A+</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-sand/30 p-2 rounded-xl">
                    <span className="text-[10px] text-[#7C8B82] block">Mathematics</span>
                    <span className="text-xs font-bold text-[#1B2922]">96 / 100</span>
                  </div>
                  <div className="bg-sand/30 p-2 rounded-xl">
                    <span className="text-[10px] text-[#7C8B82] block">Science &amp; Env</span>
                    <span className="text-xs font-bold text-[#1B2922]">92 / 100</span>
                  </div>
                  <div className="bg-sand/30 p-2 rounded-xl">
                    <span className="text-[10px] text-[#7C8B82] block">English &amp; Vocab</span>
                    <span className="text-xs font-bold text-[#1B2922]">94 / 100</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#526359] italic pt-1">
                  Teacher note: &ldquo;Aarav shows remarkable creative problem solving and active sportsmanship in team drills.&rdquo;
                </p>
              </div>
            </div>

            {/* Sub-section 4 & 5: Health, Growth & Screen Time Monitoring */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82] block">
                  Growth &amp; Pediatric Log
                </span>
                <span className="text-sm font-bold text-[#1B2922] mt-1 block">134 cm • 28 kg</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Healthy Growth Percentile</span>
                <span className="text-[9px] text-[#7C8B82] block mt-1">Vaccines up-to-date (2026)</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82] block">
                  Routine &amp; Screen Time
                </span>
                <span className="text-sm font-bold text-[#1B2922] mt-1 block">35m / 45m Limit</span>
                <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">10m Remaining Today</span>
                <span className="text-[9px] text-[#7C8B82] block mt-1">Bedtime strictly 8:30 PM</span>
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

              {/* Slider to adjust score */}
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
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[#7C8B82] block">Daily Steps</span>
                  <span className="text-base font-bold text-[#1B2922] mt-0.5 block">7,420</span>
                  <span className="text-[10px] text-[#526359] block">Goal: 10,000 steps</span>
                  <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden mt-2">
                    <div style={{ width: "74%" }} className="h-full bg-indigo-600 rounded-full" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[#7C8B82] block">Weekly Workouts</span>
                  <span className="text-base font-bold text-[#1B2922] mt-0.5 block">4 of 5 Days</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Consistent Streak</span>
                  <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden mt-2">
                    <div style={{ width: "80%" }} className="h-full bg-emerald-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-section 2: Self Growth & Book Reading List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                  <Book size={16} className="text-indigo-600" />
                  Self Growth &amp; Reading
                </h3>
                <span className="text-[11px] font-semibold text-indigo-700">3 Books on Desk</span>
              </div>

              <div className="space-y-2.5">
                {books.map((book) => (
                  <div key={book.id} className="bg-white rounded-2xl border border-[#E8E2D5] p-3.5 shadow-xs flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1B2922]">{book.title}</h4>
                      <p className="text-[10px] text-[#7C8B82]">{book.author} • Page {book.currentPage} of {book.totalPages}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-700 block">
                        {Math.round((book.currentPage / book.totalPages) * 100)}%
                      </span>
                      <span className="text-[9px] uppercase font-bold text-[#7C8B82]">
                        {book.status === "completed" ? "Done" : "Reading"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section 3: Personal Habits & Leisure */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#1B2922] flex items-center gap-1.5">
                <Target size={16} className="text-indigo-600" />
                Personal Habits &amp; Hobbies
              </h3>

              <div className="space-y-2">
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggleHabit(habit.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#E8E2D5] bg-white shadow-2xs text-left hover:bg-sand/20 transition"
                  >
                    <div className="flex items-center gap-2.5">
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
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {habit.streakDays}d Streak
                    </span>
                  </button>
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
                    <div key={idx} className="bg-white rounded-2xl p-2.5 border border-[#E8E2D5] text-xs text-[#526359] flex items-start gap-2 shadow-2xs">
                      <span className="text-amber-600 font-bold">✨</span>
                      <p className="flex-1 leading-relaxed">{g}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM ASSET */}
      {/* ========================================================================= */}
      {addAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 border border-[#E8E2D5] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-line/60">
              <h3 className="text-sm font-bold text-[#1B2922]">Add Financial Asset</h3>
              <button
                type="button"
                onClick={() => setAddAssetModal(false)}
                className="text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Asset Category
                </label>
                <select
                  value={newAssetCategory}
                  onChange={(e) => setNewAssetCategory(e.target.value as AssetEntry["category"])}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                >
                  <option value="Bank FD">Bank FD (Fixed Deposit)</option>
                  <option value="Mutual Funds">Mutual Funds (SIP / Lumpsum)</option>
                  <option value="Equity / Stocks">Direct Equity / Demat</option>
                  <option value="Car / Vehicle">Car / Automobile Asset</option>
                  <option value="Gold / Other">Gold Sovereign / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Asset Name / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBI Tax Saver FD or Tata Bluechip Fund"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Institution / Folio / Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. ICICI Bank, Zerodha, Folio #12345"
                  value={newAssetDetail}
                  onChange={(e) => setNewAssetDetail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Current Valuation (₹)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500000"
                  value={newAssetValue}
                  onChange={(e) => setNewAssetValue(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddAssetModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tap-scale px-4 py-2 rounded-xl bg-forest text-white text-xs font-semibold shadow-xs"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD BUCKET LIST TRIP */}
      {/* ========================================================================= */}
      {addTripModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 border border-[#E8E2D5] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-line/60">
              <h3 className="text-sm font-bold text-[#1B2922]">Add Dream Destination</h3>
              <button
                type="button"
                onClick={() => setAddTripModal(false)}
                className="text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTrip} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Destination Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amalfi Coast or Leh Ladakh"
                  value={newTripDest}
                  onChange={(e) => setNewTripDest(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                    Category
                  </label>
                  <select
                    value={newTripCategory}
                    onChange={(e) => setNewTripCategory(e.target.value as BucketListItem["category"])}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  >
                    <option value="Domestic">Domestic</option>
                    <option value="International">International</option>
                    <option value="Spiritual">Spiritual</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                    Target Year
                  </label>
                  <input
                    type="text"
                    value={newTripYear}
                    onChange={(e) => setNewTripYear(e.target.value)}
                    placeholder="2027"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Estimated Budget (₹)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 400000"
                  value={newTripBudget}
                  onChange={(e) => setNewTripBudget(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Why Special / Family Dream
                </label>
                <input
                  type="text"
                  placeholder="e.g. Road trip with parents and kids"
                  value={newTripWhy}
                  onChange={(e) => setNewTripWhy(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddTripModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tap-scale px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xs"
                >
                  Save Dream Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD COUPLE MEMORY */}
      {/* ========================================================================= */}
      {addMemoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 border border-[#E8E2D5] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-line/60">
              <h3 className="text-sm font-bold text-[#1B2922]">Add Cherished Memory</h3>
              <button
                type="button"
                onClick={() => setAddMemoryModal(false)}
                className="text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Moment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anniversary dinner at Chokhi Dhani"
                  value={newMemTitle}
                  onChange={(e) => setNewMemTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={newMemDate}
                    onChange={(e) => setNewMemDate(e.target.value)}
                    placeholder="e.g. Nov 2026"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newMemLocation}
                    onChange={(e) => setNewMemLocation(e.target.value)}
                    placeholder="e.g. Indore"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#7C8B82] mb-1">
                  Heartfelt Reflection Note
                </label>
                <textarea
                  rows={3}
                  placeholder="What made this moment unforgettable..."
                  value={newMemNote}
                  onChange={(e) => setNewMemNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#C9C3B5] bg-canvas text-[#1B2922]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddMemoryModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#7C8B82]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tap-scale px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

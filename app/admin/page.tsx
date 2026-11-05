"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Hammer,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

// ==========================================
// MOCK DATA TYPES & SAMPLE DATA
// ==========================================

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joinedDate: string;
  lastActive: string;
  propertiesCount: number;
  docsCount: number;
  status: "verified" | "active" | "pending_kyc" | "suspended";
  role: "Property Owner" | "Builder / Contractor" | "Investor" | "Tenant";
  properties: { id: string; name: string; area: string; type: string }[];
}

const INITIAL_USERS: AdminUser[] = [
  {
    id: "usr-01",
    name: "Akshay Sharma",
    email: "akshay.sharma@sukoon.local",
    phone: "+91 98260 14820",
    city: "Indore",
    joinedDate: "14 Feb 2026",
    lastActive: "Just now",
    propertiesCount: 3,
    docsCount: 14,
    status: "verified",
    role: "Property Owner",
    properties: [
      { id: "prop-sc-108", name: "Super Corridor Plot 108", area: "Super Corridor Phase 2", type: "Plot" },
      { id: "prop-vn-house", name: "Vijay Nagar Residence", area: "Scheme 54", type: "Villa" },
      { id: "prop-omaxe-villa", name: "Omaxe City Palm Villa", area: "AB Bypass Road", type: "Apartment" },
    ],
  },
  {
    id: "usr-02",
    name: "Dr. Rajeshwar Mehta",
    email: "r.mehta@chokhani.in",
    phone: "+91 94250 88219",
    city: "Indore",
    joinedDate: "28 Feb 2026",
    lastActive: "15m ago",
    propertiesCount: 2,
    docsCount: 8,
    status: "verified",
    role: "Investor",
    properties: [
      { id: "prop-rm-1", name: "Rau Commercial Hub Shop 14", area: "Rau Bypass", type: "Commercial" },
      { id: "prop-rm-2", name: "Nipania Eden Garden Plot 42", area: "Nipania", type: "Plot" },
    ],
  },
  {
    id: "usr-03",
    name: "Priya Patel",
    email: "priya.patel.idr@gmail.com",
    phone: "+91 97130 55412",
    city: "Indore",
    joinedDate: "02 Mar 2026",
    lastActive: "2 hours ago",
    propertiesCount: 1,
    docsCount: 5,
    status: "active",
    role: "Property Owner",
    properties: [
      { id: "prop-pp-1", name: "Mahalaxmi Nagar 2BHK", area: "Mahalaxmi Nagar", type: "Flat" },
    ],
  },
  {
    id: "usr-04",
    name: "Vikram Rathore",
    email: "vikram.buildcon@rathore.co",
    phone: "+91 98930 22108",
    city: "Bhopal",
    joinedDate: "10 Mar 2026",
    lastActive: "Today, 11:20 AM",
    propertiesCount: 5,
    docsCount: 22,
    status: "verified",
    role: "Builder / Contractor",
    properties: [
      { id: "prop-vr-1", name: "Arera Colony Bungalow 12", area: "Arera Colony", type: "Villa" },
      { id: "prop-vr-2", name: "Kolar Road Township Site", area: "Kolar Road", type: "Plot" },
    ],
  },
  {
    id: "usr-05",
    name: "Ananya Sengupta",
    email: "ananya.s@ncr-tech.org",
    phone: "+91 99100 48291",
    city: "Delhi-NCR",
    joinedDate: "18 Mar 2026",
    lastActive: "Yesterday",
    propertiesCount: 1,
    docsCount: 2,
    status: "pending_kyc",
    role: "Property Owner",
    properties: [
      { id: "prop-as-1", name: "Golf Course Ext Studio", area: "Sector 65, Gurgaon", type: "Flat" },
    ],
  },
  {
    id: "usr-06",
    name: "Harishankar Joshi",
    email: "joshi.h.shankar@rediffmail.com",
    phone: "+91 98270 91402",
    city: "Ujjain",
    joinedDate: "24 Mar 2026",
    lastActive: "3 days ago",
    propertiesCount: 2,
    docsCount: 6,
    status: "active",
    role: "Property Owner",
    properties: [
      { id: "prop-hj-1", name: "Freeganj Heritage House", area: "Freeganj", type: "Villa" },
    ],
  },
  {
    id: "usr-07",
    name: "Sunil Jain & Sons",
    email: "suniljain.prop@indoredeals.in",
    phone: "+91 98263 77114",
    city: "Indore",
    joinedDate: "05 Apr 2026",
    lastActive: "1 week ago",
    propertiesCount: 0,
    docsCount: 0,
    status: "suspended",
    role: "Investor",
    properties: [],
  },
];

interface AdminListing {
  id: string;
  title: string;
  sellerName: string;
  phone: string;
  locality: string;
  city: string;
  type: string;
  price: number;
  ratePerSqft: number;
  carpetAreaSqft: number;
  postedDate: string;
  status: "pending" | "approved" | "rejected";
  papersVerified: boolean;
  featured: boolean;
  rejectionReason?: string;
}

const INITIAL_LISTINGS: AdminListing[] = [
  {
    id: "list-01",
    title: "1,500 sqft Corner Residential Plot",
    sellerName: "Akshay Sharma",
    phone: "+91 98260 14820",
    locality: "Super Corridor Phase 2, Sector C",
    city: "Indore",
    type: "Plot",
    price: 5400000,
    ratePerSqft: 3600,
    carpetAreaSqft: 1500,
    postedDate: "Today, 09:15 AM",
    status: "pending",
    papersVerified: true,
    featured: false,
  },
  {
    id: "list-02",
    title: "3 BHK Luxury Independent House with Garden",
    sellerName: "Priya Patel",
    phone: "+91 97130 55412",
    locality: "Scheme 54, PU-4, Vijay Nagar",
    city: "Indore",
    type: "Villa",
    price: 14800000,
    ratePerSqft: 6166,
    carpetAreaSqft: 2400,
    postedDate: "Yesterday",
    status: "approved",
    papersVerified: true,
    featured: true,
  },
  {
    id: "list-03",
    title: "2 BHK Ready-to-Move Flat near Metro",
    sellerName: "Deepak Choudhary",
    phone: "+91 98268 44102",
    locality: "Bhawarkua Main Road",
    city: "Indore",
    type: "Flat",
    price: 3850000,
    ratePerSqft: 3850,
    carpetAreaSqft: 1000,
    postedDate: "2 days ago",
    status: "approved",
    papersVerified: false,
    featured: false,
  },
  {
    id: "list-04",
    title: "Commercial Bypass Highway Land 5,000 sqft",
    sellerName: "Sunil Jain",
    phone: "+91 98263 77114",
    locality: "AB Bypass, Near Best Price",
    city: "Indore",
    type: "Commercial",
    price: 28500000,
    ratePerSqft: 5700,
    carpetAreaSqft: 5000,
    postedDate: "3 days ago",
    status: "rejected",
    papersVerified: false,
    featured: false,
    rejectionReason: "Title chain papers incomplete; namantaran order missing.",
  },
];

interface MaterialRateAdmin {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  rate: number;
  lastUpdated: string;
  source: string;
  trend: "up" | "down" | "stable";
  change: string;
}

const INITIAL_RATES: MaterialRateAdmin[] = [
  {
    id: "r-tmt-1",
    name: "TMT Steel Bars (Fe 550D)",
    category: "Steel",
    brand: "Tata Tiscon / Kamdhenu",
    unit: "per Metric Ton",
    rate: 56800,
    lastUpdated: "Today, 07:30 AM",
    source: "Loha Mandi, Indore (Auto Scraped)",
    trend: "up",
    change: "+₹800",
  },
  {
    id: "r-tmt-2",
    name: "TMT Steel Bars (Fe 500D)",
    category: "Steel",
    brand: "Moira / Prime Gold",
    unit: "per Metric Ton",
    rate: 54200,
    lastUpdated: "Today, 07:30 AM",
    source: "Loha Mandi, Indore (Auto Scraped)",
    trend: "stable",
    change: "₹0",
  },
  {
    id: "r-cem-1",
    name: "UltraTech Super PPC Cement",
    category: "Cement",
    brand: "Grade 53 PPC High Strength",
    unit: "per 50kg Bag",
    rate: 385,
    lastUpdated: "Today, 07:30 AM",
    source: "Dewas Naka, Indore (Auto Scraped)",
    trend: "up",
    change: "+₹5",
  },
  {
    id: "r-cem-2",
    name: "Ambuja Kawach Cement",
    category: "Cement",
    brand: "Water-Shield PPC",
    unit: "per 50kg Bag",
    rate: 375,
    lastUpdated: "Today, 07:30 AM",
    source: "Dewas Naka, Indore (Auto Scraped)",
    trend: "stable",
    change: "₹0",
  },
  {
    id: "r-snd-1",
    name: "Narmada River Sand",
    category: "Sand",
    brand: "Coarse Screened Sand",
    unit: "per CFT (cu.ft)",
    rate: 48,
    lastUpdated: "Today, 07:30 AM",
    source: "Nemawar Road Depot (Auto Scraped)",
    trend: "up",
    change: "+₹2",
  },
  {
    id: "r-snd-2",
    name: "Crushed M-Sand (Manufactured)",
    category: "Sand",
    brand: "Double Washed Stone Dust",
    unit: "per CFT (cu.ft)",
    rate: 34,
    lastUpdated: "Today, 07:30 AM",
    source: "Rau Quarry Depot (Auto Scraped)",
    trend: "stable",
    change: "₹0",
  },
  {
    id: "r-agg-1",
    name: "Black Stone Chips (Gitti 20mm)",
    category: "Aggregate",
    brand: "Crushed Basalt Blue Metal",
    unit: "per CFT (cu.ft)",
    rate: 38,
    lastUpdated: "Today, 07:30 AM",
    source: "Bypass Stone Crushers (Auto Scraped)",
    trend: "down",
    change: "-₹1",
  },
  {
    id: "r-brk-1",
    name: "Red Kiln Clay Bricks (Class 1)",
    category: "Bricks",
    brand: "Standard First-Class Clay",
    unit: "per piece",
    rate: 8.5,
    lastUpdated: "Today, 07:30 AM",
    source: "Sanwer Road Bhattas (Auto Scraped)",
    trend: "stable",
    change: "₹0",
  },
];

// ==========================================
// MAIN ADMIN DASHBOARD COMPONENT
// ==========================================

export default function AdminPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "listings" | "rates" | "system">("analytics");

  // State collections
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [listings, setListings] = useState<AdminListing[]>(INITIAL_LISTINGS);
  const [rates, setRates] = useState<MaterialRateAdmin[]>(INITIAL_RATES);

  // User filters & search
  const [userSearch, setUserSearch] = useState("");
  const [userCityFilter, setUserCityFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [selectedUserPortfolio, setSelectedUserPortfolio] = useState<AdminUser | null>(null);

  // Listing filters
  const [listingFilter, setListingFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [rejectModalListing, setRejectModalListing] = useState<AdminListing | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Rate Editing
  const [editingRateItem, setEditingRateItem] = useState<MaterialRateAdmin | null>(null);
  const [editingRateValue, setEditingRateValue] = useState("");
  const [isScrapingRunning, setIsScrapingRunning] = useState(false);

  // Toasts / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.city.toLowerCase().includes(q);

      const matchesCity = userCityFilter === "all" || u.city.toLowerCase() === userCityFilter.toLowerCase();
      const matchesStatus = userStatusFilter === "all" || u.status === userStatusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [users, userSearch, userCityFilter, userStatusFilter]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    if (listingFilter === "all") return listings;
    return listings.filter((l) => l.status === listingFilter);
  }, [listings, listingFilter]);

  const pendingListingsCount = useMemo(() => {
    return listings.filter((l) => l.status === "pending").length;
  }, [listings]);

  // Action: Export CSV
  function handleExportUsersCSV() {
    const headers = ["ID", "Name", "Email", "Phone", "City", "Role", "Status", "Properties", "Vault Docs", "Joined"];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.phone,
      u.city,
      `"${u.role}"`,
      u.status,
      u.propertiesCount,
      u.docsCount,
      `"${u.joinedDate}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sukoon-users-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredUsers.length} users to CSV`);
  }

  // Action: Toggle User Status
  function handleToggleUserStatus(userId: string) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const nextStatus = u.status === "suspended" ? "active" : "suspended";
        showToast(`User ${u.name} is now ${nextStatus}`);
        return { ...u, status: nextStatus };
      })
    );
  }

  // Action: Send Login Link / OTP
  function handleSendLoginLink(user: AdminUser) {
    showToast(`Login OTP & magic link sent to ${user.email}`);
  }

  // Action: Approve Listing
  function handleApproveListing(id: string) {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "approved" as const, papersVerified: true } : l))
    );
    showToast("Listing approved & published live to marketplace!");
  }

  // Action: Reject Listing
  function handleRejectSubmit() {
    if (!rejectModalListing) return;
    setListings((prev) =>
      prev.map((l) =>
        l.id === rejectModalListing.id
          ? { ...l, status: "rejected" as const, rejectionReason: rejectionReasonInput || "Details require resubmission." }
          : l
      )
    );
    setRejectModalListing(null);
    setRejectionReasonInput("");
    showToast("Listing rejected with notification sent to seller.");
  }

  // Action: Save Material Rate Override
  function handleSaveRateOverride() {
    if (!editingRateItem || !editingRateValue) return;
    const num = parseFloat(editingRateValue);
    if (isNaN(num) || num <= 0) {
      alert("Please enter a valid rate");
      return;
    }

    setRates((prev) =>
      prev.map((r) =>
        r.id === editingRateItem.id
          ? {
              ...r,
              rate: num,
              lastUpdated: "Just now (Admin override)",
              source: "Manually set by Administrator",
            }
          : r
      )
    );

    showToast(`Updated rate for ${editingRateItem.name} to ₹${num.toLocaleString("en-IN")}`);
    setEditingRateItem(null);
  }

  // Action: Trigger Scraper
  function handleTriggerScraper() {
    setIsScrapingRunning(true);
    setTimeout(() => {
      setIsScrapingRunning(false);
      setRates((prev) =>
        prev.map((r) => ({
          ...r,
          lastUpdated: "Just now (Live Scrape)",
          source: r.source.replace("Manually set by Administrator", "Loha Mandi & Dewas Naka (Auto Scraped)"),
        }))
      );
      showToast("Scraper pipeline completed successfully! All 8 materials synced.");
    }, 1800);
  }

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#1B2922] pb-24 font-sans selection:bg-[#1E5637] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#182C22] text-[#F3F6F4] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 border border-emerald-950/30">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E2D5] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="tap-scale flex items-center gap-2 shrink-0">
            <Image
              src="/images/sukoon-brand-logo.png"
              alt="Sukoon"
              width={110}
              height={32}
              priority
              className="h-6 w-auto mix-blend-multiply"
            />
          </Link>
          <div className="h-5 w-[1px] bg-[#DDD6C8]" />
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[#1E5637] text-white text-[10px] font-bold tracking-wider uppercase">
              Admin Portal
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-[#7C8B82]">
              Operator Control Center
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand/80 border border-line text-[11px] font-semibold text-[#486354]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Indore Hub · Production</span>
          </div>

          <Link
            href="/"
            className="tap-scale text-[12px] font-bold px-3 py-1.5 rounded-full border border-forest/20 hover:bg-sand text-forest transition"
          >
            Exit to App &rarr;
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* TITLE & TABS HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16271E]">
              Platform Administration
            </h1>
            <p className="text-xs sm:text-sm text-[#6E7D73] mt-0.5">
              Manage user signups, moderate verified marketplace deals, and oversee live construction mandi rates.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerScraper}
              disabled={isScrapingRunning}
              className="tap-scale inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-sand border border-[#DCD5C6] text-xs font-bold text-forest shadow-2xs transition"
            >
              <RefreshCw size={13} className={isScrapingRunning ? "animate-spin text-forest" : "text-forest"} />
              <span>{isScrapingRunning ? "Syncing Mandi..." : "Run Material Scraper"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportUsersCSV}
              className="tap-scale inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-forest hover:bg-forest/90 text-white text-xs font-bold shadow-2xs transition"
            >
              <Download size={13} />
              <span>Export Users (CSV)</span>
            </button>
          </div>
        </div>

        {/* TABS SWITCHER */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-[#E5DFD2] shadow-2xs overflow-x-auto scrollbar-none mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`tap-scale flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-[#1E5637] text-white shadow-xs"
                : "text-[#5A6E63] hover:text-[#16271E] hover:bg-sand/60"
            }`}
          >
            <BarChart3 size={15} />
            <span>Overview &amp; Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`tap-scale flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "users"
                ? "bg-[#1E5637] text-white shadow-xs"
                : "text-[#5A6E63] hover:text-[#16271E] hover:bg-sand/60"
            }`}
          >
            <Users size={15} />
            <span>Signups &amp; Users</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`tap-scale flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "listings"
                ? "bg-[#1E5637] text-white shadow-xs"
                : "text-[#5A6E63] hover:text-[#16271E] hover:bg-sand/60"
            }`}
          >
            <Building2 size={15} />
            <span>Listings Queue</span>
            {pendingListingsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                {pendingListingsCount} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rates")}
            className={`tap-scale flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "rates"
                ? "bg-[#1E5637] text-white shadow-xs"
                : "text-[#5A6E63] hover:text-[#16271E] hover:bg-sand/60"
            }`}
          >
            <Hammer size={15} />
            <span>Material Rates Control</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`tap-scale flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "system"
                ? "bg-[#1E5637] text-white shadow-xs"
                : "text-[#5A6E63] hover:text-[#16271E] hover:bg-sand/60"
            }`}
          >
            <ShieldCheck size={15} />
            <span>System Health</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: ANALYTICS & OVERVIEW
            ======================================================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD2] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#6E7D73] uppercase tracking-wider">
                    Total Signups
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#16271E]">1,482</span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                    <ArrowUpRight size={14} /> +14%
                  </span>
                </div>
                <span className="text-[10.5px] text-[#8C9B92] mt-1 block">38 new registrations this week</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD2] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#6E7D73] uppercase tracking-wider">
                    Active Users (DAU)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <UserCheck size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#16271E]">328</span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                    <ArrowUpRight size={14} /> +9%
                  </span>
                </div>
                <span className="text-[10.5px] text-[#8C9B92] mt-1 block">74% accessing via mobile</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD2] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#6E7D73] uppercase tracking-wider">
                    Vault Papers Stored
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#16271E]">4,190</span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                    <ArrowUpRight size={14} /> +22%
                  </span>
                </div>
                <span className="text-[10.5px] text-[#8C9B92] mt-1 block">Registries, Khasra &amp; Tax receipts</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD2] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#6E7D73] uppercase tracking-wider">
                    Marketplace Deals
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#16271E]">48</span>
                  <span className="text-xs font-semibold text-amber-600">
                    ({pendingListingsCount} pending)
                  </span>
                </div>
                <span className="text-[10.5px] text-[#8C9B92] mt-1 block">₹42.6 Cr total property inventory</span>
              </div>
            </div>

            {/* Middle Section: Feature Breakdown & Geography */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feature Engagement */}
              <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-[#E5DFD2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#16271E]">Module Engagement Breakdown</h2>
                    <p className="text-xs text-[#7C8B82]">Where active users spend their time</p>
                  </div>
                  <span className="text-[11px] font-semibold text-forest bg-mint/50 px-2.5 py-1 rounded-full border border-forest/15">
                    Past 30 Days
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-[#1B2922]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E5637]" />
                        Vault (Papers, Registries &amp; Namantaran)
                      </span>
                      <span className="text-forest">44% (1,843 views)</span>
                    </div>
                    <div className="h-2 w-full bg-[#F0ECE1] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1E5637] rounded-full w-[44%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-[#1B2922]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#B26315]" />
                        Construction OS (0 to 1 Build Journey &amp; Milestones)
                      </span>
                      <span className="text-[#B26315]">28% (1,173 views)</span>
                    </div>
                    <div className="h-2 w-full bg-[#F0ECE1] rounded-full overflow-hidden">
                      <div className="h-full bg-[#B26315] rounded-full w-[28%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-[#1B2922]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E57A4]" />
                        Buy &amp; Sell Marketplace &amp; Smart Matchmaker
                      </span>
                      <span className="text-[#1E57A4]">16% (670 views)</span>
                    </div>
                    <div className="h-2 w-full bg-[#F0ECE1] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1E57A4] rounded-full w-[16%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-[#1B2922]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#B84E2A]" />
                        Daily Material Rates (Cement, TMT Steel, Sand)
                      </span>
                      <span className="text-[#B84E2A]">8% (335 views)</span>
                    </div>
                    <div className="h-2 w-full bg-[#F0ECE1] rounded-full overflow-hidden">
                      <div className="h-full bg-[#B84E2A] rounded-full w-[8%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-[#1B2922]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#553C9A]" />
                        Notary Drafts, Indian Stocks &amp; Guidelines
                      </span>
                      <span className="text-[#553C9A]">4% (168 views)</span>
                    </div>
                    <div className="h-2 w-full bg-[#F0ECE1] rounded-full overflow-hidden">
                      <div className="h-full bg-[#553C9A] rounded-full w-[4%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="p-5 rounded-3xl bg-white border border-[#E5DFD2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#16271E]">Top Cities</h2>
                    <p className="text-xs text-[#7C8B82]">User demographic presence</p>
                  </div>
                  <MapPin size={16} className="text-forest" />
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-sand/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#1E5637] text-white text-[11px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#16271E]">Indore (MP)</p>
                        <p className="text-[10px] text-[#7C8B82]">Super Corridor, Vijay Nagar, Bypass</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-forest">64%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-sand/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-forest/20 text-forest text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#16271E]">Bhopal / Ujjain</p>
                        <p className="text-[10px] text-[#7C8B82]">Arera Colony, Freeganj</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-forest">18%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-sand/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-forest/20 text-forest text-[11px] font-bold flex items-center justify-center">
                        3
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#16271E]">Delhi-NCR</p>
                        <p className="text-[10px] text-[#7C8B82]">Gurgaon, Noida NRI investors</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-forest">11%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-sand/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-forest/20 text-forest text-[11px] font-bold flex items-center justify-center">
                        4
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#16271E]">Mumbai &amp; Other</p>
                        <p className="text-[10px] text-[#7C8B82]">Outstation buyers</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-forest">7%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: SIGNUPS & USERS DIRECTORY
            ======================================================== */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search & Filters Bar */}
            <div className="p-4 rounded-3xl bg-white border border-[#E5DFD2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9B92]" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or city..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-sand/50 border border-line text-xs text-[#1B2922] placeholder:text-[#8C9B92] focus:outline-none focus:border-forest/50 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {/* City Filter */}
                <select
                  value={userCityFilter}
                  onChange={(e) => setUserCityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-sand/50 border border-line text-xs font-semibold text-[#2C4136] focus:outline-none focus:border-forest/50"
                >
                  <option value="all">All Cities</option>
                  <option value="Indore">Indore</option>
                  <option value="Bhopal">Bhopal</option>
                  <option value="Delhi-NCR">Delhi-NCR</option>
                  <option value="Ujjain">Ujjain</option>
                </select>

                {/* Status Filter */}
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-sand/50 border border-line text-xs font-semibold text-[#2C4136] focus:outline-none focus:border-forest/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="active">Active</option>
                  <option value="pending_kyc">Pending KYC</option>
                  <option value="suspended">Suspended</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportUsersCSV}
                  className="tap-scale px-3 py-2 rounded-xl bg-forest text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl border border-[#E5DFD2] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-sand/60 border-b border-[#E8E2D5] text-[#5A6E63] font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">City &amp; Role</th>
                      <th className="py-3 px-4">Portfolio</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#7C8B82] text-xs">
                          No users found matching &ldquo;{userSearch}&rdquo;
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-sand/30 transition group">
                          {/* User Name & ID */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#182C22] text-[#F3F6F4] font-bold text-xs flex items-center justify-center shrink-0">
                                {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-[#16271E]">{u.name}</p>
                                <p className="text-[10px] text-[#8C9B92]">Joined {u.joinedDate}</p>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3 px-4">
                            <p className="text-[#16271E] font-medium flex items-center gap-1">
                              <Mail size={11} className="text-[#8C9B92]" /> {u.email}
                            </p>
                            <p className="text-[#6E7D73] text-[10.5px] flex items-center gap-1 mt-0.5">
                              <Phone size={11} className="text-[#8C9B92]" /> {u.phone}
                            </p>
                          </td>

                          {/* City & Role */}
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#16271E]">{u.city}</p>
                            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-sand text-[#486354] mt-0.5 border border-line/60">
                              {u.role}
                            </span>
                          </td>

                          {/* Portfolio Counts */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => setSelectedUserPortfolio(u)}
                              className="text-left group/btn"
                            >
                              <p className="font-bold text-forest group-hover/btn:underline">
                                {u.propertiesCount} {u.propertiesCount === 1 ? "Property" : "Properties"}
                              </p>
                              <p className="text-[10px] text-[#7C8B82]">{u.docsCount} Vault Papers</p>
                            </button>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            {u.status === "verified" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10.5px]">
                                <ShieldCheck size={11} /> Verified
                              </span>
                            )}
                            {u.status === "active" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[10.5px]">
                                Active
                              </span>
                            )}
                            {u.status === "pending_kyc" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10.5px]">
                                <Clock size={11} /> Pending KYC
                              </span>
                            )}
                            {u.status === "suspended" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 font-semibold text-[10.5px]">
                                <XCircle size={11} /> Suspended
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="View Portfolio"
                                onClick={() => setSelectedUserPortfolio(u)}
                                className="tap-scale p-1.5 rounded-lg bg-sand/70 hover:bg-sand text-[#3D5A4A]"
                              >
                                <Eye size={13} />
                              </button>

                              <button
                                type="button"
                                title="Send Login OTP Link"
                                onClick={() => handleSendLoginLink(u)}
                                className="tap-scale p-1.5 rounded-lg bg-sand/70 hover:bg-sand text-[#3D5A4A]"
                              >
                                <Mail size={13} />
                              </button>

                              <button
                                type="button"
                                title={u.status === "suspended" ? "Reactivate User" : "Suspend User"}
                                onClick={() => handleToggleUserStatus(u.id)}
                                className={`tap-scale p-1.5 rounded-lg text-xs font-semibold ${
                                  u.status === "suspended"
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-red-50 text-red-700 hover:bg-red-100"
                                }`}
                              >
                                {u.status === "suspended" ? "Activate" : "Suspend"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: MARKETPLACE LISTINGS APPROVAL QUEUE
            ======================================================== */}
        {activeTab === "listings" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Pill Switcher */}
            <div className="flex items-center justify-between p-3.5 rounded-3xl bg-white border border-[#E5DFD2] shadow-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setListingFilter("all")}
                  className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    listingFilter === "all" ? "bg-[#1E5637] text-white" : "bg-sand/60 text-[#5A6E63]"
                  }`}
                >
                  All ({listings.length})
                </button>

                <button
                  type="button"
                  onClick={() => setListingFilter("pending")}
                  className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    listingFilter === "pending"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  Pending Review ({pendingListingsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setListingFilter("approved")}
                  className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    listingFilter === "approved" ? "bg-emerald-700 text-white" : "bg-sand/60 text-[#5A6E63]"
                  }`}
                >
                  Approved Live
                </button>

                <button
                  type="button"
                  onClick={() => setListingFilter("rejected")}
                  className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    listingFilter === "rejected" ? "bg-red-700 text-white" : "bg-sand/60 text-[#5A6E63]"
                  }`}
                >
                  Rejected
                </button>
              </div>

              <span className="text-xs text-[#7C8B82] hidden sm:inline">
                Approved listings appear live on the Buy &amp; Sell Marketplace
              </span>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white border border-[#E5DFD2] shadow-xs flex flex-col justify-between hover:shadow-sm transition"
                >
                  <div>
                    {/* Header Row: Status Badge & Verified Papers Indicator */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        {item.status === "pending" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-bold inline-flex items-center gap-1">
                            <Clock size={11} /> Pending Review
                          </span>
                        )}
                        {item.status === "approved" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Live on Marketplace
                          </span>
                        )}
                        {item.status === "rejected" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-800 text-[10.5px] font-bold inline-flex items-center gap-1">
                            <XCircle size={11} /> Rejected
                          </span>
                        )}

                        {item.featured && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold inline-flex items-center gap-1">
                            <Sparkles size={10} /> Featured Deal
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-[#8C9B92]">{item.postedDate}</span>
                    </div>

                    {/* Title & Locality */}
                    <h3 className="text-sm font-bold text-[#16271E] leading-snug">{item.title}</h3>
                    <p className="text-xs text-[#6E7D73] flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-forest" /> {item.locality}, {item.city}
                    </p>

                    {/* Pricing & Area Stats */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-sand/40 border border-line/60 my-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#7C8B82] font-semibold block">
                          Asking Price
                        </span>
                        <span className="text-sm font-extrabold text-[#1E5637]">
                          ₹{(item.price / 100000).toFixed(2)} Lakhs
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#7C8B82] font-semibold block">
                          Rate / Sqft
                        </span>
                        <span className="text-sm font-bold text-[#1B2922]">
                          ₹{item.ratePerSqft.toLocaleString("en-IN")}/sqft
                        </span>
                      </div>
                    </div>

                    {/* Seller Details */}
                    <div className="text-xs text-[#52665B] space-y-0.5">
                      <p>
                        <strong>Seller:</strong> {item.sellerName} ({item.phone})
                      </p>
                      <p className="flex items-center gap-1">
                        <strong>Legal Papers:</strong>
                        {item.papersVerified ? (
                          <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                            <ShieldCheck size={12} /> Registry + Namantaran Verified
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold">Self-asserted (Unverified)</span>
                        )}
                      </p>
                      {item.rejectionReason && (
                        <p className="text-red-700 text-[11px] font-medium bg-red-50 p-2 rounded-xl mt-1">
                          <strong>Reason:</strong> {item.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons for Listing */}
                  <div className="border-t border-[#F0ECE1] pt-3 mt-3 flex items-center justify-end gap-2">
                    {item.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleApproveListing(item.id)}
                        className="tap-scale px-3.5 py-1.5 rounded-full bg-forest text-white text-xs font-bold shadow-2xs hover:bg-forest/90 transition flex items-center gap-1"
                      >
                        <Check size={13} />
                        <span>Approve &amp; Publish</span>
                      </button>
                    )}

                    {item.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectModalListing(item);
                          setRejectionReasonInput("");
                        }}
                        className="tap-scale px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition flex items-center gap-1"
                      >
                        <X size={13} />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: MATERIAL RATES CONTROL & OVERRIDE
            ======================================================== */}
        {activeTab === "rates" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Scraper Status Bar */}
            <div className="p-4 rounded-3xl bg-white border border-[#E5DFD2] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Hammer size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#16271E]">
                    Indore Mandi Daily Scraper Pipeline
                  </h2>
                  <p className="text-xs text-[#7C8B82]">
                    Auto-scrapes Loha Mandi, Dewas Naka cement depots, and Nemawar sand quarries every morning.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerScraper}
                  disabled={isScrapingRunning}
                  className="tap-scale px-4 py-2 rounded-full bg-forest text-white text-xs font-bold shadow-2xs flex items-center gap-1.5"
                >
                  <RefreshCw size={13} className={isScrapingRunning ? "animate-spin" : ""} />
                  <span>{isScrapingRunning ? "Scraping..." : "Sync Rates Now"}</span>
                </button>
              </div>
            </div>

            {/* Rates Table with Inline Edit */}
            <div className="bg-white rounded-3xl border border-[#E5DFD2] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-sand/60 border-b border-[#E8E2D5] text-[#5A6E63] font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Material &amp; Brand</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Current Rate (Indore)</th>
                      <th className="py-3 px-4">Source &amp; Sync</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1]">
                    {rates.map((item) => (
                      <tr key={item.id} className="hover:bg-sand/30 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#16271E]">{item.name}</p>
                          <p className="text-[10.5px] text-[#7C8B82]">{item.brand}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-sand text-[#486354] font-semibold text-[10px]">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#6E7D73] font-medium">{item.unit}</td>

                        <td className="py-3 px-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-extrabold text-sm text-[#1E5637]">
                              ₹{item.rate.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                item.trend === "up"
                                  ? "text-red-600"
                                  : item.trend === "down"
                                  ? "text-emerald-600"
                                  : "text-[#8C9B92]"
                              }`}
                            >
                              {item.change}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="text-[11px] font-semibold text-[#16271E]">{item.source}</p>
                          <p className="text-[10px] text-[#8C9B92]">{item.lastUpdated}</p>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRateItem(item);
                              setEditingRateValue(item.rate.toString());
                            }}
                            className="tap-scale px-3 py-1.5 rounded-xl bg-sand/70 hover:bg-sand text-forest font-bold text-xs inline-flex items-center gap-1 border border-line/60"
                          >
                            <Edit3 size={12} />
                            <span>Edit Rate</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: SYSTEM & SCRAPER DIAGNOSTICS
            ======================================================== */}
        {activeTab === "system" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-5 rounded-3xl bg-white border border-[#E5DFD2] shadow-xs">
              <h2 className="text-base font-bold text-[#16271E] mb-1">Infrastructure &amp; Pipeline Status</h2>
              <p className="text-xs text-[#7C8B82] mb-5">
                Core services powering Sukoon Proptech platform
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-sand/40 border border-line/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#16271E]">Daily Rates Scraper (GitHub Actions)</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        Healthy
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E7D73] mt-0.5">
                      Cron: Every day at 02:00 UTC (07:30 AM IST). Last run finished with 0 failures.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sand/40 border border-line/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#16271E]">PostgreSQL Database (Neon / Supabase)</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E7D73] mt-0.5">
                      Pool size: 10 connections · Latency: 24ms · Non-expiring persistent storage.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sand/40 border border-line/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#16271E]">Vault S3 Object Storage</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E7D73] mt-0.5">
                      4.2 GB / 25 GB used · Private signed URLs for property deed PDFs &amp; registry copies.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sand/40 border border-line/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#16271E]">ClamAV Document Antivirus Scanner</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        Operational
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E7D73] mt-0.5">
                      Port 3310 private daemon · Daily fresh signature updates active.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: USER PORTFOLIO VIEWER
          ======================================================== */}
      {selectedUserPortfolio && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#182C22] text-[#F3F6F4] font-bold text-xs flex items-center justify-center">
                  {selectedUserPortfolio.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-[#16271E]">{selectedUserPortfolio.name}</h3>
                  <p className="text-[11px] text-[#7C8B82]">{selectedUserPortfolio.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserPortfolio(null)}
                className="p-1 rounded-full text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              <div className="p-3 rounded-2xl bg-sand/40 border border-line/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#7C8B82] uppercase font-bold block">User Role</span>
                  <span className="font-semibold text-[#16271E]">{selectedUserPortfolio.role}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7C8B82] uppercase font-bold block">Status</span>
                  <span className="font-bold capitalize text-forest">{selectedUserPortfolio.status}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C8B82] mb-2">
                  Properties Managed ({selectedUserPortfolio.properties.length})
                </h4>
                {selectedUserPortfolio.properties.length === 0 ? (
                  <p className="text-xs text-[#7C8B82] italic py-2">No properties added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUserPortfolio.properties.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-sand/30 border border-line/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2 size={16} className="text-forest" />
                          <div>
                            <p className="text-xs font-bold text-[#16271E]">{p.name}</p>
                            <p className="text-[10px] text-[#7C8B82]">{p.area}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sand text-[#486354]">
                          {p.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-line pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserPortfolio(null)}
                className="px-4 py-2 rounded-full bg-sand text-[#1B2922] text-xs font-bold hover:bg-sand/80 transition"
              >
                Close Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REJECT LISTING REASON
          ======================================================== */}
      {rejectModalListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#16271E]">Reject Listing</h3>
              <p className="text-xs text-[#7C8B82] mt-0.5">
                Provide feedback to seller &ldquo;{rejectModalListing.sellerName}&rdquo; explaining why this listing was not approved.
              </p>
            </div>

            <textarea
              rows={3}
              placeholder="e.g. Incomplete title deed, discrepancy in carpet area, or price outlier..."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="w-full p-3 rounded-2xl border border-line bg-sand/30 text-xs text-[#1B2922] focus:outline-none focus:border-red-400 focus:bg-white resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalListing(null)}
                className="px-3.5 py-2 rounded-full bg-sand text-xs font-bold text-[#1B2922]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT MATERIAL RATE OVERRIDE
          ======================================================== */}
      {editingRateItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#16271E]">Edit Material Mandi Rate</h3>
              <p className="text-xs text-[#7C8B82] mt-0.5">
                {editingRateItem.name} ({editingRateItem.unit})
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5A6E63] uppercase tracking-wider block mb-1">
                New Rate (₹)
              </label>
              <input
                type="number"
                step="any"
                value={editingRateValue}
                onChange={(e) => setEditingRateValue(e.target.value)}
                className="w-full p-3 rounded-2xl border border-line bg-sand/30 text-sm font-extrabold text-[#1E5637] focus:outline-none focus:border-forest focus:bg-white"
              />
              <span className="text-[10px] text-[#8C9B92] mt-1 block">
                This rate will update immediately across all construction estimates in Sukoon.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRateItem(null)}
                className="px-3.5 py-2 rounded-full bg-sand text-xs font-bold text-[#1B2922]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRateOverride}
                className="px-4 py-2 rounded-full bg-forest text-white text-xs font-bold hover:bg-forest/90 transition"
              >
                Save Rate Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

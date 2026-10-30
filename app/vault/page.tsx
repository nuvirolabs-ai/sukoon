"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  FileCheck,
  FilePlus,
  FileText,
  FolderOpen,
  IndianRupee,
  Lightbulb,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { PinToHomeButton } from "@/components/PinToHomeButton";
import type { DocType, Property, PropertyType } from "@/lib/types";

type VaultSection = "docs" | "portfolio" | "manage" | "single";

interface VaultDocItem {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  type: string;
  authority: string;
  khasra: string;
  date: string;
  status: string;
  pages: string;
  fileSize: string;
}

interface PropertyReceipt {
  id: string;
  propertyId: string;
  propertyName: string;
  type: "Rent" | "Lease Advance" | "Security Deposit" | "Parking Fee" | "Commercial Rent";
  payerName: string;
  amount: number;
  dueDate: string;
  status: "pending" | "received";
  receivedDate?: string;
}

interface PropertyPaymentItem {
  id: string;
  propertyId: string;
  propertyName: string;
  utilityType:
    | "Property Tax (Nagar Nigam)"
    | "Diversion Tax (Revenue / Vyapavartan)"
    | "Society Deposit & Maintenance"
    | "Wealth Tax / Capital Asset Filing"
    | "Electricity (Discom)"
    | "Water Bill (IMC)"
    | "Piped Gas (PNG)"
    | "Guard & Security"
    | "Other Outflow";
  amount: number;
  dueDate: string;
  consumerNumber: string;
  status: "pending" | "paid";
  paidDate?: string;
  timelyReminder?: boolean;
}

interface RepairAlert {
  id: string;
  propertyId: string;
  propertyName: string;
  taskTitle: string;
  frequency: "One-time Repair" | "Quarterly" | "Bi-annual" | "Yearly";
  scheduledDate: string;
  estimatedCost: number;
  hasReminder: boolean;
  status: "pending" | "resolved";
  resolvedDate?: string;
}

// 4 Main Icons for Vault matching Home Page clean aesthetic
const VAULT_FEATURES = [
  {
    id: "docs" as const,
    title: "My Docs",
    subtitle: "Upload & Health Score",
    color: "#1E5637",
    icon: function MyDocsIcon() {
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
          <path d="M10 6h14l8 8v20H10z" />
          <path d="M24 6v8h8" />
          <path d="M16 18h10M16 23h10M16 28h5" />
          <circle cx="27" cy="27" r="3" />
        </svg>
      );
    },
  },
  {
    id: "portfolio" as const,
    title: "Property Portfolio",
    subtitle: "Net Worth & Value",
    color: "#B26315",
    icon: function PortfolioIcon() {
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
          <rect height="24" rx="2" width="24" x="8" y="10" />
          <path d="M14 10V6h12v4M8 18h24M18 18v6h4v-6" />
        </svg>
      );
    },
  },
  {
    id: "manage" as const,
    title: "Manage Properties",
    subtitle: "Receipts, Bills & Repairs",
    color: "#1E57A4",
    icon: function ManagePropertiesIcon() {
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
          <circle cx="20" cy="20" r="7" />
          <path d="M20 5v4M20 31v4M5 20h4M31 20h4M9.5 9.5l3 3M27.5 27.5l3 3M9.5 30.5l3-3M27.5 12.5l3-3" />
        </svg>
      );
    },
  },
  {
    id: "single" as const,
    title: "Find a Paper",
    subtitle: "Instant Keyword Search",
    color: "#553C9A",
    icon: function FindPaperIcon() {
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
          <rect height="26" rx="2" width="20" x="8" y="7" />
          <circle cx="24" cy="25" r="5" />
          <path d="M28 29l4 4" />
        </svg>
      );
    },
  },
];

const BASELINE_PAPERS: VaultDocItem[] = [
  {
    id: "reg-01",
    propertyId: "prop-sc-108",
    propertyName: "Super Corridor Plot 108",
    title: "Registered Sale Deed (Bikrinama)",
    authority: "Sub-Registrar of Stamps & Deeds, Indore",
    khasra: "Khasra No. 142/2/1",
    date: "14 Feb 2026",
    status: "Verified & Freehold",
    pages: "16 Pages",
    fileSize: "4.2 MB PDF",
    type: "Title Deed",
  },
  {
    id: "mut-02",
    propertyId: "prop-sc-108",
    propertyName: "Super Corridor Plot 108",
    title: "Revenue Mutation Order (Namantaran)",
    authority: "Tehsildar Office, Sanwer / Aerodrome",
    khasra: "B-1 / Khasra Extract 2026",
    date: "01 Mar 2026",
    status: "Title Clean",
    pages: "3 Pages",
    fileSize: "920 KB PDF",
    type: "Revenue Record",
  },
  {
    id: "tax-03",
    propertyId: "prop-vn-house",
    propertyName: "Vijay Nagar Residence",
    title: "IMC Property Tax Paid Receipt (2025-26)",
    authority: "Indore Municipal Corporation Ward 34",
    khasra: "Assessment #IMC-VN-42",
    date: "10 Apr 2026",
    status: "Zero Arrears",
    pages: "1 Page",
    fileSize: "380 KB PDF",
    type: "Tax Receipt",
  },
  {
    id: "noc-04",
    propertyId: "prop-sc-108",
    propertyName: "Super Corridor Plot 108",
    title: "Town & Country Planning Layout Sanction Map",
    authority: "Joint Director T&CP, Indore Division",
    khasra: "Sanction #TCP-IND-2024-91",
    date: "15 Oct 2025",
    status: "Approved Layout",
    pages: "4 Pages",
    fileSize: "2.1 MB PDF",
    type: "Sanction Map",
  },
  {
    id: "elec-05",
    propertyId: "prop-vn-house",
    propertyName: "Vijay Nagar Residence",
    title: "MPPKVVCL Domestic Electric Connection Order",
    authority: "West Discom Substation 4, Vijay Nagar",
    khasra: "Consumer #98421004",
    date: "12 Jan 2026",
    status: "Meter Active",
    pages: "2 Pages",
    fileSize: "610 KB PDF",
    type: "Utility",
  },
  {
    id: "reg-omaxe",
    propertyId: "prop-omaxe-villa",
    propertyName: "Omaxe City Palm Villa",
    title: "Absolute Conveyance Sale Deed",
    authority: "Sub-Registrar Indore District Registry",
    khasra: "Plot 18, Sector B, Omaxe City 1",
    date: "20 May 2025",
    status: "Verified & Freehold",
    pages: "14 Pages",
    fileSize: "3.8 MB PDF",
    type: "Title Deed",
  },
];

function VaultContent() {
  const searchParams = useSearchParams();
  const rawParam = searchParams.get("section") || "";

  // Map backward compatibility links
  const initialSection = useMemo<VaultSection>(() => {
    if (rawParam === "docs" || rawParam === "my-docs") return "docs";
    if (rawParam === "portfolio") return "portfolio";
    if (rawParam === "manage" || rawParam === "details") return "manage";
    if (rawParam === "single" || rawParam === "find") return "single";
    return "docs";
  }, [rawParam]);

  const [section, setSection] = useState<VaultSection>(initialSection);
  const { s, update } = useStore();

  // All properties available from user store
  const properties = s.properties || [];

  // ==========================================
  // A) MY DOCS STATE
  // ==========================================
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    properties[0]?.id || "prop-sc-108"
  );
  const [docsList, setDocsList] = useState<VaultDocItem[]>(() => {
    if (typeof window === "undefined") return BASELINE_PAPERS;
    try {
      const saved = localStorage.getItem("sukoon_vault_custom_docs");
      if (saved) return JSON.parse(saved);
    } catch {}
    return BASELINE_PAPERS;
  });

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Tax Receipt");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAuthority, setUploadAuthority] = useState("");
  const [uploadKhasra, setUploadKhasra] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [previewDoc, setPreviewDoc] = useState<VaultDocItem | null>(null);

  // Active property object
  const activeProperty = useMemo(() => {
    return (
      properties.find((p) => p.id === selectedPropertyId) ||
      properties[0] || {
        id: "prop-sc-108",
        name: "Super Corridor Plot 108",
        type: "plot" as const,
        city: "Indore",
        area: "Super Corridor Phase 2",
        address: "Plot 108, Sector C, Near TCS Metro, Indore",
        purchaseValue: 5200000,
        carpetAreaSqft: 1500,
        ownerName: "Akshay Sharma",
        createdAt: "2026-02-14",
      }
    );
  }, [properties, selectedPropertyId]);

  // Documents belonging to the currently selected property
  const activePropertyDocs = useMemo(() => {
    return docsList.filter((d) => d.propertyId === activeProperty.id);
  }, [docsList, activeProperty.id]);

  // Dynamic Vault Health Calculation for selected property
  const vaultHealth = useMemo(() => {
    const hasRegistry = activePropertyDocs.some((d) =>
      d.type.toLowerCase().includes("title") || d.title.toLowerCase().includes("deed") || d.title.toLowerCase().includes("registry")
    );
    const hasMutation = activePropertyDocs.some((d) =>
      d.type.toLowerCase().includes("revenue") || d.title.toLowerCase().includes("namantaran") || d.title.toLowerCase().includes("mutation")
    );
    const hasTax = activePropertyDocs.some((d) =>
      d.type.toLowerCase().includes("tax") || d.title.toLowerCase().includes("tax")
    );
    const hasSanctionOrNOC = activePropertyDocs.some((d) =>
      d.type.toLowerCase().includes("sanction") || d.type.toLowerCase().includes("utility") || d.title.toLowerCase().includes("map") || d.title.toLowerCase().includes("noc")
    );

    let score = 0;
    if (hasRegistry) score += 35;
    if (hasMutation) score += 25;
    if (hasTax) score += 20;
    if (hasSanctionOrNOC) score += 20;

    let suggestion = "";
    let suggestedCat = "Tax Receipt";
    if (!hasTax) {
      suggestion = "Upload Municipal Property Tax Paid Receipt to verify zero dues with IMC.";
      suggestedCat = "Tax Receipt";
    } else if (!hasMutation) {
      suggestion = "Upload Revenue Mutation (Namantaran B-1 Khasra extract) to lock legal ownership.";
      suggestedCat = "Revenue Mutation";
    } else if (!hasSanctionOrNOC) {
      suggestion = "Upload T&CP Town Planning Sanction Map or Building Permission NOC.";
      suggestedCat = "Sanction Map";
    } else if (!hasRegistry) {
      suggestion = "Upload Registered Absolute Sale Deed (Bikrinama) to secure root title.";
      suggestedCat = "Title Deed";
    } else {
      suggestion = "All critical documents are safely archived in your encrypted Sukoon Vault!";
      suggestedCat = "Other";
    }

    return {
      score,
      hasRegistry,
      hasMutation,
      hasTax,
      hasSanctionOrNOC,
      suggestion,
      suggestedCat,
    };
  }, [activePropertyDocs]);

  // Handle uploading document
  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    const newDoc: VaultDocItem = {
      id: "doc-" + Date.now(),
      propertyId: activeProperty.id,
      propertyName: activeProperty.name,
      title: uploadTitle.trim(),
      type: uploadCategory,
      authority: uploadAuthority.trim() || "Competent Authority Indore",
      khasra: uploadKhasra.trim() || "Verified Asset Record",
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: "Verified & Encrypted",
      pages: "2 Pages",
      fileSize: "1.4 MB PDF",
    };

    const updated = [newDoc, ...docsList];
    setDocsList(updated);
    try {
      localStorage.setItem("sukoon_vault_custom_docs", JSON.stringify(updated));
    } catch {}

    setUploadSuccessMsg(`"${uploadTitle}" uploaded! Vault Health updated.`);
    setUploadTitle("");
    setUploadAuthority("");
    setUploadKhasra("");
    setUploadModalOpen(false);
    setTimeout(() => setUploadSuccessMsg(""), 5000);
  };

  // ==========================================
  // B) PROPERTY PORTFOLIO STATE
  // ==========================================
  const [editingPricePropertyId, setEditingPricePropertyId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>("");

  // Total Portfolio Net Worth
  const totalNetWorth = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.purchaseValue || 0), 0);
  }, [properties]);

  const getPropertyPhoto = (prop: Property) => {
    if (prop.photoUrl) return prop.photoUrl;
    if (prop.type === "plot") return "/places/place-plot.png";
    if (prop.type === "villa") return "/places/place-house.png";
    return "/places/place-flat.png";
  };

  const handleUploadPropertyPhoto = (propertyId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const photoData = reader.result;
        update((state) => ({
          ...state,
          properties: state.properties.map((p) =>
            p.id === propertyId ? { ...p, photoUrl: photoData } : p
          ),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Property Details State (Matches screenshot & adds directly to Portfolio)
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropAddress, setNewPropAddress] = useState("");
  const [newPropLocality, setNewPropLocality] = useState("");
  const [newPropCity, setNewPropCity] = useState("Indore");
  const [newPropJurisdiction, setNewPropJurisdiction] = useState("India · Madhya Pradesh · Indore");
  const [newPropType, setNewPropType] = useState<PropertyType>("flat");
  const [newPropValue, setNewPropValue] = useState("");
  const [newPropArea, setNewPropArea] = useState("");
  const [newPropPhoto, setNewPropPhoto] = useState<string | null>(null);
  const [propSuccessMsg, setPropSuccessMsg] = useState("");

  const handleNewPropPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewPropPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim() || !newPropAddress.trim()) return;

    const val = Number(newPropValue.replace(/[^0-9]/g, "")) || 5000000;
    const area = Number(newPropArea.replace(/[^0-9]/g, "")) || 1500;

    const newProperty: Property = {
      id: "prop-vault-" + Date.now(),
      name: newPropName.trim(),
      address: newPropAddress.trim(),
      area: newPropLocality.trim() || "Prime Corridor",
      city: newPropCity.trim() || "Indore",
      jurisdiction: newPropJurisdiction.trim() || "India · Madhya Pradesh · Indore",
      type: newPropType,
      carpetAreaSqft: area,
      plotSizeSqft: newPropType === "plot" ? area : undefined,
      purchaseValue: val,
      ownerName: "Akshay Sharma",
      createdAt: new Date().toISOString(),
      status: "active",
      photoUrl: newPropPhoto || undefined,
    };

    update((state) => ({
      ...state,
      properties: [newProperty, ...state.properties],
    }));

    setPropSuccessMsg(`"${newPropName}" added to your property vault portfolio!`);
    setNewPropName("");
    setNewPropAddress("");
    setNewPropLocality("");
    setNewPropValue("");
    setNewPropArea("");
    setNewPropPhoto(null);
    setAddPropertyModalOpen(false);
    setTimeout(() => setPropSuccessMsg(""), 5000);
  };

  const handleStartEditPrice = (property: Property) => {
    setEditingPricePropertyId(property.id);
    setTempPriceInput(String(property.purchaseValue || 0));
  };

  const handleSavePrice = (propertyId: string) => {
    const num = Number(tempPriceInput.replace(/[^0-9]/g, ""));
    if (!isNaN(num) && num > 0) {
      update((state) => {
        const nextProps = state.properties.map((p) => {
          if (p.id === propertyId) {
            return { ...p, purchaseValue: num };
          }
          return p;
        });
        return { ...state, properties: nextProps };
      });
    }
    setEditingPricePropertyId(null);
  };

  // ==========================================
  // C) MANAGE PROPERTIES STATE
  // ==========================================
  type ManageTab = "receipts" | "payments" | "repairs";
  const [manageTab, setManageTab] = useState<ManageTab>("receipts");

  // Receipts / Collections
  const [receipts, setReceipts] = useState<PropertyReceipt[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("sukoon_vault_receipts");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "rec-01",
        propertyId: "prop-vn-house",
        propertyName: "Vijay Nagar Residence",
        type: "Rent",
        payerName: "Rahul Verma (1st Floor Tenant)",
        amount: 24000,
        dueDate: "2026-11-05",
        status: "pending",
      },
      {
        id: "rec-02",
        propertyId: "prop-omaxe-villa",
        propertyName: "Omaxe City Palm Villa",
        type: "Lease Advance",
        payerName: "Kavita Singhal (Annual Lease)",
        amount: 150000,
        dueDate: "2026-11-15",
        status: "pending",
      },
    ];
  });

  const [addReceiptModal, setAddReceiptModal] = useState(false);
  const [newRecPropertyId, setNewRecPropertyId] = useState(properties[0]?.id || "");
  const [newRecType, setNewRecType] = useState<PropertyReceipt["type"]>("Rent");
  const [newRecPayer, setNewRecPayer] = useState("");
  const [newRecAmount, setNewRecAmount] = useState("");
  const [newRecDueDate, setNewRecDueDate] = useState("2026-11-10");

  const handleAddReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecPayer || !newRecAmount) return;
    const targetProp = properties.find((p) => p.id === newRecPropertyId) || properties[0];

    const newRec: PropertyReceipt = {
      id: "rec-" + Date.now(),
      propertyId: targetProp.id,
      propertyName: targetProp.name,
      type: newRecType,
      payerName: newRecPayer,
      amount: Number(newRecAmount.replace(/[^0-9]/g, "")) || 18000,
      dueDate: newRecDueDate,
      status: "pending",
    };

    const updated = [newRec, ...receipts];
    setReceipts(updated);
    try {
      localStorage.setItem("sukoon_vault_receipts", JSON.stringify(updated));
    } catch {}
    setAddReceiptModal(false);
    setNewRecPayer("");
    setNewRecAmount("");
  };

  const handleToggleReceiptStatus = (id: string) => {
    const updated = receipts.map((r) => {
      if (r.id === id) {
        const nextStatus = r.status === "pending" ? ("received" as const) : ("pending" as const);
        return {
          ...r,
          status: nextStatus,
          receivedDate: nextStatus === "received" ? "Today, Verified" : undefined,
        };
      }
      return r;
    });
    setReceipts(updated);
    try {
      localStorage.setItem("sukoon_vault_receipts", JSON.stringify(updated));
    } catch {}
  };

  // Payments / Outflows with Timely Notifications (Wealth Tax, Property Tax, Society Deposit, Diversion Tax)
  const [payments, setPayments] = useState<PropertyPaymentItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("sukoon_vault_payments");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "pay-prop-tax",
        propertyId: "prop-vn-house",
        propertyName: "Vijay Nagar Residence",
        utilityType: "Property Tax (Nagar Nigam)",
        amount: 5400,
        dueDate: "2026-11-20",
        consumerNumber: "IMC Ward 34 #VN-42 (Nagar Nigam)",
        status: "pending",
        timelyReminder: true,
      },
      {
        id: "pay-diversion",
        propertyId: "prop-sc-108",
        propertyName: "Super Corridor Plot 108",
        utilityType: "Diversion Tax (Revenue / Vyapavartan)",
        amount: 3850,
        dueDate: "2026-12-05",
        consumerNumber: "Tehsil Land Diversion File #DIV-2024-884",
        status: "pending",
        timelyReminder: true,
      },
      {
        id: "pay-society",
        propertyId: "prop-omaxe-villa",
        propertyName: "Omaxe City Palm Villa",
        utilityType: "Society Deposit & Maintenance",
        amount: 2400,
        dueDate: "2026-11-05",
        consumerNumber: "Omaxe RWA #B-18 Sinking Fund",
        status: "pending",
        timelyReminder: true,
      },
      {
        id: "pay-wealth-tax",
        propertyId: "prop-sc-108",
        propertyName: "Super Corridor Plot 108",
        utilityType: "Wealth Tax / Capital Asset Filing",
        amount: 8500,
        dueDate: "2026-12-31",
        consumerNumber: "Form 26QB Capital Asset Assessment 2026-27",
        status: "pending",
        timelyReminder: true,
      },
      {
        id: "pay-electricity",
        propertyId: "prop-vn-house",
        propertyName: "Vijay Nagar Residence",
        utilityType: "Electricity (Discom)",
        amount: 3450,
        dueDate: "2026-11-10",
        consumerNumber: "IVRS #8841029104",
        status: "pending",
        timelyReminder: true,
      },
    ];
  });

  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [newPayPropertyId, setNewPayPropertyId] = useState(properties[0]?.id || "");
  const [newPayType, setNewPayType] = useState<PropertyPaymentItem["utilityType"]>(
    "Property Tax (Nagar Nigam)"
  );
  const [newPayAmount, setNewPayAmount] = useState("");
  const [newPayDueDate, setNewPayDueDate] = useState("2026-11-20");
  const [newPayConsumer, setNewPayConsumer] = useState("");
  const [newPayTimelyReminder, setNewPayTimelyReminder] = useState(true);

  const handleTogglePaymentReminder = (id: string) => {
    const updated = payments.map((p) =>
      p.id === id ? { ...p, timelyReminder: !p.timelyReminder } : p
    );
    setPayments(updated);
    try {
      localStorage.setItem("sukoon_vault_payments", JSON.stringify(updated));
    } catch {}
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayAmount) return;
    const targetProp = properties.find((p) => p.id === newPayPropertyId) || properties[0];

    const newPay: PropertyPaymentItem = {
      id: "pay-" + Date.now(),
      propertyId: targetProp.id,
      propertyName: targetProp.name,
      utilityType: newPayType,
      amount: Number(newPayAmount.replace(/[^0-9]/g, "")) || 2500,
      dueDate: newPayDueDate,
      consumerNumber: newPayConsumer || "Direct Assessment",
      status: "pending",
      timelyReminder: newPayTimelyReminder,
    };

    const updated = [newPay, ...payments];
    setPayments(updated);
    try {
      localStorage.setItem("sukoon_vault_payments", JSON.stringify(updated));
    } catch {}
    setAddPaymentModal(false);
    setNewPayAmount("");
    setNewPayConsumer("");
  };

  const handleTogglePaymentStatus = (id: string) => {
    const updated = payments.map((p) => {
      if (p.id === id) {
        const nextStatus = p.status === "pending" ? ("paid" as const) : ("pending" as const);
        return {
          ...p,
          status: nextStatus,
          paidDate: nextStatus === "paid" ? "Today, Paid" : undefined,
        };
      }
      return p;
    });
    setPayments(updated);
    try {
      localStorage.setItem("sukoon_vault_payments", JSON.stringify(updated));
    } catch {}
  };

  // Repair Alerts
  const [repairs, setRepairs] = useState<RepairAlert[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("sukoon_vault_repairs");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "rep-01",
        propertyId: "prop-vn-house",
        propertyName: "Vijay Nagar Residence",
        taskTitle: "Terrace Waterproofing & Rain Drainage Check",
        frequency: "One-time Repair",
        scheduledDate: "2026-11-14",
        estimatedCost: 18500,
        hasReminder: true,
        status: "pending",
      },
      {
        id: "rep-02",
        propertyId: "prop-omaxe-villa",
        propertyName: "Omaxe City Palm Villa",
        taskTitle: "Quarterly Water Purifier & Overhead Tank Servicing",
        frequency: "Quarterly",
        scheduledDate: "2026-11-25",
        estimatedCost: 2400,
        hasReminder: true,
        status: "pending",
      },
    ];
  });

  const [addRepairModal, setAddRepairModal] = useState(false);
  const [newRepPropertyId, setNewRepPropertyId] = useState(properties[0]?.id || "");
  const [newRepTitle, setNewRepTitle] = useState("");
  const [newRepFrequency, setNewRepFrequency] = useState<RepairAlert["frequency"]>(
    "One-time Repair"
  );
  const [newRepDate, setNewRepDate] = useState("2026-11-18");
  const [newRepCost, setNewRepCost] = useState("");

  const handleAddRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepTitle) return;
    const targetProp = properties.find((p) => p.id === newRepPropertyId) || properties[0];

    const newRep: RepairAlert = {
      id: "rep-" + Date.now(),
      propertyId: targetProp.id,
      propertyName: targetProp.name,
      taskTitle: newRepTitle,
      frequency: newRepFrequency,
      scheduledDate: newRepDate,
      estimatedCost: Number(newRepCost.replace(/[^0-9]/g, "")) || 3500,
      hasReminder: true,
      status: "pending",
    };

    const updated = [newRep, ...repairs];
    setRepairs(updated);
    try {
      localStorage.setItem("sukoon_vault_repairs", JSON.stringify(updated));
    } catch {}
    setAddRepairModal(false);
    setNewRepTitle("");
    setNewRepCost("");
  };

  const handleToggleRepairStatus = (id: string) => {
    const updated = repairs.map((r) => {
      if (r.id === id) {
        const nextStatus = r.status === "pending" ? ("resolved" as const) : ("pending" as const);
        return {
          ...r,
          status: nextStatus,
          resolvedDate: nextStatus === "resolved" ? "Today, Completed" : undefined,
        };
      }
      return r;
    });
    setRepairs(updated);
    try {
      localStorage.setItem("sukoon_vault_repairs", JSON.stringify(updated));
    } catch {}
  };

  // ==========================================
  // D) FIND A PAPER STATE
  // ==========================================
  const [singleKeyword, setSingleKeyword] = useState("");
  const [singleCategoryFilter, setSingleCategoryFilter] = useState("All");

  const searchResults = useMemo(() => {
    const q = singleKeyword.toLowerCase().trim();
    return docsList.filter((doc) => {
      const matchesKeyword =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.propertyName.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q) ||
        doc.authority.toLowerCase().includes(q) ||
        doc.khasra.toLowerCase().includes(q);

      const matchesCat =
        singleCategoryFilter === "All" ||
        doc.type.toLowerCase().includes(singleCategoryFilter.toLowerCase());

      return matchesKeyword && matchesCat;
    });
  }, [docsList, singleKeyword, singleCategoryFilter]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen px-4 pt-3 pb-28 text-foreground">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-line/60 mb-5">
        <Link
          href="/"
          className="tap-scale inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:opacity-80"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Sukoon Vault
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#1B2922]">Property Vault</h1>
        <p className="text-xs text-ink-muted mt-1">
          Secure documents, portfolio net worth &amp; property management.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 4 MAIN FEATURE ICONS - MATCHING HOME PAGE ICON STYLE & DESIGN LANGUAGE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-y-7 gap-x-6 mb-8 px-2 py-1">
        {VAULT_FEATURES.map((item) => {
          const IconComp = item.icon;
          const isSelected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
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
      {/* SECTION A: MY DOCS (UPLOAD DOCS, PROPERTY SWITCHER & VAULT HEALTH BAR) */}
      {/* ========================================================================= */}
      {section === "docs" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">My Docs</h2>
              <p className="text-[11px] text-ink-muted">
                Property document archive &amp; vault health score.
              </p>
            </div>
            <PinToHomeButton shortcutId="docs" />
          </div>

          {/* Property Selector Chips */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1.5 px-1">
              Select Property ({properties.length})
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {properties.map((prop) => {
                const isSelected = prop.id === activeProperty.id;
                return (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => setSelectedPropertyId(prop.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-forest text-white border-forest shadow-xs font-extrabold"
                        : "bg-white text-foreground border-line hover:border-forest/40"
                    }`}
                  >
                    <Building size={13} />
                    <span>{prop.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {uploadSuccessMsg && (
            <div className="p-3 rounded-xl bg-mint text-forest text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {/* VAULT HEALTH PROGRESS BAR CARD */}
          <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
                  Vault Health Score
                </span>
                <h3 className="text-sm font-bold text-foreground mt-1">
                  {activeProperty.name}
                </h3>
                <p className="text-[11px] text-ink-muted">
                  {vaultHealth.score >= 90
                    ? "Excellent · Ready for Bank Loans & Title Guarantee"
                    : vaultHealth.score >= 60
                    ? "Good · Few Critical Documents Missing"
                    : "Needs Attention · Core Deeds Missing"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-serif font-bold text-forest">
                  {vaultHealth.score}%
                </span>
                <span className="text-[10px] block text-ink-muted">Health Rating</span>
              </div>
            </div>

            {/* Visual Health Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-[#EAE8E2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-forest rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${vaultHealth.score}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-semibold pt-1">
                <span className={vaultHealth.hasRegistry ? "text-forest" : "text-ink-muted"}>
                  ● Registry {vaultHealth.hasRegistry ? "✓" : "✗"}
                </span>
                <span className={vaultHealth.hasMutation ? "text-forest" : "text-ink-muted"}>
                  ● Mutation {vaultHealth.hasMutation ? "✓" : "✗"}
                </span>
                <span className={vaultHealth.hasTax ? "text-forest" : "text-ink-muted"}>
                  ● Tax Dues {vaultHealth.hasTax ? "✓" : "✗"}
                </span>
                <span className={vaultHealth.hasSanctionOrNOC ? "text-forest" : "text-ink-muted"}>
                  ● NOC / Map {vaultHealth.hasSanctionOrNOC ? "✓" : "✗"}
                </span>
              </div>
            </div>

            {/* Smart Suggestion Banner */}
            {vaultHealth.score < 100 && (
              <div className="p-3 rounded-xl bg-sand/40 border border-line flex items-start gap-2.5 text-xs">
                <Lightbulb size={16} className="text-amber-800 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">Suggested Upload:</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">{vaultHealth.suggestion}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadCategory(vaultHealth.suggestedCat);
                    setUploadModalOpen(true);
                  }}
                  className="tap-scale px-2.5 py-1 rounded-lg bg-forest text-white text-[10px] font-bold shrink-0 hover:opacity-95"
                >
                  + Upload
                </button>
              </div>
            )}
          </div>

          {/* Stored Documents Header & Upload Button */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-foreground">
              Stored Papers ({activePropertyDocs.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setUploadCategory("Tax Receipt");
                setUploadModalOpen(true);
              }}
              className="tap-scale px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:opacity-95"
            >
              <Upload size={12} /> Upload New Paper
            </button>
          </div>

          {/* Document Cards */}
          <div className="space-y-2">
            {activePropertyDocs.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-dashed border-line text-center space-y-2">
                <FileText size={28} className="mx-auto text-ink-muted" />
                <h4 className="text-xs font-bold text-foreground">No documents uploaded yet</h4>
                <p className="text-[11px] text-ink-muted">
                  Upload your Sale Deed, Mutation, or Tax Receipt to protect your ownership.
                </p>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="tap-scale px-4 py-1.5 rounded-full bg-forest text-white text-xs font-bold inline-flex items-center gap-1 mt-1"
                >
                  <Upload size={12} /> Upload First Paper
                </button>
              </div>
            ) : (
              activePropertyDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sand text-forest uppercase">
                          {doc.type}
                        </span>
                        <span className="text-[10px] text-ink-muted">{doc.pages}</span>
                      </div>
                      <p className="text-xs font-bold text-foreground truncate mt-0.5">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-ink-muted truncate">
                        {doc.authority} · {doc.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2.5 py-1.5 rounded-lg bg-canvas text-[11px] font-bold text-forest hover:bg-forest hover:text-white transition"
                    >
                      View
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Sukoon Verified Paper: ${doc.title} (${doc.khasra}) for ${doc.propertyName}. Encrypted & Stored.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-forest"
                      title="Share via WhatsApp"
                    >
                      <Share2 size={13} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* UPLOAD DOCUMENT MODAL */}
          {uploadModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Upload Document</h3>
                    <p className="text-[10px] text-ink-muted">
                      Adding to: {activeProperty.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="p-1.5 text-ink-muted hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleUploadDocument} className="space-y-3 overflow-y-auto pr-1">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-ink-muted block">
                        Document Category / Tag *
                      </label>
                      <span className="text-[10px] text-forest font-semibold">Tap quick tag below</span>
                    </div>

                    {/* Quick Pick Tag Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[
                        "Chain link papers",
                        "Measurement",
                        "Building permission",
                        "Additional info",
                        "Title Deed",
                        "Revenue Mutation",
                        "Tax Receipt",
                        "Sanction Map",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setUploadCategory(tag)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                            uploadCategory === tag
                              ? "bg-forest text-white border-forest shadow-2xs"
                              : "bg-sand/40 text-[#475569] border-line hover:border-forest/40"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest bg-white font-medium"
                    >
                      <option value="Chain link papers">Chain link papers (Previous Deeds &amp; Title Chain)</option>
                      <option value="Measurement">Measurement (Demarcation &amp; Tarmeem Map)</option>
                      <option value="Building permission">Building permission (Nagar Nigam / Panchayat Sanction)</option>
                      <option value="Additional info">Additional info (Notes, Affidavits &amp; Agreements)</option>
                      <option value="Title Deed">Title Deed / Registered Bikrinama</option>
                      <option value="Revenue Mutation">Revenue Mutation (Namantaran B-1)</option>
                      <option value="Tax Receipt">Municipal Property Tax (IMC Receipt)</option>
                      <option value="Sanction Map">T&amp;CP Town Planning Sanction Map</option>
                      <option value="Utility">Electricity / Water Connection</option>
                      <option value="NOC">NOC &amp; Clearances</option>
                      <option value="Other">Other Document / Affidavit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Document Title / Name
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Registered Sale Deed 2026 or IMC Tax Paid"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Issuing Authority / Sub-Registrar
                    </label>
                    <input
                      type="text"
                      value={uploadAuthority}
                      onChange={(e) => setUploadAuthority(e.target.value)}
                      placeholder="e.g. Sub-Registrar Indore or IMC Ward 34"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Khasra # / Assessment / Reference ID
                    </label>
                    <input
                      type="text"
                      value={uploadKhasra}
                      onChange={(e) => setUploadKhasra(e.target.value)}
                      placeholder="e.g. Khasra 142/2/1 or Book 1 Vol 4920"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>

                  {/* Mock Upload Picker */}
                  <div className="p-3 rounded-xl border border-dashed border-forest/40 bg-sand/30 text-center space-y-1">
                    <Upload size={20} className="mx-auto text-forest" />
                    <p className="text-xs font-bold text-forest">Choose PDF or Take Photo</p>
                    <p className="text-[10px] text-ink-muted">Encrypted on your private device</p>
                  </div>

                  <button
                    type="submit"
                    className="tap-scale w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Save Document &amp; Update Health
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW DOCUMENT PREVIEW MODAL */}
          {previewDoc && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-forest" />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{previewDoc.title}</h3>
                      <p className="text-[10px] text-ink-muted">{previewDoc.propertyName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 text-ink-muted hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F8F7F3]">
                    <span className="text-[9px] text-ink-muted block">Document Type</span>
                    <strong className="text-foreground">{previewDoc.type}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8F7F3]">
                    <span className="text-[9px] text-ink-muted block">Status</span>
                    <strong className="text-forest">{previewDoc.status}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8F7F3]">
                    <span className="text-[9px] text-ink-muted block">Reference / Khasra</span>
                    <strong className="text-foreground">{previewDoc.khasra}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8F7F3]">
                    <span className="text-[9px] text-ink-muted block">Date Recorded</span>
                    <strong className="text-foreground">{previewDoc.date}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#effaf2] border border-forest/30 text-xs text-forest space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={14} /> Title Guarantee Seal Verified
                  </div>
                  <p className="text-[10px] text-ink-muted">
                    Authority: {previewDoc.authority} ({previewDoc.pages} · {previewDoc.fileSize})
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Sukoon Verified Record: ${previewDoc.title} for ${previewDoc.propertyName}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-forest text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-95"
                  >
                    <Share2 size={13} /> Share on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="px-4 py-2 rounded-xl bg-[#EEECE6] text-foreground text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: PROPERTY PORTFOLIO (NET WORTH & EDITABLE VALUATION) */}
      {/* ========================================================================= */}
      {section === "portfolio" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Property Portfolio</h2>
              <p className="text-[11px] text-ink-muted">
                Total property net worth &amp; valuation manager.
              </p>
            </div>
            <PinToHomeButton shortcutId="portfolio" />
          </div>

          {/* TOTAL PORTFOLIO NET WORTH BANNER */}
          <div className="p-4 rounded-2xl bg-forest text-white shadow-sm space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-white/80 font-bold">
              Total Property Net Worth
            </span>
            <div className="text-3xl font-serif font-bold">
              ₹{(totalNetWorth / 10000000).toFixed(2)} Crore
            </div>
            <p className="text-xs text-white/80">
              Total estimated market valuation across {properties.length} verified properties.
            </p>
          </div>

          {propSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{propSuccessMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-ink-muted font-bold">
              Your Properties ({properties.length}) · Tap &quot;Edit Price&quot; to update valuation
            </span>
            <button
              type="button"
              onClick={() => setAddPropertyModalOpen(true)}
              className="tap-scale px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs hover:opacity-95"
            >
              <Plus size={12} /> Add Property Details
            </button>
          </div>

          {/* Properties List with Photos and Valuation */}
          <div className="space-y-3">
            {properties.map((prop) => {
              const isEditing = editingPricePropertyId === prop.id;
              const val = prop.purchaseValue || 0;
              const area = prop.carpetAreaSqft || prop.plotSizeSqft || 1500;
              const ratePerSqft = Math.round(val / area);

              return (
                <div
                  key={prop.id}
                  className="rounded-2xl bg-white border border-line shadow-2xs overflow-hidden transition-all hover:border-forest/40"
                >
                  {/* Property Photo Banner with Type Tag & Change Photo */}
                  <div className="relative w-full h-36 bg-sand/30 overflow-hidden group">
                    <img
                      src={getPropertyPhoto(prop)}
                      alt={prop.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Property Type Badge */}
                    <span className="absolute top-2.5 left-2.5 text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs uppercase tracking-wider">
                      {prop.type}
                    </span>

                    {/* 1-Tap Upload / Change Property Photo */}
                    <label className="absolute top-2.5 right-2.5 cursor-pointer px-2.5 py-1 rounded-lg bg-white/95 hover:bg-white text-[10px] font-bold text-forest shadow-xs backdrop-blur-xs flex items-center gap-1 transition">
                      <Camera size={11} />
                      <span>{prop.photoUrl ? "Change Photo" : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadPropertyPhoto(prop.id, e)}
                        className="hidden"
                      />
                    </label>

                    {/* Address on bottom of photo */}
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-white pointer-events-none">
                      <p className="text-[10px] text-white/90 font-medium truncate">
                        📍 {prop.area}, {prop.city}
                      </p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground leading-snug">{prop.name}</h3>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          Area: {area.toLocaleString()} sq.ft · Freehold Title
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-forest">
                          ₹{(val / 100000).toFixed(2)} Lakhs
                        </span>
                        <span className="text-[10px] block text-ink-muted">
                          ₹{ratePerSqft.toLocaleString()}/sq.ft
                        </span>
                      </div>
                    </div>

                    {/* Editable Price Field */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                        <input
                          type="text"
                          value={tempPriceInput}
                          onChange={(e) => setTempPriceInput(e.target.value)}
                          placeholder="e.g. 5200000"
                          className="h-8 flex-1 rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePrice(prop.id)}
                          className="px-3 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPricePropertyId(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-sand text-ink-muted text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-2 border-t border-line/60">
                        <span className="text-[11px] text-forest font-semibold flex items-center gap-1">
                          <ShieldCheck size={13} /> Clear Title in Vault
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEditPrice(prop)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-forest hover:opacity-80 px-2.5 py-1 rounded-lg bg-mint/50 border border-forest/20"
                        >
                          <Pencil size={11} /> Edit Valuation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Calm Dashed Add Property Card */}
            <button
              type="button"
              onClick={() => setAddPropertyModalOpen(true)}
              className="tap-scale w-full p-4 rounded-2xl bg-[#FAF8F5]/80 border border-dashed border-[#D5D0C6] hover:border-forest/50 hover:bg-[#F5F2EC] flex items-center justify-center gap-3 text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-[#1B2922] group-hover:text-forest">
                  + Add Property Details to Portfolio
                </h4>
                <p className="text-[10px] text-[#7C8B82]">
                  Add a new plot, flat, villa or commercial asset with title &amp; valuation
                </p>
              </div>
            </button>
          </div>

          {/* ADD PROPERTY DETAILS MODAL (Matching Basics screenshot & live portfolio update) */}
          {addPropertyModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                      Vault Portfolio
                    </span>
                    <h3 className="text-sm font-bold text-foreground mt-1">Add Property Details</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddPropertyModalOpen(false)}
                    className="p-1.5 text-ink-muted hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddProperty} className="space-y-3 overflow-y-auto pr-1 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Property name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPropName}
                      onChange={(e) => setNewPropName(e.target.value)}
                      placeholder="e.g. Home in Vijay Nagar or Plot 45 Scheme 78"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Full address *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPropAddress}
                      onChange={(e) => setNewPropAddress(e.target.value)}
                      placeholder="e.g. 1203, Skyline Residency, Scheme 54"
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Locality *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPropLocality}
                        onChange={(e) => setNewPropLocality(e.target.value)}
                        placeholder="e.g. Vijay Nagar"
                        className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPropCity}
                        onChange={(e) => setNewPropCity(e.target.value)}
                        placeholder="e.g. Indore"
                        className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Jurisdiction *
                    </label>
                    <input
                      type="text"
                      value={newPropJurisdiction}
                      onChange={(e) => setNewPropJurisdiction(e.target.value)}
                      className="h-9 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Type *
                      </label>
                      <select
                        value={newPropType}
                        onChange={(e) => setNewPropType(e.target.value as any)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest bg-white"
                      >
                        <option value="flat">Flat</option>
                        <option value="plot">Plot</option>
                        <option value="villa">Villa</option>
                        <option value="commercial">Commercial</option>
                        <option value="agri">Agricultural</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Valuation (₹) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPropValue}
                        onChange={(e) => setNewPropValue(e.target.value)}
                        placeholder="e.g. 6500000"
                        className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Area (sq.ft) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPropArea}
                        onChange={(e) => setNewPropArea(e.target.value)}
                        placeholder="e.g. 1500"
                        className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  {/* Photo Upload in Add Property Details */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Property Photo (Optional)
                    </label>
                    {newPropPhoto ? (
                      <div className="relative rounded-xl border border-[#C5DDD0] bg-[#F4F8F5] p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={newPropPhoto}
                            alt="Property Photo"
                            className="w-12 h-12 object-cover rounded-lg border border-[#A7CEB7]"
                          />
                          <span className="text-[11px] font-bold text-[#1E5637]">
                            Photo Attached ✓
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPropPhoto(null)}
                          className="p-1 rounded-full bg-white border border-line text-ink-muted hover:text-rose-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-forest/50 bg-sand/20 hover:bg-sand/40 text-forest transition">
                        <Camera size={14} />
                        <span className="text-xs font-bold">Attach Photo / Camera</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNewPropPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="tap-scale w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Save Property to Vault Portfolio
                  </button>

                  <div className="text-center pt-1 border-t border-line/60">
                    <Link
                      href="/property/new"
                      className="text-[11px] font-bold text-forest hover:underline"
                    >
                      Or open full 4-step registration guide →
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION C: MANAGE PROPERTIES (RECEIPTS, PAYMENTS & REPAIR ALERTS) */}
      {/* ========================================================================= */}
      {section === "manage" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Manage Properties</h2>
              <p className="text-[11px] text-ink-muted">
                Collections, utility payments &amp; maintenance repair alerts.
              </p>
            </div>
            <PinToHomeButton shortcutId="details" />
          </div>

          {/* 3 Sub-Tabs inside Manage Properties */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4F2EC] rounded-2xl border border-line">
            <button
              type="button"
              onClick={() => setManageTab("receipts")}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                manageTab === "receipts"
                  ? "bg-white text-forest shadow-xs font-extrabold"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              <span>Receipts</span>
            </button>
            <button
              type="button"
              onClick={() => setManageTab("payments")}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                manageTab === "payments"
                  ? "bg-white text-forest shadow-xs font-extrabold"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              <span>Payments</span>
            </button>
            <button
              type="button"
              onClick={() => setManageTab("repairs")}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                manageTab === "repairs"
                  ? "bg-white text-forest shadow-xs font-extrabold"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              <span>Repairs</span>
            </button>
          </div>

          {/* MANAGE SUB-TAB 1: RECEIPTS (COLLECTIONS - RENT, LEASE) */}
          {manageTab === "receipts" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Rent &amp; Lease Collections</h3>
                  <p className="text-[10px] text-ink-muted">Tap the tick mark once received.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddReceiptModal(true)}
                  className="tap-scale px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:opacity-95"
                >
                  <Plus size={12} /> Add Collection
                </button>
              </div>

              <div className="space-y-2.5">
                {receipts.map((rec) => {
                  const isReceived = rec.status === "received";
                  return (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-2xl border transition shadow-2xs space-y-2 ${
                        isReceived ? "bg-[#F7FAF8] border-emerald-200" : "bg-white border-line"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 uppercase">
                              {rec.type}
                            </span>
                            <span className="text-[10px] text-ink-muted">{rec.propertyName}</span>
                          </div>
                          <h4 className="text-xs font-bold text-foreground">{rec.payerName}</h4>
                          <p className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                            <Calendar size={11} /> Due Date: {rec.dueDate}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-forest">
                            ₹{rec.amount.toLocaleString()}
                          </span>
                          <span
                            className={`text-[9px] block font-bold mt-0.5 ${
                              isReceived ? "text-emerald-700" : "text-amber-800"
                            }`}
                          >
                            {isReceived ? "● Received" : "● Pending Collection"}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Tick Mark Button */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-line/60">
                        <span className="text-[10px] text-ink-muted">
                          {isReceived ? rec.receivedDate : "Mark payment once deposited"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleReceiptStatus(rec.id)}
                          className={`tap-scale px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition ${
                            isReceived
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-forest text-white hover:opacity-95"
                          }`}
                        >
                          <Check size={13} /> {isReceived ? "Received ✓" : "Mark Received"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MANAGE SUB-TAB 2: PAYMENTS (BILLS & OUTFLOWS) */}
          {manageTab === "payments" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Property Bills, Taxes &amp; Outflows</h3>
                  <p className="text-[10px] text-ink-muted">
                    Property tax, Diversion tax, Society deposit, Wealth tax &amp; utilities.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddPaymentModal(true)}
                  className="tap-scale px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:opacity-95"
                >
                  <Plus size={12} /> Add Bill / Tax
                </button>
              </div>

              {/* Timely Due Date Notifications Banner */}
              <div className="p-3.5 rounded-2xl bg-[#E8F5EE] border border-[#A3D9B5] text-[#1E5637] flex items-start gap-2.5 shadow-2xs">
                <Bell size={16} className="mt-0.5 shrink-0 text-[#1E5637]" />
                <div className="text-xs">
                  <p className="font-bold">Timely Due Date Notifications Active</p>
                  <p className="text-[11px] text-[#245838] mt-0.5 leading-relaxed">
                    Automated reminders are active for your <strong>Property tax</strong>, <strong>Diversion tax</strong>, <strong>Society deposit</strong>, and <strong>Wealth tax</strong>. Sukoon delivers alerts to WhatsApp (+91 98260 11223) and SMS <strong>7 days</strong> and <strong>1 day</strong> prior to each deadline.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {payments.map((pay) => {
                  const isPaid = pay.status === "paid";
                  return (
                    <div
                      key={pay.id}
                      className={`p-3.5 rounded-2xl border transition shadow-2xs space-y-2.5 ${
                        isPaid ? "bg-[#F7FAF8] border-emerald-200" : "bg-white border-line"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sand text-forest uppercase">
                              {pay.utilityType}
                            </span>
                            <span className="text-[10px] text-ink-muted">{pay.propertyName}</span>
                            {pay.timelyReminder && !isPaid && (
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md inline-flex items-center gap-0.5">
                                <Bell size={9} /> Timely Alert: Active
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-foreground">{pay.consumerNumber}</h4>
                          <p className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> Due Date: {pay.dueDate}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-forest">
                            ₹{pay.amount.toLocaleString()}
                          </span>
                          <span
                            className={`text-[9px] block font-bold mt-0.5 ${
                              isPaid ? "text-emerald-700" : "text-amber-800"
                            }`}
                          >
                            {isPaid ? "● Paid" : "● Payment Due"}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Controls & Timely Reminder Toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-line/60 gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentReminder(pay.id)}
                            className={`tap-scale px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${
                              pay.timelyReminder
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-sand/60 text-ink-muted border border-line"
                            }`}
                            title="Toggle timely WhatsApp & SMS notification"
                          >
                            <Bell size={11} className={pay.timelyReminder ? "text-emerald-700" : "text-ink-muted"} />
                            <span>{pay.timelyReminder ? "Reminder Active" : "Set Reminder"}</span>
                          </button>

                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Sukoon Due Date Alert: ${pay.utilityType} of ₹${pay.amount.toLocaleString()} for ${pay.propertyName} is due on ${pay.dueDate}. Ref: ${pay.consumerNumber}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg border border-line text-ink-muted hover:text-forest"
                            title="Send WhatsApp Alert"
                          >
                            <Share2 size={12} />
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePaymentStatus(pay.id)}
                          className={`tap-scale px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-forest text-white hover:opacity-95"
                          }`}
                        >
                          <Check size={13} /> {isPaid ? "Paid ✓" : "Mark Done"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MANAGE SUB-TAB 3: REPAIR ALERTS (MAINTENANCE) */}
          {manageTab === "repairs" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Maintenance &amp; Repairs</h3>
                  <p className="text-[10px] text-ink-muted">
                    One-time fixes &amp; periodic recurring servicing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddRepairModal(true)}
                  className="tap-scale px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:opacity-95"
                >
                  <Plus size={12} /> Set Alert
                </button>
              </div>

              <div className="space-y-2.5">
                {repairs.map((rep) => {
                  const isResolved = rep.status === "resolved";
                  return (
                    <div
                      key={rep.id}
                      className={`p-3.5 rounded-2xl border transition shadow-2xs space-y-2 ${
                        isResolved ? "bg-[#F7FAF8] border-emerald-200" : "bg-white border-line"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 uppercase">
                              {rep.frequency}
                            </span>
                            <span className="text-[10px] text-ink-muted">{rep.propertyName}</span>
                          </div>
                          <h4 className="text-xs font-bold text-foreground">{rep.taskTitle}</h4>
                          <p className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                            <Calendar size={11} /> Target: {rep.scheduledDate}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-forest">
                            ₹{rep.estimatedCost.toLocaleString()}
                          </span>
                          <span
                            className={`text-[9px] block font-bold mt-0.5 ${
                              isResolved ? "text-emerald-700" : "text-amber-800"
                            }`}
                          >
                            {isResolved ? "● Resolved" : "● Scheduled"}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Tick Mark Button */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-line/60">
                        <span className="text-[10px] text-ink-muted">
                          {isResolved ? rep.resolvedDate : "Reminders enabled for contractor"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleRepairStatus(rep.id)}
                          className={`tap-scale px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition ${
                            isResolved
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-forest text-white hover:opacity-95"
                          }`}
                        >
                          <Check size={13} /> {isResolved ? "Resolved ✓" : "Mark Resolved"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADD RECEIPT MODAL */}
          {addReceiptModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <h3 className="text-xs font-bold text-foreground">Add New Collection / Receipt</h3>
                  <button
                    type="button"
                    onClick={() => setAddReceiptModal(false)}
                    className="p-1.5 text-ink-muted hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddReceipt} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Property
                    </label>
                    <select
                      value={newRecPropertyId}
                      onChange={(e) => setNewRecPropertyId(e.target.value)}
                      className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest bg-white"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Collection Type
                      </label>
                      <select
                        value={newRecType}
                        onChange={(e) => setNewRecType(e.target.value as any)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest bg-white"
                      >
                        <option value="Rent">Monthly Rent</option>
                        <option value="Lease Advance">Lease Advance</option>
                        <option value="Security Deposit">Security Deposit</option>
                        <option value="Parking Fee">Parking Rental</option>
                        <option value="Commercial Rent">Commercial Rent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="text"
                        required
                        value={newRecAmount}
                        onChange={(e) => setNewRecAmount(e.target.value)}
                        placeholder="e.g. 25000"
                        className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Tenant / Payer Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newRecPayer}
                        onChange={(e) => setNewRecPayer(e.target.value)}
                        placeholder="e.g. Amit Sharma"
                        className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newRecDueDate}
                        onChange={(e) => setNewRecDueDate(e.target.value)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="tap-scale w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
                  >
                    + Add Collection Alert
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD PAYMENT MODAL */}
          {addPaymentModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <h3 className="text-xs font-bold text-foreground">Add Utility / Property Bill</h3>
                  <button
                    type="button"
                    onClick={() => setAddPaymentModal(false)}
                    className="p-1.5 text-ink-muted hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddPayment} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Property
                    </label>
                    <select
                      value={newPayPropertyId}
                      onChange={(e) => setNewPayPropertyId(e.target.value)}
                      className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest bg-white"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Tax / Bill Type
                      </label>
                      <select
                        value={newPayType}
                        onChange={(e) => setNewPayType(e.target.value as any)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest bg-white font-medium"
                      >
                        <option value="Property Tax (Nagar Nigam)">Property Tax (Nagar Nigam)</option>
                        <option value="Diversion Tax (Revenue / Vyapavartan)">Diversion Tax (Revenue / Vyapavartan)</option>
                        <option value="Society Deposit & Maintenance">Society Deposit &amp; Maintenance</option>
                        <option value="Wealth Tax / Capital Asset Filing">Wealth Tax / Capital Asset Filing</option>
                        <option value="Electricity (Discom)">Electricity (Discom)</option>
                        <option value="Water Bill (IMC)">Water Bill (IMC)</option>
                        <option value="Piped Gas (PNG)">Piped Gas (PNG)</option>
                        <option value="Guard & Security">Guard &amp; Security</option>
                        <option value="Other Outflow">Other Outflow</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Bill Amount (₹)
                      </label>
                      <input
                        type="text"
                        required
                        value={newPayAmount}
                        onChange={(e) => setNewPayAmount(e.target.value)}
                        placeholder="e.g. 5400"
                        className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Consumer # / Assessment File #
                      </label>
                      <input
                        type="text"
                        value={newPayConsumer}
                        onChange={(e) => setNewPayConsumer(e.target.value)}
                        placeholder="e.g. IMC Ward 34 #VN-42"
                        className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newPayDueDate}
                        onChange={(e) => setNewPayDueDate(e.target.value)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  {/* Timely Due Date Notification Checkbox */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E8F5EE] border border-[#A3D9B5] text-xs">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-[#1E5637] shrink-0" />
                      <div>
                        <p className="font-bold text-[#1E5637]">Timely Notification</p>
                        <p className="text-[10px] text-[#245838]">WhatsApp &amp; SMS alerts 7 days &amp; 1 day before due date</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newPayTimelyReminder}
                      onChange={(e) => setNewPayTimelyReminder(e.target.checked)}
                      className="w-4 h-4 rounded text-forest focus:ring-forest"
                    />
                  </div>

                  <button
                    type="submit"
                    className="tap-scale w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
                  >
                    + Add Bill Reminder
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD REPAIR ALERT MODAL */}
          {addRepairModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <h3 className="text-xs font-bold text-foreground">Schedule Repair Alert</h3>
                  <button
                    type="button"
                    onClick={() => setAddRepairModal(false)}
                    className="p-1.5 text-ink-muted hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddRepair} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Property
                    </label>
                    <select
                      value={newRepPropertyId}
                      onChange={(e) => setNewRepPropertyId(e.target.value)}
                      className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest bg-white"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Repair / Maintenance Task
                    </label>
                    <input
                      type="text"
                      required
                      value={newRepTitle}
                      onChange={(e) => setNewRepTitle(e.target.value)}
                      placeholder="e.g. Terrace waterproofing or AC servicing"
                      className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Frequency
                      </label>
                      <select
                        value={newRepFrequency}
                        onChange={(e) => setNewRepFrequency(e.target.value as any)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest bg-white"
                      >
                        <option value="One-time Repair">One-time Repair</option>
                        <option value="Quarterly">Time to time (Quarterly)</option>
                        <option value="Bi-annual">Time to time (6 Months)</option>
                        <option value="Yearly">Annual Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-muted block mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={newRepDate}
                        onChange={(e) => setNewRepDate(e.target.value)}
                        className="h-9 w-full rounded-xl border border-line px-2 text-xs outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-muted block mb-1">
                      Estimated Cost (₹)
                    </label>
                    <input
                      type="text"
                      value={newRepCost}
                      onChange={(e) => setNewRepCost(e.target.value)}
                      placeholder="e.g. 4500"
                      className="h-9 w-full rounded-xl border border-line px-2.5 text-xs outline-none focus:border-forest"
                    />
                  </div>

                  <button
                    type="submit"
                    className="tap-scale w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95"
                  >
                    + Create Repair Alert
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION D: FIND A PAPER (KEYWORD SEARCH ACROSS ALL PAPERS) */}
      {/* ========================================================================= */}
      {section === "single" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#1B2922]">Find a Paper</h2>
              <p className="text-[11px] text-ink-muted">
                Keyword search across all property documents in your vault.
              </p>
            </div>
            <PinToHomeButton shortcutId="single-paper" />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={singleKeyword}
              onChange={(e) => setSingleKeyword(e.target.value)}
              placeholder="Search by keyword e.g. registry, mutation, tax, khasra, IMC..."
              className="h-10 w-full rounded-2xl border border-line pl-10 pr-9 text-xs outline-none focus:border-forest bg-white shadow-2xs"
              autoFocus
            />
            {singleKeyword && (
              <button
                type="button"
                onClick={() => setSingleKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              "All",
              "Title Deed",
              "Chain link papers",
              "Measurement",
              "Building permission",
              "Additional info",
              "Revenue",
              "Tax Receipt",
              "Sanction Map",
              "Utility",
            ].map((cat) => {
              const isActive = singleCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSingleCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                    isActive
                      ? "bg-forest text-white border-forest shadow-2xs"
                      : "bg-white text-ink-muted border-line hover:border-forest/40"
                  }`}
                >
                  {cat === "All" ? "All Papers" : cat}
                </button>
              );
            })}
          </div>

          <div className="px-1 text-xs text-ink-muted">
            Found {searchResults.length} matching document(s)
          </div>

          {/* Search Results List */}
          <div className="space-y-2.5">
            {searchResults.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-line text-center space-y-2">
                <Search size={24} className="mx-auto text-ink-muted" />
                <h4 className="text-xs font-bold text-foreground">
                  No papers found for "{singleKeyword}"
                </h4>
                <p className="text-[11px] text-ink-muted">
                  Try searching by document title, property name, khasra number or authority.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSingleKeyword("");
                    setSingleCategoryFilter("All");
                  }}
                  className="tap-scale px-3 py-1 rounded-full bg-forest text-white text-xs font-bold inline-flex items-center gap-1 mt-1"
                >
                  View All Papers
                </button>
              </div>
            ) : (
              searchResults.map((paper) => (
                <div
                  key={paper.id}
                  className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sand text-forest uppercase">
                          {paper.type}
                        </span>
                        <span className="text-[10px] text-ink-muted">{paper.propertyName}</span>
                      </div>
                      <p className="text-xs font-bold text-foreground truncate mt-0.5">
                        {paper.title}
                      </p>
                      <p className="text-[10px] text-ink-muted truncate">
                        {paper.authority} · {paper.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(paper)}
                      className="px-2.5 py-1.5 rounded-lg bg-canvas text-[11px] font-bold text-forest hover:bg-forest hover:text-white transition"
                    >
                      View
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Sukoon Property Document: ${paper.title} (${paper.khasra}) for ${paper.propertyName}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-forest"
                      title="Share via WhatsApp"
                    >
                      <Share2 size={13} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-ink-muted">
          Loading Property Vault...
        </div>
      }
    >
      <VaultContent />
    </Suspense>
  );
}

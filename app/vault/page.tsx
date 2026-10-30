"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  FileCheck,
  FileText,
  FolderOpen,
  MapPin,
  Plus,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import { PinToHomeButton } from "@/components/PinToHomeButton";

type VaultSection = "docs" | "details" | "portfolio" | "single";

const VAULT_ICONS = [
  {
    id: "docs",
    label: "All Documents",
    sub: "Deeds & Tax Receipts",
    icon: FileText,
    accent: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "details",
    label: "Property Details",
    sub: "Area, Khasra & GPS",
    icon: MapPin,
    accent: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "portfolio",
    label: "Portfolio Overview",
    sub: "₹4.85 Cr Valuation",
    icon: Building2,
    accent: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "single",
    label: "Find Single Paper",
    sub: "Instant Quick Lookup",
    icon: Search,
    accent: "bg-purple-50 text-purple-800 border-purple-200",
  },
] as const;

const PAPERS = [
  {
    id: "reg-01",
    title: "Registered Sale Deed",
    authority: "Registrar of Stamps & Deeds, Indore",
    khasra: "Khasra No. 412/1",
    date: "14 Jan 2024",
    status: "Verified & Encrypted",
    pages: "18 Pages",
    fileSize: "4.2 MB PDF",
    type: "Title Deed",
  },
  {
    id: "mut-02",
    title: "Revenue Mutation (Dakhil Kharij)",
    authority: "Tehsildar Office, Sanwer Tehsil",
    khasra: "B-1 / Namantaran 2024",
    date: "28 Feb 2024",
    status: "Title Clean",
    pages: "2 Pages",
    fileSize: "840 KB PDF",
    type: "Revenue Record",
  },
  {
    id: "tax-03",
    title: "Indore Municipal Corporation Tax (2025-26)",
    authority: "IMC Ward 22 Revenue Desk",
    khasra: "Assessment #IMC-SC-108",
    date: "10 Jun 2025",
    status: "Paid & Cleared",
    pages: "1 Page",
    fileSize: "320 KB PDF",
    type: "Tax Receipt",
  },
  {
    id: "noc-04",
    title: "Building Permission NOC",
    authority: "Town & Country Planning (T&CP)",
    khasra: "Sanction #TCP-IND-9941",
    date: "15 Oct 2025",
    status: "Active Sanction",
    pages: "4 Pages",
    fileSize: "1.8 MB PDF",
    type: "Municipal Permission",
  },
  {
    id: "elec-05",
    title: "MPPKVVCL Temporary Electric Connection",
    authority: "West Discom Substation 4",
    khasra: "Consumer #98421004",
    date: "12 Nov 2025",
    status: "Meter Active",
    pages: "2 Pages",
    fileSize: "610 KB PDF",
    type: "Utility",
  },
];

function VaultContent() {
  const searchParams = useSearchParams();
  const initialSection = (searchParams.get("section") as VaultSection) || "docs";
  const [section, setSection] = useState<VaultSection>(initialSection);
  const [previewDoc, setPreviewDoc] = useState<typeof PAPERS[0] | null>(null);
  const [singleQuery, setSingleQuery] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSuccess, setNewSuccess] = useState(false);

  const filteredPapers = singleQuery
    ? PAPERS.filter((p) =>
        `${p.title} ${p.authority} ${p.type} ${p.khasra}`
          .toLowerCase()
          .includes(singleQuery.toLowerCase())
      )
    : PAPERS;

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
          Sukoon Vault
        </span>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">Property Vault</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Choose what you want to access inside your vault
        </p>
      </div>

      {/* 4 Clean Feature Choice Icons */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {VAULT_ICONS.map((item) => {
          const Icon = item.icon;
          const isSelected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id as VaultSection)}
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

      {/* SECTION 1: ALL DOCUMENTS */}
      {section === "docs" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">All Stored Papers (5)</h2>
              <p className="text-[11px] text-ink-muted">Super Corridor Plot 108</p>
            </div>
            <div className="flex items-center gap-2">
              <PinToHomeButton shortcutId="docs" />
              <button
                type="button"
                onClick={() => setAddModal(true)}
                className="px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:opacity-95"
              >
                <Plus size={13} /> Add Paper
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {PAPERS.map((paper) => (
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
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-canvas text-forest uppercase">
                        {paper.type}
                      </span>
                      <span className="text-[10px] text-ink-muted">{paper.pages}</span>
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
                      `Sukoon Property Record: ${paper.title} (${paper.khasra}) - Verified.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-forest"
                    aria-label="Share"
                  >
                    <Share2 size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: PROPERTY DETAILS */}
      {section === "details" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Asset Detail</span>
            <PinToHomeButton shortcutId="details" />
          </div>
          <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                  Primary Asset
                </span>
                <h2 className="text-base font-bold text-foreground mt-1">
                  Plot 108, Super Corridor
                </h2>
                <p className="text-xs text-ink-muted">TCS &amp; Infosys IT Park Square, Indore</p>
              </div>
              <ShieldCheck size={28} className="text-forest" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line text-xs">
              <div className="p-2.5 rounded-xl bg-canvas/60">
                <span className="text-[10px] text-ink-muted block">Plot Dimension</span>
                <strong className="text-foreground">30 ft × 50 ft</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas/60">
                <span className="text-[10px] text-ink-muted block">Total Area</span>
                <strong className="text-foreground">1,500 sq. ft.</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas/60">
                <span className="text-[10px] text-ink-muted block">Survey / Khasra</span>
                <strong className="text-foreground">Khasra 412/1</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas/60">
                <span className="text-[10px] text-ink-muted block">Road Facing</span>
                <strong className="text-foreground">East 40 ft Road</strong>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-canvas/60 text-xs">
              <span className="text-[10px] text-ink-muted block">GPS Coordinates</span>
              <strong className="text-foreground font-mono text-[11px]">
                22.7684° N, 75.8291° E
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: PORTFOLIO OVERVIEW */}
      {section === "portfolio" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Portfolio</span>
            <PinToHomeButton shortcutId="portfolio" />
          </div>
          <div className="p-4 rounded-2xl bg-forest text-white shadow-sm space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-white/80 font-bold">
              Total Portfolio Valuation
            </span>
            <div className="text-3xl font-serif font-bold">₹4,85,00,000</div>
            <p className="text-xs text-white/80">
              Across 3 registered properties in Indore metropolitan region.
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Plot 108, Super Corridor</h3>
                  <p className="text-[11px] text-ink-muted">1,500 sq ft Residential Plot</p>
                </div>
                <span className="text-xs font-bold text-forest">₹1.10 Cr</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Flat 402, Nipania Heights</h3>
                  <p className="text-[11px] text-ink-muted">3 BHK Luxury Apartment</p>
                </div>
                <span className="text-xs font-bold text-forest">₹1.45 Cr</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Commercial Unit, Vijay Nagar</h3>
                  <p className="text-[11px] text-ink-muted">1,200 sq ft Office Space</p>
                </div>
                <span className="text-xs font-bold text-forest">₹2.30 Cr</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: FIND SINGLE PAPER */}
      {section === "single" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Document Search</span>
            <PinToHomeButton shortcutId="single-paper" />
          </div>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-3.5 text-ink-muted pointer-events-none"
            />
            <input
              type="text"
              value={singleQuery}
              onChange={(e) => setSingleQuery(e.target.value)}
              placeholder="Search by title, deed, tax, Khasra #..."
              className="h-11 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-xs outline-none focus:border-forest"
            />
          </div>

          <p className="text-[11px] text-ink-muted px-1">
            Showing {filteredPapers.length} matching document(s)
          </p>

          <div className="space-y-2">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => setPreviewDoc(paper)}
                className="p-3 rounded-2xl bg-white border border-line hover:border-forest/40 transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-foreground">{paper.title}</p>
                  <p className="text-[10px] text-ink-muted">
                    {paper.type} · {paper.fileSize}
                  </p>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-canvas text-[10px] font-bold text-forest"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-forest bg-mint px-2 py-0.5 rounded-full">
                  Verified Paper
                </span>
                <h3 className="text-sm font-bold text-foreground mt-1">{previewDoc.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-full text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-canvas/60 space-y-1.5 text-xs">
              <p>
                <span className="text-ink-muted">Authority:</span>{" "}
                <strong>{previewDoc.authority}</strong>
              </p>
              <p>
                <span className="text-ink-muted">Record Reference:</span>{" "}
                <strong>{previewDoc.khasra}</strong>
              </p>
              <p>
                <span className="text-ink-muted">Status:</span>{" "}
                <strong className="text-forest">{previewDoc.status}</strong>
              </p>
              <p>
                <span className="text-ink-muted">File:</span>{" "}
                <span>
                  {previewDoc.pages} · {previewDoc.fileSize}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading encrypted copy of ${previewDoc.title}`);
                  setPreviewDoc(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-forest text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2.5 rounded-xl border border-line text-xs font-bold text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PAPER MODAL */}
      {addModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-foreground">Upload Property Paper</h3>
              <button
                type="button"
                onClick={() => {
                  setAddModal(false);
                  setNewSuccess(false);
                }}
                className="p-1 rounded-full text-ink-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {newSuccess ? (
              <div className="p-4 rounded-2xl bg-mint text-forest text-xs font-bold text-center space-y-1">
                <CheckCircle2 size={24} className="mx-auto" />
                <p>Paper added to your encrypted vault!</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTitle) return;
                  setNewSuccess(true);
                  setTimeout(() => {
                    setAddModal(false);
                    setNewSuccess(false);
                    setNewTitle("");
                  }, 1200);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-[11px] font-bold text-ink-muted block mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Electricity Bill April 2026"
                    className="h-10 w-full rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                  />
                </div>

                <div className="p-4 rounded-xl border-2 border-dashed border-line text-center text-xs text-ink-muted">
                  Tap to choose PDF, JPEG or take Camera photo
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs"
                >
                  Save to Vault
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-ink-muted">Loading Sukoon Vault...</div>
      }
    >
      <VaultContent />
    </Suspense>
  );
}

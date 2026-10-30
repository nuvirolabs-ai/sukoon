"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Headphones,
  HelpCircle,
  Newspaper,
  Radio,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import {
  REAL_ESTATE_NEWS,
  REAL_ESTATE_GLOSSARY,
  MEDIA_RESOURCES,
} from "@/lib/data/intelligence-hub";
import { LEGAL_DRAFT_TEMPLATES } from "@/lib/data/market-hub";
import { PinToHomeButton } from "@/components/PinToHomeButton";

type KnowledgeSection = "dictionary" | "news" | "drafts" | "media";

const KNOWLEDGE_ICONS = [
  {
    id: "dictionary",
    label: "Dictionary",
    sub: "Indian Property Terms",
    icon: BookOpen,
    accent: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  {
    id: "news",
    label: "Market News",
    sub: "Indore Trends & Master Plan",
    icon: Newspaper,
    accent: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "drafts",
    label: "Legal Drafting",
    sub: "Agreements & Contracts",
    icon: FileText,
    accent: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "media",
    label: "Blogs & Podcasts",
    sub: "Expert Audio & Guides",
    icon: Headphones,
    accent: "bg-purple-50 text-purple-800 border-purple-200",
  },
] as const;

function UpdatesContent() {
  const searchParams = useSearchParams();
  const initialSection =
    (searchParams.get("section") as KnowledgeSection) || "dictionary";
  const [section, setSection] = useState<KnowledgeSection>(initialSection);

  // Dictionary state
  const [glossaryQuery, setGlossaryQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<typeof REAL_ESTATE_GLOSSARY[0] | null>(
    null
  );

  // Legal draft template state
  const [selectedDraft, setSelectedDraft] = useState<
    typeof LEGAL_DRAFT_TEMPLATES[0] | null
  >(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const filteredGlossary = glossaryQuery
    ? REAL_ESTATE_GLOSSARY.filter(
        (item) =>
          item.term.toLowerCase().includes(glossaryQuery.toLowerCase()) ||
          item.simpleMeaning.toLowerCase().includes(glossaryQuery.toLowerCase())
      )
    : REAL_ESTATE_GLOSSARY;

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
          Sukoon Insights
        </span>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Real Estate Insights
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Everything you need to understand Indian property with clarity
        </p>
      </div>

      {/* 4 Feature Choice Icons */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {KNOWLEDGE_ICONS.map((item) => {
          const Icon = item.icon;
          const isSelected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id as KnowledgeSection)}
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

      {/* SECTION 1: REAL ESTATE DICTIONARY */}
      {section === "dictionary" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Terminology Glossary</span>
            <PinToHomeButton shortcutId="dictionary" />
          </div>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-3.5 text-ink-muted pointer-events-none"
            />
            <input
              type="text"
              value={glossaryQuery}
              onChange={(e) => setGlossaryQuery(e.target.value)}
              placeholder="Search terms: Khata, Registry, Patwari, FSI..."
              className="h-11 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-xs outline-none focus:border-forest"
            />
          </div>

          <p className="text-[11px] text-ink-muted px-1">
            {filteredGlossary.length} Indian property terms explained in layman English
          </p>

          <div className="space-y-2">
            {filteredGlossary.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedTerm(item)}
                className="p-3.5 rounded-2xl bg-white border border-line hover:border-forest/40 transition cursor-pointer space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-forest">{item.term}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                    {item.termHindi}
                  </span>
                </div>
                <p className="text-xs text-foreground line-clamp-2">
                  {item.simpleMeaning}
                </p>
              </div>
            ))}
          </div>

          {/* Term Detail Modal */}
          {selectedTerm && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div>
                    <h3 className="text-base font-bold text-forest">
                      {selectedTerm.term}
                    </h3>
                    <span className="text-xs text-ink-muted">
                      {selectedTerm.termHindi}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTerm(null)}
                    className="p-1 rounded-full text-ink-muted hover:text-foreground text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <strong className="text-ink-muted block text-[10px] uppercase">
                      Simple Meaning:
                    </strong>
                    <p className="text-foreground leading-relaxed mt-0.5">
                      {selectedTerm.simpleMeaning}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-canvas">
                    <strong className="text-forest block text-[10px] uppercase">
                      Why It Matters for You:
                    </strong>
                    <p className="text-ink-muted mt-0.5">
                      {selectedTerm.whyItMatters}
                    </p>
                  </div>

                  {selectedTerm.riskNote && (
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900">
                      <strong className="block text-[10px] uppercase">
                        ⚠️ Caution Note:
                      </strong>
                      <p className="mt-0.5">{selectedTerm.riskNote}</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTerm(null)}
                  className="w-full py-2.5 rounded-xl bg-forest text-white text-xs font-bold"
                >
                  Got It
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: REAL ESTATE NEWS & TRENDS */}
      {section === "news" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest">
              Latest Property News &amp; Master Plan Updates
            </h2>
            <span className="text-[10px] text-ink-muted">Indore Focus</span>
          </div>

          <div className="space-y-2.5">
            {REAL_ESTATE_NEWS.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 uppercase">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-ink-muted">{item.date}</span>
                </div>
                <h3 className="text-xs font-bold text-foreground leading-snug">
                  {item.headline}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {item.summary}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-line/60 text-[10px] text-ink-muted">
                  <span>Source: {item.source}</span>
                  <span className="font-bold text-forest">{item.readTime}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: LEGAL DRAFTING & FORMATS */}
      {section === "drafts" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Verified Formats</span>
            <PinToHomeButton shortcutId="drafts" />
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest">
              Standard Verified Legal Templates
            </h2>
            <p className="text-xs text-ink-muted">
              Ready-to-use agreements vetted by high court property advocates.
            </p>
          </div>

          <div className="space-y-2">
            {LEGAL_DRAFT_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      {tmpl.title}
                    </h3>
                    <p className="text-[10px] text-ink-muted mt-0.5">
                      {tmpl.description}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-canvas text-forest uppercase shrink-0">
                    {tmpl.category}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] text-ink-muted">
                    {tmpl.titleSubtitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDraft(tmpl);
                      setCopiedDraft(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <FileText size={12} /> View Format
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Draft Preview Modal */}
          {selectedDraft && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-3 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-line pb-2 shrink-0">
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedDraft.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedDraft(null)}
                    className="p-1 rounded-full text-ink-muted hover:text-foreground text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
                  <div className="p-2.5 rounded-xl bg-canvas text-[11px] text-ink-muted">
                    <span className="font-bold text-foreground block mb-0.5">
                      Category &amp; Scope:
                    </span>
                    {selectedDraft.titleSubtitle} · {selectedDraft.estimatedTimeMin} min read
                  </div>

                  <strong className="block text-[11px] font-bold text-foreground mt-2">
                    Draft Preview:
                  </strong>
                  <pre className="p-3 rounded-xl bg-canvas text-[10px] text-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-line">
                    {selectedDraft.templateContent}
                  </pre>
                </div>

                <div className="pt-2 border-t border-line shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(selectedDraft.templateContent);
                      setCopiedDraft(true);
                      setTimeout(() => setCopiedDraft(false), 2000);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-forest text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Copy size={13} /> {copiedDraft ? "Copied to Clipboard!" : "Copy Full Format"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDraft(null)}
                    className="px-4 py-2.5 rounded-xl border border-line text-xs font-bold text-foreground"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION 4: BLOGS & PODCASTS */}
      {section === "media" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase">Podcasts &amp; Audio</span>
            <PinToHomeButton shortcutId="media" />
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest">
              Real Estate Podcasts &amp; Audio Explainers
            </h2>
            <p className="text-xs text-ink-muted">
              Learn practical real estate strategies while driving or commuting.
            </p>
          </div>

          <div className="space-y-2.5">
            {MEDIA_RESOURCES.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-white border border-line shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-md bg-purple-100 text-purple-800">
                      {item.type === "Podcast" ? (
                        <Radio size={12} />
                      ) : (
                        <Video size={12} />
                      )}
                    </span>
                    <span className="text-[10px] font-bold text-ink-muted uppercase">
                      {item.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-muted">{item.duration}</span>
                </div>

                <h3 className="text-xs font-bold text-foreground leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-line/60 text-xs">
                  <span className="text-[10px] text-ink-muted">
                    Creator: {item.creator}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-full bg-forest text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-95"
                  >
                    <ExternalLink size={12} /> Play Episode
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function UpdatesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-ink-muted">
          Loading Knowledge Hub...
        </div>
      }
    >
      <UpdatesContent />
    </Suspense>
  );
}

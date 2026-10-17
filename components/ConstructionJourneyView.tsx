"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Share2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Plus,
  FileCheck,
  Hammer,
  ShieldCheck,
  Info,
  Edit3,
} from "lucide-react";
import {
  INITIAL_CONSTRUCTION_STAGES,
  CONSTRUCTION_PHASES,
  type ConstructionStageStep,
} from "@/lib/data/construction-journey";

const STORAGE_KEY = "sukoon_construction_journey_v1";

export function ConstructionJourneyView() {
  const [stages, setStages] = useState<ConstructionStageStep[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === INITIAL_CONSTRUCTION_STAGES.length) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Failed to read saved construction stages", e);
      }
    }
    return INITIAL_CONSTRUCTION_STAGES;
  });

  // Filter state
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [activePhaseFilter, setActivePhaseFilter] = useState<string>("all");
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    "phase-0": true,
    "phase-1": true,
    "phase-2": true,
    "phase-3": true,
    "phase-4": false,
    "phase-5": false,
  });

  // Editing notes state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save to localStorage whenever stages change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stages));
      } catch (e) {
        console.error("Failed to save construction stages", e);
      }
    }
  }, [stages]);

  // Toggle stage completion
  const handleToggleComplete = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    setStages((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextCompleted = !s.isCompleted;
          return {
            ...s,
            isCompleted: nextCompleted,
            completionDate: nextCompleted ? (s.completionDate || today) : undefined,
          };
        }
        return s;
      })
    );

    const target = stages.find((s) => s.id === id);
    if (target && !target.isCompleted) {
      showToast(`✓ Marked "${target.title}" as completed!`);
    }
  };

  // Update dates
  const handleDateChange = (id: string, field: "completionDate" | "targetDueDate", value: string) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value || undefined } : s))
    );
  };

  // Save custom note
  const handleSaveNote = (id: string) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, notes: tempNoteText.trim() || undefined } : s))
    );
    setEditingNoteId(null);
    setTempNoteText("");
    showToast("✓ Note saved!");
  };

  // Reset to default
  const handleReset = () => {
    if (confirm("Reset to the recommended standard 28-step construction journey?")) {
      setStages(INITIAL_CONSTRUCTION_STAGES);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      showToast("✓ Reset to standard construction guide");
    }
  };

  // Progress stats
  const totalCount = stages.length;
  const completedCount = stages.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Next active step
  const currentStep = useMemo(() => {
    return stages.find((s) => !s.isCompleted) || stages[stages.length - 1];
  }, [stages]);

  // Filtered stages
  const filteredStages = useMemo(() => {
    return stages.filter((s) => {
      if (activePhaseFilter !== "all" && s.phaseId !== activePhaseFilter) {
        return false;
      }
      if (filterMode === "pending") return !s.isCompleted;
      if (filterMode === "completed") return s.isCompleted;
      return true;
    });
  }, [stages, filterMode, activePhaseFilter]);

  // Share text for WhatsApp
  const shareText = `Sukoon Home Construction Progress Report:
${completedCount}/${totalCount} Steps Completed (${progressPercent}% Complete).
Current Stage: Step ${currentStep.stepNumber} - ${currentStep.title}
Estimated Target Date: ${currentStep.targetDueDate || "Pending"}
Track your home build zero-to-one on Sukoon: https://sukoon-hazel.vercel.app/estate?tab=journey`;

  return (
    <div className="space-y-4">
      {/* Toast message popup */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-forest text-white text-xs font-bold rounded-full shadow-lg transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Hero Overview Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-forest to-[#142e23] text-white shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-mint text-[11px] font-bold uppercase tracking-wider">
              <Hammer size={14} />
              <span>Zero-to-One Home Build Guide</span>
            </div>
            <h2 className="text-2xl font-black mt-1">Super Corridor Plot 108</h2>
            <p className="text-xs text-white/80 mt-0.5">
              3,200 sq.ft Duplex Home • 28 Master Milestones
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black text-mint">
            {progressPercent}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-mint h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/70">
            <span>{completedCount} of {totalCount} steps finished</span>
            <span>{totalCount - completedCount} steps remaining</span>
          </div>
        </div>

        {/* Currently in Progress Highlight Strip */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-mint uppercase font-bold block">
              Currently in Progress
            </span>
            <span className="font-bold text-white">
              Step {currentStep.stepNumber}: {currentStep.title}
            </span>
          </div>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-mint text-forest font-bold text-xs flex items-center gap-1.5 hover:bg-white transition"
          >
            <Share2 size={13} />
            <span>Share Report</span>
          </a>
        </div>
      </div>

      {/* Easy Guidance Explanation Banner for Non-Educated / First-Time Home Builders */}
      <div className="p-3.5 rounded-xl bg-champagne/40 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <Info size={18} className="text-amber-800 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>How this guide works:</strong> Every house is built in 6 phases from raw earth (0) to key handover (1).
          Tap any step to <strong>tick it as done</strong>, or set your <strong>target dates</strong> so your contractor never delays work.
        </div>
      </div>

      {/* Filter and Phase Selectors */}
      <div className="space-y-2">
        {/* Completion status filters */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-full font-bold transition ${
                filterMode === "all"
                  ? "bg-forest text-white"
                  : "bg-white text-ink-muted border border-line"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterMode("pending")}
              className={`px-3 py-1 rounded-full font-bold transition ${
                filterMode === "pending"
                  ? "bg-forest text-white"
                  : "bg-white text-ink-muted border border-line"
              }`}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setFilterMode("completed")}
              className={`px-3 py-1 rounded-full font-bold transition ${
                filterMode === "completed"
                  ? "bg-forest text-white"
                  : "bg-white text-ink-muted border border-line"
              }`}
            >
              Done ({completedCount})
            </button>
          </div>

          <button
            onClick={handleReset}
            className="text-[11px] font-semibold text-ink-muted hover:text-red-700 flex items-center gap-1"
            title="Reset to default guide"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>

        {/* Phase Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            onClick={() => setActivePhaseFilter("all")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              activePhaseFilter === "all"
                ? "bg-mint text-forest font-bold"
                : "bg-white text-ink-muted border border-line"
            }`}
          >
            All 6 Phases
          </button>
          {CONSTRUCTION_PHASES.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActivePhaseFilter(phase.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                activePhaseFilter === phase.id
                  ? "bg-mint text-forest font-bold"
                  : "bg-white text-ink-muted border border-line"
              }`}
            >
              {phase.title.split(":")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Phase Groups & Steps List */}
      <div className="space-y-4">
        {CONSTRUCTION_PHASES.map((phase) => {
          const phaseSteps = filteredStages.filter((s) => s.phaseId === phase.id);
          if (phaseSteps.length === 0) return null;

          const isExpanded = expandedPhases[phase.id] ?? true;
          const phaseDoneCount = stages.filter((s) => s.phaseId === phase.id && s.isCompleted).length;
          const phaseTotal = stages.filter((s) => s.phaseId === phase.id).length;

          return (
            <div key={phase.id} className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
              {/* Phase Group Header Accordion */}
              <button
                onClick={() =>
                  setExpandedPhases((prev) => ({ ...prev, [phase.id]: !isExpanded }))
                }
                className="w-full p-4 flex items-center justify-between text-left bg-canvas/30 hover:bg-canvas/60 transition border-b border-line/60"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest text-white">
                      {phase.tag}
                    </span>
                    <h3 className="text-sm font-bold text-forest">{phase.title}</h3>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{phase.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-forest">
                    {phaseDoneCount}/{phaseTotal} Done
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Steps inside phase */}
              {isExpanded && (
                <div className="divide-y divide-line">
                  {phaseSteps.map((step) => {
                    const isNextActive = !step.isCompleted && step.id === currentStep.id;

                    return (
                      <div
                        key={step.id}
                        className={`p-4 transition ${
                          step.isCompleted
                            ? "bg-white"
                            : isNextActive
                            ? "bg-amber-50/40 border-l-4 border-amber-500"
                            : "bg-white"
                        }`}
                      >
                        {/* Top Row: Checkbox, Step Number, Title */}
                        <div className="flex items-start justify-between gap-3">
                          <button
                            onClick={() => handleToggleComplete(step.id)}
                            className="flex items-start gap-3 text-left group cursor-pointer focus:outline-none"
                            aria-label={`Mark step ${step.stepNumber} ${step.isCompleted ? "incomplete" : "complete"}`}
                          >
                            <div className="mt-0.5 shrink-0 transition transform active:scale-90">
                              {step.isCompleted ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                  <CheckCircle2 size={18} />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-forest/40 group-hover:border-forest flex items-center justify-center bg-white">
                                  <Circle size={14} className="text-transparent" />
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-canvas text-ink-muted">
                                  Step {step.stepNumber}
                                </span>
                                {step.isCompleted && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    ✓ Completed
                                  </span>
                                )}
                                {isNextActive && (
                                  <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                                    ★ Next Action Due
                                  </span>
                                )}
                                <span className="text-[10px] text-ink-muted flex items-center gap-1">
                                  <Clock size={11} /> {step.estimatedDuration}
                                </span>
                              </div>

                              <h4
                                className={`text-sm font-bold mt-1 leading-snug ${
                                  step.isCompleted ? "text-forest line-through opacity-80" : "text-foreground"
                                }`}
                              >
                                {step.title}
                              </h4>
                            </div>
                          </button>
                        </div>

                        {/* Layman Description (Super easy to understand) */}
                        <p className="text-xs text-ink-muted mt-2 leading-relaxed pl-9">
                          {step.laymanDescription}
                        </p>

                        {/* Why it matters note */}
                        <div className="mt-2 pl-9">
                          <div className="p-2.5 rounded-xl bg-canvas/40 border border-line/60 text-[11px] text-foreground leading-relaxed">
                            <span className="font-bold text-forest">Why this matters: </span>
                            <span>{step.whyItMatters}</span>
                          </div>
                        </div>

                        {/* Key Inspection Checklist */}
                        {step.keyChecklist && step.keyChecklist.length > 0 && (
                          <div className="mt-2 pl-9 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                              What to check on site:
                            </span>
                            <ul className="space-y-0.5 text-[11px] text-ink-muted">
                              {step.keyChecklist.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Critical Tip */}
                        {step.criticalTip && (
                          <div className="mt-2 pl-9">
                            <p className="text-[10px] text-amber-800 font-medium italic">
                              💡 <strong>Pro Tip:</strong> {step.criticalTip}
                            </p>
                          </div>
                        )}

                        {/* Date Picker & Action Controls */}
                        <div className="mt-3.5 pl-9 pt-3 border-t border-line/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                          {/* Completion Date Registration */}
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                              <Calendar size={13} className="text-forest" />
                              <span>{step.isCompleted ? "Completed On:" : "Target Due Date:"}</span>
                            </label>
                            <input
                              type="date"
                              value={
                                step.isCompleted
                                  ? step.completionDate || ""
                                  : step.targetDueDate || ""
                              }
                              onChange={(e) =>
                                handleDateChange(
                                  step.id,
                                  step.isCompleted ? "completionDate" : "targetDueDate",
                                  e.target.value
                                )
                              }
                              className="text-xs px-2 py-1 rounded-md border border-line bg-canvas/30 focus:bg-white focus:outline-none focus:border-forest"
                            />
                          </div>

                          {/* Quick Toggle Button */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleComplete(step.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                step.isCompleted
                                  ? "bg-canvas text-forest hover:bg-line"
                                  : "bg-forest text-white hover:opacity-95 shadow-xs"
                              }`}
                            >
                              <CheckCircle2 size={13} />
                              <span>{step.isCompleted ? "Mark Incomplete" : "Mark as Done"}</span>
                            </button>

                            {/* Note Editor Button */}
                            <button
                              onClick={() => {
                                if (editingNoteId === step.id) {
                                  setEditingNoteId(null);
                                } else {
                                  setEditingNoteId(step.id);
                                  setTempNoteText(step.notes || "");
                                }
                              }}
                              className="p-1 rounded-lg text-ink-muted hover:text-forest transition"
                              title="Add / Edit Note"
                            >
                              <Edit3 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Note Display & Edit Form */}
                        {step.notes && editingNoteId !== step.id && (
                          <div className="mt-2 pl-9">
                            <div className="text-[11px] text-forest bg-mint/40 p-2 rounded-lg border border-mint flex items-start gap-1.5">
                              <span className="font-bold">📝 Note:</span>
                              <span className="flex-1">{step.notes}</span>
                            </div>
                          </div>
                        )}

                        {editingNoteId === step.id && (
                          <div className="mt-2.5 pl-9 space-y-1.5">
                            <input
                              type="text"
                              value={tempNoteText}
                              onChange={(e) => setTempNoteText(e.target.value)}
                              placeholder="e.g. Contractor Sharma committed to finish by Friday..."
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-line bg-canvas/40 focus:bg-white focus:outline-none focus:border-forest"
                            />
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-2.5 py-1 text-xs text-ink-muted rounded hover:bg-canvas"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNote(step.id)}
                                className="px-3 py-1 text-xs font-bold text-white bg-forest rounded hover:opacity-90"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

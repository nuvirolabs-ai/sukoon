"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  ThumbsUp,
  ThumbsDown,
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
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import {
  INITIAL_CONSTRUCTION_STAGES,
  CONSTRUCTION_PHASES,
  type ConstructionStageStep,
} from "@/lib/data/construction-journey";

const STORAGE_KEY = "sukoon_construction_journey_v2";

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

  // Accordion state: All phases expanded by default
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    "phase-0": true,
    "phase-1": true,
    "phase-2": true,
    "phase-3": true,
    "phase-4": true,
    "phase-5": true,
  });

  // Minimal step accordion state: By default steps are collapsed; user clicks to expand details
  const [expandedStepIds, setExpandedStepIds] = useState<Record<string, boolean>>({});

  const toggleStepExpand = (stepId: string) => {
    setExpandedStepIds((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  // Editing notes state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // Share report modal
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
  const handleToggleComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const today = new Date().toISOString().split("T")[0];
    setStages((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextCompleted = !s.isCompleted;
          return {
            ...s,
            isCompleted: nextCompleted,
            completionDate: nextCompleted ? s.completionDate || today : undefined,
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

  // Consolidated Share Report (Clean, structured bulleted format)
  const consolidatedReport = useMemo(() => {
    const completedPhasesList = CONSTRUCTION_PHASES.filter((p) => {
      const pSteps = stages.filter((s) => s.phaseId === p.id);
      return pSteps.length > 0 && pSteps.every((s) => s.isCompleted);
    });

    const pendingPhasesList = CONSTRUCTION_PHASES.filter((p) => {
      const pSteps = stages.filter((s) => s.phaseId === p.id);
      return pSteps.some((s) => !s.isCompleted);
    });

    const lines: string[] = [
      "🏗️ SUKOON BUILD PROGRESS REPORT",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "📍 Site: Super Corridor Plot 108 (Indore)",
      `📊 Overall Status: ${completedCount}/${totalCount} Steps Completed (${progressPercent}%)`,
      "",
      "▶️ CURRENT ACTIVE MILESTONE:",
      `• Step ${currentStep.stepNumber}: ${currentStep.title}`,
      `• Target Due Date: ${currentStep.targetDueDate || "Scheduled this week"}`,
      "",
      "🟢 COMPLETED PHASES:",
    ];

    if (completedPhasesList.length > 0) {
      completedPhasesList.forEach((p) => {
        lines.push(`✓ ${p.title} (All Milestones Done)`);
      });
    } else {
      lines.push(`• ${completedCount} individual steps completed across active phases.`);
    }

    lines.push("");
    lines.push("⏳ UPCOMING NEXT:");
    pendingPhasesList.slice(0, 3).forEach((p) => {
      lines.push(`• ${p.title}`);
    });

    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("Track your home build: https://sukoonproptech.com/construction?section=journey");

    return lines.join("\n");
  }, [stages, completedCount, totalCount, progressPercent, currentStep]);

  return (
    <div className="space-y-4">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#1B2922] text-white text-xs font-bold rounded-full shadow-lg transition-all animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Hero Overview Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1E5637] to-[#133A24] text-white shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              <Hammer size={13} />
              <span>Zero-to-One Home Build Guide</span>
            </div>
            <h2 className="text-xl font-serif font-bold mt-1 text-white">Super Corridor Plot 108</h2>
            <p className="text-xs text-white/80 mt-0.5">
              3,200 sq.ft Duplex Villa • 28 Master Milestones
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black text-emerald-200">
            {progressPercent}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/80">
            <span>{completedCount} of {totalCount} steps finished</span>
            <span>{totalCount - completedCount} steps remaining</span>
          </div>
        </div>

        {/* Share Report & Reset Buttons */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/15 text-xs">
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="tap-scale px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold inline-flex items-center gap-1.5 backdrop-blur-xs transition"
          >
            <Share2 size={13} />
            <span>Consolidated Shareable Report</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-white/70 hover:text-white inline-flex items-center gap-1"
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <div className="flex items-center gap-1 bg-sand/60 p-1 rounded-2xl border border-line">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-xl font-bold transition ${
              filterMode === "all" ? "bg-white text-forest shadow-2xs" : "text-ink-muted"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("pending")}
            className={`px-3 py-1 rounded-xl font-bold transition ${
              filterMode === "pending" ? "bg-white text-forest shadow-2xs" : "text-ink-muted"
            }`}
          >
            Pending ({totalCount - completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("completed")}
            className={`px-3 py-1 rounded-xl font-bold transition ${
              filterMode === "completed" ? "bg-white text-forest shadow-2xs" : "text-ink-muted"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Quick Phase Jump */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActivePhaseFilter("all")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border ${
              activePhaseFilter === "all"
                ? "bg-forest text-white border-forest"
                : "bg-white text-ink-muted border-line"
            }`}
          >
            All Phases
          </button>
          {CONSTRUCTION_PHASES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePhaseFilter(p.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border ${
                activePhaseFilter === p.id
                  ? "bg-forest text-white border-forest"
                  : "bg-white text-ink-muted border-line"
              }`}
            >
              {p.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Phase Groups & Steps List */}
      <div className="space-y-3.5">
        {CONSTRUCTION_PHASES.map((phase) => {
          const phaseSteps = filteredStages.filter((s) => s.phaseId === phase.id);
          if (phaseSteps.length === 0) return null;

          const isPhaseExpanded = expandedPhases[phase.id] ?? true;
          const phaseDoneCount = stages.filter((s) => s.phaseId === phase.id && s.isCompleted).length;
          const phaseTotal = stages.filter((s) => s.phaseId === phase.id).length;
          const isPhaseFullyDone = phaseDoneCount === phaseTotal;

          return (
            <div
              key={phase.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isPhaseFullyDone
                  ? "bg-[#F4F8F5] border-[#C5DDD0] shadow-2xs"
                  : "bg-white border-line shadow-2xs"
              }`}
            >
              {/* Phase Header Accordion */}
              <button
                type="button"
                onClick={() =>
                  setExpandedPhases((prev) => ({ ...prev, [phase.id]: !isPhaseExpanded }))
                }
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-sand/30 transition border-b border-line/60"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPhaseFullyDone
                          ? "bg-forest text-white"
                          : "bg-forest text-white"
                      }`}
                    >
                      {phase.tag}
                    </span>
                    <h3
                      className={`text-xs font-bold ${
                        isPhaseFullyDone ? "text-[#1B2922]" : "text-[#1B2922]"
                      }`}
                    >
                      {phase.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">{phase.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isPhaseFullyDone ? "text-forest" : "text-forest"
                    }`}
                  >
                    {phaseDoneCount}/{phaseTotal} Done
                  </span>
                  {isPhaseExpanded ? (
                    <ChevronUp size={16} className="text-ink-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-ink-muted" />
                  )}
                </div>
              </button>

              {/* Minimal Steps Accordion */}
              {isPhaseExpanded && (
                <div className="divide-y divide-line/60">
                  {phaseSteps.map((step) => {
                    const isStepExpanded = Boolean(expandedStepIds[step.id]);
                    const isNextActive = !step.isCompleted && step.id === currentStep.id;

                    return (
                      <div
                        key={step.id}
                        className={`transition-colors ${
                          step.isCompleted
                            ? "bg-[#F4F8F5]/60"
                            : isNextActive
                            ? "bg-emerald-50/30 border-l-3 border-emerald-600"
                            : "bg-white"
                        }`}
                      >
                        {/* Compact Step Row (Click to toggle details down) */}
                        <div
                          onClick={() => toggleStepExpand(step.id)}
                          className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-sand/20 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox Button: Thumbs Up for done, Thumbs Down for incomplete */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleComplete(step.id, e)}
                              className="shrink-0 focus:outline-none tap-scale"
                              title={step.isCompleted ? "Mark incomplete (Thumbs Down)" : "Mark done (Thumbs Up)"}
                              aria-label={`Mark step ${step.stepNumber} complete`}
                            >
                              {step.isCompleted ? (
                                <div className="w-6 h-6 rounded-full bg-[#E8F2EC] text-[#1E5637] border border-[#A7CEB7] flex items-center justify-center shadow-2xs hover:opacity-90 transition">
                                  <ThumbsUp size={13} className="fill-[#1E5637]/20" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-sand/40 hover:bg-sand text-[#7C8B82] border border-line flex items-center justify-center transition">
                                  <ThumbsDown size={13} />
                                </div>
                              )}
                            </button>

                            {/* Step Title & Indicators - Calm soothing theme */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-ink-muted">
                                  Step {step.stepNumber}
                                </span>
                                {step.isCompleted && (
                                  <span className="text-[9px] font-bold text-[#1E5637] bg-[#E8F2EC] border border-[#C5DDD0] px-1.5 py-0.2 rounded-md inline-flex items-center gap-0.5">
                                    <ThumbsUp size={9} /> Completed
                                  </span>
                                )}
                                {isNextActive && (
                                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md animate-pulse">
                                    ★ Active Next
                                  </span>
                                )}
                                <span className="text-[10px] text-ink-muted">
                                  • {step.estimatedDuration}
                                </span>
                              </div>

                              <h4 className="text-xs leading-snug mt-0.5 font-bold text-[#1B2922]">
                                {step.title}
                              </h4>
                            </div>
                          </div>

                          {/* Expand Down Chevron */}
                          <div className="flex items-center gap-1 shrink-0 text-ink-muted">
                            <span className="text-[10px] font-medium hidden sm:inline">
                              {isStepExpanded ? "Less" : "Details"}
                            </span>
                            {isStepExpanded ? (
                              <ChevronUp size={15} />
                            ) : (
                              <ChevronDown size={15} />
                            )}
                          </div>
                        </div>

                        {/* Expandable Step Details Panel */}
                        {isStepExpanded && (
                          <div className="px-4 pb-4 pt-1 space-y-2.5 text-xs border-t border-line/40 bg-sand/15 animate-in fade-in duration-150">
                            {/* Layman Description */}
                            <p className="text-xs text-[#2A3A30] leading-relaxed pl-8">
                              {step.laymanDescription}
                            </p>

                            {/* Why this matters */}
                            <div className="pl-8">
                              <div className="p-2.5 rounded-xl bg-white border border-line text-[11px] text-[#2A3A30] leading-relaxed">
                                <strong className="text-forest">Why this matters: </strong>
                                <span>{step.whyItMatters}</span>
                              </div>
                            </div>

                            {/* What to check on site */}
                            {step.keyChecklist && step.keyChecklist.length > 0 && (
                              <div className="pl-8 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                                  What to verify on site:
                                </span>
                                <ul className="space-y-1 text-[11px] text-[#2A3A30]">
                                  {step.keyChecklist.map((chk, i) => (
                                    <li key={i} className="flex items-center gap-1.5">
                                      <span className="text-forest font-bold">•</span>
                                      <span>{chk}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Pro Tip */}
                            {step.criticalTip && (
                              <div className="pl-8">
                                <p className="text-[11px] text-[#2A3A30] bg-[#F4F8F5] border border-[#C5DDD0] p-2 rounded-xl">
                                  💡 <strong>Pro Tip:</strong> {step.criticalTip}
                                </p>
                              </div>
                            )}

                            {/* Date Picker & Quick Actions */}
                            <div className="pl-8 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line/50">
                              <div className="flex items-center gap-2">
                                <label className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                                  <Calendar size={12} className="text-forest" />
                                  <span>{step.isCompleted ? "Completed on:" : "Target date:"}</span>
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
                                  className="text-xs px-2 py-1 rounded-lg border border-line bg-white focus:outline-none focus:border-forest"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleComplete(step.id, e)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                    step.isCompleted
                                      ? "bg-sand/60 text-[#7C8B82] hover:bg-sand border border-line"
                                      : "bg-forest text-white hover:opacity-90 shadow-2xs"
                                  }`}
                                >
                                  {step.isCompleted ? (
                                    <>
                                      <ThumbsDown size={13} />
                                      <span>Mark Incomplete</span>
                                    </>
                                  ) : (
                                    <>
                                      <ThumbsUp size={13} />
                                      <span>Mark as Done</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingNoteId === step.id) {
                                      setEditingNoteId(null);
                                    } else {
                                      setEditingNoteId(step.id);
                                      setTempNoteText(step.notes || "");
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-ink-muted hover:text-forest transition"
                                  title="Add Note"
                                >
                                  <Edit3 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Note Editor */}
                            {editingNoteId === step.id ? (
                              <div className="pl-8 space-y-1.5 pt-1">
                                <input
                                  type="text"
                                  value={tempNoteText}
                                  onChange={(e) => setTempNoteText(e.target.value)}
                                  placeholder="e.g. Contractor Sharma committed to finish by Friday..."
                                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-line bg-white focus:outline-none focus:border-forest"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteId(null)}
                                    className="px-2.5 py-1 text-xs text-ink-muted rounded hover:bg-sand"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveNote(step.id)}
                                    className="px-3 py-1 text-xs font-bold text-white bg-forest rounded-lg hover:opacity-90"
                                  >
                                    Save Note
                                  </button>
                                </div>
                              </div>
                            ) : (
                              step.notes && (
                                <div className="pl-8 pt-1">
                                  <div className="text-[11px] text-forest bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                                    <strong>📝 Site Note:</strong> {step.notes}
                                  </div>
                                </div>
                              )
                            )}
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

      {/* Share Report Modal (Consolidated, Simple, Clean formatting) */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-foreground p-1 rounded-full bg-sand/60"
            >
              <X size={18} />
            </button>

            <div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                Consolidated Report
              </span>
              <h3 className="text-base font-serif font-bold text-[#1B2922] mt-1">
                Share Construction Progress
              </h3>
              <p className="text-xs text-ink-muted">
                Clean formatted report for WhatsApp or client sharing.
              </p>
            </div>

            {/* Preformatted Preview Box */}
            <div className="bg-sand/30 border border-line rounded-2xl p-3.5 text-xs font-mono text-[#1B2922] whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {consolidatedReport}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(consolidatedReport);
                    showToast("✓ Report copied to clipboard!");
                  }
                }}
                className="tap-scale flex-1 py-2.5 rounded-xl border border-line text-xs font-bold text-forest hover:bg-forest/5 flex items-center justify-center gap-1.5"
              >
                <Copy size={14} /> Copy Report
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(consolidatedReport)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale flex-1 py-2.5 rounded-xl bg-forest text-white text-xs font-bold shadow-2xs hover:opacity-95 flex items-center justify-center gap-1.5"
              >
                <Share2 size={14} /> Send on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

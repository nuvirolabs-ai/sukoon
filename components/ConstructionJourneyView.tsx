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

// Construction Worker with Yellow Safety Hat showing Thumbs Up (Completed)
export function WorkerThumbsUp({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background calm green disc */}
      <circle cx="18" cy="18" r="17" fill="#E8F5EE" stroke="#A3D9B5" strokeWidth="1.5" />
      {/* Worker Safety Vest / Shoulders */}
      <path d="M8 32 C8 25, 12 23.5, 18 23.5 C24 23.5, 28 25, 28 32" fill="#1B4332" />
      <path d="M12.5 28 L14 23.5 M23.5 28 L22 23.5" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round" />
      {/* Worker Face */}
      <ellipse cx="18" cy="19" rx="5.5" ry="6" fill="#FDE68A" />
      {/* Eyes */}
      <circle cx="16" cy="19" r="0.9" fill="#1F2937" />
      <circle cx="20" cy="19" r="0.9" fill="#1F2937" />
      {/* Cheerful Smile */}
      <path d="M16.5 22 Q18 23.5 19.5 22" stroke="#B45309" strokeWidth="1.1" strokeLinecap="round" />
      {/* Yellow Safety Hard Hat Dome */}
      <path d="M11 16 C11 9.5, 25 9.5, 25 16 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
      {/* Hard Hat Top Ridge / Crest */}
      <path d="M16.5 10 C16.5 8.8, 19.5 8.8, 19.5 10 L19 15 L17 15 Z" fill="#FEF08A" />
      {/* Hard Hat Brim */}
      <path d="M9 16 C9 15.5, 27 15.5, 27 16 C27 17.5, 9 17.5, 9 16 Z" fill="#D97706" />
      {/* Thumbs Up Hand Badge */}
      <g transform="translate(19.5, 17.5)">
        <circle cx="7" cy="7" r="6.5" fill="#15803D" stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M6.2 4 C6.2 3.3, 6.7 3, 7.2 3 C7.6 3, 7.8 3.3, 7.8 4 L7.8 6 L9.5 6 C10.1 6, 10.5 6.4, 10.5 7 L9.8 9.5 C9.7 9.8, 9.4 10, 9 10 L6.2 10 L6.2 4 Z" fill="#FFFFFF" />
        <rect x="4.5" y="6" width="1.3" height="4" rx="0.4" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

// Construction Worker with Yellow Safety Hat showing Thumbs Down (Incomplete / Pending)
export function WorkerThumbsDown({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background neutral slate disc */}
      <circle cx="18" cy="18" r="17" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
      {/* Worker Safety Vest / Shoulders */}
      <path d="M8 32 C8 25, 12 23.5, 18 23.5 C24 23.5, 28 25, 28 32" fill="#475569" />
      <path d="M12.5 28 L14 23.5 M23.5 28 L22 23.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      {/* Worker Face */}
      <ellipse cx="18" cy="19" rx="5.5" ry="6" fill="#FDE68A" fillOpacity="0.95" />
      {/* Eyes */}
      <circle cx="16" cy="19" r="0.9" fill="#1F2937" />
      <circle cx="20" cy="19" r="0.9" fill="#1F2937" />
      {/* Attentive / neutral mouth */}
      <path d="M16.5 22.5 Q18 21.5 19.5 22.5" stroke="#64748B" strokeWidth="1.1" strokeLinecap="round" />
      {/* Yellow Safety Hard Hat Dome */}
      <path d="M11 16 C11 9.5, 25 9.5, 25 16 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
      {/* Hard Hat Top Ridge / Crest */}
      <path d="M16.5 10 C16.5 8.8, 19.5 8.8, 19.5 10 L19 15 L17 15 Z" fill="#FEF08A" />
      {/* Hard Hat Brim */}
      <path d="M9 16 C9 15.5, 27 15.5, 27 16 C27 17.5, 9 17.5, 9 16 Z" fill="#D97706" />
      {/* Thumbs Down Hand Badge */}
      <g transform="translate(19.5, 17.5)">
        <circle cx="7" cy="7" r="6.5" fill="#64748B" stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M6.2 10 C6.2 10.7, 6.7 11, 7.2 11 C7.6 11, 7.8 10.7, 7.8 10 L7.8 8 L9.5 8 C10.1 8, 10.5 7.6, 10.5 7 L9.8 4.5 C9.7 4.2, 9.4 4, 9 4 L6.2 4 L6.2 10 Z" fill="#FFFFFF" />
        <rect x="4.5" y="4" width="1.3" height="4" rx="0.4" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

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
                            {/* Checkbox Button: Worker with Yellow Safety Hat showing Thumbs Up (done) or Thumbs Down (incomplete) */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleComplete(step.id, e)}
                              className="shrink-0 focus:outline-none tap-scale group"
                              title={step.isCompleted ? "Completed (Worker Thumbs Up) - Click to mark incomplete" : "Incomplete (Worker Thumbs Down) - Click to mark done"}
                              aria-label={`Mark step ${step.stepNumber} complete`}
                            >
                              {step.isCompleted ? (
                                <WorkerThumbsUp className="w-8 h-8 drop-shadow-2xs group-hover:scale-105 transition-transform" />
                              ) : (
                                <WorkerThumbsDown className="w-8 h-8 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all" />
                              )}
                            </button>

                            {/* Step Title & Indicators - Calm soothing theme */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-ink-muted">
                                  Step {step.stepNumber}
                                </span>
                                {step.isCompleted && (
                                  <span className="text-[9px] font-bold text-[#1E5637] bg-[#E8F2EC] border border-[#C5DDD0] px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Completed
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
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                                    step.isCompleted
                                      ? "bg-sand/60 text-[#475569] hover:bg-sand border border-line"
                                      : "bg-forest text-white hover:opacity-90 shadow-2xs"
                                  }`}
                                >
                                  {step.isCompleted ? (
                                    <>
                                      <WorkerThumbsDown className="w-5 h-5 shrink-0" />
                                      <span>Mark Incomplete</span>
                                    </>
                                  ) : (
                                    <>
                                      <WorkerThumbsUp className="w-5 h-5 shrink-0" />
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

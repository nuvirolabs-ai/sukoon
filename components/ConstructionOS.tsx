"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera } from "lucide-react";
import {
  Button,
  Input,
  PageHead,
  StatusPill,
  Surface,
} from "@/components/ui";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { AnimatedSegment } from "@/components/motion/AnimatedSegment";
import { StatusTransition } from "@/components/motion/StatusTransition";
import { FlashOnChange } from "@/components/motion/FlashOnChange";
import { ConstructionSkeleton } from "@/components/motion/Skeleton";
import { useToast } from "@/components/motion/Toast";
import { Disclosure, GroupedList, ListRow, Metric, ProgressBar, displayLabel, dueCopy, presentDate, presentName } from "@/components/consumer";
import type { ConstructionView } from "@/lib/construction";
import { inr } from "@/lib/utils";

type Choice = { value: string; label: string };
type Field = {
  name: string;
  label: string;
  type?: string;
  options?: Choice[];
  required?: boolean;
  value?: string;
  hint?: string;
  advanced?: boolean;
};
const options = (values: string[]) =>
  values.map((value) => ({ value, label: displayLabel(value) }));
const rupees = (value?: string) =>
  value === undefined ? "Not shared" : inr(Number(value) / 100);
const field = (
  name: string,
  label: string,
  type = "text",
  required = false,
  value?: string,
): Field => ({ name, label, type, required, value });
const moneyField = (name: string, label: string, value?: string): Field => ({
  name,
  label: `${label} (₹)`,
  type: "money",
  value: value === undefined ? undefined : (Number(value) / 100).toString(),
});
async function api<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    cache: "no-store",
    ...(body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await r.json().catch(() => {
    throw new Error(
      "The server could not complete this request. Please retry.",
    );
  });
  if (!r.ok)
    throw new Error(
      data.error?.message || "The request could not be completed.",
    );
  return data.data as T;
}
// Macro phases group the fixed 17-stage template into a handful of tappable
// sections, so the plan reads as five phases instead of a flat stage wall.
const CONSTRUCTION_PHASES: Array<{ key: string; title: string; through: number }> = [
  { key: "prepare", title: "Prepare", through: 4 },
  { key: "structure", title: "Structure", through: 7 },
  { key: "services", title: "Services & shell", through: 10 },
  { key: "interiors", title: "Interiors", through: 14 },
  { key: "closeout", title: "Close-out", through: Number.POSITIVE_INFINITY },
];
function phaseKeyForSequence(sequence: number): string {
  const phase = CONSTRUCTION_PHASES.find((p) => sequence <= p.through);
  return (phase ?? CONSTRUCTION_PHASES[CONSTRUCTION_PHASES.length - 1]).key;
}
function EntryForm({
  title,
  fields,
  submit,
  label = "Save",
  successMessage = "Saved to this project.",
  open = false,
}: {
  title: string;
  fields: Field[];
  submit: (v: Record<string, unknown>) => Promise<void>;
  label?: string;
  successMessage?: string;
  open?: boolean;
}) {
  const formId = useId();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const retry = useRef<{ payload: string; key: string } | null>(null);
  const renderFields = (rows: Field[]) => rows.map((f) =>
    f.options ? (
      <label key={f.name} className="block text-[14px] font-semibold">
        {f.label}
        <select name={f.name} defaultValue={f.value ?? ""} required={f.required} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-white px-3 font-normal">
          <option value="">Choose…</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    ) : f.type === "checkbox" ? (
      <label key={f.name} className="flex items-center gap-2 text-[14px]"><input type="checkbox" name={f.name} required={f.required} />{f.label}</label>
    ) : f.type === "textarea" ? (
      <label key={f.name} className="block text-[14px] font-semibold">{f.label}<textarea name={f.name} defaultValue={f.value} required={f.required} maxLength={4000} rows={3} className="mt-1 w-full rounded-xl border border-line p-3 font-normal" /></label>
    ) : (
      <Input key={f.name} id={`${formId}-${f.name}`} label={f.label} name={f.name} type={f.type === "money" ? "text" : (f.type ?? "text")} inputMode={f.type === "money" ? "decimal" : undefined} defaultValue={f.value} required={f.required} hint={f.hint} step={f.type === "number" ? "any" : undefined} />
    ),
  );
  return (
    <details open={open || undefined} className="border-t border-line pt-3">
      <summary className="cursor-pointer py-2 text-[13px] font-semibold">
        {title}
      </summary>
      <form
        className="space-y-3 py-3"
        onChange={() => setSaved(false)}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          setError("");
          setSaved(false);
          try {
            const fd = new FormData(form);
            const value: Record<string, unknown> = {};
            for (const f of fields) {
              const raw = String(fd.get(f.name) ?? "");
              if (f.type === "checkbox") value[f.name] = fd.has(f.name);
              else if (f.type === "money") {
                if (raw && !/^\d+(\.\d{1,2})?$/.test(raw))
                  throw new Error(
                    "Enter a non-negative rupee amount with at most two decimals.",
                  );
                if (raw) {
                  const [whole, decimal = ""] = raw.split(".");
                  value[f.name] = (
                    BigInt(whole) * 100n +
                    BigInt(decimal.padEnd(2, "0"))
                  ).toString();
                }
              } else if (f.type === "number")
                value[f.name] = raw ? Number(raw) : undefined;
              else value[f.name] = raw;
            }
            const payload = JSON.stringify(value);
            if (retry.current?.payload !== payload)
              retry.current = { payload, key: crypto.randomUUID() };
            await submit({ ...value, idempotencyKey: retry.current.key });
            retry.current = null;
            setSaved(true);
            notify(successMessage);
          } catch (e) {
            const message = e instanceof Error ? e.message : "Save failed.";
            setError(message);
            notify(message, "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        {renderFields(fields.filter((f) => !f.advanced))}
        {fields.some((f) => f.advanced) ? <details className="motion-expand"><summary>More details</summary><div className="motion-expand__body"><div className="space-y-3">{renderFields(fields.filter((f) => f.advanced))}</div></div></details> : null}
        {error ? (
          <p role="alert" className="text-[14px] text-red-700">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-[14px] text-forest">
            {successMessage}
          </p>
        ) : null}
        <Button type="submit" busy={busy} disabled={saved}>
          {label}
        </Button>
      </form>
    </details>
  );
}

function DecisionQuickAction({
  decisionId,
  action,
  payload,
  label,
  secondary = false,
  save,
}: {
  decisionId: string;
  action: string;
  payload: Record<string, unknown>;
  label: string;
  secondary?: boolean;
  save: (action: string, v: Record<string, unknown>) => Promise<void>;
}) {
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  if (done) return <p role="status" className="text-[14px] text-forest">{action === "DECISION_DEFER" ? "Deferred." : "Approved."}</p>;
  return (
    <div className="quick-choice">
      <button
        type="button"
        className={secondary ? "secondary" : ""}
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError("");
          save(action, { decisionId, ...payload, idempotencyKey: crypto.randomUUID() })
            .then(() => {
              setDone(true);
              notify(action === "DECISION_DEFER" ? "Decision deferred." : "Decision recorded.");
            })
            .catch((e) => {
              setError(e instanceof Error ? e.message : "Save failed.");
              notify(e instanceof Error ? e.message : "Save failed.", "error");
            })
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Saving…" : label}
      </button>
      {error ? (
        <p role="alert" className="text-[14px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ConstructionHome() {
  const params = useSearchParams();
  const [projects, setProjects] = useState<ConstructionView[] | null>(null),
    [error, setError] = useState(""),
    [archived, setArchived] = useState(false);
  const load = useCallback(async () => {
    try {
      setProjects(
        await api(
          `/api/construction?archived=${archived}${params.get("propertyId") ? `&propertyId=${encodeURIComponent(params.get("propertyId")!)}` : ""}`,
        ),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [archived, params]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return (
    <>
      <PageHead title="Construction" />
      <div className="pb-6 space-y-5">
        <div className="flex gap-3 text-[14px]">
          <Link
            className="rounded-full bg-forest px-4 py-3 text-white"
            href={`/construction/new${params.get("propertyId") ? `?propertyId=${params.get("propertyId")}` : ""}`}
          >
            Start a Construction Project
          </Link>
          <button onClick={() => setArchived(!archived)} className="underline">
            {archived ? "Active projects" : "Archived"}
          </button>
        </div>
        {error ? (
          <Surface>
            <p role="alert">{error}</p>
            <Button onClick={() => void load()} variant="quiet">
              Retry
            </Button>
          </Surface>
        ) : !projects ? (
          <ConstructionSkeleton />
        ) : !projects.length ? (
          <Surface>
            <h2 className="text-xl font-medium">
              {archived ? "No archived projects" : "Your build starts here"}
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-ink-muted">
              Connect a property, define your requirements and create a build
              plan. Keep stages, documents, budget and materials together as
              work progresses.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-[14px]">
              {["Plan", "Track", "Documents", "Budget", "Materials"].map(
                (t) => (
                  <span key={t}>{t}</span>
                ),
              )}
            </div>
          </Surface>
        ) : (
          <AnimatedList className="divide-y divide-line" stagger={false}>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/construction/${p.id}`}
              className="block py-4 motion-pressable route-continuity"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-medium">{p.name}</h2>
                <StatusTransition statusKey={p.status}><StatusPill>{displayLabel(p.status)}</StatusPill></StatusTransition>
              </div>
              <p className="mt-2 text-[13px]">
                {p.currentStage?.name ?? "Stages closed"} · {p.progressPercent}%
              </p>
              <progress
                key={`${p.id}-${p.progressPercent}`}
                className="progress-reveal my-3 h-1 w-full accent-forest"
                value={p.progressPercent}
                max={100}
                aria-label={`${p.name} progress`}
              />
              <p className="text-[14px] text-ink-muted">
                Next: {p.nextSteps[0]?.title ?? "Review the build plan"}
              </p>
              {p.estimatedBudgetPaise !== undefined ? (
                <p className="mt-2 text-[14px]">
                  {rupees(p.recordedSpendPaise)} recorded /{" "}
                  {rupees(p.estimatedBudgetPaise)} planned
                </p>
              ) : null}
              <p className="mt-2 text-[13px] text-ink-muted">
                {p.attention.length} attention item
                {p.attention.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
          </AnimatedList>
        )}
      </div>
    </>
  );
}

export function ConstructionNew() {
  const params = useSearchParams(),
    router = useRouter();
  const [properties, setProperties] = useState<Choice[]>([]),
    [error, setError] = useState("");
  const load = useCallback(() => {
    void api<{ properties: Array<{ id: string; name: string }> }>(
      "/api/properties",
    )
      .then((d) => {
        setProperties(
          d.properties.map((p) => ({ value: p.id, label: p.name })),
        );
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  return (
    <>
      <PageHead
        title="Define your project"
        sub="Start with a Property Passport."
      />
      <div className="pb-6 space-y-4">
        <Link href="/construction" className="text-[14px] underline">
          Back to Construction
        </Link>
        {error ? (
          <p role="alert">
            {error}
            <button className="motion-pressable underline" onClick={load}>Retry</button>
          </p>
        ) : null}
        {!properties.length ? (
          <p className="text-[13px]">
            Add a property before starting.{" "}
            <Link href="/property/new" className="underline">
              Create Property Passport
            </Link>
          </p>
        ) : (
          <EntryForm
            open
            title="Project requirements"
            label="Create build plan"
            fields={[
              {
                name: "propertyId",
                label: "Property / plot",
                options: properties,
                required: true,
                value: params.get("propertyId") ?? undefined,
              },
              field("name", "Project name", "text", true),
              {
                name: "projectType",
                label: "Construction type",
                options: options([
                  "NEW_HOME",
                  "RENOVATION",
                  "EXTENSION",
                  "REBUILD",
                ]),
                required: true,
                value: "NEW_HOME",
              },
              field("builtUpArea", "Planned built-up area", "number", true),
              {
                name: "areaUnit",
                label: "Area unit",
                options: options(["sqft", "sqm"]),
                value: "sqft",
                required: true,
              },
              field("floorCount", "Total floors (G+2 = 3)", "number", true),
              field("startDate", "Desired start date", "date", true),
              { ...moneyField("estimatedBudgetPaise", "Target budget"), advanced: true },
              { ...field("targetCompletionDate", "Target completion", "date"), advanced: true },
              {
                name: "qualityLevel",
                label: "Quality preference",
                options: options(["BASIC", "STANDARD", "PREMIUM", "CUSTOM"]),
                value: "STANDARD",
                required: true,
                advanced: true,
              },
              { ...field("requirements", "Requirements: bedrooms, bathrooms, parking, lift, basement, terrace…", "textarea"), advanced: true },
            ]}
            submit={async (v) => {
              const p = await api<ConstructionView>("/api/construction", v);
              router.push(`/construction/${p.id}`);
            }}
          />
        )}
        <p className="text-[13px] leading-5 text-ink-muted">
          Requirements and dates are your plan. The workflow template does not
          prescribe engineering quantities, legal approvals or guaranteed costs.
        </p>
      </div>
    </>
  );
}

function AskConstruction({ p }: { p: ConstructionView }) {
  const [answer, setAnswer] = useState<{
    answer: string;
    citations: Array<{ id: string; title: string; href: string }>;
  } | null>(null);
  return (
    <Surface>
      <EntryForm
        title="Ask about this project"
        fields={[field("question", "Your question", "text", true)]}
        label="Ask"
        successMessage="Answer ready. Project records were not changed."
        submit={async (v) =>
          setAnswer(
            await api("/api/assistant", {
              question: v.question,
              propertyId: p.propertyId,
              projectId: p.id,
            }),
          )
        }
      />
      {answer ? (
        <div className="mt-3 text-[13px] leading-6">
          <p>{answer.answer}</p>
          {answer.citations.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="block text-[14px] underline"
            >
              {c.title} · source record
            </Link>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-[13px] text-ink-muted">
        Answers use recorded project facts and calculations. No live AI or
        engineering advice.
      </p>
    </Surface>
  );
}

export function ConstructionProjectScreen({ id }: { id: string }) {
  const params = useSearchParams();
  const [p, setProject] = useState<ConstructionView | null>(null),
    [error, setError] = useState("");
  const [vault, setVault] = useState<
    Array<{ id: string; name: string; versionId: string }>
  >([]);
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [openStageId, setOpenStageId] = useState<string | null>(null);
  const [openPhaseKey, setOpenPhaseKey] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setProject(await api(`/api/construction/${id}`));
      setError("");
    } catch (e) {
      setProject(null);
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const save = async (action: string, v: Record<string, unknown>) => {
    if (!p) return;
    const updated = await api<ConstructionView>(`/api/construction/${id}`, {
      ...v,
      action,
      version: p.version,
    });
    setProject(updated);
  };
  if (error)
    return (
      <div className="p-4">
        <PageHead title="Construction" />
        <p role="alert">{error}</p>
        <Button onClick={() => void load()}>Retry</Button>
        <Link href="/construction">Back to projects</Link>
      </div>
    );
  if (!p)
    return (
      <div className="p-4">
        <ConstructionSkeleton />
      </div>
    );
  const write =
    p.owner && !p.archivedAt && !["COMPLETED", "CANCELLED"].includes(p.status);
  // Construction OS surfaces five concepts. Legacy section links keep
  // working by redirecting to their new home.
  const LEGACY_TABS: Record<string, string> = {
    overview: "now",
    plan: "journey",
    budget: "money",
    materials: "more",
    documents: "more",
    updates: "site",
    people: "more",
    timeline: "more",
    handover: "more",
  };
  const requested = params.get("tab") ?? "now";
  const tab = ["now", "journey", "money", "site", "more"].includes(requested)
    ? requested
    : (LEGACY_TABS[requested] ?? "now");
  const tabs = [
    "now",
    "journey",
    ...(p.capabilities.budget || p.capabilities.cost ? ["money"] : []),
    ...(p.capabilities.updates || p.capabilities.materials ? ["site"] : []),
    "more",
  ];
  const TAB_LABELS: Record<string, string> = {
    now: "Now",
    journey: "Journey",
    money: "Money",
    site: "Site",
    more: "More",
  };
  const guidanceHref = (actionType: string): string | undefined => {
    switch (actionType) {
      case "OPEN_DECISION":
        return `/construction/${id}?tab=more#decisions`;
      case "OPEN_WORK_ITEM":
      case "OPEN_PROJECT_STAGE":
        return `/construction/${id}?tab=journey`;
      case "OPEN_ISSUE":
      case "OPEN_INSPECTION":
      case "OPEN_DELIVERY":
      case "OPEN_SITE_UPDATE":
        return `/construction/${id}?tab=site`;
      case "OPEN_DOCUMENT":
      case "OPEN_HANDOVER":
        return `/construction/${id}?tab=more`;
      case "OPEN_MONEY_RECORD":
        return `/construction/${id}?tab=money`;
      default:
        return undefined;
    }
  };
  const stageOptions = p.stages.map((s) => ({ value: s.id, label: s.name }));
  const todayISO = new Date().toISOString().slice(0, 10);
  // Week items drive NEXT + This-week from the same engine facts.
  const weekItems: Array<{ day: string; title: string; href: string; kind: "inspection" | "milestone" | "due" }> = (() => {
    const items: Array<{ day: string; title: string; href: string; kind: "inspection" | "milestone" | "due" }> = [];
    for (const i of p.inspections) {
      if (i.status === "SCHEDULED") items.push({ day: String(i.performedAt).slice(0, 10), title: i.title, href: `/construction/${id}?tab=site`, kind: "inspection" });
    }
    for (const m of p.milestones) {
      if (m.plannedDate && !["DONE", "SKIPPED", "CANCELLED"].includes(m.status)) items.push({ day: m.plannedDate, title: m.name, href: `/construction/${id}?tab=journey`, kind: "milestone" });
    }
    for (const d of p.decisions) {
      if (d.status === "OPEN" && d.dueDate) items.push({ day: d.dueDate, title: `${d.title} · due`, href: `/construction/${id}?tab=more#decisions`, kind: "due" });
    }
    return items.filter((w) => w.day >= todayISO).sort((a, b) => (a.day < b.day ? -1 : 1)).slice(0, 4);
  })();
  const weekDayLabel = (day: string) => {
    const diff = Math.round((Date.parse(day) - Date.parse(todayISO)) / 86400000);
    if (diff <= 0) return "Today";
    if (diff === 1) return "Tomorrow";
    const label = new Date(`${day}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
    return diff <= 6 ? label : `${label} ${day.slice(8)}`;
  };
  // True journey rail: every stage, current dominates, milestone callout.
  const stageRail = (
    <ol className="stage-rail" aria-label="Build progress">
      {p.stages.map((s) => {
        const isDone = ["COMPLETED", "SKIPPED"].includes(s.status);
        const isCurrent = p.currentStage?.id === s.id || s.status === "IN_PROGRESS";
        const mile = p.milestones.find((m) => m.stageId === s.id && !["DONE", "SKIPPED", "CANCELLED"].includes(m.status));
        return (
          <li key={s.id}>
            <span className={`rail-node${isDone && !isCurrent ? " is-done" : ""}${isCurrent ? " is-current" : ""}`}>
              {isDone && !isCurrent ? "✓" : isCurrent ? "●" : "○"}
            </span>
            <span className="rail-label">{isCurrent ? <strong>{s.name}</strong> : s.name}</span>
            {isCurrent && mile ? <span className="rail-mile">{mile.name}</span> : null}
          </li>
        );
      })}
    </ol>
  );
  // Group the ordered stages into the macro phases used by the Journey plan.
  const phaseGroups = CONSTRUCTION_PHASES.map((phase) => ({
    ...phase,
    stages: p.stages.filter((s) => phaseKeyForSequence(s.sequence) === phase.key),
  })).filter((phase) => phase.stages.length > 0);
  const focusStage =
    p.currentStage ??
    p.stages.find((s) => !["COMPLETED", "SKIPPED"].includes(s.status)) ??
    p.stages[0];
  const currentPhaseKey = phaseKeyForSequence(focusStage?.sequence ?? 1);
  const stage: Field = {
    name: "stageId",
    label: "Stage",
    options: stageOptions,
  };
  const task: Field = {
    name: "taskId",
    label: "Task (optional)",
    options: p.tasks.map((t) => ({ value: t.id, label: t.title })),
  };
  const contact: Field = {
    name: "contactId",
    label: "Assigned contact / supplier",
    options: p.contacts.map((c) => ({ value: c.id, label: c.name })),
  };
  const budget: Field = {
    name: "budgetItemId",
    label: "Budget category",
    options: p.budgets.map((b) => ({ value: b.id, label: b.category })),
  };
  const actionForm = (
    title: string,
    action: string,
    fields: Field[],
    extra: Record<string, unknown> = {},
  ) =>
    write ? (
      <EntryForm
        key={`${action}-${String(
          extra.stageId ?? extra.taskId ?? extra.materialId ?? extra.budgetItemId ??
          extra.contactId ?? extra.milestoneId ?? extra.dependencyId ?? extra.commitmentId ??
          extra.quoteId ?? extra.orderId ?? extra.linkId ?? extra.changeId ?? extra.decisionId ??
          extra.issueId ?? extra.planVersionId ?? extra.updateId ?? extra.costId ?? "",
        )}`}
        title={title}
        fields={fields}
        submit={(v) => save(action, { ...v, ...extra })}
      />
    ) : null;
  return (
    <>
      <PageHead
        title={p.name}
        sub={`${displayLabel(p.projectType)} · ${p.owner ? "Owner project" : "Shared project"}`}
        backHref="/construction"
        backLabel="All projects"
      />
      <div className="pb-8 space-y-5">
        <div className="flex justify-between text-[14px]">
          <button className="motion-pressable underline" onClick={() => void load()}>
            Refresh records
          </button>
          <Link
            href={
              p.owner ? `/property/${p.propertyId}` : `/shared/${p.propertyId}`
            }
            className="motion-pressable underline"
          >
            Property Passport
          </Link>
        </div>
        {p.owner && tab === "now" ? null : (
        <AnimatedSegment
          label="Project sections"
          value={tabs.includes(tab) ? tab : tabs[0]}
          options={tabs.map((t) => ({ value: t, label: TAB_LABELS[t] ?? displayLabel(t), href: `/construction/${id}?tab=${t}` }))}
        />
        )}
        {p.owner && tab !== "now" ? (
          <Link href={`/construction/${id}?tab=now`} className="text-[14px] underline">
            ← Back to story
          </Link>
        ) : null}
        {!p.owner ? (
          <p className="text-[13px] text-ink-muted" role="status">
            Viewing as {displayLabel(p.role ?? "VIEWER")}. Same build, shown for your role.
          </p>
        ) : null}
        {p.archivedAt ? (
          <Surface>
            Archived project · historical records retained.
            {p.owner ? (
              <Button
                variant="quiet"
                onClick={() =>
                  void save("RESTORE", {
                    idempotencyKey: crypto.randomUUID(),
                  }).catch((e) => setError(e.message))
                }
              >
                Restore
              </Button>
            ) : null}
          </Surface>
        ) : null}
        {!tabs.includes(tab) ? (
          <p>This section is not available under your current permissions.</p>
        ) : null}
        {tab === "now" ? <>
          <div className="story-grid">
          <div className="story-main">
          <p className="story-stage">{p.currentStage?.name ?? "Stages closed"}</p>
          {(() => {
            const milestone = p.milestones.find((m) => ["IN_PROGRESS", "READY"].includes(m.status));
            return milestone ? <p className="story-milestone">Preparing {milestone.name}</p> : null;
          })()}
          <div className="story-progress">
            <span className="track"><span className="fill" style={{ width: `${p.progressPercent}%` }} /></span>
            <span className="pct">{p.progressPercent}%</span>
          </div>
          {weekItems[0] ? (
            <Link className="next-card route-continuity" href={weekItems[0].href}>
              <span>
                <span className="next-eyebrow">Next · {weekDayLabel(weekItems[0].day)}</span><br />
                <span className="next-title">{weekItems[0].title.replace(" · due", "")}</span>
              </span>
              <span aria-hidden="true" style={{ marginLeft: "auto" }}>→</span>
            </Link>
          ) : null}
          {stageRail}
          {(() => {
            const primary = [
              ...p.guidance.filter((g) => ["BLOCKING", "DECISION"].includes(g.type)).slice(0, 2),
              ...p.guidance.filter((g) => g.type === "EXCEPTION").slice(0, 1),
            ].slice(0, 3);
            const shortTitle = (t: string) => t.replace(/ needs (approval|review)\.$/, "");
            const needKind = (g: (typeof p.guidance)[number]) => {
              if (g.ruleKey === "G04" || g.actionType === "OPEN_DELIVERY") return { key: "delivery", eyebrow: "Delivery", action: "Review delivery" };
              if (["G08", "G09", "G10", "G11", "G15"].includes(g.ruleKey) || g.actionType === "OPEN_MONEY_RECORD") return { key: "money", eyebrow: "Money", action: "Review" };
              return { key: "decision", eyebrow: "Decision", action: "Review & decide" };
            };
            return (
              <>
                <h2 className="story-h">Needs you{primary.length ? ` (${primary.length})` : ""}</h2>
                {primary.length ? (
                  <GroupedList>
                    {primary.map((g) => {
                      const kind = needKind(g);
                      return (
                      <Link key={g.id} className={`list-row route-continuity need is-${kind.key}`} href={guidanceHref(g.actionType) ?? `/construction/${id}?tab=more`}>
                        <span className="row-copy">
                          <span className="need-eyebrow">{kind.eyebrow}</span>
                          <span className="row-title">{shortTitle(g.title)}</span>
                          <span className="need-sub">{g.reason.split(". ")[0]}.</span>
                        </span>
                        <span className="need-action">{kind.action} →</span>
                      </Link>
                      );
                    })}
                  </GroupedList>
                ) : (
                  <p className="text-[14px]">Nothing needs you. The build is moving.</p>
                )}
              </>
            );
          })()}
          {weekItems.length ? (
            <>
              <h2 className="story-h">This week</h2>
              <ol className="week-tl">
                {weekItems.map((w, i) => (
                  <li key={`${w.day}-${i}`}>
                    <span className={`week-dot marker-${w.kind === "due" ? "due" : w.kind === "milestone" ? "mile" : "insp"}`} aria-hidden="true" />
                    <span className="week-day">{weekDayLabel(w.day)}</span><br />
                    <Link href={w.href} className="week-title underline decoration-line">{w.title}</Link>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
          {(() => {
            const latest = p.capabilities.updates ? p.updates[0] : undefined;
            if (!latest) return null;
            const photos = (Array.isArray(latest.photoRefs) ? (latest.photoRefs as unknown[]) : []).length;
            const lastDelivery = p.deliveries[0];
            const short = lastDelivery && lastDelivery.expectedQuantity !== null
              ? Math.max(0, Number(lastDelivery.expectedQuantity) - Number(lastDelivery.receivedQuantity))
              : 0;
            const shortPct = lastDelivery && lastDelivery.expectedQuantity !== null && Number(lastDelivery.expectedQuantity) > 0
              ? (short / Number(lastDelivery.expectedQuantity)) * 100
              : 0;
            return (
              <>
                <h2 className="story-h">At the site</h2>
                <Link href={`/construction/${id}?tab=site`} className="block">
                  <span className="evidence-lead">
                    <span className="ev-tag">Synthetic site photo · {p.currentStage?.name ?? "site"}</span>
                    <span className="ev-cap">{latest.title}</span>
                    <span className="ev-meta">{presentDate(String(latest.occurredAt))}{photos ? ` · ${photos} photos` : ""}</span>
                  </span>
                  {photos > 0 ? (
                    <span className="evidence-strip" aria-label={`${photos} site photos`}>
                      {[0, 1, 2].filter((n) => n < photos).map((n) => (
                        <span key={n} className="evidence-tile"><Camera size={18} aria-hidden="true" /></span>
                      ))}
                      {photos > 3 ? <span className="evidence-tile">+{photos - 3}</span> : null}
                    </span>
                  ) : null}
                </Link>
                {short > 0 && lastDelivery ? (
                  <Link href={`/construction/${id}?tab=site`} className="mt-3 block">
                    <span className="text-[14px] font-semibold">Cement delivery</span>
                    <span className="dv-row">
                      <span className="dv-label"><span>Expected</span><span>{lastDelivery.expectedQuantity}</span></span>
                      <span className="dv-track dv-expected"><span style={{ width: "100%" }} /></span>
                    </span>
                    <span className="dv-row">
                      <span className="dv-label"><span>Received</span><span>{lastDelivery.receivedQuantity}</span></span>
                      <span className="dv-track dv-received"><span style={{ width: `${(Number(lastDelivery.receivedQuantity) / Number(lastDelivery.expectedQuantity)) * 100}%` }} /></span>
                    </span>
                    <span className="dv-short">Short · {short} {lastDelivery.unit} · {shortPct.toFixed(1)}%</span>
                  </Link>
                ) : null}
              </>
            );
          })()}
          {(p.capabilities.cost || p.capabilities.budget) && p.money ? (
            <>
              <h2 className="story-h">Money</h2>
              {(() => {
                const approved = Number(p.money!.currentApprovedPaise);
                const recorded = Number(p.money!.recordedSpendPaise);
                const committed = Number(p.money!.committedPaise);
                const rest = Math.max(0, approved - recorded - committed);
                const pct = (n: number) => (approved > 0 ? `${((n / approved) * 100).toFixed(1)}%` : "—");
                const bar = (n: number) => (approved > 0 ? `${(n / approved) * 100}%` : "0%");
                return (
                  <div className="money-model">
                    <div className="mm-row"><span>Base plan</span><b>{inr(Number(p.money!.basePlannedPaise) / 100)}</b></div>
                    <div className="mm-row"><span>Approved changes</span><b>{Number(p.money!.approvedChangeDeltaPaise) >= 0 ? "+" : "−"}{inr(Math.abs(Number(p.money!.approvedChangeDeltaPaise)) / 100).slice(1)}</b></div>
                    <div className="mm-row total"><span>Current approved</span><b>{inr(approved / 100)}</b></div>
                    <div className="money-bar2" role="img" aria-label={`Recorded ${inr(recorded / 100)}, committed ${inr(committed / 100)}, remaining approved headroom ${inr(rest / 100)}`}>
                      <span className="seg-recorded" style={{ width: bar(recorded) }} />
                      <span className="seg-committed" style={{ width: bar(committed) }} />
                    </div>
                    <div className="mm-row"><span>Recorded</span><span><b>{inr(recorded / 100)}</b> · {pct(recorded)}</span></div>
                    <div className="mm-row"><span>Committed</span><span><b>{inr(committed / 100)}</b> · {pct(committed)}</span></div>
                    <div className="mm-row"><span>Remaining headroom</span><span><b>{inr(rest / 100)}</b> · {pct(rest)}</span></div>
                  </div>
                );
              })()}
              {p.money.explanations[0] ? (
                <p className="mt-2 text-[14px]"><Link className="underline" href={`/construction/${id}?tab=money`}>Why did it change? →</Link> <span className="text-ink-muted">{p.money.explanations[0]}</span></p>
              ) : null}
            </>
          ) : null}
          <h2 className="story-h">Explore</h2>
          <nav className="explore-grid" aria-label="Deeper construction areas">
            <Link href={`/construction/${id}?tab=journey`}>Plan <span aria-hidden="true">→</span></Link>
            <Link href={`/construction/${id}?tab=more#materials`}>Materials <span aria-hidden="true">→</span></Link>
            <Link href={`/construction/${id}?tab=more#papers`}>Papers <span aria-hidden="true">→</span></Link>
            <Link href={`/construction/${id}?tab=more#people`}>People <span aria-hidden="true">→</span></Link>
            <Link href={`/construction/${id}?tab=site`}>Issues <span aria-hidden="true">→</span></Link>
            <Link href={`/construction/${id}?tab=more#history`}>History <span aria-hidden="true">→</span></Link>
            <Link href={`/construction/${id}?tab=more#handover`}>Handover <span aria-hidden="true">→</span></Link>
            <Link href={`/construction/${id}?tab=more#decisions`}>Decisions <span aria-hidden="true">→</span></Link>
          </nav>
          <Disclosure title="Ask about this project"><AskConstruction p={p}/></Disclosure>
          <p className="mt-3 text-[14px]"><Link className="underline" href={`/construction/${id}?tab=more#history`}>View all activity →</Link></p>
          </div>
          <aside className="story-aside" aria-label="Supporting context">
            {p.capabilities.documents && p.documents.length ? (
              <div className="aside-card">
                <h3>Papers</h3>
                {p.documents.slice(0, 3).map((d) => (
                  <p key={d.id} className="text-[13px]">{d.label || d.title} · v{d.version}</p>
                ))}
                <p className="mt-2 text-[13px]"><Link className="underline" href={`/construction/${id}?tab=more#papers`}>All papers →</Link></p>
              </div>
            ) : null}
            {p.capabilities.contacts && p.contacts.length ? (
              <div className="aside-card">
                <h3>People</h3>
                {p.contacts.slice(0, 4).map((c) => (
                  <p key={c.id} className="text-[13px]">{c.name} · {displayLabel(c.role)}</p>
                ))}
                <p className="mt-2 text-[13px]"><Link className="underline" href={`/construction/${id}?tab=more#people`}>All people →</Link></p>
              </div>
            ) : null}
          </aside>
          </div>
        </> : null}
        {tab === "journey" ? (
          <>
            {stageRail}
            {(() => {
              const s = p.currentStage ?? p.stages.find((x) => !["COMPLETED", "SKIPPED"].includes(x.status));
              if (!s) return null;
              const tasks = p.tasks.filter((t) => t.stageId === s.id && t.status !== "CANCELLED");
              const done = tasks.filter((t) => t.status === "DONE").length;
              const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
              const underway = tasks.length - done - blocked;
              const openDecisions = p.decisions.filter((d) => d.status === "OPEN" && (d.stageId === s.id || tasks.some((t) => t.id === d.workItemId)));
              const upcomingInspections = p.inspections.filter((i) => i.status === "SCHEDULED" && (i.stageId === s.id || tasks.some((t) => t.id === i.workItemId)));
              const milestone = p.milestones.find((m) => m.stageId === s.id && !["DONE", "SKIPPED", "CANCELLED"].includes(m.status));
              const glyph = (st: string) => (st === "DONE" ? "✓" : st === "IN_PROGRESS" ? "●" : st === "BLOCKED" ? "!" : "○");
              return (
                <Surface>
                  <p className="text-[13px] text-ink-muted">Now in {s.name}</p>
                  <p className="mt-1 text-[17px] font-semibold">{done} done · {underway} underway{blocked ? ` · ${blocked} blocked` : ""}</p>
                  {milestone ? <p className="mt-1 text-[14px]">◎ {milestone.name}</p> : null}
                  {tasks.filter((t) => t.status !== "DONE").slice(0, 5).map((t) => (
                    <p key={t.id} className="mt-1 text-[14px]">{glyph(t.status)} {t.title}</p>
                  ))}
                  {openDecisions.map((d) => (
                    <p key={d.id} className="mt-1 text-[14px]">! {d.title} — <Link className="underline" href={`/construction/${id}?tab=more#decisions`}>decide</Link></p>
                  ))}
                  {upcomingInspections.map((i) => (
                    <p key={i.id} className="mt-1 text-[14px]">○ {i.title} · {presentDate(String(i.performedAt))}</p>
                  ))}
                </Surface>
              );
            })()}
            <section className="mt-4">
              <h2 className="section-heading">The plan</h2>
            <p className="text-[13px] text-ink-muted">Five phases. Tap a phase to open its stages, and a stage to see its tasks.</p>
            <div className="roadmap-phases">
            {(() => {
            const renderStage = (s: (typeof p.stages)[number]) => {
              const done = ["COMPLETED", "SKIPPED"].includes(s.status);
              const current = p.currentStage?.id === s.id || s.status === "IN_PROGRESS";
              const isOpen = openStageId ? openStageId === s.id : current || s.status === "READY";
              const stageTasks = p.tasks.filter((t) => t.stageId === s.id);
              const doneTasks = stageTasks.filter((t) => ["DONE", "CANCELLED"].includes(t.status)).length;
              return (
              <section key={s.id} className={`roadmap-stage${current ? " is-current" : ""}${done ? " is-done" : ""}${isOpen ? " is-open" : ""}`}>
                <span aria-hidden="true" className="roadmap-node">{done ? "✓" : s.sequence}</span>
                <button
                  type="button"
                  onClick={() => setOpenStageId(isOpen ? `closed-${s.id}` : s.id)}
                  aria-expanded={isOpen}
                  className="roadmap-card motion-pressable"
                >
                  <span className="flex justify-between gap-2">
                    <span className="text-[14px] font-semibold">
                      {s.sequence}. {s.name}
                    </span>
                    <StatusTransition statusKey={s.status}><StatusPill>{displayLabel(s.status)}</StatusPill></StatusTransition>
                  </span>
                  <span className="mt-2 block text-[13px] text-ink-muted">
                    {s.progressPercent}%{stageTasks.length ? ` · ${doneTasks}/${stageTasks.length} tasks` : ""}{s.expectedEnd ? ` · ${s.expectedEnd}` : ""}
                  </span>
                </button>
                <div className="roadmap-detail"><div className="roadmap-detail__inner">
                {s.notes ? <p className="mt-2 text-[14px]">{s.notes}</p> : null}
                {stageTasks
                  .map((t) => {
                    const taskDone = ["DONE", "CANCELLED"].includes(t.status);
                    return (
                    <div key={t.id} className={`task-row mt-3 flex gap-2 border-l border-line pl-3${taskDone ? " is-done" : ""}`}>
                      <span aria-hidden="true" className="task-check mt-0.5">{taskDone ? "✓" : ""}</span>
                      <div className="min-w-0 flex-1">
                      <p className="text-[13px]">
                        {t.title}{" "}
                        <span className="text-[12px] text-ink-muted">
                          <StatusTransition statusKey={t.status}>{displayLabel(t.status)}</StatusTransition>
                        </span>
                      </p>
                      <p className="text-[13px] text-ink-muted">
                        {presentName(displayLabel(t.source))}
                        {t.dueDate ? ` · ${dueCopy(t.dueDate)}` : ""}
                      </p>
                      {write && !["DONE", "CANCELLED"].includes(t.status)
                        ? actionForm(
                            "Edit task",
                            "TASK_UPDATE",
                            [
                              field("title", "Title", "text", true, t.title),
                              {
                                name: "status",
                                label: "Status",
                                options: options([
                                  "TODO",
                                  "IN_PROGRESS",
                                  "BLOCKED",
                                  "DONE",
                                  "CANCELLED",
                                ]),
                                value: t.status,
                                required: true,
                              },
                              field(
                                "dueDate",
                                "Due date",
                                "date",
                                false,
                                t.dueDate ?? "",
                              ),
                              { ...contact, value: t.assignedContactId ?? "" },
                              {
                                name: "dependsOnId",
                                label: "Depends on task",
                                options: p.tasks
                                  .filter((x) => x.id !== t.id)
                                  .map((x) => ({
                                    value: x.id,
                                    label: x.title,
                                  })),
                                value: t.dependsOnId ?? "",
                              },
                              field(
                                "description",
                                "Description",
                                "textarea",
                                false,
                                t.description,
                              ),
                              field(
                                "notes",
                                "Notes",
                                "textarea",
                                false,
                                t.notes,
                              ),
                            ],
                            { taskId: t.id, stageId: s.id },
                          )
                        : null}
                      </div>
                    </div>
                    );
                  })}
                {!["COMPLETED", "SKIPPED"].includes(s.status)
                  ? actionForm(
                      "Stage dates and status",
                      "STAGE_UPDATE",
                      [
                        {
                          name: "status",
                          label: "Status",
                          options: options([
                            "NOT_STARTED",
                            "READY",
                            "IN_PROGRESS",
                            "BLOCKED",
                            "COMPLETED",
                            "SKIPPED",
                          ]),
                          value: s.status,
                          required: true,
                        },
                        field(
                          "expectedStart",
                          "Expected start",
                          "date",
                          false,
                          s.expectedStart ?? "",
                        ),
                        field(
                          "expectedEnd",
                          "Expected end",
                          "date",
                          false,
                          s.expectedEnd ?? "",
                        ),
                        field(
                          "notes",
                          "Notes / reason for skipping",
                          "textarea",
                          false,
                          s.notes,
                        ),
                      ],
                      { stageId: s.id },
                    )
                  : null}
                </div></div>
              </section>
              );
            };
            const renderPhase = (group: (typeof phaseGroups)[number]) => {
              const total = group.stages.length;
              const doneCount = group.stages.filter((s) => ["COMPLETED", "SKIPPED"].includes(s.status)).length;
              const hasCurrent = group.stages.some((s) => p.currentStage?.id === s.id || s.status === "IN_PROGRESS");
              const phaseOpen = openPhaseKey ? openPhaseKey === group.key : group.key === currentPhaseKey;
              const phaseDone = total > 0 && doneCount === total;
              return (
                <section key={group.key} className={`roadmap-phase${hasCurrent ? " is-current" : ""}${phaseDone ? " is-done" : ""}${phaseOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setOpenPhaseKey(phaseOpen ? `closed-${group.key}` : group.key)}
                    aria-expanded={phaseOpen}
                    className="roadmap-phase-head motion-pressable"
                  >
                    <span className="roadmap-phase-node" aria-hidden="true">{phaseDone ? "✓" : `${doneCount}/${total}`}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[15px] font-semibold">{group.title}</span>
                        <span className="text-[13px] text-ink-muted">{phaseDone ? "Done" : hasCurrent ? "In progress" : doneCount ? `${doneCount}/${total} stages` : "Not started"}</span>
                      </span>
                      <span className="mt-1 block truncate text-[13px] text-ink-muted">{group.stages.map((s) => s.name).join(" · ")}</span>
                    </span>
                  </button>
                  <div className="roadmap-phase-body">
                    <div className="roadmap-phase-body__inner">
                      <div className="roadmap">{group.stages.map((s) => renderStage(s))}</div>
                    </div>
                  </div>
                </section>
              );
            };
            return <>{phaseGroups.map((group) => renderPhase(group))}</>;
            })()}
            </div>
            </section>
            {actionForm("Add a milestone", "STAGE_CREATE", [
              field("name", "Milestone name", "text", true),
              field("description", "Description", "textarea"),
              {
                name: "dependsOnId",
                label: "Depends on stage",
                options: stageOptions,
              },
              field("expectedStart", "Expected start", "date"),
              field("expectedEnd", "Expected end", "date"),
            ])}
            {actionForm("Add a task", "TASK_CREATE", [
              { ...stage, required: true },
              field("title", "Task title", "text", true),
              { ...field("description", "Description", "textarea"), advanced: true },
              { ...field("dueDate", "Due date", "date"), advanced: true },
              { ...contact, advanced: true },
              {
                name: "priority",
                label: "Priority",
                options: options(["LOW", "NORMAL", "HIGH"]),
                value: "NORMAL",
                advanced: true,
              },
              { ...moneyField("estimatePaise", "Task estimate"), advanced: true },
              {
                name: "dependsOnId",
                label: "Depends on task",
                options: p.tasks.map((t) => ({ value: t.id, label: t.title })),
                advanced: true,
              },
            ])}
            {p.milestones.length || write ? (
              <section>
                <h2 className="section-heading">Milestones</h2>
                <GroupedList>
                  {p.milestones.map((m) => (
                    <ListRow key={m.id} title={m.name} detail={`${displayLabel(m.status)}${m.plannedDate ? ` · ${presentDate(m.plannedDate)}` : ""}`} />
                  ))}
                </GroupedList>
                {actionForm("Add a milestone", "MILESTONE_CREATE", [
                  stage,
                  field("name", "Milestone name", "text", true),
                  field("plannedDate", "Planned date", "date"),
                  { ...field("description", "Description", "textarea"), advanced: true },
                ])}
                {p.milestones.filter((m) => !["DONE", "SKIPPED", "CANCELLED"].includes(m.status)).map((m) => actionForm(
                  `Update milestone: ${m.name}`,
                  "MILESTONE_UPDATE",
                  [
                    {
                      name: "status",
                      label: "Status",
                      options: options(["PLANNED", "READY", "IN_PROGRESS", "BLOCKED", "DONE", "SKIPPED", "CANCELLED"]),
                      value: m.status,
                      required: true,
                    },
                    field("plannedDate", "Planned date", "date", false, m.plannedDate ?? ""),
                    field("actualDate", "Actual date", "date"),
                  ],
                  { milestoneId: m.id },
                ))}
              </section>
            ) : null}
            {p.dependencies.length || write ? (
              <section>
                <h2 className="section-heading">Dependencies</h2>
                <p className="text-[13px] text-ink-muted">What must finish before something else can proceed.</p>
                <GroupedList>
                  {p.dependencies.map((d) => {
                    const nameOf = (type: string, refId: string): string => {
                      if (type === "STAGE") return p.stages.find((s) => s.id === refId)?.name ?? "a stage";
                      if (type === "WORK_ITEM") return p.tasks.find((t) => t.id === refId)?.title ?? "planned work";
                      if (type === "MILESTONE") return p.milestones.find((m) => m.id === refId)?.name ?? "a milestone";
                      if (type === "DECISION") return p.decisions.find((x) => x.id === refId)?.title ?? "a decision";
                      if (type === "INSPECTION") return p.inspections.find((x) => x.id === refId)?.title ?? "an inspection";
                      return "a record";
                    };
                    return (
                      <ListRow key={d.id} title={`${nameOf(d.predecessorType, d.predecessorId)} → ${nameOf(d.successorType, d.successorId)}`} detail="Must finish first" />
                    );
                  })}
                </GroupedList>
                {actionForm("Link a dependency", "DEPENDENCY_CREATE", [
                  {
                    name: "predecessorType",
                    label: "Must finish first",
                    options: options(["STAGE", "WORK_ITEM", "MILESTONE", "DECISION", "INSPECTION"]),
                    required: true,
                  },
                  {
                    name: "predecessorId",
                    label: "First record",
                    options: [
                      ...p.stages.map((s) => ({ value: s.id, label: `Stage: ${s.name}` })),
                      ...p.tasks.map((t) => ({ value: t.id, label: `Work: ${t.title}` })),
                      ...p.milestones.map((m) => ({ value: m.id, label: `Milestone: ${m.name}` })),
                      ...p.decisions.map((x) => ({ value: x.id, label: `Decision: ${x.title}` })),
                      ...p.inspections.map((x) => ({ value: x.id, label: `Inspection: ${x.title}` })),
                    ],
                    required: true,
                  },
                  {
                    name: "successorType",
                    label: "Then this can proceed",
                    options: options(["STAGE", "WORK_ITEM", "MILESTONE", "INSPECTION"]),
                    required: true,
                  },
                  {
                    name: "successorId",
                    label: "Second record",
                    options: [
                      ...p.stages.map((s) => ({ value: s.id, label: `Stage: ${s.name}` })),
                      ...p.tasks.map((t) => ({ value: t.id, label: `Work: ${t.title}` })),
                      ...p.milestones.map((m) => ({ value: m.id, label: `Milestone: ${m.name}` })),
                      ...p.inspections.map((x) => ({ value: x.id, label: `Inspection: ${x.title}` })),
                    ],
                    required: true,
                  },
                  field("notes", "Notes", "textarea"),
                ])}
                {p.dependencies.map((d) => {
                  const depName = (type: string, refId: string): string => {
                    if (type === "STAGE") return p.stages.find((s) => s.id === refId)?.name ?? "a stage";
                    if (type === "WORK_ITEM") return p.tasks.find((t) => t.id === refId)?.title ?? "planned work";
                    if (type === "MILESTONE") return p.milestones.find((m) => m.id === refId)?.name ?? "a milestone";
                    if (type === "DECISION") return p.decisions.find((x) => x.id === refId)?.title ?? "a decision";
                    if (type === "INSPECTION") return p.inspections.find((x) => x.id === refId)?.title ?? "an inspection";
                    return "a record";
                  };
                  return actionForm(
                    `Remove link: ${depName(d.predecessorType, d.predecessorId)} → ${depName(d.successorType, d.successorId)}`,
                    "DEPENDENCY_DELETE",
                    [field("confirmed", "I understand the second record is no longer blocked by this link", "checkbox", true)],
                    { dependencyId: d.id },
                  );
                })}
              </section>
            ) : null}
            {p.planVersions.length || write ? (
              <section>
                <h2 className="section-heading">Plan versions</h2>
                <GroupedList>
                  {p.planVersions.map((v) => (
                    <ListRow key={v.id} title={`Version ${v.versionNumber}${v.label ? ` · ${v.label}` : ""}`} detail={displayLabel(v.status)} />
                  ))}
                </GroupedList>
                {actionForm("Save a plan version", "PLAN_VERSION_CREATE", [
                  field("label", "Version label", "text", true),
                  field("notes", "What changed", "textarea"),
                ])}
                {p.planVersions.filter((v) => v.status === "DRAFT").map((v) => actionForm(
                  `Activate version ${v.versionNumber}`,
                  "PLAN_VERSION_ACTIVATE",
                  [field("confirmed", "I understand the current active version is superseded", "checkbox", true)],
                  { planVersionId: v.id },
                ))}
              </section>
            ) : null}
          </>
        ) : null}
        {tab === "money" && (p.capabilities.budget || p.capabilities.cost) ? (
          <>
            {p.money ? (
              <Surface>
                <h2 className="text-[22px] font-medium">Where the money stands</h2>
                {(() => {
                  const approved = Number(p.money!.currentApprovedPaise);
                  const recorded = Number(p.money!.recordedSpendPaise);
                  const committed = Number(p.money!.committedPaise);
                  const rest = Math.max(0, approved - recorded - committed);
                  const pct = (n: number) => (approved > 0 ? `${((n / approved) * 100).toFixed(1)}%` : "—");
                  return (
                    <div className="money-model">
                      <div className="mm-row"><span>Base plan</span><b>{inr(Number(p.money!.basePlannedPaise) / 100)}</b></div>
                      <div className="mm-row"><span>Approved changes</span><b>{Number(p.money!.approvedChangeDeltaPaise) >= 0 ? "+" : "−"}{inr(Math.abs(Number(p.money!.approvedChangeDeltaPaise)) / 100).slice(1)}</b></div>
                      <div className="mm-row total"><span>Current approved</span><b>{inr(approved / 100)}</b></div>
                      <div className="money-bar2" role="img" aria-label={`Recorded ${inr(recorded / 100)}, committed ${inr(committed / 100)}, remaining approved headroom ${inr(rest / 100)}`}>
                        <span className="seg-recorded" style={{ width: approved > 0 ? `${(recorded / approved) * 100}%` : "0%" }} />
                        <span className="seg-committed" style={{ width: approved > 0 ? `${(committed / approved) * 100}%` : "0%" }} />
                      </div>
                      <div className="mm-row"><span>Recorded</span><span><b>{inr(recorded / 100)}</b> · {pct(recorded)}</span></div>
                      <div className="mm-row"><span>Committed</span><span><b>{inr(committed / 100)}</b> · {pct(committed)}</span></div>
                      <div className="mm-row"><span>Remaining headroom</span><span><b>{inr(rest / 100)}</b> · {pct(rest)}</span></div>
                    </div>
                  );
                })()}
                <p className="mt-2 text-[14px]">Projected final (approved basis): <strong>{inr(Number(p.money.projectedFinalPaise) / 100)}</strong></p>
                {p.money.explanations.length ? (
                  <div className="mt-2 text-[13px] leading-6">
                    <p className="font-semibold">Why has the amount changed?</p>
                    {p.money.explanations.map((line, i) => <p key={i}>· {line}</p>)}
                  </div>
                ) : null}
                <p className="mt-2 text-[13px] text-ink-muted">
                  Committed is agreed future spend, not spend. Projected final follows the approved budget only; it is not a forecast of cost to finish.
                </p>
              </Surface>
            ) : (
            <div className="metric-group">
              <Metric label="Planned" value={p.estimatedBudgetPaise === undefined ? "Not shared" : inr(Number(p.estimatedBudgetPaise) / 100)} />
              <Metric label="Recorded" value={p.recordedSpendPaise === undefined ? "Not shared" : inr(Number(p.recordedSpendPaise) / 100)} />
            </div>
            )}
            {p.estimatedBudgetPaise !== undefined && p.recordedSpendPaise !== undefined && !p.money ? (() => {
              const planned = Number(p.estimatedBudgetPaise) / 100;
              const recorded = Number(p.recordedSpendPaise) / 100;
              const remaining = planned - recorded;
              return (
                <>
                  <div className="metric-group">
                    <Metric label={remaining < 0 ? "Over planned" : "Remaining planned"} value={inr(Math.abs(remaining))} />
                  </div>
                  <ProgressBar value={planned ? (recorded / planned) * 100 : 0} label="Recorded against planned budget" />
                </>
              );
            })() : null}
            <p className="text-[13px] text-ink-muted">Estimates are plans. Linked invoices use their canonical ledger entries; linking an invoice does not record a new payment.</p>
            <section>
              <h2 className="section-heading">Budget by category</h2>
              {p.owner && p.capabilities.cost ? (
                <>
                  {(p.currentStage || p.budgets[0]) ? (
                    <p className="text-[13px] text-ink-muted">
                      Recording to{p.currentStage ? ` ${p.currentStage.name}` : ""}{p.budgets[0] ? ` · suggested category ${p.budgets[0].category}` : ""}
                    </p>
                  ) : null}
                  {actionForm("Record expense", "COST_RECORD", [
                    moneyField("amountPaise", "Amount"),
                    field("title", "What was it?", "text", true),
                    field("recordedDate", "Date", "date", true, todayISO),
                    {
                      name: "commitmentId",
                      label: "Against commitment (optional)",
                      options: p.commitments.filter((c) => ["ACTIVE", "PARTIALLY_FULFILLED", "DRAFT"].includes(c.status)).map((c) => ({ value: c.id, label: `${c.title} · ${inr(Number(c.amountPaise) / 100)}` })),
                      advanced: true,
                    },
                  ], { source: "USER_RECORDED_EXPENSE", stageId: p.currentStage?.id, budgetItemId: p.budgets[0]?.id })}
                </>
              ) : null}
              <GroupedList>
                {p.budgets.map((b) => {
                  const planned = Number(b.estimatedPaise) / 100;
                  const recorded = Number(b.recordedPaise ?? 0) / 100;
                  const remaining = planned - recorded;
                  const linked = p.costs.filter((c) => c.budgetItemId === b.id);
                  return (
                    <Disclosure key={b.id} title={b.category} detail={remaining < 0 ? `${inr(planned)} planned · ${inr(Math.abs(remaining))} over` : `${inr(planned)} planned · ${inr(recorded)} recorded`}>
                      <div className="space-y-4">
                        <div className="metric-group">
                          <Metric label="Planned amount" value={inr(planned)} />
                          <Metric label="Recorded amount" value={inr(recorded)} />
                        </div>
                        <p className="text-[15px]">{remaining < 0 ? `${inr(Math.abs(remaining))} over` : `${inr(remaining)} remaining`}</p>
                        {linked.length ? <div className="space-y-3">{linked.map((c) => (
                          <section key={c.id} id={`cost-${c.id}`} className="border-t border-line pt-3 text-[13px]">
                            <p>{c.title} · {inr(Number(c.amountPaise) / 100)}</p>
                            <p className="text-ink-muted">{presentName(displayLabel(c.source))} · {presentDate(c.recordedDate)}</p>
                            {c.correction ? <p className="mt-2">{c.correction.replacementCostId ? "Corrected" : "Reversed"}: {c.correction.reason} · {presentDate(String(c.correction.createdAt), "datetime")}</p> : null}
                            {!c.correction && c.source === "USER_RECORDED_EXPENSE" && p.owner && !p.archivedAt ? (
                              <>
                                <EntryForm title="Correct entry" fields={[{ ...moneyField("amountPaise", "Correct recorded amount"), required: true }, field("reason", "Correction reason", "textarea", true), field("confirmed", "I confirm reversal of the original and recording a replacement", "checkbox", true)]} submit={(v) => save("COST_CORRECT", { ...v, costId: c.id })} />
                                <EntryForm title="Reverse entry" fields={[field("reason", "Reversal reason", "textarea", true), field("confirmed", "I confirm reversal; the original remains in history", "checkbox", true)]} submit={(v) => save("COST_REVERSE", { ...v, costId: c.id })} />
                              </>
                            ) : null}
                          </section>
                        ))}</div> : <p className="text-sm text-ink-muted">No linked costs yet.</p>}
                        {actionForm("Revise budget", "BUDGET_SET", [
                          field("category", "Category", "text", true, b.category),
                          moneyField("estimatedPaise", "Category estimate", b.estimatedPaise),
                          stage,
                          field("notes", "Revision notes", "textarea"),
                        ], { budgetItemId: b.id })}
                      </div>
                    </Disclosure>
                  );
                })}
              </GroupedList>
            </section>
            {p.costs.filter((c) => !c.budgetItemId).length ? (
              <Disclosure title="Unassigned expenses" detail={`${p.costs.filter((c) => !c.budgetItemId).length}`}>
                {p.costs.filter((c) => !c.budgetItemId).map((c) => (
                  <section key={c.id} id={`cost-${c.id}`} className="border-b border-line py-3 text-[13px]">
                    <p>{c.title} · {inr(Number(c.amountPaise) / 100)}</p>
                    <p className="text-ink-muted">{presentName(displayLabel(c.source))} · {presentDate(c.recordedDate)}</p>
                    {c.source !== "USER_RECORDED_EXPENSE" && p.owner ? <p className="mt-2 text-[14px]">Payment records remain authoritative in <Link className="underline" href={`/property/${p.propertyId}?tab=bills`}>Bills</Link>.</p> : null}
                  </section>
                ))}
              </Disclosure>
            ) : null}
            {p.owner && p.status === "COMPLETED" ? (
              <p className="text-[14px]">
                Expense corrections change current recorded spend. The dated
                handover snapshot is preserved.
              </p>
            ) : null}
            <Disclosure title="Add budget category" detail="Secondary action">
              {actionForm("Add budget category", "BUDGET_SET", [
                field("category", "Category", "text", true),
                moneyField("estimatedPaise", "Category estimate"),
                stage,
                field("notes", "Notes", "textarea"),
              ])}
            </Disclosure>
            {actionForm(
              "Record an expense",
              "COST_RECORD",
              [
                field("title", "Expense title", "text", true),
                moneyField("amountPaise", "Recorded expense"),
                field("recordedDate", "Recorded date", "date", true),
                stage,
                task,
                budget,
                {
                  name: "documentLinkId",
                  label: "Linked invoice document",
                  options: p.documents.map((d) => ({
                    value: d.id,
                    label: d.title,
                  })),
                },
              ],
              { source: "USER_RECORDED_EXPENSE" },
            )}
            <section>
              <h2 className="section-heading">Commitments</h2>
              <p className="text-[13px] text-ink-muted">Agreed future spend. Draft invoices wait for owner review; they are not spend and imply no payment.</p>
              <GroupedList>
                {p.commitments.map((c) => (
                  <ListRow key={c.id} title={c.title} detail={`${inr(Number(c.amountPaise) / 100)} · ${displayLabel(c.status)}${c.expectedBy ? ` · ${presentDate(c.expectedBy)}` : ""}`} />
                ))}
              </GroupedList>
              {p.commitments.length === 0 ? <p className="text-[14px] text-ink-muted">No commitments recorded. Agreed orders and invoices awaiting review appear here.</p> : null}
              {actionForm("Record a commitment or invoice for review", "COMMITMENT_CREATE", [
                field("title", "Title", "text", true),
                moneyField("amountPaise", "Amount"),
                field("expectedBy", "Expected by", "date"),
                { ...budget, advanced: true },
                { ...field("vendorOrPersonId", "Vendor or person"), advanced: true },
                {
                  name: "sourceType",
                  label: "Source",
                  options: options(["INVOICE", "ORDER", "QUOTE", "AGREEMENT", "OTHER"]),
                  advanced: true,
                },
                {
                  name: "status",
                  label: "Status",
                  options: options(["DRAFT", "ACTIVE"]),
                  value: "ACTIVE",
                  required: true,
                  advanced: true,
                },
                { ...field("notes", "Notes", "textarea"), advanced: true },
              ])}
              {p.commitments.filter((c) => ["DRAFT", "ACTIVE", "PARTIALLY_FULFILLED"].includes(c.status)).map((c) => actionForm(
                `Review commitment: ${c.title}`,
                "COMMITMENT_UPDATE",
                [
                  {
                    name: "status",
                    label: "Status",
                    options: options(["DRAFT", "ACTIVE", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"]),
                    value: c.status,
                    required: true,
                  },
                  field("expectedBy", "Expected by", "date", false, c.expectedBy ?? ""),
                  field("notes", "Notes", "textarea", false, c.notes),
                ],
                { commitmentId: c.id },
              ))}
            </section>
            <section>
              <h2 className="section-heading">Changes</h2>
              <p className="text-[13px] text-ink-muted">Approved changes explain why the approved cost moved. Estimates never become spend on their own.</p>
              <GroupedList>
                {p.changes.map((c) => (
                  <Disclosure key={c.id} title={c.title} detail={displayLabel(c.status)}>
                    {c.reason ? <p className="text-[13px]">Why: {c.reason}</p> : null}
                    {(c.originalScope || c.revisedScope) ? (
                      <div className="change-ba">
                        <div className="ba-cell"><span className="ba-eyebrow">Before</span><p className="ba-value text-[15px]">{c.originalScope || "—"}</p></div>
                        <span className="ba-arrow" aria-hidden="true">→</span>
                        <div className="ba-cell"><span className="ba-eyebrow">After</span><p className="ba-value text-[15px]">{c.revisedScope || "—"}</p></div>
                      </div>
                    ) : null}
                    <div className="change-impact">
                      <div className="ci"><span className="ba-eyebrow">Cost impact</span><b>{Number(c.estimatedCostImpactPaise) >= 0 ? "+" : "−"}{inr(Math.abs(Number(c.estimatedCostImpactPaise)) / 100).slice(1)}</b><span className="ba-eyebrow">estimated</span></div>
                      <div className="ci"><span className="ba-eyebrow">Time impact</span><b>{c.estimatedScheduleImpactDays > 0 ? `+${c.estimatedScheduleImpactDays}` : c.estimatedScheduleImpactDays} days</b><span className="ba-eyebrow">estimated</span></div>
                    </div>
                    {c.actualCostImpactPaise !== null && c.actualCostImpactPaise !== undefined ? (
                      <p className="mt-2 text-[13px]">Actual: {inr(Number(c.actualCostImpactPaise) / 100)}{c.actualScheduleImpactDays !== null && c.actualScheduleImpactDays !== undefined ? ` · ${c.actualScheduleImpactDays} days` : ""}</p>
                    ) : <span className="est-flag">Estimated only · actual cost not recorded</span>}
                  </Disclosure>
                ))}
              </GroupedList>
              {p.changes.length === 0 ? <p className="text-[14px] text-ink-muted">No changes recorded. Approved changes explain why the approved cost moved.</p> : null}
              {actionForm("Propose a change", "CHANGE_PROPOSE", [
                field("title", "Change title", "text", true),
                field("reason", "Why is this change needed", "textarea", true),
                { ...field("originalScope", "Original scope", "textarea"), advanced: true },
                { ...field("revisedScope", "Revised scope", "textarea"), advanced: true },
                { ...moneyField("estimatedCostImpactPaise", "Estimated cost impact"), advanced: true },
                { ...field("estimatedScheduleImpactDays", "Estimated schedule impact (days)", "number"), advanced: true },
                { ...stage, advanced: true },
              ])}
              {p.changes.filter((c) => ["PROPOSED", "IMPACT_RECORDED"].includes(c.status)).map((c) => actionForm(
                `Record impact: ${c.title}`,
                "CHANGE_IMPACT",
                [
                  moneyField("estimatedCostImpactPaise", "Estimated cost impact", c.estimatedCostImpactPaise),
                  field("estimatedScheduleImpactDays", "Estimated schedule impact (days)", "number", false, String(c.estimatedScheduleImpactDays)),
                ],
                { changeId: c.id },
              ))}
              {p.changes.filter((c) => !["REJECTED", "IMPLEMENTED", "CANCELLED"].includes(c.status)).map((c) => actionForm(
                `Decide change: ${c.title}`,
                "CHANGE_DECIDE",
                [
                  {
                    name: "decision",
                    label: "Decision",
                    options: options(["SUBMIT", "APPROVE", "REJECT", "IMPLEMENT", "CANCEL"]),
                    required: true,
                  },
                  moneyField("actualCostImpactPaise", "Actual cost impact (when implementing)"),
                  field("actualScheduleImpactDays", "Actual schedule impact (days)", "number"),
                ],
                { changeId: c.id },
              ))}
            </section>
            <CostLinkForm p={p} save={save} write={write} />
            <Link
              className="block text-[14px] underline"
              href={`/property/${p.propertyId}?tab=bills`}
            >
              Open obligations and payments
            </Link>
          </>
        ) : null}
        {tab === "more" && p.capabilities.materials ? (
          <>
            <span id="materials" />
            <p className="text-[14px] text-ink-muted">Owner-entered quantities and rates. Not a live market feed.</p>
            {p.materials.map((m) => {
              const history = p.prices.filter((r) => r.materialId === m.id);
              return (
                <section key={m.id} className="border-b border-line py-4 min-w-0">
                  <h2 className="text-[18px] font-medium">{m.name}</h2>
                  <p className="text-[13px] text-ink-muted">{m.quantity} {m.unit} · {displayLabel(m.status)}{m.requiredByDate ? ` · ${dueCopy(m.requiredByDate)}` : ""}</p>
                  {history[0] ? (
                    <p className="mt-2 text-[15px]">
                      <FlashOnChange value={history[0].pricePaise}>{inr(Number(history[0].pricePaise) / 100)}</FlashOnChange> / {m.unit}
                      {history[1] ? <span className="text-ink-muted"> · previous {inr(Number(history[1].pricePaise) / 100)}</span> : null}
                    </p>
                  ) : null}
                  {history.map((h) => (
                    <p key={h.id} className="text-[13px] text-ink-muted">
                      {presentDate(h.recordedDate)} · {h.brand} {h.grade} · {h.dealer} ·{" "}
                      {h.location} · {rupees(h.pricePaise)}/{h.unit}
                    </p>
                  ))}
                  {actionForm(
                    "Update requirement",
                    "MATERIAL_UPDATE",
                    [
                      field("quantity", "Quantity", "number", true, m.quantity),
                      field(
                        "requiredByDate",
                        "Required by",
                        "date",
                        false,
                        m.requiredByDate ?? "",
                      ),
                      moneyField(
                        "estimatedUnitRatePaise",
                        "Estimated unit rate",
                        m.estimatedUnitRatePaise,
                      ),
                      moneyField(
                        "actualUnitRatePaise",
                        "Actual unit rate",
                        m.actualUnitRatePaise,
                      ),
                      contact,
                    ],
                    { materialId: m.id },
                  )}
                  {actionForm(
                    "Record a price",
                    "PRICE_RECORD",
                    [
                      field("brand", "Brand"),
                      field("grade", "Grade"),
                      field("dealer", "Dealer"),
                      field("location", "Location", "text", true),
                      field("recordedDate", "Recorded date", "date", true),
                      moneyField("pricePaise", "Price per unit"),
                    ],
                    { materialId: m.id, unit: m.unit },
                  )}
                  {actionForm(
                    "Procurement status",
                    "PROCUREMENT_SET",
                    [
                      {
                        name: "status",
                        label: "Status",
                        options: options([
                          "PLANNED",
                          "QUOTE_REQUIRED",
                          "ORDERED_EXTERNALLY",
                          "RECEIVED",
                          "CANCELLED",
                        ]),
                        required: true,
                        value: m.status,
                      },
                      contact,
                      field(
                        "notes",
                        "External order / receipt notes",
                        "textarea",
                      ),
                    ],
                    { materialId: m.id },
                  )}
                </section>
              );
            })}
            {actionForm("Add material requirement", "MATERIAL_CREATE", [
              stage,
              field("category", "Category", "text", true),
              field("name", "Material name", "text", true),
              field("quantity", "Owner-entered quantity", "number", true),
              field("unit", "Unit (bag, tonne, piece…)", "text", true),
              field("requiredByDate", "Required by", "date"),
              { ...moneyField("estimatedUnitRatePaise", "Estimated unit rate"), advanced: true },
              { ...contact, advanced: true },
            ])}
            {p.materials.length ? (
              <section>
                <h2 className="section-heading">Quotes and orders</h2>
                <p className="text-[13px] text-ink-muted">Manual quote entry only. No supplier marketplace.</p>
                <GroupedList>
                  {p.supplierQuotes.map((q) => (
                    <ListRow key={q.id} title={`${q.supplierName} · ${inr(Number(q.totalPaise) / 100)}`} detail={displayLabel(q.status)} />
                  ))}
                  {p.orders.map((o) => (
                    <ListRow key={o.id} title={`Order · ${o.supplierName} · ${o.orderedQuantity} ${o.unit}`} detail={displayLabel(o.status)} />
                  ))}
                </GroupedList>
                {p.materials.filter((m) => !["RECEIVED", "CANCELLED"].includes(m.status)).map((m) => actionForm(
                  `Add quote · ${m.name}`,
                  "QUOTE_RECORD",
                  [
                    field("supplierName", "Supplier", "text", true),
                    moneyField("unitRatePaise", "Unit rate"),
                    field("deliveryDate", "Delivery date", "date"),
                  ],
                  { materialRequirementId: m.id, quantity: m.quantity, unit: m.unit },
                ))}
                {actionForm("Record a supplier quote", "QUOTE_RECORD", [
                  {
                    name: "materialRequirementId",
                    label: "Material requirement",
                    options: p.materials.map((m) => ({ value: m.id, label: `${m.name} (${m.unit})` })),
                    required: true,
                  },
                  field("supplierName", "Supplier", "text", true),
                  field("quantity", "Quantity", "number", true),
                  field("unit", "Unit", "text", true),
                  moneyField("unitRatePaise", "Unit rate"),
                  field("deliveryDate", "Delivery date", "date"),
                ])}
                {p.supplierQuotes.filter((q) => q.status === "RECEIVED").map((q) => actionForm(
                  `Select quote from ${q.supplierName}`,
                  "QUOTE_SELECT",
                  [field("confirmed", "I confirm this selection; other received quotes are rejected", "checkbox", true)],
                  { quoteId: q.id },
                ))}
                {actionForm("Place an order", "ORDER_PLACE", [
                  {
                    name: "materialRequirementId",
                    label: "Material requirement",
                    options: p.materials.map((m) => ({ value: m.id, label: `${m.name} (${m.unit})` })),
                  },
                  field("supplierName", "Supplier", "text", true),
                  field("orderedQuantity", "Ordered quantity", "number", true),
                  field("unit", "Unit", "text", true),
                  moneyField("totalPaise", "Order total"),
                  field("expectedDelivery", "Expected delivery", "date"),
                ])}
                {p.orders.filter((o) => ["PLACED", "PARTIALLY_DELIVERED"].includes(o.status)).map((o) => actionForm(
                  `Cancel order from ${o.supplierName}`,
                  "ORDER_CANCEL",
                  [field("confirmed", "I confirm cancellation", "checkbox", true)],
                  { orderId: o.id },
                ))}
              </section>
            ) : null}
          </>
        ) : null}
        {tab === "more" && p.capabilities.documents ? (
          <>
            <span id="papers" />
            <p className="text-[14px] leading-5 text-ink-muted">
              Documents stay in your existing Vault. Construction links a
              specific clean version. Legal requirements remain unknown until an
              applicable reviewed checklist is configured.
            </p>
            {p.configuredChecklist.map((r) => (
              <Surface key={r.id}>
                <p className="text-[13px]">{r.title}</p>
                <StatusPill>{displayLabel(r.status)}</StatusPill>
                <p className="text-[13px]">
                  Source: {r.sourceName ?? "Configured source"}
                </p>
              </Surface>
            ))}
            {p.checklistState === "UNKNOWN" ? (
              <p className="text-[14px]">Approval checklist: not configured</p>
            ) : null}
            {p.documents.map((d) => {
              const contextName = (() => {
                if (!d.contextId) return d.contextType === "PROJECT" ? "Whole project" : displayLabel(d.contextType);
                if (d.contextType === "STAGE") return p.stages.find((s) => s.id === d.contextId)?.name ?? "A stage";
                if (d.contextType === "MILESTONE") return p.milestones.find((m) => m.id === d.contextId)?.name ?? "A milestone";
                if (d.contextType === "WORK_ITEM") return p.tasks.find((t) => t.id === d.contextId)?.title ?? "Planned work";
                if (d.contextType === "DECISION") return p.decisions.find((x) => x.id === d.contextId)?.title ?? "A decision";
                if (d.contextType === "INSPECTION") return p.inspections.find((x) => x.id === d.contextId)?.title ?? "An inspection";
                return displayLabel(d.contextType);
              })();
              return (
              <Link
                key={d.id}
                href={d.href}
                className="block border-b border-line py-3 text-[13px]"
              >
                {presentName(d.label || d.title)} · v{d.version}
                <span className="block text-[13px] text-ink-muted">
                  {contextName} · {displayLabel(d.reviewStatus)}
                </span>
              </Link>
              );
            })}
            {write ? (
              <>
                <Link
                  href={`/property/${p.propertyId}?tab=vault`}
                  className="block text-[14px] underline"
                >
                  Upload or review in Vault
                </Link>
                <Button
                  variant="quiet"
                  onClick={async () => {
                    try {
                      const d = await api<{
                        documents: Array<{
                          id: string;
                          name: string;
                          scanStatus: string;
                          versions: Array<{
                            id: string;
                            scanStatus: string;
                            version: number;
                          }>;
                        }>;
                      }>(`/api/documents?propertyId=${p.propertyId}`);
                      const rows = d.documents
                        .filter((d) => d.scanStatus === "clean")
                        .flatMap((doc) =>
                          doc.versions
                            .filter((v) => v.scanStatus === "clean")
                            .map((v) => ({
                              id: doc.id,
                              name: `${doc.name} · v${v.version}`,
                              versionId: v.id,
                            })),
                        );
                      setVault(rows);
                      setVaultLoaded(true);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Choose Vault documents
                </Button>
                {vaultLoaded && !vault.length ? (
                  <p className="text-[14px] text-ink-muted" role="status">
                    No clean document versions are available for this property.
                    Upload or review in Vault; pending or unavailable scans
                    cannot be linked.
                  </p>
                ) : null}
                {vault.length ? (
                  <EntryForm
                    title="Link document version"
                    fields={[
                      {
                        name: "documentVersionId",
                        label: "Clean document version",
                        options: vault.map((d) => ({
                          value: d.versionId,
                          label: d.name,
                        })),
                        required: true,
                      },
                      field("category", "Construction category", "text", true),
                      stage,
                      task,
                      {
                        name: "updateId",
                        label: "Site update attachment",
                        options: p.updates.map((u) => ({
                          value: u.id,
                          label: u.title,
                        })),
                      },
                    ]}
                    submit={(v) =>
                      save("DOCUMENT_LINK", {
                        ...v,
                        documentId: vault.find(
                          (d) => d.versionId === v.documentVersionId,
                        )?.id,
                      })
                    }
                  />
                ) : null}
                {p.documents.map((d) => actionForm(
                  `File paper: ${d.title}`,
                  "DOCUMENT_CONTEXT_SET",
                  [
                    {
                      name: "contextType",
                      label: "Linked to",
                      options: options(["PROJECT", "STAGE", "MILESTONE", "WORK_ITEM", "DECISION", "ISSUE", "INSPECTION", "CHANGE", "COMMITMENT", "EXPENSE", "MATERIAL", "ORDER", "DELIVERY", "HANDOVER"]),
                      value: d.contextType ?? "PROJECT",
                      required: true,
                    },
                    field("contextId", "Linked record ID (optional)"),
                    field("label", "Label", "text", false, d.label ?? ""),
                  ],
                  { linkId: d.id },
                ))}
                {p.documents.map((d) => actionForm(
                  `Unlink paper: ${d.title}`,
                  "DOCUMENT_UNLINK",
                  [field("confirmed", "I understand the Vault record itself is kept", "checkbox", true)],
                  { linkId: d.id },
                ))}
              </>
            ) : null}
          </>
        ) : null}
        {tab === "site" && (p.capabilities.updates || p.capabilities.materials) ? (
          <>
            <p className="text-[13px] text-ink-muted">The story of the build — latest first.</p>
            {p.capabilities.updates && write ? (
              <EntryForm
                key="site-update-quick"
                title="Post update"
                label="Post update"
                successMessage="Site update added."
                fields={[
                  field("title", "What's happening at site?", "text", true),
                  field("description", "What changed?", "textarea", true),
                  { ...field("occurredDate", "Date", "date", true, todayISO), advanced: true },
                  { ...stage, advanced: true },
                  { ...field("issue", "This is an unresolved site issue", "checkbox"), advanced: true },
                  { ...field("weatherNote", "Weather note", "text"), advanced: true },
                  { ...field("workerCount", "Workers on site", "number"), advanced: true },
                  { ...field("photoLabels", "Site photo labels (one per line, optional)", "textarea"), advanced: true },
                ]}
                submit={(v) => {
                  const labels = String(v.photoLabels ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 50);
                  const rest: Record<string, unknown> = { ...v };
                  delete rest.photoLabels;
                  return save("UPDATE_CREATE", {
                    ...rest,
                    ...(labels.length ? { photoRefs: labels } : {}),
                    stageId: (v.stageId as string) || p.currentStage?.id,
                  });
                }}
              />
            ) : null}
            {p.capabilities.updates ? (
            <>
            {p.updates.length ? (
              <AnimatedList stagger={false} className="divide-y divide-line">
              {p.updates.map((u) => (
                <section key={u.id} className="py-4 motion-pressable">
                  <h2 className="font-serif text-lg">{u.title}</h2>
                  <p className="mt-2 text-[13px] whitespace-pre-wrap">
                    {u.description}
                  </p>
                  <p className="mt-2 text-[13px] text-ink-muted">
                    {presentDate(String(u.occurredAt))}{u.issueStatus === "OPEN" ? " · Open site issue" : ""}
                    {Array.isArray(u.photoRefs) && (u.photoRefs as unknown[]).length ? ` · ${(u.photoRefs as unknown[]).length} photos` : ""}
                    {u.workerCount ? ` · ${u.workerCount} workers on site` : ""}
                  </p>
                  {u.weatherNote ? (
                    <p className="mt-1 text-[13px] text-ink-muted">{u.weatherNote}</p>
                  ) : null}
                  {p.documents
                    .filter((d) => d.updateId === u.id)
                    .map((d) => (
                      <Link
                        key={d.id}
                        href={d.href}
                        className="block text-[14px] underline"
                      >
                        {d.title}
                      </Link>
                    ))}
                  {u.issueStatus === "OPEN"
                    ? actionForm(
                        "Resolve site issue",
                        "ISSUE_RESOLVE",
                        [
                          field(
                            "confirmed",
                            "I have reviewed this issue",
                            "checkbox",
                            true,
                          ),
                        ],
                        { updateId: u.id },
                      )
                    : null}
                </section>
              ))}
              </AnimatedList>
            ) : (
              <p className="text-[14px]">No site updates recorded.</p>
            )}
            </>) : null}
            <section>
              <h2 className="section-heading">Issues</h2>
              <p className="text-[13px] text-ink-muted">Problems and exceptions, separate from planned work.</p>
              <GroupedList>
                {p.issues.map((i) => (
                  <Disclosure key={i.id} title={i.title} detail={`${displayLabel(i.status)} · ${displayLabel(i.severity)}`}>
                    {i.description ? <p className="text-[13px] whitespace-pre-wrap">{i.description}</p> : null}
                    <p className="mt-1 text-[13px] text-ink-muted">
                      Reported {presentDate(String(i.reportedAt))}{i.assignedTo ? ` · with ${i.assignedTo}` : ""}
                      {i.costImpactPaise ? ` · possible cost impact ${inr(Number(i.costImpactPaise) / 100)}` : ""}
                      {i.scheduleImpactDays ? ` · possible delay ${i.scheduleImpactDays} days` : ""}
                    </p>
                    {i.resolution ? <p className="mt-1 text-[13px]">Resolution: {i.resolution}</p> : null}
                  </Disclosure>
                ))}
              </GroupedList>
              {p.issues.length === 0 ? <p className="text-[14px] text-ink-muted">No issues recorded. Problems appear here, separate from planned work.</p> : null}
              {actionForm("Report an issue", "ISSUE_CREATE", [
                stage,
                field("title", "What happened?", "text", true),
                field("description", "Short description", "textarea", true),
                field("assignedTo", "Who's handling it?"),
                { ...moneyField("costImpactPaise", "Possible cost impact"), advanced: true },
                { ...field("scheduleImpactDays", "Possible delay (days)", "number"), advanced: true },
              ])}
              {p.issues.filter((i) => !["CLOSED"].includes(i.status)).map((i) => actionForm(
                `Update issue: ${i.title}`,
                "ISSUE_UPDATE",
                [
                  {
                    name: "status",
                    label: "Status",
                    options: options(["OPEN", "INVESTIGATING", "ACTION_REQUIRED", "RESOLVED", "CLOSED"]),
                    value: i.status,
                    required: true,
                  },
                  field("assignedTo", "Responsible person", "text", false, i.assignedTo ?? ""),
                  field("resolution", "Resolution", "textarea", false, i.resolution),
                ],
                { issueId: i.id },
              ))}
            </section>
            {p.capabilities.materials ? (
              <section>
                <h2 className="section-heading">Deliveries</h2>
                <GroupedList>
                  {p.deliveries.map((d) => {
                    const expected = d.expectedQuantity === null ? null : Number(d.expectedQuantity);
                    const received = Number(d.receivedQuantity);
                    const short = expected === null ? 0 : Math.max(0, expected - received);
                    const shortPct = expected ? (short / expected) * 100 : 0;
                    return (
                      <div key={d.id} className="list-row" style={{ display: "block" }}>
                        <p className="text-[15px] font-semibold">{d.receivedQuantity} {d.unit} received{d.supplierName ? ` · ${d.supplierName}` : ""}</p>
                        {expected !== null ? (
                          <>
                            <span className="dv-row" style={{ display: "block" }}>
                              <span className="dv-label"><span>Expected</span><span>{d.expectedQuantity}</span></span>
                              <span className="dv-track dv-expected"><span style={{ width: "100%" }} /></span>
                            </span>
                            <span className="dv-row" style={{ display: "block" }}>
                              <span className="dv-label"><span>Received</span><span>{d.receivedQuantity}</span></span>
                              <span className="dv-track dv-received"><span style={{ width: `${(received / expected) * 100}%` }} /></span>
                            </span>
                            {short > 0 ? <span className="dv-short" style={{ display: "inline-block" }}>Short · {short} {d.unit} · {shortPct.toFixed(1)}%</span> : null}
                          </>
                        ) : null}
                        <p className="mt-1 text-[13px] text-ink-muted">{presentDate(String(d.receivedAt))}{d.receivedBy ? ` · recorded by ${d.receivedBy}` : ""}</p>
                      </div>
                    );
                  })}
                </GroupedList>
                {p.deliveries.length === 0 ? <p className="text-[14px] text-ink-muted">No deliveries recorded yet.</p> : null}
                {p.orders.filter((o) => ["PLACED", "PARTIALLY_DELIVERED"].includes(o.status)).map((o) => actionForm(
                  `Record delivery · expected ${o.orderedQuantity} ${o.unit}`,
                  "DELIVERY_RECORD",
                  [
                    field("receivedQuantity", "How many arrived?", "number", true),
                    field("receivedAt", "Date", "date", true, todayISO),
                    field("condition", "Condition"),
                  ],
                  { orderId: o.id, unit: o.unit, expectedQuantity: o.orderedQuantity },
                ))}
                {actionForm("Record a delivery", "DELIVERY_RECORD", [
                  field("orderId", "Order ID (optional)"),
                  field("expectedQuantity", "Expected quantity", "number"),
                  field("receivedQuantity", "Received quantity", "number", true),
                  field("unit", "Unit", "text", true),
                  field("receivedBy", "Received by"),
                  field("receivedAt", "Received date", "date"),
                  field("condition", "Condition"),
                  field("notes", "Notes", "textarea"),
                ])}
              </section>
            ) : null}
            <section>
              <h2 className="section-heading">Inspections</h2>
              <p className="text-[13px] text-ink-muted">Recorded checks. A record is an observation, never a certification.</p>
              <GroupedList>
                {p.inspections.map((i) => (
                  <ListRow key={i.id} title={i.title} detail={`${displayLabel(i.result)} · ${presentDate(String(i.performedAt))} · recorded by ${i.performedBy}`} />
                ))}
              </GroupedList>
              {actionForm("Record an inspection", "INSPECTION_RECORD", [
                field("title", "What was checked", "text", true),
                field("performedAt", "Date", "date", true, todayISO),
                field("performedBy", "Recorded by", "text", true),
                {
                  name: "status",
                  label: "Status",
                  options: options(["SCHEDULED", "RECORDED", "CANCELLED"]),
                  value: "RECORDED",
                  required: true,
                  advanced: true,
                },
                {
                  name: "result",
                  label: "Result",
                  options: options(["RECORDED", "PASS_RECORDED", "CONCERN_RECORDED", "RECHECK_REQUIRED"]),
                  value: "RECORDED",
                  required: true,
                  advanced: true,
                },
                { ...stage, advanced: true },
                { ...field("notes", "Notes", "textarea"), advanced: true },
              ])}
            </section>
          </>
        ) : null}
        {tab === "more" ? (
          <section id="decisions">
            <h2 className="section-heading">Decisions</h2>
            <p className="text-[13px] text-ink-muted">Choices waiting on the right person. Blocking decisions hold dependent work.</p>
            <GroupedList>
              {p.decisions.map((d) => (
                <Disclosure key={d.id} title={d.title} detail={`${displayLabel(d.status)} · with ${d.assignedTo}${d.dueDate ? ` · ${dueCopy(d.dueDate)}` : ""}`}>
                  {(() => {
                    const nameOf = (type: string, refId: string): string => {
                      if (type === "STAGE") return p.stages.find((s) => s.id === refId)?.name ?? "a stage";
                      if (type === "WORK_ITEM") return p.tasks.find((t) => t.id === refId)?.title ?? "planned work";
                      if (type === "MILESTONE") return p.milestones.find((m) => m.id === refId)?.name ?? "a milestone";
                      if (type === "DECISION") return p.decisions.find((x) => x.id === refId)?.title ?? "a decision";
                      if (type === "INSPECTION") return p.inspections.find((x) => x.id === refId)?.title ?? "an inspection";
                      return "a record";
                    };
                    const links: Array<{ name: string; sub?: string; kind: string }> = [{ name: d.title, kind: "blocker" }];
                    let cur = { type: "DECISION", id: d.id };
                    for (let hop = 0; hop < 3; hop++) {
                      const edge = p.dependencies.find((x) => x.predecessorType === cur.type && x.predecessorId === cur.id);
                      if (!edge) break;
                      let sub: string | undefined;
                      if (edge.successorType === "MILESTONE") {
                        const pd = p.milestones.find((m) => m.id === edge.successorId)?.plannedDate;
                        if (pd) sub = `milestone · ${presentDate(pd)}`;
                      } else if (edge.successorType === "WORK_ITEM") {
                        const st = p.tasks.find((t) => t.id === edge.successorId)?.status;
                        if (st === "BLOCKED") sub = "blocked";
                      }
                      links.push({ name: nameOf(edge.successorType, edge.successorId), sub, kind: edge.successorType === "MILESTONE" ? "mile" : "node" });
                      cur = { type: edge.successorType, id: edge.successorId };
                    }
                    if (links.length < 2) return null;
                    return (
                      <ol className="chain2" aria-label="Why this decision matters">
                        {links.map((l, i) => (
                          <li key={i}>
                            <span className="node" aria-hidden="true"><span className={`dot${l.kind === "blocker" ? " is-blocker" : ""}${l.kind === "mile" ? " is-mile" : ""}`} /><span className="wire" /></span>
                            <span className="txt"><b>{l.name}</b>{i === 0 && d.status === "OPEN" ? <span className="blocked-pill">Blocking</span> : null}{l.sub ? <span>{l.sub}</span> : null}</span>
                          </li>
                        ))}
                      </ol>
                    );
                  })()}
                  {d.status === "OPEN" && write && d.options[0] ? (
                    <DecisionQuickAction decisionId={d.id} action="DECISION_RECORD" payload={{ selectedOptionId: d.options[0].id, decisionComment: "" }} label={`Approve: ${d.options[0].label}`} save={save} />
                  ) : null}
                  {d.status === "OPEN" && write ? (
                    <DecisionQuickAction decisionId={d.id} action="DECISION_DEFER" payload={{ decisionComment: "" }} label="Decide later" secondary save={save} />
                  ) : null}
                  {d.options.length ? (
                    <div className="mt-2 space-y-2">
                      {d.options.map((o) => (
                        <p key={o.id} className="text-[13px]">
                          {d.selectedOptionId === o.id ? "✓ " : ""}{o.label}
                          {o.description ? ` — ${o.description}` : ""}
                          {(Number(o.estimatedCostImpactPaise) !== 0 || o.estimatedScheduleImpactDays !== 0) ? (
                            <span className="block text-ink-muted">
                              {Number(o.estimatedCostImpactPaise) !== 0 ? `${Number(o.estimatedCostImpactPaise) >= 0 ? "+" : "−"}${inr(Math.abs(Number(o.estimatedCostImpactPaise)) / 100).slice(1)} estimated` : "No cost impact"}
                              {o.estimatedScheduleImpactDays !== 0 ? ` · ${o.estimatedScheduleImpactDays} days` : ""}
                            </span>
                          ) : null}
                        </p>
                      ))}
                    </div>
                  ) : <p className="mt-1 text-[13px] text-ink-muted">No options recorded yet.</p>}
                  {d.decisionComment ? <p className="mt-1 text-[13px]">Decision note: {d.decisionComment}</p> : null}
                  {d.context ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[13px] font-semibold">Why this matters →</summary>
                      <p className="mt-1 text-[13px]">{d.context}</p>
                    </details>
                  ) : null}
                </Disclosure>
              ))}
            </GroupedList>
            {p.decisions.length === 0 ? <p className="text-[14px] text-ink-muted">No decisions requested. Choices waiting on someone appear here.</p> : null}
            {actionForm("Request a decision", "DECISION_CREATE", [
              field("title", "What is being decided", "text", true),
              field("assignedTo", "Decided by", "text", true),
              field("dueDate", "Due date", "date"),
              { ...field("context", "Why now", "textarea"), advanced: true },
              { ...stage, advanced: true },
            ])}
            {p.decisions.filter((d) => d.status === "OPEN").map((d) => (
              <div key={d.id}>
                {actionForm(
                  `Record decision: ${d.title}`,
                  "DECISION_RECORD",
                  [
                    {
                      name: "selectedOptionId",
                      label: "Chosen option",
                      options: d.options.map((o) => ({ value: o.id, label: o.label })),
                    },
                    field("decisionComment", "Decision note", "textarea"),
                  ],
                  { decisionId: d.id },
                )}
                {actionForm(
                  `Defer decision: ${d.title}`,
                  "DECISION_DEFER",
                  [field("decisionComment", "Why defer", "textarea")],
                  { decisionId: d.id },
                )}
              </div>
            ))}
          </section>
        ) : null}
        {tab === "more" && p.capabilities.contacts ? (
          <>
            <span id="people" />
            {p.contacts.map((c) => (
              <section key={c.id} className="border-b border-line py-4">
                <h2 className="font-serif text-lg">{c.name}</h2>
                <p className="text-[14px]">
                  {displayLabel(c.role)} · {c.company}
                </p>
                <p className="text-[14px]">
                  {c.phone} {c.email}
                </p>
                <p className="text-[13px] text-ink-muted">Added by owner</p>
                {actionForm(
                  "Edit contact",
                  "CONTACT_UPDATE",
                  [
                    field("name", "Name", "text", true, c.name),
                    field("company", "Company", "text", false, c.company),
                    {
                      name: "role",
                      label: "Role",
                      options: options([
                        "OWNER",
                        "ARCHITECT",
                        "STRUCTURAL_ENGINEER",
                        "CONTRACTOR",
                        "PROJECT_MANAGER",
                        "ELECTRICIAN",
                        "PLUMBER",
                        "INTERIOR_DESIGNER",
                        "SUPPLIER",
                        "VIEWER",
                        "CUSTOM",
                        "OTHER",
                      ]),
                      value: c.role,
                      required: true,
                    },
                    field("phone", "Phone", "tel", false, c.phone),
                    field("email", "Email", "email", false, c.email),
                    field("notes", "Notes", "textarea", false, c.notes),
                  ],
                  { contactId: c.id },
                )}
              </section>
            ))}
            {actionForm("Add a professional or supplier", "CONTACT_CREATE", [
              field("name", "Name", "text", true),
              {
                name: "role",
                label: "Role",
                options: options([
                  "OWNER",
                  "ARCHITECT",
                  "STRUCTURAL_ENGINEER",
                  "CONTRACTOR",
                  "PROJECT_MANAGER",
                  "ELECTRICIAN",
                  "PLUMBER",
                  "INTERIOR_DESIGNER",
                  "SUPPLIER",
                  "VIEWER",
                  "CUSTOM",
                  "OTHER",
                ]),
                required: true,
              },
              { ...field("company", "Company"), advanced: true },
              { ...field("phone", "Phone", "tel"), advanced: true },
              { ...field("email", "Email", "email"), advanced: true },
              { ...field("notes", "Notes", "textarea"), advanced: true },
            ])}
            <p className="text-[13px] text-ink-muted">
              Adding a contact does not grant app access. Use Property sharing
              to invite them with selected Construction capabilities.
            </p>
            {p.owner ? (
              <Link
                className="block text-[14px] underline"
                href={`/property/${p.propertyId}?tab=share`}
              >
                Manage shared access
              </Link>
            ) : null}
          </>
        ) : null}
        {tab === "more" ? (
          <>
            <span id="history" />
            <h2 className="section-heading">Full history</h2>
            {(() => {
              const groups = new Map<string, typeof p.events>();
              for (const e of p.events) {
                const day = String(e.createdAt).slice(0, 10);
                if (!groups.has(day)) groups.set(day, []);
                groups.get(day)!.push(e);
              }
              const dayLabel = (day: string) => {
                const diff = Math.round((Date.parse(day) - Date.parse(todayISO)) / 86400000);
                if (diff === 0) return "Today";
                if (diff === -1) return "Yesterday";
                return presentDate(day);
              };
              return [...groups.entries()].map(([day, rows]) => (
                <div key={day}>
                  <p className="hist-day">{dayLabel(day)}</p>
                  {rows.map((e) => (
                    <div key={e.id} className="border-b border-line py-3">
                      <p className="text-[13px]">{displayLabel(e.title)}</p>
                      <p className="text-[13px] text-ink-muted">{String(e.createdAt).slice(11, 16)} UTC</p>
                    </div>
                  ))}
                </div>
              ));
            })()}
            {actionForm("Add a construction reminder", "REMINDER_SET", [
              field("title", "Reminder title", "text", true),
              {
                name: "kind",
                label: "Follow-up type",
                options: options([
                  "MILESTONE",
                  "TASK",
                  "MATERIAL",
                  "WARRANTY",
                  "APPROVAL_FOLLOWUP",
                  "DOCUMENT_FOLLOWUP",
                ]),
                required: true,
              },
              field("dueDate", "Due date", "date", true),
            ])}
            <Link href="/reminders" className="block text-[14px] underline">
              Open reminders
            </Link>
          </>
        ) : null}
        {tab === "more" && p.owner ? (
          <>
            <span id="handover" />
            <Surface>
              <h2 className="font-serif text-lg">Owner handover</h2>
              <p className="mt-2 text-[14px] leading-5">
                Complete or explicitly skip all stages, resolve required tasks
                and site issues, and address the configured checklist before
                marking this project complete. Completion records your
                confirmation; it does not certify legal occupancy or structural
                safety.
              </p>
              <p className="mt-3 text-[14px]">
                {
                  p.stages.filter(
                    (s) => !["COMPLETED", "SKIPPED"].includes(s.status),
                  ).length
                }{" "}
                stages open ·{" "}
                {
                  p.tasks.filter(
                    (t) =>
                      t.required && !["DONE", "CANCELLED"].includes(t.status),
                  ).length
                }{" "}
                required tasks open ·{" "}
                {p.updates.filter((u) => u.issueStatus === "OPEN").length} site
                issues open
              </p>
            </Surface>
            {p.completionSummary ? (
              <Surface>
                <h2 className="font-serif text-lg">
                  Project marked complete by owner
                </h2>
                <p className="mt-2 text-[14px]">
                  {presentDate(p.startDate)} → {presentDate(String(p.completedAt))} ·{" "}
                  {p.daysElapsed} days
                </p>
                <p className="mt-2 text-[14px]">
                  Handover snapshot — initial planned budget{" "}
                  {rupees(String((p.completionSummary as Record<string, unknown>).initialBudgetPaise ?? "0"))} · Latest planned budget{" "}
                  {rupees(String((p.completionSummary as Record<string, unknown>).latestEstimatedBudgetPaise ?? "0"))} · Recorded spend at handover{" "}
                  {rupees(String((p.completionSummary as Record<string, unknown>).recordedSpendPaise ?? "0"))}
                </p>
                <p className="mt-2 text-[14px]">
                  Current recorded spend {rupees(p.recordedSpendPaise)}. Later
                  expense corrections are audited in Budget and Timeline; the
                  handover snapshot is unchanged.
                </p>
                <p className="mt-3 whitespace-pre-wrap text-[13px]">
                  {String(
                    (p.completionSummary as Record<string, unknown>)
                      .ownerSummary ?? "",
                  )}
                </p>
                <p className="mt-3 text-[13px]">
                  Maintenance / warranty handoff:{" "}
                  {String(
                    (p.completionSummary as Record<string, unknown>).handoff ??
                      "",
                  )}
                </p>
              </Surface>
            ) : (
              actionForm("Confirm completion", "COMPLETE", [
                field("completionDate", "Completion date", "date", true),
                field(
                  "summary",
                  "Historical project summary",
                  "textarea",
                  true,
                ),
                field(
                  "handoff",
                  "Maintenance / warranty handoff",
                  "textarea",
                  true,
                ),
                field(
                  "confirmed",
                  "I confirm the close-out records and mark this project complete as owner",
                  "checkbox",
                  true,
                ),
              ])
            )}
            <section>
              <h2 className="section-heading">Handover record</h2>
              <p className="text-[13px] text-ink-muted">
                {p.handover ? `Status: ${displayLabel(p.handover.status)}${p.handover.handoverDate ? ` · ${p.handover.handoverDate}` : ""}` : "Handover has not started. Completion preserves history as permanent property memory."}
              </p>
              {!p.handover || p.handover.status === "NOT_STARTED" ? actionForm("Start handover", "HANDOVER_START", [
                field("handoverDate", "Handover date", "date"),
                field("notes", "Notes", "textarea"),
              ]) : null}
              {p.handover && p.handover.status === "IN_PROGRESS" ? actionForm("Collect handover evidence", "HANDOVER_UPDATE", [
                field("notes", "Notes", "textarea"),
              ]) : null}
              {p.handover && p.handover.status === "IN_PROGRESS" ? actionForm("Complete handover", "HANDOVER_COMPLETE", [
                field("handoverDate", "Handover date", "date", true),
                field("confirmed", "I confirm snag items and open issues are dispositioned", "checkbox", true),
              ]) : null}
            </section>
            <Disclosure title="Project settings">
              {actionForm("Update project", "PROJECT_UPDATE", [
                field("name", "Project name", "text", true, p.name),
                field(
                  "targetCompletionDate",
                  "Target completion",
                  "date",
                  false,
                  p.targetCompletionDate ?? "",
                ),
                field("notes", "Project notes", "textarea"),
              ])}
              {actionForm("Pause, resume or change status", "PROJECT_STATUS", [
                {
                  name: "status",
                  label: "Project status",
                  required: true,
                  options: options([
                    "PLANNING",
                    "APPROVALS",
                    "ACTIVE",
                    "ON_HOLD",
                    "CANCELLED",
                  ]),
                },
              ])}
              {p.owner && !p.archivedAt ? (
                <EntryForm
                  title="Archive project"
                  fields={[
                    field(
                      "confirm",
                      "I understand the project moves to archived history",
                      "checkbox",
                      true,
                    ),
                  ]}
                  label="Archive"
                  submit={(v) => save("ARCHIVE", v)}
                />
              ) : null}
            </Disclosure>
          </>
        ) : null}
      </div>
    </>
  );
}

function CostLinkForm({
  p,
  save,
  write,
}: {
  p: ConstructionView;
  save: (action: string, v: Record<string, unknown>) => Promise<void>;
  write: boolean;
}) {
  const [invoices, setInvoices] = useState<Choice[]>([]),
    [payments, setPayments] = useState<Choice[]>([]),
    [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  if (!write) return null;
  return (
    <section>
      <Button
        variant="quiet"
        onClick={async () => {
          try {
            const rows = await api<{ invoices: Choice[]; payments: Choice[] }>(
              `/api/construction/${p.id}/cost-sources`,
            );
            setInvoices(rows.invoices);
            setPayments(rows.payments);
            setLoaded(true);
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Choose existing invoice or payment
      </Button>
      {error ? <p role="alert">{error}</p> : null}
      {loaded && !invoices.length && !payments.length ? (
        <p className="mt-2 text-[14px] text-ink-muted" role="status">
          No eligible INR invoices or payments are recorded for this property.
          Add a payable record in Bills, or use Record an expense on this page.
        </p>
      ) : null}
      {invoices.length ? (
        <EntryForm
          title="Link an invoice obligation"
          fields={[
            {
              name: "obligationId",
              label: "Invoice",
              options: invoices,
              required: true,
            },
            field("title", "Cost label", "text", true),
            field("recordedDate", "Recorded date", "date", true),
          ]}
          submit={(v) =>
            save("COST_RECORD", { ...v, source: "LINKED_INVOICE" })
          }
        />
      ) : null}
      {payments.length ? (
        <EntryForm
          title="Link a recorded payment"
          fields={[
            {
              name: "ledgerEntryId",
              label: "Canonical payment",
              options: payments,
              required: true,
            },
            field("title", "Cost label", "text", true),
            field("recordedDate", "Recorded date", "date", true),
          ]}
          submit={(v) =>
            save("COST_RECORD", { ...v, source: "LINKED_PAYMENT" })
          }
        />
      ) : null}
    </section>
  );
}

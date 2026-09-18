"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, Plus, Compass, MoreHorizontal, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cx } from "@/lib/utils";
import { useStore } from "./StoreProvider";
import { t } from "@/lib/i18n";
import { MotionSheet } from "./motion/MotionSheet";
import { CollapsingHeader } from "./motion/CollapsingHeader";
import { StatusTransition } from "./motion/StatusTransition";
import { useScrollState } from "./motion/useScrollState";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a><main id="main-content" className="app-workspace">{children}</main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const path = usePathname();
  const { compact, direction } = useScrollState(48);
  let lang: "en" | "hi" = "en";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { s } = useStore();
    lang = s.lang;
  } catch {}
  const tabs = [
    { href: "/", label: t("home", lang), active: path === "/", icon: <Home className="h-[22px] w-[22px]" /> },
    { href: "/properties", label: t("properties", lang), active: path.startsWith("/propert"), icon: <Building2 className="h-[22px] w-[22px]" /> },
  ];
  const tabsAfter = [
    { href: "/search", label: t("explore", lang), active: path.startsWith("/search") || path.startsWith("/buy-sell"), icon: <Compass className="h-[22px] w-[22px]" /> },
    { href: "/more", label: t("more", lang), active: path.startsWith("/more") || path.startsWith("/guideline") || path.startsWith("/drafts") || path.startsWith("/guides") || path.startsWith("/construction") || path.startsWith("/bills") || path.startsWith("/updates") || path.startsWith("/vault") || path.startsWith("/reminders") || path.startsWith("/pricing"), icon: <MoreHorizontal className="h-[22px] w-[22px]" /> },
  ];
  const item = (href: string, label: string, active: boolean, icon: React.ReactNode) => (
    <Link href={href} aria-current={active ? "page" : undefined} className={cx("nav-item", active && "is-active")}>
      <span aria-hidden="true" className="nav-item__pill" />
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label nav-label">{label}</span>
    </Link>
  );
  return (
    <nav aria-label="Main navigation" className={cx("bottom-navigation", compact && direction === "down" && "is-compact")}>
      <div className="nav-items">
        {tabs.map((tab) => <span key={tab.href}>{item(tab.href, tab.label, tab.active, tab.icon)}</span>)}
        <div className="nav-fab">
          <Link href="/property/new" aria-label="Add property">
            <Plus className="h-7 w-7" />
          </Link>
        </div>
        {tabsAfter.map((tab) => <span key={tab.href}>{item(tab.href, tab.label, tab.active, tab.icon)}</span>)}
      </div>
    </nav>
  );
}

export function PageHead({ title, sub, right, backHref, backLabel }: { title: string; sub?: string; right?: React.ReactNode; backHref?: string; backLabel?: string }) {
  // Large title on open → compact sticky bar on scroll. No sudden swaps.
  return <CollapsingHeader title={title} sub={sub} right={right} backHref={backHref} backLabel={backLabel} />;
}

export function Surface({ children, className = "", tone = "plain" }: { children: React.ReactNode; className?: string; tone?: "plain" | "soft" | "success" | "warning" | "danger" }) {
  const tones = { plain: "bg-white", soft: "bg-[#fbfaf7]", success: "bg-[#f3fbf4]", warning: "bg-[#fffaf3]", danger: "bg-[#fff5f5]" };
  return <section className={cx("surface p-5", tones[tone], className)}>{children}</section>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" | "danger"; busy?: boolean };

export function Button({ children, className = "", variant = "primary", busy = false, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-forest text-white button-primary",
    secondary: "bg-gray-100 text-forest button-secondary",
    quiet: "border border-line bg-white text-foreground button-secondary",
    danger: "border border-red-200 bg-white text-red-700 button-secondary",
  };
  return <button {...props} disabled={disabled || busy} className={cx("motion-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}{busy ? "Working…" : children}</button>;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string };

export function Input({ label, hint, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? `input-${String(label ?? "field").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <label className="block text-[14px] font-medium" htmlFor={inputId}>
    {label ? <span>{label}{props.required ? " *" : ""}</span> : null}
    <input {...props} id={inputId} className={cx("mt-1 h-11 w-full rounded-xl border border-line bg-white px-3 text-[14px] font-normal outline-none transition placeholder:text-ink-soft focus:border-forest focus:ring-2 focus:ring-forest/10", error ? "border-red-300" : "", className)} />
    {error ? <span className="mt-1 block font-normal text-red-700" role="alert">{error}</span> : hint ? <span className="mt-1 block font-normal text-ink-muted">{hint}</span> : null}
  </label>;
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const colors = { neutral: "bg-gray-100 text-gray-700", success: "bg-green-100 text-green-800", warning: "bg-yellow-100 text-yellow-800", danger: "bg-red-100 text-red-800", info: "bg-blue-100 text-blue-800" };
  const key = typeof children === "string" ? children : tone;
  return <StatusTransition statusKey={String(key)}><span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium", colors[tone])}>{children}</span></StatusTransition>;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <Surface className="flex items-center gap-2 text-[13px] text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{label}</Surface>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={cx("motion-skeleton", className)} />;
}

export function EmptyState({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  return <Surface tone="soft" className="text-center"><p className="text-[18px] font-medium">{title}</p>{detail ? <p className="mt-1 text-[13px] leading-5 text-ink-muted">{detail}</p> : null}{action ? <div className="mt-3">{action}</div> : null}</Surface>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <Surface tone="danger" className="flex items-start gap-2 text-[12px] text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><div className="flex-1"><p className="font-semibold">Something needs attention</p><p className="mt-1">{message}</p>{onRetry ? <button onClick={onRetry} className="mt-2 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">Try again</button> : null}</div></Surface>;
}

export function SavedState({ children = "Saved" }: { children?: React.ReactNode }) {
  return <StatusPill tone="success"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />{children}</StatusPill>;
}

export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  // Delegates to the motion-system sheet: spring entry/exit, grabber, focus
  // trap + opener restore, Esc. Always mounted (like a native dialog) so the
  // closing animation and focus restoration run for every dismissal path.
  // API unchanged so all existing callers upgrade at once.
  return <MotionSheet open={open} title={title} onClose={onClose}>{children}</MotionSheet>;
}

export function HealthRing({ score }: { score?: number }) {
  const c = score === undefined ? "#9ca3af" : score >= 80 ? "#2f9e63" : score >= 60 ? "#d99a2b" : "#d46a6a";
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4" style={{ borderColor: c }}>
      <span className="text-[18px] font-bold" style={{ color: c }}>{score ?? "—"}</span>
    </div>
  );
}

export function LangToggle() {
  const { s, update } = useStore();
  return (
    <button
      onClick={() => update((st) => ({ ...st, lang: st.lang === "en" ? "hi" : "en" }))}
      className="rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold"
      aria-label="Toggle language"
    >
      {s.lang === "en" ? "हिंदी" : "EN"}
    </button>
  );
}

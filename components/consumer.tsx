"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Sheet } from "./ui";
import { useState } from "react";
import { displayLabel, presentName } from "@/lib/ui-content";

export { displayLabel, presentName, shortDate, presentDate, documentStatusLabel, formatMoneyCompact as amountText, formatMoneyExact, formatPaiseCompact, dayGreeting, dueCopy, presentStoredText, groupByActivity, attentionTitle } from "@/lib/ui-content";

export function SectionHeader({ title, detail, href }: { title: string; detail?: string; href?: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {href ? <Link href={href} className="motion-pressable">{detail || "See all"}</Link> : detail ? <span>{detail}</span> : null}
    </div>
  );
}

export function GroupedList({ children }: { children: React.ReactNode }) {
  return <div className="grouped-list">{children}</div>;
}

export function ListRow({ title, detail, value, href, onClick, className = "", style }: {
  title: string; detail?: string; value?: React.ReactNode; href?: string; onClick?: () => void; className?: string; style?: React.CSSProperties;
}) {
  const content = (
    <>
      <span className="row-copy">
        <span className="row-title" title={presentName(title)}>{presentName(title)}</span>
        {detail ? <span className="row-detail">{presentName(detail)}</span> : null}
      </span>
      {value ? <span className="row-value">{value}</span> : null}
      <ChevronRight size={18} aria-hidden="true" />
    </>
  );
  return href
    ? <Link className={`list-row route-continuity ${className}`} style={style} href={href}>{content}</Link>
    : <button type="button" className={`list-row motion-pressable ${className}`} style={style} onClick={onClick}>{content}</button>;
}

export function Disclosure({ title, detail, children, primary = false, initialOpen = false, className = "", style }: {
  title: string; detail?: string; children: React.ReactNode; primary?: boolean; initialOpen?: boolean; className?: string; style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <span className={className} style={style}>
      {primary
        ? <button type="button" aria-haspopup="dialog" aria-expanded={open} className="primary-disclosure motion-pressable" onClick={() => setOpen(true)}>{presentName(title)} <span aria-hidden="true">→</span></button>
        : <ListRow title={title} detail={detail} onClick={() => setOpen(true)} />}
      <Sheet open={open} title={presentName(title)} onClose={() => setOpen(false)}>{children}</Sheet>
    </span>
  );
}

export function Metric({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) {
  return <div className="metric"><p>{label}</p><strong>{value}</strong>{detail ? <span>{detail}</span> : null}</div>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const width = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="progress-bar" role="img" aria-label={label || `${width}%`}>
      <span className="progress-reveal" style={{ width: `${width}%` }} />
    </div>
  );
}

export function InfoDisclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="info-disclosure motion-expand"><summary>{title} <span aria-hidden="true">ⓘ</span></summary><div className="motion-expand__body"><div>{children}</div></div></details>;
}

export function DevAccountHint() {
  if (process.env.NODE_ENV !== "development") return null;
  return <p className="dev-account-hint">Demo account</p>;
}

export function humanText(value: string) {
  return value
    .replaceAll("NON_FINANCIAL", "reminder only")
    .replaceAll("PAYABLE", "payable")
    .replaceAll("IN_PROGRESS", "in progress")
    .replaceAll("USER_REPORTED", "added by you")
    .replaceAll("OWNER_REPORTED", "added by you")
    .replaceAll("status_changed", "status updated")
    .replaceAll("status changed", "status updated");
}

export function activityTitle(title: string, detail?: string | null) {
  const events: Record<string, string> = {
    "User manually classified document": "Document reviewed",
    "Maintenance document_linked": "Maintenance document linked",
    "Maintenance created": "Maintenance reported",
    "Maintenance corrected": "Maintenance details updated",
    "Maintenance status_changed": `Maintenance ${displayLabel(detail || "updated").toLowerCase()}`,
  };
  if (events[title]) return presentName(events[title]);
  if (title === "Obligation recorded" && detail) return presentName(`${detail.split(" was added manually")[0].split(" · ")[0]} added`);
  if (title === "Maintenance status_changed") return presentName(`Maintenance ${displayLabel(detail || "updated").toLowerCase()}`);
  if (title.startsWith("Maintenance ") && detail) return presentName(`${detail.split(" · ")[0]} ${title.slice(12).toLowerCase()}`);
  return presentName(humanText(title).replace(/^(ARCHITECT|LAWYER|BROKER|FAMILY)/, (value) => displayLabel(value)));
}

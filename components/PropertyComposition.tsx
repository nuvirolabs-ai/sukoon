"use client";
import { useEffect, useState } from "react";
import { GroupedList, ListRow, Metric, SectionHeader, displayLabel, dueCopy } from "./consumer";
import { formatPaiseCompact } from "@/lib/ui-content";

export type PropertySummary = {
  id: string;
  readiness: { assessment: string; score: number | null };
  records: { documents: number; bills: number; maintenance: number; openMaintenance: number; timeline: number; reminders: number };
  savedReminders: Array<{ id: string; title: string; dueDate: string }>;
  projects: Array<{ id: string; name: string; status: string }>;
  people: Array<{ id: string; role: string; inviteeEmail: string | null }>;
  upcoming: Array<{ id: string; title: string; dueDate: string; amountPaise: string | null }>;
};

export function usePropertyComposition() {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/home", { cache: "no-store", signal: controller.signal }).then(async (r) => {
      const b = await r.json();
      if (!r.ok) throw Error("Property summaries unavailable");
      setProperties(b.data.mode === "owner" ? b.data.properties.filter((p: PropertySummary) => p.records) : []);
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);
  return { properties, error };
}

export function PropertyComposition({ summary }: { summary: PropertySummary }) {
  const href = `/property/${summary.id}`;
  return (
    <>
      {summary.projects.length > 0 ? (
        <>
          <SectionHeader title="Build" />
          <GroupedList>{summary.projects.map((p) => <ListRow key={p.id} title={p.name} detail={displayLabel(p.status)} href={`/construction/${p.id}`} />)}</GroupedList>
        </>
      ) : null}
      <SectionHeader title="Upcoming" href={`${href}?tab=bills`} />
      <GroupedList>
        {summary.upcoming.map((item) => (
          <ListRow key={item.id} title={item.title} detail={dueCopy(item.dueDate)} value={item.amountPaise === null ? "Reminder" : formatPaiseCompact(item.amountPaise)} href={`${href}?tab=bills&occurrence=${item.id}`} />
        ))}
        {!summary.upcoming.length ? <p className="p-5 text-ink-muted">Nothing upcoming.</p> : null}
      </GroupedList>
      <SectionHeader title="Property record" />
      <div className="surface metric-group">
        <Metric label="Documents" value={summary.records.documents} />
        <Metric label="Bills" value={summary.records.bills} />
        <Metric label="Maintenance" value={summary.records.maintenance} detail={summary.records.openMaintenance ? `${summary.records.openMaintenance} active` : undefined} />
        <Metric label="Timeline" value={summary.records.timeline} />
      </div>
      <SectionHeader title="People" href={`${href}?tab=share`} detail="Manage" />
      <GroupedList>
        {summary.people.map((person) => <ListRow key={person.id} title={displayLabel(person.role)} detail={person.inviteeEmail || "Accepted"} href={`${href}?tab=share`} />)}
        {!summary.people.length ? <p className="p-5 text-ink-muted">Only you.</p> : null}
      </GroupedList>
    </>
  );
}

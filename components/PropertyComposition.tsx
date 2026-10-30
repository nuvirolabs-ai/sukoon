"use client";
import { useEffect, useState } from "react";
import { GroupedList, ListRow, SectionHeader, displayLabel } from "./consumer";

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
          <SectionHeader title="Build on this property" />
          <GroupedList>{summary.projects.map((p) => <ListRow key={p.id} title={p.name} detail={displayLabel(p.status)} href={`/construction/${p.id}`} />)}</GroupedList>
        </>
      ) : null}
      {summary.people.length ? (
        <>
          <SectionHeader title="Who can see this" href={`${href}?tab=share`} detail={`${summary.people.length} ${summary.people.length === 1 ? "person" : "people"}`} />
          <GroupedList>
            {summary.people.map((person) => <ListRow key={person.id} title={displayLabel(person.role)} detail={person.inviteeEmail || "Accepted"} href={`${href}?tab=share`} />)}
          </GroupedList>
        </>
      ) : null}
    </>
  );
}

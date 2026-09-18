"use client";
import { useEffect, useState } from "react";
import { Disclosure, GroupedList, ListRow, Metric, displayLabel, dueCopy, formatMoneyExact } from "@/components/consumer";
import { useStore } from "@/components/StoreProvider";
import { PageHead } from "@/components/ui";
import { inr, todayISO } from "@/lib/utils";
import { AnimatedList } from "@/components/motion/AnimatedList";

type Obligation = { id: string; propertyId: string; label: string; type: string; amount: number | null; dueDate: string; direction: string };

export default function BillsPage() {
  const { s } = useStore();
  const [items, setItems] = useState<Array<Obligation & { propertyName: string }>>([]);
  const list = [...s.bills].sort((a, b) => a.dueDate < b.dueDate ? -1 : 1);
  const due = list.filter((b) => b.status !== "paid").reduce((a, b) => a + b.amount, 0);
  const spent = s.bills.filter((b) => b.type !== "Rent" && b.status === "paid").reduce((a, b) => a + b.amount, 0)
    + s.maintenance.reduce((a, m) => a + (m.finalCost ?? m.quote ?? 0), 0);
  useEffect(() => {
    let cancelled = false;
    Promise.all(s.properties.map(async (property) => {
      const response = await fetch(`/api/obligations?propertyId=${encodeURIComponent(property.id)}&view=all`, { cache: "no-store" });
      const body = await response.json() as { data?: { obligations: Obligation[] } };
      return (body.data?.obligations ?? []).map((row) => ({ ...row, propertyName: property.name }));
    })).then((groups) => { if (!cancelled) setItems(groups.flat()); }).catch(() => {});
    return () => { cancelled = true; };
  }, [s.properties]);
  const caExport = () => {
    const rows = ["title,type,amount,status,due,paid,property"];
    for (const b of s.bills) {
      const p = s.properties.find((x) => x.id === b.propertyId)?.name ?? "";
      rows.push(`"${b.title}","${b.type}",${b.amount},${b.status},${b.dueDate},${b.paidDate ?? ""},"${p}"`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `ca-pack-${todayISO()}.csv`; a.click();
  };
  const upcoming = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  return (
    <div>
      <PageHead title="Bills & payments" sub="Recorded by you" />
      <div className="space-y-4 pb-6">
        <div className="surface metric-group">
          <Metric label="Upcoming" value={inr(upcoming || due)} />
          <Metric label="Paid" value={inr(spent)} />
        </div>
        {items.length ? (
          <GroupedList>
            <AnimatedList stagger={false}>
              {items.map((item) => (
                <ListRow key={item.id} href={`/property/${item.propertyId}/bills/${item.id}`} title={item.label} detail={`${item.propertyName} · ${item.amount != null ? formatMoneyExact(item.amount) : displayLabel(item.direction)} · ${dueCopy(item.dueDate)}`} />
              ))}
            </AnimatedList>
          </GroupedList>
        ) : null}
        {!items.length && list.map((b) => {
          const p = s.properties.find((x) => x.id === b.propertyId)?.name;
          return (
            <Disclosure key={b.id} title={b.title} detail={`${inr(b.amount)} · ${b.status === "paid" ? "Paid" : dueCopy(b.dueDate)}`}>
              <p className="text-[13px] text-ink-muted">{b.type} · {inr(b.amount)} · {b.status === "paid" ? "Paid" : dueCopy(b.dueDate)} · {p}</p>
            </Disclosure>
          );
        })}
        {!items.length && !list.length ? <p className="text-[14px] text-ink-muted">No bills yet.</p> : null}
        <Disclosure title="CA pack" detail="CSV of recorded bills"><button type="button" onClick={caExport} className="h-11 w-full rounded-full border border-line">Download CSV</button></Disclosure>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ErrorState, PageHead } from "@/components/ui";
import { Disclosure, GroupedList, ListRow, Metric, SectionHeader, displayLabel, dueCopy, formatMoneyExact, presentDate } from "@/components/consumer";
import { ListSkeleton } from "@/components/motion/Skeleton";
import { PaymentForm, PaymentHistory, ScheduleCorrection } from "@/components/ObligationsPanel";
import { useStore } from "@/components/StoreProvider";

type Occurrence = { id: string; cycleKey: string; dueDate: string; amountPaise: string | null; amount: number | null; currency: string; status: string; source: string; version: number };
type Obligation = { id: string; propertyId: string; type: string; label: string; direction: string; amountPaise: string | null; amount: number | null; currency: string; dueDate: string; timezone: string; recurrenceType: string; recurrenceDay: number | null; notes: string | null; source: string; reminderConfig: { enabled?: boolean; beforeDays?: number[] } | null; active: boolean; version: number; occurrences?: Occurrence[] };
type Payment = { id: string; amount: number; paymentDate: string; status: string; source: string; receiptDocumentId: string | null; reversalOfId: string | null };

export default function PaymentDetailPage() {
  const { id, obligationId } = useParams<{ id: string; obligationId: string }>();
  const { s } = useStore();
  const [obligation, setObligation] = useState<Obligation | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const docs = s.docs.filter((doc) => doc.propertyId === id && doc.scanStatus === "clean" && !doc.deletedAt && !doc.archivedAt);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/obligations/${obligationId}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Obligation is no longer available.");
      const row = body.data.obligation as Obligation;
      if (row.propertyId !== id) throw new Error("Obligation is no longer available.");
      setObligation(row);
      const occurrence = row.occurrences?.[0];
      if (!occurrence || row.direction === "NON_FINANCIAL") return;
      const pay = await fetch(`/api/obligations/${occurrence.id}/payments`, { cache: "no-store", signal: controller.signal });
      const payBody = await pay.json();
      if (pay.ok) setPayments(payBody.data.summary.payments);
    }).catch((reason) => { if (reason.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Obligation is no longer available."); });
    return () => controller.abort();
  }, [id, obligationId, refresh]);

  if (!obligation && !error) return <div><PageHead title="Payment" backHref={`/property/${id}?tab=bills`} backLabel="Bills" /><ListSkeleton rows={3} /></div>;
  if (error || !obligation) return <div><PageHead title="Payment" backHref={`/property/${id}?tab=bills`} backLabel="Bills" /><ErrorState message={error || "Obligation is no longer available."} /></div>;

  const occurrence = obligation.occurrences?.[0];
  const total = occurrence?.amount ?? obligation.amount ?? 0;
  const paid = payments.filter((payment) => payment.status === "RECORDED" && !payment.reversalOfId).reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = total - paid;
  const receipt = payments.find((payment) => payment.receiptDocumentId);
  const reminderDays = obligation.reminderConfig?.beforeDays?.[0];

  return (
    <div>
      <PageHead title={obligation.label} backHref={`/property/${id}?tab=bills`} backLabel="Bills" />
      <div className="space-y-6 pb-8">
        <div className="metric-group">
          <Metric label="Total" value={formatMoneyExact(total)} />
          <Metric label="Paid" value={formatMoneyExact(paid)} />
        </div>
        <div className="metric-group">
          <Metric label="Remaining" value={formatMoneyExact(remaining)} />
          <Metric label="Due" value={occurrence ? dueCopy(occurrence.dueDate).replace(/^Due /, "") : presentDate(obligation.dueDate, "long")} />
        </div>
        {occurrence ? (
          <section>
            <SectionHeader title="Payments" />
            <GroupedList>
              {payments.filter((payment) => !payment.reversalOfId).map((payment) => (
                <Disclosure key={payment.id} title={formatMoneyExact(payment.amount)} detail={`${presentDate(payment.paymentDate)} · ${displayLabel(payment.source)}`}>
                  <PaymentHistory occurrenceId={occurrence.id} onChanged={() => setRefresh((value) => value + 1)} />
                </Disclosure>
              ))}
              {!payments.filter((payment) => !payment.reversalOfId).length ? <div className="list-row"><span className="row-copy"><span className="row-title">No recorded payments</span></span></div> : null}
            </GroupedList>
            {obligation.active && occurrence.status !== "CANCELLED" && occurrence.status !== "COMPLETED" && obligation.direction !== "NON_FINANCIAL" ? (
              <Disclosure title="Record payment">
                <PaymentForm occurrence={occurrence} docs={docs} onSaved={() => setRefresh((value) => value + 1)} />
              </Disclosure>
            ) : null}
          </section>
        ) : null}
        {receipt?.receiptDocumentId ? (
          <section>
            <SectionHeader title="Receipt" />
            <GroupedList>
              <ListRow title={docs.find((doc) => doc.id === receipt.receiptDocumentId)?.displayName || docs.find((doc) => doc.id === receipt.receiptDocumentId)?.name || "Receipt"} href={`/property/${id}/documents/${receipt.receiptDocumentId}`} />
            </GroupedList>
          </section>
        ) : null}
        <section>
          <SectionHeader title="Reminder" />
          <GroupedList>
            <div className="list-row"><span className="row-copy"><span className="row-title">{reminderDays != null ? `${reminderDays} day${reminderDays === 1 ? "" : "s"} before` : "No reminder"}</span></span></div>
          </GroupedList>
        </section>
        <Disclosure title="More actions">
          <ScheduleCorrection obligation={obligation} onChanged={() => setRefresh((value) => value + 1)} />
          {occurrence ? <PaymentHistory occurrenceId={occurrence.id} onChanged={() => setRefresh((value) => value + 1)} /> : null}
        </Disclosure>
      </div>
    </div>
  );
}

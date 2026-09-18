"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, Input, Surface } from "@/components/ui";
import { useStore } from "@/components/StoreProvider";
import type { Property } from "@/lib/types";

/** Manual records only. Neither a co-owner name nor a policy date grants access. */
export function OwnershipRecords({ property }: { property: Property }) {
  const { replace } = useStore();
  const [coOwners, setCoOwners] = useState(property.coOwners ?? "");
  const [loanActive, setLoanActive] = useState(property.loanActive ?? false);
  const [balance, setBalance] = useState(property.loanBalance?.toString() ?? "");
  const [insuranceUntil, setInsuranceUntil] = useState(property.insuranceUntil ?? "");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const submittedDate = String(new FormData(event.currentTarget as HTMLFormElement).get("insuranceUntil") ?? "");
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(property.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: property.version ?? 0, property: { coOwners, loanActive, loanBalance: balance || null, insuranceUntil: submittedDate || null } }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not save your records.");
      replace(body.data.state, body.data.version); setMessage("Saved as owner-entered records with change history. Access permissions and schedules were not changed.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save unavailable."); }
    finally { setBusy(false); }
  }
  return <Surface><h2 className="font-serif text-[18px]">Ownership and renewal records</h2>
    <p className="mt-1 text-[14px] text-ink-muted">Manual records, not lender balances, insurance cover verification or proof of ownership. Blank means not recorded, not zero.</p>
    <form className="mt-3 space-y-3" onSubmit={event => void save(event)}>
      <Input label="Co-owner names (record only)" maxLength={500} value={coOwners} onChange={event => setCoOwners(event.target.value)} />
      <p className="text-[13px]">Names do not invite anyone or grant access. Use Sharing for explicit, selected permissions.</p>
      <label className="flex gap-2 text-[14px]"><input type="checkbox" checked={loanActive} onChange={event => setLoanActive(event.target.checked)} />I record an active property loan</label>
      <Input label="Last entered loan balance ₹ (optional)" inputMode="decimal" value={balance} onChange={event => setBalance(event.target.value)} />
      <Input label="Recorded insurance end date (optional)" name="insuranceUntil" type="date" value={insuranceUntil} onChange={event => setInsuranceUntil(event.target.value)} />
      <p className="text-[13px]">Saving a date does not renew a policy, create a payment or schedule a reminder. Review and add your own schedule in Bills.</p>
      <Button type="submit" busy={busy}>Save ownership records</Button><p role="status" className="text-[14px]">{message}</p>
    </form>
    <div className="mt-3 flex flex-wrap gap-3 text-[14px]"><Link className="underline" href={`/property/${encodeURIComponent(property.id)}?tab=share`}>Review sharing permissions</Link><Link className="underline" href={`/property/${encodeURIComponent(property.id)}?tab=bills`}>Manage manual renewal and loan schedules</Link></div>
  </Surface>;
}

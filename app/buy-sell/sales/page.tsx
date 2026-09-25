"use client";
import { useEffect, useState } from "react";
import { GroupedList, ListRow, formatPaiseCompact } from "@/components/consumer";
import { Button, EmptyState, ErrorState, PageHead } from "@/components/ui";

type Sale = { id: string; propertyName: string; phase: string; askingPricePaise: string | null; prospects: number };
type Property = { id: string; name: string; status?: string };

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [saleResponse, propertyResponse] = await Promise.all([
      fetch("/api/sales", { cache: "no-store" }),
      fetch("/api/properties", { cache: "no-store" }),
    ]);
    const saleBody = await saleResponse.json();
    const propertyBody = await propertyResponse.json();
    if (!saleResponse.ok) throw new Error(saleBody.error?.message || "Sales unavailable.");
    setSales(saleBody.data ?? []);
    setProperties(propertyResponse.ok ? (propertyBody.data?.properties ?? []).filter((row: Property) => row.status !== "archived") : []);
  }

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/sales", { cache: "no-store", signal: controller.signal }),
      fetch("/api/properties", { cache: "no-store", signal: controller.signal }),
    ]).then(async ([saleResponse, propertyResponse]) => {
      const saleBody = await saleResponse.json();
      const propertyBody = await propertyResponse.json();
      if (!saleResponse.ok) throw new Error(saleBody.error?.message || "Sales unavailable.");
      setSales(saleBody.data ?? []);
      setProperties(propertyResponse.ok ? (propertyBody.data?.properties ?? []).filter((row: Property) => row.status !== "archived") : []);
    }).catch((reason) => { if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Sales unavailable."); });
    return () => controller.abort();
  }, []);

  async function createSale(form: FormData) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create-sale", propertyId: form.get("propertyId"), askingPrice: form.get("askingPrice") || undefined, possessionTargetDate: form.get("date") || undefined, description: form.get("description") || "Private sale preparation. This does not publish a listing.", requestKey: crypto.randomUUID() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not save.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save.");
    } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHead title="Selling" backHref="/buy-sell" backLabel="Buy / Sell" />
      <div className="space-y-6 pb-8">
        {error ? <ErrorState message={error} /> : null}
        {sales.length ? (
          <GroupedList>
            {sales.map((sale) => <ListRow key={sale.id} href={`/buy-sell/sales/${sale.id}`} title={sale.propertyName} detail={`${sale.phase} · ${sale.prospects} interested buyer${sale.prospects === 1 ? "" : "s"}`} value={formatPaiseCompact(sale.askingPricePaise) ?? "Asking unknown"} />)}
          </GroupedList>
        ) : <EmptyState title="No private sales yet" detail="Start from a property you already own. This does not publish a listing." />}
        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void createSale(new FormData(event.currentTarget)); }}>
          <h2 className="section-heading">Prepare to sell</h2>
          <label className="block text-sm">Property
            <select className="block w-full rounded border p-2" name="propertyId" required>
              <option value="">Choose an owned property</option>
              {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Asking price in rupees, if known<input className="block w-full rounded border p-2" name="askingPrice" inputMode="decimal" /></label>
          <label className="block text-sm">Expected timing<input className="block w-full rounded border p-2" name="date" type="date" /></label>
          <label className="block text-sm">Short description<textarea className="block w-full rounded border p-2" name="description" maxLength={500} /></label>
          <Button busy={busy} type="submit">Save private sale</Button>
        </form>
      </div>
    </div>
  );
}

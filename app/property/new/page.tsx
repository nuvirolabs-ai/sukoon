"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/components/StoreProvider";
import { Button, ErrorState, Input, PageHead, Surface, HealthRing } from "@/components/ui";
import { healthFor } from "@/lib/health";
import { todayISO } from "@/lib/utils";
import { presentDate } from "@/lib/ui-content";
import type { AreaType, AreaUnit, PropertyType } from "@/lib/types";

type FormState = {
  name: string;
  address: string;
  area: string;
  city: string;
  jurisdiction: string;
  ownerName: string;
  type: PropertyType;
  areaValue: string;
  areaUnit: AreaUnit;
  areaType: AreaType;
  ownershipProvenance: string;
  identifierLabel: string;
  identifierValue: string;
  purchaseDate: string;
  purchaseValue: string;
  photo: string;
  regName: string;
};

const initialForm: FormState = {
  name: "",
  address: "",
  area: "",
  city: "",
  jurisdiction: "",
  ownerName: "",
  type: "flat",
  areaValue: "",
  areaUnit: "sqft",
  areaType: "carpet",
  ownershipProvenance: "Owner-entered assertion; no government verification",
  identifierLabel: "",
  identifierValue: "",
  purchaseDate: "",
  purchaseValue: "",
  photo: "",
  regName: "",
};

export default function NewProperty() {
  const { s, replace } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const canContinueIdentity = Boolean(form.name.trim() && form.address.trim() && form.area.trim() && form.city.trim() && form.jurisdiction.trim());
  const canContinueFacts = Boolean(form.ownerName.trim() && form.areaValue.trim() && form.ownershipProvenance.trim());

  const onPhoto = (file: File) => {
    if (file.size > 800_000) { setError("The optional property photo is limited to 0.8 MB in this local build."); return; }
    const reader = new FileReader();
    reader.onload = () => set("photo", String(reader.result));
    reader.readAsDataURL(file);
  };

  const create = async () => {
    setBusy(true);
    setError("");
    const identifiers = form.identifierLabel.trim() && form.identifierValue.trim() ? [{ label: form.identifierLabel.trim(), value: form.identifierValue.trim() }] : [];
    try {
      const response = await fetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: form.name,
        type: form.type,
        city: form.city,
        area: form.area,
        address: form.address,
        jurisdiction: form.jurisdiction,
        areaValue: form.areaValue,
        areaUnit: form.areaUnit,
        areaType: form.areaType,
        ownershipAssertion: "self_asserted",
        ownershipProvenance: form.ownershipProvenance,
        identifiers,
        ownerName: form.ownerName,
        purchaseDate: form.purchaseDate || undefined,
        purchaseValue: form.purchaseValue || undefined,
        photoUrl: form.photo || undefined,
        occupancy: "self",
      }) });
      const body = await response.json() as { data?: { state: typeof s; version: number; property: { id: string } }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Property could not be saved.");
      replace(body.data.state, body.data.version);
      setCreatedId(body.data.property.id);
      setStep(3);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Property could not be saved."); }
    finally { setBusy(false); }
  };

  const onRegistry = async (file: File) => {
    if (!createdId) return;
    setUploadMessage("Storing registry privately…");
    const payload = new FormData();
    payload.append("propertyId", createdId);
    payload.append("type", "Registry");
    payload.append("displayName", form.regName);
    payload.append("file", file);
    try {
      const response = await fetch("/api/documents", { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: payload });
      const body = await response.json() as { data?: { state: typeof s; version: number }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Registry upload failed.");
      replace(body.data.state, body.data.version);
      setUploadMessage("Registry quarantined. Preview waits for a clean malware scan; parsing and AI review remain separate stages.");
    } catch (reason: unknown) { setUploadMessage(reason instanceof Error ? reason.message : "Registry upload failed."); }
  };

  const propertyHealth = createdId ? healthFor(createdId, s) : null;

  return <div>
    <PageHead title={step === 3 ? "Passport ready" : "Add property"} sub={["Basics", "Property", "Ownership", "Review"][step]} />
    <div className="flex gap-2 pb-3" aria-label="Property setup progress">{["Basics", "Property", "Ownership", "Review"].map((label, index) => <div key={label} className="flex-1"><div className={`h-1.5 rounded-full ${index <= step ? "bg-forest" : "bg-gray-200"}`} /><p className="mt-1 text-[11px] text-ink-muted">{index + 1} {label}</p></div>)}</div>
    <div className="space-y-3 pb-8">
      {error ? <ErrorState message={error} /> : null}
      {step === 0 ? <Surface tone="soft" className="space-y-3">
        <div><p className="text-[19px] font-medium">Basics</p><p className="mt-1 text-[14px] text-ink-muted">Name and place.</p></div>
        <Input label="Property name" required value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Home in Vijay Nagar" autoComplete="off" />
        <Input label="Full address" required value={form.address} onChange={(event) => set("address", event.target.value)} placeholder="1203, Skyline Residency" autoComplete="street-address" />
        <div className="grid grid-cols-2 gap-2"><Input label="Locality" required value={form.area} onChange={(event) => set("area", event.target.value)} placeholder="Vijay Nagar" /><Input label="City" required value={form.city} onChange={(event) => set("city", event.target.value)} placeholder="Indore" autoComplete="address-level2" /></div>
        <Input label="Jurisdiction" required value={form.jurisdiction} onChange={(event) => set("jurisdiction", event.target.value)} placeholder="India · Madhya Pradesh · Indore" hint="The location context for future reviewed guidance." />
        <Button className="w-full" disabled={!canContinueIdentity} onClick={() => setStep(1)}>Continue to property facts</Button>
      </Surface> : null}

      {step === 1 ? <Surface tone="soft" className="space-y-3">
        <div><p className="text-[19px] font-medium">Property</p><p className="mt-1 text-[14px] text-ink-muted">Facts you entered. Not government verified.</p></div>
        <Input label="Owner name" required value={form.ownerName} onChange={(event) => set("ownerName", event.target.value)} placeholder="Name as written on your source record" autoComplete="name" />
        <label className="block text-[14px] font-semibold">Property type<select value={form.type} onChange={(event) => set("type", event.target.value as PropertyType)} className="mt-1 h-11 w-full rounded-xl border border-line bg-white px-3 text-[16px] outline-none"><option value="flat">Flat / Apartment</option><option value="villa">Villa</option><option value="plot">Plot</option><option value="commercial">Commercial</option><option value="agri">Agriculture</option></select></label>
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-2"><Input label="Original area value" required value={form.areaValue} onChange={(event) => set("areaValue", event.target.value)} placeholder="1200" inputMode="decimal" /><label className="block text-[14px] font-semibold">Original unit<select value={form.areaUnit} onChange={(event) => set("areaUnit", event.target.value as AreaUnit)} className="mt-1 h-11 w-full rounded-xl border border-line bg-white px-2 text-[16px] outline-none"><option value="sqft">sq ft</option><option value="sqm">sq m</option><option value="acre">acre</option><option value="hectare">hectare</option><option value="other">Other</option></select></label></div>
        <label className="block text-[14px] font-semibold">Original area type<select value={form.areaType} onChange={(event) => set("areaType", event.target.value as AreaType)} className="mt-1 h-11 w-full rounded-xl border border-line bg-white px-3 text-[16px] outline-none"><option value="carpet">Carpet area</option><option value="built_up">Built-up area</option><option value="plot">Plot area</option><option value="land">Land area</option><option value="other">Other / not specified</option></select></label>
        <Input label="Ownership source" required value={form.ownershipProvenance} onChange={(event) => set("ownershipProvenance", event.target.value)} hint="Example: owner-entered claim; registry upload pending." />
        <div className="flex gap-2"><Button variant="quiet" className="flex-1" onClick={() => setStep(0)}>Back</Button><Button className="flex-[2]" disabled={!canContinueFacts} onClick={() => setStep(2)}>Continue to optional details</Button></div>
      </Surface> : null}

      {step === 2 ? <Surface tone="soft" className="space-y-3">
        <div><p className="text-[19px] font-medium">Ownership</p><p className="mt-1 text-[14px] text-ink-muted">Optional details. You can add documents later.</p></div>
        <div className="grid grid-cols-2 gap-2"><Input label="Identifier label" value={form.identifierLabel} onChange={(event) => set("identifierLabel", event.target.value)} placeholder="Survey no." /><Input label="Identifier value" value={form.identifierValue} onChange={(event) => set("identifierValue", event.target.value)} placeholder="Optional" /></div>
        <div className="grid grid-cols-2 gap-2"><Input label="Purchase date" type="date" value={form.purchaseDate} onChange={(event) => set("purchaseDate", event.target.value)} /><Input label="Purchase value ₹" value={form.purchaseValue} onChange={(event) => set("purchaseValue", event.target.value)} placeholder="Optional" inputMode="decimal" /></div>
        <label className="block text-[14px] font-semibold">Front photo <span className="font-normal text-ink-muted">(optional)</span><input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) onPhoto(file); }} className="mt-1 w-full text-[14px] font-normal" />{form.photo ? <Image src={form.photo} alt="Selected property" width={640} height={320} unoptimized className="mt-2 h-32 w-full rounded-2xl object-cover" /> : null}</label>
        <div className="flex gap-2"><Button variant="quiet" className="flex-1" onClick={() => setStep(1)}>Back</Button><Button className="flex-[2]" busy={busy} onClick={() => void create()}>Save property passport</Button></div>
      </Surface> : null}

      {step === 3 && createdId ? <>
        <Surface tone="success" className="flex items-center gap-3">{propertyHealth ? <HealthRing score={propertyHealth.assessment === "RECORD_READINESS" ? propertyHealth.score : undefined} /> : null}<div><p className="text-[18px] font-medium">Your record is saved</p><p className="text-[14px] text-ink-muted">{propertyHealth ? `${propertyHealth.docs.have} vault records · ${propertyHealth.assessment === "NOT_ASSESSED" ? "record readiness not assessed yet" : `record readiness ${propertyHealth.score}/100`}` : ""}</p></div></Surface>
        <Surface className="space-y-3"><div><p className="text-[18px] font-medium">Add a source record</p><p className="mt-1 text-[14px] leading-5 text-ink-muted">The original stays private and starts quarantined. Preview waits for a clean scan.</p></div><Input label="Display name" value={form.regName} onChange={(event) => set("regName", event.target.value)} placeholder="Registry document (optional)" /><label className="flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-forest px-4 text-[13px] font-semibold text-white">{uploadMessage ? "Choose another file" : "Upload Registry"}<input type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onRegistry(file); event.target.value = ""; }} /></label>{uploadMessage ? <p role="status" className="text-[13px] text-ink-muted">{uploadMessage}</p> : null}</Surface>
        <Button className="w-full" onClick={() => router.push(`/property/${createdId}`)}>Open Property Passport →</Button>
        <Button variant="secondary" className="w-full" onClick={() => router.push("/properties")}>View My Properties</Button>
      </> : null}
      <p className="text-center text-[13px] leading-4 text-ink-muted">Ownership is recorded as your assertion and source, not a government verification. You can edit or archive this record later.</p>
      <p className="text-center text-[13px] text-ink-muted">Started {presentDate(todayISO())}</p>
    </div>
  </div>;
}

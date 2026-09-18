"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorState, PageHead } from "@/components/ui";
import { Disclosure, GroupedList, SectionHeader, displayLabel, documentStatusLabel, presentDate } from "@/components/consumer";
import { DocumentEvidenceDetails } from "@/components/DocumentEvidenceDetails";
import { DocumentReview, ManualDocumentReview } from "@/components/DocumentReviewPanel";
import { ScanRetry } from "@/components/ScanRetry";
import { useStore } from "@/components/StoreProvider";
import { useToast } from "@/components/motion/Toast";
import { ListSkeleton } from "@/components/motion/Skeleton";

type OwnerDocument = {
  id: string;
  propertyId: string | null;
  type: string;
  name: string;
  displayName?: string;
  uploadDate?: string;
  uploadedAt?: string;
  sizeKb?: number;
  sizeBytes?: number;
  scanStatus?: string;
  processingState?: string;
  reviewStatus?: string;
  provenance?: string;
  version?: number;
  versions?: Array<{ id: string; version: number; scanStatus: string; reviewStatus: string }>;
  extracted?: Record<string, string>;
  storageKey?: string;
};

export function DocumentDetailView({ documentId, propertyId, mode, backHref, backLabel }: {
  documentId: string;
  propertyId: string;
  mode: "owner" | "shared";
  backHref: string;
  backLabel: string;
}) {
  const { s, replace } = useStore();
  const { notify } = useToast();
  const router = useRouter();
  const [data, setData] = useState<OwnerDocument | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const stored = s.docs.find((doc) => doc.id === documentId && doc.propertyId === propertyId);

  useEffect(() => {
    const controller = new AbortController();
    const url = mode === "shared" ? `/api/shared/documents/${documentId}?metadata=true` : `/api/documents/${documentId}?metadata=true`;
    fetch(url, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Document is no longer available.");
      const document = (body.data.document ?? body.data) as OwnerDocument;
      if (document.propertyId && document.propertyId !== propertyId) throw new Error("Document is no longer available.");
      setData(document);
    }).catch((reason) => { if (reason.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Document is no longer available."); });
    return () => controller.abort();
  }, [documentId, propertyId, mode]);

  const document = data || stored;
  if (!document && !error) return <div><PageHead title="Document" backHref={backHref} backLabel={backLabel} /><ListSkeleton rows={3} /></div>;
  if (error || !document) return <div><PageHead title="Document" backHref={backHref} backLabel={backLabel} /><ErrorState message={error || "Document is no longer available."} /></div>;

  const current = document;
  const title = current.displayName || current.name;
  const status = documentStatusLabel(current);
  const previewHref = mode === "shared" ? `/api/shared/documents/${current.id}` : `/api/documents/${current.id}`;
  const downloadHref = mode === "shared" ? null : `/api/documents/${current.id}?download=true`;
  const canPreview = mode === "shared" || current.scanStatus === "clean";
  const uploaded = current.uploadDate || current.uploadedAt;
  const confirmed = current.extracted && typeof current.extracted === "object" ? Object.entries(current.extracted).filter(([, value]) => value) : [];

  async function replaceFile(file: File) {
    if (mode !== "owner") return;
    setBusy(true); setError("");
    const form = new FormData();
    form.append("propertyId", propertyId);
    form.append("type", current.type);
    form.append("replaceDocumentId", current.id);
    form.append("file", file);
    try {
      const response = await fetch("/api/documents", { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Replace failed.");
      if (body.data?.state) replace(body.data.state, body.data.version);
      notify("Replacement uploaded — scanning");
      router.refresh();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Replace failed.";
      setError(message); notify(message, "error");
    } finally { setBusy(false); }
  }

  async function archive() {
    if (mode !== "owner") return;
    if (!window.confirm("Remove this document from your active Vault?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${current.id}/archive`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not archive the document.");
      notify("Document archived");
      router.replace(backHref);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not archive the document.";
      setError(message); notify(message, "error");
    } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHead title={title} backHref={backHref} backLabel={backLabel} />
      <div className="space-y-6 pb-8">
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        <p className="text-[15px]">{status}</p>
        <p className="text-[15px] text-ink-muted">Security scan · {document.scanStatus === "clean" || mode === "shared" ? "No threats detected" : displayLabel(document.scanStatus || "pending")}</p>
        {canPreview ? <a className="primary-disclosure motion-pressable" href={previewHref} target="_blank" rel="noreferrer">Preview <span aria-hidden="true">→</span></a> : <p className="text-sm text-ink-muted">Preview blocked until this version is clean.</p>}
        {mode === "owner" && document.scanStatus === "unavailable" ? <ScanRetry documentId={document.id} /> : null}
        <section>
          <SectionHeader title="Details" />
          <GroupedList>
            <div className="list-row"><span className="row-copy"><span className="row-title">Category</span><span className="row-detail">{document.type}</span></span></div>
            {uploaded ? <div className="list-row"><span className="row-copy"><span className="row-title">Uploaded</span><span className="row-detail">{presentDate(uploaded, "long")}</span></span></div> : null}
            <div className="list-row"><span className="row-copy"><span className="row-title">Source</span><span className="row-detail">{document.provenance ? displayLabel(document.provenance) : "Added by you"}</span></span></div>
          </GroupedList>
        </section>
        {confirmed.length ? (
          <section>
            <SectionHeader title="Document information" />
            <GroupedList>
              {confirmed.map(([field, value]) => <div className="list-row" key={field}><span className="row-copy"><span className="row-title">{displayLabel(field)}</span><span className="row-detail">{String(value)}</span></span></div>)}
            </GroupedList>
          </section>
        ) : null}
        {mode === "owner" && document.versions?.length ? (
          <section>
            <SectionHeader title="Versions" />
            <GroupedList>
              {[...document.versions].reverse().map((version) => (
                <div className="list-row" key={version.id}>
                  <span className="row-copy">
                    <span className="row-title">v{version.version}</span>
                    <span className="row-detail">{version.version === document.version ? "Current" : "Previous"} · {displayLabel(version.reviewStatus)}</span>
                  </span>
                </div>
              ))}
            </GroupedList>
          </section>
        ) : null}
        {mode === "owner" ? (
          <>
            <Disclosure title="Security & provenance" detail="Scan evidence on request">
              <p className="text-sm text-ink-muted mb-3">A scan does not establish authenticity or government verification.</p>
              <DocumentEvidenceDetails documentId={document.id} />
            </Disclosure>
            {stored && document.scanStatus === "clean" ? <>{status !== "Reviewed" ? <ManualDocumentReview document={stored} onConfirmed={() => setData((current) => current ? { ...current, reviewStatus: "confirmed" } : current)} /> : null}<DocumentReview document={stored} propertyId={propertyId} /></> : null}
            <Disclosure title="More actions">
              <div className="space-y-3">
                {downloadHref && document.scanStatus === "clean" ? <a className="block underline" href={downloadHref}>Download</a> : null}
                <label className="block text-sm">Replace
                  <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} className="block mt-1" onChange={(event) => { const file = event.target.files?.[0]; if (file) void replaceFile(file); event.target.value = ""; }} />
                </label>
                <Button variant="danger" busy={busy} onClick={() => void archive()}>Archive</Button>
              </div>
            </Disclosure>
          </>
        ) : null}
      </div>
    </div>
  );
}

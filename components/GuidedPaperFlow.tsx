"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { takeNativePhoto } from "@/components/NativeRuntime";
import { Button, ErrorState } from "@/components/ui";
import { DOCUMENT_TAXONOMY, type AppState, type DocType, type Property } from "@/lib/types";
import { presentName } from "@/lib/ui-content";
import { useStore } from "@/components/StoreProvider";
import { useToast } from "@/components/motion/Toast";

type UploadedDocument = {
  id: string;
  name: string;
  displayName?: string;
  type: string;
  scanStatus?: string;
  processingState?: string;
  reviewStatus?: string;
  version?: number;
};

type UploadResponse = {
  data?: {
    document?: UploadedDocument;
    state?: AppState;
    version?: number;
  };
  error?: { message?: string };
};

function categoryLabel(category: string) {
  return category === "Other" ? "Not sure yet" : category;
}

function scanCopy(document?: UploadedDocument | null) {
  switch (document?.scanStatus) {
    case "clean":
      return { title: "No threats detected by the configured scanner", detail: "This is a malware-scan result only. It does not establish authenticity, legal validity, or approval." };
    case "infected":
      return { title: "The configured scanner detected a threat", detail: "This paper remains unavailable. No preview or download is allowed." };
    case "unavailable":
      return { title: "Scanning is unavailable", detail: "This paper stays private until a scanner verdict is recorded." };
    case "failed":
      return { title: "The scanner could not finish", detail: "This paper stays private until the scan can complete." };
    default:
      return { title: "Scanning your paper", detail: "The original is private while the configured local scanner checks this version." };
  }
}

export function GuidedPaperFlow({ property }: { property: Property }) {
  const { replace } = useStore();
  const { notify } = useToast();
  const [step, setStep] = useState<"choose" | "confirm" | "uploading" | "saved">("choose");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocType>("Other");
  const [displayName, setDisplayName] = useState("");
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [error, setError] = useState("");
  const uploadedId = document?.id;

  const isNative = useSyncExternalStore(() => () => undefined, () => Capacitor.isNativePlatform(), () => false);

  useEffect(() => {
    if (!uploadedId) return;
    let cancelled = false;
    let finished = false;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/documents/${uploadedId}?metadata=true`, { cache: "no-store" });
        const body = await response.json() as { data?: { document?: UploadedDocument }; error?: { message?: string } };
        if (!response.ok || !body.data?.document) return;
        const latest = body.data.document;
        if (cancelled) return;
        setDocument(latest);
        if (latest.scanStatus && latest.scanStatus !== "scan_pending" && !finished) {
          finished = true;
          window.clearInterval(timer);
          const stateResponse = await fetch("/api/state", { cache: "no-store" });
          const stateBody = await stateResponse.json() as { data?: { state: AppState; version: number } };
          if (!cancelled && stateResponse.ok && stateBody.data) replace(stateBody.data.state, stateBody.data.version);
        }
      } catch {
        // The visible state remains conservative: a failed refresh never turns a
        // pending or unknown result into a clean result.
      }
    };

    const timer = window.setInterval(() => { void refresh(); }, 1800);
    void refresh();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [uploadedId, replace]);

  const chooseFile = (nextFile: File) => {
    setError("");
    setFile(nextFile);
    setStep("confirm");
  };

  const upload = async () => {
    if (!file) return;
    setStep("uploading");
    setError("");
    const form = new FormData();
    form.append("propertyId", property.id);
    form.append("type", category);
    if (displayName.trim()) form.append("displayName", displayName.trim());
    form.append("file", file);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: form,
      });
      const body = await response.json() as UploadResponse;
      if (!response.ok || !body.data?.document) throw new Error(body.error?.message || "The paper could not be added.");
      if (body.data.state) replace(body.data.state, body.data.version);
      setDocument(body.data.document);
      setStep("saved");
      notify("Paper added to this property");
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "The paper could not be added.";
      setError(message);
      setStep("confirm");
      notify(message, "error");
    }
  };

  const reset = () => {
    setStep("choose");
    setFile(null);
    setDocument(null);
    setCategory("Other");
    setDisplayName("");
    setError("");
  };

  const status = scanCopy(document);
  return (
    <section className="guided-paper-flow surface" aria-labelledby="add-paper-title">
      <div className="guided-paper-flow__intro">
        <p className="guided-eyebrow">Documents</p>
        <h2 id="add-paper-title">Add a paper</h2>
        <p>Keep a clear, private record for this property. You can choose a category after the file is selected.</p>
      </div>

      <ol className="guided-steps" aria-label="Add a paper steps">
        {[["choose", "Choose file"], ["confirm", "Check details"], ["saved", "Review result"]].map(([key, label], index) => (
          <li key={key} className={step === key || (step === "uploading" && key === "confirm") ? "is-current" : ""}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>

      {step === "choose" ? (
        <div className="guided-paper-flow__body">
          <p className="guided-step-title">Start with the file</p>
          <p className="guided-support">PDF, JPEG, or PNG up to 25 MB. The original stays in private quarantine until its scan is recorded.</p>
          <div className="guided-actions">
            <label className="primary-disclosure motion-pressable guided-file-button">
              Choose a file <span aria-hidden="true">→</span>
              <input type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(event) => { const next = event.target.files?.[0]; if (next) chooseFile(next); event.target.value = ""; }} />
            </label>
            {isNative ? <button type="button" className="guided-secondary-action motion-pressable" onClick={() => { void takeNativePhoto().then((photo) => { if (photo) chooseFile(photo); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Camera was unavailable.")); }}>Take a photo</button> : null}
          </div>
          {error ? <ErrorState message={error} /> : null}
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className="guided-paper-flow__body space-y-4">
          <div className="guided-file-summary">
            <p className="guided-step-title">Check before adding</p>
            <p className="guided-file-name">{file?.name}</p>
            <p className="guided-support">Saved to <strong>{presentName(property.name)}</strong> · {presentName(property.area)}, {presentName(property.city)}</p>
          </div>
          <label className="guided-field">Category
            <select value={category} onChange={(event) => setCategory(event.target.value as DocType)}>
              {DOCUMENT_TAXONOMY.map((item) => <option key={item} value={item}>{categoryLabel(item)}</option>)}
            </select>
            <span className="guided-hint">You can change this later during manual review.</span>
          </label>
          <label className="guided-field">Name (optional)
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="For example, 2026 tax receipt" />
          </label>
          <p className="guided-disclosure-copy">The scan checks for malware only. It does not verify authenticity, legal validity, or approval.</p>
          {error ? <ErrorState message={error} /> : null}
          <div className="guided-actions">
            <Button variant="quiet" type="button" onClick={() => { setFile(null); setStep("choose"); }}>Choose another file</Button>
            <Button type="button" onClick={() => void upload()}>Add paper</Button>
          </div>
        </div>
      ) : null}

      {step === "uploading" ? (
        <div className="guided-paper-flow__body" aria-live="polite">
          <p className="guided-step-title">Adding your paper</p>
          <p className="guided-support">The file is stored privately first. The durable worker is recording the configured scanner’s verdict.</p>
          <div className="guided-progress" role="status"><span />Uploading · scanning</div>
        </div>
      ) : null}

      {step === "saved" && document ? (
        <div className="guided-paper-flow__body" aria-live="polite">
          <p className="guided-step-title">Paper added</p>
          <p className="guided-file-name">{presentName(document.displayName || document.name)}</p>
          <p className="guided-support">It is now in <strong>{presentName(property.name)}</strong>. The next step depends on the actual scan result.</p>
          <div className={`guided-scan-result ${document.scanStatus === "clean" ? "is-clean" : document.scanStatus === "infected" ? "is-danger" : ""}`}>
            <p>{status.title}</p>
            <span>{status.detail}</span>
          </div>
          {document.scanStatus === "clean" ? (
            <div className="guided-actions">
              <Link className="primary-disclosure motion-pressable" href={`/property/${property.id}/documents/${document.id}`}>Open paper <span aria-hidden="true">→</span></Link>
              <p className="guided-hint">Open it to confirm the category manually, then preview or download this clean version.</p>
            </div>
          ) : document.scanStatus === "infected" || document.scanStatus === "unavailable" || document.scanStatus === "failed" ? (
            <p className="guided-hint">Preview and download remain blocked. Open the paper for the available recovery action.</p>
          ) : null}
          <button type="button" className="guided-secondary-action motion-pressable" onClick={reset}>Add another paper</button>
        </div>
      ) : null}
    </section>
  );
}

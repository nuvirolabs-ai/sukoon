"use client";
import { useState } from "react";
/** Read-only evidence, loaded only when its owner asks for detail. */
export function DocumentEvidenceDetails({documentId}:{documentId:string}) {
  const [data,setData]=useState<Record<string,unknown>|null>(null),[error,setError]=useState("");
  async function load(){
    if(data)return;
    try{const response=await fetch(`/api/documents/${documentId}?metadata=true`,{cache:"no-store"});const body=await response.json();if(!response.ok)throw Error(body.error?.message||"Document details unavailable.");setData(body.data);}
    catch(reason){setError(reason instanceof Error?reason.message:"Document details unavailable.");}
  }
  return <details onToggle={event=>{if(event.currentTarget.open)void load();}}><summary>Scan & technical details</summary>
    <p className="text-sm text-ink-muted mb-3">Recorded scanner evidence, content hashes and source metadata. A malware scan does not establish authenticity, legal validity or government approval.</p>
    {error?<p role="alert">{error}</p>:data?<pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify({document:data.document,scanEvidence:data.scanEvidence},null,2)}</pre>:<p role="status">Loading details…</p>}
  </details>;
}

"use client";
import { useParams } from "next/navigation";
import { DocumentDetailView } from "@/components/DocumentDetailView";

export default function OwnerDocumentDetailPage() {
  const { id, documentId } = useParams<{ id: string; documentId: string }>();
  return <DocumentDetailView mode="owner" propertyId={id} documentId={documentId} backHref={`/property/${id}?tab=vault`} backLabel="Vault" />;
}

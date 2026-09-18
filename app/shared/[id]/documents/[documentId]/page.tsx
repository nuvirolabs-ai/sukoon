"use client";
import { useParams } from "next/navigation";
import { DocumentDetailView } from "@/components/DocumentDetailView";

export default function SharedDocumentDetailPage() {
  const { id, documentId } = useParams<{ id: string; documentId: string }>();
  return <DocumentDetailView mode="shared" propertyId={id} documentId={documentId} backHref={`/shared/${id}`} backLabel="Shared property" />;
}

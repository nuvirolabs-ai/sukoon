"use client";
import { useParams } from "next/navigation";
import { ErrorState, PageHead } from "@/components/ui";
import { PurchaseSkeleton } from "@/components/motion/Skeleton";
import { PurchaseEvidencePanel } from "@/components/PurchaseEvidencePanel";
import { findCandidate, PurchaseIdentity, usePurchaseWorkspaces } from "@/components/PurchaseWorkspace";

export default function PurchaseQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const { rows, error, loading } = usePurchaseWorkspaces();
  const found = findCandidate(rows, id);
  if (loading) return <div><PageHead title="Questions" backHref={`/buy-sell/purchases/${id}`} backLabel="Overview" /><PurchaseSkeleton /></div>;
  if (!found) return <div><PageHead title="Questions" backHref="/buy-sell/purchases" backLabel="Purchases" /><ErrorState message={error || "This purchase workspace is no longer available."} /></div>;
  return (
    <div>
      <PageHead title="Questions" backHref={`/buy-sell/purchases/${found.candidate.id}`} backLabel="Overview" />
      <div className="space-y-4 pb-8">
        <PurchaseIdentity candidate={found.candidate} />
        <PurchaseEvidencePanel candidateId={found.candidate.id} mode="questions" />
      </div>
    </div>
  );
}

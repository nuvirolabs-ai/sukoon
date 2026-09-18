"use client";
import { EmptyState, PageHead } from "@/components/ui";

export default function Guideline() {
  return (
    <div>
      <PageHead title="Guideline rates" />
      <div className="pb-6">
        <EmptyState
          title="Not available yet"
          detail="Sukoon will not invent circle rates or stamp-duty figures. This stays deferred until a reviewed source is connected."
        />
      </div>
    </div>
  );
}

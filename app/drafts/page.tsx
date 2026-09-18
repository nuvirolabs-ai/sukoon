"use client";

import { EmptyState, PageHead } from "@/components/ui";

export default function Drafts() {
  return (
    <div>
      <PageHead title="Drafts" />
      <div className="pb-6">
        <EmptyState
          title="Not available yet"
          detail="Sukoon does not generate agreements, affidavits or signatures in this build. Use a qualified professional for documents that will be signed."
        />
      </div>
    </div>
  );
}

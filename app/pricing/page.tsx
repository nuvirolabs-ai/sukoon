"use client";

import { EmptyState, PageHead } from "@/components/ui";

export default function Pricing() {
  return (
    <div>
      <PageHead title="About plans" />
      <div className="pb-6">
        <EmptyState
          title="Not available yet"
          detail="No live prices, entitlements or checkout exist in this build."
        />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { EmptyState, PageHead } from "@/components/ui";

export default function VendorsPage() {
  return (
    <div>
      <PageHead title="Vendors" />
      <div className="pb-6">
        <EmptyState
          title="Not available yet"
          detail="Sukoon does not invent vendors, ratings or bookings. A provider directory is not connected in this build."
          action={<Link href="/property/new" className="underline">Add a property instead</Link>}
        />
      </div>
    </div>
  );
}

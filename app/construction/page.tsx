"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConstructionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/estate?tab=journey");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-ink-muted">
      Loading Construction Hub...
    </div>
  );
}

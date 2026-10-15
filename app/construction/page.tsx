"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConstructionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/estate?tab=rates");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-ink-muted">
      निर्माण हब लोड हो रहा है...
    </div>
  );
}

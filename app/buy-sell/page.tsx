"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BuySellPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/market?tab=deals");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-ink-muted">
      सौदे व बाज़ार हब लोड हो रहा है...
    </div>
  );
}

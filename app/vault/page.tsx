"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VaultPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/estate?tab=portfolio");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-ink-muted">
      संपत्ति व कागज़ात हब लोड हो रहा है...
    </div>
  );
}

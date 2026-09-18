"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

/**
 * PageTransition — spatial, fast, interruptible route continuity.
 * Keyed by first two path segments so tab switches feel lateral, not reloaded.
 * Entrance runs as a mount CSS animation (no state/effect): restrained fade +
 * 6px rise at standard speed. `prefers-reduced-motion` disables it in CSS.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = pathname?.split("/").slice(0, 3).join("/") ?? "/";
  return (
    <div key={section} className={cx("motion-page", "is-animated")}>
      {children}
    </div>
  );
}

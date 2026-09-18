"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { presentName } from "@/lib/ui-content";
import { cx } from "@/lib/utils";

/**
 * CollapsingHeader — large title on open, compact sticky header on scroll.
 * No sudden swaps: sticky bar crossfades + slides 8px while large title scrolls away.
 * Sticky bar uses restrained translucency + blur; content scrolls underneath.
 */
export function CollapsingHeader({
  title,
  sub,
  right,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), {
      rootMargin: "-64px 0px 0px 0px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div aria-hidden={!compact} className={cx("motion-compactbar", compact && "is-visible")}>
        <div className="motion-compactbar__inner">
          {backHref ? (
            <Link href={backHref} aria-label={backLabel} className="icon-button motion-pressable !h-9 !w-9">
              ←
            </Link>
          ) : null}
          <p className="motion-compactbar__title">{presentName(title)}</p>
          {right ? <div className="motion-compactbar__right">{right}</div> : null}
        </div>
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{presentName(title)}</h1>
          {sub ? <p className="page-subtitle">{presentName(sub)}</p> : null}
        </div>
        {right}
      </div>
      <div ref={sentinelRef} aria-hidden="true" className="motion-compactbar__sentinel" />
    </>
  );
}

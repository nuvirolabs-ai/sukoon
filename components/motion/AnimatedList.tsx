"use client";

import { Children, cloneElement, isValidElement, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/utils";
import { useReducedMotion } from "./useReducedMotion";
import { MAX_STAGGER, useRevealList } from "./useRevealList";

/**
 * AnimatedList — restrained stagger on first reveal only.
 * - First `MAX_STAGGER` items fade+rise with 40ms cascade (standard 220ms).
 * - Items beyond that appear without delay (never animate 37 tasks at once).
 * - IntersectionObserver reveals below-the-fold rows as they enter; already-visible
 *   history rows mount visible (no timeline replay on scroll).
 * For lists whose rows can disappear in place (filters, resolved attention
 * items), prefer AnimatedRemovalList, which adds a 220ms exit.
 */
export function AnimatedList({
  children,
  className = "",
  stagger = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useRevealList(ref, reduced, children);

  const items = Children.map(children, (child, index) => {
    const capped = stagger ? Math.min(index, MAX_STAGGER) : 0;
    const style: CSSProperties = stagger ? ({ "--motion-index": capped } as CSSProperties) : {};
    if (isValidElement(child)) {
      const element = child as React.ReactElement<{ className?: string; style?: CSSProperties }>;
      return cloneElement(element, {
        className: cx("motion-item", reduced && "is-visible", element.props.className),
        style: { ...style, ...element.props.style },
      });
    }
    return (
      <div className={cx("motion-item", reduced && "is-visible")} style={style}>
        {child}
      </div>
    );
  });

  return (
    <div ref={ref} className={className}>
      {items}
    </div>
  );
}

/** Convenience wrapper when a single row needs independent reveal (e.g. new site update). */
export function AnimatedItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cx("motion-item is-visible motion-item--fresh", className)}>{children}</div>;
}

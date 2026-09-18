"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/utils";
import { useReducedMotion } from "./useReducedMotion";
import { MAX_STAGGER, useRevealList } from "./useRevealList";

const EXIT_MS = 220;

function childKey(child: ReactNode, index: number): string {
  if (isValidElement(child) && child.key !== null && child.key !== undefined) return `k:${String(child.key)}`;
  return `i:${index}`;
}

function withItemClass(child: ReactNode, index: number, reduced: boolean, stagger: boolean, extra = "") {
  const capped = stagger ? Math.min(index, MAX_STAGGER) : 0;
  const style: CSSProperties = stagger ? ({ "--motion-index": capped } as CSSProperties) : {};
  if (isValidElement(child)) {
    const element = child as React.ReactElement<{ className?: string; style?: CSSProperties }>;
    return cloneElement(element, {
      className: cx("motion-item", reduced && "is-visible", extra, element.props.className),
      style: { ...style, ...element.props.style },
    });
  }
  return (
    <div className={cx("motion-item", reduced && "is-visible", extra)} style={style}>
      {child}
    </div>
  );
}

/**
 * AnimatedRemovalList — AnimatedList enter discipline plus OPTIONAL exits.
 *
 * PRIVATE-DATA POLICY (see docs/MOTION_SYSTEM.md): exits default to OFF.
 * Removed children unmount immediately unless `allowExit` is explicitly set
 * for ordinary, non-sensitive cosmetic changes. Never pass `allowExit` for
 * private content, and never to delay hiding after logout, revocation,
 * scope/permission loss, account switch, or search-filter removal.
 */
export function AnimatedRemovalList({
  children,
  className = "",
  stagger = true,
  allowExit = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  /** Opt-in 220ms exit hold. Only for non-sensitive cosmetic changes. */
  allowExit?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState<Map<string, ReactNode>>(new Map());
  const nodes = useRef(new Map<string, ReactNode>());
  const timers = useRef(new Map<string, number>());

  const current = Children.toArray(children);

  useEffect(() => {
    const seen = new Set<string>();
    current.forEach((child, index) => seen.add(childKey(child, index)));
    // Policy safe-default: without explicit allowExit, removed children
    // unmount immediately (no private-content retention for animation).
    if (!allowExit || reduced) {
      for (const key of [...timers.current.keys()]) {
        window.clearTimeout(timers.current.get(key));
        timers.current.delete(key);
      }
      // Bailout-safe: returns prev when already empty (no re-render loop).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- exit choreography must react to children changes; timer-bounded
      setLeaving((prev) => (prev.size === 0 ? prev : new Map()));
      nodes.current = new Map(current.map((child, index) => [childKey(child, index), child]));
      return;
    }
    // Keys that came back cancel their pending exit.
    for (const key of [...timers.current.keys()]) {
      if (seen.has(key)) {
        window.clearTimeout(timers.current.get(key));
        timers.current.delete(key);
        setLeaving((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    }
    // Newly-gone keys are held with an exit animation, then unmounted.
    // (Only reachable with allowExit + full motion; see policy gate above.)
    const gone: Array<[string, ReactNode]> = [];
    for (const [key, node] of nodes.current) {
      if (!seen.has(key) && !timers.current.has(key)) gone.push([key, node]);
    }
    nodes.current = new Map(current.map((child, index) => [childKey(child, index), child]));
    if (!gone.length) return;
    setLeaving((prev) => new Map([...prev, ...gone]));
    for (const [key] of gone) {
      timers.current.set(
        key,
        window.setTimeout(() => {
          timers.current.delete(key);
          setLeaving((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        }, EXIT_MS),
      );
    }
    // `leaving` is read for a size bailout only; functional updates below make
    // it safe to omit from deps (avoids re-running choreography on exit ticks).
  }, [current, reduced, allowExit]);

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) window.clearTimeout(timer);
    },
    [],
  );

  useRevealList(ref, reduced, [children, leaving.size]);

  return (
    <div ref={ref} className={className}>
      {current.map((child, index) => withItemClass(child, index, reduced, stagger))}
      {[...leaving].map(([key, node]) => (
        <span key={`leaving-${key}`} className="motion-item is-visible motion-item--exit" aria-hidden="true" inert>
          {node}
        </span>
      ))}
    </div>
  );
}

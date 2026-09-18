"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollState = {
  /** Vertical scroll offset in px. */
  y: number;
  /** True once scrolled past `threshold`. Used to compact chrome / reveal sticky headers. */
  compact: boolean;
  /** "down" while scrolling down, "up" otherwise. Nav compacts on down, expands on up — never hides. */
  direction: "up" | "down";
};

/**
 * Lightweight scroll observer for floating chrome + collapsing headers.
 * Uses rAF-throttled scroll listener; transform/opacity-only consumers keep 60fps.
 */
export function useScrollState(threshold = 24): ScrollState {
  const [state, setState] = useState<ScrollState>({ y: 0, compact: false, direction: "up" });
  const lastY = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const update = () => {
      raf.current = 0;
      const y = window.scrollY;
      const previous = lastY.current;
      // Ignore sub-pixel jitter so the nav doesn't flicker.
      if (Math.abs(y - previous) < 4) return;
      lastY.current = y;
      setState((current) => {
        const direction = y > previous ? "down" : "up";
        const compact = y > threshold;
        if (current.y === y && current.compact === compact && current.direction === direction) return current;
        return { y, compact, direction };
      });
    };
    const onScroll = () => {
      if (raf.current) return;
      raf.current = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf.current) window.cancelAnimationFrame(raf.current);
    };
  }, [threshold]);

  return state;
}

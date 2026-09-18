"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/utils";
import { useReducedMotion } from "./useReducedMotion";

/**
 * FlashOnChange — briefly highlights children when `value` actually changes.
 * Mount and identical re-renders produce no highlight (unlike key-remount
 * transitions), so currency/counts never flash on every page load.
 * Reduced motion: value swaps with no highlight.
 */
export function FlashOnChange({
  value,
  children,
  className = "",
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [flash, setFlash] = useState(false);
  const first = useRef(true);
  const timer = useRef(0);

  useEffect(() => {
    if (first.current) {
      first.current = false;
    } else if (!reduced) {
      // Value changed after mount: brief highlight, then release.
      // Bailout-safe (timer clears it; no render loop).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- highlight choreography must react to value changes; timer-bounded
      setFlash(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFlash(false), 1200);
    }
  }, [value, reduced]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return <span className={cx("motion-flash", flash && "is-flash", className)}>{children}</span>;
}

"use client";

import { useEffect, type RefObject } from "react";

export const MAX_STAGGER = 6;

/**
 * Shared reveal observer: above-the-fold items appear on the next frame,
 * below-the-fold items reveal as they scroll into view (then unobserve).
 * Transform/opacity only; items past MAX_STAGGER get no cascade delay so
 * long lists (37 tasks, full history) never animate en masse.
 */
export function useRevealList(
  ref: RefObject<HTMLDivElement | null>,
  reduced: boolean,
  deps: unknown,
  selector = ":scope > .motion-item",
) {
  useEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    const items = Array.from(root.querySelectorAll(selector));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "40px 0px", threshold: 0.01 },
    );
    // Above-the-fold items: reveal on next frame with cascade.
    const frame = requestAnimationFrame(() => {
      for (const item of items) {
        const rect = (item as HTMLElement).getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          item.classList.add("is-visible");
        } else {
          observer.observe(item);
        }
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, reduced, deps]);
}

"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

export type SegmentOption = { value: string; label: string; href?: string };

/**
 * AnimatedSegment — moving selected capsule instead of hard colour switching.
 * - Button mode (`onChange`) for filters; link mode (`href`) for tabs with aria-current.
 * - Capsule glides via transform (layout-safe); falls back to static highlight pre-measure.
 * - 44px+ targets, keyboard-native (real buttons/links), screen-reader labels preserved.
 */
export function AnimatedSegment({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: SegmentOption[];
  value: string;
  onChange?: (value: string) => void;
  label: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [capsule, setCapsule] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const active = track.querySelector<HTMLElement>(`[data-segment-value="${CSS.escape(value)}"]`);
      if (!active) return;
      setCapsule({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options.length]);

  return (
    <div ref={trackRef} role={onChange ? "group" : "tablist"} aria-label={label} className={cx("motion-segment", className)}>
      <span
        aria-hidden="true"
        className="motion-segment__capsule"
        style={capsule ? { transform: `translateX(${capsule.left}px)`, width: capsule.width, opacity: 1 } : { opacity: 0 }}
      />
      {options.map((option) => {
        const active = option.value === value;
        const shared = {
          "data-segment-value": option.value,
          "aria-pressed": onChange ? active : undefined,
          "aria-current": !onChange && option.href ? (active ? ("page" as const) : undefined) : undefined,
          role: !onChange ? ("tab" as const) : undefined,
          "aria-selected": !onChange ? active : undefined,
          className: cx("motion-segment__option motion-pressable", active && "is-active"),
        };
        if (option.href && !onChange) {
          return (
            <Link key={option.value} href={option.href} {...shared}>
              {option.label}
            </Link>
          );
        }
        return (
          <button key={option.value} type="button" onClick={() => onChange?.(option.value)} {...shared}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { cx } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

/**
 * Pressable — immediate tactile feedback for every touch target.
 * Visual work is transform/opacity-only (60fps) in `motion-pressable`.
 * Use `as` to keep semantics: links stay links, rows stay buttons.
 */
export function Pressable({
  as: Tag = "div",
  className = "",
  style,
  children,
  ...rest
}: {
  as?: "div" | "button" | "span";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  [key: string]: unknown;
}) {
  return (
    <Tag className={cx("motion-pressable", className)} style={style} {...(rest as Record<string, unknown>)}>
      {children}
    </Tag>
  );
}

"use client";

import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

/**
 * StatusTransition — badges morph/crossfade instead of hard switching.
 * Keyed by `statusKey`: old badge fades/scales out while new fades in (160ms fast).
 * Use for: document scan/review badges, upload pipeline states, purchase
 * Requested→Received→Reviewed, question Open→Answered→Reopened.
 */
export function StatusTransition({
  statusKey,
  children,
  className = "",
}: {
  statusKey: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("motion-status", className)}>
      <span key={statusKey} className="motion-status__inner">
        {children}
      </span>
    </span>
  );
}

/** Upload pipeline step with connecting progress — honest states, no fake percentages. */
export function PipelineSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="motion-pipeline" aria-label="Progress">
      {steps.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className={cx(
            "motion-pipeline__step",
            index < current && "is-done",
            index === current && "is-current",
          )}
        >
          <span aria-hidden="true" className="motion-pipeline__dot" />
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

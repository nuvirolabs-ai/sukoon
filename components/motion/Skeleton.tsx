"use client";

import { cx } from "@/lib/utils";

/**
 * Skeleton — layout-matching placeholders, never generic "Loading…" text.
 * Shimmer is opacity-only; `prefers-reduced-motion` renders static blocks.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={cx("motion-skeleton", className)} />;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div aria-hidden="true" className="surface bg-white p-5">{children}</div>;
}

export function HomeSkeleton() {
  return (
    <div role="status" aria-label="Loading home" className="home-content space-y-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-11 w-48" />
      <Skeleton className="h-12 w-full !rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="h-6 w-6 !rounded-full" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-3 px-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </Card>
      ))}
    </div>
  );
}

export function VaultSkeleton() {
  return (
    <div role="status" aria-label="Loading vault" className="space-y-3 px-4">
      <div className="metric-group">
        <Card><Skeleton className="h-8 w-12" /></Card>
        <Card><Skeleton className="h-8 w-12" /></Card>
      </div>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </Card>
      ))}
    </div>
  );
}

export function ConstructionSkeleton() {
  return (
    <div role="status" aria-label="Loading construction" className="space-y-4 px-4">
      <Card>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-9 w-3/4" />
        <Skeleton className="mt-3 h-2 w-full" />
      </Card>
      {[0, 1].map((i) => (
        <Card key={i}>
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-2 h-3 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function PurchaseSkeleton() {
  return (
    <div role="status" aria-label="Loading purchase workspace" className="space-y-4 px-4">
      <Card>
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
        <div className="metric-group">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    </div>
  );
}

export function UpdatesSkeleton() {
  return (
    <div role="status" aria-label="Loading updates" className="space-y-4 px-4">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </Card>
      ))}
    </div>
  );
}

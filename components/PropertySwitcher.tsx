"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { GroupedList, ListRow, displayLabel } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { MotionSheet } from "@/components/motion/MotionSheet";
import { useStore } from "@/components/StoreProvider";

/**
 * PropertySwitcher — compact sheet for switching between passports.
 * Preserves the current section tab across properties. The current passport
 * carries a spring-animated checkmark; tapping another row navigates
 * immediately (no exit choreography on navigation).
 */
export function PropertySwitcher({ currentId, tab }: { currentId: string; tab: string }) {
  const { s } = useStore();
  const [open, setOpen] = useState(false);
  const current = s.properties.find((p) => p.id === currentId);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Switch property, current: ${current?.name ?? "unknown"}`}
        className="icon-button motion-pressable border border-line bg-white"
      >
        <ChevronsUpDown size={18} aria-hidden="true" />
      </button>
      <MotionSheet open={open} title="Switch property" onClose={() => setOpen(false)}>
        <GroupedList>
          <AnimatedList stagger={false}>
            {s.properties.map((p) => (
              <ListRow
                key={p.id}
                title={p.name}
                detail={`${p.area} · ${displayLabel(p.type)}`}
                value={p.id === currentId ? <span role="img" aria-label="Current property" className="motion-check">✓</span> : undefined}
                href={`/property/${p.id}?tab=${tab}`}
              />
            ))}
          </AnimatedList>
        </GroupedList>
        {!s.properties.length ? <p className="p-4 text-[14px] text-ink-muted">No properties yet.</p> : null}
      </MotionSheet>
    </>
  );
}

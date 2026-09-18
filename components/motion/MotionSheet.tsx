"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/utils";

/**
 * MotionSheet — high-quality mobile bottom sheet.
 * - Springs from bottom (translateY + fade, 320ms slow spring curve).
 * - Rounded top corners, drag affordance, subtle dim/blur backdrop.
 * - Restores focus to the opener, traps Tab, supports Esc + backdrop tap.
 * - Long complex flows should NOT use this — sheets are for secondary actions
 *   (Add / Filters / Edit / Share / Document actions / …).
 */
export function MotionSheet({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const opener = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; delta: number; active: boolean }>({ startY: 0, delta: 0, active: false });

  const requestClose = () => {
    if (closing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      dialog.current?.close();
      onClose();
      return;
    }
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      // Imperatively close first so the exit animation always finishes,
      // then notify the parent (which may keep us mounted or unmount us).
      dialog.current?.close();
      setClosing(false);
      onClose();
    }, 180);
  };

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      opener.current = document.activeElement as HTMLElement | null;
      el.showModal();
      // Focus the sheet heading close button first for keyboard users.
      window.requestAnimationFrame(() => {
        el.querySelector<HTMLButtonElement>("[data-sheet-close]")?.focus({ preventScroll: true });
      });
    }
    if (!open && el.open && !closing) el.close();
    if (open) {
      const prior = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prior;
      };
    }
  }, [open, closing]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Restore focus to the opener on unmount/close.
  useEffect(() => {
    if (!open && opener.current && document.contains(opener.current)) {
      opener.current.focus({ preventScroll: true });
      opener.current = null;
    }
  }, [open ]);

  const onHandlePointerDown = (event: React.PointerEvent) => {
    drag.current = { startY: event.clientY, delta: 0, active: true };
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  };
  const onHandlePointerMove = (event: React.PointerEvent) => {
    if (!drag.current.active || !sheetRef.current) return;
    const delta = Math.max(0, event.clientY - drag.current.startY);
    drag.current.delta = delta;
    sheetRef.current.style.transform = `translateY(${delta}px)`;
  };
  const onHandlePointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const sheet = sheetRef.current;
    if (sheet) sheet.style.transform = "";
    if (drag.current.delta > 96) requestClose();
    drag.current.delta = 0;
  };

  return (
    <dialog
      ref={dialog}
      className={cx("consumer-sheet motion-sheet", wide && "motion-sheet--wide", closing && "is-closing")}
      aria-labelledby={heading}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          requestClose();
          return;
        }
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]',
          ),
        ).filter((el) => el.checkVisibility() && (!el.closest("details:not([open])") || el.matches("summary")));
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
          return;
        }
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
        const href = link?.getAttribute("href");
        if (href?.startsWith("/") && !href.startsWith("/api/") && !link?.target) requestClose();
      }}
    >
      <div ref={sheetRef} className="motion-sheet__panel">
        <div
          className="motion-sheet__grabber"
          aria-hidden="true"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <span />
        </div>
        <div className="sheet-heading">
          <h2 id={heading}>{title}</h2>
          <button data-sheet-close onClick={requestClose} aria-label={`Close ${title}`} className="icon-button motion-pressable">
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">{open ? children : null}</div>
      </div>
    </dialog>
  );
}

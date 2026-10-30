"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import type { ShortcutItem } from "@/lib/favorites";

interface IOSFolderFavoritesProps {
  favoriteItems: ShortcutItem[];
  onOpenCustomize: () => void;
  renderIcon: (type: ShortcutItem["iconType"], className?: string) => React.ReactNode;
}

/**
 * iPhone-Style App Folder for My Favorites:
 * - On the home screen: Renders an authentic iOS app folder squircle with a 2x2 mini-grid of app icons.
 * - On tap: Opens a full-screen blurred iOS folder modal (identical to the native iPhone app folder experience).
 * - Inside the folder: 3-column grid of white iOS app squircles with clean labels and quick access.
 */
export function IOSFolderFavorites({
  favoriteItems,
  onOpenCustomize,
  renderIcon,
}: IOSFolderFavoritesProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close folder on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // First 4 items to show inside the closed folder icon
  const previewItems = favoriteItems.slice(0, 4);

  return (
    <section aria-label="My Favorites" className="mb-4">
      {/* Header Row: Section Label + Customize */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[#3D6650] text-[12px] leading-none select-none">✦</span>
          <h2 className="text-[11px] font-bold tracking-[0.12em] text-[#5A6E63] uppercase">
            My Favorites
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-sand/80 border border-[#DDD6C8] text-[10px] font-semibold text-[#3D5A4A]">
            {favoriteItems.length} {favoriteItems.length === 1 ? "App" : "Apps"}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCustomize}
          className="tap-scale inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-forest border border-[#D8D0C2] text-[11px] font-bold shadow-2xs hover:shadow-xs transition-all"
        >
          <SlidersHorizontal size={11} className="text-forest/80" />
          <span>Customize</span>
        </button>
      </div>

      {/* Closed iOS Folder Icon on Home Screen */}
      <div className="flex flex-col items-center justify-center py-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open My Favorites Folder"
          className="tap-scale group flex flex-col items-center focus:outline-none"
        >
          {/* iOS Frosted Glass Folder Squircle */}
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-[22px] bg-[#EFE9DF]/80 backdrop-blur-md border border-white/70 shadow-[0_4px_16px_rgba(27,61,47,0.06)] p-2.5 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
            {/* 2x2 Mini App Previews Grid Inside the Folder */}
            <div className="grid grid-cols-2 gap-1.5 w-full h-full">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="w-full h-full rounded-[6px] bg-white shadow-2xs flex items-center justify-center overflow-hidden"
                  style={{ color: item.color }}
                >
                  {renderIcon(item.iconType, "w-3.5 h-3.5")}
                </div>
              ))}
              {/* Fill remaining slots if fewer than 4 */}
              {Array.from({ length: Math.max(0, 4 - previewItems.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-full h-full rounded-[6px] bg-white/50 border border-dashed border-[#D2C8B8] flex items-center justify-center text-[#9AA8A0]"
                >
                  <Plus size={10} />
                </div>
              ))}
            </div>
          </div>

          {/* Folder Label */}
          <span className="text-[13px] font-bold text-[#1B2922] mt-2 block group-hover:text-forest transition-colors text-center">
            My Favorites
          </span>
          <span className="text-[10.5px] font-medium text-[#7C8B82] leading-tight block text-center mt-0.5">
            Tap to open folder
          </span>
        </button>
      </div>

      {/* EXPANDED FULL-SCREEN BLURRED iPHONE FOLDER MODAL */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="My Favorites Folder"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-5 bg-black/55 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          {/* Top Folder Header */}
          <div
            className="w-full max-w-[340px] flex items-center justify-between mb-5 px-2 select-none animate-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[26px] sm:text-[28px] font-bold text-white tracking-tight drop-shadow-md">
              My Favorites
            </h3>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white/90 hover:text-white backdrop-blur-md transition-all"
              aria-label="Close folder"
            >
              <X size={18} />
            </button>
          </div>

          {/* Expanded iOS Folder Container */}
          <div
            className="w-full max-w-[340px] rounded-[36px] bg-white/35 dark:bg-black/30 backdrop-blur-2xl border border-white/40 shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-6 sm:p-7 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 3-Column iOS App Icons Grid (Matching the iPhone screenshot) */}
            <div className="grid grid-cols-3 gap-y-6 gap-x-4">
              {favoriteItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="tap-scale group flex flex-col items-center text-center focus:outline-none"
                >
                  {/* iOS App Squircle Tile */}
                  <div
                    className="w-15 h-15 sm:w-16 sm:h-16 rounded-[18px] bg-white shadow-md flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
                    style={{ color: item.color }}
                  >
                    {renderIcon(item.iconType, "w-8 h-8")}
                  </div>

                  {/* App Name Label */}
                  <span className="text-[11.5px] sm:text-[12px] font-medium text-white/95 text-center leading-tight mt-1.5 block truncate max-w-full drop-shadow-sm group-hover:text-white">
                    {item.title}
                  </span>
                </Link>
              ))}

              {/* Add / Customize Shortcut Slot */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCustomize();
                }}
                className="tap-scale group flex flex-col items-center text-center focus:outline-none"
              >
                {/* Frosted Squircle for Customize */}
                <div className="w-15 h-15 sm:w-16 sm:h-16 rounded-[18px] bg-white/25 hover:bg-white/35 border border-white/40 shadow-sm flex items-center justify-center text-white transition-all duration-200 group-hover:scale-105 group-active:scale-95">
                  <Plus size={24} strokeWidth={2.4} />
                </div>

                <span className="text-[11.5px] sm:text-[12px] font-medium text-white/95 text-center leading-tight mt-1.5 block drop-shadow-sm group-hover:text-white">
                  Customize
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Tap Outside Hint */}
          <p className="text-[11px] font-medium text-white/60 mt-6 select-none animate-in fade-in duration-300">
            Tap outside to close
          </p>
        </div>
      )}
    </section>
  );
}

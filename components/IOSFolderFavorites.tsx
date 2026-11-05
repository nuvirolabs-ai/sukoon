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
 * Designer-Engineered iOS App Folder & Favorites Suite:
 * - Solves the blank page issue by framing favorites inside an Apple Frosted Glass Card (`rounded-[26px]`).
 * - Features the interactive iOS App Folder squircle (with 2x2 mini live app previews) alongside the top 3 quick-launch apps in a 4-column shelf.
 * - On tap, the folder expands into the signature full-screen blurred iPhone folder modal with a 3-column app grid.
 */
export function IOSFolderFavorites({
  favoriteItems,
  onOpenCustomize,
  renderIcon,
}: IOSFolderFavoritesProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close folder on Escape key & manage scroll lock
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

  // First 4 items for the closed folder's 2x2 preview grid
  const previewItems = favoriteItems.slice(0, 4);

  // Up to 3 top apps to show alongside the folder on the home screen shelf
  const quickApps = favoriteItems.slice(0, 3);

  return (
    <section aria-label="My Favorites" className="mb-4">
      {/* Apple Frosted Glass Card Container */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-4.5 sm:p-5 border border-[#E9DCCF] shadow-[0_8px_30px_rgba(25,90,80,0.05)]">
        {/* Header Row: Subtle Jewel Indicator + Count + Customize */}
        <div className="flex items-center justify-between mb-3.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[#EB725B] text-[12px] leading-none select-none">✦</span>
            <h2 className="text-[11px] font-bold tracking-[0.1em] text-[#195A50] uppercase">
              My Favorites
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#F6C6AF] border border-[#E9DCCF] text-[10px] font-bold text-[#195A50]">
              {favoriteItems.length} {favoriteItems.length === 1 ? "App" : "Apps"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenCustomize}
            className="tap-scale inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FFF7EF] text-[#195A50] border border-[#E9DCCF] text-[11px] font-bold shadow-2xs hover:shadow-xs transition-all"
          >
            <SlidersHorizontal size={12} className="text-[#195A50]" />
            <span>Customize</span>
          </button>
        </div>

        {/* 4-Column iOS App Shelf: Interactive Folder + Top 3 Quick Apps */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 items-start">
          {/* 1. THE iPHONE APP FOLDER (Interactive) */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open My Favorites Folder"
            className="tap-scale group flex flex-col items-center text-center focus:outline-none"
          >
            {/* iOS Folder Squircle */}
            <div className="relative w-14 h-14 sm:w-15 sm:h-15 rounded-[18px] bg-[#FBEBE2] border border-[#E9DCCF] shadow-[0_4px_14px_rgba(25,90,80,0.06)] p-1.5 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_8px_20px_rgba(25,90,80,0.14)]">
              {/* 2x2 Mini Preview Grid */}
              <div className="grid grid-cols-2 gap-1 w-full h-full">
                {previewItems.map((item) => (
                  <div
                    key={item.id}
                    className="w-full h-full rounded-[5px] bg-white shadow-2xs flex items-center justify-center overflow-hidden"
                    style={{ color: item.color }}
                  >
                    {renderIcon(item.iconType, "w-2.5 h-2.5")}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - previewItems.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-full h-full rounded-[5px] bg-white/40 flex items-center justify-center text-[#9AA8A0]"
                  >
                    <Plus size={8} />
                  </div>
                ))}
              </div>
            </div>

            {/* Folder Label */}
            <span className="text-[11px] font-bold text-[#195A50] mt-1.5 leading-tight block truncate max-w-full group-hover:text-[#EB725B] transition-colors">
              Favorites
            </span>
            <span className="text-[9px] font-medium text-[#7D8C83] leading-tight block truncate max-w-full mt-0.5">
              Open folder
            </span>
          </button>

          {/* 2, 3, 4. DIRECT QUICK-LAUNCH APPS */}
          {quickApps.map((item) => {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="tap-scale group flex flex-col items-center text-center focus:outline-none"
              >
                {/* iOS App Squircle */}
                <div
                  className="w-14 h-14 sm:w-15 sm:h-15 rounded-[18px] bg-[#FBEBE2] border border-[#E9DCCF] shadow-[0_4px_14px_rgba(25,90,80,0.06)] flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_8px_20px_rgba(25,90,80,0.12)]"
                  style={{ color: item.color }}
                >
                  {renderIcon(item.iconType, "w-6 h-6")}
                </div>

                {/* App Title */}
                <span className="text-[11px] font-bold text-[#195A50] mt-1.5 leading-tight block truncate max-w-full group-hover:text-[#EB725B] transition-colors">
                  {item.title}
                </span>
                <span className="text-[9px] font-medium text-[#7D8C83] leading-tight block truncate max-w-full mt-0.5">
                  {item.subtitle}
                </span>
              </Link>
            );
          })}

          {/* If user has fewer than 3 quick apps, show Add Shortcut button */}
          {quickApps.length < 3 && (
            <button
              type="button"
              onClick={onOpenCustomize}
              className="tap-scale group flex flex-col items-center text-center focus:outline-none"
            >
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-[18px] bg-white/60 border border-dashed border-[#E9DCCF] hover:border-[#195A50]/50 hover:bg-white shadow-2xs flex items-center justify-center text-[#7D8C83] group-hover:text-[#195A50] transition-all">
                <Plus size={18} />
              </div>
              <span className="text-[11px] font-bold text-[#195A50] mt-1.5 leading-tight block truncate max-w-full group-hover:text-[#EB725B]">
                Add
              </span>
              <span className="text-[9px] font-medium text-[#7D8C83] leading-tight block truncate max-w-full mt-0.5">
                New app
              </span>
            </button>
          )}
        </div>

        {/* Bottom Subtle Folder Hint */}
        <div className="mt-4 pt-3 border-t border-[#E9DCCF] flex items-center justify-between text-[10.5px] text-[#7D8C83] px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#195A50]" />
            <span>Tap <strong>Favorites folder</strong> to view full suite</span>
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="tap-scale text-[#EB725B] font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Expand</span>
            <span>↗</span>
          </button>
        </div>
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

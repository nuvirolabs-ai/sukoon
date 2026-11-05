"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, SlidersHorizontal, Sparkles } from "lucide-react";
import type { ShortcutItem } from "@/lib/favorites";

interface AtelierFavoritesProps {
  favoriteItems: ShortcutItem[];
  onOpenCustomize: () => void;
  renderIcon: (type: ShortcutItem["iconType"], className?: string) => React.ReactNode;
}

/**
 * Atelier Curated Tray:
 * An ultra-refined, calm Apple-grade favorites widget tailored to Sukoon's luxury aesthetic.
 * - Gentle porcelain-sand tray container that clearly differentiates from the core icons above.
 * - Snug Apple-rounded cards that hug the icon and text without dead vertical height.
 * - Subtle luxury launch arrow (↗) and tone-on-tone jewel badges.
 */
export function AtelierFavorites({
  favoriteItems,
  onOpenCustomize,
  renderIcon,
}: AtelierFavoritesProps) {
  return (
    <section aria-label="My Favorites" className="mb-4">
      {/* Refined Atelier Sculpted Tray */}
      <div className="bg-gradient-to-b from-[#F3EFE7]/90 via-[#EFE9DF]/80 to-[#ECE5DA]/90 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-[#E3DCD0] shadow-[0_4px_20px_rgba(27,61,47,0.03)]">
        {/* Header Row: Refined Jewel Emblem + Count + Customize */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[#3D6650] text-[12px] leading-none select-none">✦</span>
            <h2 className="text-[11px] font-bold tracking-[0.12em] text-[#5A6E63] uppercase">
              My Favorites
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-white/80 border border-[#DDD6C8] text-[10px] font-semibold text-[#3D5A4A] shadow-2xs">
              {favoriteItems.length} {favoriteItems.length === 1 ? "Saved" : "Saved"}
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

        {/* Snug Apple-Rounded Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {favoriteItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="tap-scale group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-white border border-[#E7E2D6] hover:border-forest/40 hover:shadow-xs transition-all overflow-hidden"
            >
              {/* Top Row: Icon Disc + Micro Launch Arrow */}
              <div className="flex items-start justify-between w-full">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0"
                  style={{ backgroundColor: `${item.color}14`, color: item.color }}
                >
                  {renderIcon(item.iconType, "w-4.5 h-4.5")}
                </div>

                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#A6B4AB] group-hover:text-forest transition-colors">
                  <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>

              {/* Bottom Row: Snug Title & Whisper Subtitle */}
              <div className="mt-2 min-w-0">
                <span className="text-[12.5px] font-bold text-[#1A2821] leading-snug block truncate group-hover:text-forest transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] sm:text-[10.5px] font-medium text-[#76877D] leading-tight block truncate mt-0.5">
                  {item.subtitle}
                </span>
              </div>
            </Link>
          ))}

          {/* Add Shortcut Card */}
          <button
            type="button"
            onClick={onOpenCustomize}
            className="tap-scale group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-white/50 border border-dashed border-[#D2C8B8] hover:border-forest/50 hover:bg-white text-left transition-all"
          >
            {/* Top Row: Plus Disc + New Tag */}
            <div className="flex items-start justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-black/[0.04] group-hover:bg-forest/10 flex items-center justify-center text-[#76877D] group-hover:text-forest transition-all shrink-0">
                <Plus size={15} />
              </div>

              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A9B91] bg-black/[0.03] px-1.5 py-0.5 rounded-md">
                Add
              </span>
            </div>

            {/* Bottom Row: Snug Title & Description */}
            <div className="mt-2 min-w-0">
              <span className="text-[12.5px] font-bold text-[#1A2821] leading-snug block group-hover:text-forest transition-colors">
                Add Shortcut
              </span>
              <span className="text-[10px] sm:text-[10.5px] font-medium text-[#76877D] leading-tight block mt-0.5">
                Pick feature
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}

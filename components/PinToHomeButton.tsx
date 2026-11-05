"use client";

import { useState } from "react";
import { Star, Check } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

export function PinToHomeButton({ shortcutId }: { shortcutId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const pinned = isFavorite(shortcutId);
  const [toast, setToast] = useState<string | null>(null);

  const handleToggle = () => {
    const nextState = !pinned;
    toggleFavorite(shortcutId);
    setToast(nextState ? "Pinned to Home Favorites!" : "Removed from Home");
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        className={`tap-scale inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
          pinned
            ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
            : "bg-white border-line text-ink-muted hover:border-forest/40 hover:text-foreground"
        }`}
        title={pinned ? "Remove from Home Screen" : "Pin this feature to Home Screen"}
      >
        <Star
          size={12}
          className={pinned ? "fill-amber-400 text-amber-500" : "text-ink-muted"}
        />
        <span>{pinned ? "Pinned to Home" : "Pin to Home"}</span>
      </button>

      {toast && (
        <div className="absolute right-0 top-full mt-1.5 z-40 px-2.5 py-1 rounded-lg bg-foreground text-white text-[10px] font-semibold whitespace-nowrap shadow-md flex items-center gap-1 animate-in fade-in duration-150">
          <Check size={11} className="text-mint" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

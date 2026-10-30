"use client";

import { useEffect, useState } from "react";

export interface ShortcutItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  color: string;
  category: "Vault" | "Construction" | "Buy & Sell" | "Insights";
  iconType:
    | "guidelines"
    | "post-deal"
    | "rates"
    | "accounts"
    | "journey"
    | "site"
    | "dictionary"
    | "drafts"
    | "media"
    | "docs"
    | "details"
    | "portfolio"
    | "single-paper"
    | "buy";
}

export const ALL_AVAILABLE_SHORTCUTS: ShortcutItem[] = [
  {
    id: "guidelines",
    title: "Guidelines",
    subtitle: "Rules & Checklist",
    href: "/buy-sell?section=listing",
    color: "#1E5637",
    category: "Buy & Sell",
    iconType: "guidelines",
  },
  {
    id: "post-deal",
    title: "Post a deal",
    subtitle: "Sell or List Property",
    href: "/buy-sell?section=sell",
    color: "#B26315",
    category: "Buy & Sell",
    iconType: "post-deal",
  },
  {
    id: "accounts",
    title: "Expense Notebook",
    subtitle: "Construction Accounts",
    href: "/construction?section=accounts",
    color: "#1E5637",
    category: "Construction",
    iconType: "accounts",
  },
  {
    id: "rates",
    title: "Material Rates",
    subtitle: "Daily Mandi & Estimator",
    href: "/construction?section=rates",
    color: "#B26315",
    category: "Construction",
    iconType: "rates",
  },
  {
    id: "journey",
    title: "0 to 1 Build",
    subtitle: "28-Step Roadmap",
    href: "/construction?section=journey",
    color: "#B26315",
    category: "Construction",
    iconType: "journey",
  },
  {
    id: "site",
    title: "Site Work Log",
    subtitle: "Inspection Checklist",
    href: "/construction?section=site",
    color: "#1E57A4",
    category: "Construction",
    iconType: "site",
  },
  {
    id: "dictionary",
    title: "Property Terms",
    subtitle: "Real Estate Dictionary",
    href: "/updates?section=dictionary",
    color: "#553C9A",
    category: "Insights",
    iconType: "dictionary",
  },
  {
    id: "drafts",
    title: "Legal Drafting",
    subtitle: "Agreements & Contracts",
    href: "/updates?section=drafts",
    color: "#1E5637",
    category: "Insights",
    iconType: "drafts",
  },
  {
    id: "media",
    title: "Audio & Blogs",
    subtitle: "Expert Podcasts",
    href: "/updates?section=media",
    color: "#553C9A",
    category: "Insights",
    iconType: "media",
  },
  {
    id: "docs",
    title: "All Documents",
    subtitle: "Registry, Tax & Mutation",
    href: "/vault?section=docs",
    color: "#1E5637",
    category: "Vault",
    iconType: "docs",
  },
  {
    id: "details",
    title: "Property Details",
    subtitle: "Khasra, Area & GPS",
    href: "/vault?section=details",
    color: "#1E57A4",
    category: "Vault",
    iconType: "details",
  },
  {
    id: "portfolio",
    title: "Portfolio Summary",
    subtitle: "₹4.85 Cr Valuation",
    href: "/vault?section=portfolio",
    color: "#B26315",
    category: "Vault",
    iconType: "portfolio",
  },
  {
    id: "single-paper",
    title: "Paper Lookup",
    subtitle: "Instant Document Finder",
    href: "/vault?section=single",
    color: "#553C9A",
    category: "Vault",
    iconType: "single-paper",
  },
  {
    id: "buy",
    title: "Buy Verified",
    subtitle: "Direct Deals Stream",
    href: "/buy-sell?section=buy",
    color: "#1E57A4",
    category: "Buy & Sell",
    iconType: "buy",
  },
];

const STORAGE_KEY = "sukoon_home_favorites_v2";
const DEFAULT_FAVORITE_IDS = ["guidelines", "post-deal"];

export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return DEFAULT_FAVORITE_IDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FAVORITE_IDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_FAVORITE_IDS;
}

export function saveFavoriteIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("sukoon-favorites-updated"));
  } catch {}
}

export function toggleFavoriteId(id: string): boolean {
  const current = getFavoriteIds();
  const exists = current.includes(id);
  const next = exists ? current.filter((item) => item !== id) : [...current, id];
  saveFavoriteIds(next);
  return !exists;
}

export function isFavoriteId(id: string): boolean {
  return getFavoriteIds().includes(id);
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(DEFAULT_FAVORITE_IDS);

  useEffect(() => {
    setFavoriteIds(getFavoriteIds());
    const handler = () => {
      setFavoriteIds(getFavoriteIds());
    };
    window.addEventListener("sukoon-favorites-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sukoon-favorites-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const favoriteItems = favoriteIds
    .map((id) => ALL_AVAILABLE_SHORTCUTS.find((s) => s.id === id))
    .filter((s): s is ShortcutItem => Boolean(s));

  return {
    favoriteIds,
    favoriteItems,
    toggleFavorite: (id: string) => {
      toggleFavoriteId(id);
      setFavoriteIds(getFavoriteIds());
    },
    isFavorite: (id: string) => favoriteIds.includes(id),
  };
}

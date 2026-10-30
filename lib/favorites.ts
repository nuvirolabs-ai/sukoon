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
    | "matchmaking"
    | "trending"
    | "power-docs"
    | "buy"
    | "news"
    | "blogs"
    | "dos-donts"
    | "podcasts"
    | "vastu"
    | "trends"
    | "dealers"
    | "architects"
    | "engineers"
    | "plans";
}

export const ALL_AVAILABLE_SHORTCUTS: ShortcutItem[] = [
  // --- Buy & Sell Hub Shortcuts ---
  {
    id: "matchmaking",
    title: "Matchmaker",
    subtitle: "Buy / Sell Match",
    href: "/buy-sell?section=matchmaking",
    color: "#1E57A4",
    category: "Buy & Sell",
    iconType: "matchmaking",
  },
  {
    id: "post-deal",
    title: "Post a deal",
    subtitle: "Direct Seller Listing",
    href: "/buy-sell?section=post-deals",
    color: "#B26315",
    category: "Buy & Sell",
    iconType: "post-deal",
  },
  {
    id: "trending",
    title: "Trending Deals",
    subtitle: "Area & Society Deals",
    href: "/buy-sell?section=trending",
    color: "#1E5637",
    category: "Buy & Sell",
    iconType: "trending",
  },
  {
    id: "power-docs",
    title: "Power Docs",
    subtitle: "EMI, Loans & Drafts",
    href: "/buy-sell?section=power-docs",
    color: "#553C9A",
    category: "Buy & Sell",
    iconType: "power-docs",
  },
  {
    id: "guidelines",
    title: "Guidelines",
    subtitle: "Rules & Checklist",
    href: "/buy-sell?section=power-docs",
    color: "#1E5637",
    category: "Buy & Sell",
    iconType: "guidelines",
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

  // --- Vault Hub Shortcuts ---
  {
    id: "docs",
    title: "My Docs",
    subtitle: "Upload & Health Score",
    href: "/vault?section=docs",
    color: "#1E5637",
    category: "Vault",
    iconType: "docs",
  },
  {
    id: "portfolio",
    title: "Property Portfolio",
    subtitle: "Net Worth & Value",
    href: "/vault?section=portfolio",
    color: "#B26315",
    category: "Vault",
    iconType: "portfolio",
  },
  {
    id: "details",
    title: "Manage Properties",
    subtitle: "Receipts, Bills & Repairs",
    href: "/vault?section=manage",
    color: "#1E57A4",
    category: "Vault",
    iconType: "details",
  },
  {
    id: "single-paper",
    title: "Find a Paper",
    subtitle: "Keyword Search",
    href: "/vault?section=single",
    color: "#553C9A",
    category: "Vault",
    iconType: "single-paper",
  },

  // --- Construction Shortcuts ---
  {
    id: "journey",
    title: "Build journey",
    subtitle: "28 Steps & Roadmap",
    href: "/construction?section=journey",
    color: "#B26315",
    category: "Construction",
    iconType: "journey",
  },
  {
    id: "site",
    title: "Site visit minutes",
    subtitle: "Notes for Architect & Team",
    href: "/construction?section=site",
    color: "#1E57A4",
    category: "Construction",
    iconType: "site",
  },
  {
    id: "accounts",
    title: "Expenses notebook",
    subtitle: "Smart Material Folders",
    href: "/construction?section=accounts",
    color: "#1E5637",
    category: "Construction",
    iconType: "accounts",
  },
  {
    id: "rates",
    title: "Material rates",
    subtitle: "Daily Mandi & City Rates",
    href: "/construction?section=rates",
    color: "#553C9A",
    category: "Construction",
    iconType: "rates",
  },
  {
    id: "dealers",
    title: "Dealers",
    subtitle: "Material Suppliers",
    href: "/construction?section=dealers",
    color: "#B26315",
    category: "Construction",
    iconType: "dealers",
  },
  {
    id: "architects",
    title: "Architects",
    subtitle: "COA Listed Architects",
    href: "/construction?section=architects",
    color: "#0D7490",
    category: "Construction",
    iconType: "architects",
  },
  {
    id: "engineers",
    title: "Civil engineers",
    subtitle: "Structural Consultants",
    href: "/construction?section=engineers",
    color: "#C05621",
    category: "Construction",
    iconType: "engineers",
  },
  {
    id: "plans",
    title: "Layout Plans",
    subtitle: "3D Elevations & Custom",
    href: "/construction?section=plans",
    color: "#319795",
    category: "Construction",
    iconType: "plans",
  },

  // --- Insights Shortcuts (All 7 Features) ---
  {
    id: "news",
    title: "City News",
    subtitle: "Live Daily Updates",
    href: "/updates?section=news",
    color: "#1E57A4",
    category: "Insights",
    iconType: "news",
  },
  {
    id: "blogs",
    title: "Daily Blogs",
    subtitle: "Market Guides & Articles",
    href: "/updates?section=blogs",
    color: "#B26315",
    category: "Insights",
    iconType: "blogs",
  },
  {
    id: "dictionary",
    title: "Terminologies",
    subtitle: "Real Estate Dictionary",
    href: "/updates?section=dictionary",
    color: "#553C9A",
    category: "Insights",
    iconType: "dictionary",
  },
  {
    id: "dos-donts",
    title: "Do's & Don'ts",
    subtitle: "Buyer Checkpoints",
    href: "/updates?section=dos-donts",
    color: "#1E5637",
    category: "Insights",
    iconType: "dos-donts",
  },
  {
    id: "podcasts",
    title: "Podcasts & Videos",
    subtitle: "YouTube Audio & Guides",
    href: "/updates?section=podcasts",
    color: "#DC2626",
    category: "Insights",
    iconType: "podcasts",
  },
  {
    id: "vastu",
    title: "Vastu Knowledge",
    subtitle: "Directional & Room Guide",
    href: "/updates?section=vastu",
    color: "#D97706",
    category: "Insights",
    iconType: "vastu",
  },
  {
    id: "trends",
    title: "City Trends",
    subtitle: "Big Developer Tracker",
    href: "/updates?section=trends",
    color: "#0D9488",
    category: "Insights",
    iconType: "trends",
  },
  {
    id: "drafts",
    title: "Legal Drafting",
    subtitle: "Agreements & Contracts",
    href: "/buy-sell?section=power-docs",
    color: "#1E5637",
    category: "Insights",
    iconType: "drafts",
  },
  {
    id: "media",
    title: "Audio & Blogs",
    subtitle: "Expert Podcasts",
    href: "/updates?section=podcasts",
    color: "#553C9A",
    category: "Insights",
    iconType: "media",
  },
];

const STORAGE_KEY = "sukoon_home_favorites_v3";
const DEFAULT_FAVORITE_IDS = ["matchmaking", "post-deal", "trending", "power-docs"];

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

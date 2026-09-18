export const HOME_CATEGORIES = [
  { key: "vault", label: "Vault", href: "/vault", scope: "Phase-1 destination" },
  { key: "construction", label: "Construction", href: "/construction", scope: "Owner-entered construction projects" },
  { key: "buy-sell", label: "Buy / Sell", href: "/buy-sell", scope: "Guidance only; no public marketplace" },
  { key: "updates", label: "Updates", href: "/updates", scope: "Recorded reminders and approved education" },
] as const;

export const PROPERTY_TABS = ["overview", "vault", "bills", "rent", "maint", "timeline", "share", "export", "ai"] as const;
export function propertyTab(value: string | null) {
  return PROPERTY_TABS.find((tab) => tab === value) ?? "overview";
}

export const PRIMARY_NAVIGATION = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "Add property", href: "/property/new" },
  { label: "Explore", href: "/search" },
  { label: "More", href: "/more" },
] as const;

export const SECONDARY_DESTINATIONS = [
  { label: "Profile", href: "/profile" },
  { label: "Reminders", href: "/reminders" },
  { label: "Vault", href: "/vault" },
  { label: "Updates", href: "/updates" },
  { label: "Shared with me", href: "/shared" },
] as const;

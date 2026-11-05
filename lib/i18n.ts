export const STR: Record<string, { en: string; hi: string }> = {
  home: { en: "Home", hi: "Home" },
  properties: { en: "Properties", hi: "Properties" },
  explore: { en: "Explore", hi: "Explore" },
  more: { en: "More", hi: "More" },
  attention: { en: "Needs attention", hi: "Needs attention" },
  portfolio: { en: "Portfolio", hi: "Portfolio" },
  totalDue: { en: "Due this month", hi: "Due this month" },
  viewAll: { en: "View all", hi: "View all" },
  estate: { en: "Property & Build", hi: "Property & Build" },
  market: { en: "Deals & Market", hi: "Deals & Market" },
  addProperty: { en: "+ Add", hi: "+ Add" },
};

export function t(key: keyof typeof STR, lang: "en" | "hi") {
  return STR[key]?.[lang] ?? key;
}

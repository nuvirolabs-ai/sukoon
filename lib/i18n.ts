export const STR: Record<string, { en: string; hi: string }> = {
  home: { en: "Home", hi: "होम" },
  properties: { en: "Properties", hi: "प्रॉपर्टी" },
  explore: { en: "Explore", hi: "खोजें" },
  more: { en: "More", hi: "और" },
  attention: { en: "Needs attention", hi: "ध्यान दें" },
  portfolio: { en: "Portfolio", hi: "पोर्टफोलियो" },
  totalDue: { en: "Due this month", hi: "इस माह बकाया" },
  viewAll: { en: "View all", hi: "सभी देखें" },
  addProperty: { en: "+ Add", hi: "+ जोड़ें" },
};

export function t(key: keyof typeof STR, lang: "en" | "hi") {
  return STR[key]?.[lang] ?? key;
}

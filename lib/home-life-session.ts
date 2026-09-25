/** Browser-session life pick. Not a stored preference. */
export const HOME_LIFE_SESSION_KEY = "sukoon.home.life";

export function shortLabel(title: string): string {
  let text = title.split("—")[0]?.split("–")[0]?.trim() ?? title.trim();
  text = text.replace(/\s+(house|apartment|plot|flat|villa|residency)$/i, "").trim();
  text = text.replace(/^Super\s+/i, "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && /^nagar$/i.test(words[1] ?? "")) return `${words[0]} ${words[1]}`;
  return words[0] || title;
}

export function resolveSelectedLifeId(
  lifeIds: readonly string[],
  sessionId: string | null,
  defaultLifeId: string | null,
): string | null {
  if (sessionId && lifeIds.includes(sessionId)) return sessionId;
  if (defaultLifeId && lifeIds.includes(defaultLifeId)) return defaultLifeId;
  return lifeIds[0] ?? null;
}

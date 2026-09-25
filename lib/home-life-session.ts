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

export function otherPlaces<T extends { id: string; place: unknown }>(lives: readonly T[], selectedId: string | null): Array<T["place"]> {
  return lives.filter((life) => life.id !== selectedId).map((life) => life.place);
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

function plain(value: string): string {
  return value.replace(/[.]+$/g, "").trim().toLowerCase();
}

/** What the primary card draws. A date-only reason stays meta. Extra words come only from the reason. */
export function primaryAskLines(
  ask: { title: string; reason: string; meta: string | null },
  headline: string | null | undefined,
): { title: string | null; reason: string | null; meta: string | null } {
  const title = ask.title.trim();
  const headlineRestates = Boolean(headline && title && plain(headline) === plain(`${title} is still open`));
  const meta = ask.meta?.trim() || null;
  const reason = ask.reason?.trim() || null;
  const reasonIsDate = Boolean(reason && meta && plain(reason) === plain(meta));
  return {
    title: headlineRestates ? null : title || null,
    reason: reasonIsDate ? null : reason,
    meta: reasonIsDate ? meta : null,
  };
}

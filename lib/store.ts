import type { AppState } from "./types";

/**
 * A new account starts empty. The previous implementation seeded sample
 * properties and bills into every browser, which made fixture data look like
 * an owner's records and was not safe to carry into an authenticated flow.
 */
export function emptyState(): AppState {
  return {
    properties: [],
    docs: [],
    bills: [],
    maintenance: [],
    timeline: [],
    shares: [],
    listings: [],
    projects: [],
    tenants: [],
    bookings: [],
    reminders: [],
    lang: "en",
    referralCode: "",
  };
}

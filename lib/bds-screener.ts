import bdsList from "./bds-list.json";

export interface BdsEntry {
  ticker: string;
  companyName: string;
  companyAliases: string[];
  category: "BDS Official" | "AFSC Investigate" | string;
  reason: string;
  source: string;
  lastVerified: string;
}

const companies: BdsEntry[] = (bdsList as { companies: BdsEntry[] }).companies;

const byTicker: Map<string, BdsEntry> = new Map();
for (const entry of companies) {
  if (entry.ticker) byTicker.set(entry.ticker.toUpperCase(), entry);
}

/**
 * Returns the BDS entry for a ticker, or null if not listed.
 * Matching is case-insensitive and exact on ticker.
 */
export function checkBdsStatus(ticker: string | null | undefined): BdsEntry | null {
  if (!ticker) return null;
  return byTicker.get(ticker.toUpperCase()) ?? null;
}

/**
 * Returns the full list — used by the chat route to inject exclusion context
 * into the system prompt when the user has the filter on.
 */
export function getBdsList(): BdsEntry[] {
  return companies;
}

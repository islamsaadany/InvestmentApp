import { NextRequest, NextResponse } from "next/server";

/**
 * Free historical USD/EGP rates via fawazahmed0/exchange-api.
 * No API key. Covers EGP back to early 2024.
 *
 * Multiple URL forms tried in order — date is YYYY-MM-DD:
 *   1. https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@<date>/v1/currencies/usd.json
 *   2. https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@<date>/v1/currencies/usd.min.json
 *   3. https://<date>.currency-api.pages.dev/v1/currencies/usd.json
 */
function buildUrls(date: string): string[] {
  return [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.min.json`,
    `https://${date}.currency-api.pages.dev/v1/currencies/usd.json`,
  ];
}

const cache = new Map<string, { rate: number; cachedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchRateForDate(date: string): Promise<number | null> {
  for (const url of buildUrls(date)) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const rate = json?.usd?.egp;
      if (typeof rate === "number" && rate > 0) return rate;
    } catch {
      // try next url
    }
  }
  return null;
}

/**
 * GET /api/market/historical-egp-rate?date=YYYY-MM-DD
 * Returns the USD→EGP rate for the given date. Cached 24h in-memory.
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date query param required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const queryDate = date > today ? today : date;

  const cached = cache.get(queryDate);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ date: queryDate, rate: cached.rate, source: "cache" });
  }

  const rate = await fetchRateForDate(queryDate);
  if (rate == null) {
    return NextResponse.json(
      { error: "Could not fetch historical EGP rate for that date — try a slightly different date or enter manually" },
      { status: 502 }
    );
  }

  cache.set(queryDate, { rate, cachedAt: Date.now() });
  return NextResponse.json({ date: queryDate, rate, source: "fawazahmed0" });
}

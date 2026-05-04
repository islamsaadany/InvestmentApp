import { NextRequest, NextResponse } from "next/server";

const FRANKFURTER_BASE = "https://api.frankfurter.app";

const cache = new Map<string, { rate: number; cachedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — historical rates don't change

/**
 * GET /api/market/historical-egp-rate?date=YYYY-MM-DD
 * Returns the USD→EGP exchange rate for the given date using Frankfurter (free, ECB-based).
 * Note: ECB rates may differ from local Egyptian market/parallel rates.
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date query param required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Cap at today
  const today = new Date().toISOString().split("T")[0];
  const queryDate = date > today ? today : date;

  const cached = cache.get(queryDate);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ date: queryDate, rate: cached.rate, source: "cache" });
  }

  try {
    const url = `${FRANKFURTER_BASE}/${queryDate}?from=USD&to=EGP`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Frankfurter responded ${res.status}` },
        { status: 502 }
      );
    }
    const json = await res.json();
    const rate = json?.rates?.EGP;
    if (typeof rate !== "number" || rate <= 0) {
      return NextResponse.json(
        { error: "Frankfurter returned no EGP rate" },
        { status: 502 }
      );
    }
    cache.set(queryDate, { rate, cachedAt: Date.now() });
    return NextResponse.json({ date: json.date || queryDate, rate, source: "frankfurter" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

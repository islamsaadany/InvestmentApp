import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHistoricalPrices } from "@/lib/market-data";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

/**
 * GET /api/analysis/price-history?symbols=BTC,GOLD&period=30d
 *   → DB-backed history for owned assets (uses snapshotted assetPriceHistory).
 *
 * GET /api/analysis/price-history?ticker=MSFT&assetType=us_stock&period=3m
 *   → Live history for any ticker (used by Expert recommendation cards).
 *     Bypasses DB and fetches directly from Yahoo Finance / CoinGecko.
 */
export async function GET(req: NextRequest) {
  try {
    const tickerParam = req.nextUrl.searchParams.get("ticker");
    const assetTypeParam = req.nextUrl.searchParams.get("assetType");
    const symbolsParam = req.nextUrl.searchParams.get("symbols") || "";
    const period = req.nextUrl.searchParams.get("period") || "30d";

    // --- Mode 2: live by-ticker fetch (for non-owned tickers) ---
    if (tickerParam && assetTypeParam) {
      const days = PERIOD_DAYS[period] ?? 90;
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const prices = await getHistoricalPrices(
        assetTypeParam,
        tickerParam,
        fromDate,
        toDate
      );

      const result = prices.map((p: { date: string; price: number }) => ({
        symbol: tickerParam,
        assetType: assetTypeParam,
        priceUsd: p.price,
        date: p.date,
      }));

      return NextResponse.json(result);
    }

    // --- Mode 1: DB-backed (existing behavior) ---
    if (!symbolsParam) {
      return NextResponse.json(
        { error: "symbols parameter required (or use ticker+assetType)" },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

    const where: Record<string, any> = {
      symbol: { in: symbols },
    };

    if (period !== "all" && PERIOD_DAYS[period]) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
      where.recordedDate = { gte: cutoff };
    }

    const prices = await prisma.assetPriceHistory.findMany({
      where,
      orderBy: { recordedDate: "asc" },
      select: {
        symbol: true,
        assetType: true,
        priceUsd: true,
        recordedDate: true,
      },
    });

    const result = prices.map((p) => ({
      symbol: p.symbol,
      assetType: p.assetType,
      priceUsd: p.priceUsd,
      date: p.recordedDate.toISOString().split("T")[0],
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/analysis/price-history error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GRAMS_PER_TROY_OUNCE, getUsdToEgpRate } from "@/lib/market-data";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

/**
 * GET /api/analysis/value-history?assetType=crypto&symbol=BTC&period=30d
 * Returns daily portfolio value history for assets matching the filter.
 * Uses carry-forward logic: if an asset has no price on a given day
 * (e.g., weekends for stocks), the last known price is used.
 */
export async function GET(req: NextRequest) {
  try {
    const assetType = req.nextUrl.searchParams.get("assetType") || "";
    const symbol = req.nextUrl.searchParams.get("symbol") || "";
    const period = req.nextUrl.searchParams.get("period") || "30d";

    // Get investments matching the filter
    const investmentWhere: Record<string, any> = {};
    if (assetType) investmentWhere.assetType = assetType;
    if (symbol) investmentWhere.symbol = symbol;

    const investments = await prisma.investment.findMany({
      where: investmentWhere,
    });

    if (investments.length === 0) {
      return NextResponse.json([]);
    }

    // Determine which price symbols to look up
    const priceSymbols = new Set<string>();
    for (const inv of investments) {
      if (inv.valuationMode === "manual") continue;
      const storeSymbol =
        inv.assetType === "gold"
          ? "GOLD"
          : inv.assetType === "silver"
            ? "SILVER"
            : inv.symbol;
      priceSymbols.add(storeSymbol);
    }

    // Fetch ALL price history for these symbols (no period filter on DB query)
    // so we can carry forward prices from before the visible period
    const prices = await prisma.assetPriceHistory.findMany({
      where: {
        symbol: { in: [...priceSymbols] },
      },
      orderBy: { recordedDate: "asc" },
    });

    if (prices.length === 0) {
      return NextResponse.json([]);
    }

    // Build a map: symbol → sorted array of { date, price }
    const priceTimelines = new Map<string, { date: string; price: number }[]>();
    for (const p of prices) {
      const dateStr = p.recordedDate.toISOString().split("T")[0];
      if (!priceTimelines.has(p.symbol)) {
        priceTimelines.set(p.symbol, []);
      }
      priceTimelines.get(p.symbol)!.push({ date: dateStr, price: p.priceUsd });
    }

    // Collect all unique dates across all symbols
    const allDatesSet = new Set<string>();
    for (const timeline of priceTimelines.values()) {
      for (const entry of timeline) {
        allDatesSet.add(entry.date);
      }
    }
    const allDates = [...allDatesSet].sort();

    // Apply period filter to dates (for output only)
    let filteredDates = allDates;
    if (period !== "all" && PERIOD_DAYS[period]) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      filteredDates = allDates.filter((d) => d >= cutoffStr);
    }

    // Build price lookup per symbol with carry-forward
    // For each symbol, create a map of date → price, filling gaps with last known
    const symbolPriceLookup = new Map<string, Map<string, number>>();
    for (const [sym, timeline] of priceTimelines) {
      const lookup = new Map<string, number>();
      let lastPrice = 0;
      let timelineIdx = 0;

      for (const date of allDates) {
        // Check if this symbol has a price for this date
        while (
          timelineIdx < timeline.length &&
          timeline[timelineIdx].date < date
        ) {
          lastPrice = timeline[timelineIdx].price;
          timelineIdx++;
        }
        if (
          timelineIdx < timeline.length &&
          timeline[timelineIdx].date === date
        ) {
          lastPrice = timeline[timelineIdx].price;
          timelineIdx++;
        }

        if (lastPrice > 0) {
          lookup.set(date, lastPrice);
        }
      }
      symbolPriceLookup.set(sym, lookup);
    }

    // Get EGP rate
    const egpRate = await getUsdToEgpRate();

    // Compute portfolio value for each filtered date
    const result: { date: string; valueUsd: number; valueEgp: number }[] = [];

    for (const dateStr of filteredDates) {
      const snapshotDate = new Date(dateStr + "T12:00:00Z"); // noon UTC to avoid timezone edge cases
      let totalUsd = 0;
      let hasAnyPrice = false;

      for (const inv of investments) {
        // Only include investments that existed on this date
        const created = inv.purchaseDate || inv.createdAt;
        if (created > snapshotDate) continue;

        if (inv.valuationMode === "manual") {
          if (inv.currentValue != null) {
            if (inv.purchaseCurrency === "EGP") {
              totalUsd += inv.currentValue / egpRate;
            } else {
              totalUsd += inv.currentValue;
            }
            hasAnyPrice = true;
          }
          continue;
        }

        const storeSymbol =
          inv.assetType === "gold"
            ? "GOLD"
            : inv.assetType === "silver"
              ? "SILVER"
              : inv.symbol;

        const price = symbolPriceLookup.get(storeSymbol)?.get(dateStr);
        if (price == null) continue;

        hasAnyPrice = true;

        if (
          (inv.assetType === "gold" || inv.assetType === "silver") &&
          inv.weightUnit === "grams"
        ) {
          totalUsd += price * (inv.quantity / GRAMS_PER_TROY_OUNCE);
        } else {
          totalUsd += price * inv.quantity;
        }
      }

      if (hasAnyPrice) {
        result.push({
          date: dateStr,
          valueUsd: Math.round(totalUsd * 100) / 100,
          valueEgp: Math.round(totalUsd * egpRate * 100) / 100,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/analysis/value-history error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

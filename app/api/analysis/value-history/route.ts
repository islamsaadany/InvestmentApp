import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GRAMS_PER_TROY_OUNCE } from "@/lib/market-data";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

/**
 * GET /api/analysis/value-history?assetType=crypto&symbol=BTC&period=30d
 * Returns daily portfolio value history for assets matching the filter.
 * Used for Chart A (asset value over time).
 *
 * - No filters: total portfolio value per day (all assets combined)
 * - assetType only: sum of that asset type's value per day
 * - assetType + symbol: single asset's value per day
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

    // Fetch price history
    const priceWhere: Record<string, any> = {
      symbol: { in: [...priceSymbols] },
    };
    if (period !== "all" && PERIOD_DAYS[period]) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
      priceWhere.recordedDate = { gte: cutoff };
    }

    const prices = await prisma.assetPriceHistory.findMany({
      where: priceWhere,
      orderBy: { recordedDate: "asc" },
    });

    // Group prices by date
    const pricesByDate = new Map<string, Map<string, number>>();
    for (const p of prices) {
      const dateStr = p.recordedDate.toISOString().split("T")[0];
      if (!pricesByDate.has(dateStr)) {
        pricesByDate.set(dateStr, new Map());
      }
      pricesByDate.get(dateStr)!.set(p.symbol, p.priceUsd);
    }

    // Compute portfolio value for each date
    const result: { date: string; valueUsd: number }[] = [];

    for (const [dateStr, symbolPrices] of pricesByDate) {
      const snapshotDate = new Date(dateStr);
      let totalUsd = 0;
      let hasAnyPrice = false;

      for (const inv of investments) {
        // Only include investments that existed on this date
        const created = inv.purchaseDate || inv.createdAt;
        if (created > snapshotDate) continue;

        if (inv.valuationMode === "manual") {
          if (inv.currentValue != null) {
            totalUsd += inv.purchaseCurrency === "EGP"
              ? inv.currentValue / 50 // approximate for historical
              : inv.currentValue;
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

        const price = symbolPrices.get(storeSymbol);
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
        });
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/analysis/value-history error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

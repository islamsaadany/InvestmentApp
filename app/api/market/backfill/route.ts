import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHistoricalPrices, getUsdToEgpRate, GRAMS_PER_TROY_OUNCE } from "@/lib/market-data";

export async function POST(req: NextRequest) {
  try {
    // Get all investments to determine which assets to backfill
    const investments = await prisma.investment.findMany();
    if (investments.length === 0) {
      return NextResponse.json({ message: "No investments found" });
    }

    // Find the earliest purchase date across all investments, then go 1 month before
    let earliestDate: Date | null = null;
    for (const inv of investments) {
      if (inv.purchaseDate) {
        if (!earliestDate || inv.purchaseDate < earliestDate) {
          earliestDate = inv.purchaseDate;
        }
      }
    }

    if (!earliestDate) {
      // If no purchase dates, use the earliest createdAt
      for (const inv of investments) {
        if (!earliestDate || inv.createdAt < earliestDate) {
          earliestDate = inv.createdAt;
        }
      }
    }

    // Go 1 month before the earliest date
    const fromDate = new Date(earliestDate!);
    fromDate.setMonth(fromDate.getMonth() - 1);
    const toDate = new Date();

    // Deduplicate assets (same symbol + assetType only needs one fetch)
    const assetMap = new Map<string, { symbol: string; assetType: string }>();
    for (const inv of investments) {
      // For gold/silver, the symbol is the metal type, not a ticker
      const key =
        inv.assetType === "gold" || inv.assetType === "silver"
          ? inv.assetType
          : `${inv.assetType}_${inv.symbol}`;
      if (!assetMap.has(key)) {
        assetMap.set(key, { symbol: inv.symbol, assetType: inv.assetType });
      }
    }

    const results: { symbol: string; assetType: string; count: number }[] = [];

    // Fetch and store historical prices for each unique asset
    for (const [, asset] of assetMap) {
      const historicalPrices = await getHistoricalPrices(
        asset.assetType,
        asset.symbol,
        fromDate,
        toDate
      );

      if (historicalPrices.length === 0) continue;

      const storeSymbol =
        asset.assetType === "gold"
          ? "GOLD"
          : asset.assetType === "silver"
            ? "SILVER"
            : asset.symbol;

      // Delete old data for this symbol first (clean slate for re-backfill)
      await prisma.assetPriceHistory.deleteMany({
        where: { symbol: storeSymbol },
      });

      // Insert fresh data
      let inserted = 0;
      for (const { date, price } of historicalPrices) {
        try {
          await prisma.assetPriceHistory.upsert({
            where: {
              symbol_recordedDate: {
                symbol: storeSymbol,
                recordedDate: new Date(date),
              },
            },
            update: { priceUsd: price },
            create: {
              symbol: storeSymbol,
              assetType: asset.assetType as any,
              priceUsd: price,
              recordedDate: new Date(date),
            },
          });
          inserted++;
        } catch {
          // Skip individual failures (e.g., constraint violations)
        }
      }

      results.push({ symbol: storeSymbol, assetType: asset.assetType, count: inserted });
    }

    // Also backfill portfolio snapshots from the historical price data
    await backfillPortfolioSnapshots(investments, fromDate, toDate);

    return NextResponse.json({
      message: "Backfill complete",
      fromDate: fromDate.toISOString().split("T")[0],
      toDate: toDate.toISOString().split("T")[0],
      assets: results,
    });
  } catch (error: any) {
    console.error("POST /api/market/backfill error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Backfill PortfolioSnapshot records using stored asset price history.
 * For each date that has price data, compute the total portfolio value.
 */
async function backfillPortfolioSnapshots(
  investments: any[],
  fromDate: Date,
  toDate: Date
) {
  // Get all price history in range
  const allPrices = await prisma.assetPriceHistory.findMany({
    where: {
      recordedDate: { gte: fromDate, lte: toDate },
    },
    orderBy: { recordedDate: "asc" },
  });

  // Group prices by date
  const pricesByDate = new Map<string, Map<string, number>>();
  for (const p of allPrices) {
    const dateStr = p.recordedDate.toISOString().split("T")[0];
    if (!pricesByDate.has(dateStr)) {
      pricesByDate.set(dateStr, new Map());
    }
    pricesByDate.get(dateStr)!.set(p.symbol, p.priceUsd);
  }

  const egpRate = await getUsdToEgpRate();

  // For each date, compute total portfolio value
  for (const [dateStr, symbolPrices] of pricesByDate) {
    const snapshotDate = new Date(dateStr);

    // Only include investments that existed on this date
    const activeInvestments = investments.filter((inv) => {
      const created = inv.purchaseDate || inv.createdAt;
      return created <= snapshotDate;
    });

    if (activeInvestments.length === 0) continue;

    let totalUsd = 0;
    let hasAnyPrice = false;

    for (const inv of activeInvestments) {
      if (inv.valuationMode === "manual") {
        // Use stored currentValue for manual investments
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

      const lookupSymbol =
        inv.assetType === "gold"
          ? "GOLD"
          : inv.assetType === "silver"
            ? "SILVER"
            : inv.symbol;

      const price = symbolPrices.get(lookupSymbol);
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

    if (!hasAnyPrice) continue;

    // Upsert snapshot (avoid duplicates for same date)
    // Check if snapshot already exists for this date
    const existingSnapshot = await prisma.portfolioSnapshot.findFirst({
      where: {
        snapshotDate: {
          gte: new Date(`${dateStr}T00:00:00Z`),
          lt: new Date(`${dateStr}T23:59:59Z`),
        },
      },
    });

    if (!existingSnapshot) {
      await prisma.portfolioSnapshot.create({
        data: {
          totalValueUsd: Math.round(totalUsd * 100) / 100,
          totalValueEgp: Math.round(totalUsd * egpRate * 100) / 100,
          snapshotDate: new Date(`${dateStr}T12:00:00Z`),
        },
      });
    }
  }
}

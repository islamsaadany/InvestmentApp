import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHistoricalPrices, getUsdToEgpRate, GRAMS_PER_TROY_OUNCE } from "@/lib/market-data";
import { enrichInvestments } from "@/lib/enrich";

/**
 * POST /api/market/sync
 * Lightweight sync: only fetches missing days since the last recorded date.
 * Called by the Refresh button. Does NOT delete existing data.
 */
export async function POST() {
  try {
    const investments = await prisma.investment.findMany();
    if (investments.length === 0) {
      return NextResponse.json({ message: "No investments", synced: 0 });
    }

    // Deduplicate assets
    const assetMap = new Map<string, { symbol: string; assetType: string }>();
    for (const inv of investments) {
      const key =
        inv.assetType === "gold" || inv.assetType === "silver"
          ? inv.assetType
          : `${inv.assetType}_${inv.symbol}`;
      if (!assetMap.has(key)) {
        assetMap.set(key, { symbol: inv.symbol, assetType: inv.assetType });
      }
    }

    const today = new Date();
    let totalSynced = 0;

    for (const [, asset] of assetMap) {
      const storeSymbol =
        asset.assetType === "gold"
          ? "GOLD"
          : asset.assetType === "silver"
            ? "SILVER"
            : asset.symbol;

      // Find the last recorded date for this asset
      const lastRecord = await prisma.assetPriceHistory.findFirst({
        where: { symbol: storeSymbol },
        orderBy: { recordedDate: "desc" },
        select: { recordedDate: true },
      });

      // If no data at all, skip (user needs to run full backfill first)
      if (!lastRecord) continue;

      const lastDate = lastRecord.recordedDate;
      const daysSinceLast = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only fetch if there are missing days
      if (daysSinceLast <= 0) continue;

      // Fetch from last recorded date to today
      const fromDate = new Date(lastDate);
      fromDate.setDate(fromDate.getDate() + 1); // day after last record

      const historicalPrices = await getHistoricalPrices(
        asset.assetType,
        asset.symbol,
        fromDate,
        today
      );

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
          totalSynced++;
        } catch {
          // Skip individual failures
        }
      }
    }

    // Also create a portfolio snapshot for today
    const enriched = await enrichInvestments(investments);
    const egpRate = await getUsdToEgpRate();
    const totalUsd = enriched.reduce(
      (sum, i) => sum + (i.currentValueUsd || 0),
      0
    );

    await prisma.portfolioSnapshot.create({
      data: {
        totalValueUsd: Math.round(totalUsd * 100) / 100,
        totalValueEgp: Math.round(totalUsd * egpRate * 100) / 100,
      },
    });

    return NextResponse.json({
      message: "Sync complete",
      synced: totalSynced,
    });
  } catch (error: any) {
    console.error("POST /api/market/sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

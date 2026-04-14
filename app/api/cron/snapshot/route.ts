import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichInvestments } from "@/lib/enrich";
import { getUsdToEgpRate, getCurrentPrice } from "@/lib/market-data";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const investments = await prisma.investment.findMany();
    const enriched = await enrichInvestments(investments);
    const egpRate = await getUsdToEgpRate();

    const totalUsd = enriched.reduce(
      (sum, i) => sum + (i.currentValueUsd || 0),
      0
    );

    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        totalValueUsd: Math.round(totalUsd * 100) / 100,
        totalValueEgp: Math.round(totalUsd * egpRate * 100) / 100,
      },
    });

    // Also record per-asset prices for the Analysis page
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const assetsSeen = new Set<string>();
    let assetPricesRecorded = 0;

    for (const inv of enriched) {
      if (inv.currentPrice == null) continue;

      const storeSymbol =
        inv.assetType === "gold"
          ? "GOLD"
          : inv.assetType === "silver"
            ? "SILVER"
            : inv.symbol;

      // Skip if we already recorded this asset today
      if (assetsSeen.has(storeSymbol)) continue;
      assetsSeen.add(storeSymbol);

      try {
        await prisma.assetPriceHistory.upsert({
          where: {
            symbol_recordedDate: {
              symbol: storeSymbol,
              recordedDate: today,
            },
          },
          update: { priceUsd: inv.currentPrice },
          create: {
            symbol: storeSymbol,
            assetType: inv.assetType as any,
            priceUsd: inv.currentPrice,
            recordedDate: today,
          },
        });
        assetPricesRecorded++;
      } catch {
        // Skip individual failures
      }
    }

    return NextResponse.json({
      id: snapshot.id,
      totalValueUsd: snapshot.totalValueUsd,
      totalValueEgp: snapshot.totalValueEgp,
      snapshotDate: snapshot.snapshotDate.toISOString(),
      assetPricesRecorded,
    });
  } catch (error: any) {
    console.error("GET /api/cron/snapshot error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

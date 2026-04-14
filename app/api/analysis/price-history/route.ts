import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

/**
 * GET /api/analysis/price-history?symbols=BTC,GOLD&period=30d
 * Returns daily price history for given symbols.
 * Used for Chart B (market price with entry points).
 */
export async function GET(req: NextRequest) {
  try {
    const symbolsParam = req.nextUrl.searchParams.get("symbols") || "";
    const period = req.nextUrl.searchParams.get("period") || "30d";

    if (!symbolsParam) {
      return NextResponse.json({ error: "symbols parameter required" }, { status: 400 });
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

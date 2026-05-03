import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHistoricalPrices } from "@/lib/market-data";

interface YahooSplit {
  date: number;
  numerator: number;
  denominator: number;
  splitRatio: string;
}

interface PendingAdjustment {
  investmentId: number;
  symbol: string;
  name: string;
  splitDate: string;
  ratio: string;
  numerator: number;
  denominator: number;
  currentQuantity: number;
  newQuantity: number;
}

async function fetchYahooSplits(symbol: string): Promise<YahooSplit[]> {
  const period1 = 0;
  const period2 = Math.floor(Date.now() / 1000);
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol
      )}?period1=${period1}&period2=${period2}&interval=1d&events=splits`,
      {
        signal: AbortSignal.timeout(20000),
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    const data = await res.json();
    const splits = data.chart?.result?.[0]?.events?.splits;
    if (!splits || typeof splits !== "object") return [];
    return Object.values(splits) as YahooSplit[];
  } catch (err) {
    console.error(`Yahoo splits fetch failed for ${symbol}:`, err);
    return [];
  }
}

/**
 * POST /api/market/check-splits
 *
 * Detects stock splits since the user started tracking each holding.
 * Auto-fixes price history (re-fetches split-adjusted prices from Yahoo).
 * Returns pending quantity adjustments for the user to confirm in the UI.
 *
 * Splits already recorded in `applied_splits` (whether applied or skipped)
 * are not re-surfaced.
 */
export async function POST() {
  try {
    const stockInvestments = await prisma.investment.findMany({
      where: {
        assetType: { in: ["us_stock", "egx_stock"] },
        valuationMode: "live",
      },
    });

    if (stockInvestments.length === 0) {
      return NextResponse.json({
        checked: 0,
        pricesFixed: [] as string[],
        pendingAdjustments: [] as PendingAdjustment[],
      });
    }

    // Group by symbol for one Yahoo call per ticker
    const symbolToInvestments = new Map<string, typeof stockInvestments>();
    for (const inv of stockInvestments) {
      const list = symbolToInvestments.get(inv.symbol) ?? [];
      list.push(inv);
      symbolToInvestments.set(inv.symbol, list);
    }

    const previouslyHandled = await prisma.appliedSplit.findMany();
    const handledKey = (
      symbol: string,
      splitDate: Date,
      investmentId: number | null
    ) =>
      `${symbol}|${splitDate.toISOString().split("T")[0]}|${investmentId ?? "null"}`;
    const handledSet = new Set(
      previouslyHandled.map((h) =>
        handledKey(h.symbol, h.splitDate, h.investmentId)
      )
    );

    const pricesFixed: string[] = [];
    const pendingAdjustments: PendingAdjustment[] = [];
    let checked = 0;

    for (const [symbol, investments] of symbolToInvestments) {
      checked++;

      const splits = await fetchYahooSplits(symbol);
      if (splits.length === 0) continue;

      // Earliest stored price for this symbol — splits before this date are
      // already baked into the historical data, so they don't need fixing.
      const earliestPrice = await prisma.assetPriceHistory.findFirst({
        where: { symbol },
        orderBy: { recordedDate: "asc" },
        select: { recordedDate: true },
      });
      const earliestStored = earliestPrice?.recordedDate ?? null;

      // Find splits relevant to this user: split must be after earliest stored
      // price AND after at least one investment's purchase date.
      const earliestPurchase = investments.reduce<Date | null>((acc, inv) => {
        const d = inv.purchaseDate ?? inv.createdAt;
        return acc == null || d < acc ? d : acc;
      }, null);

      const cutoff =
        earliestStored && earliestPurchase
          ? earliestPurchase < earliestStored
            ? earliestPurchase
            : earliestStored
          : earliestPurchase ?? earliestStored;

      if (!cutoff) continue;

      const relevantSplits = splits.filter(
        (s) => new Date(s.date * 1000) > cutoff
      );

      if (relevantSplits.length === 0) continue;

      // Re-backfill historical prices for this symbol (split-adjusted from Yahoo).
      const fromDate = cutoff;
      const toDate = new Date();
      try {
        const historical = await getHistoricalPrices(
          investments[0].assetType,
          symbol,
          fromDate,
          toDate
        );
        if (historical.length > 0) {
          await prisma.assetPriceHistory.deleteMany({ where: { symbol } });
          for (const { date, price } of historical) {
            await prisma.assetPriceHistory.upsert({
              where: {
                symbol_recordedDate: {
                  symbol,
                  recordedDate: new Date(date),
                },
              },
              update: { priceUsd: price },
              create: {
                symbol,
                assetType: investments[0].assetType,
                priceUsd: price,
                recordedDate: new Date(date),
              },
            });
          }
          pricesFixed.push(symbol);
        }
      } catch (err) {
        console.error(`Price re-backfill failed for ${symbol}:`, err);
      }

      // Build pending quantity adjustments per investment per split.
      // Only flag investments owned BEFORE the split date.
      for (const split of relevantSplits) {
        const splitDate = new Date(split.date * 1000);

        for (const inv of investments) {
          const ownedFrom = inv.purchaseDate ?? inv.createdAt;
          if (ownedFrom >= splitDate) continue;

          if (handledSet.has(handledKey(symbol, splitDate, inv.id))) continue;

          const factor = split.numerator / split.denominator;
          if (!Number.isFinite(factor) || factor <= 0) continue;

          const newQuantity = inv.quantity * factor;

          pendingAdjustments.push({
            investmentId: inv.id,
            symbol,
            name: inv.name,
            splitDate: splitDate.toISOString().split("T")[0],
            ratio: split.splitRatio,
            numerator: split.numerator,
            denominator: split.denominator,
            currentQuantity: inv.quantity,
            newQuantity: Math.round(newQuantity * 1e8) / 1e8,
          });
        }
      }
    }

    return NextResponse.json({
      checked,
      pricesFixed,
      pendingAdjustments,
    });
  } catch (error: any) {
    console.error("POST /api/market/check-splits error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

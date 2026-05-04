import type { Investment } from "@/app/generated/prisma/client";
import { getCurrentPrice, getUsdToEgpRate, getCryptoPriceBatch, getMetalPrice, getStockPrice, GRAMS_PER_TROY_OUNCE } from "./market-data";
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from "./constants";
import type { InvestmentWithLiveData, AllocationItem } from "./types";

export async function enrichInvestment(
  inv: Investment
): Promise<InvestmentWithLiveData> {
  const egpRate = await getUsdToEgpRate();

  let currentPrice: number | null = null;
  let currentValueUsd: number | null = null;
  let currentValueEgp: number | null = null;
  let totalCost: number | null = null;
  let profitLoss: number | null = null;
  let profitLossPct: number | null = null;

  // Use stored historical exchange rate when available (more accurate),
  // fallback to current rate.
  const effectiveEgpRate =
    inv.purchaseExchangeRate && inv.purchaseExchangeRate > 0
      ? inv.purchaseExchangeRate
      : egpRate;

  if (inv.valuationMode === "manual") {
    // Manual valuation (e.g., EGX brokerage portfolio)
    // currentValue is stored in purchaseCurrency
    if (inv.currentValue != null) {
      if (inv.purchaseCurrency === "EGP") {
        currentValueEgp = inv.currentValue;
        currentValueUsd = inv.currentValue / egpRate;
      } else {
        currentValueUsd = inv.currentValue;
        currentValueEgp = inv.currentValue * egpRate;
      }

      totalCost = inv.purchasePrice * inv.quantity;
      const totalCostUsd =
        inv.purchaseCurrency === "EGP"
          ? totalCost / effectiveEgpRate
          : totalCost;

      if (totalCostUsd > 0) {
        profitLoss = currentValueUsd - totalCostUsd;
        profitLossPct = (profitLoss / totalCostUsd) * 100;
      }
    }
  } else {
    // Live valuation — fetch price from market data
    currentPrice = await getCurrentPrice(inv.assetType, inv.symbol);

    if (currentPrice != null) {
      // Effective qty in chart unit (troy oz for grams, raw otherwise),
      // adjusted for metal purity so 21K gold contributes only 87.5% to value
      let effectiveQty: number;
      if (
        (inv.assetType === "gold" || inv.assetType === "silver") &&
        inv.weightUnit === "grams"
      ) {
        effectiveQty = inv.quantity / GRAMS_PER_TROY_OUNCE;
      } else {
        effectiveQty = inv.quantity;
      }
      if (
        (inv.assetType === "gold" || inv.assetType === "silver") &&
        inv.purityPercent != null &&
        inv.purityPercent > 0 &&
        inv.purityPercent < 100
      ) {
        effectiveQty = effectiveQty * (inv.purityPercent / 100);
      }

      currentValueUsd = currentPrice * effectiveQty;
      currentValueEgp = currentValueUsd * egpRate;

      totalCost = inv.purchasePrice * inv.quantity;
      const totalCostUsd =
        inv.purchaseCurrency === "EGP"
          ? totalCost / effectiveEgpRate
          : totalCost;

      if (totalCostUsd > 0) {
        profitLoss = currentValueUsd - totalCostUsd;
        profitLossPct = (profitLoss / totalCostUsd) * 100;
      }
    }
  }

  return {
    id: inv.id,
    name: inv.name,
    symbol: inv.symbol,
    assetType: inv.assetType,
    quantity: inv.quantity,
    purchasePrice: inv.purchasePrice,
    purchaseCurrency: inv.purchaseCurrency,
    purchaseDate: inv.purchaseDate?.toISOString() ?? null,
    purchaseExchangeRate: inv.purchaseExchangeRate,
    purityPercent: inv.purityPercent,
    weightUnit: inv.weightUnit,
    valuationMode: inv.valuationMode,
    currentValue: inv.currentValue,
    notes: inv.notes,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
    currentPrice,
    currentValueUsd: currentValueUsd != null ? Math.round(currentValueUsd * 100) / 100 : null,
    currentValueEgp: currentValueEgp != null ? Math.round(currentValueEgp * 100) / 100 : null,
    totalCost: totalCost != null ? Math.round(totalCost * 100) / 100 : null,
    profitLoss: profitLoss != null ? Math.round(profitLoss * 100) / 100 : null,
    profitLossPct: profitLossPct != null ? Math.round(profitLossPct * 100) / 100 : null,
  };
}

export async function enrichInvestments(
  investments: Investment[]
): Promise<InvestmentWithLiveData[]> {
  // Pre-fetch all prices in batch to avoid rate limiting
  await prefetchPrices(investments);
  return Promise.all(investments.map(enrichInvestment));
}

async function prefetchPrices(investments: Investment[]): Promise<void> {
  const cryptoSymbols = new Set<string>();
  const stockSymbols = new Set<string>();
  let needGold = false;
  let needSilver = false;

  for (const inv of investments) {
    if (inv.valuationMode === "manual") continue;
    switch (inv.assetType) {
      case "crypto":
        cryptoSymbols.add(inv.symbol);
        break;
      case "gold":
        needGold = true;
        break;
      case "silver":
        needSilver = true;
        break;
      case "us_stock":
      case "egx_stock":
        stockSymbols.add(inv.symbol);
        break;
    }
  }

  const fetches: Promise<unknown>[] = [];

  if (cryptoSymbols.size > 0) {
    fetches.push(getCryptoPriceBatch([...cryptoSymbols]));
  }
  if (needGold) fetches.push(getMetalPrice("gold"));
  if (needSilver) fetches.push(getMetalPrice("silver"));
  for (const symbol of stockSymbols) {
    fetches.push(getStockPrice(symbol));
  }

  await Promise.all(fetches);
}

export function computeAllocation(
  enriched: InvestmentWithLiveData[],
  totalValueUsd: number
): AllocationItem[] {
  const groups: Record<string, number> = {};
  for (const inv of enriched) {
    groups[inv.assetType] = (groups[inv.assetType] || 0) + (inv.currentValueUsd || 0);
  }

  const allocation: AllocationItem[] = Object.entries(groups).map(
    ([assetType, valueUsd]) => ({
      assetType,
      label: ASSET_TYPE_LABELS[assetType as keyof typeof ASSET_TYPE_LABELS] || assetType,
      valueUsd: Math.round(valueUsd * 100) / 100,
      percentage:
        totalValueUsd > 0
          ? Math.round((valueUsd / totalValueUsd) * 10000) / 100
          : 0,
      color: ASSET_TYPE_COLORS[assetType as keyof typeof ASSET_TYPE_COLORS] || "#999",
    })
  );

  return allocation.sort((a, b) => b.percentage - a.percentage);
}

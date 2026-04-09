import type { Investment } from "@/app/generated/prisma/client";
import { getCurrentPrice, getUsdToEgpRate, GRAMS_PER_TROY_OUNCE } from "./market-data";
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from "./constants";
import type { InvestmentWithLiveData, AllocationItem } from "./types";

export async function enrichInvestment(
  inv: Investment
): Promise<InvestmentWithLiveData> {
  const [currentPrice, egpRate] = await Promise.all([
    getCurrentPrice(inv.assetType, inv.symbol),
    getUsdToEgpRate(),
  ]);

  let currentValueUsd: number | null = null;
  let currentValueEgp: number | null = null;
  let totalCost: number | null = null;
  let profitLoss: number | null = null;
  let profitLossPct: number | null = null;

  if (currentPrice != null) {
    // Calculate current value
    if (
      (inv.assetType === "gold" || inv.assetType === "silver") &&
      inv.weightUnit === "grams"
    ) {
      const qtyOz = inv.quantity / GRAMS_PER_TROY_OUNCE;
      currentValueUsd = currentPrice * qtyOz;
    } else {
      currentValueUsd = currentPrice * inv.quantity;
    }

    currentValueEgp = currentValueUsd * egpRate;

    // Total cost
    totalCost = inv.purchasePrice * inv.quantity;

    // Convert to USD for P&L comparison
    const totalCostUsd =
      inv.purchaseCurrency === "EGP" ? totalCost / egpRate : totalCost;

    if (totalCostUsd > 0) {
      profitLoss = currentValueUsd - totalCostUsd;
      profitLossPct = (profitLoss / totalCostUsd) * 100;
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
    weightUnit: inv.weightUnit,
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
  return Promise.all(investments.map(enrichInvestment));
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

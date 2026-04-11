"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPercent } from "@/lib/formatters";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { InvestmentWithLiveData } from "@/lib/types";
import type { AssetType } from "@/app/generated/prisma/client";

interface AggregatedMover {
  symbol: string;
  assetType: AssetType;
  profitLossPct: number;
}

function aggregateBySymbol(
  investments: InvestmentWithLiveData[]
): AggregatedMover[] {
  const groups: Record<
    string,
    { symbol: string; assetType: AssetType; totalCostUsd: number; totalValueUsd: number }
  > = {};

  for (const inv of investments) {
    if (inv.currentValueUsd == null || inv.profitLoss == null) continue;

    const key = `${inv.assetType}:${inv.symbol}`;
    if (!groups[key]) {
      groups[key] = {
        symbol: inv.symbol,
        assetType: inv.assetType,
        totalCostUsd: 0,
        totalValueUsd: 0,
      };
    }

    // Derive cost in USD: costUsd = currentValueUsd - profitLoss (both already in USD)
    const costUsd = inv.currentValueUsd - inv.profitLoss;
    groups[key].totalCostUsd += costUsd;
    groups[key].totalValueUsd += inv.currentValueUsd;
  }

  return Object.values(groups)
    .filter((g) => g.totalCostUsd > 0)
    .map((g) => ({
      symbol: g.symbol,
      assetType: g.assetType,
      profitLossPct:
        ((g.totalValueUsd - g.totalCostUsd) / g.totalCostUsd) * 100,
    }));
}

export default function TopMovers({
  investments,
}: {
  investments: InvestmentWithLiveData[];
}) {
  const aggregated = aggregateBySymbol(investments);
  const sorted = [...aggregated].sort(
    (a, b) => b.profitLossPct - a.profitLossPct
  );
  const gainers = sorted.filter((i) => i.profitLossPct > 0).slice(0, 10);
  const losers = sorted
    .filter((i) => i.profitLossPct < 0)
    .slice(-10)
    .reverse();

  if (aggregated.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Top Movers</h3>
        <div className="text-gray-400 text-sm text-center py-4">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Top Movers</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Top Gainers
          </div>
          {gainers.length === 0 ? (
            <div className="text-xs text-gray-400 py-2">No gainers</div>
          ) : (
            gainers.map((inv) => (
              <div
                key={`${inv.assetType}:${inv.symbol}`}
                className="flex items-center justify-between py-1.5"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {inv.symbol}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    {ASSET_TYPE_LABELS[inv.assetType]}
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatPercent(inv.profitLossPct)}
                </span>
              </div>
            ))
          )}
        </div>
        <div>
          <div className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Top Losers
          </div>
          {losers.length === 0 ? (
            <div className="text-xs text-gray-400 py-2">No losers</div>
          ) : (
            losers.map((inv) => (
              <div
                key={`${inv.assetType}:${inv.symbol}`}
                className="flex items-center justify-between py-1.5"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {inv.symbol}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    {ASSET_TYPE_LABELS[inv.assetType]}
                  </span>
                </div>
                <span className="text-sm font-medium text-red-600">
                  {formatPercent(inv.profitLossPct)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

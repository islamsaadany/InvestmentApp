"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPercent } from "@/lib/formatters";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { InvestmentWithLiveData } from "@/lib/types";

export default function TopMovers({
  investments,
}: {
  investments: InvestmentWithLiveData[];
}) {
  const withPL = investments.filter((i) => i.profitLossPct != null);
  const sorted = [...withPL].sort(
    (a, b) => (b.profitLossPct || 0) - (a.profitLossPct || 0)
  );
  const gainers = sorted.filter((i) => (i.profitLossPct || 0) > 0).slice(0, 3);
  const losers = sorted.filter((i) => (i.profitLossPct || 0) < 0).slice(-3).reverse();

  if (withPL.length === 0) {
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
                key={inv.id}
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
                key={inv.id}
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

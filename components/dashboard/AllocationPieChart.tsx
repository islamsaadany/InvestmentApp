"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { AllocationItem, InvestmentWithLiveData } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";

interface AssetSummary {
  label: string;
  color: string;
  value: number;
  percentage: number;
  profitLossPct: number;
}

function computeAssetSummaries(
  allocation: AllocationItem[],
  investments: InvestmentWithLiveData[],
  currency: "USD" | "EGP",
  egpRate: number
): AssetSummary[] {
  // Compute P&L % per asset type from investments
  const plByType: Record<string, { costUsd: number; valueUsd: number }> = {};
  for (const inv of investments) {
    if (inv.currentValueUsd == null || inv.profitLoss == null) continue;
    if (!plByType[inv.assetType]) {
      plByType[inv.assetType] = { costUsd: 0, valueUsd: 0 };
    }
    const costUsd = inv.currentValueUsd - inv.profitLoss;
    plByType[inv.assetType].costUsd += costUsd;
    plByType[inv.assetType].valueUsd += inv.currentValueUsd;
  }

  return allocation.map((item) => {
    const pl = plByType[item.assetType];
    const profitLossPct =
      pl && pl.costUsd > 0
        ? ((pl.valueUsd - pl.costUsd) / pl.costUsd) * 100
        : 0;

    return {
      label: item.label,
      color: item.color,
      value: currency === "EGP" ? item.valueUsd * egpRate : item.valueUsd,
      percentage: item.percentage,
      profitLossPct,
    };
  });
}

export default function AllocationPieChart({
  allocation,
  investments,
  egpRate,
}: {
  allocation: AllocationItem[];
  investments: InvestmentWithLiveData[];
  egpRate: number;
}) {
  const [currency, setCurrency] = useState<"USD" | "EGP">("EGP");

  if (allocation.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">
          Asset Allocation
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No investments yet
        </div>
      </div>
    );
  }

  const summaries = computeAssetSummaries(
    allocation,
    investments,
    currency,
    egpRate
  );

  const chartData = allocation.map((item) => ({
    ...item,
    displayValue: currency === "EGP" ? item.valueUsd * egpRate : item.valueUsd,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">Asset Allocation</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setCurrency("EGP")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              currency === "EGP"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            EGP
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              currency === "USD"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            USD
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="displayValue"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={55}
                paddingAngle={2}
                label={(props: PieLabelRenderProps) =>
                  `${props.name ?? ""} ${((Number(props.percent) || 0) * 100).toFixed(1)}%`
                }
              >
                {chartData.map((item, idx) => (
                  <Cell key={idx} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  formatCurrency(Number(value), currency)
                }
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Summary Table */}
        <div className="flex flex-col justify-center">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Asset</th>
                <th className="text-right pb-2 font-medium">Value</th>
                <th className="text-right pb-2 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((item) => (
                <tr
                  key={item.label}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-gray-700">
                    {formatCurrency(item.value, currency)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`font-medium ${
                        item.profitLossPct >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatPercent(item.profitLossPct)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

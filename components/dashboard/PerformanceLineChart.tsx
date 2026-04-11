"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { PortfolioSnapshotData } from "@/lib/types";

const PERIODS = ["7d", "30d", "90d", "1y", "all"] as const;

export default function PerformanceLineChart() {
  const [period, setPeriod] = useState<string>("30d");
  const { currency } = useCurrency();

  const { data: snapshots, isLoading } = useQuery<PortfolioSnapshotData[]>({
    queryKey: ["portfolio", "performance", period],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/performance?period=${period}`);
      return res.json();
    },
    staleTime: 300_000,
  });

  const chartData = (snapshots || []).map((s) => ({
    date: new Date(s.snapshotDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value:
      currency === "EGP" ? s.totalValueEgp : s.totalValueUsd,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">Performance</h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading performance data..." />
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No snapshots yet. Data builds over time.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <Tooltip
              formatter={(value) =>
                formatCurrency(Number(value), currency === "EGP" ? "EGP" : "USD")
              }
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

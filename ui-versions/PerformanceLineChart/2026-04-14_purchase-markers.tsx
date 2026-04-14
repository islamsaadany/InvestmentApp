"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency, formatAxisValue, niceYDomain } from "@/lib/formatters";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const PERIODS = ["7d", "30d", "90d", "1y", "all"] as const;

interface ValuePoint {
  date: string;
  valueUsd: number;
  valueEgp: number;
}

export default function PerformanceLineChart() {
  const [period, setPeriod] = useState<string>("30d");
  const { currency } = useCurrency();

  const { data: valueHistory, isLoading } = useQuery<ValuePoint[]>({
    queryKey: ["portfolio", "performance-v2", period],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/value-history?period=${period}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 300_000,
  });

  // Fetch investments for purchase markers
  const { data: investments } = useQuery<any[]>({
    queryKey: ["investments", "list-perf"],
    queryFn: async () => {
      const res = await fetch("/api/investments");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 300_000,
  });

  const chartData = (valueHistory || []).map((v) => ({
    date: new Date(v.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    rawDate: v.date,
    value: currency === "EGP" ? v.valueEgp : v.valueUsd,
  }));

  const yDomain = niceYDomain(chartData.map((d) => d.value));

  // Find purchase dates that fall within the chart range
  const purchasePoints = (investments || [])
    .filter((inv: any) => inv.purchaseDate || inv.createdAt)
    .map((inv: any) => {
      const dateStr = (inv.purchaseDate || inv.createdAt).split("T")[0];
      const dateLabel = new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      // Find matching chart row
      let matchIdx = chartData.findIndex((d) => d.date === dateLabel);
      if (matchIdx === -1) {
        let minDiff = Infinity;
        for (let j = 0; j < chartData.length; j++) {
          const diff = Math.abs(
            new Date(chartData[j].rawDate).getTime() - new Date(dateStr).getTime()
          );
          if (diff < minDiff && diff < 3 * 24 * 60 * 60 * 1000) {
            minDiff = diff;
            matchIdx = j;
          }
        }
      }
      if (matchIdx === -1) return null;
      return {
        x: chartData[matchIdx].date,
        y: chartData[matchIdx].value,
        name: inv.name,
        symbol: inv.symbol,
        quantity: inv.quantity,
        price: inv.purchasePrice,
        currency: inv.purchaseCurrency || "USD",
        dateStr,
      };
    })
    .filter(Boolean);

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
          No performance data yet. Data builds over time.
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
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              domain={yDomain}
              tickFormatter={formatAxisValue}
            />
            <RechartsTooltip
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
            {/* Purchase markers */}
            {purchasePoints.map((pp: any, i: number) => (
              <ReferenceDot
                key={`purchase-${i}`}
                x={pp.x}
                y={pp.y}
                r={5}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
                label={{
                  value: `${pp.name}`,
                  position: "top",
                  fontSize: 9,
                  fill: "#6b7280",
                  offset: 10,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
      {purchasePoints.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm" />
          Purchases
        </div>
      )}
    </div>
  );
}

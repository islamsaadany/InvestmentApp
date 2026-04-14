"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, ASSET_TYPES } from "@/lib/constants";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import toast from "react-hot-toast";
import type { AssetType } from "@/lib/types";

const PERIODS = ["7d", "30d", "90d", "1y", "all"] as const;

interface AnalysisAsset {
  symbol: string;
  name: string;
  assetType: string;
  storeSymbol: string;
}

interface PricePoint {
  symbol: string;
  assetType: string;
  priceUsd: number;
  date: string;
}

interface ValuePoint {
  date: string;
  valueUsd: number;
  valueEgp: number;
}

interface InvestmentEntry {
  symbol: string;
  assetType: string;
  purchaseDate: string | null;
  createdAt: string;
  purchasePrice: number;
  quantity: number;
  weightUnit: string | null;
}

// Generate distinct colors for sub-assets
const SUB_ASSET_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function AnalysisPage() {
  const [period, setPeriod] = useState<string>("90d");
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<Set<string>>(new Set());
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const { currency } = useCurrency();
  const [backfillTriggered, setBackfillTriggered] = useState(false);

  const toggleAssetType = (type: string) => {
    setSelectedAssetTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    // Clear symbol selections that no longer match
    setSelectedSymbols(new Set());
  };

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  // Derive single-value filters for API calls (backwards compat)
  const assetTypeFilter = selectedAssetTypes.size === 1 ? [...selectedAssetTypes][0] : "";
  const symbolFilter = selectedSymbols.size === 1 ? [...selectedSymbols][0] : "";

  // Fetch available assets for filters
  const { data: assets } = useQuery<AnalysisAsset[]>({
    queryKey: ["analysis", "assets"],
    queryFn: async () => {
      const res = await fetch("/api/analysis/assets");
      if (!res.ok) throw new Error("Failed to load assets");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 300_000,
  });

  // Fetch investments for entry points
  const { data: investments } = useQuery<InvestmentEntry[]>({
    queryKey: ["investments", "list"],
    queryFn: async () => {
      const res = await fetch("/api/investments");
      if (!res.ok) throw new Error("Failed to load investments");
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data.investments) ? data.investments : []);
      return list.map((inv: any) => ({
        symbol: inv.symbol,
        assetType: inv.assetType,
        purchaseDate: inv.purchaseDate,
        createdAt: inv.createdAt,
        purchasePrice: inv.purchasePrice,
        quantity: inv.quantity,
        weightUnit: inv.weightUnit,
      }));
    },
    staleTime: 300_000,
  });

  // Filtered sub-assets based on asset type selection
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    if (selectedAssetTypes.size === 0) return assets;
    return assets.filter((a) => selectedAssetTypes.has(a.assetType));
  }, [assets, selectedAssetTypes]);

  // Determine which symbols to fetch price history for
  const priceSymbols = useMemo(() => {
    if (selectedSymbols.size > 0) {
      // Specific assets selected
      const matched = (assets || []).filter((a) => selectedSymbols.has(a.symbol));
      return [...new Set(matched.map((a) => a.storeSymbol))];
    }
    if (selectedAssetTypes.size > 0) {
      return [...new Set(filteredAssets.map((a) => a.storeSymbol))];
    }
    if (!assets) return [];
    return [...new Set(assets.map((a) => a.storeSymbol))];
  }, [assets, filteredAssets, selectedAssetTypes, selectedSymbols]);

  // Fetch price history (Chart B)
  const {
    data: priceHistory,
    isLoading: priceLoading,
  } = useQuery<PricePoint[]>({
    queryKey: ["analysis", "price-history", priceSymbols.join(","), period],
    queryFn: async () => {
      if (priceSymbols.length === 0) return [];
      const res = await fetch(
        `/api/analysis/price-history?symbols=${priceSymbols.join(",")}&period=${period}`
      );
      if (!res.ok) throw new Error("Failed to load price history");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: priceSymbols.length > 0,
    staleTime: 300_000,
  });

  // Fetch value history (Chart A)
  const {
    data: valueHistory,
    isLoading: valueLoading,
  } = useQuery<ValuePoint[]>({
    queryKey: ["analysis", "value-history", [...selectedAssetTypes].join(","), [...selectedSymbols].join(","), period],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (selectedAssetTypes.size === 1) params.set("assetType", [...selectedAssetTypes][0]);
      if (selectedSymbols.size === 1) params.set("symbol", [...selectedSymbols][0]);
      const res = await fetch(`/api/analysis/value-history?${params}`);
      if (!res.ok) throw new Error("Failed to load value history");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 300_000,
  });

  // Auto-trigger backfill if no price history data exists
  useEffect(() => {
    if (
      priceHistory &&
      priceHistory.length === 0 &&
      !backfillTriggered &&
      assets &&
      assets.length > 0
    ) {
      setBackfillTriggered(true);
      toast.loading("Backfilling historical price data...", { id: "backfill" });
      fetch("/api/market/backfill", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            toast.error("Backfill failed: " + data.error, { id: "backfill" });
          } else {
            toast.success(
              `Backfill complete — ${data.assets?.length || 0} assets loaded`,
              { id: "backfill" }
            );
            // Refetch data
            window.location.reload();
          }
        })
        .catch(() => {
          toast.error("Backfill failed — check connection", { id: "backfill" });
        });
    }
  }, [priceHistory, backfillTriggered, assets]);

  // --- Chart A: Value Over Time ---
  const valueChartData = useMemo(() => {
    if (!valueHistory) return [];
    return valueHistory.map((v) => ({
      date: new Date(v.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      rawDate: v.date,
      value: currency === "EGP" ? v.valueEgp : v.valueUsd,
    }));
  }, [valueHistory, currency]);

  // --- Chart B: Price History with Entry Points ---
  // Group price data by symbol for multi-line chart
  const priceChartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return { dates: [] as string[], series: [] as any[], symbols: [] as string[] };

    // Collect all unique dates and symbols
    const dateSet = new Set<string>();
    const symbolSet = new Set<string>();
    for (const p of priceHistory) {
      dateSet.add(p.date);
      symbolSet.add(p.symbol);
    }

    const sortedDates = [...dateSet].sort();
    const series: Record<string, Map<string, number>> = {};
    for (const sym of symbolSet) {
      series[sym] = new Map();
    }
    for (const p of priceHistory) {
      series[p.symbol].set(p.date, p.priceUsd);
    }

    // Build chart-ready data: array of { date, [symbol]: price, ... }
    const chartRows = sortedDates.map((date) => {
      const row: Record<string, any> = {
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        rawDate: date,
      };
      for (const sym of symbolSet) {
        row[sym] = series[sym].get(date) ?? null;
      }
      return row;
    });

    return { dates: sortedDates, series: chartRows, symbols: [...symbolSet] };
  }, [priceHistory]);

  // Entry points for Chart B
  const entryPoints = useMemo(() => {
    if (!investments || !priceChartData.symbols) return [];

    const points: {
      symbol: string;
      date: string;
      dateLabel: string;
      price: number;
      quantity: number;
    }[] = [];

    for (const inv of investments) {
      // Apply filters
      if (assetTypeFilter && inv.assetType !== assetTypeFilter) continue;
      if (symbolFilter && inv.symbol !== symbolFilter) continue;

      const storeSymbol =
        inv.assetType === "gold"
          ? "GOLD"
          : inv.assetType === "silver"
            ? "SILVER"
            : inv.symbol;

      if (!priceChartData.symbols?.includes(storeSymbol)) continue;

      // Use purchaseDate if available, otherwise fall back to createdAt
      const dateSource = inv.purchaseDate || inv.createdAt;
      if (!dateSource) continue;

      const entryDate = dateSource.split("T")[0];
      const dateLabel = new Date(entryDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      points.push({
        symbol: storeSymbol,
        date: entryDate,
        dateLabel,
        price: inv.purchasePrice,
        quantity: inv.quantity,
      });
    }

    return points;
  }, [investments, priceChartData.symbols, assetTypeFilter, symbolFilter]);

  // Average purchase price (for dashed reference line)
  const avgPurchasePrice = useMemo(() => {
    if (!investments || !symbolFilter) return null;

    const relevantInvestments = investments.filter((inv) => {
      if (assetTypeFilter && inv.assetType !== assetTypeFilter) return false;
      return inv.symbol === symbolFilter;
    });

    if (relevantInvestments.length === 0) return null;

    const totalCost = relevantInvestments.reduce(
      (sum, inv) => sum + inv.purchasePrice * inv.quantity,
      0
    );
    const totalQty = relevantInvestments.reduce(
      (sum, inv) => sum + inv.quantity,
      0
    );

    return totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : null;
  }, [investments, symbolFilter, assetTypeFilter]);

  // Symbol-to-color mapping
  const symbolColors = useMemo(() => {
    const colors: Record<string, string> = {};
    if (!priceChartData.symbols) return colors;
    priceChartData.symbols.forEach((sym, i) => {
      // Try to use asset type color if we can identify it
      const asset = assets?.find((a) => a.storeSymbol === sym);
      if (asset && priceChartData.symbols!.length <= ASSET_TYPES.length) {
        colors[sym] = ASSET_TYPE_COLORS[asset.assetType as AssetType] || SUB_ASSET_COLORS[i % SUB_ASSET_COLORS.length];
      } else {
        colors[sym] = SUB_ASSET_COLORS[i % SUB_ASSET_COLORS.length];
      }
    });
    return colors;
  }, [priceChartData.symbols, assets]);

  // Symbol display name mapping
  const symbolNames = useMemo(() => {
    const names: Record<string, string> = {};
    if (!assets) return names;
    for (const a of assets) {
      names[a.storeSymbol] = a.name;
    }
    return names;
  }, [assets]);

  const isLoading = priceLoading || valueLoading;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analysis</h2>

      {/* Filters Row */}
      <div className="flex flex-wrap items-start gap-6">
        {/* Asset Type Checkboxes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">Asset Type</label>
          <div className="flex flex-wrap gap-2">
            {ASSET_TYPES.map((type) => (
              <label
                key={type}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                  selectedAssetTypes.has(type)
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedAssetTypes.has(type)}
                  onChange={() => toggleAssetType(type)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {ASSET_TYPE_LABELS[type]}
              </label>
            ))}
            {selectedAssetTypes.size > 0 && (
              <button
                onClick={() => { setSelectedAssetTypes(new Set()); setSelectedSymbols(new Set()); }}
                className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Specific Asset Checkboxes */}
        {filteredAssets.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Specific Asset</label>
            <div className="flex flex-wrap gap-2">
              {filteredAssets.map((a) => (
                <label
                  key={`${a.assetType}_${a.symbol}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                    selectedSymbols.has(a.symbol)
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSymbols.has(a.symbol)}
                    onChange={() => toggleSymbol(a.symbol)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {a.name}
                </label>
              ))}
              {selectedSymbols.size > 0 && (
                <button
                  onClick={() => setSelectedSymbols(new Set())}
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Period Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">Period</label>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === p
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading analysis data..." />
      ) : (
        <>
          {/* Chart A: Portfolio/Asset Value Over Time */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              {symbolFilter
                ? `${symbolNames[filteredAssets.find((a) => a.symbol === symbolFilter)?.storeSymbol || ""] || symbolFilter} — Value Over Time`
                : assetTypeFilter
                  ? `${ASSET_TYPE_LABELS[assetTypeFilter as AssetType] || assetTypeFilter} — Value Over Time`
                  : "Portfolio Value Over Time"}
            </h3>

            {valueChartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No value history data available. Historical data will build over time.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={valueChartData}>
                  <defs>
                    <linearGradient id="colorValueAnalysis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value), currency === "EGP" ? "EGP" : "USD")
                    }
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "13px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorValueAnalysis)"
                    name="Portfolio Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart B: Market Price with Entry Points */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              {symbolFilter
                ? `${symbolNames[filteredAssets.find((a) => a.symbol === symbolFilter)?.storeSymbol || ""] || symbolFilter} — Market Price & Entry Points`
                : assetTypeFilter
                  ? `${ASSET_TYPE_LABELS[assetTypeFilter as AssetType] || assetTypeFilter} — Market Prices`
                  : "Market Prices — All Assets"}
            </h3>

            {!priceChartData.series || (Array.isArray(priceChartData.series) && priceChartData.series.length === 0) ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No price history data available yet.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={priceChartData.series as any[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value), "USD"),
                        symbolNames[name as string] || name,
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "13px",
                      }}
                    />

                    {/* Price lines for each symbol */}
                    {priceChartData.symbols?.map((sym) => (
                      <Line
                        key={sym}
                        type="monotone"
                        dataKey={sym}
                        stroke={symbolColors[sym] || "#3b82f6"}
                        strokeWidth={2}
                        dot={false}
                        name={sym}
                        connectNulls
                      />
                    ))}

                    {/* Average purchase price reference line (only for single asset) */}
                    {avgPurchasePrice != null && (
                      <ReferenceLine
                        y={avgPurchasePrice}
                        stroke="#ef4444"
                        strokeDasharray="8 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Avg: $${avgPurchasePrice.toLocaleString()}`,
                          position: "right",
                          fill: "#ef4444",
                          fontSize: 11,
                        }}
                      />
                    )}

                    {/* Entry point markers */}
                    {entryPoints.map((ep, i) => {
                      const chartRows = priceChartData.series as any[];
                      if (chartRows.length === 0) return null;

                      const epTime = new Date(ep.date).getTime();

                      // Find closest chart date, or clamp to chart edges
                      let matchIdx = 0;
                      let minDiff = Infinity;
                      for (let j = 0; j < chartRows.length; j++) {
                        const diff = Math.abs(
                          new Date(chartRows[j].rawDate).getTime() - epTime
                        );
                        if (diff < minDiff) {
                          minDiff = diff;
                          matchIdx = j;
                        }
                      }

                      // If entry is before chart start, pin to first row
                      const firstDate = new Date(chartRows[0].rawDate).getTime();
                      if (epTime < firstDate) {
                        matchIdx = 0;
                      }

                      const chartPrice = chartRows[matchIdx]?.[ep.symbol];
                      // Use market price on that date, or purchase price if unavailable
                      const yValue = chartPrice ?? ep.price;

                      // Determine if this entry is outside the visible period
                      const isOutOfRange = minDiff > 7 * 24 * 60 * 60 * 1000;

                      return (
                        <ReferenceDot
                          key={`entry-${i}`}
                          x={chartRows[matchIdx].date}
                          y={yValue}
                          r={6}
                          fill={isOutOfRange ? "#f59e0b" : "#ef4444"}
                          stroke="#fff"
                          strokeWidth={2}
                          label={
                            isOutOfRange
                              ? {
                                  value: `Bought: ${ep.dateLabel}`,
                                  position: "top",
                                  fontSize: 10,
                                  fill: "#f59e0b",
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>

                {/* Entry Points Legend */}
                {entryPoints.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                      Entry Points
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm" />
                      Entry Before Period (pinned to start)
                    </div>
                    {avgPurchasePrice != null && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-6 h-0 border-t-2 border-dashed border-red-500" />
                        Avg Purchase Price (${avgPurchasePrice.toLocaleString()})
                      </div>
                    )}
                  </div>
                )}

                {/* Symbol Legend (when multiple lines) */}
                {priceChartData.symbols && priceChartData.symbols.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {priceChartData.symbols.map((sym) => (
                      <div key={sym} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: symbolColors[sym] || "#3b82f6" }}
                        />
                        {symbolNames[sym] || sym}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { AllocationItem, InvestmentWithLiveData } from "@/lib/types";
import { formatCurrency, formatPercent, formatAxisValue, niceYDomain } from "@/lib/formatters";
import { X } from "lucide-react";

interface AssetSummary {
  label: string;
  assetType: string;
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
      assetType: item.assetType,
      color: item.color,
      value: currency === "EGP" ? item.valueUsd * egpRate : item.valueUsd,
      percentage: item.percentage,
      profitLossPct,
    };
  });
}

type SortKey = "label" | "percentage" | "value" | "profitLossPct";
type SortDir = "asc" | "desc";

// Use niceYDomain from lib/formatters for clean Y-axis ticks

// --- Main Component ---

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
  const [sortKey, setSortKey] = useState<SortKey>("percentage");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedAsset, setSelectedAsset] = useState<AssetSummary | null>(null);

  // Fetch real store symbols for non-metal asset types
  const [storeSymbolMap, setStoreSymbolMap] = useState<
    Record<string, string[]>
  >({});
  useEffect(() => {
    fetch("/api/analysis/assets")
      .then((r) => r.json())
      .then((assets: any[]) => {
        if (!Array.isArray(assets)) return;
        const map: Record<string, string[]> = {};
        for (const a of assets) {
          if (!map[a.assetType]) map[a.assetType] = [];
          if (!map[a.assetType].includes(a.storeSymbol)) {
            map[a.assetType].push(a.storeSymbol);
          }
        }
        setStoreSymbolMap(map);
      })
      .catch(() => {});
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

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

  const sorted = [...summaries].sort((a, b) => {
    const aVal = sortKey === "label" ? a.label : a[sortKey];
    const bVal = sortKey === "label" ? b.label : b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const chartData = allocation.map((item) => ({
    ...item,
    displayValue: currency === "EGP" ? item.valueUsd * egpRate : item.valueUsd,
  }));

  const handleAssetClick = (assetType: string) => {
    const summary = summaries.find((s) => s.assetType === assetType);
    if (summary) setSelectedAsset(summary);
  };

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
                onClick={(_, idx) => {
                  const item = allocation[idx];
                  if (item) handleAssetClick(item.assetType);
                }}
                className="cursor-pointer"
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
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th
                  className="text-left pb-2 font-medium cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort("label")}
                >
                  Asset{sortIndicator("label")}
                </th>
                <th
                  className="text-right pb-2 font-medium cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort("percentage")}
                >
                  %{sortIndicator("percentage")}
                </th>
                <th
                  className="text-right pb-2 font-medium cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort("value")}
                >
                  Value{sortIndicator("value")}
                </th>
                <th
                  className="text-right pb-2 font-medium cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort("profitLossPct")}
                >
                  P&L{sortIndicator("profitLossPct")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => (
                <tr
                  key={item.label}
                  className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedAsset(item)}
                >
                  <td className="py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {item.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-gray-500">
                    {item.percentage.toFixed(1)}%
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

      {/* Mini Chart Popup */}
      {selectedAsset && (
        <AssetMiniChartPopupWrapper
          asset={selectedAsset}
          currency={currency}
          storeSymbolMap={storeSymbolMap}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}

/**
 * Popup that shows mini charts for a selected asset type.
 */
function AssetMiniChartPopupWrapper({
  asset,
  currency,
  storeSymbolMap,
  onClose,
}: {
  asset: AssetSummary;
  currency: "USD" | "EGP";
  storeSymbolMap: Record<string, string[]>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"price" | "value">("price");
  const [data, setData] = useState<{
    priceHistory: any[];
    valueHistory: any[];
    investments: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let symbols: string[];
        if (asset.assetType === "gold") symbols = ["GOLD"];
        else if (asset.assetType === "silver") symbols = ["SILVER"];
        else if (storeSymbolMap[asset.assetType]?.length > 0)
          symbols = storeSymbolMap[asset.assetType];
        else {
          const assetsRes = await fetch("/api/analysis/assets");
          const allAssets = await assetsRes.json();
          symbols = Array.isArray(allAssets)
            ? allAssets
                .filter((a: any) => a.assetType === asset.assetType)
                .map((a: any) => a.storeSymbol)
            : [];
        }

        const [priceRes, valueRes, invRes] = await Promise.all([
          symbols.length > 0
            ? fetch(`/api/analysis/price-history?symbols=${symbols.join(",")}&period=90d`)
            : Promise.resolve(new Response("[]")),
          fetch(`/api/analysis/value-history?assetType=${asset.assetType}&period=90d`),
          fetch(`/api/investments?assetType=${asset.assetType}`),
        ]);

        const priceData = await priceRes.json();
        const valueData = await valueRes.json();
        const invData = await invRes.json();

        setData({
          priceHistory: Array.isArray(priceData) ? priceData : [],
          valueHistory: Array.isArray(valueData) ? valueData : [],
          investments: Array.isArray(invData) ? invData : [],
        });
      } catch {
        setData({ priceHistory: [], valueHistory: [], investments: [] });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [asset.assetType, storeSymbolMap]);

  // Price chart: group by date, average if multiple sub-assets
  const priceChartData = (data?.priceHistory || []).reduce(
    (acc, p) => {
      const dateLabel = new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const existing = acc.find((a: { dateLabel: string }) => a.dateLabel === dateLabel);
      if (existing) {
        existing.prices.push(p.priceUsd);
        existing.price = existing.prices.reduce((s: number, v: number) => s + v, 0) / existing.prices.length;
      } else {
        acc.push({ dateLabel, price: p.priceUsd, prices: [p.priceUsd] });
      }
      return acc;
    },
    [] as { dateLabel: string; price: number; prices: number[] }[]
  );

  const valueChartData = (data?.valueHistory || []).map((v: any) => ({
    dateLabel: new Date(v.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    rawDate: v.date,
    value: currency === "EGP" ? v.valueEgp : v.valueUsd,
  }));

  // Purchase date markers and weighted average price for Market Price tab
  const purchaseMarkers = (data?.investments || [])
    .filter((inv: any) => inv.purchaseDate || inv.createdAt)
    .map((inv: any) => {
      const dateStr = (inv.purchaseDate || inv.createdAt).split("T")[0];
      return {
        dateLabel: new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rawDate: dateStr,
        name: inv.name,
        purchasePrice: inv.purchasePrice,
        quantity: inv.quantity,
      };
    });

  // Weighted average purchase price across all investments of this asset type
  const avgPurchasePrice = (() => {
    const invs = data?.investments || [];
    if (invs.length === 0) return null;
    let totalCost = 0;
    let totalQty = 0;
    for (const inv of invs) {
      totalCost += inv.purchasePrice * inv.quantity;
      totalQty += inv.quantity;
    }
    return totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : null;
  })();

  // Dynamic Y-axis
  // Include avg purchase price in domain so the reference line is always visible
  const priceValues = priceChartData.map((d: any) => d.price);
  if (avgPurchasePrice != null) priceValues.push(avgPurchasePrice);
  const priceDomain = niceYDomain(priceValues);
  const valueDomain = niceYDomain(valueChartData.map((d: any) => d.value));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        ref={popupRef}
        className="bg-white rounded-xl shadow-xl border border-gray-200 w-[480px] max-w-[95vw] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
            <span className="font-semibold text-gray-900">{asset.label}</span>
            <span className="text-xs text-gray-400">90 days</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pb-3">
          <button
            onClick={() => setTab("price")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === "price" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Market Price
          </button>
          <button
            onClick={() => setTab("value")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === "value" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}
          >
            My Value
          </button>
        </div>

        <div className="px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">Loading...</div>
          ) : tab === "price" ? (
            priceChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No price data available</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={priceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} stroke="#94a3b8" interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={55} domain={priceDomain} tickFormatter={formatAxisValue} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value), "USD"), "Price"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Line type="monotone" dataKey="price" stroke={asset.color} strokeWidth={2} dot={false} />

                    {/* Weighted average purchase price line */}
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
                          fontSize: 10,
                        }}
                      />
                    )}

                    {/* Purchase date entry points */}
                    {purchaseMarkers.map((pm, i) => {
                      const matchIdx = priceChartData.findIndex(
                        (d: { dateLabel: string }) => d.dateLabel === pm.dateLabel
                      );
                      let targetIdx = matchIdx;
                      if (targetIdx === -1) {
                        // Find closest date
                        let minDiff = Infinity;
                        for (let j = 0; j < priceChartData.length; j++) {
                          const diff = Math.abs(
                            new Date(priceChartData[j].dateLabel + " 2026").getTime() -
                            new Date(pm.rawDate).getTime()
                          );
                          if (diff < minDiff) { minDiff = diff; targetIdx = j; }
                        }
                      }
                      if (targetIdx === -1 || !priceChartData[targetIdx]) return null;
                      const yVal = priceChartData[targetIdx].price;
                      return (
                        <ReferenceDot
                          key={`buy-${i}`}
                          x={priceChartData[targetIdx].dateLabel}
                          y={yVal}
                          r={5}
                          fill="#ef4444"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap gap-3">
                  {purchaseMarkers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm" />
                      Purchase dates
                    </div>
                  )}
                  {avgPurchasePrice != null && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <div className="w-5 h-0 border-t-2 border-dashed border-red-500" />
                      Avg cost: ${avgPurchasePrice.toLocaleString()}
                    </div>
                  )}
                </div>
              </>
            )
          ) : valueChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No value data available</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={valueChartData}>
                  <defs>
                    <linearGradient id={`miniGrad-${asset.assetType}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={asset.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={asset.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} stroke="#94a3b8" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={55} domain={valueDomain} tickFormatter={formatAxisValue} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value), currency), "Value"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="value" stroke={asset.color} strokeWidth={2} fill={`url(#miniGrad-${asset.assetType})`} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

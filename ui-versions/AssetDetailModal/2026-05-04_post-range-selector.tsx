"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import { X } from "lucide-react";
import { formatCurrency, formatAxisValue, niceYDomain } from "@/lib/formatters";
import {
  convertPurchaseToChartPrice,
  computePurchaseStats,
  type InvestmentForChart,
} from "@/lib/chart-helpers";

interface OwnedAssetType {
  assetType: string;
  label: string;
  color: string;
}

interface InvestmentRecord extends InvestmentForChart {
  id: number;
  symbol: string;
  name: string;
  purchaseDate: string | null;
  createdAt: string;
}

interface AssetDetailModalProps {
  initialAssetType: string;
  ownedAssetTypes: OwnedAssetType[];
  allInvestments: InvestmentRecord[];
  currency: "USD" | "EGP";
  egpRate: number;
  storeSymbolMap: Record<string, string[]>;
  onClose: () => void;
}

type ChartTab = "price" | "value";
type ChartPeriod = "90d" | "3m" | "6m" | "1y" | "all";

const PERIOD_OPTIONS: Array<{ key: ChartPeriod; label: string }> = [
  { key: "90d", label: "90D" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
];

const PERIOD_DAYS_MAP: Record<ChartPeriod, number | null> = {
  "90d": 90,
  "3m": 90,
  "6m": 180,
  "1y": 365,
  all: null,
};

// If chart would have more points than this, down-sample by week
const DOWNSAMPLE_THRESHOLD = 180;

interface PricePoint {
  date: string;
  symbol: string;
  priceUsd: number;
}

interface ValuePoint {
  date: string;
  valueUsd: number;
  valueEgp: number;
}

interface VisibleLayers {
  dots: boolean;
  avg: boolean;
  lowest: boolean;
  current: boolean;
}

export default function AssetDetailModal({
  initialAssetType,
  ownedAssetTypes,
  allInvestments,
  currency,
  egpRate,
  storeSymbolMap,
  onClose,
}: AssetDetailModalProps) {
  const [activeAssetType, setActiveAssetType] = useState(initialAssetType);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [tab, setTab] = useState<ChartTab>("price");
  const [period, setPeriod] = useState<ChartPeriod>("90d");
  const [visible, setVisible] = useState<VisibleLayers>({
    dots: true,
    avg: true,
    lowest: true,
    current: true,
  });
  const [data, setData] = useState<{
    priceHistory: PricePoint[];
    valueHistory: ValuePoint[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);

  const activeAssetInfo =
    ownedAssetTypes.find((a) => a.assetType === activeAssetType) ||
    ownedAssetTypes[0];

  // Reset symbol selection when asset type changes
  useEffect(() => {
    setActiveSymbol(null);
  }, [activeAssetType]);

  // Click-outside / ESC handling
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Investments filtered to current selection
  const selectedInvestments = useMemo(
    () =>
      allInvestments.filter((inv) => {
        if (inv.assetType !== activeAssetType) return false;
        if (activeSymbol && inv.symbol !== activeSymbol) return false;
        return true;
      }),
    [allInvestments, activeAssetType, activeSymbol]
  );

  // Distinct symbols for current asset type (for drill-down)
  const symbolsForType = useMemo(() => {
    const seen = new Map<string, string>();
    for (const inv of allInvestments) {
      if (inv.assetType !== activeAssetType) continue;
      if (!seen.has(inv.symbol)) seen.set(inv.symbol, inv.name);
    }
    return Array.from(seen.entries()).map(([symbol, name]) => ({
      symbol,
      name,
    }));
  }, [allInvestments, activeAssetType]);

  const showDrilldown = symbolsForType.length > 1;

  // Fetch price + value history for the current selection
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        let symbols: string[];
        if (activeSymbol) {
          symbols = [activeSymbol];
        } else if (activeAssetType === "gold") {
          symbols = ["GOLD"];
        } else if (activeAssetType === "silver") {
          symbols = ["SILVER"];
        } else if (storeSymbolMap[activeAssetType]?.length > 0) {
          symbols = storeSymbolMap[activeAssetType];
        } else {
          symbols = symbolsForType.map((s) => s.symbol);
        }

        const requests: Array<Promise<Response>> = [];
        requests.push(
          symbols.length > 0
            ? fetch(
                `/api/analysis/price-history?symbols=${symbols.join(",")}&period=${period}`
              )
            : Promise.resolve(new Response("[]"))
        );
        requests.push(
          fetch(
            `/api/analysis/value-history?assetType=${activeAssetType}&period=${period}`
          )
        );

        const [priceRes, valueRes] = await Promise.all(requests);
        const priceData = await priceRes.json();
        const valueData = await valueRes.json();
        if (cancelled) return;
        setData({
          priceHistory: Array.isArray(priceData) ? priceData : [],
          valueHistory: Array.isArray(valueData) ? valueData : [],
        });
      } catch {
        if (!cancelled) {
          setData({ priceHistory: [], valueHistory: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [activeAssetType, activeSymbol, storeSymbolMap, symbolsForType, period]);

  // Aggregate price history into one series (avg if multiple symbols same day)
  const priceChartData = useMemo(() => {
    const acc: { dateLabel: string; rawDate: string; price: number; prices: number[] }[] = [];
    for (const p of data?.priceHistory || []) {
      const existing = acc.find((a) => a.rawDate === p.date);
      if (existing) {
        existing.prices.push(p.priceUsd);
        existing.price =
          existing.prices.reduce((s, v) => s + v, 0) / existing.prices.length;
      } else {
        const dateLabel = new Date(p.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: period === "1y" || period === "all" ? "2-digit" : undefined,
        });
        acc.push({ dateLabel, rawDate: p.date, price: p.priceUsd, prices: [p.priceUsd] });
      }
    }
    acc.sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    // Downsample to weekly average if too many points
    if (acc.length > DOWNSAMPLE_THRESHOLD) {
      const weeks = new Map<string, { dateLabel: string; rawDate: string; sum: number; count: number }>();
      for (const point of acc) {
        const d = new Date(point.rawDate);
        // Bucket by ISO week (year + week number)
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
        const key = `${d.getFullYear()}-W${weekNum}`;
        const existing = weeks.get(key);
        if (existing) {
          existing.sum += point.price;
          existing.count += 1;
        } else {
          weeks.set(key, {
            dateLabel: point.dateLabel,
            rawDate: point.rawDate,
            sum: point.price,
            count: 1,
          });
        }
      }
      return Array.from(weeks.values())
        .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
        .map((w) => ({
          dateLabel: w.dateLabel,
          rawDate: w.rawDate,
          price: w.sum / w.count,
          prices: [],
        }));
    }
    return acc;
  }, [data?.priceHistory, period]);

  // Value chart data — for aggregate view use the API data; for symbol drill-down,
  // synthesize from price × quantity (post-purchase only)
  const valueChartData = useMemo(() => {
    if (!activeSymbol) {
      return (data?.valueHistory || []).map((v) => ({
        dateLabel: new Date(v.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        rawDate: v.date,
        value: currency === "EGP" ? v.valueEgp : v.valueUsd,
      }));
    }
    if (selectedInvestments.length === 0) return [];
    const earliestPurchase = selectedInvestments
      .map((inv) => inv.purchaseDate || inv.createdAt)
      .sort()[0];
    return priceChartData
      .filter((d) => d.rawDate >= earliestPurchase)
      .map((d) => {
        let totalQtyChartUnit = 0;
        for (const inv of selectedInvestments) {
          const purchaseDate = inv.purchaseDate || inv.createdAt;
          if (d.rawDate >= purchaseDate) {
            const qty =
              (inv.assetType === "gold" || inv.assetType === "silver") &&
              inv.weightUnit === "grams"
                ? inv.quantity / 31.1035
                : inv.quantity;
            totalQtyChartUnit += qty;
          }
        }
        const valueUsd = d.price * totalQtyChartUnit;
        return {
          dateLabel: d.dateLabel,
          rawDate: d.rawDate,
          value: currency === "EGP" ? valueUsd * egpRate : valueUsd,
        };
      });
  }, [activeSymbol, data?.valueHistory, currency, priceChartData, selectedInvestments, egpRate]);

  // Purchase stats (avg, lowest) using the shared helper
  const stats = useMemo(
    () => computePurchaseStats(selectedInvestments, egpRate),
    [selectedInvestments, egpRate]
  );

  // Purchase markers — Y position is the user's actual purchase price (chart unit)
  // Markers whose purchase date is older than the chart window are flagged
  // `outsideWindow` so we can snap them to the leftmost edge with a label.
  const purchaseMarkers = useMemo(() => {
    const earliestVisibleDate = priceChartData[0]?.rawDate;
    return selectedInvestments
      .filter((inv) => inv.purchaseDate || inv.createdAt)
      .map((inv) => {
        const dateStr = (inv.purchaseDate || inv.createdAt).split("T")[0];
        const outsideWindow =
          earliestVisibleDate != null && dateStr < earliestVisibleDate;
        return {
          dateLabel: new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          rawDate: dateStr,
          name: inv.name,
          symbol: inv.symbol,
          outsideWindow,
          yValue: convertPurchaseToChartPrice(inv, egpRate),
        };
      });
  }, [selectedInvestments, egpRate, priceChartData]);

  const outsideWindowCount = useMemo(
    () => purchaseMarkers.filter((m) => m.outsideWindow).length,
    [purchaseMarkers]
  );

  const latestPrice =
    priceChartData.length > 0
      ? priceChartData[priceChartData.length - 1].price
      : null;

  // Y-axis domain — include all reference lines + dots so they're visible
  const priceDomain = useMemo(() => {
    const values: number[] = priceChartData.map((d) => d.price);
    if (visible.avg && stats.avgPrice != null) values.push(stats.avgPrice);
    if (visible.lowest && stats.lowestPrice != null) values.push(stats.lowestPrice);
    if (visible.current && latestPrice != null) values.push(latestPrice);
    if (visible.dots) {
      for (const pm of purchaseMarkers) values.push(pm.yValue);
    }
    return niceYDomain(values);
  }, [priceChartData, stats, latestPrice, visible, purchaseMarkers]);

  const valueDomain = useMemo(
    () => niceYDomain(valueChartData.map((d) => d.value)),
    [valueChartData]
  );

  function toggleLayer(layer: keyof VisibleLayers) {
    setVisible((v) => ({ ...v, [layer]: !v[layer] }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        ref={popupRef}
        className="bg-white rounded-xl shadow-xl border border-gray-200 w-[800px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeAssetInfo?.color }}
            />
            <span className="font-semibold text-gray-900">
              {activeAssetInfo?.label}
            </span>
            {activeSymbol && (
              <span className="text-sm text-gray-500">
                · {symbolsForType.find((s) => s.symbol === activeSymbol)?.name || activeSymbol}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {PERIOD_OPTIONS.find((p) => p.key === period)?.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Asset type tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-gray-100 overflow-x-auto">
          {ownedAssetTypes.map((at) => {
            const isActive = at.assetType === activeAssetType;
            return (
              <button
                key={at.assetType}
                onClick={() => setActiveAssetType(at.assetType)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: at.color }}
                />
                {at.label}
              </button>
            );
          })}
        </div>

        {/* Drill-down + chart-tab row */}
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex gap-1">
            <button
              onClick={() => setTab("price")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "price"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Market Price
            </button>
            <button
              onClick={() => setTab("value")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "value"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              My Value
            </button>
          </div>

          <div className="flex items-center gap-3">
            {showDrilldown && (
              <select
                value={activeSymbol || ""}
                onChange={(e) => setActiveSymbol(e.target.value || null)}
                className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-[260px]"
              >
                <option value="">Aggregate ({symbolsForType.length} assets)</option>
                {symbolsForType.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.name} ({s.symbol})
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                    period === p.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 px-5 pb-5 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
              Loading...
            </div>
          ) : tab === "price" ? (
            priceChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                No price data available
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={priceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      width={60}
                      domain={priceDomain}
                      tickFormatter={formatAxisValue}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value), "USD"),
                        "Price",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={activeAssetInfo?.color || "#6366f1"}
                      strokeWidth={2}
                      dot={false}
                    />

                    {visible.avg && stats.avgPrice != null && (
                      <ReferenceLine
                        y={stats.avgPrice}
                        stroke="#ef4444"
                        strokeDasharray="8 4"
                        strokeWidth={1.5}
                      />
                    )}

                    {visible.lowest && stats.lowestPrice != null && (
                      <ReferenceLine
                        y={stats.lowestPrice}
                        stroke="#10b981"
                        strokeDasharray="8 4"
                        strokeWidth={1.5}
                      />
                    )}

                    {visible.current && latestPrice != null && (
                      <ReferenceLine
                        y={latestPrice}
                        stroke="#f59e0b"
                        strokeDasharray="6 3"
                        strokeWidth={1.5}
                      />
                    )}

                    {visible.dots &&
                      purchaseMarkers.map((pm, i) => {
                        let targetIdx: number;
                        if (pm.outsideWindow) {
                          // Snap to leftmost edge with a label so user knows it's pulled
                          targetIdx = 0;
                        } else {
                          targetIdx = priceChartData.findIndex(
                            (d) => d.rawDate === pm.rawDate
                          );
                          if (targetIdx === -1) {
                            let minDiff = Infinity;
                            for (let j = 0; j < priceChartData.length; j++) {
                              const diff = Math.abs(
                                new Date(priceChartData[j].rawDate).getTime() -
                                  new Date(pm.rawDate).getTime()
                              );
                              if (diff < minDiff) {
                                minDiff = diff;
                                targetIdx = j;
                              }
                            }
                          }
                        }
                        if (targetIdx === -1 || !priceChartData[targetIdx])
                          return null;
                        return (
                          <ReferenceDot
                            key={`buy-${i}`}
                            x={priceChartData[targetIdx].dateLabel}
                            y={pm.yValue}
                            r={pm.outsideWindow ? 6 : 5}
                            fill={pm.outsideWindow ? "#fbbf24" : "#ef4444"}
                            stroke="#fff"
                            strokeWidth={2}
                            label={
                              pm.outsideWindow
                                ? {
                                    value: `← ${new Date(pm.rawDate).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}`,
                                    position: "right",
                                    fill: "#92400e",
                                    fontSize: 9,
                                    offset: 6,
                                  }
                                : undefined
                            }
                          />
                        );
                      })}
                  </LineChart>
                </ResponsiveContainer>

                {/* Legend with click-to-toggle */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {purchaseMarkers.length > 0 && (
                    <LegendButton
                      active={visible.dots}
                      onClick={() => toggleLayer("dots")}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm" />
                      Purchase dates ({purchaseMarkers.length}
                      {outsideWindowCount > 0 && (
                        <>, {outsideWindowCount} earlier</>
                      )})
                    </LegendButton>
                  )}
                  {stats.avgPrice != null && (
                    <LegendButton
                      active={visible.avg}
                      onClick={() => toggleLayer("avg")}
                    >
                      <div className="w-5 h-0 border-t-2 border-dashed border-red-500" />
                      Avg cost: ${stats.avgPrice.toLocaleString()}
                    </LegendButton>
                  )}
                  {stats.lowestPrice != null &&
                    stats.lowestPrice !== stats.avgPrice && (
                      <LegendButton
                        active={visible.lowest}
                        onClick={() => toggleLayer("lowest")}
                      >
                        <div className="w-5 h-0 border-t-2 border-dashed border-emerald-500" />
                        Lowest: ${stats.lowestPrice.toLocaleString()}
                      </LegendButton>
                    )}
                  {latestPrice != null && (
                    <LegendButton
                      active={visible.current}
                      onClick={() => toggleLayer("current")}
                    >
                      <div className="w-5 h-0 border-t-2 border-dashed border-amber-500" />
                      Current: ${latestPrice.toLocaleString()}
                    </LegendButton>
                  )}
                </div>
              </>
            )
          ) : valueChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
              No value data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={valueChartData}>
                <defs>
                  <linearGradient
                    id={`miniGrad-${activeAssetType}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={activeAssetInfo?.color || "#6366f1"}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor={activeAssetInfo?.color || "#6366f1"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  width={60}
                  domain={valueDomain}
                  tickFormatter={formatAxisValue}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value), currency),
                    "Value",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeAssetInfo?.color || "#6366f1"}
                  strokeWidth={2}
                  fill={`url(#miniGrad-${activeAssetType})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs transition-opacity ${
        active ? "text-gray-600 opacity-100" : "text-gray-400 opacity-50 line-through"
      } hover:text-gray-800`}
    >
      {children}
    </button>
  );
}


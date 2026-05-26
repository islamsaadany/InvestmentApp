"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, ShieldOff } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

// Schema the agent emits inside <recommendation>...</recommendation>
export interface Recommendation {
  ticker: string;
  company: string;
  sector: string;
  halal_status: "HALAL" | "REVIEW NEEDED" | "NOT HALAL" | string;
  screening_source: string;
  verdict: string;
  conviction: "HIGH" | "MODERATE" | "LOW" | string;
  entry_zone: { low: number; high: number } | null;
  target_12mo: number | null;
  stop_loss: number | null;
  position_size_pct: number | null;
  summary: string;
  why: string;
  target_rationale: string;
  stop_rationale: string;
  risks: string[];
  catalysts: string[];
  purification_note: string;
}

interface PricePoint {
  date: string;
  priceUsd: number;
}

interface LivePrice {
  priceUsd: number;
}

const PERIODS = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
];

function verdictStyle(verdict: string): { bg: string; text: string } {
  const v = verdict.toUpperCase();
  if (v.includes("STRONG BUY")) return { bg: "bg-emerald-600", text: "text-white" };
  if (v.includes("BUY") || v === "ADD") return { bg: "bg-emerald-500", text: "text-white" };
  if (v === "HOLD") return { bg: "bg-blue-500", text: "text-white" };
  if (v === "WAIT") return { bg: "bg-amber-500", text: "text-white" };
  if (v === "TRIM" || v === "SELL") return { bg: "bg-orange-500", text: "text-white" };
  if (v === "AVOID") return { bg: "bg-red-600", text: "text-white" };
  return { bg: "bg-gray-500", text: "text-white" };
}

function convictionStyle(conviction: string): string {
  const c = conviction.toUpperCase();
  if (c === "HIGH") return "bg-purple-100 text-purple-700 border-purple-300";
  if (c === "MODERATE") return "bg-indigo-100 text-indigo-700 border-indigo-300";
  return "bg-gray-100 text-gray-600 border-gray-300";
}

function halalStyle(status: string): { bg: string; text: string; Icon: typeof ShieldCheck } {
  const s = status.toUpperCase();
  if (s === "HALAL") return { bg: "bg-green-100 text-green-700 border-green-300", text: "HALAL", Icon: ShieldCheck };
  if (s.includes("REVIEW")) return { bg: "bg-amber-100 text-amber-700 border-amber-300", text: "REVIEW NEEDED", Icon: AlertTriangle };
  return { bg: "bg-red-100 text-red-700 border-red-300", text: "NOT HALAL", Icon: ShieldOff };
}

export default function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(false);
  const [period, setPeriod] = useState("3m");

  const ticker = rec.ticker?.toUpperCase() ?? "";

  // Live current price
  const { data: live } = useQuery<LivePrice | null>({
    queryKey: ["expert-rec-price", ticker],
    queryFn: async () => {
      if (!ticker) return null;
      const res = await fetch(`/api/market/price/us_stock/${encodeURIComponent(ticker)}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
    enabled: !!ticker,
  });

  // Price history for mini chart
  const { data: history, isLoading: historyLoading } = useQuery<PricePoint[]>({
    queryKey: ["expert-rec-history", ticker, period],
    queryFn: async () => {
      if (!ticker) return [];
      const res = await fetch(
        `/api/analysis/price-history?ticker=${encodeURIComponent(ticker)}&assetType=us_stock&period=${period}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 300_000,
    enabled: !!ticker,
  });

  const currentPrice = live?.priceUsd ?? null;
  // Day change: derive from the tail of the history series we already fetched,
  // so we don't depend on the market-price endpoint exposing prev close.
  const dayChangePct = (() => {
    if (!history || history.length < 2) return null;
    const last = history[history.length - 1].priceUsd;
    const prev = history[history.length - 2].priceUsd;
    if (!prev) return null;
    return ((last - prev) / prev) * 100;
  })();

  const upsidePct =
    currentPrice != null && rec.target_12mo != null && currentPrice !== 0
      ? ((rec.target_12mo - currentPrice) / currentPrice) * 100
      : null;
  const stopPct =
    currentPrice != null && rec.stop_loss != null && currentPrice !== 0
      ? ((rec.stop_loss - currentPrice) / currentPrice) * 100
      : null;

  const verdictColors = verdictStyle(rec.verdict || "");
  const convictionClasses = convictionStyle(rec.conviction || "");
  const halal = halalStyle(rec.halal_status || "");
  const HalalIcon = halal.Icon;

  // Stale-levels sanity check — flag when AI's price anchors are clearly out
  // of sync with the live price. Common cause: model used training-data prices
  // (e.g. JNJ "$148" when it's actually $234).
  const staleReasons: string[] = [];
  if (currentPrice != null && rec.target_12mo != null && rec.target_12mo < currentPrice) {
    staleReasons.push(
      `12-month target ($${rec.target_12mo}) is BELOW current price ($${currentPrice.toFixed(2)})`
    );
  }
  if (currentPrice != null && rec.entry_zone) {
    const farAboveHigh = currentPrice > rec.entry_zone.high * 1.2; // current >20% above entry top
    const farBelowLow = currentPrice < rec.entry_zone.low * 0.8; // current >20% below entry bottom
    if (farAboveHigh) {
      staleReasons.push(
        `current price ($${currentPrice.toFixed(2)}) is more than 20% above the entry zone top ($${rec.entry_zone.high})`
      );
    } else if (farBelowLow) {
      staleReasons.push(
        `current price ($${currentPrice.toFixed(2)}) is more than 20% below the entry zone bottom ($${rec.entry_zone.low})`
      );
    }
  }
  if (
    currentPrice != null &&
    rec.stop_loss != null &&
    rec.stop_loss > currentPrice
  ) {
    staleReasons.push(
      `stop ($${rec.stop_loss}) is ABOVE current price ($${currentPrice.toFixed(2)})`
    );
  }
  const hasStaleLevels = staleReasons.length > 0;

  const chartMin = history && history.length > 0
    ? Math.min(...history.map((p) => p.priceUsd))
    : 0;
  const chartMax = history && history.length > 0
    ? Math.max(...history.map((p) => p.priceUsd))
    : 0;
  const chartPad = (chartMax - chartMin) * 0.08 || 1;
  const yDomain: [number, number] = [
    Math.max(0, chartMin - chartPad),
    chartMax + chartPad,
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 my-3 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold text-gray-900">{ticker}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${halal.bg}`}>
              <HalalIcon className="w-3 h-3" />
              {halal.text}
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-0.5 truncate">{rec.company}</div>
        </div>
        <div className="text-right flex-shrink-0">
          {currentPrice != null ? (
            <>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(currentPrice, "USD")}
              </div>
              {dayChangePct != null && (
                <div
                  className={`text-xs font-medium ${
                    dayChangePct >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {dayChangePct >= 0 ? "+" : ""}
                  {dayChangePct.toFixed(2)}% 1d
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-400">Loading price…</div>
          )}
        </div>
      </div>

      {/* Stale-levels warning — fires when AI's price anchors clearly conflict
          with the live current price (most often: training-data prices). */}
      {hasStaleLevels && (
        <div className="mb-3 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">AI&apos;s price levels look stale.</span>{" "}
            {staleReasons.join("; ")}. The AI may be anchored to older training
            data — re-prompt with the current price, or verify before acting.
          </div>
        </div>
      )}

      {/* Verdict + Conviction chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold tracking-wide ${verdictColors.bg} ${verdictColors.text}`}
        >
          {rec.verdict?.toUpperCase()}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${convictionClasses}`}
        >
          {rec.conviction?.toUpperCase()} CONVICTION
        </span>
        {rec.position_size_pct != null && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Size: {rec.position_size_pct}%
          </span>
        )}
      </div>

      {/* Mini chart */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium text-gray-500">Price history</div>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${
                  period === p.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-32 sm:h-36">
          {historyLoading ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              Loading chart…
            </div>
          ) : history && history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  hide={true}
                />
                <YAxis
                  domain={yDomain}
                  hide={true}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, padding: "4px 8px" }}
                  formatter={(v) => formatCurrency(typeof v === "number" ? v : Number(v), "USD")}
                  labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                {rec.target_12mo != null && (
                  <ReferenceLine
                    y={rec.target_12mo}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                )}
                {rec.stop_loss != null && (
                  <ReferenceLine
                    y={rec.stop_loss}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                )}
                {rec.entry_zone && (
                  <>
                    <ReferenceLine
                      y={rec.entry_zone.low}
                      stroke="#6366f1"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      opacity={0.6}
                    />
                    <ReferenceLine
                      y={rec.entry_zone.high}
                      stroke="#6366f1"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      opacity={0.6}
                    />
                  </>
                )}
                <Area
                  type="monotone"
                  dataKey="priceUsd"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill={`url(#grad-${ticker})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              No price history available
            </div>
          )}
        </div>
      </div>

      {/* Price ladder */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
          <div className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">Entry</div>
          <div className="text-sm font-bold text-indigo-900 mt-0.5">
            {rec.entry_zone
              ? `$${rec.entry_zone.low}–${rec.entry_zone.high}`
              : "—"}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
          <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Target (12mo)</div>
          <div className="text-sm font-bold text-emerald-900 mt-0.5">
            {rec.target_12mo != null ? `$${rec.target_12mo}` : "—"}
            {upsidePct != null && (
              <span
                className={`ml-1 text-[10px] font-medium ${
                  upsidePct >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {upsidePct >= 0 ? "↑" : "↓"}
                {upsidePct >= 0 ? "+" : ""}
                {upsidePct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <div className="text-[10px] font-semibold text-red-700 uppercase tracking-wide">Stop</div>
          <div className="text-sm font-bold text-red-900 mt-0.5">
            {rec.stop_loss != null ? `$${rec.stop_loss}` : "—"}
            {stopPct != null && (
              <span
                className={`ml-1 text-[10px] font-medium ${
                  stopPct >= 0 ? "text-amber-700" : "text-red-700"
                }`}
              >
                {stopPct >= 0 ? "↑+" : "↓"}
                {stopPct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border-l-4 border-blue-500 rounded-r-md px-3 py-2 mb-3">
        <div className="text-sm text-gray-800 italic">{rec.summary}</div>
      </div>

      {/* Expander toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
      >
        {expanded ? (
          <>
            Hide details <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            Understand more <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 space-y-4 text-sm text-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-gray-100">
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Sector</div>
              <div className="text-sm">{rec.sector}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Screening source</div>
              <div className="text-sm">{rec.screening_source}</div>
            </div>
          </div>

          {rec.why && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Why this idea</div>
              <p className="leading-relaxed">{rec.why}</p>
            </div>
          )}

          {rec.target_rationale && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Target rationale</div>
              <p className="leading-relaxed">{rec.target_rationale}</p>
            </div>
          )}

          {rec.stop_rationale && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Stop / thesis-broken trigger</div>
              <p className="leading-relaxed">{rec.stop_rationale}</p>
            </div>
          )}

          {rec.risks && rec.risks.length > 0 && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Key risks</div>
              <ul className="list-disc list-inside space-y-0.5">
                {rec.risks.map((r, i) => (
                  <li key={i} className="leading-relaxed">{r}</li>
                ))}
              </ul>
            </div>
          )}

          {rec.catalysts && rec.catalysts.length > 0 && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Catalysts to watch</div>
              <ul className="list-disc list-inside space-y-0.5">
                {rec.catalysts.map((c, i) => (
                  <li key={i} className="leading-relaxed">{c}</li>
                ))}
              </ul>
            </div>
          )}

          {rec.purification_note && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="font-semibold text-amber-900 text-xs mb-1 uppercase tracking-wide">
                Purification note
              </div>
              <p className="text-amber-900 leading-relaxed text-sm">{rec.purification_note}</p>
            </div>
          )}

          <div className="text-[11px] text-gray-400 italic border-t border-gray-100 pt-2">
            Levels suggested by AI on {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}; verify against current price before acting.
          </div>
        </div>
      )}
    </div>
  );
}

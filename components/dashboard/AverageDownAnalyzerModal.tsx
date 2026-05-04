"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { X, TrendingDown, AlertTriangle, Check, Info } from "lucide-react";
import {
  analyzeInvestments,
  type AnalyzerRecommendation,
  type DipBucket,
} from "@/lib/average-down-analyzer";
import type { PortfolioSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  onClose: () => void;
}

const BUCKET_META: Record<
  DipBucket,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeBg: string;
    badgeText: string;
    cardBorder: string;
    description: string;
  }
> = {
  below_lowest: {
    label: "Below lowest entry",
    icon: TrendingDown,
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    cardBorder: "border-emerald-200",
    description: "Strongest averaging-down signal",
  },
  good_dip: {
    label: "Good dip",
    icon: TrendingDown,
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    cardBorder: "border-blue-200",
    description: "5-25% below avg cost",
  },
  deep_dip: {
    label: "Deep drawdown",
    icon: AlertTriangle,
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    cardBorder: "border-amber-200",
    description: "Verify thesis before adding",
  },
  small_dip: {
    label: "Small dip",
    icon: Info,
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
    cardBorder: "border-gray-200",
    description: "Within normal noise",
  },
  above_avg: {
    label: "Above avg cost",
    icon: Check,
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-500",
    cardBorder: "border-gray-200",
    description: "Currently profitable",
  },
};

const FILTER_TABS: Array<{ key: "actionable" | "all"; label: string }> = [
  { key: "actionable", label: "Actionable" },
  { key: "all", label: "All assets" },
];

export default function AverageDownAnalyzerModal({ onClose }: Props) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"actionable" | "all">("actionable");

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

  const { data: summary, isLoading } = useQuery<PortfolioSummary>({
    queryKey: ["portfolio-summary"],
    queryFn: () => axios.get("/api/portfolio/summary").then((r) => r.data),
  });

  const recommendations = useMemo<AnalyzerRecommendation[]>(() => {
    if (!summary) return [];
    return analyzeInvestments(summary.investments, summary.usdToEgpRate);
  }, [summary]);

  const counts = useMemo(() => {
    const c: Record<DipBucket, number> = {
      below_lowest: 0,
      good_dip: 0,
      deep_dip: 0,
      small_dip: 0,
      above_avg: 0,
    };
    for (const r of recommendations) c[r.bucket]++;
    return c;
  }, [recommendations]);

  const visibleRecs = useMemo(() => {
    if (filter === "all") return recommendations;
    return recommendations.filter(
      (r) =>
        r.bucket === "below_lowest" ||
        r.bucket === "good_dip" ||
        r.bucket === "deep_dip"
    );
  }, [recommendations, filter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        ref={popupRef}
        className="bg-white rounded-xl shadow-xl border border-gray-200 w-[760px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              Average Down Analyzer
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Identifies positions where current price is below your avg or lowest purchase
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Summary strip */}
        {!isLoading && summary && (
          <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
            <SummaryStat
              label="Strong opportunities"
              value={counts.below_lowest + counts.good_dip}
              tone="emerald"
            />
            <SummaryStat
              label="Verify before adding"
              value={counts.deep_dip}
              tone="amber"
            />
            <SummaryStat
              label="Above avg cost"
              value={counts.above_avg}
              tone="gray"
            />
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 px-5 py-3">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === t.key
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t.label}{" "}
              {t.key === "actionable" && (
                <span className="ml-1 opacity-60">
                  ({counts.below_lowest + counts.good_dip + counts.deep_dip})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Recommendations list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              Analyzing your portfolio...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm text-center px-6">
              No investments to analyze yet. Add positions to see recommendations.
            </div>
          ) : visibleRecs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 text-sm text-center px-6">
              <Check className="w-8 h-8 text-emerald-500 mb-2" />
              No actionable averaging-down opportunities right now — all your positions are above their avg cost or only mildly down.
              <button
                onClick={() => setFilter("all")}
                className="mt-3 text-xs text-blue-600 hover:underline"
              >
                Show all assets anyway
              </button>
            </div>
          ) : (
            visibleRecs.map((r) => (
              <RecommendationCard key={`${r.assetType}-${r.symbol}`} rec={r} />
            ))
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            This is rule-based analysis using only your purchase data and live prices — not financial advice. Always verify the underlying thesis before adding to any position.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "gray";
}) {
  const toneClass = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    gray: "text-gray-700",
  }[tone];
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: AnalyzerRecommendation }) {
  const meta = BUCKET_META[rec.bucket];
  const Icon = meta.icon;
  return (
    <div className={`rounded-lg border ${meta.cardBorder} bg-white p-4`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${meta.badgeText}`} />
          <h4 className="text-sm font-semibold text-gray-900 leading-snug">
            {rec.headline}
          </h4>
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${meta.badgeBg} ${meta.badgeText}`}
        >
          {meta.label}
        </span>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed mb-3">{rec.detail}</p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat
          label="Current"
          value={`$${rec.currentPriceChartUnit.toFixed(2)}`}
        />
        <Stat
          label="Avg cost"
          value={`$${rec.avgPriceChartUnit.toFixed(2)}`}
        />
        <Stat
          label="Lowest"
          value={`$${rec.lowestPriceChartUnit.toFixed(2)}`}
        />
        <Stat
          label="Position size"
          value={formatCurrency(rec.currentValueUsd, "USD")}
        />
        <Stat
          label="Cost basis"
          value={formatCurrency(rec.costBasisUsd, "USD")}
        />
        <Stat
          label="Unrealized P&L"
          value={`${rec.unrealizedPnlPct >= 0 ? "+" : ""}${rec.unrealizedPnlPct.toFixed(1)}%`}
          tone={rec.unrealizedPnlPct >= 0 ? "green" : "red"}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "red";
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "red"
        ? "text-red-600"
        : "text-gray-900";
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className={`font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}

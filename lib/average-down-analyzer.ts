/**
 * Pure rule-based "should I average down?" analyzer.
 * No AI, no network calls — just math on the user's investments + live prices.
 *
 * For each investment we compare the current market price against:
 *   - The weighted average purchase price (across same symbol if multiple buys)
 *   - The lowest individual purchase price (cheapest entry the user has had)
 *
 * Result classification:
 *   "above_avg"    → current price >= avg cost: nothing to do
 *   "small_dip"    → 0-5% below avg: noise, no action
 *   "good_dip"     → 5-25% below avg: averaging down here meaningfully lowers avg
 *   "deep_dip"     → >25% below avg: thesis-check warning before adding
 *   "below_lowest" → current < lowest individual purchase: strongest averaging-down signal
 */

import type { InvestmentWithLiveData } from "./types";
import {
  convertPurchaseToChartPrice,
  computePurchaseStats,
  type InvestmentForChart,
} from "./chart-helpers";

export type DipBucket =
  | "above_avg"
  | "small_dip"
  | "good_dip"
  | "deep_dip"
  | "below_lowest";

export interface AnalyzerRecommendation {
  symbol: string;
  name: string;
  assetType: string;
  bucket: DipBucket;
  currentPriceChartUnit: number; // current price in chart unit (USD/oz for metals, USD/unit otherwise)
  avgPriceChartUnit: number;
  lowestPriceChartUnit: number;
  pctBelowAvg: number; // negative means below
  pctBelowLowest: number;
  totalQty: number;
  costBasisUsd: number;
  currentValueUsd: number;
  unrealizedPnlPct: number;
  headline: string;
  detail: string;
}

const SMALL_DIP_THRESHOLD = 5;
const GOOD_DIP_THRESHOLD = 25;

const ASSET_LABELS: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  crypto: "Crypto",
  us_stock: "US Stock",
  egx_stock: "EGX Stock",
};

function classify(
  pctBelowAvg: number,
  pctBelowLowest: number
): DipBucket {
  if (pctBelowLowest > 0) return "below_lowest";
  if (pctBelowAvg <= 0) return "above_avg";
  if (pctBelowAvg < SMALL_DIP_THRESHOLD) return "small_dip";
  if (pctBelowAvg <= GOOD_DIP_THRESHOLD) return "good_dip";
  return "deep_dip";
}

function buildHeadline(
  bucket: DipBucket,
  name: string,
  pctBelowAvg: number,
  pctBelowLowest: number
): string {
  switch (bucket) {
    case "below_lowest":
      return `${name} — current price is below your lowest purchase by ${pctBelowLowest.toFixed(1)}%`;
    case "deep_dip":
      return `${name} — ${pctBelowAvg.toFixed(1)}% below your avg cost (large drawdown — verify thesis)`;
    case "good_dip":
      return `${name} — ${pctBelowAvg.toFixed(1)}% below your avg cost (good averaging-down opportunity)`;
    case "small_dip":
      return `${name} — ${pctBelowAvg.toFixed(1)}% below your avg cost (within normal noise)`;
    case "above_avg":
    default:
      return `${name} — currently above your avg cost`;
  }
}

function buildDetail(
  bucket: DipBucket,
  pctBelowAvg: number,
  pctBelowLowest: number
): string {
  switch (bucket) {
    case "below_lowest":
      return `Strong averaging-down candidate. Current price is below every purchase you've made (lowest entry was ${pctBelowLowest.toFixed(1)}% above current). Consider adding only if your investment thesis is still intact.`;
    case "deep_dip":
      return `Drawdown is over ${GOOD_DIP_THRESHOLD}% from your avg cost. Large drops can mean a real change in fundamentals — review the asset before averaging down. If the thesis still holds, this is a high-conviction add zone; if not, it may be a value trap.`;
    case "good_dip":
      return `A meaningful dip below your avg cost. Adding here will measurably lower your average price. Standard rules: only add if you'd buy fresh at this level and stay within position-size limits.`;
    case "small_dip":
      return `Within the ${SMALL_DIP_THRESHOLD}% noise band. Averaging down here barely moves your avg cost. Better to wait for a deeper dip or accumulate via DCA on schedule.`;
    case "above_avg":
    default:
      return `Currently above your avg cost. No averaging-down case — this is a "let it run" or "trim if overweight" situation.`;
  }
}

/**
 * Group investments by (assetType, symbol) — multiple buys of the same asset
 * roll up into a single recommendation row.
 */
function groupBySymbol(
  investments: InvestmentWithLiveData[]
): Map<string, InvestmentWithLiveData[]> {
  const map = new Map<string, InvestmentWithLiveData[]>();
  for (const inv of investments) {
    const key = `${inv.assetType}::${inv.symbol}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(inv);
  }
  return map;
}

/**
 * Get the current market price in chart unit (USD/oz for metals, USD/unit otherwise).
 */
function getCurrentPriceChartUnit(
  group: InvestmentWithLiveData[]
): number | null {
  const withPrice = group.find((inv) => inv.currentPrice != null);
  return withPrice?.currentPrice ?? null;
}

export function analyzeInvestments(
  investments: InvestmentWithLiveData[],
  egpRate: number
): AnalyzerRecommendation[] {
  if (investments.length === 0) return [];

  const groups = groupBySymbol(investments);
  const recommendations: AnalyzerRecommendation[] = [];

  for (const [, group] of groups) {
    const first = group[0];
    const currentPriceChartUnit = getCurrentPriceChartUnit(group);
    if (currentPriceChartUnit == null) continue;

    const stats = computePurchaseStats(
      group as InvestmentForChart[],
      egpRate
    );
    if (stats.avgPrice == null || stats.lowestPrice == null) continue;

    const pctBelowAvg =
      ((stats.avgPrice - currentPriceChartUnit) / stats.avgPrice) * 100;
    const pctBelowLowest =
      ((stats.lowestPrice - currentPriceChartUnit) / stats.lowestPrice) * 100;

    const bucket = classify(pctBelowAvg, pctBelowLowest);

    const totalQty = group.reduce((sum, inv) => sum + inv.quantity, 0);
    const costBasisUsd = group.reduce((sum, inv) => {
      if (inv.profitLoss != null && inv.currentValueUsd != null) {
        return sum + (inv.currentValueUsd - inv.profitLoss);
      }
      return sum;
    }, 0);
    const currentValueUsd = group.reduce(
      (sum, inv) => sum + (inv.currentValueUsd ?? 0),
      0
    );
    const unrealizedPnlPct =
      costBasisUsd > 0
        ? ((currentValueUsd - costBasisUsd) / costBasisUsd) * 100
        : 0;

    const displayName = `${first.name} (${ASSET_LABELS[first.assetType] ?? first.assetType})`;

    recommendations.push({
      symbol: first.symbol,
      name: first.name,
      assetType: first.assetType,
      bucket,
      currentPriceChartUnit,
      avgPriceChartUnit: stats.avgPrice,
      lowestPriceChartUnit: stats.lowestPrice,
      pctBelowAvg,
      pctBelowLowest,
      totalQty,
      costBasisUsd,
      currentValueUsd,
      unrealizedPnlPct,
      headline: buildHeadline(bucket, displayName, pctBelowAvg, pctBelowLowest),
      detail: buildDetail(bucket, pctBelowAvg, pctBelowLowest),
    });
  }

  // Sort: most actionable first (below_lowest, deep_dip, good_dip, small_dip, above_avg)
  const order: Record<DipBucket, number> = {
    below_lowest: 0,
    good_dip: 1,
    deep_dip: 2,
    small_dip: 3,
    above_avg: 4,
  };
  recommendations.sort((a, b) => {
    const o = order[a.bucket] - order[b.bucket];
    if (o !== 0) return o;
    return b.pctBelowAvg - a.pctBelowAvg;
  });

  return recommendations;
}

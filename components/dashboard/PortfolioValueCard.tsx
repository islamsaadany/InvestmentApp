"use client";

import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import ProfitLossIndicator from "@/components/common/ProfitLossIndicator";
import type { PortfolioSummary } from "@/lib/types";

export default function PortfolioValueCard({
  summary,
}: {
  summary: PortfolioSummary;
}) {
  const { currency } = useCurrency();
  const displayValue =
    currency === "EGP" ? summary.totalValueEgp : summary.totalValueUsd;
  const displayCurrency = currency === "EGP" ? "EGP" : "USD";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <DollarSign className="w-4 h-4" />
          Portfolio Value
        </div>
        <span className="text-xs text-gray-400">
          1 USD = {summary.usdToEgpRate.toFixed(2)} EGP
        </span>
      </div>
      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900">
          {formatCurrency(displayValue, displayCurrency)}
        </div>
        {currency === "both" && (
          <div className="text-lg text-gray-500 mt-1">
            {formatCurrency(summary.totalValueEgp, "EGP")}
          </div>
        )}
      </div>
      <ProfitLossIndicator
        value={summary.totalProfitLossUsd}
        percentage={summary.totalProfitLossPct}
      />
    </div>
  );
}

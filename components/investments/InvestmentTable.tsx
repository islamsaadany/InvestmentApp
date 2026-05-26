"use client";

import { Pencil, Trash2 } from "lucide-react";
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import CurrencyDisplay from "@/components/common/CurrencyDisplay";
import ProfitLossIndicator from "@/components/common/ProfitLossIndicator";
import type { InvestmentWithLiveData } from "@/lib/types";

interface Props {
  investments: InvestmentWithLiveData[];
  onEdit: (inv: InvestmentWithLiveData) => void;
  onDelete: (id: number) => void;
}

export default function InvestmentTable({
  investments,
  onEdit,
  onDelete,
}: Props) {
  return (
    <>
      {/* Mobile: card list (< md breakpoint) */}
      <div className="md:hidden space-y-3">
        {investments.map((inv) => (
          <div
            key={inv.id}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">
                  {inv.name}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{inv.symbol}</div>
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: ASSET_TYPE_COLORS[inv.assetType] + "20",
                  color: ASSET_TYPE_COLORS[inv.assetType],
                }}
              >
                {ASSET_TYPE_LABELS[inv.assetType]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  Qty
                </div>
                <div className="text-gray-800">
                  {formatNumber(inv.quantity, inv.assetType === "crypto" ? 6 : 2)}
                  {inv.weightUnit && (
                    <span className="text-xs text-gray-400 ml-1">
                      {inv.weightUnit}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  Buy Price
                </div>
                <div className="text-gray-800">
                  {formatCurrency(inv.purchasePrice, inv.purchaseCurrency)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  Current
                </div>
                <div className="text-gray-800">
                  {inv.currentPrice != null
                    ? formatCurrency(inv.currentPrice)
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  Value
                </div>
                <CurrencyDisplay
                  usd={inv.currentValueUsd}
                  egp={inv.currentValueEgp}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <ProfitLossIndicator
                value={inv.profitLoss}
                percentage={inv.profitLossPct}
                showValue={false}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(inv)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-md transition-colors"
                  aria-label="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(inv.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-md transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet/desktop: original table (≥ md breakpoint) */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Asset</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Buy Price</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Current Price</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Value</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">P&L</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{inv.name}</div>
                    <div className="text-xs text-gray-400">{inv.symbol}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: ASSET_TYPE_COLORS[inv.assetType] + "20",
                        color: ASSET_TYPE_COLORS[inv.assetType],
                      }}
                    >
                      {ASSET_TYPE_LABELS[inv.assetType]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {formatNumber(inv.quantity, inv.assetType === "crypto" ? 6 : 2)}
                    {inv.weightUnit && (
                      <span className="text-xs text-gray-400 ml-1">{inv.weightUnit}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {formatCurrency(inv.purchasePrice, inv.purchaseCurrency)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {inv.currentPrice != null ? formatCurrency(inv.currentPrice) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <CurrencyDisplay usd={inv.currentValueUsd} egp={inv.currentValueEgp} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ProfitLossIndicator value={inv.profitLoss} percentage={inv.profitLossPct} showValue={false} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(inv)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(inv.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { ASSET_TYPES, ASSET_TYPE_LABELS } from "@/lib/constants";
import type { AssetType, WeightUnit, ValuationMode } from "@/lib/types";

interface FormData {
  name: string;
  symbol: string;
  assetType: AssetType;
  quantity: string;
  purchasePrice: string;
  purchaseCurrency: string;
  purchaseDate: string;
  weightUnit?: WeightUnit;
  notes: string;
  egxMode: "individual" | "brokerage";
  currentValue: string;
}

export interface InvestmentFormValues {
  name: string;
  symbol: string;
  assetType: AssetType;
  quantity: number;
  purchasePrice: number;
  purchaseCurrency: string;
  purchaseDate?: string;
  weightUnit?: WeightUnit;
  valuationMode?: ValuationMode;
  currentValue?: number;
  notes?: string;
}

interface Props {
  onSubmit: (data: InvestmentFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<{
    name: string;
    symbol: string;
    assetType: AssetType;
    quantity: number;
    purchasePrice: number;
    purchaseCurrency: string;
    purchaseDate: string | null;
    weightUnit: WeightUnit | null;
    valuationMode: ValuationMode | null;
    currentValue: number | null;
    notes: string | null;
  }>;
  submitLabel?: string;
}

export default function InvestmentForm({
  onSubmit,
  isLoading,
  defaultValues,
  submitLabel = "Add Investment",
}: Props) {
  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      name: defaultValues?.name || "",
      symbol: defaultValues?.symbol || "",
      assetType: defaultValues?.assetType || "crypto",
      quantity: defaultValues?.quantity?.toString() || "",
      purchasePrice: defaultValues?.purchasePrice?.toString() || "",
      purchaseCurrency: defaultValues?.purchaseCurrency || "USD",
      purchaseDate: defaultValues?.purchaseDate?.split("T")[0] || "",
      weightUnit: defaultValues?.weightUnit || undefined,
      notes: defaultValues?.notes || "",
      egxMode: defaultValues?.valuationMode === "manual" ? "brokerage" : "individual",
      currentValue: defaultValues?.currentValue?.toString() || "",
    },
  });

  const assetType = watch("assetType");
  const egxMode = watch("egxMode");
  const isMetals = assetType === "gold" || assetType === "silver";
  const isEgx = assetType === "egx_stock";
  const isBrokerage = isEgx && egxMode === "brokerage";

  const handleFormSubmit = (data: FormData) => {
    if (isBrokerage) {
      const investedAmount = parseFloat(data.purchasePrice);
      const currentVal = parseFloat(data.currentValue);
      if (isNaN(investedAmount) || investedAmount <= 0) return;
      if (isNaN(currentVal) || currentVal <= 0) return;

      onSubmit({
        name: data.name,
        symbol: "EGX_BROKERAGE",
        assetType: data.assetType,
        quantity: 1,
        purchasePrice: investedAmount,
        purchaseCurrency: "EGP",
        purchaseDate: data.purchaseDate || undefined,
        valuationMode: "manual",
        currentValue: currentVal,
        notes: data.notes || undefined,
      });
    } else {
      const qty = parseFloat(data.quantity);
      const price = parseFloat(data.purchasePrice);
      if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;
      onSubmit({
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        assetType: data.assetType,
        quantity: qty,
        purchasePrice: price,
        purchaseCurrency: data.purchaseCurrency,
        purchaseDate: data.purchaseDate || undefined,
        weightUnit: isMetals ? data.weightUnit : undefined,
        notes: data.notes || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
        <select {...register("assetType")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          {ASSET_TYPES.map((t) => (<option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>))}
        </select>
      </div>

      {isEgx && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entry Mode</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue("egxMode", "individual")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                egxMode === "individual"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Individual Stock
            </button>
            <button
              type="button"
              onClick={() => setValue("egxMode", "brokerage")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                egxMode === "brokerage"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Brokerage Portfolio
            </button>
          </div>
        </div>
      )}

      {isBrokerage ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Name</label>
            <input {...register("name", { required: true })} placeholder="e.g. My EGX Brokerage" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Invested (EGP)</label>
              <input type="number" step="any" {...register("purchasePrice", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (EGP)</label>
              <input type="number" step="any" {...register("currentValue", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input {...register("name", { required: true })} placeholder="e.g. Bitcoin, Apple Inc" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
              <input {...register("symbol", { required: true })} placeholder="e.g. BTC, AAPL, COMI.CA" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity {isMetals ? "(amount)" : "(shares/coins)"}</label>
              <input type="number" step="any" {...register("quantity", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            {isMetals && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Unit</label>
                <select {...register("weightUnit")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="grams">Grams</option>
                  <option value="ounces">Troy Ounces</option>
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (per unit)</label>
              <input type="number" step="any" {...register("purchasePrice", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Currency</label>
              <select {...register("purchaseCurrency")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="USD">USD</option>
                <option value="EGP">EGP</option>
              </select>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date (optional)</label>
        <input type="date" {...register("purchaseDate")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea {...register("notes")} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {isLoading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

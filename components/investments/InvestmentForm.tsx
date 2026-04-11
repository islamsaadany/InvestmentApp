"use client";

import { useForm } from "react-hook-form";
import { ASSET_TYPES, ASSET_TYPE_LABELS } from "@/lib/constants";
import type { AssetType, WeightUnit } from "@/lib/types";

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
  const { register, handleSubmit, watch } = useForm<FormData>({
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
    },
  });

  const assetType = watch("assetType");
  const isMetals = assetType === "gold" || assetType === "silver";

  const handleFormSubmit = (data: FormData) => {
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
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
        <select {...register("assetType")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          {ASSET_TYPES.map((t) => (<option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>))}
        </select>
      </div>
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

"use client";

import { useEffect, useState } from "react";
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
  purchaseExchangeRate: string;
  purityPercent: string;
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
  purchaseExchangeRate?: number;
  purityPercent?: number;
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
    purchaseExchangeRate: number | null;
    purityPercent: number | null;
    valuationMode: ValuationMode | null;
    currentValue: number | null;
    notes: string | null;
  }>;
  submitLabel?: string;
}

const GOLD_PURITY_OPTIONS = [
  { label: "24K (99.9%)", value: 100 },
  { label: "22K (91.7%)", value: 91.67 },
  { label: "21K (87.5%)", value: 87.5 },
  { label: "18K (75%)", value: 75 },
  { label: "14K (58.3%)", value: 58.33 },
];

const SILVER_PURITY_OPTIONS = [
  { label: ".999 fine", value: 99.9 },
  { label: ".925 sterling", value: 92.5 },
  { label: ".916", value: 91.6 },
  { label: ".800", value: 80 },
];

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
      purchaseExchangeRate:
        defaultValues?.purchaseExchangeRate?.toString() || "",
      purityPercent:
        defaultValues?.purityPercent != null
          ? defaultValues.purityPercent.toString()
          : "",
      notes: defaultValues?.notes || "",
      egxMode: defaultValues?.valuationMode === "manual" ? "brokerage" : "individual",
      currentValue: defaultValues?.currentValue?.toString() || "",
    },
  });

  const assetType = watch("assetType");
  const egxMode = watch("egxMode");
  const purchaseCurrency = watch("purchaseCurrency");
  const purchaseDate = watch("purchaseDate");
  const isMetals = assetType === "gold" || assetType === "silver";
  const isEgx = assetType === "egx_stock";
  const isBrokerage = isEgx && egxMode === "brokerage";

  const purityOptions = assetType === "gold" ? GOLD_PURITY_OPTIONS : SILVER_PURITY_OPTIONS;

  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Auto-fill purity default for metals if not set
  useEffect(() => {
    if (!isMetals) return;
    const current = watch("purityPercent");
    if (!current) {
      const defaultPurity =
        assetType === "gold" ? "100" : "99.9";
      setValue("purityPercent", defaultPurity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMetals, assetType]);

  // Fetch historical EGP rate when purchase date or currency changes
  async function fetchHistoricalRate(date: string) {
    setRateError(null);
    setRateLoading(true);
    try {
      const res = await fetch(`/api/market/historical-egp-rate?date=${date}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setRateError(err.error || `Could not fetch rate (HTTP ${res.status})`);
        return;
      }
      const json = await res.json();
      if (typeof json.rate === "number") {
        setValue("purchaseExchangeRate", json.rate.toFixed(4));
      }
    } catch {
      setRateError("Network error fetching exchange rate");
    } finally {
      setRateLoading(false);
    }
  }

  const handleAutoFillRate = () => {
    if (purchaseDate) fetchHistoricalRate(purchaseDate);
  };

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
        purchaseExchangeRate: parseFloat(data.purchaseExchangeRate) || undefined,
        valuationMode: "manual",
        currentValue: currentVal,
        notes: data.notes || undefined,
      });
    } else {
      const qty = parseFloat(data.quantity);
      const price = parseFloat(data.purchasePrice);
      if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;
      const rate = parseFloat(data.purchaseExchangeRate);
      const purity = parseFloat(data.purityPercent);
      onSubmit({
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        assetType: data.assetType,
        quantity: qty,
        purchasePrice: price,
        purchaseCurrency: data.purchaseCurrency,
        purchaseDate: data.purchaseDate || undefined,
        weightUnit: isMetals ? data.weightUnit : undefined,
        purchaseExchangeRate:
          data.purchaseCurrency === "EGP" && !isNaN(rate) && rate > 0
            ? rate
            : undefined,
        purityPercent: isMetals && !isNaN(purity) && purity > 0 ? purity : undefined,
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
          {isMetals && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {assetType === "gold" ? "Karat / Purity" : "Fineness / Purity"}
              </label>
              <select
                {...register("purityPercent")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {purityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Used to compare your purchase against the spot market price (which is always quoted at pure 24K / .999).
              </p>
            </div>
          )}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date {isBrokerage ? "" : "(optional)"}</label>
          <input type="date" {...register("purchaseDate")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        {purchaseCurrency === "EGP" && (
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Exchange rate at purchase (EGP / USD)</span>
              <button
                type="button"
                onClick={handleAutoFillRate}
                disabled={!purchaseDate || rateLoading}
                className="text-[11px] text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {rateLoading ? "Fetching..." : "Auto-fill"}
              </button>
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="e.g. 49.5"
              {...register("purchaseExchangeRate")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {rateError && (
              <p className="text-[11px] text-red-500 mt-1">{rateError}</p>
            )}
            {!rateError && (
              <p className="text-[11px] text-gray-400 mt-1">
                Click Auto-fill after picking a date to fetch the historical rate.
              </p>
            )}
          </div>
        )}
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

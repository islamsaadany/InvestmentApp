"use client";

import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/components/providers/CurrencyProvider";

export default function TopBar() {
  const qc = useQueryClient();
  const { currency, setCurrency } = useCurrency();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(["USD", "EGP", "both"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currency === c
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {c === "both" ? "Both" : c}
            </button>
          ))}
        </div>
        <button
          onClick={() => qc.invalidateQueries()}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh all data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

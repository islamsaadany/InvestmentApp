"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import toast from "react-hot-toast";

export interface PendingAdjustment {
  investmentId: number;
  symbol: string;
  name: string;
  splitDate: string;
  ratio: string;
  numerator: number;
  denominator: number;
  currentQuantity: number;
  newQuantity: number;
}

interface Props {
  open: boolean;
  pricesFixed: string[];
  pendingAdjustments: PendingAdjustment[];
  onClose: () => void;
  onResolved: () => void;
}

type CardState = "pending" | "applied" | "skipped";

export default function SplitDetectionModal({
  open,
  pricesFixed,
  pendingAdjustments,
  onClose,
  onResolved,
}: Props) {
  const [states, setStates] = useState<Record<number, CardState>>({});
  const [busy, setBusy] = useState<Record<number, boolean>>({});

  if (!open) return null;

  const apply = async (adj: PendingAdjustment) => {
    setBusy((s) => ({ ...s, [adj.investmentId]: true }));
    try {
      const res = await fetch("/api/market/apply-split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adj),
      });
      if (!res.ok) throw new Error("Apply failed");
      setStates((s) => ({ ...s, [adj.investmentId]: "applied" }));
      toast.success(`${adj.symbol} quantity updated to ${adj.newQuantity}`);
      onResolved();
    } catch {
      toast.error(`Failed to apply split for ${adj.symbol}`);
    } finally {
      setBusy((s) => ({ ...s, [adj.investmentId]: false }));
    }
  };

  const skip = async (adj: PendingAdjustment) => {
    setBusy((s) => ({ ...s, [adj.investmentId]: true }));
    try {
      const res = await fetch("/api/market/skip-split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investmentId: adj.investmentId,
          symbol: adj.symbol,
          splitDate: adj.splitDate,
          ratio: adj.ratio,
          numerator: adj.numerator,
          denominator: adj.denominator,
        }),
      });
      if (!res.ok) throw new Error("Skip failed");
      setStates((s) => ({ ...s, [adj.investmentId]: "skipped" }));
      onResolved();
    } catch {
      toast.error(`Failed to skip split for ${adj.symbol}`);
    } finally {
      setBusy((s) => ({ ...s, [adj.investmentId]: false }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Stock Splits Detected
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {pricesFixed.length > 0 && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              <span className="font-medium">Price history refreshed for:</span>{" "}
              {pricesFixed.join(", ")}
            </div>
          )}

          {pendingAdjustments.length === 0 ? (
            <p className="text-sm text-gray-500">
              No quantity adjustments needed.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                The following holdings may need quantity adjustment. Confirm
                each one:
              </p>

              <div className="space-y-3">
                {pendingAdjustments.map((adj) => {
                  const state = states[adj.investmentId] ?? "pending";
                  const isBusy = busy[adj.investmentId] ?? false;

                  return (
                    <div
                      key={adj.investmentId}
                      className={`rounded-lg border p-3 ${
                        state === "applied"
                          ? "border-green-300 bg-green-50"
                          : state === "skipped"
                            ? "border-gray-200 bg-gray-50 opacity-70"
                            : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {adj.symbol} — {adj.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Split: {adj.ratio} on{" "}
                            {new Date(adj.splitDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </div>
                          <div className="mt-2 text-sm">
                            <div className="text-gray-600">
                              Current quantity:{" "}
                              <span className="font-mono text-gray-900">
                                {adj.currentQuantity}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              After split:{" "}
                              <span className="font-mono text-gray-900 font-semibold">
                                {adj.newQuantity}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          {state === "pending" && (
                            <>
                              <button
                                onClick={() => apply(adj)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Apply
                              </button>
                              <button
                                onClick={() => skip(adj)}
                                disabled={isBusy}
                                className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Skip
                              </button>
                            </>
                          )}
                          {state === "applied" && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                              <Check className="w-3.5 h-3.5" />
                              Applied
                            </span>
                          )}
                          {state === "skipped" && (
                            <span className="text-xs font-medium text-gray-500">
                              Skipped
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

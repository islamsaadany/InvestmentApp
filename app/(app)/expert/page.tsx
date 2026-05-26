"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import WatchlistPanel from "@/components/expert/WatchlistPanel";
import ChatInterface from "@/components/expert/ChatInterface";
import ExpertTabs from "@/components/expert/ExpertTabs";
import type { ExpertMode, WatchlistCategory } from "@/lib/types";

const MODE_TO_CATEGORY: Record<ExpertMode, WatchlistCategory> = {
  options: "options",
  "us-stocks": "us_stocks",
  crypto: "crypto",
};

const WATCHLIST_HINTS: Record<
  ExpertMode,
  { placeholder: string; emptyHint: string }
> = {
  options: {
    placeholder: "Ticker (e.g. AAPL)",
    emptyHint: "Add tickers for the agent to prioritize",
  },
  "us-stocks": {
    placeholder: "Ticker (e.g. MSFT)",
    emptyHint: "Add Halal US stocks for the agent to prioritize",
  },
  crypto: {
    placeholder: "Coin (e.g. BTC)",
    emptyHint: "Add Halal-acceptable coins for the agent to prioritize",
  },
};

const MODES: ExpertMode[] = ["options", "us-stocks", "crypto"];

export default function ExpertPage() {
  const [mode, setMode] = useState<ExpertMode>("options");
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const hints = WATCHLIST_HINTS[mode];

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.12))] -m-3 sm:-m-4 md:-m-6 overflow-hidden">
      <ExpertTabs mode={mode} onChange={setMode} />

      {/* Mobile-only watchlist toggle */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <button
          type="button"
          onClick={() => setWatchlistOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Watchlist
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Watchlist — desktop: inline sidebar; mobile: slide-in drawer */}
        <div className="hidden md:flex">
          <WatchlistPanel
            key={mode}
            category={MODE_TO_CATEGORY[mode]}
            placeholder={hints.placeholder}
            emptyHint={hints.emptyHint}
          />
        </div>

        {watchlistOpen && (
          <>
            <button
              type="button"
              aria-label="Close watchlist"
              onClick={() => setWatchlistOpen(false)}
              className="md:hidden fixed inset-0 z-30 bg-black/40"
            />
            <div className="md:hidden fixed left-0 top-0 bottom-0 z-40 w-72 max-w-[85%] bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-900">
                  Watchlist
                </span>
                <button
                  type="button"
                  onClick={() => setWatchlistOpen(false)}
                  aria-label="Close watchlist"
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex">
                <WatchlistPanel
                  key={`mobile-${mode}`}
                  category={MODE_TO_CATEGORY[mode]}
                  placeholder={hints.placeholder}
                  emptyHint={hints.emptyHint}
                  fullWidth
                />
              </div>
            </div>
          </>
        )}

        {/* Mount all three chat panes so each preserves its in-flight stream
            and message state when the user switches tabs. Inactive panes are
            hidden via CSS rather than unmounted. */}
        <div className="flex flex-1 overflow-hidden">
          {MODES.map((m) => (
            <div
              key={m}
              className={`flex-1 ${mode === m ? "flex" : "hidden"}`}
            >
              <ChatInterface mode={m} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

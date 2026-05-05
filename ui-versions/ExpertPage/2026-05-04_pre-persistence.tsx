"use client";

import { useState } from "react";
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

export default function ExpertPage() {
  const [mode, setMode] = useState<ExpertMode>("options");
  const hints = WATCHLIST_HINTS[mode];

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.12))] -m-6 overflow-hidden">
      <ExpertTabs mode={mode} onChange={setMode} />
      <div className="flex flex-1 overflow-hidden">
        <WatchlistPanel
          key={mode}
          category={MODE_TO_CATEGORY[mode]}
          placeholder={hints.placeholder}
          emptyHint={hints.emptyHint}
        />
        <ChatInterface key={`chat-${mode}`} mode={mode} />
      </div>
    </div>
  );
}

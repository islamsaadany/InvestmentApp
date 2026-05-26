"use client";

import { Menu, RefreshCw, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function MobileHeader({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      fetch("/api/market/sync", { method: "POST" }).catch(() => {});
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries();
      const now = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      toast.success(`Data refreshed · ${now}`);
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="md:hidden sticky top-0 z-20 h-14 bg-slate-900 text-white flex items-center justify-between px-3 border-b border-slate-800">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="p-2 -ml-2 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <span className="font-semibold text-sm">InvestTracker</span>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        aria-label="Refresh data"
        className="p-2 -mr-2 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </header>
  );
}

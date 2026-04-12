"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Eye, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import type { WatchlistItem } from "@/lib/types";

export default function WatchlistPanel() {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");

  const { data: watchlist = [], isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["watchlist"],
    queryFn: () => axios.get("/api/expert/watchlist").then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: { symbol: string; name: string }) =>
      axios.post("/api/expert/watchlist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      setSymbol("");
      setName("");
      toast.success("Added to watchlist");
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.error || "Failed to add to watchlist";
      toast.error(msg);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (sym: string) =>
      axios.delete(`/api/expert/watchlist?symbol=${sym}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Removed from watchlist");
    },
    onError: () => toast.error("Failed to remove"),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) return;
    addMutation.mutate({ symbol: trimmed, name: name.trim() });
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Watchlist</h3>
        </div>
        <form onSubmit={handleAdd} className="space-y-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Ticker (e.g. AAPL)"
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!symbol.trim() || addMutation.isPending}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : watchlist.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4 px-2">
            Add stocks to your watchlist for the agent to prioritize
          </p>
        ) : (
          <div className="space-y-1">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200 group"
              >
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-gray-900">
                    {item.symbol}
                  </span>
                  {item.name && (
                    <p className="text-xs text-gray-500 truncate">
                      {item.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeMutation.mutate(item.symbol)}
                  disabled={removeMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

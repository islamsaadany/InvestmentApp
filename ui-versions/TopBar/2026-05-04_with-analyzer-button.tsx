"use client";

import { useState } from "react";
import { RefreshCw, TrendingDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AverageDownAnalyzerModal from "@/components/dashboard/AverageDownAnalyzerModal";

export default function TopBar() {
  const qc = useQueryClient();
  const [analyzerOpen, setAnalyzerOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end gap-1 px-6">
      <button
        onClick={() => setAnalyzerOpen(true)}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Average Down Analyzer"
      >
        <TrendingDown className="w-4 h-4" />
      </button>
      <button
        onClick={() => qc.invalidateQueries()}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Refresh all data"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      {analyzerOpen && (
        <AverageDownAnalyzerModal onClose={() => setAnalyzerOpen(false)} />
      )}
    </header>
  );
}

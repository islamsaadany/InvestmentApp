"use client";

import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function TopBar() {
  const qc = useQueryClient();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      <button
        onClick={() => qc.invalidateQueries()}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Refresh all data"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </header>
  );
}

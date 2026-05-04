"use client";

import { Sparkles, LineChart, Bitcoin } from "lucide-react";
import type { ExpertMode } from "@/lib/types";

interface ExpertTabsProps {
  mode: ExpertMode;
  onChange: (mode: ExpertMode) => void;
}

const TABS: Array<{
  id: ExpertMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "options", label: "Options", icon: Sparkles },
  { id: "us-stocks", label: "US Stocks", icon: LineChart },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
];

export default function ExpertTabs({ mode, onChange }: ExpertTabsProps) {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = mode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? "border-blue-600 text-blue-700 bg-blue-50/40"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

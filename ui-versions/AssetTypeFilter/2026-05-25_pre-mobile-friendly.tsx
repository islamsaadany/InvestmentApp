"use client";

import { ASSET_TYPES, ASSET_TYPE_LABELS } from "@/lib/constants";
import type { AssetType } from "@/lib/types";

interface Props {
  selected: AssetType | undefined;
  onChange: (type: AssetType | undefined) => void;
}

export default function AssetTypeFilter({ selected, onChange }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      <button
        onClick={() => onChange(undefined)}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          !selected ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        All
      </button>
      {ASSET_TYPES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            selected === t ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          {ASSET_TYPE_LABELS[t]}
        </button>
      ))}
    </div>
  );
}

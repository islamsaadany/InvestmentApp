import type { AssetType } from "./types";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  gold: "Gold",
  silver: "Silver",
  crypto: "Crypto",
  us_stock: "US Stocks",
  egx_stock: "EGX Stocks",
};

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  gold: "#FFD700",
  silver: "#C0C0C0",
  crypto: "#F7931A",
  us_stock: "#4CAF50",
  egx_stock: "#1976D2",
};

export const ASSET_TYPES: AssetType[] = [
  "gold",
  "silver",
  "crypto",
  "us_stock",
  "egx_stock",
];

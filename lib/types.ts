export type AssetType = "gold" | "silver" | "crypto" | "us_stock" | "egx_stock";
export type WeightUnit = "grams" | "ounces";
export type ValuationMode = "live" | "manual";

export interface InvestmentWithLiveData {
  id: number;
  name: string;
  symbol: string;
  assetType: AssetType;
  quantity: number;
  purchasePrice: number;
  purchaseCurrency: string;
  purchaseDate: string | null;
  weightUnit: WeightUnit | null;
  valuationMode: ValuationMode;
  currentValue: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  currentPrice: number | null;
  currentValueUsd: number | null;
  currentValueEgp: number | null;
  totalCost: number | null;
  profitLoss: number | null;
  profitLossPct: number | null;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalValueEgp: number;
  totalCostUsd: number;
  totalProfitLossUsd: number;
  totalProfitLossPct: number;
  usdToEgpRate: number;
  investments: InvestmentWithLiveData[];
  allocation: AllocationItem[];
}

export interface AllocationItem {
  assetType: string;
  label: string;
  valueUsd: number;
  percentage: number;
  color: string;
}

export interface PortfolioSnapshotData {
  id: number;
  totalValueUsd: number;
  totalValueEgp: number;
  snapshotDate: string;
}

export interface PriceAlertData {
  id: number;
  symbol: string;
  assetType: AssetType;
  targetPrice: number;
  condition: string;
  currency: string;
  isTriggered: boolean;
  isActive: boolean;
  createdAt: string;
  currentPrice: number | null;
}

// Expert Agent types
export interface WatchlistItem {
  id: number;
  symbol: string;
  name: string | null;
  addedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

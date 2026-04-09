export type AssetType = 'gold' | 'silver' | 'crypto' | 'us_stock' | 'egx_stock';
export type WeightUnit = 'grams' | 'ounces';

export interface Investment {
  id: number;
  name: string;
  symbol: string;
  asset_type: AssetType;
  quantity: number;
  purchase_price: number;
  purchase_currency: string;
  purchase_date: string | null;
  weight_unit: WeightUnit | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  current_price: number | null;
  current_value_usd: number | null;
  current_value_egp: number | null;
  total_cost: number | null;
  profit_loss: number | null;
  profit_loss_pct: number | null;
}

export interface InvestmentCreate {
  name: string;
  symbol: string;
  asset_type: AssetType;
  quantity: number;
  purchase_price: number;
  purchase_currency: string;
  purchase_date?: string;
  weight_unit?: WeightUnit;
  notes?: string;
}

export interface InvestmentUpdate {
  name?: string;
  symbol?: string;
  quantity?: number;
  purchase_price?: number;
  purchase_currency?: string;
  purchase_date?: string;
  weight_unit?: WeightUnit;
  notes?: string;
}

export interface PriceAlert {
  id: number;
  symbol: string;
  asset_type: AssetType;
  target_price: number;
  condition: 'above' | 'below';
  currency: string;
  is_triggered: boolean;
  is_active: boolean;
  created_at: string;
  current_price: number | null;
}

export interface PriceAlertCreate {
  symbol: string;
  asset_type: AssetType;
  target_price: number;
  condition: 'above' | 'below';
  currency: string;
}

export interface AllocationItem {
  asset_type: string;
  label: string;
  value_usd: number;
  percentage: number;
  color: string;
}

export interface PortfolioSummary {
  total_value_usd: number;
  total_value_egp: number;
  total_cost_usd: number;
  total_profit_loss_usd: number;
  total_profit_loss_pct: number;
  usd_to_egp_rate: number;
  investments: Investment[];
  allocation: AllocationItem[];
}

export interface PortfolioSnapshot {
  id: number;
  total_value_usd: number;
  total_value_egp: number;
  snapshot_date: string;
}

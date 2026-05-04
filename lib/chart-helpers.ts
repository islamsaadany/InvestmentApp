/**
 * Helpers for converting investment purchase data into the unit used on
 * price charts (USD per troy ounce for gold/silver, USD per unit for everything else).
 *
 * The market price history we plot is always in USD, and for metals it's USD/oz.
 * Investments may be stored with purchase_currency=EGP and weight_unit=grams, so
 * we need a single helper that converts everything to "USD per chart unit".
 */

const GRAMS_PER_TROY_OUNCE = 31.1035;

export interface InvestmentForChart {
  assetType: string;
  purchasePrice: number;
  purchaseCurrency: string;
  quantity: number;
  weightUnit?: "grams" | "ounces" | null;
}

/**
 * Convert a single investment's purchase price into the unit used on its
 * asset-type's market price chart (USD per chart unit).
 */
export function convertPurchaseToChartPrice(
  inv: InvestmentForChart,
  egpRate: number
): number {
  let priceUsdPerUnit = inv.purchasePrice;

  if (inv.purchaseCurrency === "EGP" && egpRate > 0) {
    priceUsdPerUnit = priceUsdPerUnit / egpRate;
  }

  if (
    (inv.assetType === "gold" || inv.assetType === "silver") &&
    inv.weightUnit === "grams"
  ) {
    priceUsdPerUnit = priceUsdPerUnit * GRAMS_PER_TROY_OUNCE;
  }

  return priceUsdPerUnit;
}

/**
 * Quantity converted to chart-unit (troy ounces for grams; unchanged otherwise).
 * Used when computing weighted averages.
 */
export function convertQuantityToChartUnit(inv: InvestmentForChart): number {
  if (
    (inv.assetType === "gold" || inv.assetType === "silver") &&
    inv.weightUnit === "grams"
  ) {
    return inv.quantity / GRAMS_PER_TROY_OUNCE;
  }
  return inv.quantity;
}

export interface PurchaseStats {
  avgPrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  totalQty: number;
}

/**
 * Compute weighted-average, lowest, and highest purchase price across a set of
 * investments, all expressed in chart units.
 */
export function computePurchaseStats(
  investments: InvestmentForChart[],
  egpRate: number
): PurchaseStats {
  if (investments.length === 0) {
    return { avgPrice: null, lowestPrice: null, highestPrice: null, totalQty: 0 };
  }

  let totalWeighted = 0;
  let totalQty = 0;
  let lowest = Infinity;
  let highest = -Infinity;

  for (const inv of investments) {
    const price = convertPurchaseToChartPrice(inv, egpRate);
    const qty = convertQuantityToChartUnit(inv);
    totalWeighted += price * qty;
    totalQty += qty;
    if (price < lowest) lowest = price;
    if (price > highest) highest = price;
  }

  return {
    avgPrice: totalQty > 0 ? Math.round((totalWeighted / totalQty) * 100) / 100 : null,
    lowestPrice: lowest === Infinity ? null : Math.round(lowest * 100) / 100,
    highestPrice: highest === -Infinity ? null : Math.round(highest * 100) / 100,
    totalQty,
  };
}

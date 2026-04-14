export function formatCurrency(
  value: number | null | undefined,
  currency: string = "USD"
): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "EGP" ? "EGP" : "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a number for Y-axis labels — uses K/M suffixes for large numbers.
 */
export function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  if (value >= 1) return value.toFixed(0);
  return value.toFixed(2);
}

/**
 * Compute nice round Y-axis domain with clean tick intervals.
 */
export function niceYDomain(values: number[]): [number, number] {
  const filtered = values.filter((v) => v != null && v > 0);
  if (filtered.length === 0) return [0, 100];
  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  const range = max - min || max * 0.1 || 1;
  const rawStep = range / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceSteps = [1, 2, 5, 10];
  const step = niceSteps.find((s) => s * magnitude >= rawStep)! * magnitude;
  const niceMin = Math.max(0, Math.floor(min / step) * step);
  const niceMax = Math.ceil(max / step) * step;
  return [niceMin, niceMax];
}

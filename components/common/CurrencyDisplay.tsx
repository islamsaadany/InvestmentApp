"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  usd: number | null;
  egp: number | null;
  className?: string;
}

export default function CurrencyDisplay({
  usd,
  egp,
  className = "",
}: Props) {
  const { currency } = useCurrency();

  if (usd == null && egp == null) {
    return <span className={`text-gray-400 ${className}`}>—</span>;
  }

  return (
    <div className={className}>
      {(currency === "USD" || currency === "both") && (
        <div className="font-medium">{formatCurrency(usd, "USD")}</div>
      )}
      {(currency === "EGP" || currency === "both") && (
        <div
          className={
            currency === "both" ? "text-sm text-gray-500" : "font-medium"
          }
        >
          {formatCurrency(egp, "EGP")}
        </div>
      )}
    </div>
  );
}

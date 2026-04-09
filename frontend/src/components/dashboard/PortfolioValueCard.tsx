import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { useCurrency } from '../../context/CurrencyContext';
import ProfitLossIndicator from '../common/ProfitLossIndicator';
import type { PortfolioSummary } from '../../lib/types';

interface Props {
  summary: PortfolioSummary;
}

export default function PortfolioValueCard({ summary }: Props) {
  const { currency } = useCurrency();
  const {
    total_value_usd,
    total_value_egp,
    total_profit_loss_usd,
    total_profit_loss_pct,
    usd_to_egp_rate,
  } = summary;

  const displayValue =
    currency === 'EGP' ? total_value_egp : total_value_usd;
  const displayCurrency = currency === 'EGP' ? 'EGP' : 'USD';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <DollarSign className="w-4 h-4" />
          Portfolio Value
        </div>
        <span className="text-xs text-gray-400">
          1 USD = {usd_to_egp_rate.toFixed(2)} EGP
        </span>
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900">
          {formatCurrency(displayValue, displayCurrency)}
        </div>
        {currency === 'both' && (
          <div className="text-lg text-gray-500 mt-1">
            {formatCurrency(total_value_egp, 'EGP')}
          </div>
        )}
      </div>

      <ProfitLossIndicator
        value={total_profit_loss_usd}
        percentage={total_profit_loss_pct}
      />
    </div>
  );
}

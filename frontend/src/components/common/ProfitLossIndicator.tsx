import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../lib/formatters';

interface Props {
  value: number | null;
  percentage: number | null;
  showValue?: boolean;
}

export default function ProfitLossIndicator({ value, percentage, showValue = true }: Props) {
  if (value == null || percentage == null) {
    return <span className="text-gray-400">—</span>;
  }

  const isPositive = value > 0;
  const isZero = value === 0;
  const color = isZero ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600';
  const bgColor = isZero ? 'bg-gray-50' : isPositive ? 'bg-green-50' : 'bg-red-50';
  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${bgColor}`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      {showValue && (
        <span className={`text-sm font-medium ${color}`}>
          {formatCurrency(value)}
        </span>
      )}
      <span className={`text-sm font-medium ${color}`}>
        {formatPercent(percentage)}
      </span>
    </div>
  );
}

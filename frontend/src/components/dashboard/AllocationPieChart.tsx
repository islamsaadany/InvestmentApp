import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { AllocationItem } from '../../lib/types';
import { formatCurrency } from '../../lib/formatters';

interface Props {
  allocation: AllocationItem[];
}

export default function AllocationPieChart({ allocation }: Props) {
  if (allocation.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Asset Allocation</h3>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No investments yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Asset Allocation</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={allocation}
            dataKey="value_usd"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={2}
            label={(props: PieLabelRenderProps) => `${props.name ?? ''} ${((Number(props.percent) || 0) * 100).toFixed(1)}%`}
          >
            {allocation.map((item, idx) => (
              <Cell key={idx} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

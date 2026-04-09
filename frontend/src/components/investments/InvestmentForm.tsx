import { useForm } from 'react-hook-form';
import { ASSET_TYPES, ASSET_TYPE_LABELS } from '../../lib/constants';
import type { InvestmentCreate, Investment } from '../../lib/types';

interface FormData {
  name: string;
  symbol: string;
  asset_type: 'gold' | 'silver' | 'crypto' | 'us_stock' | 'egx_stock';
  quantity: string;
  purchase_price: string;
  purchase_currency: string;
  purchase_date: string;
  weight_unit?: 'grams' | 'ounces';
  notes: string;
}

interface Props {
  onSubmit: (data: InvestmentCreate) => void;
  isLoading: boolean;
  defaultValues?: Partial<Investment>;
  submitLabel?: string;
}

export default function InvestmentForm({ onSubmit, isLoading, defaultValues, submitLabel = 'Add Investment' }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: defaultValues?.name || '',
      symbol: defaultValues?.symbol || '',
      asset_type: defaultValues?.asset_type || 'crypto',
      quantity: defaultValues?.quantity?.toString() || '',
      purchase_price: defaultValues?.purchase_price?.toString() || '',
      purchase_currency: defaultValues?.purchase_currency || 'USD',
      purchase_date: defaultValues?.purchase_date?.split('T')[0] || '',
      weight_unit: defaultValues?.weight_unit || undefined,
      notes: defaultValues?.notes || '',
    },
  });

  const assetType = watch('asset_type');
  const isMetals = assetType === 'gold' || assetType === 'silver';

  const handleFormSubmit = (data: FormData) => {
    const qty = parseFloat(data.quantity);
    const price = parseFloat(data.purchase_price);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;
    onSubmit({
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      asset_type: data.asset_type,
      quantity: qty,
      purchase_price: price,
      purchase_currency: data.purchase_currency,
      purchase_date: data.purchase_date || undefined,
      weight_unit: isMetals ? data.weight_unit : undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Asset Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
        <select
          {...register('asset_type')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Name & Symbol */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            {...register('name')}
            placeholder="e.g. Bitcoin, Apple Inc"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
          <input
            {...register('symbol')}
            placeholder="e.g. BTC, AAPL, COMI.CA"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.symbol && <p className="text-xs text-red-500 mt-1">{errors.symbol.message}</p>}
        </div>
      </div>

      {/* Quantity & Weight Unit (for metals) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity {isMetals ? '(amount)' : '(shares/coins)'}
          </label>
          <input
            type="number"
            step="any"
            {...register('quantity')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
        </div>
        {isMetals && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight Unit</label>
            <select
              {...register('weight_unit')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="grams">Grams</option>
              <option value="ounces">Troy Ounces</option>
            </select>
          </div>
        )}
      </div>

      {/* Purchase Price & Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (per unit)</label>
          <input
            type="number"
            step="any"
            {...register('purchase_price')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.purchase_price && <p className="text-xs text-red-500 mt-1">{errors.purchase_price.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Currency</label>
          <select
            {...register('purchase_currency')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="USD">USD</option>
            <option value="EGP">EGP</option>
          </select>
        </div>
      </div>

      {/* Purchase Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date (optional)</label>
        <input
          type="date"
          {...register('purchase_date')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

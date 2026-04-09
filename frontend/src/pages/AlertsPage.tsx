import { useState } from 'react';
import { Bell, Plus, X, Trash2, BellOff } from 'lucide-react';
import { useAlerts, useCreateAlert, useDeleteAlert, useDeactivateAlert } from '../hooks/useAlerts';
import { useForm } from 'react-hook-form';
import { ASSET_TYPES, ASSET_TYPE_LABELS } from '../lib/constants';
import { formatCurrency } from '../lib/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';
import type { AssetType } from '../lib/types';

interface AlertFormData {
  symbol: string;
  asset_type: AssetType;
  target_price: string;
  condition: 'above' | 'below';
  currency: string;
}

export default function AlertsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: alerts, isLoading } = useAlerts();
  const createMutation = useCreateAlert();
  const deleteMutation = useDeleteAlert();
  const deactivateMutation = useDeactivateAlert();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlertFormData>({
    defaultValues: { asset_type: 'crypto', condition: 'above', currency: 'USD', symbol: '', target_price: '' },
  });

  const onSubmit = (data: AlertFormData) => {
    const price = parseFloat(data.target_price);
    if (isNaN(price) || price <= 0) return;
    createMutation.mutate(
      {
        symbol: data.symbol.toUpperCase(),
        asset_type: data.asset_type,
        target_price: price,
        condition: data.condition,
        currency: data.currency,
      },
      {
        onSuccess: () => {
          setShowAdd(false);
          reset();
          toast.success('Alert created');
        },
        onError: () => toast.error('Failed to create alert'),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Price Alerts</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Alert
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading alerts..." />
      ) : !alerts?.length ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="No alerts set"
          description="Create price alerts to get notified when assets hit your target price."
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Alert
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Symbol</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Condition</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Target Price</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Current Price</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{alert.symbol}</div>
                    <div className="text-xs text-gray-400">{ASSET_TYPE_LABELS[alert.asset_type]}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    Price goes {alert.condition} target
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatCurrency(alert.target_price, alert.currency)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {alert.current_price != null ? formatCurrency(alert.current_price) : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {alert.is_triggered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        <Bell className="w-3 h-3" /> Triggered
                      </span>
                    ) : alert.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {alert.is_active && !alert.is_triggered && (
                        <button
                          onClick={() => deactivateMutation.mutate(alert.id)}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md"
                          title="Deactivate"
                        >
                          <BellOff className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Delete this alert?')) deleteMutation.mutate(alert.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Alert Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Price Alert</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                <select {...register('asset_type')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <input {...register('symbol')} placeholder="e.g. BTC, AAPL" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                {errors.symbol && <p className="text-xs text-red-500 mt-1">Symbol is required</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select {...register('condition')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="above">Goes Above</option>
                    <option value="below">Goes Below</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Price</label>
                  <input type="number" step="any" {...register('target_price')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  {errors.target_price && <p className="text-xs text-red-500 mt-1">Required</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select {...register('currency')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="USD">USD</option>
                  <option value="EGP">EGP</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Alert'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

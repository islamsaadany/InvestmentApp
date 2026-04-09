import { useState } from 'react';
import { Plus, Briefcase, X } from 'lucide-react';
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from '../hooks/useInvestments';
import InvestmentTable from '../components/investments/InvestmentTable';
import InvestmentForm from '../components/investments/InvestmentForm';
import AssetTypeFilter from '../components/investments/AssetTypeFilter';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import type { AssetType, Investment, InvestmentCreate } from '../lib/types';
import toast from 'react-hot-toast';

export default function InvestmentsPage() {
  const [filter, setFilter] = useState<AssetType | undefined>();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const { data: investments, isLoading } = useInvestments(filter);
  const createMutation = useCreateInvestment();
  const updateMutation = useUpdateInvestment();
  const deleteMutation = useDeleteInvestment();

  const handleCreate = (data: InvestmentCreate) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowAdd(false);
        toast.success('Investment added');
      },
      onError: () => toast.error('Failed to add investment'),
    });
  };

  const handleUpdate = (data: InvestmentCreate) => {
    if (!editing) return;
    updateMutation.mutate(
      { id: editing.id, data },
      {
        onSuccess: () => {
          setEditing(null);
          toast.success('Investment updated');
        },
        onError: () => toast.error('Failed to update investment'),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete this investment?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Investment deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  };

  const showModal = showAdd || editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Investments</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      <AssetTypeFilter selected={filter} onChange={setFilter} />

      {isLoading ? (
        <LoadingSpinner message="Loading investments..." />
      ) : !investments?.length ? (
        <EmptyState
          icon={<Briefcase className="w-12 h-12" />}
          title="No investments yet"
          description="Add your first investment to start tracking your portfolio."
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Investment
            </button>
          }
        />
      ) : (
        <InvestmentTable
          investments={investments}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Investment' : 'Add Investment'}
              </h3>
              <button
                onClick={() => { setShowAdd(false); setEditing(null); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <InvestmentForm
              onSubmit={editing ? handleUpdate : handleCreate}
              isLoading={createMutation.isPending || updateMutation.isPending}
              defaultValues={editing || undefined}
              submitLabel={editing ? 'Update Investment' : 'Add Investment'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

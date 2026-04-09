import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvestments, createInvestment, updateInvestment, deleteInvestment } from '../api/investments';
import type { AssetType, InvestmentCreate, InvestmentUpdate } from '../lib/types';

export function useInvestments(assetType?: AssetType) {
  return useQuery({
    queryKey: ['investments', { assetType }],
    queryFn: () => fetchInvestments(assetType),
    staleTime: 60_000,
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InvestmentCreate) => createInvestment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] });
      qc.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useUpdateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: InvestmentUpdate }) => updateInvestment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] });
      qc.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInvestment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] });
      qc.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

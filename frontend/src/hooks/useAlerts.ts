import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAlerts, createAlert, deleteAlert, deactivateAlert } from '../api/alerts';
import type { PriceAlertCreate } from '../lib/types';

export function useAlerts(params?: { is_active?: boolean; is_triggered?: boolean }) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => fetchAlerts(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PriceAlertCreate) => createAlert(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useDeactivateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

import api from './client';
import type { PriceAlert, PriceAlertCreate } from '../lib/types';

export async function fetchAlerts(params?: {
  is_active?: boolean;
  is_triggered?: boolean;
}): Promise<PriceAlert[]> {
  const { data } = await api.get<PriceAlert[]>('/api/alerts/', { params });
  return data;
}

export async function createAlert(input: PriceAlertCreate): Promise<PriceAlert> {
  const { data } = await api.post<PriceAlert>('/api/alerts/', input);
  return data;
}

export async function deleteAlert(id: number): Promise<void> {
  await api.delete(`/api/alerts/${id}`);
}

export async function deactivateAlert(id: number): Promise<PriceAlert> {
  const { data } = await api.put<PriceAlert>(`/api/alerts/${id}/deactivate`);
  return data;
}

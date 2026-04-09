import api from './client';
import type { Investment, InvestmentCreate, InvestmentUpdate, AssetType } from '../lib/types';

export async function fetchInvestments(assetType?: AssetType): Promise<Investment[]> {
  const params = assetType ? { asset_type: assetType } : {};
  const { data } = await api.get<Investment[]>('/api/investments/', { params });
  return data;
}

export async function fetchInvestment(id: number): Promise<Investment> {
  const { data } = await api.get<Investment>(`/api/investments/${id}`);
  return data;
}

export async function createInvestment(input: InvestmentCreate): Promise<Investment> {
  const { data } = await api.post<Investment>('/api/investments/', input);
  return data;
}

export async function updateInvestment(id: number, input: InvestmentUpdate): Promise<Investment> {
  const { data } = await api.put<Investment>(`/api/investments/${id}`, input);
  return data;
}

export async function deleteInvestment(id: number): Promise<void> {
  await api.delete(`/api/investments/${id}`);
}

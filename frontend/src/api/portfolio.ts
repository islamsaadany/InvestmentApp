import api from './client';
import type { PortfolioSummary, AllocationItem, PortfolioSnapshot } from '../lib/types';

export async function fetchSummary(): Promise<PortfolioSummary> {
  const { data } = await api.get<PortfolioSummary>('/api/portfolio/summary');
  return data;
}

export async function fetchAllocation(): Promise<AllocationItem[]> {
  const { data } = await api.get<AllocationItem[]>('/api/portfolio/allocation');
  return data;
}

export async function fetchPerformance(period: string = '30d'): Promise<PortfolioSnapshot[]> {
  const { data } = await api.get<PortfolioSnapshot[]>('/api/portfolio/performance', {
    params: { period },
  });
  return data;
}

export async function createSnapshot(): Promise<PortfolioSnapshot> {
  const { data } = await api.post<PortfolioSnapshot>('/api/portfolio/snapshot');
  return data;
}

import { useQuery } from '@tanstack/react-query';
import { fetchSummary, fetchAllocation, fetchPerformance } from '../api/portfolio';

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: fetchSummary,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useAllocation() {
  return useQuery({
    queryKey: ['portfolio', 'allocation'],
    queryFn: fetchAllocation,
    staleTime: 60_000,
  });
}

export function usePerformance(period: string = '30d') {
  return useQuery({
    queryKey: ['portfolio', 'performance', period],
    queryFn: () => fetchPerformance(period),
    staleTime: 300_000,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import PortfolioValueCard from "@/components/dashboard/PortfolioValueCard";
import AllocationPieChart from "@/components/dashboard/AllocationPieChart";
import PerformanceLineChart from "@/components/dashboard/PerformanceLineChart";
import TopMovers from "@/components/dashboard/TopMovers";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { PortfolioSummary } from "@/lib/types";

export default function DashboardPage() {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery<PortfolioSummary>({
    queryKey: ["portfolio", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio/summary");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner message="Loading portfolio..." />;
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load portfolio data. Check your database connection.
      </div>
    );
  }
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      <PortfolioValueCard summary={summary} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationPieChart allocation={summary.allocation} />
        <PerformanceLineChart />
      </div>
      <TopMovers investments={summary.investments} />
    </div>
  );
}

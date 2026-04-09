import { usePortfolioSummary } from '../hooks/usePortfolio';
import PortfolioValueCard from '../components/dashboard/PortfolioValueCard';
import AllocationPieChart from '../components/dashboard/AllocationPieChart';
import PerformanceLineChart from '../components/dashboard/PerformanceLineChart';
import TopMovers from '../components/dashboard/TopMovers';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DashboardPage() {
  const { data: summary, isLoading, error } = usePortfolioSummary();

  if (isLoading) return <LoadingSpinner message="Loading portfolio..." />;
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load portfolio data. Is the backend running?
      </div>
    );
  }
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Top row: Portfolio value */}
      <PortfolioValueCard summary={summary} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationPieChart allocation={summary.allocation} />
        <PerformanceLineChart />
      </div>

      {/* Top movers */}
      <TopMovers investments={summary.investments} />
    </div>
  );
}

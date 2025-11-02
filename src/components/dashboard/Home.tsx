import React, { useState, useEffect } from 'react';
import { apiService, DashboardStats, Activity } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';
import { 
  Calculator, 
  Users, 
  TrendingUp, 
  GraduationCap,
  DollarSign,
  PieChart,
  UserPlus
} from 'lucide-react';
import StatsCard from './StatsCard';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';
import { LoadingSpinner } from '../common';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch dashboard stats from API
        const statsResponse = await apiService.getDashboardStats();
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          throw new Error(statsResponse.error || 'Failed to load dashboard stats');
        }

        // Fetch recent activities from API
        const activitiesResponse = await apiService.getRecentActivities();
        if (activitiesResponse.success && activitiesResponse.data) {
          setActivities(activitiesResponse.data);
        } else {
          // If activities fail, set empty array instead of throwing
          setActivities([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatStatsForDisplay = (stats: DashboardStats) => [
    {
      title: 'Total Users',
      value: `∑ ${stats.totalUsers.toLocaleString()}`,
      change: '+12% ↗',
      icon: Users,
      changeType: 'positive' as const,
      formula: `f(t) = ${stats.totalUsers}e^(0.12t)`
    },
    {
      title: 'Active Tutors',
      value: `∫ ${stats.totalTutors.toLocaleString()}`,
      change: '+8% ↗',
      icon: GraduationCap,
      changeType: 'positive' as const,
      formula: `T(x) = ${stats.totalTutors} + 8x`
    },
    {
      title: 'Parent Accounts',
      value: `∆ ${stats.totalStudents.toLocaleString()}`,
      change: '+15% ↗',
      icon: UserPlus,
      changeType: 'positive' as const,
      formula: `P(t) = ${stats.totalStudents} + 15t`
    },
    {
      title: 'Children Enrolled',
      value: `π ${stats.activeSessions.toLocaleString()}`,
      change: '+5% ↗',
      icon: TrendingUp,
      changeType: 'positive' as const,
      formula: 'C = lim(h→0) [f(x+h)-f(x)]/h'
    }
  ];

  if (isLoading) {
    return (
      <div className="animate-slide-in-left">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-slide-in-left">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Dashboard loading error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const displayStats = stats ? formatStatsForDisplay(stats) : [];

  return (
    <div className="animate-slide-in-left max-w-full w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">
          <Calculator className="inline h-8 w-8 text-blue-900 mr-2" />
          {t('mathDashDashboard')}
        </h1>
        <p className="text-gray-600 animate-fade-in stagger-1">
          {t('dashboardDescription')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <StatsCard key={index} {...stat} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover-lift animate-slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 animate-fade-in">{t('overviewAnalytics')}</h2>
            <button className="flex items-center space-x-2 text-blue-900 hover:text-blue-700">
              <PieChart className="h-5 w-5 animate-rotate" />
              <span className="text-sm">{t('viewDetails')}</span>
            </button>
          </div>
          <div className="h-64 bg-blue-50 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 opacity-50 flex items-center justify-center">
              <span className="text-6xl text-blue-300 animate-math-symbols">π</span>
            </div>
            <div className="text-center">
              <PieChart className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-pulse-slow" />
              <p className="text-gray-600">{t('analyticsChart')}</p>
              <p className="text-sm text-gray-500">{t('chartIntegrationComingSoon')}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <ActivityFeed activities={activities} />
      </div>

      {/* Quick Actions */}
      <div className="w-full">
        <QuickActions />
      </div>
    </div>
  );
};

export default Home;
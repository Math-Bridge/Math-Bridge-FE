import React, { useState, useEffect } from 'react';
import { apiService, DashboardStats, Activity } from '../../services/api';
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsResponse, activitiesResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentActivities()
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          setError(statsResponse.error || 'Failed to load stats');
        }

        if (activitiesResponse.success && activitiesResponse.data) {
          setActivities(activitiesResponse.data);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatStatsForDisplay = (stats: DashboardStats) => [
    {
      title: 'Tổng người dùng',
      value: `∑ ${stats.totalUsers.toLocaleString()}`,
      change: '+12% ↗',
      icon: Users,
      changeType: 'positive' as const,
      formula: `f(t) = ${stats.totalUsers}e^(0.12t)`
    },
    {
      title: 'Gia sư hoạt động',
      value: `∫ ${stats.totalTutors.toLocaleString()}`,
      change: '+8% ↗',
      icon: GraduationCap,
      changeType: 'positive' as const,
      formula: `T(x) = ${stats.totalTutors} + 8x`
    },
    {
      title: 'Học sinh',
      value: `∆ ${stats.totalStudents.toLocaleString()}`,
      change: '+15% ↗',
      icon: UserPlus,
      changeType: 'positive' as const,
      formula: `S(t) = ${stats.totalStudents} + 15t`
    },
    {
      title: 'Phiên học',
      value: `π ${stats.activeSessions.toLocaleString()}`,
      change: '+5% ↗',
      icon: TrendingUp,
      changeType: 'positive' as const,
      formula: 'G = lim(h→0) [f(x+h)-f(x)]/h'
    }
  ];

  if (isLoading) {
    return (
      <div className="animate-slide-in-left">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Đang tải dữ liệu dashboard..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-slide-in-left">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Lỗi tải dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const displayStats = stats ? formatStatsForDisplay(stats) : [];

  return (
    <div className="animate-slide-in-left">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">
          <Calculator className="inline h-8 w-8 text-blue-900 mr-2" />
          MathBridge Dashboard
        </h1>
        <p className="text-gray-600 animate-fade-in stagger-1">
          Hệ thống quản lý kết nối gia sư toán học • ∀ data ∈ Platform: analyze(data) = insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <StatsCard key={index} {...stat} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover-lift animate-slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 animate-fade-in">∫ Phân tích tổng quan</h2>
            <button className="flex items-center space-x-2 text-blue-900 hover:text-blue-700">
              <PieChart className="h-5 w-5 animate-rotate" />
              <span className="text-sm">Xem chi tiết</span>
            </button>
          </div>
          <div className="h-64 bg-blue-50 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 opacity-50 flex items-center justify-center">
              <span className="text-6xl text-blue-300 animate-math-symbols">π</span>
            </div>
            <div className="text-center">
              <PieChart className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-pulse-slow" />
              <p className="text-gray-600">Biểu đồ phân tích y = mx + b</p>
              <p className="text-sm text-gray-500">∫ Tích hợp biểu đồ sắp có</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <ActivityFeed activities={activities} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default Home;
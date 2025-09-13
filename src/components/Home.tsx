import React, { useState, useEffect } from 'react';
import { apiService, DashboardStats, Activity } from '../services/api';
import { 
  Calculator, 
  Users, 
  TrendingUp, 
  Calendar,
  Bell,
  Settings,
  Activity as ActivityIcon,
  DollarSign,
  PieChart,
  Target
} from 'lucide-react';

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
      title: 'Total Users',
      value: `∑ ${stats.totalUsers.toLocaleString()}`,
      change: '+12% ↗',
      icon: Users,
      changeType: 'positive' as const,
      formula: `f(t) = ${stats.totalUsers}e^(0.12t)`
    },
    {
      title: 'Revenue',
      value: `$ ${stats.revenue.toLocaleString()}`,
      change: '+18% ↗',
      icon: DollarSign,
      changeType: 'positive' as const,
      formula: `R(x) = ${stats.revenue} + 18x`
    },
    {
      title: 'Active Sessions',
      value: `∫ ${stats.activeSessions.toLocaleString()}`,
      change: '-2% ↘',
      icon: ActivityIcon,
      changeType: 'negative' as const,
      formula: `S(t) = ${stats.activeSessions} - 2t`
    },
    {
      title: 'Growth Rate',
      value: `∆ ${stats.growthRate}%`,
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-slide-in-left">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading dashboard</p>
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
          Mathematical Dashboard
        </h1>
        <p className="text-gray-600 animate-fade-in stagger-1">∀ data ∈ Platform: analyze(data) = insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <div key={index} className={`stat-card hover-lift animate-scale-in stagger-${index + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className="p-3 rounded-full bg-navy-50 animate-pulse-slow">
                <stat.icon className="h-6 w-6 text-blue-900" />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-blue-900' : 'text-orange-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-600 ml-2">from last month</span>
              <p className="text-xs text-gray-500 mt-1 font-mono">{stat.formula}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover-lift animate-slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 animate-fade-in">∫ Analytics Overview</h2>
            <button className="flex items-center space-x-2 text-blue-900 hover:text-blue-700">
              <PieChart className="h-5 w-5 animate-rotate" />
              <span className="text-sm">View Details</span>
            </button>
          </div>
          <div className="h-64 bg-red-50 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-navy-100 to-navy-200 opacity-50 flex items-center justify-center">
              <span className="text-6xl text-navy-300 animate-math-symbols">π</span>
            </div>
            <div className="text-center">
              <PieChart className="h-12 w-12 text-navy-400 mx-auto mb-4 animate-pulse-slow" />
              <p className="text-gray-600">y = mx + b visualization</p>
              <p className="text-sm text-gray-500">∫ Chart integration needed</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover-lift animate-slide-in-right">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 animate-fade-in">∑ Recent Activity</h2>
            <button className="flex items-center space-x-2 text-blue-900 hover:text-blue-700">
              <Bell className="h-5 w-5 animate-bounce-slow" />
              <span className="text-sm">View All</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className={`activity-item hover-lift animate-fade-in stagger-${activity.id}`}>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center animate-pulse-slow">
                    {activity.type === 'user' && <Users className="h-4 w-4 text-blue-900" />}
                    {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-blue-900" />}
                    {activity.type === 'system' && <Settings className="h-4 w-4 text-blue-900" />}
                    {activity.type === 'feature' && <TrendingUp className="h-4 w-4 text-blue-900" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 animate-fade-in">∇ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left hover-lift animate-scale-in stagger-1">
            <Users className="h-8 w-8 text-navy-900 mb-3 animate-bounce-slow" />
            <h3 className="font-medium text-gray-900 mb-1">Manage Users</h3>
            <p className="text-sm text-gray-600">∀ users ∈ System: manage(user)</p>
          </button>
          
          <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left hover-lift animate-scale-in stagger-2">
            <Calendar className="h-8 w-8 text-navy-900 mb-3 animate-pulse-slow" />
            <h3 className="font-medium text-gray-900 mb-1">Schedule Events</h3>
            <p className="text-sm text-gray-600">∫ events dt = organized calendar</p>
          </button>
          
          <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left hover-lift animate-scale-in stagger-3">
            <Settings className="h-8 w-8 text-navy-900 mb-3 animate-rotate" />
            <h3 className="font-medium text-gray-900 mb-1">System Settings</h3>
            <p className="text-sm text-gray-600">optimize(system) = max efficiency</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  TrendingUp,
  UserCheck,
  DollarSign,
  Activity
} from 'lucide-react';
import { apiService } from '../../../services/api';

interface AdminStats {
  totalUsers?: number;
  totalCenters?: number;
  totalPackages?: number;
  totalRevenue?: number;
  activeContracts?: number;
  pendingRequests?: number;
}

const AdminDashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await apiService.getAdminStats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const managementModules = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      path: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Center Management',
      description: 'Manage learning centers and locations',
      icon: Building,
      path: '/admin/centers',
      color: 'bg-green-500'
    },
    {
      title: 'Payment Packages',
      description: 'Configure payment packages and pricing',
      icon: CreditCard,
      path: '/admin/packages',
      color: 'bg-purple-500'
    },
    {
      title: 'Finance & Reports',
      description: 'View financial reports and analytics',
      icon: BarChart3,
      path: '/admin/finance',
      color: 'bg-yellow-500'
    },
    {
      title: 'Audit & Logs',
      description: 'View system logs and audit trails',
      icon: FileText,
      path: '/admin/logs',
      color: 'bg-red-500'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: Settings,
      path: '/admin/settings',
      color: 'bg-gray-500'
    }
  ];

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers ?? 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      label: 'Total Centers',
      value: stats.totalCenters ?? 0,
      icon: Building,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      label: 'Active Contracts',
      value: stats.activeContracts ?? 0,
      icon: Activity,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      label: 'Total Revenue',
      value: stats.totalRevenue ? `$${stats.totalRevenue.toLocaleString()}` : '$0',
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the system administration panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Management Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(module.path)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all text-left group"
              >
                <div className={`${module.color} p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardContent;


import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  BarChart3,
  Shield,
  FileText,
  Bell,
  Activity,
  Database,
  CreditCard,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';

interface SystemStats {
  totalUsers: number;
  activeTutors: number;
  totalCenters: number;
  monthlyRevenue: number;
  pendingContracts: number;
  systemHealth: number;
  errorCount: number;
  uptime: string;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'payment' | 'system' | 'error';
  title: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeTutors: 0,
    totalCenters: 0,
    monthlyRevenue: 0,
    pendingContracts: 0,
    systemHealth: 0,
    errorCount: 0,
    uptime: '0d 0h 0m'
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch admin stats
        const statsResponse = await apiService.getAdminStats();
        if (statsResponse.success && statsResponse.data) {
          const data = statsResponse.data;
          setStats({
            totalUsers: data.totalUsers || 0,
            activeTutors: data.activeTutors || 0,
            totalCenters: data.totalCenters || 0,
            monthlyRevenue: data.monthlyRevenue || 0,
            pendingContracts: data.pendingContracts || 0,
            systemHealth: data.systemHealth || 0,
            errorCount: data.errorCount || 0,
            uptime: data.uptime || '0d 0h 0m'
          });
        } else {
          // If API fails, set default values
          setStats({
            totalUsers: 0,
            activeTutors: 0,
            totalCenters: 0,
            monthlyRevenue: 0,
            pendingContracts: 0,
            systemHealth: 0,
            errorCount: 0,
            uptime: '0d 0h 0m'
          });
        }

        // Fetch recent activities (if API endpoint exists)
        // For now, set empty array as activities endpoint may not exist
        setRecentActivities([]);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setStats({
          totalUsers: 0,
          activeTutors: 0,
          totalCenters: 0,
          monthlyRevenue: 0,
          pendingContracts: 0,
          systemHealth: 0,
          errorCount: 0,
          uptime: '0d 0h 0m'
        });
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const managementModules = [
    {
      title: 'User Management',
      description: 'Manage all user accounts and roles',
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Center Management',
      description: 'Manage learning centers and locations',
      icon: Building,
      color: 'bg-green-500',
      onClick: () => navigate('/admin/centers')
    },
    {
      title: 'Payment Packages',
      description: 'Configure pricing and packages',
      icon: CreditCard,
      color: 'bg-purple-500',
      onClick: () => navigate('/admin/packages')
    },
    {
      title: 'System Configuration',
      description: 'System settings and preferences',
      icon: Settings,
      color: 'bg-gray-500',
      onClick: () => navigate('/admin/settings')
    },
    {
      title: 'Audit & Logs',
      description: 'System logs and audit trails',
      icon: FileText,
      color: 'bg-orange-500',
      onClick: () => navigate('/admin/logs')
    },
    {
      title: 'Finance & Reports',
      description: 'Financial reports and analytics',
      icon: BarChart3,
      color: 'bg-indigo-500',
      onClick: () => navigate('/admin/finance')
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      case 'system':
        return <Activity className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Centers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCenters}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.monthlyRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-gray-900">{stats.systemHealth}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="font-medium">{stats.uptime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Tutors</span>
                <span className="font-medium">{stats.activeTutors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Contracts</span>
                <span className="font-medium text-orange-600">{stats.pendingContracts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Errors (24h)</span>
                <span className={`font-medium ${stats.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.errorCount}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/users/roles')}
                className="w-full flex items-center space-x-3 p-3 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <UserCheck className="w-5 h-5" />
                <span>Assign Roles</span>
              </button>
              <button
                onClick={() => navigate('/admin/users/activate')}
                className="w-full flex items-center space-x-3 p-3 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                <UserCheck className="w-5 h-5" />
                <span>Activate Users</span>
              </button>
              <button
                onClick={() => navigate('/admin/users/deactivate')}
                className="w-full flex items-center space-x-3 p-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <UserX className="w-5 h-5" />
                <span>Deactivate Users</span>
              </button>
              <button
                onClick={() => navigate('/admin/system/refresh')}
                className="w-full flex items-center space-x-3 p-3 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh System</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Bell className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">System Update Available</p>
                  <p className="text-xs text-yellow-600">Version 2.1.0 ready for deployment</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Backup Completed</p>
                  <p className="text-xs text-blue-600">Daily backup successful</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Revenue Target Met</p>
                  <p className="text-xs text-green-600">Monthly target achieved</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Management Modules */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">System Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementModules.map((module, index) => (
              <button
                key={index}
                onClick={module.onClick}
                className="p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left"
              >
                <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mb-4`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent System Activities</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'user' ? 'bg-blue-100' :
                    activity.type === 'payment' ? 'bg-green-100' :
                    activity.type === 'system' ? 'bg-purple-100' :
                    'bg-red-100'
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                        {activity.severity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

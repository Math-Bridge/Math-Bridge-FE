import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  FileText, 
  MessageSquare, 
  Bell,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  MapPin,
  BarChart3,
  MessageCircle,
  Phone,
  Home,
  Settings,
  Star,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  LogOut,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStaffStats, StaffStats } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import ContractManagement from './ContractManagement';
import RescheduleManagement from './RescheduleManagement';
import TutorVerificationManagement from './TutorVerificationManagement';

interface RecentActivity {
  id: string;
  type: 'contract' | 'message' | 'session' | 'request';
  title: string;
  description: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<StaffStats>({
    pendingContracts: 0,
    activeTutors: 0,
    totalCenters: 0,
    unreadMessages: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    rescheduleRequests: 0,
    newParentRequests: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'contracts' | 'reschedules' | 'chat' | 'centers' | 'tutor-verification'>('dashboard');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        
        // Fetch staff stats
        const statsResult = await getStaffStats();
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        } else {
          console.error('Failed to fetch staff stats:', statsResult.error);
          showError(statsResult.error || 'Failed to load staff statistics');
        }

        // TODO: Replace with actual activities API endpoint when available
        setRecentActivities([]);
      } catch (error) {
        console.error('Error fetching staff data:', error);
        showError('Failed to load dashboard data');
        setStats({
          pendingContracts: 0,
          activeTutors: 0,
          totalCenters: 0,
          unreadMessages: 0,
          upcomingSessions: 0,
          completedSessions: 0,
          rescheduleRequests: 0,
          newParentRequests: 0
        });
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [showError]);

  const navigationItems = [
    { name: 'Home', icon: Home, path: '/staff', view: 'dashboard' as const },
    { name: 'Tutor Verification', icon: UserCheck, path: '/staff/tutor-verification', view: 'tutor-verification' as const },
    { name: 'Contract Management', icon: FileText, path: '/staff/contracts', view: 'contracts' as const },
    { name: 'Reschedule Management', icon: RefreshCw, path: '/staff/reschedules', view: 'reschedules' as const },
    { name: 'Chat Support', icon: MessageSquare, path: '/staff/chat', view: 'chat' as const },
    { name: 'Center Management', icon: Building, path: '/staff/centers', view: 'centers' as const },
  ];

  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
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
      case 'contract':
        return <FileText className="w-4 h-4" />;
      case 'message':
        return <MessageCircle className="w-4 h-4" />;
      case 'session':
        return <Calendar className="w-4 h-4" />;
      case 'request':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const renderContentView = () => {
    switch (currentView) {
      case 'tutor-verification':
        return <TutorVerificationManagement hideBackButton />;
      case 'contracts':
        return <ContractManagement hideBackButton />;
      case 'reschedules':
        return <RescheduleManagement hideBackButton />;
      case 'chat':
    return (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chat Support</h2>
            <p className="text-gray-600">Coming soon...</p>
      </div>
    );
      case 'centers':
  return (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Center Management</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        );
      case 'dashboard':
      default:
        return renderDashboardView();
    }
  };

  const renderDashboardView = () => (
    <>
      {/* Header with Greeting */}
      <div className="mb-8">
        <p className="text-sm text-gray-600 mb-2">{getCurrentDate()}</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Hello, {user?.name?.split(' ')[0] || 'Staff'}
        </h1>
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-xl font-semibold">
          <span>How can I help you today?</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          onClick={() => setCurrentView('contracts')}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-800" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Contracts</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingContracts}</p>
        </div>

        <div
          onClick={() => setCurrentView('reschedules')}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-green-800" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Reschedule Requests</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.rescheduleRequests}</p>
        </div>

        <div
          onClick={() => setCurrentView('tutor-verification')}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-800" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Tutors</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.activeTutors}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-800" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Upcoming Sessions</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.upcomingSessions}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* My Tasks Widget */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-800" />
                <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
              </div>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setCurrentView('contracts')}
                className="p-4 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Contract Reviews</span>
                  <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-semibold rounded">High</span>
                </div>
                <p className="text-sm text-gray-600">{stats.pendingContracts} pending contracts</p>
                <p className="text-xs text-gray-500 mt-1">Review and assign tutors</p>
              </div>

              <div
                onClick={() => setCurrentView('reschedules')}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Reschedule Requests</span>
                  <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded">Medium</span>
                </div>
                <p className="text-sm text-gray-600">{stats.rescheduleRequests} pending</p>
                <p className="text-xs text-gray-500 mt-1">Approve or reject requests</p>
              </div>
            </div>
          </div>

          {/* System Stats Widget */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">System Overview</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Centers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCenters}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Reminders Widget */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-800" />
                <h2 className="text-xl font-bold text-gray-900">Reminders</h2>
              </div>
              <span className="text-sm text-gray-600">Today • {stats.unreadMessages}</span>
            </div>
            <div className="space-y-3">
              <div
                onClick={() => setCurrentView('contracts')}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <p className="text-sm text-gray-900 font-medium">
                  Review pending contracts and assign tutors
                </p>
                <p className="text-xs text-gray-600 mt-1">Due today</p>
              </div>
              <div
                onClick={() => setCurrentView('reschedules')}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <p className="text-sm text-gray-900 font-medium">
                  Follow up on reschedule requests
                </p>
                <p className="text-xs text-gray-600 mt-1">2 pending</p>
              </div>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-800" />
                <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="font-semibold text-gray-900 mb-1">Upcoming Sessions</p>
              <p className="text-sm text-gray-600">Today • {stats.upcomingSessions} sessions</p>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm font-medium text-gray-900">Meeting with Tutors</p>
                <p className="text-xs text-gray-600">10:00 - 11:00 am</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
          </div>
    );
  }

  const showSidebar = isSidebarVisible;

  const handleMouseLeaveSidebar = () => {
    setIsSidebarVisible(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hover hotspot to reveal sidebar */}
      <div
        className="fixed inset-y-0 left-0 z-40 w-2 bg-transparent hover:bg-blue-100/10 transition-colors duration-200"
        onMouseEnter={() => setIsSidebarVisible(true)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-out ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={() => setIsSidebarVisible(true)}
        onMouseLeave={handleMouseLeaveSidebar}
      >
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Staff User'}</p>
              <p className="text-xs text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Online
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.name}
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center px-4 py-3 justify-start rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-out ${
          showSidebar ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <div className="min-h-screen bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              {renderContentView()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
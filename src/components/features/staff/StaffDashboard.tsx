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
  UserPlus,
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
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStaffStats, StaffStats } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import TutorMatching from './TutorMatching';
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
  const { user } = useAuth();
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'tutor-matching' | 'contracts' | 'reschedules' | 'chat' | 'centers' | 'tutor-verification'>('dashboard');

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
    { name: 'Tutor Matching', icon: UserPlus, path: '/staff/tutor-matching', view: 'tutor-matching' as const },
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
      case 'tutor-matching':
        return <TutorMatching hideBackButton />;
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

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setCurrentView('tutor-matching')}
          className="flex items-center justify-center px-6 py-4 bg-white border-2 border-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-800 transition-all shadow-sm"
        >
          <Star className="w-5 h-5 text-blue-800 mr-2" />
          <span className="font-semibold text-gray-700">Tutor Matching</span>
        </button>
        <button
          onClick={() => setCurrentView('contracts')}
          className="flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          <FileText className="w-5 h-5 text-blue-800 mr-2" />
          <span className="font-semibold text-gray-700">Contract Review</span>
        </button>
        <button
          onClick={() => setCurrentView('reschedules')}
          className="flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw className="w-5 h-5 text-blue-800 mr-2" />
          <span className="font-semibold text-gray-700">Reschedule</span>
        </button>
        <button
          onClick={() => setCurrentView('chat')}
          className="flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          <MessageSquare className="w-5 h-5 text-blue-800 mr-2" />
          <span className="font-semibold text-gray-700">Chat Support</span>
        </button>
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
              <Settings className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="space-y-3">
              {/* IN PROGRESS Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">IN PROGRESS</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setCurrentView('contracts')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">Contract Reviews</span>
                      <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-semibold rounded">High</span>
          </div>
                    <p className="text-sm text-gray-600">{stats.pendingContracts} pending contracts</p>
                    <p className="text-xs text-gray-500 mt-1">Today</p>
              </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={() => setCurrentView('tutor-matching')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">Tutor Matching</span>
                      <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">Low</span>
              </div>
                    <p className="text-sm text-gray-600">{stats.newParentRequests} requests</p>
                    <p className="text-xs text-gray-500 mt-1">3 days left</p>
            </div>
          </div>
        </div>

              {/* TO DO Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">TO DO</h3>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setCurrentView('reschedules')}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">Reschedule Requests</span>
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded">Medium</span>
                  </div>
                  <p className="text-sm text-gray-600">{stats.rescheduleRequests} pending</p>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                + Add task
                </button>
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
                    <Users className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Tutors</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeTutors}</p>
                  </div>
                </div>
              </div>
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
          {/* Projects Widget */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-800" />
                <h2 className="text-xl font-bold text-gray-900">Active Projects</h2>
              </div>
              <select className="text-sm text-gray-600 border-none bg-transparent cursor-pointer">
                <option>Recents</option>
              </select>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('tutor-matching')}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-700 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Tutor Matching</p>
                    <p className="text-sm text-gray-600">{stats.pendingContracts} contracts</p>
                  </div>
                </div>
              </button>
                <button
                onClick={() => setCurrentView('contracts')}
                className="w-full p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-800" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Contract Management</p>
                      <p className="text-sm text-gray-600">{stats.pendingContracts} pending</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                </button>
              <button
                onClick={() => setCurrentView('reschedules')}
                className="w-full p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-blue-800" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Reschedule Management</p>
                      <p className="text-sm text-gray-600">{stats.rescheduleRequests} requests</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              </button>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-800" />
                <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
              </div>
              <select className="text-sm text-gray-600 border-none bg-transparent cursor-pointer">
                <option>July</option>
              </select>
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
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors" onClick={() => setCurrentView('contracts')}>
                <p className="text-sm text-gray-900 font-medium">
                  Review pending contracts and assign tutors
                </p>
                <p className="text-xs text-gray-600 mt-1">Due today</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setCurrentView('reschedules')}>
                <p className="text-sm text-gray-900 font-medium">
                  Follow up on reschedule requests
                </p>
                <p className="text-xs text-gray-600 mt-1">2 pending</p>
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
            {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Staff User'}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </p>
              </div>
            )}
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
                className={`w-full flex items-center ${sidebarOpen ? 'px-4 py-3 justify-start' : 'px-3 py-3 justify-center'} rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {renderContentView()}
      </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
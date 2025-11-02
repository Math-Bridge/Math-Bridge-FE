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
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StaffStats {
  pendingContracts: number;
  activeTutors: number;
  totalCenters: number;
  unreadMessages: number;
  upcomingSessions: number;
  completedSessions: number;
  rescheduleRequests: number;
  newParentRequests: number;
}

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

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, set default values instead of mock data
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

        // TODO: Replace with actual activities API endpoint when available
        setRecentActivities([]);
      } catch (error) {
        console.error('Error fetching staff data:', error);
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
  }, []);

  const quickActions = [
    {
      title: 'Tutor Matching',
      description: 'Match tutors with contracts',
      icon: UserPlus,
      color: 'bg-blue-500',
      onClick: () => navigate('/staff/tutor-matching')
    },
    {
      title: 'Chat Support',
      description: 'Respond to parent/tutor chats',
      icon: MessageSquare,
      color: 'bg-green-500',
      onClick: () => navigate('/staff/chat')
    },
    {
      title: 'Center Management',
      description: 'Manage centers and tutors',
      icon: Building,
      color: 'bg-purple-500',
      onClick: () => navigate('/staff/centers')
    },
    {
      title: 'Contract Management',
      description: 'Review and approve contracts',
      icon: FileText,
      color: 'bg-orange-500',
      onClick: () => navigate('/staff/contracts')
    }
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600 mt-2">Operational management and support</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingContracts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tutors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeTutors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Tasks</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Contract Reviews</p>
                    <p className="text-sm text-yellow-600">{stats.pendingContracts} pending</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/staff/contracts')}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  Review
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Chat Messages</p>
                    <p className="text-sm text-blue-600">{stats.unreadMessages} unread</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/staff/chat')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Respond
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Tutor Matching</p>
                    <p className="text-sm text-green-600">{stats.newParentRequests} requests</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/staff/tutor-matching')}
                  className="text-green-600 hover:text-green-800"
                >
                  Match
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Reschedule Requests</p>
                    <p className="text-sm text-orange-600">{stats.rescheduleRequests} pending</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/staff/reschedules')}
                  className="text-orange-600 hover:text-orange-800"
                >
                  Review
                </button>
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Centers</span>
                <span className="font-medium">{stats.totalCenters}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Sessions</span>
                <span className="font-medium text-green-600">{stats.completedSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Tutors</span>
                <span className="font-medium text-blue-600">{stats.activeTutors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Upcoming Sessions</span>
                <span className="font-medium text-orange-600">{stats.upcomingSessions}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Reports</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/staff/reports/contracts')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Contract Summary by Month
                </button>
                <button
                  onClick={() => navigate('/staff/reports/tutors')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Tutor Performance per Contract
                </button>
                <button
                  onClick={() => navigate('/staff/reports/sessions')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Session Completion Rates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'contract' ? 'bg-blue-100' :
                    activity.type === 'message' ? 'bg-green-100' :
                    activity.type === 'session' ? 'bg-purple-100' :
                    'bg-orange-100'
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
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
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

export default StaffDashboard;

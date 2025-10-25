import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Star, 
  MessageSquare, 
  Bell,
  FileText,
  Clock,
  MapPin,
  BarChart3,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TutorStats {
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  averageRating: number;
  totalStudents: number;
  activeContracts: number;
  unreadMessages: number;
  notifications: number;
}

interface Session {
  id: string;
  studentName: string;
  subject: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  centerName: string;
  topic: string;
}

interface RecentActivity {
  id: string;
  type: 'session' | 'rating' | 'message' | 'contract';
  title: string;
  description: string;
  timestamp: string;
  status: 'new' | 'read' | 'completed';
}

const TutorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TutorStats>({
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    averageRating: 0,
    totalStudents: 0,
    activeContracts: 0,
    unreadMessages: 0,
    notifications: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo
    setStats({
      totalSessions: 156,
      upcomingSessions: 8,
      completedSessions: 148,
      averageRating: 4.8,
      totalStudents: 12,
      activeContracts: 5,
      unreadMessages: 3,
      notifications: 2
    });

    setUpcomingSessions([
      {
        id: '1',
        studentName: 'Nguyen Minh Anh',
        subject: 'Mathematics',
        date: '2024-01-16',
        time: '15:00',
        status: 'upcoming',
        centerName: 'MathBridge Center District 1',
        topic: 'Linear Equations'
      },
      {
        id: '2',
        studentName: 'Tran Duc Minh',
        subject: 'Physics',
        date: '2024-01-17',
        time: '16:00',
        status: 'upcoming',
        centerName: 'MathBridge Center Thu Duc',
        topic: 'Mechanics'
      },
      {
        id: '3',
        studentName: 'Le Thi Hoa',
        subject: 'Mathematics',
        date: '2024-01-18',
        time: '14:00',
        status: 'upcoming',
        centerName: 'MathBridge Center District 1',
        topic: 'Quadratic Functions'
      }
    ]);

    setRecentActivities([
      {
        id: '1',
        type: 'rating',
        title: 'New rating received',
        description: '5-star rating from Nguyen Minh Anh',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'new'
      },
      {
        id: '2',
        type: 'session',
        title: 'Session completed',
        description: 'Mathematics session with Tran Duc Minh completed',
        timestamp: '2024-01-15T09:15:00Z',
        status: 'completed'
      },
      {
        id: '3',
        type: 'message',
        title: 'New message',
        description: 'Message from parent about upcoming session',
        timestamp: '2024-01-15T08:45:00Z',
        status: 'new'
      },
      {
        id: '4',
        type: 'contract',
        title: 'New contract assigned',
        description: 'Advanced Physics package with Le Thi Hoa',
        timestamp: '2024-01-14T16:30:00Z',
        status: 'read'
      }
    ]);

    setLoading(false);
  }, []);

  const quickActions = [
    {
      title: 'Profile Settings',
      description: 'Update your profile and qualifications',
      icon: User,
      color: 'bg-blue-500',
      onClick: () => navigate('/tutor/profile')
    },
      {
      title: 'My Sessions',
      description: 'View upcoming and completed sessions',
      icon: Calendar,
      color: 'bg-green-500',
      onClick: () => navigate('/tutor/sessions')
    },
    {
      title: 'Center Management',
      description: 'Manage your center assignments',
      icon: MapPin,
      color: 'bg-purple-500',
      onClick: () => navigate('/tutor/centers')
    },
    {
      title: 'Reports',
      description: 'View performance reports',
      icon: BarChart3,
      color: 'bg-orange-500',
      onClick: () => navigate('/tutor/reports')
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <Calendar className="w-4 h-4" />;
      case 'rating':
        return <Star className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'contract':
        return <FileText className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your tutoring sessions and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeContracts}</p>
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

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
              <button
                onClick={() => navigate('/tutor/sessions')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {upcomingSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{session.studentName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{session.subject} • {session.topic}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{session.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{session.centerName}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {stats.notifications}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">New Session Tomorrow</p>
                  <p className="text-xs text-blue-600">Mathematics with Nguyen Minh Anh at 3:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Star className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Rating Received</p>
                  <p className="text-xs text-green-600">5-star rating from Tran Duc Minh</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Message from Parent</p>
                  <p className="text-xs text-orange-600">Le Thi Hoa's parent sent a message</p>
                </div>
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
                    activity.type === 'session' ? 'bg-blue-100' :
                    activity.type === 'rating' ? 'bg-green-100' :
                    activity.type === 'message' ? 'bg-purple-100' :
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
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'read' ? 'bg-gray-100 text-gray-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {activity.status}
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

export default TutorDashboard;

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin,
  BarChart3,
  User
} from 'lucide-react';
import { TutorAvailabilitiesManager } from '.';

// Removed TutorStats for simplified dashboard layout

// Removed Session and RecentActivity types from previous layout

const TutorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo
    // no-op

    setLoading(false);
  }, []);

  type ActionKey = 'availabilities' | 'profile' | 'sessions' | 'centers' | 'reports';
  const [selectedAction, setSelectedAction] = useState<ActionKey>('availabilities');

  const quickActions: Array<{
    key: ActionKey;
    title: string;
    description: string;
    icon: any;
    color: string;
  }> = [
    {
      key: 'availabilities',
      title: 'My Availabilities',
      description: 'Quản lý lịch dạy của bạn',
      icon: Calendar,
      color: 'bg-teal-500',
    },
    {
      key: 'profile',
      title: 'Profile Settings',
      description: 'Update your profile and qualifications',
      icon: User,
      color: 'bg-blue-500',
    },
    {
      key: 'sessions',
      title: 'My Sessions',
      description: 'View upcoming and completed sessions',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      key: 'centers',
      title: 'Center Management',
      description: 'Manage your center assignments',
      icon: MapPin,
      color: 'bg-purple-500',
    },
    {
      key: 'reports',
      title: 'Reports',
      description: 'View performance reports',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ];

  function renderRightPane() {
    switch (selectedAction) {
      case 'availabilities':
        return <TutorAvailabilitiesManager />;
      case 'profile':
        return (
          <div className="p-6 bg-white rounded-xl border border-gray-200">Coming soon: Profile Settings</div>
        );
      case 'sessions':
        return (
          <div className="p-6 bg-white rounded-xl border border-gray-200">Coming soon: Sessions</div>
        );
      case 'centers':
        return (
          <div className="p-6 bg-white rounded-xl border border-gray-200">Coming soon: Center Management</div>
        );
      case 'reports':
        return (
          <div className="p-6 bg-white rounded-xl border border-gray-200">Coming soon: Reports</div>
        );
      default:
        return null;
    }
  }

  // Removed unused helpers from previous dashboard layout

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your tutoring sessions and performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar: Quick Actions */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => setSelectedAction(action.key)}
                    className={`w-full p-4 rounded-lg border transition-all text-left flex items-start gap-3 ${
                      selectedAction === action.key
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}> 
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right content */}
          <main className="lg:col-span-3">
            {renderRightPane()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;

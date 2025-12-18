import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  BarChart3,
  User,
  Menu,
  X,
  LogOut,
  FileText,
  XCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TutorSessions, TutorProfile, TutorDailyReport, TutorTestResult, TutorParentReports } from '.';
import { useAuth } from '../../../hooks/useAuth';

const TutorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  type ActionKey = 'profile' | 'sessions' | 'reports' | 'test-results' | 'parent-reports';
  const [selectedAction, setSelectedAction] = useState<ActionKey>('sessions');

  useEffect(() => {
    setLoading(false);
    const needsLocationUpdate = !user?.placeId || user?.phone === 'N/A';
    const state = location.state as { needsLocation?: boolean; needsPhone?: boolean; needsVerification?: boolean } | null;
    if (needsLocationUpdate || state?.needsLocation || state?.needsPhone || state?.needsVerification) {
      setSelectedAction('profile');
    }
  }, [location.state, user]);

  const navigationItems = [
    { key: 'sessions' as ActionKey, name: 'My Sessions', icon: Calendar, description: 'View upcoming and completed sessions' },
    { key: 'reports' as ActionKey, name: 'Daily Reports', icon: BarChart3, description: 'Create and manage daily reports' },
    { key: 'test-results' as ActionKey, name: 'Test Results', icon: FileText, description: 'Create and manage test results' },
    { key: 'parent-reports' as ActionKey, name: 'Parent Reports', icon: FileText, description: 'Report issues or concerns about parents' },
    { key: 'profile' as ActionKey, name: 'Profile Settings', icon: User, description: 'Update your profile and qualifications' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (user?.name) {
      const name = user.name || '';
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return 'TU';
  };

  const showSidebar = mobileMenuOpen || isSidebarVisible;

  const handleMouseLeaveSidebar = () => {
    if (!mobileMenuOpen) {
      setIsSidebarVisible(false);
    }
  };

  function renderContentView() {
    const needsLocationUpdate = !user?.placeId || user?.phone === 'N/A';
    
    if (needsLocationUpdate && selectedAction !== 'profile') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <XCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Profile Setup Required
              </h3>
              <p className="text-yellow-700 mb-4">
                You need to complete your profile setup before accessing this feature. 
                Please update your location{user?.phone === 'N/A' ? ' and phone number' : ''} first.
              </p>
              <button
                onClick={() => setSelectedAction('profile')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Go to Profile Settings
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    switch (selectedAction) {
      case 'profile':
        return <TutorProfile />;
      case 'sessions':
        return <TutorSessions />;
      case 'reports':
        return <TutorDailyReport />;
      case 'test-results':
        return <TutorTestResult />;
      case 'parent-reports':
        return <TutorParentReports />;
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="fixed inset-y-0 left-0 z-40 w-2 bg-transparent hover:bg-blue-100/10 transition-colors duration-200"
        onMouseEnter={() => setIsSidebarVisible(true)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-out ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={() => setIsSidebarVisible(true)}
        onMouseLeave={handleMouseLeaveSidebar}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden relative">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user?.name || 'Tutor'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : null}
              {!user?.avatarUrl && (
                <span className="relative z-10">{getUserInitials()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Tutor'}</p>
              <p className="text-xs text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Online
              </p>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsSidebarVisible(false);
              }}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedAction === item.key;
            const needsLocationUpdate = !user?.placeId || user?.phone === 'N/A';
            const isDisabled = needsLocationUpdate && item.key !== 'profile';
            
            return (
              <button
                key={item.key}
                onClick={() => {
                  setSelectedAction(item.key);
                  setMobileMenuOpen(false);
                }}
                disabled={isDisabled}
                className={`w-full flex items-center px-4 py-3 justify-start rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : isDisabled
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
                title={isDisabled ? 'Complete your profile first' : ''}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
                {isDisabled && (
                  <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                    Locked
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main
        className={`transition-all duration-300 ease-out relative z-10 ${
          showSidebar ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <div className="lg:hidden fixed top-4 left-4 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 lg:p-8">
          {(!user?.placeId || user?.phone === 'N/A') && (
            <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <XCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800">
                    Action Required: Complete Your Profile
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please update your {!user?.placeId ? 'location' : ''}{!user?.placeId && user?.phone === 'N/A' ? ' and ' : ''}{user?.phone === 'N/A' ? 'phone number' : ''} to access all dashboard features.
                  </p>
                </div>
                {selectedAction !== 'profile' && (
                  <button
                    onClick={() => setSelectedAction('profile')}
                    className="flex-shrink-0 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Update Now
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your tutoring sessions and performance</p>
          </div>

          {renderContentView()}
        </div>
      </main>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default TutorDashboard;

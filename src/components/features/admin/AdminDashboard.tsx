import React, { useState } from 'react';
import {
  Users,
  Building,
  BarChart3,
  FileText,
  CreditCard,
  LayoutDashboard,
  X,
  LogOut,
  Shield,
  Menu,
  Brain
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AdminDashboard: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const navItems: NavItem[] = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/curricula', label: 'Curriculum Management', icon: FileText },
    { path: '/admin/units', label: 'Units Management', icon: FileText },
    { path: '/admin/math-concepts', label: 'Math Concepts', icon: Brain },
    { path: '/admin/centers', label: 'Center Management', icon: Building },
    { path: '/admin/packages', label: 'Payment Packages', icon: CreditCard },
    { path: '/admin/finance', label: 'Finance & Reports', icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (user?.fullName || user?.name) {
      const name = user.fullName || user.name || '';
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const showSidebar = mobileMenuOpen || isSidebarVisible;

  const handleMouseLeaveSidebar = () => {
    if (!mobileMenuOpen) {
      setIsSidebarVisible(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Hover hotspot to reveal sidebar */}
      <div
        className="fixed inset-y-0 left-0 z-40 w-2 bg-transparent hover:bg-blue-100/10 transition-colors duration-200"
        onMouseEnter={() => setIsSidebarVisible(true)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-out ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={() => setIsSidebarVisible(true)}
        onMouseLeave={handleMouseLeaveSidebar}
        style={{ zIndex: 30 }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">System Management</p>
              </div>  
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsSidebarVisible(false);
              }}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                        setIsSidebarVisible(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-blue-700' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">System Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-blue-700">All systems operational</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-out relative z-10 ${
          showSidebar ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.name || 'Administrator'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'admin@system.com'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">{getUserInitials()}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

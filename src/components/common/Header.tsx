import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Calculator, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home,
  BookOpen,
  Trophy,
  Settings,
  Bell,
  Users,
  GraduationCap
} from 'lucide-react';
import { useState } from 'react';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  if (isAuthPage) {
    return null; // Don't show header on auth pages
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/home', icon: Home },
    { name: 'Gia sư', href: '/tutors', icon: GraduationCap },
    { name: 'Học sinh', href: '/students', icon: Users },
    { name: 'Khóa học', href: '/courses', icon: BookOpen },
    { name: 'Thành tích', href: '/achievements', icon: Trophy },
    { name: 'Cài đặt', href: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/home" className="flex items-center space-x-2 hover-lift">
              <div className="relative">
                <Calculator className="h-8 w-8 text-blue-900 animate-pulse-slow" />
                <span className="absolute -top-1 -right-1 text-xs text-blue-600 animate-bounce-slow">π</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">MathBridge</span>
                <div className="text-xs text-blue-600 font-mono">∫ f(x)dx = success</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-lift ${
                      isActive
                        ? 'bg-blue-100 text-blue-900 shadow-sm'
                        : 'text-gray-600 hover:text-blue-900 hover:bg-blue-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 hover-lift relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">∑ Chào mừng trở lại</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover-lift">
                      <User className="h-4 w-4 text-blue-900" />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors hover-lift"
                      title="Đăng xuất"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">Đăng xuất</span>
                    </button>
                  </div>
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-900 font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-fade-in">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:text-blue-900 hover:bg-blue-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
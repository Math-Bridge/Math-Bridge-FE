import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home,
  BookOpen,
  Wallet,
  ChevronDown,
  FileText,
  Settings,
  Users,
  Calendar,
  Award,
} from 'lucide-react';
import { apiService } from '../../services/api';
import logo from '../../assets/logo.png';
import SettingsModal from './SettingsModal';
import { useTranslation } from '../../hooks/useTranslation';
import NotificationBell from './NotificationBell';

import { Sparkles } from 'lucide-react';
const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  // State management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  // Refs for click outside detection
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Navigation items configuration based on user role
  const getNavigationItems = () => {
    if (user?.role === 'tutor') {
      return [
        { name: 'Dashboard', href: '/tutor/dashboard', icon: Home },
      ];
    } else if (user?.role === 'staff') {
      // Staff has no navigation items - they stay in dashboard
      return [];
    } else if (user?.role === 'parent') {
      // Navigation for Parent role
      return [
        { name: 'Home', href: '/home', icon: Home },
        { name: 'My Children', href: '/my-children', icon: Users },
        { name: 'Contracts', href: '/contracts', icon: FileText },
        { name: 'Packages', href: '/packages', icon: BookOpen },
        { name: 'Schedule', href: '/parent/schedule', icon: Calendar },
        { name: 'Test Results', href: '/test-results', icon: Award },
        { name: 'Homework Helper', href: '/parent/homework-helper', icon: Sparkles },
      ];
    } else if (user?.role === 'admin') {
      // Navigation for Admin role
      return [
        { name: 'Dashboard', href: '/admin', icon: Home },
        { name: 'Contracts', href: '/contracts', icon: FileText },
        { name: 'Packages', href: '/packages', icon: BookOpen },
      ];
    } else {
      // Default navigation for other roles
      return [
        { name: 'Contracts', href: '/contracts', icon: FileText },
        { name: 'Packages', href: '/packages', icon: BookOpen },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  // Fetch wallet data and check balance every 5 seconds
  useEffect(() => {
    const fetchWallet = async () => {
      if (!isAuthenticated) return;
      
      // Only fetch wallet for parent role (not tutor, not staff)
      if (user?.role === 'tutor' || user?.role === 'staff') {
        return;
      }
      
      try {
        const userStr = localStorage.getItem('user');
        const userId = userStr ? JSON.parse(userStr).id : '';
        
        if (!userId) {
          console.warn('User ID not found for wallet fetch');
          setWalletBalance(0);
          setWalletLoading(false);
          return;
        }

        const res = await apiService.getUserWallet(userId);
        
        if (res.success && res.data) {
          const balance = res.data.walletBalance || 0;
          setWalletBalance(balance);
          console.log('Wallet balance loaded:', balance);
        } else {
          console.error('Failed to load wallet:', res.error);
          setWalletBalance(0);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    };

    // Fetch initial balance
    fetchWallet();

    // Check balance every 5 seconds
    const walletInterval = setInterval(fetchWallet, 5000);

    return () => clearInterval(walletInterval);
  }, [isAuthenticated, user?.role]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const closeAllDropdowns = () => {
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Get home path based on user role
  const getHomePath = () => {
    if (!isAuthenticated || !user) {
      return '/home';
    }
    
    switch (user.role) {
      case 'parent':
        return '/home';
      case 'tutor':
        return '/tutor/dashboard';
      case 'staff':
        return '/staff';
      case 'admin':
        return '/admin';
      default:
        return '/home';
    }
  };

  const handleLogoClick = () => {
    navigate(getHomePath());
  };

  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 shadow-md sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 cursor-pointer group"
              aria-label="MathBridge Home"
            >
              <div className="relative">
                <img 
                  src={logo} 
                  alt="MathBridge Logo" 
                  className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-110" 
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hidden sm:block">
                MathBridge
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && navigationItems.length > 0 && (
            <nav className="hidden md:flex items-center space-x-1" role="navigation" aria-label="Main navigation">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAuthenticated ? (
              <>
                {/* Wallet - Simplified for non-tutor and non-staff users */}
                {user?.role !== 'tutor' && user?.role !== 'staff' && (
                  <button
                    onClick={() => navigate('/wallet')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 rounded-lg transition-all duration-200 border border-green-200 shadow-sm hover:shadow-md"
                    aria-label="Wallet"
                  >
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                      <span className="text-sm font-bold">
                      {walletLoading ? (
                        <span className="text-gray-400 animate-pulse">...</span>
                      ) : (
                        <span>
                          {new Intl.NumberFormat('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND',
                            maximumFractionDigits: 0
                          }).format(walletBalance)}
                      </span>
                      )}
                    </span>
                  </button>
                )}

                {/* Notification Bell */}
                <NotificationBell />

                {/* User Menu */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(!isUserDropdownOpen);
                    }}
                    className="flex items-center space-x-2 p-1.5 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200"
                    aria-expanded={isUserDropdownOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                      {user?.avatarUrl && !avatarError ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user?.name || 'User'} 
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <User className="h-5 w-5 text-white" aria-hidden="true" />
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-semibold text-gray-900">{user?.name?.split(' ')[0] || 'User'}</div>
                      <div className="text-xs text-gray-500 capitalize">{user?.role || 'Parent'}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      isUserDropdownOpen ? 'rotate-180' : ''
                    }`} aria-hidden="true" />
                  </button>

                  {isUserDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                            {user?.avatarUrl && !avatarError ? (
                              <img 
                                src={user.avatarUrl} 
                                alt={user?.name || 'User'} 
                                className="w-full h-full object-cover"
                                onError={() => setAvatarError(true)}
                              />
                            ) : (
                              <User className="h-6 w-6 text-white" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 truncate">{user?.name || 'User'}</div>
                            <div className="text-sm text-gray-600 truncate">{user?.email}</div>
                            <div className="text-xs text-blue-600 mt-1 capitalize font-medium">{user?.role || 'Parent'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                            <button
                              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors group"
                              onClick={() => { 
                                closeAllDropdowns(); 
                                navigate('/user-profile'); 
                              }}
                              role="menuitem"
                            >
                              <User className="h-4 w-4 mr-3 text-gray-500 group-hover:text-blue-600" aria-hidden="true" />
                              <span className="font-medium">{t('profile')}</span>
                            </button>
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors group"
                          onClick={() => { 
                            closeAllDropdowns(); 
                            setShowSettings(true); 
                          }}
                          role="menuitem"
                        >
                          <Settings className="h-4 w-4 mr-3 text-gray-500 group-hover:text-blue-600" aria-hidden="true" />
                          <span className="font-medium">{t('settings')}</span>
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group font-medium"
                          onClick={handleLogout}
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
                          {t('signOut')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                    setIsUserDropdownOpen(false);
                  }}
                  className="md:hidden p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  aria-expanded={isMobileMenuOpen}
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-100 bg-white py-4">
            <nav className="space-y-1" role="navigation" aria-label="Mobile navigation">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeAllDropdowns}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {/* Mobile Wallet Button */}
              {user?.role !== 'tutor' && user?.role !== 'staff' && (
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    navigate('/wallet');
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200"
                  aria-label="Wallet"
                >
                  <Wallet className="h-5 w-5" aria-hidden="true" />
                  <span className="font-bold">
                    {walletLoading ? (
                      <span className="text-gray-400 animate-pulse">Loading...</span>
                    ) : (
                      <span>
                        {new Intl.NumberFormat('vi-VN', { 
                          style: 'currency', 
                          currency: 'VND',
                          maximumFractionDigits: 0
                        }).format(walletBalance)}
                      </span>
                    )}
                  </span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
};

export default Header;
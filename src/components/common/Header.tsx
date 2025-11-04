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
} from 'lucide-react';
import { apiService } from '../../services/api';
import logo from '../../assets/logo.png';
import SettingsModal from './SettingsModal';
import { useTranslation } from '../../hooks/useTranslation';

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
      ];
    } else {
      // Default navigation for other roles (admin, etc.)
      return [
        { name: 'Home', href: '/home', icon: Home },
        { name: 'Contracts', href: '/contracts', icon: FileText },
        { name: 'Packages', href: '/packages', icon: BookOpen },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  // Fetch wallet data
  useEffect(() => {
    const fetchWallet = async () => {
      if (!isAuthenticated) return;
      
      // Only fetch wallet for parent role (not tutor, not staff)
      if (user?.role === 'tutor' || user?.role === 'staff') {
        return;
      }
      
      setWalletLoading(true);
      
      try {
        const userStr = localStorage.getItem('user');
        const userId = userStr ? JSON.parse(userStr).id : '';
        
        if (!userId) {
          console.warn('User ID not found for wallet fetch');
          setWalletBalance(0);
          return;
        }

        const res = await apiService.getUserWallet(userId);
        
        if (res.success && res.data) {
          const balance = res.data.balance || 0;
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

    fetchWallet();
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

  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/home" 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
              aria-label="MathBridge Home"
            >
              <div className="relative">
                <img src={logo} alt="MathBridge Logo" className="h-10 w-10 object-contain" />
                <span className="absolute -top-1 -right-1 text-xs text-blue-600">π</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MathBridge</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && navigationItems.length > 0 && (
            <nav className="hidden md:flex space-x-4" role="navigation" aria-label="Main navigation">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-900 shadow-sm'
                        : 'text-gray-600 hover:text-blue-900 hover:bg-blue-50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                {/* Wallet - Simplified for non-tutor and non-staff users */}
                {user?.role !== 'tutor' && user?.role !== 'staff' && (
                  <button
                    onClick={() => navigate('/wallet')}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    aria-label="Wallet"
                  >
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-semibold">
                      {walletLoading ? (
                        <span className="text-gray-400">...</span>
                      ) : (
                        <span>
                          {new Intl.NumberFormat('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND' 
                          }).format(walletBalance)}
                        </span>
                      )}
                    </span>
                  </button>
                )}

                {/* User Menu */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(!isUserDropdownOpen);
                    }}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    aria-expanded={isUserDropdownOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-900" aria-hidden="true" />
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                      isUserDropdownOpen ? 'rotate-180' : ''
                    }`} aria-hidden="true" />
                  </button>

                  {isUserDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="p-4 border-b border-gray-100">
                        <div className="font-semibold text-gray-900">{user?.name || 'User'}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                        <div className="text-xs text-blue-600 mt-1 capitalize">{user?.role || 'Parent'}</div>
                      </div>
                      <div className="py-1">
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => { 
                            closeAllDropdowns(); 
                            navigate('/user-profile'); 
                          }}
                          role="menuitem"
                        >
                          <User className="h-4 w-4 mr-3 text-gray-500" aria-hidden="true" />
                          {t('profile')}
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => { 
                            closeAllDropdowns(); 
                            setShowSettings(true); 
                          }}
                          role="menuitem"
                        >
                          <Settings className="h-4 w-4 mr-3 text-gray-500" aria-hidden="true" />
                          {t('settings')}
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={handleLogout}
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
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
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2" role="navigation" aria-label="Mobile navigation">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeAllDropdowns}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:text-blue-900 hover:bg-blue-50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
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
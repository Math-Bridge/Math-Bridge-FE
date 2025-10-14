import React, { useEffect, useState, useRef } from 'react';
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
  GraduationCap,
  Wallet,
  Plus,
  CreditCard,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { apiService } from '../../services/api';
import logo from '../../assets/logo.png';
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  
  // State management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Refs for click outside detection
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Navigation items configuration
  const navigationItems = [
    { name: 'Home', href: '/home', icon: Home },
    // { name: 'Dashboard', href: '/dashboard', icon: Settings },
    // { name: 'Tutors', href: '/tutors', icon: GraduationCap },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Centers', href: '/centers', icon: Users },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Fetch wallet data
  useEffect(() => {
    const fetchWallet = async () => {
      if (!isAuthenticated) return;
      
      setWalletLoading(true);
      setWalletError(null);
      
      try {
        const userStr = localStorage.getItem('user');
        const userId = userStr ? JSON.parse(userStr).id : '';
        
        if (!userId) {
          throw new Error('User not found');
        }

        const res = await apiService.getUserWallet(userId);
        
        if (res.success && res.data) {
          setWalletBalance(res.data.balance || 0);
          setRecentTransactions(res.data.transactions?.slice(0, 5) || []);
        } else {
          throw new Error(res.error || 'Failed to load wallet');
        }
      } catch (error) {
        setWalletError(error instanceof Error ? error.message : 'Failed to load wallet');
        setWalletBalance(0);
        setRecentTransactions([]);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, [isAuthenticated]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
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
        setIsWalletDropdownOpen(false);
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
    setIsWalletDropdownOpen(false);
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
              <div>
                <span className="text-xl font-bold text-gray-900">MathBridge</span>
                <div className="text-xs text-blue-600 font-mono">∫ f(x)dx = success</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
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
                {/* Wallet Section */}
                <div className="relative" ref={walletDropdownRef}>
                  <button
                    onClick={() => {
                      setIsWalletDropdownOpen(!isWalletDropdownOpen);
                      setIsUserDropdownOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-blue-200"
                    aria-expanded={isWalletDropdownOpen}
                    aria-haspopup="true"
                    aria-label={`Wallet balance: $${walletBalance.toFixed(2)}`}
                  >
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-xs text-gray-500 font-mono">Balance</span>
                      <span className="text-sm font-semibold">
                        {walletLoading ? '...' : `$${walletBalance.toFixed(2)}`}
                      </span>
                    </div>
                    <span className="sm:hidden text-sm font-semibold">
                      {walletLoading ? '...' : `$${walletBalance.toFixed(2)}`}
                    </span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                      isWalletDropdownOpen ? 'rotate-180' : ''
                    }`} aria-hidden="true" />
                  </button>

                  {/* Wallet Dropdown */}
                  {isWalletDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="p-4">
                        {/* Wallet Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-5 w-5 text-blue-900" aria-hidden="true" />
                            <span className="font-semibold text-gray-900">My Wallet</span>
                          </div>
                          <button
                            onClick={() => setIsWalletDropdownOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            aria-label="Close wallet menu"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>

                        {walletLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading wallet...</p>
                          </div>
                        ) : walletError ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-red-600">{walletError}</p>
                          </div>
                        ) : (
                          <>
                            {/* Balance Display */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600 font-mono">Current Balance</p>
                                  <p className="text-2xl font-bold text-blue-900">${walletBalance.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500 mt-1">Available to spend</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-500" aria-hidden="true" />
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <button 
                                onClick={() => {
                                  closeAllDropdowns();
                                  navigate('/wallet/topup');
                                }}
                                className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                role="menuitem"
                              >
                                <Plus className="h-4 w-4 text-blue-900" aria-hidden="true" />
                                <span className="text-sm font-medium text-blue-900">Top Up</span>
                              </button>
                              <button 
                                onClick={() => {
                                  closeAllDropdowns();
                                  navigate('/wallet/history');
                                }}
                                className="flex items-center justify-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                role="menuitem"
                              >
                                <CreditCard className="h-4 w-4 text-gray-700" aria-hidden="true" />
                                <span className="text-sm font-medium text-gray-700">History</span>
                              </button>
                            </div>

                            {/* Recent Transactions */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Transactions</h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {recentTransactions.length > 0 ? (
                                  recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                          {transaction.description}
                                        </p>
                                        <p className="text-xs text-gray-500">{transaction.date}</p>
                                      </div>
                                      <div className={`text-sm font-semibold ${
                                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-gray-500 text-center py-4">No recent transactions</p>
                                )}
                              </div>
                            </div>

                            {/* View All Link */}
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => {
                                  closeAllDropdowns();
                                  navigate('/user-wallet');
                                }}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                role="menuitem"
                              >
                                View Full Wallet →
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <button 
                  className="p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" aria-hidden="true"></span>
                </button>

                {/* User Menu */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(!isUserDropdownOpen);
                      setIsWalletDropdownOpen(false);
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
                          Profile
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => { 
                            closeAllDropdowns(); 
                            navigate('/user-wallet'); 
                          }}
                          role="menuitem"
                        >
                          <Wallet className="h-4 w-4 mr-3 text-gray-500" aria-hidden="true" />
                          Wallet
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => { 
                            closeAllDropdowns(); 
                            navigate('/settings'); 
                          }}
                          role="menuitem"
                        >
                          <Settings className="h-4 w-4 mr-3 text-gray-500" aria-hidden="true" />
                          Settings
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={handleLogout}
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                    setIsWalletDropdownOpen(false);
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
            {/* Mobile Wallet Section */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-blue-900" aria-hidden="true" />
                  <span className="text-sm font-medium text-blue-900">Wallet Balance</span>
                </div>
                <span className="text-lg font-bold text-blue-900">
                  {walletLoading ? '...' : `$${walletBalance.toFixed(2)}`}
                </span>
              </div>
              {!walletLoading && !walletError && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      closeAllDropdowns();
                      navigate('/wallet/topup');
                    }}
                    className="flex items-center justify-center space-x-1 p-2 bg-blue-100 hover:bg-blue-200 rounded text-xs font-medium text-blue-900 transition-colors"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    <span>Top Up</span>
                  </button>
                  <button 
                    onClick={() => {
                      closeAllDropdowns();
                      navigate('/user-wallet');
                    }}
                    className="flex items-center justify-center space-x-1 p-2 bg-blue-100 hover:bg-blue-200 rounded text-xs font-medium text-blue-900 transition-colors"
                  >
                    <CreditCard className="h-3 w-3" aria-hidden="true" />
                    <span>View Wallet</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Navigation Items */}
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
    </header>
  );
};

export default Header;
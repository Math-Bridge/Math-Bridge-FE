import React, { useEffect, useState } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { apiService } from '../../services/api';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      setWalletLoading(true);
      setWalletError(null);
      const userStr = localStorage.getItem('user');
      let userId = '';
      try {
        userId = userStr ? JSON.parse(userStr).id : '';
      } catch {
        userId = '';
      }
      if (!userId) {
        setWalletError('User not found');
        setWalletLoading(false);
        return;
      }
      const res = await apiService.getUserWallet(userId);
      if (res.success && res.data) {
        setWalletBalance(res.data.balance);
        setRecentTransactions(res.data.transactions.slice(0, 5)); // show 5 recent
      } else {
        setWalletError(res.error || 'Failed to load wallet');
      }
      setWalletLoading(false);
    };
    if (isAuthenticated) fetchWallet();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  if (isAuthPage) {
    return null; // Don't show header on auth pages
  }

  const navigationItems = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: Settings },
    { name: 'Tutors', href: '/tutors', icon: GraduationCap },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
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
                {/* Wallet Section */}
                <div className="relative">
                  <button
                    onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 hover-lift border border-gray-200 hover:border-blue-200"
                  >
                    <Wallet className="h-4 w-4" />
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-xs text-gray-500 font-mono">Balance</span>
                      <span className="text-sm font-semibold">${walletBalance.toFixed(2)}</span>
                    </div>
                    <span className="sm:hidden text-sm font-semibold">${walletBalance.toFixed(2)}</span>
                  </button>

                  {/* Wallet Dropdown */}
                  {isWalletDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in">
                      <div className="p-4">
                        {/* Wallet Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-5 w-5 text-blue-900" />
                            <span className="font-semibold text-gray-900">My Wallet</span>
                          </div>
                          <button
                            onClick={() => setIsWalletDropdownOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>

                        {/* Balance Display */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 font-mono">Current Balance</p>
                              <p className="text-2xl font-bold text-blue-900">${walletBalance.toFixed(2)}</p>
                              <p className="text-xs text-gray-500 mt-1">Available to spend</p>
                            </div>
                            <div className="text-green-500">
                              <TrendingUp className="h-8 w-8" />
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <button 
                            onClick={() => {
                              setIsWalletDropdownOpen(false);
                              navigate('/wallet/topup');
                            }}
                            className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Plus className="h-4 w-4 text-blue-900" />
                            <span className="text-sm font-medium text-blue-900">Top Up</span>
                          </button>
                          <button 
                            onClick={() => {
                              setIsWalletDropdownOpen(false);
                              navigate('/wallet/history');
                            }}
                            className="flex items-center justify-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <CreditCard className="h-4 w-4 text-gray-700" />
                            <span className="text-sm font-medium text-gray-700">History</span>
                          </button>
                        </div>

                        {/* Recent Transactions */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Transactions</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {recentTransactions.map((transaction) => (
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
                            ))}
                          </div>
                        </div>

                        {/* View All Link */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setIsWalletDropdownOpen(false);
                              navigate('/user-wallet');
                            }}
                            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Full Wallet →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                    <div className="text-xs text-gray-500 font-mono">∑ Welcome back</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover-lift cursor-pointer"
                      onClick={() => navigate('/user-profile')}
                      title="View personal information"
                    >
                      <User className="h-4 w-4 text-blue-900" />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors hover-lift"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">Logout</span>
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
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-fade-in">
            {/* Mobile Wallet Section */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-blue-900" />
                  <span className="text-sm font-medium text-blue-900">Wallet Balance</span>
                </div>
                <span className="text-lg font-bold text-blue-900">${walletBalance.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/wallet/topup');
                  }}
                  className="flex items-center justify-center space-x-1 p-2 bg-blue-100 hover:bg-blue-200 rounded text-xs font-medium text-blue-900 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Top Up</span>
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/wallet');
                  }}
                  className="flex items-center justify-center space-x-1 p-2 bg-blue-100 hover:bg-blue-200 rounded text-xs font-medium text-blue-900 transition-colors"
                >
                  <CreditCard className="h-3 w-3" />
                  <span>View Wallet</span>
                </button>
              </div>
            </div>

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

      {/* Overlay to close wallet dropdown when clicking outside */}
      {isWalletDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsWalletDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
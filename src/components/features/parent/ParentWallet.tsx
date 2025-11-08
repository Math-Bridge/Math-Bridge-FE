import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, WalletTransaction } from '../../../services/api';

const ParentWallet: React.FC = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      setError(null);
      
      // Get userId from localStorage or context
      const user = localStorage.getItem('user');
      let userId = '';
      try {
        userId = user ? JSON.parse(user).id : 'demo-user';
      } catch {
        userId = 'demo-user';
      }

      const res = await apiService.getUserWallet(userId);
      if (res.success && res.data) {
        setBalance(res.data.walletBalance);
        setTransactions(res.data.transactions);
      } else {
        setError(res.error || 'Failed to load wallet info');
      }
      setLoading(false);
    };

    fetchWallet();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Wallet className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    const user = localStorage.getItem('user');
    let userId = '';
    try {
      userId = user ? JSON.parse(user).id : 'demo-user';
    } catch {
      userId = 'demo-user';
    }

    const res = await apiService.getUserWallet(userId);
    if (res.success && res.data) {
      setBalance(res.data.walletBalance);
      setTransactions(res.data.transactions);
    } else {
      setError(res.error || 'Failed to refresh wallet');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600 mt-2">Manage your account balance and transactions</p>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Wallet Balance</h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              <span>{showBalance ? 'Hide' : 'Show'} Balance</span>
            </button>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {showBalance ? formatCurrency(balance) : '••••••••'}
            </div>
            <p className="text-gray-600">Available Balance</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/wallet/topup')}
            className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-green-900">Top Up</h3>
                <p className="text-sm text-green-700">Add funds to wallet</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/wallet/history')}
            className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-blue-900">Transaction History</h3>
                <p className="text-sm text-blue-700">View all transactions</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/contracts')}
            className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-purple-900">My Contracts</h3>
                <p className="text-sm text-purple-700">Manage learning contracts</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <button
              onClick={() => navigate('/wallet/history')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <button
                onClick={() => navigate('/wallet/topup')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Funds
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentWallet;

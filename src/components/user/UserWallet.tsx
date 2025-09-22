import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { apiService, WalletTransaction } from '../../services/api';

const UserWallet: React.FC = () => {
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
        setBalance(res.data.balance);
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

  const getTransactionIcon = (amount: number) => {
    return amount > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getCategoryColor = (category?: string) => {
    const colors: { [key: string]: string } = {
      courses: 'bg-blue-100 text-blue-800',
      tutoring: 'bg-green-100 text-green-800',
      materials: 'bg-purple-100 text-purple-800',
      topup: 'bg-indigo-100 text-indigo-800',
      bonus: 'bg-yellow-100 text-yellow-800',
      subscription: 'bg-pink-100 text-pink-800'
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mr-3" />
          <span className="text-gray-600 text-lg">Loading wallet information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">{error}</div>
            <button 
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Wallet className="h-8 w-8 text-blue-900" />
        <h2 className="text-3xl font-bold text-gray-900">Your Wallet</h2>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wallet className="h-6 w-6" />
            <span className="text-lg font-semibold">Current Balance</span>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
        </div>
        <div className="text-4xl font-bold mb-2">
          {showBalance ? formatCurrency(balance) : '••••••••'}
        </div>
        <div className="text-blue-100 text-sm">
          Available to spend
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500">Your transaction history will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {getTransactionIcon(tx.amount)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {tx.description || tx.type}
                        </p>
                        {tx.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {tx.category && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(tx.category)}`}>
                            {tx.category.charAt(0).toUpperCase() + tx.category.slice(1)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDate(tx.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWallet;
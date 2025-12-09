import React, { useState, useRef } from 'react';
import { Wallet, AlertCircle, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, WalletTransaction } from '../../../services/api';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';

const ParentWallet: React.FC = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<
    (WalletTransaction & { balanceBefore: number; balanceAfter: number; signedAmount: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5; // 5 transactions per page
  const isInitialLoadRef = useRef(true);

  const mapAndAnnotateTransactions = (
    txs: any[],
    currentBalance: number
  ): (WalletTransaction & { balanceBefore: number; balanceAfter: number; signedAmount: number })[] => {
    // Normalize, sort by date desc, then compute running balances so each item knows before/after values
    const normalized = (txs || []).map((tx: any) => {
      let transactionType = (tx.type || tx.transactionType || '').toLowerCase();
      const desc = (tx.description || tx.note || '').toLowerCase();
      
      if (transactionType === 'withdrawal' || transactionType.includes('withdrawal') || transactionType.includes('deduct')) {
        transactionType = 'payment';
      } else if (transactionType === 'deposit' || transactionType.includes('deposit') || transactionType.includes('top')) {
        transactionType = 'deposit';
      } else if (transactionType === 'refund') {
        transactionType = 'refund';
      } else if (transactionType === 'payment') {
        transactionType = 'payment';
      } else {
        if (desc.includes('payment for contract') || desc.includes('contract payment')) {
          transactionType = 'payment';
        } else if (desc.includes('deposit') || desc.includes('top-up') || desc.includes('topup') || desc.includes('sepay deposit') || desc.includes('bupay deposit')) {
          transactionType = 'deposit';
        } else {
          transactionType = 'payment';
        }
      }

      return {
        id: tx.id || tx.transactionId || String(Date.now()),
        transactionId: tx.transactionId || tx.id,
        type: transactionType,
        amount: Math.abs(tx.amount || 0),
        description: tx.description || tx.note || '',
        date: tx.date || tx.transactionDate || tx.createdAt || new Date().toISOString(),
        status: tx.status?.toLowerCase() || 'completed',
        method: tx.method || tx.paymentMethod,
      };
    });

    const completed = normalized
      .filter(t => t.status?.toLowerCase() === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let runningAfter = currentBalance || 0;
    return completed.map((tx) => {
      const signedAmount = ['deposit', 'refund'].includes(tx.type) ? tx.amount : -tx.amount;
      const balanceBefore = runningAfter - signedAmount;
      const result = { ...tx, balanceBefore, balanceAfter: runningAfter, signedAmount };
      runningAfter = balanceBefore;
      return result;
    });
  };

  // Fetch wallet data function
  const fetchWallet = async () => {
    const isInitialLoad = isInitialLoadRef.current;
    
    if (isInitialLoad) {
      setLoading(true);
      setError(null);
    }
    
    // Get userId from localStorage or context
    const user = localStorage.getItem('user');
    let userId = '';
    try {
      userId = user ? JSON.parse(user).id : 'demo-user';
    } catch {
      userId = 'demo-user';
    }

    try {
      const res = await apiService.getUserWallet(userId);
      if (res.success && res.data) {
        const walletBalance = res.data.walletBalance ?? res.data.balance ?? 0;
        setBalance(walletBalance);
        const completedTransactions = mapAndAnnotateTransactions(res.data.transactions || [], walletBalance);
        setTransactions(completedTransactions);
        setError(null);
      } else {
        if (isInitialLoad) {
          setError(res.error || 'Failed to load wallet info');
        }
      }
    } catch (err) {
      if (isInitialLoad) {
        setError('Failed to load wallet info');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    }
  };

  // Auto-refresh wallet data every 5 seconds
  useAutoRefresh({
    fetchData: fetchWallet,
    interval: 5000,
    enabled: true,
    fetchOnMount: true
  });

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
      case 'payment':
      case 'withdrawal':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'refund':
        return <Wallet className="h-5 w-5 text-purple-500" />;
      default:
        return <Wallet className="h-5 w-5 text-primary" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-green-600';
      case 'payment':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
      const walletBalance = res.data.walletBalance ?? res.data.balance ?? 0;
      setBalance(walletBalance);
      const completedTransactions = mapAndAnnotateTransactions(res.data.transactions || [], walletBalance);
      setTransactions(completedTransactions);
    } else {
      setError(res.error || 'Failed to refresh wallet');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
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
            <div className="text-4xl font-bold text-primary mb-2">
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
            className="p-6 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl border-2 border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-primary-dark">Transaction History</h3>
                <p className="text-sm text-primary-dark">View all transactions</p>
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
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
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
            <>
              <div className="space-y-4">
                {transactions
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((transaction) => (
                    <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Before: {formatCurrency(transaction.balanceBefore)} • After: {formatCurrency(transaction.balanceAfter)}
                          </p>
                        </div>
                      </div>
                      <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'deposit' || transaction.type === 'refund' 
                          ? '+' 
                          : transaction.type === 'payment' || transaction.type === 'withdrawal'
                          ? '-'
                          : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination */}
              {Math.ceil(transactions.length / pageSize) > 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {page} of {Math.ceil(transactions.length / pageSize)}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(Math.ceil(transactions.length / pageSize), p + 1))}
                      disabled={page === Math.ceil(transactions.length / pageSize)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentWallet;

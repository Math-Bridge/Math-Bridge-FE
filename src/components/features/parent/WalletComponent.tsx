import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Minus, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../hooks/useTranslation';
import { apiService } from '../../../services/api';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method?: string;
}

interface WalletData {
  balance: number;
  recentTransactions: Transaction[];
}

const WalletComponent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5; // 5 transactions per page

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        // Get user ID from localStorage
        const userStr = localStorage.getItem('user');
        const userId = userStr ? JSON.parse(userStr).id : null;

        if (!userId) {
          console.error('User ID not found');
          setLoading(false);
          return;
        }

        const response = await apiService.getUserWallet(userId);
        if (response.success && response.data) {
          // Map API response to component interface
          const walletResponse = response.data;
          setWalletData({
            balance: walletResponse.walletBalance || 0,
            recentTransactions: (walletResponse.transactions || [])
              .filter((tx: any) => {
                // Filter out pending transactions - only show completed
                const status = (tx.status || '').toLowerCase();
                return status === 'completed';
              })
              .map((tx: any) => {
              // Determine transaction type - handle both camelCase and PascalCase from backend
              let transactionType = (tx.type || tx.transactionType || '').toLowerCase();
              const desc = (tx.description || tx.note || '').toLowerCase();
              
              // Map backend transaction types to frontend types
              // Backend uses "withdrawal" for contract payments - map to "payment" (deduction)
              if (transactionType === 'withdrawal' || transactionType.includes('withdrawal') || transactionType.includes('deduct')) {
                transactionType = 'payment'; // Contract payments (withdrawal/deduct) should be treated as payment (deduction)
              } else if (transactionType === 'deposit' || transactionType.includes('deposit') || transactionType.includes('top')) {
                transactionType = 'deposit';
              } else if (transactionType === 'refund') {
                transactionType = 'refund';
              } else if (transactionType === 'payment') {
                transactionType = 'payment'; // Keep as payment
              } else {
                // If type is not set or unknown, try to infer from description
                if (desc.includes('payment for contract') || desc.includes('contract payment')) {
                  transactionType = 'payment'; // Contract payment should be treated as payment (deduction)
                } else if (desc.includes('deposit') || desc.includes('top-up') || desc.includes('topup') || desc.includes('sepay deposit') || desc.includes('bupay deposit')) {
                  transactionType = 'deposit';
                } else {
                  transactionType = 'payment'; // Default to payment for contract payments
                }
              }
              
              return {
                id: tx.id || tx.transactionId || String(Date.now()),
                type: transactionType,
                amount: tx.amount || 0,
                description: tx.description || tx.note || '',
                date: tx.date || tx.transactionDate || tx.createdAt || new Date().toISOString(),
                status: tx.status || 'completed',
                method: tx.method || tx.paymentMethod
              };
            })
          });
        } else {
          console.error('Failed to fetch wallet data:', response.error);
          // Set default empty data instead of mock
          setWalletData({
            balance: 0,
            recentTransactions: []
          });
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        setWalletData({
          balance: 0,
          recentTransactions: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const handleDeposit = () => {
    // Navigate to TopUp page instead of showing modal
    navigate('/wallet/topup');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'refund':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600 mt-2">Manage your account balance and transactions</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Current Balance</h2>
              <p className="text-4xl font-bold">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletData.balance)}
              </p>
              <p className="text-blue-100 mt-2">Available for payments</p>
            </div>
            <div className="text-right">
              <button
                onClick={() => navigate('/wallet/topup')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>{t('addFunds')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{t('transactionHistory')}</h2>
          </div>

          {walletData.recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions</h3>
              <p className="text-gray-600 mb-6">You don't have any completed transactions yet</p>
              <button
                onClick={() => navigate('/wallet/topup')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Top Up Now
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {walletData.recentTransactions
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((transaction) => (
                    <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'deposit' ? 'bg-green-100' :
                            transaction.type === 'payment' ? 'bg-blue-100' :
                            transaction.type === 'refund' ? 'bg-purple-100' :
                            'bg-red-100'
                          }`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {new Date(transaction.date).toLocaleDateString('vi-VN')}
                              </span>
                              {transaction.method && (
                                <span className="text-sm text-gray-500">• {transaction.method}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'deposit' || transaction.type === 'refund'
                              ? 'text-green-600'
                              : transaction.type === 'payment' || transaction.type === 'withdrawal'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination */}
              {Math.ceil(walletData.recentTransactions.length / pageSize) > 1 && (
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {page} of {Math.ceil(walletData.recentTransactions.length / pageSize)}
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
                      onClick={() => setPage(p => Math.min(Math.ceil(walletData.recentTransactions.length / pageSize), p + 1))}
                      disabled={page === Math.ceil(walletData.recentTransactions.length / pageSize)}
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

export default WalletComponent;

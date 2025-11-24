import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const userId = userStr ? JSON.parse(userStr).id : null;

        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await apiService.getUserWallet(userId);
        if (response.success && response.data) {
          const walletResponse = response.data;

          const transactions = (walletResponse.transactions || [])
            .filter((tx: any) => (tx.status || '').toLowerCase() === 'completed')
            .map((tx: any) => {
              let type = (tx.type || tx.transactionType || '').toLowerCase();
              const desc = (tx.description || tx.note || '').toLowerCase();

              // Smart mapping logic
              if (type.includes('withdrawal') || type.includes('deduct') || desc.includes('payment for contract') || desc.includes('contract payment')) {
                type = 'payment';
              } else if (type.includes('deposit') || type.includes('top') || desc.includes('deposit') || desc.includes('topup') || desc.includes('top-up')) {
                type = 'deposit';
              } else if (type.includes('refund')) {
                type = 'refund';
              } else {
                type = desc.includes('deposit') || desc.includes('topup') ? 'deposit' : 'payment';
              }

              return {
                id: tx.id || tx.transactionId || String(Date.now() + Math.random()),
                type: type as 'deposit' | 'payment' | 'refund' | 'withdrawal',
                amount: Math.abs(tx.amount || 0),
                description: tx.description || tx.note || 'Wallet Transaction',
                date: tx.date || tx.transactionDate || tx.createdAt || new Date().toISOString(),
                status: 'completed' as const,
                method: tx.method || tx.paymentMethod
              };
            });

          setWalletData({
            balance: walletResponse.walletBalance || 0,
            recentTransactions: transactions
          });
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    return type === 'deposit' || type === 'refund'
      ? <ArrowDownRight className="w-5 h-5" />
      : <ArrowUpRight className="w-5 h-5" />;
  };

  const getTransactionColor = (type: string) => {
    return type === 'deposit' || type === 'refund'
      ? 'text-emerald-600 bg-emerald-50'
      : 'text-rose-600 bg-rose-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(walletData.recentTransactions.length / pageSize);
  const paginatedTxs = walletData.recentTransactions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 justify-center sm:justify-start">
            <Wallet className="w-10 h-10 text-blue-600" />
            My Wallet
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your balance and view transaction history</p>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-1 mb-10 shadow-2xl">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-gray-600 font-medium flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Available Balance
                </p>
                <p className="text-5xl font-bold text-gray-900 mt-3">
                  {formatCurrency(walletData.balance)}
                </p>
                <p className="text-green-600 font-medium mt-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Updated in real-time
                </p>
              </div>

              <button
                onClick={() => navigate('/wallet/topup')}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-5 text-white font-bold text-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  Add Funds
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="w-7 h-7" />
              Transaction History
            </h2>
          </div>

          <div className="p-6">
            {walletData.recentTransactions.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-gray-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-14 h-14 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Transactions Yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Once you top up or make payments, your transactions will appear here.
                </p>
                <button
                  onClick={() => navigate('/wallet/topup')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Top Up Now
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="group bg-gray-50/70 hover:bg-gray-100 rounded-2xl p-5 transition-all hover:shadow-md border border-gray-200/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${getTransactionColor(tx.type)}`}>
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              {tx.description}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(tx.date).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {tx.method && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-blue-600">{tx.method}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-2xl font-bold ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 capitalize">
                            {tx.type === 'deposit' ? 'Top Up' : tx.type === 'payment' ? 'Payment' : tx.type === 'refund' ? 'Refund' : 'Transaction'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, walletData.recentTransactions.length)} of {walletData.recentTransactions.length} transactions
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-5 py-3 rounded-xl border border-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Need help? Contact <span className="text-blue-600 font-medium">support@yourapp.com</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletComponent;
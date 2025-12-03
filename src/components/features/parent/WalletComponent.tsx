import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';

interface Transaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund' | 'withdrawal';
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
  const pageSize = 8;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'payment' | 'refund'>('all');
  const [flowFilter, setFlowFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

              if (type.includes('withdrawal') || type.includes('deduct') || desc.includes('payment for contract') || desc.includes('contract payment')) {
                type = 'payment';
              } else if (type.includes('deposit') || type.includes('top') || desc.includes('deposit') || desc.includes('topup')) {
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

    // Fetch immediately
    fetchWalletData();
    
    // Auto-reload every 5 seconds
    const walletInterval = setInterval(fetchWalletData, 5000);
    
    return () => clearInterval(walletInterval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Lọc giao dịch
  const filteredTransactions = useMemo(() => {
    return walletData.recentTransactions.filter(tx => {
      const txDate = new Date(tx.date);

      // Tìm kiếm theo mô tả
      if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Lọc loại giao dịch
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Lọc theo chiều tiền
      if (flowFilter === 'income' && !['deposit', 'refund'].includes(tx.type)) return false;
      if (flowFilter === 'expense' && !['payment', 'withdrawal'].includes(tx.type)) return false;

      // Lọc theo ngày
      if (dateFrom && txDate < new Date(dateFrom)) return false;
      if (dateTo && txDate > new Date(new Date(dateTo).setHours(23, 59, 59))) return false;

      return true;
    });
  }, [walletData.recentTransactions, searchTerm, typeFilter, flowFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTxs = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setFlowFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilter = searchTerm || typeFilter !== 'all' || flowFilter !== 'all' || dateFrom || dateTo;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

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
                  Available Balance
                </p>
                <p className="text-5xl font-bold text-gray-900 mt-3">
                  {formatCurrency(walletData.balance)}
                </p>
                <p className="text-green-600 font-medium mt-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Updated in real-time
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

        {/* Transaction History + Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="w-7 h-7" /> Transaction History
            </h2>
            {hasActiveFilter && (
              <button onClick={resetFilters} className="text-white hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition">
                <X className="w-4 h-4" /> Clear Filters
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="p-6 bg-gray-50/70 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search description..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Types</option>
                <option value="deposit">Top Up</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
              </select>

              {/* Flow Filter */}
              <select
                value={flowFilter}
                onChange={(e) => { setFlowFilter(e.target.value as any); setPage(1); }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Flows</option>
                <option value="income">Income (+)</option>
                <option value="expense">Expense (-)</option>
              </select>

              {/* Date From */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Date To */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-20">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No transactions found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your filters or clear them</p>
              </div>
            ) : (
              <>
                <table className="w-full hidden md:table">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              ['deposit', 'refund'].includes(tx.type) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {['deposit', 'refund'].includes(tx.type) ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <span className="font-medium">
                              {tx.type === 'deposit' ? 'Top Up' : tx.type === 'payment' ? 'Payment' : 'Refund'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-gray-900">{tx.description}</td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {new Date(tx.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">{tx.method || '-'}</td>
                        <td className={`px-6 py-5 text-right font-bold text-lg ${
                          ['deposit', 'refund'].includes(tx.type) ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {['deposit', 'refund'].includes(tx.type) ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile View */}
                <div className="md:hidden p-6 space-y-4">
                  {paginatedTxs.map((tx) => (
                    <div key={tx.id} className="bg-white rounded-2xl p-5 shadow-sm border">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                            ['deposit', 'refund'].includes(tx.type) ? 'bg-emerald-100' : 'bg-rose-100'
                          }`}>
                            {['deposit', 'refund'].includes(tx.type) ? <ArrowDownRight className="w-6 h-6 text-emerald-600" /> : <ArrowUpRight className="w-6 h-6 text-rose-600" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{tx.description}</p>
                            <p className="text-sm text-gray-500">{tx.type === 'deposit' ? 'Top Up' : tx.type === 'payment' ? 'Payment' : 'Refund'}</p>
                          </div>
                        </div>
                        <p className={`text-xl font-bold ${['deposit', 'refund'].includes(tx.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {['deposit', 'refund'].includes(tx.type) ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(tx.date).toLocaleString()}</p>
                        {tx.method && <p>Method: {tx.method}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-5 border-t bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredTransactions.length)} of {filteredTransactions.length} results
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-100 flex items-center gap-2 font-medium">
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-12 text-gray-500 text-sm">
          Need help? Contact <span className="text-blue-600 font-medium">support@yourapp.com</span>
        </div>
      </div>
    </div>
  );
};

export default WalletComponent;
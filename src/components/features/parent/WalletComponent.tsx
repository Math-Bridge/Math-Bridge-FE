import React, { useState, useMemo } from 'react';
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
  Calendar,
  ArrowDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, getMyWithdrawalRequests, WithdrawalRequest, getMyContractSePayTransactions, SePayTransactionItem } from '../../../services/api';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import { formatDateTime, parseBackendDate } from '../../../utils/dateUtils';

interface Transaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method?: string;
}

type TransactionWithBalance = Transaction & {
  balanceBefore: number;
  balanceAfter: number;
  signedAmount: number;
  isDirectTransaction?: boolean; // Flag for SePay direct transactions that don't affect wallet balance
};

interface WalletData {
  balance: number;
  recentTransactions: TransactionWithBalance[];
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'payment' | 'refund' | 'withdrawal'>('all');
  const [flowFilter, setFlowFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Remove contract ID and other IDs from description
  const cleanDescription = (description: string): string => {
    if (!description) return '';
    
    let cleaned = description
      // Remove "for Contract #UUID" pattern: "Payment for Contract #739AAAFD-95FC-42C8-9F8D-E50688BD7B91"
      .replace(/\s+for\s+[Cc]ontract\s*#\s*[a-fA-F0-9-]{8,}/gi, '')
      // Remove "Contract #UUID" pattern: "Contract #739AAAFD-95FC-42C8-9F8D-E50688BD7B91"
      .replace(/\s+[Cc]ontract\s*#\s*[a-fA-F0-9-]{8,}/gi, '')
      // Remove contract UUID patterns: "contract 544767dd-d236-4891-a5b1-f389b79d545c"
      .replace(/\s+[Cc]ontract\s+[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g, '')
      // Remove contract ID patterns: (Contract ID: xxx), (ContractId: xxx), etc.
      .replace(/\s*\([^)]*(?:[Cc]ontract\s*[Ii][Dd]|ContractId)[^)]*\)/g, '')
      .replace(/\s*-\s*(?:[Cc]ontract\s*[Ii][Dd]|ContractId)\s*:\s*[^\s]+/g, '')
      .replace(/\s*\[\s*(?:[Cc]ontract\s*[Ii][Dd]|ContractId)[^\]]*\s*\]/g, '')
      .replace(/\s*(?:[Cc]ontract\s*[Ii][Dd]|ContractId)\s*:\s*[a-fA-F0-9-]{8,}(?:\s|$)/g, '')
      // Remove generic ID patterns that might include contract IDs
      .replace(/\s*\([^)]*(?:[Ii][Dd]|ContractId|contractId)[^)]*\)/g, '')
      .replace(/\s*-\s*(?:[Ii][Dd]|ContractId|contractId)\s*:\s*[^\s]+/g, '')
      .replace(/\s*\[\s*(?:[Ii][Dd]|ContractId|contractId)[^\]]*\s*\]/g, '')
      .replace(/\s*(?:[Ii][Dd]|ContractId|contractId)\s*:\s*[a-fA-F0-9-]{8,}(?:\s|$)/g, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned;
  };

  const mapTransactionsWithBalances = (
    rawTxs: any[],
    currentBalance: number
  ): TransactionWithBalance[] => {
    const normalized = (rawTxs || [])
      .filter((tx: any) => (tx.status || '').toLowerCase() === 'completed')
      .map((tx: any) => {
        let type = (tx.type || tx.transactionType || '').toLowerCase();
        const desc = (tx.description || tx.note || '').toLowerCase();

        // Check if it's a withdrawal request (rút tiền về ngân hàng)
        if (desc.includes('withdrawal to') || (type.includes('withdrawal') && !desc.includes('payment for contract') && !desc.includes('contract payment'))) {
          type = 'withdrawal';
        } 
        // Check if it's a contract payment (thanh toán hợp đồng)
        else if (desc.includes('payment for contract') || desc.includes('contract payment') || (type.includes('deduct') && desc.includes('contract'))) {
          type = 'payment';
        } 
        // Check if it's a deposit/topup
        else if (type.includes('deposit') || type.includes('top') || desc.includes('deposit') || desc.includes('topup')) {
          type = 'deposit';
        } 
        // Check if it's a refund
        else if (type.includes('refund')) {
          type = 'refund';
        } 
        // Default: infer from description
        else {
          type = desc.includes('deposit') || desc.includes('topup') ? 'deposit' : 'payment';
        }

        const rawDescription = tx.description || tx.note || 'Wallet Transaction';
        return {
          id: tx.id || tx.transactionId || String(Date.now() + Math.random()),
          type: type as 'deposit' | 'payment' | 'refund' | 'withdrawal',
          amount: Math.abs(tx.amount || 0),
          description: cleanDescription(rawDescription),
          date: tx.date || tx.transactionDate || tx.createdAt || new Date().toISOString(),
          status: 'completed' as const,
          method: tx.method || tx.paymentMethod
        };
      })
      .sort((a, b) => {
        const dateA = parseBackendDate(a.date);
        const dateB = parseBackendDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

    let runningAfter = currentBalance || 0;
    return normalized.map((tx) => {
      const signedAmount = ['deposit', 'refund'].includes(tx.type) ? tx.amount : -tx.amount;
      const balanceBefore = runningAfter - signedAmount;
      const result = { ...tx, balanceBefore, balanceAfter: runningAfter, signedAmount };
      runningAfter = balanceBefore;
      return result;
    });
  };

  // Fetch wallet data function
  const fetchWalletData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).id : null;

      if (!userId) {
        setLoading(false);
        return;
      }

      // Fetch wallet transactions, withdrawal requests, and SePay direct transactions
      const [walletRes, withdrawalRes, sepayRes] = await Promise.all([
        apiService.getUserWallet(userId),
        getMyWithdrawalRequests(),
        getMyContractSePayTransactions()
      ]);

      let allTransactions: TransactionWithBalance[] = [];

      // Process wallet transactions
      if (walletRes.success && walletRes.data) {
        const walletResponse = walletRes.data;
        const walletBalance = walletResponse.walletBalance ?? walletResponse.balance ?? 0;
        const walletTransactions = mapTransactionsWithBalances(walletResponse.transactions || [], walletBalance);
        allTransactions = [...allTransactions, ...walletTransactions];
      }

      // Process withdrawal requests
      if (withdrawalRes.success && withdrawalRes.data) {
        const withdrawalTransactions: TransactionWithBalance[] = withdrawalRes.data
          .filter((wr: WithdrawalRequest) => wr.status?.toLowerCase() === 'completed')
          .map((wr: WithdrawalRequest) => {
            const withdrawalAmount = wr.amount || 0;
            return {
              id: wr.id,
              type: 'withdrawal' as const,
              amount: withdrawalAmount,
              description: `Withdrawal to ${wr.bankName} - ${wr.bankAccountNumber}`,
              date: wr.processedDate || wr.createdDate || new Date().toISOString(),
              status: 'completed' as const,
              method: 'Bank Transfer',
              balanceBefore: 0, // Will be recalculated
              balanceAfter: 0, // Will be recalculated
              signedAmount: -withdrawalAmount
            };
          });
        allTransactions = [...allTransactions, ...withdrawalTransactions];
      }

      // Process SePay direct transactions
      if (sepayRes.success && sepayRes.data?.transactions) {
        const sepayTransactions: TransactionWithBalance[] = sepayRes.data.transactions.map((tx: SePayTransactionItem) => {
          // Determine transaction type: if has ContractId, it's a payment (direct contract payment)
          // Otherwise, check transferType: "IN" = deposit (top up), "OUT" = payment
          const hasContract = !!tx.contractId;
          const isPayment = hasContract || tx.transferType?.toUpperCase() === 'OUT';
          const type = isPayment ? 'payment' : 'deposit';
          const amount = Math.abs(tx.transferAmount || 0);
          
          // Build description with contract info if available
          let description = tx.description || tx.content || tx.code || 'SePay Transaction';
          
          // For direct contract payments, use orderReference/code as main identifier
          if (tx.orderReference || tx.code) {
            const ref = tx.orderReference || tx.code;
            description = ref;
            if (tx.childName && tx.packageName) {
              description = `${ref} - ${tx.childName} (${tx.packageName})`;
            } else if (tx.childName) {
              description = `${ref} - ${tx.childName}`;
            } else if (tx.packageName) {
              description = `${ref} - ${tx.packageName}`;
            }
          } else if (tx.childName && tx.packageName) {
            description = `${description} - ${tx.childName} (${tx.packageName})`;
          } else if (tx.childName) {
            description = `${description} - ${tx.childName}`;
          } else if (tx.packageName) {
            description = `${description} - ${tx.packageName}`;
          }
          
          // Add gateway info if available
          if (tx.gateway) {
            description = `${description} [${tx.gateway}]`;
          }

          return {
            id: tx.sepayTransactionId,
            type: type as 'deposit' | 'payment',
            amount: amount,
            description: description,
            date: tx.transactionDate || tx.createdAt || new Date().toISOString(),
            status: 'completed' as const,
            method: 'SePay Direct',
            balanceBefore: 0, // Will be recalculated separately for direct transactions
            balanceAfter: 0, // Will be recalculated separately for direct transactions
            signedAmount: isPayment ? -amount : amount, // Payment is negative, deposit is positive
            isDirectTransaction: true // Flag to identify direct SePay transactions
          };
        });
        allTransactions = [...allTransactions, ...sepayTransactions];
      }

      // Separate direct transactions from wallet transactions
      const walletTransactions = allTransactions.filter(tx => !tx.isDirectTransaction);
      const directTransactions = allTransactions.filter(tx => tx.isDirectTransaction);

      // Sort wallet transactions by date (newest first)
      walletTransactions.sort((a, b) => {
        const dateA = parseBackendDate(a.date);
        const dateB = parseBackendDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

      // Sort direct transactions by date (newest first)
      directTransactions.sort((a, b) => {
        const dateA = parseBackendDate(a.date);
        const dateB = parseBackendDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

      // Calculate balances for wallet transactions (these affect wallet balance)
      const walletBalance = walletRes.success && walletRes.data 
        ? Math.max(0, walletRes.data.walletBalance ?? walletRes.data.balance ?? 0) // Ensure non-negative
        : 0;
      
      let runningAfter = walletBalance;
      const walletTransactionsWithBalances = walletTransactions.map((tx) => {
        const signedAmount = ['deposit', 'refund'].includes(tx.type) ? tx.amount : -tx.amount;
        const balanceBefore = Math.max(0, runningAfter - signedAmount); // Ensure non-negative
        const balanceAfter = Math.max(0, runningAfter); // Ensure non-negative
        const result = { ...tx, balanceBefore, balanceAfter, signedAmount };
        runningAfter = balanceBefore;
        return result;
      });

      // Calculate balances for direct transactions separately
      // Direct transactions don't affect wallet balance, so we calculate them independently
      // For direct contract payments, balance should not be negative
      // Calculate backward from newest to oldest
      let directRunningAfter = 0; // Start from 0
      const directTransactionsWithBalances = directTransactions.map((tx) => {
        // For direct payments: they are payments made, balance represents cumulative payments
        const paymentAmount = tx.amount;
        const balanceAfter = Math.max(0, directRunningAfter); // Ensure non-negative
        const balanceBefore = Math.max(0, balanceAfter + paymentAmount); // Before payment = after + payment amount
        const signedAmount = -paymentAmount; // Payment is negative (money out)
        const result = { ...tx, balanceBefore, balanceAfter, signedAmount };
        directRunningAfter = balanceBefore; // Move to previous transaction
        return result;
      });

      // Merge all transactions and sort by date again
      const transactionsWithBalances = [...walletTransactionsWithBalances, ...directTransactionsWithBalances];
      transactionsWithBalances.sort((a, b) => {
        const dateA = parseBackendDate(a.date);
        const dateB = parseBackendDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

      setWalletData({
        balance: walletBalance,
        recentTransactions: transactionsWithBalances
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 seconds (like before)
  useAutoRefresh({
    fetchData: fetchWalletData,
    interval: 5000,
    enabled: true,
    fetchOnMount: true
  });

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
      const txDate = parseBackendDate(tx.date);
      if (!txDate) return false;

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

      // Lọc theo ngày - so sánh date part để tránh vấn đề timezone
      if (dateFrom) {
        const txDateStr = txDate.toISOString().split('T')[0];
        if (txDateStr < dateFrom) return false;
      }
      if (dateTo) {
        const txDateStr = txDate.toISOString().split('T')[0];
        if (txDateStr > dateTo) return false;
      }

      return true;
    });
  }, [walletData.recentTransactions, searchTerm, typeFilter, flowFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTxs = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  // Calculate total amount for filtered transactions
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => {
      const signedAmount = ['deposit', 'refund'].includes(tx.type) ? tx.amount : -tx.amount;
      return sum + signedAmount;
    }, 0);
  }, [filteredTransactions]);

  // Calculate income and expense totals separately
  const incomeTotal = useMemo(() => {
    return filteredTransactions
      .filter(tx => ['deposit', 'refund'].includes(tx.type))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  const expenseTotal = useMemo(() => {
    return filteredTransactions
      .filter(tx => ['payment', 'withdrawal'].includes(tx.type))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

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
      <div className="min-h-screen bg-background-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background-cream">
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">

        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 justify-center sm:justify-start">
            <Wallet className="w-10 h-10 text-primary" />
            My Wallet
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your balance and view transaction history</p>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-primary p-1 mb-10 shadow-2xl">
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
              <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/wallet/topup')}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-8 py-5 text-white font-bold text-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  Add Funds
                </span>
              </button>
                <button
                  onClick={() => navigate('/wallet/withdrawal/request')}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-5 text-white font-bold text-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <ArrowDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                    Withdraw
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History + Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-6 flex items-center justify-between">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search description..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="all">All Types</option>
                <option value="deposit">Top Up</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
                <option value="withdrawal">Withdrawal</option>
              </select>

              {/* Flow Filter */}
              <select
                value={flowFilter}
                onChange={(e) => { setFlowFilter(e.target.value as any); setPage(1); }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Date To */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Total Summary */}
            {hasActiveFilter && filteredTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Filtered Total:</span>
                    <span className={`text-lg font-bold ${filteredTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {filteredTotal >= 0 ? '+' : ''}{formatCurrency(Math.abs(filteredTotal))}
                    </span>
                  </div>
                  {typeFilter === 'all' && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Income:</span>
                        <span className="text-emerald-600 font-semibold">+{formatCurrency(incomeTotal)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Expense:</span>
                        <span className="text-rose-600 font-semibold">-{formatCurrency(expenseTotal)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="text-gray-900 font-semibold">{filteredTransactions.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-20">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">No transactions found</h3>
                <p className="text-gray-600 mt-2">Try adjusting your filters or clear them</p>
              </div>
            ) : (
              <>
                <table className="w-full hidden md:table">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-200">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-200">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-200">Date & Time</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase border-r border-gray-200">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 border-r border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              ['deposit', 'refund'].includes(tx.type) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {['deposit', 'refund'].includes(tx.type) ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <span className="font-medium">
                              {tx.type === 'deposit' ? 'Top Up' : tx.type === 'payment' ? 'Payment' : tx.type === 'refund' ? 'Refund' : 'Withdrawal'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-gray-900 border-r border-gray-200">{tx.description}</td>
                        <td className="px-6 py-5 text-sm text-gray-600 border-r border-gray-200">
                          {formatDateTime(tx.date, { 
                            includeTime: true, 
                            includeDate: true, 
                            timeFormat: '24h',
                            dateFormat: 'numeric'
                          })}
                        </td>
                        <td className={`px-6 py-5 text-right font-bold text-lg border-r border-gray-200 ${
                          ['deposit', 'refund'].includes(tx.type) ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {['deposit', 'refund'].includes(tx.type) ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-5 text-right text-sm text-gray-600 leading-tight">
                          {tx.isDirectTransaction ? (
                            <span className="text-gray-400 italic">N/A</span>
                          ) : (
                            <>
                              <div>Before: {formatCurrency(tx.balanceBefore)}</div>
                              <div>After: {formatCurrency(tx.balanceAfter)}</div>
                            </>
                          )}
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
                            <p className="text-sm text-gray-500">{tx.type === 'deposit' ? 'Top Up' : tx.type === 'payment' ? 'Payment' : tx.type === 'refund' ? 'Refund' : 'Withdrawal'}</p>
                          </div>
                        </div>
                        <p className={`text-xl font-bold ${['deposit', 'refund'].includes(tx.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {['deposit', 'refund'].includes(tx.type) ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> 
                          {formatDateTime(tx.date, { 
                            includeTime: true, 
                            includeDate: true, 
                            timeFormat: '24h',
                            dateFormat: 'numeric'
                          })}
                        </p>
                        {!tx.isDirectTransaction && (
                          <>
                            <p>Before: {formatCurrency(tx.balanceBefore)}</p>
                            <p>After: {formatCurrency(tx.balanceAfter)}</p>
                          </>
                        )}
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
                        className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-colors">
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* <div className="text-center mt-12 text-gray-500 text-sm">
          Need help? Contact <span className="text-primary font-medium">support@yourapp.com</span>
        </div> */}
      </div>
    </div>
  );
};

export default WalletComponent;
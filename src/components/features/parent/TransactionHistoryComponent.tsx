import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Filter,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getWalletTransactions,
  WalletTransaction,
  apiService,
  getMyWithdrawalRequests,
  WithdrawalRequest,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface CombinedTransaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
  status: string;
  method?: string;
  transactionId?: string;
  isWithdrawal?: boolean;
  bankName?: string;
  bankAccountNumber?: string;
  bankHolderName?: string;
}

const TransactionHistoryComponent: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('completed'); // Default to completed only
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5; // 5 transactions per page

  // Remove contract ID and other IDs from description
  const cleanDescription = (description: string): string => {
    if (!description) return '';
    
    let cleaned = description
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

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, searchTerm]); // Removed statusFilter since it's always 'completed'

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).id : '';

      if (!userId) {
        showError('User information not found');
        setLoading(false);
        return;
      }

      // Fetch both wallet transactions and withdrawal requests
      const [walletRes, withdrawalRes] = await Promise.all([
        apiService.getUserWallet(userId),
        getMyWithdrawalRequests()
      ]);

      let allCombinedTransactions: CombinedTransaction[] = [];

      // Process wallet transactions
      if (walletRes.success && walletRes.data) {
        let walletTransactions = walletRes.data.transactions || [];
        
        // Map to CombinedTransaction format
        const mappedTransactions = walletTransactions.map((tx: any) => {
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
          
          const rawDescription = tx.description || tx.note || '';
          return {
            id: tx.id || tx.transactionId || String(Date.now()),
            transactionId: tx.transactionId || tx.id,
            type: transactionType as 'deposit' | 'payment' | 'refund' | 'withdrawal',
            amount: tx.amount || 0,
            description: cleanDescription(rawDescription),
            date: tx.date || tx.transactionDate || tx.createdAt || new Date().toISOString(),
            status: tx.status?.toLowerCase() || 'completed',
            method: tx.method || tx.paymentMethod,
            isWithdrawal: false,
          };
        });

        // Only add completed wallet transactions
        const completedTransactions = mappedTransactions.filter(t => 
          (t.status?.toLowerCase() === 'completed')
        );
        allCombinedTransactions = [...allCombinedTransactions, ...completedTransactions];
      }

      // Process withdrawal requests
      if (withdrawalRes.success && withdrawalRes.data) {
        const withdrawalTransactions: CombinedTransaction[] = withdrawalRes.data.map((wr: WithdrawalRequest) => ({
          id: wr.id,
          type: 'withdrawal' as const,
          amount: wr.amount,
          description: `Withdrawal to ${wr.bankName} - ${wr.bankAccountNumber}`,
          date: wr.processedDate || wr.createdDate,
          status: wr.status.toLowerCase(),
          method: 'Bank Transfer',
          isWithdrawal: true,
          bankName: wr.bankName,
          bankAccountNumber: wr.bankAccountNumber,
          bankHolderName: wr.bankHolderName,
        }));
        allCombinedTransactions = [...allCombinedTransactions, ...withdrawalTransactions];
      }

      // Sort by date (newest first)
      allCombinedTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Apply type filter if not 'all'
      let filtered = allCombinedTransactions;
      if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
      }

      // Apply search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(t =>
          t.description.toLowerCase().includes(term) ||
          t.id.toLowerCase().includes(term) ||
          t.transactionId?.toLowerCase().includes(term) ||
          t.bankName?.toLowerCase().includes(term) ||
          t.bankAccountNumber?.toLowerCase().includes(term)
        );
      }

      // Pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTransactions = filtered.slice(startIndex, endIndex);
      
      setTransactions(paginatedTransactions);
      setTotalPages(Math.ceil(filtered.length / pageSize));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showError('Failed to load transaction history');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'withdrawal':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-primary" />;
      case 'refund':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'payment':
        return 'Payment';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  // Transactions are already filtered to completed only in fetchTransactions
  // Only apply search term filter if needed (already done in fetchTransactions)
  const filteredTransactions = transactions;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 py-8">
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
        <button
          onClick={() => navigate('/wallet')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-2">View all transactions in your wallet</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page when search changes
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Status filter - Show all statuses for withdrawal requests, completed for wallet transactions */}
            <div className="relative">
              <div className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <span>Status: All (Wallet: Completed, Withdrawals: All)</span>
              </div>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
            <button
              onClick={fetchTransactions}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || typeFilter !== 'all'
                  ? 'No completed transactions match your filters. Try adjusting your search or type filter.'
                  : "You don't have any completed transactions yet"}
              </p>
              {!searchTerm && typeFilter === 'all' && (
                <button
                  onClick={() => navigate('/wallet/topup')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Top Up Now
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          transaction.type === 'deposit' ? 'bg-green-100' :
                          transaction.type === 'payment' ? 'bg-primary/20' :
                          transaction.type === 'refund' ? 'bg-purple-100' :
                          'bg-red-100'
                        }`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {transaction.description || getTypeLabel(transaction.type)}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getStatusLabel(transaction.status)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatDate(transaction.date)}</span>
                            {transaction.method && (
                              <span>• {transaction.method}</span>
                            )}
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {getTypeLabel(transaction.type)}
                            </span>
                          </div>
                          {transaction.isWithdrawal && transaction.bankName && (
                            <div className="mt-2 text-xs text-gray-500">
                              <span>Bank: {transaction.bankName}</span>
                              {transaction.bankHolderName && (
                                <span className="ml-2">• Holder: {transaction.bankHolderName}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          transaction.type === 'deposit' || transaction.type === 'refund'
                            ? 'text-green-600'
                            : transaction.type === 'payment' || transaction.type === 'withdrawal'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'refund' 
                            ? '+' 
                            : transaction.type === 'payment' || transaction.type === 'withdrawal'
                            ? '-'
                            : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {page} / {totalPages}
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
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
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

export default TransactionHistoryComponent;



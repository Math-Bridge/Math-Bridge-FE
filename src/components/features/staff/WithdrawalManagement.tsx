import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RefreshCw,
  Wallet,
  User,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  Building2,
  CreditCard,
  Clock,
  ArrowLeft,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getPendingWithdrawalRequests,
  processWithdrawalRequest,
  WithdrawalRequest,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { formatDateTime } from '../../../utils/dateUtils';

interface WithdrawalManagementProps {
  hideBackButton?: boolean;
}

const WithdrawalManagement: React.FC<WithdrawalManagementProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Processed' | 'Rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const result = await getPendingWithdrawalRequests();
      if (result.success && result.data) {
        // Sort by created date (newest first)
        const sorted = [...result.data].sort((a, b) => {
          const dateA = new Date(a.createdDate).getTime();
          const dateB = new Date(b.createdDate).getTime();
          return dateB - dateA;
        });
        setRequests(sorted);
      } else {
        setRequests([]);
        if (result.error) {
          showError(result.error);
        }
      }
    } catch (error: any) {
      console.error('Error fetching withdrawal requests:', error);
      showError('Failed to load withdrawal requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.bankHolderName?.toLowerCase().includes(term) ||
          req.bankAccountNumber?.includes(term) ||
          req.bankName?.toLowerCase().includes(term) ||
          req.amount?.toString().includes(term) ||
          req.id?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleProcessClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowConfirmModal(true);
  };

  const handleConfirmProcess = async () => {
    if (!selectedRequestId) return;

    setShowConfirmModal(false);
    
    try {
      setProcessingId(selectedRequestId);
      const result = await processWithdrawalRequest(selectedRequestId);
      if (result.success && result.data) {
        showSuccess('Withdrawal request processed successfully');
        // Update the request in the list
        setRequests((prev) =>
          prev.map((req) => (req.id === selectedRequestId ? result.data! : req))
        );
      } else {
        showError(result.error || 'Failed to process withdrawal request');
      }
    } catch (error: any) {
      console.error('Error processing withdrawal request:', error);
      showError(error?.message || 'Failed to process withdrawal request');
    } finally {
      setProcessingId(null);
      setSelectedRequestId(null);
    }
  };

  const handleCancelProcess = () => {
    setShowConfirmModal(false);
    setSelectedRequestId(null);
  };

  // Use formatDateTime from dateUtils for proper timezone handling
  const formatDate = (dateStr: string | undefined): string => {
    return formatDateTime(dateStr, {
      includeTime: true,
      includeDate: true,
      timeFormat: '24h',
      dateFormat: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Processed':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Processed</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
            <XCircle className="w-4 h-4" />
            <span>Rejected</span>
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
            <Clock className="w-4 h-4" />
            <span>Pending</span>
          </span>
        );
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {!hideBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Back</span>
            </button>
          )}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Wallet className="w-8 h-8 text-primary" />
                <span>Withdrawal Request Management</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and process parent withdrawal requests
              </p>
            </div>
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, account number, bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Processed">Processed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {requests.filter((r) => r.status === 'Pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Processed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {requests.filter((r) => r.status === 'Processed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading withdrawal requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No withdrawal requests found
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'There are no withdrawal requests at the moment'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary to-primary-dark text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold border-r border-white/20">Request ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold border-r border-white/20">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold border-r border-white/20">Bank Info</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold border-r border-white/20">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold border-r border-white/20">Created Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 border-r border-gray-200">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono text-gray-600">
                              {request.id.substring(0, 8)}...
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(request.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {request.bankName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {request.bankAccountNumber}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {request.bankHolderName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200">{getStatusBadge(request.status)}</td>
                        <td className="px-6 py-4 border-r border-gray-200">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDate(request.createdDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {request.status === 'Pending' && (
                            <button
                              onClick={() => handleProcessClick(request.id)}
                              disabled={processingId === request.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {processingId === request.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Process</span>
                                </>
                              )}
                            </button>
                          )}
                          {request.status !== 'Pending' && (
                            <span className="text-sm text-gray-500">
                              {request.processedDate
                                ? `Processed: ${formatDate(request.processedDate)}`
                                : 'N/A'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of{' '}
                    {filteredRequests.length} requests
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Confirmation Modal */}
      {showConfirmModal && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCancelProcess}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Processing</h3>
                </div>
                <button
                  onClick={handleCancelProcess}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to process this withdrawal request? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancelProcess}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmProcess}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>OK</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default WithdrawalManagement;


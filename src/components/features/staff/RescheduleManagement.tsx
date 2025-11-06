import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getRescheduleRequests,
  RescheduleRequest,
  approveRescheduleRequest,
  rejectRescheduleRequest,
  ApproveRescheduleRequest,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface RescheduleManagementProps {
  hideBackButton?: boolean;
}

const RescheduleManagement: React.FC<RescheduleManagementProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const result = await getRescheduleRequests();
      if (result.success && result.data) {
        setRequests(result.data);
        // Show info if no data (backend endpoint not implemented)
        if (result.data.length === 0) {
          console.info('No reschedule requests found. Backend GET endpoint may not be implemented yet.');
        }
      } else {
        // Don't show error if it's just empty result
        const errorMsg = result.error as string | null | undefined;
        if (errorMsg && typeof errorMsg === 'string' && errorMsg.indexOf('not implemented') === -1) {
          showError(errorMsg || 'Failed to load reschedule requests');
        }
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Don't show error toast - backend endpoint may not exist
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.parentName?.toLowerCase().includes(term) ||
        r.childName?.toLowerCase().includes(term) ||
        r.requestId.toLowerCase().includes(term)
      );
    }

    setFilteredRequests(filtered);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const handleApprove = async (data: ApproveRescheduleRequest) => {
    if (!selectedRequest) return;

    try {
      const result = await approveRescheduleRequest(selectedRequest.requestId, data);
      if (result.success) {
        showSuccess('Reschedule request approved successfully');
        setShowApproveModal(false);
        setSelectedRequest(null);
        fetchRequests();
      } else {
        showError(result.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showError('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    try {
      const result = await rejectRescheduleRequest(selectedRequest.requestId, {
        reason: rejectReason,
      });
      if (result.success) {
        showSuccess('Reschedule request rejected');
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectReason('');
        fetchRequests();
      } else {
        showError(result.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showError('Failed to reject request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reschedule requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {!hideBackButton && (
            <button
              onClick={() => navigate('/staff')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Reschedule Requests</h1>
          <p className="text-gray-600 mt-2">Review and manage reschedule requests</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by parent name, child name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {paginatedRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reschedule Requests</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No reschedule requests at the moment'}
              </p>
            </div>
          ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paginatedRequests.map((request) => (
              <div
                key={request.requestId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900 truncate pr-2">
                      {request.parentName}
                      </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-gray-600 text-sm">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Child:</span>
                        <span className="truncate">{request.childName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Date:</span>
                        <span>{new Date(request.requestedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 text-sm">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Time:</span>
                        <span className="truncate">{request.requestedTimeSlot}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 text-sm">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Created:</span>
                        <span>{new Date(request.createdDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4 flex-1">
                      <p className="text-xs font-medium text-gray-700 mb-1">Reason:</p>
                      <p className="text-xs text-gray-600 line-clamp-3">{request.reason}</p>
                    </div>

                    {request.requestedTutorName && (
                      <div className="flex items-center space-x-2 text-gray-600 text-sm mb-4">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Tutor:</span>
                        <span className="truncate">{request.requestedTutorName}</span>
                      </div>
                    )}

                  {request.status === 'pending' && (
                    <div className="flex flex-col space-y-2 mt-auto pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowApproveModal(true);
                        }}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      if (!showPage) {
                        // Show ellipsis
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 min-w-[2.5rem] rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Approve Reschedule Request</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Approve the reschedule request for {selectedRequest.childName}?
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Date (optional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes about this approval..."
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove({})}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Reject Reschedule Request</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this request:
              </p>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RescheduleManagement;








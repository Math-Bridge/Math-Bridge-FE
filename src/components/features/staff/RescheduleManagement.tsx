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
  getAvailableSubTutors,
  AvailableSubTutor,
  cancelRescheduleSession,
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
  
  // Approve modal states
  const [approveNote, setApproveNote] = useState('');
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [availableTutors, setAvailableTutors] = useState<AvailableSubTutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  
  // Cancel session states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Helper functions for formatting
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/A';
    try {
      // Handle DateOnly format (YYYY-MM-DD) or ISO string
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | undefined): string => {
    if (!timeStr) return 'N/A';
    try {
      // Handle TimeOnly format (HH:mm:ss or HH:mm) or DateTime ISO string
      if (timeStr.includes('T')) {
        // DateTime ISO string
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr;
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else {
        // TimeOnly format (HH:mm:ss or HH:mm)
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          return `${parts[0]}:${parts[1]}`;
        }
        return timeStr;
      }
    } catch {
      return timeStr;
    }
  };

  const formatTimeRange = (startTime: string | undefined, endTime: string | undefined): string => {
    const start = formatTime(startTime);
    const end = formatTime(endTime);
    if (start === 'N/A' && end === 'N/A') return 'N/A';
    if (start === 'N/A') return end;
    if (end === 'N/A') return start;
    return `${start} - ${end}`;
  };

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

  const handleOpenApproveModal = async (request: RescheduleRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
    setSelectedTutorId('');
    setApproveNote('');
    setAvailableTutors([]);
    
    // Fetch available sub-tutors for this request
    if (request.requestId) {
      try {
        setLoadingTutors(true);
        const result = await getAvailableSubTutors(request.requestId);
        if (result.success && result.data) {
          setAvailableTutors(result.data.availableTutors || []);
        }
      } catch (error) {
        console.error('Error fetching available tutors:', error);
        // Don't show error - just continue without tutor list
      } finally {
        setLoadingTutors(false);
      }
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      const data: ApproveRescheduleRequest = {
        newTutorId: selectedTutorId || undefined,
        note: approveNote || undefined,
      };
      
      const result = await approveRescheduleRequest(selectedRequest.requestId, data);
      if (result.success) {
        showSuccess('Reschedule request approved successfully');
        setShowApproveModal(false);
        setSelectedRequest(null);
        setSelectedTutorId('');
        setApproveNote('');
        setAvailableTutors([]);
        await fetchRequests();
      } else {
        const errorMsg = result.error || 'Failed to approve request';
        showError(errorMsg);
        console.error('Approve error:', errorMsg);
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to approve request';
      showError(errorMsg);
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
        await fetchRequests();
      } else {
        const errorMsg = result.error || 'Failed to reject request';
        showError(errorMsg);
        console.error('Reject error:', errorMsg);
      }
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to reject request';
      showError(errorMsg);
    }
  };

  const handleCancelSession = async () => {
    if (!selectedRequest) return;
    
    try {
      setCancelLoading(true);
      const result = await cancelRescheduleSession(selectedRequest.bookingId, selectedRequest.requestId);
      if (result.success) {
        showSuccess(result.data?.message || 'Session cancelled successfully. Refund has been added to wallet.');
        setShowCancelModal(false);
        setSelectedRequest(null);
        await fetchRequests();
      } else {
        const errorMsg = result.error || 'Failed to cancel session';
        showError(errorMsg);
        console.error('Cancel session error:', errorMsg);
      }
    } catch (error: any) {
      console.error('Error cancelling session:', error);
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to cancel session';
      showError(errorMsg);
    } finally {
      setCancelLoading(false);
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
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-bold text-gray-900">Reschedule Requests</h1>
          <p className="text-gray-600 mt-2">Review and manage reschedule requests</p>
            </div>
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
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

        {/* Requests Table */}
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Child
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tutor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedRequests.map((request) => (
                      <tr key={request.requestId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.parentName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.childName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(request.requestedDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.startTime && request.endTime 
                              ? formatTimeRange(request.startTime, request.endTime)
                              : request.requestedTimeSlot || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.requestedTutorName || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={request.reason}>
                            {request.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(request.createdDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === 'pending' && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleOpenApproveModal(request)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs flex items-center space-x-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs flex items-center space-x-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Approve Reschedule Request</h2>
              <p className="text-sm text-gray-600 mt-1">
                Arrange a new schedule for {selectedRequest.childName || selectedRequest.parentName}
              </p>
            </div>
            <div className="p-6">
              {/* Original Session Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Original Session</span>
                </p>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span><strong>Date:</strong> {formatDate(selectedRequest.originalSessionDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span><strong>Time:</strong> {formatTimeRange(selectedRequest.originalStartTime, selectedRequest.originalEndTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span><strong>Tutor:</strong> {selectedRequest.originalTutorName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Requested Session Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-blue-700 mb-3 flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Requested New Session</span>
                </p>
                <div className="text-sm text-blue-600 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span><strong>Date:</strong> {formatDate(selectedRequest.requestedDate) || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span><strong>Time:</strong> {
                      selectedRequest.startTime && selectedRequest.endTime 
                        ? formatTimeRange(selectedRequest.startTime, selectedRequest.endTime)
                        : selectedRequest.requestedTimeSlot || 'Not specified'
                    }</span>
                  </div>
                  {selectedRequest.requestedTutorName && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span><strong>Requested Tutor:</strong> {selectedRequest.requestedTutorName}</span>
                    </div>
                  )}
                  {selectedRequest.reason && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-blue-400 mt-0.5" />
                        <div>
                          <strong>Reason:</strong>
                          <p className="mt-1 text-gray-700">{selectedRequest.reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Tutor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Tutor (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    If not selected, will use requested tutor or original tutor
                  </p>
                  {loadingTutors ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading available tutors...</span>
                </div>
                  ) : availableTutors.length > 0 ? (
                  <select
                      value={selectedTutorId}
                      onChange={(e) => setSelectedTutorId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                      <option value="">Use requested/original tutor</option>
                      {availableTutors.map((tutor) => (
                        <option key={tutor.tutorId} value={tutor.tutorId}>
                          {tutor.fullName} {tutor.rating ? `(${tutor.rating.toFixed(1)}⭐)` : ''}
                      </option>
                    ))}
                  </select>
                  ) : (
                    <div className="text-sm text-gray-500 py-2">
                      No substitute tutors available. Will use requested tutor or original tutor.
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
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
                  setSelectedTutorId('');
                  setApproveNote('');
                  setAvailableTutors([]);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {!loadingTutors && availableTutors.length === 0 ? (
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setShowCancelModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  style={{
                    backgroundColor: '#dc3545',
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Session & Refund</span>
                </button>
              ) : (
                <button
                  onClick={handleApprove}
                  disabled={loadingTutors}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  id="approve-reschedule-btn"
                >
                  Approve Request
                </button>
              )}
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

      {/* Cancel Session Modal */}
      {showCancelModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <span>Cancel Session</span>
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-semibold mb-2">⚠️ No Tutors Available</p>
                <p className="text-yellow-700 text-sm">
                  No tutors are available for the requested time slot.
                </p>
              </div>
              <p className="text-gray-700 mb-4">
                No tutors are available for rescheduling. Do you want to cancel this session and receive a refund to the wallet?
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Session Details:</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Parent:</strong> {selectedRequest.parentName}</div>
                  <div><strong>Child:</strong> {selectedRequest.childName || 'N/A'}</div>
                  <div><strong>Requested Date:</strong> {formatDate(selectedRequest.requestedDate)}</div>
                  <div><strong>Time:</strong> {
                    selectedRequest.startTime && selectedRequest.endTime 
                      ? formatTimeRange(selectedRequest.startTime, selectedRequest.endTime)
                      : selectedRequest.requestedTimeSlot || 'N/A'
                  }</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedRequest(null);
                }}
                disabled={cancelLoading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                id="cancel-session-no-btn"
              >
                No, Keep Request
              </button>
              <button
                onClick={handleCancelSession}
                disabled={cancelLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                id="cancel-session-btn"
                style={{
                  backgroundColor: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                {cancelLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Yes, Cancel Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RescheduleManagement;








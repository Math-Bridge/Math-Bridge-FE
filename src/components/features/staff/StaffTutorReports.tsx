import React, { useEffect, useState } from 'react';
import {
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { getAllReports, Report, updateReportStatus } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { removeIdFromUrl } from '../../../utils/urlUtils';

const StaffTutorReports: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'staff' || user?.role === 'admin') {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const result = await getAllReports();
      if (result.success && result.data) {
        const sorted = [...result.data].sort((a, b) => {
          const dateA = new Date(a.createdDate).getTime();
          const dateB = new Date(b.createdDate).getTime();
          return dateB - dateA;
        });
        setReports(sorted);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showError('Failed to load tutor reports');
    } finally {
      setLoadingReports(false);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, status: 'approved' | 'denied') => {
    try {
      setUpdatingStatus(reportId);
      const result = await updateReportStatus(reportId, status);
      
      if (result.success && result.data) {
        // Update the report in the list
        setReports(prevReports =>
          prevReports.map(r => r.reportId === reportId ? result.data! : r)
        );
        showSuccess(`Report ${status === 'approved' ? 'approved' : 'denied'} successfully`);
      } else {
        showError(result.error || `Failed to ${status} report`);
      }
    } catch (error: any) {
      console.error('Error updating report status:', error);
      showError(error?.message || `Failed to ${status} report`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'approved':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span>Approved</span>
          </span>
        );
      case 'denied':
      case 'rejected':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span>Denied</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
            <Clock className="w-4 h-4" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const filteredReports = reports.filter((report) => {
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !term ||
      report.content?.toLowerCase().includes(term) ||
      report.tutor?.fullName?.toLowerCase().includes(term) ||
      report.parent?.fullName?.toLowerCase().includes(term) ||
      report.type?.toLowerCase().includes(term) ||
      report.contractId?.toLowerCase().includes(term);

    const matchesStatus =
      filterStatus === 'all' || (report.status || '').toLowerCase() === filterStatus.toLowerCase();

    const matchesContract =
      !selectedContractId || (report.contractId || '').toLowerCase() === selectedContractId.toLowerCase();

    return matchesSearch && matchesStatus && matchesContract;
  });

  // Build contract options from reports (unique contract IDs)
  const contractOptions = Array.from(
    new Map(
      reports
        .filter((r) => r.contractId)
        .map((r) => [r.contractId, r.contractId]) // key, value
    ).entries()
  ).map(([id]) => id as string);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tutor reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Tutor Reports Management
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
                  Review and manage reports submitted by parents about tutors
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filter & Search</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by content, tutor, parent, type, contract..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedContractId || ''}
                onChange={(e) => setSelectedContractId(e.target.value || null)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white font-medium"
              >
                <option value="">All Contracts</option>
                {contractOptions.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loadingReports ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-16 text-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6" />
            <p className="text-gray-600 text-lg font-medium">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-16 text-center backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reports Found</h3>
            <p className="text-gray-600 text-lg">No tutor reports match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.reportId}
                className="bg-white rounded-2xl shadow-md border border-gray-200/50 overflow-hidden backdrop-blur-sm transform transition-all duration-200 hover:shadow-xl hover:scale-[1.01]"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-200"
                  onClick={() =>
                    setExpandedReportId(expandedReportId === report.reportId ? null : report.reportId)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-bold text-sm sm:text-base text-gray-900">
                            {formatDateTime(report.createdDate)}
                          </span>
                        </div>
                        {getStatusBadge(report.status)}
                        {report.type && (
                          <span className="px-3 py-1.5 bg-purple-50 text-purple-800 rounded-full text-xs font-semibold">
                            {report.type}
                          </span>
                        )}
                        {report.contractId && (
                          <span className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-xs font-mono border border-gray-200">
                            Contract: {report.contractId}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-700 ml-0 sm:ml-1">
                        {report.parent && (
                          <div className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="font-medium">
                              Parent: {report.parent.fullName || report.parent.id}
                            </span>
                          </div>
                        )}
                        {report.tutor && (
                          <div className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                            <User className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium">
                              Tutor: {report.tutor.fullName || report.tutor.id}
                            </span>
                          </div>
                        )}
                        {report.url && (
                          <div className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                            <ExternalLink className="w-4 h-4 text-amber-600" />
                            <span className="font-medium text-amber-700">Has URL</span>
                          </div>
                        )}
                      </div>

                      {report.content && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {report.content}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {expandedReportId === report.reportId ? (
                        <ChevronUp className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedReportId === report.reportId && (
                  <div className="px-6 pb-6 border-t-2 border-gray-100 pt-6 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
                    {report.content && (
                      <div className="mb-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <h4 className="text-base font-bold text-gray-900">Report Content</h4>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {report.content}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {report.parent && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Parent
                          </p>
                          <p className="text-sm text-gray-900 font-medium">
                            {report.parent.fullName || report.parent.id}
                          </p>
                          {report.parent.email && (
                            <p className="text-xs text-gray-600 mt-1 flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{report.parent.email}</span>
                            </p>
                          )}
                        </div>
                      )}
                      {report.tutor && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Tutor
                          </p>
                          <p className="text-sm text-gray-900 font-medium">
                            {report.tutor.fullName || report.tutor.id}
                          </p>
                          {report.tutor.email && (
                            <p className="text-xs text-gray-600 mt-1 flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{report.tutor.email}</span>
                            </p>
                          )}
                        </div>
                      )}
                      {report.createdDate && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Created Date
                          </p>
                          <p className="text-sm text-gray-900 font-medium">
                            {formatDateTime(report.createdDate)}
                          </p>
                        </div>
                      )}
                      {report.url && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm md:col-span-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Related URL
                          </p>
                          <a
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2"
                          >
                            <span>{removeIdFromUrl(report.url)}</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons for Staff - Only show for pending reports */}
                    {(report.status || '').toLowerCase() === 'pending' && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(report.reportId, 'denied');
                            }}
                            disabled={updatingStatus === report.reportId}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                          >
                            {updatingStatus === report.reportId ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                <span>Deny</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(report.reportId, 'approved');
                            }}
                            disabled={updatingStatus === report.reportId}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                          >
                            {updatingStatus === report.reportId ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTutorReports;



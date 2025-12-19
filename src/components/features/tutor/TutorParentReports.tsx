import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react';
import {
  getReportsByTutor,
  createReport,
  Report,
  CreateReportRequest,
  getTutorSessions,
  getContractById,
  Contract,
} from '../../../services/api';
import { apiService } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { removeIdFromUrl } from '../../../utils/urlUtils';

const TutorParentReports: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [contracts, setContracts] = useState<Array<{ contractId: string; childName: string; parentName: string; packageName?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // Create report modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContractIdForReport, setSelectedContractIdForReport] = useState<string>('');
  const [reportContent, setReportContent] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchReports();
      fetchContracts();
    }
  }, [user?.id]);

  // Check if contractId is passed from navigation state
  useEffect(() => {
    const state = location.state as { contractId?: string } | null;
    if (state?.contractId && contracts.length > 0) {
      const contract = contracts.find(c => c.contractId === state.contractId);
      if (contract) {
        setSelectedContractIdForReport(state.contractId);
        setShowCreateModal(true);
        navigate(location.pathname, { replace: true, state: null });
      }
    }
  }, [location.state, contracts, navigate, location.pathname]);

  const fetchReports = async () => {
    if (!user?.id) return;

    try {
      setLoadingReports(true);
      const result = await getReportsByTutor(user.id);
      if (result.success && result.data) {
        // Filter to only show reports created by tutor (type="tutor"), not reports created by parents
        const tutorReports = result.data.filter((report) => 
          (report.type || '').toLowerCase() === 'tutor'
        );
        
        // Sort by date descending (newest first)
        const sorted = [...tutorReports].sort((a, b) => {
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
      showError('Failed to load reports');
    } finally {
      setLoadingReports(false);
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    if (!user?.id) return;

    try {
      // Get contracts from sessions
      const sessionsResult = await getTutorSessions(user.id);
      if (sessionsResult.success && sessionsResult.data) {
        // Extract unique contract IDs
        const contractIds = Array.from(new Set(
          sessionsResult.data
            .map(s => s.contractId)
            .filter(id => id)
        ));

        // Fetch contract details for each unique contract
        const contractPromises = contractIds.map(async (contractId) => {
          try {
            const contractResult = await getContractById(contractId);
            if (contractResult.success && contractResult.data) {
              const contract = contractResult.data as any;
              return {
                contractId: contractId,
                childName: contract.childName || contract.ChildName || '',
                parentName: contract.parentName || contract.ParentName || contract.parent?.fullName || contract.Parent?.FullName || '',
                packageName: contract.packageName || contract.PackageName,
              };
            }
          } catch (error) {
            console.error(`Error fetching contract ${contractId}:`, error);
          }
          return null;
        });

        const contractData = (await Promise.all(contractPromises)).filter(c => c !== null) as Array<{
          contractId: string;
          childName: string;
          parentName: string;
          packageName?: string;
        }>;

        // Filter only active or completed contracts
        const activeContracts = contractData.filter((c) => {
          // We'll keep all contracts for now since we don't have status in the contract data from sessions
          return true;
        });

        setContracts(activeContracts);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleCreateReport = async () => {
    if (!selectedContractIdForReport || !reportContent.trim() || !user?.id) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      // For tutor reports, we don't need to send tutorId or parentId
      // Backend will get tutorId from logged-in user and parentId from contract
      const reportData: CreateReportRequest = {
        contractId: selectedContractIdForReport,
        content: reportContent.trim(),
        url: reportUrl.trim() || undefined,
      };

      const result = await createReport(reportData);
      if (result.success && result.data) {
        showSuccess('Report created successfully');
        setShowCreateModal(false);
        // Reset form
        setSelectedContractIdForReport('');
        setReportContent('');
        setReportUrl('');
        // Refresh reports list
        fetchReports();
      } else {
        showError(result.error || 'Failed to create report');
      }
    } catch (error: any) {
      console.error('Error creating report:', error);
      showError(error?.response?.data?.error || 'Failed to create report');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
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
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            Approved
          </span>
        );
      case 'denied':
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
            Denied
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
            Pending
          </span>
        );
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = !searchTerm || 
      report.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.parent?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
      report.status?.toLowerCase() === filterStatus.toLowerCase();

    const matchesContract = !selectedContractId ||
      report.contractId === selectedContractId;

    return matchesSearch && matchesStatus && matchesContract;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Parent Reports</h2>
            <p className="text-gray-600 mt-1">
              Report issues or concerns about parents
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by content, parent, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedContractId || ''}
              onChange={(e) => setSelectedContractId(e.target.value || null)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Contracts</option>
              {contracts.map((contract) => (
                <option key={contract.contractId} value={contract.contractId}>
                  {contract.childName} - {contract.parentName} {contract.packageName ? `(${contract.packageName})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loadingReports ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-600">
            {reports.length === 0
              ? 'You haven\'t created any reports yet. Create your first report to report issues or concerns about parents.'
              : 'No reports match your search criteria'}
          </p>
          {reports.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Report
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.reportId}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedReportId(expandedReportId === report.reportId ? null : report.reportId)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {formatDate(report.createdDate)}
                        </span>
                        {getStatusBadge(report.status)}
                        {report.type && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            {report.type}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 ml-8">
                        {report.parent && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{report.parent.fullName}</span>
                          </div>
                        )}
                        {report.url && (
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Has URL</span>
                          </div>
                        )}
                      </div>
                      {report.content && (
                        <p className="mt-3 ml-8 text-sm text-gray-600 line-clamp-2">
                          {report.content}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {expandedReportId === report.reportId ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedReportId === report.reportId && (
                  <div className="px-6 pb-6 border-t border-gray-200 pt-6 bg-gray-50">
                    {report.content && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Report Content</h4>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.content}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.parent && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parent</div>
                          <div className="flex items-center space-x-2 text-gray-900">
                            <User className="w-5 h-5 text-purple-500" />
                            <div className="text-sm font-medium">{report.parent.fullName}</div>
                          </div>
                          {report.parent.email && (
                            <p className="text-xs text-gray-600 mt-1">{report.parent.email}</p>
                          )}
                        </div>
                      )}
                      {report.createdDate && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Created Date</div>
                          <div className="flex items-center space-x-2 text-gray-900">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                            <div className="text-sm font-medium">{formatDate(report.createdDate)}</div>
                          </div>
                        </div>
                      )}
                      {report.url && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 md:col-span-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Related URL</div>
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Report</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedContractIdForReport('');
                    setReportContent('');
                    setReportUrl('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Contract <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedContractIdForReport}
                  onChange={(e) => setSelectedContractIdForReport(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Select a contract --</option>
                  {contracts.map((contract) => (
                    <option key={contract.contractId} value={contract.contractId}>
                      {contract.childName} - {contract.parentName} {contract.packageName ? `(${contract.packageName})` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Select a contract to report the parent</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe the issue or concern in detail..."
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Please provide detailed information about the issue or concern</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Link to any relevant documents or evidence</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedContractIdForReport('');
                  setReportContent('');
                  setReportUrl('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                disabled={isCreating || !selectedContractIdForReport || !reportContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Report</span>
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

export default TutorParentReports;














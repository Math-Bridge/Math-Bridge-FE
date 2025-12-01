import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import {
  getDailyReportsByChild,
  getDailyReportsByTutor,
  deleteDailyReport,
  DailyReport,
  getChildrenByParent,
  Child,
  getAllUnits,
  Unit,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

const StaffDailyReports: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOnTrack, setFilterOnTrack] = useState<'all' | 'onTrack' | 'offTrack'>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllReports();
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchReportsByChild();
    } else {
      fetchAllReports();
    }
  }, [selectedChildId]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      // For staff, we can get reports by tutor or by child
      // For simplicity, we'll get all reports by fetching for all children
      // In a real scenario, you might have a staff-specific endpoint
      const result = await getDailyReportsByTutor();
      if (result.success && result.data) {
        const sorted = [...result.data].sort((a, b) => {
          const dateA = new Date(a.createdDate).getTime();
          const dateB = new Date(b.createdDate).getTime();
          return dateB - dateA;
        });
        setReports(sorted);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showError('Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsByChild = async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      const result = await getDailyReportsByChild(selectedChildId);
      if (result.success && result.data) {
        const sorted = [...result.data].sort((a, b) => {
          const dateA = new Date(a.createdDate).getTime();
          const dateB = new Date(b.createdDate).getTime();
          return dateB - dateA;
        });
        setReports(sorted);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showError('Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const result = await getAllUnits();
      if (result.success && result.data) {
        setUnits(result.data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingReportId(reportId);
      const result = await deleteDailyReport(reportId);
      if (result.success) {
        showSuccess('Report deleted successfully');
        if (selectedChildId) {
          await fetchReportsByChild();
        } else {
          await fetchAllReports();
        }
      } else {
        showError(result.error || 'Failed to delete report');
      }
    } catch (error: any) {
      console.error('Error deleting report:', error);
      showError(error?.message || 'Failed to delete report');
    } finally {
      setDeletingReportId(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = !searchTerm ||
      report.unitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tutorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.childName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterOnTrack === 'all' ||
      (filterOnTrack === 'onTrack' && report.onTrack) ||
      (filterOnTrack === 'offTrack' && !report.onTrack);

    const matchesUnit = !selectedUnitId || report.unitId === selectedUnitId;

    return matchesSearch && matchesFilter && matchesUnit;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Reports Management</h1>
            <p className="text-gray-600 mt-2">View and manage all daily reports</p>
          </div>
          <button
            onClick={() => {
              if (selectedChildId) {
                fetchReportsByChild();
              } else {
                fetchAllReports();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by unit, notes, tutor, child..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterOnTrack}
                onChange={(e) => setFilterOnTrack(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Reports</option>
                <option value="onTrack">On Track</option>
                <option value="offTrack">Off Track</option>
              </select>
            </div>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedUnitId || ''}
                onChange={(e) => setSelectedUnitId(e.target.value || null)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Units</option>
                {units
                  .sort((a, b) => a.unitOrder - b.unitOrder)
                  .map((unit) => (
                    <option key={unit.unitId} value={unit.unitId}>
                      {unit.unitName} (Unit {unit.unitOrder})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <select
                value={selectedChildId || ''}
                onChange={(e) => setSelectedChildId(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Children</option>
                {/* In a real scenario, you'd fetch children here */}
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600">
              {reports.length === 0
                ? 'No daily reports available yet'
                : 'No reports match your search criteria'}
            </p>
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
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {formatDate(report.createdDate)}
                        </span>
                        {report.onTrack ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>On Track</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Off Track</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {report.childName && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{report.childName}</span>
                          </div>
                        )}
                        {report.unitName && (
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{report.unitName}</span>
                          </div>
                        )}
                        {report.tutorName && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>Tutor: {report.tutorName}</span>
                          </div>
                        )}
                        {report.haveHomework && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <FileText className="w-4 h-4" />
                            <span>Has Homework</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(report.reportId);
                        }}
                        disabled={deletingReportId === report.reportId}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete report"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {expandedReportId === report.reportId ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedReportId === report.reportId && (
                  <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                    {report.notes && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.notes}</p>
                      </div>
                    )}
                    {report.url && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">URL</h4>
                        <a
                          href={report.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2 break-all"
                        >
                          <span>{report.url}</span>
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Report ID:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">{report.reportId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Child ID:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">{report.childId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tutor ID:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">{report.tutorId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Booking ID:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">{report.bookingId}</span>
                      </div>
                    </div>
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

export default StaffDailyReports;




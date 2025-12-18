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
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  getAllDailyReports,
  deleteDailyReport,
  DailyReport,
  getAllUnits,
  Unit,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { removeIdFromUrl } from '../../../utils/urlUtils';


const StaffDailyReports: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOnTrack, setFilterOnTrack] = useState<'all' | 'onTrack' | 'offTrack'>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAllReports();
    fetchUnits();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      // Fetch all daily reports using the /api/daily-reports endpoint
      const result = await getAllDailyReports();
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
        await fetchAllReports();
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

    const matchesDateFrom = !dateFrom || report.createdDate >= dateFrom;
    const matchesDateTo = !dateTo || report.createdDate <= dateTo;

    return matchesSearch && matchesFilter && matchesUnit && matchesDateFrom && matchesDateTo;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterOnTrack, selectedUnitId, dateFrom, dateTo]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

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
            onClick={fetchAllReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{filteredReports.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Track</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredReports.filter(r => r.onTrack).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Off Track</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredReports.filter(r => !r.onTrack).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Homework</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredReports.filter(r => r.haveHomework).length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From Date"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To Date"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterOnTrack('all');
                  setSelectedUnitId(null);
                  setDateFrom('');
                  setDateTo('');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
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
          <>
            <div className="space-y-4">
              {paginatedReports.map((report) => (
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
                          <span>{removeIdFromUrl(report.url)}</span>
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Session Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start">
                          <User className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 block">Tutor</span>
                            <span className="text-gray-900 font-medium">{report.tutorName || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <User className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 block">Child</span>
                            <span className="text-gray-900 font-medium">{report.childName || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <BookOpen className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 block">Unit</span>
                            <span className="text-gray-900 font-medium">{report.unitName || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 block">Session Date</span>
                            <span className="text-gray-900 font-medium">
                              {report.sessionDate ? formatDate(report.sessionDate) : formatDate(report.createdDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700 font-medium mb-2">Technical Details (IDs)</summary>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 p-3 bg-gray-50 rounded">
                        <div>
                          <span className="text-gray-600 block">Report ID</span>
                          <span className="text-gray-900 font-mono text-xs break-all">{report.reportId}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Child ID</span>
                          <span className="text-gray-900 font-mono text-xs break-all">{report.childId}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Tutor ID</span>
                          <span className="text-gray-900 font-mono text-xs break-all">{report.tutorId}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Booking ID</span>
                          <span className="text-gray-900 font-mono text-xs break-all">{report.bookingId}</span>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
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
                    {(() => {
                      // Show only 5 page numbers
                      const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
                      const endPage = Math.min(startPage + 4, totalPages);
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      return pages.map((page) => (
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
                      ));
                    })()}
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
    </div>
  );
};

export default StaffDailyReports;




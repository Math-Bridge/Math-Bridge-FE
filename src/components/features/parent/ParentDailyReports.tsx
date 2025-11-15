import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import {
  getDailyReportsByChild,
  getChildUnitProgress,
  getLearningCompletionForecast,
  DailyReport,
  ChildUnitProgress,
  LearningCompletionForecast,
  getChildrenByParent,
  Child,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

const ParentDailyReports: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [unitProgress, setUnitProgress] = useState<ChildUnitProgress | null>(null);
  const [forecast, setForecast] = useState<LearningCompletionForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOnTrack, setFilterOnTrack] = useState<'all' | 'onTrack' | 'offTrack'>('all');

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchReports();
      fetchProgress();
      fetchForecast();
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getChildrenByParent(user.id);
      if (result.success && result.data) {
        const mappedChildren = (Array.isArray(result.data) ? result.data : [])
          .filter((child: any) => (child.Status || child.status || 'active') !== 'deleted')
          .map((child: any) => ({
            childId: child.ChildId || child.childId || '',
            fullName: child.FullName || child.fullName || '',
            schoolId: child.SchoolId || child.schoolId || '',
            schoolName: child.SchoolName || child.schoolName || '',
            grade: child.Grade || child.grade || '',
            status: child.Status || child.status || 'active',
          }));
        setChildren(mappedChildren);
        if (mappedChildren.length === 1) {
          setSelectedChildId(mappedChildren[0].childId);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!selectedChildId) return;

    try {
      setLoadingReports(true);
      const result = await getDailyReportsByChild(selectedChildId);
      if (result.success && result.data) {
        // Sort by date descending (newest first)
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
      showError('Failed to load daily reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchProgress = async () => {
    if (!selectedChildId) return;

    try {
      const result = await getChildUnitProgress(selectedChildId);
      if (result.success && result.data) {
        setUnitProgress(result.data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchForecast = async () => {
    if (!selectedChildId) return;

    try {
      const result = await getLearningCompletionForecast(selectedChildId);
      if (result.success && result.data) {
        setForecast(result.data);
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
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
      report.tutorName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterOnTrack === 'all' ||
      (filterOnTrack === 'onTrack' && report.onTrack) ||
      (filterOnTrack === 'offTrack' && !report.onTrack);

    return matchesSearch && matchesFilter;
  });

  const selectedChild = children.find(c => c.childId === selectedChildId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Reports</h1>
          <p className="text-gray-600 mt-2">View learning progress and daily reports for your children</p>
        </div>

        {/* Child Selection */}
        {children.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Child
            </label>
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a child --</option>
              {children.map((child) => (
                <option key={child.childId} value={child.childId}>
                  {child.fullName} {child.grade ? `(Grade ${child.grade})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {!selectedChildId ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Child Selected</h3>
            <p className="text-gray-600">Please select a child to view their daily reports</p>
          </div>
        ) : (
          <>
            {/* Learning Forecast */}
            {forecast && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Learning Forecast</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Starting Unit</p>
                    <p className="font-semibold text-gray-900">{forecast.startingUnitName} (Unit {forecast.startingUnitOrder})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Target Unit</p>
                    <p className="font-semibold text-gray-900">{forecast.lastUnitName} (Unit {forecast.lastUnitOrder})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Completion</p>
                    <p className="font-semibold text-gray-900">{formatDate(forecast.estimatedCompletionDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time to Completion</p>
                    <p className="font-semibold text-gray-900">{forecast.weeksToCompletion} weeks ({forecast.daysToCompletion} days)</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-700 italic">{forecast.message}</p>
              </div>
            )}

            {/* Unit Progress */}
            {unitProgress && unitProgress.unitsProgress.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-6 h-6 text-gray-700" />
                    <h2 className="text-xl font-bold text-gray-900">Unit Progress</h2>
                  </div>
                  <span className="text-sm text-gray-600">Total Reports: {unitProgress.totalReports}</span>
                </div>
                <div className="space-y-3">
                  {unitProgress.unitsProgress.map((unit) => (
                    <div
                      key={unit.unitId}
                      className={`p-4 rounded-lg border ${
                        unit.isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">
                              {unit.unitName} (Unit {unit.unitOrder})
                            </h3>
                            {unit.isCompleted && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Learned {unit.timesLearned} time{unit.timesLearned !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            First: {formatDate(unit.firstLearnedDate)} • Last: {formatDate(unit.lastLearnedDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by unit, notes, tutor..."
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
                    ? 'No daily reports available for this child yet'
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
                            {report.unitName && (
                              <div className="flex items-center space-x-1">
                                <BookOpen className="w-4 h-4" />
                                <span>{report.unitName}</span>
                              </div>
                            )}
                            {report.tutorName && (
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{report.tutorName}</span>
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
                        {expandedReportId === report.reportId ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
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
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Report ID:</span>
                            <span className="ml-2 text-gray-900 font-mono text-xs">{report.reportId}</span>
                          </div>
                          {report.sessionDate && (
                            <div>
                              <span className="text-gray-600">Session Date:</span>
                              <span className="ml-2 text-gray-900">{formatDate(report.sessionDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDailyReports;




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
  Search,
  Filter,
  BarChart3,
  Target,
  Award,
  Sparkles,
  ExternalLink,
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
  getAllUnits,
  Unit,
  getContractsByParent,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { removeIdFromUrl } from '../../../utils/urlUtils';

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
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    fetchChildren();
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchReports();
      fetchProgress();
      fetchForecast();
      
      // Auto-reload reports, progress, and forecast every 60 seconds
      const reportsInterval = setInterval(() => {
        fetchReports();
        fetchProgress();
        fetchForecast();
      }, 60000);
      
      return () => clearInterval(reportsInterval);
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
    if (!selectedChildId || !user?.id) return;

    try {
      // First get contracts for this parent to find the child's active contract
      const contractsResult = await getContractsByParent(user.id);
      if (contractsResult.success && contractsResult.data) {
        // Find an active or completed contract for this child
        const childContract = contractsResult.data.find(
          (c: any) => 
            (c.ChildId || c.childId) === selectedChildId && 
            (['active', 'completed'].includes((c.Status || c.status || '').toLowerCase()))
        );
        
        if (childContract) {
          const contractId = childContract.ContractId || childContract.contractId || childContract.id;
          const result = await getChildUnitProgress(contractId);
          if (result.success && result.data) {
            setUnitProgress(result.data);
          }
        } else {
          // No active/completed contract found
          setUnitProgress(null);
        }
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
      report.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tutorName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterOnTrack === 'all' ||
      (filterOnTrack === 'onTrack' && report.onTrack) ||
      (filterOnTrack === 'offTrack' && !report.onTrack);

    const matchesUnit = !selectedUnitId || report.unitId === selectedUnitId;

    return matchesSearch && matchesFilter && matchesUnit;
  });

  // Calculate statistics
  const totalReports = reports.length;
  const onTrackReports = reports.filter(r => r.onTrack).length;
  const onTrackPercentage = totalReports > 0 ? Math.round((onTrackReports / totalReports) * 100) : 0;
  const completedUnits = unitProgress?.unitsProgress.filter(u => u.isCompleted).length || 0;
  const totalUnits = unitProgress?.unitsProgress.length || 0;
  const completionRate = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Daily Reports
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">Track your child's learning progress and achievements</p>
            </div>
          </div>
        </div>

        {/* Child Selection */}
        {children.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-6 mb-6 backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <label className="block text-sm font-semibold text-gray-800">
                Select Child
              </label>
            </div>
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value || null)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-16 text-center backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Child Selected</h3>
            <p className="text-gray-600 text-lg">Please select a child to view their learning progress and daily reports</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <BarChart3 className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Reports</p>
                <p className="text-3xl font-bold">{totalReports}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-green-100 text-sm font-medium mb-1">On Track</p>
                <p className="text-3xl font-bold">{onTrackPercentage}%</p>
                <p className="text-green-100 text-xs mt-1">{onTrackReports} of {totalReports} reports</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <Target className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-purple-100 text-sm font-medium mb-1">Units Completed</p>
                <p className="text-3xl font-bold">{completionRate}%</p>
                <p className="text-purple-100 text-xs mt-1">{completedUnits} of {totalUnits} units</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <BookOpen className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-orange-100 text-sm font-medium mb-1">Total Units</p>
                <p className="text-3xl font-bold">{totalUnits}</p>
                <p className="text-orange-100 text-xs mt-1">In curriculum</p>
              </div>
            </div>

            {/* Learning Forecast */}
            {forecast && (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-md border-2 border-blue-200/50 p-8 mb-6 backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Learning Forecast</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Starting Unit</p>
                    <p className="text-lg font-bold text-gray-900">{forecast.startingUnitName}</p>
                    <p className="text-sm text-gray-600">Unit {forecast.startingUnitOrder}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Target Unit</p>
                    <p className="text-lg font-bold text-gray-900">{forecast.lastUnitName}</p>
                    <p className="text-sm text-gray-600">Unit {forecast.lastUnitOrder}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estimated Completion</p>
                    <p className="text-lg font-bold text-gray-900">{formatDate(forecast.estimatedCompletionDate)}</p>
                    <p className="text-sm text-gray-600">{forecast.weeksToCompletion} weeks</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Time Remaining</p>
                    <p className="text-lg font-bold text-gray-900">{forecast.daysToCompletion} days</p>
                    <p className="text-sm text-gray-600">Until completion</p>
                  </div>
                </div>
                {forecast.message && (
                  <div className="mt-6 p-4 bg-blue-100/50 rounded-xl border border-blue-200/50">
                    <p className="text-sm text-gray-700 font-medium">{forecast.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Unit Progress */}
            {unitProgress && unitProgress.unitsProgress.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-8 mb-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Unit Progress</h2>
                      <p className="text-sm text-gray-600">Track your child's learning journey</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unitProgress.unitsProgress.map((unit) => (
                    <div
                      key={unit.unitId}
                      className={`p-5 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                        unit.isCompleted
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md'
                          : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">
                              {unit.unitName}
                            </h3>
                            {unit.isCompleted && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-semibold text-green-700">Completed</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="font-medium">Unit {unit.unitOrder}</span>
                            <span className="text-gray-400">•</span>
                            <span>Learned {unit.timesLearned} time{unit.timesLearned !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>First: {formatDate(unit.firstLearnedDate)}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Last: {formatDate(unit.lastLearnedDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    placeholder="Search by unit, notes, tutor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={filterOnTrack}
                    onChange={(e) => setFilterOnTrack(e.target.value as any)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white font-medium"
                  >
                    <option value="all">All Reports</option>
                    <option value="onTrack">On Track</option>
                    <option value="offTrack">Off Track</option>
                  </select>
                </div>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedUnitId || ''}
                    onChange={(e) => setSelectedUnitId(e.target.value || null)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white font-medium"
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
            </div>

            {/* Reports List */}
            {loadingReports ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-16 text-center backdrop-blur-sm">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg font-medium">Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-16 text-center backdrop-blur-sm">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reports Found</h3>
                <p className="text-gray-600 text-lg">
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
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-bold text-lg text-gray-900">
                              {formatDate(report.createdDate)}
                            </span>
                            {report.onTrack ? (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
                                <CheckCircle className="w-4 h-4" />
                                <span>On Track</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
                                <XCircle className="w-4 h-4" />
                                <span>Off Track</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 ml-12">
                            {report.unitName && (
                              <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-100">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                                <span className="font-medium">{report.unitName}</span>
                              </div>
                            )}
                            {report.tutorName && (
                              <div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                <User className="w-4 h-4 text-indigo-600" />
                                <span className="font-medium">{report.tutorName}</span>
                              </div>
                            )}
                            {report.haveHomework && (
                              <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                <FileText className="w-4 h-4 text-amber-600" />
                                <span className="font-medium text-amber-700">Has Homework</span>
                              </div>
                            )}
                          </div>
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
                        {report.notes && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <FileText className="w-5 h-5 text-gray-600" />
                              <h4 className="text-base font-bold text-gray-900">Notes</h4>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{report.notes}</p>
                            </div>
                          </div>
                        )}
                        {report.url && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <FileText className="w-5 h-5 text-gray-600" />
                              <h4 className="text-base font-bold text-gray-900">URL</h4>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
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
                          </div>
                        )}
                        {report.sessionDate && (
                          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Session Date</p>
                            <p className="text-sm text-gray-900 font-medium">{formatDate(report.sessionDate)}</p>
                          </div>
                        )}
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




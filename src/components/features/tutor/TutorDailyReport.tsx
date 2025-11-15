import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  Save,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Search,
} from 'lucide-react';
import {
  getTutorSessions,
  Session,
  getDailyReportsByBooking,
  createDailyReport,
  updateDailyReport,
  DailyReport,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  getContractById,
  getPackageById,
  apiService,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

interface Unit {
  unitId: string;
  unitName: string;
  unitOrder: number;
  curriculumId: string;
}

const TutorDailyReport: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [existingReport, setExistingReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [onTrack, setOnTrack] = useState(true);
  const [haveHomework, setHaveHomework] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [user?.id]);

  useEffect(() => {
    if (selectedSession) {
      fetchExistingReport();
      fetchUnits();
    } else {
      setExistingReport(null);
      resetForm();
    }
  }, [selectedSession]);

  useEffect(() => {
    if (existingReport) {
      setUnitId(existingReport.unitId);
      setOnTrack(existingReport.onTrack);
      setHaveHomework(existingReport.haveHomework);
      setNotes(existingReport.notes || '');
    }
  }, [existingReport]);

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getTutorSessions();
      if (result.success && result.data) {
        // Filter to only show sessions for today
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const filtered = result.data.filter((s) => {
          // Check if session date matches today
          if (!s.sessionDate) return false;
          let sessionDateStr = s.sessionDate;
          if (sessionDateStr.includes('T')) {
            sessionDateStr = sessionDateStr.split('T')[0];
          }
          
          // Only show scheduled or completed sessions for today
          return sessionDateStr === todayStr && 
                 (s.status === 'completed' || s.status === 'scheduled' || s.status === 'processing');
        });
        
        // Sort by start time
        filtered.sort((a, b) => {
          const timeA = a.startTime || '';
          const timeB = b.startTime || '';
          return timeA.localeCompare(timeB);
        });
        
        setSessions(filtered);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingReport = async () => {
    if (!selectedSession?.bookingId) return;

    try {
      setLoadingReport(true);
      const result = await getDailyReportsByBooking(selectedSession.bookingId);
      if (result.success && result.data && result.data.length > 0) {
        // Get the most recent report
        const sorted = [...result.data].sort((a, b) => {
          const dateA = new Date(a.createdDate).getTime();
          const dateB = new Date(b.createdDate).getTime();
          return dateB - dateA;
        });
        setExistingReport(sorted[0]);
      } else {
        setExistingReport(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setExistingReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchUnits = async () => {
    if (!selectedSession?.contractId) return;

    try {
      // Get contract to find curriculum/package
      const contractResult = await getContractById(selectedSession.contractId);
      
      if (contractResult.success && contractResult.data) {
        const contract = contractResult.data;
        // Try to get curriculumId from package
        // Note: You may need to adjust this based on your contract structure
        const packageId = contract.packageId;
        
        if (packageId) {
          // Get package to find curriculum
          const packageResult = await getPackageById(packageId);
          
          if (packageResult.success && packageResult.data) {
            const curriculumId = packageResult.data.curriculumId;
            
            if (curriculumId) {
              // Get units by curriculum
              const unitsResult = await apiService.request<any>(`/units/by-curriculum/${curriculumId}`, {
                method: 'GET',
              });
              
              if (unitsResult.success && unitsResult.data?.data) {
                setUnits(
                  unitsResult.data.data.map((u: any) => ({
                    unitId: u.unitId || u.UnitId || '',
                    unitName: u.unitName || u.UnitName || '',
                    unitOrder: u.unitOrder || u.UnitOrder || 0,
                    curriculumId: u.curriculumId || u.CurriculumId || '',
                  }))
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      // Continue without units - tutor can still create report by entering unit ID manually
    }
  };

  const resetForm = () => {
    setUnitId('');
    setOnTrack(true);
    setHaveHomework(false);
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSession) {
      showError('Please select a session');
      return;
    }

    if (!unitId || unitId.trim() === '') {
      showError('Please select a unit');
      return;
    }

    if (!selectedSession.childId || !selectedSession.bookingId) {
      showError('Session information is incomplete');
      return;
    }

    // Validate notes length
    if (notes && notes.length > 1000) {
      showError('Notes cannot exceed 1000 characters');
      return;
    }

    try {
      setSubmitting(true);

      if (existingReport) {
        // Update existing report
        const updateData: UpdateDailyReportRequest = {
          unitId,
          onTrack,
          haveHomework,
          notes: notes.trim() || undefined,
        };

        const result = await updateDailyReport(existingReport.reportId, updateData);
        if (result.success) {
          showSuccess('Daily report updated successfully');
          await fetchExistingReport();
          // Refresh sessions list to show updated status
          await fetchSessions();
        } else {
          showError(result.error || 'Failed to update report');
        }
      } else {
        // Create new report
        const createData: CreateDailyReportRequest = {
          childId: selectedSession.childId,
          bookingId: selectedSession.bookingId,
          unitId,
          onTrack,
          haveHomework,
          notes: notes.trim() || undefined,
        };

        const result = await createDailyReport(createData);
        if (result.success) {
          showSuccess('Daily report created successfully');
          await fetchExistingReport();
          // Refresh sessions list to show updated status
          await fetchSessions();
        } else {
          showError(result.error || 'Failed to create report');
        }
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to submit report';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      session.childName?.toLowerCase().includes(term) ||
      session.sessionDate?.toLowerCase().includes(term) ||
      session.tutorName?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Daily Reports</h2>
        <p className="text-gray-600 mt-1">Create and update daily reports for today's sessions</p>
        <p className="text-sm text-blue-600 mt-2 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List - Today's Sessions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Sessions</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No sessions scheduled for today</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.bookingId}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedSession?.bookingId === session.bookingId
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        {session.childName || 'Student'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {session.startTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(session.startTime)} - {formatTime(session.endTime || session.startTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Session Detail & Report Form */}
        <div className="lg:col-span-2">
            {!selectedSession ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Session Selected</h3>
                <p className="text-gray-600">Please select a session from today's list to create or update a daily report</p>
              </div>
            ) : loadingReport ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading report...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Session Detail Section */}
                <div className="bg-gradient-to-br from-blue-50 via-white to-white border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Session Details</h3>
                      <p className="text-sm text-gray-600 mt-1">Review session information before creating report</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSession(null);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 p-2 rounded-lg"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Student</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <User className="w-5 h-5 text-purple-500" />
                        <div className="text-sm font-medium">{selectedSession.childName || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Date</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        <div className="text-sm font-medium">{formatDate(selectedSession.sessionDate || '')}</div>
                      </div>
                    </div>
                    
                    {selectedSession.startTime && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Time</div>
                        <div className="flex items-center space-x-2 text-gray-900">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <div className="text-sm font-medium">
                            {formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime || selectedSession.startTime)}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Status</div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-lg text-sm font-bold capitalize ${
                          selectedSession.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : selectedSession.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {selectedSession.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Daily Report Form Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {existingReport ? 'Update Daily Report' : 'Create Daily Report'}
                    </h2>
                    <p className="text-gray-600">Fill in the details about this session</p>
                  </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Unit Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    {units.length > 0 ? (
                      <select
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Select a unit --</option>
                        {units
                          .sort((a, b) => a.unitOrder - b.unitOrder)
                          .map((unit) => (
                            <option key={unit.unitId} value={unit.unitId}>
                              {unit.unitName} (Unit {unit.unitOrder})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
                        placeholder="Enter unit ID"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* On Track */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Learning Progress
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setOnTrack(true)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                          onTrack
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-semibold">On Track</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnTrack(false)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                          !onTrack
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <XCircle className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-semibold">Off Track</span>
                      </button>
                    </div>
                  </div>

                  {/* Homework */}
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={haveHomework}
                        onChange={(e) => setHaveHomework(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Student has homework</span>
                    </label>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={6}
                      maxLength={1000}
                      placeholder="Add notes about the session, student progress, areas of improvement, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">{notes.length}/1000 characters</p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSession(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !unitId}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{existingReport ? 'Update Report' : 'Create Report'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TutorDailyReport;


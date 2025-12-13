import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
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
  getUnitsByContractId,
  getAllUnits,
  getContractById,
  getDailyReportsByTutor,
  getChildById,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { removeIdFromUrl } from '../../../utils/urlUtils';
import LatexKeyboard from '../../common/LatexKeyboard';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { Eye } from 'lucide-react';

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
  
  // View mode: 'create' for creating/editing today's reports, 'view' for viewing past reports
  const [viewMode, setViewMode] = useState<'create' | 'view'>('view');
  const [allReports, setAllReports] = useState<DailyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  // Form state for main child
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [onTrack, setOnTrack] = useState(true);
  const [haveHomework, setHaveHomework] = useState(false);
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [childId, setChildId] = useState<string | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Contract info for 2 children support
  const [contractInfo, setContractInfo] = useState<{
    childId: string;
    childName?: string;
    secondChildId?: string;
    secondChildName?: string;
  } | null>(null);

  // Form state for second child (if contract has 2 children)
  const [secondChildUnitId, setSecondChildUnitId] = useState('');
  const [secondChildOnTrack, setSecondChildOnTrack] = useState(true);
  const [secondChildHaveHomework, setSecondChildHaveHomework] = useState(false);
  const [secondChildNotes, setSecondChildNotes] = useState('');
  const [secondChildUrl, setSecondChildUrl] = useState('');
  const secondChildNotesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSecondChildPreview, setShowSecondChildPreview] = useState(true);
  
  // Check if notes contain LaTeX
  const hasLatex = (text: string): boolean => {
    return /(\$[^$]+\$|\$\$[^$]+\$\$|\\[a-zA-Z]+|\\[\(\)\[\]])/.test(text);
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    if (viewMode === 'create') {
    fetchSessions();
    } else {
      setLoading(false); // View mode doesn't need loading state
      fetchAllReports();
    }
  }, [user?.id, viewMode]);

  useEffect(() => {
    if (selectedSession) {
      fetchExistingReport();
      fetchUnits();
      fetchChildIdFromContract();
    } else {
      setExistingReport(null);
      resetForm();
      setChildId(null);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (existingReport) {
      setUnitId(existingReport.unitId);
      setOnTrack(existingReport.onTrack);
      setHaveHomework(existingReport.haveHomework);
      setNotes(existingReport.notes || '');
      setUrl(existingReport.url || '');
    }
  }, [existingReport]);

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getTutorSessions();
      if (result.success && result.data) {
        // Filter to only show sessions for today (using local date, not UTC)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const filtered = result.data.filter((s) => {
          // Check if session date matches today
          if (!s.sessionDate) return false;
          let sessionDateStr = s.sessionDate;
          if (sessionDateStr.includes('T')) {
            sessionDateStr = sessionDateStr.split('T')[0];
          }
          if (sessionDateStr.includes(' ')) {
            sessionDateStr = sessionDateStr.split(' ')[0];
          }
          
          // Only show completed sessions for today (can only create report for completed sessions)
          return sessionDateStr === todayStr && s.status === 'completed';
        });
        
        // Sort by start time
        filtered.sort((a, b) => {
          const timeA = a.startTime || '';
          const timeB = b.startTime || '';
          return timeA.localeCompare(timeB);
        });
        
        setSessions(filtered);
        return filtered; // Return for use in edit flow
      }
      return [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showError('Failed to load sessions');
      return [];
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
    if (!selectedSession?.contractId) {
      // If no contract, try to load all units as fallback
      await fetchAllUnits();
      return;
    }

    try {
      // Use the new API endpoint to get units by contract ID
      const result = await getUnitsByContractId(selectedSession.contractId);
      
      if (result.success && result.data && result.data.length > 0) {
        setUnits(
          result.data.map((u) => ({
            unitId: u.unitId,
            unitName: u.unitName,
            unitOrder: u.unitOrder,
            curriculumId: u.curriculumId,
          }))
        );
        return; // Successfully loaded contract-specific units
      }
      
      // Fallback: if contract-specific units failed or empty, load all units
      await fetchAllUnits();
    } catch (error: any) {
      console.warn('Could not fetch units by contract, using all units:', error);
      // Fallback: try to load all units
      await fetchAllUnits();
    }
  };

  const fetchAllUnits = async () => {
    try {
      const result = await getAllUnits();
      if (result.success && result.data) {
        setUnits(
          result.data.map((u) => ({
            unitId: u.unitId,
            unitName: u.unitName,
            unitOrder: u.unitOrder,
            curriculumId: u.curriculumId,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching all units:', error);
      // If this also fails, units array will remain empty and text input will be shown
    }
  };

  const fetchChildIdFromContract = async () => {
    if (!selectedSession?.contractId) {
      setChildId(null);
      setContractInfo(null);
      return;
    }

    try {
      const result = await getContractById(selectedSession.contractId);
      if (result.success && result.data) {
        const contract = result.data;
        const mainChildId = contract.childId || contract.ChildId || null;
        const secondChildId = contract.secondChildId || contract.SecondChildId || null;
        const mainChildName = contract.childName || contract.ChildName || null;
        const secondChildName = contract.secondChildName || contract.SecondChildName || null;

        setChildId(mainChildId);
        setContractInfo({
          childId: mainChildId || '',
          childName: mainChildName,
          secondChildId: secondChildId || undefined,
          secondChildName: secondChildName || undefined,
        });

        // Reset second child form if no second child
        if (!secondChildId) {
          setSecondChildUnitId('');
          setSecondChildOnTrack(true);
          setSecondChildHaveHomework(false);
          setSecondChildNotes('');
          setSecondChildUrl('');
        }
      } else {
        setChildId(null);
        setContractInfo(null);
      }
    } catch (error) {
      console.error('Error fetching contract to get childId:', error);
      setChildId(null);
      setContractInfo(null);
    }
  };

  const fetchAllReports = async () => {
    if (!user?.id) return;

    try {
      setLoadingReports(true);
      const result = await getDailyReportsByTutor();
      if (result.success && result.data) {
        // Enrich reports with child names if missing
        const enrichedReports = await Promise.all(
          result.data.map(async (report: DailyReport) => {
            // If childName is missing, try to fetch it from childId
            if (!report.childName && report.childId) {
              try {
                const childResult = await getChildById(report.childId);
                if (childResult.success && childResult.data) {
                  const childName = childResult.data.fullName || childResult.data.FullName || '';
                  return { ...report, childName };
                }
              } catch (error) {
                console.warn(`Failed to fetch child name for childId ${report.childId}:`, error);
              }
            }
            return report;
          })
        );
        
        // Sort by date descending (newest first)
        const sorted = enrichedReports.sort((a, b) => {
          const dateA = new Date(a.sessionDate || a.createdDate).getTime();
          const dateB = new Date(b.sessionDate || b.createdDate).getTime();
          return dateB - dateA;
        });
        setAllReports(sorted);
      } else {
        setAllReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showError('Failed to load daily reports');
      setAllReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const isToday = (dateStr: string): boolean => {
    if (!dateStr) return false;
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      let dateStrOnly = dateStr;
      if (dateStrOnly.includes('T')) {
        dateStrOnly = dateStrOnly.split('T')[0];
      }
      if (dateStrOnly.includes(' ')) {
        dateStrOnly = dateStrOnly.split(' ')[0];
      }
      return dateStrOnly === todayStr;
    } catch {
      return false;
    }
  };

  const canEditReport = (report: DailyReport): boolean => {
    if (!report.sessionDate) return false;
    return isToday(report.sessionDate);
  };

  const resetForm = () => {
    setUnitId('');
    setOnTrack(true);
    setHaveHomework(false);
    setNotes('');
    setUrl('');
    setSecondChildUnitId('');
    setSecondChildOnTrack(true);
    setSecondChildHaveHomework(false);
    setSecondChildNotes('');
    setSecondChildUrl('');
    // Don't reset units here - they will be reloaded when fetchUnits is called
  };

  const handleViewReport = (report: DailyReport) => {
    setSelectedReport(report);
    setViewMode('view');
    // Load form data for viewing
    setUnitId(report.unitId);
    setOnTrack(report.onTrack);
    setHaveHomework(report.haveHomework);
    setNotes(report.notes || '');
    setUrl(report.url || '');
  };

  const handleBackToCreate = () => {
    setViewMode('create');
    setSelectedReport(null);
    setSelectedSession(null);
    resetForm();
  };

  const handleInsertLatex = (latexText: string) => {
    const textarea = notesTextareaRef.current;
    if (!textarea) {
      // If no ref, just append to notes
      setNotes((prev) => prev + latexText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = notes;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + latexText + after;
    
    setNotes(newText);
    
    // Restore cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + latexText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInsertLatexSecondChild = (latexText: string) => {
    const textarea = secondChildNotesTextareaRef.current;
    if (!textarea) {
      // If no ref, just append to notes
      setSecondChildNotes((prev) => prev + latexText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = secondChildNotes;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + latexText + after;
    
    setSecondChildNotes(newText);
    
    // Restore cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + latexText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSession) {
      showError('Please select a session');
      return;
    }

    // Validate that session is completed before creating report
    if (selectedSession.status !== 'completed') {
      showError('Daily report can only be created for completed sessions. Please wait until the session is completed.');
      return;
    }

    if (!unitId || unitId.trim() === '') {
      showError('Please select a unit for the main child');
      return;
    }

    if (!childId || !selectedSession.bookingId || !contractInfo) {
      showError('Session information is incomplete. Please wait for contract information to load.');
      return;
    }

    // Validate notes length for main child
    if (notes && notes.length > 1000) {
      showError('Main child notes cannot exceed 1000 characters');
      return;
    }

    // If contract has 2 children, validate second child form
    if (contractInfo.secondChildId) {
      if (!secondChildUnitId || secondChildUnitId.trim() === '') {
        showError('Please select a unit for the second child');
        return;
      }

      if (secondChildNotes && secondChildNotes.length > 1000) {
        showError('Second child notes cannot exceed 1000 characters');
        return;
      }
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
          url: url.trim() || undefined,
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
          bookingId: selectedSession.bookingId,
          mainChild: {
            childId: childId,
            unitId,
            onTrack,
            haveHomework,
            notes: notes.trim() || undefined,
            url: url.trim() || undefined,
          },
        };

        // Add second child data if contract has 2 children
        if (contractInfo.secondChildId) {
          createData.secondChild = {
            childId: contractInfo.secondChildId,
            unitId: secondChildUnitId,
            onTrack: secondChildOnTrack,
            haveHomework: secondChildHaveHomework,
            notes: secondChildNotes.trim() || undefined,
            url: secondChildUrl.trim() || undefined,
          };
        }

        const result = await createDailyReport(createData);
        if (result.success) {
          showSuccess(contractInfo.secondChildId 
            ? 'Daily reports created successfully for both children' 
            : 'Daily report created successfully');
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

  const filteredReports = allReports.filter((report) => {
    // Filter by date
    if (dateFilter) {
      const reportDate = report.sessionDate || report.createdDate;
      if (reportDate) {
        let reportDateStr = reportDate;
        if (reportDateStr.includes('T')) {
          reportDateStr = reportDateStr.split('T')[0];
        }
        if (reportDateStr !== dateFilter) {
          return false;
        }
      } else {
        return false;
      }
    }

    // Filter by search term
    if (reportSearchTerm) {
      const term = reportSearchTerm.toLowerCase();
      return (
        report.childName?.toLowerCase().includes(term) ||
        report.unitName?.toLowerCase().includes(term) ||
        report.notes?.toLowerCase().includes(term) ||
        report.url?.toLowerCase().includes(term) ||
        report.sessionDate?.toLowerCase().includes(term)
      );
    }

    return true;
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Reports</h2>
            <p className="text-gray-600 mt-1">
              {viewMode === 'create' 
                ? "Create and update daily reports for today's sessions"
                : "View your past daily reports (read-only for previous days)"}
            </p>
            {viewMode === 'create' && (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (viewMode === 'create') {
                setViewMode('view');
                setSelectedSession(null);
                  setLoading(false);
                fetchAllReports();
                } else {
                  setViewMode('create');
                  setSelectedReport(null);
                  resetForm();
                  fetchSessions();
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'view'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {viewMode === 'create' ? 'View Past Reports' : 'Create New Report'}
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'create' ? (
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
                    <p>No completed sessions for today</p>
                    <p className="text-xs text-gray-400 mt-1">Daily reports can only be created for completed sessions</p>
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
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Student(s)</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <User className="w-5 h-5 text-purple-500" />
                        <div className="text-sm font-medium">
                          {contractInfo?.childName || selectedSession.childName || 'N/A'}
                          {contractInfo?.secondChildName && (
                            <span className="ml-2 text-gray-600">
                              & {contractInfo.secondChildName}
                            </span>
                          )}
                        </div>
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
                    <p className="text-gray-600">
                      {contractInfo?.secondChildId 
                        ? 'Fill in the details for both children in this session' 
                        : 'Fill in the details about this session'}
                    </p>
                  </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Main Child Form */}
                  <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6 space-y-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        {contractInfo?.childName || 'Main Child'}
                      </h3>
                      {contractInfo?.secondChildId && (
                        <p className="text-sm text-gray-600 mt-1">First student in the contract</p>
                      )}
                    </div>

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
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Notes (Optional)
                        </label>
                        {notes.trim() && (
                          <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                            title="Toggle LaTeX Preview"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                          </button>
                        )}
                      </div>
                    <div className="space-y-3">
                      <div>
                        <textarea
                          ref={notesTextareaRef}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={6}
                          maxLength={1000}
                          placeholder="Add notes about the session, student progress, areas of improvement, etc. Use LaTeX keyboard for math symbols."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* LaTeX Keyboard Section */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-700">
                            LaTeX Keyboard
                          </label>
                        </div>
                        <div className="flex justify-start">
                          <LatexKeyboard onInsert={handleInsertLatex} textareaRef={notesTextareaRef} />
                        </div>
                      </div>

                      {/* LaTeX Preview */}
                      {showPreview && notes.trim() && (
                        <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-4 border-2 border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              LaTeX Preview
                            </div>
                            {hasLatex(notes) && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                Math Detected
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap min-h-[100px] bg-white rounded p-3 border border-gray-200">
                            <Latex delimiters={[
                              { left: '$$', right: '$$', display: true },
                              { left: '$', right: '$', display: false },
                              { left: '\\(', right: '\\)', display: false },
                              { left: '\\[', right: '\\]', display: true },
                            ]}>
                              {notes}
                            </Latex>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{notes.length}/1000 characters</p>
                  </div>

                    {/* URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Link to any relevant documents or resources</p>
                    </div>
                  </div>

                  {/* Second Child Form - Only show if contract has 2 children */}
                  {contractInfo?.secondChildId && (
                    <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-6 space-y-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {contractInfo.secondChildName || 'Second Child'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Second student in the contract</p>
                      </div>

                      {/* Unit Selection for Second Child */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit <span className="text-red-500">*</span>
                        </label>
                        {units.length > 0 ? (
                          <select
                            value={secondChildUnitId}
                            onChange={(e) => setSecondChildUnitId(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                            value={secondChildUnitId}
                            onChange={(e) => setSecondChildUnitId(e.target.value)}
                            placeholder="Enter unit ID"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        )}
                      </div>

                      {/* On Track for Second Child */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Learning Progress
                        </label>
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => setSecondChildOnTrack(true)}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                              secondChildOnTrack
                                ? 'bg-green-50 border-green-500 text-green-700'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                            <span className="font-semibold">On Track</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSecondChildOnTrack(false)}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                              !secondChildOnTrack
                                ? 'bg-red-50 border-red-500 text-red-700'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <XCircle className="w-6 h-6 mx-auto mb-2" />
                            <span className="font-semibold">Off Track</span>
                          </button>
                        </div>
                      </div>

                      {/* Homework for Second Child */}
                      <div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={secondChildHaveHomework}
                            onChange={(e) => setSecondChildHaveHomework(e.target.checked)}
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Student has homework</span>
                        </label>
                      </div>

                      {/* Notes for Second Child */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Notes (Optional)
                          </label>
                          {secondChildNotes.trim() && (
                            <button
                              type="button"
                              onClick={() => setShowSecondChildPreview(!showSecondChildPreview)}
                              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                              title="Toggle LaTeX Preview"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{showSecondChildPreview ? 'Hide' : 'Show'} Preview</span>
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <textarea
                              ref={secondChildNotesTextareaRef}
                              value={secondChildNotes}
                              onChange={(e) => setSecondChildNotes(e.target.value)}
                              rows={6}
                              maxLength={1000}
                              placeholder="Add notes about the session, student progress, areas of improvement, etc. Use LaTeX keyboard for math symbols."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          
                          {/* LaTeX Keyboard Section for Second Child */}
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-medium text-gray-700">
                                LaTeX Keyboard
                              </label>
                            </div>
                            <div className="flex justify-start">
                              <LatexKeyboard onInsert={handleInsertLatexSecondChild} textareaRef={secondChildNotesTextareaRef} />
                            </div>
                          </div>

                          {/* LaTeX Preview for Second Child */}
                          {showSecondChildPreview && secondChildNotes.trim() && (
                            <div className="bg-gradient-to-br from-purple-50 to-gray-50 rounded-lg p-4 border-2 border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  LaTeX Preview
                                </div>
                                {hasLatex(secondChildNotes) && (
                                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                    Math Detected
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap min-h-[100px] bg-white rounded p-3 border border-gray-200">
                                <Latex delimiters={[
                                  { left: '$$', right: '$$', display: true },
                                  { left: '$', right: '$', display: false },
                                  { left: '\\(', right: '\\)', display: false },
                                  { left: '\\[', right: '\\]', display: true },
                                ]}>
                                  {secondChildNotes}
                                </Latex>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{secondChildNotes.length}/1000 characters</p>
                      </div>

                      {/* URL for Second Child */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={secondChildUrl}
                          onChange={(e) => setSecondChildUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Link to any relevant documents or resources</p>
                      </div>
                    </div>
                  )}

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
                      disabled={submitting || !unitId || (contractInfo?.secondChildId && !secondChildUnitId)}
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
                          <span>{existingReport ? 'Update Report' : (contractInfo?.secondChildId ? 'Create Reports' : 'Create Report')}</span>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Past Reports</h3>
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={reportSearchTerm}
                      onChange={(e) => setReportSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Filter by date"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loadingReports ? (
                  <div className="text-center text-gray-500 py-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
                    <p>Loading reports...</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No reports found</p>
                  </div>
                ) : (
                  filteredReports.map((report) => {
                    const canEdit = canEditReport(report);
                    return (
                      <button
                        key={report.reportId}
                        onClick={() => handleViewReport(report)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          selectedReport?.reportId === report.reportId
                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">
                            {report.childName || 'Student'}
                          </span>
                          {canEdit ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Editable
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              View Only
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(report.sessionDate || report.createdDate)}</span>
                          </div>
                          {report.unitName && (
                            <div className="flex items-center space-x-1">
                              <BookOpen className="w-4 h-4" />
                              <span className="truncate">{report.unitName}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            {report.onTrack ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span>{report.onTrack ? 'On Track' : 'Off Track'}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Report Detail View */}
          <div className="lg:col-span-2">
            {!selectedReport ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Report Selected</h3>
                <p className="text-gray-600">Please select a report from the list to view details</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Report Header */}
                <div className="bg-gradient-to-br from-blue-50 via-white to-white border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Report Details</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {canEditReport(selectedReport) 
                          ? 'This report can be edited (today\'s date)'
                          : 'This report is read-only (past date)'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canEditReport(selectedReport) && (
                        <button
                          onClick={async () => {
                            // Switch to create mode and load this report for editing
                            setViewMode('create');
                            // Fetch today's sessions
                            const todaySessions = await fetchSessions();
                            // Try to find matching session by bookingId
                            if (selectedReport.bookingId && todaySessions) {
                              const matchingSession = todaySessions.find(s => s.bookingId === selectedReport.bookingId);
                              if (matchingSession) {
                                setSelectedSession(matchingSession);
                                // The existing report will be loaded via fetchExistingReport in useEffect
                              } else {
                                // If session not found in today's list, show message
                                showError('Session not found for today. Please select from today\'s sessions.');
                              }
                            } else {
                              showError('Cannot find session information for this report.');
                            }
                            setSelectedReport(null);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit Report
                        </button>
                      )}
                      <button
                        onClick={handleBackToCreate}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 p-2 rounded-lg"
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Student</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <User className="w-5 h-5 text-purple-500" />
                        <div className="text-sm font-medium">{selectedReport.childName || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Date</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        <div className="text-sm font-medium">
                          {formatDate(selectedReport.sessionDate || selectedReport.createdDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Unit</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <div className="text-sm font-medium">{selectedReport.unitName || selectedReport.unitId || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Progress</div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-lg text-sm font-bold ${
                          selectedReport.onTrack
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {selectedReport.onTrack ? 'On Track' : 'Off Track'}
                      </span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Homework</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        {selectedReport.haveHomework ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="text-sm font-medium">
                          {selectedReport.haveHomework ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Created</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(selectedReport.createdDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedReport.notes && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        <Latex delimiters={[
                          { left: '$$', right: '$$', display: true },
                          { left: '$', right: '$', display: false },
                          { left: '\\(', right: '\\)', display: false },
                          { left: '\\[', right: '\\]', display: true },
                        ]}>
                          {selectedReport.notes}
                        </Latex>
                      </div>
                    </div>
                  </div>
                )}

                {/* URL Section */}
                {selectedReport.url && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">URL</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <a
                        href={selectedReport.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2 break-all"
                      >
                        <span>{removeIdFromUrl(selectedReport.url)}</span>
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorDailyReport;


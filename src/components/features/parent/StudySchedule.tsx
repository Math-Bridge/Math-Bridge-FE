import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Monitor, MapPin, AlertCircle, X, User, ChevronDown, ExternalLink, Link as LinkIcon, Plus, Copy, Check, RefreshCw, FileText, CheckCircle, XCircle } from 'lucide-react';
import {
  getSessionsByChildId,
  Session,
  getChildrenByParent,
  Child,
  getSessionById,
  createVideoConference,
  CreateVideoConferenceRequest,
  getContractsByParent,
  Contract,
  getDailyReportsByChild,
  DailyReport,
} from '../../../services/api';

// Lightweight representation of raw child coming from API mapping with varied casing
interface ChildRaw {
  ChildId?: string; childId?: string;
  FullName?: string; fullName?: string;
  SchoolId?: string; schoolId?: string;
  SchoolName?: string; schoolName?: string;
  Grade?: string; grade?: string;
  Status?: string; status?: string;
}
import { useToast } from '../../../contexts/ToastContext';
import RescheduleRequestPopup from './RescheduleRequestPopup';
import { useAuth } from '../../../hooks/useAuth';
import FallingLatexSymbols from '../../common/FallingLatexSymbols';

const StudySchedule: React.FC = () => {
  const { showError } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionDetail, setSessionDetail] = useState<Session | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creatingVideoConference, setCreatingVideoConference] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReschedulePopup, setShowReschedulePopup] = useState(false);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const { showSuccess } = useToast();

  const fetchChildren = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const childrenRes = await getChildrenByParent(user.id);

      if (childrenRes.success && childrenRes.data) {
        const childrenData = Array.isArray(childrenRes.data) ? childrenRes.data : [];
        const mappedChildren = childrenData
          .filter((child: ChildRaw) => {
            const status = (child.Status || child.status || 'active') as string;
            return status !== 'deleted';
          })
          .map((child: ChildRaw) => ({
            childId: child.ChildId || child.childId || '',
            fullName: child.FullName || child.fullName || '',
            schoolId: child.SchoolId || child.schoolId || '',
            schoolName: child.SchoolName || child.schoolName || '',
            grade: child.Grade || child.grade || '',
            status: (child.Status || child.status || 'active') as string,
          }));
        setChildren(mappedChildren);

        // Auto-select first child if there are any children
        if (mappedChildren.length > 0) {
          setSelectedChildId(mappedChildren[0].childId);
        }
      } else {
        const errorMsg = childrenRes.error || 'Failed to load children';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contracts for filtering
  const fetchContracts = async () => {
    if (!user?.id) return;
    
    try {
      const contractsRes = await getContractsByParent(user.id);
      if (contractsRes.success && contractsRes.data) {
        setContracts(contractsRes.data);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
      // Don't show error - just continue without contract filtering
    }
  };

  // Fetch sessions when child is selected
  const fetchSessionsForChild = async (childId: string) => {
    if (!childId) {
      setSessions([]);
      return;
    }

    setLoadingSessions(true);
    try {
      const sessionsRes = await getSessionsByChildId(childId);
      
      if (sessionsRes.success && sessionsRes.data) {
        // Filter out sessions from completed contracts
        const completedContractIds = contracts
          .filter(contract => {
            const status = (contract.status || '').toLowerCase();
            return status === 'completed' || status === 'cancelled';
          })
          .map(contract => contract.contractId);
        
        const filteredSessions = sessionsRes.data.filter(session => {
          // Keep session if its contract is not in completed/cancelled list
          return !completedContractIds.includes(session.contractId);
        });
        
        setSessions(filteredSessions);
      } else {
        const errorMsg = sessionsRes.error || 'Failed to load sessions';
        setError(errorMsg);
        setSessions([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch daily reports for selected child
  const fetchDailyReports = async (childId: string) => {
    if (!childId) {
      setDailyReports([]);
      return;
    }

    setLoadingReports(true);
    try {
      const reportsRes = await getDailyReportsByChild(childId);
      
      if (reportsRes.success && reportsRes.data) {
        // Enrich reports with child name if missing
        const enrichedReports = reportsRes.data.map((report: DailyReport) => {
          // If childName is missing, try to get it from children list
          if (!report.childName && report.childId) {
            const child = children.find(c => c.childId === report.childId);
            if (child) {
              return { ...report, childName: child.fullName };
            }
          }
          return report;
        });
        
        // Sort by date descending (newest first)
        const sorted = enrichedReports.sort((a, b) => {
          const dateA = new Date(a.sessionDate || a.createdDate).getTime();
          const dateB = new Date(b.sessionDate || b.createdDate).getTime();
          return dateB - dateA;
        });
        
        setDailyReports(sorted);
      } else {
        setDailyReports([]);
      }
    } catch (err) {
      console.error('Error fetching daily reports:', err);
      setDailyReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch sessions and daily reports when child is selected or contracts change
  useEffect(() => {
    // Clear selected session and session detail when child changes
    setSelectedSession(null);
    setSessionDetail(null);
    
    if (selectedChildId) {
      fetchSessionsForChild(selectedChildId);
      fetchDailyReports(selectedChildId);
      
      // Auto-reload sessions and reports every 30 seconds
      const sessionsInterval = setInterval(() => {
        fetchSessionsForChild(selectedChildId);
        fetchDailyReports(selectedChildId);
      }, 30000);
      
      return () => clearInterval(sessionsInterval);
    } else {
      setSessions([]);
      setDailyReports([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId, contracts, children]);

  const fetchSessionDetail = async (bookingId: string, autoCreateLink: boolean = false) => {
    try {
      setLoadingDetail(true);
      const result = await getSessionById(bookingId);
      if (result.success && result.data) {
        const session = result.data;
        if (!session) {
          showError('Session data is invalid');
          return;
        }
        setSessionDetail(session);
        
        // Auto-create video conference link if session is online and has platform but no link yet
        // Only auto-create on first load, not on refresh
        if (autoCreateLink && session.isOnline && session.videoCallPlatform && !session.videoConferenceLink) {
          // Determine platform from videoCallPlatform
          const platform = session.videoCallPlatform.toLowerCase().includes('zoom') ? 'Zoom' : 
                          session.videoCallPlatform.toLowerCase().includes('meet') ? 'Meet' : 
                          'Zoom'; // Default to Zoom
          
          // Auto-create link (don't refresh after to avoid loop)
          await handleCreateVideoConferenceAuto(session, platform, false);
        }
      } else {
        showError(result.error || 'Failed to load session details');
      }
    } catch (error) {
      console.error('Error fetching session detail:', error);
      showError('Failed to load session details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSessionClick = async (session: Session) => {
    setSelectedSession(session);
    await fetchSessionDetail(session.bookingId, true); // Pass true to enable auto-create
  };

  const handleCloseDetail = () => {
    setSelectedSession(null);
    setSessionDetail(null);
  };

  const handleCreateVideoConferenceAuto = async (session: Session, platform: 'Zoom' | 'Meet', shouldRefresh: boolean = true) => {
    if (!session) return;

    try {
      setCreatingVideoConference(true);
      const request: CreateVideoConferenceRequest = {
        bookingId: session.bookingId,
        contractId: session.contractId,
        platform: platform,
      };

      const result = await createVideoConference(request);
      if (result.success && result.data) {
        const videoConferenceData = result.data;
        // Update session detail with video conference info
        setSessionDetail(prev => prev ? {
          ...prev,
          videoConferenceLink: videoConferenceData.meetingUri,
          videoConferencePlatform: videoConferenceData.platform,
          videoConferenceCode: videoConferenceData.meetingCode,
        } : null);
        // Only refresh if requested (to avoid infinite loop)
        if (shouldRefresh) {
          await fetchSessionDetail(session.bookingId, false);
        }
      } else {
        // Silently fail - don't show error for auto-create
        if (import.meta.env.DEV) {
          console.error('Auto-create video conference failed:', result.error);
        }
      }
    } catch (error) {
      // Silently fail - don't show error for auto-create
      if (import.meta.env.DEV) {
        console.error('Error auto-creating video conference:', error);
      }
    } finally {
      setCreatingVideoConference(false);
    }
  };

  const handleCreateVideoConference = async () => {
    if (!sessionDetail) return;

    // Determine platform from session's videoCallPlatform
    const platform = sessionDetail.videoCallPlatform?.toLowerCase().includes('zoom') ? 'Zoom' : 
                    sessionDetail.videoCallPlatform?.toLowerCase().includes('meet') ? 'Meet' : 
                    'Zoom'; // Default to Zoom

    try {
      setCreatingVideoConference(true);
      const request: CreateVideoConferenceRequest = {
        bookingId: sessionDetail.bookingId,
        contractId: sessionDetail.contractId,
        platform: platform,
      };

      const result = await createVideoConference(request);
      if (result.success && result.data) {
        showSuccess(`Video conference link created successfully on ${platform}!`);
        // Update session detail with video conference info
        setSessionDetail({
          ...sessionDetail,
          videoConferenceLink: result.data.meetingUri,
          videoConferencePlatform: result.data.platform,
          videoConferenceCode: result.data.meetingCode,
        });
        // Also refresh to get any other updates (don't auto-create again)
        await fetchSessionDetail(sessionDetail.bookingId, false);
      } else {
        showError(result.error || 'Failed to create video conference');
      }
    } catch (error) {
      console.error('Error creating video conference:', error);
      showError('Failed to create video conference');
    } finally {
      setCreatingVideoConference(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showSuccess('Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Failed to copy link');
    }
  };

  const formatDate = (date: Date): string => {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInWeek = (date: Date): Date[] => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getSessionsForDay = (date: Date): Session[] => {
    const dateStr = formatDate(date);
    return sessions.filter(session => {
      if (!session.sessionDate && !session.startTime) return false;
      
      // Try to parse sessionDate or startTime
      let sessionDate: Date | null = null;
      
      if (session.sessionDate) {
        // Parse sessionDate - handle both date strings and ISO strings
        const dateToParse = session.sessionDate;
        if (dateToParse.includes('T')) {
          // ISO string - parse and use local date
          sessionDate = new Date(dateToParse);
        } else if (dateToParse.includes(' ')) {
          // Date with time - parse and use local date
          sessionDate = new Date(dateToParse);
        } else {
          // Just date string YYYY-MM-DD - parse as local date
          const parts = dateToParse.split('-');
          if (parts.length === 3) {
            sessionDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
      } else if (session.startTime) {
        // Use startTime if sessionDate is not available
        sessionDate = new Date(session.startTime);
      }
      
      if (!sessionDate) return false;
      
      // Compare dates using local date strings (avoid timezone issues)
      const sessionDateStr = formatDate(sessionDate);
      return sessionDateStr === dateStr;
    });
  };

  const formatTime = (dateTimeStr: string): string => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateTimeStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'scheduled':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Render session card component
  const renderSessionCard = (session: Session) => (
    <div
      key={session.bookingId}
      className={`
        group relative text-xs px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg cursor-pointer transition-all duration-200
        ${getStatusColor(session.status)}
        ${selectedSession?.bookingId === session.bookingId ? 'ring-2 ring-blue-500 scale-105 shadow-md' : ''}
      `}
      onClick={() => handleSessionClick(session)}
      title={`Click to view details: ${formatTime(session.startTime)} - ${formatTime(session.endTime)}`}
    >
      <div className="font-semibold flex items-center gap-1.5 mb-1">
        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 opacity-70" />
        <span className="truncate text-xs sm:text-sm">{formatTime(session.startTime)}</span>
      </div>
      <div className="text-[10px] sm:text-xs opacity-80 ml-4 sm:ml-5 mb-1.5 break-words">
        to {formatTime(session.endTime)}
      </div>
      {session.tutorName && (
        <div className="flex items-start gap-1 mb-1">
          <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] sm:text-xs break-words line-clamp-2">{session.tutorName}</span>
        </div>
      )}
      {(session.childName || session.studentName) && (
        <div className="text-[10px] sm:text-xs opacity-80 ml-4 sm:ml-5 mb-1.5 break-words line-clamp-2">
          Student: {session.childName || session.studentName}
        </div>
      )}
      <div className="flex items-center gap-1 flex-wrap mt-1.5">
        {session.isOnline ? (
          <span className="flex items-center gap-0.5 sm:gap-1 bg-white bg-opacity-60 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium" title="Online">
            <Monitor className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Online</span>
          </span>
        ) : (
          <span className="flex items-center gap-0.5 sm:gap-1 bg-white bg-opacity-60 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium" title="In-Person">
            <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
            <span className="whitespace-nowrap">In-Person</span>
          </span>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-lg pointer-events-none"></div>
    </div>
  );

  // Render day cell component
  const renderDayCell = (day: Date, dayName: string, index: number) => {
    const daySessions = getSessionsForDay(day);
    const dayOfMonth = day.getDate();
    const isCurrentDay = isToday(day);

    return (
      <div key={index} className="flex flex-col">
        {/* Day header */}
        <div className="text-center py-2 mb-2">
          <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">{dayName}</div>
        </div>
        {/* Day cell */}
        <div
          className={`
            min-h-[200px] sm:min-h-[250px] p-2 sm:p-3 rounded-lg flex flex-col transition-all duration-200 w-full
            ${isCurrentDay
              ? 'bg-gradient-to-br from-primary/10 to-primary/20 border-2 border-primary/50 shadow-md'
              : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }
          `}
        >
          <div className={`
            text-base sm:text-lg font-bold mb-2 sm:mb-3 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg flex-shrink-0
            ${isCurrentDay ? 'bg-primary text-white' : 'text-gray-900'}
          `}>
            {dayOfMonth}
          </div>
          <div className="space-y-1.5 sm:space-y-2 flex-1 overflow-y-auto max-h-[150px] sm:max-h-[200px] custom-scrollbar">
            {daySessions.length === 0 ? (
              <div className="text-[10px] sm:text-xs text-gray-400 text-center py-6 sm:py-8">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 opacity-30" />
                <span>No sessions</span>
              </div>
            ) : (
              daySessions.map(renderSessionCard)
            )}
          </div>
        </div>
      </div>
    );
  };


  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(formatDate(today));
  };

  const handleDatePickerChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    const date = new Date(dateStr + 'T00:00:00');
    setCurrentDate(date);
  };

  const daysInWeek = getDaysInWeek(currentDate);

  if (loading || loadingSessions) {
    return (
      <div className="w-full">
        {/* Subtle Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-primary/15 text-7xl font-light select-none animate-float"
                style={{
                  left: `${10 + (i * 70) % 85}%`,
                  top: `${15 + (i * 55) % 80}%`,
                  animationDelay: `${i * 3}s`,
                }}
              >
                {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-12">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-t-3 border-primary"></div>
            <Calendar className="w-5 h-5 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="mt-4 text-gray-600 font-medium">Loading study schedule...</span>
        </div>
      </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
          }
          .animate-float { animation: float 25s linear infinite; }
        `}} />
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="w-full">
        {/* Subtle Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
        </div>
        <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-8 max-w-md">
        <div className="flex items-center space-x-3 text-red-700">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
                <h3 className="font-semibold text-lg text-primary-dark">Error Loading Schedule</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Falling LaTeX Symbols Background Animation */}
      <FallingLatexSymbols />
      
      {/* Subtle Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-primary/15 text-7xl font-light select-none animate-float"
              style={{
                left: `${10 + (i * 70) % 85}%`,
                top: `${15 + (i * 55) % 80}%`,
                animationDelay: `${i * 3}s`,
              }}
            >
              {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
            {/* Header */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                  <div className="text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                      <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">Study Schedule</h1>
                  </div>
                    <p className="text-lg sm:text-xl text-white/95 ml-14">Manage and track your child's learning sessions</p>
                </div>
                {/* Children Selector */}
                  {children.length > 0 ? (
                    <div className="relative z-10">
                      <div className="bg-white/20 backdrop-blur-md rounded-xl p-1 border-2 border-white/30">
                        <select
                          value={selectedChildId || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedChildId(value || null);
                          }}
                          className="appearance-none bg-white/95 backdrop-blur-sm border-0 rounded-lg px-4 py-3 pr-10 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white transition-all shadow-sm w-full"
                          style={{ zIndex: 10 }}
                        >
                          <option value="">Select a child...</option>
                          {children.map((child) => (
                            <option key={child.childId} value={child.childId}>
                              {child.fullName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" style={{ zIndex: 1 }} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/80 text-sm">
                      No children found. Please add a child first.
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6">
              {!selectedChildId ? (
                <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                  <User className="w-10 h-10 text-primary" />
                  </div>
                <h4 className="text-xl font-semibold text-primary-dark mb-2">Please select a child</h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Choose a child from the dropdown above to view their study schedule.
                  </p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                  <Calendar className="w-10 h-10 text-primary" />
                  </div>
                <h4 className="text-xl font-semibold text-primary-dark mb-2">No sessions</h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {children.find(c => c.childId === selectedChildId)?.fullName || 'This child'} doesn't have any study sessions scheduled yet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Calendar Navigation */}
              <div className="mb-6 bg-white rounded-2xl border-2 border-primary/20 shadow-math overflow-hidden">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-0 lg:gap-6 p-4 sm:p-6">
                  {/* Week Range Display - Left Side */}
                  <div className="flex items-center gap-3 pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-gray-200 lg:pr-6">
                    <div className="bg-primary/10 p-2.5 rounded-xl flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Week Range</div>
                      <div className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {daysInWeek[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                        {daysInWeek[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Controls - Right Side */}
                  <div className="flex items-center justify-center lg:justify-end gap-2 sm:gap-3 pt-4 lg:pt-0 flex-1">
                    <button
                      onClick={goToPreviousWeek}
                      className="p-2.5 sm:p-3 bg-gray-50 hover:bg-primary text-gray-700 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-gray-200 hover:border-primary flex-shrink-0"
                      title="Previous week"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    
                    <div className="relative flex-1 sm:flex-initial sm:min-w-[180px]">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/60 pointer-events-none z-10" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDatePickerChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 font-semibold text-gray-700 text-sm sm:text-base bg-white hover:border-primary/50 shadow-sm"
                      />
                    </div>
                    
                    <button
                      onClick={goToNextWeek}
                      className="p-2.5 sm:p-3 bg-gray-50 hover:bg-primary text-gray-700 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-gray-200 hover:border-primary flex-shrink-0"
                      title="Next week"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Weekly Calendar Grid - Responsive Layout */}
              <div className="w-full">
                {/* Mobile: Single column, Tablet: 2 columns, Desktop: 4+3 layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  {daysInWeek.slice(0, 4).map((day, index) => {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday'];
                    return renderDayCell(day, dayNames[index], index);
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {daysInWeek.slice(4, 7).map((day, index) => {
                    const dayNames = ['Thursday', 'Friday', 'Saturday'];
                    return renderDayCell(day, dayNames[index], index + 4);
                  })}
                </div>
              </div>

              {/* Selected Session Details Panel */}
              {selectedSession && (
                <div className="mt-6 p-6 bg-white border-2 border-primary/20 rounded-2xl shadow-math">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">Session Details</h4>
                      <p className="text-sm text-gray-600 mt-1">Review session information</p>
                    </div>
                    <button
                      onClick={handleCloseDetail}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 p-2 rounded-lg"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-primary/20">
                      <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Time</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-900">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <div>
                            <div className="text-xs text-gray-500 font-medium">From</div>
                            <div className="font-semibold">{formatTime(selectedSession.startTime)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-900 ml-7">
                          <div>
                            <div className="text-xs text-gray-500 font-medium">To</div>
                            <div className="font-semibold">{formatTime(selectedSession.endTime)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Date</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        <div className="text-sm font-medium">{selectedSession.sessionDate}</div>
                      </div>
                    </div>
                    {selectedSession.tutorName && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Tutor</div>
                        <div className="flex items-center space-x-2 text-gray-900">
                          <User className="w-5 h-5 text-blue-500" />
                          <div className="text-sm font-medium">{selectedSession.tutorName}</div>
                        </div>
                      </div>
                    )}
                    {(selectedSession.childName || selectedSession.studentName) && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Student</div>
                        <div className="flex items-center space-x-2 text-gray-900">
                          <User className="w-5 h-5 text-purple-500" />
                          <div className="text-sm font-medium">{selectedSession.childName || selectedSession.studentName}</div>
                        </div>
                      </div>
                    )}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Format</div>
                      <div className="flex items-center space-x-2">
                        {selectedSession.isOnline ? (
                          <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                            <Monitor className="w-4 h-4" />
                            <span>Online</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">
                            <MapPin className="w-4 h-4" />
                            <span>In-Person</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {!selectedSession.isOnline && (selectedSession.offlineAddress || sessionDetail?.offlineAddress) && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Address</div>
                        <div className="flex items-start space-x-2 text-gray-900">
                          <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm font-medium break-words">
                            {selectedSession.offlineAddress || sessionDetail?.offlineAddress || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Status</div>
                      <span
                        className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold capitalize ${
                          selectedSession.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : selectedSession.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : selectedSession.status === 'rescheduled'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {selectedSession.status}
                      </span>
                    </div>
                  </div>

                  {/* Video Conference Link (Online Learning Link) */}
                  {sessionDetail && sessionDetail.isOnline && 
                   sessionDetail.status !== 'completed' && 
                   sessionDetail.status !== 'cancelled' && 
                   sessionDetail.status !== 'rescheduled' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-gray-50 p-4 rounded-xl border-2 border-primary/20">
                        <div className="flex items-start gap-3">
                          <LinkIcon className="w-5 h-5 text-blue-500 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Online Learning Link</p>
                            {loadingDetail ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            ) : sessionDetail.videoConferenceLink ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={sessionDetail.videoConferenceLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-math hover:shadow-math-lg"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Join Online Session
                                  </a>
                                  <button
                                    onClick={() => handleCopyLink(sessionDetail.videoConferenceLink!)}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium border-2 border-gray-200"
                                    title="Copy link"
                                  >
                                    {copiedLink ? (
                                      <>
                                        <Check className="w-4 h-4 text-green-600" />
                                        <span className="text-xs">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4" />
                                        <span className="text-xs">Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                {sessionDetail.videoConferencePlatform && (
                                  <p className="text-sm text-gray-600">
                                    Platform: <span className="font-semibold">{sessionDetail.videoConferencePlatform}</span>
                                  </p>
                                )}
                                {sessionDetail.videoConferenceCode && (
                                  <p className="text-sm text-gray-600">
                                    Meeting Code: <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded">{sessionDetail.videoConferenceCode}</span>
                                  </p>
                                )}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-xs text-gray-500 break-all font-mono">
                                    {sessionDetail.videoConferenceLink}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-sm text-gray-500">
                                  {sessionDetail.videoCallPlatform 
                                    ? `No video conference link available yet. Platform: ${sessionDetail.videoCallPlatform}`
                                    : 'No video conference link available yet.'}
                                </p>
                                <button
                                  onClick={handleCreateVideoConference}
                                  disabled={creatingVideoConference}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-math hover:shadow-math-lg"
                                >
                                  {creatingVideoConference ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Creating link...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4" />
                                      Create Online Learning Link
                                    </>
                                  )}
                                </button>
                                {sessionDetail.videoCallPlatform && (
                                  <p className="text-xs text-gray-400 text-center">
                                    Will create link using {sessionDetail.videoCallPlatform} platform
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daily Reports Section */}
                  {selectedSession && (() => {
                    const sessionReports = dailyReports.filter(report => report.bookingId === selectedSession.bookingId);
                    return sessionReports.length > 0 ? (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center space-x-2 mb-4">
                          <FileText className="w-5 h-5 text-primary" />
                          <h4 className="text-lg font-bold text-gray-900">Daily Reports</h4>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                            {sessionReports.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {sessionReports.map((report) => (
                            <div key={report.reportId} className="bg-gray-50 rounded-xl p-4 border-2 border-primary/20">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-semibold text-gray-700">
                                      {report.sessionDate 
                                        ? new Date(report.sessionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                        : new Date(report.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                    {report.onTrack ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>On Track</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                                        <XCircle className="w-3 h-3" />
                                        <span>Off Track</span>
                                      </span>
                                    )}
                                  </div>
                                  {report.childName && (
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                      <User className="w-4 h-4" />
                                      <span>{report.childName}</span>
                                    </div>
                                  )}
                                  {report.unitName && (
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                      <FileText className="w-4 h-4" />
                                      <span>{report.unitName}</span>
                                    </div>
                                  )}
                                  {report.haveHomework && (
                                    <div className="flex items-center space-x-2 text-sm text-blue-600 mb-2">
                                      <FileText className="w-4 h-4" />
                                      <span>Has Homework</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {report.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.notes}</p>
                                </div>
                              )}
                              {report.url && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <a
                                    href={report.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2"
                                  >
                                    <span>View Resource</span>
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between gap-3">
                      {/* Reschedule Button - Only show for scheduled sessions that haven't passed */}
                      {selectedSession && 
                       selectedSession.status === 'scheduled' && 
                       selectedSession.sessionDate && (() => {
                         const today = new Date();
                         const todayStr = formatDate(today);
                         let sessionDateStr = selectedSession.sessionDate;
                         if (sessionDateStr.includes('T')) {
                           sessionDateStr = sessionDateStr.split('T')[0];
                         }
                         if (sessionDateStr.includes(' ')) {
                           sessionDateStr = sessionDateStr.split(' ')[0];
                         }
                         return sessionDateStr >= todayStr;
                       })() && (
                        <button
                          onClick={() => setShowReschedulePopup(true)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 border-2 border-orange-200 rounded-xl hover:bg-orange-100 transition-all duration-200 font-semibold"
                        >
                          <RefreshCw className="w-5 h-5" />
                          <span>Request Reschedule</span>
                        </button>
                      )}
                      <button
                        onClick={handleCloseDetail}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-semibold border-2 border-gray-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="font-bold text-primary-dark text-base">Legend</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 border-2 border-primary/40 rounded-lg"></div>
                    <span className="text-gray-700 font-medium">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded-lg"></div>
                    <span className="text-gray-700 font-medium">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded-lg"></div>
                    <span className="text-gray-700 font-medium">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded-lg"></div>
                    <span className="text-gray-700 font-medium">Rescheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-primary" />
                    <span className="text-gray-700 font-medium">Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-gray-700 font-medium">In-Person</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border-2 border-primary/20">
                  <p className="font-medium">Click on any session to view full details.</p>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Reschedule Request Popup */}
      {selectedSession && (
        <RescheduleRequestPopup
          isOpen={showReschedulePopup}
          onClose={() => setShowReschedulePopup(false)}
          onSuccess={() => {
            setShowReschedulePopup(false);
            // Refresh sessions after successful reschedule request
            if (selectedChildId) {
              fetchSessionsForChild(selectedChildId);
            }
          }}
          currentSession={{
            bookingId: selectedSession.bookingId,
            date: selectedSession.sessionDate || '',
            // Pass HH:mm format so popup can block the same slot accurately
            time: new Date(selectedSession.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            topic: selectedSession.childName || selectedSession.studentName || 'Session',
          }}
          tutorName={selectedSession.tutorName || 'Tutor'}
          childId={selectedChildId || undefined}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-float { animation: float 25s linear infinite; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
};

export default StudySchedule;


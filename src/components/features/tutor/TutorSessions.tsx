import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, MapPin, Calendar, X, User, BookOpen, CheckCircle, XCircle, ExternalLink, Link as LinkIcon, Plus, Monitor, Copy, Check } from 'lucide-react';
import { getTutorSessions, getSessionById, updateSessionStatus, createVideoConference, CreateVideoConferenceRequest, Session } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

const TutorSessions: React.FC = () => {
  const { showError, showSuccess } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionDetail, setSessionDetail] = useState<Session | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [creatingVideoConference, setCreatingVideoConference] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [user?.id, currentDate]);

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getTutorSessions();

      if (result.success && result.data) {
        setSessions(result.data);
      } else {
        showError(result.error || 'Failed to load sessions');
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showError('Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetail = async (bookingId: string, autoCreateLink: boolean = false) => {
    try {
      setLoadingDetail(true);
      const result = await getSessionById(bookingId);
      if (result.success && result.data) {
        const session = result.data;
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
        console.log('Auto-create video conference failed:', result.error);
      }
    } catch (error) {
      // Silently fail - don't show error for auto-create
      console.log('Error auto-creating video conference:', error);
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

  const handleCloseDetail = () => {
    setSelectedSession(null);
    setSessionDetail(null);
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

  const handleSessionClick = async (session: Session) => {
    setSelectedSession(session);
    await fetchSessionDetail(session.bookingId, true); // Pass true to enable auto-create
  };

  const handleUpdateStatus = async (bookingId: string, status: 'completed' | 'cancelled') => {
    if (!bookingId) return;

    try {
      setUpdatingStatus(true);
      
      // Optimistic update: Update local state immediately for instant UI feedback
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.bookingId === bookingId 
            ? { ...session, status: status as any }
            : session
        )
      );
      
      // Update selectedSession if it's the same
      if (selectedSession?.bookingId === bookingId) {
        setSelectedSession({ ...selectedSession, status: status as any });
      }
      
      // Update sessionDetail if it's the same
      if (sessionDetail?.bookingId === bookingId) {
        setSessionDetail({ ...sessionDetail, status: status as any });
      }
      
      // Call API to update status
      const result = await updateSessionStatus(bookingId, status);
      if (result.success) {
        const statusMessages: Record<string, string> = {
          completed: 'Session marked as completed',
          cancelled: 'Session cancelled',
        };
        showSuccess(result.message || statusMessages[status] || `Session status updated to ${status}`);
        
        // Refresh session detail if it's the same session to get latest data
        if (sessionDetail?.bookingId === bookingId) {
          await fetchSessionDetail(bookingId);
        }
        // Refresh sessions list to ensure sync with server
        fetchSessions();
      } else {
        // Revert optimistic update on error
        fetchSessions();
        if (sessionDetail?.bookingId === bookingId) {
          await fetchSessionDetail(bookingId);
        }
        showError(result.error || 'Failed to update session status');
      }
    } catch (error) {
      // Revert optimistic update on error
      fetchSessions();
      if (sessionDetail?.bookingId === bookingId) {
        await fetchSessionDetail(bookingId);
      }
      console.error('Error updating session status:', error);
      showError('Failed to update session status');
    } finally {
      setUpdatingStatus(false);
    }
  };


  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeString;
    }
  };

  const getDaysInWeek = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const startOfWeek = new Date(date.setDate(diff));
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(startOfWeek);
      newDate.setDate(startOfWeek.getDate() + i);
      days.push(newDate);
    }
    return days;
  };

  const getSessionsForDay = (date: Date): Session[] => {
    const dateStr = formatDate(date);
    return sessions.filter(session => {
      if (!session.sessionDate) return false;
      let sessionDateStr = session.sessionDate;
      if (sessionDateStr.includes('T')) {
        sessionDateStr = sessionDateStr.split('T')[0];
      }
      return sessionDateStr === dateStr;
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'scheduled':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  const goToPreviousWeek = () => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
  };

  const goToNextWeek = () => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const daysInWeek = getDaysInWeek(currentDate);
  const weekStart = daysInWeek[0];
  const weekEnd = daysInWeek[6];
  const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Sessions</h2>
            <p className="text-gray-600 mt-1">View and manage your assigned tutoring sessions</p>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-lg font-semibold text-gray-900">{weekRange}</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[600px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2 min-w-[600px]">
          {daysInWeek.map((day, index) => {
            const daySessions = getSessionsForDay(day);
            const dayOfMonth = day.getDate();

            return (
              <div
                key={index}
                className={`min-h-[100px] sm:min-h-[120px] p-1.5 sm:p-2 border rounded-lg ${
                  isToday(day) ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div
                  className={`text-xs sm:text-sm font-semibold mb-1.5 ${
                    isToday(day) ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {dayOfMonth}
                </div>
                <div className="space-y-1">
                  {daySessions.length === 0 ? (
                    <div className="text-[10px] sm:text-xs text-gray-400 text-center py-1">No sessions</div>
                  ) : (
                    daySessions.map((session) => (
                      <button
                        key={session.bookingId}
                        onClick={() => handleSessionClick(session)}
                        className={`w-full text-left p-1.5 sm:p-2 rounded text-[10px] sm:text-xs border transition-all hover:shadow-md ${getStatusColor(session.status)}`}
                      >
                        <div className="font-semibold mb-0.5 truncate">
                          {formatTime(session.startTime)}
                        </div>
                        <div className="truncate text-[9px] sm:text-[10px] opacity-90">
                          {session.childName || 'Student'}
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {session.isOnline ? (
                            <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          ) : (
                            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          )}
                          <span className="text-[9px] sm:text-[10px] truncate">
                            {session.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Detail Panel - Similar to Parent View */}
      {selectedSession && (
        <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-white to-white border-2 border-blue-200 rounded-2xl shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h4 className="text-xl font-bold text-gray-900">Session Details</h4>
              <p className="text-sm text-gray-600 mt-1">Review session information</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Status Update Buttons - Small in header corner */}
              {(() => {
                const currentStatus = sessionDetail?.status || selectedSession?.status;
                if (currentStatus && (currentStatus.toLowerCase() === 'scheduled' || currentStatus.toLowerCase() === 'processing')) {
                  const bookingId = sessionDetail?.bookingId || selectedSession?.bookingId;
                  return (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => bookingId && handleUpdateStatus(bookingId, 'completed')}
                        disabled={updatingStatus || !bookingId}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Mark as Completed"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Complete</span>
                      </button>
                      <button
                        onClick={() => bookingId && handleUpdateStatus(bookingId, 'cancelled')}
                        disabled={updatingStatus || !bookingId}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Cancel Session"
                      >
                        <XCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 p-2 rounded-lg"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : sessionDetail ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Time */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Time</div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-900">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-xs text-gray-500 font-medium">From</div>
                        <div className="font-semibold">{formatTime(sessionDetail.startTime)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-900 ml-7">
                      <div>
                        <div className="text-xs text-gray-500 font-medium">To</div>
                        <div className="font-semibold">{formatTime(sessionDetail.endTime)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Date</div>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <div className="text-sm font-medium">{sessionDetail.sessionDate}</div>
                  </div>
                </div>

                {/* Student */}
                {(sessionDetail.childName || sessionDetail.studentName) && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Student</div>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <User className="w-5 h-5 text-purple-500" />
                      <div className="text-sm font-medium">{sessionDetail.childName || sessionDetail.studentName}</div>
                    </div>
                  </div>
                )}

                {/* Format */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Format</div>
                  <div className="flex items-center space-x-2">
                    {sessionDetail.isOnline ? (
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

                {/* Status */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Status</div>
                  <span
                    className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold capitalize ${
                      sessionDetail.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : sessionDetail.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : sessionDetail.status === 'rescheduled'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {sessionDetail.status}
                  </span>
                </div>

                {/* Package */}
                {sessionDetail.packageName && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Package</div>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                      <div className="text-sm font-medium">{sessionDetail.packageName}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Conference Link (Online Learning Link) */}
              {sessionDetail.isOnline && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-start gap-3">
                      <LinkIcon className="w-5 h-5 text-blue-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Online Learning Link</p>
                        {sessionDetail.videoConferenceLink ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <a
                                href={sessionDetail.videoConferenceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Join Online Session
                              </a>
                              <button
                                onClick={() => handleCopyLink(sessionDetail.videoConferenceLink!)}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to load session details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TutorSessions;


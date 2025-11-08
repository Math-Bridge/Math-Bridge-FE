import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, MapPin, Calendar, X, User, BookOpen, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getTutorMainSessions, getTutorSubstituteSessions, getSessionByIdForTutor, updateSessionStatus, Session } from '../../../services/api';
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
  const [sessionType, setSessionType] = useState<'main' | 'substitute'>('main');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [user?.id, sessionType, currentDate]);

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = sessionType === 'main' 
        ? await getTutorMainSessions()
        : await getTutorSubstituteSessions();

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

  const fetchSessionDetail = async (bookingId: string) => {
    try {
      setLoadingDetail(true);
      const result = await getSessionByIdForTutor(bookingId);
      if (result.success && result.data) {
        setSessionDetail(result.data);
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
    await fetchSessionDetail(session.bookingId);
  };

  const handleUpdateStatus = async (status: 'completed' | 'cancelled') => {
    if (!selectedSession) return;

    try {
      setUpdatingStatus(true);
      const result = await updateSessionStatus(selectedSession.bookingId, status);
      if (result.success) {
        showSuccess(`Session marked as ${status}`);
        setSelectedSession(null);
        setSessionDetail(null);
        fetchSessions();
      } else {
        showError(result.error || 'Failed to update session status');
      }
    } catch (error) {
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

  const formatDateTime = (dateString: string, timeString: string): string => {
    try {
      const date = new Date(dateString);
      const time = new Date(timeString);
      return `${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } catch {
      return `${dateString} ${timeString}`;
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
            <p className="text-gray-600 mt-1">View and manage your tutoring sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSessionType('main')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sessionType === 'main'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Main Sessions
            </button>
            <button
              onClick={() => setSessionType('substitute')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sessionType === 'substitute'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Substitute Sessions
            </button>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {daysInWeek.map((day, index) => {
            const daySessions = getSessionsForDay(day);
            const dayOfMonth = day.getDate();

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border rounded-lg ${
                  isToday(day) ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-2 ${
                    isToday(day) ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {dayOfMonth}
                </div>
                <div className="space-y-1">
                  {daySessions.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-2">No sessions</div>
                  ) : (
                    daySessions.map((session) => (
                      <button
                        key={session.bookingId}
                        onClick={() => handleSessionClick(session)}
                        className={`w-full text-left p-2 rounded text-xs border transition-colors hover:shadow-md ${getStatusColor(session.status)}`}
                      >
                        <div className="font-semibold mb-1">
                          {formatTime(session.startTime)}
                        </div>
                        <div className="truncate text-[10px] opacity-90">
                          {session.childName || 'Student'}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {session.isOnline ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <MapPin className="w-3 h-3" />
                          )}
                          <span className="text-[10px]">
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

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Session Details</h3>
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setSessionDetail(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : sessionDetail ? (
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(sessionDetail.status)}`}>
                      {getStatusIcon(sessionDetail.status)}
                      <span className="font-semibold capitalize">{sessionDetail.status}</span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Date & Time</p>
                        <p className="font-semibold text-gray-900">
                          {formatDateTime(sessionDetail.sessionDate, sessionDetail.startTime)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Duration: {formatTime(sessionDetail.startTime)} - {formatTime(sessionDetail.endTime)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {sessionDetail.isOnline ? (
                        <Video className="w-5 h-5 text-gray-400 mt-1" />
                      ) : (
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold text-gray-900">
                          {sessionDetail.isOnline ? 'Online' : 'Offline'}
                        </p>
                        {sessionDetail.isOnline && sessionDetail.videoCallPlatform && (
                          <p className="text-sm text-gray-600 mt-1">
                            Platform: {sessionDetail.videoCallPlatform}
                          </p>
                        )}
                        {!sessionDetail.isOnline && sessionDetail.offlineAddress && (
                          <p className="text-sm text-gray-600 mt-1">
                            {sessionDetail.offlineAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Student</p>
                        <p className="font-semibold text-gray-900 text-lg">
                          {sessionDetail.childName || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Package Info */}
                  {sessionDetail.packageName && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Package</p>
                          <p className="font-semibold text-gray-900">
                            {sessionDetail.packageName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {sessionDetail.status === 'processing' && (
                    <div className="border-t border-gray-200 pt-4 flex gap-3">
                      <button
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={updatingStatus}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('cancelled')}
                        disabled={updatingStatus}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <XCircle className="w-5 h-5" />
                        Cancel Session
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Failed to load session details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorSessions;


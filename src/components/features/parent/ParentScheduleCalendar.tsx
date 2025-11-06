import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, MapPin, User, Calendar } from 'lucide-react';
import { getParentSessions, Session } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

const ParentScheduleCalendar: React.FC = () => {
  const { showError } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchSessions();
  }, [user?.id]);

  const fetchSessions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // BE gets parentId from JWT token, no need to pass it
      const result = await getParentSessions();
      if (result.success && result.data) {
        setSessions(result.data);
      } else {
        showError(result.error || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add next month's days to fill the grid
    const totalCells = 42; // 6 rows * 7 days
    const remainingDays = totalCells - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
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
      if (sessionDateStr.includes(' ')) {
        sessionDateStr = sessionDateStr.split(' ')[0];
      }
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
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'scheduled':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const upcomingSessions = sessions.filter(s => {
    const sessionDate = new Date(s.startTime);
    return sessionDate >= new Date() && s.status === 'scheduled';
  }).length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span>Study Schedule</span>
          </h1>
          <p className="text-gray-600 mt-2">Manage your study schedule</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{upcomingSessions}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedSessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {daysInMonth.map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const isCurrentMonthDay = isCurrentMonth(day);

              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] p-2 border rounded-lg flex flex-col
                    ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'}
                    ${isToday(day) ? 'border-blue-500 border-2' : 'border-gray-200'}
                  `}
                >
                  <div className={`text-sm font-semibold mb-1 ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[100px]">
                    {daySessions.length === 0 ? (
                      <div className="text-[9px] text-gray-400 text-center py-1">No sessions</div>
                    ) : (
                      daySessions.map((session) => (
                        <div
                          key={session.bookingId}
                          className={`text-[10px] px-1.5 py-1 rounded mb-0.5 border ${getStatusColor(session.status)}`}
                          title={`${formatTime(session.startTime)} - ${formatTime(session.endTime)}${session.studentName || session.childName ? ` | ${session.studentName || session.childName}` : ''}`}
                        >
                          <div className="font-semibold truncate">
                            {formatTime(session.startTime)}
                          </div>
                          {(session.studentName || session.childName) && (
                            <div className="truncate text-[9px] opacity-90">
                              {session.studentName || session.childName}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            {session.isOnline ? (
                              <Video className="w-2.5 h-2.5" />
                            ) : (
                              <MapPin className="w-2.5 h-2.5" />
                            )}
                            <span className="text-[8px] truncate">
                              {session.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentScheduleCalendar;


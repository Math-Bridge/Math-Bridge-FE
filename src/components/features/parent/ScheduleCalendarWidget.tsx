import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, MapPin, Calendar } from 'lucide-react';
import { getParentSessions, Session } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

interface ScheduleCalendarWidgetProps {
  compact?: boolean;
}

const ScheduleCalendarWidget: React.FC<ScheduleCalendarWidgetProps> = ({ compact = true }) => {
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
        // Don't show error for widget, just log it
        console.warn('Failed to load sessions:', result.error);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInWeek = (date: Date): Date[] => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Get Sunday of this week
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
    setCurrentDate(new Date());
  };

  const daysInWeek = getDaysInWeek(currentDate);
  
  // Calculate upcoming sessions for the current week
  const upcomingSessionsThisWeek = sessions.filter(s => {
    const sessionDate = new Date(s.startTime);
    const today = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return sessionDate >= today && 
           sessionDate >= weekStart && 
           sessionDate < weekEnd && 
           s.status === 'scheduled';
  }).length;
  
  // Total upcoming sessions (all future)
  const upcomingSessions = sessions.filter(s => {
    const sessionDate = new Date(s.startTime);
    return sessionDate >= new Date() && s.status === 'scheduled';
  }).length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (compact) {
    // Compact widget view
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            Schedule
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Week view */}
        <div className="space-y-1">
          {/* First row - 4 days */}
          <div className="grid grid-cols-4 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {daysInWeek.slice(0, 4).map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const dayOfMonth = day.getDate();

              return (
                <div
                  key={index}
                  className={`
                    min-h-[60px] p-1 border rounded text-xs flex flex-col
                    ${isToday(day) ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'}
                  `}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                    {dayOfMonth}
                  </div>
                  <div className="space-y-0.5 flex-1 overflow-y-auto">
                    {daySessions.length === 0 ? (
                      <div className="text-[9px] text-gray-400 text-center py-1">No sess</div>
                    ) : (
                      <>
                        {daySessions.slice(0, 2).map((session) => (
                          <div
                            key={session.bookingId}
                            className={`text-[9px] px-1 py-0.5 rounded border ${getStatusColor(session.status)}`}
                            title={`${formatTime(session.startTime)} - ${session.tutorName || 'Tutor'}`}
                          >
                            <div className="truncate font-semibold">
                              {formatTime(session.startTime)}
                            </div>
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-[8px] text-gray-500 text-center">
                            +{daySessions.length - 2}
                          </div>
                        )}
                        {/* Show count for compact view */}
                        {daySessions.length > 0 && (
                          <div className="text-[8px] text-gray-500 text-center pt-0.5 border-t border-gray-200 mt-0.5">
                            {daySessions.length}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Second row - 3 days */}
          <div className="grid grid-cols-3 gap-1">
            {/* Day headers */}
            {['Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {daysInWeek.slice(4, 7).map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const dayOfMonth = day.getDate();

              return (
                <div
                  key={index + 4}
                  className={`
                    min-h-[60px] p-1 border rounded text-xs flex flex-col
                    ${isToday(day) ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'}
                  `}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                    {dayOfMonth}
                  </div>
                  <div className="space-y-0.5 flex-1 overflow-y-auto">
                    {daySessions.length === 0 ? (
                      <div className="text-[9px] text-gray-400 text-center py-1">No sess</div>
                    ) : (
                      <>
                        {daySessions.slice(0, 2).map((session) => (
                          <div
                            key={session.bookingId}
                            className={`text-[9px] px-1 py-0.5 rounded border ${getStatusColor(session.status)}`}
                            title={`${formatTime(session.startTime)} - ${session.tutorName || 'Tutor'}`}
                          >
                            <div className="truncate font-semibold">
                              {formatTime(session.startTime)}
                            </div>
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-[8px] text-gray-500 text-center">
                            +{daySessions.length - 2}
                          </div>
                        )}
                        {/* Show count for compact view */}
                        {daySessions.length > 0 && (
                          <div className="text-[8px] text-gray-500 text-center pt-0.5 border-t border-gray-200 mt-0.5">
                            {daySessions.length}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Upcoming sessions this week</span>
            <span className="font-semibold text-blue-600">{upcomingSessionsThisWeek}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full view (same as compact but with more details)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="w-6 h-6 text-blue-600 mr-2" />
          Schedule
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week view */}
      <div className="space-y-2">
        {/* First row - 4 days */}
        <div className="grid grid-cols-4 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {daysInWeek.slice(0, 4).map((day, index) => {
            const daySessions = getSessionsForDay(day);
            const dayOfMonth = day.getDate();

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] p-2 border rounded-lg flex flex-col
                  ${isToday(day) ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'}
                `}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                  {dayOfMonth}
                </div>
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[100px]">
                  {daySessions.length === 0 ? (
                    <div className="text-[9px] text-gray-400 text-center py-1">No sess</div>
                  ) : (
                    daySessions.map((session) => (
                      <div
                        key={session.bookingId}
                        className={`text-[10px] px-1.5 py-1 rounded mb-0.5 border ${getStatusColor(session.status)}`}
                        title={`${formatTime(session.startTime)} - ${formatTime(session.endTime)}${session.tutorName ? ` | ${session.tutorName}` : ''}`}
                      >
                        <div className="font-semibold truncate">
                          {formatTime(session.startTime)}
                        </div>
                        {session.tutorName && (
                          <div className="truncate text-[9px] opacity-90">
                            {session.tutorName}
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
                {/* Session count indicator */}
                {daySessions.length > 0 && (
                  <div className="mt-auto pt-1 border-t border-gray-200">
                    <div className="text-[9px] text-gray-500 text-center">
                      {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}
                    </div>
                  </div>
                )}
                {/* Navigation arrows for each day */}
                <div className="flex items-center justify-center gap-1 mt-1 pt-1 border-t border-gray-100">
                  <button className="text-[8px] text-gray-400 hover:text-gray-600 p-0.5">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button className="text-[8px] text-gray-400 hover:text-gray-600 p-0.5">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Second row - 3 days */}
        <div className="grid grid-cols-3 gap-2">
          {/* Day headers */}
          {['Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {daysInWeek.slice(4, 7).map((day, index) => {
            const daySessions = getSessionsForDay(day);
            const dayOfMonth = day.getDate();

            return (
              <div
                key={index + 4}
                className={`
                  min-h-[120px] p-2 border rounded-lg flex flex-col
                  ${isToday(day) ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'}
                `}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                  {dayOfMonth}
                </div>
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[100px]">
                  {daySessions.length === 0 ? (
                    <div className="text-[9px] text-gray-400 text-center py-1">No sess</div>
                  ) : (
                    daySessions.map((session) => (
                      <div
                        key={session.bookingId}
                        className={`text-[10px] px-1.5 py-1 rounded mb-0.5 border ${getStatusColor(session.status)}`}
                        title={`${formatTime(session.startTime)} - ${formatTime(session.endTime)}${session.tutorName ? ` | ${session.tutorName}` : ''}`}
                      >
                        <div className="font-semibold truncate">
                          {formatTime(session.startTime)}
                        </div>
                        {session.tutorName && (
                          <div className="truncate text-[9px] opacity-90">
                            {session.tutorName}
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
                {/* Session count indicator */}
                {daySessions.length > 0 && (
                  <div className="mt-auto pt-1 border-t border-gray-200">
                    <div className="text-[9px] text-gray-500 text-center">
                      {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}
                    </div>
                  </div>
                )}
                {/* Navigation arrows for each day */}
                <div className="flex items-center justify-center gap-1 mt-1 pt-1 border-t border-gray-100">
                  <button className="text-[8px] text-gray-400 hover:text-gray-600 p-0.5">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button className="text-[8px] text-gray-400 hover:text-gray-600 p-0.5">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Upcoming sessions this week</span>
          <span className="font-semibold text-blue-600">{upcomingSessionsThisWeek}</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendarWidget;


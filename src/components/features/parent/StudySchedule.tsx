import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Monitor, MapPin, AlertCircle, X, User } from 'lucide-react';
import {
  getParentSessions,
  Session,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

const StudySchedule: React.FC = () => {
  const { showError } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getParentSessions();
      if (res.success && res.data) {
        setSessions(res.data);
      } else {
        const errorMsg = res.error || 'Failed to load sessions';
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
  };

  const handleCloseDetail = () => {
    setSelectedSession(null);
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
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

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-t-3 border-blue-500"></div>
            <Calendar className="w-5 h-5 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="mt-4 text-gray-600 font-medium">Loading study schedule...</span>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="p-8 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
        <div className="flex items-center space-x-3 text-red-700">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Error Loading Schedule</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-white border-b border-gray-100">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Study Schedule</h3>
            <p className="text-sm text-gray-600 mt-2">View your children's study schedule</p>
          </div>
        </div>

        <div className="p-6">
          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">No sessions</h4>
              <p className="text-gray-600 max-w-md mx-auto">
                Your children don't have any study sessions scheduled yet.
              </p>
            </div>
          ) : (
            <>
              {/* Calendar Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPreviousWeek}
                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm"
                    title="Previous week"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDatePickerChange(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-gray-700"
                  />
                  <button
                    onClick={goToNextWeek}
                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm"
                    title="Next week"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all duration-200 text-sm font-semibold"
                  >
                    Today
                  </button>
                </div>
                <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-4 py-2.5 rounded-xl">
                  {daysInWeek[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
                  {daysInWeek[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Weekly Calendar Grid - 2 Rows Layout */}
              <div className="w-full">
                {/* First Row: Sunday - Wednesday (4 days) */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {daysInWeek.slice(0, 4).map((day, index) => {
                    const daySessions = getSessionsForDay(day);
                    const dayOfMonth = day.getDate();
                    const isCurrentDay = isToday(day);
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday'];

                    return (
                      <div key={index} className="flex flex-col">
                        {/* Day header */}
                        <div className="text-center py-2 mb-2">
                          <div className="font-bold text-gray-900 text-sm">{dayNames[index]}</div>
                        </div>
                        {/* Day cell */}
                        <div
                          className={`
                            min-h-[250px] p-3 rounded-lg flex flex-col transition-all duration-200 w-full
                            ${isCurrentDay
                              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 shadow-md'
                              : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }
                          `}
                        >
                          <div className={`
                            text-lg font-bold mb-3 w-8 h-8 flex items-center justify-center rounded-lg
                            ${isCurrentDay ? 'bg-blue-600 text-white' : 'text-gray-900'}
                          `}>
                            {dayOfMonth}
                          </div>
                          <div className="space-y-2 flex-1 overflow-y-auto max-h-[200px] custom-scrollbar">
                            {daySessions.length === 0 ? (
                              <div className="text-xs text-gray-400 text-center py-8">
                                <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                <span>No sessions</span>
                              </div>
                            ) : (
                              daySessions.map((session) => (
                                <div
                                  key={session.bookingId}
                                  className={`
                                    group relative text-xs px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                                    ${getStatusColor(session.status)}
                                    ${selectedSession?.bookingId === session.bookingId ? 'ring-2 ring-blue-500 scale-105 shadow-md' : ''}
                                  `}
                                  onClick={() => handleSessionClick(session)}
                                  title={`Click to view details: ${formatTime(session.startTime)} - ${formatTime(session.endTime)}`}
                                >
                                  <div className="font-semibold flex items-center gap-1.5 mb-1.5">
                                    <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                    <span className="truncate">{formatTime(session.startTime)}</span>
                                  </div>
                                  <div className="text-[10px] opacity-80 ml-5 mb-2">to {formatTime(session.endTime)}</div>
                                  {session.tutorName && (
                                    <div className="flex items-center gap-1 mb-1.5">
                                      <User className="w-3 h-3 opacity-70" />
                                      <span className="text-[10px] truncate">{session.tutorName}</span>
                                    </div>
                                  )}
                                  {(session.childName || session.studentName) && (
                                    <div className="text-[10px] opacity-80 ml-5 mb-2">
                                      Student: {session.childName || session.studentName}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {session.isOnline ? (
                                      <span className="flex items-center gap-1 bg-white bg-opacity-60 px-1.5 py-0.5 rounded text-[10px] font-medium" title="Online">
                                        <Monitor className="w-2.5 h-2.5" />
                                        <span>Online</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 bg-white bg-opacity-60 px-1.5 py-0.5 rounded text-[10px] font-medium" title="In-Person">
                                        <MapPin className="w-2.5 h-2.5" />
                                        <span>In-Person</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-lg pointer-events-none"></div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Second Row: Thursday - Saturday (3 days) */}
                <div className="grid grid-cols-3 gap-3">
                  {daysInWeek.slice(4, 7).map((day, index) => {
                    const daySessions = getSessionsForDay(day);
                    const dayOfMonth = day.getDate();
                    const isCurrentDay = isToday(day);
                    const dayNames = ['Thursday', 'Friday', 'Saturday'];

                    return (
                      <div key={index + 4} className="flex flex-col">
                        {/* Day header */}
                        <div className="text-center py-2 mb-2">
                          <div className="font-bold text-gray-900 text-sm">{dayNames[index]}</div>
                        </div>
                        {/* Day cell */}
                        <div
                          className={`
                            min-h-[250px] p-3 rounded-lg flex flex-col transition-all duration-200 w-full
                            ${isCurrentDay
                              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 shadow-md'
                              : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }
                          `}
                        >
                          <div className={`
                            text-lg font-bold mb-3 w-8 h-8 flex items-center justify-center rounded-lg
                            ${isCurrentDay ? 'bg-blue-600 text-white' : 'text-gray-900'}
                          `}>
                            {dayOfMonth}
                          </div>
                          <div className="space-y-2 flex-1 overflow-y-auto max-h-[200px] custom-scrollbar">
                            {daySessions.length === 0 ? (
                              <div className="text-xs text-gray-400 text-center py-8">
                                <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                <span>No sessions</span>
                              </div>
                            ) : (
                              daySessions.map((session) => (
                                <div
                                  key={session.bookingId}
                                  className={`
                                    group relative text-xs px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                                    ${getStatusColor(session.status)}
                                    ${selectedSession?.bookingId === session.bookingId ? 'ring-2 ring-blue-500 scale-105 shadow-md' : ''}
                                  `}
                                  onClick={() => handleSessionClick(session)}
                                  title={`Click to view details: ${formatTime(session.startTime)} - ${formatTime(session.endTime)}`}
                                >
                                  <div className="font-semibold flex items-center gap-1.5 mb-1.5">
                                    <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                    <span className="truncate">{formatTime(session.startTime)}</span>
                                  </div>
                                  <div className="text-[10px] opacity-80 ml-5 mb-2">to {formatTime(session.endTime)}</div>
                                  {session.tutorName && (
                                    <div className="flex items-center gap-1 mb-1.5">
                                      <User className="w-3 h-3 opacity-70" />
                                      <span className="text-[10px] truncate">{session.tutorName}</span>
                                    </div>
                                  )}
                                  {(session.childName || session.studentName) && (
                                    <div className="text-[10px] opacity-80 ml-5 mb-2">
                                      Student: {session.childName || session.studentName}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {session.isOnline ? (
                                      <span className="flex items-center gap-1 bg-white bg-opacity-60 px-1.5 py-0.5 rounded text-[10px] font-medium" title="Online">
                                        <Monitor className="w-2.5 h-2.5" />
                                        <span>Online</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 bg-white bg-opacity-60 px-1.5 py-0.5 rounded text-[10px] font-medium" title="In-Person">
                                        <MapPin className="w-2.5 h-2.5" />
                                        <span>In-Person</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-lg pointer-events-none"></div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Session Details Panel */}
              {selectedSession && (
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-white to-white border-2 border-blue-200 rounded-2xl shadow-lg">
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
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
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
                  <div className="mt-6 flex items-center justify-end">
                    <button
                      onClick={handleCloseDetail}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="font-bold text-gray-900 text-base">Legend</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded-lg shadow-sm"></div>
                    <span className="text-gray-700 font-medium">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 border border-green-300 rounded-lg"></div>
                    <span className="text-gray-700 font-medium">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 border border-red-300 rounded-lg"></div>
                    <span className="text-gray-700 font-medium">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-100 border border-yellow-300 rounded-lg"></div>
                    <span className="text-gray-700 font-medium">Rescheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 font-medium">Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span className="text-gray-700 font-medium">In-Person</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Click on any session to view full details.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
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
      `}</style>
    </>
  );
};

export default StudySchedule;


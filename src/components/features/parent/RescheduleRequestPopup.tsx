import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  X, 
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { createRescheduleRequest, CreateRescheduleRequest, getSessionsByChildId, Session } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface RescheduleRequestPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback when request is successfully created
  currentSession: {
    bookingId: string; // Required: bookingId from session
    date: string;
    time: string;
    topic?: string;
  };
  tutorName: string;
  childId?: string; // Optional: childId to fetch existing sessions
}

// Note: Parent only provides reason. Staff will arrange the new schedule.

const RescheduleRequestPopup: React.FC<RescheduleRequestPopupProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentSession,
  tutorName,
  childId
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestedDate, setRequestedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [existingSessions, setExistingSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  // Valid start times: 16:00, 17:30, 19:00, 20:30
  const VALID_START_TIMES = ['16:00', '17:30', '19:00', '20:30'];
  
  // Calculate end time (start time + 90 minutes)
  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + 90);
    const endHours = startDate.getHours().toString().padStart(2, '0');
    const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  };

  // Generate weekly schedule (7 days starting from today, excluding past dates and past time slots)
  const generateWeeklySchedule = () => {
    // Use local date to avoid timezone issues
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Start from today + (selectedWeek * 7) days
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (selectedWeek * 7));
    
    const weekDays = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Generate 7 days, but only include dates from today onwards
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Only include dates that are today or in the future
      if (date >= today) {
        // Format date as YYYY-MM-DD in local timezone
        const dateYear = date.getFullYear();
        const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
        const dateDay = String(date.getDate()).padStart(2, '0');
        const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;
        
        // Check if this is today
        const isToday = date.getTime() === today.getTime();
        
        // Filter slots: if today, only include future time slots
        const availableSlots = VALID_START_TIMES.filter(time => {
          if (!isToday) return true; // All slots available for future dates
          
          // For today, check if the time slot is in the future
          const [hours, minutes] = time.split(':').map(Number);
          const slotTime = hours * 60 + minutes; // Convert to minutes
          const currentTime = currentHour * 60 + currentMinute;
          
          return slotTime > currentTime; // Only include slots that haven't passed yet
        }).map(time => ({
          time,
          endTime: calculateEndTime(time),
          id: `${dateStr}-${time}`,
        }));
        
        // Only add day if it has available slots
        if (availableSlots.length > 0) {
          weekDays.push({
            date: dateStr,
            dayName: dayNames[date.getDay()],
            dayNumber: date.getDate(),
            isPast: false,
            slots: availableSlots
          });
        }
      }
    }
    
    return weekDays;
  };;

  const weeklySchedule = generateWeeklySchedule();

  // Fetch existing sessions when popup opens
  React.useEffect(() => {
    if (isOpen && childId) {
      fetchExistingSessions();
    } else {
      setExistingSessions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, childId]);

  const fetchExistingSessions = async () => {
    if (!childId) return;
    
    try {
      setLoadingSessions(true);
      const result = await getSessionsByChildId(childId);
      if (result.success && result.data) {
        // Filter out the current session being rescheduled and only get scheduled/completed sessions
        const sessions = result.data.filter((s: Session) => 
          s.bookingId !== currentSession.bookingId && 
          (s.status === 'scheduled' || s.status === 'completed')
        );
        setExistingSessions(sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Don't show error - just continue without session data
    } finally {
      setLoadingSessions(false);
    }
  };

  // Check if a slot is in the past
  const isSlotInPast = (date: string, time: string): boolean => {
    const [year, month, day] = date.split('-').map(Number);
    const slotDate = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If date is in the past, slot is in past
    if (slotDate < today) {
      return true;
    }
    
    // If date is today, check if time is in the past
    if (slotDate.getTime() === today.getTime()) {
      const [hours, minutes] = time.split(':').map(Number);
      const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      return slotDateTime <= now;
    }
    
    return false;
  };

  // Check if a slot conflicts with existing sessions
  const isSlotBooked = (date: string, time: string): boolean => {
    // Check if this is the same time slot as the current session being rescheduled
    // Prevent rescheduling to the same time slot
    if (currentSession.date === date && currentSession.time === time) {
      return true; // Block the current time slot
    }
    
    if (existingSessions.length === 0) return false;
    
    // Create slot start and end times
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 90);
    
    return existingSessions.some((session) => {
      // Exclude the current session being rescheduled from conflict checking
      if (session.bookingId === currentSession.bookingId) return false;
      
      if (!session.sessionDate || !session.startTime || !session.endTime) return false;
      
      // Parse session date
      let sessionDateStr = session.sessionDate;
      if (sessionDateStr.includes('T')) {
        sessionDateStr = sessionDateStr.split('T')[0];
      }
      if (sessionDateStr !== date) return false;
      
      // Parse session start and end times
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(session.endTime);
      
      // Check for time overlap: slot overlaps if it starts before session ends and ends after session starts
      return (slotStart < sessionEnd && slotEnd > sessionStart);
    });
  };;

  const handleDateTimeSelect = (date: string, time: string) => {
    // Parse selected date (YYYY-MM-DD format)
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    
    // Get current date and time in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Don't allow selecting past dates
    if (selectedDate < today) {
      showError('Cannot select past dates');
      return;
    }
    
    // If selecting today, check if the time slot is in the future
    if (selectedDate.getTime() === today.getTime()) {
      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      if (slotTime <= now) {
        showError('Cannot select time slots in the past');
        return;
      }
    }
    
    // Don't allow selecting booked slots (including current session time)
    if (isSlotBooked(date, time)) {
      showError('This time slot is already booked');
      return;
    }
    
    setRequestedDate(date);
    setStartTime(time);
  };;

  const reasonOptions = [
    t('personalEmergency'),
    t('familyCommitment'),
    t('healthIssue'),
    t('workConflict'),
    t('transportationIssue'),
    t('other')
  ];

  const handleConfirm = async () => {
    if (!currentSession.bookingId) {
      showError('Session booking ID is required');
      return;
    }

    // Validate required fields
    if (!requestedDate) {
      showError('Please select a date for the rescheduled session');
      return;
    }

    if (!startTime) {
      showError('Please select a start time for the rescheduled session');
      return;
    }

    if (!VALID_START_TIMES.includes(startTime)) {
      showError('Invalid time slot. Please select 16:00, 17:30, 19:00, or 20:30');
      return;
    }

    // Validate that selected date and time are not in the past
    const [year, month, day] = requestedDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (selectedDate < today) {
      showError('Cannot reschedule to a past date');
      return;
    }
    
    // If selecting today, check if the time slot is in the future
    if (selectedDate.getTime() === today.getTime()) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      if (slotDateTime <= now) {
        showError('Cannot reschedule to a time slot in the past');
        return;
      }
    }

    if (!reason || (reason === t('other') && !notes.trim())) {
      showError('Please provide a reason for rescheduling');
      return;
    }

    setIsSubmitting(true);
    try {
      const endTime = calculateEndTime(startTime);
      const requestData: CreateRescheduleRequest = {
        bookingId: currentSession.bookingId,
        requestedDate: requestedDate, // Required: YYYY-MM-DD format
        startTime: startTime, // Required: HH:mm format
        endTime: endTime, // Required: HH:mm format (startTime + 90 minutes)
        reason: reason === t('other') ? notes : reason,
      };

      const result = await createRescheduleRequest(requestData);
      
      if (result.success) {
        showSuccess(result.data?.message || 'Reschedule request submitted successfully. Staff will review and approve.');
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Improve error message for reschedule count limit
        const errorMsg = result.error || 'Failed to submit reschedule request';
        if (errorMsg.includes('No reschedule attempts left') || errorMsg.includes('reschedule attempts')) {
          showError(errorMsg);
        } else {
          showError(errorMsg);
        }
      }
} catch (error: unknown) {
      console.error('Error creating reschedule request:', error);
const errorMessage = error instanceof Error ? error.message : 'Failed to submit reschedule request';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setNotes('');
    setRequestedDate('');
    setStartTime('');
    setSelectedWeek(0);
    setExistingSessions([]);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Request Reschedule</h2>
              <p className="text-gray-600 mt-1">Change your session time</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Current Session Info */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Current Session</h3>
              <p className="text-sm text-gray-600">
                {currentSession.topic} • {new Date(currentSession.date).toLocaleDateString()} at {currentSession.time}
              </p>
              <p className="text-sm text-gray-500">Tutor: {tutorName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Date and Time Selection - Calendar View */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select New Date & Time</h3>
              
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">Select Week</h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                    disabled={selectedWeek === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600 font-medium">
                    Week {selectedWeek + 1}
                  </span>
                  <button
                    onClick={() => setSelectedWeek(selectedWeek + 1)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              {loadingSessions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading available slots...</p>
                </div>
              ) : weeklySchedule.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No available dates in this week</p>
                  <p className="text-sm mt-2">Please select a different week</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 gap-3 ${
                  weeklySchedule.length === 1 ? 'md:grid-cols-1' :
                  weeklySchedule.length === 2 ? 'md:grid-cols-2' :
                  weeklySchedule.length === 3 ? 'md:grid-cols-3' :
                  weeklySchedule.length === 4 ? 'md:grid-cols-4' :
                  weeklySchedule.length === 5 ? 'md:grid-cols-5' :
                  weeklySchedule.length === 6 ? 'md:grid-cols-6' :
                  'md:grid-cols-7'
                }`}>
                  {weeklySchedule.map((day) => (
                    <div key={day.date} className="space-y-2">
                      <div className="text-center">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {day.dayName}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      
                      <div className="space-y-1.5">
                        {day.slots.map((slot) => {
                          const isSelected = requestedDate === day.date && startTime === slot.time;
                          const isBooked = isSlotBooked(day.date, slot.time);
                          const isPast = isSlotInPast(day.date, slot.time);
                          const isDisabled = isBooked || isPast;
                          
                          return (
                            <button
                              key={slot.id}
                              onClick={() => !isDisabled && handleDateTimeSelect(day.date, slot.time)}
                              disabled={isDisabled}
                              className={`w-full p-2 text-xs rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : isDisabled
                                  ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                  : 'bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700'
                              }`}
                              title={isPast ? 'This time slot is in the past' : isBooked ? 'This time slot is already booked' : ''}
                            >
                              <div className="flex items-center justify-center space-x-1">
                                <Clock className={`w-3 h-3 ${isBooked ? 'opacity-50' : ''}`} />
                                <span className="font-medium">{slot.time}</span>
                              </div>
                              <div className={`text-[10px] mt-0.5 ${isBooked ? 'opacity-50' : 'opacity-75'}`}>
                                {slot.endTime}
                              </div>
                              {isBooked && (
                                <div className="text-[9px] mt-0.5 opacity-60 line-through">
                                  Booked
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Schedule Preview */}
              {requestedDate && startTime && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-900">Selected Schedule</p>
                  </div>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{new Date(requestedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                    {' '}at <span className="font-medium">{startTime} - {calculateEndTime(startTime)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Reason Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('whyReschedule')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rescheduling this session. Our staff will review and arrange a new schedule for you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reasonOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setReason(option)}
                    className={`p-4 text-left rounded-lg border transition-colors ${
                      reason === option
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {reason === t('other') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify your reason
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('pleaseSpecify')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || !requestedDate || !startTime || !reason || (reason === t('other') && !notes.trim())}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{t('submitRequest')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleRequestPopup;

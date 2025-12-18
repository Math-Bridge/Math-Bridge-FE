import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  X, 
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  respondToRescheduleOrRefund,
  getSessionById,
  Session,
  getSessionsByChildId,
  getContractById,
  getTutorAvailabilitiesByTutorId,
  TutorAvailability,
  createMakeUpSession,
  getRescheduleRequests,
  RescheduleRequest
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface RescheduleOrRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  notification: {
    id: string;
    bookingId: string;
    contractId: string;
    message: string;
  };
  childId?: string;
}

const RescheduleOrRefundModal: React.FC<RescheduleOrRefundModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  notification,
  childId
}) => {
  const { showSuccess, showError } = useToast();
  const [choice, setChoice] = useState<'makeup' | 'refund' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [originalRequest, setOriginalRequest] = useState<RescheduleRequest | null>(null);
  
  // Makeup session fields
  const [requestedDate, setRequestedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [existingSessions, setExistingSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [tutorAvailabilities, setTutorAvailabilities] = useState<{
    mainTutor: TutorAvailability[];
    subTutor: TutorAvailability[];
  }>({ mainTutor: [], subTutor: [] });
  const [loadingAvailabilities, setLoadingAvailabilities] = useState(false);
  
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

  // Fetch session info and original request when modal opens
  useEffect(() => {
    if (isOpen && notification.bookingId) {
      fetchSessionInfo();
      fetchOriginalRequest();
    }
  }, [isOpen, notification.bookingId]);

  // Fetch tutor availabilities and existing sessions when makeup is selected
  useEffect(() => {
    if (isOpen && choice === 'makeup' && notification.contractId) {
      if (childId) {
        fetchExistingSessions();
      }
      fetchTutorAvailabilities();
    }
  }, [isOpen, choice, notification.contractId, childId]);

  const fetchSessionInfo = async () => {
    try {
      setLoadingSession(true);
      const result = await getSessionById(notification.bookingId);
      if (result.success && result.data) {
        setSessionInfo(result.data);
      } else {
        showError('Failed to load session information');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      showError('Failed to load session information');
    } finally {
      setLoadingSession(false);
    }
  };

  const fetchOriginalRequest = async () => {
    try {
      const result = await getRescheduleRequests();
      if (result.success && result.data) {
        // Find request by bookingId - could be pending or approved
        const request = result.data.find(
          (r: RescheduleRequest) => r.bookingId === notification.bookingId
        );
        if (request) {
          setOriginalRequest(request);
        }
      }
    } catch (error) {
      console.error('Error fetching original reschedule request:', error);
      // Don't show error - it's optional
    }
  };


  const fetchExistingSessions = async () => {
    if (!childId) return;
    
    try {
      setLoadingSessions(true);
      const result = await getSessionsByChildId(childId);
      if (result.success && result.data) {
        const sessions = result.data.filter((s: Session) => 
          s.bookingId !== notification.bookingId && 
          (s.status === 'scheduled' || s.status === 'completed')
        );
        setExistingSessions(sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchTutorAvailabilities = async () => {
    if (!notification.contractId) return;
    
    try {
      setLoadingAvailabilities(true);
      const contractResult = await getContractById(notification.contractId);
      if (contractResult.success && contractResult.data) {
        const contractData = contractResult.data as any;
        const mainTutorId = contractData.MainTutorId || contractData.mainTutorId || contractData.main_tutor_id;
        const subTutor1Id = contractData.SubstituteTutor1Id || contractData.substituteTutor1Id || contractData.substitute_tutor1_id;
        
        const [mainTutorAvail, subTutorAvail] = await Promise.all([
          mainTutorId ? getTutorAvailabilitiesByTutorId(mainTutorId) : Promise.resolve({ success: false, data: [] }),
          subTutor1Id ? getTutorAvailabilitiesByTutorId(subTutor1Id) : Promise.resolve({ success: false, data: [] })
        ]);
        
        setTutorAvailabilities({
          mainTutor: mainTutorAvail.success && mainTutorAvail.data ? mainTutorAvail.data : [],
          subTutor: subTutorAvail.success && subTutorAvail.data ? subTutorAvail.data : []
        });
      }
    } catch (error) {
      console.error('Error fetching tutor availabilities:', error);
    } finally {
      setLoadingAvailabilities(false);
    }
  };

  // Check if a slot is available for both tutors
  const isSlotAvailableForTutors = (date: string, time: string): boolean => {
    if (!notification.contractId) return true;
    
    if (tutorAvailabilities.mainTutor.length === 0 && tutorAvailabilities.subTutor.length === 0) {
      return true;
    }
    
    const [year, month, day] = date.split('-').map(Number);
    const slotDate = new Date(year, month - 1, day);
    const dayOfWeek = slotDate.getDay();
    const dayBitmask = dayOfWeek === 0 ? 1 : Math.pow(2, dayOfWeek);
    
    const [hours, minutes] = time.split(':').map(Number);
    const slotTimeMinutes = hours * 60 + minutes;
    const slotEndTimeMinutes = slotTimeMinutes + 90;
    
    const mainTutorAvailable = tutorAvailabilities.mainTutor.length === 0 || 
      tutorAvailabilities.mainTutor.some(avail => {
        if ((avail.daysOfWeek & dayBitmask) === 0) return false;
        
        const effectiveFrom = new Date(avail.effectiveFrom + 'T00:00:00');
        const effectiveUntil = avail.effectiveUntil 
          ? new Date(avail.effectiveUntil + 'T23:59:59')
          : null;
        
        if (slotDate < effectiveFrom) return false;
        if (effectiveUntil && slotDate > effectiveUntil) return false;
        
        const [availFromHours, availFromMins] = avail.availableFrom.split(':').map(Number);
        const [availUntilHours, availUntilMins] = avail.availableUntil.split(':').map(Number);
        const availFromMinutes = availFromHours * 60 + availFromMins;
        const availUntilMinutes = availUntilHours * 60 + availUntilMins;
        
        return slotTimeMinutes >= availFromMinutes && slotEndTimeMinutes <= availUntilMinutes;
      });
    
    const subTutorAvailable = tutorAvailabilities.subTutor.length === 0 ||
      tutorAvailabilities.subTutor.some(avail => {
        if ((avail.daysOfWeek & dayBitmask) === 0) return false;
        
        const effectiveFrom = new Date(avail.effectiveFrom + 'T00:00:00');
        const effectiveUntil = avail.effectiveUntil 
          ? new Date(avail.effectiveUntil + 'T23:59:59')
          : null;
        
        if (slotDate < effectiveFrom) return false;
        if (effectiveUntil && slotDate > effectiveUntil) return false;
        
        const [availFromHours, availFromMins] = avail.availableFrom.split(':').map(Number);
        const [availUntilHours, availUntilMins] = avail.availableUntil.split(':').map(Number);
        const availFromMinutes = availFromHours * 60 + availFromMins;
        const availUntilMinutes = availUntilHours * 60 + availUntilMins;
        
        return slotTimeMinutes >= availFromMinutes && slotEndTimeMinutes <= availUntilMinutes;
      });
    
    return mainTutorAvailable && (tutorAvailabilities.subTutor.length === 0 || subTutorAvailable);
  };

  const isSlotTooClose = (date: string, time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotTimeMinutes = hours * 60 + minutes;
    
    if (existingSessions.length > 0) {
      return existingSessions.some(session => {
        if (!session.sessionDate || !session.startTime) return false;
        if (session.bookingId === notification.bookingId) return false;
        
        let sessionDateStr = session.sessionDate;
        if (sessionDateStr.includes('T')) {
          sessionDateStr = sessionDateStr.split('T')[0];
        }
        if (sessionDateStr !== date) return false;
        
        const sessionStart = new Date(session.startTime);
        const sessionHours = sessionStart.getHours();
        const sessionMinutes = sessionStart.getMinutes();
        const sessionTimeMinutes = sessionHours * 60 + sessionMinutes;
        
        const diff = Math.abs(slotTimeMinutes - sessionTimeMinutes);
        return diff < 180;
      });
    }
    
    return false;
  };

  const isSlotBooked = (date: string, time: string): boolean => {
    if (existingSessions.length === 0) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 90);
    
    return existingSessions.some((session) => {
      if (session.bookingId === notification.bookingId) return false;
      if (!session.sessionDate || !session.startTime || !session.endTime) return false;
      
      let sessionDateStr = session.sessionDate;
      if (sessionDateStr.includes('T')) {
        sessionDateStr = sessionDateStr.split('T')[0];
      }
      if (sessionDateStr !== date) return false;
      
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(session.endTime);
      
      return (slotStart < sessionEnd && slotEnd > sessionStart);
    });
  };

  const generateWeeklySchedule = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (selectedWeek * 7));
    
    const weekDays = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      if (date >= today) {
        const dateYear = date.getFullYear();
        const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
        const dateDay = String(date.getDate()).padStart(2, '0');
        const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;
        
        const isToday = date.getTime() === today.getTime();
        
        const allSlots = VALID_START_TIMES.map(time => {
          let isPast = false;
          if (isToday) {
            const [hours, minutes] = time.split(':').map(Number);
            const slotTime = hours * 60 + minutes;
            const currentTime = currentHour * 60 + currentMinute;
            isPast = slotTime <= currentTime;
          }
          
          const isTutorAvailable = isSlotAvailableForTutors(dateStr, time);
          const isBooked = isSlotBooked(dateStr, time);
          const isTooClose = isSlotTooClose(dateStr, time);
          const isDisabled = isPast || !isTutorAvailable || isBooked || isTooClose;
          
          return {
            time,
            endTime: calculateEndTime(time),
            id: `${dateStr}-${time}`,
            isDisabled,
            isPast,
            isBooked,
            isTutorAvailable,
            isTooClose
          };
        });
        
        weekDays.push({
          date: dateStr,
          dayName: dayNames[date.getDay()],
          dayNumber: date.getDate(),
          isPast: false,
          slots: allSlots
        });
      }
    }
    
    return weekDays;
  };

  const weeklySchedule = useMemo(() => {
    return generateWeeklySchedule();
  }, [selectedWeek, tutorAvailabilities, existingSessions]);

  const handleDateTimeSelect = (date: string, time: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (selectedDate < today) {
      showError('Cannot select past dates');
      return;
    }
    
    if (selectedDate.getTime() === today.getTime()) {
      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      if (slotTime <= now) {
        showError('Cannot select time slots in the past');
        return;
      }
    }
    
    if (isSlotBooked(date, time)) {
      showError('This time slot is already booked');
      return;
    }
    
    setRequestedDate(date);
    setStartTime(time);
  };

  const handleSubmit = async () => {
    if (!choice) {
      showError('Please select an option');
      return;
    }

    if (choice === 'makeup') {
      if (!requestedDate || !startTime) {
        showError('Please select a date and time for the makeup session');
        return;
      }

      if (!VALID_START_TIMES.includes(startTime)) {
        showError('Invalid time slot. Please select 16:00, 17:30, 19:00, or 20:30');
        return;
      }

      const [year, month, day] = requestedDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (selectedDate < today) {
        showError('Cannot schedule makeup session in the past');
        return;
      }
      
      if (selectedDate.getTime() === today.getTime()) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        if (slotDateTime <= now) {
          showError('Cannot schedule makeup session in the past');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      // Check if original request is still pending
      // If it is, we need to handle it before creating a new makeup session request
      if (choice === 'makeup' && originalRequest && originalRequest.status === 'pending') {
        // Original request is still pending - need to wait for staff to process it first
        showError('Please wait for staff to process the pending reschedule request first. You can create a makeup session request after the current request is processed.');
        setIsSubmitting(false);
        return;
      }

      // Then, handle the parent's choice
      if (choice === 'makeup') {
        // Use make-up session API (does not deduct RescheduleCount)
        const endTime = calculateEndTime(startTime);
        const result = await createMakeUpSession({
          bookingId: notification.bookingId,
          requestedDate: requestedDate,
          startTime: startTime,
          endTime: endTime,
          // Note: reason is not needed - backend automatically sets it to "Reschedule due to Tutor unavailability"
        });

        if (result.success) {
          showSuccess('Makeup session request submitted successfully. Staff will review and arrange the schedule.');
          handleClose();
          if (onSuccess) {
            onSuccess();
          }
        } else {
          // Check if error is about pending request
          const errorMsg = result.error || '';
          if (errorMsg.includes('pending reschedule request') || errorMsg.includes('one reschedule request') || errorMsg.includes('pending make-up request')) {
            showError('Please wait for the current request to be processed, or try again in a moment.');
          } else {
            showError(errorMsg || 'Failed to submit makeup session request');
          }
        }
      } else {
        // For refund, use the existing respondToRescheduleOrRefund API
        const result = await respondToRescheduleOrRefund({
          bookingId: notification.bookingId,
          contractId: notification.contractId,
          choice: 'refund',
        });

        if (result.success) {
          showSuccess('Refund request submitted successfully. The refund will be processed shortly.');
          handleClose();
          if (onSuccess) {
            onSuccess();
          }
        } else {
          showError(result.error || 'Failed to process refund request');
        }
      }
    } catch (error: unknown) {
      console.error('Error responding to reschedule or refund:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process your request';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setChoice(null);
    setRequestedDate('');
    setStartTime('');
    setSelectedWeek(0);
    setExistingSessions([]);
    setSessionInfo(null);
    setOriginalRequest(null);
    setIsSubmitting(false);
    onClose();
  };

  // Format session date and time for display
  const formatSessionDateTime = (): { dateStr: string; timeStr: string } => {
    if (!sessionInfo) {
      return { dateStr: 'Loading...', timeStr: '' };
    }
    
    try {
      let sessionDate: Date;
      if (sessionInfo.sessionDate.includes('T')) {
        sessionDate = new Date(sessionInfo.sessionDate);
      } else {
        const [year, month, day] = sessionInfo.sessionDate.split('-').map(Number);
        sessionDate = new Date(year, month - 1, day);
      }
      
      const dateStr = sessionDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      let timeStr = '';
      if (sessionInfo.startTime && sessionInfo.endTime) {
        const start = new Date(sessionInfo.startTime);
        const end = new Date(sessionInfo.endTime);
        const startTimeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        timeStr = `${startTimeStr} - ${endTimeStr}`;
      }
      
      return { dateStr, timeStr };
    } catch (error) {
      return { dateStr: sessionInfo.sessionDate, timeStr: '' };
    }
  };

  if (!isOpen) return null;

  const { dateStr, timeStr } = formatSessionDateTime();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Session Action Required</h2>
              <p className="text-gray-600 mt-1">No tutors are available for the rescheduled session</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Session Info */}
        {loadingSession ? (
          <div className="p-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading session information...</span>
          </div>
        ) : sessionInfo ? (
          <div className="p-6 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Original Session</h3>
                <p className="text-sm text-gray-600">
                  {dateStr} {timeStr && `at ${timeStr}`}
                </p>
                {sessionInfo.tutorName && (
                  <p className="text-sm text-gray-500">Tutor: {sessionInfo.tutorName}</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Unfortunately, no tutors are available at the requested time. Please choose one of the following options:
            </p>
          </div>

          {/* Choice Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setChoice('makeup')}
              className={`p-6 text-left rounded-lg border-2 transition-all ${
                choice === 'makeup'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <RefreshCw className={`w-6 h-6 ${choice === 'makeup' ? 'text-blue-600' : 'text-gray-400'}`} />
                <h3 className={`font-semibold ${choice === 'makeup' ? 'text-blue-900' : 'text-gray-900'}`}>
                  Schedule Makeup Session
                </h3>
              </div>
              <p className={`text-sm ${choice === 'makeup' ? 'text-blue-700' : 'text-gray-600'}`}>
                Choose a new date and time for a makeup session. Staff will arrange the schedule for you.
              </p>
            </button>

            <button
              onClick={() => setChoice('refund')}
              className={`p-6 text-left rounded-lg border-2 transition-all ${
                choice === 'refund'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <DollarSign className={`w-6 h-6 ${choice === 'refund' ? 'text-green-600' : 'text-gray-400'}`} />
                <h3 className={`font-semibold ${choice === 'refund' ? 'text-green-900' : 'text-gray-900'}`}>
                  Request Refund
                </h3>
              </div>
              <p className={`text-sm ${choice === 'refund' ? 'text-green-700' : 'text-gray-600'}`}>
                Cancel this session and receive a refund. The refund will be processed to your account.
              </p>
            </button>
          </div>

          {/* Makeup Session Date/Time Selection */}
          {choice === 'makeup' && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time for Makeup Session</h3>
              
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
              {(loadingSessions || loadingAvailabilities) ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading available slots...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
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
                          
                          let disabledReason = '';
                          if (slot.isPast) {
                            disabledReason = 'This time slot is in the past';
                          } else if (slot.isBooked) {
                            disabledReason = 'This time slot is already booked';
                          } else if (!slot.isTutorAvailable) {
                            disabledReason = 'Tutor not available at this time';
                          } else if (slot.isTooClose) {
                            disabledReason = 'Too close to another session (must be at least 1 slot apart)';
                          }
                          
                          return (
                            <button
                              key={slot.id}
                              onClick={() => !slot.isDisabled && handleDateTimeSelect(day.date, slot.time)}
                              disabled={slot.isDisabled}
                              className={`w-full p-2 text-xs rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : slot.isDisabled
                                  ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                  : 'bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700'
                              }`}
                              title={disabledReason || ''}
                            >
                              <div className="flex items-center justify-center space-x-1">
                                <Clock className={`w-3 h-3 ${slot.isDisabled ? 'opacity-50' : ''}`} />
                                <span className="font-medium">{slot.time}</span>
                              </div>
                              <div className={`text-[10px] mt-0.5 ${slot.isDisabled ? 'opacity-50' : 'opacity-75'}`}>
                                {slot.endTime}
                              </div>
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
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting || 
                !choice || 
                (choice === 'makeup' && (!requestedDate || !startTime))
              }
              className={`flex-1 px-4 py-3 rounded-lg text-white transition-colors flex items-center justify-center space-x-2 ${
                choice === 'refund'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {choice === 'makeup' ? 'Submit Makeup Session Request' : 'Request Refund'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleOrRefundModal;


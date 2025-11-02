import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  X, 
  CheckCircle,
  AlertCircle,
  User,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface DaySchedule {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

interface RescheduleRequestPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (requestData: RescheduleRequest) => void;
  currentSession: {
    date: string;
    time: string;
    topic: string;
  };
  tutorName: string;
}

interface RescheduleRequest {
  reason: string;
  newDate: string;
  newTime: string;
  alternativeDates: string[];
  notes?: string;
}

const RescheduleRequestPopup: React.FC<RescheduleRequestPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentSession,
  tutorName
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [alternativeDates, setAlternativeDates] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);

  // TODO: Replace with actual tutor availability API call
  // Fetch from GET /api/tutor-availabilities/search-tutors or similar endpoint
  const weeklySchedules: DaySchedule[] = [
    {
      date: '2024-01-22',
      dayName: 'Monday',
      slots: [
        { id: 'mon-1', time: '09:00', available: true },
        { id: 'mon-2', time: '10:00', available: true },
        { id: 'mon-3', time: '11:00', available: false },
        { id: 'mon-4', time: '14:00', available: true },
        { id: 'mon-5', time: '15:00', available: true },
        { id: 'mon-6', time: '16:00', available: false }
      ]
    },
    {
      date: '2024-01-23',
      dayName: 'Tuesday',
      slots: [
        { id: 'tue-1', time: '09:00', available: false },
        { id: 'tue-2', time: '10:00', available: true },
        { id: 'tue-3', time: '11:00', available: true },
        { id: 'tue-4', time: '14:00', available: true },
        { id: 'tue-5', time: '15:00', available: false },
        { id: 'tue-6', time: '16:00', available: true }
      ]
    },
    {
      date: '2024-01-24',
      dayName: 'Wednesday',
      slots: [
        { id: 'wed-1', time: '09:00', available: true },
        { id: 'wed-2', time: '10:00', available: true },
        { id: 'wed-3', time: '11:00', available: true },
        { id: 'wed-4', time: '14:00', available: false },
        { id: 'wed-5', time: '15:00', available: true },
        { id: 'wed-6', time: '16:00', available: true }
      ]
    },
    {
      date: '2024-01-25',
      dayName: 'Thursday',
      slots: [
        { id: 'thu-1', time: '09:00', available: true },
        { id: 'thu-2', time: '10:00', available: false },
        { id: 'thu-3', time: '11:00', available: true },
        { id: 'thu-4', time: '14:00', available: true },
        { id: 'thu-5', time: '15:00', available: true },
        { id: 'thu-6', time: '16:00', available: false }
      ]
    },
    {
      date: '2024-01-26',
      dayName: 'Friday',
      slots: [
        { id: 'fri-1', time: '09:00', available: false },
        { id: 'fri-2', time: '10:00', available: true },
        { id: 'fri-3', time: '11:00', available: true },
        { id: 'fri-4', time: '14:00', available: true },
        { id: 'fri-5', time: '15:00', available: true },
        { id: 'fri-6', time: '16:00', available: true }
      ]
    }
  ];

  const reasonOptions = [
    t('personalEmergency'),
    t('familyCommitment'),
    t('healthIssue'),
    t('workConflict'),
    t('transportationIssue'),
    t('other')
  ];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleAddAlternativeDate = () => {
    if (selectedDate && !alternativeDates.includes(selectedDate)) {
      setAlternativeDates(prev => [...prev, selectedDate]);
    }
  };

  const handleRemoveAlternativeDate = (date: string) => {
    setAlternativeDates(prev => prev.filter(d => d !== date));
  };

  const handleNext = () => {
    if (step === 1 && reason) {
      setStep(2);
    } else if (step === 2 && selectedDate && selectedTime) {
      setStep(3);
    }
  };

  const handleConfirm = () => {
    const requestData: RescheduleRequest = {
      reason,
      newDate: selectedDate,
      newTime: selectedTime,
      alternativeDates,
      notes
    };
    onConfirm(requestData);
    handleClose();
  };

  const handleClose = () => {
    setReason('');
    setSelectedDate('');
    setSelectedTime('');
    setAlternativeDates([]);
    setNotes('');
    setStep(1);
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

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Reason', icon: MessageSquare },
              { step: 2, label: 'New Time', icon: Clock },
              { step: 3, label: 'Confirm', icon: CheckCircle }
            ].map((item) => (
              <div key={item.step} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= item.step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className={`text-sm font-medium ${
                  step >= item.step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('whyReschedule')}</h3>
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
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('pleaseSpecify')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select New Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {weeklySchedules.map((day) => (
                    <div key={day.date} className="space-y-3">
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900">{day.dayName}</h4>
                        <p className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="space-y-2">
                        {day.slots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => {
                              handleDateSelect(day.date);
                              handleTimeSelect(slot.time);
                            }}
                            disabled={!slot.available}
                            className={`w-full p-2 text-sm rounded-lg transition-colors ${
                              selectedDate === day.date && selectedTime === slot.time
                                ? 'bg-blue-600 text-white'
                                : slot.available
                                ? 'bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Selected Time</span>
                  </div>
                  <p className="text-blue-800 mt-1">
                    {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Request</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reason:</span>
                    <span className="font-medium">{reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Time:</span>
                    <span className="font-medium">
                      {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                    </span>
                  </div>
                  {notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes:</span>
                      <span className="font-medium">{notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Alternative Dates (Optional)</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Add alternative dates in case your preferred time is not available
                </p>
                <div className="flex space-x-2 mb-3">
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select alternative date</option>
                    {weeklySchedules.map((day) => (
                      <option key={day.date} value={day.date}>
                        {day.dayName}, {new Date(day.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddAlternativeDate}
                    disabled={!selectedDate || alternativeDates.includes(selectedDate)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {alternativeDates.length > 0 && (
                  <div className="space-y-2">
                    {alternativeDates.map((date, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                        <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleRemoveAlternativeDate(date)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              {t('cancel')}
            </button>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('back')}
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !reason) ||
                  (step === 2 && (!selectedDate || !selectedTime))
                }
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {t('next')}
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('submitRequest')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleRequestPopup;

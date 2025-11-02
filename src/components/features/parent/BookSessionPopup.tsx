import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  X, 
  CheckCircle,
  AlertCircle,
  User,
  MapPin
} from 'lucide-react';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  tutorName?: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

interface BookSessionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSlots: string[]) => void;
  tutorName: string;
  centerName: string;
  subject: string;
}

const BookSessionPopup: React.FC<BookSessionPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tutorName,
  centerName,
  subject
}) => {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(0);

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
    },
    {
      date: '2024-01-27',
      dayName: 'Saturday',
      slots: [
        { id: 'sat-1', time: '09:00', available: true },
        { id: 'sat-2', time: '10:00', available: true },
        { id: 'sat-3', time: '11:00', available: false },
        { id: 'sat-4', time: '14:00', available: true },
        { id: 'sat-5', time: '15:00', available: false },
        { id: 'sat-6', time: '16:00', available: true }
      ]
    },
    {
      date: '2024-01-28',
      dayName: 'Sunday',
      slots: [
        { id: 'sun-1', time: '09:00', available: false },
        { id: 'sun-2', time: '10:00', available: true },
        { id: 'sun-3', time: '11:00', available: true },
        { id: 'sun-4', time: '14:00', available: true },
        { id: 'sun-5', time: '15:00', available: true },
        { id: 'sun-6', time: '16:00', available: false }
      ]
    }
  ];

  const handleSlotSelect = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(prev => prev.filter(id => id !== slotId));
    } else {
      setSelectedSlots(prev => [...prev, slotId]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedSlots);
    setSelectedSlots([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedSlots([]);
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
              <h2 className="text-2xl font-bold text-gray-900">Book Session</h2>
              <p className="text-gray-600 mt-1">Select your preferred time slots</p>
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
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Tutor</p>
                <p className="font-semibold text-gray-900">{tutorName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Center</p>
                <p className="font-semibold text-gray-900">{centerName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-semibold text-gray-900">{subject}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Select Week</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={selectedWeek === 0}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Week {selectedWeek + 1}
              </span>
              <button
                onClick={() => setSelectedWeek(selectedWeek + 1)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Time Slots Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
                      onClick={() => slot.available && handleSlotSelect(slot.id)}
                      disabled={!slot.available}
                      className={`w-full p-2 text-sm rounded-lg transition-colors ${
                        selectedSlots.includes(slot.id)
                          ? 'bg-blue-600 text-white'
                          : slot.available
                          ? 'bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{slot.time}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Slots Summary */}
        {selectedSlots.length > 0 && (
          <div className="p-6 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {selectedSlots.length} session{selectedSlots.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="text-sm text-blue-700">
                Total: {selectedSlots.length} × 90 minutes
              </div>
            </div>
          </div>
        )}

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
              onClick={handleConfirm}
              disabled={selectedSlots.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Confirm Booking ({selectedSlots.length} sessions)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSessionPopup;

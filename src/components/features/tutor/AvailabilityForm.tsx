import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { TutorAvailability, CreateTutorAvailabilityRequest } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

interface AvailabilityFormProps {
  availability?: TutorAvailability | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Generate time slots from 16:00 to 22:00, each 1.5 hours
const timeSlots = [
  { id: 'slot1', from: '16:00', to: '17:30', label: '16:00 - 17:30' },
  { id: 'slot2', from: '17:30', to: '19:00', label: '17:30 - 19:00' },
  { id: 'slot3', from: '19:00', to: '20:30', label: '19:00 - 20:30' },
  { id: 'slot4', from: '20:30', to: '22:00', label: '20:30 - 22:00' },
];

const AvailabilityForm: React.FC<AvailabilityFormProps> = ({ availability, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    daysOfWeek: 0,
    selectedSlots: new Set<string>(), // Store selected slot IDs
    effectiveFrom: new Date().toISOString().split('T')[0], // Always initialize with today
    effectiveUntil: '', // Empty string, not undefined
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const daysOfWeekOptions = [
    { bit: 1, label: 'Sunday', short: 'Sun' },
    { bit: 2, label: 'Monday', short: 'Mon' },
    { bit: 4, label: 'Tuesday', short: 'Tue' },
    { bit: 8, label: 'Wednesday', short: 'Wed' },
    { bit: 16, label: 'Thursday', short: 'Thu' },
    { bit: 32, label: 'Friday', short: 'Fri' },
    { bit: 64, label: 'Saturday', short: 'Sat' },
  ];

  useEffect(() => {
    if (availability) {
      const selectedSlots = new Set<string>();
      const fromTime = availability.availableFrom;
      const toTime = availability.availableUntil;
      
      // Find which slots are covered by the availability time range
      // A slot is selected if the availability time range covers it
      timeSlots.forEach(slot => {
        // Check if availability time range covers this slot
        // Slot is covered if: availableFrom <= slot.from AND availableUntil >= slot.to
        if (fromTime && toTime && fromTime <= slot.from && toTime >= slot.to) {
          selectedSlots.add(slot.id);
        }
      });

      setFormData({
        daysOfWeek: availability.daysOfWeek || 0,
        selectedSlots: selectedSlots,
        effectiveFrom: availability.effectiveFrom || new Date().toISOString().split('T')[0],
        effectiveUntil: availability.effectiveUntil || '',
      });
    } else {
      // Reset for new availability - set default effectiveFrom to today
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        daysOfWeek: 0,
        selectedSlots: new Set<string>(),
        effectiveFrom: today,
        effectiveUntil: '',
      });
    }
  }, [availability]);

  const toggleDay = (bit: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek ^ bit, // XOR to toggle
    }));
    if (errors.daysOfWeek) {
      setErrors(prev => ({ ...prev, daysOfWeek: '' }));
    }
  };

  const toggleSlot = (slotId: string) => {
    setFormData(prev => {
      const newSlots = new Set(prev.selectedSlots);
      if (newSlots.has(slotId)) {
        newSlots.delete(slotId);
      } else {
        newSlots.add(slotId);
      }
      return { ...prev, selectedSlots: newSlots };
    });
    if (errors.selectedSlots) {
      setErrors(prev => ({ ...prev, selectedSlots: '' }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.daysOfWeek === 0) {
      newErrors.daysOfWeek = 'Please select at least one day';
    }

    if (formData.selectedSlots.size === 0) {
      newErrors.selectedSlots = 'Please select at least one time slot';
    }

    if (!formData.effectiveFrom) {
      newErrors.effectiveFrom = 'Start date is required';
    }

    if (formData.effectiveUntil && formData.effectiveFrom) {
      const startDate = new Date(formData.effectiveFrom);
      const endDate = new Date(formData.effectiveUntil);
      if (endDate < startDate) {
        newErrors.effectiveUntil = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!user?.id) {
      showError('User not authenticated. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const { createTutorAvailability, updateTutorAvailability, bulkCreateTutorAvailabilities } = await import('../../../services/api');
      
      // Create one availability per selected slot
      const selectedSlotsArray = Array.from(formData.selectedSlots);
      const slotObjects = selectedSlotsArray.map(slotId => {
        const slot = timeSlots.find(s => s.id === slotId);
        return slot!;
      });

      // Sort slots by time
      slotObjects.sort((a, b) => a.from.localeCompare(b.from));
      
      // Determine if we should create multiple availabilities or update existing
      if (availability?.availabilityId) {
        // For update, we'll update to the first selected slot (or use bulk update if needed)
        const firstSlot = slotObjects[0];
        const lastSlot = slotObjects[slotObjects.length - 1];
        
        const requestData: CreateTutorAvailabilityRequest = {
          TutorId: user.id,
          DaysOfWeek: formData.daysOfWeek,
          AvailableFrom: firstSlot.from,
          AvailableUntil: lastSlot.to,
          EffectiveFrom: formData.effectiveFrom,
          EffectiveUntil: formData.effectiveUntil || null,
          CanTeachOnline: true,
          CanTeachOffline: true,
        };

        const result = await updateTutorAvailability(availability.availabilityId, requestData);
        if (result.success) {
          showSuccess('Availability updated successfully!');
          onSuccess();
          onClose();
        } else {
          showError(result.error || 'Failed to update availability');
        }
      } else {
        // For create, create one availability per slot or combine consecutive slots
        // We'll create separate availabilities for each slot to be more flexible
        const requests = slotObjects.map(slot => ({
          TutorId: user.id,
          DaysOfWeek: formData.daysOfWeek,
          AvailableFrom: slot.from,
          AvailableUntil: slot.to,
          EffectiveFrom: formData.effectiveFrom,
          EffectiveUntil: formData.effectiveUntil || null,
          CanTeachOnline: true,
          CanTeachOffline: true,
        }));

        if (requests.length === 1) {
          // Single availability
          const result = await createTutorAvailability(requests[0]);
          if (result.success) {
            showSuccess('Availability created successfully!');
            onSuccess();
            onClose();
          } else {
            showError(result.error || 'Failed to create availability');
          }
        } else {
          // Multiple availabilities - use bulk create
          const result = await bulkCreateTutorAvailabilities({ availabilities: requests });
          if (result.success) {
            showSuccess(`${requests.length} availabilities created successfully!`);
            onSuccess();
            onClose();
          } else {
            showError(result.error || 'Failed to create availabilities');
          }
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {availability ? 'Edit Availability' : 'Add Availability'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Days *
            </label>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeekOptions.map((day) => {
                const isSelected = (formData.daysOfWeek & day.bit) !== 0;
                return (
                  <button
                    key={day.bit}
                    type="button"
                    onClick={() => toggleDay(day.bit)}
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
            {errors.daysOfWeek && (
              <p className="mt-2 text-sm text-red-600">{errors.daysOfWeek}</p>
            )}
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Clock className="w-4 h-4 inline mr-1" />
              Select Time Slots (16:00 - 22:00) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {timeSlots.map((slot) => {
                const isSelected = formData.selectedSlots.has(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleSlot(slot.id)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md border-2 border-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{slot.label}</span>
                      {isSelected && (
                        <span className="text-white">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.selectedSlots && (
              <p className="mt-2 text-sm text-red-600">{errors.selectedSlots}</p>
            )}
          </div>

          {/* Effective Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4 inline mr-1" />
              Effective Period *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => handleChange('effectiveFrom', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                {errors.effectiveFrom && (
                  <p className="mt-1 text-sm text-red-600">{errors.effectiveFrom}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.effectiveUntil || ''}
                  onChange={(e) => handleChange('effectiveUntil', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                {errors.effectiveUntil && (
                  <p className="mt-1 text-sm text-red-600">{errors.effectiveUntil}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : availability ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvailabilityForm;


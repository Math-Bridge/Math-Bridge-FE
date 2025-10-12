import React, { useState, useEffect } from 'react';
import { Building2, X, Plus, Save, Loader } from 'lucide-react';
import { getCenterById, createCenter, updateCenter, CreateCenterRequest, UpdateCenterRequest } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface CenterFormData {
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  description: string;
  capacity: number;
  facilities: string[];
  operating_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

interface CenterFormProps {
  centerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CenterForm: React.FC<CenterFormProps> = ({ centerId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CenterFormData>({
    name: '',
    address: '',
    city: '',
    district: '',
    phone: '',
    email: '',
    description: '',
    capacity: 100,
    facilities: [],
    operating_hours: {
      monday: '8:00-17:00',
      tuesday: '8:00-17:00',
      wednesday: '8:00-17:00',
      thursday: '8:00-17:00',
      friday: '8:00-17:00',
      saturday: '8:00-12:00',
      sunday: 'closed'
    }
  });

  const [newFacility, setNewFacility] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = [
    'Ho Chi Minh City',
    'Hanoi',
    'Da Nang',
    'Can Tho',
    'Hai Phong',
    'Bien Hoa',
    'Nha Trang',
    'Hue',
    'Vung Tau'
  ];

  useEffect(() => {
    if (centerId) {
      fetchCenterData();
    }
  }, [centerId]);

  const fetchCenterData = async () => {
    try {
      setFetchingData(true);
      const result = await getCenterById(centerId!);

      if (result.success && result.data) {
        const center = result.data;
        setFormData({
          name: center.name || '',
          address: center.address || '',
          city: '', // API doesn't provide city, will need to extract from address
          district: '', // API doesn't provide district
          phone: center.phone || '',
          email: '', // API doesn't provide email
          description: '', // API doesn't provide description
          capacity: 100, // Default value since API doesn't provide capacity
          facilities: [], // API doesn't provide facilities
          operating_hours: formData.operating_hours // Default operating hours
        });
      } else {
        setError(result.error || 'Failed to load center data');
      }
    } catch (err) {
      console.error('Error fetching center:', err);
      setError('Failed to load center data');
    } finally {
      setFetchingData(false);
    }
  };

  const handleInputChange = (field: keyof CenterFormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOperatingHoursChange = (day: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: value
      }
    }));
  };

  const handleAddFacility = () => {
    if (newFacility.trim() && !formData.facilities.includes(newFacility.trim())) {
      setFormData(prev => ({
        ...prev,
        facilities: [...prev.facilities, newFacility.trim()]
      }));
      setNewFacility('');
    }
  };

  const handleRemoveFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API (only include fields that the API supports)
      const apiData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        status: 'active' // Default status
      };

      let result;
      if (centerId) {
        // Update existing center
        result = await updateCenter(centerId, apiData as UpdateCenterRequest);
      } else {
        // Create new center
        result = await createCenter(apiData as CreateCenterRequest);
      }

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to save center');
      }
    } catch (err) {
      setError('An error occurred while saving center');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has admin/staff role
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  if (!isAdminOrStaff) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
          <p className="text-red-600 mb-4">
            You need admin or staff privileges to manage centers.
          </p>
          {onCancel && (
            <button onClick={onCancel} className="btn-secondary">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {centerId ? 'Edit Center' : 'Create New Center'}
          </h2>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">
              Center Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="form-input"
              placeholder="e.g., MathGenius Center District 1"
              required
            />
          </div>

          <div>
            <label className="form-label">
              City
            </label>
            <select
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="form-input"
            >
              <option value="">Select a city</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">District / Area</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              className="form-input"
              placeholder="e.g., District 1"
            />
          </div>

          <div>
            <label className="form-label">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="form-input"
              placeholder="e.g., 123 Nguyen Hue Street"
              required
            />
          </div>

          <div>
            <label className="form-label">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="form-input"
              placeholder="e.g., 028-1234-5678"
            />
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="form-input"
              placeholder="e.g., center@mathgenius.vn"
            />
          </div>

          <div>
            <label className="form-label">Capacity (Students)</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
              className="form-input"
              min="1"
              placeholder="e.g., 100"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="form-input"
            rows={3}
            placeholder="Brief description of the center..."
          />
        </div>

        <div>
          <label className="form-label">Facilities</label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newFacility}
              onChange={(e) => setNewFacility(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFacility())}
              className="form-input flex-1"
              placeholder="Add a facility (e.g., WiFi, Air Conditioning)"
            />
            <button
              type="button"
              onClick={handleAddFacility}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {formData.facilities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.facilities.map((facility, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center space-x-2"
                >
                  <span>{facility}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFacility(facility)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="form-label">Operating Hours</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daysOrder.map((day) => (
              <div key={day} className="flex items-center space-x-3">
                <label className="w-24 text-sm font-medium text-gray-700 capitalize">
                  {day}
                </label>
                <input
                  type="text"
                  value={formData.operating_hours[day as keyof typeof formData.operating_hours]}
                  onChange={(e) => handleOperatingHoursChange(day, e.target.value)}
                  className="form-input flex-1"
                  placeholder="e.g., 8:00-17:00 or closed"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{centerId ? 'Update Center' : 'Create Center'}</span>
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CenterForm;

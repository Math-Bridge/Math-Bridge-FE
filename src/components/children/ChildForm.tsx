import React, { useState, useEffect } from 'react';
import { X, User, School, Calendar, MapPin } from 'lucide-react';
import { AddChildRequest, UpdateChildRequest, addChild, updateChild, getAllCenters, Center } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface ChildFormProps {
  child?: {
    childId: string;
    fullName: string;
    school: string;
    centerId?: string;
    grade: string;
    dateOfBirth?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const ChildForm: React.FC<ChildFormProps> = ({ child, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: child?.fullName || '',
    school: child?.school || '',
    centerId: child?.centerId || '',
    grade: child?.grade || 'grade 9',
    dateOfBirth: child?.dateOfBirth || ''
  });
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const result = await getAllCenters();
      if (result.success && result.data) {
        setCenters(result.data.data || result.data);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.school.trim()) {
      newErrors.school = 'School is required';
    }
    
    if (!formData.grade) {
      newErrors.grade = 'Grade is required';
    }
    
    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      if (isNaN(date.getTime())) {
        newErrors.dateOfBirth = 'Invalid date format';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user?.id) return;

    setLoading(true);
    try {
      const requestData: AddChildRequest | UpdateChildRequest = {
        fullName: formData.fullName.trim(),
        school: formData.school.trim(),
        centerId: formData.centerId || undefined,
        grade: formData.grade,
        dateOfBirth: formData.dateOfBirth || undefined
      };

      if (child) {
        // Update existing child
        await updateChild(child.childId, requestData);
      } else {
        // Add new child
        await addChild(user.id, requestData as AddChildRequest);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving child:', error);
      setErrors({ general: 'Failed to save child. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {child ? 'Edit Child' : 'Add New Child'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <div>
            <label className="form-label">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="form-input pl-10"
                placeholder="Enter child's full name"
              />
            </div>
            {errors.fullName && <p className="error-message">{errors.fullName}</p>}
          </div>

          <div>
            <label className="form-label">School *</label>
            <div className="relative">
              <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={formData.school}
                onChange={(e) => handleChange('school', e.target.value)}
                className="form-input pl-10"
                placeholder="Enter school name"
              />
            </div>
            {errors.school && <p className="error-message">{errors.school}</p>}
          </div>

          <div>
            <label className="form-label">Grade *</label>
            <select
              value={formData.grade}
              onChange={(e) => handleChange('grade', e.target.value)}
              className="form-input"
            >
              <option value="grade 9">Grade 9</option>
              <option value="grade 10">Grade 10</option>
              <option value="grade 11">Grade 11</option>
              <option value="grade 12">Grade 12</option>
            </select>
            {errors.grade && <p className="error-message">{errors.grade}</p>}
          </div>

          <div>
            <label className="form-label">Learning Center (Optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={formData.centerId}
                onChange={(e) => handleChange('centerId', e.target.value)}
                className="form-input pl-10"
              >
                <option value="">Select a center (optional)</option>
                {centers.map((center) => (
                  <option key={center.centerId} value={center.centerId}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Date of Birth (Optional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className="form-input pl-10"
              />
            </div>
            {errors.dateOfBirth && <p className="error-message">{errors.dateOfBirth}</p>}
          </div>

          <div className="flex space-x-3 pt-4">
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
              {loading ? 'Saving...' : (child ? 'Update' : 'Add Child')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildForm;


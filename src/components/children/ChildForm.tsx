import React, { useState, useEffect } from 'react';
import { X, User, School as SchoolIcon, Calendar, MapPin } from 'lucide-react';
import { AddChildRequest, UpdateChildRequest, addChild, updateChild, getAllCenters, Center, getActiveSchools, School } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';

interface ChildFormProps {
  child?: {
    childId: string;
    fullName: string;
    schoolId: string;
    centerId?: string;
    grade: string;
    dateOfBirth?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const ChildForm: React.FC<ChildFormProps> = ({ child, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: child?.fullName || '',
    schoolId: child?.schoolId || '',
    centerId: child?.centerId || '',
    grade: child?.grade || 'grade 9',
    dateOfBirth: child?.dateOfBirth || ''
  });
  const [centers, setCenters] = useState<Center[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCenters();
    fetchSchools();
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

  const fetchSchools = async () => {
    try {
      const result = await getActiveSchools();
      if (result.success && result.data) {
        setSchools(result.data.data || result.data);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.schoolId) {
      newErrors.schoolId = 'School is required';
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
        schoolId: formData.schoolId,
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
            {child ? t('editChild') : t('addNewChild')}
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
            <label className="form-label">{t('fullName')} *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="form-input pl-10"
                placeholder={`Enter child's ${t('fullName').toLowerCase()}`}
              />
            </div>
            {errors.fullName && <p className="error-message">{errors.fullName}</p>}
          </div>

          <div>
            <label className="form-label">{t('school')} *</label>
            <div className="relative">
              <SchoolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={formData.schoolId}
                onChange={(e) => handleChange('schoolId', e.target.value)}
                className="form-input pl-10"
              >
                <option value="">{t('selectSchool')}</option>
                {schools.map((school) => (
                  <option key={school.schoolId} value={school.schoolId}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
            {errors.schoolId && <p className="error-message">{errors.schoolId}</p>}
          </div>

          <div>
            <label className="form-label">{t('grade')} *</label>
            <select
              value={formData.grade}
              onChange={(e) => handleChange('grade', e.target.value)}
              className="form-input"
            >
              <option value="grade 9">{t('grade9')}</option>
              <option value="grade 10">{t('grade10')}</option>
              <option value="grade 11">{t('grade11')}</option>
              <option value="grade 12">{t('grade12')}</option>
            </select>
            {errors.grade && <p className="error-message">{errors.grade}</p>}
          </div>

          <div>
            <label className="form-label">{t('learningCenter')} ({t('optional')})</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={formData.centerId}
                onChange={(e) => handleChange('centerId', e.target.value)}
                className="form-input pl-10"
              >
                <option value="">{t('selectCenter')}</option>
                {centers.map((center) => (
                  <option key={center.centerId} value={center.centerId}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">{t('dateOfBirth')} ({t('optional')})</label>
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
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('saving') : (child ? t('update') : t('addChild'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildForm;


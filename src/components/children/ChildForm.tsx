import React, { useState, useEffect } from 'react';
import { X, User, School as SchoolIcon, Calendar } from 'lucide-react';
import { AddChildRequest, UpdateChildRequest, addChild, updateChild, getActiveSchools, School } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../contexts/ToastContext';

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
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    fullName: child?.fullName || '',
    schoolId: child?.schoolId || '',
    grade: child?.grade || 'grade 9',
    dateOfBirth: child?.dateOfBirth || ''
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update form data when child prop changes (for edit mode)
  useEffect(() => {
    if (child) {
      // Format dateOfBirth for date input (YYYY-MM-DD format)
      let formattedDateOfBirth = '';
      if (child.dateOfBirth) {
        try {
          // Handle different date formats from backend
          const date = new Date(child.dateOfBirth);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for date input
            formattedDateOfBirth = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Error parsing dateOfBirth:', error);
        }
      }
      
      setFormData({
        fullName: child.fullName || '',
        schoolId: child.schoolId || '',
        grade: child.grade || 'grade 9',
        dateOfBirth: formattedDateOfBirth
      });
      console.log('ChildForm: Updated form data for edit mode:', {
        child,
        formData: {
          fullName: child.fullName || '',
          schoolId: child.schoolId || '',
          centerId: child.centerId || '',
          grade: child.grade || 'grade 9',
          dateOfBirth: formattedDateOfBirth
        }
      });
    } else {
      // Reset form for add mode
      setFormData({
        fullName: '',
        schoolId: '',
        grade: 'grade 9',
        dateOfBirth: ''
      });
    }
  }, [child]);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      await fetchSchools();
      setLoadingData(false);
    };
    loadData();
  }, []);

  const fetchSchools = async () => {
    try {
      const result = await getActiveSchools();
      console.log('Schools API response:', result);
      if (result.success && result.data) {
        // Handle different response structures:
        // 1. Direct array: result.data = [...]
        // 2. Wrapped in data: result.data = { data: [...] }
        // 3. Wrapped in array property: result.data = { schools: [...] }
        let schoolsData: any[] = [];
        const data = result.data as any;
        
        if (Array.isArray(data)) {
          schoolsData = data;
        } else if (data.data && Array.isArray(data.data)) {
          schoolsData = data.data;
        } else if (data.schools && Array.isArray(data.schools)) {
          schoolsData = data.schools;
        } else if (data.items && Array.isArray(data.items)) {
          schoolsData = data.items;
        }
        
        setSchools(schoolsData);
        console.log('Parsed schools:', schoolsData);
      } else {
        console.error('Failed to fetch schools:', result.error);
        setSchools([]);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools([]);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get expected age range for grade
  const getExpectedAgeRange = (grade: string): { min: number; max: number } | null => {
    switch (grade.toLowerCase()) {
      case 'grade 9':
        return { min: 14, max: 15 };
      case 'grade 10':
        return { min: 15, max: 16 };
      case 'grade 11':
        return { min: 16, max: 17 };
      case 'grade 12':
        return { min: 17, max: 18 };
      default:
        return null;
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
      } else {
        // Validate age against grade
        const age = calculateAge(formData.dateOfBirth);
        const ageRange = getExpectedAgeRange(formData.grade);
        
        if (age !== null && ageRange) {
          if (age < ageRange.min || age > ageRange.max) {
            newErrors.dateOfBirth = `Age does not match ${formData.grade}. This grade is typically for students aged ${ageRange.min} to ${ageRange.max} years old (current age: ${age})`;
          }
        }
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
        grade: formData.grade,
        // Only include dateOfBirth if it's not empty
        dateOfBirth: formData.dateOfBirth && formData.dateOfBirth.trim() !== '' ? formData.dateOfBirth : undefined
      };

      if (child) {
        // Update existing child
        const result = await updateChild(child.childId, requestData);
        if (result.success) {
          showSuccess('Child updated successfully!');
        } else {
          showError(result.error || 'Failed to update child');
          setErrors({ general: result.error || 'Failed to update child' });
          setLoading(false);
          return;
        }
      } else {
        // Add new child
        const result = await addChild(user.id, requestData as AddChildRequest);
        if (result.success) {
          showSuccess('Child added successfully!');
        } else {
          showError(result.error || 'Failed to add child');
          setErrors({ general: result.error || 'Failed to add child' });
          setLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save child. Please try again.';
      console.error('Error saving child:', error);
      showError(errorMsg);
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Validate age when dateOfBirth or grade changes
    if (field === 'dateOfBirth' || field === 'grade') {
      const dateOfBirth = field === 'dateOfBirth' ? value : updatedData.dateOfBirth;
      const grade = field === 'grade' ? value : updatedData.grade;
      
      if (dateOfBirth && grade) {
        const age = calculateAge(dateOfBirth);
        const ageRange = getExpectedAgeRange(grade);
        
        if (age !== null && ageRange) {
          if (age < ageRange.min || age > ageRange.max) {
            setErrors(prev => ({
              ...prev,
              dateOfBirth: `Age does not match ${grade}. This grade is typically for students aged ${ageRange.min} to ${ageRange.max} years old (current age: ${age})`
            }));
          } else {
            // Clear error if age is valid
            setErrors(prev => ({ ...prev, dateOfBirth: '' }));
          }
        }
      }
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
                disabled={loadingData}
              >
                <option value="">
                  {loadingData ? 'Loading...' : t('selectSchool')}
                </option>
                {schools.map((school: any) => {
                  const schoolId = school.SchoolId || school.schoolId || school.id;
                  const schoolName = school.SchoolName || school.schoolName || school.name || 'Unknown School';
                  return (
                    <option key={schoolId} value={schoolId}>
                      {schoolName}
                    </option>
                  );
                })}
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
              {[
                { value: 'grade 9', label: t('grade9') },
                { value: 'grade 10', label: t('grade10') },
                { value: 'grade 11', label: t('grade11') },
                { value: 'grade 12', label: t('grade12') }
              ].map((grade) => (
                <option key={grade.value} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>
            {errors.grade && <p className="error-message">{errors.grade}</p>}
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


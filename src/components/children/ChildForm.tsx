import React, { useState, useEffect, useRef } from 'react';
import { X, User, School as SchoolIcon, Calendar, ImagePlus, ChevronDown } from 'lucide-react';
import { AddChildRequest, UpdateChildRequest, addChild, updateChild, getAllActiveSchools, School, uploadChildAvatar } from '../../services/api';
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
    avatarUrl?: string;
    avatarVersion?: number;
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
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>('');
  const schoolDropdownRef = useRef<HTMLDivElement>(null);
  const schoolInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(child?.avatarUrl || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

      // Set avatar URL with version for cache busting
      if (child.avatarUrl) {
        let url = child.avatarUrl;
        if (child.avatarVersion) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}v=${child.avatarVersion}`;
        }
        setAvatarUrl(url);
        setAvatarError(false);
      } else {
        setAvatarUrl(null);
        setAvatarError(false);
      }

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
        setAvatarUrl(null);
        setAvatarPreview(null);
        setSelectedAvatarFile(null);
        setAvatarError(false);
    }
  }, [child]);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoadingData(true);
      const schoolsData = await getAllActiveSchools();
      console.log('Fetched all schools:', schoolsData.length, schoolsData);
      setSchools(schoolsData);
      setFilteredSchools(schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools([]);
      setFilteredSchools([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Filter schools based on search term
  useEffect(() => {
    if (!schoolSearchTerm.trim()) {
      setFilteredSchools(schools);
    } else {
      const searchLower = schoolSearchTerm.toLowerCase();
      const filtered = schools.filter((school: any) => {
        // Handle both camelCase and PascalCase from backend
        const schoolName = school.SchoolName || school.schoolName || 'Unknown School';
        return schoolName.toLowerCase().includes(searchLower);
      });
      setFilteredSchools(filtered);
    }
    // Show dropdown when user types
    if (schoolSearchTerm.trim() && !showSchoolDropdown) {
      setShowSchoolDropdown(true);
    }
  }, [schoolSearchTerm, schools]);

  // Update selected school name when schoolId changes
  useEffect(() => {
    if (formData.schoolId) {
      const school = schools.find((s: any) => {
        // Handle both camelCase and PascalCase from backend
        const schoolId = (s as any).SchoolId || s.schoolId;
        return schoolId === formData.schoolId;
      });
      if (school) {
        // Handle both camelCase and PascalCase from backend
        const schoolName = (school as any).SchoolName || school.schoolName || 'Unknown School';
        setSelectedSchoolName(schoolName);
        // Update search term if it's empty or doesn't match
        if (!schoolSearchTerm || schoolSearchTerm !== schoolName) {
          setSchoolSearchTerm(schoolName);
        }
      } else {
        setSelectedSchoolName('');
      }
    } else {
      setSelectedSchoolName('');
      // Clear search term only if it was the selected school name
      if (schoolSearchTerm === selectedSchoolName) {
        setSchoolSearchTerm('');
      }
    }
  }, [formData.schoolId, schools]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target as Node)) {
        setShowSchoolDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSchoolSelect = (school: any) => {
    // Handle both camelCase and PascalCase from backend
    const schoolId = school.SchoolId || school.schoolId;
    const schoolName = school.SchoolName || school.schoolName || 'Unknown School';
    handleChange('schoolId', schoolId);
    setSelectedSchoolName(schoolName);
    setSchoolSearchTerm(schoolName); // Set search term to selected school name
    setShowSchoolDropdown(false);
    if (errors.schoolId) {
      setErrors(prev => ({ ...prev, schoolId: '' }));
    }
  };

  const handleSchoolInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSchoolSearchTerm(value);
    setShowSchoolDropdown(true);
    
    // If user clears the input, clear the selection
    if (!value.trim()) {
      handleChange('schoolId', '');
      setSelectedSchoolName('');
    } else {
      // Try to find matching school as user types
      const matchingSchool = schools.find((school: any) => {
        const schoolName = (school as any).SchoolName || school.schoolName || 'Unknown School';
        return schoolName.toLowerCase() === value.toLowerCase();
      });
      
      if (matchingSchool) {
        const schoolId = (matchingSchool as any).SchoolId || matchingSchool.schoolId;
        handleChange('schoolId', schoolId);
        setSelectedSchoolName((matchingSchool as any).SchoolName || matchingSchool.schoolName);
      } else {
        // Clear selection if no exact match
        handleChange('schoolId', '');
        setSelectedSchoolName('');
      }
    }
  };

  const handleSchoolInputFocus = () => {
    setShowSchoolDropdown(true);
    // If there's a selected school, show it in search term
    if (selectedSchoolName && !schoolSearchTerm) {
      setSchoolSearchTerm(selectedSchoolName);
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
          
          // If avatar file was selected, upload it now
          if (selectedAvatarFile && result.data) {
            // Get the child ID from response
            const data = result.data as any;
            const newChildId = data.childId || data.ChildId || data.id;
            
            // If we have childId, upload avatar
            if (newChildId) {
              await uploadAvatarForNewChild(newChildId, selectedAvatarFile);
            } else {
              console.warn('ChildId not found in response, avatar upload skipped');
            }
          }
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

  const handleAvatarFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Backend accepts max 2MB
    if (file.size > 2 * 1024 * 1024) {
      showError('Image size must be less than 2MB');
      return;
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      showError('Invalid file type. Only JPG, PNG and WebP are allowed.');
      return;
    }

    // If editing existing child, upload immediately
    if (child?.childId) {
      handleAvatarUpload(file);
    } else {
      // If adding new child, save file for later upload
      setSelectedAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!child?.childId) {
      // This shouldn't happen, but just in case
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const response = await uploadChildAvatar(child.childId, file);

      if (response.success && response.data) {
        const newAvatarUrl = response.data.avatarUrl;
        setAvatarUrl(newAvatarUrl);
        setAvatarError(false);
        showSuccess('Profile picture uploaded successfully!');
        // Refresh child data
        onSuccess();
      } else {
        showError(response.error || 'Failed to upload profile picture');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      showError(error?.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const uploadAvatarForNewChild = async (childId: string, file: File) => {
    setIsUploadingAvatar(true);
    try {
      const response = await uploadChildAvatar(childId, file);
      if (response.success && response.data) {
        setAvatarUrl(response.data.avatarUrl);
        setAvatarError(false);
        showSuccess('Profile picture uploaded successfully!');
      } else {
        // Don't show error as main action (creating child) already succeeded
        console.warn('Failed to upload avatar:', response.error);
      }
    } catch (error: any) {
      console.error('Error uploading avatar for new child:', error);
    } finally {
      setIsUploadingAvatar(false);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
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

          {/* Avatar Upload Section - Show for both add and edit */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              {(avatarUrl || avatarPreview) && !avatarError ? (
                <img
                  src={avatarPreview || avatarUrl || ''}
                  alt={child?.fullName || 'Child'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-blue-200 shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              <label className={`absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isUploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ImagePlus className="w-5 h-5" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarFileSelect}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {child ? 'Click icon to upload avatar' : 'Click icon to select avatar (will upload after saving)'}
            </p>
            {selectedAvatarFile && !child && (
              <p className="text-xs text-blue-600 mt-1">Avatar ready to upload</p>
            )}
          </div>

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
            <div className="relative" ref={schoolDropdownRef}>
              <SchoolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <input
                ref={schoolInputRef}
                type="text"
                value={schoolSearchTerm}
                onChange={handleSchoolInputChange}
                onFocus={handleSchoolInputFocus}
                placeholder={loadingData ? 'Loading...' : t('selectSchool')}
                disabled={loadingData}
                className={`form-input pl-10 pr-10 ${loadingData ? 'opacity-50 cursor-not-allowed' : ''} ${errors.schoolId ? 'border-red-500' : ''}`}
              />
              <ChevronDown 
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-transform pointer-events-none ${showSchoolDropdown ? 'rotate-180' : ''}`}
                onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
              />
              
              {showSchoolDropdown && !loadingData && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                  <div className="overflow-y-auto max-h-80">
                    {filteredSchools.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-500">No schools found</p>
                      </div>
                    ) : (
                      filteredSchools.map((school: any) => {
                        // Handle both camelCase and PascalCase from backend
                        const schoolId = school.SchoolId || school.schoolId;
                        const schoolName = school.SchoolName || school.schoolName || 'Unknown School';
                        const isSelected = formData.schoolId === schoolId;
                        return (
                          <button
                            key={schoolId}
                            type="button"
                            onClick={() => handleSchoolSelect(school)}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-blue-50' : ''}`}
                          >
                            <SchoolIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <span className="flex-1 text-sm text-gray-900">{schoolName}</span>
                            {isSelected && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
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
            <label className="form-label">{t('dateOfBirth')} </label>
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


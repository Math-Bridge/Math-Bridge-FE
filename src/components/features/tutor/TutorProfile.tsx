import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Save,
  X,
  Calendar,
  MapPin,
  Building,
} from 'lucide-react';
import { apiService, getTutorVerificationByUserId } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';

interface LocationPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface VerificationDetail {
  verificationId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  university: string;
  major: string;
  hourlyRate: number;
  bio: string;
  verificationStatus: string;
  verificationDate: string | null;
  createdDate: string | null;
  isDeleted: boolean;
}

interface Center {
  centerId: string;
  name: string;
  formattedAddress?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  tutorCount?: number;
  createdDate?: string;
}

interface TutorCenter {
  tutorCenterId: string;
  centerId: string;
  createdDate: string;
  center?: Center;
}

const TutorProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [verificationDetail, setVerificationDetail] = useState<VerificationDetail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tutorCenters, setTutorCenters] = useState<TutorCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  
  // Location autocomplete state
  const [locationInput, setLocationInput] = useState('');
  const [locationPredictions, setLocationPredictions] = useState<LocationPrediction[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    university: '',
    major: '',
    hourlyRate: 0,
    bio: '',
  });
  
  // User location state
  const [userLocation, setUserLocation] = useState({
    formattedAddress: '',
    city: '',
    district: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchTutorCenters();
      fetchUserLocation();
    }
  }, [user]);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const result = await getTutorVerificationByUserId(user.id);
      if (result.success && result.data) {
        setVerificationDetail(result.data);
        setFormData({
          university: result.data.university || '',
          major: result.data.major || '',
          hourlyRate: result.data.hourlyRate || 0,
          bio: result.data.bio || '',
        });
      } else {
        // If no verification exists, initialize empty form
        setFormData({
          university: '',
          major: '',
          hourlyRate: 0,
          bio: '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorCenters = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingCenters(true);
      const result = await apiService.request<any>(`/Tutors/${user.id}`);
      if (result.success && result.data) {
        // Backend returns tutor with tutorCenters array
        const centers = result.data.tutorCenters || result.data.TutorCenters || [];
        setTutorCenters(centers);
      }
    } catch (error) {
      console.error('Error fetching tutor centers:', error);
      // Don't show error, just log it - centers are optional
    } finally {
      setLoadingCenters(false);
    }
  };

  const fetchUserLocation = async () => {
    if (!user?.id) return;
    
    try {
      const result = await apiService.request<any>(`/Tutors/${user.id}`);
      if (result.success && result.data) {
        const tutorData = result.data;
        setUserLocation({
          formattedAddress: tutorData.formattedAddress || tutorData.FormattedAddress || '',
          city: tutorData.city || tutorData.City || '',
          district: tutorData.district || tutorData.District || '',
        });
        setLocationInput(tutorData.formattedAddress || tutorData.FormattedAddress || '');
      }
    } catch (error) {
      console.error('Error fetching user location:', error);
    }
  };

  // Location autocomplete handler
  const handleLocationInputChange = async (value: string) => {
    setLocationInput(value);
    setSelectedPlaceId('');

    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }

    if (value.trim().length < 3) {
      setLocationPredictions([]);
      setShowLocationDropdown(false);
      return;
    }

    locationTimeoutRef.current = setTimeout(async () => {
      setIsLoadingLocation(true);
      try {
        const response = await apiService.getAddressAutocomplete(value, 'VN');
        if (response.success && response.data?.predictions) {
          const predictions = response.data.predictions.map((pred: any) => {
            const predictionObj: LocationPrediction = {
              placeId: pred.placeId || pred.place_id || '',
              description: pred.description || '',
              mainText: pred.mainText || pred.structured_formatting?.main_text || pred.main_text || '',
              secondaryText: pred.secondaryText || pred.structured_formatting?.secondary_text || pred.secondary_text || ''
            };
            return predictionObj;
          });
          setLocationPredictions(predictions);
          setShowLocationDropdown(true);
        }
      } catch (error) {
        console.error('Error fetching location predictions:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    }, 300);
  };

  const handleLocationSelect = (prediction: LocationPrediction) => {
    setLocationInput(prediction.description);
    setSelectedPlaceId(prediction.placeId);
    setShowLocationDropdown(false);
    setLocationPredictions([]);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setLocationInput(userLocation.formattedAddress);
    setSelectedPlaceId('');
  };

  const handleCancel = () => {
    if (verificationDetail) {
      setFormData({
        university: verificationDetail.university || '',
        major: verificationDetail.major || '',
        hourlyRate: verificationDetail.hourlyRate || 0,
        bio: verificationDetail.bio || '',
      });
    }
    setLocationInput(userLocation.formattedAddress);
    setSelectedPlaceId('');
    setLocationPredictions([]);
    setShowLocationDropdown(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      
      // Validate location if changed
      if (locationInput && locationInput !== userLocation.formattedAddress && !selectedPlaceId) {
        showError('Please select a location from the dropdown');
        setSaving(false);
        return;
      }
      
      // Step 1: Update location if changed
      if (selectedPlaceId && locationInput !== userLocation.formattedAddress) {
        const locationResponse = await apiService.saveAddress(selectedPlaceId);
        if (!locationResponse.success) {
          showError(locationResponse.error || 'Failed to save location');
          setSaving(false);
          return;
        }
        // Refresh user location after save
        await fetchUserLocation();
      }
      
      // Step 2: Update verification (university, major, bio only - NOT hourlyRate)
      const verificationResult = await getTutorVerificationByUserId(user.id);
      let verificationId: string | null = null;
      
      if (verificationResult.success && verificationResult.data) {
        verificationId = verificationResult.data.verificationId;
      }

      if (verificationId) {
        // Update existing verification (without hourlyRate - only admin can change it)
        const updateResult = await apiService.request<any>(`/tutor-verifications/${verificationId}`, {
          method: 'PUT',
          body: JSON.stringify({
            University: formData.university,
            Major: formData.major,
            // HourlyRate is NOT included - only admin can update it
            Bio: formData.bio,
          }),
        });

        if (updateResult.success) {
          // Check if this was a forced update and validate all required fields
          const state = location.state as { needsLocation?: boolean; needsVerification?: boolean } | null;
          const wasForcedUpdate = state?.needsLocation || state?.needsVerification;
          
          // Refresh user context from localStorage to update the auth state
          refreshUser();
          
          // For tutor, validate all required fields: location, university, major, bio
          if (wasForcedUpdate) {
            const locationComplete = !state?.needsLocation || selectedPlaceId || userLocation.formattedAddress;
            const verificationComplete = !state?.needsVerification || (
              formData.university && 
              formData.major && 
              formData.bio
            );
            
            if (locationComplete && verificationComplete) {
              showSuccess('Profile updated successfully! Redirecting...');
              
              // Redirect to tutor dashboard
              setTimeout(() => {
                window.location.href = '/tutor/dashboard';
              }, 500);
              return; // Exit early
            } else {
              // Show error if not all required fields are filled
              const missingFields = [];
              if (!locationComplete) missingFields.push('location');
              if (!verificationComplete) {
                if (!formData.university) missingFields.push('university');
                if (!formData.major) missingFields.push('major');
                if (!formData.bio) missingFields.push('bio');
              }
              showError(`Please complete all required fields: ${missingFields.join(', ')}`);
              setSaving(false);
              return;
            }
          }
          
          showSuccess('Profile updated successfully!');
          setIsEditing(false);
          await fetchProfile();
        } else {
          showError(updateResult.error || 'Failed to update profile');
        }
      } else {
        // Create new verification if doesn't exist (without hourlyRate)
        const createResult = await apiService.request<any>(`/tutor-verifications`, {
          method: 'POST',
          body: JSON.stringify({
            UserId: user.id,
            University: formData.university,
            Major: formData.major,
            // HourlyRate is NOT included - only admin can set it
            Bio: formData.bio,
          }),
        });

        if (createResult.success) {
          // Check if this was a forced update
          const state = location.state as { needsLocation?: boolean; needsVerification?: boolean } | null;
          const wasForcedUpdate = state?.needsLocation || state?.needsVerification;
          
          // Refresh user context
          refreshUser();
          
          if (wasForcedUpdate) {
            const locationComplete = !state?.needsLocation || selectedPlaceId || userLocation.formattedAddress;
            const verificationComplete = !state?.needsVerification || (
              formData.university && 
              formData.major && 
              formData.bio
            );
            
            if (locationComplete && verificationComplete) {
              showSuccess('Profile created successfully! Redirecting...');
              setTimeout(() => {
                window.location.href = '/tutor/dashboard';
              }, 500);
              return;
            } else {
              const missingFields = [];
              if (!locationComplete) missingFields.push('location');
              if (!verificationComplete) {
                if (!formData.university) missingFields.push('university');
                if (!formData.major) missingFields.push('major');
                if (!formData.bio) missingFields.push('bio');
              }
              showError(`Please complete all required fields: ${missingFields.join(', ')}`);
              setSaving(false);
              return;
            }
          }
          
          showSuccess('Profile created successfully!');
          setIsEditing(false);
          await fetchProfile();
        } else {
          showError(createResult.error || 'Failed to create profile');
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError(error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800 flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Not Verified</span>
        </span>
      );
    }
    
    const normalized = status.toLowerCase();
    if (normalized === 'approved' || normalized === 'active') {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>Approved</span>
        </span>
      );
    }
    if (normalized === 'rejected') {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 flex items-center space-x-2">
          <XCircle className="w-4 h-4" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center space-x-2">
        <Clock className="w-4 h-4" />
        <span>Pending</span>
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="text-gray-600 mt-1">Manage your tutor profile and verification information</p>
          </div>
          <div className="flex items-center space-x-3">
            {verificationDetail && getStatusBadge(verificationDetail.verificationStatus)}
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Personal Information</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-gray-900 mt-1">{user?.fullName || user?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </label>
            <p className="text-gray-900 mt-1">{user?.email || 'N/A'}</p>
          </div>
          {user?.phoneNumber && (
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>Phone</span>
              </label>
              <p className="text-gray-900 mt-1">{user.phoneNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <GraduationCap className="w-5 h-5" />
          <span>Academic Information</span>
        </h3>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your university"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Major <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your major"
                required
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">University</label>
              <p className="text-gray-900 mt-1">{verificationDetail?.university || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Major</label>
              <p className="text-gray-900 mt-1">{verificationDetail?.major || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>Hourly Rate</span>
                <span className="text-xs text-gray-400 ml-1">(Set by Admin)</span>
              </label>
              <p className="text-gray-900 mt-1">
                {verificationDetail?.hourlyRate ? (
                  <span>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(verificationDetail.hourlyRate * 25000)}
                    /hour
                  </span>
                ) : (
                  'Not set by admin yet'
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <span>Location</span>
        </h3>
        {isEditing ? (
          <div className="space-y-4">
            <div className="relative" ref={locationDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start typing your address..."
                required
              />
              {isLoadingLocation && (
                <div className="absolute right-3 top-10">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              {showLocationDropdown && locationPredictions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {locationPredictions.map((prediction, index) => (
                    <div
                      key={prediction.placeId || index}
                      onClick={() => handleLocationSelect(prediction)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{prediction.mainText}</div>
                      <div className="text-sm text-gray-500">{prediction.secondaryText}</div>
                    </div>
                  ))}
                </div>
              )}
              {locationInput && !selectedPlaceId && locationInput !== userLocation.formattedAddress && (
                <p className="text-xs text-amber-600 mt-1">Please select a location from the dropdown</p>
              )}
            </div>
            {(userLocation.city || userLocation.district) && (
              <div className="text-sm text-gray-600">
                <p><strong>City:</strong> {userLocation.city || 'N/A'}</p>
                <p><strong>District:</strong> {userLocation.district || 'N/A'}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {userLocation.formattedAddress ? (
              <div>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-900">{userLocation.formattedAddress}</p>
                </div>
                {(userLocation.city || userLocation.district) && (
                  <p className="text-sm text-gray-600 ml-7">
                    {userLocation.district && `${userLocation.district}, `}
                    {userLocation.city}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No location set</p>
            )}
          </div>
        )}
      </div>

      {/* Biography */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Biography</span>
        </h3>
        {isEditing ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tell us about yourself
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write a brief biography about your teaching experience, qualifications, and teaching style..."
            />
            <p className="text-xs text-gray-500 mt-2">Maximum 5000 characters</p>
          </div>
        ) : (
          <div>
            {verificationDetail?.bio ? (
              <p className="text-gray-700 whitespace-pre-wrap">{verificationDetail.bio}</p>
            ) : (
              <p className="text-gray-500 italic">No biography provided</p>
            )}
          </div>
        )}
      </div>

      {/* Center Assignment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Building className="w-5 h-5" />
          <span>Center Assignment</span>
        </h3>
        {loadingCenters ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tutorCenters.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No Center Assigned</p>
            <p className="text-sm text-gray-500 mt-2">
              You have not been assigned to any center yet. Staff will assign you to a center based on your location.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tutorCenters.map((tutorCenter) => {
              const center = tutorCenter.center || tutorCenter.Center;
              if (!center) return null;
              
              return (
                <div
                  key={tutorCenter.tutorCenterId || tutorCenter.TutorCenterId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{center.name || center.Name}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Assigned
                        </span>
                      </div>
                      {center.formattedAddress || center.FormattedAddress ? (
                        <div className="flex items-start space-x-1 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600">
                            {center.formattedAddress || center.FormattedAddress}
                          </p>
                        </div>
                      ) : null}
                      {(center.city || center.City) && (
                        <p className="text-sm text-gray-500">
                          {center.city || center.City}
                          {center.district || center.District ? `, ${center.district || center.District}` : ''}
                        </p>
                      )}
                      {tutorCenter.createdDate && (
                        <p className="text-xs text-gray-400 mt-2">
                          Assigned on: {formatDate(tutorCenter.createdDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification Timeline */}
      {verificationDetail && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Verification Timeline</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Created Date</label>
              <p className="text-gray-900 mt-1">{formatDate(verificationDetail.createdDate)}</p>
            </div>
            {verificationDetail.verificationDate && (
              <div>
                <label className="text-sm font-medium text-gray-500">Verification Date</label>
                <p className="text-gray-900 mt-1">{formatDate(verificationDetail.verificationDate)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Message */}
      {verificationDetail && verificationDetail.verificationStatus && 
       verificationDetail.verificationStatus.toLowerCase() !== 'approved' && 
       verificationDetail.verificationStatus.toLowerCase() !== 'active' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Your profile changes will be reviewed by staff. Once approved, your updated information will be visible to parents.
          </p>
        </div>
      )}
    </div>
  );
};

export default TutorProfile;











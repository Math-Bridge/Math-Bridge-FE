import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Mail,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Save,
  X,
  Calendar,
  MapPin,
  Building,
  ImagePlus,
  AlertCircle,
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [locationInput, setLocationInput] = useState('');
  const [locationPredictions, setLocationPredictions] = useState<LocationPrediction[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    university: '',
    major: '',
    hourlyRate: 0,
    bio: '',
  });

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
      fetchUserData();
    }
  }, [user]);

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
        const centers = result.data.tutorCenters || result.data.TutorCenters || [];
        setTutorCenters(centers);
      }
    } catch (error) {
      console.error('Error fetching tutor centers:', error);
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

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getUserById(user.id);
      if (response.success && response.data) {
        const userData = response.data;
        let userAvatarUrl = userData.avatarUrl || userData.AvatarUrl || null;
        if (userAvatarUrl && userData.avatarVersion) {
          const separator = userAvatarUrl.includes('?') ? '&' : '?';
          userAvatarUrl = `${userAvatarUrl}${separator}v=${userData.avatarVersion}`;
        }
        setAvatarUrl(userAvatarUrl);

        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            const updatedUser = {
              ...parsedUser,
              avatarUrl: userAvatarUrl
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (err) {
            console.error('Error updating localStorage:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError('Image size must be less than 2MB');
      return;
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      showError('Invalid file type. Only JPG, PNG and WebP are allowed.');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const response = await apiService.uploadAvatar(file);

      if (response.success && response.data) {
        const newAvatarUrl = response.data.avatarUrl;
        setAvatarUrl(newAvatarUrl);

        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            const updatedUser = {
              ...parsedUser,
              avatarUrl: newAvatarUrl
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (err) {
            console.error('Error updating localStorage:', err);
          }
        }

        await fetchUserData();
        showSuccess('Profile picture uploaded successfully!');
      } else {
        showError(response.error || 'Failed to upload profile picture');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      showError(error?.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

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

      if (locationInput && locationInput !== userLocation.formattedAddress && !selectedPlaceId) {
        showError('Please select a location from the dropdown');
        setSaving(false);
        return;
      }

      if (selectedPlaceId && locationInput !== userLocation.formattedAddress) {
        const locationResponse = await apiService.saveAddress(selectedPlaceId);
        if (!locationResponse.success) {
          showError(locationResponse.error || 'Failed to save location');
          setSaving(false);
          return;
        }

        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            userData.placeId = selectedPlaceId;
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Updated user placeId in localStorage:', selectedPlaceId);
          } catch (error) {
            console.error('Error updating user in localStorage:', error);
          }
        }

        await fetchUserLocation();
      }

      const verificationResult = await getTutorVerificationByUserId(user.id);
      let verificationId: string | null = null;

      if (verificationResult.success && verificationResult.data) {
        verificationId = verificationResult.data.verificationId;
      }

      if (verificationId) {
        const existingHourlyRate = verificationResult.data.hourlyRate || 0.01;

        const updateResult = await apiService.request<any>(`/tutor-verifications/${verificationId}`, {
          method: 'PUT',
          body: JSON.stringify({
            University: formData.university,
            Major: formData.major,
            HourlyRate: existingHourlyRate,
            Bio: formData.bio,
          }),
        });

        if (updateResult.success) {
          const state = location.state as { needsLocation?: boolean; needsVerification?: boolean } | null;
          const wasForcedUpdate = state?.needsLocation || state?.needsVerification;

          if (wasForcedUpdate) {
            const locationComplete = !state?.needsLocation || selectedPlaceId || userLocation.formattedAddress;
            const verificationComplete = !state?.needsVerification || (
              formData.university &&
              formData.major &&
              formData.bio
            );

            if (locationComplete && verificationComplete) {
              await refreshUser();

              showSuccess('Profile updated successfully!');

              window.dispatchEvent(new Event('profileUpdated'));

              setIsEditing(false);
              await fetchProfile();
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

          await refreshUser();

          showSuccess('Profile updated successfully!');
          setIsEditing(false);
          await fetchProfile();

          window.dispatchEvent(new Event('profileUpdated'));
        } else {
          showError(updateResult.error || 'Failed to update profile');
        }
      } else {
        const createResult = await apiService.request<any>(`/tutor-verifications`, {
          method: 'POST',
          body: JSON.stringify({
            UserId: user.id,
            University: formData.university,
            Major: formData.major,
            HourlyRate: 0.01,
            Bio: formData.bio,
          }),
        });

        if (createResult.success) {
          const state = location.state as { needsLocation?: boolean; needsVerification?: boolean } | null;
          const wasForcedUpdate = state?.needsLocation || state?.needsVerification;

          if (wasForcedUpdate) {
            const locationComplete = !state?.needsLocation || selectedPlaceId || userLocation.formattedAddress;
            const verificationComplete = !state?.needsVerification || (
              formData.university &&
              formData.major &&
              formData.bio
            );

            if (locationComplete && verificationComplete) {
              await refreshUser();

              showSuccess('Profile created successfully!');

              window.dispatchEvent(new Event('profileUpdated'));

              setIsEditing(false);
              await fetchProfile();
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

          await refreshUser();

          showSuccess('Profile created successfully!');
          setIsEditing(false);
          await fetchProfile();

          window.dispatchEvent(new Event('profileUpdated'));
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          Not Verified
        </span>
      );
    }

    const normalized = status.toLowerCase();
    if (normalized === 'approved' || normalized === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm">
          <CheckCircle className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    }
    if (normalized === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-red-100 to-rose-100 text-red-700 shadow-sm">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 shadow-sm">
        <Clock className="w-3.5 h-3.5" />
        Pending
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary/20 border-t-primary"></div>
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-cream">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 mt-6 mb-6">
          <div className="px-6 pt-6 pb-6 relative">
            {/* Status Badge and Cancel Button */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
            {verificationDetail && getStatusBadge(verificationDetail.verificationStatus)}
          {isEditing && (
              <button
                onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all shadow-md flex items-center gap-2 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
          )}
        </div>
            {/* Profile Picture */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-64 h-64 rounded-xl object-cover border-4 border-gray-200 shadow-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                        setAvatarUrl(null);
                      }
                    }}
                  />
                ) : null}
                <div
                  className={`w-64 h-64 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-7xl font-bold border-4 border-gray-200 shadow-xl ${avatarUrl ? 'hidden' : ''}`}
                >
                  {((user as any)?.fullName || user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                {isEditing && (
                  <label className={`absolute bottom-2 right-2 bg-white text-primary p-2.5 rounded-full cursor-pointer hover:bg-primary/10 transition-all shadow-lg border-2 border-gray-200 ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploadingAvatar ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name and Title */}
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {(user as any)?.fullName || user?.name || 'My Profile'}
              </h1>
              <p className="text-gray-600 text-lg mb-2">
                {verificationDetail?.major ? `${verificationDetail.major} • ` : ''}
                {verificationDetail?.university || 'Tutor'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {userLocation.formattedAddress && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{userLocation.city || userLocation.formattedAddress}</span>
                  </div>
                )}
                {user?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">About</h2>
          </div>
          {isEditing ? (
            <div>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-gray-600"
                placeholder="Write a brief biography about your teaching experience, qualifications, and teaching style..."
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Maximum 5000 characters
              </p>
            </div>
          ) : (
            <div>
              {verificationDetail?.bio ? (
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{verificationDetail.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No biography provided yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Education
            </h2>
          </div>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  University <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your university"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Major <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your major"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {verificationDetail?.university && (
                <div>
                  <p className="text-gray-900 font-semibold">{verificationDetail.university}</p>
                  {verificationDetail.major && (
                    <p className="text-gray-600 text-sm">{verificationDetail.major}</p>
                  )}
                </div>
              )}
              {verificationDetail?.hourlyRate && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hourly Rate</span>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">Set by Admin</span>
                  </div>
                  <p className="text-gray-900 font-bold text-lg mt-1">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(verificationDetail.hourlyRate * 25000)}/hour
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location
            </h2>
          </div>
          {isEditing ? (
            <div className="space-y-4">
              <div className="relative" ref={locationDropdownRef}>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Start typing your address..."
                    required
                  />
                  {isLoadingLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {showLocationDropdown && locationPredictions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {locationPredictions.map((prediction, index) => (
                      <div
                        key={prediction.placeId || index}
                        onClick={() => handleLocationSelect(prediction)}
                        className="px-4 py-3 hover:bg-primary/10 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-semibold text-gray-900">{prediction.mainText}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{prediction.secondaryText}</div>
                      </div>
                    ))}
                  </div>
                )}
                {locationInput && !selectedPlaceId && locationInput !== userLocation.formattedAddress && (
                  <div className="flex items-center gap-2 mt-2 p-3 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700">Please select a location from the dropdown</p>
                  </div>
                )}
              </div>
              {(userLocation.city || userLocation.district) && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Current Location Details</p>
                  <div className="space-y-1 text-sm text-gray-700">
                    {userLocation.city && <p><strong>City:</strong> {userLocation.city}</p>}
                    {userLocation.district && <p><strong>District:</strong> {userLocation.district}</p>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {userLocation.formattedAddress ? (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{userLocation.formattedAddress}</p>
                    {(userLocation.city || userLocation.district) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {userLocation.district && `${userLocation.district}, `}
                        {userLocation.city}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No location set</p>
              )}
            </div>
          )}
        </div>

        {/* Center Assignment */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Center Assignment
            </h2>
          </div>
          {loadingCenters ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary/20 border-t-primary"></div>
                <p className="text-sm text-gray-500">Loading centers...</p>
              </div>
            </div>
          ) : tutorCenters.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-semibold mb-2">No Center Assigned</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                You have not been assigned to any center yet. Staff will assign you to a center based on your location.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tutorCenters.map((tutorCenter) => {
                const center = tutorCenter.center || (tutorCenter as any).Center;
                if (!center) return null;

                return (
                  <div
                    key={tutorCenter.tutorCenterId || (tutorCenter as any).TutorCenterId}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary/30 hover:shadow-md transition-all bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-900">{center.name || center.Name}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Assigned
                          </span>
                        </div>
                        {center.formattedAddress || center.FormattedAddress ? (
                          <div className="flex items-start gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">
                              {center.formattedAddress || center.FormattedAddress}
                            </p>
                          </div>
                        ) : null}
                        {(center.city || center.City) && (
                          <p className="text-sm text-gray-500 mb-2">
                            {center.city || center.City}
                            {center.district || center.District ? `, ${center.district || center.District}` : ''}
                          </p>
                        )}
                        {tutorCenter.createdDate && (
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <p className="text-xs text-gray-500">
                              Assigned on: <span className="font-medium">{formatDate(tutorCenter.createdDate)}</span>
                            </p>
                          </div>
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
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Verification Timeline
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Created Date</p>
                <p className="text-gray-900 font-semibold">{formatDate(verificationDetail.createdDate)}</p>
              </div>
              {verificationDetail.verificationDate && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Verification Date</p>
                  <p className="text-gray-900 font-semibold">{formatDate(verificationDetail.verificationDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alert for Pending Status */}
        {verificationDetail && verificationDetail.verificationStatus &&
         verificationDetail.verificationStatus.toLowerCase() !== 'approved' &&
         verificationDetail.verificationStatus.toLowerCase() !== 'active' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900 mb-1">Profile Under Review</p>
                <p className="text-sm text-yellow-800">
                  Your profile changes will be reviewed by staff. Once approved, your updated information will be visible to parents.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorProfile;

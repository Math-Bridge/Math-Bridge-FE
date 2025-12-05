import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Camera,
  Lock,
  MapPin,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';

interface LocationPrediction {
  placeId: string;
  place_id?: string; // Add optional snake_case property for compatibility
  description: string;
  mainText: string;
  secondaryText: string;
}

const ParentProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(false);

  // Location autocomplete state
  const [locationInput, setLocationInput] = useState('');
  const [locationPredictions, setLocationPredictions] = useState<LocationPrediction[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [originalData, setOriginalData] = useState(formData);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);


  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalData(formData);
    setLocationInput(formData.address || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(originalData);
    setLocationInput(originalData.address || '');
    setLocationPredictions([]);
    setShowLocationDropdown(false);
  };

  const handleSave = async () => {
    if (!user?.id) {
      showError('User not authenticated');
      return;
    }

    // Validate required fields if user was forced to update
    const state = location.state as { needsLocation?: boolean; needsPhone?: boolean } | null;
    
    // Validate phone number format and length
    if (formData.phone && formData.phone !== 'N/A') {
      const digitsOnly = formData.phone.replace(/[^0-9]/g, '');
      
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        showError('Phone number must be between 10 and 15 digits');
        return;
      }
    }
    
    // If user needs location and it's still missing, show error
    if (state?.needsLocation && !selectedPlaceId && !formData.address) {
      showError('Please set your location before continuing');
      return;
    }
    
    // If user needs phone and it's still 'N/A' or empty, show error
    if (state?.needsPhone && (!formData.phone || formData.phone === 'N/A')) {
      showError('Please update your phone number before continuing');
      return;
    }
    
    // If location is being edited and no place is selected, warn user
    if (isEditing && locationInput && !selectedPlaceId && locationInput !== formData.address) {
      showError('Please select a location from the dropdown');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Fetch current user data from backend to get all fields
      console.log('Fetching current user data before update...');
      const currentUserResponse = await apiService.getUserById(user.id);

      if (!currentUserResponse.success || !currentUserResponse.data) {
        showError('Failed to fetch current user data');
        setIsLoading(false);
        return;
      }

      const currentUserData = currentUserResponse.data;
      console.log('Current user data from backend:', currentUserData);

      // Step 2: Build update data by taking current data and replacing edited fields
      const updateData: Record<string, string> = {};
      
      // Always include Gender from current data (required field)
      if (currentUserData.Gender || currentUserData.gender) {
        updateData.Gender = currentUserData.Gender || currentUserData.gender;
        console.log('Including Gender:', updateData.Gender);
      }

      // Use edited name if changed, otherwise use current
      if (formData.name && formData.name.trim()) {
        updateData.FullName = formData.name;
        console.log('Using edited name:', updateData.FullName);
      } else if (currentUserData.FullName || currentUserData.fullName) {
        updateData.FullName = currentUserData.FullName || currentUserData.fullName;
        console.log('Using current name:', updateData.FullName);
      }

      // Use edited phone if changed, otherwise use current
      if (formData.phone && formData.phone.trim()) {
        updateData.PhoneNumber = formData.phone;
        console.log('Using edited phone:', updateData.PhoneNumber);
      } else if (currentUserData.PhoneNumber || currentUserData.phoneNumber) {
        updateData.PhoneNumber = currentUserData.PhoneNumber || currentUserData.phoneNumber;
        console.log('Using current phone:', updateData.PhoneNumber);
      }
      
      // Update user info with complete data
      console.log('Sending update to API with data:', updateData);
      const response = await apiService.updateUser(user.id, updateData);

      if (!response.success) {
        const errorMsg = response.error || 'Failed to update profile';
        console.error('Update failed:', errorMsg);
        showError(errorMsg);
        setIsLoading(false);
        return;
      }

      console.log('User update successful!');

      // Update localStorage with ALL updated data
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const updatedUser = {
            ...parsedUser,
            name: updateData.FullName || parsedUser.name,
            phone: updateData.PhoneNumber || parsedUser.phone
          };
          
          // Add location data if it was updated
          if (selectedPlaceId) {
            updatedUser.placeId = selectedPlaceId;
            updatedUser.formattedAddress = locationInput;
          }
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Updated user in localStorage:', updatedUser);
        } catch (err) {
          console.error('Error updating localStorage:', err);
        }
      }

      // Step 3: Save location if placeId is selected
      if (selectedPlaceId) {
        console.log('Saving location with placeId:', selectedPlaceId);
        console.log('Location description:', locationInput);

        const locationResponse = await apiService.saveAddress(selectedPlaceId);
        console.log('Location save response:', locationResponse);

        if (!locationResponse.success) {
          showError(locationResponse.error || 'Failed to save location');
          setIsLoading(false);
          return;
        }

        console.log('Location saved successfully!');
      }
      
      // Check if this was a forced update (user was redirected here due to missing data)
      const state = location.state as { needsLocation?: boolean; needsPhone?: boolean } | null;
      const wasForcedUpdate = state?.needsLocation || state?.needsPhone;
      
      // Refresh user context from localStorage to update the auth state
      refreshUser();
      
      // If it was a forced update and user completed required fields, redirect to role-appropriate page
      if (wasForcedUpdate) {
        const locationComplete = !state?.needsLocation || selectedPlaceId || formData.address;
        const phoneComplete = !state?.needsPhone || (formData.phone && formData.phone !== 'N/A');
        
        if (locationComplete && phoneComplete) {
          showSuccess('Profile updated successfully! Redirecting...');
          
          // Get user role to determine redirect destination
          const savedUser = localStorage.getItem('user');
          let redirectPath = '/home'; // Default for parent
          
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser);
              const userRole = userData.role;
              
              if (userRole === 'admin') {
                redirectPath = '/admin';
              } else if (userRole === 'tutor') {
                redirectPath = '/tutor/dashboard';
              } else if (userRole === 'staff') {
                redirectPath = '/staff';
              } else {
                redirectPath = '/home'; // Default for parent
              }
            } catch (error) {
              console.error('Error parsing user data for redirect:', error);
              // Fallback to home
            }
          }
          
          // Navigate to role-appropriate page after refresh
          setTimeout(() => {
            refreshUser(); // Refresh user context to update auth state
            navigate(redirectPath, { replace: true });
          }, 500);
          return; // Exit early
        }
      }

      // If no location was updated, just show success and refresh data
      showSuccess('Profile updated successfully!');
      setIsEditing(false);
      setSelectedPlaceId('');
      setLocationPredictions([]);
      setShowLocationDropdown(false);
      setShowLocationBanner(false);

      console.log('Refreshing user data after save...');
      await fetchUserData();
      console.log('User data refreshed');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      console.error('Error updating profile:', err);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate current password is provided
    if (!passwordData.currentPassword || passwordData.currentPassword.trim() === '') {
      showError('Current password is required');
      return;
    }

    // Validate new password matches confirm password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    // Validate new password length
    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    // Validate new password format (uppercase, lowercase, number, special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      showError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.changePassword({
        CurrentPassword: passwordData.currentPassword,
        NewPassword: passwordData.newPassword
      });

      if (response.success) {
        showSuccess('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        // Handle specific error messages from backend
        const errorMessage = response.error || 'Failed to change password';
        if (errorMessage.includes('Current password is incorrect') || errorMessage.includes('incorrect')) {
          showError('Current password is incorrect. Please try again.');
        } else {
          showError(errorMessage);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to change password. Please try again.';
      if (errorMessage.includes('Current password is incorrect') || errorMessage.includes('incorrect')) {
        showError('Current password is incorrect. Please try again.');
      } else {
        showError(errorMessage);
      }
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingAvatar(true);

    try {
      const response = await apiService.uploadAvatar(file);

      if (response.success && response.data) {
        const newAvatarUrl = response.data.avatarUrl;
        setAvatarUrl(newAvatarUrl);
        
        // Update user in localStorage
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

        // Refresh user data to get updated avatar
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
      // Reset file input
      event.target.value = '';
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
        console.log('Raw API response:', response.data?.predictions); // Debugging log to inspect raw predictions
        if (response.success && response.data?.predictions) {
          const predictions = response.data.predictions.map((pred: {
            placeId?: string;
            place_id?: string;
            description?: string;
            mainText?: string;
            main_text?: string;
            secondaryText?: string;
            secondary_text?: string;
            structured_formatting?: {
              main_text?: string;
              secondary_text?: string;
            };
          }) => {
            // Log the raw prediction to see its structure
            console.log('Raw prediction object:', pred);

            // The API might return either camelCase or snake_case, handle both
            const predictionObj: LocationPrediction = {
              placeId: pred.placeId || pred.place_id || '',
              description: pred.description || '',
              mainText: pred.mainText || pred.structured_formatting?.main_text || pred.main_text || '',
              secondaryText: pred.secondaryText || pred.structured_formatting?.secondary_text || pred.secondary_text || ''
            };

            console.log('Mapped prediction:', predictionObj); // Debug log to verify mapping
            return predictionObj;
          });

          console.log('All mapped predictions:', predictions);
          setLocationPredictions(predictions);
          setShowLocationDropdown(true);
        }
      } catch (error) {
        console.error('Location autocomplete error:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    }, 500);
  };

  const handleLocationSelect = (prediction: LocationPrediction) => {
    console.log('handleLocationSelect called with:', prediction);
    console.log('prediction.placeId:', prediction.placeId);
    console.log('prediction.place_id:', prediction.place_id);
    console.log('prediction keys:', Object.keys(prediction));

    const placeId = prediction.placeId || prediction.place_id || '';
    console.log('Final placeId to use:', placeId);

    setLocationInput(prediction.description);
    setSelectedPlaceId(placeId);
    setFormData(prev => ({ ...prev, address: prediction.description }));
    setShowLocationDropdown(false);
    setLocationPredictions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user data function
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsFetching(true);
      const response = await apiService.getUserById(user.id);
      
      if (response.success && response.data) {
        const userData = response.data;

        // Log the full response to see what fields are available
        console.log('Full user data from backend:', userData);

        // Check multiple possible location field names including formattedAddress
        const userAddress = userData.formattedAddress ||
                           userData.FormattedAddress ||
                           userData.Address ||
                           userData.address ||
                           userData.location ||
                           userData.Location ||
                           userData.addressLine ||
                           userData.AddressLine ||
                           '';

        console.log('Extracted address from user data:', userAddress);
        console.log('PlaceId from user data:', userData.PlaceId || userData.placeId);

        // Map backend response to frontend format
        const mappedData = {
          name: userData.FullName || userData.fullName || userData.name || '',
          email: userData.Email || userData.email || '',
          phone: userData.PhoneNumber || userData.phoneNumber || userData.phone || '',
          address: userAddress
        };

        console.log('Final mapped form data:', mappedData);

        // Set avatar URL if available (with cache busting if version exists)
        let userAvatarUrl = userData.avatarUrl || userData.AvatarUrl || null;
        if (userAvatarUrl && userData.avatarVersion) {
          // Add version query parameter for cache busting
          const separator = userAvatarUrl.includes('?') ? '&' : '?';
          userAvatarUrl = `${userAvatarUrl}${separator}v=${userData.avatarVersion}`;
        }
        setAvatarUrl(userAvatarUrl);

        setFormData(mappedData);
        setOriginalData(mappedData);
        setLocationInput(userAddress);

        // Update user in localStorage with placeId and avatarUrl
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            const updatedUser = {
              ...parsedUser,
              placeId: userData.placeId || userData.PlaceId,
              formattedAddress: userAddress,
              avatarUrl: userAvatarUrl
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('Updated user in localStorage with placeId:', updatedUser.placeId);
          } catch (err) {
            console.error('Error updating localStorage:', err);
          }
        }
      } else {
        showError(response.error || 'Failed to load profile data');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load profile data';
      console.error('Error fetching user data:', err);
      showError(errorMsg);
    } finally {
      setIsFetching(false);
    }
  }, [user?.id, showError]);

  // Fetch user data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }

    // Check if redirected here for location or phone setup
    const state = location.state as { needsLocation?: boolean; needsPhone?: boolean } | null;
    if (state?.needsLocation || state?.needsPhone) {
      setShowLocationBanner(true);
      setIsEditing(true);
      setActiveTab('profile');
    }
  }, [user?.id, location.state, fetchUserData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-cream via-white to-gray-50">
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
        {/* Profile Setup Banner */}
        {showLocationBanner && (
          <div className="mb-6 bg-primary/10 border-l-4 border-primary p-4 rounded-lg shadow-sm animate-fade-in">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary-dark mb-1">
                  {(() => {
                    const state = location.state as { needsLocation?: boolean; needsPhone?: boolean } | null;
                    if (state?.needsLocation && state?.needsPhone) {
                      return 'Welcome! Please update your profile';
                    } else if (state?.needsLocation) {
                      return 'Welcome! Please set up your location';
                    } else if (state?.needsPhone) {
                      return 'Welcome! Please update your phone number';
                    }
                    return 'Welcome! Please complete your profile';
                  })()}
                </h3>
                <p className="text-primary-dark text-sm">
                  {(() => {
                    const state = location.state as { needsLocation?: boolean; needsPhone?: boolean } | null;
                    if (state?.needsLocation && state?.needsPhone) {
                      return 'To help us provide you with the best services, please update your location and phone number below.';
                    } else if (state?.needsLocation) {
                      return 'To help us provide you with the best tutoring services, please add your location below. Start typing your address and select from the suggestions.';
                    } else if (state?.needsPhone) {
                      return 'To help us keep in touch with you, please update your phone number below.';
                    }
                    return 'Please complete the required information below.';
                  })()}
                </p>
              </div>
              <button
                onClick={() => setShowLocationBanner(false)}
                className="text-primary hover:text-primary-dark transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-sm sm:text-base text-slate-600">Manage your profile and account preferences</p>
        </div>

        {/* Loading State */}
        {isFetching && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Main Content - Only show when not fetching */}
        {!isFetching && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <nav className="p-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeTab === 'profile'
                        ? 'bg-primary/10 text-primary-dark'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-3" />
                      <span className="font-medium">Profile</span>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mt-2 ${
                      activeTab === 'security'
                        ? 'bg-primary/10 text-primary-dark'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 mr-3" />
                      <span className="font-medium">Security</span>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9">
              {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-slate-200">
                    <div className="relative">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                          onError={(e) => {
                            // Fallback to initial if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                              setAvatarUrl(null); // Clear invalid URL
                            }
                          }}
                          onLoad={() => {
                            // Hide fallback when image loads successfully
                            const fallback = document.querySelector('.avatar-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`avatar-fallback w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ${avatarUrl ? 'hidden' : ''}`}
                      >
                        {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      {isEditing && (
                        <label className={`absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {isUploadingAvatar ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Camera className="w-4 h-4" />
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
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{formData.name || 'User'}</h2>
                      <p className="text-slate-600">{formData.email}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl ${
                            isEditing
                              ? 'border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          } transition-colors`}
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600"
                        />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Email cannot be changed</p>
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl ${
                            isEditing
                              ? 'border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          } transition-colors`}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      {isEditing && (
                        <p className="mt-1 text-sm text-slate-500">
                          Must be between 10-15 digits
                        </p>
                      )}
                    </div>

                    {/* Location Field with Autocomplete */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Location
                      </label>
                      <div className="relative" ref={locationDropdownRef}>
                        <MapPin className="absolute left-3 top-3 text-slate-400 w-5 h-5 z-10" />
                        <input
                          type="text"
                          value={locationInput}
                          onChange={(e) => handleLocationInputChange(e.target.value)}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl ${
                            isEditing
                              ? 'border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          } transition-colors`}
                          placeholder="Start typing your address..."
                        />
                        
                        {/* Location Dropdown */}
                        {isEditing && showLocationDropdown && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                            {isLoadingLocation ? (
                              <div className="p-4 text-center text-slate-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2 text-sm">Searching...</p>
                              </div>
                            ) : locationPredictions.length > 0 ? (
                              locationPredictions.map((prediction) => (
                                <button
                                  key={prediction.placeId}
                                  onClick={() => handleLocationSelect(prediction)}
                                  className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-slate-100 last:border-b-0"
                                >
                                  <div className="flex items-start">
                                    <MapPin className="w-4 h-4 text-primary mt-1 mr-2 flex-shrink-0" />
                                    <div>
                                      <p className="text-slate-900 font-medium">{prediction.mainText}</p>
                                      <p className="text-sm text-slate-500">{prediction.secondaryText}</p>
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-slate-500">
                                <p className="text-sm">No locations found. Try a different search.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <p className="mt-1 text-sm text-slate-500">
                          Type at least 3 characters to search for your location
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end space-x-4">
                    {!isEditing ? (
                      <button
                        onClick={handleEdit}
                        className="flex items-center px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                      >
                        <Edit2 className="w-5 h-5 mr-2" />
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCancel}
                          disabled={isLoading}
                          className="flex items-center px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          <X className="w-5 h-5 mr-2" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isLoading}
                          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Security Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <h3 className="font-semibold text-slate-900 mb-2">Password</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Change your password to keep your account secure
                      </p>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Change Password</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={isLoading}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentProfile;


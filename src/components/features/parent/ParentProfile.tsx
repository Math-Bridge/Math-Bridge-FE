import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Camera,
  Lock,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';

const ParentProfile: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [originalData, setOriginalData] = useState(formData);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalData(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(originalData);
  };


  const handleSave = async () => {
    if (!user?.id) {
      showError('User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Update user basic info (FullName, PhoneNumber)
      const updateData: any = {};
      
      if (formData.name) {
        updateData.FullName = formData.name;
      }
      if (formData.phone) {
        updateData.PhoneNumber = formData.phone;
      }
      
      // Update user info if there are changes
      if (updateData.FullName || updateData.PhoneNumber) {
        const response = await apiService.updateUser(user.id, updateData);
        if (!response.success) {
          const errorMsg = response.error || 'Failed to update profile';
          showError(errorMsg);
          setIsLoading(false);
          return;
        }
      }


      showSuccess('Profile updated successfully!');
      setIsEditing(false);
      setOriginalData(formData);
      // Refresh user data to get latest from server
      await fetchUserData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      console.error('Error updating profile:', err);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      showSuccess('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsLoading(false);
    }, 1000);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    showSuccess('Profile picture uploaded successfully!');
  };

  // Fetch user data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    try {
      setIsFetching(true);
      const response = await apiService.getUserById(user.id);
      
      if (response.success && response.data) {
        const userData = response.data;
        // Map backend response to frontend format
        setFormData({
          name: userData.FullName || userData.fullName || userData.name || '',
          email: userData.Email || userData.email || '',
          phone: userData.PhoneNumber || userData.phoneNumber || userData.phone || ''
        });
        setOriginalData({
          name: userData.FullName || userData.fullName || userData.name || '',
          email: userData.Email || userData.email || '',
          phone: userData.PhoneNumber || userData.phoneNumber || userData.phone || ''
        });
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
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-slate-600">Manage your profile and account preferences</p>
        </div>

        {/* Loading State */}
        {isFetching && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5" />
                    <span>Security</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>

              </nav>

              <div className="border-t border-slate-200 p-2 mt-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">

                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500"></div>
                  <div className="px-8 pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-6">
                      <div className="relative group">
                        <div className="w-32 h-32 bg-white rounded-2xl shadow-lg p-2">
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                            <User className="h-16 w-16 text-white" />
                          </div>
                        </div>
                        <label className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                          <Camera className="h-5 w-5 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="mt-4 sm:mt-0">
                        {!isEditing ? (
                          <button
                            onClick={handleEdit}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>Edit Profile</span>
                          </button>
                        ) : (
                          <div className="flex space-x-3">
                            <button
                              onClick={handleCancel}
                              className="flex items-center space-x-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={isLoading}
                              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4" />
                                  <span>Save Changes</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">{formData.name}</h2>
                      <p className="text-slate-600 mt-1">Parent Account</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Personal Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 px-4 py-3 bg-slate-50 rounded-xl">
                          <User className="h-5 w-5 text-slate-400" />
                          <span className="text-slate-900">{formData.name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                      </label>
                      {/* Email is read-only - cannot be changed via this endpoint */}
                      <div className="flex items-center space-x-3 px-4 py-3 bg-slate-50 rounded-xl">
                        <Mail className="h-5 w-5 text-slate-400" />
                        <span className="text-slate-900">{formData.email || 'Not available'}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Email cannot be changed here</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 px-4 py-3 bg-slate-50 rounded-xl">
                          <Phone className="h-5 w-5 text-slate-400" />
                          <span className="text-slate-900">{formData.phone}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Security Settings</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Lock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">Password</h4>
                          <p className="text-sm text-slate-600">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Change
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-6 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentProfile;

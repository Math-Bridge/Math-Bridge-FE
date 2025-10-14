import React, { useState } from 'react';
// import { useAuth } from '../../hooks/useAuth'; // Not used in this component
import { apiService, Child, softDeleteChild } from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  BookOpen,
  Award,
  Clock,
  Star,
  Check,
  AlertCircle,
  Lock
} from 'lucide-react';
import ChildrenList from '../children/ChildrenList';
import ChildForm from '../children/ChildForm';

const UserProfile: React.FC = () => {
  // const { user } = useAuth(); // Not used in this component
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    grade: '',
    subjects: [],
    learningGoals: []
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getCurrentUser();
        if (res.success && res.data) {
          setFormData(prev => ({
            ...prev,
            name: res.data?.name || '',
            email: res.data?.email || '',
            phone: res.data?.phone || '',
            location: res.data?.address || '',
            // You can map more fields if backend provides them
          }));
        } else {
          setMessage({ type: 'error', text: res.error || 'Failed to load user info' });
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Network error occurred' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  // Children management handlers
  const handleAddChild = () => {
    setEditingChild(null);
    setShowChildForm(true);
  };

  const handleEditChild = (childId: string) => {
    console.log('Edit child:', childId);
    setEditingChild(null); // You'd set this to the actual child data
    setShowChildForm(true);
  };

  const handleDeleteChild = async (childId: string) => {
    if (window.confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      try {
        await softDeleteChild(childId);
        setRefreshKey(prev => prev + 1); // Trigger refresh
      } catch (error) {
        console.error('Error deleting child:', error);
        alert('Failed to delete child. Please try again.');
      }
    }
  };

  const handleLinkCenter = (childId: string) => {
    console.log('Link center for child:', childId);
  };

  const handleFormSuccess = () => {
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  const handleCloseForm = () => {
    setShowChildForm(false);
    setEditingChild(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear message when user starts editing
    if (message) setMessage(null);      
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implement updateProfile in useAuth
      // const result = await updateProfile(formData);
      
      // For now, just show success message
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reload from API again for cancel
    setIsLoading(true);
    apiService.getCurrentUser().then(res => {
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          name: res.data?.name || '',
          email: res.data?.email || '',
          phone: res.data?.phone || '',
          location: res.data?.address || '',
        }));
      }
      setIsEditing(false);
      setMessage(null);
      setIsLoading(false);
    });
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implement changePassword in useAuth
      // const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      // For now, just show success message
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // TODO: Implement avatar upload in apiService
      // const result = await apiService.uploadAvatar(file);
      
      // For now, just show success message
      setMessage({ type: 'success', text: 'Avatar upload feature coming soon!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };



  const stats = [
    { label: 'Sessions Completed', value: '24', icon: BookOpen, color: 'blue' },
    { label: 'Hours Studied', value: '156', icon: Clock, color: 'green' },
    { label: 'Average Rating', value: '4.8', icon: Star, color: 'yellow' },
    { label: 'Achievements', value: '12', icon: Award, color: 'purple' }
  ];

  const getStatColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-green-50 text-green-700',
      yellow: 'bg-yellow-50 text-yellow-700',
      purple: 'bg-purple-50 text-purple-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg border flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors cursor-pointer">
                <Camera className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{formData.name}</h1>
              <p className="text-blue-100 text-lg">{formData.grade} • Mathematics Student</p>
              <div className="flex items-center space-x-4 mt-2 text-blue-100">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{formData.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined March 2024</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`p-6 rounded-xl border-2 hover-lift animate-scale-in stagger-${index + 1} ${getStatColor(stat.color)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="h-8 w-8" />
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
            <h3 className="font-medium">{stat.label}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <User className="h-6 w-6 text-blue-500 mr-2" />
              Personal Information
            </h2>
            {isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="form-input"
                />
              ) : (
                <p className="text-gray-900 font-medium">{formData.name}</p>
              )}
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="form-input flex-1"
                  />
                ) : (
                  <span className="text-gray-900">{formData.email}</span>
                )}
              </div>
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="form-input flex-1"
                  />
                ) : (
                  <span className="text-gray-900">{formData.phone}</span>
                )}
              </div>
            </div>

            <div>
              <label className="form-label">Location</label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="form-input flex-1"
                  />
                ) : (
                  <span className="text-gray-900">{formData.location}</span>
                )}
              </div>
            </div>

            <div>
              <label className="form-label">Bio</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="form-input h-20 resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-700">{formData.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <BookOpen className="h-6 w-6 text-green-500 mr-2" />
            Academic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">Current Grade</label>
              {isEditing ? (
                <select
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className="form-input"
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              ) : (
                <p className="text-gray-900 font-medium">{formData.grade}</p>
              )}
            </div>

            <div>
              <label className="form-label">Subjects of Interest</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Learning Goals</label>
              <div className="space-y-2 mt-2">
                {formData.learningGoals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-700">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-2">
            <User className="h-6 w-6 text-blue-500 mr-2" />
            My Children
          </h2>
          <p className="text-gray-600 text-sm">
            Manage your children's information and learning progress
          </p>
        </div>
        
        <ChildrenList
          key={refreshKey}
          onAddChild={handleAddChild}
          onEditChild={handleEditChild}
          onDeleteChild={handleDeleteChild}
          onLinkCenter={handleLinkCenter}
        />
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Shield className="h-6 w-6 text-red-500 mr-2" />
          Security Settings
        </h2>
        
        {!showPasswordForm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Password</h3>
              <p className="text-gray-600 text-sm mb-4">Last changed 2 months ago</p>
              <button 
                onClick={() => setShowPasswordForm(true)}
                className="btn-secondary"
              >
                Change Password
              </button>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
              <p className="text-gray-600 text-sm mb-4">Add an extra layer of security</p>
              <button className="btn-secondary">Enable 2FA</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div>
              <label className="form-label">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                  className="form-input pl-10"
                  placeholder="Enter current password"
                />
              </div>
              {passwordErrors.currentPassword && (
                <p className="error-message">{passwordErrors.currentPassword}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                  className="form-input pl-10"
                  placeholder="Enter new password"
                />
              </div>
              {passwordErrors.newPassword && (
                <p className="error-message">{passwordErrors.newPassword}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                  className="form-input pl-10"
                  placeholder="Confirm new password"
                />
              </div>
              {passwordErrors.confirmPassword && (
                <p className="error-message">{passwordErrors.confirmPassword}</p>
              )}
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handlePasswordChange}
                disabled={isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Changing...</span>
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
                disabled={isLoading}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Child Form Modal */}
      {showChildForm && (
        <ChildForm
          child={editingChild || undefined}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default UserProfile;
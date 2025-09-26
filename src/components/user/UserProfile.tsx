import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, CreditCard as Edit3, Save, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiService } from '../../services/api';

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      const res = await apiService.getCurrentUser();
      if (res.success && res.data) {
        const userData = {
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
        };
        setProfile(userData);
        setForm(userData);
      } else {
        setError(res.error || 'Failed to load user info');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await apiService.updateCurrentUser(form);
    if (res.success && res.data) {
      setProfile(form);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Update failed');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm(profile);
    setError(null);
    setSuccess(null);
  };

  if (loading && !isEditing) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">User Profile</h1>
                <p className="text-blue-100 text-sm">Manage your personal information</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 hover:scale-105"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
        {/* Content */}
        <div className="p-6">
          {/* Alert Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}
          {/* Profile Fields */}
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-900 font-medium">{profile.name || 'Not specified'}</p>
                </div>
              )}
            </div>
            {/* Email Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-gray-900 font-medium">{profile.email || 'Not specified'}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>
            {/* Phone Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-900 font-medium">{profile.phone || 'Not specified'}</p>
                </div>
              )}
            </div>
            {/* Address Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your address"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-900 font-medium">{profile.address || 'Not specified'}</p>
                </div>
              )}
            </div>
          </div>
          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
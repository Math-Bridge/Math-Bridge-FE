import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { apiService, getTutorVerificationByUserId } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';

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

const TutorProfile: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [verificationDetail, setVerificationDetail] = useState<VerificationDetail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    university: '',
    major: '',
    hourlyRate: 0,
    bio: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

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

  const handleEdit = () => {
    setIsEditing(true);
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
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      
      // First get verification ID
      const verificationResult = await getTutorVerificationByUserId(user.id);
      let verificationId: string | null = null;
      
      if (verificationResult.success && verificationResult.data) {
        verificationId = verificationResult.data.verificationId;
      }

      if (verificationId) {
        // Update existing verification
        const updateResult = await apiService.request<any>(`/tutor-verifications/${verificationId}`, {
          method: 'PUT',
          body: JSON.stringify({
            University: formData.university,
            Major: formData.major,
            HourlyRate: formData.hourlyRate,
            Bio: formData.bio,
          }),
        });

        if (updateResult.success) {
          showSuccess('Profile updated successfully!');
          setIsEditing(false);
          await fetchProfile();
        } else {
          showError(updateResult.error || 'Failed to update profile');
        }
      } else {
        // Create new verification if doesn't exist
        const createResult = await apiService.request<any>(`/tutor-verifications`, {
          method: 'POST',
          body: JSON.stringify({
            UserId: user.id,
            University: formData.university,
            Major: formData.major,
            HourlyRate: formData.hourlyRate,
            Bio: formData.bio,
          }),
        });

        if (createResult.success) {
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>Hourly Rate (USD) <span className="text-red-500">*</span></span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter hourly rate"
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
              </label>
              <p className="text-gray-900 mt-1">
                {verificationDetail?.hourlyRate ? `$${verificationDetail.hourlyRate}/hour` : 'Not provided'}
              </p>
            </div>
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





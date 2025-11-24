import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  UserCheck,
  UserX,
  X,
  Mail,
  Phone,
  UserCog,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
  Edit,
  MapPin,
  MoreVertical,
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface User {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  roleName?: string;
  status: string;
  formattedAddress?: string;
  walletBalance?: number;
}

const UserManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: 'male',
    roleId: 3, // Default to parent
  });

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: '',
    formattedAddress: '',
    hourlyRate: 0,
    hourlyRateVND: 0, // For display purposes
  });

  const [locationInput, setLocationInput] = useState('');
  const [locationPredictions, setLocationPredictions] = useState<any[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside dropdown menu and not on the action button
      const isClickOnDropdown = target.closest('.dropdown-menu');
      const isClickOnActionButton = target.closest('button[title="Actions"]');
      
      if (!isClickOnDropdown && !isClickOnActionButton) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    const handleScroll = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    const updateDropdownPosition = () => {
      if (openDropdownId) {
        const button = actionButtonRefs.current[openDropdownId];
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          });
        }
      }
    };

    if (openDropdownId) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', updateDropdownPosition);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [openDropdownId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllUsers();
      if (response.success && response.data) {
        const usersData = Array.isArray(response.data) ? response.data : [];
        setUsers(usersData);
      } else {
        // Fallback: show empty list if API not available
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.roleId.toString() === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phoneNumber?.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors({});
      
      const response = await apiService.request<{ userId: string }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          FullName: formData.fullName.trim(),
          Email: formData.email.trim(),
          Password: formData.password,
          PhoneNumber: formData.phoneNumber.trim(),
          Gender: formData.gender,
          RoleId: formData.roleId,
        })
      });

      if (response.success) {
        // If user is created with tutor role, also create tutor verification with placeholder data
        if (formData.roleId === 2 && response.data?.userId) {
          try {
            const verificationResponse = await apiService.request<any>('/tutor-verifications', {
              method: 'POST',
              body: JSON.stringify({
                UserId: response.data.userId,
                University: 'N/A',
                Major: 'N/A',
                HourlyRate: 0.01,
                Bio: 'N/A',
                VerificationStatus: 'pending'
              })
            });
            
            if (verificationResponse.success) {
              showSuccess('User and tutor verification created successfully');
            } else {
              showSuccess('User created successfully, but failed to create tutor verification');
              console.error('Failed to create tutor verification:', verificationResponse.error);
            }
          } catch (verificationError: any) {
            showSuccess('User created successfully, but failed to create tutor verification');
            console.error('Error creating tutor verification:', verificationError);
          }
        } else {
          showSuccess('User created successfully');
        }
        
        setShowCreateModal(false);
        setFormData({
          fullName: '',
          email: '',
          password: '',
          phoneNumber: '',
          gender: 'male',
          roleId: 3,
        });
        setFormErrors({});
        fetchUsers();
      } else {
        const errorMessage = response.error || 'Failed to create user';
        showError(errorMessage);
        // Try to parse backend validation errors
        if (errorMessage.includes('Email already exists')) {
          setFormErrors({ email: 'This email is already registered' });
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create user';
      showError(errorMessage);
      if (errorMessage.includes('Email already exists')) {
        setFormErrors({ email: 'This email is already registered' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      setUpdatingStatus(userId);
      
      // Validate userId format
      if (!userId || userId.trim() === '') {
        showError('Invalid user ID');
        setUpdatingStatus(null);
        return;
      }

      const response = await apiService.request<{ userId: string }>(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.success) {
        showSuccess(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        // Parse error message for better user experience
        const errorMessage = response.error || 'Failed to update user status';
        let userFriendlyMessage = errorMessage;
        
        if (errorMessage.includes('saving the entity changes') || errorMessage.includes('inner exception')) {
          userFriendlyMessage = 'Cannot update user status. This user may have active contracts, sessions, or other related data. Please contact the administrator.';
        } else if (errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
          userFriendlyMessage = 'Cannot update user status due to database constraints. This user may have related records that prevent status change.';
        }
        
        showError(userFriendlyMessage);
        console.error('Status update error:', errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update user status';
      let userFriendlyMessage = errorMessage;
      
      if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        userFriendlyMessage = 'Server error occurred. This user may have active contracts or sessions that prevent status change. Please try again later or contact support.';
      }
      
      showError(userFriendlyMessage);
      console.error('Status update exception:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEditUser = async (user: User) => {
    try {
      // Fetch full user data
      const userResponse = await apiService.getUserById(user.userId);
      if (!userResponse.success || !userResponse.data) {
        showError('Failed to load user data');
        return;
      }

      const userData = userResponse.data;
      setEditingUser(user);
      
      // Set edit form data
      setEditFormData({
        fullName: userData.fullName || userData.FullName || user.fullName,
        phoneNumber: userData.phoneNumber || userData.PhoneNumber || user.phoneNumber || '',
        gender: userData.gender || userData.Gender || 'male',
        formattedAddress: userData.formattedAddress || userData.FormattedAddress || user.formattedAddress || '',
        hourlyRate: 0,
      });
      
      setLocationInput(userData.formattedAddress || userData.FormattedAddress || user.formattedAddress || '');
      setSelectedPlaceId(userData.placeId || userData.PlaceId || '');
      
      // If tutor, fetch verification to get hourlyRate
      if (user.roleId === 2) {
        try {
          const verificationResponse = await apiService.request<any>(`/tutor-verifications/user/${user.userId}`, {
            method: 'GET',
          });
          if (verificationResponse.success && verificationResponse.data) {
            const verification = verificationResponse.data;
            const hourlyRateUSD = verification.hourlyRate || verification.HourlyRate || 0;
            const hourlyRateVND = Math.round(hourlyRateUSD * 25000); // Convert USD to VND for display
            setEditFormData(prev => ({
              ...prev,
              hourlyRate: hourlyRateUSD,
              hourlyRateVND: hourlyRateVND,
            }));
          }
        } catch (error) {
          console.error('Error fetching tutor verification:', error);
        }
      }
      
      setShowEditModal(true);
    } catch (error: any) {
      showError(error?.message || 'Failed to load user data');
    }
  };

  const handleLocationInputChange = async (value: string) => {
    setLocationInput(value);
    setSelectedPlaceId('');

    if (value.trim().length < 3) {
      setLocationPredictions([]);
      setShowLocationDropdown(false);
      return;
    }

    setTimeout(async () => {
      setIsLoadingLocation(true);
      try {
        const response = await apiService.getAddressAutocomplete(value, 'VN');
        if (response.success && response.data?.predictions) {
          const predictions = response.data.predictions.map((pred: any) => ({
            placeId: pred.placeId || pred.place_id || '',
            description: pred.description || '',
            mainText: pred.mainText || pred.structured_formatting?.main_text || pred.main_text || '',
            secondaryText: pred.secondaryText || pred.structured_formatting?.secondary_text || pred.secondary_text || ''
          }));
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

  const handleLocationSelect = (prediction: any) => {
    setLocationInput(prediction.description);
    setSelectedPlaceId(prediction.placeId);
    setShowLocationDropdown(false);
    setLocationPredictions([]);
  };

  const handleUpdateProfile = async () => {
    if (!editingUser) return;

    // Validate
    const errors: Record<string, string> = {};
    if (!editFormData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!editFormData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    if (!editFormData.gender) {
      errors.gender = 'Gender is required';
    }
    if (editingUser.roleId === 2 && editFormData.hourlyRateVND <= 0) {
      errors.hourlyRate = 'Hourly rate must be greater than 0';
    }

    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setUpdatingProfile(true);
      
      // Step 1: Update user basic info
      const updateData: any = {
        FullName: editFormData.fullName.trim(),
        PhoneNumber: editFormData.phoneNumber.trim(),
        Gender: editFormData.gender,
      };

      const userResponse = await apiService.updateUser(editingUser.userId, updateData);
      if (!userResponse.success) {
        showError(userResponse.error || 'Failed to update user');
        setUpdatingProfile(false);
        return;
      }

      // Step 2: Update location if changed
      if (selectedPlaceId && locationInput !== editFormData.formattedAddress) {
        // Save location for the user (this requires the user to be logged in, so we might need a different approach)
        // For now, we'll skip location update from admin panel
        // TODO: Add admin endpoint to update user location
      }

      // Step 3: Update tutor hourly rate if tutor
      if (editingUser.roleId === 2 && editFormData.hourlyRateVND > 0) {
        try {
          const verificationResponse = await apiService.request<any>(`/tutor-verifications/user/${editingUser.userId}`, {
            method: 'GET',
          });
          
          if (verificationResponse.success && verificationResponse.data) {
            const verificationId = verificationResponse.data.verificationId || verificationResponse.data.verification_id;
            if (verificationId) {
              // Convert VND back to USD before saving
              const hourlyRateUSD = editFormData.hourlyRateVND / 25000;
              await apiService.request<any>(`/tutor-verifications/${verificationId}`, {
                method: 'PUT',
                body: JSON.stringify({
                  HourlyRate: hourlyRateUSD,
                }),
              });
            }
          }
        } catch (error) {
          console.error('Error updating hourly rate:', error);
          // Don't fail the whole update if hourly rate update fails
        }
      }

      showSuccess('User profile updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      showError(error?.message || 'Failed to update user profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'Tutor';
      case 3: return 'Parent';
      case 4: return 'Staff';
      default: return 'Unknown';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status.toLowerCase() === 'active').length;
  const inactiveUsers = users.filter(u => u.status.toLowerCase() === 'inactive').length;
  const roleCounts = {
    admin: users.filter(u => u.roleId === 1).length,
    tutor: users.filter(u => u.roleId === 2).length,
    parent: users.filter(u => u.roleId === 3).length,
    staff: users.filter(u => u.roleId === 4).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">Manage all user accounts and roles</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Total Users</p>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Active Users</p>
            <p className="text-3xl font-bold">{activeUsers}</p>
            <p className="text-green-100 text-xs mt-1">{totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% of total</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserX className="w-6 h-6" />
              </div>
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-red-100 text-sm font-medium mb-1">Inactive Users</p>
            <p className="text-3xl font-bold">{inactiveUsers}</p>
            <p className="text-red-100 text-xs mt-1">{totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0}% of total</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="w-6 h-6" />
              </div>
              <UserCog className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Roles Distribution</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Admin: {roleCounts.admin}</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Tutor: {roleCounts.tutor}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Parent: {roleCounts.parent}</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Staff: {roleCounts.staff}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200/50 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="1">Admin</option>
                <option value="2">Tutor</option>
                <option value="3">Parent</option>
                <option value="4">Staff</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200/50 overflow-hidden backdrop-blur-sm" style={{ overflow: 'visible' }}>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Users List ({filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'})</span>
            </h3>
          </div>
          <div className="overflow-x-auto" style={{ overflowY: 'visible' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" style={{ position: 'relative' }}>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Found</h3>
                      <p className="text-gray-600">
                        {users.length === 0
                          ? 'No users available in the system yet'
                          : 'No users match your search criteria'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

                    return (
                      <>
                        {paginatedUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50 transition-colors" style={{ position: 'relative', overflow: 'visible' }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                          {user.phoneNumber && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phoneNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getRoleName(user.roleId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.walletBalance !== undefined
                          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.walletBalance)
                          : '0 ₫'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ position: 'relative', overflow: 'visible' }}>
                        <div className="relative flex items-center justify-end" style={{ position: 'relative', zIndex: 1 }}>
                          <button
                            ref={(el) => {
                              actionButtonRefs.current[user.userId] = el;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openDropdownId === user.userId) {
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              } else {
                                const button = actionButtonRefs.current[user.userId];
                                if (button) {
                                  const rect = button.getBoundingClientRect();
                                  setDropdownPosition({
                                    top: rect.bottom + 8,
                                    right: window.innerWidth - rect.right
                                  });
                                }
                                setOpenDropdownId(user.userId);
                              }
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdownId === user.userId && dropdownPosition && createPortal(
                            <div 
                              className="dropdown-menu fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`
                              }}
                            >
                                <button
                                  onClick={() => {
                                    handleEditUser(user);
                                    setOpenDropdownId(null);
                                    setDropdownPosition(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span>Edit Profile</span>
                                </button>
                                {user.status === 'active' ? (
                                  <button
                                    onClick={() => {
                                      handleUpdateStatus(user.userId, 'inactive');
                                      setOpenDropdownId(null);
                                      setDropdownPosition(null);
                                    }}
                                    disabled={updatingStatus === user.userId}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {updatingStatus === user.userId ? (
                                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <UserX className="w-4 h-4" />
                                    )}
                                    <span>Deactivate</span>
                                  </button>
                                ) : user.status !== 'deleted' ? (
                                  <button
                                    onClick={() => {
                                      handleUpdateStatus(user.userId, 'active');
                                      setOpenDropdownId(null);
                                      setDropdownPosition(null);
                                    }}
                                    disabled={updatingStatus === user.userId}
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {updatingStatus === user.userId ? (
                                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <UserCheck className="w-4 h-4" />
                                    )}
                                    <span>Activate</span>
                                  </button>
                                ) : null}
                            </div>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                        ))}
                        </>
                      );
                    })()
                  )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {filteredUsers.length > 0 && (() => {
            const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
            
            return (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{endIndex}</span> of{' '}
                  <span className="font-medium">{filteredUsers.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || 
                               page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => {
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
                  <p className="text-sm text-gray-500 mt-1">Fill in the information to create a new user account</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormErrors({});
                    setFormData({
                      fullName: '',
                      email: '',
                      password: '',
                      phoneNumber: '',
                      gender: 'male',
                      roleId: 3,
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateUser} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.fullName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {formErrors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="user@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Password requirements:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li className={formData.password.length >= 6 ? 'text-green-600' : ''}>
                        • At least 6 characters
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                        • One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
                        • One lowercase letter
                      </li>
                      <li className={/\d/.test(formData.password) ? 'text-green-600' : ''}>
                        • One number
                      </li>
                      <li className={/[@$!%*?&]/.test(formData.password) ? 'text-green-600' : ''}>
                        • One special character (@$!%*?&)
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, phoneNumber: e.target.value });
                      if (formErrors.phoneNumber) setFormErrors({ ...formErrors, phoneNumber: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => {
                      setFormData({ ...formData, gender: e.target.value });
                      if (formErrors.gender) setFormErrors({ ...formErrors, gender: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.gender ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.gender && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Admin</option>
                    <option value="2">Tutor</option>
                    <option value="3">Parent</option>
                    <option value="4">Staff</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormErrors({});
                    setFormData({
                      fullName: '',
                      email: '',
                      password: '',
                      phoneNumber: '',
                      gender: 'male',
                      roleId: 3,
                    });
                  }}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit User Profile</h2>
                  <p className="text-sm text-gray-500 mt-1">Update user information</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setEditFormErrors({});
                    setLocationInput('');
                    setSelectedPlaceId('');
                    setLocationPredictions([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                  {editFormErrors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.phoneNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                  {editFormErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {editFormErrors.gender && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Address</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Start typing address..."
                    />
                    {isLoadingLocation && (
                      <div className="absolute right-3 top-2.5">
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
                  </div>
                </div>

                {editingUser.roleId === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1000"
                      value={editFormData.hourlyRateVND}
                      onChange={(e) => {
                        const vndValue = parseFloat(e.target.value) || 0;
                        setEditFormData({ 
                          ...editFormData, 
                          hourlyRateVND: vndValue,
                          hourlyRate: vndValue / 25000 // Keep USD value in sync
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter hourly rate in VND"
                    />
                    {editFormErrors.hourlyRate && (
                      <p className="text-red-500 text-xs mt-1">{editFormErrors.hourlyRate}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Displayed as: {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(editFormData.hourlyRateVND)}/hour
                      <span className="text-gray-400 ml-2">
                        (≈ ${(editFormData.hourlyRateVND / 25000).toFixed(2)} USD)
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                      setEditFormErrors({});
                      setLocationInput('');
                      setSelectedPlaceId('');
                      setLocationPredictions([]);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={updatingProfile}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {updatingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <UserCog className="w-4 h-4" />
                        <span>Update Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;


import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  UserCheck,
  UserX,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Mail,
  Calendar,
  User,
  MoreVertical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllTutors, verifyTutor, rejectTutorVerification, Tutor, getTutorVerificationByUserId } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface TutorVerificationManagementProps {
  hideBackButton?: boolean;
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

const TutorVerificationManagement: React.FC<TutorVerificationManagementProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'approved', 'rejected', 'not_verified'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  // Verification detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [verificationDetail, setVerificationDetail] = useState<VerificationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    fetchTutors();
  }, []);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isClickOnDropdown = target.closest('.dropdown-menu');
      const isClickOnActionButton = target.closest('button[title="Actions"]') || target.closest('button[aria-label="Actions"]');
      
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

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const result = await getAllTutors();
      if (result.success && result.data) {
        // Ensure data is an array
        const tutorsData = Array.isArray(result.data) ? result.data : [];
        if (import.meta.env.DEV) {
          console.log('Loaded tutors:', tutorsData.length);
          if (tutorsData.length > 0) {
            console.log('Sample tutor data:', tutorsData[0]);
            console.log('Sample tutor verification data:', {
              university: tutorsData[0].university,
              major: tutorsData[0].major,
              hourlyRate: tutorsData[0].hourlyRate,
              verificationStatus: tutorsData[0].verificationStatus,
            });
          }
        }
        setTutors(tutorsData);
      } else {
        const errorMsg = result.error || 'Failed to load tutors';
        console.error('API Error:', result);
        // Don't show error if it's just empty result
        if (result.error && !result.error.includes('404')) {
          showError(errorMsg);
        }
        setTutors([]); // Set empty array to prevent UI errors
      }
    } catch (error) {
      console.error('Error fetching tutors:', error);
      showError('Failed to load tutors. Please try again later.');
      setTutors([]); // Set empty array to prevent UI errors
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (tutorId: string) => {
    try {
      const result = await verifyTutor(tutorId);
      if (result.success) {
        showSuccess('Tutor verified successfully!');
        fetchTutors(); // Refresh list
      } else {
        showError(result.error || 'Failed to verify tutor');
      }
    } catch (error) {
      console.error('Error verifying tutor:', error);
      showError('Failed to verify tutor');
    }
  };

  const handleReject = async (tutorId: string) => {
    if (!window.confirm('Are you sure you want to reject this tutor verification?')) {
      return;
    }
    try {
      const result = await rejectTutorVerification(tutorId);
      if (result.success) {
        showSuccess('Tutor verification rejected');
        fetchTutors(); // Refresh list
        // Close detail modal if open
        if (showDetailModal && selectedTutorId === tutorId) {
          setShowDetailModal(false);
          setVerificationDetail(null);
        }
      } else {
        showError(result.error || 'Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      showError('Failed to reject verification');
    }
  };

  const handleViewDetails = async (tutorId: string) => {
    setSelectedTutorId(tutorId);
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const result = await getTutorVerificationByUserId(tutorId);
      if (result.success && result.data) {
        setVerificationDetail(result.data);
      } else {
        showError(result.error || 'Failed to load verification details');
        setVerificationDetail(null);
      }
    } catch (error) {
      console.error('Error fetching verification details:', error);
      showError('Failed to load verification details');
      setVerificationDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleVerifyFromModal = async () => {
    if (!verificationDetail) return;
    try {
      const result = await verifyTutor(verificationDetail.userId);
      if (result.success) {
        showSuccess('Tutor verified successfully!');
        fetchTutors(); // Refresh list
        // Update detail modal
        if (verificationDetail) {
          setVerificationDetail({
            ...verificationDetail,
            verificationStatus: 'approved',
            verificationDate: new Date().toISOString(),
          });
        }
      } else {
        showError(result.error || 'Failed to verify tutor');
      }
    } catch (error) {
      console.error('Error verifying tutor:', error);
      showError('Failed to verify tutor');
    }
  };

  const handleRejectFromModal = async () => {
    if (!verificationDetail) return;
    if (!window.confirm('Are you sure you want to reject this tutor verification?')) {
      return;
    }
    try {
      const result = await rejectTutorVerification(verificationDetail.userId);
      if (result.success) {
        showSuccess('Tutor verification rejected');
        fetchTutors(); // Refresh list
        // Update detail modal
        if (verificationDetail) {
          setVerificationDetail({
            ...verificationDetail,
            verificationStatus: 'rejected',
          });
        }
      } else {
        showError(result.error || 'Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      showError('Failed to reject verification');
    }
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

  // Helper function to normalize status (active = approved)
  const normalizeStatus = (status?: string): string => {
    if (!status) return '';
    const normalized = status.toLowerCase();
    if (normalized === 'active') return 'approved';
    return normalized;
  };

  // Helper function to check if status is approved (including active)
  const isApproved = (status?: string): boolean => {
    if (!status) return false;
    const normalized = status.toLowerCase();
    return normalized === 'approved' || normalized === 'active';
  };

  // Helper function to check if status is rejected
  const isRejected = (status?: string): boolean => {
    if (!status) return false;
    return status.toLowerCase() === 'rejected';
  };

  // Helper function to check if status is not verified (not approved and not rejected)
  const isNotVerified = (status?: string): boolean => {
    return !isApproved(status) && !isRejected(status);
  };

  // Filter tutors
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch = tutor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizedStatus = normalizeStatus(tutor.verificationStatus);
    let matchesStatus = false;
    
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'not_verified') {
      matchesStatus = isNotVerified(tutor.verificationStatus);
    } else {
      matchesStatus = normalizedStatus === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTutors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTutors = filteredTutors.slice(startIndex, endIndex);

  const getStatusBadge = (status?: string) => {
    if (isApproved(status)) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (isRejected(status)) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center space-x-1">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    // If no status or status is not approved/rejected, show "Not Verified"
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 flex items-center space-x-1">
        <Clock className="w-3 h-3" />
        <span>Not Verified</span>
      </span>
    );
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
          {!hideBackButton && (
            <button
              onClick={() => navigate('/staff')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tutor Verification</h1>
              <p className="text-gray-600 mt-2">Manage tutor verification requests</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tutors by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: 'All', count: tutors.length },
                  { key: 'not_verified', label: 'Not Verified', count: tutors.filter(t => isNotVerified(t.verificationStatus)).length },
                  { key: 'approved', label: 'Approved', count: tutors.filter(t => isApproved(t.verificationStatus)).length },
                  { key: 'rejected', label: 'Rejected', count: tutors.filter(t => isRejected(t.verificationStatus)).length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === tab.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tutors Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Major
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hourly Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTutors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tutors Found</h3>
                      <p className="text-gray-600">No tutors match your search criteria</p>
                    </td>
                  </tr>
                ) : (
                  paginatedTutors.map((tutor) => (
                    <tr key={tutor.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tutor.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tutor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tutor.university || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tutor.major || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tutor.hourlyRate !== undefined ? (
                            <>
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(tutor.hourlyRate * 25000)}
                              /hour
                            </>
                          ) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tutor.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(tutor.verificationStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ position: 'relative', overflow: 'visible' }}>
                        <div className="relative inline-block text-left" style={{ position: 'relative', zIndex: 1 }}>
                          <button
                            ref={(el) => {
                              actionButtonRefs.current[tutor.userId] = el;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openDropdownId === tutor.userId) {
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              } else {
                                const button = actionButtonRefs.current[tutor.userId];
                                if (button) {
                                  const rect = button.getBoundingClientRect();
                                  setDropdownPosition({
                                    top: rect.bottom + 8,
                                    right: window.innerWidth - rect.right
                                  });
                                }
                                setOpenDropdownId(tutor.userId);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdownId === tutor.userId && dropdownPosition && createPortal(
                            <div 
                              className="dropdown-menu fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`
                              }}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleViewDetails(tutor.userId);
                                    setOpenDropdownId(null);
                                    setDropdownPosition(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View Details</span>
                                </button>
                                {!isApproved(tutor.verificationStatus) && !isRejected(tutor.verificationStatus) && (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleVerify(tutor.userId);
                                        setOpenDropdownId(null);
                                        setDropdownPosition(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center space-x-2"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleReject(tutor.userId);
                                        setOpenDropdownId(null);
                                        setDropdownPosition(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                                    >
                                      <UserX className="w-4 h-4" />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}
                                {isApproved(tutor.verificationStatus) && (
                                  <button
                                    onClick={() => {
                                      handleReject(tutor.userId);
                                      setOpenDropdownId(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                  >
                                    <UserX className="w-4 h-4" />
                                    <span>Revoke</span>
                                  </button>
                                )}
                                {isRejected(tutor.verificationStatus) && (
                                  <button
                                    onClick={() => {
                                      handleVerify(tutor.userId);
                                      setOpenDropdownId(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center space-x-2"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Approve</span>
                                  </button>
                                )}
                              </div>
                            </div>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredTutors.length)} of {filteredTutors.length} tutors
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const showPage = 
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  if (!showPage) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
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
        )}

        {/* Verification Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Verification Details</h2>
                  <p className="text-sm text-gray-600 mt-1">View complete tutor verification information</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setVerificationDetail(null);
                    setSelectedTutorId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : verificationDetail ? (
                  <div className="space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      {getStatusBadge(verificationDetail.verificationStatus)}
                      <div className="flex items-center space-x-2">
                        {!isApproved(verificationDetail.verificationStatus) && !isRejected(verificationDetail.verificationStatus) && (
                          <>
                            <button
                              onClick={handleVerifyFromModal}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={handleRejectFromModal}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                            >
                              <UserX className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {isApproved(verificationDetail.verificationStatus) && (
                          <button
                            onClick={handleRejectFromModal}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Revoke</span>
                          </button>
                        )}
                        {isRejected(verificationDetail.verificationStatus) && (
                          <button
                            onClick={handleVerifyFromModal}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>Personal Information</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Full Name</label>
                          <p className="text-gray-900 mt-1">{verificationDetail.userFullName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>Email</span>
                          </label>
                          <p className="text-gray-900 mt-1">{verificationDetail.userEmail || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <GraduationCap className="w-5 h-5" />
                        <span>Academic Information</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">University</label>
                          <p className="text-gray-900 mt-1">{verificationDetail.university || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Major</label>
                          <p className="text-gray-900 mt-1">{verificationDetail.major || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                            <span>Hourly Rate</span>
                          </label>
                          <p className="text-gray-900 mt-1">
                            {verificationDetail.hourlyRate ? (
                              <>
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(verificationDetail.hourlyRate * 25000)}
                                /hour
                              </>
                            ) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {verificationDetail.bio && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <FileText className="w-5 h-5" />
                          <span>Biography</span>
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{verificationDetail.bio}</p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span>Timeline</span>
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
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Details Available</h3>
                    <p className="text-gray-600">Unable to load verification details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorVerificationManagement;



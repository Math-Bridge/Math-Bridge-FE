import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  DollarSign,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllTutors, verifyTutor, rejectTutorVerification, Tutor } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface TutorVerificationManagementProps {
  hideBackButton?: boolean;
}

const TutorVerificationManagement: React.FC<TutorVerificationManagementProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'pending', 'approved', 'rejected'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const result = await getAllTutors();
      if (result.success && result.data) {
        // Ensure data is an array
        const tutorsData = Array.isArray(result.data) ? result.data : [];
        console.log('Loaded tutors:', tutorsData.length);
        console.log('Sample tutor data:', tutorsData[0]);
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
      } else {
        showError(result.error || 'Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      showError('Failed to reject verification');
    }
  };

  // Filter tutors
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch = tutor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         tutor.verificationStatus === statusFilter ||
                         (statusFilter === 'pending' && (!tutor.verificationStatus || tutor.verificationStatus === 'pending'));
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTutors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTutors = filteredTutors.slice(startIndex, endIndex);

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center space-x-1">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    return null;
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
                  { key: 'pending', label: 'Pending', count: tutors.filter(t => !t.verificationStatus || t.verificationStatus === 'pending').length },
                  { key: 'approved', label: 'Approved', count: tutors.filter(t => t.verificationStatus === 'approved').length },
                  { key: 'rejected', label: 'Rejected', count: tutors.filter(t => t.verificationStatus === 'rejected').length },
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
                          {tutor.hourlyRate !== undefined ? `$${tutor.hourlyRate}/hour` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tutor.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(tutor.verificationStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {(!tutor.verificationStatus || tutor.verificationStatus === 'pending') && (
                            <>
                              <button
                                onClick={() => handleVerify(tutor.userId)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs flex items-center space-x-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(tutor.userId)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs flex items-center space-x-1"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          {tutor.verificationStatus === 'approved' && (
                            <button
                              onClick={() => handleReject(tutor.userId)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs flex items-center space-x-1"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          )}
                          {tutor.verificationStatus === 'rejected' && (
                            <button
                              onClick={() => handleVerify(tutor.userId)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs flex items-center space-x-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
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
      </div>
    </div>
  );
};

export default TutorVerificationManagement;



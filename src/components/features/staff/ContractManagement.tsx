import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Calendar,
  Clock,
  MapPin,
  XCircle,
  Search,
  Filter,
  Eye,
  UserPlus,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllContracts, Contract, assignTutorToContract, getAvailableTutors, Tutor, apiService, updateContractStatus } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface ContractManagementProps {
  hideBackButton?: boolean;
}

const ContractManagement: React.FC<ContractManagementProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [availableTutors, setAvailableTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  // Selected tutors for assignment
  const [selectedMainTutor, setSelectedMainTutor] = useState<Tutor | null>(null);
  const [selectedSubstituteTutor1, setSelectedSubstituteTutor1] = useState<Tutor | null>(null);
  const [selectedSubstituteTutor2, setSelectedSubstituteTutor2] = useState<Tutor | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Fetch tutor name by userId
  const fetchTutorName = async (tutorId: string): Promise<string | null> => {
    try {
      const result = await apiService.getUserById(tutorId);
      if (result.success && result.data) {
        const user = result.data;
        return user.fullName || user.FullName || user.name || user.Name || null;
      }
    } catch (error) {
      console.error('Error fetching tutor name:', error);
    }
    return null;
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const result = await getAllContracts();
      if (result.success && result.data) {
        // Debug: Log raw contract data in development
        if (import.meta.env.DEV) {
          console.log('Raw contracts from API:', result.data);
        }
        
        // Map backend response (PascalCase) to frontend format (camelCase)
        const mappedContracts = await Promise.all(
          result.data.map(async (contract: any) => {
            // Handle MainTutorName - backend may return null or empty string
            let mainTutorName = contract.mainTutorName || contract.MainTutorName || '';
            const mainTutorId = contract.mainTutorId || contract.MainTutorId;
            
            // If we have tutorId but no tutorName, fetch it from API
            if (mainTutorId && !mainTutorName) {
              console.log('Fetching tutor name for tutorId:', mainTutorId);
              const fetchedName = await fetchTutorName(mainTutorId);
              if (fetchedName) {
                mainTutorName = fetchedName;
                console.log('Fetched tutor name:', fetchedName);
              } else {
                console.warn('Could not fetch tutor name for tutorId:', mainTutorId);
              }
            }
            
            // Map status correctly from backend - handle all possible formats
            // Backend may return status as: Status, status, or in various cases
            let rawStatus = contract.Status || contract.status;
            
            // Handle null/undefined/empty cases
            if (!rawStatus || rawStatus === null || rawStatus === undefined) {
              rawStatus = 'pending';
            }
            
            // Convert to string and normalize (lowercase, trim whitespace)
            const normalizedStatus = String(rawStatus).toLowerCase().trim();
            
            // Validate status is one of the allowed values
            const validStatuses: Array<'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid'> = 
              ['pending', 'active', 'completed', 'cancelled', 'unpaid'];
            
            let contractStatus: 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid';
            if (validStatuses.includes(normalizedStatus as any)) {
              contractStatus = normalizedStatus as 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid';
            } else {
              // Log warning if status is invalid for debugging
              if (import.meta.env.DEV) {
                console.warn(`Invalid contract status received: "${rawStatus}" (normalized: "${normalizedStatus}"). Defaulting to "pending". Contract ID: ${contract.contractId || contract.ContractId}`);
              }
              contractStatus = 'pending'; // Default to pending if status is invalid
            }
            
            // Debug logging in development - log all status mappings
            if (import.meta.env.DEV) {
              console.log(`Contract ${contract.contractId || contract.ContractId}: Status - Raw: "${rawStatus}", Normalized: "${normalizedStatus}", Final: "${contractStatus}"`);
            }
            
            return {
              contractId: contract.contractId || contract.ContractId,
              childId: contract.childId || contract.ChildId,
              childName: contract.childName || contract.ChildName,
              packageId: contract.packageId || contract.PackageId,
              packageName: contract.packageName || contract.PackageName,
              mainTutorId: mainTutorId || null,
              mainTutorName: mainTutorName || null,
              centerId: contract.centerId || contract.CenterId,
              centerName: contract.centerName || contract.CenterName,
              startDate: contract.startDate || contract.StartDate,
              endDate: contract.endDate || contract.EndDate,
              timeSlot: contract.timeSlot || (contract.StartTime && contract.EndTime 
                ? `${contract.StartTime} - ${contract.EndTime}` 
                : contract.startTime && contract.endTime 
                ? `${contract.startTime} - ${contract.endTime}` 
                : ''),
              isOnline: contract.isOnline !== undefined ? contract.isOnline : contract.IsOnline,
              status: contractStatus,
            };
          })
        );
        
        setContracts(mappedContracts);
      } else {
        showError(result.error || 'Failed to load contracts');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      showError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const filterContracts = () => {
    let filtered = [...contracts];

    // Filter by status - normalize comparison
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        const contractStatus = String(c.status || '').toLowerCase().trim();
        const filterStatus = statusFilter.toLowerCase().trim();
        return contractStatus === filterStatus;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.childName?.toLowerCase().includes(term) ||
        c.packageName?.toLowerCase().includes(term) ||
        c.mainTutorName?.toLowerCase().includes(term) ||
        c.contractId.toLowerCase().includes(term)
      );
    }

    setFilteredContracts(filtered);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  const handleAssignTutor = async (contract: Contract) => {
    setSelectedContract(contract);
    setShowTutorModal(true);
    // Reset selected tutors when opening modal
    setSelectedMainTutor(null);
    setSelectedSubstituteTutor1(null);
    setSelectedSubstituteTutor2(null);
    await fetchAvailableTutors(contract);
  };

  const fetchAvailableTutors = async (contract: Contract) => {
    try {
      setLoadingTutors(true);
      // Extract days of week from contract if available
      const result = await getAvailableTutors({
        centerId: contract.centerId || undefined,
        isOnline: contract.isOnline,
        // daysOfWeek: contract.daysOfWeeks, // If available in Contract interface
      });

      if (result.success && result.data) {
        setAvailableTutors(result.data);
      } else {
        showError(result.error || 'Failed to load available tutors');
      }
    } catch (error) {
      console.error('Error fetching tutors:', error);
      showError('Failed to load available tutors');
    } finally {
      setLoadingTutors(false);
    }
  };

  const handleSelectTutorForRole = (tutor: Tutor, role: 'main' | 'substitute1' | 'substitute2') => {
    if (role === 'main') {
      setSelectedMainTutor(tutor);
    } else if (role === 'substitute1') {
      setSelectedSubstituteTutor1(tutor);
    } else if (role === 'substitute2') {
      setSelectedSubstituteTutor2(tutor);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedContract) return;

    // Validate all tutors are selected
    if (!selectedMainTutor) {
      showError('Please select a main tutor');
      return;
    }

    if (!selectedSubstituteTutor1) {
      showError('Please select substitute tutor 1');
      return;
    }

    if (!selectedSubstituteTutor2) {
      showError('Please select substitute tutor 2');
      return;
    }

    // Validate all tutors are different
    if (selectedMainTutor.userId === selectedSubstituteTutor1.userId ||
        selectedMainTutor.userId === selectedSubstituteTutor2.userId ||
        selectedSubstituteTutor1.userId === selectedSubstituteTutor2.userId) {
      showError('All tutors must be different');
      return;
    }

    try {
      setLoadingTutors(true);
      console.log('Assigning tutors:', {
        contractId: selectedContract.contractId,
        mainTutorId: selectedMainTutor.userId,
        substituteTutor1Id: selectedSubstituteTutor1.userId,
        substituteTutor2Id: selectedSubstituteTutor2.userId,
      });
      const result = await assignTutorToContract(
        selectedContract.contractId,
        selectedMainTutor.userId,
        selectedSubstituteTutor1.userId,
        selectedSubstituteTutor2.userId
      );
      if (result.success) {
        showSuccess('Tutors assigned successfully');
        // Close modal and cleanup
        setShowTutorModal(false);
        setSelectedContract(null);
        setAvailableTutors([]);
        setSelectedMainTutor(null);
        setSelectedSubstituteTutor1(null);
        setSelectedSubstituteTutor2(null);
        // Wait a bit for backend to update, then refresh
        setTimeout(() => {
          fetchContracts();
        }, 500);
      } else {
        showError(result.error || 'Failed to assign tutors');
      }
    } catch (error: any) {
      console.error('Error assigning tutors:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to assign tutors';
      showError(errorMsg);
    } finally {
      setLoadingTutors(false);
    }
  };

  const handleUpdateStatus = async (contractId: string, newStatus: 'active' | 'completed' | 'cancelled', contract?: Contract) => {
    // Validate: Cannot activate contract without tutor assigned
    if (newStatus === 'active') {
      const contractToCheck = contract || contracts.find(c => c.contractId === contractId);
      if (!contractToCheck?.mainTutorId) {
        showError('Cannot activate contract. Please assign a tutor first.');
        return;
      }
    }

    if (!window.confirm(`Are you sure you want to change status to "${newStatus}"?`)) {
      return;
    }

    try {
      setUpdatingStatus(contractId);
      const result = await updateContractStatus(contractId, newStatus);
      if (result.success) {
        showSuccess(`Contract status updated to ${newStatus}`);
        // Refresh contracts after update
        setTimeout(() => {
          fetchContracts();
        }, 300);
      } else {
        showError(result.error || 'Failed to update contract status');
      }
    } catch (error: any) {
      console.error('Error updating contract status:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to update contract status';
      showError(errorMsg);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = String(status || '').toLowerCase().trim();
    switch (normalizedStatus) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contracts...</p>
        </div>
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
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Contract Management</h1>
          <p className="text-gray-600 mt-2">Review and manage contracts</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by child name, package, tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        {paginatedContracts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Contracts Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No contracts available at the moment'}
              </p>
            </div>
          ) : (
          <React.Fragment key="contracts-list">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paginatedContracts.map((contract) => (
              <div
                key={contract.contractId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900 truncate pr-2">{contract.packageName}</h3>
                    <div className="flex items-center space-x-2">
                      {contract.status === 'cancelled' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(contract.status)}`}>
                          Cancelled
                        </span>
                      ) : contract.status === 'unpaid' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(contract.status)}`}>
                          Unpaid
                        </span>
                      ) : (
                        <>
                          <select
                            value={contract.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as 'active' | 'completed' | 'cancelled';
                              // Only allow updating to active, completed, or cancelled (not unpaid or pending)
                              if (newStatus !== contract.status && (newStatus === 'active' || newStatus === 'completed' || newStatus === 'cancelled')) {
                                handleUpdateStatus(contract.contractId, newStatus, contract);
                              }
                            }}
                            disabled={updatingStatus === contract.contractId || contract.status === 'unpaid'}
                            className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 border-0 cursor-pointer ${getStatusColor(contract.status)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="pending" disabled={contract.status !== 'pending'}>Pending</option>
                            <option 
                              value="active" 
                              disabled={
                                contract.status === 'completed' || 
                                contract.status === 'cancelled' || 
                                contract.status === 'unpaid' ||
                                !contract.mainTutorId
                              }
                            >
                              Active{!contract.mainTutorId ? ' (Assign tutor first)' : ''}
                            </option>
                            <option value="completed" disabled={contract.status === 'pending' || contract.status === 'cancelled' || contract.status === 'unpaid'}>Completed</option>
                            <option value="cancelled" disabled={contract.status === 'unpaid'}>Cancelled</option>
                          </select>
                          {updatingStatus === contract.contractId && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 flex-1">
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                      <User className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Child:</span>
                      <span className="truncate">{contract.childName}</span>
                      </div>
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Period:</span>
                      <span className="text-xs">
                          {new Date(contract.startDate).toLocaleDateString()} -{' '}
                          {new Date(contract.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Time:</span>
                      <span className="truncate">{contract.timeSlot || 'Not set'}</span>
                      </div>
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                        {contract.isOnline ? (
                          <span className="text-blue-600">Online</span>
                        ) : (
                          <>
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{contract.centerName || 'Offline'}</span>
                          </>
                        )}
                      </div>
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                      <UserPlus className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">Tutor:</span>
                      <span className="truncate">{contract.mainTutorName || 'Not assigned'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 mt-auto pt-4 border-t border-gray-200">
                    {!contract.mainTutorId && (
                      <button
                        onClick={() => handleAssignTutor(contract)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Assign Tutor</span>
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/contracts/${contract.contractId}`, '_blank')}
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredContracts.length)} of {filteredContracts.length} contracts
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
                    {(() => {
                      const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];
                      const showEllipsisLeft = currentPage > 3;
                      const showEllipsisRight = currentPage < totalPages - 2;

                      // Add first page
                      pages.push(1);

                      // Add ellipsis left if needed
                      if (showEllipsisLeft) {
                        pages.push('ellipsis-left');
                      }

                      // Add pages around current page
                      const startPage = Math.max(2, currentPage - 1);
                      const endPage = Math.min(totalPages - 1, currentPage + 1);
                      for (let i = startPage; i <= endPage; i++) {
                        if (i !== 1 && i !== totalPages) {
                          pages.push(i);
                        }
                      }

                      // Add ellipsis right if needed
                      if (showEllipsisRight) {
                        pages.push('ellipsis-right');
                      }

                      // Add last page if not already added
                      if (totalPages > 1) {
                        pages.push(totalPages);
                      }

                      return pages.map((page, index) => {
                        if (page === 'ellipsis-left' || page === 'ellipsis-right') {
                          return (
                            <span key={`ellipsis-${page}-${index}`} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }

                        return (
                          <button
                            key={`page-${page}`}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 min-w-[2.5rem] rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
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
          </React.Fragment>
          )}
      </div>

      {/* Tutor Selection Modal */}
      {showTutorModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Assign Tutors</h2>
                  <p className="text-gray-600 mt-1 text-sm">
                    Contract: {selectedContract.packageName} - {selectedContract.childName}
                  </p>
                  <p className="text-red-600 mt-2 text-sm font-medium">
                    * Please select 1 main tutor and 2 substitute tutors (all must be different)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTutorModal(false);
                    setSelectedContract(null);
                    setAvailableTutors([]);
                    setSelectedMainTutor(null);
                    setSelectedSubstituteTutor1(null);
                    setSelectedSubstituteTutor2(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingTutors && !availableTutors.length ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading available tutors...</p>
                </div>
              ) : availableTutors.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No available tutors found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Main Tutor Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Required</span>
                      Main Tutor
                    </h3>
                    {selectedMainTutor ? (
                      <div className="mb-3 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedMainTutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedMainTutor.email}</p>
                            {selectedMainTutor.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {selectedMainTutor.centerName}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedMainTutor(null)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableTutors
                          .filter(t => 
                            t.userId !== selectedSubstituteTutor1?.userId && 
                            t.userId !== selectedSubstituteTutor2?.userId
                          )
                          .map((tutor) => (
                          <div
                            key={tutor.userId}
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                            onClick={() => handleSelectTutorForRole(tutor, 'main')}
                          >
                            <h4 className="font-semibold text-gray-900">{tutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{tutor.email}</p>
                            {tutor.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {tutor.centerName}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Substitute Tutor 1 Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Required</span>
                      Substitute Tutor 1
                    </h3>
                    {selectedSubstituteTutor1 ? (
                      <div className="mb-3 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedSubstituteTutor1.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedSubstituteTutor1.email}</p>
                            {selectedSubstituteTutor1.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {selectedSubstituteTutor1.centerName}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedSubstituteTutor1(null)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableTutors
                          .filter(t => 
                            t.userId !== selectedMainTutor?.userId && 
                            t.userId !== selectedSubstituteTutor2?.userId
                          )
                          .map((tutor) => (
                          <div
                            key={tutor.userId}
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-green-500 hover:bg-green-50 cursor-pointer"
                            onClick={() => handleSelectTutorForRole(tutor, 'substitute1')}
                          >
                            <h4 className="font-semibold text-gray-900">{tutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{tutor.email}</p>
                            {tutor.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {tutor.centerName}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Substitute Tutor 2 Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Required</span>
                      Substitute Tutor 2
                    </h3>
                    {selectedSubstituteTutor2 ? (
                      <div className="mb-3 p-4 bg-purple-50 border-2 border-purple-500 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedSubstituteTutor2.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedSubstituteTutor2.email}</p>
                            {selectedSubstituteTutor2.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {selectedSubstituteTutor2.centerName}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedSubstituteTutor2(null)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableTutors
                          .filter(t => 
                            t.userId !== selectedMainTutor?.userId && 
                            t.userId !== selectedSubstituteTutor1?.userId
                          )
                          .map((tutor) => (
                          <div
                            key={tutor.userId}
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-purple-500 hover:bg-purple-50 cursor-pointer"
                            onClick={() => handleSelectTutorForRole(tutor, 'substitute2')}
                          >
                            <h4 className="font-semibold text-gray-900">{tutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{tutor.email}</p>
                            {tutor.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {tutor.centerName}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleConfirmAssignment}
                      disabled={loadingTutors || !selectedMainTutor || !selectedSubstituteTutor1 || !selectedSubstituteTutor2}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {loadingTutors ? 'Assigning Tutors...' : 'Confirm Assignment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManagement;








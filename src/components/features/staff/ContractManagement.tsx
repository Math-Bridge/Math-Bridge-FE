import React, { useState, useEffect } from 'react';
import {
  FileText,
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
  MoreVertical,
  Star,
  Award,
  Clock,
  Mail,
  Phone,
  GraduationCap,
  CheckCircle,
  User,
  UserCheck,
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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  // Selected tutors for assignment
  const [selectedMainTutor, setSelectedMainTutor] = useState<Tutor | null>(null);
  const [selectedSubstituteTutor1, setSelectedSubstituteTutor1] = useState<Tutor | null>(null);
  const [selectedSubstituteTutor2, setSelectedSubstituteTutor2] = useState<Tutor | null>(null);
  // Tutor detail modal
  const [selectedTutorForDetail, setSelectedTutorForDetail] = useState<Tutor | null>(null);
  const [showTutorDetailModal, setShowTutorDetailModal] = useState(false);
  const [tutorDetail, setTutorDetail] = useState<any>(null);
  const [loadingTutorDetail, setLoadingTutorDetail] = useState(false);

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
              offlineAddress: contract.offlineAddress || contract.OfflineAddress || contract.offline_address || null,
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
    
    // Reset selected tutors initially
    setSelectedMainTutor(null);
    setSelectedSubstituteTutor1(null);
    setSelectedSubstituteTutor2(null);
    
    // Fetch available tutors and then pre-select current ones if re-assigning
    const tutors = await fetchAvailableTutors(contract);
    
    // Pre-populate currently assigned tutors for re-assignment
    if (tutors && contract.mainTutorId) {
      const mainTutor = tutors.find(t => t.userId === contract.mainTutorId);
      if (mainTutor) {
        setSelectedMainTutor(mainTutor);
      }
    }
  };

  const fetchAvailableTutors = async (contract: Contract): Promise<Tutor[] | null> => {
    try {
      setLoadingTutors(true);
      
      // Use contract-specific endpoint which checks for overlapping contracts
      // and returns tutors sorted by rating
      const result = await getAvailableTutors({
        contractId: contract.contractId,
      });

      if (result.success && result.data) {
        setAvailableTutors(result.data);
        return result.data;
      } else {
        showError(result.error || 'Failed to load available tutors');
        return null;
      }
    } catch (error) {
      console.error('Error fetching tutors:', error);
      showError('Failed to load available tutors');
      return null;
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
        // Automatically activate contract after assigning tutors
        try {
          const updateResult = await updateContractStatus(
            selectedContract.contractId,
            'active'
          );
          if (updateResult.success) {
            showSuccess('Tutors assigned and contract activated successfully');
          } else {
            showSuccess('Tutors assigned successfully, but failed to activate contract');
            console.error('Failed to activate contract:', updateResult.error);
          }
        } catch (updateError: any) {
          showSuccess('Tutors assigned successfully, but failed to activate contract');
          console.error('Error activating contract:', updateError);
        }
        
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

  const handleViewTutorDetail = async (tutor: Tutor) => {
    setSelectedTutorForDetail(tutor);
    setShowTutorDetailModal(true);
    setLoadingTutorDetail(true);
    
    try {
      // Fetch detailed tutor information
      const result = await apiService.getUserById(tutor.userId);
      if (result.success && result.data) {
        // Combine API data with existing tutor data
        setTutorDetail({
          ...tutor,
          ...result.data,
          fullName: tutor.fullName || result.data.fullName || result.data.FullName || result.data.name || result.data.Name,
          email: tutor.email || result.data.email || result.data.Email,
          phone: tutor.phone || result.data.phone || result.data.phoneNumber || result.data.PhoneNumber,
          bio: tutor.bio || result.data.bio || result.data.Bio,
          university: tutor.university || result.data.university || result.data.University,
          major: tutor.major || result.data.major || result.data.Major,
        });
      } else {
        // If API fails, use the tutor data we already have
        setTutorDetail(tutor);
      }
    } catch (error) {
      console.error('Error fetching tutor details:', error);
      // Use the tutor data we already have
      setTutorDetail(tutor);
    } finally {
      setLoadingTutorDetail(false);
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

        {/* Contracts Table */}
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Child
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedContracts.map((contract) => (
                    <tr key={contract.contractId} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 truncate" title={contract.packageName || ''}>{contract.packageName}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 truncate" title={contract.childName || ''}>{contract.childName}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          <div>{new Date(contract.startDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(contract.endDate).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 truncate" title={contract.timeSlot || 'Not set'}>{contract.timeSlot || 'Not set'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 truncate">
                          {contract.isOnline ? (
                            <span className="text-blue-600">Online</span>
                          ) : (
                            <span title={contract.offlineAddress || contract.centerName || 'Offline'}>
                              {contract.offlineAddress || contract.centerName || 'Offline'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 truncate" title={contract.mainTutorName || 'Not assigned'}>{contract.mainTutorName || 'Not assigned'}</div>
                      </td>
                      <td className="px-4 py-4">
                        {contract.status === 'cancelled' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                            Cancelled
                          </span>
                        ) : contract.status === 'unpaid' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                            Unpaid
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <select
                              value={contract.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'active' | 'completed' | 'cancelled';
                                if (newStatus !== contract.status && (newStatus === 'active' || newStatus === 'completed' || newStatus === 'cancelled')) {
                                  handleUpdateStatus(contract.contractId, newStatus, contract);
                                }
                              }}
                              disabled={updatingStatus === contract.contractId || contract.status === 'unpaid'}
                              className={`px-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${getStatusColor(contract.status)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                                Active
                              </option>
                              <option value="completed" disabled={contract.status === 'pending' || contract.status === 'cancelled' || contract.status === 'unpaid'}>Completed</option>
                              <option value="cancelled" disabled={contract.status === 'unpaid'}>Cancelled</option>
                            </select>
                            {updatingStatus === contract.contractId && (
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === contract.contractId ? null : contract.contractId)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {openDropdownId === contract.contractId && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenDropdownId(null)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                  <div className="py-1">
                                    {!contract.mainTutorId && (
                                      <button
                                        onClick={() => {
                                          handleAssignTutor(contract);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                      >
                                        <UserPlus className="w-4 h-4" />
                                        <span>Assign Tutor</span>
                                      </button>
                                    )}
                                    {contract.mainTutorId && (
                                      <button
                                        onClick={() => {
                                          handleAssignTutor(contract);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                      >
                                        <UserCheck className="w-4 h-4" />
                                        <span>Re-assign Tutor</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        navigate(`/staff/contracts/${contract.contractId}`);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      <span>View Details</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedContract.mainTutorId ? 'Re-assign Tutors' : 'Assign Tutors'}
                  </h2>
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
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{selectedMainTutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedMainTutor.email}</p>
                            {selectedMainTutor.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {selectedMainTutor.centerName}
                              </p>
                            )}
                            {selectedMainTutor.rating && (
                              <div className="flex items-center mt-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                <span className="text-sm font-medium text-gray-700">{selectedMainTutor.rating.toFixed(1)}</span>
                                {selectedMainTutor.reviewCount && (
                                  <span className="text-xs text-gray-500 ml-1">({selectedMainTutor.reviewCount} reviews)</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTutorDetail(selectedMainTutor)}
                              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={() => setSelectedMainTutor(null)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Change
                            </button>
                          </div>
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
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-blue-500 hover:bg-blue-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1" onClick={() => handleSelectTutorForRole(tutor, 'main')}>
                                <h4 className="font-semibold text-gray-900 cursor-pointer">{tutor.fullName}</h4>
                                <p className="text-sm text-gray-600">{tutor.email}</p>
                                {tutor.centerName && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    {tutor.centerName}
                                  </p>
                                )}
                                {tutor.rating && (
                                  <div className="flex items-center mt-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                    <span className="text-sm font-medium text-gray-700">{tutor.rating.toFixed(1)}</span>
                                    {tutor.reviewCount && (
                                      <span className="text-xs text-gray-500 ml-1">({tutor.reviewCount} reviews)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTutorDetail(tutor);
                                }}
                                className="ml-2 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors flex items-center space-x-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Details</span>
                              </button>
                            </div>
                            <button
                              onClick={() => handleSelectTutorForRole(tutor, 'main')}
                              className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Select as Main Tutor
                            </button>
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
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{selectedSubstituteTutor1.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedSubstituteTutor1.email}</p>
                            {selectedSubstituteTutor1.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {selectedSubstituteTutor1.centerName}
                              </p>
                            )}
                            {selectedSubstituteTutor1.rating && (
                              <div className="flex items-center mt-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                <span className="text-sm font-medium text-gray-700">{selectedSubstituteTutor1.rating.toFixed(1)}</span>
                                {selectedSubstituteTutor1.reviewCount && (
                                  <span className="text-xs text-gray-500 ml-1">({selectedSubstituteTutor1.reviewCount} reviews)</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTutorDetail(selectedSubstituteTutor1)}
                              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={() => setSelectedSubstituteTutor1(null)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Change
                            </button>
                          </div>
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
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-green-500 hover:bg-green-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1" onClick={() => handleSelectTutorForRole(tutor, 'substitute1')}>
                                <h4 className="font-semibold text-gray-900 cursor-pointer">{tutor.fullName}</h4>
                                <p className="text-sm text-gray-600">{tutor.email}</p>
                                {tutor.centerName && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    {tutor.centerName}
                                  </p>
                                )}
                                {tutor.rating && (
                                  <div className="flex items-center mt-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                    <span className="text-sm font-medium text-gray-700">{tutor.rating.toFixed(1)}</span>
                                    {tutor.reviewCount && (
                                      <span className="text-xs text-gray-500 ml-1">({tutor.reviewCount} reviews)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTutorDetail(tutor);
                                }}
                                className="ml-2 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors flex items-center space-x-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Details</span>
                              </button>
                            </div>
                            <button
                              onClick={() => handleSelectTutorForRole(tutor, 'substitute1')}
                              className="w-full mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Select as Substitute 1
                            </button>
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
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{selectedSubstituteTutor2.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedSubstituteTutor2.email}</p>
                            {selectedSubstituteTutor2.centerName && (
                              <p className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {selectedSubstituteTutor2.centerName}
                              </p>
                            )}
                            {selectedSubstituteTutor2.rating && (
                              <div className="flex items-center mt-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                <span className="text-sm font-medium text-gray-700">{selectedSubstituteTutor2.rating.toFixed(1)}</span>
                                {selectedSubstituteTutor2.reviewCount && (
                                  <span className="text-xs text-gray-500 ml-1">({selectedSubstituteTutor2.reviewCount} reviews)</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTutorDetail(selectedSubstituteTutor2)}
                              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={() => setSelectedSubstituteTutor2(null)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Change
                            </button>
                          </div>
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
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-purple-500 hover:bg-purple-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1" onClick={() => handleSelectTutorForRole(tutor, 'substitute2')}>
                                <h4 className="font-semibold text-gray-900 cursor-pointer">{tutor.fullName}</h4>
                                <p className="text-sm text-gray-600">{tutor.email}</p>
                                {tutor.centerName && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    {tutor.centerName}
                                  </p>
                                )}
                                {tutor.rating && (
                                  <div className="flex items-center mt-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                    <span className="text-sm font-medium text-gray-700">{tutor.rating.toFixed(1)}</span>
                                    {tutor.reviewCount && (
                                      <span className="text-xs text-gray-500 ml-1">({tutor.reviewCount} reviews)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTutorDetail(tutor);
                                }}
                                className="ml-2 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors flex items-center space-x-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Details</span>
                              </button>
                            </div>
                            <button
                              onClick={() => handleSelectTutorForRole(tutor, 'substitute2')}
                              className="w-full mt-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Select as Substitute 2
                            </button>
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

      {/* Tutor Detail Modal */}
      {showTutorDetailModal && selectedTutorForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Tutor Details</h2>
                <button
                  onClick={() => {
                    setShowTutorDetailModal(false);
                    setSelectedTutorForDetail(null);
                    setTutorDetail(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingTutorDetail ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading tutor details...</p>
                </div>
              ) : tutorDetail ? (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-start space-x-4 pb-6 border-b border-gray-200">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                      {tutorDetail.fullName?.charAt(0)?.toUpperCase() || <User className="w-10 h-10" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">{tutorDetail.fullName}</h3>
                        {tutorDetail.verificationStatus === 'verified' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        )}
                      </div>
                      {tutorDetail.rating && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="font-semibold text-gray-900">{tutorDetail.rating.toFixed(1)}</span>
                          {tutorDetail.reviewCount && (
                            <span className="text-gray-500">({tutorDetail.reviewCount} reviews)</span>
                          )}
                        </div>
                      )}
                      {tutorDetail.centerName && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{tutorDetail.centerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      {tutorDetail.email && (
                        <div className="flex items-center text-sm text-gray-700">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{tutorDetail.email}</span>
                        </div>
                      )}
                      {tutorDetail.phone && (
                        <div className="flex items-center text-sm text-gray-700">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{tutorDetail.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {tutorDetail.bio && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                      <p className="text-gray-700 leading-relaxed">{tutorDetail.bio}</p>
                    </div>
                  )}

                  {/* Qualifications */}
                  {(tutorDetail.university || tutorDetail.major) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                        Education
                      </h4>
                      <div className="space-y-2">
                        {tutorDetail.university && (
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">University: </span>
                            {tutorDetail.university}
                          </div>
                        )}
                        {tutorDetail.major && (
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Major: </span>
                            {tutorDetail.major}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Specialties */}
                  {tutorDetail.specialties && tutorDetail.specialties.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {tutorDetail.specialties.map((specialty: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience & Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tutorDetail.yearsOfExperience !== undefined && (
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{tutorDetail.yearsOfExperience}</div>
                        <div className="text-xs text-gray-600 mt-1">Years Experience</div>
                      </div>
                    )}
                    {tutorDetail.studentCount !== undefined && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{tutorDetail.studentCount}</div>
                        <div className="text-xs text-gray-600 mt-1">Students</div>
                      </div>
                    )}
                    {tutorDetail.rating !== undefined && (
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{tutorDetail.rating.toFixed(1)}</div>
                        <div className="text-xs text-gray-600 mt-1">Rating</div>
                      </div>
                    )}
                    {tutorDetail.hourlyRate !== undefined && (
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(tutorDetail.hourlyRate * 25000)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Per Hour</div>
                      </div>
                    )}
                  </div>

                  {/* Teaching Capabilities */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Teaching Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {tutorDetail.canTeachOnline && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Online Teaching
                        </span>
                      )}
                      {tutorDetail.canTeachOffline && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          Offline Teaching
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Achievements */}
                  {tutorDetail.achievements && tutorDetail.achievements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-yellow-600" />
                        Achievements
                      </h4>
                      <div className="space-y-2">
                        {tutorDetail.achievements.map((achievement: any, index: number) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="font-medium text-gray-900">{achievement.title}</div>
                            {achievement.description && (
                              <div className="text-sm text-gray-600 mt-1">{achievement.description}</div>
                            )}
                            {achievement.date && (
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {new Date(achievement.date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Unable to load tutor details</p>
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








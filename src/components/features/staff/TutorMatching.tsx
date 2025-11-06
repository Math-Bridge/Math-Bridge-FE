import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAllContracts,
  Contract,
  getAvailableTutors,
  Tutor,
  assignTutorToContract,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface TutorMatchingProps {
  hideBackButton?: boolean;
}

const TutorMatching: React.FC<TutorMatchingProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [availableTutors, setAvailableTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineFilter, setOnlineFilter] = useState<string>('all'); // 'all', 'online', 'offline'
  const [contractsCurrentPage, setContractsCurrentPage] = useState(1);
  const [tutorsCurrentPage, setTutorsCurrentPage] = useState(1);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const result = await getAllContracts();
      if (result.success && result.data) {
        // Filter contracts that need tutor assignment
        const pendingContracts = result.data.filter(
          (c) => !c.mainTutorId || c.status === 'pending'
        );
        setContracts(pendingContracts);
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

  const handleSelectContract = async (contract: Contract) => {
    setSelectedContract(contract);
    setShowTutorModal(true);
    setTutorsCurrentPage(1);
    setSearchTerm('');
    await fetchAvailableTutors(contract);
  };

  const fetchAvailableTutors = async (contract: Contract) => {
    try {
      setLoadingTutors(true);
      const params: any = {
        centerId: contract.centerId,
        isOnline: contract.isOnline,
      };
      
      // Add daysOfWeek if available
      if ((contract as any).daysOfWeeks) {
        params.daysOfWeek = (contract as any).daysOfWeeks;
      }
      
      // Add startTime and endTime if available for better matching
      if ((contract as any).startTime && (contract as any).endTime) {
        params.startTime = (contract as any).startTime;
        params.endTime = (contract as any).endTime;
      }
      
      const result = await getAvailableTutors(params);

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

  const handleAssignTutor = async (tutorId: string) => {
    if (!selectedContract) return;

    try {
      const result = await assignTutorToContract(selectedContract.contractId, tutorId);
      if (result.success) {
        showSuccess('Tutor assigned successfully');
        setShowTutorModal(false);
        setSelectedContract(null);
        setAvailableTutors([]);
        setSearchTerm('');
        fetchContracts();
      } else {
        showError(result.error || 'Failed to assign tutor');
      }
    } catch (error) {
      console.error('Error assigning tutor:', error);
      showError('Failed to assign tutor');
    }
  };

  // Filter contracts by online/offline
  const pendingContracts = contracts.filter((c) => {
    const needsTutor = !c.mainTutorId || c.status === 'pending';
    
    // Filter by online/offline
    if (onlineFilter === 'online') {
      return needsTutor && c.isOnline;
    } else if (onlineFilter === 'offline') {
      return needsTutor && !c.isOnline;
    }
    
    return needsTutor;
  });

  // Filter tutors by search term
  const filteredTutors = availableTutors.filter((tutor) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tutor.fullName?.toLowerCase().includes(term) ||
      tutor.email?.toLowerCase().includes(term) ||
      tutor.phone?.toLowerCase().includes(term)
    );
  });

  // Pagination for contracts
  const contractsTotalPages = Math.ceil(pendingContracts.length / itemsPerPage);
  const contractsStartIndex = (contractsCurrentPage - 1) * itemsPerPage;
  const contractsEndIndex = contractsStartIndex + itemsPerPage;
  const paginatedContracts = pendingContracts.slice(contractsStartIndex, contractsEndIndex);

  // Pagination for tutors
  const tutorsTotalPages = Math.ceil(filteredTutors.length / itemsPerPage);
  const tutorsStartIndex = (tutorsCurrentPage - 1) * itemsPerPage;
  const tutorsEndIndex = tutorsStartIndex + itemsPerPage;
  const paginatedTutors = filteredTutors.slice(tutorsStartIndex, tutorsEndIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setContractsCurrentPage(1);
  }, [onlineFilter]);

  useEffect(() => {
    setTutorsCurrentPage(1);
  }, [searchTerm]);

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
          <h1 className="text-3xl font-bold text-gray-900">Tutor Matching</h1>
          <p className="text-gray-600 mt-2">Match tutors with contracts</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setOnlineFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  onlineFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setOnlineFilter('online')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  onlineFilter === 'online'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setOnlineFilter('offline')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  onlineFilter === 'offline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Offline
              </button>
            </div>
          </div>
        </div>

          {/* Contracts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Contracts Needing Tutors</h2>
          {paginatedContracts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Contracts Assigned</h3>
                  <p className="text-gray-600">All contracts have tutors assigned</p>
                </div>
              ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paginatedContracts.map((contract) => (
                  <div
                    key={contract.contractId}
                    onClick={() => handleSelectContract(contract)}
                    className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all cursor-pointer flex flex-col ${
                      selectedContract?.contractId === contract.contractId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-900 truncate pr-2">{contract.packageName}</h3>
                        {selectedContract?.contractId === contract.contractId && (
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
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
                          <span className="truncate">
                            {(contract as any).daysOfWeeksDisplay || contract.timeSlot || 'Not set'}
                            {(contract as any).startTime && (contract as any).endTime && (
                              <span className="ml-1">
                                ({(contract as any).startTime} - {(contract as any).endTime})
                              </span>
                            )}
                          </span>
                          </div>
                        <div className="flex items-center space-x-2 text-gray-600 text-sm">
                          {contract.isOnline ? (
                            <span className="text-blue-600 font-medium">Online</span>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{contract.centerName || 'Offline'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Contracts Pagination */}
              {contractsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {contractsStartIndex + 1} to {Math.min(contractsEndIndex, pendingContracts.length)} of {pendingContracts.length} contracts
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setContractsCurrentPage(p => Math.max(1, p - 1))}
                      disabled={contractsCurrentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: contractsTotalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 1 ||
                          page === contractsTotalPages ||
                          (page >= contractsCurrentPage - 1 && page <= contractsCurrentPage + 1);
                        
                        if (!showPage) {
                          // Show ellipsis
                          if (page === contractsCurrentPage - 2 || page === contractsCurrentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-400">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setContractsCurrentPage(page)}
                            className={`px-3 py-2 min-w-[2.5rem] rounded-lg text-sm font-medium transition-colors ${
                              contractsCurrentPage === page
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setContractsCurrentPage(p => Math.min(contractsTotalPages, p + 1))}
                      disabled={contractsCurrentPage === contractsTotalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
              )}
            </>
              )}
            </div>
          </div>

      {/* Tutor Selection Modal */}
      {showTutorModal && selectedContract && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTutorModal(false);
              setSelectedContract(null);
              setAvailableTutors([]);
              setSearchTerm('');
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Assign Tutor</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedContract.packageName} - {selectedContract.childName}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>
                      {(selectedContract as any).daysOfWeeksDisplay || selectedContract.timeSlot || 'Time not set'}
                      {(selectedContract as any).startTime && (selectedContract as any).endTime && (
                        <span className="ml-1">
                          ({(selectedContract as any).startTime} - {(selectedContract as any).endTime})
                        </span>
                      )}
                    </span>
                    <span>{selectedContract.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTutorModal(false);
                    setSelectedContract(null);
                    setAvailableTutors([]);
                    setSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
                  </div>
                </div>

            <div className="p-6">
                {/* Search */}
              <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                  placeholder="Search tutors by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tutors List */}
                {loadingTutors ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading available tutors...</p>
                  </div>
                ) : filteredTutors.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {searchTerm ? 'No tutors match your search' : 'No available tutors found'}
                    </p>
                  </div>
                ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {paginatedTutors.map((tutor) => (
                      <div
                        key={tutor.userId}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{tutor.fullName}</h3>
                            <p className="text-sm text-gray-600 mt-1">{tutor.email}</p>
                            {tutor.phone && (
                              <p className="text-sm text-gray-500 mt-1">{tutor.phone}</p>
                            )}
                            {tutor.centerName && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500 mt-2">
                                <MapPin className="w-4 h-4" />
                                <span>{tutor.centerName}</span>
                              </div>
                            )}
                            {tutor.rating && (
                              <div className="flex items-center space-x-1 text-sm text-yellow-600 mt-1">
                                <span>⭐</span>
                                <span>{tutor.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleAssignTutor(tutor.userId)}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 flex-shrink-0"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Assign</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Tutors Pagination */}
                  {tutorsTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6">
                      <div className="text-sm text-gray-600">
                        Showing {tutorsStartIndex + 1} to {Math.min(tutorsEndIndex, filteredTutors.length)} of {filteredTutors.length} tutors
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setTutorsCurrentPage(p => Math.max(1, p - 1))}
                          disabled={tutorsCurrentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: tutorsTotalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            const showPage = 
                              page === 1 ||
                              page === tutorsTotalPages ||
                              (page >= tutorsCurrentPage - 1 && page <= tutorsCurrentPage + 1);
                            
                            if (!showPage) {
                              // Show ellipsis
                              if (page === tutorsCurrentPage - 2 || page === tutorsCurrentPage + 2) {
                                return (
                                  <span key={page} className="px-2 text-gray-400">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }
                            
                            return (
                              <button
                                key={page}
                                onClick={() => setTutorsCurrentPage(page)}
                                className={`px-3 py-2 min-w-[2.5rem] rounded-lg text-sm font-medium transition-colors ${
                                  tutorsCurrentPage === page
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setTutorsCurrentPage(p => Math.min(tutorsTotalPages, p + 1))}
                          disabled={tutorsCurrentPage === tutorsTotalPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default TutorMatching;

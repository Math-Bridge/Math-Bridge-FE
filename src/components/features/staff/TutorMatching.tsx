import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MapPin,
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
  // Selected tutors for assignment
  const [selectedMainTutor, setSelectedMainTutor] = useState<Tutor | null>(null);
  const [selectedSubstituteTutor1, setSelectedSubstituteTutor1] = useState<Tutor | null>(null);
  const [selectedSubstituteTutor2, setSelectedSubstituteTutor2] = useState<Tutor | null>(null);

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
    // Reset selected tutors when opening modal
    setSelectedMainTutor(null);
    setSelectedSubstituteTutor1(null);
    setSelectedSubstituteTutor2(null);
    await fetchAvailableTutors(contract);
  };

  const fetchAvailableTutors = async (contract: Contract) => {
    try {
      setLoadingTutors(true);
      
      // Use contract-specific endpoint which checks for overlapping contracts
      // and returns tutors sorted by rating
      const result = await getAvailableTutors({
        contractId: contract.contractId,
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
      const result = await assignTutorToContract(
        selectedContract.contractId,
        selectedMainTutor.userId,
        selectedSubstituteTutor1.userId,
        selectedSubstituteTutor2.userId
      );
      if (result.success) {
        showSuccess('Tutors assigned successfully');
        setShowTutorModal(false);
        setSelectedContract(null);
        setAvailableTutors([]);
        setSearchTerm('');
        setSelectedMainTutor(null);
        setSelectedSubstituteTutor1(null);
        setSelectedSubstituteTutor2(null);
        fetchContracts();
      } else {
        showError(result.error || 'Failed to assign tutors');
      }
    } catch (error) {
      console.error('Error assigning tutors:', error);
      showError('Failed to assign tutors');
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Package
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Child
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Slot
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedContracts.map((contract) => (
                        <tr
                          key={contract.contractId}
                          onClick={() => handleSelectContract(contract)}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedContract?.contractId === contract.contractId
                              ? 'bg-blue-50'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-900">{contract.packageName}</div>
                              {selectedContract?.contractId === contract.contractId && (
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{contract.childName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {(contract as any).daysOfWeeksDisplay || contract.timeSlot || 'Not set'}
                              {(contract as any).startTime && (contract as any).endTime && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({(contract as any).startTime} - {(contract as any).endTime})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {contract.isOnline ? (
                                <span className="text-blue-600">Online</span>
                              ) : (
                                <span>{contract.centerName || 'Offline'}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              contract.status === 'active' ? 'bg-green-100 text-green-800' :
                              contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              contract.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              contract.status === 'unpaid' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {contract.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectContract(contract);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs flex items-center space-x-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Assign</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              setSelectedMainTutor(null);
              setSelectedSubstituteTutor1(null);
              setSelectedSubstituteTutor2(null);
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
                  <h2 className="text-2xl font-bold text-gray-900">Assign Tutors</h2>
                  <p className="text-gray-600 mt-1 text-sm">
                    {selectedContract.packageName} - {selectedContract.childName}
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
                    setSearchTerm('');
                    setSelectedMainTutor(null);
                    setSelectedSubstituteTutor1(null);
                    setSelectedSubstituteTutor2(null);
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
              {loadingTutors && !availableTutors.length ? (
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
                        {filteredTutors
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
                          <div className="flex-1">
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
                        {filteredTutors
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
                          <div className="flex-1">
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
                        {filteredTutors
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
                      disabled={!selectedMainTutor || !selectedSubstituteTutor1 || !selectedSubstituteTutor2}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      Confirm Assignment
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

export default TutorMatching;

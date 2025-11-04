import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { getAllContracts, Contract, assignTutorToContract, getAvailableTutors, Tutor } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

const ContractManagement: React.FC = () => {
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

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const result = await getAllContracts();
      if (result.success && result.data) {
        setContracts(result.data);
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

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
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

  const handleAssignTutor = async (contract: Contract) => {
    setSelectedContract(contract);
    setShowTutorModal(true);
    await fetchAvailableTutors(contract);
  };

  const fetchAvailableTutors = async (contract: Contract) => {
    try {
      setLoadingTutors(true);
      // Extract days of week from contract if available
      const result = await getAvailableTutors({
        centerId: contract.centerId,
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

  const handleSelectTutor = async (tutorId: string) => {
    if (!selectedContract) return;

    try {
      const result = await assignTutorToContract(selectedContract.contractId, tutorId);
      if (result.success) {
        showSuccess('Tutor assigned successfully');
        setShowTutorModal(false);
        setSelectedContract(null);
        fetchContracts();
      } else {
        showError(result.error || 'Failed to assign tutor');
      }
    } catch (error) {
      console.error('Error assigning tutor:', error);
      showError('Failed to assign tutor');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.length === 0 ? (
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
            filteredContracts.map((contract) => (
              <div
                key={contract.contractId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{contract.packageName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-5 h-5" />
                        <span className="font-medium">Child:</span>
                        <span>{contract.childName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">Period:</span>
                        <span>
                          {new Date(contract.startDate).toLocaleDateString()} -{' '}
                          {new Date(contract.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Time:</span>
                        <span>{contract.timeSlot || 'Not set'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        {contract.isOnline ? (
                          <span className="text-blue-600">Online</span>
                        ) : (
                          <>
                            <MapPin className="w-5 h-5" />
                            <span>{contract.centerName || 'Offline'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-600 mb-4">
                      <UserPlus className="w-5 h-5" />
                      <span className="font-medium">Tutor:</span>
                      <span>{contract.mainTutorName || 'Not assigned'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {!contract.mainTutorId && (
                      <button
                        onClick={() => handleAssignTutor(contract)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Assign Tutor</span>
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/contracts/${contract.contractId}`, '_blank')}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tutor Selection Modal */}
      {showTutorModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Assign Tutor</h2>
                <button
                  onClick={() => {
                    setShowTutorModal(false);
                    setSelectedContract(null);
                    setAvailableTutors([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Contract: {selectedContract.packageName} - {selectedContract.childName}
              </p>
            </div>

            <div className="p-6">
              {loadingTutors ? (
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
                <div className="space-y-3">
                  {availableTutors.map((tutor) => (
                    <div
                      key={tutor.userId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                      onClick={() => handleSelectTutor(tutor.userId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{tutor.fullName}</h3>
                          <p className="text-sm text-gray-600">{tutor.email}</p>
                          {tutor.centerName && (
                            <p className="text-sm text-gray-500 mt-1">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {tutor.centerName}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTutor(tutor.userId);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  ))}
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



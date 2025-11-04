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
} from 'lucide-react';
import {
  getAllContracts,
  Contract,
  getAvailableTutors,
  Tutor,
  assignTutorToContract,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

const TutorMatching: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [availableTutors, setAvailableTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    await fetchAvailableTutors(contract);
  };

  const fetchAvailableTutors = async (contract: Contract) => {
    try {
      setLoadingTutors(true);
      const result = await getAvailableTutors({
        centerId: contract.centerId,
        isOnline: contract.isOnline,
        // daysOfWeek: contract.daysOfWeeks, // If available
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

  const handleAssignTutor = async (tutorId: string) => {
    if (!selectedContract) return;

    try {
      const result = await assignTutorToContract(selectedContract.contractId, tutorId);
      if (result.success) {
        showSuccess('Tutor assigned successfully');
        setSelectedContract(null);
        setAvailableTutors([]);
        fetchContracts();
      } else {
        showError(result.error || 'Failed to assign tutor');
      }
    } catch (error) {
      console.error('Error assigning tutor:', error);
      showError('Failed to assign tutor');
    }
  };

  const filteredTutors = availableTutors.filter((tutor) =>
    searchTerm
      ? tutor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const pendingContracts = contracts.filter((c) => !c.mainTutorId || c.status === 'pending');

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
          <h1 className="text-3xl font-bold text-gray-900">Tutor Matching</h1>
          <p className="text-gray-600 mt-2">Match tutors with contracts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contracts List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contracts Needing Tutors</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {pendingContracts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-600">All contracts have tutors assigned</p>
                </div>
              ) : (
                pendingContracts.map((contract) => (
                  <div
                    key={contract.contractId}
                    onClick={() => handleSelectContract(contract)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedContract?.contractId === contract.contractId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{contract.packageName}</h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{contract.childName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(contract.startDate).toLocaleDateString()} -{' '}
                              {new Date(contract.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{contract.timeSlot || 'Time not set'}</span>
                          </div>
                          {contract.isOnline ? (
                            <span className="text-blue-600">Online</span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{contract.centerName || 'Offline'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedContract?.contractId === contract.contractId && (
                        <CheckCircle className="w-5 h-5 text-blue-600 ml-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Tutors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedContract ? 'Available Tutors' : 'Select a Contract'}
            </h2>

            {!selectedContract ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Select a contract to see available tutors</p>
              </div>
            ) : (
              <>
                {/* Contract Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {selectedContract.packageName}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedContract.childName}</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>{selectedContract.timeSlot || 'Time not set'}</span>
                    <span>{selectedContract.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tutors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tutors List */}
                {loadingTutors ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading available tutors...</p>
                  </div>
                ) : filteredTutors.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {searchTerm ? 'No tutors match your search' : 'No available tutors found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {filteredTutors.map((tutor) => (
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
                                <span>★</span>
                                <span>{tutor.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleAssignTutor(tutor.userId)}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Assign</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorMatching;



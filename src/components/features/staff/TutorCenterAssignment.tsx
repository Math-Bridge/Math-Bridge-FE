import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Search,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUnassignedTutors, suggestCentersForTutor, assignTutorToCenter } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface Tutor {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  formattedAddress?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  tutorVerification?: {
    verificationStatus: string;
    hourlyRate?: number;
    university?: string;
    major?: string;
  };
}

interface Center {
  centerId: string;
  name: string;
  formattedAddress?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  tutorCount?: number;
}

interface TutorCenterAssignmentProps {
  hideBackButton?: boolean;
}

const TutorCenterAssignment: React.FC<TutorCenterAssignmentProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [suggestedCenters, setSuggestedCenters] = useState<Center[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);

  useEffect(() => {
    fetchUnassignedTutors();
  }, []);

  const fetchUnassignedTutors = async () => {
    try {
      setLoading(true);
      const result = await getUnassignedTutors();
      if (result.success && result.data) {
        setTutors(result.data);
      } else {
        showError(result.error || 'Failed to load unassigned tutors');
      }
    } catch (error) {
      console.error('Error fetching unassigned tutors:', error);
      showError('Failed to load unassigned tutors');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTutor = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setSelectedCenter(null);
    setSuggestedCenters([]);

    // Check if tutor has address
    if (!tutor.latitude || !tutor.longitude) {
      showError('This tutor has not set their address yet. Please ask them to update their address first.');
      return;
    }

    // Fetch suggested centers
    await fetchSuggestedCenters(tutor.userId);
  };

  const fetchSuggestedCenters = async (tutorId: string) => {
    try {
      setLoadingCenters(true);
      const result = await suggestCentersForTutor(tutorId, radiusKm);
      if (result.success && result.data) {
        setSuggestedCenters(result.data.suggestedCenters || []);
        if (result.data.totalCount === 0) {
          showError('No centers found near this tutor\'s address. Try increasing the search radius.');
        }
      } else {
        showError(result.error || 'Failed to load suggested centers');
      }
    } catch (error: any) {
      console.error('Error fetching suggested centers:', error);
      if (error.message?.includes('location not set')) {
        showError('Tutor location not set. Please ask tutor to update their address first.');
      } else {
        showError('Failed to load suggested centers');
      }
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleAssignCenter = async () => {
    if (!selectedTutor || !selectedCenter) return;

    try {
      setAssigning(true);
      const result = await assignTutorToCenter(selectedCenter.centerId, selectedTutor.userId);
      if (result.success) {
        showSuccess(`Tutor ${selectedTutor.fullName} has been assigned to ${selectedCenter.name}`);
        // Remove tutor from list
        setTutors(tutors.filter(t => t.userId !== selectedTutor.userId));
        setSelectedTutor(null);
        setSelectedCenter(null);
        setSuggestedCenters([]);
      } else {
        showError(result.error || 'Failed to assign tutor to center');
      }
    } catch (error: any) {
      console.error('Error assigning tutor to center:', error);
      if (error.message?.includes('already assigned')) {
        showError('Tutor is already assigned to this center');
      } else if (error.message?.includes('verified')) {
        showError('Tutor must be verified before being assigned to a center');
      } else {
        showError('Failed to assign tutor to center');
      }
    } finally {
      setAssigning(false);
    }
  };

  const filteredTutors = tutors.filter(tutor => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tutor.fullName?.toLowerCase().includes(term) ||
      tutor.email?.toLowerCase().includes(term) ||
      tutor.phoneNumber?.toLowerCase().includes(term) ||
      tutor.formattedAddress?.toLowerCase().includes(term) ||
      tutor.city?.toLowerCase().includes(term) ||
      tutor.district?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unassigned tutors...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tutor Center Assignment</h1>
              <p className="text-gray-600 mt-2">Assign tutors to centers based on their location</p>
            </div>
            <button
              onClick={fetchUnassignedTutors}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Tutors List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Unassigned Tutors ({filteredTutors.length})
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tutors by name, email, phone, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tutors List */}
            {filteredTutors.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Tutors Assigned</h3>
                <p className="text-gray-600">All tutors have been assigned to centers</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTutors.map((tutor) => (
                  <div
                    key={tutor.userId}
                    onClick={() => handleSelectTutor(tutor)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTutor?.userId === tutor.userId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">{tutor.fullName}</h3>
                          {tutor.tutorVerification?.verificationStatus === 'approved' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{tutor.email}</p>
                        {tutor.phoneNumber && (
                          <p className="text-sm text-gray-600 mb-1">{tutor.phoneNumber}</p>
                        )}
                        {tutor.formattedAddress ? (
                          <div className="flex items-start space-x-1 mt-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">{tutor.formattedAddress}</p>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 mt-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <p className="text-sm text-amber-600">Address not set</p>
                          </div>
                        )}
                        {tutor.tutorVerification?.hourlyRate && (
                          <p className="text-sm text-gray-500 mt-1">
                            ${tutor.tutorVerification.hourlyRate}/hour
                          </p>
                        )}
                      </div>
                      {selectedTutor?.userId === tutor.userId && (
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Suggested Centers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!selectedTutor ? (
              <div className="text-center py-12">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Tutor</h3>
                <p className="text-gray-600">Select a tutor from the list to see suggested centers</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Suggested Centers</h2>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Radius (km)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={radiusKm}
                        onChange={(e) => {
                          const newRadius = parseInt(e.target.value) || 10;
                          setRadiusKm(newRadius);
                          if (selectedTutor) {
                            fetchSuggestedCenters(selectedTutor.userId);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => fetchSuggestedCenters(selectedTutor.userId)}
                      disabled={loadingCenters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mt-6"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingCenters ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Tutor:</strong> {selectedTutor.fullName}
                    </p>
                    {selectedTutor.formattedAddress && (
                      <p className="text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {selectedTutor.formattedAddress}
                      </p>
                    )}
                  </div>
                </div>

                {loadingCenters ? (
                  <div className="text-center py-12">
                    <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading suggested centers...</p>
                  </div>
                ) : suggestedCenters.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Centers Found</h3>
                    <p className="text-gray-600 mb-4">
                      No centers found within {radiusKm}km of this tutor's address.
                    </p>
                    <p className="text-sm text-gray-500">
                      Try increasing the search radius or ask the tutor to update their address.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {suggestedCenters.map((center) => (
                      <div
                        key={center.centerId}
                        onClick={() => setSelectedCenter(center)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedCenter?.centerId === center.centerId
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Building className="w-5 h-5 text-gray-400" />
                              <h3 className="font-semibold text-gray-900">{center.name}</h3>
                              {selectedCenter?.centerId === center.centerId && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            {center.formattedAddress && (
                              <div className="flex items-start space-x-1 mb-2">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-600">{center.formattedAddress}</p>
                              </div>
                            )}
                            {center.tutorCount !== undefined && (
                              <p className="text-sm text-gray-500">
                                {center.tutorCount} tutor{center.tutorCount !== 1 ? 's' : ''} assigned
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assign Button */}
                {selectedTutor && selectedCenter && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Ready to Assign</p>
                      <p className="text-sm text-gray-700">
                        <strong>Tutor:</strong> {selectedTutor.fullName}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Center:</strong> {selectedCenter.name}
                      </p>
                    </div>
                    <button
                      onClick={handleAssignCenter}
                      disabled={assigning}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
                    >
                      {assigning ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Assigning...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Assign Tutor to Center</span>
                        </>
                      )}
                    </button>
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

export default TutorCenterAssignment;





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
import { getUnassignedTutors, assignTutorToCenter, apiService, getCentersNearAddress } from '../../../services/api';
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

    // Fetch tutor details to get location if not available
    let tutorWithLocation = tutor;
    if (!tutor.latitude || !tutor.longitude) {
      // Try to fetch full tutor details to get location
      try {
        const tutorDetailsResult = await apiService.request<any>(`/users/${tutor.userId}`, {
          method: 'GET',
        });
        if (tutorDetailsResult.success && tutorDetailsResult.data) {
          const details = tutorDetailsResult.data;
          tutorWithLocation = {
            ...tutor,
            latitude: details.latitude ?? details.Latitude ?? tutor.latitude,
            longitude: details.longitude ?? details.Longitude ?? tutor.longitude,
            formattedAddress: details.formattedAddress || details.FormattedAddress || tutor.formattedAddress,
            city: details.city || details.City || tutor.city,
            district: details.district || details.District || tutor.district,
          };
          setSelectedTutor(tutorWithLocation);
        }
      } catch (error) {
        console.error('Error fetching tutor details:', error);
      }
    }

    // Check if tutor has address after fetching
    if (!tutorWithLocation.latitude || !tutorWithLocation.longitude) {
      showError('This tutor has not set their address yet. Please ask them to update their address first.');
      return;
    }

    // Fetch suggested centers based on tutor's location
    await fetchSuggestedCenters(tutorWithLocation);
  };

  const fetchSuggestedCenters = async (tutor: Tutor) => {
    try {
      setLoadingCenters(true);
      
      // Use the tutor's formatted address or construct from city/district
      if (!tutor.formattedAddress && !tutor.city) {
        showError('Tutor location not set. Please ask tutor to update their address first.');
        return;
      }

      const address = tutor.formattedAddress || `${tutor.district || ''}, ${tutor.city || ''}`.trim();
      
      // Use getCentersNearAddress to find centers near tutor's location
      const result = await getCentersNearAddress(address, radiusKm);
      
      if (result.success && result.data) {
        const centers = Array.isArray(result.data) ? result.data : (result.data as any).data || [];
        setSuggestedCenters(centers);
        if (centers.length === 0) {
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <User className="w-6 h-6" />
              </div>
              <Building className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Unassigned Tutors</p>
            <p className="text-3xl font-bold">{tutors.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <Navigation className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Search Radius</p>
            <p className="text-3xl font-bold">{radiusKm} km</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building className="w-6 h-6" />
              </div>
              <CheckCircle className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Suggested Centers</p>
            <p className="text-3xl font-bold">{suggestedCenters.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Tutors List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200/50 p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Unassigned Tutors ({filteredTutors.length})
              </h2>
            </div>

            {/* Search */}
            <div className="bg-gray-50 rounded-xl border border-gray-200/50 p-4 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Search className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Search Tutors</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                />
              </div>
            </div>

            {/* Tutors List */}
            {filteredTutors.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">All Tutors Assigned</h3>
                <p className="text-gray-600 text-lg">All tutors have been assigned to centers</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTutors.map((tutor) => (
                  <div
                    key={tutor.userId}
                    onClick={() => handleSelectTutor(tutor)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] ${
                      selectedTutor?.userId === tutor.userId
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
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
          <div className="bg-white rounded-xl shadow-md border border-gray-200/50 p-6 backdrop-blur-sm">
            {!selectedTutor ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
                  <Building className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Select a Tutor</h3>
                <p className="text-gray-600 text-lg">Select a tutor from the list to see suggested centers</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-bold text-gray-900">Suggested Centers</h2>
                  </div>
                  
                  {/* Search Radius Control */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200/50 p-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => fetchSuggestedCenters(selectedTutor.userId)}
                          disabled={loadingCenters}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg"
                        >
                          <RefreshCw className={`w-4 h-4 ${loadingCenters ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selected Tutor Info */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl mb-4">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Selected Tutor: <span className="font-normal">{selectedTutor.fullName}</span>
                    </p>
                    {selectedTutor.formattedAddress && (
                      <p className="text-sm text-gray-700 mt-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                        {selectedTutor.formattedAddress}
                      </p>
                    )}
                  </div>
                </div>

                {loadingCenters ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <p className="text-gray-600 text-lg">Loading suggested centers...</p>
                  </div>
                ) : suggestedCenters.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-6">
                      <AlertCircle className="w-10 h-10 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Centers Found</h3>
                    <p className="text-gray-600 mb-4 text-lg">
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
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] ${
                          selectedCenter?.centerId === center.centerId
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50 hover:shadow-sm'
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
                  <div className="mt-6 pt-6 border-t-2 border-gray-200">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mb-4">
                      <p className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        Ready to Assign
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                          <strong className="text-gray-900">Tutor:</strong> {selectedTutor.fullName}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong className="text-gray-900">Center:</strong> {selectedCenter.name}
                        </p>
                        {selectedCenter.formattedAddress && (
                          <p className="text-xs text-gray-600 mt-2 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {selectedCenter.formattedAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleAssignCenter}
                      disabled={assigning}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
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







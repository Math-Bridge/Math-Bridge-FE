import React, { useState, useEffect, useRef } from 'react';
import {
  Building,
  Building2,
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  X,
  MapPin,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllCenters, createCenter, updateCenter, deleteCenter, Center, CreateCenterRequest, UpdateCenterRequest } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { apiService } from '../../../services/api';

interface LocationPrediction {
  placeId: string;
  place_id?: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

const CenterManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [centers, setCenters] = useState<Center[]>([]);
  const [filteredCenters, setFilteredCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [formData, setFormData] = useState<CreateCenterRequest>({
    name: '',
    address: '',
    phone: ''
  });

  // Location autocomplete state
  const [locationInput, setLocationInput] = useState('');
  const [locationPredictions, setLocationPredictions] = useState<LocationPrediction[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCenters();
  }, []);

  useEffect(() => {
    filterCenters();
  }, [centers, searchTerm]);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const result = await getAllCenters();
      if (result.success && result.data) {
        const centersData = Array.isArray(result.data) ? result.data : result.data.data || [];
        setCenters(centersData);
      } else {
        setCenters([]);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
      showError('Failed to load centers');
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCenters = () => {
    let filtered = [...centers];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.address?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term)
      );
    }
    setFilteredCenters(filtered);
  };

  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PlaceId is required
    if (!selectedPlaceId) {
      showError('Please select a location from the suggestions');
      return;
    }
    
    // Validate name is required
    if (!formData.name.trim()) {
      showError('Center name is required');
      return;
    }
    
    try {
      // Backend only needs Name and PlaceId (PascalCase)
      const centerData: CreateCenterRequest = {
        Name: formData.name.trim(),
        PlaceId: selectedPlaceId,
      };
      
      const result = await createCenter(centerData);
      if (result.success) {
        showSuccess('Center created successfully');
        setShowCreateModal(false);
        setFormData({ name: '', address: '', phone: '' });
        setLocationInput('');
        setSelectedPlaceId('');
        setLocationPredictions([]);
        fetchCenters();
      } else {
        showError(result.error || 'Failed to create center');
      }
    } catch (error: any) {
      console.error('Error creating center:', error);
      showError(error?.message || 'Failed to create center');
    }
  };

  const handleUpdateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenter) return;
    
    // At least one field must be provided
    if (!formData.name.trim() && !selectedPlaceId) {
      showError('Please provide at least a name or location to update');
      return;
    }
    
    try {
      // Backend only needs Name and PlaceId (PascalCase, both optional)
      const updateData: UpdateCenterRequest = {};
      
      if (formData.name.trim()) {
        updateData.Name = formData.name.trim();
      }
      
      if (selectedPlaceId) {
        updateData.PlaceId = selectedPlaceId;
      }
      
      // Only send update if there's something to update
      if (!updateData.Name && !updateData.PlaceId) {
        showError('No changes to update');
        return;
      }
      
      const result = await updateCenter(selectedCenter.centerId, updateData);
      if (result.success) {
        showSuccess('Center updated successfully');
        setShowEditModal(false);
        setSelectedCenter(null);
        setFormData({ name: '', address: '', phone: '' });
        setLocationInput('');
        setSelectedPlaceId('');
        setLocationPredictions([]);
        fetchCenters();
      } else {
        showError(result.error || 'Failed to update center');
      }
    } catch (error: any) {
      console.error('Error updating center:', error);
      showError(error?.message || 'Failed to update center');
    }
  };

  const handleDeleteCenter = async () => {
    if (!selectedCenter) return;
    try {
      const result = await deleteCenter(selectedCenter.centerId);
      if (result.success) {
        showSuccess('Center deleted successfully');
        setShowDeleteModal(false);
        setSelectedCenter(null);
        fetchCenters();
      } else {
        showError(result.error || 'Failed to delete center');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to delete center');
    }
  };

  // Location autocomplete handler
  const handleLocationInputChange = async (value: string) => {
    setLocationInput(value);
    setSelectedPlaceId('');

    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }

    if (value.trim().length < 3) {
      setLocationPredictions([]);
      setShowLocationDropdown(false);
      return;
    }

    locationTimeoutRef.current = setTimeout(async () => {
      setIsLoadingLocation(true);
      try {
        const response = await apiService.getAddressAutocomplete(value, 'VN');
        if (response.success && response.data?.predictions) {
          const predictions = response.data.predictions.map((pred: {
            placeId?: string;
            place_id?: string;
            description?: string;
            mainText?: string;
            main_text?: string;
            secondaryText?: string;
            secondary_text?: string;
            structured_formatting?: {
              main_text?: string;
              secondary_text?: string;
            };
          }) => {
            const predictionObj: LocationPrediction = {
              placeId: pred.placeId || pred.place_id || '',
              description: pred.description || '',
              mainText: pred.mainText || pred.structured_formatting?.main_text || pred.main_text || '',
              secondaryText: pred.secondaryText || pred.structured_formatting?.secondary_text || pred.secondary_text || ''
            };
            return predictionObj;
          });
          setLocationPredictions(predictions);
          setShowLocationDropdown(true);
        }
      } catch (error) {
        console.error('Location autocomplete error:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    }, 500);
  };

  const handleLocationSelect = (prediction: LocationPrediction) => {
    const placeId = prediction.placeId || prediction.place_id || '';
    setLocationInput(prediction.description);
    setSelectedPlaceId(placeId);
    setFormData(prev => ({ ...prev, address: prediction.description }));
    setShowLocationDropdown(false);
    setLocationPredictions([]);
  };

  const openEditModal = (center: Center) => {
    setSelectedCenter(center);
    setFormData({
      name: center.name || '',
      address: center.address || '',
      phone: center.phone || ''
    });
    setLocationInput(center.address || '');
    setSelectedPlaceId('');
    setShowEditModal(true);
  };

  const openDeleteModal = (center: Center) => {
    setSelectedCenter(center);
    setShowDeleteModal(true);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Center Management</h1>
              <p className="text-gray-600 mt-2">Manage learning centers and locations</p>
            </div>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setLocationInput('');
                setSelectedPlaceId('');
                setLocationPredictions([]);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Center</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, address, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Centers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCenters.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No centers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCenters.map((center) => (
                    <tr key={center.centerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{center.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2 text-sm text-gray-600">
                          {center.address ? (
                            <>
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="flex-1">{center.address}</span>
                            </>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {center.phone ? (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{center.phone}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(center)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(center)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Center Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Center</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateCenter} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Center Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <div className="relative" ref={locationDropdownRef}>
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <input
                      type="text"
                      required
                      value={locationInput}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Start typing your address..."
                    />
                    
                    {/* Location Dropdown */}
                    {showLocationDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {isLoadingLocation ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm">Searching...</p>
                          </div>
                        ) : locationPredictions.length > 0 ? (
                          locationPredictions.map((prediction) => (
                            <button
                              key={prediction.placeId || prediction.place_id}
                              type="button"
                              onClick={() => handleLocationSelect(prediction)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-start">
                                <MapPin className="w-4 h-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                                <div>
                                  <p className="text-gray-900 font-medium">{prediction.mainText}</p>
                                  <p className="text-sm text-gray-500">{prediction.secondaryText}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No locations found. Try a different search.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Type at least 3 characters to search for your location
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setLocationInput('');
                    setSelectedPlaceId('');
                    setLocationPredictions([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Center
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Center Modal */}
      {showEditModal && selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Center</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCenter(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateCenter} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Center Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <div className="relative" ref={locationDropdownRef}>
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <input
                      type="text"
                      required
                      value={locationInput}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Start typing your address..."
                    />
                    
                    {/* Location Dropdown */}
                    {showLocationDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {isLoadingLocation ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm">Searching...</p>
                          </div>
                        ) : locationPredictions.length > 0 ? (
                          locationPredictions.map((prediction) => (
                            <button
                              key={prediction.placeId || prediction.place_id}
                              type="button"
                              onClick={() => handleLocationSelect(prediction)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-start">
                                <MapPin className="w-4 h-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                                <div>
                                  <p className="text-gray-900 font-medium">{prediction.mainText}</p>
                                  <p className="text-sm text-gray-500">{prediction.secondaryText}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No locations found. Try a different search.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Type at least 3 characters to search for your location
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCenter(null);
                    setLocationInput('');
                    setSelectedPlaceId('');
                    setLocationPredictions([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Center
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Center</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedCenter.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCenter(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCenter}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CenterManagement;


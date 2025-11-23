import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Phone,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [centers, searchTerm]);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isClickOnDropdown = target.closest('.dropdown-menu');
      const isClickOnActionButton = target.closest('button[title="Actions"]');
      
      if (!isClickOnDropdown && !isClickOnActionButton) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    const handleScroll = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    const updateDropdownPosition = () => {
      if (openDropdownId) {
        const button = actionButtonRefs.current[openDropdownId];
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          });
        }
      }
    };

    if (openDropdownId) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', updateDropdownPosition);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [openDropdownId]);

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
        // Map PascalCase to camelCase and handle FormattedAddress
        const mappedCenters = centersData.map((center: any) => ({
          centerId: center.centerId || center.CenterId || '',
          name: center.name || center.Name || '',
          address: center.address || center.Address || center.FormattedAddress || center.formattedAddress || '',
          phone: center.phone || center.Phone || center.PhoneNumber || center.phoneNumber || '',
          status: center.status || center.Status || 'active',
          // Keep PascalCase fields for compatibility
          FormattedAddress: center.FormattedAddress || center.formattedAddress || center.address || center.Address || '',
          City: center.City || center.city || '',
          District: center.District || center.district || '',
        }));
        setCenters(mappedCenters);
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
        c.address?.toLowerCase().includes(term)
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
              placeholder="Search by name, address..."
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCenters.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No centers found</p>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedCenters = filteredCenters.slice(startIndex, endIndex);
                    const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);

                    return (
                      <>
                        {paginatedCenters.map((center) => (
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
                          {(() => {
                            const address = center.address || (center as any).FormattedAddress || (center as any).formattedAddress || '';
                            if (address) {
                              return (
                                <>
                                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span className="flex-1">{address}</span>
                                </>
                              );
                            }
                            return <span className="text-gray-400">N/A</span>;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ position: 'relative', overflow: 'visible' }}>
                        <div className="relative flex items-center justify-end" style={{ position: 'relative', zIndex: 1 }}>
                          <button
                            ref={(el) => {
                              actionButtonRefs.current[center.centerId] = el;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openDropdownId === center.centerId) {
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              } else {
                                const button = actionButtonRefs.current[center.centerId];
                                if (button) {
                                  const rect = button.getBoundingClientRect();
                                  setDropdownPosition({
                                    top: rect.bottom + 8,
                                    right: window.innerWidth - rect.right
                                  });
                                }
                                setOpenDropdownId(center.centerId);
                              }
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdownId === center.centerId && dropdownPosition && createPortal(
                            <div 
                              className="dropdown-menu fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`
                              }}
                            >
                              <button
                                onClick={() => {
                                  openEditModal(center);
                                  setOpenDropdownId(null);
                                  setDropdownPosition(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  openDeleteModal(center);
                                  setOpenDropdownId(null);
                                  setDropdownPosition(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                        ))}
                        </>
                      );
                    })()
                  )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {filteredCenters.length > 0 && (() => {
            const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredCenters.length);
            
            return (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{endIndex}</span> of{' '}
                  <span className="font-medium">{filteredCenters.length}</span> results
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || 
                               page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => {
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
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
            );
          })()}
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


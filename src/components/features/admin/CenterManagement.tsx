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
  Users,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllCenters, createCenter, updateCenter, deleteCenter, Center, CreateCenterRequest, UpdateCenterRequest, getTutorsByCenter, removeTutorFromCenter, assignTutorToCenter } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { apiService } from '../../../services/api';

// Utility function to calculate distance using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

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
  const [showTutorManagementModal, setShowTutorManagementModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [tutorSearchTerm, setTutorSearchTerm] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTutorForReassign, setSelectedTutorForReassign] = useState<any | null>(null);
  const [availableCenters, setAvailableCenters] = useState<Center[]>([]);
  const [selectedReassignCenter, setSelectedReassignCenter] = useState<string>('');
  const [reassigning, setReassigning] = useState(false);
  const [showDeleteTutorModal, setShowDeleteTutorModal] = useState(false);
  const [selectedTutorForDelete, setSelectedTutorForDelete] = useState<any | null>(null);
  const [deletingTutor, setDeletingTutor] = useState(false);
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
          latitude: center.latitude ?? center.Latitude ?? undefined,
          longitude: center.longitude ?? center.Longitude ?? undefined,
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

  const openTutorManagementModal = async (center: Center) => {
    setSelectedCenter(center);
    setShowTutorManagementModal(true);
    await fetchTutorsForCenter(center.centerId);
  };

  const fetchTutorsForCenter = async (centerId: string) => {
    try {
      setLoadingTutors(true);
      const result = await getTutorsByCenter(centerId);
      if (result.success && result.data) {
        const tutorsData = Array.isArray(result.data) ? result.data : [];
        setTutors(tutorsData);
      } else {
        setTutors([]);
      }
    } catch (error) {
      console.error('Error fetching tutors:', error);
      showError('Failed to load tutors');
      setTutors([]);
    } finally {
      setLoadingTutors(false);
    }
  };

  const openDeleteTutorModal = (tutor: any) => {
    setSelectedTutorForDelete(tutor);
    setShowDeleteTutorModal(true);
  };

  const handleDeleteTutor = async () => {
    if (!selectedCenter || !selectedTutorForDelete) return;
    
    const tutorId = selectedTutorForDelete.tutorId || selectedTutorForDelete.TutorId || selectedTutorForDelete.userId || selectedTutorForDelete.UserId;
    if (!tutorId) {
      showError('Invalid tutor ID');
      setShowDeleteTutorModal(false);
      setSelectedTutorForDelete(null);
      return;
    }

    try {
      setDeletingTutor(true);
      const result = await removeTutorFromCenter(selectedCenter.centerId, tutorId);
      if (result.success) {
        showSuccess('Tutor removed from center successfully');
        setShowDeleteTutorModal(false);
        setSelectedTutorForDelete(null);
        await fetchTutorsForCenter(selectedCenter.centerId);
      } else {
        showError(result.error || 'Failed to remove tutor from center');
      }
    } catch (error: any) {
      console.error('Error removing tutor:', error);
      showError(error?.message || 'Failed to remove tutor from center');
    } finally {
      setDeletingTutor(false);
    }
  };

  const openReassignModal = async (tutor: any) => {
    setSelectedTutorForReassign(tutor);
    
    // Get tutor's location (latitude, longitude)
    let tutorLat: number | undefined;
    let tutorLon: number | undefined;
    
    // Get userId from various possible fields
    const tutorUserId = tutor.userId || tutor.UserId || tutor.tutorId || tutor.TutorId;
    
    // Try to get from tutor object first
    tutorLat = tutor.latitude ?? tutor.Latitude;
    tutorLon = tutor.longitude ?? tutor.Longitude;
    
    // Always try to fetch from API to ensure we have the latest location data
    if (tutorUserId) {
      try {
        const tutorResponse = await apiService.request<any>(`/Tutors/${tutorUserId}`, {
          method: 'GET',
        });
        if (tutorResponse.success && tutorResponse.data) {
          const tutorData = tutorResponse.data;
          tutorLat = tutorData.latitude ?? tutorData.Latitude ?? tutorLat;
          tutorLon = tutorData.longitude ?? tutorData.Longitude ?? tutorLon;
        }
      } catch (error) {
        console.error('Error fetching tutor location:', error);
      }
    }
    
    // Fetch all centers except the current one
    const allCenters = await getAllCenters();
    if (allCenters.success && allCenters.data) {
      const centersData = Array.isArray(allCenters.data) ? allCenters.data : allCenters.data.data || [];
      const filteredCenters = centersData.filter((c: Center) => c.centerId !== selectedCenter?.centerId);
      
      const MIN_DISTANCE_KM = 10;
      const MAX_DISTANCE_KM = 15;
      const hasTutorLocation = tutorLat !== undefined && tutorLon !== undefined;
      
      // Calculate distance for each center
      const centersWithDistance: Center[] = filteredCenters.map((center: any) => {
        const centerLat = center.latitude ?? center.Latitude;
        const centerLon = center.longitude ?? center.Longitude;
        
        let distanceKm: number | undefined;
        if (hasTutorLocation && centerLat !== undefined && centerLon !== undefined) {
          distanceKm = calculateDistance(tutorLat!, tutorLon!, centerLat, centerLon);
        }
        
        return {
          ...center,
          centerId: center.centerId || center.CenterId || '',
          name: center.name || center.Name || '',
          address: center.address || center.Address || center.FormattedAddress || center.formattedAddress || '',
          phone: center.phone || center.Phone || '',
          status: center.status || center.Status || 'active',
          latitude: centerLat,
          longitude: centerLon,
          distanceKm
        };
      });
      
      // Filter by distance range (10-15 km) only if tutor has location
      let finalCenters: Center[];
      if (hasTutorLocation) {
        finalCenters = centersWithDistance.filter((center: Center) => {
          // Only include centers with distance between 10-15 km
          return center.distanceKm !== undefined && 
                 center.distanceKm >= MIN_DISTANCE_KM && 
                 center.distanceKm <= MAX_DISTANCE_KM;
        });
        
        // Sort by distance
        finalCenters.sort((a, b) => {
          if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
          if (a.distanceKm === undefined) return 1;
          if (b.distanceKm === undefined) return -1;
          return a.distanceKm - b.distanceKm;
        });
        
        if (finalCenters.length === 0) {
          showError(`No centers found within ${MIN_DISTANCE_KM}-${MAX_DISTANCE_KM} km of tutor's location.`);
        }
      } else {
        // If tutor doesn't have location, show all centers but with warning
        finalCenters = centersWithDistance;
        showError('Tutor location is not available. Showing all centers (distance filtering disabled).');
      }
      
      setAvailableCenters(finalCenters);
    }
    setShowReassignModal(true);
  };

  const handleReassignTutor = async () => {
    if (!selectedCenter || !selectedTutorForReassign || !selectedReassignCenter) return;

    const tutorId = selectedTutorForReassign.tutorId || selectedTutorForReassign.TutorId || selectedTutorForReassign.userId || selectedTutorForReassign.UserId;
    if (!tutorId) {
      showError('Invalid tutor ID');
      return;
    }

    try {
      setReassigning(true);
      
      // First, get all centers that tutor is currently assigned to
      let tutorCenters: any[] = [];
      try {
        const tutorResponse = await apiService.request<any>(`/Tutors/${tutorId}`, {
          method: 'GET',
        });
        if (tutorResponse.success && tutorResponse.data) {
          tutorCenters = tutorResponse.data.tutorCenters || tutorResponse.data.TutorCenters || [];
        }
      } catch (error) {
        console.error('Error fetching tutor centers:', error);
        // Continue anyway, will try to remove from current center
      }
      
      // Remove tutor from ALL existing centers (thay thế hoàn toàn)
      const removePromises: Promise<any>[] = [];
      
      // If we have tutor centers data, remove from all of them
      if (tutorCenters.length > 0) {
        for (const tutorCenter of tutorCenters) {
          const centerId = tutorCenter.centerId || tutorCenter.CenterId || tutorCenter.center?.centerId || tutorCenter.Center?.CenterId;
          if (centerId) {
            removePromises.push(removeTutorFromCenter(centerId, tutorId));
          }
        }
      } else {
        // Fallback: at least remove from current center
        removePromises.push(removeTutorFromCenter(selectedCenter.centerId, tutorId));
      }
      
      // Wait for all removals to complete
      const removeResults = await Promise.allSettled(removePromises);
      const failedRemovals = removeResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
      
      if (failedRemovals.length > 0 && failedRemovals.length === removePromises.length) {
        // All removals failed
        const firstError = failedRemovals[0];
        const errorMsg = firstError.status === 'rejected' 
          ? firstError.reason?.message || 'Failed to remove tutor from centers'
          : (firstError as PromiseFulfilledResult<any>).value.error || 'Failed to remove tutor from centers';
        showError(errorMsg);
        return;
      }
      
      // If some removals failed but at least one succeeded, continue with assignment
      if (failedRemovals.length > 0) {
        console.warn('Some center removals failed, but continuing with reassignment');
      }

      // Then assign to new center (thay thế)
      const assignResult = await assignTutorToCenter(selectedReassignCenter, tutorId);
      if (assignResult.success) {
        const newCenter = availableCenters.find(c => c.centerId === selectedReassignCenter);
        showSuccess(`Tutor reassigned to ${newCenter?.name || 'new center'} successfully (replaced all previous center assignments)`);
        setShowReassignModal(false);
        setSelectedTutorForReassign(null);
        setSelectedReassignCenter('');
        await fetchTutorsForCenter(selectedCenter.centerId);
      } else {
        showError(assignResult.error || 'Failed to assign tutor to new center');
      }
    } catch (error: any) {
      console.error('Error reassigning tutor:', error);
      showError(error?.message || 'Failed to reassign tutor');
    } finally {
      setReassigning(false);
    }
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Center Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
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
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{center.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
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
                                  openTutorManagementModal(center);
                                  setOpenDropdownId(null);
                                  setDropdownPosition(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Users className="w-4 h-4" />
                                <span>Manage Tutors</span>
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
                    {(() => {
                      // Chỉ hiển thị 5 số trang
                      const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
                      const endPage = Math.min(startPage + 4, totalPages);
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      return pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ));
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

      {/* Tutor Management Modal */}
      {showTutorManagementModal && selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Manage Tutors</h2>
                  <p className="text-gray-600 mt-1">Center: {selectedCenter.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowTutorManagementModal(false);
                    setSelectedCenter(null);
                    setTutors([]);
                    setTutorSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {/* Search Bar */}
              {tutors.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by tutor name..."
                      value={tutorSearchTerm}
                      onChange={(e) => setTutorSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
              {loadingTutors ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (() => {
                // Filter tutors based on search term
                const filteredTutors = tutorSearchTerm
                  ? tutors.filter((tutor) => {
                      const tutorName = (tutor.fullName || tutor.FullName || '').toLowerCase();
                      return tutorName.includes(tutorSearchTerm.toLowerCase());
                    })
                  : tutors;

                if (filteredTutors.length === 0 && tutors.length > 0) {
                  return (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No tutors found matching "{tutorSearchTerm}"</p>
                    </div>
                  );
                }

                if (filteredTutors.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No tutors assigned to this center</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filteredTutors.map((tutor) => (
                    <div
                      key={tutor.tutorId || tutor.userId}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {tutor.fullName || tutor.FullName || 'N/A'}
                              </h3>
                              <div className="mt-1 space-y-1 text-sm text-gray-600">
                                {tutor.email || tutor.Email ? (
                                  <p className="flex items-center space-x-2">
                                    <span>Email: {tutor.email || tutor.Email}</span>
                                  </p>
                                ) : null}
                                {tutor.phoneNumber || tutor.PhoneNumber ? (
                                  <p className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{tutor.phoneNumber || tutor.PhoneNumber}</span>
                                  </p>
                                ) : null}
                                {tutor.hourlyRate !== undefined && tutor.hourlyRate > 0 ? (
                                  <p>Hourly Rate: {tutor.hourlyRate || tutor.HourlyRate}</p>
                                ) : null}
                                {tutor.verificationStatus ? (
                                  <p>
                                    Status:{' '}
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs ${
                                        tutor.verificationStatus === 'approved'
                                          ? 'bg-green-100 text-green-800'
                                          : tutor.verificationStatus === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {tutor.verificationStatus}
                                    </span>
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => openReassignModal(tutor)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                            title="Reassign to another center"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Reassign</span>
                          </button>
                          <button
                            onClick={() => openDeleteTutorModal(tutor)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 text-sm"
                            title="Remove from center"
                          >
                            <UserMinus className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Reassign Tutor Modal */}
      {showReassignModal && selectedTutorForReassign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Reassign Tutor</h2>
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedTutorForReassign(null);
                    setSelectedReassignCenter('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Tutor: <strong>{selectedTutorForReassign.fullName || selectedTutorForReassign.FullName}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Current Center: <strong>{selectedCenter?.name}</strong>
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Center *
                </label>
                <select
                  value={selectedReassignCenter}
                  onChange={(e) => setSelectedReassignCenter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a center --</option>
                  {availableCenters.map((center) => (
                    <option key={center.centerId} value={center.centerId}>
                      {center.name}
                      {center.distanceKm !== undefined ? ` (${center.distanceKm.toFixed(2)} km)` : ''}
                    </option>
                  ))}
                </select>
                {availableCenters.length > 0 && availableCenters.some(c => c.distanceKm !== undefined) && (
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Only showing centers within 10-15 km, sorted by distance
                  </p>
                )}
                {availableCenters.length > 0 && availableCenters.every(c => c.distanceKm === undefined) && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Tutor location unavailable - showing all centers (distance filtering disabled)
                  </p>
                )}
                {availableCenters.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    No centers found within 10-15 km of tutor's location
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedTutorForReassign(null);
                    setSelectedReassignCenter('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={reassigning}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassignTutor}
                  disabled={!selectedReassignCenter || reassigning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reassigning ? 'Reassigning...' : 'Reassign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tutor Confirmation Modal */}
      {showDeleteTutorModal && selectedTutorForDelete && selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Remove Tutor</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <strong>{selectedTutorForDelete.fullName || selectedTutorForDelete.FullName || 'this tutor'}</strong> from <strong>{selectedCenter.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteTutorModal(false);
                    setSelectedTutorForDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={deletingTutor}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTutor}
                  disabled={deletingTutor}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingTutor ? 'Removing...' : 'Remove'}
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


import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Package, 
  CreditCard,
  Plus,
  CheckCircle,
  AlertCircle,
  MapPin,
  Users,
  Clock,
  Calendar,
  Wallet,
  QrCode,
  Copy,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getChildrenByParent, createContract, apiService, getSchoolById, createContractDirectPayment, SePayPaymentResponse, getContractById, getCentersNearAddress, updateChild, Center, getCoordinatesFromPlaceId, checkTutorsAvailability } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import { Child } from '../../../services/api';

interface Package {
  packageId: string;
  packageName: string;
  description?: string;
  price: number;
  sessionCount: number;
  durationDays: number;
  grade: string;
}

type Step = 'select-child' | 'select-package' | 'schedule' | 'payment';

// Available time slots (1.5 hours each)
const TIME_SLOTS = [
  { id: 'slot1', from: '16:00', to: '17:30', label: '16:00 - 17:30' },
  { id: 'slot2', from: '17:30', to: '19:00', label: '17:30 - 19:00' },
  { id: 'slot3', from: '19:00', to: '20:30', label: '19:00 - 20:30' },
  { id: 'slot4', from: '20:30', to: '22:00', label: '20:30 - 22:00' },
] as const;

const normalizeWalletBalance = (walletData: any): number => {
  if (!walletData) {
    return 0;
  }

  const candidateKeys = ['balance', 'Balance', 'walletBalance', 'WalletBalance'];

  for (const key of candidateKeys) {
    if (Object.prototype.hasOwnProperty.call(walletData, key)) {
      const rawValue = walletData[key];

      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
        return rawValue;
      }

      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();

        // Try removing common currency formatting characters
        const cleaned = trimmed.replace(/\s/g, '').replace(/[,₫]/g, '');
        const parsedCleaned = Number(cleaned);
        if (!Number.isNaN(parsedCleaned)) {
          return parsedCleaned;
        }

        // Fallback: keep only digits and minus sign
        const digitsOnly = trimmed.replace(/[^0-9-]/g, '');
        const parsedDigitsOnly = Number(digitsOnly);
        if (!Number.isNaN(parsedDigitsOnly)) {
          return parsedDigitsOnly;
        }
      }
    }
  }

  if (walletData.data && walletData.data !== walletData) {
    const nestedBalance = normalizeWalletBalance(walletData.data);
    if (nestedBalance) {
      return nestedBalance;
    }
  }

  return 0;
};

const CreateContract: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('select-child');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<Child[]>([]); // Multiple children selection
  const [numberOfChildren, setNumberOfChildren] = useState<number>(1); // Number of children (1 or 2 - backend only supports max 2)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [schedule, setSchedule] = useState<{
    daysOfWeeks: number;
    startTime: string;
    endTime: string;
    isOnline: boolean;
    startDate?: string; // Start date selected by user
    videoCallPlatform?: string;
    offlineAddress?: string;
    offlineLatitude?: number;
    offlineLongitude?: number;
    maxDistanceKm?: number;
    useSameTimeForAllDays?: boolean; // Whether to use same time for all days
    dayTimeSlots?: Record<number, { startTime: string; endTime: string }>; // Time slots for each day (bitmask -> time)
  }>({
    daysOfWeeks: 42, // Backend: Mon(2) + Wed(8) + Fri(32) = 42
    startTime: '19:00', // Default to slot 3: 19:00 - 20:30
    endTime: '20:30',
    isOnline: true,
    startDate: new Date().toISOString().split('T')[0], // Default to today
    useSameTimeForAllDays: true, // Default to same time for all days
    dayTimeSlots: {} // Store time slots for each day
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'direct_payment'>('wallet');
  const [paymentResponse, setPaymentResponse] = useState<SePayPaymentResponse | null>(null);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string>('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false); // Track when payment is confirmed (status changed to pending)
  const MAX_POLLING_ATTEMPTS = 120; // 10 minutes (120 * 5 seconds)
  const [nearbyCenters, setNearbyCenters] = useState<Center[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [userProfileAddress, setUserProfileAddress] = useState<string>('');
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    place_id: string;
    description: string;
    structured_formatting?: {
      main_text: string;
      secondary_text: string;
    };
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const lastSearchedAddressRef = useRef<string>('');

  useEffect(() => {
    fetchData();
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Auto-search centers when address and coordinates are available
  // This ensures centers are found when coordinates are set from any source
  useEffect(() => {
    const searchCentersIfReady = async () => {
      // Only search if offline mode, address exists, coordinates are available, and we haven't searched for this address yet
      if (!schedule.isOnline && 
          schedule.offlineAddress && 
          schedule.offlineAddress.trim().length >= 5 &&
          schedule.offlineLatitude !== undefined && 
          schedule.offlineLongitude !== undefined &&
          !loadingCenters &&
          lastSearchedAddressRef.current !== schedule.offlineAddress) {
        
        lastSearchedAddressRef.current = schedule.offlineAddress;
        setLoadingCenters(true);
        try {
          const result = await getCentersNearAddress(schedule.offlineAddress, 10);
          if (result.success && result.data) {
            let centersData: Center[] = [];
            const data = result.data as any;
            
            if (Array.isArray(data)) {
              centersData = data;
            } else if (data.data && Array.isArray(data.data)) {
              centersData = data.data;
            } else if (data.centers && Array.isArray(data.centers)) {
              centersData = data.centers;
            } else if (data.items && Array.isArray(data.items)) {
              centersData = data.items;
            }
            
            setNearbyCenters(centersData);
          } else {
            setNearbyCenters([]);
          }
        } catch (error) {
          console.error('Error fetching nearby centers:', error);
          setNearbyCenters([]);
        } finally {
          setLoadingCenters(false);
        }
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      searchCentersIfReady();
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule.offlineAddress, schedule.offlineLatitude, schedule.offlineLongitude, schedule.isOnline]);

  // Clear availability warning when schedule changes
  useEffect(() => {
    setAvailabilityWarning(null);
  }, [schedule.daysOfWeeks, schedule.startTime, schedule.endTime, schedule.isOnline, schedule.dayTimeSlots, schedule.startDate]);

  // Fetch user profile to get address
  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const response = await apiService.getUserById(user.id);
      if (response.success && response.data) {
        const userData = response.data;
        // Get formatted address from user profile
        const address = userData.FormattedAddress || userData.formattedAddress || userData.address || '';
        if (address) {
          setUserProfileAddress(address);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Helper function to geocode an address (get coordinates from address string)
  const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    if (!address || address.trim().length < 3) {
      return null;
    }

    try {
      // First, try to get autocomplete suggestions to find a placeId
      const autocompleteResult = await apiService.getAddressAutocomplete(address, 'VN');
      
      if (import.meta.env.DEV) {
        console.log('Autocomplete result:', autocompleteResult);
      }
      
      // Handle different response structures
      // Backend may return: { success: true, data: { success: true, predictions: [...] } }
      // Or: { success: true, data: { predictions: [...] } }
      // Or: { success: true, data: [...] } (direct array)
      let predictions: any[] = [];
      
      if (autocompleteResult.success && autocompleteResult.data) {
        const data = autocompleteResult.data as any;
        
        // Try multiple possible structures
        if (Array.isArray(data)) {
          predictions = data;
        } else if (data.predictions && Array.isArray(data.predictions)) {
          predictions = data.predictions;
        } else if (data.data && Array.isArray(data.data)) {
          // Check if data.data is predictions array or has predictions
          if (data.data[0] && data.data[0].place_id) {
            predictions = data.data;
          } else if (data.data.predictions && Array.isArray(data.data.predictions)) {
            predictions = data.data.predictions;
          }
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('Extracted predictions:', predictions.length, predictions);
      }
      
      if (predictions.length > 0) {
        if (import.meta.env.DEV) {
          console.log('Found predictions:', predictions.length);
        }
        
        // Try each prediction until we get valid coordinates
        for (const prediction of predictions) {
          // Handle different prediction structures
          const placeId = prediction.place_id || prediction.placeId || prediction.placeID;
        
          if (placeId) {
            if (import.meta.env.DEV) {
              console.log('Trying placeId:', placeId, 'for address:', prediction.description || prediction.formatted_address || address);
            }
            
            try {
              const coordinatesResult = await getCoordinatesFromPlaceId(placeId);
              
              if (import.meta.env.DEV) {
                console.log('Coordinates result:', coordinatesResult);
              }
              
              // Handle different response structures for coordinates
              let coordData: any = null;
              
              if (coordinatesResult.success) {
                // Try direct data access
                if (coordinatesResult.data) {
                  const data = coordinatesResult.data as any;
                  
                  // Check if data has coordinates directly
                  if (data.latitude !== undefined || data.Latitude !== undefined) {
                    coordData = data;
                  } else if (data.data && (data.data.latitude !== undefined || data.data.Latitude !== undefined)) {
                    coordData = data.data;
                  } else if (typeof data === 'object') {
                    // Try to find coordinates in the object
                    coordData = data;
                  }
                }
              }
              
              if (coordData) {
                // Try multiple possible field names
                const latitude = coordData.latitude || coordData.Latitude || coordData.lat || coordData.Lat;
                const longitude = coordData.longitude || coordData.Longitude || coordData.lng || coordData.Lng || coordData.lon;
                
                const coords = {
                  latitude: typeof latitude === 'string' ? parseFloat(latitude) : latitude,
                  longitude: typeof longitude === 'string' ? parseFloat(longitude) : longitude
                };
                
                // Validate coordinates are valid numbers
                if (coords.latitude !== undefined && coords.longitude !== undefined &&
                    typeof coords.latitude === 'number' && typeof coords.longitude === 'number' &&
                    !isNaN(coords.latitude) && !isNaN(coords.longitude) &&
                    coords.latitude >= -90 && coords.latitude <= 90 &&
                    coords.longitude >= -180 && coords.longitude <= 180) {
                  
                  if (import.meta.env.DEV) {
                    console.log('Successfully geocoded address:', address, 'to:', coords);
                  }
                  
                  return coords;
                } else {
                  if (import.meta.env.DEV) {
                    console.warn('Invalid coordinates extracted:', coords, 'from data:', coordData);
                  }
                }
              } else {
                if (import.meta.env.DEV) {
                  console.warn('No coordinate data found in response:', coordinatesResult);
                }
              }
            } catch (coordError) {
              if (import.meta.env.DEV) {
                console.warn('Failed to get coordinates for placeId:', placeId, coordError);
              }
              // Continue to next prediction
              continue;
            }
          } else {
            if (import.meta.env.DEV) {
              console.warn('Prediction missing place_id:', prediction);
            }
          }
        }
        
        // If we get here, none of the predictions worked
        console.warn('No valid coordinates found for any prediction. Address:', address);
      } else {
        console.warn('No autocomplete predictions found for address:', address);
        if (import.meta.env.DEV) {
          console.warn('Autocomplete result:', autocompleteResult);
          console.warn('Response data structure:', {
            hasData: !!autocompleteResult.data,
            dataType: typeof autocompleteResult.data,
            isArray: Array.isArray(autocompleteResult.data),
            dataKeys: autocompleteResult.data && typeof autocompleteResult.data === 'object' ? Object.keys(autocompleteResult.data) : [],
            nestedData: (autocompleteResult.data as any)?.data ? Object.keys((autocompleteResult.data as any).data) : []
          });
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      if (import.meta.env.DEV) {
        console.error('Address that failed:', address);
        console.error('Error details:', error);
      }
    }
    
    return null;
  };

  // Poll contract status when direct payment is active
  useEffect(() => {
    if (createdContractId && isPolling && paymentResponse) {
      let attemptCount = 0;
      const interval = setInterval(async () => {
        try {
          attemptCount += 1;
          setPollingAttempts(attemptCount);
          
          // Stop polling after max attempts
          if (attemptCount >= MAX_POLLING_ATTEMPTS) {
            clearInterval(interval);
            setIsPolling(false);
            setPaymentStatusMessage('Payment checking timeout. Please check your contract status manually or contact support if payment was completed.');
            if (import.meta.env.DEV) {
              console.warn('Polling stopped after max attempts');
            }
            return;
          }

          const contractResult = await getContractById(createdContractId);
          if (contractResult.success && contractResult.data) {
            const contract = contractResult.data;
            const contractStatus = contract.status?.toLowerCase() || '';
            
            // Check if contract status changed to 'active' or 'pending' (payment may be processed)
            // Note: Backend sets status to 'Pending' after payment webhook, then staff may activate it
            if (contractStatus === 'active') {
              clearInterval(interval);
              setIsPolling(false);
              setPollingAttempts(0);
              setPaymentStatusMessage('');
              setPaymentConfirmed(false);
              showSuccess('Payment successful! Contract has been activated.');
              // Navigate to contract detail after 2 seconds
              setTimeout(() => {
                navigate(`/contracts/${createdContractId}`);
              }, 2000);
            } else if (contractStatus === 'pending' && attemptCount > 2) {
              // After a few polling attempts, if status is 'pending', payment might be processed
              // Backend webhook sets status to "Pending" (capital P) after payment, but frontend receives lowercase
              // Contract is waiting for staff activation after payment confirmation
              
              // If payment was just confirmed (status changed from unpaid to pending), show thank you popup
              if (!paymentConfirmed) {
                setPaymentConfirmed(true);
                showSuccess('Thank you! Your payment has been confirmed. The contract is pending staff activation.');
                
                // Reduce polling frequency after payment confirmed (check every 30 seconds instead of 5 seconds)
                // Since payment is confirmed, we just need to wait for staff activation
                // We'll continue polling but less frequently
              }
              
              setPaymentStatusMessage('Payment confirmed! Contract is pending staff activation. You can close this window and check back later.');
              
              // Optionally stop polling after payment is confirmed (since we're just waiting for staff now)
              // Or continue polling but less frequently - for now we'll continue polling to detect when contract becomes active
            } else if (contractStatus === 'unpaid') {
              // Contract is in "unpaid" status - waiting for payment
              // This happens after createContractDirectPayment is called (backend sets status to "unpaid")
              setPaymentStatusMessage('Waiting for payment confirmation... Please complete the payment using the QR code.');
            } else if (contractStatus === 'cancelled') {
              clearInterval(interval);
              setIsPolling(false);
              setPaymentStatusMessage('Contract was cancelled. Please contact support.');
              setPaymentConfirmed(false);
              showError('Contract was cancelled. Please contact support.');
            }
          } else {
            console.error('Failed to fetch contract:', contractResult.error);
            // Don't stop polling on transient errors, but log them
            if (attemptCount % 12 === 0) { // Every minute, show a warning
              setPaymentStatusMessage('Having trouble checking payment status. Please check manually if payment was completed.');
            }
          }
        } catch (error) {
          console.error('Error checking contract status:', error);
          // Don't stop polling on errors, but track them
          if (attemptCount % 12 === 0) {
            setPaymentStatusMessage('Error checking payment status. Please check manually.');
          }
        }
      }, 5000); // Check every 5 seconds

      return () => {
        clearInterval(interval);
      };
    } else {
      // Reset polling attempts when polling stops
      if (!isPolling) {
        setPollingAttempts(0);
        setPaymentStatusMessage('');
      }
    }
  }, [createdContractId, isPolling, paymentResponse, navigate, showSuccess, showError]);

  // Refresh wallet balance when returning from top-up page
  useEffect(() => {
    const refreshWallet = async () => {
      if (user?.id && !walletLoading) {
        try {
          const walletResult = await apiService.getUserWallet(user.id);
          if (walletResult.success && walletResult.data) {
            // Backend may return balance in different casings or formats
            setWalletBalance(normalizeWalletBalance(walletResult.data));
          }
        } catch (err) {
          console.error('Error refreshing wallet balance:', err);
        }
      }
    };

    // Refresh wallet when component becomes visible (user returns from top-up)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshWallet();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshWallet);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshWallet);
    };
  }, [user?.id, walletLoading]);

  const fetchData = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch children
      const childrenResult = await getChildrenByParent(user.id);
      if (childrenResult.success && childrenResult.data) {
        const childrenData = Array.isArray(childrenResult.data) ? childrenResult.data : [];
        
        // Map children and fetch school names if missing
        const mappedChildren = await Promise.all(
          childrenData
            .filter((child: any) => {
              const status = child.Status || child.status || 'active';
              return status !== 'deleted';
            })
            .map(async (child: any) => {
              // Remove reschedule_count if present
              const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanChild } = child;
              
              let schoolName = cleanChild.SchoolName || cleanChild.schoolName || cleanChild.School?.SchoolName || cleanChild.school?.SchoolName || '';
              
              // If schoolName is empty but we have schoolId, try to fetch school name from API
              if (!schoolName || schoolName.trim() === '') {
                const schoolId = cleanChild.SchoolId || cleanChild.schoolId;
                if (schoolId) {
                  try {
                    const schoolResponse = await getSchoolById(schoolId);
                    if (schoolResponse.success && schoolResponse.data) {
                      // Backend returns SchoolDto with PascalCase: SchoolName
                      const schoolData = schoolResponse.data as any;
                      schoolName = schoolData.SchoolName || schoolData.schoolName || '';
                    }
                  } catch (error) {
                    if (import.meta.env.DEV) {
                      console.error('Failed to fetch school name for schoolId:', schoolId, error);
                    }
                  }
                }
              }
              
              return {
                childId: cleanChild.ChildId || cleanChild.childId || '',
                fullName: cleanChild.FullName || cleanChild.fullName || '',
                schoolId: cleanChild.SchoolId || cleanChild.schoolId || '',
                schoolName: schoolName,
                centerId: cleanChild.CenterId || cleanChild.centerId || undefined,
                centerName: cleanChild.CenterName || cleanChild.centerName || cleanChild.center?.Name || undefined,
                grade: cleanChild.Grade || cleanChild.grade || '',
                dateOfBirth: cleanChild.DateOfBirth || cleanChild.dateOfBirth || undefined,
                status: cleanChild.Status || cleanChild.status || 'active'
              };
            })
        );
        
        setChildren(mappedChildren);
      }

      // Fetch packages
      const packagesResult = await apiService.getAllPackages();
      
      if (packagesResult.success && packagesResult.data) {
        // Handle different response formats: direct array, or wrapped in data property
        let packagesData: any = packagesResult.data;
        
        // If data is an array, use it directly
        // If data is an object with a data/items/packages property, extract it
        if (!Array.isArray(packagesData)) {
          const dataObj = packagesData as any;
          packagesData = dataObj.data || dataObj.items || dataObj.packages || [];
        }
        
        const mappedPackages = packagesData.map((pkg: any) => ({
          packageId: pkg.PackageId || pkg.packageId || pkg.id || '',
          packageName: pkg.PackageName || pkg.packageName || pkg.name || '',
          description: pkg.Description || pkg.description || '',
          price: pkg.Price || pkg.price || 0,
          sessionCount: pkg.SessionCount || pkg.sessionCount || pkg.totalSessions || 0,
          durationDays: pkg.DurationDays || pkg.durationDays || pkg.duration || 0,
          grade: pkg.Grade || pkg.grade || ''
        }));
        
        setPackages(mappedPackages);
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch packages:', packagesResult.error || 'Unknown error');
        }
        setError(packagesResult.error || 'Failed to load packages');
      }

      // Fetch wallet balance
      if (user?.id) {
        setWalletLoading(true);
        try {
          const walletResult = await apiService.getUserWallet(user.id);
          if (walletResult.success && walletResult.data) {
            // Backend may return balance in different casings or formats
            setWalletBalance(normalizeWalletBalance(walletResult.data));
          }
        } catch (err) {
          console.error('Error fetching wallet balance:', err);
        } finally {
          setWalletLoading(false);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate price based on number of children, offline mode, and payment method
  const calculatePrice = (basePrice: number, numberOfChildren: number, isOffline: boolean = false, isDirectPayment: boolean = false): number => {
    let price = basePrice;
    
    // Increase 60% for 2 children
    if (numberOfChildren === 2) {
      price = basePrice * 1.6;
    }
    
    // Add 2% for offline mode
    if (isOffline) {
      price = price * 1.02;
    }
    
    // Add 2% for direct payment
    if (isDirectPayment) {
      price = price * 1.02;
    }
    
    return price;
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    setSelectedChildren([child]);
    // Ensure numberOfChildren is 1 when using single selection mode
    if (numberOfChildren !== 1) {
      setNumberOfChildren(1);
    }
    setCurrentStep('select-package');
  };

  const handleToggleChild = (child: Child) => {
    const isSelected = selectedChildren.some(c => c.childId === child.childId);
    
    if (isSelected) {
      // Deselect child
      const updated = selectedChildren.filter(c => c.childId !== child.childId);
      setSelectedChildren(updated);
      
      // Update selectedChild to first child in the list, or null if empty
      if (updated.length > 0) {
        setSelectedChild(updated[0]); // Keep first child as primary
      } else {
        setSelectedChild(null);
      }
      // Note: numberOfChildren should NOT change here - it's set by user's choice
    } else {
      // Select child - check if we can select more
      if (selectedChildren.length >= numberOfChildren) {
        showError(`You can only select ${numberOfChildren} ${numberOfChildren === 1 ? 'child' : 'children'}`);
        return;
      }
      
      // Check max limit of 2 children (backend only supports max 2)
      if (selectedChildren.length >= 2) {
        showError('You can only select up to 2 children per contract');
        return;
      }
      
      // Validate that we're not selecting the same child twice
      if (selectedChildren.some(c => c.childId === child.childId)) {
        showError('This child is already selected. Please select a different child.');
        return;
      }
      
      // Validate group study requirements: same grade and same school
      if (selectedChildren.length > 0 && numberOfChildren === 2) {
        const firstChild = selectedChildren[0];
        
        // Check if same grade
        if (firstChild.grade !== child.grade) {
          showError(`Group study requires students to be in the same grade. Selected student: ${firstChild.grade}, this student: ${child.grade}`);
          return;
        }
        
        // Check if same school
        if (firstChild.schoolId !== child.schoolId) {
          const firstSchoolName = firstChild.schoolName || 'selected school';
          const currentSchoolName = child.schoolName || 'this school';
          showError(`Group study requires students to be from the same school. Selected student: ${firstSchoolName}, this student: ${currentSchoolName}`);
          return;
        }
      }
      
      const updated = [...selectedChildren, child];
      setSelectedChildren(updated);
      
      // Update selectedChild to first child in the list
      if (updated.length > 0) {
        setSelectedChild(updated[0]); // Keep first child as primary
      }
      // Note: numberOfChildren should NOT change here - it's set by user's choice
    }
  };

  const handleNumberOfChildrenChange = (count: number) => {
    // Backend only supports max 2 children per contract
    if (count < 1 || count > 2) return;
    
    if (count === 1) {
      // If only 1 child, use selectedChild or first from selectedChildren
      let newSelectedChildren: Child[] = [];
      let newSelectedChild: Child | null = null;
      
      if (selectedChild) {
        newSelectedChildren = [selectedChild];
        newSelectedChild = selectedChild;
      } else if (selectedChildren.length > 0) {
        newSelectedChildren = [selectedChildren[0]];
        newSelectedChild = selectedChildren[0];
      }
      
      setNumberOfChildren(1);
      setSelectedChildren(newSelectedChildren);
      setSelectedChild(newSelectedChild);
    } else if (count === 2) {
      // If 2 children, keep existing selections (up to 2)
      let newSelectedChildren: Child[] = [];
      
      if (selectedChildren.length > 0) {
        // Keep existing selections, but limit to 2
        newSelectedChildren = selectedChildren.slice(0, 2);
        
        // Validate group study requirements if 2 children are selected
        if (newSelectedChildren.length === 2) {
          const firstChild = newSelectedChildren[0];
          const secondChild = newSelectedChildren[1];
          
          // Check if same grade
          if (firstChild.grade !== secondChild.grade) {
            showError(`Group study requires students to be in the same grade. ${firstChild.fullName}: ${firstChild.grade}, ${secondChild.fullName}: ${secondChild.grade}`);
            return;
          }
          
          // Check if same school
          if (firstChild.schoolId !== secondChild.schoolId) {
            const firstSchoolName = firstChild.schoolName || 'selected school';
            const secondSchoolName = secondChild.schoolName || 'this school';
            showError(`Group study requires students to be from the same school. ${firstChild.fullName}: ${firstSchoolName}, ${secondChild.fullName}: ${secondSchoolName}`);
            return;
          }
        }
      } else if (selectedChild) {
        // If no selectedChildren but has selectedChild, use it
        newSelectedChildren = [selectedChild];
      }
      
      setNumberOfChildren(2);
      setSelectedChildren(newSelectedChildren);
      if (newSelectedChildren.length > 0) {
        setSelectedChild(newSelectedChildren[0]); // Keep first child as primary
      }
    }
  };

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    // Default to online, user can choose offline later
    setSchedule(prev => ({
      ...prev,
      isOnline: true
    }));
    // Don't auto-navigate to schedule, wait for Continue button
  };

  const handleContinueFromPackage = () => {
    if (!selectedPackage) {
      const msg = 'Please select a package';
      setError(msg);
      showError(msg);
      return;
    }
    setCurrentStep('schedule');
  };

  const handleCreateChild = () => {
    // Navigate to create child page, then return to contract creation
      navigate('/my-children?action=create&returnTo=contract');
  };

  const handleContinueToPayment = async () => {
    // Validate start date
    if (!schedule.startDate) {
      const msg = 'Please select a start date';
      setError(msg);
      showError(msg);
      return;
    }
    
    // Validate that start date is not in the past
    const selectedDate = new Date(schedule.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      const msg = 'Cannot select a start date in the past';
      setError(msg);
      showError(msg);
      return;
    }
    
    // If selecting today, validate that the time slot is not in the past
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      
      if (schedule.useSameTimeForAllDays) {
        // Validate main time slot
        if (schedule.startTime) {
          const [hours, minutes] = schedule.startTime.split(':').map(Number);
          const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          
          if (slotDateTime <= now) {
            const msg = 'Cannot select a time slot in the past for today';
            setError(msg);
            showError(msg);
            return;
          }
        }
      } else {
        // Validate first day's time slot
        const selectedDays = [
          { label: 'Sunday', value: 1 },
          { label: 'Monday', value: 2 },
          { label: 'Tuesday', value: 4 },
          { label: 'Wednesday', value: 8 },
          { label: 'Thursday', value: 16 },
          { label: 'Friday', value: 32 },
          { label: 'Saturday', value: 64 }
        ].filter(day => (schedule.daysOfWeeks & day.value) !== 0);
        
        if (selectedDays.length > 0 && schedule.dayTimeSlots?.[selectedDays[0].value]) {
          const firstDaySlot = schedule.dayTimeSlots[selectedDays[0].value];
          if (firstDaySlot.startTime) {
            const [hours, minutes] = firstDaySlot.startTime.split(':').map(Number);
            const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            
            if (slotDateTime <= now) {
              const msg = `Cannot select a time slot in the past for today (${selectedDays[0].label})`;
              setError(msg);
              showError(msg);
              return;
            }
          }
        }
      }
    }
    
    // Validate days of week - exactly 3 days must be selected
    const selectedDaysCount = [
      (schedule.daysOfWeeks & 1) !== 0,
      (schedule.daysOfWeeks & 2) !== 0,
      (schedule.daysOfWeeks & 4) !== 0,
      (schedule.daysOfWeeks & 8) !== 0,
      (schedule.daysOfWeeks & 16) !== 0,
      (schedule.daysOfWeeks & 32) !== 0,
      (schedule.daysOfWeeks & 64) !== 0
    ].filter(Boolean).length;
    
    if (selectedDaysCount !== 3) {
      const msg = selectedDaysCount < 3 
        ? `Please select exactly 3 days. Currently selected: ${selectedDaysCount} day${selectedDaysCount !== 1 ? 's' : ''}`
        : `Please select exactly 3 days. Currently selected: ${selectedDaysCount} days`;
      setError(msg);
      showError(msg);
      return;
    }
    
    // Validate time slot is selected
    if (schedule.useSameTimeForAllDays) {
      // Same time for all days - validate main time slot
      if (!schedule.startTime || !schedule.endTime) {
        const msg = 'Please select a time slot';
        setError(msg);
        showError(msg);
        return;
      }
      
      // Validate that selected time slot is one of the available slots (1.5 hours duration)
      const isValidSlot = TIME_SLOTS.some(
        slot => slot.from === schedule.startTime && slot.to === schedule.endTime
      );
      
      if (!isValidSlot) {
        const msg = 'Please select a valid time slot';
        setError(msg);
        showError(msg);
        return;
      }
    } else {
      // Different time per day - validate all selected days have time slots
      const selectedDays = [
        { label: 'Sunday', value: 1 },
        { label: 'Monday', value: 2 },
        { label: 'Tuesday', value: 4 },
        { label: 'Wednesday', value: 8 },
        { label: 'Thursday', value: 16 },
        { label: 'Friday', value: 32 },
        { label: 'Saturday', value: 64 }
      ].filter(day => (schedule.daysOfWeeks & day.value) !== 0);
      
      const missingDays = selectedDays.filter(day => {
        const daySlot = schedule.dayTimeSlots?.[day.value];
        return !daySlot || !daySlot.startTime || !daySlot.endTime;
      });
      
      if (missingDays.length > 0) {
        const msg = `Please select time slots for: ${missingDays.map(d => d.label).join(', ')}`;
        setError(msg);
        showError(msg);
        return;
      }
      
      // Validate all time slots are valid
      for (const day of selectedDays) {
        const daySlot = schedule.dayTimeSlots?.[day.value];
        if (daySlot) {
          const isValidSlot = TIME_SLOTS.some(
            slot => slot.from === daySlot.startTime && slot.to === daySlot.endTime
          );
          
          if (!isValidSlot) {
            const msg = `Invalid time slot for ${day.label}`;
            setError(msg);
            showError(msg);
            return;
          }
        }
      }
    }
    
    // Validate offline location if offline is selected
    if (!schedule.isOnline) {
      if (!schedule.offlineAddress || schedule.offlineAddress.trim() === '') {
        const msg = 'Please enter a location for offline sessions';
        setError(msg);
        showError(msg);
        return;
      }
      
      // Validate coordinates exist (will be geocoded if missing during submit)
      // But at least check that address is valid length
      if (schedule.offlineAddress.trim().length < 5) {
        const msg = 'Please enter a valid address (at least 5 characters)';
        setError(msg);
        showError(msg);
        return;
      }
    }
    
    // Validate that there are centers available for the offline location
    if (!schedule.isOnline && schedule.offlineAddress && nearbyCenters.length === 0 && !loadingCenters) {
      const msg = 'No centers found within 10km radius from this address. Please enter a different location or choose online mode.';
      setError(msg);
      showError(msg);
      return;
    }
    
    // Validate video call platform if online is selected
    if (schedule.isOnline && !schedule.videoCallPlatform) {
      const msg = 'Please select a video call platform (Google Meet or Zoom)';
      setError(msg);
      showError(msg);
      return;
    }
    
    // Check tutor availability before proceeding to payment
    setCheckingAvailability(true);
    setError(null);
    setAvailabilityWarning(null);
    
    try {
      // Build schedules array for availability check
      const schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = [];
      
      if (schedule.useSameTimeForAllDays) {
        // Same time for all days
        const dayMapping: { bitmask: number; dayOfWeek: number }[] = [
          { bitmask: 1, dayOfWeek: 0 }, // Sunday
          { bitmask: 2, dayOfWeek: 1 }, // Monday
          { bitmask: 4, dayOfWeek: 2 }, // Tuesday
          { bitmask: 8, dayOfWeek: 3 }, // Wednesday
          { bitmask: 16, dayOfWeek: 4 }, // Thursday
          { bitmask: 32, dayOfWeek: 5 }, // Friday
          { bitmask: 64, dayOfWeek: 6 }  // Saturday
        ];
        
        for (const map of dayMapping) {
          if ((schedule.daysOfWeeks & map.bitmask) !== 0) {
            schedules.push({
              dayOfWeek: map.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            });
          }
        }
      } else {
        // Different time per day
        const dayMapping: { bitmask: number; dayOfWeek: number }[] = [
          { bitmask: 1, dayOfWeek: 0 }, // Sunday
          { bitmask: 2, dayOfWeek: 1 }, // Monday
          { bitmask: 4, dayOfWeek: 2 }, // Tuesday
          { bitmask: 8, dayOfWeek: 3 }, // Wednesday
          { bitmask: 16, dayOfWeek: 4 }, // Thursday
          { bitmask: 32, dayOfWeek: 5 }, // Friday
          { bitmask: 64, dayOfWeek: 6 }  // Saturday
        ];
        
        for (const map of dayMapping) {
          if ((schedule.daysOfWeeks & map.bitmask) !== 0 && schedule.dayTimeSlots?.[map.bitmask]) {
            const daySlot = schedule.dayTimeSlots[map.bitmask];
            schedules.push({
              dayOfWeek: map.dayOfWeek,
              startTime: daySlot.startTime,
              endTime: daySlot.endTime
            });
          }
        }
      }
      
      // Calculate end date
      const startDateStr = schedule.startDate || new Date().toISOString().split('T')[0];
      const startDate = new Date(startDateStr);
      const endDate = new Date(startDateStr);
      endDate.setDate(endDate.getDate() + (selectedPackage.durationDays || 90));
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      // Prepare availability check request
      const availabilityRequest: any = {
        packageId: selectedPackage.packageId,
        childId: selectedChild.childId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        schedules: schedules,
        isOnline: schedule.isOnline
      };
      
      // Add secondChildId if multiple children selected
      if (numberOfChildren === 2 && selectedChildren.length >= 2) {
        availabilityRequest.secondChildId = selectedChildren[1].childId;
      }
      
      // Add offline location info if offline
      if (!schedule.isOnline) {
        if (schedule.offlineAddress) {
          availabilityRequest.offlineAddress = schedule.offlineAddress;
        }
        if (schedule.offlineLatitude !== undefined) {
          availabilityRequest.offlineLatitude = schedule.offlineLatitude;
        }
        if (schedule.offlineLongitude !== undefined) {
          availabilityRequest.offlineLongitude = schedule.offlineLongitude;
        }
        // Set maxDistanceKm: use provided value or default to 15 km
        availabilityRequest.maxDistanceKm = schedule.maxDistanceKm ?? 15;
      }
      
      // Check availability
      if (import.meta.env.DEV) {
        console.log('[CreateContract] Checking tutor availability with request:', availabilityRequest);
      }
      const availabilityResult = await checkTutorsAvailability(availabilityRequest);
      
      if (import.meta.env.DEV) {
        console.log('[CreateContract] Availability result:', availabilityResult);
      }
      
      if (availabilityResult.success && availabilityResult.data) {
        // Handle both camelCase and PascalCase from backend
        const responseData = availabilityResult.data as any;
        const totalAvailable = responseData.totalAvailable ?? responseData.TotalAvailable ?? 0;
        
        if (totalAvailable === 0) {
          // No tutors available - show warning and prevent proceeding
          const warningMsg = 'No tutors are currently available for the selected schedule. Please try a different time slot or contact support.';
          setAvailabilityWarning(warningMsg);
          setError(warningMsg);
          showError(warningMsg);
          setCheckingAvailability(false);
          return;
        } else if (!schedule.isOnline && totalAvailable < 3) {
          // For offline contracts, require at least 3 tutors available
          const warningMsg = `Only ${totalAvailable} tutor(s) available for offline sessions. At least 3 tutors are required for offline contracts. Please try a different time slot, location, or choose online mode.`;
          setAvailabilityWarning(warningMsg);
          setError(warningMsg);
          showError(warningMsg);
          setCheckingAvailability(false);
          return;
        } else {
          // Tutors available - show info but allow proceeding
          const infoMsg = `Found ${totalAvailable} tutor(s) available for your schedule.`;
          setAvailabilityWarning(null);
          // Don't show as error, just proceed
        }
      } else {
        // API error - show warning but allow proceeding (backend might have issues)
        const warningMsg = availabilityResult.message || 'Could not verify tutor availability. You can still proceed, but staff will need to assign a tutor.';
        setAvailabilityWarning(warningMsg);
        // Don't block, just warn
      }
      
      // Proceed to payment step
      setError(null);
      setCurrentStep('payment');
    } catch (err) {
      // Error checking availability - show warning but allow proceeding
      const errorMsg = err instanceof Error ? err.message : 'Error checking tutor availability';
      const warningMsg = `${errorMsg}. You can still proceed, but staff will need to assign a tutor.`;
      setAvailabilityWarning(warningMsg);
      // Don't block, just warn
      setError(null);
      setCurrentStep('payment');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedChild || !selectedPackage || !user?.id) {
      setError('Please select child and package');
      return;
    }

    // Calculate final price based on number of children, offline mode, and payment method
    const finalPrice = calculatePrice(selectedPackage.price, numberOfChildren, !schedule.isOnline, paymentMethod === 'direct_payment');

    // Check wallet balance only if payment method is wallet
    if (paymentMethod === 'wallet' && walletBalance < finalPrice) {
      const insufficientAmount = finalPrice - walletBalance;
      const errorMsg = `Insufficient wallet balance. You need ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(insufficientAmount)} more. Please top up your wallet first or choose bank transfer.`;
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Use selected start date or default to today
      const startDateStr = schedule.startDate || new Date().toISOString().split('T')[0];
      const startDate = new Date(startDateStr);
      
      // Validate that start date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(startDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        const errorMsg = 'Cannot create contract with a start date in the past';
        setError(errorMsg);
        showError(errorMsg);
        setIsCreating(false);
        return;
      }
      
      // If selecting today, validate that the time slot is not in the past
      if (selectedDate.getTime() === today.getTime()) {
        const now = new Date();
        
        if (schedule.useSameTimeForAllDays) {
          // Validate main time slot
          if (schedule.startTime) {
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        if (slotDateTime <= now) {
          const errorMsg = 'Cannot create contract with a time slot in the past for today';
          setError(errorMsg);
          showError(errorMsg);
          setIsCreating(false);
          return;
            }
          }
        } else {
          // Validate first day's time slot (will be used for backend)
          const selectedDays = [
            { label: 'Sunday', value: 1 },
            { label: 'Monday', value: 2 },
            { label: 'Tuesday', value: 4 },
            { label: 'Wednesday', value: 8 },
            { label: 'Thursday', value: 16 },
            { label: 'Friday', value: 32 },
            { label: 'Saturday', value: 64 }
          ].filter(day => (schedule.daysOfWeeks & day.value) !== 0);
          
          if (selectedDays.length > 0 && schedule.dayTimeSlots?.[selectedDays[0].value]) {
            const firstDaySlot = schedule.dayTimeSlots[selectedDays[0].value];
            if (firstDaySlot.startTime) {
              const [hours, minutes] = firstDaySlot.startTime.split(':').map(Number);
              const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
              
              if (slotDateTime <= now) {
                const errorMsg = `Cannot create contract with a time slot in the past for today (${selectedDays[0].label})`;
                setError(errorMsg);
                showError(errorMsg);
                setIsCreating(false);
                return;
              }
            }
          }
        }
      }
      
      // Calculate end date based on package duration_days
      const endDate = new Date(startDateStr);
      endDate.setDate(endDate.getDate() + (selectedPackage.durationDays || 90));

      // Format dates as YYYY-MM-DD
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      // Build schedules array for backend
      // Backend DayOfWeek enum: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      // Frontend bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
      const schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = [];
      
      if (schedule.useSameTimeForAllDays) {
        // Same time for all days - convert bitmask to schedules array
        const dayMapping: { bitmask: number; dayOfWeek: number }[] = [
          { bitmask: 1, dayOfWeek: 0 }, // Sunday
          { bitmask: 2, dayOfWeek: 1 }, // Monday
          { bitmask: 4, dayOfWeek: 2 }, // Tuesday
          { bitmask: 8, dayOfWeek: 3 }, // Wednesday
          { bitmask: 16, dayOfWeek: 4 }, // Thursday
          { bitmask: 32, dayOfWeek: 5 }, // Friday
          { bitmask: 64, dayOfWeek: 6 }  // Saturday
        ];
        
        for (const map of dayMapping) {
          if ((schedule.daysOfWeeks & map.bitmask) !== 0) {
            schedules.push({
              dayOfWeek: map.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            });
          }
        }
      } else {
        // Different time per day - use dayTimeSlots
        const dayMapping: { bitmask: number; dayOfWeek: number }[] = [
          { bitmask: 1, dayOfWeek: 0 }, // Sunday
          { bitmask: 2, dayOfWeek: 1 }, // Monday
          { bitmask: 4, dayOfWeek: 2 }, // Tuesday
          { bitmask: 8, dayOfWeek: 3 }, // Wednesday
          { bitmask: 16, dayOfWeek: 4 }, // Thursday
          { bitmask: 32, dayOfWeek: 5 }, // Friday
          { bitmask: 64, dayOfWeek: 6 }  // Saturday
        ];
        
        for (const map of dayMapping) {
          if ((schedule.daysOfWeeks & map.bitmask) !== 0 && schedule.dayTimeSlots?.[map.bitmask]) {
            const daySlot = schedule.dayTimeSlots[map.bitmask];
            schedules.push({
              dayOfWeek: map.dayOfWeek,
              startTime: daySlot.startTime,
              endTime: daySlot.endTime
            });
          }
        }
      }

      // Create contract request
      // Note: paymentMethod is used in frontend to determine payment flow after contract creation
      // Backend doesn't store paymentMethod, but uses it to determine status handling:
      // - wallet: contract created with "pending", then wallet is deducted
      // - direct_payment: contract created with "pending", then SePayService updates to "unpaid" when creating payment
      const contractData: any = {
        parentId: user.id,
        childId: selectedChild.childId,
        packageId: selectedPackage.packageId,
        mainTutorId: null, // Staff will assign tutor later
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        schedules: schedules, // New: Send schedules array instead of daysOfWeeks/startTime/endTime
        isOnline: schedule.isOnline,
        paymentMethod: paymentMethod // Used in frontend to determine payment flow
      };
      
      // Add secondChildId if multiple children selected (max 2 children supported)
      if (numberOfChildren === 2 && selectedChildren.length >= 2) {
        const firstChild = selectedChildren[0];
        const secondChild = selectedChildren[1];
        
        // Validate that children are different
        if (firstChild.childId === secondChild.childId) {
          const errorMsg = 'Cannot select the same child twice. Please select 2 different children.';
          setError(errorMsg);
          showError(errorMsg);
          setIsCreating(false);
          return;
        }
        
        // Validate group study requirements: same grade and same school
        if (firstChild.grade !== secondChild.grade) {
          const errorMsg = `Group study requires students to be in the same grade. ${firstChild.fullName}: ${firstChild.grade}, ${secondChild.fullName}: ${secondChild.grade}`;
          setError(errorMsg);
          showError(errorMsg);
          setIsCreating(false);
          return;
        }
        
        if (firstChild.schoolId !== secondChild.schoolId) {
          const firstSchoolName = firstChild.schoolName || 'selected school';
          const secondSchoolName = secondChild.schoolName || 'this school';
          const errorMsg = `Group study requires students to be from the same school. ${firstChild.fullName}: ${firstSchoolName}, ${secondChild.fullName}: ${secondSchoolName}`;
          setError(errorMsg);
          showError(errorMsg);
          setIsCreating(false);
          return;
        }
        
        contractData.secondChildId = selectedChildren[1].childId;
      }

      // Optional fields - use selected center or child's center
      const centerIdToUse = selectedCenterId || selectedChild.centerId;
      if (centerIdToUse) {
        contractData.centerId = centerIdToUse;
      }

      // Online-specific fields
      if (schedule.isOnline && schedule.videoCallPlatform) {
        contractData.videoCallPlatform = schedule.videoCallPlatform;
      }

      // For offline contracts, verify tutor availability again before creating
      if (!schedule.isOnline) {
        try {
          // Build schedules array for availability check
          const availabilitySchedules: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = [];
          
          if (schedule.useSameTimeForAllDays) {
            const dayMapping: { bitmask: number; dayOfWeek: number }[] = [
              { bitmask: 1, dayOfWeek: 0 }, { bitmask: 2, dayOfWeek: 1 },
              { bitmask: 4, dayOfWeek: 2 }, { bitmask: 8, dayOfWeek: 3 },
              { bitmask: 16, dayOfWeek: 4 }, { bitmask: 32, dayOfWeek: 5 },
              { bitmask: 64, dayOfWeek: 6 }
            ];
            
            for (const map of dayMapping) {
              if ((schedule.daysOfWeeks & map.bitmask) !== 0) {
                availabilitySchedules.push({
                  dayOfWeek: map.dayOfWeek,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime
                });
              }
            }
          } else {
            const dayMapping: { bitmask: number; dayOfWeek: number }[] = [
              { bitmask: 1, dayOfWeek: 0 }, { bitmask: 2, dayOfWeek: 1 },
              { bitmask: 4, dayOfWeek: 2 }, { bitmask: 8, dayOfWeek: 3 },
              { bitmask: 16, dayOfWeek: 4 }, { bitmask: 32, dayOfWeek: 5 },
              { bitmask: 64, dayOfWeek: 6 }
            ];
            
            for (const map of dayMapping) {
              if ((schedule.daysOfWeeks & map.bitmask) !== 0 && schedule.dayTimeSlots?.[map.bitmask]) {
                const daySlot = schedule.dayTimeSlots[map.bitmask];
                availabilitySchedules.push({
                  dayOfWeek: map.dayOfWeek,
                  startTime: daySlot.startTime,
                  endTime: daySlot.endTime
                });
              }
            }
          }
          
          const availabilityRequest: any = {
            packageId: selectedPackage.packageId,
            childId: selectedChild.childId,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            schedules: availabilitySchedules,
            isOnline: false
          };
          
          if (numberOfChildren === 2 && selectedChildren.length >= 2) {
            availabilityRequest.secondChildId = selectedChildren[1].childId;
          }
          
          if (schedule.offlineAddress) {
            availabilityRequest.offlineAddress = schedule.offlineAddress;
          }
          if (schedule.offlineLatitude !== undefined) {
            availabilityRequest.offlineLatitude = schedule.offlineLatitude;
          }
          if (schedule.offlineLongitude !== undefined) {
            availabilityRequest.offlineLongitude = schedule.offlineLongitude;
          }
          // Set maxDistanceKm: use provided value or default to 15 km
          availabilityRequest.maxDistanceKm = schedule.maxDistanceKm ?? 15;
          
          if (import.meta.env.DEV) {
            console.log('[CreateContract] Final availability check before contract creation:', availabilityRequest);
          }
          const availabilityResult = await checkTutorsAvailability(availabilityRequest);
          
          if (import.meta.env.DEV) {
            console.log('[CreateContract] Final availability result:', availabilityResult);
          }
          
          if (availabilityResult.success && availabilityResult.data) {
            // Handle both camelCase and PascalCase from backend
            const responseData = availabilityResult.data as any;
            const totalAvailable = responseData.totalAvailable ?? responseData.TotalAvailable ?? 0;
            
            if (totalAvailable < 3) {
              const errorMsg = `Cannot create offline contract: Only ${totalAvailable} tutor(s) available. At least 3 tutors are required for offline contracts. Please try a different time slot, location, or choose online mode.`;
              setError(errorMsg);
              showError(errorMsg);
              setIsCreating(false);
              return;
            }
          } else {
            // If availability check fails, still allow but warn
            console.warn('Availability check failed before contract creation:', availabilityResult);
          }
        } catch (availabilityError) {
          // If availability check throws error, still allow but warn
          console.error('Error checking availability before contract creation:', availabilityError);
          showError('Warning: Could not verify tutor availability. Contract will be created but staff will need to assign a tutor.');
        }
      }

      // Offline-specific fields
      if (!schedule.isOnline) {
        if (schedule.maxDistanceKm !== undefined) {
          contractData.maxDistanceKm = schedule.maxDistanceKm;
        }
        // If maxDistanceKm not set, it will default to 10 in api.ts
        
        // First, use existing coordinates from state if available
        if (schedule.offlineLatitude !== undefined && schedule.offlineLongitude !== undefined) {
          contractData.offlineLatitude = schedule.offlineLatitude;
          contractData.offlineLongitude = schedule.offlineLongitude;
          if (import.meta.env.DEV) {
            console.log('Using existing coordinates from state:', { 
              latitude: schedule.offlineLatitude, 
              longitude: schedule.offlineLongitude 
            });
          }
        }
        
        if (schedule.offlineAddress) {
          contractData.offlineAddress = schedule.offlineAddress;
          
          // If coordinates are still missing, try to geocode the address
          if ((contractData.offlineLatitude === undefined || contractData.offlineLongitude === undefined) && 
              schedule.offlineAddress.trim().length >= 3) {
            try {
              const coordinates = await geocodeAddress(schedule.offlineAddress);
              if (coordinates) {
                contractData.offlineLatitude = coordinates.latitude;
                contractData.offlineLongitude = coordinates.longitude;
                // Also update state for consistency
                setSchedule(prev => ({
                  ...prev,
                  offlineLatitude: coordinates.latitude,
                  offlineLongitude: coordinates.longitude
                }));
                if (import.meta.env.DEV) {
                  console.log('Geocoded address before submit:', { address: schedule.offlineAddress, coordinates });
                }
              } else {
                // Geocoding failed - log details for debugging
                console.warn('Geocoding failed for address:', schedule.offlineAddress);
                console.warn('Attempting autocomplete again with different approach...');
                
                // Try one more time with a more specific search
                try {
                  // Try searching with "Vietnam" suffix if not already present
                  let searchAddress = schedule.offlineAddress;
                  if (!searchAddress.toLowerCase().includes('vietnam') && !searchAddress.toLowerCase().includes('việt nam')) {
                    searchAddress = `${schedule.offlineAddress}, Vietnam`;
                  }
                  
                  const retryCoordinates = await geocodeAddress(searchAddress);
                  if (retryCoordinates) {
                    contractData.offlineLatitude = retryCoordinates.latitude;
                    contractData.offlineLongitude = retryCoordinates.longitude;
                    setSchedule(prev => ({
                      ...prev,
                      offlineLatitude: retryCoordinates.latitude,
                      offlineLongitude: retryCoordinates.longitude
                    }));
                    if (import.meta.env.DEV) {
                      console.log('Geocoded address on retry:', { address: searchAddress, coordinates: retryCoordinates });
                    }
                  } else {
                    // Still failed after retry - require coordinates for offline contracts
                    const errorMsg = `Could not find coordinates for address: ${schedule.offlineAddress}. Please try selecting the address from the suggestions dropdown, or enter a more specific address.`;
                    setError(errorMsg);
                    showError(errorMsg);
                    setIsCreating(false);
                    return;
                  }
                } catch (retryError) {
                  console.error('Error retrying geocoding:', retryError);
                  const errorMsg = `Failed to find coordinates for address: ${schedule.offlineAddress}. Please try selecting the address from the suggestions dropdown.`;
                  setError(errorMsg);
                  showError(errorMsg);
                  setIsCreating(false);
                  return;
                }
              }
            } catch (error) {
              console.error('Error geocoding address before submit:', error);
              // Geocoding error - require coordinates for offline contracts
              const errorMsg = `Failed to validate address: ${schedule.offlineAddress}. Please try selecting the address from the suggestions dropdown.`;
              setError(errorMsg);
              showError(errorMsg);
              setIsCreating(false);
              return;
            }
          }
        }
        
        // Final validation: ensure offline contracts have coordinates
        if (contractData.offlineLatitude === undefined || contractData.offlineLongitude === undefined) {
          const errorMsg = 'Offline contracts require valid address coordinates. Please enter a valid address or try again.';
          setError(errorMsg);
          showError(errorMsg);
          setIsCreating(false);
          return;
        }
        
        // Log final coordinates for debugging
        if (import.meta.env.DEV) {
          console.log('Final contract data coordinates:', {
            latitude: contractData.offlineLatitude,
            longitude: contractData.offlineLongitude,
            address: contractData.offlineAddress
          });
        }
      }
      // For online: maxDistanceKm defaults to 0 in api.ts
      
      // Validate schedules array before submitting
      if (!schedules || schedules.length === 0) {
        const errorMsg = 'No schedules selected. Please select at least one day with time slot.';
        setError(errorMsg);
        showError(errorMsg);
        setIsCreating(false);
        return;
      }
      
      // Check for duplicate days
      const daySet = new Set(schedules.map(s => s.dayOfWeek));
      if (daySet.size !== schedules.length) {
        const errorMsg = 'Duplicate day of week is not allowed. Please select different days.';
        setError(errorMsg);
        showError(errorMsg);
        setIsCreating(false);
        return;
      }

      const result = await createContract(contractData);

      if (result.success) {
        // Extract contractId from response
        const contractId = result.data?.contractId;

        // If payment method is wallet, deduct the wallet balance
        if (paymentMethod === 'wallet' && contractId && selectedPackage) {
          try {
            // Calculate final price based on number of children, offline mode, and payment method
            const finalPrice = calculatePrice(selectedPackage.price, numberOfChildren, !schedule.isOnline, paymentMethod === 'direct_payment');
            const deductResult = await apiService.deductWallet(contractId, finalPrice);

            if (deductResult.success && deductResult.data) {
              showSuccess(`Contract created successfully! ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deductResult.data.amountDeducted)} deducted from your wallet. New balance: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deductResult.data.newWalletBalance)}`);

              // Update wallet balance in state
              setWalletBalance(deductResult.data.newWalletBalance);
              
              // Navigate to contract detail
              navigate(`/contracts/${contractId || ''}`);
            } else {
              // Contract created but wallet deduction failed
              showError(`Contract created but wallet deduction failed: ${deductResult.error || 'Unknown error'}. Please contact support.`);
              if (import.meta.env.DEV) {
                console.error('Wallet deduction failed:', deductResult.error);
              }
            }
          } catch (deductError) {
            if (import.meta.env.DEV) {
              console.error('Error deducting wallet:', deductError);
            }
            showError('Contract created but wallet deduction failed. Please contact support.');
          }
        } else if (paymentMethod === 'direct_payment' && contractId) {
          // Create direct payment with QR code
          try {
            setCreatedContractId(contractId);
            const paymentResult = await createContractDirectPayment(contractId);
            
            if (paymentResult.success && paymentResult.data) {
              // Backend returns response with camelCase properties (Success -> success, QrCodeUrl -> qrCodeUrl, etc.)
              // due to JsonNamingPolicy.CamelCase configuration, but handle both cases for safety
              const paymentData = paymentResult.data as any;
              
              // Check if QR code URL exists (handle both camelCase and PascalCase)
              const qrCodeUrl = paymentData.qrCodeUrl || paymentData.QrCodeUrl;
              
              if (qrCodeUrl) {
                // Map response to match frontend interface (ensure camelCase)
                const mappedPaymentResponse: SePayPaymentResponse = {
                  success: paymentData.success ?? paymentData.Success ?? true,
                  message: paymentData.message || paymentData.Message || 'Payment request created successfully',
                  qrCodeUrl: qrCodeUrl,
                  orderReference: paymentData.orderReference || paymentData.OrderReference || '',
                  walletTransactionId: paymentData.walletTransactionId || paymentData.WalletTransactionId,
                  amount: paymentData.amount || paymentData.Amount || calculatePrice(selectedPackage.price, numberOfChildren, !schedule.isOnline, true),
                  bankInfo: paymentData.bankInfo || paymentData.BankInfo || '',
                  transferContent: paymentData.transferContent || paymentData.TransferContent || paymentData.orderReference || paymentData.OrderReference || ''
                };
                
                setPaymentResponse(mappedPaymentResponse);
                setIsPolling(true);
                setPollingAttempts(0);
                setPaymentStatusMessage('Waiting for payment confirmation...');
                showSuccess('Contract created! Please scan QR code to complete payment.');
              } else {
                if (import.meta.env.DEV) {
                  console.error('QR code URL is missing from response:', paymentResult.data);
                }
                showError('Failed to generate QR code URL. Please contact support.');
                navigate(`/contracts/${contractId || ''}`);
              }
            } else {
              if (import.meta.env.DEV) {
                console.error('Payment creation failed:', paymentResult.error);
              }
              const errorMessage = paymentResult.error || paymentResult.message || 'Failed to create payment QR code. Please contact support.';
              showError(errorMessage);
              // Navigate to contract detail anyway - contract was created, just payment setup failed
              navigate(`/contracts/${contractId || ''}`);
            }
          } catch (paymentError) {
            if (import.meta.env.DEV) {
              console.error('Error creating direct payment:', paymentError);
            }
            showError('Contract created but failed to generate payment QR code. Please contact support.');
            // Navigate to contract detail anyway
            navigate(`/contracts/${contractId || ''}`);
          }
        } else {
          // Navigate to contract detail
          navigate(`/contracts/${contractId || ''}`);
        }
      } else {
        // Check for specific backend errors
        const errorMsg = result.error || 'Failed to create contract';
        if (errorMsg.includes('Invalid main tutor') || errorMsg.includes('Invalid main tutor')) {
          const msg = 'Cannot create contract: Tutor assignment is required. Please contact support or wait for staff to assign a tutor.';
          setError(msg);
          showError(msg);
        } else {
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create contract';
      console.error('Error creating contract:', err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'select-package') {
      setCurrentStep('select-child');
      setSelectedPackage(null);
    } else if (currentStep === 'schedule') {
      setCurrentStep('select-package');
    } else if (currentStep === 'payment') {
      setCurrentStep('schedule');
    } else {
      navigate('/contracts');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/contracts')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Contracts</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Contract</h1>
          <p className="text-gray-600 mt-2">Follow the steps to create a new tutoring contract</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {/* Step 1: Select Child */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                currentStep === 'select-child' ? 'bg-primary text-white' : 
                ['select-package', 'schedule', 'payment'].includes(currentStep) ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {['select-package', 'schedule', 'payment'].includes(currentStep) ? (
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <span className="font-semibold text-xs sm:text-base">1</span>
                )}
              </div>
              <span className={`font-medium text-xs sm:text-sm md:text-base hidden sm:inline ${currentStep === 'select-child' ? 'text-primary' : 'text-gray-600'}`}>
                Select Child
              </span>
            </div>
            
            <div className={`flex-1 h-1 mx-1 sm:mx-2 min-w-[20px] ${
              ['select-package', 'schedule', 'payment'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>

            {/* Step 2: Select Package */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                currentStep === 'select-package' ? 'bg-primary text-white' : 
                ['schedule', 'payment'].includes(currentStep) ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {['schedule', 'payment'].includes(currentStep) ? (
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <span className="font-semibold text-xs sm:text-base">2</span>
                )}
              </div>
              <span className={`font-medium text-xs sm:text-sm md:text-base hidden sm:inline ${currentStep === 'select-package' ? 'text-primary' : 'text-gray-600'}`}>
                Select Package
              </span>
            </div>

            <div className={`flex-1 h-1 mx-1 sm:mx-2 min-w-[20px] ${
              ['schedule', 'payment'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>

            {/* Step 3: Schedule */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                currentStep === 'schedule' ? 'bg-primary text-white' : 
                currentStep === 'payment' ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {currentStep === 'payment' ? (
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <span className="font-semibold text-xs sm:text-base">3</span>
                )}
              </div>
              <span className={`font-medium text-xs sm:text-sm md:text-base hidden sm:inline ${currentStep === 'schedule' ? 'text-primary' : 'text-gray-600'}`}>
                Schedule
              </span>
            </div>

            <div className={`flex-1 h-1 mx-1 sm:mx-2 min-w-[20px] ${
              currentStep === 'payment' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>

            {/* Step 4: Payment */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                currentStep === 'payment' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <span className="font-semibold text-xs sm:text-base">4</span>
              </div>
              <span className={`font-medium text-xs sm:text-sm md:text-base hidden sm:inline ${currentStep === 'payment' ? 'text-primary' : 'text-gray-600'}`}>
                Payment
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Select Child */}
        {currentStep === 'select-child' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <User className="w-6 h-6" />
              <span>Step 1: Select Number of Children</span>
            </h2>

            {children.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Children Found</h3>
                <p className="text-gray-600 mb-6">
                  You need to add a child before creating a contract.
                </p>
                <button
                  onClick={handleCreateChild}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Child</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Number of Children Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Number of Children <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleNumberOfChildrenChange(count)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          numberOfChildren === count
                            ? 'border-primary bg-primary/10 text-primary-dark font-semibold shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:bg-primary/5'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-1">{count}</div>
                          <div className="text-xs text-gray-600">
                            {count === 1 ? 'Child' : 'Children'}
                          </div>
                          {count > 1 && (
                            <div className="text-xs mt-1 text-primary font-medium">
                              +60% price
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Select how many children will participate in this contract
                  </p>
                </div>

                {/* Children Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {numberOfChildren === 1 ? 'Select Child' : `Select ${numberOfChildren} Children`} <span className="text-red-500">*</span>
                  </label>
                  {numberOfChildren === 2 && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Group study requires students to be in the <strong>same grade</strong> and from the <strong>same school</strong>.
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {children.map((child) => {
                      const isSelected = selectedChildren.some(c => c.childId === child.childId);
                      const canSelect = numberOfChildren === 1 || 
                                       (numberOfChildren === 2 && selectedChildren.length < 2);
                      
                      return (
                  <div
                    key={child.childId}
                          onClick={() => {
                            if (numberOfChildren === 1) {
                              handleSelectChild(child);
                            } else {
                              handleToggleChild(child);
                            }
                          }}
                          className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-md'
                              : canSelect
                              ? 'border-gray-200 hover:border-primary hover:shadow-md'
                              : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          }`}
                  >
                    <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              {numberOfChildren > 1 && (
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-300 bg-white'
                                }`}>
                                  {isSelected && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  )}
                                </div>
                              )}
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                              <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{child.fullName}</h3>
                          <p className="text-sm text-gray-600">
                            {child.schoolName || 'No school'} • {child.grade}
                          </p>
                          {child.centerName && (
                            <p className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{child.centerName}</span>
                            </p>
                          )}
                        </div>
                      </div>
                            {numberOfChildren === 1 && (
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                            )}
                    </div>
                  </div>
                      );
                    })}
                  </div>
                  {numberOfChildren > 1 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: {selectedChildren.length} / {numberOfChildren} children
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/contracts')}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (numberOfChildren === 1 && !selectedChild) {
                        showError('Please select a child');
                        return;
                      }
                      if (numberOfChildren > 1 && selectedChildren.length !== numberOfChildren) {
                        showError(`Please select ${numberOfChildren} children`);
                        return;
                      }
                      setCurrentStep('select-package');
                    }}
                    disabled={
                      (numberOfChildren === 1 && !selectedChild) ||
                      (numberOfChildren > 1 && selectedChildren.length !== numberOfChildren)
                    }
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span>Continue to Package</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleCreateChild}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-center space-x-2 text-gray-600 hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Another Child</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Package */}
        {currentStep === 'select-package' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Package className="w-6 h-6" />
              <span>Step 2: Select Package</span>
            </h2>

            {selectedChild && (
              <div className="mb-6 space-y-3">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Selected {numberOfChildren === 1 ? 'Child' : 'Children'}:</p>
                  {numberOfChildren === 1 ? (
                    <p className="font-semibold text-gray-900">
                      {selectedChild.fullName}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {selectedChildren.map((c, index) => (
                        <p key={c.childId} className="font-semibold text-gray-900">
                          {index + 1}. {c.fullName}
                        </p>
                      ))}
                    </div>
                  )}
                  {numberOfChildren > 1 && (
                    <p className="text-xs text-gray-600 mt-2">
                      {numberOfChildren} children selected
                    </p>
                  )}
                </div>
                {numberOfChildren > 1 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Price Adjustment: +60% for 2 children
                    </p>
                  </div>
                )}
              </div>
            )}

            {packages.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Packages Available</h3>
                <p className="text-gray-600">Please check back later or contact support.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {packages
                    .filter(pkg => {
                      // If child has a grade, show packages that match the grade OR packages with no grade specified
                      // If child has no grade, show all packages
                      if (!selectedChild?.grade) {
                        return true; // Show all if no child grade
                      }
                      // Show packages that match child's grade OR packages with no grade specified
                      return !pkg.grade || pkg.grade === selectedChild.grade || 
                             pkg.grade.toLowerCase() === selectedChild.grade.toLowerCase();
                    })
                    .map((pkg) => {
                      return (
                        <div
                          key={pkg.packageId}
                          onClick={() => handleSelectPackage(pkg)}
                          className={`border-2 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer ${
                            selectedPackage?.packageId === pkg.packageId
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200'
                          }`}
                        >
                          <h3 className="font-bold text-gray-900 text-lg mb-2">{pkg.packageName}</h3>
                          {pkg.description && (
                            <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                          )}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Sessions:</span>
                              <span className="font-medium">{pkg.sessionCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium">{pkg.durationDays} days</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Grade:</span>
                              <span className="font-medium">{pkg.grade || 'All'}</span>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-gray-200">
                            <div className="space-y-1">
                              {numberOfChildren > 1 && (
                                <p className="text-xs text-gray-500 line-through">
                              {new Intl.NumberFormat('vi-VN', { 
                                style: 'currency', 
                                currency: 'VND' 
                              }).format(pkg.price)}
                            </p>
                              )}
                              <p className={`text-2xl font-bold ${numberOfChildren > 1 || !schedule.isOnline || paymentMethod === 'direct_payment' ? 'text-primary' : 'text-gray-900'}`}>
                                {new Intl.NumberFormat('vi-VN', { 
                                  style: 'currency', 
                                  currency: 'VND' 
                                }).format(calculatePrice(pkg.price, numberOfChildren, !schedule.isOnline, paymentMethod === 'direct_payment'))}
                              </p>
                              {(numberOfChildren > 1 || !schedule.isOnline || paymentMethod === 'direct_payment') && (
                                <div className="text-xs text-primary font-medium space-y-0.5">
                                  {numberOfChildren > 1 && <p>+60% for 2 children</p>}
                                  {!schedule.isOnline && <p>+2% for offline mode</p>}
                                  {paymentMethod === 'direct_payment' && <p>+2% for direct payment</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleContinueFromPackage}
                    disabled={!selectedPackage}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span>Continue to Schedule</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Schedule */}
        {currentStep === 'schedule' && selectedChild && selectedPackage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Clock className="w-6 h-6" />
              <span>Step 3: Select Schedule</span>
            </h2>

            {selectedChild && selectedPackage && (
              <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-gray-600">Selected:</p>
                <p className="font-semibold text-gray-900">{selectedChild.fullName} • {selectedPackage.packageName}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Start Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={schedule.startDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dateToCheck = new Date(selectedDate);
                    dateToCheck.setHours(0, 0, 0, 0);
                    
                    if (dateToCheck < today) {
                      showError('Cannot select a date in the past');
                      return;
                    }
                    
                    // If selecting today, check if current time slot is in the past
                    if (dateToCheck.getTime() === today.getTime() && schedule.startTime) {
                      const now = new Date();
                      const [hours, minutes] = schedule.startTime.split(':').map(Number);
                      const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                      
                      if (slotDateTime <= now) {
                        // Clear the time slot if it's in the past
                        setSchedule(prev => ({ 
                          ...prev, 
                          startDate: selectedDate,
                          startTime: '',
                          endTime: ''
                        }));
                        showError('Selected time slot is in the past. Please select a new time slot.');
                        return;
                      }
                    }
                    
                    setSchedule(prev => ({ ...prev, startDate: selectedDate }));
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  max={(() => {
                    const maxDate = new Date();
                    maxDate.setDate(maxDate.getDate() + 7);
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-xs text-gray-500">Select when the contract should start (max 1 week from now)</p>
              </div>

              {/* Calculated End Date Display */}
              {schedule.startDate && selectedPackage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium">Estimated End Date:</p>
                      <p className="text-lg font-bold">
                        {(() => {
                          const endDate = new Date(schedule.startDate || new Date());
                          endDate.setDate(endDate.getDate() + (selectedPackage.durationDays || 90));
                          return endDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        })()}
                      </p>
                      <p className="text-xs mt-1">
                        {selectedPackage.durationDays} days from selected start date
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Days of Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Days of Week <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500">(Exactly 3 days required)</span>
                </label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                  {[
                    // BE bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
                    { label: 'Sun', value: 1, day: 'Sunday' },
                    { label: 'Mon', value: 2, day: 'Monday' },
                    { label: 'Tue', value: 4, day: 'Tuesday' },
                    { label: 'Wed', value: 8, day: 'Wednesday' },
                    { label: 'Thu', value: 16, day: 'Thursday' },
                    { label: 'Fri', value: 32, day: 'Friday' },
                    { label: 'Sat', value: 64, day: 'Saturday' }
                  ].map((day) => {
                    const isSelected = (schedule.daysOfWeeks & day.value) === day.value;
                    // Count selected days
                    const selectedDaysCount = [
                      (schedule.daysOfWeeks & 1) !== 0,  // Sun
                      (schedule.daysOfWeeks & 2) !== 0,  // Mon
                      (schedule.daysOfWeeks & 4) !== 0,  // Tue
                      (schedule.daysOfWeeks & 8) !== 0,  // Wed
                      (schedule.daysOfWeeks & 16) !== 0, // Thu
                      (schedule.daysOfWeeks & 32) !== 0, // Fri
                      (schedule.daysOfWeeks & 64) !== 0  // Sat
                    ].filter(Boolean).length;
                    
                    const isDisabled = !isSelected && selectedDaysCount >= 3;
                    
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // Deselect day
                            setSchedule(prev => ({
                              ...prev,
                              daysOfWeeks: prev.daysOfWeeks & ~day.value
                            }));
                          } else if (selectedDaysCount < 3) {
                            // Select day
                            setSchedule(prev => ({
                              ...prev,
                              daysOfWeeks: prev.daysOfWeeks | day.value
                            }));
                          }
                          setError(null);
                        }}
                        disabled={isDisabled}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/20 text-primary-dark font-semibold hover:bg-primary/30'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:bg-primary/10'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">{day.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selected: {[
                    (schedule.daysOfWeeks & 1) !== 0 && 'Sunday',
                    (schedule.daysOfWeeks & 2) !== 0 && 'Monday',
                    (schedule.daysOfWeeks & 4) !== 0 && 'Tuesday',
                    (schedule.daysOfWeeks & 8) !== 0 && 'Wednesday',
                    (schedule.daysOfWeeks & 16) !== 0 && 'Thursday',
                    (schedule.daysOfWeeks & 32) !== 0 && 'Friday',
                    (schedule.daysOfWeeks & 64) !== 0 && 'Saturday'
                  ].filter(Boolean).join(', ') || 'No days selected'}
                  {(() => {
                    const count = [
                      (schedule.daysOfWeeks & 1) !== 0,
                      (schedule.daysOfWeeks & 2) !== 0,
                      (schedule.daysOfWeeks & 4) !== 0,
                      (schedule.daysOfWeeks & 8) !== 0,
                      (schedule.daysOfWeeks & 16) !== 0,
                      (schedule.daysOfWeeks & 32) !== 0,
                      (schedule.daysOfWeeks & 64) !== 0
                    ].filter(Boolean).length;
                    if (count === 3) return ' (3 days selected - Required)';
                    if (count < 3) return ` (${3 - count} more day${3 - count > 1 ? 's' : ''} required)`;
                    return '';
                  })()}
                </p>
              </div>

              {/* Time Slot Selection Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Time Slot Selection <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSchedule(prev => ({ 
                        ...prev, 
                        useSameTimeForAllDays: true,
                        // Clear individual day slots when switching to same time mode
                        dayTimeSlots: {}
                      }));
                      setError(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      schedule.useSameTimeForAllDays
                        ? 'border-primary bg-primary/10 text-primary-dark font-semibold'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Same Time for All Days</div>
                      <div className="text-xs mt-1 text-gray-600">One time slot for all selected days</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSchedule(prev => ({ 
                        ...prev, 
                        useSameTimeForAllDays: false,
                        // Initialize day slots with current time if not set
                        dayTimeSlots: prev.dayTimeSlots || {}
                      }));
                      setError(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !schedule.useSameTimeForAllDays
                        ? 'border-primary bg-primary/10 text-primary-dark font-semibold'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Different Time per Day</div>
                      <div className="text-xs mt-1 text-gray-600">Choose time for each day</div>
                    </div>
                  </button>
                </div>

                {/* Same Time for All Days */}
                {schedule.useSameTimeForAllDays && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Time Slot <span className="text-xs text-gray-500">(1.5 hours per slot)</span>
                  </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = schedule.startTime === slot.from && schedule.endTime === slot.to;
                    
                    // Check if this slot is in the past (if start date is today)
                    const isPast = (() => {
                      if (!schedule.startDate) return false;
                      const selectedDate = new Date(schedule.startDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      selectedDate.setHours(0, 0, 0, 0);
                      
                      // Only check if start date is today
                      if (selectedDate.getTime() === today.getTime()) {
                        const now = new Date();
                        const [hours, minutes] = slot.from.split(':').map(Number);
                        const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                        return slotDateTime <= now;
                      }
                      return false;
                    })();
                    
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          if (isPast) {
                            showError('Cannot select a time slot in the past');
                            return;
                          }
                          setSchedule(prev => ({
                            ...prev,
                            startTime: slot.from,
                            endTime: slot.to
                          }));
                          setError(null);
                        }}
                        disabled={isPast}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary-dark font-semibold shadow-sm'
                            : isPast
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:bg-primary/10'
                        }`}
                        title={isPast ? 'This time slot is in the past' : ''}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{slot.label}</span>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                </div>
                        <p className="text-xs text-gray-500 mt-1">1.5 hours</p>
                      </button>
                    );
                  })}
                </div>
                {!schedule.startTime || !schedule.endTime ? (
                  <p className="mt-2 text-xs text-red-600">Please select a time slot</p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                        Selected: {schedule.startTime} - {schedule.endTime} (1.5 hours) for all days
                  </p>
                )}
                  </div>
                )}

                {/* Different Time per Day */}
                {!schedule.useSameTimeForAllDays && (() => {
                  const selectedDays = [
                    { label: 'Sunday', value: 1 },
                    { label: 'Monday', value: 2 },
                    { label: 'Tuesday', value: 4 },
                    { label: 'Wednesday', value: 8 },
                    { label: 'Thursday', value: 16 },
                    { label: 'Friday', value: 32 },
                    { label: 'Saturday', value: 64 }
                  ].filter(day => (schedule.daysOfWeeks & day.value) !== 0);

                  return (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Select time slot for each selected day:
                      </p>
                      {selectedDays.map((day) => {
                        const daySlot = schedule.dayTimeSlots?.[day.value] || { startTime: '', endTime: '' };
                        const isPast = (() => {
                          if (!schedule.startDate) return false;
                          const selectedDate = new Date(schedule.startDate);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          selectedDate.setHours(0, 0, 0, 0);
                          return selectedDate.getTime() === today.getTime();
                        })();

                        return (
                          <div key={day.value} className="p-4 border-2 border-gray-200 rounded-lg">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              {day.label} <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {TIME_SLOTS.map((slot) => {
                                const isSelected = daySlot.startTime === slot.from && daySlot.endTime === slot.to;
                                
                                const slotIsPast = isPast && (() => {
                                  const now = new Date();
                                  const [hours, minutes] = slot.from.split(':').map(Number);
                                  const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                                  return slotDateTime <= now;
                                })();
                                
                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => {
                                      if (slotIsPast) {
                                        showError(`Cannot select a time slot in the past for ${day.label}`);
                                        return;
                                      }
                                      setSchedule(prev => ({
                                        ...prev,
                                        dayTimeSlots: {
                                          ...prev.dayTimeSlots,
                                          [day.value]: {
                                            startTime: slot.from,
                                            endTime: slot.to
                                          }
                                        }
                                      }));
                                      setError(null);
                                    }}
                                    disabled={slotIsPast}
                                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                                      isSelected
                                        ? 'border-primary bg-primary/10 text-primary-dark font-semibold shadow-sm'
                                        : slotIsPast
                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:bg-primary/10'
                                    }`}
                                    title={slotIsPast ? `This time slot is in the past for ${day.label}` : ''}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">{slot.label}</span>
                                      {isSelected && (
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {!daySlot.startTime || !daySlot.endTime ? (
                              <p className="mt-2 text-xs text-red-600">Please select a time slot for {day.label}</p>
                            ) : (
                              <p className="mt-2 text-xs text-gray-500">
                                Selected: {daySlot.startTime} - {daySlot.endTime}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> Each day can have a different time slot. All selected schedules will be saved to the contract.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Online/Offline Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Session Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSchedule(prev => ({ ...prev, isOnline: true, offlineAddress: undefined }));
                      setError(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      schedule.isOnline
                        ? 'border-primary bg-primary/10 text-primary-dark'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Online</div>
                      <div className="text-xs mt-1">Video call session</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setSchedule(prev => ({ ...prev, isOnline: false, videoCallPlatform: undefined }));
                      setError(null);
                      
                      // Load user profile address if available and no address is set
                      if (!schedule.offlineAddress && userProfileAddress) {
                        setSchedule(prev => ({ ...prev, offlineAddress: userProfileAddress }));
                        // Geocode the profile address
                        if (userProfileAddress.trim().length >= 3) {
                          try {
                            const coordinates = await geocodeAddress(userProfileAddress);
                            if (coordinates) {
                              setSchedule(prev => ({
                                ...prev,
                                offlineLatitude: coordinates.latitude,
                                offlineLongitude: coordinates.longitude
                              }));
                              if (import.meta.env.DEV) {
                                console.log('Geocoded profile address:', { address: userProfileAddress, coordinates });
                              }
                            }
                          } catch (error) {
                            console.error('Error geocoding profile address:', error);
                          }
                        }
                        // Search for centers with profile address
                        if (userProfileAddress.trim().length >= 5) {
                          setLoadingCenters(true);
                          try {
                            const result = await getCentersNearAddress(userProfileAddress, 10);
                            if (result.success && result.data) {
                              let centersData: Center[] = [];
                              const data = result.data as any;
                              
                              if (Array.isArray(data)) {
                                centersData = data;
                              } else if (data.data && Array.isArray(data.data)) {
                                centersData = data.data;
                              } else if (data.centers && Array.isArray(data.centers)) {
                                centersData = data.centers;
                              } else if (data.items && Array.isArray(data.items)) {
                                centersData = data.items;
                              }
                              
                              setNearbyCenters(centersData);
                            } else {
                              setNearbyCenters([]);
                            }
                          } catch (error) {
                            console.error('Error fetching nearby centers:', error);
                            setNearbyCenters([]);
                          } finally {
                            setLoadingCenters(false);
                          }
                        }
                      } else if (!schedule.offlineAddress && !userProfileAddress && user?.id) {
                        // Try to fetch user profile if not loaded yet
                        await fetchUserProfile();
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      schedule.isOnline
                        ? 'border-gray-200 bg-white text-gray-700 hover:border-primary/40'
                        : 'border-primary bg-primary/10 text-primary-dark'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Offline</div>
                      <div className="text-xs mt-1">At the address you choose</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Video Call Platform Selection - Required when Online is selected */}
              {schedule.isOnline && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Video Call Platform <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSchedule(prev => ({ ...prev, videoCallPlatform: 'Google Meet' }));
                        setError(null);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        schedule.videoCallPlatform === 'Google Meet'
                          ? 'border-primary bg-primary/10 text-primary-dark'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">Google Meet</div>
                        <div className="text-xs mt-1">meet.google.com</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSchedule(prev => ({ ...prev, videoCallPlatform: 'Zoom' }));
                        setError(null);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        schedule.videoCallPlatform === 'Zoom'
                          ? 'border-primary bg-primary/10 text-primary-dark'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">Zoom</div>
                        <div className="text-xs mt-1">zoom.us</div>
                      </div>
                    </button>
                  </div>
                  {!schedule.videoCallPlatform && (
                    <p className="mt-2 text-xs text-red-600">Please select a video call platform</p>
                  )}
                </div>
              )}

              {/* Offline Location Input - Required when Offline is selected */}
              {!schedule.isOnline && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-gray-500 font-normal">(The system will find centers within a 10km radius from this address)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <input
                      type="text"
                      value={schedule.offlineAddress || ''}
                      onChange={async (e) => {
                        const address = e.target.value;
                        setSchedule(prev => ({ ...prev, offlineAddress: address }));
                        setSelectedCenterId(null);
                        setShowSuggestions(true);
                        
                        // Reset last searched address when address changes
                        if (lastSearchedAddressRef.current !== address) {
                          lastSearchedAddressRef.current = '';
                        }
                        
                        // Get autocomplete suggestions
                        if (address.trim().length >= 3) {
                          setLoadingSuggestions(true);
                          try {
                            const autocompleteResult = await apiService.getAddressAutocomplete(address, 'VN');
                            if (autocompleteResult.success && autocompleteResult.data) {
                              const predictions = autocompleteResult.data.predictions || [];
                              setAddressSuggestions(predictions);
                            } else {
                              setAddressSuggestions([]);
                            }
                          } catch (error) {
                            console.error('Error fetching address suggestions:', error);
                            setAddressSuggestions([]);
                          } finally {
                            setLoadingSuggestions(false);
                          }
                        } else {
                          setAddressSuggestions([]);
                        }
                      }}
                      onFocus={() => {
                        if (schedule.offlineAddress && schedule.offlineAddress.trim().length >= 3) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={async () => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setShowSuggestions(false), 200);
                        
                        // If address exists but no coordinates, try to geocode it
                        if (schedule.offlineAddress && 
                            schedule.offlineAddress.trim().length >= 3) {
                          let shouldSearchCenters = false;
                          
                          // Geocode if coordinates are missing
                          if (schedule.offlineLatitude === undefined || schedule.offlineLongitude === undefined) {
                            try {
                              const coordinates = await geocodeAddress(schedule.offlineAddress);
                              if (coordinates) {
                                setSchedule(prev => ({
                                  ...prev,
                                  offlineLatitude: coordinates.latitude,
                                  offlineLongitude: coordinates.longitude
                                }));
                                if (import.meta.env.DEV) {
                                  console.log('Geocoded address:', { address: schedule.offlineAddress, coordinates });
                                }
                                shouldSearchCenters = true;
                              }
                            } catch (error) {
                              console.error('Error geocoding address on blur:', error);
                            }
                          } else {
                            // Coordinates already exist, just search for centers
                            shouldSearchCenters = true;
                          }
                          
                          // Search for centers if address is long enough
                          if (shouldSearchCenters && schedule.offlineAddress.trim().length >= 5) {
                            setLoadingCenters(true);
                            try {
                              const result = await getCentersNearAddress(schedule.offlineAddress, 10);
                              if (result.success && result.data) {
                                let centersData: Center[] = [];
                                const data = result.data as any;
                                
                                if (Array.isArray(data)) {
                                  centersData = data;
                                } else if (data.data && Array.isArray(data.data)) {
                                  centersData = data.data;
                                } else if (data.centers && Array.isArray(data.centers)) {
                                  centersData = data.centers;
                                } else if (data.items && Array.isArray(data.items)) {
                                  centersData = data.items;
                                }
                                
                                setNearbyCenters(centersData);
                              } else {
                                setNearbyCenters([]);
                              }
                            } catch (error) {
                              console.error('Error fetching nearby centers:', error);
                              setNearbyCenters([]);
                            } finally {
                              setLoadingCenters(false);
                            }
                          }
                        }
                      }}
                      placeholder="Enter address or select from suggestions"
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    
                    {/* Address Autocomplete Suggestions */}
                    {showSuggestions && ((schedule.offlineAddress && schedule.offlineAddress.trim().length >= 3) || addressSuggestions.length > 0) && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingSuggestions ? (
                          <div className="p-3 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-2 text-xs">Searching for addresses...</p>
                          </div>
                        ) : addressSuggestions.length > 0 ? (
                          addressSuggestions.map((suggestion, index) => (
                            <button
                              key={suggestion.place_id || `suggestion-${index}`}
                              type="button"
                              onClick={async () => {
                                const placeId = suggestion.place_id || '';
                                setSchedule(prev => ({ ...prev, offlineAddress: suggestion.description }));
                                setShowSuggestions(false);
                                setAddressSuggestions([]);
                                
                                // Fetch coordinates from placeId
                                if (placeId) {
                                  try {
                                    const coordinatesResult = await getCoordinatesFromPlaceId(placeId);
                                    if (coordinatesResult.success && coordinatesResult.data) {
                                      const { latitude, longitude } = coordinatesResult.data;
                                      setSchedule(prev => ({
                                        ...prev,
                                        offlineLatitude: latitude,
                                        offlineLongitude: longitude
                                      }));
                                      if (import.meta.env.DEV) {
                                        console.log('Fetched coordinates:', { latitude, longitude, placeId });
                                      }
                                    } else {
                                      console.warn('Failed to fetch coordinates for placeId:', placeId);
                                    }
                                  } catch (error) {
                                    console.error('Error fetching coordinates:', error);
                                  }
                                }
                                
                                // Search for centers with selected address
                                setLoadingCenters(true);
                                try {
                                  const result = await getCentersNearAddress(suggestion.description, 10);
                                  if (result.success && result.data) {
                                    let centersData: Center[] = [];
                                    const data = result.data as any;
                                    
                                    if (Array.isArray(data)) {
                                      centersData = data;
                                    } else if (data.data && Array.isArray(data.data)) {
                                      centersData = data.data;
                                    } else if (data.centers && Array.isArray(data.centers)) {
                                      centersData = data.centers;
                                    } else if (data.items && Array.isArray(data.items)) {
                                      centersData = data.items;
                                    }
                                    
                                    setNearbyCenters(centersData);
                                  } else {
                                    setNearbyCenters([]);
                                  }
                                } catch (error) {
                                  console.error('Error fetching nearby centers:', error);
                                  setNearbyCenters([]);
                                } finally {
                                  setLoadingCenters(false);
                                }
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              {suggestion.structured_formatting ? (
                                <div>
                                  <p className="font-medium text-gray-900">{suggestion.structured_formatting.main_text}</p>
                                  <p className="text-xs text-gray-500">{suggestion.structured_formatting.secondary_text}</p>
                                </div>
                              ) : (
                                <p className="text-gray-900">{suggestion.description}</p>
                              )}
                            </button>
                          ))
                        ) : schedule.offlineAddress && schedule.offlineAddress.trim().length >= 3 ? (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            No matching addresses found
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {!schedule.offlineAddress && (
                    <p className="mt-1 text-xs text-red-600">Address is required for offline sessions</p>
                  )}
                  {userProfileAddress && !schedule.offlineAddress && (
                    <div className="mt-2 p-2 bg-primary/10 border-2 border-primary/30 rounded-lg">
                      <p className="text-xs text-primary-dark">
                        <strong>Suggestion:</strong> You have an address in your profile: <span className="font-medium">{userProfileAddress}</span>
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setSchedule(prev => ({ ...prev, offlineAddress: userProfileAddress }));
                          // Geocode the profile address
                          if (userProfileAddress.trim().length >= 3) {
                            try {
                              const coordinates = await geocodeAddress(userProfileAddress);
                              if (coordinates) {
                                setSchedule(prev => ({
                                  ...prev,
                                  offlineLatitude: coordinates.latitude,
                                  offlineLongitude: coordinates.longitude
                                }));
                                if (import.meta.env.DEV) {
                                  console.log('Geocoded profile address:', { address: userProfileAddress, coordinates });
                                }
                              }
                            } catch (error) {
                              console.error('Error geocoding profile address:', error);
                            }
                          }
                          // Search for centers with profile address
                          setLoadingCenters(true);
                          try {
                            const result = await getCentersNearAddress(userProfileAddress, 10);
                            if (result.success && result.data) {
                              let centersData: Center[] = [];
                              const data = result.data as any;
                              
                              if (Array.isArray(data)) {
                                centersData = data;
                              } else if (data.data && Array.isArray(data.data)) {
                                centersData = data.data;
                              } else if (data.centers && Array.isArray(data.centers)) {
                                centersData = data.centers;
                              } else if (data.items && Array.isArray(data.items)) {
                                centersData = data.items;
                              }
                              
                              setNearbyCenters(centersData);
                            } else {
                              setNearbyCenters([]);
                            }
                          } catch (error) {
                            console.error('Error fetching nearby centers:', error);
                            setNearbyCenters([]);
                          } finally {
                            setLoadingCenters(false);
                          }
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Use address from profile
                      </button>
                    </div>
                  )}
                  
                  {/* Nearby Centers List */}
                  {schedule.offlineAddress && schedule.offlineAddress.trim().length >= 5 && (
                    <div className="mt-4">
                      {loadingCenters ? (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Searching for nearby centers...</p>
                        </div>
                      ) : nearbyCenters.length > 0 ? (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Centers within 10km radius:
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {nearbyCenters.map((center: any, index: number) => {
                              const centerId = center.CenterId || center.centerId || center.id || '';
                              const centerName = center.Name || center.name || 'Unknown Center';
                              const centerAddress = center.Address || center.address || '';
                              const isSelected = selectedCenterId === centerId;
                              
                              return (
                                <button
                                  key={centerId || `center-${index}`}
                                  type="button"
                                  onClick={async () => {
                                    setSelectedCenterId(centerId);
                                    // Update center for all selected children
                                    const childrenToUpdate = numberOfChildren > 1 && selectedChildren.length > 0 
                                      ? selectedChildren 
                                      : (selectedChild ? [selectedChild] : []);
                                    
                                    if (childrenToUpdate.length === 0) {
                                      showError('No children selected');
                                      return;
                                    }
                                    
                                    try {
                                      // Update all selected children with the selected center
                                      const updatePromises = childrenToUpdate.map(async (child) => {
                                        // Backend requires fullName, schoolId, and grade when updating
                                        const updateResult = await updateChild(child.childId, {
                                          fullName: child.fullName,
                                          schoolId: child.schoolId,
                                          grade: child.grade,
                                          centerId: centerId,
                                          dateOfBirth: child.dateOfBirth
                                        });
                                        return { child, updateResult };
                                      });
                                      
                                      const results = await Promise.all(updatePromises);
                                      const successCount = results.filter(r => r.updateResult.success).length;
                                      
                                      if (successCount === childrenToUpdate.length) {
                                        // All updates successful
                                        const childNames = childrenToUpdate.map(c => c.fullName).join(', ');
                                        showSuccess(`Center updated for ${childrenToUpdate.length === 1 ? childNames : `all ${childrenToUpdate.length} children`}`);
                                        
                                        // Update selectedChild state (first child)
                                        if (selectedChild && childrenToUpdate.some(c => c.childId === selectedChild.childId)) {
                                          setSelectedChild({
                                            ...selectedChild,
                                            centerId: centerId,
                                            centerName: centerName
                                          });
                                        }
                                        
                                        // Update selectedChildren state
                                        if (numberOfChildren > 1 && selectedChildren.length > 0) {
                                          setSelectedChildren(selectedChildren.map(child => {
                                            if (childrenToUpdate.some(c => c.childId === child.childId)) {
                                              return {
                                                ...child,
                                                centerId: centerId,
                                                centerName: centerName
                                              };
                                            }
                                            return child;
                                          }));
                                        }
                                        } else {
                                        // Some updates failed
                                        const failedCount = childrenToUpdate.length - successCount;
                                        showError(`Failed to update center for ${failedCount} ${failedCount === 1 ? 'child' : 'children'}`);
                                        }
                                      } catch (error) {
                                        console.error('Error updating child center:', error);
                                        showError('Error updating center');
                                    }
                                  }}
                                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{centerName}</p>
                                      {centerAddress && (
                                        <p className="text-xs text-gray-600 mt-1">{centerAddress}</p>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Select a center to update for {selectedChild?.fullName}. The center will be assigned to the child when creating the contract.
                          </p>
                        </div>
                      ) : schedule.offlineAddress && schedule.offlineAddress.trim().length >= 5 ? (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            No centers found within 10km radius from this address.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Availability Warning */}
              {availabilityWarning && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">{availabilityWarning}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={checkingAvailability}
                >
                  Back
                </button>
                <button
                  onClick={handleContinueToPayment}
                  disabled={checkingAvailability}
                  className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 ${
                    checkingAvailability ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {checkingAvailability ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Checking Tutor Availability...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Payment Summary */}
        {currentStep === 'payment' && selectedChild && selectedPackage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <CreditCard className="w-6 h-6" />
              <span>Step 4: Payment</span>
            </h2>

            <div className="space-y-6">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wallet Payment */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('wallet');
                      setError(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'wallet'
                        ? 'border-primary bg-primary/10 text-primary-dark'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className={`w-6 h-6 ${paymentMethod === 'wallet' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-semibold">Pay with Wallet</div>
                        <div className="text-xs mt-1">Instant payment from your wallet</div>
                      </div>
                      {paymentMethod === 'wallet' && (
                        <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </button>

                  {/* Direct Payment (QR Code) */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('direct_payment');
                      setError(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'direct_payment'
                        ? 'border-primary bg-primary/10 text-primary-dark'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <QrCode className={`w-6 h-6 ${paymentMethod === 'direct_payment' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-semibold">Direct Payment</div>
                        <div className="text-xs mt-1">Scan QR code to pay</div>
                      </div>
                      {paymentMethod === 'direct_payment' && (
                        <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Wallet Balance Info - Only show if wallet payment is selected */}
              {paymentMethod === 'wallet' && (() => {
                const finalPrice = calculatePrice(selectedPackage.price, numberOfChildren, !schedule.isOnline, false);
                return (
                <div className={`p-4 rounded-lg border-2 ${
                    walletBalance >= finalPrice
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Wallet Balance</p>
                      <p className={`text-2xl font-bold ${
                          walletBalance >= finalPrice ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {walletLoading ? (
                          <span className="text-sm">Loading...</span>
                        ) : (
                          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletBalance)
                        )}
                      </p>
                    </div>
                      {walletBalance < finalPrice && (
                      <button
                        onClick={() => navigate('/wallet/topup')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Top Up
                      </button>
                    )}
                  </div>
                    {walletBalance < finalPrice && (
                    <p className="mt-2 text-sm text-red-700">
                      Insufficient balance. You need{' '}
                      <strong>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice - walletBalance)}
                      </strong>{' '}
                      more to create this contract.
                    </p>
                  )}
                </div>
                );
              })()}

              {/* Direct Payment Info - Only show if direct payment is selected */}
              {paymentMethod === 'direct_payment' && (
                <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Direct Payment with QR Code</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      After creating the contract, you will receive a QR code to scan and complete the payment. The contract will be activated automatically once payment is confirmed.
                    </p>
                    <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                      <div className="space-y-2">
                        {numberOfChildren > 1 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Price:</span>
                            <span className="text-gray-500 line-through">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPackage.price)}
                        </span>
                      </div>
                        )}
                        {numberOfChildren > 1 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Price Adjustment ({numberOfChildren} children):</span>
                            <span className="text-primary font-medium">
                              +60%
                            </span>
                          </div>
                        )}
                        {!schedule.isOnline && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Offline Mode Fee:</span>
                            <span className="text-primary font-medium">
                              +2%
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Direct Payment Fee:</span>
                          <span className="text-primary font-medium">
                            +2%
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-600 font-medium">Total Amount:</span>
                          <span className="font-bold text-blue-700 text-lg">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculatePrice(selectedPackage.price, numberOfChildren, !schedule.isOnline, true))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Contract Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{numberOfChildren === 1 ? 'Child' : 'Children'}:</span>
                    <span className="font-medium">
                      {numberOfChildren === 1 
                        ? selectedChild.fullName
                        : selectedChildren.map(c => c.fullName).join(', ')
                      }
                    </span>
                  </div>
                  {numberOfChildren > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Number of Children:</span>
                      <span className="font-medium">{numberOfChildren} (+60% price)</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Package:</span>
                    <span className="font-medium">{selectedPackage.packageName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sessions:</span>
                    <span className="font-medium">{selectedPackage.sessionCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{selectedPackage.durationDays} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Days:</span>
                    <span className="font-medium">
                      {[
                        (schedule.daysOfWeeks & 1) !== 0 && 'Sun',
                        (schedule.daysOfWeeks & 2) !== 0 && 'Mon',
                        (schedule.daysOfWeeks & 4) !== 0 && 'Tue',
                        (schedule.daysOfWeeks & 8) !== 0 && 'Wed',
                        (schedule.daysOfWeeks & 16) !== 0 && 'Thu',
                        (schedule.daysOfWeeks & 32) !== 0 && 'Fri',
                        (schedule.daysOfWeeks & 64) !== 0 && 'Sat'
                      ].filter(Boolean).join(', ') || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time Slot:</span>
                    <span className="font-medium">
                      {schedule.useSameTimeForAllDays ? (
                        schedule.startTime && schedule.endTime 
                          ? `${schedule.startTime} - ${schedule.endTime} (1.5 hours) for all days`
                          : 'Not selected'
                      ) : (
                        (() => {
                          const selectedDays = [
                            { label: 'Sun', value: 1 },
                            { label: 'Mon', value: 2 },
                            { label: 'Tue', value: 4 },
                            { label: 'Wed', value: 8 },
                            { label: 'Thu', value: 16 },
                            { label: 'Fri', value: 32 },
                            { label: 'Sat', value: 64 }
                          ].filter(day => (schedule.daysOfWeeks & day.value) !== 0);
                          
                          const timeSlots = selectedDays.map(day => {
                            const daySlot = schedule.dayTimeSlots?.[day.value];
                            if (daySlot && daySlot.startTime && daySlot.endTime) {
                              return `${day.label}: ${daySlot.startTime}-${daySlot.endTime}`;
                            }
                            return null;
                          }).filter(Boolean);
                          
                          return timeSlots.length > 0 
                            ? timeSlots.join(', ')
                            : 'Not selected';
                        })()
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{schedule.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  {schedule.isOnline && schedule.videoCallPlatform && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Platform:</span>
                      <span className="font-medium">{schedule.videoCallPlatform}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {paymentMethod === 'wallet' ? 'Wallet' : 'Direct Payment (QR Code)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tutor:</span>
                    <span className="font-medium text-gray-500">Will be assigned by staff</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="space-y-2">
                      {numberOfChildren > 1 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Base Price:</span>
                          <span className="text-gray-500 line-through">
                            {new Intl.NumberFormat('vi-VN', { 
                              style: 'currency', 
                              currency: 'VND' 
                            }).format(selectedPackage.price)}
                          </span>
                        </div>
                      )}
                      {numberOfChildren > 1 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Price Adjustment:</span>
                          <span className="text-primary font-medium">
                            +60% (2 children)
                          </span>
                        </div>
                      )}
                      {!schedule.isOnline && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Offline Mode Fee:</span>
                          <span className="text-primary font-medium">
                            +2%
                          </span>
                        </div>
                      )}
                      {paymentMethod === 'direct_payment' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Direct Payment Fee:</span>
                          <span className="text-primary font-medium">
                            +2%
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('vi-VN', { 
                          style: 'currency', 
                          currency: 'VND' 
                          }).format(calculatePrice(selectedPackage.price, numberOfChildren, !schedule.isOnline, paymentMethod === 'direct_payment'))}
                      </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isCreating}
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isCreating || (paymentMethod === 'wallet' && walletBalance < calculatePrice(selectedPackage.price, numberOfChildren, !schedule.isOnline, false))}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>
                        {paymentMethod === 'wallet' ? 'Create Contract & Pay' : 'Create Contract & Get QR Code'}
                      </span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your tutor will be assigned by our staff team based on your schedule preferences.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Payment QR Code Modal */}
      {paymentResponse && createdContractId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Payment QR Code
              </h3>
              <button
                onClick={() => {
                  setPaymentResponse(null);
                  setIsPolling(false);
                  setPaymentConfirmed(false);
                  navigate(`/contracts/${createdContractId}`);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Payment Confirmed Success Message */}
              {paymentConfirmed && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h4 className="text-lg font-bold text-green-800">Thank You!</h4>
                  </div>
                  <p className="text-sm text-green-700 mb-2">
                    Your payment has been successfully confirmed.
                  </p>
                  <p className="text-sm text-green-700">
                    The contract is pending staff activation. You will receive a notification when the contract is activated.
                  </p>
                </div>
              )}

              {/* Payment Status - After Confirmation - Hidden, only show Thank You banner */}

              {/* QR Code - Hide after payment is confirmed */}
              {!paymentConfirmed && (
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-4">Scan QR code with your banking app</p>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <img
                      src={paymentResponse.qrCodeUrl}
                      alt="QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Payment Details - Hide after payment is confirmed */}
              {!paymentConfirmed && (
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentResponse.amount)}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Content:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={paymentResponse.transferContent}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentResponse.transferContent);
                              setCopiedField('content');
                              setTimeout(() => setCopiedField(null), 2000);
                            }}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Copy"
                          >
                            {copiedField === 'content' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Information:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={paymentResponse.bankInfo}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentResponse.bankInfo);
                              setCopiedField('bank');
                              setTimeout(() => setCopiedField(null), 2000);
                            }}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Copy"
                          >
                            {copiedField === 'bank' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Order Reference:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={paymentResponse.orderReference}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentResponse.orderReference);
                              setCopiedField('reference');
                              setTimeout(() => setCopiedField(null), 2000);
                            }}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Copy"
                          >
                            {copiedField === 'reference' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Summary - Show simplified version after payment confirmed */}
              {paymentConfirmed && (
                <div className="space-y-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">Amount Paid:</span>
                        <span className="text-xl font-bold text-green-700">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentResponse.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-green-200">
                        <span className="text-gray-600">Order Reference:</span>
                        <span className="font-mono text-gray-700">{paymentResponse.orderReference}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Instructions - Hide after payment is confirmed */}
              {!paymentConfirmed && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Scan the QR code above with your banking app, or</li>
                    <li>Transfer manually using:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Amount: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentResponse.amount)}</strong></li>
                        <li>Transfer content: <strong className="font-mono">{paymentResponse.transferContent}</strong></li>
                        <li>Bank info: <strong>{paymentResponse.bankInfo}</strong></li>
                      </ul>
                    </li>
                    <li>After completing the transfer, the system will automatically detect and activate your contract</li>
                    <li>This process usually takes 1-5 minutes after payment completion</li>
                    <li>You can close this window and check your contract status later if needed</li>
                  </ol>
                </div>
              )}

              {/* After payment confirmed - Next steps */}
              {paymentConfirmed && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                    <li>Your payment has been successfully received</li>
                    <li>The contract is now pending staff activation</li>
                    <li>Our staff will review and activate your contract soon</li>
                    <li>You will receive a notification when the contract is activated</li>
                    <li>You can close this window and check your contract status later</li>
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isPolling && !paymentConfirmed && (
                  <button
                    onClick={async () => {
                      // Manual check of contract status
                      if (createdContractId) {
                        try {
                          const contractResult = await getContractById(createdContractId);
                          if (contractResult.success && contractResult.data) {
                            const contract = contractResult.data;
                            const contractStatus = contract.status?.toLowerCase() || '';
                            
                            if (contractStatus === 'active') {
                              setIsPolling(false);
                              setPaymentStatusMessage('');
                              setPaymentConfirmed(false);
                              showSuccess('Payment successful! Contract has been activated.');
                              setTimeout(() => {
                                navigate(`/contracts/${createdContractId}`);
                              }, 2000);
                            } else if (contractStatus === 'pending') {
                              if (!paymentConfirmed) {
                                setPaymentConfirmed(true);
                                showSuccess('Thank you! Your payment has been confirmed. The contract is pending staff activation.');
                              }
                              setPaymentStatusMessage('Payment confirmed! Contract is pending staff activation.');
                            } else {
                              showError(`Contract status: ${contract.status}. Please wait for payment confirmation or contact support.`);
                            }
                          } else {
                            showError('Failed to check contract status. Please try again.');
                          }
                        } catch (error) {
                          console.error('Error manually checking contract status:', error);
                          showError('Error checking contract status. Please try again.');
                        }
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    Check Payment Status
                  </button>
                )}
                <button
                  onClick={() => {
                    setPaymentResponse(null);
                    setIsPolling(false);
                    setPollingAttempts(0);
                    setPaymentStatusMessage('');
                    setPaymentConfirmed(false);
                    navigate(`/contracts/${createdContractId}`);
                  }}
                  className={`flex-1 px-4 py-3 ${
                    paymentConfirmed 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : isPolling 
                        ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } rounded-lg font-medium transition-colors`}
                >
                  {paymentConfirmed ? 'Close & View Contract' : (isPolling ? 'View Contract (Continue Checking)' : 'View Contract')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateContract;


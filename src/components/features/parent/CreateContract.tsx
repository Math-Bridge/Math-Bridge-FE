import React, { useState, useEffect } from 'react';
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
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getChildrenByParent, createContract, apiService, getSchoolById } from '../../../services/api';
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

const CreateContract: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('select-child');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
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
  }>({
    daysOfWeeks: 42, // Backend: Mon(2) + Wed(8) + Fri(32) = 42
    startTime: '19:00', // Default to slot 3: 19:00 - 20:30
    endTime: '20:30',
    isOnline: true,
    startDate: new Date().toISOString().split('T')[0] // Default to today
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank_transfer'>('wallet');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Refresh wallet balance when returning from top-up page
  useEffect(() => {
    const refreshWallet = async () => {
      if (user?.id && !walletLoading) {
        try {
          const walletResult = await apiService.getUserWallet(user.id);
          if (walletResult.success && walletResult.data) {
            setWalletBalance(walletResult.data.walletBalance || 0);
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
                      console.log(`Fetched school name for ${schoolId}: ${schoolName}`);
                    }
                  } catch (error) {
                    console.error('Failed to fetch school name for schoolId:', schoolId, error);
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
      console.log('Fetching packages...');
      const packagesResult = await apiService.getAllPackages();
      console.log('Packages API response:', packagesResult);
      
      if (packagesResult.success && packagesResult.data) {
        // Handle different response formats: direct array, or wrapped in data property
        let packagesData: any = packagesResult.data;
        
        // If data is an array, use it directly
        // If data is an object with a data/items/packages property, extract it
        if (!Array.isArray(packagesData)) {
          const dataObj = packagesData as any;
          packagesData = dataObj.data || dataObj.items || dataObj.packages || [];
        }
        
        console.log('Parsed packages array:', packagesData);
        
        const mappedPackages = packagesData.map((pkg: any) => ({
          packageId: pkg.PackageId || pkg.packageId || pkg.id || '',
          packageName: pkg.PackageName || pkg.packageName || pkg.name || '',
          description: pkg.Description || pkg.description || '',
          price: pkg.Price || pkg.price || 0,
          sessionCount: pkg.SessionCount || pkg.sessionCount || pkg.totalSessions || 0,
          durationDays: pkg.DurationDays || pkg.durationDays || pkg.duration || 0,
          grade: pkg.Grade || pkg.grade || ''
        }));
        
        console.log('Mapped packages:', mappedPackages);
        setPackages(mappedPackages);
      } else {
        console.error('Failed to fetch packages:', packagesResult.error || 'Unknown error');
        setError(packagesResult.error || 'Failed to load packages');
      }

      // Fetch wallet balance
      if (user?.id) {
        setWalletLoading(true);
        try {
          const walletResult = await apiService.getUserWallet(user.id);
          if (walletResult.success && walletResult.data) {
            setWalletBalance(walletResult.data.walletBalance || 0);
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

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    setCurrentStep('select-package');
  };

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    // Set isOnline based on child's center
    setSchedule(prev => ({
      ...prev,
      isOnline: !selectedChild?.centerId
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

  const handlePayment = async () => {
    if (!selectedChild || !selectedPackage || !user?.id) {
      setError('Please select child and package');
      return;
    }

    // Check wallet balance only if payment method is wallet
    if (paymentMethod === 'wallet' && walletBalance < selectedPackage.price) {
      const insufficientAmount = selectedPackage.price - walletBalance;
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
      
      // Calculate end date based on session count and 3 sessions per week
      // Formula: endDate = startDate + (sessionCount / 3) weeks
      const sessionsPerWeek = 3;
      const weeksNeeded = Math.ceil(selectedPackage.sessionCount / sessionsPerWeek);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (weeksNeeded * 7));

      // Format dates as YYYY-MM-DD
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      // Create contract request
     
      const contractData: any = {
        parentId: user.id,
        childId: selectedChild.childId,
        packageId: selectedPackage.packageId,
        mainTutorId: null, // Staff will assign tutor later
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        daysOfWeeks: schedule.daysOfWeeks, // Must be 1-127, validated above
        startTime: schedule.startTime, // Format: HH:mm (validated above)
        endTime: schedule.endTime, // Format: HH:mm (validated above)
        isOnline: schedule.isOnline,
        paymentMethod: paymentMethod // Add payment method to contract
      };

      // Optional fields
      if (selectedChild.centerId) {
        contractData.centerId = selectedChild.centerId;
      }

      // Online-specific fields
      if (schedule.isOnline && schedule.videoCallPlatform) {
        contractData.videoCallPlatform = schedule.videoCallPlatform;
      }

      // Offline-specific fields
      if (!schedule.isOnline) {
        if (schedule.maxDistanceKm !== undefined) {
          contractData.maxDistanceKm = schedule.maxDistanceKm;
        }
        // If maxDistanceKm not set, it will default to 10 in api.ts
        
        if (schedule.offlineAddress) {
          contractData.offlineAddress = schedule.offlineAddress;
        }
        if (schedule.offlineLatitude !== undefined) {
          contractData.offlineLatitude = schedule.offlineLatitude;
        }
        if (schedule.offlineLongitude !== undefined) {
          contractData.offlineLongitude = schedule.offlineLongitude;
        }
      }
      // For online: maxDistanceKm defaults to 0 in api.ts

      const result = await createContract(contractData);

      if (result.success) {
        const contractId = result.data?.contractId;

        // If payment method is wallet, deduct the wallet balance
        if (paymentMethod === 'wallet' && contractId) {
          try {
            const deductResult = await apiService.deductWallet(contractId);

            if (deductResult.success && deductResult.data) {
              showSuccess(`Contract created successfully! ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deductResult.data.amountDeducted)} deducted from your wallet. New balance: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deductResult.data.newWalletBalance)}`);

              // Update wallet balance in state
              setWalletBalance(deductResult.data.newWalletBalance);
            } else {
              // Contract created but wallet deduction failed
              showError(`Contract created but wallet deduction failed: ${deductResult.error || 'Unknown error'}. Please contact support.`);
              console.error('Wallet deduction failed:', deductResult.error);
            }
          } catch (deductError) {
            console.error('Error deducting wallet:', deductError);
            showError('Contract created but wallet deduction failed. Please contact support.');
          }
        } else if (paymentMethod === 'bank_transfer') {
          showSuccess('Contract created successfully! Please complete bank transfer to activate the contract.');
        }

        // Navigate to contract detail
        navigate(`/contracts/${contractId || ''}`);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="flex items-center justify-between">
            {/* Step 1: Select Child */}
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === 'select-child' ? 'bg-blue-600 text-white' : 
                ['select-package', 'schedule', 'payment'].includes(currentStep) ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {['select-package', 'schedule', 'payment'].includes(currentStep) ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="font-semibold">1</span>
                )}
              </div>
              <span className={`font-medium ${currentStep === 'select-child' ? 'text-blue-600' : 'text-gray-600'}`}>
                Select Child
              </span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${
              ['select-package', 'schedule', 'payment'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>

            {/* Step 2: Select Package */}
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === 'select-package' ? 'bg-blue-600 text-white' : 
                ['schedule', 'payment'].includes(currentStep) ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {['schedule', 'payment'].includes(currentStep) ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="font-semibold">2</span>
                )}
              </div>
              <span className={`font-medium ${currentStep === 'select-package' ? 'text-blue-600' : 'text-gray-600'}`}>
                Select Package
              </span>
            </div>

            <div className={`flex-1 h-1 mx-2 ${
              ['schedule', 'payment'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>

            {/* Step 3: Schedule */}
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === 'schedule' ? 'bg-blue-600 text-white' : 
                currentStep === 'payment' ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {currentStep === 'payment' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="font-semibold">3</span>
                )}
              </div>
              <span className={`font-medium ${currentStep === 'schedule' ? 'text-blue-600' : 'text-gray-600'}`}>
                Schedule
              </span>
            </div>

            <div className={`flex-1 h-1 mx-2 ${
              currentStep === 'payment' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>

            {/* Step 4: Payment */}
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <span className="font-semibold">4</span>
              </div>
              <span className={`font-medium ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-600'}`}>
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
              <span>Step 1: Select Your Child</span>
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
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Child</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <div
                    key={child.childId}
                    onClick={() => handleSelectChild(child)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
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
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleCreateChild}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
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
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Selected Child:</p>
                <p className="font-semibold text-gray-900">{selectedChild.fullName}</p>
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
                      console.log('Rendering package:', pkg);
                      return (
                        <div
                          key={pkg.packageId}
                          onClick={() => handleSelectPackage(pkg)}
                          className={`border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer ${
                            selectedPackage?.packageId === pkg.packageId
                              ? 'border-blue-500 bg-blue-50'
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
                            <p className="text-2xl font-bold text-gray-900">
                              {new Intl.NumberFormat('vi-VN', { 
                                style: 'currency', 
                                currency: 'VND' 
                              }).format(pkg.price)}
                            </p>
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
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
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
                  onChange={(e) => setSchedule(prev => ({ ...prev, startDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Select when the contract should start</p>
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
                          const startDate = new Date(schedule.startDate);
                          const sessionsPerWeek = 3;
                          const weeksNeeded = Math.ceil(selectedPackage.sessionCount / sessionsPerWeek);
                          const endDate = new Date(startDate);
                          endDate.setDate(endDate.getDate() + (weeksNeeded * 7));
                          return endDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        })()}
                      </p>
                      <p className="text-xs mt-1">
                        Based on {selectedPackage.sessionCount} sessions, 3 sessions/week = {Math.ceil(selectedPackage.sessionCount / 3)} weeks
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Days of Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Days of Week <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500">(Maximum 3 days)</span>
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
                            ? 'border-blue-500 bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
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
                  {[
                    (schedule.daysOfWeeks & 1) !== 0,
                    (schedule.daysOfWeeks & 2) !== 0,
                    (schedule.daysOfWeeks & 4) !== 0,
                    (schedule.daysOfWeeks & 8) !== 0,
                    (schedule.daysOfWeeks & 16) !== 0,
                    (schedule.daysOfWeeks & 32) !== 0,
                    (schedule.daysOfWeeks & 64) !== 0
                  ].filter(Boolean).length === 3 && ' (Maximum reached)'}
                </p>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Time Slot <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500">(1.5 hours per slot)</span>
                  </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = schedule.startTime === slot.from && schedule.endTime === slot.to;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSchedule(prev => ({
                            ...prev,
                            startTime: slot.from,
                            endTime: slot.to
                          }));
                          setError(null);
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{slot.label}</span>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
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
                    Selected: {schedule.startTime} - {schedule.endTime} (1.5 hours)
                  </p>
                )}
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
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Online</div>
                      <div className="text-xs mt-1">Video call session</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedChild.centerId) {
                        setError('Child must have a center assigned for offline sessions');
                        return;
                      }
                      setSchedule(prev => ({ ...prev, isOnline: false, videoCallPlatform: undefined }));
                    }}
                    disabled={!selectedChild.centerId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      schedule.isOnline
                        ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                    } ${!selectedChild.centerId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Offline</div>
                    </div>
                  </button>
                </div>
                {!selectedChild.centerId && schedule.isOnline === false && (
                  <p className="mt-2 text-sm text-red-600">Child must have a center assigned for offline sessions</p>
                )}
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
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
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
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
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
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={schedule.offlineAddress || ''}
                      onChange={(e) => setSchedule(prev => ({ ...prev, offlineAddress: e.target.value }))}
                      placeholder="Enter the address or location for offline sessions"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {!schedule.offlineAddress && (
                    <p className="mt-1 text-xs text-red-600">Location is required for offline sessions</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Enter the exact address where the sessions will take place</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // Validate start date
                    if (!schedule.startDate) {
                      const msg = 'Please select a start date';
                      setError(msg);
                      showError(msg);
                      return;
                    }
                    
                    // Validate days of week - at least 1 day must be selected
                    const selectedDaysCount = [
                      (schedule.daysOfWeeks & 1) !== 0,
                      (schedule.daysOfWeeks & 2) !== 0,
                      (schedule.daysOfWeeks & 4) !== 0,
                      (schedule.daysOfWeeks & 8) !== 0,
                      (schedule.daysOfWeeks & 16) !== 0,
                      (schedule.daysOfWeeks & 32) !== 0,
                      (schedule.daysOfWeeks & 64) !== 0
                    ].filter(Boolean).length;
                    
                    if (selectedDaysCount === 0) {
                      const msg = 'Please select at least 1 day of the week';
                      setError(msg);
                      showError(msg);
                      return;
                    }
                    
                    if (selectedDaysCount > 3) {
                      const msg = 'Maximum 3 days can be selected';
                      setError(msg);
                      showError(msg);
                      return;
                    }
                    
                    // Validate time slot is selected
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
                    
                    // Validate offline location if offline is selected
                    if (!schedule.isOnline && (!schedule.offlineAddress || schedule.offlineAddress.trim() === '')) {
                      const msg = 'Please enter a location for offline sessions';
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
                    
                    setError(null);
                    setCurrentStep('payment');
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-5 h-5" />
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
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
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

                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('bank_transfer');
                      setError(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Building2 className={`w-6 h-6 ${paymentMethod === 'bank_transfer' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-semibold">Bank Transfer</div>
                        <div className="text-xs mt-1">Direct bank transfer</div>
                      </div>
                      {paymentMethod === 'bank_transfer' && (
                        <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Wallet Balance Info - Only show if wallet payment is selected */}
              {paymentMethod === 'wallet' && (
                <div className={`p-4 rounded-lg border-2 ${
                  walletBalance >= selectedPackage.price
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Wallet Balance</p>
                      <p className={`text-2xl font-bold ${
                        walletBalance >= selectedPackage.price ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {walletLoading ? (
                          <span className="text-sm">Loading...</span>
                        ) : (
                          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletBalance)
                        )}
                      </p>
                    </div>
                    {walletBalance < selectedPackage.price && (
                      <button
                        onClick={() => navigate('/wallet/topup')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Top Up
                      </button>
                    )}
                  </div>
                  {walletBalance < selectedPackage.price && (
                    <p className="mt-2 text-sm text-red-700">
                      Insufficient balance. You need{' '}
                      <strong>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPackage.price - walletBalance)}
                      </strong>{' '}
                      more to create this contract.
                    </p>
                  )}
                </div>
              )}

              {/* Bank Transfer Info - Only show if bank transfer is selected */}
              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Bank Transfer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank Name:</span>
                      <span className="font-medium">Vietcombank</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium font-mono">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Holder:</span>
                      <span className="font-medium">Math Bridge Education</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-blue-700">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPackage.price)}
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Transfer Content:</p>
                      <p className="font-mono text-sm font-semibold">
                        CONTRACT {user?.id?.substring(0, 8).toUpperCase() || 'PAYMENT'}
                      </p>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> After completing the bank transfer, please contact support with your transaction reference. Your contract will be activated after payment confirmation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Contract Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Child:</span>
                    <span className="font-medium">{selectedChild.fullName}</span>
                  </div>
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
                      {schedule.startTime && schedule.endTime 
                        ? `${schedule.startTime} - ${schedule.endTime} (1.5 hours)`
                        : 'Not selected'}
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
                      {paymentMethod === 'wallet' ? 'Wallet' : 'Bank Transfer'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tutor:</span>
                    <span className="font-medium text-gray-500">Will be assigned by staff</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('vi-VN', { 
                          style: 'currency', 
                          currency: 'VND' 
                        }).format(selectedPackage.price)}
                      </span>
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
                  disabled={isCreating || (paymentMethod === 'wallet' && walletBalance < selectedPackage.price)}
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
                        {paymentMethod === 'wallet' ? 'Create Contract & Pay' : 'Create Contract'}
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
    </div>
  );
};

export default CreateContract;


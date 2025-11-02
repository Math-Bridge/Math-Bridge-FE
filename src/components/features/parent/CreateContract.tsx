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
  Calendar
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
    daysOfWeeks: 42, // Mon, Wed, Fri default
    startTime: '18:00',
    endTime: '19:00',
    isOnline: true,
    startDate: new Date().toISOString().split('T')[0] // Default to today
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
        isOnline: schedule.isOnline
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
        showSuccess('Contract created successfully!');
        // Navigate to payment page or contract detail
        navigate(`/contracts/${result.data?.contractId || ''}`);
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

              {/* Schedule Notice */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">Schedule Will Be Arranged by Staff</h4>
                    <p className="text-sm text-yellow-800">
                      The schedule (days of week and time slots) will be arranged by our staff after you create the contract. 
                      You will be notified once the schedule is confirmed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Days of Week Selection - Disabled (visible but not editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Days of Week
                  <span className="ml-2 text-xs text-gray-500">(Will be arranged by staff)</span>
                </label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-3 opacity-60">
                  {[
                    { label: 'Sun', value: 1, day: 'Sunday' },
                    { label: 'Mon', value: 2, day: 'Monday' },
                    { label: 'Tue', value: 4, day: 'Tuesday' },
                    { label: 'Wed', value: 8, day: 'Wednesday' },
                    { label: 'Thu', value: 16, day: 'Thursday' },
                    { label: 'Fri', value: 32, day: 'Friday' },
                    { label: 'Sat', value: 64, day: 'Saturday' }
                  ].map((day) => {
                    const isSelected = (schedule.daysOfWeeks & day.value) === day.value;
                    return (
                      <button
                        key={day.value}
                        type="button"
                        disabled
                        className={`p-3 rounded-lg border-2 cursor-not-allowed ${
                          isSelected
                            ? 'border-blue-300 bg-blue-100 text-blue-600 font-semibold'
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">{day.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection - Disabled (visible but not editable) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="opacity-60">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                    <span className="ml-2 text-xs text-gray-500">(Will be arranged by staff)</span>
                  </label>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={() => {}}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">Must be after 16:00</p>
                </div>
                <div className="opacity-60">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                    <span className="ml-2 text-xs text-gray-500">(Will be arranged by staff)</span>
                  </label>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={() => {}}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">Must be before 22:00</p>
                </div>
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
                      setSchedule(prev => ({ ...prev, isOnline: false }));
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
                    
                    // Validate offline location if offline is selected
                    if (!schedule.isOnline && (!schedule.offlineAddress || schedule.offlineAddress.trim() === '')) {
                      const msg = 'Please enter a location for offline sessions';
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
                    <span className="text-gray-600">Schedule:</span>
                    <span className="font-medium text-yellow-600">
                      Will be arranged by staff
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{schedule.isOnline ? 'Online' : 'Offline'}</span>
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
                  disabled={isCreating}
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
                      <span>Create Contract & Pay</span>
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


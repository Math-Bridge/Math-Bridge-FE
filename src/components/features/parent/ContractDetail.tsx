import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  MapPin,
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  BookOpen,
  Award,
  Copy,
  X,
  CreditCard,
  Heart
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContractById, getContractsByParent, apiService, createContractDirectPayment, SePayPaymentResponse } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';

interface Session {
  id: string;
  date: string;
  time: string;
  status: 'completed' | 'upcoming' | 'cancelled';
  topic: string;
  notes?: string;
  rating?: number;
}

interface ContractDetail {
  id: string;
  childName: string;
  tutorName: string;
  tutorEmail: string;
  tutorPhone: string;
  subject: string;
  packageName: string;
  totalSessions: number;
  completedSessions: number;
  price: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid';
  startDate: string;
  endDate: string;
  schedule: string;
  centerName: string;
  centerAddress: string;
  createdAt: string;
  sessions: Session[];
  tutorRating: number;
  tutorExperience: string;
  tutorQualifications: string[];
}

const ContractDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id: contractId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'tutor'>('overview');
  
  // Payment states
  const [paymentResponse, setPaymentResponse] = useState<SePayPaymentResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false); // Track when payment is confirmed (status changed to pending)
  const MAX_POLLING_ATTEMPTS = 120; // 10 minutes (120 * 5 seconds)

  useEffect(() => {
    const fetchContract = async () => {
      if (!contractId) {
        setError('Contract ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get contract by ID first
        let contractData = null;
        const directResponse = await getContractById(contractId);
        
        if (directResponse.success && directResponse.data) {
          contractData = directResponse.data;
        } else {
          // Fallback: Get from parent's contracts list (only for parent role)
          if (user?.id && user?.role === 'parent') {
            const parentContractsResponse = await getContractsByParent(user.id);
            if (parentContractsResponse.success && parentContractsResponse.data) {
              contractData = parentContractsResponse.data.find((c: any) => 
                (c.ContractId || c.contractId || c.id) === contractId
              );
            }
          }
        }

        if (!contractData) {
          setError('Contract not found');
          setLoading(false);
          return;
        }

        // Map backend data to frontend format
        // Fetch package details if needed
        let totalSessions = contractData.TotalSessions || contractData.totalSessions || 0;
        let price = contractData.Price || contractData.price || contractData.Amount || contractData.amount || 0;
        
        if ((!totalSessions || !price) && (contractData.PackageId || contractData.packageId)) {
          try {
            const packageId = contractData.PackageId || contractData.packageId;
            const packageResponse = await apiService.request<any>(`/packages/${packageId}`);
            if (packageResponse.success && packageResponse.data) {
              const pkg = packageResponse.data;
              if (!totalSessions) {
                totalSessions = pkg.SessionCount || pkg.sessionCount || pkg.totalSessions || 0;
              }
              if (!price) {
                price = pkg.Price || pkg.price || 0;
              }
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Error fetching package details:', error);
            }
          }
        }

        // Build schedule string
        let schedule = '';
        if (contractData.DaysOfWeeksDisplay || contractData.daysOfWeeksDisplay) {
          const days = contractData.DaysOfWeeksDisplay || contractData.daysOfWeeksDisplay;
          const startTime = contractData.StartTime || contractData.startTime || '';
          const endTime = contractData.EndTime || contractData.endTime || '';
          if (startTime && endTime) {
            schedule = `${days}, ${startTime} - ${endTime}`;
          } else if (startTime) {
            schedule = `${days}, ${startTime}`;
          } else {
            schedule = days;
          }
        } else {
          schedule = contractData.timeSlot || contractData.schedule || 'Schedule not set';
        }

        // Map status correctly from backend - ensure it's lowercase and trimmed
        const rawStatus = contractData.Status || contractData.status || 'pending';
        const normalizedStatus = String(rawStatus).toLowerCase().trim();
        
        // Validate status is one of the allowed values
        const validStatuses: Array<'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid'> = 
          ['pending', 'active', 'completed', 'cancelled', 'unpaid'];
        const contractStatus = validStatuses.includes(normalizedStatus as any) 
          ? (normalizedStatus as 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid')
          : 'pending'; // Default to pending if status is invalid

        // Map to frontend format
        const mappedContract: ContractDetail = {
          id: contractData.ContractId || contractData.contractId || contractData.id || contractId,
          childName: contractData.ChildName || contractData.childName || 'N/A',
          tutorName: contractData.MainTutorName || contractData.mainTutorName || 'Tutor not assigned',
          tutorEmail: contractData.MainTutorEmail || contractData.mainTutorEmail || '',
          tutorPhone: contractData.MainTutorPhone || contractData.mainTutorPhone || '',
          subject: 'Mathematics', // Default subject
          packageName: contractData.PackageName || contractData.packageName || 'N/A',
          totalSessions: totalSessions,
          completedSessions: contractData.CompletedSessions || contractData.completedSessions || 0,
          price: price,
          status: contractStatus,
          startDate: contractData.StartDate || contractData.startDate || '',
          endDate: contractData.EndDate || contractData.endDate || '',
          schedule: schedule,
          centerName: contractData.CenterName || contractData.centerName || 'Online',
          centerAddress: contractData.CenterAddress || contractData.centerAddress || '',
          createdAt: contractData.CreatedDate || contractData.createdDate || contractData.CreatedAt || contractData.createdAt || '',
          sessions: [], // TODO: Fetch sessions from API
          tutorRating: contractData.TutorRating || contractData.tutorRating || 0,
          tutorExperience: contractData.TutorExperience || contractData.tutorExperience || '',
          tutorQualifications: contractData.TutorQualifications || contractData.tutorQualifications || []
        };

        setContract(mappedContract);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Error fetching contract:', err);
        }
        setError('Failed to load contract details');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contractId, user?.id]);

  // Poll contract status when direct payment is active
  useEffect(() => {
    if (contractId && isPolling && paymentResponse) {
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

          const contractResult = await getContractById(contractId);
          if (contractResult.success && contractResult.data) {
            const contractData = contractResult.data;
            const contractStatus = (contractData.Status || contractData.status || '').toLowerCase().trim();
            
            // Update contract status in state to reflect current backend status
            setContract(prev => {
              if (!prev) return null;
              return {
                ...prev,
                status: contractStatus as 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid'
              };
            });
            
            // Check if contract status changed to 'active' (payment processed and activated)
            if (contractStatus === 'active') {
              clearInterval(interval);
              setIsPolling(false);
              setPollingAttempts(0);
              setPaymentStatusMessage('');
              setPaymentConfirmed(false);
              // Close payment modal first
              setPaymentResponse(null);
              // Show thank you popup
              setShowThankYouPopup(true);
              showSuccess('Payment successful! Contract has been activated.');
            } 
            // If status is 'pending' after payment attempt, payment was received but contract not activated yet
            else if (contractStatus === 'pending' && attemptCount > 2) {
              // Payment received but contract needs staff activation
              
              // If payment was just confirmed (status changed from unpaid to pending), show thank you popup
              if (!paymentConfirmed) {
                setPaymentConfirmed(true);
                showSuccess('Thank you! Your payment has been confirmed. The contract is pending staff activation.');
              }
              
              setPaymentStatusMessage('Payment confirmed! Contract is pending staff activation. You can close this window and check back later.');
              // Continue polling to detect when contract becomes active, but payment is already confirmed
            } 
            // If status is still 'unpaid', waiting for payment
            else if (contractStatus === 'unpaid') {
              setPaymentStatusMessage('Waiting for payment confirmation... Please complete the payment using the QR code.');
            } 
            // If contract was cancelled
            else if (contractStatus === 'cancelled') {
              clearInterval(interval);
              setIsPolling(false);
              setPaymentStatusMessage('Contract was cancelled. Please contact support.');
              setPaymentConfirmed(false);
              showError('Contract was cancelled. Please contact support.');
            }
            // If status changed to 'completed', stop polling
            else if (contractStatus === 'completed') {
              clearInterval(interval);
              setIsPolling(false);
              setPaymentStatusMessage('');
              setPaymentConfirmed(false);
            }
          } else {
            if (import.meta.env.DEV) {
              console.error('Failed to fetch contract:', contractResult.error);
            }
            if (attemptCount % 12 === 0) {
              setPaymentStatusMessage('Having trouble checking payment status. Please check manually if payment was completed.');
            }
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error checking contract status:', error);
          }
          if (attemptCount % 12 === 0) {
            setPaymentStatusMessage('Error checking payment status. Please check manually.');
          }
        }
      }, 5000); // Check every 5 seconds

      return () => {
        clearInterval(interval);
      };
    } else {
      if (!isPolling) {
        setPollingAttempts(0);
        setPaymentStatusMessage('');
      }
    }
  }, [contractId, isPolling, paymentResponse, showSuccess, showError]);

  // Handle payment button click
  const handlePayment = async () => {
    if (!contractId || !contract) {
      showError('Contract information is missing');
      return;
    }

    try {
      setIsCreatingPayment(true);
      setError(null);
      
      const paymentResult = await createContractDirectPayment(contractId);
      
      if (paymentResult.success && paymentResult.data) {
        // Backend returns response with camelCase properties, but handle both cases for safety
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
            amount: paymentData.amount || paymentData.Amount || contract.price,
            bankInfo: paymentData.bankInfo || paymentData.BankInfo || '',
            transferContent: paymentData.transferContent || paymentData.TransferContent || paymentData.orderReference || paymentData.OrderReference || ''
          };
          
          setPaymentResponse(mappedPaymentResponse);
          setIsPolling(true);
          setPollingAttempts(0);
          setPaymentStatusMessage('');
          setPaymentConfirmed(false);
          showSuccess('Payment QR code generated successfully! Please scan to complete payment.');
          
          // Refresh contract status immediately after creating payment
          try {
            const refreshResult = await getContractById(contractId);
            if (refreshResult.success && refreshResult.data) {
              const contractData = refreshResult.data;
              const rawStatus = contractData.Status || contractData.status || 'pending';
              const normalizedStatus = String(rawStatus).toLowerCase().trim();
              const validStatuses: Array<'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid'> = 
                ['pending', 'active', 'completed', 'cancelled', 'unpaid'];
              const contractStatus = validStatuses.includes(normalizedStatus as any) 
                ? (normalizedStatus as 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid')
                : 'pending';
              
              setContract(prev => prev ? { ...prev, status: contractStatus } : null);
            }
          } catch (refreshError) {
            if (import.meta.env.DEV) {
              console.error('Error refreshing contract after payment creation:', refreshError);
            }
          }
        } else {
          showError('Failed to generate QR code URL. Please contact support.');
        }
      } else {
        showError(paymentResult.error || 'Failed to create payment QR code. Please contact support.');
      }
    } catch (paymentError) {
      if (import.meta.env.DEV) {
        console.error('Error creating direct payment:', paymentError);
      }
      showError('Failed to create payment QR code. Please contact support.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Contract not found'}
          </h3>
          <p className="text-gray-600 mb-6">The contract you're looking for doesn't exist or couldn't be loaded</p>
          {user?.role !== 'staff' && (
            <button
              onClick={() => navigate('/contracts')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Contracts
            </button>
          )}
          {user?.role === 'staff' && (
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Back Button - Top Left Corner (Only for non-staff roles) */}
      {user?.role !== 'staff' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Contracts</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{contract.packageName}</h1>
              <p className="text-gray-600 mt-2">{contract.subject}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="capitalize">{contract.status}</span>
              </span>
            </div>
          </div>

          {/* Children and Tutor Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Children Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">Children</p>
                  <h2 className="text-2xl font-bold text-gray-900">{contract.childName}</h2>
                  <p className="text-sm text-gray-600 mt-1">Learner</p>
                </div>
              </div>
            </div>

            {/* Tutor Card */}
            <div className={`rounded-xl shadow-sm border-2 p-6 ${
              contract.tutorName === 'Tutor not assigned' 
                ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200' 
                : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                  contract.tutorName === 'Tutor not assigned' 
                    ? 'bg-gray-400' 
                    : 'bg-purple-500'
                }`}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${
                    contract.tutorName === 'Tutor not assigned' 
                      ? 'text-gray-600' 
                      : 'text-purple-700'
                  }`}>
                    Tutor
                  </p>
                  <h2 className={`text-2xl font-bold ${
                    contract.tutorName === 'Tutor not assigned' 
                      ? 'text-gray-500' 
                      : 'text-gray-900'
                  }`}>
                    {contract.tutorName}
                  </h2>
                  {contract.tutorName !== 'Tutor not assigned' && contract.tutorRating > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-700">{contract.tutorRating.toFixed(1)}</span>
                    </div>
                  )}
                  {contract.tutorName === 'Tutor not assigned' && (
                    <p className="text-sm text-gray-500 mt-1">Not assigned yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: FileText },
                { key: 'sessions', label: 'Sessions', icon: Calendar },
                { key: 'tutor', label: 'Tutor Info', icon: User }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contract Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-medium">{new Date(contract.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-medium">{new Date(contract.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Schedule</p>
                      <p className="font-medium">{contract.schedule}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.price)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Sessions Completed</span>
                    <span className="text-sm text-gray-600">
                      {contract.completedSessions}/{contract.totalSessions}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: contract.totalSessions > 0 
                          ? `${Math.min((contract.completedSessions / contract.totalSessions) * 100, 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {contract.totalSessions > 0
                      ? `${Math.round((contract.completedSessions / contract.totalSessions) * 100)}% complete`
                      : '0% complete'}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Information</h3>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{contract.centerName}</p>
                    <p className="text-sm text-gray-600">{contract.centerAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {contract.status === 'unpaid' && (
                    <button
                      onClick={handlePayment}
                      disabled={isCreatingPayment}
                      className="w-full flex items-center space-x-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                    >
                      {isCreatingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Pay Now</span>
                        </>
                      )}
                    </button>
                  )}
                  {contract.status === 'active' && (
                    <button
                      onClick={() => navigate(`/contracts/${contract.id}/reschedule`)}
                      className="w-full flex items-center space-x-3 p-3 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Request Reschedule</span>
                    </button>
                  )}
                  {contract.tutorName !== 'Tutor not assigned' && (
                    <button
                      onClick={() => navigate(`/user/chat?tutor=${contract.tutorName}`)}
                      className="w-full flex items-center space-x-3 p-3 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Chat with Tutor</span>
                    </button>
                  )}
                  {contract.status === 'completed' && (
                    <button
                      onClick={() => navigate(`/contracts/${contract.id}/feedback`)}
                      className="w-full flex items-center space-x-3 p-3 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Star className="w-5 h-5" />
                      <span>Submit Feedback</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutor Rating</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(contract.tutorRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">{contract.tutorRating}</span>
                </div>
                <p className="text-sm text-gray-600">{contract.tutorExperience}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Session History</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {contract.sessions.map((session) => (
                  <div key={session.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{session.topic}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.date).toLocaleDateString()} at {session.time}
                          </p>
                          {session.notes && (
                            <p className="text-sm text-gray-500 mt-1">{session.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSessionStatusColor(session.status)}`}>
                          <span className="capitalize">{session.status}</span>
                        </span>
                        {session.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{session.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tutor Information</h3>
                  <p className="text-sm text-gray-500">Contact & Profile Details</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Tutor Name</p>
                  <p className="text-xl font-bold text-gray-900">{contract.tutorName}</p>
                </div>
                {contract.tutorEmail && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                      <p className="text-base text-gray-900 break-all">{contract.tutorEmail}</p>
                    </div>
                  </div>
                )}
                {contract.tutorPhone && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Phone Number</p>
                      <p className="text-base text-gray-900">{contract.tutorPhone}</p>
                    </div>
                  </div>
                )}
                {contract.tutorRating > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-yellow-600 fill-current" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Rating</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(contract.tutorRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-bold text-gray-900">{contract.tutorRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualifications</h3>
              <div className="space-y-3">
                {contract.tutorQualifications.map((qualification, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-900">{qualification}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Experience:</strong> {contract.tutorExperience}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment QR Code Modal */}
      {paymentResponse && contractId && (
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
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
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

              {/* Payment Status */}
              {isPolling && !paymentConfirmed && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">Waiting for payment confirmation...</span>
                  </div>
                  {paymentStatusMessage && (
                    <p className="text-sm text-yellow-700 mt-1">{paymentStatusMessage}</p>
                  )}
                  <p className="text-xs text-yellow-600 mt-1">
                    Checking status... (Attempt {pollingAttempts}/{MAX_POLLING_ATTEMPTS})
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

              {/* Auto-checking status - Only show when payment not confirmed */}
              {isPolling && !paymentConfirmed && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Auto-checking payment status...</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    The system will automatically detect when your payment is confirmed. 
                    This may take a few minutes after you complete the transfer.
                  </p>
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
                      if (contractId) {
                        try {
                          const contractResult = await getContractById(contractId);
                          if (contractResult.success && contractResult.data) {
                            const contractData = contractResult.data;
                            const rawStatus = contractData.Status || contractData.status || 'pending';
                            const normalizedStatus = String(rawStatus).toLowerCase().trim();
                            const validStatuses: Array<'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid'> = 
                              ['pending', 'active', 'completed', 'cancelled', 'unpaid'];
                            const contractStatus = validStatuses.includes(normalizedStatus as any) 
                              ? (normalizedStatus as 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid')
                              : 'pending';
                            
                            // Update contract status in state
                            setContract(prev => prev ? { ...prev, status: contractStatus } : null);
                            
                            if (contractStatus === 'active') {
                              setIsPolling(false);
                              setPaymentStatusMessage('');
                              setPaymentConfirmed(false);
                              setPaymentResponse(null);
                              setShowThankYouPopup(true);
                              showSuccess('Payment successful! Contract has been activated.');
                            } else if (contractStatus === 'pending') {
                              if (!paymentConfirmed) {
                                setPaymentConfirmed(true);
                                showSuccess('Thank you! Your payment has been confirmed. The contract is pending staff activation.');
                              }
                              setPaymentStatusMessage('Payment confirmed! Contract is pending staff activation.');
                            } else if (contractStatus === 'unpaid') {
                              setPaymentStatusMessage('Waiting for payment confirmation... Please complete the payment using the QR code.');
                            } else {
                              showError(`Contract status: ${contractStatus}. Please wait for payment confirmation or contact support.`);
                            }
                          } else {
                            showError('Failed to check contract status. Please try again.');
                          }
                        } catch (error) {
                          if (import.meta.env.DEV) {
                            console.error('Error manually checking contract status:', error);
                          }
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
                  }}
                  className={`flex-1 px-4 py-3 ${
                    paymentConfirmed 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : isPolling 
                        ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } rounded-lg font-medium transition-colors`}
                >
                  {paymentConfirmed ? 'Close & View Contract' : (isPolling ? 'Close (Continue in Background)' : 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Popup */}
      {showThankYouPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600 mb-4">
                Your payment has been successfully processed.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium">
                  Your contract has been activated successfully!
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                <Heart className="w-5 h-5 fill-current" />
                <p className="text-sm">
                  We appreciate your trust in our service.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setShowThankYouPopup(false);
                  setPaymentResponse(null);
                  setIsPolling(false);
                  setPollingAttempts(0);
                  setPaymentStatusMessage('');
                  // Refresh contract data with proper status mapping
                  if (contractId) {
                    try {
                      const refreshResult = await getContractById(contractId);
                      if (refreshResult.success && refreshResult.data) {
                        const contractData = refreshResult.data;
                        const rawStatus = contractData.Status || contractData.status || 'pending';
                        const normalizedStatus = String(rawStatus).toLowerCase().trim();
                        const validStatuses: Array<'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid'> = 
                          ['pending', 'active', 'completed', 'cancelled', 'unpaid'];
                        const contractStatus = validStatuses.includes(normalizedStatus as any) 
                          ? (normalizedStatus as 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid')
                          : 'pending';
                        
                        // Update contract in state with correct status from backend
                        setContract(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            status: contractStatus
                          };
                        });
                      }
                    } catch (error) {
                      if (import.meta.env.DEV) {
                        console.error('Error refreshing contract:', error);
                      }
                    }
                  }
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Contract
              </button>
              {user?.role !== 'staff' && (
                <button
                  onClick={() => {
                    setShowThankYouPopup(false);
                    setPaymentResponse(null);
                    setIsPolling(false);
                    navigate('/contracts');
                  }}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back to Contracts
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetail;

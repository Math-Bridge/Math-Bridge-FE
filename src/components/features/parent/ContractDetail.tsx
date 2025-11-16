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
  BookOpen,
  Award,
  Copy,
  X,
  XCircle,
  CreditCard,
  Heart,
  Mail,
  Phone
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContractById, getContractsByParent, apiService, createContractDirectPayment, SePayPaymentResponse, getFinalFeedbackByContractAndProvider, getFinalFeedbacksByUserId, FinalFeedback, getChildUnitProgress, ChildUnitProgress } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import UnitProgressDisplay from '../../common/UnitProgressDisplay';

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
  
  // Substitute tutors info
  const [substituteTutor1Info, setSubstituteTutor1Info] = useState<any>(null);
  const [substituteTutor2Info, setSubstituteTutor2Info] = useState<any>(null);
  const [finalFeedback, setFinalFeedback] = useState<FinalFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  // Tutor rating states
  const [tutorFeedbacks, setTutorFeedbacks] = useState<FinalFeedback[]>([]);
  const [loadingTutorRatings, setLoadingTutorRatings] = useState(false);
  
  // Unit progress states
  const [unitProgress, setUnitProgress] = useState<ChildUnitProgress | null>(null);
  const [loadingUnitProgress, setLoadingUnitProgress] = useState(false);

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

        // Fetch unit progress for active/completed contracts
        const childId = contractData.ChildId || contractData.childId;
        if (childId && (contractStatus === 'active' || contractStatus === 'completed')) {
          try {
            setLoadingUnitProgress(true);
            const progressResult = await getChildUnitProgress(childId);
            if (progressResult.success && progressResult.data) {
              setUnitProgress(progressResult.data);
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              console.warn('Error fetching unit progress:', err);
            }
          } finally {
            setLoadingUnitProgress(false);
          }
        }

        // Fetch final feedback if contract is completed
        if (contractStatus === 'completed' && contractId) {
          try {
            setLoadingFeedback(true);
            const feedbackResult = await getFinalFeedbackByContractAndProvider(contractId, 'parent');
            if (feedbackResult.success && feedbackResult.data) {
              setFinalFeedback(feedbackResult.data);
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              console.warn('Error fetching final feedback:', err);
            }
          } finally {
            setLoadingFeedback(false);
          }
        }

        // Fetch tutor ratings/feedbacks
        const mainTutorId = contractData.MainTutorId || contractData.mainTutorId || contractData.main_tutor_id;
        if (mainTutorId) {
          try {
            setLoadingTutorRatings(true);
            const tutorFeedbacksResult = await getFinalFeedbacksByUserId(mainTutorId);
            if (tutorFeedbacksResult.success && tutorFeedbacksResult.data) {
              setTutorFeedbacks(tutorFeedbacksResult.data);
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              console.warn('Error fetching tutor ratings:', err);
            }
          } finally {
            setLoadingTutorRatings(false);
          }
        }

        // Fetch substitute tutor 1 info - handle errors gracefully
        // Support both underscore and camelCase field names from API
        const substituteTutor1Id = contractData.substitute_tutor1_id || contractData.substituteTutor1Id || contractData.SubstituteTutor1Id;
        const substituteTutor1Name = contractData.substitute_tutor1_name || contractData.substituteTutor1Name || contractData.SubstituteTutor1Name;
        if (substituteTutor1Id) {
          try {
            const tutorResult = await apiService.getUserById(substituteTutor1Id);
            if (tutorResult.success && tutorResult.data) {
              setSubstituteTutor1Info(tutorResult.data);
            } else {
              // Use contract data as fallback if available, otherwise set minimal info
              setSubstituteTutor1Info({ 
                fullName: substituteTutor1Name || 'Substitute Tutor 1',
                FullName: substituteTutor1Name || 'Substitute Tutor 1',
                email: contractData.substituteTutor1Email || contractData.SubstituteTutor1Email,
                phone: contractData.substituteTutor1Phone || contractData.SubstituteTutor1Phone,
              });
            }
          } catch (err: any) {
            // Silently handle unauthorized/500 errors - use contract data instead
            if (err?.response?.status !== 500 && err?.response?.status !== 401) {
              if (import.meta.env.DEV) {
                console.warn('Error fetching substitute tutor 1 info:', err);
              }
            }
            // Always set info if we have ID, even if API fails
            setSubstituteTutor1Info({ 
              fullName: substituteTutor1Name || 'Substitute Tutor 1',
              FullName: substituteTutor1Name || 'Substitute Tutor 1',
              email: contractData.substituteTutor1Email || contractData.SubstituteTutor1Email,
              phone: contractData.substituteTutor1Phone || contractData.SubstituteTutor1Phone,
            });
          }
        }

        // Fetch substitute tutor 2 info - handle errors gracefully
        // Support both underscore and camelCase field names from API
        const substituteTutor2Id = contractData.substitute_tutor2_id || contractData.substituteTutor2Id || contractData.SubstituteTutor2Id;
        const substituteTutor2Name = contractData.substitute_tutor2_name || contractData.substituteTutor2Name || contractData.SubstituteTutor2Name;
        if (substituteTutor2Id) {
          try {
            const tutorResult = await apiService.getUserById(substituteTutor2Id);
            if (tutorResult.success && tutorResult.data) {
              setSubstituteTutor2Info(tutorResult.data);
            } else {
              // Use contract data as fallback if available, otherwise set minimal info
              setSubstituteTutor2Info({ 
                fullName: substituteTutor2Name || 'Substitute Tutor 2',
                FullName: substituteTutor2Name || 'Substitute Tutor 2',
                email: contractData.substituteTutor2Email || contractData.SubstituteTutor2Email,
                phone: contractData.substituteTutor2Phone || contractData.SubstituteTutor2Phone,
              });
            }
          } catch (err: any) {
            // Silently handle unauthorized/500 errors - use contract data instead
            if (err?.response?.status !== 500 && err?.response?.status !== 401) {
              if (import.meta.env.DEV) {
                console.warn('Error fetching substitute tutor 2 info:', err);
              }
            }
            // Always set info if we have ID, even if API fails
            setSubstituteTutor2Info({ 
              fullName: substituteTutor2Name || 'Substitute Tutor 2',
              FullName: substituteTutor2Name || 'Substitute Tutor 2',
              email: contractData.substituteTutor2Email || contractData.SubstituteTutor2Email,
              phone: contractData.substituteTutor2Phone || contractData.SubstituteTutor2Phone,
            });
          }
        }
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 py-8 animate-slide-in-left">
      {/* Back Button - Top Left Corner (Only for non-staff roles) */}
      {user?.role !== 'staff' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm border border-emerald-200 rounded-2xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent animate-fade-in">{contract.packageName}</h1>
              <p className="text-gray-600 mt-2 text-lg animate-fade-in stagger-1">{contract.subject}</p>
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
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-lg">
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
            <div className={`rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300 ${
              contract.tutorName === 'Tutor not assigned' 
                ? 'bg-white/70 backdrop-blur-xl' 
                : 'bg-white/90 backdrop-blur-xl'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${
                  contract.tutorName === 'Tutor not assigned' 
                    ? 'bg-gray-400' 
                    : 'bg-gradient-to-br from-purple-400 to-indigo-500'
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
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4">
            <nav className="flex space-x-4">
              {[
                { key: 'overview', label: 'Overview', icon: FileText },
                { key: 'sessions', label: 'Sessions', icon: Calendar },
                { key: 'tutor', label: 'Tutor Info', icon: User }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-3 px-6 rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/50 text-gray-600 hover:bg-white hover:text-gray-800'
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
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
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

              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>
                <UnitProgressDisplay 
                  progress={unitProgress}
                  loading={loadingUnitProgress}
                  compact={false}
                  showDetailedUnits={true}
                />
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
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
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {contract.status === 'unpaid' && (
                    <button
                      onClick={handlePayment}
                      disabled={isCreatingPayment}
                      className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed justify-center font-bold"
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


                  {contract.status === 'completed' && !finalFeedback && (
                    <button
                      onClick={() => navigate(`/contracts/${contract.id}/feedback`)}
                      className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold"
                    >
                      <Star className="w-5 h-5" />
                      <span>Submit Feedback</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutor Rating</h3>
                {loadingTutorRatings ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : tutorFeedbacks.length > 0 ? (
                  <>
                    {/* Calculate average ratings */}
                    {(() => {
                      const totalReviews = tutorFeedbacks.length;
                      const avgOverall = tutorFeedbacks.reduce((sum, f) => sum + (f.overallSatisfactionRating || 0), 0) / totalReviews;
                      const avgCommunication = tutorFeedbacks.reduce((sum, f) => sum + (f.communicationRating || 0), 0) / tutorFeedbacks.filter(f => f.communicationRating).length || 0;
                      const avgSessionQuality = tutorFeedbacks.reduce((sum, f) => sum + (f.sessionQualityRating || 0), 0) / tutorFeedbacks.filter(f => f.sessionQualityRating).length || 0;
                      const avgLearningProgress = tutorFeedbacks.reduce((sum, f) => sum + (f.learningProgressRating || 0), 0) / tutorFeedbacks.filter(f => f.learningProgressRating).length || 0;
                      const avgProfessionalism = tutorFeedbacks.reduce((sum, f) => sum + (f.professionalismRating || 0), 0) / tutorFeedbacks.filter(f => f.professionalismRating).length || 0;
                      const wouldRecommendCount = tutorFeedbacks.filter(f => f.wouldRecommend).length;
                      const recommendPercentage = (wouldRecommendCount / totalReviews) * 100;
                      
                      return (
                        <div className="space-y-4">
                          {/* Overall Rating */}
                          <div className="text-center pb-4 border-b border-gray-200">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-6 h-6 ${
                                      i < Math.floor(avgOverall)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-2xl font-bold text-gray-900">{avgOverall.toFixed(1)}</span>
                            </div>
                            <p className="text-sm text-gray-600">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                            <p className="text-xs text-green-600 mt-1">{recommendPercentage.toFixed(0)}% would recommend</p>
                          </div>
                          
                          {/* Individual Rating Breakdown */}
                          <div className="space-y-3">
                            {avgCommunication > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Communication</span>
                                  <span className="text-sm font-semibold text-gray-900">{avgCommunication.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${(avgCommunication / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {avgSessionQuality > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Session Quality</span>
                                  <span className="text-sm font-semibold text-gray-900">{avgSessionQuality.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full" 
                                    style={{ width: `${(avgSessionQuality / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {avgLearningProgress > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Learning Progress</span>
                                  <span className="text-sm font-semibold text-gray-900">{avgLearningProgress.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${(avgLearningProgress / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {avgProfessionalism > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Professionalism</span>
                                  <span className="text-sm font-semibold text-gray-900">{avgProfessionalism.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full" 
                                    style={{ width: `${(avgProfessionalism / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Recent Comments */}
                          {tutorFeedbacks.slice(0, 2).some(f => f.feedbackText || f.additionalComments) && (
                            <div className="pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Reviews</h4>
                              <div className="space-y-2">
                                {tutorFeedbacks.slice(0, 2).map((feedback, idx) => {
                                  const comment = feedback.feedbackText || feedback.additionalComments;
                                  if (!comment) return null;
                                  return (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <div className="flex">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < Math.floor(feedback.overallSatisfactionRating)
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {feedback.userFullName || 'Anonymous'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-700 line-clamp-2">{comment}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No reviews yet</p>
                  </div>
                )}
              </div>

              {/* Final Feedback Section */}
              {contract.status === 'completed' && finalFeedback && (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Feedback</h3>
                    <span className="text-xs text-gray-500 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Submitted
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Overall Satisfaction</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < finalFeedback.overallSatisfactionRating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {finalFeedback.overallSatisfactionRating}/5
                        </span>
                      </div>
                    </div>

                    {/* Detailed Ratings */}
                    {(finalFeedback.communicationRating || 
                      finalFeedback.sessionQualityRating || 
                      finalFeedback.learningProgressRating || 
                      finalFeedback.professionalismRating) && (
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        {finalFeedback.communicationRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Communication</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {finalFeedback.communicationRating}/5
                            </span>
                          </div>
                        )}
                        {finalFeedback.sessionQualityRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Session Quality</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {finalFeedback.sessionQualityRating}/5
                            </span>
                          </div>
                        )}
                        {finalFeedback.learningProgressRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Learning Progress</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {finalFeedback.learningProgressRating}/5
                            </span>
                          </div>
                        )}
                        {finalFeedback.professionalismRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Professionalism</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {finalFeedback.professionalismRating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Comments */}
                    {finalFeedback.additionalComments && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Comments</p>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {finalFeedback.additionalComments}
                        </p>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {finalFeedback.improvementSuggestions && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Improvement Suggestions</p>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {finalFeedback.improvementSuggestions}
                        </p>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="flex items-center space-x-4 pt-2 border-t border-gray-200">
                      {finalFeedback.wouldRecommend && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Would Recommend</span>
                        </div>
                      )}
                      {finalFeedback.wouldWorkTogetherAgain && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Would Work Again</span>
                        </div>
                      )}
                    </div>

                    {/* Contract Objectives Met */}
                    {finalFeedback.contractObjectivesMet !== undefined && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Contract Objectives</p>
                        <div className="flex items-center space-x-2">
                          {finalFeedback.contractObjectivesMet ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">Objectives Met</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">Objectives Not Met</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 hover-lift transition-all duration-300">
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
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
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

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
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

            {/* Substitute Tutor 1 */}
            {(() => {
              const contractData = (contract as any);
              const substituteTutor1Id = contractData.substitute_tutor1_id || contractData.substituteTutor1Id || contractData.SubstituteTutor1Id;
              return substituteTutor1Id ? (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Substitute Tutor 1</h3>
                      <p className="text-sm text-gray-500">Backup Tutor Information</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Tutor Name</p>
                      <p className="text-xl font-bold text-gray-900">
                        {substituteTutor1Info?.fullName || substituteTutor1Info?.FullName || substituteTutor1Info?.name || contractData.substitute_tutor1_name || contractData.substituteTutor1Name || contractData.SubstituteTutor1Name || 'N/A'}
                      </p>
                    </div>
                    {(substituteTutor1Info?.email || contractData.substituteTutor1Email || contractData.SubstituteTutor1Email) && (
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                          <p className="text-base text-gray-900 break-all">{substituteTutor1Info?.email || contractData.substituteTutor1Email || contractData.SubstituteTutor1Email || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {(substituteTutor1Info?.phoneNumber || substituteTutor1Info?.phone || contractData.substituteTutor1Phone || contractData.SubstituteTutor1Phone) && (
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Phone Number</p>
                          <p className="text-base text-gray-900">
                            {substituteTutor1Info?.phoneNumber || substituteTutor1Info?.phone || contractData.substituteTutor1Phone || contractData.SubstituteTutor1Phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Substitute Tutor 2 */}
            {(() => {
              const contractData = (contract as any);
              const substituteTutor2Id = contractData.substitute_tutor2_id || contractData.substituteTutor2Id || contractData.SubstituteTutor2Id;
              return substituteTutor2Id ? (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Substitute Tutor 2</h3>
                      <p className="text-sm text-gray-500">Backup Tutor Information</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Tutor Name</p>
                      <p className="text-xl font-bold text-gray-900">
                        {substituteTutor2Info?.fullName || substituteTutor2Info?.FullName || substituteTutor2Info?.name || contractData.substitute_tutor2_name || contractData.substituteTutor2Name || contractData.SubstituteTutor2Name || 'N/A'}
                      </p>
                    </div>
                    {(substituteTutor2Info?.email || contractData.substituteTutor2Email || contractData.SubstituteTutor2Email) && (
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                          <p className="text-base text-gray-900 break-all">{substituteTutor2Info?.email || contractData.substituteTutor2Email || contractData.SubstituteTutor2Email || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {(substituteTutor2Info?.phoneNumber || substituteTutor2Info?.phone || contractData.substituteTutor2Phone || contractData.SubstituteTutor2Phone) && (
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Phone Number</p>
                          <p className="text-base text-gray-900">
                            {substituteTutor2Info?.phoneNumber || substituteTutor2Info?.phone || contractData.substituteTutor2Phone || contractData.SubstituteTutor2Phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
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

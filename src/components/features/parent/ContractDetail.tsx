import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  MapPin,
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
  Phone,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Brain
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContractById, getContractsByParent, apiService, createContractDirectPayment, SePayPaymentResponse, getFinalFeedbackByContractAndProvider, getFinalFeedbacksByUserId, FinalFeedback, getChildUnitProgress, ChildUnitProgress, getDailyReportsByChild, getDailyReportsByContractId, DailyReport, getTutorVerificationByUserId, getSessionsByContractId, Session as ApiSession, getUnitsByContractId } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import UnitProgressDisplay from '../../common/UnitProgressDisplay';
import { removeIdFromUrl } from '../../../utils/urlUtils';
import { useHideIdInUrl } from '../../../hooks/useHideIdInUrl';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

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
  secondChildName?: string | null; 
  tutorName: string;
  tutorEmail: string;
  tutorPhone: string;
  tutorAvatarUrl?: string;
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
  isOnline?: boolean;
}

// Calculate price based on number of children, offline mode, and discount
// Note: basePrice should already have discount applied (if any)
const calculatePrice = (basePrice: number, numberOfChildren: number, isOffline: boolean = false): number => {
  let price = basePrice;
  
  // Increase 60% for 2 children
  if (numberOfChildren === 2) {
    price = basePrice * 1.6;
  }
  
  // Add 2% for offline mode
  if (isOffline) {
    price = price * 1.02;
  }
  
  return price;
};

const ContractDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id: contractId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  useHideIdInUrl(); // Hide ID in URL bar
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [contractRawData, setContractRawData] = useState<any>(null); // Store raw contract data from API
  const [basePackagePrice, setBasePackagePrice] = useState<number | null>(null); // Store base price from package
  const [packageDiscount, setPackageDiscount] = useState<number | undefined>(undefined); // Store package discount
  const [packageOriginalPrice, setPackageOriginalPrice] = useState<number | undefined>(undefined); // Store package original price
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dailyReports' | 'tutor' | 'curriculum'>('overview');
  
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
  
  // Main tutor info
  const [mainTutorInfo, setMainTutorInfo] = useState<any>(null);
  
  // Substitute tutors info
  const [substituteTutor1Info, setSubstituteTutor1Info] = useState<any>(null);
  const [substituteTutor2Info, setSubstituteTutor2Info] = useState<any>(null);
  
  // Tutor verification states
  const [mainTutorVerification, setMainTutorVerification] = useState<any>(null);
  const [substituteTutor1Verification, setSubstituteTutor1Verification] = useState<any>(null);
  const [substituteTutor2Verification, setSubstituteTutor2Verification] = useState<any>(null);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<FinalFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  // Tutor rating states
  const [tutorFeedbacks, setTutorFeedbacks] = useState<FinalFeedback[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [currentReviewIndexMap, setCurrentReviewIndexMap] = useState<Map<string, number>>(new Map());
  const [loadingTutorRatings, setLoadingTutorRatings] = useState(false);
  
  // Unit progress states
  const [unitProgress, setUnitProgress] = useState<ChildUnitProgress | null>(null);
  const [loadingUnitProgress, setLoadingUnitProgress] = useState(false);
  
  // Curriculum states
  const [units, setUnits] = useState<any[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  
  // Daily reports states
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sessions and actual teaching tutors
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [tutorFeedbacksMap, setTutorFeedbacksMap] = useState<Map<string, FinalFeedback[]>>(new Map());
  const [loadingTutorFeedbacksMap, setLoadingTutorFeedbacksMap] = useState<Map<string, boolean>>(new Map());

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

        // Debug: Log contract data to check SecondChildName
        if (import.meta.env.DEV) {
          console.log('Contract Data:', contractData);
          console.log('SecondChildName:', contractData.SecondChildName, contractData.secondChildName);
          console.log('SecondChildId:', contractData.SecondChildId, contractData.secondChildId);
          console.log('Available keys:', Object.keys(contractData));
        }

        // Map backend data to frontend format
        // Fetch package details to get base price
        let totalSessions = contractData.TotalSessions || contractData.totalSessions || 0;
        let price = contractData.Price || contractData.price || contractData.Amount || contractData.amount || 0;
        let basePrice = 0;
        
        // Always fetch package to get base price, discount, and original price (needed for 2 children calculation and discount)
        if (contractData.PackageId || contractData.packageId) {
          try {
            const packageId = contractData.PackageId || contractData.packageId;
            const packageResponse = await apiService.request<any>(`/packages/${packageId}`);
            if (packageResponse.success && packageResponse.data) {
              const pkg = packageResponse.data;
              const originalPrice = pkg.OriginalPrice || pkg.originalPrice || pkg.Price || pkg.price || 0;
              const discount = pkg.Discount || pkg.discount || 0;
              // Calculate price with discount applied
              basePrice = discount > 0 && discount <= 100 
                ? originalPrice * (1 - discount / 100)
                : originalPrice;
              
              setBasePackagePrice(basePrice);
              setPackageDiscount(discount > 0 ? discount : undefined);
              setPackageOriginalPrice(discount > 0 ? originalPrice : undefined);
              
              if (!totalSessions) {
                totalSessions = pkg.SessionCount || pkg.sessionCount || pkg.totalSessions || 0;
              }
              if (!price) {
                price = basePrice;
              }
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Error fetching package details:', error);
            }
          }
        }

        // Build schedule string
        // Helper function to format schedules array to display string
        const formatSchedulesToString = (schedules: any[]): string => {
          if (!schedules || schedules.length === 0) return 'Schedule not set';
          
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          return schedules.map((s: any) => {
            const dayOfWeek = s.dayOfWeek ?? s.DayOfWeek ?? 0;
            const dayName = dayShortNames[dayOfWeek] || `Day ${dayOfWeek}`;
            const startTime = (s.startTime ?? s.StartTime ?? '').substring(0, 5);
            const endTime = (s.endTime ?? s.EndTime ?? '').substring(0, 5);
            return `${dayName}: ${startTime}-${endTime}`;
          }).join(', ');
        };
        
        let schedule = '';
        
        // New format: Use schedules array if available
        if (contractData.schedules && Array.isArray(contractData.schedules) && contractData.schedules.length > 0) {
          schedule = formatSchedulesToString(contractData.schedules);
        }
        // Legacy format: DaysOfWeeksDisplay
        else if (contractData.DaysOfWeeksDisplay || contractData.daysOfWeeksDisplay) {
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
        }
        // Fallback: timeSlot or schedule field
        else {
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

        // Fetch tutor avatar and info if tutor is assigned
        let tutorAvatarUrl: string | undefined = undefined;
        const mainTutorId = contractData.MainTutorId || contractData.mainTutorId || contractData.main_tutor_id;
        if (mainTutorId) {
          try {
            const tutorResponse = await apiService.getUserById(mainTutorId);
            if (tutorResponse.success && tutorResponse.data) {
              tutorAvatarUrl = tutorResponse.data.avatarUrl || tutorResponse.data.AvatarUrl || undefined;
              setMainTutorInfo(tutorResponse.data);
            }
          } catch (err) {
            // Silently fail - avatar is optional
            if (import.meta.env.DEV) {
              console.warn('Error fetching tutor info:', err);
            }
          }
        }

        // Extract second child name - handle various formats and empty strings
        let secondChildName: string | null = null;
        const secondChildNameValue = contractData.SecondChildName ?? contractData.secondChildName;
        const secondChildId = contractData.SecondChildId ?? contractData.secondChildId;
        
        // If we have a SecondChildId, we should have a SecondChildName
        // Handle empty string, null, undefined cases
        if (secondChildId && (secondChildNameValue === null || secondChildNameValue === undefined || secondChildNameValue === '')) {
          // If we have SecondChildId but no name, log a warning
          if (import.meta.env.DEV) {
            console.warn('Contract has SecondChildId but no SecondChildName. SecondChildId:', secondChildId);
          }
        }
        
        // Set secondChildName if we have a valid non-empty string
        if (secondChildNameValue && typeof secondChildNameValue === 'string' && secondChildNameValue.trim() !== '') {
          secondChildName = secondChildNameValue.trim();
        }

        // Map to frontend format
        const mappedContract: ContractDetail = {
          id: contractData.ContractId || contractData.contractId || contractData.id || contractId,
          childName: contractData.ChildName || contractData.childName || 'N/A',
          secondChildName: secondChildName,
          tutorName: contractData.MainTutorName || contractData.mainTutorName || 'Tutor not assigned',
          tutorEmail: contractData.MainTutorEmail || contractData.mainTutorEmail || '',
          tutorPhone: contractData.MainTutorPhone || contractData.mainTutorPhone || '',
          tutorAvatarUrl: tutorAvatarUrl,
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
          centerAddress: contractData.CenterAddress || contractData.centerAddress || contractData.OfflineAddress || contractData.offlineAddress || '',
          createdAt: contractData.CreatedDate || contractData.createdDate || contractData.CreatedAt || contractData.createdAt || '',
          sessions: [], // TODO: Fetch sessions from API
          tutorRating: contractData.TutorRating || contractData.tutorRating || 0,
          isOnline: contractData.IsOnline !== undefined ? contractData.IsOnline : contractData.isOnline !== undefined ? contractData.isOnline : true
        };

        setContract(mappedContract);
        setContractRawData(contractData); // Store raw data for tutor info

        // Fetch unit progress for active/completed contracts
        if (contractId && (contractStatus === 'active' || contractStatus === 'completed')) {
          try {
            setLoadingUnitProgress(true);
            const progressResult = await getChildUnitProgress(contractId);
            if (progressResult.success && progressResult.data) {
              setUnitProgress(progressResult.data);
            }
            // If no data (e.g., no daily reports yet), silently set to null - this is expected
          } catch (err) {
            // Only log unexpected errors (not 404s which are handled silently)
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (!errorMessage.includes('404') && !errorMessage.includes('Not Found')) {
              if (import.meta.env.DEV) {
                console.warn('Error fetching unit progress:', err);
              }
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
        // mainTutorId already declared above, reuse it
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

        // Fetch tutor verifications
        try {
          setLoadingVerifications(true);
          // Main tutor verification
          // mainTutorId already declared above, reuse it
          if (mainTutorId) {
            const mainVerificationResult = await getTutorVerificationByUserId(mainTutorId);
            if (mainVerificationResult.success && mainVerificationResult.data) {
              setMainTutorVerification(mainVerificationResult.data);
            }
          }
          
          // Substitute tutor 1 verification
          if (substituteTutor1Id) {
            const sub1VerificationResult = await getTutorVerificationByUserId(substituteTutor1Id);
            if (sub1VerificationResult.success && sub1VerificationResult.data) {
              setSubstituteTutor1Verification(sub1VerificationResult.data);
            }
          }
          
          // Substitute tutor 2 verification
          if (substituteTutor2Id) {
            const sub2VerificationResult = await getTutorVerificationByUserId(substituteTutor2Id);
            if (sub2VerificationResult.success && sub2VerificationResult.data) {
              setSubstituteTutor2Verification(sub2VerificationResult.data);
            }
          }
        } catch (verificationErr) {
          if (import.meta.env.DEV) {
            console.warn('Error fetching tutor verifications:', verificationErr);
          }
        } finally {
          setLoadingVerifications(false);
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

  // Fetch daily reports when contract changes
  useEffect(() => {
    const fetchDailyReports = async () => {
      if (!contract?.id) return;
      
      try {
        setLoadingDailyReports(true);
        // Use contract-specific endpoint to get only reports for this contract
        const reportsResult = await getDailyReportsByContractId(contract.id);
        if (reportsResult.success && reportsResult.data) {
          // Get child IDs from contract raw data to match correctly
          const contractData = contractRawData || contract as any;
          const mainChildId = contractData?.ChildId || contractData?.childId || null;
          const secondChildId = contractData?.SecondChildId || contractData?.secondChildId || null;
          
          // Helper function to normalize IDs for comparison (handle string and GUID formats)
          const normalizeId = (id: string | null | undefined): string => {
            if (!id) return '';
            return String(id).toLowerCase().trim();
          };
          
          // Enrich reports with correct child name based on childId
          const enrichedReports = reportsResult.data.map((report: DailyReport) => {
            // If report already has childName, keep it (but verify it's correct)
            if (report.childName) {
              // Still verify if we can improve it based on childId
              const reportChildId = normalizeId(report.childId);
              const normalizedMainChildId = normalizeId(mainChildId);
              const normalizedSecondChildId = normalizeId(secondChildId);
              
              // If childId matches second child but name doesn't, correct it
              if (reportChildId && normalizedSecondChildId && reportChildId === normalizedSecondChildId) {
                if (contract.secondChildName && report.childName !== contract.secondChildName) {
                  return { ...report, childName: contract.secondChildName };
                }
              }
              // If childId matches main child but name doesn't, correct it
              if (reportChildId && normalizedMainChildId && reportChildId === normalizedMainChildId) {
                if (contract.childName && report.childName !== contract.childName) {
                  return { ...report, childName: contract.childName };
                }
              }
              return report;
            }
            
            // Try to determine child name from childId
            const reportChildId = normalizeId(report.childId);
            const normalizedMainChildId = normalizeId(mainChildId);
            const normalizedSecondChildId = normalizeId(secondChildId);
            
            // Compare report's childId with contract's child IDs
            if (reportChildId && normalizedMainChildId && reportChildId === normalizedMainChildId) {
              // Report belongs to main child
              return { ...report, childName: contract.childName };
            } else if (reportChildId && normalizedSecondChildId && reportChildId === normalizedSecondChildId) {
              // Report belongs to second child
              return { ...report, childName: contract.secondChildName || contract.childName };
            } else if (!reportChildId && contract.childName) {
              // No childId in report, fallback to main child name
              return { ...report, childName: contract.childName };
            }
            
            // If we can't determine, return report as is
            return report;
          });
          
          // Sort by date descending
          const sorted = [...enrichedReports].sort((a, b) => {
            const dateA = new Date(a.createdDate).getTime();
            const dateB = new Date(b.createdDate).getTime();
            return dateB - dateA;
          });
          setDailyReports(sorted);
        } else {
          // If no reports found for this contract, set empty array
          // This is expected when there are no daily reports yet, not an error
          setDailyReports([]);
        }
      } catch (error) {
        // Only log unexpected errors (not 404s which are handled silently)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('404') && !errorMessage.includes('Not Found')) {
          if (import.meta.env.DEV) {
            console.error('Error fetching daily reports:', error);
          }
        }
        setDailyReports([]);
      } finally {
        setLoadingDailyReports(false);
      }
    };

    if (activeTab === 'dailyReports') {
      fetchDailyReports();
    }
  }, [contract?.id, contract?.childName, contract?.secondChildName, contractRawData, activeTab]);

  // Reset to page 1 when date filters change
  useEffect(() => {
    if (activeTab === 'dailyReports') {
      setCurrentPage(1);
    }
  }, [dateFrom, dateTo, activeTab]);

  // Fetch units and unit progress when curriculum tab is active
  useEffect(() => {
    const fetchCurriculumData = async () => {
      if (!contractId || activeTab !== 'curriculum') return;
      
      try {
        setLoadingUnits(true);
        // Get raw data directly to preserve MathConcepts if available
        const rawResult = await apiService.request<any>(`/units/by-contract/${contractId}`, {
          method: 'GET',
        });
        if (rawResult.success && rawResult.data) {
          const rawData = Array.isArray(rawResult.data) ? rawResult.data : (rawResult.data.data || []);
          setUnits(rawData);
        } else {
          setUnits([]);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }

      // Fetch unit progress when curriculum tab is opened (especially for completed contracts)
      if (contract && (contract.status === 'active' || contract.status === 'completed')) {
        try {
          setLoadingUnitProgress(true);
          const progressResult = await getChildUnitProgress(contractId);
          if (progressResult.success && progressResult.data) {
            setUnitProgress(progressResult.data);
          } else {
            // If no progress data, set to null (expected for contracts without daily reports)
            setUnitProgress(null);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (!errorMessage.includes('404') && !errorMessage.includes('Not Found')) {
            if (import.meta.env.DEV) {
              console.warn('Error fetching unit progress in curriculum tab:', err);
            }
          }
          setUnitProgress(null);
        } finally {
          setLoadingUnitProgress(false);
        }
      }
    };

    fetchCurriculumData();
  }, [contractId, activeTab, contract?.status]);

  // Fetch sessions when tutor tab is active (only for counting sessions taught)
  useEffect(() => {
    const fetchSessions = async () => {
      if (!contract?.id || activeTab !== 'tutor') return;

      try {
        setLoadingSessions(true);
        const sessionsResult = await getSessionsByContractId(contract.id);
        
        if (sessionsResult.success && sessionsResult.data) {
          setSessions(sessionsResult.data);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching sessions:', error);
        }
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [contract?.id, activeTab]);
  
  // Fetch feedbacks for all tutors when tutor tab is active
  useEffect(() => {
    const fetchTutorFeedbacks = async () => {
      if (!contract || activeTab !== 'tutor') return;
      
      const contractData = contractRawData || contract as any;
      const mainTutorId = contractData?.MainTutorId || contractData?.mainTutorId || contractData?.main_tutor_id;
      const substituteTutor1Id = contractData?.substitute_tutor1_id || contractData?.substituteTutor1Id || contractData?.SubstituteTutor1Id;
      const substituteTutor2Id = contractData?.substitute_tutor2_id || contractData?.substituteTutor2Id || contractData?.SubstituteTutor2Id;
      
      // Fetch feedbacks for main tutor
      if (mainTutorId && !tutorFeedbacksMap.has(mainTutorId)) {
        try {
          setLoadingTutorFeedbacksMap(prev => {
            const newMap = new Map(prev);
            newMap.set(mainTutorId, true);
            return newMap;
          });
          const feedbacksResult = await getFinalFeedbacksByUserId(mainTutorId);
          if (feedbacksResult.success && feedbacksResult.data) {
            setTutorFeedbacksMap(prev => {
              const newMap = new Map(prev);
              newMap.set(mainTutorId, feedbacksResult.data || []);
              return newMap;
            });
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn('Error fetching main tutor feedbacks:', err);
          }
        } finally {
          setLoadingTutorFeedbacksMap(prev => {
            const newMap = new Map(prev);
            newMap.set(mainTutorId, false);
            return newMap;
          });
        }
      }
      
      // Fetch feedbacks for substitute tutor 1
      if (substituteTutor1Id && !tutorFeedbacksMap.has(substituteTutor1Id)) {
        try {
          setLoadingTutorFeedbacksMap(prev => {
            const newMap = new Map(prev);
            newMap.set(substituteTutor1Id, true);
            return newMap;
          });
          const feedbacksResult = await getFinalFeedbacksByUserId(substituteTutor1Id);
          if (feedbacksResult.success && feedbacksResult.data) {
            setTutorFeedbacksMap(prev => {
              const newMap = new Map(prev);
              newMap.set(substituteTutor1Id, feedbacksResult.data || []);
              return newMap;
            });
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn('Error fetching substitute tutor 1 feedbacks:', err);
          }
        } finally {
          setLoadingTutorFeedbacksMap(prev => {
            const newMap = new Map(prev);
            newMap.set(substituteTutor1Id, false);
            return newMap;
          });
        }
      }
      
      // Fetch feedbacks for substitute tutor 2
      if (substituteTutor2Id && !tutorFeedbacksMap.has(substituteTutor2Id)) {
        try {
          setLoadingTutorFeedbacksMap(prev => {
            const newMap = new Map(prev);
            newMap.set(substituteTutor2Id, true);
            return newMap;
          });
          const feedbacksResult = await getFinalFeedbacksByUserId(substituteTutor2Id);
          if (feedbacksResult.success && feedbacksResult.data) {
            setTutorFeedbacksMap(prev => {
              const newMap = new Map(prev);
              newMap.set(substituteTutor2Id, feedbacksResult.data || []);
              return newMap;
            });
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn('Error fetching substitute tutor 2 feedbacks:', err);
          }
        } finally {
          setLoadingTutorFeedbacksMap(prev => {
            const newMap = new Map(prev);
            newMap.set(substituteTutor2Id, false);
            return newMap;
          });
        }
      }
    };

    fetchTutorFeedbacks();
  }, [contract, activeTab, tutorFeedbacksMap]);

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
      
      // Use contract price (which should already include discount if applied during contract creation)
      // Calculate final amount: contract.price may already include adjustments, but we need to add direct payment fee (+2%)
      const finalAmount = contract.price * 1.02; // Add 2% for direct payment
      
      // Send final amount to backend
      const paymentResult = await createContractDirectPayment(contractId, finalAmount);
      
      if (paymentResult.success && paymentResult.data) {
        // Backend returns response with camelCase properties, but handle both cases for safety
        const paymentData = paymentResult.data as any;
        
        // Check if QR code URL exists (handle both camelCase and PascalCase)
        const qrCodeUrl = paymentData.qrCodeUrl || paymentData.QrCodeUrl;
        
        if (qrCodeUrl) {
          // Map response to match frontend interface (ensure camelCase)
          // Always use calculated price from frontend (with discount + fees) instead of backend amount
          const mappedPaymentResponse: SePayPaymentResponse = {
            success: paymentData.success ?? paymentData.Success ?? true,
            message: paymentData.message || paymentData.Message || 'Payment request created successfully',
            qrCodeUrl: qrCodeUrl,
            orderReference: paymentData.orderReference || paymentData.OrderReference || '',
            walletTransactionId: paymentData.walletTransactionId || paymentData.WalletTransactionId,
            // Always use calculated price from frontend - override backend amount
            amount: finalAmount,
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

  const getVerificationBadge = (verification: any) => {
    if (!verification) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Verified
        </span>
      );
    }
    
    const status = (verification.verificationStatus || '').toLowerCase();
    
    switch (status) {
      case 'approved':
      case 'verified':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Not Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-cream via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-cream via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Contract not found'}
          </h3>
          <p className="text-gray-600 mb-6">The contract you're looking for doesn't exist or couldn't be loaded</p>
          {user?.role !== 'staff' && (
            <button
              onClick={() => navigate('/contracts')}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Back to Contracts
            </button>
          )}
          {user?.role === 'staff' && (
            <button
              onClick={() => navigate(-1)}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-gradient-to-br from-background-cream via-white to-gray-50 py-8 animate-slide-in-left">
      {/* Back Button - Top Left Corner (Only for non-staff roles) */}
      {user?.role !== 'staff' && (
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 mb-6">
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm border-2 border-primary/40 rounded-2xl text-primary hover:bg-primary/10 hover:border-primary/60 hover:text-primary-dark transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Contracts</span>
          </button>
        </div>
      )}

      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent animate-fade-in">{contract.packageName}</h1>
              <p className="text-gray-600 mt-2 text-lg animate-fade-in stagger-1">{contract.subject}</p>
            </div>
          </div>

          {/* Children and Tutor Info Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${contract.secondChildName ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-8`}>
            {/* Children Cards */}
            {contract.secondChildName ? (
              // 2 Children - Display as 2 separate cards side by side
              <>
                {/* First Child Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primary-dark uppercase tracking-wide mb-1">
                        CHILDREN
                      </p>
                      <h2 className="text-2xl font-bold text-gray-900">{contract.childName}</h2>
                      <p className="text-sm text-gray-600 mt-1">Learner</p>
                    </div>
                  </div>
                </div>
                {/* Second Child Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primary-dark uppercase tracking-wide mb-1">
                        CHILDREN
                      </p>
                      <h2 className="text-2xl font-bold text-gray-900">{contract.secondChildName}</h2>
                      <p className="text-sm text-gray-600 mt-1">Learner</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // 1 Child - Display as single card
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary-dark uppercase tracking-wide mb-1">
                      CHILDREN
                    </p>
                    <h2 className="text-2xl font-bold text-gray-900">{contract.childName}</h2>
                    <p className="text-sm text-gray-600 mt-1">Learner</p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Tutor Card */}
            <div className={`rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300 ${
              contract.tutorName === 'Tutor not assigned' 
                ? 'bg-white/70 backdrop-blur-xl' 
                : 'bg-white/90 backdrop-blur-xl'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden ${
                  contract.tutorName === 'Tutor not assigned' 
                    ? 'bg-gray-400' 
                    : 'bg-gradient-to-br from-primary to-primary-dark'
                }`}>
                  {contract.tutorName !== 'Tutor not assigned' && contract.tutorAvatarUrl ? (
                    <img 
                      src={contract.tutorAvatarUrl} 
                      alt={contract.tutorName} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const icon = target.nextElementSibling as HTMLElement;
                        if (icon) icon.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <User className={`w-8 h-8 text-white ${contract.tutorName !== 'Tutor not assigned' && contract.tutorAvatarUrl ? 'hidden' : ''}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${
                    contract.tutorName === 'Tutor not assigned' 
                      ? 'text-gray-600' 
                      : 'text-purple-700'
                  }`}>
                    Main Tutor
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

            {/* Substitute Tutor 1 Card */}
            {(() => {
              const contractData = contract as any;
              const substituteTutor1Id = contractData.substitute_tutor1_id || contractData.substituteTutor1Id || contractData.SubstituteTutor1Id;
              const substituteTutor1Name = contractData.substitute_tutor1_name || contractData.substituteTutor1Name || contractData.SubstituteTutor1Name;
              const substituteTutor1AvatarUrl = substituteTutor1Info?.avatarUrl || substituteTutor1Info?.AvatarUrl;
              
              if (!substituteTutor1Id && !substituteTutor1Name) return null;
              
              return (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-accent-green to-primary">
                      {substituteTutor1AvatarUrl ? (
                        <img 
                          src={substituteTutor1AvatarUrl} 
                          alt={substituteTutor1Name || 'Substitute Tutor 1'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const icon = target.nextElementSibling as HTMLElement;
                            if (icon) icon.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <User className={`w-8 h-8 text-white ${substituteTutor1AvatarUrl ? 'hidden' : ''}`} />
          </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-1">
                        Substitute Tutor 1
                      </p>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {substituteTutor1Info?.fullName || substituteTutor1Info?.FullName || substituteTutor1Info?.name || substituteTutor1Name || 'Not assigned'}
                      </h2>
                      {substituteTutor1Info && (
                        <p className="text-sm text-gray-600 mt-1">Backup Tutor</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Substitute Tutor 2 Card */}
            {(() => {
              const contractData = contract as any;
              const substituteTutor2Id = contractData.substitute_tutor2_id || contractData.substituteTutor2Id || contractData.SubstituteTutor2Id;
              const substituteTutor2Name = contractData.substitute_tutor2_name || contractData.substituteTutor2Name || contractData.SubstituteTutor2Name;
              const substituteTutor2AvatarUrl = substituteTutor2Info?.avatarUrl || substituteTutor2Info?.AvatarUrl;
              
              if (!substituteTutor2Id && !substituteTutor2Name) return null;
              
              return (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-primary to-primary-light">
                      {substituteTutor2AvatarUrl ? (
                        <img 
                          src={substituteTutor2AvatarUrl} 
                          alt={substituteTutor2Name || 'Substitute Tutor 2'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const icon = target.nextElementSibling as HTMLElement;
                            if (icon) icon.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <User className={`w-8 h-8 text-white ${substituteTutor2AvatarUrl ? 'hidden' : ''}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primary-dark uppercase tracking-wide mb-1">
                        Substitute Tutor 2
                      </p>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {substituteTutor2Info?.fullName || substituteTutor2Info?.FullName || substituteTutor2Info?.name || substituteTutor2Name || 'Not assigned'}
                      </h2>
                      {substituteTutor2Info && (
                        <p className="text-sm text-gray-600 mt-1">Backup Tutor</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4">
            <nav className="flex space-x-4">
              {[
                { key: 'overview', label: 'Overview', icon: FileText },
                { key: 'curriculum', label: 'Curriculum', icon: BookOpen },
                { key: 'dailyReports', label: 'Daily Reports', icon: Calendar },
                { key: 'tutor', label: 'Tutor Info', icon: User }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-3 px-6 rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
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
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      {(() => {
                        // Calculate final price with discount and fees
                        const numberOfChildren = contract.secondChildName ? 2 : 1;
                        const isOffline = contract.isOnline !== undefined ? !contract.isOnline : (!contract.centerName || contract.centerName !== 'Online');
                        const finalPrice = basePackagePrice !== null
                          ? calculatePrice(basePackagePrice, numberOfChildren, isOffline)
                          : contract.price;
                        
                        return (
                          <>
                            {packageOriginalPrice && packageOriginalPrice > (basePackagePrice || 0) && (
                              <p className="text-xs text-gray-500 line-through mb-1">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                  calculatePrice(packageOriginalPrice, numberOfChildren, isOffline)
                                )}
                              </p>
                            )}
                            {packageDiscount && packageDiscount > 0 && (
                              <div className="mb-1">
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                  -{packageDiscount}%
                                </span>
                              </div>
                            )}
                            <p className="font-medium">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice)}
                            </p>
                            {(contract.secondChildName || isOffline) && basePackagePrice && (
                              <p className="text-xs text-gray-500 mt-1">
                                {contract.secondChildName && (
                                  <span>Base: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(basePackagePrice)} + 60% for 2 children</span>
                                )}
                                {contract.secondChildName && isOffline && <span> + </span>}
                                {isOffline && <span>+2% for offline mode</span>}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {contract.centerAddress && (
                    <div className="flex items-start space-x-3 md:col-span-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium break-words">{contract.centerAddress}</p>
                      </div>
                    </div>
                  )}
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
                      className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl hover:from-primary-dark hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed justify-center font-bold"
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
                          
                          {/* Recent Reviews Carousel */}
                          {(() => {
                            const validFeedbacks = tutorFeedbacks.filter(f => f.feedbackText || f.additionalComments);
                            if (validFeedbacks.length === 0) return null;
                            
                            const currentFeedback = validFeedbacks[currentReviewIndex];
                            const totalReviews = validFeedbacks.length;
                            const comment = currentFeedback.feedbackText || currentFeedback.additionalComments;
                            
                            return (
                              <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-semibold text-gray-900">Recent Reviews</h4>
                                  <span className="text-xs text-gray-500">
                                    {currentReviewIndex + 1} / {totalReviews}
                                  </span>
                                </div>
                                
                                <div className="relative flex items-center gap-2">
                                  {/* Previous Button */}
                                  {totalReviews > 1 && (
                                    <button
                                      onClick={() => setCurrentReviewIndex((prev) => 
                                        prev === 0 ? totalReviews - 1 : prev - 1
                                      )}
                                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                                      aria-label="Previous review"
                                    >
                                      <ChevronLeft className="w-5 h-5" />
                                    </button>
                                  )}
                                  
                                  {/* Review Card */}
                                  <div className="flex-1 bg-gray-50 p-4 rounded-lg min-h-[100px]">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < Math.floor(currentFeedback.overallSatisfactionRating)
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm text-gray-700 font-medium">
                                        {currentFeedback.userFullName || 'Anonymous'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment}</p>
                                  </div>
                                  
                                  {/* Next Button */}
                                  {totalReviews > 1 && (
                                    <button
                                      onClick={() => setCurrentReviewIndex((prev) => 
                                        prev === totalReviews - 1 ? 0 : prev + 1
                                      )}
                                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                                      aria-label="Next review"
                                    >
                                      <ChevronRight className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
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

        {activeTab === 'dailyReports' && (() => {
          // Helper function to get date key for grouping
          const getDateKey = (report: any): string => {
            const dateStr = report.sessionDate || report.SessionDate || report.createdDate || report.CreatedDate;
            if (!dateStr) return 'unknown';
            
            try {
              // If already in YYYY-MM-DD format, use it directly
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
              }
              
              // If it's an ISO string with time, extract date part
              if (dateStr.includes('T')) {
                const datePart = dateStr.split('T')[0];
                if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  return datePart;
                }
              }
              
              // If it has space, might be date with time
              if (dateStr.includes(' ')) {
                const datePart = dateStr.split(' ')[0];
                if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  return datePart;
                }
              }
              
              // Try parsing as date
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) {
                if (dateStr.length >= 10) {
                  return dateStr.substring(0, 10);
                }
                return 'unknown';
              }
              
              // Use local date components to avoid timezone issues
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              const day = date.getDate();
              
              return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } catch {
              if (dateStr && dateStr.length >= 10) {
                return dateStr.substring(0, 10);
              }
              return dateStr || 'unknown';
            }
          };

          // Filter reports by date range first
          const filteredReports = dailyReports.filter((report) => {
            const reportDate = report.sessionDate || report.SessionDate || report.createdDate || report.CreatedDate;
            const matchesDateFrom = !dateFrom || reportDate >= dateFrom;
            const matchesDateTo = !dateTo || reportDate <= dateTo;
            return matchesDateFrom && matchesDateTo;
          });

          // Group filtered reports by date
          const groupedReports = filteredReports.reduce((groups, report) => {
            const dateKey = getDateKey(report);
            if (!groups[dateKey]) {
              groups[dateKey] = [];
            }
            groups[dateKey].push(report);
            return groups;
          }, {} as Record<string, any[]>);

          // Convert to array and sort by date (newest first)
          const groupedReportsArray = Object.entries(groupedReports)
            .map(([dateKey, reports]) => ({
              dateKey,
              date: reports[0].sessionDate || reports[0].SessionDate || reports[0].createdDate || reports[0].CreatedDate,
              reports: reports.sort((a, b) => {
                const dateA = new Date(a.createdDate || a.CreatedDate).getTime();
                const dateB = new Date(b.createdDate || b.CreatedDate).getTime();
                return dateB - dateA;
              })
            }))
            .sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return dateB - dateA;
            });

          // Calculate pagination
          const totalPages = Math.ceil(groupedReportsArray.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedReports = groupedReportsArray.slice(startIndex, endIndex);

          return (
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 hover-lift transition-all duration-300">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Daily Reports</h3>
                      <p className="text-sm text-gray-600 mt-1">Track your child's learning progress</p>
                    </div>
                  </div>
                  {/* Date Range Filter */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        placeholder="From Date"
                        className="w-full pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-white"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        placeholder="To Date"
                        className="w-full pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setDateFrom('');
                          setDateTo('');
                        }}
                        className="w-full px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
                {loadingDailyReports ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading daily reports...</p>
                  </div>
                ) : groupedReportsArray.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h4>
                    <p className="text-gray-600">Daily reports will appear here once the tutor starts creating them</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-200">
                      {paginatedReports.map(({ dateKey, date, reports: dayReports }: any) => {
                      const isExpanded = expandedReportId === dateKey;
                      return (
                        <div key={dateKey} className="p-6">
                          <div 
                            className="cursor-pointer"
                            onClick={() => setExpandedReportId(isExpanded ? null : dateKey)}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {new Date(date).toLocaleDateString()}
                                  </h4>
                                  {dayReports.length > 1 && (
                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                      {dayReports.length} reports
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                            <div className="ml-16 space-y-2">
                              {dayReports.map((report, index) => (
                                <div key={report.reportId || report.ReportId || index} className="flex items-center space-x-3">
                                  <p className="text-sm text-gray-600">
                                    {report.unitName || 'No unit specified'}
                                  </p>
                                  {(report.childName || report.ChildName) && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <p className="text-xs text-gray-500">
                                        {report.childName || report.ChildName}
                                      </p>
                                    </>
                                  )}
                                  {report.onTrack || report.OnTrack ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      On Track
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Off Track
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                {dayReports.map((report, index) => (
                                  <div key={report.reportId || report.ReportId || index} className="bg-gray-50 rounded-lg p-4">
                                    <div className="space-y-3">
                                      {(report.childName || report.ChildName) && (
                                        <div className="flex items-center space-x-2 text-sm">
                                          <User className="w-4 h-4 text-purple-500" />
                                          <span className="text-gray-600">Student:</span>
                                          <span className="font-medium text-gray-900">{report.childName || report.ChildName}</span>
                                        </div>
                                      )}
                                      {(report.tutorName || report.TutorName) && (
                                        <div className="flex items-center space-x-2 text-sm">
                                          <User className="w-4 h-4 text-gray-400" />
                                          <span className="text-gray-600">Tutor:</span>
                                          <span className="font-medium text-gray-900">{report.tutorName || report.TutorName}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-2 text-sm">
                                        <BookOpen className="w-4 h-4 text-purple-500" />
                                        <span className="text-gray-600">Unit:</span>
                                        <span className="font-medium text-gray-900">{report.unitName || 'No unit specified'}</span>
                                      </div>
                                      {(report.haveHomework || report.HaveHomework) && (
                                        <div className="flex items-center space-x-2 text-sm">
                                          <BookOpen className="w-4 h-4 text-blue-600" />
                                          <span className="font-medium text-blue-600">Has Homework</span>
                                        </div>
                                      )}
                                      {(report.notes || report.Notes) && (
                                        <div className="mt-3 p-3 bg-white rounded-lg">
                                          <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                            <Latex delimiters={[
                                              { left: '$$', right: '$$', display: true },
                                              { left: '$', right: '$', display: false },
                                              { left: '\\(', right: '\\)', display: false },
                                              { left: '\\[', right: '\\]', display: true },
                                            ]}>
                                              {report.notes || report.Notes}
                                            </Latex>
                                          </div>
                                        </div>
                                      )}
                                      {/* URL section hidden for parent view */}
                                      {/* {(report.url || report.Url) && (
                                        <div className="mt-3 p-3 bg-white rounded-lg">
                                          <p className="text-sm font-medium text-gray-700 mb-1">URL:</p>
                                          <a
                                            href={report.url || report.Url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium break-all"
                                          >
                                            {removeIdFromUrl(report.url || report.Url)}
                                          </a>
                                        </div>
                                      )} */}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 px-6">
                        <div className="text-sm text-gray-600">
                          Showing {startIndex + 1} to {Math.min(endIndex, groupedReportsArray.length)} of {groupedReportsArray.length} reports
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
                              // Show only 5 page numbers
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
                                  className={`px-3 py-2 min-w-[2.5rem] rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === page
                                      ? 'bg-primary text-white hover:bg-primary-dark'
                                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'curriculum' && (
          <div className="space-y-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                Curriculum
              </h3>
              <div className="space-y-4 text-gray-700">
                {loadingUnits ? (
                  <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600">Loading curriculum details...</span>
                  </div>
                ) : units.length > 0 ? (
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 mb-2">Units ({units.length})</h4>
                      {contract?.status === 'completed' && !unitProgress && !loadingUnitProgress && (
                        <span className="text-xs text-gray-500 italic">
                          Progress data not available
                        </span>
                      )}
                      {loadingUnitProgress && (
                        <span className="text-xs text-gray-500">
                          Loading progress...
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {units.map((unit: any, idx: number) => {
                        const unitId = unit.unitId || unit.UnitId || idx.toString();
                        const isExpanded = expandedUnitId === unitId;
                        const mathConcepts = unit.mathConcepts || unit.MathConcepts || [];
                        const hasMathConcepts = Array.isArray(mathConcepts) && mathConcepts.length > 0;
                        
                        // Find progress for this unit
                        const unitProgressData = unitProgress?.unitsProgress?.find(
                          (up: any) => (up.unitId || up.UnitId) === unitId
                        );
                        const isCompleted = unitProgressData?.isCompleted || false;
                        const timesLearned = unitProgressData?.timesLearned || 0;
                        const hasProgress = timesLearned > 0;
                        
                        return (
                          <div 
                            key={unitId} 
                            className={`rounded-lg border overflow-hidden transition-all ${
                              isCompleted 
                                ? 'bg-emerald-50 border-emerald-200' 
                                : hasProgress 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div 
                              className={`p-4 cursor-pointer transition-all hover:bg-opacity-80 ${isExpanded ? 'bg-opacity-80' : ''}`}
                              onClick={() => setExpandedUnitId(isExpanded ? null : unitId)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isCompleted 
                                    ? 'bg-emerald-500 text-white' 
                                    : hasProgress 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                  <span className="font-semibold text-sm">{idx + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <p className="font-medium text-gray-900">
                                        {unit.unitName || unit.UnitName || `Unit ${idx + 1}`}
                                      </p>
                                      {isCompleted && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500 text-white">
                                          <Award className="w-3 h-3 mr-1" />
                                          Completed
                                        </span>
                                      )}
                                      {hasProgress && !isCompleted && (
                                        <span className="text-xs text-blue-600 font-medium">
                                          In Progress
                                        </span>
                                      )}
                                    </div>
                                    {hasMathConcepts && (
                                      <span className="text-xs text-primary font-medium">
                                        {mathConcepts.length} MathConcept{mathConcepts.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  {(unit.unitDescription || unit.UnitDescription || unit.description || unit.Description) && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {unit.unitDescription || unit.UnitDescription || unit.description || unit.Description}
                                    </p>
                                  )}
                                  {hasProgress && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Practiced {timesLearned} {timesLearned === 1 ? 'time' : 'times'}
                                      {unitProgressData?.lastLearnedDate && (
                                        <span className="ml-2">
                                          • Last: {new Date(unitProgressData.lastLearnedDate).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                {hasMathConcepts && (
                                  <ChevronDown 
                                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'transform rotate-180' : ''}`}
                                  />
                                )}
                              </div>
                            </div>
                            
                            {isExpanded && hasMathConcepts && (
                              <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
                                <h6 className="text-sm font-semibold text-gray-700 mb-3">MathConcepts:</h6>
                                <div className="space-y-2">
                                  {mathConcepts.map((concept: any, conceptIdx: number) => (
                                    <div 
                                      key={concept.conceptId || concept.ConceptId || conceptIdx}
                                      className="bg-white rounded-lg p-3 border border-gray-200"
                                    >
                                      <div className="flex items-start gap-2">
                                        <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 text-sm">
                                            {concept.name || concept.Name || 'Unnamed Concept'}
                                          </p>
                                          {concept.category && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              Category: {concept.category || concept.Category}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {isExpanded && !hasMathConcepts && (
                              <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
                                <p className="text-sm text-gray-500 italic">No MathConcepts available for this unit.</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-500 italic">
                      Curriculum details are not available for this contract.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="space-y-8">
            {loadingSessions ? (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tutor information...</p>
                </div>
            ) : (
              <div className="space-y-8">
                {(() => {
                  // Helper function to render tutor card
                  const renderTutorCard = (tutorData: any, index: number) => {
                    const tutorInfo = tutorData.info || {};
                    const tutorVerification = tutorData.verification || {};
                    const isMainTutor = tutorData.type === 'main';
                    const isSubstitute = tutorData.type === 'substitute1' || tutorData.type === 'substitute2';
                    
                    // Get tutor info from various sources
                    const tutorName = tutorData.name || tutorInfo.fullName || tutorInfo.FullName || contract.tutorName || 'Unknown Tutor';
                    const tutorEmail = tutorInfo.email || tutorInfo.Email || (isMainTutor ? contract.tutorEmail : '');
                    const tutorPhone = tutorInfo.phoneNumber || tutorInfo.phone || tutorInfo.PhoneNumber || tutorInfo.Phone || (isMainTutor ? contract.tutorPhone : '');
                    const tutorAddress = tutorVerification.formattedAddress || tutorInfo.formattedAddress || tutorInfo.address || '';
                    const tutorAvatarUrl = tutorInfo.avatarUrl || tutorInfo.AvatarUrl || (isMainTutor ? contract.tutorAvatarUrl : undefined);
                    
                    // Count sessions taught by this tutor
                    const sessionsTaught = sessions.filter((s: ApiSession) => 
                      s.status === 'completed' && s.tutorName?.toLowerCase() === tutorName.toLowerCase()
                    ).length;
                    
                    // Get feedbacks for this tutor
                    const tutorFeedbacks = tutorData.id ? (tutorFeedbacksMap.get(tutorData.id) || []) : [];
                    const isLoadingFeedbacks = tutorData.id ? (loadingTutorFeedbacksMap.get(tutorData.id) || false) : false;
                    
                    // Calculate ratings
                    const totalReviews = tutorFeedbacks.length;
                    const avgOverall = totalReviews > 0 ? tutorFeedbacks.reduce((sum, f) => sum + (f.overallSatisfactionRating || 0), 0) / totalReviews : 0;
                    const avgCommunication = tutorFeedbacks.filter(f => f.communicationRating).length > 0
                      ? tutorFeedbacks.reduce((sum, f) => sum + (f.communicationRating || 0), 0) / tutorFeedbacks.filter(f => f.communicationRating).length : 0;
                    const avgSessionQuality = tutorFeedbacks.filter(f => f.sessionQualityRating).length > 0
                      ? tutorFeedbacks.reduce((sum, f) => sum + (f.sessionQualityRating || 0), 0) / tutorFeedbacks.filter(f => f.sessionQualityRating).length : 0;
                    const avgLearningProgress = tutorFeedbacks.filter(f => f.learningProgressRating).length > 0
                      ? tutorFeedbacks.reduce((sum, f) => sum + (f.learningProgressRating || 0), 0) / tutorFeedbacks.filter(f => f.learningProgressRating).length : 0;
                    const avgProfessionalism = tutorFeedbacks.filter(f => f.professionalismRating).length > 0
                      ? tutorFeedbacks.reduce((sum, f) => sum + (f.professionalismRating || 0), 0) / tutorFeedbacks.filter(f => f.professionalismRating).length : 0;
                    const wouldRecommendCount = tutorFeedbacks.filter(f => f.wouldRecommend).length;
                    const recommendPercentage = totalReviews > 0 ? (wouldRecommendCount / totalReviews) * 100 : 0;
                    
                    return (
                      <div key={`${tutorData.id || tutorName}-${index}`} className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover-lift transition-all duration-300">
                        {/* Header with Avatar */}
                        <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 relative ${
                            isMainTutor ? 'bg-gradient-to-br from-purple-400 to-indigo-500' : 
                            isSubstitute ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 
                            'bg-gradient-to-br from-blue-400 to-cyan-500'
                          }`}>
                            {tutorAvatarUrl ? (
                              <>
                                <img 
                                  src={tutorAvatarUrl} 
                                  alt={tutorName} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const icon = target.nextElementSibling as HTMLElement;
                                    if (icon) icon.style.display = 'flex';
                                  }}
                                />
                                <User className="w-8 h-8 text-white hidden" />
                              </>
                    ) : (
                              <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {isMainTutor ? 'Main Tutor' : isSubstitute ? `Substitute Tutor ${tutorData.type === 'substitute1' ? '1' : '2'}` : 'Tutor'}
                              </h3>
                            </div>
                            <p className="text-sm font-bold text-gray-900 truncate">{tutorName}</p>
                            {sessionsTaught > 0 && (
                              <p className="text-xs text-gray-500 mt-1">{sessionsTaught} session{sessionsTaught > 1 ? 's' : ''} taught</p>
                            )}
                            {tutorVerification && tutorVerification.university && (
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                <Award className="w-3 h-3 inline mr-1" />
                                {tutorVerification.university}
                                {tutorVerification.major && ` - ${tutorVerification.major}`}
                    </p>
                  )}
                </div>
                        </div>
                        
                        <div className="space-y-5">
                          {/* Contact Information */}
                          {tutorEmail && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                              <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                                <p className="text-base text-gray-900 break-all">{tutorEmail}</p>
                    </div>
                  </div>
                )}
                          {tutorPhone && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                              <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Phone Number</p>
                                <p className="text-base text-gray-900">{tutorPhone}</p>
                    </div>
                  </div>
                )}
                          {tutorAddress && (
                  <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 ${isMainTutor ? 'bg-purple-100' : isSubstitute ? 'bg-green-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <MapPin className={`w-5 h-5 ${isMainTutor ? 'text-purple-600' : isSubstitute ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                              <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Address</p>
                                <p className="text-base text-gray-900">{tutorAddress}</p>
                    </div>
                  </div>
                )}
                          
                          {/* Tutor Rating Section */}
                          {tutorData.id && (
                            <div className="pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-900 mb-4">Tutor Rating</h4>
                              {isLoadingFeedbacks ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                              ) : totalReviews > 0 ? (
                                <div className="space-y-4">
                                  {/* Overall Rating */}
                                  <div className="text-center pb-4 border-b border-gray-200">
                                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                              i < Math.floor(avgOverall)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                                      <span className="text-xl font-bold text-gray-900">{avgOverall.toFixed(1)}</span>
                      </div>
                                    <p className="text-xs text-gray-600">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                                    {recommendPercentage > 0 && (
                                      <p className="text-xs text-green-600 mt-1">{recommendPercentage.toFixed(0)}% would recommend</p>
                )}
            </div>

                                  {/* Individual Rating Breakdown */}
                                  {(avgCommunication > 0 || avgSessionQuality > 0 || avgLearningProgress > 0 || avgProfessionalism > 0) && (
                                    <div className="space-y-2">
                                      {avgCommunication > 0 && (
                    <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600">Communication</span>
                                            <span className="text-xs font-semibold text-gray-900">{avgCommunication.toFixed(1)}</span>
                    </div>
                                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                              className="bg-blue-600 h-1.5 rounded-full" 
                                              style={{ width: `${(avgCommunication / 5) * 100}%` }}
                                            ></div>
                  </div>
                    </div>
                                      )}
                                      {avgSessionQuality > 0 && (
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600">Session Quality</span>
                                            <span className="text-xs font-semibold text-gray-900">{avgSessionQuality.toFixed(1)}</span>
                        </div>
                                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                              className="bg-purple-600 h-1.5 rounded-full" 
                                              style={{ width: `${(avgSessionQuality / 5) * 100}%` }}
                                            ></div>
                        </div>
                      </div>
                    )}
                                      {avgLearningProgress > 0 && (
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600">Learning Progress</span>
                                            <span className="text-xs font-semibold text-gray-900">{avgLearningProgress.toFixed(1)}</span>
                        </div>
                                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                              className="bg-green-600 h-1.5 rounded-full" 
                                              style={{ width: `${(avgLearningProgress / 5) * 100}%` }}
                                            ></div>
                        </div>
                      </div>
                    )}
                                      {avgProfessionalism > 0 && (
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600">Professionalism</span>
                                            <span className="text-xs font-semibold text-gray-900">{avgProfessionalism.toFixed(1)}</span>
                        </div>
                                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                              className="bg-indigo-600 h-1.5 rounded-full" 
                                              style={{ width: `${(avgProfessionalism / 5) * 100}%` }}
                                            ></div>
                        </div>
                      </div>
                    )}
                  </div>
                                  )}

                                  {/* Recent Reviews Carousel */}
                                  {(() => {
                                    const validFeedbacks = tutorFeedbacks.filter(f => f.feedbackText || f.additionalComments);
                                    if (validFeedbacks.length === 0) return null;
                                    
                                    const tutorId = tutorData.id || '';
                                    const currentIndex = currentReviewIndexMap.get(tutorId) || 0;
                                    const currentFeedback = validFeedbacks[currentIndex];
                                    const totalReviews = validFeedbacks.length;
                                    const comment = currentFeedback.feedbackText || currentFeedback.additionalComments;
                                    
                                    return (
                                      <div className="pt-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="text-xs font-semibold text-gray-900">Recent Reviews</h5>
                                          <span className="text-xs text-gray-500">
                                            {currentIndex + 1} / {totalReviews}
                                          </span>
                                        </div>
                                        
                                        <div className="relative flex items-center gap-2">
                                          {/* Previous Button */}
                                          {totalReviews > 1 && (
                                            <button
                                              onClick={() => {
                                                const newIndex = currentIndex === 0 ? totalReviews - 1 : currentIndex - 1;
                                                setCurrentReviewIndexMap(prev => {
                                                  const newMap = new Map(prev);
                                                  newMap.set(tutorId, newIndex);
                                                  return newMap;
                                                });
                                              }}
                                              className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                                              aria-label="Previous review"
                                            >
                                              <ChevronLeft className="w-4 h-4" />
                                            </button>
                                          )}
                                          
                                          {/* Review Card */}
                                          <div className="flex-1 bg-gray-50 p-3 rounded-lg min-h-[80px]">
                                            <div className="flex items-center space-x-2 mb-1">
                                              <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                  <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${
                                                      i < Math.floor(currentFeedback.overallSatisfactionRating)
                                                        ? 'text-yellow-400 fill-current'
                                                        : 'text-gray-300'
                                                    }`}
                                                  />
                                                ))}
                                              </div>
                                              <span className="text-xs text-gray-700 font-medium">
                                                {currentFeedback.userFullName || 'Anonymous'}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-700">{comment}</p>
                                          </div>
                                          
                                          {/* Next Button */}
                                          {totalReviews > 1 && (
                                            <button
                                              onClick={() => {
                                                const newIndex = currentIndex === totalReviews - 1 ? 0 : currentIndex + 1;
                                                setCurrentReviewIndexMap(prev => {
                                                  const newMap = new Map(prev);
                                                  newMap.set(tutorId, newIndex);
                                                  return newMap;
                                                });
                                              }}
                                              className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                                              aria-label="Next review"
                                            >
                                              <ChevronRight className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                        </div>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-xs text-gray-500">No reviews yet</p>
                      </div>
                    )}
                        </div>
                          )}
                        </div>
                      </div>
                    );
                  };

                  // Get tutors directly from raw contract data
                  const contractData = contractRawData || contract as any;
                  const mainTutorId = contractData?.MainTutorId || contractData?.mainTutorId || contractData?.main_tutor_id;
                  const mainTutorName = contract?.tutorName || contractData?.MainTutorName || contractData?.mainTutorName || mainTutorInfo?.fullName || mainTutorInfo?.FullName || mainTutorInfo?.name;
                  
                  const substituteTutor1Id = contractData?.substitute_tutor1_id || contractData?.substituteTutor1Id || contractData?.SubstituteTutor1Id;
                  const substituteTutor1Name = contractData?.substitute_tutor1_name || contractData?.substituteTutor1Name || contractData?.SubstituteTutor1Name || substituteTutor1Info?.fullName || substituteTutor1Info?.FullName || substituteTutor1Info?.name;
                  
                  const substituteTutor2Id = contractData?.substitute_tutor2_id || contractData?.substituteTutor2Id || contractData?.SubstituteTutor2Id;
                  const substituteTutor2Name = contractData?.substitute_tutor2_name || contractData?.substituteTutor2Name || contractData?.SubstituteTutor2Name || substituteTutor2Info?.fullName || substituteTutor2Info?.FullName || substituteTutor2Info?.name;
                  
                  // Create tutors list
                  const tutorsList: any[] = [];
                  
                  // Add main tutor - only need ID, name can be from info
                  if (mainTutorId) {
                    tutorsList.push({
                      id: mainTutorId,
                      name: mainTutorName || mainTutorInfo?.fullName || mainTutorInfo?.FullName || mainTutorInfo?.name || 'Main Tutor',
                      type: 'main',
                      info: mainTutorInfo,
                      verification: mainTutorVerification,
                    });
                  }
                  
                  // Add substitute tutor 1
                  if (substituteTutor1Id) {
                    tutorsList.push({
                      id: substituteTutor1Id,
                      name: substituteTutor1Name || substituteTutor1Info?.fullName || substituteTutor1Info?.FullName || 'Substitute Tutor 1',
                      type: 'substitute1',
                      info: substituteTutor1Info || null,
                      verification: substituteTutor1Verification || null,
                    });
                  }
                  
                  // Add substitute tutor 2
                  if (substituteTutor2Id) {
                    tutorsList.push({
                      id: substituteTutor2Id,
                      name: substituteTutor2Name || substituteTutor2Info?.fullName || substituteTutor2Info?.FullName || 'Substitute Tutor 2',
                      type: 'substitute2',
                      info: substituteTutor2Info || null,
                      verification: substituteTutor2Verification || null,
                    });
                  }
                  
                  const mainTutor = tutorsList.find(t => t.type === 'main');
                  const substituteTutors = tutorsList.filter(t => t.type === 'substitute1' || t.type === 'substitute2');
                  
                  if (tutorsList.length === 0) {
                    return (
                      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12 text-center">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">No Tutor Information</h4>
                        <p className="text-gray-600">No tutor information available for this contract</p>
                        </div>
                    );
                  }
                  
                  return (
                    <>
                      {/* Main Tutor Section */}
                      {mainTutor && (
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-6">Main Tutor</h2>
                          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                            {renderTutorCard(mainTutor, 0)}
                        </div>
                      </div>
                    )}
                      
                      {/* Substitute Tutors Section */}
                      {substituteTutors.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-6">Substitute Tutors</h2>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {substituteTutors.map((tutor, index) => renderTutorCard(tutor, index))}
                  </div>
                </div>
                      )}
                    </>
                  );
            })()}
              </div>
            )}
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
    </>
  );
};

export default ContractDetail;

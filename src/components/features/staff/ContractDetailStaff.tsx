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
  UserPlus,
  Edit,
  Mail,
  Phone,
  Building,
  BookOpen,
  Award,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  Monitor,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContractById, Contract, updateContractStatus, assignTutorToContract, getAvailableTutors, Tutor, apiService, getFinalFeedbackByContractAndProvider, FinalFeedback, getDailyReportsByChild, getDailyReportsByContractId, getSessionsByContractId, updateSessionTutor, changeSessionTutor, getReplacementTutors, Session, getMainTutorReplacementPlan, replaceMainTutor } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import { removeIdFromUrl } from '../../../utils/urlUtils';
import { useHideIdInUrl } from '../../../hooks/useHideIdInUrl';

interface ContractDetailStaffProps {
  hideBackButton?: boolean;
}

const ContractDetailStaff: React.FC<ContractDetailStaffProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const { id: contractId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  useHideIdInUrl(); // Hide ID in URL bar
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'management' | 'tutors' | 'sessions' | 'dailyReports'>('overview');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Tutor assignment states
  const [showAssignTutorModal, setShowAssignTutorModal] = useState(false);
  const [availableTutors, setAvailableTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [selectedMainTutor, setSelectedMainTutor] = useState<Tutor | null>(null);
  const [selectedSubstituteTutor1, setSelectedSubstituteTutor1] = useState<Tutor | null>(null);
  const [selectedSubstituteTutor2, setSelectedSubstituteTutor2] = useState<Tutor | null>(null);

  // Parent and child info
  const [parentInfo, setParentInfo] = useState<any>(null);
  const [childInfo, setChildInfo] = useState<any>(null);
  const [mainTutorInfo, setMainTutorInfo] = useState<any>(null);
  const [substituteTutor1Info, setSubstituteTutor1Info] = useState<any>(null);
  const [substituteTutor2Info, setSubstituteTutor2Info] = useState<any>(null);
  
  // Feedback states
  const [parentFeedback, setParentFeedback] = useState<FinalFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  // Daily reports states
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  
  // Tutor sorting options
  const [sortByRating, setSortByRating] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  
  // Sessions states
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedNewTutorId, setSelectedNewTutorId] = useState<string>('');
  const [reassigning, setReassigning] = useState(false);
  const [replacementTutors, setReplacementTutors] = useState<any[]>([]);
  const [loadingReplacementTutors, setLoadingReplacementTutors] = useState(false);

  // Main tutor replacement states
  const [showReplacementPlanModal, setShowReplacementPlanModal] = useState(false);
  const [replacementPlan, setReplacementPlan] = useState<any>(null);
  const [loadingReplacementPlan, setLoadingReplacementPlan] = useState(false);
  const [executingReplacement, setExecutingReplacement] = useState(false);
  const [mainTutorStatus, setMainTutorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      fetchContractDetails();
    }
  }, [contractId]);

  // Fetch sessions when switching to sessions tab
  useEffect(() => {
    const fetchSessions = async () => {
      if (!contractId || activeTab !== 'sessions') return;
      
      try {
        setLoadingSessions(true);
        const result = await getSessionsByContractId(contractId);
        if (result.success && result.data) {
          // Sort by session date and time
          const sorted = [...result.data].sort((a, b) => {
            const dateA = new Date(`${a.sessionDate}T${a.startTime}`).getTime();
            const dateB = new Date(`${b.sessionDate}T${b.startTime}`).getTime();
            return dateA - dateB;
          });
          setSessions(sorted);
        } else {
          setSessions([]);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };

    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [contractId, activeTab]);

  // Fetch daily reports when switching to daily reports tab
  useEffect(() => {
    const fetchDailyReports = async () => {
      if (!contractId) return;
      
      try {
        setLoadingDailyReports(true);
        // Use contract-specific endpoint to get only reports for this contract
        const reportsResult = await getDailyReportsByContractId(contractId);
        if (reportsResult.success && reportsResult.data) {
          // Sort by date descending
          const sorted = [...reportsResult.data].sort((a, b) => {
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
  }, [contractId, activeTab]);

  const fetchContractDetails = async () => {
    if (!contractId) {
      setError('Contract ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getContractById(contractId);
      if (result.success && result.data) {
        const contractData = result.data;
        setContract(contractData);

        // Debug: Log contract data to see available fields
        if (import.meta.env.DEV) {
          console.log('Contract Data:', contractData);
          console.log('Available keys:', Object.keys(contractData));
          // Check if there's a nested Child object with parent info
          if ((contractData as any).Child) {
            console.log('Child object:', (contractData as any).Child);
            console.log('Child keys:', Object.keys((contractData as any).Child));
          }
        }

        // Try to fetch additional info, but handle errors gracefully
        // Staff may not have access to user endpoints, so we'll use contract data as fallback
        
        // Fetch child info - use contract data directly (children are not in user table)
        // Contract data already has child name, so we don't need to fetch from users API
        if (contractData.childName) {
          setChildInfo({ fullName: contractData.childName, FullName: contractData.childName });
        }

        // Fetch parent info - contract data includes parentId directly
        const parentId = (contractData as any).parentId || 
                        (contractData as any).ParentId || 
                        (contractData as any).parent_id;
        const parentName = (contractData as any).parentName || 
                          (contractData as any).ParentName || 
                          (contractData as any).parent_name;
        
        if (import.meta.env.DEV) {
          console.log('Parent ID from contract:', parentId);
          console.log('Parent Name from contract:', parentName);
        }
        
        if (parentId) {
          try {
            const parentResult = await apiService.getUserById(parentId);
            if (parentResult.success && parentResult.data) {
              setParentInfo(parentResult.data);
            } else {
              // Use contract data as fallback if available
              const parentName = (contractData as any).parentName || 
                                (contractData as any).ParentName || 
                                (contractData as any).parent_name;
              if (parentName) {
                setParentInfo({ fullName: parentName, FullName: parentName });
              }
            }
          } catch (err: any) {
            // Silently handle unauthorized/404 errors - use contract data instead
            if (err?.response?.status !== 500 && err?.response?.status !== 401 && err?.response?.status !== 404) {
              if (import.meta.env.DEV) {
                console.warn('Error fetching parent info:', err);
              }
            }
            // Use contract data as fallback if available
            const parentName = (contractData as any).parentName || 
                              (contractData as any).ParentName || 
                              (contractData as any).parent_name;
            if (parentName) {
              setParentInfo({ fullName: parentName, FullName: parentName });
            }
          }
        } else {
          // If no parent ID found, try to use parent name from contract data as fallback
          const parentName = (contractData as any).parentName || 
                            (contractData as any).ParentName || 
                            (contractData as any).parent_name;
          if (parentName) {
            setParentInfo({ fullName: parentName, FullName: parentName });
          }
        }

        // Fetch main tutor info - use contract data if API fails
        if (contractData.mainTutorId) {
          try {
            const tutorResult = await apiService.getUserById(contractData.mainTutorId);
            if (tutorResult.success && tutorResult.data) {
              setMainTutorInfo(tutorResult.data);
              // Check if main tutor is banned or inactive
              if (tutorResult.data.status === 'banned' || tutorResult.data.status === 'inactive') {
                setMainTutorStatus(tutorResult.data.status);
              } else {
                setMainTutorStatus(null);
              }
            } else {
              // Use contract data as fallback
              if (contractData.mainTutorName) {
                setMainTutorInfo({ 
                  fullName: contractData.mainTutorName, 
                  FullName: contractData.mainTutorName,
                  email: contractData.mainTutorEmail || contractData.MainTutorEmail,
                  phone: contractData.mainTutorPhone || contractData.MainTutorPhone
                });
              }
              setMainTutorStatus(null);
            }
          } catch (err: any) {
            // Silently handle unauthorized/404 errors - use contract data instead
            if (err?.response?.status !== 500 && err?.response?.status !== 401 && err?.response?.status !== 404) {
              if (import.meta.env.DEV) {
                console.warn('Error fetching tutor info:', err);
              }
            }
            // Use contract data as fallback
            if (contractData.mainTutorName) {
              setMainTutorInfo({ 
                fullName: contractData.mainTutorName, 
                FullName: contractData.mainTutorName,
                email: contractData.mainTutorEmail || contractData.MainTutorEmail,
                phone: contractData.mainTutorPhone || contractData.MainTutorPhone
              });
            }
            setMainTutorStatus(null);
          }
        }

        // Fetch substitute tutor 1 info - use contract data if API fails
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
            // Silently handle unauthorized/404 errors - use contract data instead
            if (err?.response?.status !== 500 && err?.response?.status !== 401 && err?.response?.status !== 404) {
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

        // Fetch substitute tutor 2 info - use contract data if API fails
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
            // Silently handle unauthorized/404 errors - use contract data instead
            if (err?.response?.status !== 500 && err?.response?.status !== 401 && err?.response?.status !== 404) {
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

        // Fetch parent feedback if contract is completed
        if (contractData.status === 'completed' && contractId) {
          try {
            setLoadingFeedback(true);
            const feedbackResult = await getFinalFeedbackByContractAndProvider(contractId, 'parent');
            if (feedbackResult.success && feedbackResult.data) {
              setParentFeedback(feedbackResult.data);
            }
          } catch (err) {
            // Silently handle - feedback may not exist yet
            if (import.meta.env.DEV) {
              console.log('No parent feedback found');
            }
          } finally {
            setLoadingFeedback(false);
          }
        }
      } else {
        setError(result.error || 'Failed to load contract details');
      }
    } catch (err: any) {
      console.error('Error fetching contract:', err);
      setError(err.message || 'Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'completed' | 'cancelled') => {
    if (!contract) return;

    // Validate: Cannot activate contract without tutor assigned
    if (newStatus === 'active' && !contract.mainTutorId) {
      showError('Cannot activate contract. Please assign a tutor first.');
      return;
    }

    if (!window.confirm(`Are you sure you want to change status to "${newStatus}"?`)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      const result = await updateContractStatus(contract.contractId, newStatus);
      if (result.success) {
        showSuccess(`Contract status updated to ${newStatus}`);
        await fetchContractDetails();
      } else {
        showError(result.error || 'Failed to update contract status');
      }
    } catch (error: any) {
      console.error('Error updating contract status:', error);
      showError(error?.message || 'Failed to update contract status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenAssignTutor = async () => {
    if (!contract) return;
    setShowAssignTutorModal(true);
    setSelectedMainTutor(null);
    setSelectedSubstituteTutor1(null);
    setSelectedSubstituteTutor2(null);
    await fetchAvailableTutors();
  };

  const fetchAvailableTutors = async (sortRating?: boolean, sortDist?: boolean) => {
    if (!contract) return;
    try {
      setLoadingTutors(true);
      const result = await getAvailableTutors({
        contractId: contract.contractId,
        sortByRating: sortRating ?? sortByRating,
        sortByDistance: sortDist ?? sortByDistance,
      });
      if (result.success && result.data) {
        setAvailableTutors(result.data);
      } else {
        showError(result.error || 'Failed to load available tutors');
      }
    } catch (error) {
      console.error('Error fetching tutors:', error);
      showError('Failed to load available tutors');
    } finally {
      setLoadingTutors(false);
    }
  };

  const handleSelectTutorForRole = (tutor: Tutor, role: 'main' | 'substitute1' | 'substitute2') => {
    if (role === 'main') {
      setSelectedMainTutor(tutor);
    } else if (role === 'substitute1') {
      setSelectedSubstituteTutor1(tutor);
    } else if (role === 'substitute2') {
      setSelectedSubstituteTutor2(tutor);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!contract) return;

    if (!selectedMainTutor) {
      showError('Please select a main tutor');
      return;
    }

    if (!selectedSubstituteTutor1) {
      showError('Please select substitute tutor 1');
      return;
    }

    if (!selectedSubstituteTutor2) {
      showError('Please select substitute tutor 2');
      return;
    }

    // Validate all tutors are different
    if (selectedMainTutor.userId === selectedSubstituteTutor1.userId ||
        selectedMainTutor.userId === selectedSubstituteTutor2.userId ||
        selectedSubstituteTutor1.userId === selectedSubstituteTutor2.userId) {
      showError('All tutors must be different');
      return;
    }

    try {
      setLoadingTutors(true);
      const result = await assignTutorToContract(
        contract.contractId,
        selectedMainTutor.userId,
        selectedSubstituteTutor1.userId,
        selectedSubstituteTutor2.userId
      );
      if (result.success) {
        showSuccess('Tutors assigned successfully');
        setShowAssignTutorModal(false);
        setSelectedMainTutor(null);
        setSelectedSubstituteTutor1(null);
        setSelectedSubstituteTutor2(null);
        await fetchContractDetails();
      } else {
        showError(result.error || 'Failed to assign tutors');
      }
    } catch (error: any) {
      console.error('Error assigning tutors:', error);
      showError(error?.message || 'Failed to assign tutors');
    } finally {
      setLoadingTutors(false);
    }
  };

  const handleReassignSession = (session: Session) => {
    setSelectedSession(session);
    setShowReassignModal(true);
    setSelectedNewTutorId('');
  };

  const handleConfirmReassign = async () => {
    if (!selectedSession || !selectedNewTutorId) {
      showError('Please select a tutor');
      return;
    }

    try {
      setReassigning(true);
      // Use changeSessionTutor API (new endpoint)
      const result = await changeSessionTutor(selectedSession.bookingId, selectedNewTutorId);
      if (result.success) {
        showSuccess(result.data?.message || 'Session tutor changed successfully');
        setShowReassignModal(false);
        setSelectedSession(null);
        setSelectedNewTutorId('');
        setReplacementTutors([]);
        // Refresh sessions
        if (contractId && activeTab === 'sessions') {
          const sessionsResult = await getSessionsByContractId(contractId);
          if (sessionsResult.success && sessionsResult.data) {
            const sorted = [...sessionsResult.data].sort((a, b) => {
              const dateA = new Date(`${a.sessionDate}T${a.startTime}`).getTime();
              const dateB = new Date(`${b.sessionDate}T${b.startTime}`).getTime();
              return dateA - dateB;
            });
            setSessions(sorted);
          }
        }
      } else {
        showError(result.error || 'Failed to change session tutor');
      }
    } catch (error: any) {
      console.error('Error reassigning session:', error);
      showError(error?.message || 'Failed to change session tutor');
    } finally {
      setReassigning(false);
    }
  };

  const handleReassignMainTutor = async () => {
    if (!contractId || !contract) return;

    try {
      setLoadingReplacementPlan(true);
      const result = await getMainTutorReplacementPlan(contractId);
      if (result.success && result.data) {
        setReplacementPlan(result.data);
        setShowReplacementPlanModal(true);
      } else {
        showError(result.error || 'Failed to fetch replacement plan');
      }
    } catch (error: any) {
      console.error('Error fetching replacement plan:', error);
      showError(error?.message || 'Failed to fetch replacement plan');
    } finally {
      setLoadingReplacementPlan(false);
    }
  };

  const handleConfirmMainTutorReplacement = async () => {
    if (!contractId || !replacementPlan || !replacementPlan.recommendedPlan) {
      showError('Replacement plan is not available');
      return;
    }

    const { newMainTutorId, newSubstituteTutorId } = replacementPlan.recommendedPlan;
    if (!newMainTutorId || !newSubstituteTutorId) {
      showError('Invalid replacement plan');
      return;
    }

    try {
      setExecutingReplacement(true);
      const result = await replaceMainTutor(contractId, newMainTutorId, newSubstituteTutorId);
      if (result.success) {
        showSuccess('Main tutor replaced successfully');
        setShowReplacementPlanModal(false);
        setReplacementPlan(null);
        // Refresh contract details
        await fetchContractDetails();
        // Refresh sessions if on sessions tab
        if (activeTab === 'sessions' && contractId) {
          const sessionsResult = await getSessionsByContractId(contractId);
          if (sessionsResult.success && sessionsResult.data) {
            const sorted = [...sessionsResult.data].sort((a, b) => {
              const dateA = new Date(`${a.sessionDate}T${a.startTime}`).getTime();
              const dateB = new Date(`${b.sessionDate}T${b.startTime}`).getTime();
              return dateA - dateB;
            });
            setSessions(sorted);
          }
        }
      } else {
        showError(result.error || 'Failed to replace main tutor');
      }
    } catch (error: any) {
      console.error('Error replacing main tutor:', error);
      showError(error?.message || 'Failed to replace main tutor');
    } finally {
      setExecutingReplacement(false);
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = String(status || '').toLowerCase().trim();
    switch (normalizedStatus) {
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
    const normalizedStatus = String(status || '').toLowerCase().trim();
    switch (normalizedStatus) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The contract you\'re looking for doesn\'t exist'}</p>
          {!hideBackButton && (
            <button
              onClick={() => navigate('/staff', { state: { view: 'contracts' } })}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Contracts
            </button>
          )}
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
              onClick={() => navigate('/staff', { state: { view: 'contracts' } })}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Contracts</span>
            </button>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{contract.packageName || 'Contract'}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="capitalize">{contract.status}</span>
              </span>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Child Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">Child</p>
                  <h2 className="text-xl font-bold text-gray-900">{contract.childName || 'N/A'}</h2>
                  {childInfo && (
                    <p className="text-sm text-gray-600 mt-1">{childInfo.grade || ''}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tutor Card */}
            <div className={`rounded-xl shadow-sm border-2 p-6 ${
              !contract.mainTutorId
                ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                  !contract.mainTutorId
                    ? 'bg-gray-400'
                    : 'bg-purple-500'
                }`}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${
                    !contract.mainTutorId
                      ? 'text-gray-600'
                      : 'text-purple-700'
                  }`}>
                    Main Tutor
                  </p>
                  <h2 className={`text-xl font-bold ${
                    !contract.mainTutorId
                      ? 'text-gray-500'
                      : 'text-gray-900'
                  }`}>
                    {contract.mainTutorName || 'Not Assigned'}
                  </h2>
                  {!contract.mainTutorId && (
                    <p className="text-sm text-gray-500 mt-1">Needs assignment</p>
                  )}
                </div>
              </div>
            </div>

            {/* Parent Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border-2 border-green-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-1">Parent</p>
                  <h2 className="text-xl font-bold text-gray-900">{parentInfo?.fullName || parentInfo?.FullName || parentInfo?.name || 'N/A'}</h2>
                  {parentInfo?.email && (
                    <p className="text-sm text-gray-600 mt-1">{parentInfo.email}</p>
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
                { key: 'management', label: 'Management', icon: Edit },
                { key: 'tutors', label: 'Tutors', icon: User },
                { key: 'sessions', label: 'Sessions', icon: Calendar },
                { key: 'dailyReports', label: 'Daily Reports', icon: Calendar },
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
            <div className="lg:col-span-2 space-y-6">
              {/* Contract Details */}
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
                      <p className="text-sm text-gray-600">Time Slot</p>
                      <p className="font-medium">{contract.timeSlot || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">
                        {contract.isOnline ? (
                          <span className="text-blue-600">Online</span>
                        ) : (
                          <span>{contract.offlineAddress || contract.centerName || 'Offline'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              {parentInfo && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{parentInfo.fullName || parentInfo.FullName || parentInfo.name || 'N/A'}</p>
                      </div>
                    </div>
                    {parentInfo.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{parentInfo.email}</p>
                        </div>
                      </div>
                    )}
                    {(parentInfo.phoneNumber || parentInfo.phone) && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{parentInfo.phoneNumber || parentInfo.phone || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {(parentInfo.formattedAddress || parentInfo.address) && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{parentInfo.formattedAddress || parentInfo.address || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Child Information */}
              {childInfo && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Child Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{childInfo.fullName || childInfo.FullName || childInfo.name || contract.childName}</p>
                      </div>
                    </div>
                    {childInfo.grade && (
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Grade</p>
                          <p className="font-medium">{childInfo.grade}</p>
                        </div>
                      </div>
                    )}
                    {childInfo.schoolName && (
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">School</p>
                          <p className="font-medium">{childInfo.schoolName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Center Information */}
              {contract.centerName && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Information</h3>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{contract.centerName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Parent Feedback Section */}
              {contract.status === 'completed' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Parent Feedback
                  </h3>
                  {loadingFeedback ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : parentFeedback ? (
                    <div className="space-y-4">
                      {/* Overall Rating */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Overall Satisfaction</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < parentFeedback.overallSatisfactionRating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {parentFeedback.overallSatisfactionRating}/5
                          </span>
                        </div>
                      </div>

                      {/* Detailed Ratings */}
                      {(parentFeedback.communicationRating || 
                        parentFeedback.sessionQualityRating || 
                        parentFeedback.learningProgressRating || 
                        parentFeedback.professionalismRating) && (
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          {parentFeedback.communicationRating && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Communication</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {parentFeedback.communicationRating}/5
                              </span>
                            </div>
                          )}
                          {parentFeedback.sessionQualityRating && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Session Quality</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {parentFeedback.sessionQualityRating}/5
                              </span>
                            </div>
                          )}
                          {parentFeedback.learningProgressRating && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Learning Progress</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {parentFeedback.learningProgressRating}/5
                              </span>
                            </div>
                          )}
                          {parentFeedback.professionalismRating && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Professionalism</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {parentFeedback.professionalismRating}/5
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comments */}
                      {parentFeedback.additionalComments && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Comments</p>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {parentFeedback.additionalComments}
                          </p>
                        </div>
                      )}

                      {/* Improvement Suggestions */}
                      {parentFeedback.improvementSuggestions && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Improvement Suggestions</p>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {parentFeedback.improvementSuggestions}
                          </p>
                        </div>
                      )}

                      {/* Recommendations */}
                      <div className="flex items-center space-x-4 pt-2 border-t border-gray-200">
                        {parentFeedback.wouldRecommend && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Would Recommend</span>
                          </div>
                        )}
                        {parentFeedback.wouldWorkTogetherAgain && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Would Work Again</span>
                          </div>
                        )}
                      </div>

                      {/* Contract Objectives Met */}
                      {parentFeedback.contractObjectivesMet !== undefined && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Contract Objectives</p>
                          <div className="flex items-center space-x-2">
                            {parentFeedback.contractObjectivesMet ? (
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
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No feedback submitted yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'management' && (
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(contract.status)}`}>
                      {contract.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Change Status</label>
                  <div className="flex flex-wrap gap-3">
                    {contract.status !== 'active' && contract.status !== 'unpaid' && (
                      <button
                        onClick={() => handleUpdateStatus('active')}
                        disabled={updatingStatus || !contract.mainTutorId}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Activate</span>
                      </button>
                    )}
                    {contract.status !== 'completed' && contract.status !== 'unpaid' && (
                      <button
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={updatingStatus || contract.status === 'pending' || contract.status === 'cancelled'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark as Completed</span>
                      </button>
                    )}
                    {contract.status !== 'cancelled' && contract.status !== 'unpaid' && (
                      <button
                        onClick={() => handleUpdateStatus('cancelled')}
                        disabled={updatingStatus}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Cancel Contract</span>
                      </button>
                    )}
                  </div>
                  {!contract.mainTutorId && contract.status !== 'active' && (
                    <p className="text-sm text-yellow-600 mt-2">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Cannot activate contract without tutor assigned
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tutor Assignment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutor Assignment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Tutor</label>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">
                        {contract.mainTutorName || 'Not Assigned'}
                      </span>
                      {mainTutorStatus && (mainTutorStatus === 'banned' || mainTutorStatus === 'inactive') && (
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            mainTutorStatus === 'banned' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {mainTutorStatus === 'banned' ? 'Banned' : 'Inactive'}
                          </span>
                        </div>
                      )}
                    </div>
                    {mainTutorStatus && (mainTutorStatus === 'banned' || mainTutorStatus === 'inactive') && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleReassignMainTutor}
                          disabled={loadingReplacementPlan}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Re-assign Main Tutor</span>
                        </button>
                      </div>
                    )}
                    {!contract.mainTutorId && (
                      <button
                        onClick={handleOpenAssignTutor}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Assign Tutor</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Sessions</h3>
                <p className="text-sm text-gray-600 mt-1">View and manage all sessions for this contract</p>
              </div>
              <div className="p-6">
                {loadingSessions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No sessions found for this contract</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => {
                      // Backend SessionDto already provides StartTime/EndTime as full ISO DateTime strings.
                      // Use them directly (same approach as TutorSessions) to avoid "Invalid Date".
                      let sessionDateTime: Date | null = null;
                      let endDateTime: Date | null = null;

                      if (session.startTime) {
                        const startMs = Date.parse(session.startTime);
                        if (!isNaN(startMs)) {
                          sessionDateTime = new Date(startMs);
                        }
                      }

                      if (session.endTime) {
                        const endMs = Date.parse(session.endTime);
                        if (!isNaN(endMs)) {
                          endDateTime = new Date(endMs);
                        }
                      }

                      // Fallback: if times are missing but sessionDate exists, at least show the date
                      if (!sessionDateTime && session.sessionDate) {
                        const dateMs = Date.parse(session.sessionDate);
                        if (!isNaN(dateMs)) {
                          sessionDateTime = new Date(dateMs);
                        }
                      }

                      const isPast = sessionDateTime ? sessionDateTime < new Date() : false;
                      const canReassign = session.status !== 'completed' && session.status !== 'cancelled';
                      
                      return (
                        <div
                          key={session.bookingId}
                          className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                            isPast ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                  {sessionDateTime ? (
                                    <>
                                      <p className="font-semibold text-gray-900">
                                        {sessionDateTime.toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        })}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {sessionDateTime.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}{' '}
                                        -{' '}
                                        {(endDateTime || sessionDateTime).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="font-semibold text-gray-900">Schedule not set</p>
                                      <p className="text-sm text-gray-600">
                                        Session date/time information is not available
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4 mt-3">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">Tutor:</span>
                                  <span className="text-sm font-medium text-gray-900">{session.tutorName || 'N/A'}</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {session.isOnline ? (
                                    <>
                                      <Monitor className="w-4 h-4 text-blue-400" />
                                      <span className="text-sm text-blue-600">Online</span>
                                    </>
                                  ) : (
                                    <>
                                      <MapPin className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-600">{session.offlineAddress || 'Offline'}</span>
                                    </>
                                  )}
                                </div>
                                
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                </span>
                              </div>
                            </div>
                            
                            {canReassign && (
                              <button
                                onClick={() => handleReassignSession(session)}
                                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                              >
                                <RefreshCw className="w-4 h-4" />
                                <span>Re-assign</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dailyReports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Daily Reports</h3>
                <p className="text-sm text-gray-600 mt-1">View learning progress reports for this contract</p>
              </div>
              {loadingDailyReports ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading daily reports...</p>
                </div>
              ) : dailyReports.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h4>
                  <p className="text-gray-600">Daily reports will appear here once tutors start creating them</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {dailyReports.map((report) => (
                    <div key={report.reportId || report.ReportId} className="p-6">
                      <div 
                        className="cursor-pointer"
                        onClick={() => setExpandedReportId(
                          expandedReportId === (report.reportId || report.ReportId) 
                            ? null 
                            : (report.reportId || report.ReportId)
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {new Date(report.createdDate || report.CreatedDate).toLocaleDateString()}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {report.unitName || 'No unit specified'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {report.onTrack || report.OnTrack ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                On Track
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-4 h-4 mr-1" />
                                Off Track
                              </span>
                            )}
                            {expandedReportId === (report.reportId || report.ReportId) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        {expandedReportId === (report.reportId || report.ReportId) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-3">
                              {(report.tutorName || report.TutorName) && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Tutor:</span>
                                  <span className="font-medium text-gray-900">{report.tutorName || report.TutorName}</span>
                                </div>
                              )}
                              {(report.haveHomework || report.HaveHomework) && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium text-blue-600">Has Homework</span>
                                </div>
                              )}
                              {(report.notes || report.Notes) && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.notes || report.Notes}</p>
                                </div>
                              )}
                              {(report.url || report.Url) && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
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
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tutors' && (
          <div className="space-y-6">
            {/* Main Tutor */}
            {contract.mainTutorId && mainTutorInfo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Main Tutor
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{contract.mainTutorName || mainTutorInfo.fullName || mainTutorInfo.FullName || 'N/A'}</p>
                    </div>
                  </div>
                  {mainTutorInfo.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{mainTutorInfo.email}</p>
                      </div>
                    </div>
                  )}
                  {(mainTutorInfo.phoneNumber || mainTutorInfo.phone) && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{mainTutorInfo.phoneNumber || mainTutorInfo.phone || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  {(mainTutorInfo.formattedAddress || mainTutorInfo.address) && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{mainTutorInfo.formattedAddress || mainTutorInfo.address || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Substitute Tutor 1 */}
            {(() => {
              const contractData = contract as any;
              const substituteTutor1Id = contractData.substitute_tutor1_id || contractData.substituteTutor1Id || contractData.SubstituteTutor1Id;
              return substituteTutor1Id ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Substitute Tutor 1
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{substituteTutor1Info?.fullName || substituteTutor1Info?.FullName || substituteTutor1Info?.name || 'N/A'}</p>
                      </div>
                    </div>
                    {(substituteTutor1Info?.email || contractData.substituteTutor1Email || contractData.SubstituteTutor1Email) && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{substituteTutor1Info?.email || contractData.substituteTutor1Email || contractData.SubstituteTutor1Email || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {(substituteTutor1Info?.phoneNumber || substituteTutor1Info?.phone || contractData.substituteTutor1Phone || contractData.SubstituteTutor1Phone) && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{substituteTutor1Info?.phoneNumber || substituteTutor1Info?.phone || contractData.substituteTutor1Phone || contractData.SubstituteTutor1Phone || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {(substituteTutor1Info?.formattedAddress || substituteTutor1Info?.address || contractData.substituteTutor1Address) && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{substituteTutor1Info?.formattedAddress || substituteTutor1Info?.address || contractData.substituteTutor1Address || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Substitute Tutor 2 */}
            {(() => {
              const contractData = contract as any;
              const substituteTutor2Id = contractData.substitute_tutor2_id || contractData.substituteTutor2Id || contractData.SubstituteTutor2Id;
              return substituteTutor2Id ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Substitute Tutor 2
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{substituteTutor2Info?.fullName || substituteTutor2Info?.FullName || substituteTutor2Info?.name || 'N/A'}</p>
                      </div>
                    </div>
                    {(substituteTutor2Info?.email || contractData.substituteTutor2Email || contractData.SubstituteTutor2Email) && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{substituteTutor2Info?.email || contractData.substituteTutor2Email || contractData.SubstituteTutor2Email || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {(substituteTutor2Info?.phoneNumber || substituteTutor2Info?.phone || contractData.substituteTutor2Phone || contractData.SubstituteTutor2Phone) && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{substituteTutor2Info?.phoneNumber || substituteTutor2Info?.phone || contractData.substituteTutor2Phone || contractData.SubstituteTutor2Phone || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {(substituteTutor2Info?.formattedAddress || substituteTutor2Info?.address || contractData.substituteTutor2Address) && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{substituteTutor2Info?.formattedAddress || substituteTutor2Info?.address || contractData.substituteTutor2Address || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            {!contract.mainTutorId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-800">No tutor assigned yet. Please assign a tutor in the Management tab.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Tutor Modal */}
      {showAssignTutorModal && contract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Assign Tutors</h2>
                  <p className="text-gray-600 mt-1 text-sm">
                    Contract: {contract.packageName} - {contract.childName}
                  </p>
                  <p className="text-red-600 mt-2 text-sm font-medium">
                    * Please select 1 main tutor and 2 substitute tutors (all must be different)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignTutorModal(false);
                    setSelectedMainTutor(null);
                    setSelectedSubstituteTutor1(null);
                    setSelectedSubstituteTutor2(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Sorting Controls */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sortByRating}
                    onChange={async (e) => {
                      const newValue = e.target.checked;
                      setSortByRating(newValue);
                      await fetchAvailableTutors(newValue, sortByDistance);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Rating</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sortByDistance}
                    onChange={async (e) => {
                      const newValue = e.target.checked;
                      setSortByDistance(newValue);
                      await fetchAvailableTutors(sortByRating, newValue);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Distance</span>
                </label>
              </div>
            </div>

            <div className="p-6">
              {loadingTutors && !availableTutors.length ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading available tutors...</p>
                </div>
              ) : availableTutors.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No available tutors found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Main Tutor Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Required</span>
                      Main Tutor
                    </h3>
                    {selectedMainTutor ? (
                      <div className="mb-3 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedMainTutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedMainTutor.email}</p>
                          </div>
                          <button
                            onClick={() => setSelectedMainTutor(null)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableTutors
                          .filter(t => 
                            t.userId !== selectedSubstituteTutor1?.userId && 
                            t.userId !== selectedSubstituteTutor2?.userId
                          )
                          .map((tutor) => (
                          <div
                            key={tutor.userId}
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                            onClick={() => handleSelectTutorForRole(tutor, 'main')}
                          >
                            <h4 className="font-semibold text-gray-900">{tutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{tutor.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Substitute Tutors */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Required</span>
                      Substitute Tutor 1
                    </h3>
                    {selectedSubstituteTutor1 ? (
                      <div className="mb-3 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedSubstituteTutor1.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedSubstituteTutor1.email}</p>
                          </div>
                          <button
                            onClick={() => setSelectedSubstituteTutor1(null)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableTutors
                          .filter(t => 
                            t.userId !== selectedMainTutor?.userId && 
                            t.userId !== selectedSubstituteTutor2?.userId
                          )
                          .map((tutor) => (
                          <div
                            key={tutor.userId}
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-green-500 hover:bg-green-50 cursor-pointer"
                            onClick={() => handleSelectTutorForRole(tutor, 'substitute1')}
                          >
                            <h4 className="font-semibold text-gray-900">{tutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{tutor.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Required</span>
                      Substitute Tutor 2
                    </h3>
                    {selectedSubstituteTutor2 ? (
                      <div className="mb-3 p-4 bg-purple-50 border-2 border-purple-500 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedSubstituteTutor2.fullName}</h4>
                            <p className="text-sm text-gray-600">{selectedSubstituteTutor2.email}</p>
                          </div>
                          <button
                            onClick={() => setSelectedSubstituteTutor2(null)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableTutors
                          .filter(t => 
                            t.userId !== selectedMainTutor?.userId && 
                            t.userId !== selectedSubstituteTutor1?.userId
                          )
                          .map((tutor) => (
                          <div
                            key={tutor.userId}
                            className="border border-gray-200 rounded-lg p-4 transition-all hover:border-purple-500 hover:bg-purple-50 cursor-pointer"
                            onClick={() => handleSelectTutorForRole(tutor, 'substitute2')}
                          >
                            <h4 className="font-semibold text-gray-900">{tutor.fullName}</h4>
                            <p className="text-sm text-gray-600">{tutor.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleConfirmAssignment}
                      disabled={loadingTutors || !selectedMainTutor || !selectedSubstituteTutor1 || !selectedSubstituteTutor2}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {loadingTutors ? 'Assigning Tutors...' : 'Confirm Assignment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Tutor Replacement Plan Modal */}
      {showReplacementPlanModal && replacementPlan && contract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Re-assign Main Tutor</h2>
                  <p className="text-gray-600 mt-1 text-sm">
                    Contract: {contract.packageName} - {replacementPlan.childName || contract.childName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReplacementPlanModal(false);
                    setReplacementPlan(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={executingReplacement}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingReplacementPlan ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading replacement plan...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Status */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">Current Main Tutor</h3>
                    </div>
                    <p className="text-sm text-red-800">
                      <span className="font-medium">{replacementPlan.bannedMainTutor}</span> is {mainTutorStatus === 'banned' ? 'banned' : 'inactive'}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {replacementPlan.remainingSessions} remaining session(s) need to be reassigned
                    </p>
                  </div>

                  {/* Replacement Plan */}
                  {replacementPlan.recommendedPlan ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-900">Recommended Replacement Plan</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Plan Type Badge */}
                          <div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              replacementPlan.recommendedPlan.planType === 'promote_substitute'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {replacementPlan.recommendedPlan.planType === 'promote_substitute' 
                                ? 'Promote Substitute Tutor' 
                                : 'External Replacement'}
                            </span>
                          </div>

                          {/* New Main Tutor */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <User className="w-4 h-4 mr-2 text-purple-600" />
                              New Main Tutor
                            </h4>
                            <p className="text-lg font-medium text-gray-900">
                              {replacementPlan.recommendedPlan.newMainTutorName}
                            </p>
                            {replacementPlan.recommendedPlan.ratingMain > 0 && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">
                                  Rating: {replacementPlan.recommendedPlan.ratingMain.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* New Substitute Tutor */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <User className="w-4 h-4 mr-2 text-green-600" />
                              New Substitute Tutor
                            </h4>
                            <p className="text-lg font-medium text-gray-900">
                              {replacementPlan.recommendedPlan.newSubstituteTutorName}
                            </p>
                            {replacementPlan.recommendedPlan.ratingSub > 0 && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">
                                  Rating: {replacementPlan.recommendedPlan.ratingSub.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {replacementPlan.message && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{replacementPlan.message}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <p className="text-yellow-800">{replacementPlan.message || 'No replacement plan available'}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowReplacementPlanModal(false);
                        setReplacementPlan(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={executingReplacement}
                    >
                      Cancel
                    </button>
                    {replacementPlan.canProceed && replacementPlan.recommendedPlan && (
                      <button
                        onClick={handleConfirmMainTutorReplacement}
                        disabled={executingReplacement}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                      >
                        {executingReplacement ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Executing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Confirm Replacement</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Re-assign Session Modal */}
      {showReassignModal && selectedSession && contract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Re-assign Session</h2>
                  <p className="text-gray-600 mt-1 text-sm">
                    Session: {new Date(`${selectedSession.sessionDate}T${selectedSession.startTime}`).toLocaleString()}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Current Tutor: {selectedSession.tutorName || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedSession(null);
                    setSelectedNewTutorId('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Tutor
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {loadingReplacementTutors 
                    ? 'Loading available tutors...' 
                    : replacementTutors.length > 0
                      ? 'Available tutors for this session (substitute tutors prioritized)'
                      : 'No available tutors found. Showing contract tutors as fallback.'}
                </p>
                
                {loadingReplacementTutors ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading replacement tutors...</p>
                  </div>
                ) : replacementTutors.length > 0 ? (
                  <div className="space-y-2">
                    {replacementTutors.map((tutor: any) => (
                      <label
                        key={tutor.tutorId}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          tutor.isSubstitute ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tutor"
                          value={tutor.tutorId}
                          checked={selectedNewTutorId === tutor.tutorId}
                          onChange={(e) => setSelectedNewTutorId(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{tutor.fullName || 'N/A'}</p>
                            {tutor.isSubstitute && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                Substitute
                              </span>
                            )}
                            {tutor.rating > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-600">{tutor.rating}</span>
                              </div>
                            )}
                          </div>
                          {tutor.email && (
                            <p className="text-sm text-gray-600">{tutor.email}</p>
                          )}
                          {tutor.phoneNumber && (
                            <p className="text-xs text-gray-500">{tutor.phoneNumber}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  // Fallback to contract tutors if no replacement tutors
                  <div className="space-y-2">
                    {contract.mainTutorId && (
                      <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="tutor"
                          value={contract.mainTutorId}
                          checked={selectedNewTutorId === contract.mainTutorId}
                          onChange={(e) => setSelectedNewTutorId(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {contract.mainTutorName || mainTutorInfo?.fullName || mainTutorInfo?.FullName || 'Main Tutor'}
                          </p>
                          <p className="text-sm text-gray-600">Main Tutor</p>
                        </div>
                      </label>
                    )}
                    
                    {(() => {
                      const contractData = contract as any;
                      const substituteTutor1Id = contractData.substitute_tutor1_id || contractData.substituteTutor1Id || contractData.SubstituteTutor1Id;
                      return substituteTutor1Id ? (
                        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="tutor"
                            value={substituteTutor1Id}
                            checked={selectedNewTutorId === substituteTutor1Id}
                            onChange={(e) => setSelectedNewTutorId(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {substituteTutor1Info?.fullName || substituteTutor1Info?.FullName || contractData.substituteTutor1Name || 'Substitute Tutor 1'}
                            </p>
                            <p className="text-sm text-gray-600">Substitute Tutor 1</p>
                          </div>
                        </label>
                      ) : null;
                    })()}
                    
                    {(() => {
                      const contractData = contract as any;
                      const substituteTutor2Id = contractData.substitute_tutor2_id || contractData.substituteTutor2Id || contractData.SubstituteTutor2Id;
                      return substituteTutor2Id ? (
                        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="tutor"
                            value={substituteTutor2Id}
                            checked={selectedNewTutorId === substituteTutor2Id}
                            onChange={(e) => setSelectedNewTutorId(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {substituteTutor2Info?.fullName || substituteTutor2Info?.FullName || contractData.substituteTutor2Name || 'Substitute Tutor 2'}
                            </p>
                            <p className="text-sm text-gray-600">Substitute Tutor 2</p>
                          </div>
                        </label>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedSession(null);
                    setSelectedNewTutorId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={reassigning}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReassign}
                  disabled={reassigning || !selectedNewTutorId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {reassigning ? 'Re-assigning...' : 'Confirm Re-assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetailStaff;


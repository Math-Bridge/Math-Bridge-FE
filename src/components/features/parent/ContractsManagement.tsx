import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getContractsByParent, getChildrenByParent, getChildUnitProgress, ChildUnitProgress, getFinalFeedbackByContractAndProvider, FinalFeedback, createReport, CreateReportRequest, apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import { Child } from '../../../services/api';
import UnitProgressDisplay from '../../common/UnitProgressDisplay';

interface Contract {
  id: string;
  childId: string;
  childName: string;
  tutorName: string;
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
  offlineAddress?: string | null;
  isOnline?: boolean;
  createdAt: string;
  // Raw contract data for accessing tutor IDs
  rawData?: any;
}

const ContractsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled' | 'unpaid'>('all');
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [unitProgressMap, setUnitProgressMap] = useState<Record<string, ChildUnitProgress | null>>({});
  const [loadingProgress, setLoadingProgress] = useState<Record<string, boolean>>({});
  const [finalFeedbackMap, setFinalFeedbackMap] = useState<Record<string, FinalFeedback | null>>({});
  
  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedContractForReport, setSelectedContractForReport] = useState<Contract | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [availableTutorsForContract, setAvailableTutorsForContract] = useState<Array<{id: string, name: string, type: string}>>([]);
  const [reportContent, setReportContent] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [reportType, setReportType] = useState('');
  const [isCreatingReport, setIsCreatingReport] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const parentId = user?.id || (() => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr).id : null;
      })();

      if (!parentId) {
        const errorMsg = 'User information not found. Please log in again.';
        setError(errorMsg);
        showError(errorMsg);
        setLoading(false);
        return;
      }

      const [childrenResponse, contractsResponse] = await Promise.all([
        getChildrenByParent(parentId).catch(err => ({ success: false, error: 'Failed to fetch children', data: null })),
        getContractsByParent(parentId).catch(err => {
          const errorMessage = err?.message || String(err);
          const isNullRefError = /Object reference|NullReferenceException|null/i.test(errorMessage);
          return { 
            success: false, 
            error: isNullRefError 
              ? 'Backend error: Some contracts have missing data. Please contact support.'
              : 'Failed to fetch contracts', 
            data: null 
          };
        })
      ]);

      if (childrenResponse.success && childrenResponse.data) {
        const mappedChildren = (Array.isArray(childrenResponse.data) ? childrenResponse.data : [])
          .filter((child: any) => (child.Status || child.status || 'active') !== 'deleted')
          .map((child: any) => ({
            childId: child.ChildId || child.childId || '',
            fullName: child.FullName || child.fullName || '',
            schoolId: child.SchoolId || child.schoolId || '',
            schoolName: child.SchoolName || child.schoolName || '',
            grade: child.Grade || child.grade || '',
            status: child.Status || child.status || 'active'
          }));
        setChildren(mappedChildren);
      }

      if (contractsResponse.success && contractsResponse.data) {
        const mappedContracts = await Promise.all(contractsResponse.data.map(async (contract: any) => {
          const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanContract } = contract;
          
          const childName = cleanContract.ChildName || cleanContract.childName || 'N/A';
          const tutorName = cleanContract.MainTutorName || cleanContract.mainTutorName || cleanContract.tutorName || 'Tutor not assigned';
          const packageName = cleanContract.PackageName || cleanContract.packageName || 'Package not specified';
          const centerName = cleanContract.CenterName || cleanContract.centerName || 'Online';
          const offlineAddress = cleanContract.OfflineAddress || cleanContract.offlineAddress || null;
          
          const formatTime = (timeStr: string) => timeStr ? timeStr.split(':').slice(0, 2).join(':') : '';
          let schedule = '';
          if (cleanContract.DaysOfWeeksDisplay || cleanContract.daysOfWeeksDisplay) {
            const days = cleanContract.DaysOfWeeksDisplay || cleanContract.daysOfWeeksDisplay;
            const startTime = formatTime(cleanContract.StartTime || cleanContract.startTime);
            const endTime = formatTime(cleanContract.EndTime || cleanContract.endTime);
            schedule = startTime && endTime ? `${days}, ${startTime} - ${endTime}` : `${days}, ${startTime || ''}`;
          } else {
            schedule = cleanContract.timeSlot || cleanContract.schedule || 'Schedule not set';
          }

          const totalSessions = cleanContract.TotalSessions || cleanContract.totalSessions || 0;
          const price = cleanContract.Price || cleanContract.price || cleanContract.Amount || 0;
          const completedSessions = cleanContract.CompletedSessions || cleanContract.completedSessions || 0;

          return {
            id: cleanContract.ContractId || cleanContract.contractId || String(cleanContract.ContractId),
            childId: cleanContract.ChildId || cleanContract.childId || '',
            childName, tutorName, packageName, centerName, offlineAddress,
            subject: cleanContract.Subject || cleanContract.subject || 'Mathematics',
            totalSessions, completedSessions, price,
            status: (cleanContract.Status || cleanContract.status || 'pending').toLowerCase(),
            startDate: cleanContract.StartDate || cleanContract.startDate || '',
            endDate: cleanContract.EndDate || cleanContract.endDate || '',
            schedule,
            isOnline: cleanContract.IsOnline ?? cleanContract.isOnline ?? true,
            createdAt: cleanContract.CreatedAt || cleanContract.CreatedDate || new Date().toISOString(),
            // Store raw contract data to access tutor IDs
            rawData: contract
          };
        }));
        setContracts(mappedContracts);
      } else {
        const errorMsg = contractsResponse.error || 'Failed to load contracts.';
        const isBackendError = /Object reference|NullReferenceException|500|Internal Server Error|missing data/i.test(contractsResponse.error || '');
        setError(isBackendError 
          ? 'Backend system error: Some contracts may have missing data. Please contact support.'
          : errorMsg
        );
        setContracts([]);
        showError(isBackendError 
          ? 'System error while loading contracts. Please contact support.'
          : errorMsg
        );
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'An error occurred while loading data.';
      setError(errorMsg);
      setContracts([]);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch unit progress for active/completed contracts
  useEffect(() => {
    const fetchUnitProgress = async () => {
      if (contracts.length === 0) return;
      
      // Only fetch for active and completed contracts
      const contractsNeedingProgress = contracts.filter(c => 
        (c.status === 'active' || c.status === 'completed') && c.childId
      );

      for (const contract of contractsNeedingProgress) {
        // Skip if already loading or loaded
        if (loadingProgress[contract.id] || unitProgressMap[contract.id]) continue;

        setLoadingProgress(prev => ({ ...prev, [contract.id]: true }));

        try {
          const result = await getChildUnitProgress(contract.id);
          if (result.success && result.data) {
            setUnitProgressMap(prev => ({ ...prev, [contract.id]: result.data }));
          } else {
            setUnitProgressMap(prev => ({ ...prev, [contract.id]: null }));
          }
        } catch (error) {
          console.error(`Error fetching progress for contract ${contract.id}:`, error);
          setUnitProgressMap(prev => ({ ...prev, [contract.id]: null }));
        } finally {
          setLoadingProgress(prev => ({ ...prev, [contract.id]: false }));
        }
      }
    };

    fetchUnitProgress();
  }, [contracts]);

  // Fetch final feedback for completed contracts
  useEffect(() => {
    const fetchFinalFeedbacks = async () => {
      if (contracts.length === 0) return;
      
      // Only fetch for completed contracts
      const completedContracts = contracts.filter(c => c.status === 'completed');

      for (const contract of completedContracts) {
        // Skip if already loaded
        if (finalFeedbackMap[contract.id] !== undefined) continue;

        try {
          const result = await getFinalFeedbackByContractAndProvider(contract.id, 'parent');
          if (result.success && result.data) {
            setFinalFeedbackMap(prev => ({ ...prev, [contract.id]: result.data }));
          } else {
            setFinalFeedbackMap(prev => ({ ...prev, [contract.id]: null }));
          }
        } catch (error) {
          // Silently handle - feedback may not exist yet
          setFinalFeedbackMap(prev => ({ ...prev, [contract.id]: null }));
        }
      }
    };

    fetchFinalFeedbacks();
  }, [contracts]);

  const filteredContracts = contracts.filter(c => 
    (filter === 'all' || c.status === filter) && 
    (selectedChildId === 'all' || c.childId === selectedChildId)
  );

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filter, selectedChildId]);

  const getStatusConfig = (status: string) => {
    const config = {
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Active' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending' },
      completed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle, label: 'Completed' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Cancelled' },
      unpaid: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertCircle, label: 'Unpaid' },
    };
    return config[status as keyof typeof config] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: AlertCircle, label: 'Unknown' };
  };

  const handleCreateContract = () => navigate('/contracts/create');
  const handleViewContract = (id: string) => navigate(`/contracts/${id}`);
  const handleReschedule = (id: string) => navigate(`/contracts/${id}/reschedule`);
  const handleFeedback = (id: string) => navigate(`/contracts/${id}/feedback`);
  const handleRetry = () => fetchData();
  
  const handleOpenReportModal = async (contract: Contract) => {
    setSelectedContractForReport(contract);
    setShowReportModal(true);
    setSelectedTutorId('');
    setAvailableTutorsForContract([]);
    setReportContent('');
    setReportUrl('');
    setReportType('');
    
    // Load tutors for this contract - use rawData if available, otherwise try contract object
    const contractData = contract.rawData || contract as any;
    const tutors: Array<{id: string, name: string, type: string}> = [];
    
    // Add main tutor - try multiple field name variations
    const mainTutorId = contractData.MainTutorId || contractData.mainTutorId || contractData.main_tutor_id || 
                        contractData.MainTutor?.Id || contractData.MainTutor?.id || 
                        contractData.mainTutor?.Id || contractData.mainTutor?.id;
    if (mainTutorId) {
      let mainTutorName = contractData.MainTutorName || contractData.mainTutorName || 
                          contractData.MainTutor?.FullName || contractData.MainTutor?.fullName ||
                          contractData.MainTutor?.Name || contractData.MainTutor?.name ||
                          contract.tutorName || '';
      if (!mainTutorName || mainTutorName === 'Tutor not assigned') {
        try {
          const userResult = await apiService.getUserById(mainTutorId);
          if (userResult.success && userResult.data) {
            mainTutorName = userResult.data.fullName || userResult.data.FullName || userResult.data.name || 'Main Tutor';
          }
        } catch (err) {
          console.warn('Error fetching main tutor name:', err);
        }
      }
      if (mainTutorName && mainTutorName !== 'Tutor not assigned') {
        tutors.push({
          id: mainTutorId,
          name: mainTutorName,
          type: 'main'
        });
      }
    } else if (contract.tutorName && contract.tutorName !== 'Tutor not assigned') {
      // If we have tutor name but no ID, try to find tutor by name or use a fallback
      // For now, we'll skip this tutor since we need an ID to create a report
      console.warn('Main tutor ID not found for contract:', contract.id);
    }
    
    // Add substitute tutor 1
    const subTutor1Id = contractData.SubstituteTutor1Id || contractData.substituteTutor1Id || contractData.substitute_tutor1_id ||
                        contractData.SubstituteTutor1?.Id || contractData.SubstituteTutor1?.id ||
                        contractData.substituteTutor1?.Id || contractData.substituteTutor1?.id;
    if (subTutor1Id) {
      let subTutor1Name = contractData.SubstituteTutor1Name || contractData.substituteTutor1Name || 
                          contractData.SubstituteTutor1?.FullName || contractData.SubstituteTutor1?.fullName ||
                          contractData.SubstituteTutor1?.Name || contractData.SubstituteTutor1?.name ||
                          contractData.substitute_tutor1_name || '';
      if (!subTutor1Name) {
        try {
          const userResult = await apiService.getUserById(subTutor1Id);
          if (userResult.success && userResult.data) {
            subTutor1Name = userResult.data.fullName || userResult.data.FullName || userResult.data.name || 'Substitute Tutor 1';
          }
        } catch (err) {
          console.warn('Error fetching substitute tutor 1 name:', err);
        }
      }
      tutors.push({
        id: subTutor1Id,
        name: subTutor1Name || 'Substitute Tutor 1',
        type: 'substitute1'
      });
    }
    
    // Add substitute tutor 2
    const subTutor2Id = contractData.SubstituteTutor2Id || contractData.substituteTutor2Id || contractData.substitute_tutor2_id ||
                        contractData.SubstituteTutor2?.Id || contractData.SubstituteTutor2?.id ||
                        contractData.substituteTutor2?.Id || contractData.substituteTutor2?.id;
    if (subTutor2Id) {
      let subTutor2Name = contractData.SubstituteTutor2Name || contractData.substituteTutor2Name || 
                          contractData.SubstituteTutor2?.FullName || contractData.SubstituteTutor2?.fullName ||
                          contractData.SubstituteTutor2?.Name || contractData.SubstituteTutor2?.name ||
                          contractData.substitute_tutor2_name || '';
      if (!subTutor2Name) {
        try {
          const userResult = await apiService.getUserById(subTutor2Id);
          if (userResult.success && userResult.data) {
            subTutor2Name = userResult.data.fullName || userResult.data.FullName || userResult.data.name || 'Substitute Tutor 2';
          }
        } catch (err) {
          console.warn('Error fetching substitute tutor 2 name:', err);
        }
      }
      tutors.push({
        id: subTutor2Id,
        name: subTutor2Name || 'Substitute Tutor 2',
        type: 'substitute2'
      });
    }
    
    setAvailableTutorsForContract(tutors);
    if (tutors.length > 0) {
      setSelectedTutorId(tutors[0].id);
    } else {
      console.warn('No tutors found for contract:', contract.id, 'Raw data:', contractData);
    }
  };
  
  const handleCreateReport = async () => {
    if (!selectedTutorId || !selectedContractForReport || !reportContent.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setIsCreatingReport(true);
      const reportData: CreateReportRequest = {
        tutorId: selectedTutorId,
        contractId: selectedContractForReport.id,
        content: reportContent.trim(),
        url: reportUrl.trim() || undefined,
        type: reportType.trim() || undefined,
      };

      const result = await createReport(reportData);
      if (result.success && result.data) {
        showSuccess('Report created successfully');
        setShowReportModal(false);
        // Reset form
        setSelectedContractForReport(null);
        setSelectedTutorId('');
        setAvailableTutorsForContract([]);
        setReportContent('');
        setReportUrl('');
        setReportType('');
      } else {
        showError(result.error || 'Failed to create report');
      }
    } catch (error: any) {
      console.error('Error creating report:', error);
      showError(error?.response?.data?.error || 'Failed to create report');
    } finally {
      setIsCreatingReport(false);
    }
  };

  // SKELETON LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-xl w-64 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-200 to-blue-200 rounded-2xl"></div>
                      <div>
                        <div className="h-6 bg-gray-200 rounded-lg w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-64"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1,2,3,4].map(j => (
                      <div key={j} className="h-16 bg-gray-100 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* GỘP HEADER + FILTER – 1 KHỐI DUY NHẤT */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-10 overflow-hidden">
          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
                My Learning Contracts
              </h1>
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Track progress, reschedule sessions, and manage all contracts
              </p>
              <div className="mt-3 flex items-center gap-6 text-sm">
                <span className="font-semibold text-gray-700">{contracts.length} Total</span>
                <span className="text-emerald-600 font-bold">
                  {contracts.filter(c => c.status === 'active').length} Active
                </span>
              </div>
            </div>

 <button
  onClick={handleCreateContract}
  className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-500 flex items-center gap-3 overflow-hidden lg:self-end origin-bottom-right hover:rotate-1 hover:scale-105"
>
  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
  <span className="relative z-10">Create Contract</span>
</button>
          </div>

          {/* FILTER BAR – NGAY DƯỚI HEADER, TRONG CÙNG CARD */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: contracts.length },
                { key: 'unpaid', label: 'Unpaid', count: contracts.filter(c => c.status === 'unpaid').length },
                { key: 'pending', label: 'Pending', count: contracts.filter(c => c.status === 'pending').length },
                { key: 'active', label: 'Active', count: contracts.filter(c => c.status === 'active').length },
                { key: 'completed', label: 'Completed', count: contracts.filter(c => c.status === 'completed').length },
                { key: 'cancelled', label: 'Cancelled', count: contracts.filter(c => c.status === 'cancelled').length }
              ].map(tab => {
                const config = getStatusConfig(tab.key === 'all' ? 'active' : tab.key);
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                      filter === tab.key
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg scale-105'
                        : 'bg-white/70 text-gray-700 hover:bg-white'
                    }`}
                  >
                    {tab.key !== 'all' && React.createElement(config.icon, { className: 'w-4 h-4' })}
                    <span>{tab.label} ({tab.count})</span>
                  </button>
                );
              })}
            </div>

            {children.length > 0 && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-600" />
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-emerald-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 cursor-pointer min-w-[200px] shadow-sm"
                >
                  <option value="all">All Children ({filteredContracts.length})</option>
                  {children.map(child => {
                    const count = contracts.filter(c => c.childId === child.childId && (filter === 'all' || c.status === filter)).length;
                    return (
                      <option key={child.childId} value={child.childId}>
                        {child.fullName} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* CONTRACTS GRID */}
        <div className="space-y-6">
          {paginatedContracts.map((contract, idx) => {
            const statusConfig = getStatusConfig(contract.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={contract.id}
                className="group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-lg">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        {contract.isOnline ? (
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        ) : (
                          <MapPin className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 mb-1">{contract.packageName}</h3>
                      <p className="text-base text-gray-600 font-medium">
                        {contract.subject} • {contract.childName}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Tutor: <span className="font-semibold text-gray-700">{contract.tutorName}</span>
                        {contract.isOnline ? null : ` • ${contract.offlineAddress || contract.centerName}`}
                      </p>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} shadow-sm`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Start Date</p>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(contract.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Schedule</p>
                        <p className="text-sm font-bold text-gray-900 truncate" title={contract.schedule}>{contract.schedule}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Units Learned</p>
                        <p className="text-lg font-bold text-gray-900">
                          {unitProgressMap[contract.id]?.totalUnitsLearned || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Price</p>
                        <p className="text-lg font-bold text-gray-900">
                          {contract.price > 0 
                            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.price)
                            : 'Free'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* UNIT PROGRESS */}
                {(contract.status === 'active' || contract.status === 'completed') && (
                  <div className="mb-6">
                    <UnitProgressDisplay 
                      progress={unitProgressMap[contract.id] || null}
                      loading={loadingProgress[contract.id] || false}
                      compact={true}
                    />
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => handleViewContract(contract.id)}
                    className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>View Details</span>
                  </button>

                  {contract.tutorName && 
                   contract.tutorName !== 'Tutor not assigned' && 
                   contract.status !== 'unpaid' && 
                   contract.status !== 'pending' && (
                    <button
                      onClick={() => handleOpenReportModal(contract)}
                      className="group px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
                    >
                      <AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Report Tutor</span>
                    </button>
                  )}

                  {contract.status === 'completed' && !finalFeedbackMap[contract.id] && (
                    <button
                      onClick={() => handleFeedback(contract.id)}
                      className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Feedback</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-12 gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-5 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 font-semibold text-gray-700"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const show = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                if (!show && (page === currentPage - 2 || page === currentPage + 2)) {
                  return <span key={page} className="px-3 text-gray-400 font-bold">...</span>;
                }
                if (!show) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-12 h-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white scale-110'
                        : 'bg-white/80 text-gray-700 hover:bg-white hover:scale-105'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-5 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 font-semibold text-gray-700"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && filteredContracts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-16 h-16 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-4">
              {filter === 'all' ? 'No Contracts Yet' : `No ${filter} Contracts`}
            </h3>
            <p className="text-lg text-gray-600 mb-10 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Start your child\'s learning journey by creating the first contract!'
                : `You don\'t have any ${filter} contracts at the moment.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={handleCreateContract}
                className="px-10 py-5 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold text-xl rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              >
                Create Your First Contract
              </button>
            )}
          </div>
        )}

        {/* ERROR STATE */}
        {error && contracts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-4">Oops! Something went wrong</h3>
            <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
              {error.includes('Backend') 
                ? 'There was a system error while loading your contracts. Our team is working on it.'
                : error}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleRetry}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                <RefreshCw className="w-6 h-6 animate-spin" />
                Try Again
              </button>
              <button
                onClick={handleCreateContract}
                className="px-8 py-4 bg-white text-emerald-600 font-bold text-lg rounded-2xl shadow-xl border-2 border-emerald-200 hover:bg-emerald-50 transition-all duration-300"
              >
                Create New Contract
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Report Modal */}
      {showReportModal && selectedContractForReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Report</h2>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setSelectedContractForReport(null);
                    setSelectedTutorId('');
                    setAvailableTutorsForContract([]);
                    setReportContent('');
                    setReportUrl('');
                    setReportType('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contract
                </label>
                <input
                  type="text"
                  value={`${selectedContractForReport.childName} - ${selectedContractForReport.packageName}`}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Tutor <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTutorId}
                  onChange={(e) => setSelectedTutorId(e.target.value)}
                  disabled={availableTutorsForContract.length === 0}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                  required
                >
                  <option value="">
                    {availableTutorsForContract.length === 0 
                      ? 'No tutors available' 
                      : '-- Select a tutor --'}
                  </option>
                  {availableTutorsForContract.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.type === 'main' ? 'Main Tutor: ' : tutor.type === 'substitute1' ? 'Substitute Tutor 1: ' : 'Substitute Tutor 2: '}
                      {tutor.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Choose the tutor you want to report</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Report Type (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Complaint, Feedback, Issue"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Report Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe the issue or concern in detail..."
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Please provide detailed information about the issue or concern</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Related URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">Link to any relevant documents or evidence</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedContractForReport(null);
                  setSelectedTutorId('');
                  setAvailableTutorsForContract([]);
                  setReportContent('');
                  setReportUrl('');
                  setReportType('');
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                disabled={isCreatingReport}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                disabled={isCreatingReport || !selectedTutorId || !reportContent.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreatingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Create Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsManagement;
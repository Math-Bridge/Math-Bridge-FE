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
  DollarSign,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getContractsByParent, getChildrenByParent } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import { Child } from '../../../services/api';

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
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  schedule: string;
  centerName: string;
  createdAt: string;
}

const ContractsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get parent ID from user or localStorage
      const parentId = user?.id || (() => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr).id : null;
      })();

      if (!parentId) {
        const errorMsg = 'User information not found. Please log in again.';
        console.error('Parent ID not found');
        setError(errorMsg);
        showError(errorMsg);
        setLoading(false);
        return;
      }

      // Fetch children and contracts in parallel
      const [childrenResponse, contractsResponse] = await Promise.all([
        getChildrenByParent(parentId).catch(err => {
          console.error('Error fetching children:', err);
          return { success: false, error: 'Failed to fetch children', data: null };
        }),
        getContractsByParent(parentId).catch(err => {
          console.error('Error fetching contracts:', err);
          return { success: false, error: 'Failed to fetch contracts', data: null };
        })
      ]);

      // Set children
      if (childrenResponse.success && childrenResponse.data) {
        const childrenData = Array.isArray(childrenResponse.data) ? childrenResponse.data : [];
        const mappedChildren = childrenData
          .filter((child: any) => {
            const status = child.Status || child.status || 'active';
            return status !== 'deleted';
          })
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

      // Set contracts
      if (contractsResponse.success && contractsResponse.data) {
        console.log(`[ContractsManagement] Received ${contractsResponse.data.length} contracts`);
        // Map API response to component interface
        const mappedContracts = await Promise.all(contractsResponse.data.map(async (contract: any) => {
          // Remove reschedule_count if present to avoid errors
          const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanContract } = contract;
          
          // Build schedule string from DaysOfWeeksDisplay and time
          const formatTime = (timeStr: string) => {
            if (!timeStr) return '';
            return timeStr.split(':').slice(0, 2).join(':');
          };
          
          let schedule = '';
          if (cleanContract.DaysOfWeeksDisplay || cleanContract.daysOfWeeksDisplay) {
            const days = cleanContract.DaysOfWeeksDisplay || cleanContract.daysOfWeeksDisplay;
            const startTime = formatTime(cleanContract.StartTime || cleanContract.startTime || '');
            const endTime = formatTime(cleanContract.EndTime || cleanContract.endTime || '');
            if (startTime && endTime) {
              schedule = `${days}, ${startTime} - ${endTime}`;
            } else if (startTime) {
              schedule = `${days}, ${startTime}`;
            } else {
              schedule = days || 'Schedule not set';
            }
          } else {
            schedule = cleanContract.timeSlot || cleanContract.schedule || 'Schedule not set';
          }
          
          // Get package info if needed
          let totalSessions = cleanContract.TotalSessions || cleanContract.totalSessions || 0;
          let price = cleanContract.Price || cleanContract.price || cleanContract.Amount || cleanContract.amount || 0;
          
          const completedSessions = cleanContract.CompletedSessions || cleanContract.completedSessions || cleanContract.CompletedSessionCount || 0;
          
          return {
            id: cleanContract.ContractId || cleanContract.contractId || cleanContract.id || String(cleanContract.ContractId || cleanContract.contractId),
            childId: cleanContract.ChildId || cleanContract.childId || '',
            childName: cleanContract.ChildName || cleanContract.childName || 'N/A',
            tutorName: cleanContract.MainTutorName || cleanContract.mainTutorName || cleanContract.tutorName || 'Tutor not assigned',
            subject: cleanContract.Subject || cleanContract.subject || 'Mathematics',
            packageName: cleanContract.PackageName || cleanContract.packageName || 'Package not specified',
            totalSessions: totalSessions || 0,
            completedSessions: completedSessions || 0,
            price: price || 0,
            status: (cleanContract.Status || cleanContract.status || 'pending').toLowerCase(),
            startDate: cleanContract.StartDate || cleanContract.startDate || '',
            endDate: cleanContract.EndDate || cleanContract.endDate || '',
            schedule: schedule,
            centerName: cleanContract.CenterName || cleanContract.centerName || 'Online',
            createdAt: cleanContract.CreatedAt || cleanContract.CreatedDate || cleanContract.createdAt || cleanContract.createdDate || new Date().toISOString()
          };
        }));
        console.log('Mapped contracts:', mappedContracts);
        setContracts(mappedContracts);
      } else {
        // Handle error from contracts API
        const errorMsg = contractsResponse.error || 'Failed to load contracts. Please try again later.';
        console.error('Failed to fetch contracts:', contractsResponse.error);
        
        // Check if it's a backend NullReferenceException (500 error)
        const isBackendError = contractsResponse.error?.includes('Object reference') || 
                               contractsResponse.error?.includes('500') ||
                               contractsResponse.error?.includes('Internal Server Error');
        
        setError(isBackendError 
          ? 'Backend system error: Some contracts may have missing data. Please contact support.'
          : errorMsg
        );
        setContracts([]);
        
        // Show error toast
        if (isBackendError) {
          showError('System error while loading contracts. This is a backend issue that needs to be fixed. Please contact support.');
        } else {
          showError(errorMsg);
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'An error occurred while loading data. Please try again later.';
      console.error('Error fetching data:', error);
      setError(errorMsg);
      setContracts([]);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredContracts = contracts.filter(contract => {
    const statusMatch = filter === 'all' || contract.status === filter;
    const childMatch = selectedChildId === 'all' || contract.childId === selectedChildId;
    return statusMatch && childMatch;
  });

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCreateContract = () => {
    navigate('/contracts/create');
  };

  const handleViewContract = (contractId: string) => {
    navigate(`/contracts/${contractId}`);
  };

  const handleReschedule = (contractId: string) => {
    navigate(`/contracts/${contractId}/reschedule`);
  };

  const handleFeedback = (contractId: string) => {
    navigate(`/contracts/${contractId}/feedback`);
  };

  const handleRetry = () => {
    fetchData();
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
              <h1 className="text-3xl font-bold text-gray-900">My Contracts</h1>
              <p className="text-gray-600 mt-2">Manage your tutoring contracts and sessions</p>
            </div>
            <button
              onClick={handleCreateContract}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Contract</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Status Filter */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              {[
                { key: 'all', label: 'All', count: contracts.length },
                { key: 'pending', label: 'Pending', count: contracts.filter(c => c.status === 'pending').length },
                { key: 'active', label: 'Active', count: contracts.filter(c => c.status === 'active').length },
                { key: 'completed', label: 'Completed', count: contracts.filter(c => c.status === 'completed').length },
                { key: 'cancelled', label: 'Cancelled', count: contracts.filter(c => c.status === 'cancelled').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Child Filter */}
            {children.length > 0 && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Children ({contracts.length})</option>
                  {children.map((child) => {
                    const childContractsCount = contracts.filter(c => c.childId === child.childId).length;
                    return (
                      <option key={child.childId} value={child.childId}>
                        {child.fullName} ({childContractsCount})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{contract.packageName}</h3>
                    <p className="text-sm text-gray-600">
                      {contract.subject} • {contract.childName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {contract.tutorName === 'Tutor not assigned' ? 'Tutor: Not assigned yet' : `Tutor: ${contract.tutorName}`}
                      {contract.centerName && contract.centerName !== 'Online' && ` • ${contract.centerName}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                    {getStatusIcon(contract.status)}
                    <span className="ml-1 capitalize">{contract.status}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">{new Date(contract.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Schedule</p>
                    <p className="font-medium">{contract.schedule}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="font-medium">
                      {contract.totalSessions > 0 
                        ? `${contract.completedSessions}/${contract.totalSessions} sessions`
                        : 'No sessions scheduled'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-medium">
                      {contract.price > 0 
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.price)
                        : 'Price not set'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {contract.status === 'active' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">
                      {contract.totalSessions > 0
                        ? `${Math.round((contract.completedSessions / contract.totalSessions) * 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: contract.totalSessions > 0
                          ? `${Math.min((contract.completedSessions / contract.totalSessions) * 100, 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleViewContract(contract.id)}
                  className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                
                {contract.status === 'active' && (
                  <button
                    onClick={() => handleReschedule(contract.id)}
                    className="px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reschedule</span>
                  </button>
                )}
                
                {contract.status === 'completed' && (
                  <button
                    onClick={() => handleFeedback(contract.id)}
                    className="px-4 py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Submit Feedback</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error State */}
        {error && contracts.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to Load Contracts
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {error.includes('Object reference') || error.includes('500')
                ? 'System error while processing contracts. Please try again later or contact support.'
                : error}
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleRetry}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retry</span>
              </button>
              <button
                onClick={handleCreateContract}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Create New Contract
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No contracts found' : `No ${filter} contracts`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Get started by creating your first contract'
                : `You don't have any ${filter} contracts at the moment`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={handleCreateContract}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Your First Contract
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractsManagement;

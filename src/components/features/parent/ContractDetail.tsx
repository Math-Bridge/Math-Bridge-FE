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
  TrendingUp,
  Award
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContractById, getContractsByParent, apiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

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
  status: 'pending' | 'active' | 'completed' | 'cancelled';
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
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'tutor'>('overview');

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
          // Fallback: Get from parent's contracts list
          if (user?.id) {
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
            console.error('Error fetching package details:', error);
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
          status: (contractData.Status || contractData.status || 'pending').toLowerCase() as 'pending' | 'active' | 'completed' | 'cancelled',
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
        console.error('Error fetching contract:', err);
        setError('Failed to load contract details');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contractId, user?.id]);

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

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
          <button
            onClick={() => navigate('/contracts')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/contracts')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Contracts</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{contract.packageName}</h1>
              <p className="text-gray-600 mt-2">
                {contract.subject} • {contract.childName} • {contract.tutorName}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="capitalize">{contract.status}</span>
              </span>
              {contract.status === 'active' && (
                <button
                  onClick={() => navigate(`/contracts/${contract.id}/reschedule`)}
                  className="px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reschedule</span>
                </button>
              )}
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
                      style={{ width: `${(contract.completedSessions / contract.totalSessions) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {Math.round((contract.completedSessions / contract.totalSessions) * 100)}% complete
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
                  {contract.status === 'active' && (
                    <button
                      onClick={() => navigate(`/contracts/${contract.id}/reschedule`)}
                      className="w-full flex items-center space-x-3 p-3 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Request Reschedule</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/user/chat?tutor=${contract.tutorName}`)}
                    className="w-full flex items-center space-x-3 p-3 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Chat with Tutor</span>
                  </button>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutor Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{contract.tutorName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{contract.tutorEmail}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{contract.tutorPhone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(contract.tutorRating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{contract.tutorRating}</span>
                    </div>
                  </div>
                </div>
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
    </div>
  );
};

export default ContractDetail;

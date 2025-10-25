import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  DollarSign,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Contract {
  id: string;
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
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    // Mock data for demo
    setContracts([
      {
        id: '1',
        childName: 'Nguyen Minh Anh',
        tutorName: 'Sarah Johnson',
        subject: 'Mathematics',
        packageName: 'Advanced Algebra Package',
        totalSessions: 20,
        completedSessions: 8,
        price: 2000000,
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-03-01',
        schedule: 'Mon, Wed, Fri 3:00 PM',
        centerName: 'MathBridge Center District 1',
        createdAt: '2023-12-15'
      },
      {
        id: '2',
        childName: 'Tran Duc Minh',
        tutorName: 'Dr. Chen Wei',
        subject: 'Physics',
        packageName: 'Advanced Physics Package',
        totalSessions: 15,
        completedSessions: 15,
        price: 1500000,
        status: 'completed',
        startDate: '2023-10-01',
        endDate: '2023-12-15',
        schedule: 'Tue, Thu 4:00 PM',
        centerName: 'MathBridge Center Thu Duc',
        createdAt: '2023-09-20'
      },
      {
        id: '3',
        childName: 'Nguyen Minh Anh',
        tutorName: 'Michael Brown',
        subject: 'Chemistry',
        packageName: 'Chemistry Fundamentals',
        totalSessions: 12,
        completedSessions: 0,
        price: 1200000,
        status: 'pending',
        startDate: '2024-02-01',
        endDate: '2024-04-01',
        schedule: 'Sat 2:00 PM',
        centerName: 'MathBridge Center District 1',
        createdAt: '2024-01-10'
      }
    ]);
    setLoading(false);
  }, []);

  const filteredContracts = contracts.filter(contract => 
    filter === 'all' || contract.status === filter
  );

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
    navigate('/user/contracts/create');
  };

  const handleViewContract = (contractId: string) => {
    navigate(`/user/contracts/${contractId}`);
  };

  const handleReschedule = (contractId: string) => {
    navigate(`/user/contracts/${contractId}/reschedule`);
  };

  const handleFeedback = (contractId: string) => {
    navigate(`/user/contracts/${contractId}/feedback`);
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
                      Tutor: {contract.tutorName} • {contract.centerName}
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
                    <p className="font-medium">{contract.completedSessions}/{contract.totalSessions} sessions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.price)}
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
                      {Math.round((contract.completedSessions / contract.totalSessions) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(contract.completedSessions / contract.totalSessions) * 100}%` }}
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

        {/* Empty State */}
        {filteredContracts.length === 0 && (
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

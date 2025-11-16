import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  Star,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Award,
} from 'lucide-react';
import {
  getFinalFeedbacksByContractId,
  FinalFeedback,
  getAllContracts,
  Contract,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

const FinalFeedbackManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [feedbacks, setFeedbacks] = useState<FinalFeedback[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<'all' | 'parent' | 'tutor'>('all');

  useEffect(() => {
    const initialize = async () => {
      await fetchContracts();
      if (selectedContractId) {
        await fetchFeedbacksByContract();
      } else {
        await fetchAllFeedbacks();
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (selectedContractId) {
      fetchFeedbacksByContract();
    } else if (contracts.length > 0) {
      // Only fetch all feedbacks if contracts are loaded
      fetchAllFeedbacks();
    }
  }, [selectedContractId, contracts.length]);

  const fetchContracts = async () => {
    try {
      // Fetch all contracts to filter by (for staff)
      const result = await getAllContracts();
      if (result.success && result.data) {
        setContracts(result.data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchAllFeedbacks = async () => {
    try {
      setLoading(true);
      // Fetch feedbacks from all contracts
      const allFeedbacks: FinalFeedback[] = [];
      
      if (contracts.length > 0) {
        for (const contract of contracts) {
          if (contract.status === 'completed') {
            try {
              const result = await getFinalFeedbacksByContractId(contract.contractId || contract.id);
              if (result.success && result.data) {
                allFeedbacks.push(...result.data);
              }
            } catch (err) {
              // Silently continue if contract has no feedback
            }
          }
        }
      }
      
      const sorted = [...allFeedbacks].sort((a, b) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });
      setFeedbacks(sorted);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      showError('Failed to load final feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacksByContract = async () => {
    if (!selectedContractId) return;

    try {
      setLoading(true);
      const result = await getFinalFeedbacksByContractId(selectedContractId);
      if (result.success && result.data) {
        const sorted = [...result.data].sort((a, b) => {
          const dateA = new Date(a.createdDate).getTime();
          const dateB = new Date(b.createdDate).getTime();
          return dateB - dateA;
        });
        setFeedbacks(sorted);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      showError('Failed to load final feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch = !searchTerm ||
      feedback.userFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.contractTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.additionalComments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.improvementSuggestions?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterProvider === 'all' ||
      (filterProvider === 'parent' && feedback.feedbackProviderType === 'parent') ||
      (filterProvider === 'tutor' && feedback.feedbackProviderType === 'tutor');

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedbacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Final Feedback Management</h1>
            <p className="text-gray-600 mt-2">View and manage all final feedbacks from parents and tutors</p>
          </div>
          <button
            onClick={() => {
              if (selectedContractId) {
                fetchFeedbacksByContract();
              } else {
                fetchAllFeedbacks();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, contract, comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Feedbacks</option>
                <option value="parent">Parent Feedbacks</option>
                <option value="tutor">Tutor Feedbacks</option>
              </select>
            </div>
            <div>
              <select
                value={selectedContractId || ''}
                onChange={(e) => setSelectedContractId(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Contracts</option>
                {contracts
                  .filter(c => c.status === 'completed')
                  .map((contract) => (
                    <option key={contract.contractId || contract.id} value={contract.contractId || contract.id}>
                      {contract.packageName || contract.subject || `Contract ${contract.contractId || contract.id}`}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Feedbacks List */}
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedbacks Found</h3>
            <p className="text-gray-600">
              {feedbacks.length === 0
                ? 'No final feedbacks available yet'
                : 'No feedbacks match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.feedbackId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedFeedbackId(expandedFeedbackId === feedback.feedbackId ? null : feedback.feedbackId)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {formatDate(feedback.createdDate)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          feedback.feedbackProviderType === 'parent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {feedback.feedbackProviderType === 'parent' ? 'Parent' : 'Tutor'}
                        </span>
                        {feedback.feedbackStatus && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            feedback.feedbackStatus === 'Submitted'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {feedback.feedbackStatus}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        {feedback.userFullName && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{feedback.userFullName}</span>
                          </div>
                        )}
                        {feedback.contractTitle && (
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{feedback.contractTitle}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < feedback.overallSatisfactionRating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {feedback.overallSatisfactionRating}/5
                        </span>
                      </div>
                    </div>
                    {expandedFeedbackId === feedback.feedbackId ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedFeedbackId === feedback.feedbackId && (
                  <div className="px-6 pb-6 border-t border-gray-200 pt-4 space-y-4">
                    {/* Detailed Ratings */}
                    {(feedback.communicationRating || 
                      feedback.sessionQualityRating || 
                      feedback.learningProgressRating || 
                      feedback.professionalismRating) && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Detailed Ratings</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {feedback.communicationRating && (
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600">Communication:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {feedback.communicationRating}/5
                              </span>
                            </div>
                          )}
                          {feedback.sessionQualityRating && (
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600">Session Quality:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {feedback.sessionQualityRating}/5
                              </span>
                            </div>
                          )}
                          {feedback.learningProgressRating && (
                            <div className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600">Learning Progress:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {feedback.learningProgressRating}/5
                              </span>
                            </div>
                          )}
                          {feedback.professionalismRating && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600">Professionalism:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {feedback.professionalismRating}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {feedback.additionalComments && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Comments</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                          {feedback.additionalComments}
                        </p>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {feedback.improvementSuggestions && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Improvement Suggestions</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                          {feedback.improvementSuggestions}
                        </p>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="flex items-center space-x-4">
                      {feedback.wouldRecommend && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Would Recommend</span>
                        </div>
                      )}
                      {feedback.wouldWorkTogetherAgain && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Would Work Again</span>
                        </div>
                      )}
                      {feedback.contractObjectivesMet !== undefined && (
                        <div className="flex items-center space-x-1">
                          {feedback.contractObjectivesMet ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-green-600">Objectives Met</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-xs font-medium text-red-600">Objectives Not Met</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalFeedbackManagement;


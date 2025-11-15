import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Award,
  BookOpen,
  Users,
  Target,
} from 'lucide-react';
import {
  getContractById,
  getFinalFeedbackByContractAndProvider,
  createFinalFeedback,
  updateFinalFeedback,
  CreateFinalFeedbackRequest,
  FinalFeedback,
  Contract,
} from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';

const FinalFeedbackForm: React.FC = () => {
  const { id: contractId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<FinalFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState<number | undefined>(undefined);
  const [sessionQualityRating, setSessionQualityRating] = useState<number | undefined>(undefined);
  const [learningProgressRating, setLearningProgressRating] = useState<number | undefined>(undefined);
  const [professionalismRating, setProfessionalismRating] = useState<number | undefined>(undefined);
  const [wouldRecommend, setWouldRecommend] = useState(false);
  const [wouldWorkTogetherAgain, setWouldWorkTogetherAgain] = useState(false);
  const [contractObjectivesMet, setContractObjectivesMet] = useState<boolean | undefined>(undefined);
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');

  useEffect(() => {
    if (contractId && user?.id) {
      fetchData();
    }
  }, [contractId, user?.id]);

  const fetchData = async () => {
    if (!contractId || !user?.id) return;

    try {
      setLoading(true);

      // Fetch contract
      const contractResult = await getContractById(contractId);
      if (contractResult.success && contractResult.data) {
        setContract(contractResult.data);

        // Check if contract is completed
        if (contractResult.data.status !== 'completed') {
          showError('This contract is not completed yet. You can only submit feedback for completed contracts.');
          navigate(`/contracts/${contractId}`);
          return;
        }
      } else {
        showError('Failed to load contract details');
        navigate('/contracts');
        return;
      }

      // Check for existing feedback (parent feedback)
      const feedbackResult = await getFinalFeedbackByContractAndProvider(contractId, 'parent');
      if (feedbackResult.success && feedbackResult.data) {
        setExistingFeedback(feedbackResult.data);
        // Load existing feedback data
        setOverallRating(feedbackResult.data.overallSatisfactionRating);
        setCommunicationRating(feedbackResult.data.communicationRating);
        setSessionQualityRating(feedbackResult.data.sessionQualityRating);
        setLearningProgressRating(feedbackResult.data.learningProgressRating);
        setProfessionalismRating(feedbackResult.data.professionalismRating);
        setWouldRecommend(feedbackResult.data.wouldRecommend);
        setWouldWorkTogetherAgain(feedbackResult.data.wouldWorkTogetherAgain);
        setContractObjectivesMet(feedbackResult.data.contractObjectivesMet);
        setImprovementSuggestions(feedbackResult.data.improvementSuggestions || '');
        setAdditionalComments(feedbackResult.data.additionalComments || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return overallRating > 0;
      case 2:
        return communicationRating && sessionQualityRating && learningProgressRating && professionalismRating;
      case 3:
        return true; // Optional step
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!contractId || !user?.id || !contract) {
      showError('Missing required information');
      return;
    }

    if (!canProceed()) {
      showError('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const feedbackData: CreateFinalFeedbackRequest = {
        userId: user.id,
        contractId: contractId,
        feedbackProviderType: 'parent',
        overallSatisfactionRating: overallRating,
        communicationRating: communicationRating,
        sessionQualityRating: sessionQualityRating,
        learningProgressRating: learningProgressRating,
        professionalismRating: professionalismRating,
        wouldRecommend: wouldRecommend,
        wouldWorkTogetherAgain: wouldWorkTogetherAgain,
        contractObjectivesMet: contractObjectivesMet,
        improvementSuggestions: improvementSuggestions || undefined,
        additionalComments: additionalComments || undefined,
      };

      let result;
      if (existingFeedback) {
        // Update existing feedback
        result = await updateFinalFeedback(existingFeedback.feedbackId, feedbackData);
      } else {
        // Create new feedback
        result = await createFinalFeedback(feedbackData);
      }

      if (result.success) {
        showSuccess(existingFeedback ? 'Feedback updated successfully!' : 'Feedback submitted successfully!');
        navigate(`/contracts/${contractId}`);
      } else {
        showError(result.error || 'Failed to submit feedback');
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      showError(error?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Contract not found</p>
          <button
            onClick={() => navigate('/contracts')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/contracts/${contractId}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Contract</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {existingFeedback ? 'Update Final Feedback' : 'Submit Final Feedback'}
          </h1>
          <p className="text-gray-600 mt-2">
            Share your experience and help us improve our tutoring services
          </p>
        </div>

        {/* Contract Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{contract.subject || 'Contract'}</h3>
              <p className="text-sm text-gray-600">
                Tutor: {contract.tutorName || 'Not assigned'}
              </p>
              <p className="text-sm text-gray-500">
                {contract.completedSessions || 0} session(s) completed
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-center space-x-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center space-x-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step === 1
                    ? 'Overall'
                    : step === 2
                    ? 'Details'
                    : step === 3
                    ? 'Objectives'
                    : 'Comments'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Step 1: Overall Rating */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Overall Satisfaction</h3>
                <p className="text-gray-600 mb-6">
                  How would you rate your overall experience with this tutoring contract?
                </p>
                <div className="flex justify-center space-x-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setOverallRating(rating)}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        overallRating >= rating
                          ? 'bg-yellow-400 text-white scale-110 shadow-lg'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <span className="text-lg font-semibold text-gray-900">
                    {overallRating === 0
                      ? 'Select a rating'
                      : overallRating === 1
                      ? 'Poor'
                      : overallRating === 2
                      ? 'Fair'
                      : overallRating === 3
                      ? 'Good'
                      : overallRating === 4
                      ? 'Very Good'
                      : 'Excellent'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Detailed Ratings */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Detailed Ratings</h3>
                <p className="text-gray-600 mb-6">
                  Please rate different aspects of the tutoring experience
                </p>

                <div className="space-y-8">
                  {[
                    {
                      key: 'communication',
                      label: 'Communication',
                      icon: MessageSquare,
                      value: communicationRating,
                      setValue: setCommunicationRating,
                      description: 'How clear and effective was the communication?',
                    },
                    {
                      key: 'sessionQuality',
                      label: 'Session Quality',
                      icon: BookOpen,
                      value: sessionQualityRating,
                      setValue: setSessionQualityRating,
                      description: 'How would you rate the quality of the sessions?',
                    },
                    {
                      key: 'learningProgress',
                      label: 'Learning Progress',
                      icon: Award,
                      value: learningProgressRating,
                      setValue: setLearningProgressRating,
                      description: 'How much progress did your child make?',
                    },
                    {
                      key: 'professionalism',
                      label: 'Professionalism',
                      icon: Users,
                      value: professionalismRating,
                      setValue: setProfessionalismRating,
                      description: 'How professional was the tutor?',
                    },
                  ].map((item) => (
                    <div key={item.key} className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{item.label}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => item.setValue(rating)}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                              (item.value ?? 0) >= rating
                                ? 'bg-blue-500 text-white scale-110 shadow-md'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contract Objectives */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Contract Objectives</h3>
                <p className="text-gray-600 mb-6">
                  Did the tutoring contract meet your expectations and objectives?
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Were the contract objectives met?
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setContractObjectivesMet(true)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          contractObjectivesMet === true
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setContractObjectivesMet(false)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          contractObjectivesMet === false
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <ThumbsDown className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="wouldRecommend"
                        checked={wouldRecommend}
                        onChange={(e) => setWouldRecommend(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="wouldRecommend" className="flex-1 font-medium text-gray-900">
                        I would recommend this tutor to others
                      </label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="wouldWorkTogetherAgain"
                        checked={wouldWorkTogetherAgain}
                        onChange={(e) => setWouldWorkTogetherAgain(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="wouldWorkTogetherAgain" className="flex-1 font-medium text-gray-900">
                        I would work with this tutor again
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Comments */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Additional Feedback</h3>
                <p className="text-gray-600 mb-6">
                  Share any additional thoughts, suggestions, or comments
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Improvement Suggestions (Optional)
                    </label>
                    <textarea
                      value={improvementSuggestions}
                      onChange={(e) => setImprovementSuggestions(e.target.value)}
                      placeholder="What could be improved in future tutoring sessions?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {improvementSuggestions.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Comments (Optional)
                    </label>
                    <textarea
                      value={additionalComments}
                      onChange={(e) => setAdditionalComments(e.target.value)}
                      placeholder="Any other comments or feedback..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {additionalComments.length}/1000 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/contracts/${contractId}`)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>{existingFeedback ? 'Update Feedback' : 'Submit Feedback'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalFeedbackForm;



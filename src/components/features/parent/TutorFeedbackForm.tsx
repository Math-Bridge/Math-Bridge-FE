import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  User,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Award,
  Clock
} from 'lucide-react';

interface FeedbackData {
  overallRating: number;
  teachingQuality: number;
  communication: number;
  punctuality: number;
  helpfulness: number;
  wouldRecommend: boolean;
  strengths: string[];
  improvements: string[];
  comments: string;
  anonymous: boolean;
}

interface TutorFeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
  tutorName: string;
  subject: string;
  sessionCount: number;
}

const TutorFeedbackForm: React.FC<TutorFeedbackFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tutorName,
  subject,
  sessionCount
}) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    overallRating: 0,
    teachingQuality: 0,
    communication: 0,
    punctuality: 0,
    helpfulness: 0,
    wouldRecommend: false,
    strengths: [],
    improvements: [],
    comments: '',
    anonymous: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const strengthOptions = [
    'Clear explanations',
    'Patient and understanding',
    'Good at breaking down complex topics',
    'Encouraging and supportive',
    'Well-prepared lessons',
    'Good use of examples',
    'Interactive teaching style',
    'Punctual and reliable'
  ];

  const improvementOptions = [
    'More practice problems',
    'Slower pace',
    'More visual aids',
    'More homework',
    'Different teaching methods',
    'More interaction',
    'Better time management',
    'More challenging content'
  ];

  const handleRatingChange = (category: keyof FeedbackData, rating: number) => {
    setFeedback(prev => ({ ...prev, [category]: rating }));
  };

  const handleStrengthToggle = (strength: string) => {
    setFeedback(prev => ({
      ...prev,
      strengths: prev.strengths.includes(strength)
        ? prev.strengths.filter(s => s !== strength)
        : [...prev.strengths, strength]
    }));
  };

  const handleImprovementToggle = (improvement: string) => {
    setFeedback(prev => ({
      ...prev,
      improvements: prev.improvements.includes(improvement)
        ? prev.improvements.filter(i => i !== improvement)
        : [...prev.improvements, improvement]
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(feedback);
    setFeedback({
      overallRating: 0,
      teachingQuality: 0,
      communication: 0,
      punctuality: 0,
      helpfulness: 0,
      wouldRecommend: false,
      strengths: [],
      improvements: [],
      comments: '',
      anonymous: false
    });
    setCurrentStep(1);
    onClose();
  };

  const handleClose = () => {
    setFeedback({
      overallRating: 0,
      teachingQuality: 0,
      communication: 0,
      punctuality: 0,
      punctuality: 0,
      helpfulness: 0,
      wouldRecommend: false,
      strengths: [],
      improvements: [],
      comments: '',
      anonymous: false
    });
    setCurrentStep(1);
    onClose();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return feedback.overallRating > 0;
      case 2:
        return feedback.teachingQuality > 0 && feedback.communication > 0 && feedback.punctuality > 0 && feedback.helpfulness > 0;
      case 3:
        return feedback.strengths.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tutor Feedback</h2>
              <p className="text-gray-600 mt-1">Help us improve by sharing your experience</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tutorName}</h3>
              <p className="text-sm text-gray-600">{subject}</p>
              <p className="text-sm text-gray-500">{sessionCount} session(s) completed</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <span className={`text-sm font-medium ${
                  currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Overall' : step === 2 ? 'Details' : step === 3 ? 'Strengths' : 'Comments'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h3>
                <p className="text-gray-600 mb-6">How would you rate your overall experience with {tutorName}?</p>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange('overallRating', rating)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        feedback.overallRating >= rating
                          ? 'bg-yellow-400 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      <Star className="w-6 h-6" />
                    </button>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-600">
                    {feedback.overallRating === 0 ? 'Select a rating' :
                     feedback.overallRating === 1 ? 'Poor' :
                     feedback.overallRating === 2 ? 'Fair' :
                     feedback.overallRating === 3 ? 'Good' :
                     feedback.overallRating === 4 ? 'Very Good' : 'Excellent'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Ratings</h3>
                <p className="text-gray-600 mb-6">Please rate different aspects of the tutoring experience</p>
                
                <div className="space-y-6">
                  {[
                    { key: 'teachingQuality', label: 'Teaching Quality', description: 'How well did the tutor explain concepts?' },
                    { key: 'communication', label: 'Communication', description: 'How clear and effective was the communication?' },
                    { key: 'punctuality', label: 'Punctuality', description: 'How punctual was the tutor for sessions?' },
                    { key: 'helpfulness', label: 'Helpfulness', description: 'How helpful was the tutor in addressing questions?' }
                  ].map((item) => (
                    <div key={item.key} className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleRatingChange(item.key as keyof FeedbackData, rating)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              feedback[item.key as keyof FeedbackData] >= rating
                                ? 'bg-blue-500 text-white'
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

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What were the tutor's strengths?</h3>
                <p className="text-gray-600 mb-6">Select all that apply</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {strengthOptions.map((strength) => (
                    <button
                      key={strength}
                      onClick={() => handleStrengthToggle(strength)}
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        feedback.strengths.includes(strength)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`w-4 h-4 ${
                          feedback.strengths.includes(strength) ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span>{strength}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for improvement</h3>
                <p className="text-gray-600 mb-6">What could be improved? (Optional)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {improvementOptions.map((improvement) => (
                    <button
                      key={improvement}
                      onClick={() => handleImprovementToggle(improvement)}
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        feedback.improvements.includes(improvement)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`w-4 h-4 ${
                          feedback.improvements.includes(improvement) ? 'text-orange-600' : 'text-gray-400'
                        }`} />
                        <span>{improvement}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Comments</h3>
                <textarea
                  value={feedback.comments}
                  onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Share any additional thoughts about your experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="wouldRecommend"
                    checked={feedback.wouldRecommend}
                    onChange={(e) => setFeedback(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="wouldRecommend" className="text-sm font-medium text-gray-900">
                    I would recommend this tutor to others
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={feedback.anonymous}
                    onChange={(e) => setFeedback(prev => ({ ...prev, anonymous: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="anonymous" className="text-sm font-medium text-gray-900">
                    Submit feedback anonymously
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
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
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Feedback
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorFeedbackForm;

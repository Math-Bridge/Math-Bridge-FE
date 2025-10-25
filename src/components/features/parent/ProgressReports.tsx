import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Star, 
  Calendar,
  User,
  Award,
  Download,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProgressData {
  childId: string;
  childName: string;
  subject: string;
  grade: string;
  curriculum: string;
  level: string;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  improvement: number;
  lastTestScore: number;
  lastTestDate: string;
  tutorName: string;
  centerName: string;
}

interface TestResult {
  id: string;
  testName: string;
  subject: string;
  score: number;
  maxScore: number;
  date: string;
  level: string;
  feedback: string;
}

interface ProgressReport {
  childId: string;
  childName: string;
  subject: string;
  grade: string;
  curriculum: string;
  level: string;
  overallProgress: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  testResults: TestResult[];
  tutorFeedback: string;
  nextGoals: string[];
}

const ProgressReports: React.FC = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [detailedReport, setDetailedReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo
    setProgressData([
      {
        childId: '1',
        childName: 'Nguyen Minh Anh',
        subject: 'Mathematics',
        grade: '8',
        curriculum: 'Vietnamese National Curriculum',
        level: 'Intermediate',
        totalSessions: 20,
        completedSessions: 16,
        averageScore: 85,
        improvement: 15,
        lastTestScore: 88,
        lastTestDate: '2024-01-10',
        tutorName: 'Dr. Sarah Johnson',
        centerName: 'MathBridge Center District 1'
      },
      {
        childId: '2',
        childName: 'Tran Duc Minh',
        subject: 'Physics',
        grade: '11',
        curriculum: 'Vietnamese National Curriculum',
        level: 'Advanced',
        totalSessions: 15,
        completedSessions: 15,
        averageScore: 92,
        improvement: 8,
        lastTestScore: 95,
        lastTestDate: '2024-01-08',
        tutorName: 'Dr. Chen Wei',
        centerName: 'MathBridge Center Thu Duc'
      }
    ]);
    setLoading(false);
  }, []);

  const filteredData = progressData.filter(item => {
    const matchesChild = !selectedChild || item.childId === selectedChild;
    const matchesSubject = !selectedSubject || item.subject === selectedSubject;
    const matchesLevel = !selectedLevel || item.level === selectedLevel;
    return matchesChild && matchesSubject && matchesLevel;
  });

  const handleViewDetailedReport = (childId: string) => {
    // Mock detailed report data
    const mockReport: ProgressReport = {
      childId,
      childName: progressData.find(p => p.childId === childId)?.childName || '',
      subject: progressData.find(p => p.childId === childId)?.subject || '',
      grade: progressData.find(p => p.childId === childId)?.grade || '',
      curriculum: progressData.find(p => p.childId === childId)?.curriculum || '',
      level: progressData.find(p => p.childId === childId)?.level || '',
      overallProgress: 78,
      strengths: [
        'Strong problem-solving skills',
        'Good understanding of algebraic concepts',
        'Excellent attendance and participation',
        'Quick learner with new topics'
      ],
      areasForImprovement: [
        'Geometry proofs need more practice',
        'Word problems could be approached more systematically',
        'Time management during tests'
      ],
      recommendations: [
        'Focus on geometry practice sessions',
        'Implement timed problem-solving exercises',
        'Continue with current learning pace'
      ],
      testResults: [
        {
          id: '1',
          testName: 'Algebra Midterm',
          subject: 'Mathematics',
          score: 88,
          maxScore: 100,
          date: '2024-01-10',
          level: 'Intermediate',
          feedback: 'Excellent work on algebraic equations. Minor errors in word problems.'
        },
        {
          id: '2',
          testName: 'Geometry Quiz',
          subject: 'Mathematics',
          score: 75,
          maxScore: 100,
          date: '2024-01-05',
          level: 'Intermediate',
          feedback: 'Good understanding of basic concepts. Needs more practice with proofs.'
        }
      ],
      tutorFeedback: 'Student shows excellent progress in mathematics. Strong analytical thinking and good problem-solving approach. Recommended to focus more on geometry and word problems.',
      nextGoals: [
        'Master geometry proofs',
        'Improve word problem solving',
        'Achieve 90+ average score'
      ]
    };
    setDetailedReport(mockReport);
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
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
              <h1 className="text-3xl font-bold text-gray-900">Progress Reports</h1>
              <p className="text-gray-600 mt-2">Track your children's learning progress and achievements</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Export Reports</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Child</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Children</option>
                {progressData.map((child) => (
                  <option key={child.childId} value={child.childId}>{child.childName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Subjects</option>
                {[...new Set(progressData.map(item => item.subject))].map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {[...new Set(progressData.map(item => item.level))].map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedChild('');
                  setSelectedSubject('');
                  setSelectedLevel('');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {filteredData.map((item) => (
            <div key={item.childId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.childName}</h3>
                  <p className="text-sm text-gray-600">{item.subject} • Grade {item.grade}</p>
                  <p className="text-xs text-gray-500">{item.curriculum}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.level === 'Advanced' ? 'bg-purple-100 text-purple-800' :
                  item.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.level}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className={`font-semibold ${getProgressColor(item.averageScore)}`}>
                      {item.averageScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(item.averageScore)}`}
                      style={{ width: `${item.averageScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{item.completedSessions}</p>
                    <p className="text-sm text-gray-600">Sessions Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">+{item.improvement}%</p>
                    <p className="text-sm text-gray-600">Improvement</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tutor: {item.tutorName}</span>
                    <span className="text-gray-600">Last Test: {new Date(item.lastTestDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewDetailedReport(item.childId)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View Detailed Report
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Report Modal */}
        {detailedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Detailed Progress Report</h2>
                    <p className="text-gray-600 mt-1">
                      {detailedReport.childName} • {detailedReport.subject} • Grade {detailedReport.grade}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetailedReport(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Overall Progress */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Overall Progress</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-blue-900">{detailedReport.overallProgress}%</span>
                    <div className="w-32 bg-blue-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${detailedReport.overallProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Strengths and Areas for Improvement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Strengths</h3>
                    <ul className="space-y-2">
                      {detailedReport.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Areas for Improvement</h3>
                    <ul className="space-y-2">
                      {detailedReport.areasForImprovement.map((area, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-1" />
                          <span className="text-sm text-gray-700">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Test Results */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Test Results</h3>
                  <div className="space-y-3">
                    {detailedReport.testResults.map((test) => (
                      <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                          <span className="text-sm text-gray-600">{new Date(test.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Score: {test.score}/{test.maxScore}</span>
                          <span className={`font-semibold ${getProgressColor(test.score)}`}>
                            {Math.round((test.score / test.maxScore) * 100)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{test.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tutor Feedback */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Tutor Feedback</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700">{detailedReport.tutorFeedback}</p>
                  </div>
                </div>

                {/* Recommendations and Next Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {detailedReport.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Award className="w-4 h-4 text-blue-500 mt-1" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Next Goals</h3>
                    <ul className="space-y-2">
                      {detailedReport.nextGoals.map((goal, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500 mt-1" />
                          <span className="text-sm text-gray-700">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDetailedReport(null)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressReports;

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  BookOpen,
  Search,
  Award,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  getTestResultsByChildId,
  TestResult,
  getChildrenByParent,
  Child,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

const ParentTestResults: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchTestResults();
      
      // Auto-reload test results every 60 seconds
      const testResultsInterval = setInterval(() => {
        fetchTestResults();
      }, 60000);
      
      return () => clearInterval(testResultsInterval);
    } else {
      setTestResults([]);
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getChildrenByParent(user.id);
      if (result.success && result.data) {
        const mappedChildren = (Array.isArray(result.data) ? result.data : [])
          .filter((child: any) => (child.Status || child.status || 'active') !== 'deleted')
          .map((child: any) => ({
            childId: child.ChildId || child.childId || '',
            fullName: child.FullName || child.fullName || '',
            schoolId: child.SchoolId || child.schoolId || '',
            schoolName: child.SchoolName || child.schoolName || '',
            grade: child.Grade || child.grade || '',
            status: child.Status || child.status || 'active',
          }));
        setChildren(mappedChildren);
        if (mappedChildren.length === 1) {
          setSelectedChildId(mappedChildren[0].childId);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestResults = async () => {
    if (!selectedChildId) return;

    try {
      setLoadingResults(true);
      const result = await getTestResultsByChildId(selectedChildId);
      if (result.success && result.data) {
        setTestResults(result.data);
      } else {
        setTestResults([]);
        if (result.error) {
          showError(result.error);
        }
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
      setTestResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredResults = testResults.filter((result) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      result.testType.toLowerCase().includes(term) ||
      result.notes?.toLowerCase().includes(term) ||
      result.score.toString().includes(term)
    );
  });

  // Calculate statistics
  const totalTests = testResults.length;
  const averageScore = totalTests > 0
    ? (testResults.reduce((sum, r) => sum + r.score, 0) / totalTests).toFixed(1)
    : 0;
  const highestScore = totalTests > 0
    ? Math.max(...testResults.map(r => r.score))
    : 0;
  const recentTests = testResults
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Test Results
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">View your child's test scores and performance</p>
            </div>
          </div>
        </div>

        {/* Child Selection */}
        {children.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-6 mb-6 backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <label className="block text-sm font-semibold text-gray-800">
                Select Child
              </label>
            </div>
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value || null)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
            >
              <option value="">-- Select a child --</option>
              {children.map((child) => (
                <option key={child.childId} value={child.childId}>
                  {child.fullName} {child.grade ? `(Grade ${child.grade})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {!selectedChildId ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-16 text-center backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
              <Award className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Child Selected</h3>
            <p className="text-gray-600 text-lg">Please select a child to view their test results</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <BarChart3 className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Tests</p>
                <p className="text-3xl font-bold">{totalTests}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <Award className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-green-100 text-sm font-medium mb-1">Average Score</p>
                <p className="text-3xl font-bold">{averageScore}</p>
                <p className="text-green-100 text-xs mt-1">Out of all tests</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <BarChart3 className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-purple-100 text-sm font-medium mb-1">Highest Score</p>
                <p className="text-3xl font-bold">{highestScore}</p>
                <p className="text-purple-100 text-xs mt-1">Best performance</p>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-6 mb-6 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Search className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Search Test Results</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by test type, score, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                />
              </div>
            </div>

            {/* Test Results List */}
            {loadingResults ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-16 text-center backdrop-blur-sm">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg font-medium">Loading test results...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-16 text-center backdrop-blur-sm">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Test Results Found</h3>
                <p className="text-gray-600 text-lg">
                  {testResults.length === 0
                    ? 'No test results available for this child yet'
                    : 'No test results match your search criteria'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResults.map((result) => {
                  const scoreColor =
                    result.score >= 8
                      ? 'from-green-500 to-emerald-600'
                      : result.score >= 5
                      ? 'from-yellow-500 to-amber-600'
                      : 'from-red-500 to-rose-600';

                  return (
                    <div
                      key={result.resultId}
                      className="bg-white rounded-2xl shadow-md border border-gray-200/50 overflow-hidden backdrop-blur-sm transform transition-all duration-200 hover:shadow-xl hover:scale-[1.01]"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className={`p-2 bg-gradient-to-br ${scoreColor} rounded-lg`}>
                                <Award className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-900">{result.testType}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">
                                    {formatDate(result.createdDate)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mb-3">
                              <div className={`px-4 py-2 bg-gradient-to-br ${scoreColor} rounded-xl text-white shadow-lg`}>
                                <div className="text-xs font-semibold mb-1">Score</div>
                                <div className="text-2xl font-bold">{result.score}</div>
                              </div>
                              {result.bookingId && (
                                <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-center space-x-2">
                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">Linked to Session</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {result.notes && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FileText className="w-4 h-4 text-gray-600" />
                                  <h4 className="text-sm font-bold text-gray-900">Notes</h4>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {result.notes}
                                </p>
                              </div>
                            )}

                            {result.updatedDate !== result.createdDate && (
                              <div className="mt-3 text-xs text-gray-500">
                                Updated: {formatDate(result.updatedDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentTestResults;



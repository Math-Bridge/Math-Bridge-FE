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
        // Auto-select first child if there are any children
        if (mappedChildren.length > 0) {
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
      <div className="w-full">
        {/* Subtle Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-primary/15 text-7xl font-light select-none animate-float"
                style={{
                  left: `${10 + (i * 70) % 85}%`,
                  top: `${15 + (i * 55) % 80}%`,
                  animationDelay: `${i * 3}s`,
                }}
              >
                {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-screen bg-gradient-to-b from-background-cream via-white to-gray-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
          }
          .animate-float { animation: float 25s linear infinite; }
        `}} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Subtle Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-primary/15 text-7xl font-light select-none animate-float"
              style={{
                left: `${10 + (i * 70) % 85}%`,
                top: `${15 + (i * 55) % 80}%`,
                animationDelay: `${i * 3}s`,
              }}
            >
              {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50">
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
        {/* Header */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-8 sm:p-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Award className="w-8 h-8 text-white" />
            </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-2">
                Test Results
              </h1>
                    <p className="text-lg sm:text-xl text-white/95">
                      View your child's test scores and performance
                    </p>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Child Selection */}
        {children.length > 0 && (
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-5 h-5 text-primary" />
                <label className="block text-sm font-semibold text-primary-dark">
                Select Child
              </label>
            </div>
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value || null)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white text-gray-900 font-medium"
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
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
              <Award className="w-10 h-10 text-primary" />
            </div>
              <h3 className="text-2xl font-bold text-primary-dark mb-3">No Child Selected</h3>
            <p className="text-gray-600 text-lg">Please select a child to view their test results</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary opacity-80" />
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Tests</p>
                <p className="text-3xl font-bold text-primary-dark">{totalTests}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <Award className="w-8 h-8 text-primary opacity-80" />
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">Average Score</p>
                <p className="text-3xl font-bold text-primary-dark">{averageScore}</p>
                <p className="text-gray-500 text-xs mt-1">Out of all tests</p>
              </div>

              <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary opacity-80" />
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">Highest Score</p>
                <p className="text-3xl font-bold text-primary-dark">{highestScore}</p>
                <p className="text-gray-500 text-xs mt-1">Best performance</p>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Search className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-primary-dark">Search Test Results</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by test type, score, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white"
                />
              </div>
            </div>

            {/* Test Results List */}
            {loadingResults ? (
              <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-16 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg font-medium">Loading test results...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-primary-dark mb-3">No Test Results Found</h3>
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
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : result.score >= 5
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      : 'bg-red-100 text-red-800 border-red-300';

                  return (
                    <div
                      key={result.resultId}
                      className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden transform transition-all duration-200 hover:shadow-math-lg hover:scale-[1.01]"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className={`p-2 ${scoreColor} rounded-lg border-2`}>
                                <Award className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-primary-dark">{result.testType}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">
                                    {formatDate(result.createdDate)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mb-3">
                              <div className={`px-4 py-2 ${scoreColor} rounded-xl border-2`}>
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

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-float { animation: float 25s linear infinite; }
      `}} />
    </div>
  );
};

export default ParentTestResults;



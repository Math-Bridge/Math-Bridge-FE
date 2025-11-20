import React, { useState, useEffect } from 'react';
import {
  FileText,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Calendar,
  User,
  BookOpen,
  Loader,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import {
  getTutorSessions,
  getTestResultsByContractId,
  createTestResult,
  updateTestResult,
  deleteTestResult,
  TestResult,
  CreateTestResultRequest,
  Session,
} from '../../../services/api';

const TutorTestResult: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [existingTestResults, setExistingTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    testType: '',
    score: 0,
    notes: '',
    contractId: '',
    bookingId: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedSession) {
      fetchTestResults();
      resetForm();
    } else {
      setExistingTestResults([]);
      resetForm();
    }
  }, [selectedSession]);

  useEffect(() => {
    if (editingId && existingTestResults.length > 0) {
      const testResult = existingTestResults.find(r => r.resultId === editingId);
      if (testResult) {
        setFormData({
          testType: testResult.testType,
          score: testResult.score,
          notes: testResult.notes || '',
          contractId: testResult.contractId,
          bookingId: testResult.bookingId || '',
        });
      }
    }
  }, [editingId, existingTestResults]);

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getTutorSessions();
      if (result.success && result.data) {
        // Sort by session date (newest first)
        const sorted = [...result.data].sort((a, b) => {
          const dateA = new Date(a.sessionDate || '').getTime();
          const dateB = new Date(b.sessionDate || '').getTime();
          return dateB - dateA;
        });
        setSessions(sorted);
      } else {
        showError(result.error || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestResults = async () => {
    if (!selectedSession?.contractId) return;

    try {
      setLoadingResults(true);
      const result = await getTestResultsByContractId(selectedSession.contractId);
      if (result.success && result.data) {
        setExistingTestResults(result.data);
      } else {
        setExistingTestResults([]);
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
      setExistingTestResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    if (selectedSession) {
      setFormData({
        testType: '',
        score: 0,
        notes: '',
        contractId: selectedSession.contractId,
        bookingId: selectedSession.bookingId || '',
      });
    } else {
      setFormData({
        testType: '',
        score: 0,
        notes: '',
        contractId: '',
        bookingId: '',
      });
    }
  };

  const handleEdit = (testResult: TestResult) => {
    setEditingId(testResult.resultId);
    setFormData({
      testType: testResult.testType,
      score: testResult.score,
      notes: testResult.notes || '',
      contractId: testResult.contractId,
      bookingId: testResult.bookingId || '',
    });
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSession) {
      showError('Please select a session');
      return;
    }

    if (!formData.testType.trim()) {
      showError('Test type is required');
      return;
    }

    if (formData.score < 0) {
      showError('Score must be 0 or greater');
      return;
    }

    if (!formData.contractId) {
      showError('Contract ID is required');
      return;
    }

    // Validate notes length
    if (formData.notes && formData.notes.length > 1000) {
      showError('Notes cannot exceed 1000 characters');
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        // Update existing
        const result = await updateTestResult(editingId, {
          testType: formData.testType,
          score: formData.score,
          notes: formData.notes.trim() || undefined,
          contractId: formData.contractId,
          bookingId: formData.bookingId || undefined,
        });
        if (result.success) {
          showSuccess('Test result updated successfully');
          await fetchTestResults();
          resetForm();
        } else {
          showError(result.error || 'Failed to update test result');
        }
      } else {
        // Create new
        const request: CreateTestResultRequest = {
          testType: formData.testType,
          score: formData.score,
          notes: formData.notes.trim() || undefined,
          contractId: formData.contractId,
          bookingId: formData.bookingId || undefined,
        };
        const result = await createTestResult(request);
        if (result.success) {
          showSuccess('Test result created successfully');
          await fetchTestResults();
          resetForm();
        } else {
          showError(result.error || 'Failed to create test result');
        }
      }
    } catch (error: any) {
      console.error('Error saving test result:', error);
      showError(error?.message || 'Failed to save test result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resultId: string) => {
    if (!window.confirm('Are you sure you want to delete this test result?')) {
      return;
    }

    try {
      const result = await deleteTestResult(resultId);
      if (result.success) {
        showSuccess('Test result deleted successfully');
        await fetchTestResults();
      } else {
        showError(result.error || 'Failed to delete test result');
      }
    } catch (error: any) {
      console.error('Error deleting test result:', error);
      showError(error?.message || 'Failed to delete test result');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeString;
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      session.childName?.toLowerCase().includes(term) ||
      session.sessionDate?.toLowerCase().includes(term) ||
      session.packageName?.toLowerCase().includes(term)
    );
  });

  // Get test results linked to selected session
  const sessionTestResults = existingTestResults.filter(
    (result) => result.bookingId === selectedSession?.bookingId
  );

  // Get other test results for the contract
  const otherTestResults = existingTestResults.filter(
    (result) => result.bookingId !== selectedSession?.bookingId
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Test Results</h2>
        <p className="text-gray-600 mt-1">Create and manage test results for your sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sessions</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No sessions found</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.bookingId}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedSession?.bookingId === session.bookingId
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        {session.childName || 'Student'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {session.sessionDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(session.sessionDate)}</span>
                        </div>
                      )}
                      {session.startTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(session.startTime)} - {formatTime(session.endTime || session.startTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Session Detail & Test Result Form */}
        <div className="lg:col-span-2">
          {!selectedSession ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Session Selected</h3>
              <p className="text-gray-600">Please select a session to create or manage test results</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              {/* Session Detail Section */}
              <div className="bg-gradient-to-br from-blue-50 via-white to-white border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Session Details</h3>
                    <p className="text-sm text-gray-600 mt-1">Review session information before creating test result</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSession(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 p-2 rounded-lg"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Student</div>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <User className="w-5 h-5 text-purple-500" />
                      <div className="text-sm font-medium">{selectedSession.childName || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Date</div>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <Calendar className="w-5 h-5 text-emerald-500" />
                      <div className="text-sm font-medium">{formatDate(selectedSession.sessionDate || '')}</div>
                    </div>
                  </div>
                  
                  {selectedSession.startTime && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Time</div>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <div className="text-sm font-medium">
                          {formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime || selectedSession.startTime)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Status</div>
                    <span
                      className={`inline-flex px-3 py-1 rounded-lg text-sm font-bold capitalize ${
                        selectedSession.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : selectedSession.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {selectedSession.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Test Result Form Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {editingId ? 'Update Test Result' : 'Create Test Result'}
                  </h2>
                  <p className="text-gray-600">Fill in the test result details for this session</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Test Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.testType}
                      onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Midterm Exam, Final Test, Quiz"
                      maxLength={50}
                      required
                    />
                  </div>

                  {/* Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter score"
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={6}
                      maxLength={1000}
                      placeholder="Add notes about the test result, student performance, areas of improvement, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/1000 characters</p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !formData.testType.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{editingId ? 'Update Test Result' : 'Create Test Result'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Test Results for this Session */}
              {loadingResults ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <>
                  {sessionTestResults.length > 0 && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Test Results for This Session</span>
                      </h3>
                      <div className="space-y-3">
                        {sessionTestResults.map((result) => (
                          <div
                            key={result.resultId}
                            className={`border rounded-lg p-4 ${
                              editingId === result.resultId
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-semibold text-gray-900">{result.testType}</h4>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                                    Score: {result.score}
                                  </span>
                                </div>
                                {result.notes && (
                                  <p className="text-sm text-gray-600 mb-2">{result.notes}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Created: {formatDate(result.createdDate)}</span>
                                  </span>
                                  {result.updatedDate !== result.createdDate && (
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Updated: {formatDate(result.updatedDate)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEdit(result)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(result.resultId)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Test Results for this Contract */}
                  {otherTestResults.length > 0 && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>Other Test Results (Same Contract)</span>
                      </h3>
                      <div className="space-y-3">
                        {otherTestResults.map((result) => (
                          <div
                            key={result.resultId}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-semibold text-gray-900">{result.testType}</h4>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                                    Score: {result.score}
                                  </span>
                                </div>
                                {result.notes && (
                                  <p className="text-sm text-gray-600 mb-2">{result.notes}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Created: {formatDate(result.createdDate)}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEdit(result)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(result.resultId)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorTestResult;

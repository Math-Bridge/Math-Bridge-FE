import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  BookOpen,
  Save,
  X,
  Loader2,
  Search,
  Edit,
  Trash2,
  Award,
  User,
} from 'lucide-react';
import {
  getTutorSessions,
  Session,
  getTestResultsByContractId,
  createTestResult,
  updateTestResult,
  deleteTestResult,
  TestResult,
  CreateTestResultRequest,
  UpdateTestResultRequest,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

const TutorTestResult: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contracts, setContracts] = useState<Array<{ contractId: string; childName: string; packageName?: string }>>([]);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
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
  });

  useEffect(() => {
    fetchSessions();
  }, [user?.id]);

  useEffect(() => {
    if (selectedContract) {
      fetchTestResults();
    } else {
      setTestResults([]);
    }
  }, [selectedContract]);

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getTutorSessions();
      if (result.success && result.data) {
        setSessions(result.data);
        
        // Extract unique contracts
        const contractMap = new Map<string, { contractId: string; childName: string; packageName?: string }>();
        result.data.forEach((session: Session) => {
          if (session.contractId && !contractMap.has(session.contractId)) {
            contractMap.set(session.contractId, {
              contractId: session.contractId,
              childName: session.childName || 'Unknown Child',
              packageName: session.packageName,
            });
          }
        });
        setContracts(Array.from(contractMap.values()));
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestResults = async () => {
    if (!selectedContract) return;

    try {
      setLoadingResults(true);
      const result = await getTestResultsByContractId(selectedContract);
      if (result.success && result.data) {
        setTestResults(result.data);
      } else {
        setTestResults([]);
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
      showError('Failed to load test results');
      setTestResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleEdit = (result: TestResult) => {
    setEditingId(result.resultId);
    setFormData({
      testType: result.testType,
      score: result.score,
      notes: result.notes || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      testType: '',
      score: 0,
      notes: '',
    });
  };

  const handleDelete = async (resultId: string) => {
    if (!window.confirm('Are you sure you want to delete this test result?')) {
      return;
    }

    try {
      const result = await deleteTestResult(resultId);
      if (result.success) {
        showSuccess('Test result deleted successfully');
        fetchTestResults();
      } else {
        showError(result.error || 'Failed to delete test result');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to delete test result');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedContract) {
      showError('Please select a contract');
      return;
    }

    if (!formData.testType.trim()) {
      showError('Test type is required');
      return;
    }

    if (formData.score < 0 || formData.score > 10) {
      showError('Score must be between 0 and 10');
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        // Update existing
        const updateData: UpdateTestResultRequest = {
          testType: formData.testType.trim(),
          score: formData.score,
          notes: formData.notes.trim() || undefined,
        };

        const result = await updateTestResult(editingId, updateData);
        if (result.success) {
          showSuccess('Test result updated successfully');
          handleCancel();
          fetchTestResults();
        } else {
          showError(result.error || 'Failed to update test result');
        }
      } else {
        // Create new
        const createData: CreateTestResultRequest = {
          testType: formData.testType.trim(),
          score: formData.score,
          notes: formData.notes.trim() || undefined,
          contractId: selectedContract,
        };

        const result = await createTestResult(createData);
        if (result.success) {
          showSuccess('Test result created successfully');
          setFormData({
            testType: '',
            score: 0,
            notes: '',
          });
          fetchTestResults();
        } else {
          showError(result.error || 'Failed to create test result');
        }
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to save test result');
    } finally {
      setSubmitting(false);
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

  const filteredContracts = contracts.filter((contract) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      contract.childName?.toLowerCase().includes(term) ||
      contract.packageName?.toLowerCase().includes(term) ||
      contract.contractId.toLowerCase().includes(term)
    );
  });

  const selectedContractData = contracts.find(c => c.contractId === selectedContract);
  const sessionTestResults = testResults
    .filter(r => r.contractId === selectedContract)
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = new Date(a.createdDate).getTime();
      const dateB = new Date(b.createdDate).getTime();
      return dateB - dateA;
    });
  const otherTestResults = testResults
    .filter(r => r.contractId !== selectedContract)
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = new Date(a.createdDate).getTime();
      const dateB = new Date(b.createdDate).getTime();
      return dateB - dateA;
    });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
            <p className="text-gray-600 mt-1">Manage test results for your students</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contracts List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredContracts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No contracts found</p>
                </div>
              ) : (
                filteredContracts.map((contract) => (
                  <button
                    key={contract.contractId}
                    onClick={() => setSelectedContract(contract.contractId)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedContract === contract.contractId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{contract.childName}</p>
                        {contract.packageName && (
                          <p className="text-sm text-gray-500 truncate">{contract.packageName}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Form and Results */}
        <div className="lg:col-span-2">
          {!selectedContract ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Contract Selected</h3>
              <p className="text-gray-600">Please select a contract to view or create test results</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingId ? 'Edit Test Result' : 'Create New Test Result'}
                </h2>
                {selectedContractData && (
                  <p className="text-sm text-gray-600 mb-4">
                    For: <span className="font-medium">{selectedContractData.childName}</span>
                  </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.testType}
                      onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                      placeholder="e.g., Midterm Exam, Final Test, Quiz"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score (0-10) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10"
                      step="0.1"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about the test..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
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

              {/* Existing Test Results for this Contract */}
              {loadingResults ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <>
                  {sessionTestResults.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Test Results for This Contract</span>
                      </h3>
                      <div className="space-y-3">
                        {sessionTestResults.map((result) => {
                          const scoreColorClass =
                            result.score >= 8
                              ? 'bg-green-100 text-green-800'
                              : result.score >= 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800';
                          
                          return (
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
                                  <span className={`px-2 py-1 ${scoreColorClass} text-sm font-semibold rounded`}>
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
                          );
                        })}
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



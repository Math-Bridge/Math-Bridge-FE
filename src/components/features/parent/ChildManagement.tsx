import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  School, 
  Calendar,
  BookOpen,
  Star,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Upload,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../contexts/ToastContext';
import ConfirmDialog from '../../common/ConfirmDialog';
import { getChildrenByParent, softDeleteChild, updateChild } from '../../../services/api';

interface Child {
  id: string;
  fullName: string;
  school: string;
  grade: string;
  dateOfBirth: string;
  centerId?: string;
  centerName?: string;
  status: 'active' | 'inactive';
  subjects: string[];
  testScores?: Array<{
    subject: string;
    score: number;
    date: string;
  }>;
  testFiles?: Array<{
    name: string;
    url: string;
    uploadDate: string;
  }>;
}

const ChildManagement: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; childId: string | null }>({
    isOpen: false,
    childId: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        // Get parent ID from localStorage
        const userStr = localStorage.getItem('user');
        const parentId = userStr ? JSON.parse(userStr).id : null;

        if (!parentId) {
          console.error('Parent ID not found');
          setLoading(false);
          return;
        }

        const response = await getChildrenByParent(parentId);
        if (response.success && response.data) {
          // Map API response to component interface
          // Filter out deleted children (status = "deleted")
          const mappedChildren = response.data
            .filter((child: any) => {
              const status = child.status || child.Status || 'active';
              return status !== 'deleted';
            })
            .map((child: any) => ({
              id: child.childId || child.id || String(child.childId),
              fullName: child.fullName || '',
              school: child.schoolName || child.school || '',
              grade: child.grade || '',
              dateOfBirth: child.dateOfBirth || '',
              centerId: child.centerId,
              centerName: child.centerName || '',
              status: (child.status?.toLowerCase() === 'active' || !child.status) ? 'active' : 'inactive',
              subjects: child.subjects || [],
              testScores: child.testScores || [],
              testFiles: child.testFiles || []
            }));
          setChildren(mappedChildren);
        } else {
          console.error('Failed to fetch children:', response.error);
          setChildren([]);
        }
      } catch (error) {
        console.error('Error fetching children:', error);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const handleAddChild = () => {
    setEditingChild(null);
    setShowAddForm(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setShowAddForm(true);
  };

  const handleDeleteClick = (childId: string) => {
    setDeleteConfirm({ isOpen: true, childId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.childId) return;

    try {
      const response = await softDeleteChild(deleteConfirm.childId);
      if (response.success) {
        showSuccess('Child deleted successfully!');
        setChildren(prev => prev.filter(child => child.id !== deleteConfirm.childId));
      } else {
        const errorMsg = response.error || 'Failed to delete child';
        showError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete child';
      console.error('Error deleting child:', error);
      showError(errorMsg);
    } finally {
      setDeleteConfirm({ isOpen: false, childId: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, childId: null });
  };

  const handleSaveChild = async (childData: Omit<Child, 'id'>) => {
    try {
      if (editingChild) {
        // Update existing child
        const response = await updateChild(editingChild.id, {
          fullName: childData.fullName,
          grade: childData.grade,
          dateOfBirth: childData.dateOfBirth,
          centerId: childData.centerId
        });
        
        if (response.success) {
          showSuccess('Child updated successfully!');
          setChildren(prev => prev.map(child => 
            child.id === editingChild.id 
              ? { ...child, ...childData }
              : child
          ));
        } else {
          showError(response.error || 'Failed to update child');
          return;
        }
      } else {
        // Add new child - handled by form component which calls addChild API
        const newChild: Child = {
          ...childData,
          id: Date.now().toString()
        };
        setChildren(prev => [...prev, newChild]);
      }
      setShowAddForm(false);
      setEditingChild(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save child';
      console.error('Error saving child:', error);
      showError(errorMsg);
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Child Management</h1>
              <p className="text-gray-600 mt-2">Manage your children's profiles and learning progress</p>
            </div>
            <button
              onClick={handleAddChild}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Child</span>
            </button>
          </div>
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            // Pagination logic
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedChildren = children.slice(startIndex, endIndex);

            return paginatedChildren.map((child) => (
            <div key={child.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{child.fullName}</h3>
                      <p className="text-sm text-gray-600">Grade {child.grade}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    child.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {child.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <School className="w-4 h-4" />
                    <span>{child.school}</span>
                  </div>
                  
                  {child.centerName && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{child.centerName}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Born: {new Date(child.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Subjects */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {child.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Test Scores */}
                {child.testScores && child.testScores.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('testScores')}</p>
                    <div className="space-y-1">
                      {child.testScores.slice(0, 2).map((test, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{test.subject}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${
                              test.score >= 80 ? 'text-green-600' :
                              test.score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {test.score}%
                            </span>
                            <span className="text-gray-400 text-xs">
                              {new Date(test.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Files */}
                {child.testFiles && child.testFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('testFiles')}</p>
                    <div className="space-y-1">
                      {child.testFiles.slice(0, 2).map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEditChild(child)}
                    className="flex-1 px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                  <button
                    onClick={() => navigate(`/daily-reports`)}
                    className="flex-1 px-3 py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center space-x-1"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">Daily Reports</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(child.id)}
                    className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ));
          })()}
        </div>

        {/* Pagination */}
        {(() => {
          const totalPages = Math.ceil(children.length / itemsPerPage);
          if (totalPages <= 1) return null;
          
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          
          return (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, children.length)} of {children.length} children
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage = 
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 min-w-[2.5rem] rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Empty State */}
        {children.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No children registered</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first child to the system</p>
            <button
              onClick={handleAddChild}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Your First Child
            </button>
          </div>
        )}

        {/* Add/Edit Child Form Modal */}
        {showAddForm && (
          <ChildForm
            child={editingChild}
            onSave={handleSaveChild}
            onCancel={() => {
              setShowAddForm(false);
              setEditingChild(null);
            }}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={t('confirmDeleteChild') || 'Confirm Delete'}
        message={t('confirmDelete') || 'Are you sure you want to delete this child? This action cannot be undone.'}
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel') || 'Cancel'}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
};

// Child Form Component
interface ChildFormProps {
  child?: Child | null;
  onSave: (childData: Omit<Child, 'id'>) => void;
  onCancel: () => void;
}

const ChildForm: React.FC<ChildFormProps> = ({ child, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: child?.fullName || '',
    school: child?.school || '',
    grade: child?.grade || '',
    dateOfBirth: child?.dateOfBirth || '',
    centerId: child?.centerId || '',
    centerName: child?.centerName || '',
    subjects: child?.subjects || [],
    status: child?.status || 'active' as 'active' | 'inactive'
  });

  const [newSubject, setNewSubject] = useState('');
  const [testFiles, setTestFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()]
      }));
      setNewSubject('');
    }
  };

  const removeSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTestFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {child ? t('editChild') : t('addNewChild')}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade *</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Grade</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                  <option key={grade} value={grade.toString()}>Grade {grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School *</label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Add subject"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addSubject}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.subjects.map((subject, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{subject}</span>
                  <button
                    type="button"
                    onClick={() => removeSubject(subject)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Files Upload</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Upload test files (PDF, DOC, DOCX)</p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Choose Files
              </label>
              {testFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{testFiles.length} file(s) selected</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {child ? 'Update Child' : 'Add Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildManagement;

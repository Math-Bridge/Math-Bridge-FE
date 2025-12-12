import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import {
  getAllMathConcepts,
  createMathConcept,
  updateMathConcept,
  deleteMathConcept,
  getAllUnits,
} from '../../../services/api';
import {
  Brain,
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Tag,
} from 'lucide-react';

interface MathConcept {
  conceptId: string;
  name?: string;
  category?: string;
  linkedUnits?: Array<{ unitId: string; unitName: string; curriculumName?: string; unitOrder: number }>;
}

const MathConceptManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showSuccess, showError } = useToast();

  const [mathConcepts, setMathConcepts] = useState<MathConcept[]>([]);
  const [filteredConcepts, setFilteredConcepts] = useState<MathConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<MathConcept | null>(null);
  const [saving, setSaving] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [formData, setFormData] = useState({
    name: '',
    category: '',
  });

  useEffect(() => {
    fetchMathConcepts();
  }, []);

  useEffect(() => {
    filterConcepts();
    setCurrentPage(1);
  }, [mathConcepts, searchTerm, categoryFilter]);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isClickOnDropdown = target.closest('.dropdown-menu');
      const isClickOnActionButton = target.closest('button[title="Actions"]');
      
      if (!isClickOnDropdown && !isClickOnActionButton) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    const handleScroll = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    const updateDropdownPosition = () => {
      if (openDropdownId) {
        const button = actionButtonRefs.current[openDropdownId];
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          });
        }
      }
    };

    if (openDropdownId) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', updateDropdownPosition);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [openDropdownId]);

  const fetchMathConcepts = async () => {
    try {
      setLoading(true);
      const res = await getAllMathConcepts();
      if (res.success && res.data) {
        // Backend returns { data: [...], totalCount: ... }
        // So res.data is the whole object, we need res.data.data
        const conceptsArray = Array.isArray(res.data) 
          ? res.data 
          : (res.data.data || res.data);
        
        if (Array.isArray(conceptsArray)) {
          const mapped = conceptsArray.map((item: any) => ({
            conceptId: item.conceptId || item.ConceptId || '',
            name: item.name || item.Name || '',
            category: item.category || item.Category || '',
            linkedUnits: item.linkedUnits || item.LinkedUnits || [],
          }));
          setMathConcepts(mapped);
        } else {
          setMathConcepts([]);
        }
      } else {
        setMathConcepts([]);
      }
    } catch (err) {
      console.error(err);
      showError('Failed to load math concepts');
      setMathConcepts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterConcepts = () => {
    let filtered = [...mathConcepts];

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.category?.toLowerCase().includes(term)
      );
    }

    setFilteredConcepts(filtered);
  };

  const handleCreateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Math concept name is required');
      return;
    }

    try {
      setSaving(true);
      const res = await createMathConcept({
        Name: formData.name.trim(),
        Category: formData.category.trim() || undefined,
      });
      
      if (res.success) {
        showSuccess('Math concept created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchMathConcepts();
      } else {
        showError(res.error || 'Failed to create math concept');
      }
    } catch (err) {
      console.error(err);
      showError('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConcept) return;

    if (!formData.name.trim()) {
      showError('Math concept name is required');
      return;
    }

    try {
      setSaving(true);
      const res = await updateMathConcept(selectedConcept.conceptId, {
        Name: formData.name.trim(),
        Category: formData.category.trim() || undefined,
      });
      
      if (res.success) {
        showSuccess('Math concept updated successfully');
        setShowEditModal(false);
        setSelectedConcept(null);
        resetForm();
        fetchMathConcepts();
      } else {
        showError(res.error || 'Failed to update math concept');
      }
    } catch (err) {
      console.error(err);
      showError('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConcept = async () => {
    if (!selectedConcept) return;
    try {
      const res = await deleteMathConcept(selectedConcept.conceptId);
      if (res.success) {
        showSuccess('Math concept deleted successfully');
        setShowDeleteModal(false);
        setSelectedConcept(null);
        fetchMathConcepts();
      } else {
        showError(res.error || 'Failed to delete math concept');
      }
    } catch (err) {
      console.error(err);
      showError('Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
    });
  };

  const openEditModal = (concept: MathConcept) => {
    setSelectedConcept(concept);
    setFormData({
      name: concept.name || '',
      category: concept.category || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (concept: MathConcept) => {
    setSelectedConcept(concept);
    setShowDeleteModal(true);
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(mathConcepts.map(c => c.category).filter(Boolean))).sort();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900">Math Concept Management</h2>
          <p className="text-gray-600 mt-2">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedConcepts = filteredConcepts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredConcepts.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Math Concept Management</h1>
              <p className="text-gray-600 mt-2">Manage mathematical concepts and their categories</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Math Concept</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none text-sm"
              />
            </div>
            
            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none text-sm bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Concepts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concept Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked Units
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConcepts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No math concepts found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedConcepts.map((concept) => (
                    <tr key={concept.conceptId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Brain className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {concept.name || 'Unnamed Concept'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {concept.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Tag className="w-3 h-3 mr-1" />
                            {concept.category}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {concept.linkedUnits && concept.linkedUnits.length > 0 ? (
                            <div className="flex items-center space-x-2">
                              <BookOpen className="w-4 h-4 text-gray-500" />
                              <span>{concept.linkedUnits.length} unit(s)</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No units linked</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ position: 'relative', overflow: 'visible' }}>
                        <button
                          ref={(el) => {
                            if (el) actionButtonRefs.current[concept.conceptId] = el;
                          }}
                          onClick={() => {
                            if (openDropdownId === concept.conceptId) {
                              setOpenDropdownId(null);
                              setDropdownPosition(null);
                            } else {
                              const button = actionButtonRefs.current[concept.conceptId];
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + 8,
                                  right: window.innerWidth - rect.right
                                });
                              }
                              setOpenDropdownId(concept.conceptId);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openDropdownId === concept.conceptId && dropdownPosition && createPortal(
                          <div
                            className="dropdown-menu absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px]"
                            style={{
                              top: `${dropdownPosition.top}px`,
                              right: `${dropdownPosition.right}px`,
                            }}
                          >
                            <button
                              onClick={() => {
                                openEditModal(concept);
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                openDeleteModal(concept);
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>,
                          document.body
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredConcepts.length)} of {filteredConcepts.length} concepts
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-xl border-b border-purple-600">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create New Math Concept</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateConcept} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Concept Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    placeholder="Enter concept name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    placeholder="Enter category (optional)"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Create Concept</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedConcept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-xl border-b border-purple-600">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Math Concept</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedConcept(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateConcept} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Concept Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    placeholder="Enter category (optional)"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedConcept(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Update Concept</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedConcept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Math Concept</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedConcept.name || 'this concept'}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedConcept(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConcept}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
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

export default MathConceptManagement;


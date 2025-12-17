import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import {
  getAllUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getAllCurriculums,
  getAllMathConcepts,
} from '../../../services/api';
import {
  FileText,
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  BookOpen,
  GraduationCap,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

interface Unit {
  unitId: string;
  unitName: string;
  unitDescription?: string;
  unitOrder: number;
  curriculumId: string;
  curriculumName?: string;
  credit?: number;
  learningObjectives?: string;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
  mathConcepts?: Array<{ conceptId: string; name?: string; category?: string }>;
}

interface MathConcept {
  conceptId: string;
  name?: string;
  category?: string;
}

const UnitManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showSuccess, showError } = useToast();

  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [mathConcepts, setMathConcepts] = useState<MathConcept[]>([]);
  const [selectedConceptIds, setSelectedConceptIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState<string>('');
  const [sortBy] = useState<'name' | 'order' | 'curriculum'>('curriculum');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [formData, setFormData] = useState({
    unitName: '',
    unitDescription: '',
    unitOrder: 1,
    curriculumId: '',
    credit: 0,
    learningObjectives: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUnits();
    fetchCurriculums();
    fetchMathConcepts();
  }, []);

  // Fetch math concepts when modals open
  useEffect(() => {
    if ((showCreateModal || showEditModal) && mathConcepts.length === 0) {
      fetchMathConcepts();
    }
  }, [showCreateModal, showEditModal]);

  const fetchMathConcepts = async () => {
    try {
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
          }));
          setMathConcepts(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to load math concepts:', err);
    }
  };

  useEffect(() => {
    filterAndSortUnits();
    setCurrentPage(1); // Reset to first page when filters change
  }, [units, searchTerm, curriculumFilter]);

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

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await getAllUnits();
      if (res.success && res.data) {
        const mapped = res.data.map((item: any) => ({
          unitId: item.unitId || item.UnitId || '',
          unitName: item.unitName || item.UnitName || '',
          unitDescription: item.unitDescription || item.UnitDescription,
          unitOrder: item.unitOrder || item.UnitOrder || 0,
          curriculumId: item.curriculumId || item.CurriculumId || '',
          curriculumName: item.curriculumName || item.CurriculumName,
          credit: item.credit || item.Credit || 0,
          learningObjectives: item.learningObjectives || item.LearningObjectives,
          isActive: item.isActive !== undefined ? item.isActive : (item.IsActive !== undefined ? item.IsActive : true),
          createdDate: item.createdDate || item.CreatedDate,
          updatedDate: item.updatedDate || item.UpdatedDate,
          mathConcepts: item.mathConcepts || item.MathConcepts || [],
        }));
        setUnits(mapped);
      } else {
        setUnits([]);
      }
    } catch (err) {
      console.error(err);
      showError('Failed to load units');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculums = async () => {
    try {
      const res = await getAllCurriculums();
      if (res.success && res.data) {
        setCurriculums(res.data);
      } else {
        setCurriculums([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filterAndSortUnits = () => {
    let filtered = [...units];

    // Apply curriculum filter
    if (curriculumFilter) {
      filtered = filtered.filter((u) => u.curriculumId === curriculumFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.unitName?.toLowerCase().includes(term) ||
          u.curriculumName?.toLowerCase().includes(term) ||
          u.unitDescription?.toLowerCase().includes(term) ||
          u.learningObjectives?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.unitName || '').localeCompare(b.unitName || '');
        case 'order':
          return (a.unitOrder || 0) - (b.unitOrder || 0);
        case 'curriculum':
          // Sort by curriculum name first, then by order within the same curriculum
          const curriculumCompare = (a.curriculumName || '').localeCompare(b.curriculumName || '');
          if (curriculumCompare !== 0) {
            return curriculumCompare;
          }
          // If same curriculum, sort by order
          return (a.unitOrder || 0) - (b.unitOrder || 0);
        default:
          return 0;
      }
    });

    setFilteredUnits(filtered);
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.unitName.trim()) {
      showError('Unit name is required');
      return;
    }

    if (!formData.curriculumId) {
      showError('Curriculum is required');
      return;
    }

    // Validate Credit: must be between 0-255 or null/undefined
    let creditValue: number | null | undefined = undefined;
    if (formData.credit !== undefined && formData.credit !== null && formData.credit > 0) {
      const creditNum = Math.round(formData.credit);
      if (creditNum < 0 || creditNum > 255) {
        showError('Credit must be between 0 and 255');
        return;
      }
      creditValue = creditNum;
    }

    try {
      setSaving(true);
      const requestBody: any = {
        UnitName: formData.unitName.trim(),
        CurriculumId: formData.curriculumId,
        UnitDescription: formData.unitDescription.trim() || undefined,
        LearningObjectives: formData.learningObjectives.trim() || undefined,
        IsActive: formData.isActive,
      };
      
      // Only include UnitOrder if provided
      if (formData.unitOrder) {
        requestBody.UnitOrder = formData.unitOrder;
      }
      
      // Only include Credit if it has a valid value (1-255)
      if (creditValue !== undefined && creditValue !== null) {
        requestBody.Credit = creditValue;
      }
      
      // Include ConceptIds if any are selected
      if (selectedConceptIds.length > 0) {
        requestBody.ConceptIds = selectedConceptIds;
      }
      
      const res = await createUnit(requestBody);
      
      if (res.success) {
        showSuccess('Unit created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchUnits();
      } else {
        showError(res.error || 'Failed to create unit');
      }
    } catch (err) {
      console.error(err);
      showError('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    if (!formData.unitName.trim()) {
      showError('Unit name is required');
      return;
    }

    // Validate Credit: must be between 0-255 or null/undefined
    let creditValue: number | null | undefined = undefined;
    if (formData.credit !== undefined && formData.credit !== null && formData.credit > 0) {
      const creditNum = Math.round(formData.credit);
      if (creditNum < 0 || creditNum > 255) {
        showError('Credit must be between 0 and 255');
        return;
      }
      creditValue = creditNum;
    }

    try {
      setSaving(true);
      const requestBody: any = {
        UnitName: formData.unitName.trim(),
        UnitOrder: formData.unitOrder,
        UnitDescription: formData.unitDescription.trim() || undefined,
        LearningObjectives: formData.learningObjectives.trim() || undefined,
        IsActive: formData.isActive,
      };
      
      // Only include Credit if it has a valid value (1-255)
      if (creditValue !== undefined && creditValue !== null) {
        requestBody.Credit = creditValue;
      }
      
      // Include ConceptIds (even if empty array to clear existing concepts)
      requestBody.ConceptIds = selectedConceptIds;
      
      const res = await updateUnit(selectedUnit.unitId, requestBody);
      
        if (res.success) {
        showSuccess('Unit updated successfully');
        setShowEditModal(false);
        setSelectedUnit(null);
        resetForm();
          fetchUnits();
      } else {
        showError(res.error || 'Failed to update unit');
      }
    } catch (err) {
      console.error(err);
      showError('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!selectedUnit) return;
    try {
      const res = await deleteUnit(selectedUnit.unitId);
      if (res.success) {
        showSuccess('Unit deleted successfully');
        setShowDeleteModal(false);
        setSelectedUnit(null);
        fetchUnits();
      } else {
        showError(res.error || 'Failed to delete unit');
      }
    } catch (err) {
      console.error(err);
      showError('Delete failed');
    }
  };

  const resetForm = () => {
    const maxOrder = units.length > 0 ? Math.max(...units.map(u => u.unitOrder || 0)) : 0;
    setFormData({
      unitName: '',
      unitDescription: '',
      unitOrder: maxOrder + 1,
      curriculumId: '',
      credit: 0,
      learningObjectives: '',
      isActive: true,
    });
    setSelectedConceptIds([]);
  };

  const openEditModal = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormData({
      unitName: unit.unitName || '',
      unitDescription: unit.unitDescription || '',
      unitOrder: unit.unitOrder || 1,
      curriculumId: unit.curriculumId || '',
      credit: unit.credit || 0,
      learningObjectives: unit.learningObjectives || '',
      isActive: unit.isActive !== undefined ? unit.isActive : true,
    });
    // Load existing math-concepts
    const existingConceptIds = (unit.mathConcepts || []).map((mc: any) => 
      mc.conceptId || mc.ConceptId || ''
    ).filter((id: string) => id);
    setSelectedConceptIds(existingConceptIds);
    setShowEditModal(true);
  };

  const openDeleteModal = (unit: Unit) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900">Unit Management</h2>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
      <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unit Management</h1>
              <p className="text-gray-600 mt-2">Manage learning units and their order</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Unit</span>
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
                placeholder="Search by name, curriculum, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none text-sm"
              />
            </div>
            
            {/* Curriculum Filter */}
            <div className="md:w-80">            
              <select
                value={curriculumFilter}
                onChange={(e) => setCurriculumFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none text-sm bg-white"
              >
                <option value="">All Curricula</option>
                {curriculums.map((curriculum: any) => (
                  <option key={curriculum.curriculumId || curriculum.CurriculumId} value={curriculum.curriculumId || curriculum.CurriculumId}>
                    {curriculum.curriculumName || curriculum.CurriculumName} {curriculum.curriculumCode || curriculum.CurriculumCode ? `(${curriculum.curriculumCode || curriculum.CurriculumCode})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Units Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curriculum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No units found</p>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedUnits = filteredUnits.slice(startIndex, endIndex);

                    return (
                      <>
                        {paginatedUnits.map((unit) => (
                    <tr key={unit.unitId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-700 rounded-lg font-semibold">
                          {unit.unitOrder || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
        <div>
                            <div className="text-sm font-medium text-gray-900">{unit.unitName}</div>
                            {unit.learningObjectives && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={unit.learningObjectives}>
                                {unit.learningObjectives}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.curriculumName ? (
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-900">{unit.curriculumName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={unit.unitDescription || ''}>
                          {unit.unitDescription || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.credit ? (
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-900 font-medium">{unit.credit}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ position: 'relative', overflow: 'visible' }}>
                        <div className="relative flex items-center justify-end" style={{ position: 'relative', zIndex: 1 }}>
                          <button
                            ref={(el) => {
                              actionButtonRefs.current[unit.unitId] = el;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openDropdownId === unit.unitId) {
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              } else {
                                const button = actionButtonRefs.current[unit.unitId];
                                if (button) {
                                  const rect = button.getBoundingClientRect();
                                  setDropdownPosition({
                                    top: rect.bottom + 8,
                                    right: window.innerWidth - rect.right
                                  });
                                }
                                setOpenDropdownId(unit.unitId);
                              }
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdownId === unit.unitId && dropdownPosition && createPortal(
                            <div 
                              className="dropdown-menu fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`
                              }}
                            >
                              <button
                                onClick={() => {
                                  openEditModal(unit);
                                  setOpenDropdownId(null);
                                  setDropdownPosition(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  openDeleteModal(unit);
                                  setOpenDropdownId(null);
                                  setDropdownPosition(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                        ))}
                        </>
                      );
                    })()
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {filteredUnits.length > 0 && (() => {
            const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredUnits.length);
            
            return (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{endIndex}</span> of{' '}
                  <span className="font-medium">{filteredUnits.length}</span> results
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
                    {(() => {
                      // Chỉ hiển thị 5 số trang
                      const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
                      const endPage = Math.min(startPage + 4, totalPages);
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      return pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            currentPage === page
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
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
        </div>
      </div>

      {/* Create Unit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-xl border-b border-purple-600 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create New Unit</h2>
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
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleCreateUnit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unitName}
                    onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    placeholder="Enter unit name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.unitOrder}
                    onChange={(e) => setFormData({ ...formData, unitOrder: Number(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Units are sorted by this number</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Credit
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={formData.credit || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, credit: value === '' ? 0 : Math.min(255, Math.max(0, Number(value) || 0)) });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                    placeholder="0-255"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a value between 0 and 255 (optional)</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Curriculum *
                  </label>
                  <select
                    required
                    value={formData.curriculumId}
                    onChange={(e) => setFormData({ ...formData, curriculumId: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 transition-all outline-none ${
                      !formData.curriculumId 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-purple-500'
                    }`}
                  >
                    <option value="">-- Select curriculum * --</option>
                    {curriculums.map((c: any) => (
                      <option key={c.curriculumId || c.CurriculumId} value={c.curriculumId || c.CurriculumId}>
                        {c.curriculumName || c.CurriculumName} {c.curriculumCode || c.CurriculumCode ? `(${c.curriculumCode || c.CurriculumCode})` : ''}
                      </option>
                    ))}
                  </select>
                  {!formData.curriculumId && (
                    <p className="text-xs text-red-600 mt-1">Curriculum is required</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit Description
                  </label>
                  <textarea
                    value={formData.unitDescription}
                    onChange={(e) => setFormData({ ...formData, unitDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none"
                    placeholder="Enter unit description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Learning Objectives
                  </label>
                  <textarea
                    value={formData.learningObjectives}
                    onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none"
                    placeholder="Enter learning objectives"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Math Concepts
                  </label>
                  <div className="border-2 border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                    {mathConcepts.length === 0 ? (
                      <p className="text-sm text-gray-500">No math concepts available</p>
                    ) : (
                      <div className="space-y-2">
                        {mathConcepts.map((concept) => {
                          const isSelected = selectedConceptIds.includes(concept.conceptId);
                          return (
                            <label
                              key={concept.conceptId}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedConceptIds([...selectedConceptIds, concept.conceptId]);
                                  } else {
                                    setSelectedConceptIds(selectedConceptIds.filter(id => id !== concept.conceptId));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">{concept.name || 'Unnamed Concept'}</span>
                                {concept.category && (
                                  <span className="text-xs text-gray-500 ml-2">({concept.category})</span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select math concepts to associate with this unit ({selectedConceptIds.length} selected)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active</span>
                  </label>
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
                      <FileText className="w-5 h-5" />
                      <span>Create Unit</span>
                    </>
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {showEditModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-xl border-b border-purple-600 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Unit</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUnit(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleUpdateUnit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unitName}
                    onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.unitOrder}
                    onChange={(e) => setFormData({ ...formData, unitOrder: Number(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
          </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Credit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
      </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Curriculum (Read-only)
                  </label>
                  <select
                    value={formData.curriculumId}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
                  >
            <option value="">-- Select curriculum (optional) --</option>
            {curriculums.map((c: any) => (
                      <option key={c.curriculumId} value={c.curriculumId}>
                        {c.curriculumName}
                      </option>
            ))}
          </select>
                  <p className="text-xs text-gray-500 mt-1">Curriculum cannot be changed after unit creation</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit Description
                  </label>
                  <textarea
                    value={formData.unitDescription}
                    onChange={(e) => setFormData({ ...formData, unitDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Learning Objectives
                  </label>
                  <textarea
                    value={formData.learningObjectives}
                    onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Math Concepts
                  </label>
                  <div className="border-2 border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                    {mathConcepts.length === 0 ? (
                      <p className="text-sm text-gray-500">No math concepts available</p>
                    ) : (
                      <div className="space-y-2">
                        {mathConcepts.map((concept) => {
                          const isSelected = selectedConceptIds.includes(concept.conceptId);
                          return (
                            <label
                              key={concept.conceptId}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedConceptIds([...selectedConceptIds, concept.conceptId]);
                                  } else {
                                    setSelectedConceptIds(selectedConceptIds.filter(id => id !== concept.conceptId));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">{concept.name || 'Unnamed Concept'}</span>
                                {concept.category && (
                                  <span className="text-xs text-gray-500 ml-2">({concept.category})</span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select math concepts to associate with this unit ({selectedConceptIds.length} selected)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUnit(null);
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
                      <FileText className="w-5 h-5" />
                      <span>Update Unit</span>
                    </>
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Unit</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedUnit.unitName}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUnit(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUnit}
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
  );
};

export default UnitManagement;

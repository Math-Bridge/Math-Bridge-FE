import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastContext';
import {
  getAllCurriculums,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
} from '../../../services/api';
import {
  BookOpen,
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  GraduationCap,
  Link as LinkIcon,
  School,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

interface Curriculum {
  curriculumId: string;
  curriculumName: string;
  curriculumCode?: string;
  description?: string;
  grades?: string;
  syllabusUrl?: string;
  totalCredits?: number;
  totalSchools?: number;
  totalPackages?: number;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

const CurriculumManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showSuccess, showError } = useToast();

  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [filteredCurriculums, setFilteredCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [saving, setSaving] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [formData, setFormData] = useState({
    curriculumName: '',
    curriculumCode: '',
    description: '',
    grades: '',
    syllabusUrl: '',
    isActive: true,
  });
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [gradesDropdownOpen, setGradesDropdownOpen] = useState(false);

  useEffect(() => {
    fetchCurriculums();
  }, []);

  useEffect(() => {
    filterCurriculums();
    setCurrentPage(1); // Reset to first page when filters change
  }, [curriculums, searchTerm, gradeFilter]);

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

  // Close grades dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isClickOnGradesDropdown = target.closest('.grades-dropdown-container');
      
      if (!isClickOnGradesDropdown && gradesDropdownOpen) {
        setGradesDropdownOpen(false);
      }
    };

    if (gradesDropdownOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [gradesDropdownOpen]);

  const fetchCurriculums = async () => {
    try {
      setLoading(true);
      const res = await getAllCurriculums();
      if (res.success && res.data) {
        const mapped = res.data.map((item: any) => ({
          curriculumId: item.curriculumId || item.CurriculumId || '',
          curriculumName: item.curriculumName || item.CurriculumName || '',
          curriculumCode: item.curriculumCode || item.CurriculumCode,
          description: item.description || item.Description,
          grades: item.grades || item.Grades,
          syllabusUrl: item.syllabusUrl || item.SyllabusUrl,
          totalCredits: item.totalCredits || item.TotalCredits || 0,
          totalSchools: item.totalSchools || item.TotalSchools || 0,
          totalPackages: item.totalPackages || item.TotalPackages || 0,
          isActive: item.isActive !== undefined ? item.isActive : (item.IsActive !== undefined ? item.IsActive : true),
          createdDate: item.createdDate || item.CreatedDate,
          updatedDate: item.updatedDate || item.UpdatedDate,
        }));
        setCurriculums(mapped);
      } else {
        setCurriculums([]);
      }
    } catch (err) {
      console.error(err);
      showError('Failed to load curriculums');
      setCurriculums([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCurriculums = () => {
    let filtered = [...curriculums];
    
    // Apply grade filter
    if (gradeFilter) {
      filtered = filtered.filter((c) => {
        if (!c.grades) return false;
        // Check if the selected grade is in the grades string
        // Grades can be "grade 9,grade 10" or "9,10" etc.
        const gradesArray = c.grades.split(',').map(g => {
          const trimmed = g.trim();
          // Extract number from "grade 9" or "9"
          return trimmed.toLowerCase().replace(/grade\s*/g, '').trim();
        });
        return gradesArray.includes(gradeFilter);
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.curriculumName?.toLowerCase().includes(term) ||
          c.curriculumCode?.toLowerCase().includes(term) ||
          c.grades?.toLowerCase().includes(term)
      );
    }
    
    setFilteredCurriculums(filtered);
  };

  const handleCreateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.curriculumName.trim()) {
      showError('Curriculum name is required');
      return;
    }

    // Use selected grade (single selection) - format with "grade" prefix
    const gradesString = selectedGrade ? `grade ${selectedGrade}` : '';

    // Validate grade if provided
    if (selectedGrade && !['9', '10', '11', '12'].includes(selectedGrade)) {
      showError('Invalid grade. Only grades 9, 10, 11, and 12 are allowed.');
      return;
    }

    try {
      setSaving(true);
      const res = await createCurriculum({
        CurriculumName: formData.curriculumName.trim(),
        Description: formData.description.trim() || undefined,
        CurriculumCode: formData.curriculumCode.trim() || undefined,
        Grades: gradesString || undefined,
        SyllabusUrl: formData.syllabusUrl.trim() || undefined,
        IsActive: formData.isActive,
      } as any);
      
      if (res.success) {
        showSuccess('Curriculum created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchCurriculums();
      } else {
        showError(res.error || 'Failed to create curriculum');
      }
    } catch (err) {
      console.error(err);
      showError('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurriculum) return;

    if (!formData.curriculumName.trim()) {
      showError('Curriculum name is required');
      return;
    }

    // Use selected grade (single selection) - format with "grade" prefix
    const gradesString = selectedGrade ? `grade ${selectedGrade}` : '';

    // Validate grade if provided
    if (selectedGrade && !['9', '10', '11', '12'].includes(selectedGrade)) {
      showError('Invalid grade. Only grades 9, 10, 11, and 12 are allowed.');
      return;
    }

    try {
      setSaving(true);
      const res = await updateCurriculum(selectedCurriculum.curriculumId, {
        CurriculumName: formData.curriculumName.trim(),
        Description: formData.description.trim() || undefined,
        CurriculumCode: formData.curriculumCode.trim() || undefined,
        Grades: gradesString || undefined,
        SyllabusUrl: formData.syllabusUrl.trim() || undefined,
        IsActive: formData.isActive,
      } as any);
      
      if (res.success) {
        showSuccess('Curriculum updated successfully');
        setShowEditModal(false);
        setSelectedCurriculum(null);
        resetForm();
        fetchCurriculums();
      } else {
        showError(res.error || 'Failed to update curriculum');
      }
    } catch (err) {
      console.error(err);
      showError('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCurriculum = async () => {
    if (!selectedCurriculum) return;
    try {
      const res = await deleteCurriculum(selectedCurriculum.curriculumId);
      if (res.success) {
        showSuccess('Curriculum deleted successfully');
        setShowDeleteModal(false);
        setSelectedCurriculum(null);
        fetchCurriculums();
      } else {
        showError(res.error || 'Failed to delete curriculum');
      }
    } catch (err) {
      console.error(err);
      showError('Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      curriculumName: '',
      curriculumCode: '',
      description: '',
      grades: '',
      syllabusUrl: '',
      isActive: true,
    });
    setSelectedGrade('');
    setGradesDropdownOpen(false);
  };

  const openEditModal = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum);
    const grades = curriculum.grades || '';
    // Get first grade if multiple grades exist, extract number from "grade 9" or "9"
    const firstGradeString = grades ? grades.split(',').map(g => g.trim()).filter(g => g)[0] || '' : '';
    // Extract number from grade string (e.g., "grade 9" -> "9", "9" -> "9")
    const gradeNumber = firstGradeString.toLowerCase().replace(/grade\s*/g, '').trim();
    setSelectedGrade(gradeNumber);
    setFormData({
      curriculumName: curriculum.curriculumName || '',
      curriculumCode: curriculum.curriculumCode || '',
      description: curriculum.description || '',
      grades: grades,
      syllabusUrl: curriculum.syllabusUrl || '',
      isActive: curriculum.isActive !== undefined ? curriculum.isActive : true,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum);
    setShowDeleteModal(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900">Curriculum Management</h2>
          <p className="text-gray-600 mt-2">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Curriculum Management</h1>
              <p className="text-gray-600 mt-2">Manage curriculum and course structures</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setSelectedGrade('');
                setGradesDropdownOpen(false);
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Curriculum</span>
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
                placeholder="Search by name, code, grades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm"
              />
            </div>
            
            {/* Grade Filter */}
            <div className="md:w-64">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm bg-white"
              >
                <option value="">All Grades</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
          </div>
        </div>

        {/* Curriculums Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Curriculum Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Grades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Statistics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCurriculums.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No curriculums found</p>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedCurriculums = filteredCurriculums.slice(startIndex, endIndex);

                    return (
                      <>
                        {paginatedCurriculums.map((curriculum) => (
                    <tr key={curriculum.curriculumId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {curriculum.curriculumName}
                            </div>
                            {curriculum.syllabusUrl && (
                              <a
                                href={curriculum.syllabusUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 mt-1"
                              >
                                <LinkIcon className="w-3 h-3" />
                                <span>Syllabus</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        {curriculum.curriculumCode ? (
                          <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {curriculum.curriculumCode}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        {curriculum.grades ? (
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-900">{curriculum.grades}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <CreditCard className="w-4 h-4" />
                            <span>{curriculum.totalCredits || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <School className="w-4 h-4" />
                            <span>{curriculum.totalSchools || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Package className="w-4 h-4" />
                            <span>{curriculum.totalPackages || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        {curriculum.isActive ? (
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
                              actionButtonRefs.current[curriculum.curriculumId] = el;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openDropdownId === curriculum.curriculumId) {
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              } else {
                                const button = actionButtonRefs.current[curriculum.curriculumId];
                                if (button) {
                                  const rect = button.getBoundingClientRect();
                                  setDropdownPosition({
                                    top: rect.bottom + 8,
                                    right: window.innerWidth - rect.right
                                  });
                                }
                                setOpenDropdownId(curriculum.curriculumId);
                              }
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdownId === curriculum.curriculumId && dropdownPosition && createPortal(
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
                                  openEditModal(curriculum);
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
                                  openDeleteModal(curriculum);
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
          {filteredCurriculums.length > 0 && (() => {
            const totalPages = Math.ceil(filteredCurriculums.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredCurriculums.length);
            
            return (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{endIndex}</span> of{' '}
                  <span className="font-medium">{filteredCurriculums.length}</span> results
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
                              ? 'bg-blue-600 text-white'
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

      {/* Create Curriculum Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-t-xl border-b border-blue-600">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create New Curriculum</h2>
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
            <form onSubmit={handleCreateCurriculum} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Curriculum Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.curriculumName}
                    onChange={(e) => setFormData({ ...formData, curriculumName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="Enter curriculum name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Curriculum Code
                  </label>
                  <input
                    type="text"
                    value={formData.curriculumCode}
                    onChange={(e) => setFormData({ ...formData, curriculumCode: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="e.g., CA-BC-DOGWOOD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grades
                  </label>
                  <div className="relative grades-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setGradesDropdownOpen(!gradesDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-left bg-white flex items-center justify-between"
                    >
                      <span className={selectedGrade === '' ? 'text-gray-400' : 'text-gray-900'}>
                        {selectedGrade === '' 
                          ? 'Select grade...' 
                          : `grade ${selectedGrade}`}
                      </span>
                      <ChevronRight 
                        className={`w-5 h-5 text-gray-400 transition-transform ${gradesDropdownOpen ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {gradesDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg grades-dropdown-container">
                        <div className="p-2">
                          {['9', '10', '11', '12'].map((grade) => (
                            <button
                              key={grade}
                              type="button"
                              onClick={() => {
                                setSelectedGrade(grade);
                                setGradesDropdownOpen(false);
                              }}
                              className={`w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-left ${
                                selectedGrade === grade ? 'bg-blue-50' : ''
                              }`}
                            >
                              {selectedGrade === grade && (
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                              )}
                              {selectedGrade !== grade && (
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                              )}
                              <span className="text-sm text-gray-700">grade {grade}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only grades 9, 10, 11, and 12 are allowed. Select one grade.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Syllabus URL
                  </label>
                  <input
                    type="url"
                    value={formData.syllabusUrl}
                    onChange={(e) => setFormData({ ...formData, syllabusUrl: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" />
                      <span>Create Curriculum</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Curriculum Modal */}
      {showEditModal && selectedCurriculum && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-t-xl border-b border-blue-600">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Curriculum</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCurriculum(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateCurriculum} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Curriculum Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.curriculumName}
                    onChange={(e) => setFormData({ ...formData, curriculumName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Curriculum Code
                  </label>
                  <input
                    type="text"
                    value={formData.curriculumCode}
                    onChange={(e) => setFormData({ ...formData, curriculumCode: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grades
                  </label>
                  <div className="relative grades-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setGradesDropdownOpen(!gradesDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-left bg-white flex items-center justify-between"
                    >
                      <span className={selectedGrade === '' ? 'text-gray-400' : 'text-gray-900'}>
                        {selectedGrade === '' 
                          ? 'Select grade...' 
                          : `grade ${selectedGrade}`}
                      </span>
                      <ChevronRight 
                        className={`w-5 h-5 text-gray-400 transition-transform ${gradesDropdownOpen ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {gradesDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg grades-dropdown-container">
                        <div className="p-2">
                          {['9', '10', '11', '12'].map((grade) => (
                            <button
                              key={grade}
                              type="button"
                              onClick={() => {
                                setSelectedGrade(grade);
                                setGradesDropdownOpen(false);
                              }}
                              className={`w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-left ${
                                selectedGrade === grade ? 'bg-blue-50' : ''
                              }`}
                            >
                              {selectedGrade === grade && (
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                              )}
                              {selectedGrade !== grade && (
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                              )}
                              <span className="text-sm text-gray-700">grade {grade}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only grades 9, 10, 11, and 12 are allowed. Select one grade.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Syllabus URL
                  </label>
                  <input
                    type="url"
                    value={formData.syllabusUrl}
                    onChange={(e) => setFormData({ ...formData, syllabusUrl: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                    setSelectedCurriculum(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" />
                      <span>Update Curriculum</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCurriculum && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Curriculum</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedCurriculum.curriculumName}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCurriculum(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCurriculum}
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

export default CurriculumManagement;

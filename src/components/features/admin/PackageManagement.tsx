import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Package as PackageIcon,
  Search,
  Edit,
  Trash2,
  Plus,
  Clock,
  GraduationCap,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  MoreVertical,
  Upload,
  Loader,
  ChevronDown,
} from 'lucide-react';
import { apiService, getAllCurriculums } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

interface PackageData {
  packageId: string;
  packageName: string;
  name?: string;
  description?: string;
  price: number;
  duration?: number;
  durationDays?: number;
  sessions?: number;
  sessionCount?: number;
  sessionsPerWeek?: number;
  maxReschedule?: number;
  grade?: string;
  status?: string;
  curriculumId?: string;
  curriculumName?: string;
}

const PackageManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [curricula, setCurricula] = useState<any[]>([]);
  const [loadingCurricula, setLoadingCurricula] = useState(false);
  const [saving, setSaving] = useState(false);
  const [curriculumSearchTerm, setCurriculumSearchTerm] = useState('');
  const [showCurriculumDropdown, setShowCurriculumDropdown] = useState(false);
  const curriculumDropdownRef = useRef<HTMLDivElement>(null);
  const curriculumInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    packageName: '',
    grade: 'grade 9',
    price: 0,
    sessionCount: 0,
    sessionsPerWeek: 3,
    maxReschedule: 0,
    durationDays: 0,
    description: '',
    curriculumId: '',
    status: 'active',
    imageUrl: ''
  });

  // Auto-calculate session count based on duration and sessions per week
  useEffect(() => {
    if (formData.durationDays > 0 && formData.sessionsPerWeek > 0) {
      const weeks = formData.durationDays / 7;
      const calculatedSessions = Math.floor(weeks * formData.sessionsPerWeek);
      if (calculatedSessions !== formData.sessionCount) {
        setFormData(prev => ({
          ...prev,
          sessionCount: calculatedSessions
        }));
      }
    }
  }, [formData.durationDays, formData.sessionsPerWeek]);

  useEffect(() => {
    fetchPackages();
    fetchCurricula();
  }, []);

  useEffect(() => {
    filterPackages();
    setCurrentPage(1); // Reset to first page when filters change
  }, [packages, searchTerm]);

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

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const result = await apiService.getAllPackages();
      if (result.success && result.data) {
        const packagesData = Array.isArray(result.data) ? result.data : [];
        // Map backend data to frontend format
        const mappedPackages: PackageData[] = packagesData.map((pkg: any) => {
          // Debug: Log the raw package data to see what fields are available
          if (!pkg.CurriculumId && !pkg.curriculumId) {
            console.log('Package without CurriculumId:', pkg);
          }
          
          return {
            packageId: pkg.PackageId || pkg.packageId || pkg.id || '',
            packageName: pkg.PackageName || pkg.packageName || pkg.name || '',
            name: pkg.PackageName || pkg.packageName || pkg.name || '',
            description: pkg.Description || pkg.description || '',
            price: pkg.Price || pkg.price || 0,
            duration: pkg.DurationDays ? Math.ceil(pkg.DurationDays / 30) : pkg.duration || 0,
            durationDays: pkg.DurationDays || pkg.durationDays || 0,
            sessions: pkg.SessionCount || pkg.sessionCount || pkg.sessions || 0,
            sessionCount: pkg.SessionCount || pkg.sessionCount || pkg.sessions || 0,
            sessionsPerWeek: pkg.SessionsPerWeek || pkg.sessionsPerWeek || 0,
            maxReschedule: pkg.MaxReschedule || pkg.maxReschedule || 0,
            grade: pkg.Grade || pkg.grade || '',
            status: pkg.IsActive !== undefined ? (pkg.IsActive ? 'active' : 'inactive') : (pkg.Status || pkg.status || 'active'),
            // Try to get CurriculumId from various possible locations
            curriculumId: pkg.CurriculumId || pkg.curriculumId || pkg.Curriculum?.CurriculumId || pkg.curriculum?.curriculumId || '',
            curriculumName: pkg.CurriculumName || pkg.curriculumName || pkg.Curriculum?.CurriculumName || pkg.curriculum?.curriculumName || '',
          };
        });
        setPackages(mappedPackages);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      showError('Failed to load packages');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurricula = async () => {
    try {
      setLoadingCurricula(true);
      const result = await getAllCurriculums();
      console.log('Fetch curricula result:', result);
      
      if (result.success && result.data) {
        // getAllCurriculums() returns Curriculum[] with camelCase fields
        // But we need to ensure it works with both camelCase and PascalCase
        const curriculaData = Array.isArray(result.data) ? result.data : [];
        
        // Map to ensure we have both formats for compatibility
        const mappedCurricula = curriculaData.map((curriculum: any) => ({
          // Keep original fields
          ...curriculum,
          // Ensure PascalCase fields exist for dropdown compatibility
          CurriculumId: curriculum.CurriculumId || curriculum.curriculumId || '',
          CurriculumName: curriculum.CurriculumName || curriculum.curriculumName || '',
          CurriculumCode: curriculum.CurriculumCode || curriculum.curriculumCode || '',
          // Ensure camelCase fields exist
          curriculumId: curriculum.curriculumId || curriculum.CurriculumId || '',
          curriculumName: curriculum.curriculumName || curriculum.CurriculumName || '',
          curriculumCode: curriculum.curriculumCode || curriculum.CurriculumCode || '',
        }));
        
        console.log('Mapped curricula:', mappedCurricula);
        setCurricula(mappedCurricula);
      } else {
        console.warn('No curricula data received:', result);
        setCurricula([]);
      }
    } catch (error) {
      console.error('Error fetching curricula:', error);
      showError('Failed to load curricula');
      setCurricula([]);
    } finally {
      setLoadingCurricula(false);
    }
  };

  const filterPackages = useCallback(() => {
    let filtered = [...packages];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || p.packageName)?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.grade?.toLowerCase().includes(term)
      );
    }
    setFilteredPackages(filtered);
  }, [packages, searchTerm]);

  // Filter curricula based on grade and search term
  const filteredCurricula = curricula.filter((curriculum: any) => {
    // Filter by grade if grade is selected
    if (formData.grade) {
      const curriculumGrades = curriculum.grades || curriculum.Grades || '';
      if (curriculumGrades) {
        // Check if curriculum supports the selected grade
        const gradeLower = formData.grade.toLowerCase();
        const gradesLower = curriculumGrades.toLowerCase();
        // Check if grade matches (e.g., "grade 9" in "grade 9, grade 10" or exact match)
        if (!gradesLower.includes(gradeLower)) {
          return false;
        }
      }
    }
    
    // Filter by search term
    if (!curriculumSearchTerm.trim()) return true;
    const searchLower = curriculumSearchTerm.toLowerCase();
    const name = (curriculum.curriculumName || curriculum.CurriculumName || '').toLowerCase();
    const code = (curriculum.curriculumCode || curriculum.CurriculumCode || '').toLowerCase();
    return name.includes(searchLower) || code.includes(searchLower);
  });

  // Handle curriculum input change
  const handleCurriculumInputChange = (value: string) => {
    setCurriculumSearchTerm(value);
    setShowCurriculumDropdown(true);
    // Clear curriculum selection if search term is cleared
    if (!value.trim()) {
      setFormData({ ...formData, curriculumId: '' });
    }
  };

  // Handle curriculum input focus
  const handleCurriculumInputFocus = () => {
    setShowCurriculumDropdown(true);
  };

  // Handle curriculum select
  const handleCurriculumSelect = (curriculum: any) => {
    const curriculumId = curriculum.curriculumId || curriculum.CurriculumId || '';
    const curriculumName = curriculum.curriculumName || curriculum.CurriculumName || '';
    const curriculumCode = curriculum.curriculumCode || curriculum.CurriculumCode || '';
    setFormData({ ...formData, curriculumId });
    setCurriculumSearchTerm(curriculumCode ? `${curriculumName} (${curriculumCode})` : curriculumName);
    setShowCurriculumDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        curriculumDropdownRef.current &&
        !curriculumDropdownRef.current.contains(event.target as Node) &&
        curriculumInputRef.current &&
        !curriculumInputRef.current.contains(event.target as Node)
      ) {
        setShowCurriculumDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset curriculum search when grade changes
  useEffect(() => {
    if (formData.grade) {
      setCurriculumSearchTerm('');
      setFormData(prev => ({ ...prev, curriculumId: '' }));
      setShowCurriculumDropdown(false);
    }
  }, [formData.grade]);

  // Update curriculum search term when curricula are loaded and formData.curriculumId exists (for edit modal)
  useEffect(() => {
    if (showEditModal && formData.curriculumId && curricula.length > 0 && !curriculumSearchTerm) {
      const curriculumIdStr = String(formData.curriculumId);
      const selectedCurriculum = curricula.find((c: any) => {
        const cId = String(c.curriculumId || c.CurriculumId || '');
        return cId === curriculumIdStr;
      });
      if (selectedCurriculum) {
        const curriculumName = selectedCurriculum.curriculumName || selectedCurriculum.CurriculumName || '';
        const curriculumCode = selectedCurriculum.curriculumCode || selectedCurriculum.CurriculumCode || '';
        setCurriculumSearchTerm(curriculumCode ? `${curriculumName} (${curriculumCode})` : curriculumName);
      }
    }
  }, [curricula, formData.curriculumId, showEditModal, curriculumSearchTerm]);

  const resetForm = () => {
    setFormData({
      packageName: '',
      grade: 'grade 9',
      price: 0,
      sessionCount: 0,
      sessionsPerWeek: 3,
      maxReschedule: 0,
      durationDays: 0,
      description: '',
      curriculumId: '',
      status: 'active',
      imageUrl: ''
    });
    setImagePreview(null);
    setSelectedImageFile(null);
    setCurriculumSearchTerm('');
    setShowCurriculumDropdown(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = async (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setShowEditModal(true);
    
    // Try to fetch full package details to get CurriculumId
    // Since backend DTO doesn't include CurriculumId in GetAllPackages, try to fetch from packages endpoint
    let curriculumId = pkg.curriculumId ? String(pkg.curriculumId) : '';
    
    // If curriculumId is not in the package data, try to fetch from packages endpoint
    if (!curriculumId && pkg.packageId) {
      try {
        const result = await apiService.request(`/packages/${pkg.packageId}`, {
          method: 'GET'
        });
        if (result.success && result.data) {
          const fullPackage = result.data as any;
          // Try multiple possible field names
          curriculumId = String(
            fullPackage.CurriculumId || 
            fullPackage.curriculumId || 
            fullPackage.Curriculum?.CurriculumId || 
            fullPackage.curriculum?.curriculumId || 
            ''
          );
        }
      } catch (error) {
        console.warn('Could not fetch full package details from /packages endpoint:', error);
        // Continue with existing data
      }
    }
    
    setFormData({
      packageName: pkg.packageName || pkg.name || '',
      grade: pkg.grade || 'grade 9',
      price: pkg.price || 0,
      sessionCount: pkg.sessionCount || pkg.sessions || 0,
      sessionsPerWeek: 3,
      maxReschedule: pkg.maxReschedule || 0,
      durationDays: pkg.durationDays || 0,
      description: pkg.description || '',
      curriculumId: curriculumId,
      status: pkg.status || 'active',
      imageUrl: (pkg as any).ImageUrl || (pkg as any).imageUrl || (pkg as any).image_url || ''
    });
    
    // Set curriculum search term to selected curriculum name
    // Use setTimeout to ensure curricula are loaded
    setTimeout(() => {
      if (curriculumId) {
        const curriculumIdStr = String(curriculumId);
        const selectedCurriculum = curricula.find((c: any) => {
          const cId = String(c.curriculumId || c.CurriculumId || '');
          return cId === curriculumIdStr;
        });
        if (selectedCurriculum) {
          const curriculumName = selectedCurriculum.curriculumName || selectedCurriculum.CurriculumName || '';
          const curriculumCode = selectedCurriculum.curriculumCode || selectedCurriculum.CurriculumCode || '';
          setCurriculumSearchTerm(curriculumCode ? `${curriculumName} (${curriculumCode})` : curriculumName);
        } else {
          // If curriculum not found, try to use curriculumName from package if available
          if (pkg.curriculumName) {
            setCurriculumSearchTerm(pkg.curriculumName);
          } else {
            setCurriculumSearchTerm('');
          }
        }
      } else {
        setCurriculumSearchTerm('');
      }
    }, 100);
    setShowCurriculumDropdown(false);
    
    // Set image preview if package has image
    const imageUrl = (pkg as any).ImageUrl || (pkg as any).imageUrl || (pkg as any).image_url;
    setImagePreview(imageUrl || null);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedPackage(null);
    resetForm();
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      showError('Image size must be less than 2MB');
      return;
    }

    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      showError('Invalid file type. Only JPG, PNG and WebP are allowed.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // If editing existing package, upload immediately
    if (isEdit && selectedPackage?.packageId) {
      setUploadingImage(true);
      try {
        const response = await apiService.uploadPackageImage(selectedPackage.packageId, file);
        if (response.success && response.data?.imageUrl) {
          setFormData(prev => ({ ...prev, imageUrl: response.data!.imageUrl }));
          showSuccess('Image uploaded successfully!');
        } else {
          showError(response.error || 'Failed to upload image');
          setImagePreview(null);
        }
      } catch (error) {
        showError('Failed to upload image');
        setImagePreview(null);
      } finally {
        setUploadingImage(false);
      }
    } else {
      // For new packages, save file for later upload after package creation
      setSelectedImageFile(file);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.packageName.trim()) {
      showError('Package name is required');
      return false;
    }
    if (formData.price < 0) {
      showError('Price must be 0 or greater');
      return false;
    }
    if (formData.sessionCount <= 0) {
      showError('Session count must be greater than 0. Please set duration days and sessions per week.');
      return false;
    }
    if (formData.sessionsPerWeek !== 3) {
      showError('Sessions per week must be 3');
      return false;
    }
    if (formData.durationDays <= 0) {
      showError('Duration days must be greater than 0');
      return false;
    }
    if (!formData.curriculumId) {
      showError('Curriculum is required');
      return false;
    }
    return true;
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      const result = await apiService.request('/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PackageName: formData.packageName.trim(),
          Grade: formData.grade,
          Price: formData.price,
          SessionCount: formData.sessionCount,
          SessionsPerWeek: formData.sessionsPerWeek,
          MaxReschedule: formData.maxReschedule,
          DurationDays: formData.durationDays,
          Description: formData.description.trim() || null,
          CurriculumId: formData.curriculumId,
          IsActive: formData.status === 'active'
        })
      });

      // Backend returns { packageId } on success (200 OK)
      // Check if response is successful (status 200-299) or has packageId
      const responseData = result.data as any;
      const newPackageId = responseData?.packageId;
      
      if (result.success || newPackageId) {
        // Upload image if file was selected for new package
        if (selectedImageFile && newPackageId) {
          setUploadingImage(true);
          try {
            const uploadResponse = await apiService.uploadPackageImage(newPackageId, selectedImageFile);
            if (uploadResponse.success && uploadResponse.data?.imageUrl) {
              setFormData(prev => ({ ...prev, imageUrl: uploadResponse.data!.imageUrl }));
            }
          } catch (error) {
            console.error('Error uploading image:', error);
          } finally {
            setUploadingImage(false);
            setSelectedImageFile(null);
          }
        }
        
        showSuccess('Package created successfully');
        closeModals();
        await fetchPackages();
      } else {
        // Check for error in different response formats
        const errorMsg = result.error || 
                        responseData?.error || 
                        (typeof responseData === 'string' ? responseData : null) ||
                        'Failed to create package';
        showError(errorMsg);
        console.error('Create package error:', result);
      }
    } catch (error: any) {
      console.error('Error creating package:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create package';
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      const result = await apiService.request(`/admin/packages/${selectedPackage.packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PackageName: formData.packageName.trim(),
          Grade: formData.grade,
          Price: formData.price,
          SessionCount: formData.sessionCount,
          SessionsPerWeek: formData.sessionsPerWeek,
          MaxReschedule: formData.maxReschedule,
          DurationDays: formData.durationDays,
          Description: formData.description.trim() || null,
          CurriculumId: formData.curriculumId,
          IsActive: formData.status === 'active'
        })
      });

      if (result.success) {
        showSuccess('Package updated successfully');
        closeModals();
        fetchPackages();
      } else {
        showError(result.error || 'Failed to update package');
      }
    } catch (error: any) {
      console.error('Error updating package:', error);
      showError(error?.message || 'Failed to update package');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!selectedPackage) return;
    try {
      const result = await apiService.request(`/admin/packages/${selectedPackage.packageId}`, {
        method: 'DELETE'
      });
      if (result.success) {
        showSuccess('Package deleted successfully');
        closeModals();
        fetchPackages();
      } else {
        showError(result.error || 'Failed to delete package');
      }
    } catch (error: any) {
      console.error('Error deleting package:', error);
      showError(error?.message || 'Failed to delete package');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPackages.length);
  const paginatedPackages = filteredPackages.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Package Management</h1>
              <p className="text-gray-600 mt-2">Configure pricing and packages</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Package</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, description, grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Package Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Sessions/Week
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
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <PackageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No packages found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPackages.map((pkg) => {
                    const displayName = pkg.name || pkg.packageName || 'Unnamed Package';
                    const displayDuration = pkg.durationDays 
                      ? `${Math.ceil(pkg.durationDays / 30)} months (${pkg.durationDays} days)`
                      : pkg.duration 
                      ? `${pkg.duration} months`
                      : 'N/A';
                    const displaySessions = pkg.sessions || pkg.sessionCount || 0;
                    
                    return (
                      <tr key={pkg.packageId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <PackageIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{displayName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          {pkg.grade ? (
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-900 font-medium">{pkg.grade}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-200">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={pkg.description || ''}>
                            {pkg.description || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <span className="font-medium">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{displayDuration}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{displaySessions} sessions</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                          {pkg.sessionsPerWeek ? `${pkg.sessionsPerWeek}/week` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          {pkg.status === 'active' ? (
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
                                actionButtonRefs.current[pkg.packageId] = el;
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openDropdownId === pkg.packageId) {
                                  setOpenDropdownId(null);
                                  setDropdownPosition(null);
                                } else {
                                  const button = actionButtonRefs.current[pkg.packageId];
                                  if (button) {
                                    const rect = button.getBoundingClientRect();
                                    setDropdownPosition({
                                      top: rect.bottom + 8,
                                      right: window.innerWidth - rect.right
                                    });
                                  }
                                  setOpenDropdownId(pkg.packageId);
                                }
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Actions"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {openDropdownId === pkg.packageId && dropdownPosition && createPortal(
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
                                    openEditModal(pkg);
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
                                    setSelectedPackage(pkg);
                                    setShowDeleteModal(true);
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {filteredPackages.length > 0 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{endIndex}</span> of{' '}
                <span className="font-medium">{filteredPackages.length}</span> results
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
          )}
        </div>
      </div>

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-t-3xl border-b border-blue-600 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create New Package</h2>
                <button
                  onClick={closeModals}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleCreatePackage} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="Enter package name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade *
                  </label>
                  <select
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  >
                    <option value="grade 9">Grade 9</option>
                    <option value="grade 10">Grade 10</option>
                    <option value="grade 11">Grade 11</option>
                    <option value="grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (VND) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, price: value === '' ? 0 : parseInt(value) || 0 });
                      }}
                      className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.price > 0 && new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.price)}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Curriculum *
                  </label>
                  {loadingCurricula ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Loading curricula...</span>
                    </div>
                  ) : curricula.length === 0 ? (
                    <div className="px-4 py-3 border-2 border-yellow-200 rounded-xl bg-yellow-50 text-yellow-800 text-sm">
                      No curricula available. Please create a curriculum first.
                    </div>
                  ) : (
                    <div className="relative" ref={curriculumDropdownRef}>
                      <input
                        ref={curriculumInputRef}
                        type="text"
                        value={curriculumSearchTerm}
                        onChange={(e) => handleCurriculumInputChange(e.target.value)}
                        onFocus={handleCurriculumInputFocus}
                        placeholder="Search or select curriculum *"
                        className={`w-full pl-4 pr-10 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none ${
                          !formData.curriculumId && !curriculumSearchTerm
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                      <ChevronDown
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-transform pointer-events-none ${showCurriculumDropdown ? 'rotate-180' : ''}`}
                      />
                      {formData.curriculumId && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full pointer-events-none" />
                      )}
                      {showCurriculumDropdown && (
                        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                          <div className="overflow-y-auto max-h-80 custom-scrollbar">
                            {filteredCurricula.length === 0 ? (
                              <div className="p-8 text-center">
                                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm text-gray-500 font-medium">
                                  {formData.grade 
                                    ? `No curricula found for ${formData.grade}${curriculumSearchTerm ? ' matching your search' : ''}`
                                    : 'No curricula found'}
                                </p>
                                {curriculumSearchTerm && (
                                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                )}
                              </div>
                            ) : (
                              filteredCurricula.map((curriculum: any) => {
                                const curriculumId = String(curriculum.curriculumId || curriculum.CurriculumId || '');
                                const curriculumName = curriculum.curriculumName || curriculum.CurriculumName;
                                const curriculumCode = curriculum.curriculumCode || curriculum.CurriculumCode;
                                const display = curriculumCode ? `${curriculumName} (${curriculumCode})` : curriculumName;
                                const isSelected = formData.curriculumId === curriculumId;
                                return (
                                  <button
                                    key={curriculumId}
                                    type="button"
                                    onClick={() => handleCurriculumSelect(curriculum)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                                      isSelected ? 'bg-blue-50 border-blue-100' : ''
                                    }`}
                                  >
                                    <GraduationCap className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className={`flex-1 text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
                                      {display}
                                    </span>
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                      {!formData.curriculumId && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Curriculum is required</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Count * (Auto-calculated)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.sessionCount || ''}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed outline-none"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated from duration days and sessions per week (rounded down)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sessions Per Week *
                  </label>
                  <input
                    type="number"
                    required
                    value={3}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed outline-none"
                    placeholder="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed at 3 sessions per week</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (Days) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.durationDays || ''}
                      onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Reschedule
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxReschedule || ''}
                    onChange={(e) => setFormData({ ...formData, maxReschedule: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                    placeholder="Enter package description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Package Image
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-4 relative">
                      <img
                        src={imagePreview}
                        alt="Package preview"
                        className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, imageUrl: '' }));
                          setSelectedImageFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleImageFileSelect(e, false)}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="text-gray-700">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-blue-600" />
                          <span className="text-gray-700 font-medium">
                            {imagePreview ? 'Change Image' : 'Upload Image'}
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      JPG, PNG, WebP (max 2MB)
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || loadingCurricula}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <PackageIcon className="w-5 h-5" />
                      <span>Create Package</span>
                    </>
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-t-3xl border-b border-blue-600 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Package</h2>
                <button
                  onClick={closeModals}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleUpdatePackage} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="Enter package name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade *
                  </label>
                  <select
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  >
                    <option value="grade 9">Grade 9</option>
                    <option value="grade 10">Grade 10</option>
                    <option value="grade 11">Grade 11</option>
                    <option value="grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (VND) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, price: value === '' ? 0 : parseInt(value) || 0 });
                      }}
                      className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.price > 0 && new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.price)}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Curriculum *
                  </label>
                  {loadingCurricula ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Loading curricula...</span>
                    </div>
                  ) : curricula.length === 0 ? (
                    <div className="px-4 py-3 border-2 border-yellow-200 rounded-xl bg-yellow-50 text-yellow-800 text-sm">
                      No curricula available. Please create a curriculum first.
                    </div>
                  ) : (
                    <div className="relative" ref={curriculumDropdownRef}>
                      <input
                        ref={curriculumInputRef}
                        type="text"
                        value={curriculumSearchTerm}
                        onChange={(e) => handleCurriculumInputChange(e.target.value)}
                        onFocus={handleCurriculumInputFocus}
                        placeholder="Search or select curriculum *"
                        className={`w-full pl-4 pr-10 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none ${
                          !formData.curriculumId && !curriculumSearchTerm
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                      <ChevronDown
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-transform pointer-events-none ${showCurriculumDropdown ? 'rotate-180' : ''}`}
                      />
                      {formData.curriculumId && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full pointer-events-none" />
                      )}
                      {showCurriculumDropdown && (
                        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                          <div className="overflow-y-auto max-h-80 custom-scrollbar">
                            {filteredCurricula.length === 0 ? (
                              <div className="p-8 text-center">
                                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm text-gray-500 font-medium">
                                  {formData.grade 
                                    ? `No curricula found for ${formData.grade}${curriculumSearchTerm ? ' matching your search' : ''}`
                                    : 'No curricula found'}
                                </p>
                                {curriculumSearchTerm && (
                                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                )}
                              </div>
                            ) : (
                              filteredCurricula.map((curriculum: any) => {
                                const curriculumId = String(curriculum.curriculumId || curriculum.CurriculumId || '');
                                const curriculumName = curriculum.curriculumName || curriculum.CurriculumName;
                                const curriculumCode = curriculum.curriculumCode || curriculum.CurriculumCode;
                                const display = curriculumCode ? `${curriculumName} (${curriculumCode})` : curriculumName;
                                const isSelected = formData.curriculumId === curriculumId;
                                return (
                                  <button
                                    key={curriculumId}
                                    type="button"
                                    onClick={() => handleCurriculumSelect(curriculum)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                                      isSelected ? 'bg-blue-50 border-blue-100' : ''
                                    }`}
                                  >
                                    <GraduationCap className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className={`flex-1 text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
                                      {display}
                                    </span>
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                      {!formData.curriculumId && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Curriculum is required</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Count * (Auto-calculated)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.sessionCount || ''}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed outline-none"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated from duration days and sessions per week (rounded down)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sessions Per Week *
                  </label>
                  <input
                    type="number"
                    required
                    value={3}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed outline-none"
                    placeholder="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed at 3 sessions per week</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (Days) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.durationDays || ''}
                      onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Reschedule
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxReschedule || ''}
                    onChange={(e) => setFormData({ ...formData, maxReschedule: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                    placeholder="Enter package description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Package Image
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-4 relative">
                      <img
                        src={imagePreview}
                        alt="Package preview"
                        className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, imageUrl: '' }));
                          setSelectedImageFile(null);
                          if (editFileInputRef.current) {
                            editFileInputRef.current.value = '';
                          }
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="mb-4">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleImageFileSelect(e, true)}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="text-gray-700">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-blue-600" />
                          <span className="text-gray-700 font-medium">
                            {imagePreview ? 'Change Image' : 'Upload Image'}
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      JPG, PNG, WebP (max 2MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || loadingCurricula}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <PackageIcon className="w-5 h-5" />
                      <span>Update Package</span>
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
      {showDeleteModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Package</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedPackage.name || selectedPackage.packageName}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePackage}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default PackageManagement;

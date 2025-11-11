import React, { useState, useEffect } from 'react';
import {
  Package as PackageIcon,
  Search,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Clock,
  GraduationCap,
  Calendar,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';
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
}

const PackageManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [curricula, setCurricula] = useState<any[]>([]);
  const [loadingCurricula, setLoadingCurricula] = useState(false);
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [formData, setFormData] = useState({
    packageName: '',
    grade: 'grade 9',
    price: 0,
    sessionCount: 0,
    sessionsPerWeek: 0,
    maxReschedule: 0,
    durationDays: 0,
    description: '',
    curriculumId: ''
  });

  useEffect(() => {
    fetchPackages();
    fetchCurricula();
  }, []);

  useEffect(() => {
    filterPackages();
  }, [packages, searchTerm]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const result = await apiService.getAllPackages();
      if (result.success && result.data) {
        const packagesData = Array.isArray(result.data) ? result.data : [];
        // Map backend data to frontend format
        const mappedPackages: PackageData[] = packagesData.map((pkg: any) => ({
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
          status: pkg.Status || pkg.status || 'active'
        }));
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
      const result = await apiService.request('/curricula');
      if (result.success && result.data) {
        const curriculaData = Array.isArray(result.data) ? result.data : [];
        setCurricula(curriculaData);
      }
    } catch (error) {
      console.error('Error fetching curricula:', error);
      // Don't show error - curricula might not be available
      setCurricula([]);
    } finally {
      setLoadingCurricula(false);
    }
  };

  const filterPackages = () => {
    let filtered = [...packages];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || p.packageName)?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.grade?.toLowerCase().includes(term)
      );
    }
    setFilteredPackages(filtered);
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.packageName.trim()) {
      showError('Package name is required');
      return;
    }
    if (formData.price <= 0) {
      showError('Price must be greater than 0');
      return;
    }
    if (formData.sessionCount <= 0) {
      showError('Session count must be greater than 0');
      return;
    }
    if (formData.sessionsPerWeek <= 0) {
      showError('Sessions per week must be greater than 0');
      return;
    }
    if (formData.durationDays <= 0) {
      showError('Duration days must be greater than 0');
      return;
    }
    if (!formData.curriculumId) {
      showError('Curriculum is required');
      return;
    }

    try {
      setCreatingPackage(true);
      const result = await apiService.request('/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PackageName: formData.packageName,
          Grade: formData.grade,
          Price: formData.price,
          SessionCount: formData.sessionCount,
          SessionsPerWeek: formData.sessionsPerWeek,
          MaxReschedule: formData.maxReschedule,
          DurationDays: formData.durationDays,
          Description: formData.description || null,
          CurriculumId: formData.curriculumId
        })
      });

      if (result.success) {
        showSuccess('Package created successfully');
        setShowCreateModal(false);
        setFormData({
          packageName: '',
          grade: 'grade 9',
          price: 0,
          sessionCount: 0,
          sessionsPerWeek: 0,
          maxReschedule: 0,
          durationDays: 0,
          description: '',
          curriculumId: ''
        });
        fetchPackages();
      } else {
        showError(result.error || 'Failed to create package');
      }
    } catch (error: any) {
      console.error('Error creating package:', error);
      showError(error?.message || 'Failed to create package');
    } finally {
      setCreatingPackage(false);
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
        setShowDeleteModal(false);
        setSelectedPackage(null);
        fetchPackages();
      } else {
        showError(result.error || 'Failed to delete package');
      }
    } catch (error: any) {
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
              onClick={() => setShowCreateModal(true)}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions/Week
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <PackageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No packages found</p>
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => {
                    const displayName = pkg.name || pkg.packageName || 'Unnamed Package';
                    const displayDuration = pkg.durationDays 
                      ? `${Math.ceil(pkg.durationDays / 30)} months (${pkg.durationDays} days)`
                      : pkg.duration 
                      ? `${pkg.duration} months`
                      : 'N/A';
                    const displaySessions = pkg.sessions || pkg.sessionCount || 0;
                    
                    return (
                      <tr key={pkg.packageId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <PackageIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{displayName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pkg.grade ? (
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-900 font-medium">{pkg.grade}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={pkg.description || ''}>
                            {pkg.description || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{displayDuration}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{displaySessions} sessions</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {pkg.sessionsPerWeek ? `${pkg.sessionsPerWeek}/week` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/packages/${pkg.packageId}/edit`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPackage(pkg);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-t-3xl border-b border-blue-600">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create New Package</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      packageName: '',
                      grade: 'grade 9',
                      price: 0,
                      sessionCount: 0,
                      sessionsPerWeek: 0,
                      maxReschedule: 0,
                      durationDays: 0,
                      description: '',
                      curriculumId: ''
                    });
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
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
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      step="1000"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
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
                    <select
                      required
                      value={formData.curriculumId}
                      onChange={(e) => setFormData({ ...formData, curriculumId: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    >
                      <option value="">Select a curriculum</option>
                      {curricula.map((curriculum: any) => (
                        <option key={curriculum.CurriculumId || curriculum.curriculumId} value={curriculum.CurriculumId || curriculum.curriculumId}>
                          {curriculum.CurriculumName || curriculum.curriculumName} ({curriculum.CurriculumCode || curriculum.curriculumCode})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Count *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.sessionCount || ''}
                      onChange={(e) => setFormData({ ...formData, sessionCount: parseInt(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sessions Per Week *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.sessionsPerWeek || ''}
                    onChange={(e) => setFormData({ ...formData, sessionsPerWeek: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="0"
                  />
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
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      packageName: '',
                      grade: 'grade 9',
                      price: 0,
                      sessionCount: 0,
                      sessionsPerWeek: 0,
                      maxReschedule: 0,
                      durationDays: 0,
                      description: '',
                      curriculumId: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPackage || loadingCurricula}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {creatingPackage ? (
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
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPackage(null);
                  }}
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


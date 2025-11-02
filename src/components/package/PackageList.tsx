import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PackageCard from './PackageCard';
import type { Course } from '../../types';
import { apiService } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';

interface PackageListProps {
  centerId?: string;
  onViewPackage?: (packageId: string) => void;
  onEditPackage?: (packageId: string) => void;
  onCreatePackage?: () => void;
  onEnrollPackage?: (pkg: Course) => void;
}

const PackageList: React.FC<PackageListProps> = ({
  centerId,
  onViewPackage,
  onEditPackage,
  onCreatePackage,
  onEnrollPackage
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showError } = useToast();
  const isAdmin = user?.role === 'admin';
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, [centerId]);

  useEffect(() => {
    applyFilters();
  }, [courses, categoryFilter, statusFilter, levelFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAllPackages();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch packages');
      }

      // Handle different response formats
      let packagesData: any[] = [];
      const responseData = response.data as any;
      if (Array.isArray(responseData)) {
        packagesData = responseData;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        packagesData = responseData.data;
      } else if (responseData?.items && Array.isArray(responseData.items)) {
        packagesData = responseData.items;
      } else if (responseData?.packages && Array.isArray(responseData.packages)) {
        packagesData = responseData.packages;
      }
      
      // Filter by centerId if provided
      const filteredPackages = centerId 
        ? packagesData.filter((pkg: any) => pkg.center_id === centerId || pkg.CenterId === centerId)
        : packagesData;

      // Map Package data (PascalCase) to Course interface for compatibility
      const mappedPackages = filteredPackages.map((pkg: any) => {
        const sessionCount = pkg.SessionCount || pkg.sessionCount || 0;
        const durationDays = pkg.DurationDays || pkg.durationDays || 0;
        const weeksNeeded = durationDays > 0 ? Math.ceil(durationDays / 7) : Math.ceil(sessionCount / 3); // Default 3 sessions/week
        
        return {
          course_id: pkg.PackageId || pkg.packageId || pkg.id || '',
          name: pkg.PackageName || pkg.packageName || pkg.name || '',
          description: pkg.Description || pkg.description || '',
          category: pkg.Grade || pkg.grade || 'General',
          level: 'Intermediate', // Default level
          price: pkg.Price || pkg.price || 0,
          duration_weeks: weeksNeeded,
          session_count: sessionCount,
          grade: pkg.Grade || pkg.grade || '',
          status: 'active', // Default status
          max_students: 0,
          current_students: 0,
          start_date: '',
          end_date: '',
          schedule: '',
          image_url: '',
          center_id: pkg.CenterId || pkg.centerId || '',
          center_name: pkg.CenterName || pkg.centerName || '',
          // Keep original package fields
          packageId: pkg.PackageId || pkg.packageId || '',
          packageName: pkg.PackageName || pkg.packageName || '',
          sessionCount: sessionCount,
          durationDays: durationDays,
          sessionsPerWeek: pkg.SessionsPerWeek || pkg.sessionsPerWeek || 3,
          maxReschedule: pkg.MaxReschedule || pkg.maxReschedule || 0
        };
      });

      setCourses(mappedPackages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch packages';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = courses;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course =>
        course.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(course =>
        course.level?.toLowerCase() === levelFilter.toLowerCase()
      );
    }

    setFilteredCourses(filtered);
  };

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];
  const statuses = ['all', 'active', 'upcoming', 'completed', 'cancelled'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          <Loader className="w-8 h-8 text-blue-600 animate-spin absolute -right-3 -bottom-3 bg-white rounded-full p-1.5 shadow-lg" />
        </div>
        <p className="mt-6 text-xl font-bold text-blue-600 animate-pulse">
          Loading packages...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-white border-2 border-red-200 shadow-xl">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-red-600 mb-3">Unable to Load Packages</h3>
          <p className="text-red-700 mb-8 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchCourses}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Coursera-style Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {centerId ? 'Center Packages' : 'Explore Packages'}
              </h1>
              <p className="text-gray-600">
                {filteredCourses.length} package{filteredCourses.length !== 1 ? 's' : ''} available
              </p>
            </div>
            {isAdmin && (onCreatePackage || true) && (
              <button
                onClick={() => onCreatePackage ? onCreatePackage() : navigate('/packages/create')}
                className="px-4 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Package</span>
              </button>
            )}
          </div>

          {/* Filters - Coursera style */}
          <div className="flex flex-wrap gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'All Levels' : level}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Packages Grid - Coursera style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-6">
              {courses.length === 0
                ? t('getStartedCourses')
                : t('tryAdjustingCourseFilters')}
            </p>
            {isAdmin && (onCreatePackage || true) && courses.length === 0 && (
              <button
                onClick={() => onCreatePackage ? onCreatePackage() : navigate('/packages/create')}
                className="px-4 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addFirstCourse')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course, index) => {
              const packageId = course.course_id || (course as any).packageId || '';
              return (
                <PackageCard
                  key={packageId || `package-${index}`}
                  course={course}
                  onView={(id) => onViewPackage ? onViewPackage(id) : navigate(`/packages/${id}`)}
                  onEdit={isAdmin ? ((id) => onEditPackage ? onEditPackage(id) : navigate(`/packages/${id}/edit`, { state: { course } })) : undefined}
                  onEnroll={onEnrollPackage}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageList;

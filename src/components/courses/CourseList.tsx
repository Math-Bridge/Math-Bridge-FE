import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader, Filter } from 'lucide-react';
import CourseCard from './CourseCard';
import type { Course } from '../../types';
import { getAllCourses } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

interface CourseListProps {
  centerId?: string;
  onViewCourse?: (courseId: string) => void;
  onEditCourse?: (courseId: string) => void;
  onCreateCourse?: () => void;
  onEnrollCourse?: (course: Course) => void;
}

const CourseList: React.FC<CourseListProps> = ({
  centerId,
  onViewCourse,
  onEditCourse,
  onCreateCourse,
  onEnrollCourse
}) => {
  const { t } = useTranslation();
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

      const response = await getAllCourses();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch courses');
      }

      const coursesData = response.data?.data || [];
      
      // Filter by centerId if provided
      const filteredCourses = centerId 
        ? coursesData.filter((course: any) => course.center_id === centerId)
        : coursesData;

      setCourses(filteredCourses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(errorMessage);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = courses;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course =>
        course.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(course =>
        course.level.toLowerCase() === levelFilter.toLowerCase()
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
          Loading courses...
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
          <h3 className="text-2xl font-bold text-red-600 mb-3">Unable to Load Courses</h3>
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
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-cyan-100/50 blur-3xl"></div>

        <div className="relative flex items-center justify-between flex-wrap gap-6 p-6 bg-white rounded-3xl border border-gray-200 shadow-xl">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur-xl opacity-40"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">
                {centerId ? 'Center Courses' : 'All Courses'}
              </h1>
              <p className="text-lg font-semibold text-blue-600 mt-1">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {onCreateCourse && (
            <button
              onClick={onCreateCourse}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Course</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('courseCategory')}</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('courseLevel')}</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none cursor-pointer"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'All Levels' : level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('courseStatus')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none cursor-pointer"
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

      {filteredCourses.length === 0 ? (
        <div className="card text-center py-20 bg-white border-2 border-dashed border-gray-300">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">No courses found</h3>
          <p className="text-gray-600 text-lg mb-10 max-w-lg mx-auto">
            {courses.length === 0
              ? t('getStartedCourses')
              : t('tryAdjustingCourseFilters')}
          </p>
          {onCreateCourse && courses.length === 0 && (
            <button
              onClick={onCreateCourse}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 hover:-translate-y-1 transition-all duration-200 shadow-xl"
            >
              <Plus className="w-6 h-6" />
              <span>{t('addFirstCourse')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course, index) => (
            <div
              key={course.course_id}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CourseCard
                course={course}
                onView={onViewCourse}
                onEdit={onEditCourse}
                onEnroll={onEnrollCourse}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;

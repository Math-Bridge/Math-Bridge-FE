import React from 'react';
import { ArrowLeft, Calendar, Users, DollarSign, Clock, GraduationCap, MapPin, BookOpen } from 'lucide-react';
import type { Course } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface PackageDetailProps {
  course: Course;
  onBack: () => void;
  onEdit?: (courseId: string) => void;
  onEnroll?: (course: Course) => void;
}

const PackageDetail: React.FC<PackageDetailProps> = ({ course, onBack, onEdit, onEnroll }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const enrollmentRate = course.max_students && course.current_students
    ? ((course.current_students / course.max_students) * 100).toFixed(0)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      case 'upcoming':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'completed':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'intermediate':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'advanced':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Coursera-style Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Packages</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Hero Image */}
              {course.image_url ? (
                <div className="relative h-64 rounded-lg overflow-hidden mb-6">
                  <img
                    src={course.image_url}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative h-64 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                  <BookOpen className="w-24 h-24 text-white opacity-80" />
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {course.name || 'Package Name'}
                </h1>
                {course.center_name && (
                  <div className="flex items-center space-x-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{course.center_name}</span>
                  </div>
                )}

                {(course as any).grade || course.category ? (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded">
                      {(course as any).grade || course.category || 'General'}
                    </span>
                  </div>
                ) : null}

                {course.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">About this package</h2>
                    <p className="text-gray-700 leading-relaxed">{course.description}</p>
                  </div>
                )}

                {/* What you'll learn section */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Package Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Sessions</p>
                        <p className="text-sm text-gray-600">{(course as any).sessionCount || 0} sessions</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Duration</p>
                        <p className="text-sm text-gray-600">{course.duration_weeks || 0} weeks</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Level</p>
                        <p className="text-sm text-gray-600">{course.level || 'Intermediate'}</p>
                      </div>
                    </div>

                    {course.start_date && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Start Date</p>
                          <p className="text-sm text-gray-600">{new Date(course.start_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Coursera style */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)}
                  </div>
                </div>

                {onEnroll && course.status === 'active' && (
                  <button
                    onClick={() => onEnroll(course)}
                    className="w-full px-6 py-3 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors mb-4"
                  >
                    Enroll Now
                  </button>
                )}

                {isAdmin && onEdit && course.course_id && (
                  <button
                    onClick={() => onEdit(course.course_id)}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-50 transition-colors"
                  >
                    Edit Package
                  </button>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-4 text-sm">
                  <div>
                    <span className="text-gray-600">Sessions:</span>
                    <span className="font-medium text-gray-900 ml-2">{(course as any).sessionCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900 ml-2">{course.duration_weeks || 0} weeks</span>
                  </div>
                  {course.center_name && (
                    <div>
                      <span className="text-gray-600">Center:</span>
                      <span className="font-medium text-gray-900 ml-2">{course.center_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetail;

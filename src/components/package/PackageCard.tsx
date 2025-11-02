import React from 'react';
import { BookOpen, Calendar, Users, DollarSign, Clock, GraduationCap, MapPin, Star } from 'lucide-react';
import type { Course } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

interface PackageCardProps {
  course: Course;
  onView?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  onEnroll?: (course: Course) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ course, onView, onEdit, onEnroll }) => {
  const { t } = useTranslation();
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
    switch (level.toLowerCase()) {
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

  // Generate a subtle gradient color based on package name
  const getGradientColor = (name: string) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-blue-500',
      'from-pink-500 to-rose-500'
    ];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  const gradientClass = getGradientColor(course.name || '');

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
      {/* Image/Placeholder - Coursera style */}
      <div 
        className="relative h-40 bg-gradient-to-br"
        style={{
          background: course.image_url 
            ? `url(${course.image_url}) center/cover` 
            : `linear-gradient(to bottom right, var(--tw-gradient-stops))`
        }}
        onClick={() => onView && (course.course_id || (course as any).packageId) && onView(course.course_id || (course as any).packageId)}
      >
        {!course.image_url && (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-90`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white opacity-80" />
            </div>
          </div>
        )}
      </div>

      {/* Content - Coursera style */}
      <div className="p-5" onClick={() => onView && (course.course_id || (course as any).packageId) && onView(course.course_id || (course as any).packageId)}>
        {/* Grade Badge */}
        {(course as any).grade || course.category ? (
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
              {(course as any).grade || course.category || 'General'}
            </span>
          </div>
        ) : null}

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.name || (course as any).packageName || 'Package'}
        </h3>

        {/* Center/Organization */}
        {course.center_name && (
          <p className="text-sm text-gray-600 mb-3">{course.center_name}</p>
        )}

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{(course as any).sessionCount || 0} sessions</span>
          </div>
          {course.duration_weeks && course.duration_weeks > 0 && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{course.duration_weeks} weeks</span>
            </div>
          )}
        </div>

        {/* Rating placeholder - Coursera style */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-1">4.5</span>
          <span className="text-xs text-gray-400">(120)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)}
            </span>
          </div>
          {isAdmin && onEdit && (course.course_id || (course as any).packageId) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(course.course_id || (course as any).packageId);
              }}
              className="px-3 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageCard;

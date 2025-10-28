import React from 'react';
import { BookOpen, Calendar, Users, DollarSign, Clock, GraduationCap, MapPin } from 'lucide-react';
import type { Course } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface CourseCardProps {
  course: Course;
  onView?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  onEnroll?: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onView, onEdit, onEnroll }) => {
  const { t } = useTranslation();
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

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-500"></div>

      <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
        {course.image_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={course.image_url}
              alt={course.name}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${getStatusColor(course.status || 'upcoming')}`}>
                {course.status || 'upcoming'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(course.level || 'Beginner')}`}>
                {course.level || t('beginner')}
              </span>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                {course.name}
              </h3>
              {course.center_name && (
                <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{course.center_name}</span>
                </div>
              )}
            </div>
            {!course.image_url && (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ml-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {course.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {course.description}
            </p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-700">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                <span>{course.category}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 font-semibold">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>${course.price}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-700">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{course.duration_weeks} weeks</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Users className="w-4 h-4 text-blue-500" />
                <span>{course.current_students}/{course.max_students}</span>
              </div>
            </div>

            {course.start_date && (
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Starts: {new Date(course.start_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {enrollmentRate !== '0' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Enrollment</span>
                <span className="font-bold text-blue-600">{enrollmentRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${enrollmentRate}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-100">
            {onEnroll && course.status === 'active' && course.current_students && course.max_students && course.current_students < course.max_students && (
              <button
                onClick={() => onEnroll(course)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {t('enrollNow')}
              </button>
            )}
            {onView && course.course_id && (
              <button
                onClick={() => onView(course.course_id!)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {t('viewDetails')}
              </button>
            )}
            {onEdit && course.course_id && (
              <button
                onClick={() => onEdit(course.course_id!)}
                className="flex-1 px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-300 transform hover:scale-105 transition-all duration-200 shadow-sm"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

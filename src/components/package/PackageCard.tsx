import React from 'react';
import { 
  Brain, 
  Calculator, 
  Globe, 
  PencilRuler, 
  Beaker, 
  Languages,
  BookOpen,
  Clock,
  Calendar,
  MapPin
} from 'lucide-react';
import type { Course } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface PackageCardProps {
  course: Course;
  onView?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  onEnroll?: (course: Course) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ course, onView, onEdit }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Gán icon theo tên gói học (có thể mở rộng thêm)
  const getPackageIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('math') || lowerName.includes('toán')) return Calculator;
    if (lowerName.includes('english') || lowerName.includes('tiếng anh')) return Languages;
    if (lowerName.includes('science') || lowerName.includes('khoa học')) return Beaker;
    if (lowerName.includes('literature') || lowerName.includes('văn')) return BookOpen;
    if (lowerName.includes('logic') || lowerName.includes('tư duy')) return Brain;
    if (lowerName.includes('art') || lowerName.includes('vẽ') || lowerName.includes('mỹ thuật')) return PencilRuler;
    if (lowerName.includes('world') || lowerName.includes('địa') || lowerName.includes('lịch sử')) return Globe;
    return BookOpen; // default
  };

  const IconComponent = getPackageIcon(course.name || '');

  // Màu nền nhẹ nhàng, không gradient
  const bgColor = course.price === 0 ? 'bg-emerald-50' : 'bg-sky-50';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group">
      {/* Header với icon lớn */}
      <div 
        className={`relative h-48 ${bgColor} flex items-center justify-center`}
        onClick={() => onView && (course.course_id || (course as any).packageId) && onView(course.course_id || (course as any).packageId)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
        
        <div className="relative z-10 p-8">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <IconComponent className="w-14 h-14 text-emerald-600" />
          </div>
        </div>

        {/* Status badge nếu không active */}
        {course.status && course.status !== 'active' && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-white/95 backdrop-blur rounded-full text-xs font-semibold text-gray-700 shadow">
            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div 
        className="p-6 space-y-4"
        onClick={() => onView && (course.course_id || (course as any).packageId) && onView(course.course_id || (course as any).packageId)}
      >
        {/* Tên gói học */}
        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {course.name || 'Gói học tập'}
        </h3>

        {/* Trung tâm */}
        {course.center_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{course.center_name}</span>
          </div>
        )}

        {/* Mô tả ngắn */}
        {course.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Thời lượng */}
        <div className="flex items-center gap-5 text-sm text-gray-600">
          {(course as any).sessionCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{(course as any).sessionCount} sessions</span>
            </div>
          )}
          {course.duration_weeks && course.duration_weeks > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>{course.duration_weeks} weeks</span>
            </div>
          )}
        </div>

        {/* Giá + Nút Edit */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)}
            </span>
            {course.price === 0 && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                MIỄN PHÍ
              </span>
            )}
          </div>

          {isAdmin && onEdit && (course.course_id || (course as any).packageId) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(course.course_id || (course as any).packageId);
              }}
              className="px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-xl hover:bg-emerald-50 transition-all"
            >
              Sửa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
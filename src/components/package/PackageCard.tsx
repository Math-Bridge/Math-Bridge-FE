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
  Calendar
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

  // Gradient xanh nhạt giống hình ảnh
  const gradients = [
    { from: 'from-blue-100', to: 'to-blue-50', icon: 'text-blue-600' },
    { from: 'from-cyan-100', to: 'to-cyan-50', icon: 'text-cyan-600' },
    { from: 'from-sky-100', to: 'to-sky-50', icon: 'text-sky-600' },
    { from: 'from-indigo-100', to: 'to-indigo-50', icon: 'text-indigo-600' },
  ];
  const gradientIndex = (course.course_id || '').length % gradients.length;
  const gradient = gradients[gradientIndex];
  const bgColor = course.price === 0 ? 'bg-accent-green/10' : `bg-gradient-to-b ${gradient.from} ${gradient.to}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-math-lg transition-all duration-300 cursor-pointer group h-full flex flex-col min-h-[400px]">
      {/* Header với icon lớn - chiếm ~40% chiều cao */}
      <div 
        className={`relative flex-shrink-0 ${bgColor} flex items-center justify-center min-h-[160px]`}
        onClick={() => onView && (course.course_id || (course as any).packageId) && onView(course.course_id || (course as any).packageId)}
      >
        <div className="relative z-10">
          <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <IconComponent className={`w-14 h-14 ${gradient.icon}`} />
          </div>
        </div>

        {/* Status badge nếu không active */}
        {course.status && course.status !== 'active' && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-white/95 backdrop-blur rounded-full text-xs font-semibold text-gray-700 shadow-lg">
            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
          </div>
        )}
      </div>

      {/* Content - chiếm ~60% chiều cao */}
      <div 
        className="p-5 flex-1 flex flex-col"
        onClick={() => onView && (course.course_id || (course as any).packageId) && onView(course.course_id || (course as any).packageId)}
      >
        {/* Phần nội dung có thể co giãn */}
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
        {/* Tên gói học */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
          {course.name || 'Gói học tập'}
        </h3>

        {/* Mô tả ngắn */}
        {course.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

          {/* Thời lượng - Sessions & Weeks */}
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-1">
          {(course as any).sessionCount > 0 && (
            <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{(course as any).sessionCount} sessions</span>
            </div>
          )}
          {course.duration_weeks && course.duration_weeks > 0 && (
            <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{course.duration_weeks} weeks</span>
            </div>
          )}
          </div>
        </div>

        {/* Giá - luôn ở dưới cùng, cố định vị trí */}
        <div className="pt-4 mt-auto border-t border-gray-100 flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(course.price || 0)}
            </span>
            {course.price === 0 && (
              <span className="px-2 py-1 bg-accent-green/20 text-accent-green text-xs font-bold rounded-full">
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
              className="mt-2 px-4 py-2 text-sm font-medium text-primary border-2 border-primary/40 rounded-lg hover:bg-primary/10 transition-all"
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
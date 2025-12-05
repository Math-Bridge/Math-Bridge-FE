import React, { useState } from 'react';
import { User, School, Calendar, MapPin, Edit, Trash2, RotateCcw } from 'lucide-react';
import { Child } from '../../services/api';

interface ChildCardProps {
  child: Child;
  onEdit?: (childId: string) => void;
  onDelete?: (childId: string) => void;
  onRestore?: (childId: string) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete, onRestore }) => {
  const [avatarError, setAvatarError] = useState(false);
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const getGradeStyle = (grade: string) => {
    const g = grade.toLowerCase();
    if (g.includes('9'))  return 'bg-sky-50 text-sky-700 border-sky-200';
    if (g.includes('10')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (g.includes('11')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (g.includes('12')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusStyle = () => {
    return child.status === 'deleted'
      ? 'bg-red-50 text-red-600 border-red-200'
      : 'bg-blue-50 text-blue-600 border-blue-200';
  };

  const getStatusText = () => {
    return child.status === 'deleted' ? 'Deleted' : 'Active';
  };

  const formatGrade = (grade: string) => {
    if (!grade) return '';
    return grade.replace(/grade/gi, 'Grade');
  };

  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(child.fullName)}&background=2563eb&color=fff&size=200`;

  return (
    <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden hover:shadow-math-lg transition-all transform hover:scale-[1.02] h-full flex flex-col">
      {/* Child Image */}
      <div className="relative aspect-[3/2] bg-gradient-to-br from-primary/20 to-primary-dark/20 overflow-hidden">
              {child.avatarUrl && !avatarError ? (
                <img
                  src={child.avatarUrl + (child.avatarVersion ? `?v=${child.avatarVersion}` : '')}
                  alt={child.fullName}
            className={`w-full h-full object-cover object-center ${child.status === 'deleted' ? 'opacity-50' : ''}`}
                  onError={() => setAvatarError(true)}
                />
              ) : (
          <img 
            src={fallbackAvatarUrl} 
            alt={child.fullName} 
            className={`w-full h-full object-cover object-center ${child.status === 'deleted' ? 'opacity-50' : ''}`}
          />
        )}
        {child.status === 'deleted' && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-math">
            Deleted
                </div>
              )}
            </div>

      {/* Child Info */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xl font-bold ${child.status === 'deleted' ? 'text-gray-500' : 'text-primary-dark'}`}>
                {child.fullName}
              </h3>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
                {child.grade && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGradeStyle(child.grade)}`}>
                    {formatGrade(child.grade)}
                  </span>
                )}
          {child.status !== 'deleted' && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle()}`}>
                  {getStatusText()}
                </span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <School className="w-4 h-4 text-primary flex-shrink-0" />
            <span className={`truncate ${child.status === 'deleted' ? 'text-gray-400' : 'text-gray-600'}`}>
              {child.schoolName || 'No school assigned'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className={`truncate ${child.status === 'deleted' ? 'text-gray-400' : 'text-gray-600'}`}>
              {child.centerName || 'No center assigned'}
            </span>
          </div>

          {child.dateOfBirth && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <span className={child.status === 'deleted' ? 'text-gray-400' : 'text-gray-600'}>
                Born {formatDate(child.dateOfBirth)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          {onEdit && child.status !== 'deleted' && (
            <button
              onClick={() => onEdit(child.childId)}
              className="w-full px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-math hover:shadow-math-lg flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}

          {child.status === 'deleted' && onRestore && (
            <button
              onClick={() => onRestore(child.childId)}
              className="w-full px-4 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green/90 transition-all shadow-math hover:shadow-math-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildCard;
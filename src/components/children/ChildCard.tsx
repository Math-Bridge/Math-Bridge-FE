import React from 'react';
import { User, School, Calendar, MapPin, Edit, Trash2, RotateCcw } from 'lucide-react';
import { Child } from '../../services/api';

interface ChildCardProps {
  child: Child;
  onEdit?: (childId: string) => void;
  onDelete?: (childId: string) => void;
  onRestore?: (childId: string) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete, onRestore }) => {
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

  return (
    <div className="group relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 
      overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-600/10 
      hover:-translate-y-1 hover:rotate-1 transform-gpu">
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/4 via-transparent to-blue-600/3 
        opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white/60
                ${child.status === 'deleted' ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}
              >
                <User className="w-9 h-9 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`text-xl font-bold truncate ${child.status === 'deleted' ? 'text-gray-500' : 'text-gray-900'}`}>
                {child.fullName}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {child.grade && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGradeStyle(child.grade)}`}>
                    {formatGrade(child.grade)}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle()}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-700">
            <School className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className={`text-sm font-medium truncate ${child.status === 'deleted' ? 'text-gray-400' : ''}`}>
              {child.schoolName || 'No school assigned'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className={`text-sm font-medium truncate ${child.status === 'deleted' ? 'text-gray-400' : ''}`}>
              {child.centerName || 'No center assigned'}
            </span>
          </div>

          {child.dateOfBirth && (
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <span className={`text-sm font-medium ${child.status === 'deleted' ? 'text-gray-400' : ''}`}>
                Born {formatDate(child.dateOfBirth)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          {onEdit && child.status !== 'deleted' && (
            <button
              onClick={() => onEdit(child.childId)}
              className="group/btn relative flex-1 px-5 py-3 bg-blue-100 text-blue-600 font-bold rounded-xl shadow-md
                border border-blue-200/50 overflow-hidden transition-all duration-400
                hover:shadow-lg hover:shadow-blue-500/20 hover:bg-blue-200 hover:rotate-1 transform-gpu
                flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/30 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
              <Edit className="w-4 h-4 relative z-10 transition-transform group-hover/btn:translate-x-0.5" />
              <span className="relative z-10 text-sm">Edit</span>
            </button>
          )}

          {onDelete && child.status !== 'deleted' && (
            <button
              onClick={() => onDelete(child.childId)}
              className="group/btn relative p-3 bg-red-50 text-red-600 rounded-xl shadow-md
                border border-red-200/50 hover:shadow-lg hover:shadow-red-500/20 hover:bg-red-100 
                hover:rotate-1 transform-gpu transition-all duration-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {child.status === 'deleted' && onRestore && (
            <button
              onClick={() => onRestore(child.childId)}
              className="group/btn relative flex-1 px-5 py-3 bg-green-100 text-green-600 font-bold rounded-xl shadow-md
                border border-green-200/50 overflow-hidden transition-all duration-400
                hover:shadow-lg hover:shadow-green-500/20 hover:bg-green-200 hover:rotate-1 transform-gpu
                flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/30 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
              <RotateCcw className="w-4 h-4 relative z-10 transition-transform group-hover/btn:rotate-180" />
              <span className="relative z-10 text-sm">Restore</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildCard;
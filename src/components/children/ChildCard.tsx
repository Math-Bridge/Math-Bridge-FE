import React from 'react';
import { User, School, Calendar, MapPin, Edit, Trash2, Link } from 'lucide-react';
import { Child } from '../../services/api';

interface ChildCardProps {
  child: Child;
  onEdit?: (childId: string) => void;
  onDelete?: (childId: string) => void;
  onLinkCenter?: (childId: string) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete, onLinkCenter }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case 'grade 9': return 'bg-blue-100 text-blue-800';
      case 'grade 10': return 'bg-green-100 text-green-800';
      case 'grade 11': return 'bg-yellow-100 text-yellow-800';
      case 'grade 12': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{child.fullName}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(child.grade)}`}>
                {child.grade}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(child.status)}`}>
                {child.status || 'active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <School className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{child.school}</span>
        </div>

        {child.centerName && (
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{child.centerName}</span>
          </div>
        )}

        {child.dateOfBirth && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Born: {formatDate(child.dateOfBirth)}</span>
          </div>
        )}
      </div>

      <div className="flex space-x-2 pt-3 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={() => onEdit(child.childId)}
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
          >
            <Edit className="w-3 h-3" />
            <span>Edit</span>
          </button>
        )}
        
        {onLinkCenter && !child.centerId && (
          <button
            onClick={() => onLinkCenter(child.childId)}
            className="flex-1 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-md hover:bg-green-100 transition-colors flex items-center justify-center space-x-1"
          >
            <Link className="w-3 h-3" />
            <span>Link</span>
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(child.childId)}
            className="px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 transition-colors flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChildCard;

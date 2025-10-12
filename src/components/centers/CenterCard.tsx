import React from 'react';
import { MapPin, Phone, Mail, Users, Star, Building2 } from 'lucide-react';

interface Center {
  centerId: string;
  name: string;
  address: string;
  phone?: string;
  status?: string;
  // Optional fields that might be present in the API response
  city?: string;
  district?: string;
  email?: string;
  description?: string;
  capacity?: number;
  current_students?: number;
  rating?: number;
  facilities?: string[];
}

interface CenterCardProps {
  center: Center;
  onView?: (centerId: string) => void;
  onEdit?: (centerId: string) => void;
}

const CenterCard: React.FC<CenterCardProps> = ({ center, onView, onEdit }) => {
  console.log('CenterCard received center data:', center);
  
  const occupancyRate = center.capacity && center.current_students
    ? ((center.current_students / center.capacity) * 100).toFixed(0)
    : 0;

  return (
    <div className="card hover-lift animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {center.name || (center as any).Name || 'Unnamed Center'}
            </h3>
            {(center.rating || (center as any).Rating) && (
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">
                  {(center.rating || (center as any).Rating)?.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          (center.status || (center as any).Status) === 'active'
            ? 'bg-green-100 text-green-800'
            : (center.status || (center as any).Status) === 'inactive'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {center.status || (center as any).Status || 'Active'}
        </span>
      </div>

      {(center.description || (center as any).Description) && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {center.description || (center as any).Description}
        </p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-start space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-gray-600">
            {(center.address || (center as any).Address) 
              ? `${center.address || (center as any).Address}${(center.district || (center as any).District) ? `, ${center.district || (center as any).District}` : ''}${(center.city || (center as any).City) ? `, ${center.city || (center as any).City}` : ''}`
              : `${(center.district || (center as any).District) ? center.district || (center as any).District : ''}${(center.city || (center as any).City) ? `${(center.district || (center as any).District) ? ', ' : ''}${center.city || (center as any).City}` : ''}`
            }
          </span>
        </div>

        {(center.phone || (center as any).Phone) && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{center.phone || (center as any).Phone}</span>
          </div>
        )}

        {(center.email || (center as any).Email) && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{center.email || (center as any).Email}</span>
          </div>
        )}

        {((center.current_students || (center as any).CurrentStudents) || (center.capacity || (center as any).Capacity)) && (
          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {center.current_students || (center as any).CurrentStudents || 0} / {center.capacity || (center as any).Capacity || 0} students
            </span>
            {occupancyRate !== '0' && (
              <span className="text-xs text-gray-500">({occupancyRate}%)</span>
            )}
          </div>
        )}
      </div>

      {((center.facilities && center.facilities.length > 0) || ((center as any).Facilities && (center as any).Facilities.length > 0)) && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {(center.facilities || (center as any).Facilities || []).slice(0, 3).map((facility: string, index: number) => (
              <span
                key={`${center.centerId || (center as any).CenterId || 'unknown'}-facility-${index}-${facility}`}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {facility}
              </span>
            ))}
            {(center.facilities || (center as any).Facilities || []).length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{(center.facilities || (center as any).Facilities || []).length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex space-x-2 pt-4 border-t border-gray-100">
        {onView && (
          <button
            onClick={() => onView(center.centerId || (center as any).CenterId || '')}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(center.centerId || (center as any).CenterId || '')}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default CenterCard;

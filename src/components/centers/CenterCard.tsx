import React from 'react';
import { MapPin, Phone, Mail, Users, Star, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

interface Center {
  centerId?: string;
  name?: string;
  address?: string;
  phone?: string;
  status?: string;
  city?: string;
  district?: string;
  email?: string;
  description?: string;
  capacity?: number;
  current_students?: number;
  rating?: number;
  facilities?: string[];
  // API response fields (PascalCase)
  CenterId?: string;
  Name?: string;
  FormattedAddress?: string;
  City?: string;
  District?: string;
  CountryCode?: string;
  PlaceName?: string;
  TutorCount?: number;
  CreatedDate?: string;
  UpdatedDate?: string;
  Latitude?: number;
  Longitude?: number;
}

interface CenterCardProps {
  center: Center;
  onView?: (centerId: string) => void;
  onEdit?: (centerId: string) => void;
}

const CenterCard: React.FC<CenterCardProps> = ({ center, onView, onEdit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const occupancyRate = center.capacity && center.current_students
    ? ((center.current_students / center.capacity) * 100).toFixed(0)
    : 0;

  const handleViewTutors = () => {
    const centerId = center.CenterId || center.centerId;
    if (centerId) {
      navigate(`/centers/${centerId}/tutors`);
    }
  };

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-500"></div>

      <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full blur-3xl opacity-60"></div>

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {center.Name || center.name || 'Unnamed Center'}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {center.TutorCount !== undefined && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-blue-600">
                        {center.TutorCount} tutors
                      </span>
                    </div>
                  )}
                  {(center.rating || (center as any).Rating) && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        {(center.rating || (center as any).Rating)?.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
              (center.status || (center as any).Status) === 'active'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                : (center.status || (center as any).Status) === 'inactive'
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
            }`}>
              {center.status || (center as any).Status || 'Active'}
            </span>
          </div>

           {(center.PlaceName || center.description || (center as any).Description) && (
             <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
               <p className="text-sm text-gray-700 line-clamp-2">
                 {center.PlaceName || center.description || (center as any).Description || ''}
               </p>
             </div>
           )}

          <div className="space-y-2.5 mb-4">
            <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-all group/item">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <MapPin className="w-4 h-4 text-white" />
              </div>
               <span className="text-sm text-gray-700 leading-relaxed">
                 {(() => {
                   // Ưu tiên FormattedAddress từ API
                   if (center.FormattedAddress) {
                     return center.FormattedAddress;
                   }
                   
                   // Nếu không có FormattedAddress, ghép từ các field riêng lẻ
                   const address = center.address || (center as any).Address || '';
                   const district = center.District || center.district || '';
                   const city = center.City || center.city || '';
                   
                   const parts = [address, district, city].filter(part => part && part.trim() !== '');
                   return parts.join(', ') || 'Địa chỉ không có sẵn';
                 })()}
               </span>
            </div>

            {(center.phone || (center as any).Phone) && (
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-all group/item">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-700">{center.phone || (center as any).Phone}</span>
              </div>
            )}

            {(center.email || (center as any).Email) && (
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-all group/item">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-700">{center.email || (center as any).Email}</span>
              </div>
            )}

             {center.TutorCount !== undefined && (
               <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-all group/item">
                 <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                   <Users className="w-4 h-4 text-white" />
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-gray-700 font-semibold">
                     {center.TutorCount} tutors available
                   </span>
                 </div>
               </div>
             )}
             {((center.current_students || (center as any).CurrentStudents) || (center.capacity || (center as any).Capacity)) && (
               <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-all group/item">
                 <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                   <Users className="w-4 h-4 text-white" />
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-gray-700 font-semibold">
                     {center.current_students || (center as any).CurrentStudents || 0} / {center.capacity || (center as any).Capacity || 0} {t('students')}
                   </span>
                   {occupancyRate !== '0' && (
                     <span className="text-xs font-bold text-blue-600">
                       ({occupancyRate}%)
                     </span>
                   )}
                 </div>
               </div>
             )}
          </div>

          {((center.facilities && center.facilities.length > 0) || ((center as any).Facilities && (center as any).Facilities.length > 0)) && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {(center.facilities || (center as any).Facilities || []).slice(0, 3).map((facility: string, index: number) => (
                  <span
                    key={`${center.centerId || (center as any).CenterId || 'unknown'}-facility-${index}-${facility}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {facility}
                  </span>
                ))}
                {(center.facilities || (center as any).Facilities || []).length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                    +{(center.facilities || (center as any).Facilities || []).length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-100">
             <button
               onClick={handleViewTutors}
               className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
             >
               View Tutors
             </button>
             {onView && (
               <button
                 onClick={() => onView(center.CenterId || center.centerId || '')}
                 className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
               >
                 {t('viewDetails')}
               </button>
             )}
             {onEdit && (
               <button
                 onClick={() => onEdit(center.CenterId || center.centerId || '')}
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

export default CenterCard;

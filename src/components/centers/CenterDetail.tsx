import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Star,
  Clock,
  Check,
  ArrowLeft,
  Edit,
  Loader,
  UserPlus
} from 'lucide-react';

interface Center {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
  description?: string;
  capacity: number;
  current_students: number;
  rating: number;
  facilities?: string[];
  operating_hours?: Record<string, string>;
  status: string;
}

interface CenterDetailProps {
  centerId: string;
  onBack?: () => void;
  onEdit?: (centerId: string) => void;
}

const CenterDetail: React.FC<CenterDetailProps> = ({ centerId, onBack, onEdit }) => {
  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCenterDetail();
  }, [centerId]);

  const fetchCenterDetail = async () => {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/centers/${centerId}`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setCenter(result.data);
      } else {
        setError(result.error || 'Failed to fetch center details');
      }
    } catch (err) {
      setError('An error occurred while fetching center details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !center) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-700">{error || 'Center not found'}</p>
        {onBack && (
          <button onClick={onBack} className="mt-4 btn-secondary">
            Go Back
          </button>
        )}
      </div>
    );
  }

  const occupancyRate = center.capacity > 0
    ? ((center.current_students / center.capacity) * 100).toFixed(1)
    : 0;

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(center.id)}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Center</span>
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{center.name}</h1>
              <div className="flex items-center space-x-2 mt-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-lg font-semibold text-gray-700">{center.rating.toFixed(1)}</span>
                <span className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold ${
                  center.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {center.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {center.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-600 leading-relaxed">{center.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900">
                  {center.address}<br />
                  {center.district && `${center.district}, `}{center.city}
                </p>
              </div>
            </div>

            {center.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{center.phone}</p>
                </div>
              </div>
            )}

            {center.email && (
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{center.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Capacity</h3>

            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Current Enrollment</p>
                <p className="text-gray-900 font-semibold">
                  {center.current_students} / {center.capacity} students
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{occupancyRate}% occupied</p>
              </div>
            </div>
          </div>
        </div>

        {center.facilities && center.facilities.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Facilities</h3>
            <div className="flex flex-wrap gap-2">
              {center.facilities.map((facility, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{facility}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {center.operating_hours && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Operating Hours</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {daysOrder.map((day) => {
                const hours = center.operating_hours?.[day];
                if (!hours) return null;

                return (
                  <div
                    key={day}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-900 capitalize">{day}</span>
                    <span className={`${
                      hours.toLowerCase() === 'closed'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {hours}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterDetail;

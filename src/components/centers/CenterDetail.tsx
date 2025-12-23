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
import { getCenterById, getTutorsByCenter } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

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
  const { user } = useAuth();
  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState<boolean>(false);
  const [tutorsError, setTutorsError] = useState<string | null>(null);

  useEffect(() => {
    fetchCenterDetail();
    fetchTutors();
  }, [centerId]);

  const fetchCenterDetail = async () => {
    try {
      setLoading(true);
      const result = await getCenterById(centerId);

      if (result.success && result.data) {
        // Transform API data to match component interface
        const apiCenter = result.data;
        const addressParts = apiCenter.address.split(',').map(part => part.trim());
        const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';

        const transformedCenter: Center = {
          id: apiCenter.centerId,
          name: apiCenter.name,
          address: apiCenter.address,
          city: city,
          phone: apiCenter.phone,
          status: apiCenter.status || 'active',
          // Default values for fields not in API
          district: undefined,
          email: undefined,
          description: undefined,
          capacity: 0,
          current_students: 0,
          rating: 0,
          facilities: [],
          operating_hours: undefined,
        };

        setCenter(transformedCenter);
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

  const fetchTutors = async () => {
    try {
      setTutorsError(null);
      setTutorsLoading(true);
      const result = await getTutorsByCenter(centerId);
      if (result.success && Array.isArray(result.data)) {
        setTutors(result.data);
      } else if (result.success && (result as any).data?.data) {
        // fallback if wrapped
        setTutors((result as any).data.data);
      } else {
        setTutorsError(result.error || 'Failed to fetch tutors');
      }
    } catch (err) {
      setTutorsError('An error occurred while fetching tutors');
      console.error('Tutors error:', err);
    } finally {
      setTutorsLoading(false);
    }
  };

  // Check if user has admin/staff role for edit functionality
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

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
        {onEdit && isAdminOrStaff && (
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

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tutors
            <span className="ml-2 text-sm font-normal text-gray-500">{tutors.length}</span>
          </h3>
          {isAdminOrStaff && (
            <button onClick={fetchTutors} className="btn-secondary flex items-center space-x-2">
              <Loader className={`w-4 h-4 ${tutorsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {tutorsLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}
        {tutorsError && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
            {tutorsError}
          </div>
        )}

        {!tutorsLoading && !tutorsError && (
          tutors.length === 0 ? (
            <div className="text-gray-500">No tutors assigned to this center.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tutors.map((t: any) => (
                <div key={t.TutorId || t.tutorId} className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-gray-900 font-semibold">{t.FullName || t.fullName}</div>
                      <div className="text-sm text-gray-500">{t.Email || t.email}</div>
                      {t.PhoneNumber || t.phoneNumber ? (
                        <div className="text-sm text-gray-500">{t.PhoneNumber || t.phoneNumber}</div>
                      ) : null}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (t.VerificationStatus || t.verificationStatus) === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {t.VerificationStatus || t.verificationStatus || 'pending'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>Hourly Rate</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format((t.HourlyRate || t.hourlyRate || 0))}
                    </span>
                  </div>
                  {t.Bio || t.bio ? (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{t.Bio || t.bio}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CenterDetail;

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Loader, TrendingUp } from 'lucide-react';
import CenterCard from './CenterCard';
import CenterSearch from './CenterSearch';

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

interface CenterListProps {
  onViewCenter?: (centerId: string) => void;
  onEditCenter?: (centerId: string) => void;
  onCreateCenter?: () => void;
}

const CenterList: React.FC<CenterListProps> = ({
  onViewCenter,
  onEditCenter,
  onCreateCenter
}) => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [filteredCenters, setFilteredCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      
      // Try the original API first
      try {
        const { getAllCenters } = await import('../../services/api');
        const result = await getAllCenters();

        if (result.success && result.data) {
          const centersData = result.data.data || result.data;
          setCenters(centersData);
          setFilteredCenters(centersData);
          return;
        }
      } catch (apiError) {
        console.warn('Original API failed, trying Supabase:', apiError);
      }

      // Fallback to Supabase if original API fails
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration not found');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/centers`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const centersData = result.data.data || result.data;
        setCenters(centersData);
        setFilteredCenters(centersData);
      } else {
        setError(result.error || 'Failed to fetch centers');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching centers';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string, city: string) => {
    let filtered = centers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(center =>
        (center.Name || center.name || '').toLowerCase().includes(term) ||
        (center.FormattedAddress || center.address || '').toLowerCase().includes(term) ||
        (center.PlaceName || center.description || '').toLowerCase().includes(term)
      );
    }

    if (city) {
      filtered = filtered.filter(center =>
        (center.City || center.city || '').toLowerCase().includes(city.toLowerCase())
      );
    }

    setFilteredCenters(filtered);
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <Loader className="w-8 h-8 text-blue-600 animate-spin absolute -right-3 -bottom-3 bg-white rounded-full p-1.5 shadow-lg" />
        </div>
        <p className="mt-6 text-xl font-bold text-blue-600 animate-pulse">
          Loading centers...
        </p>
        <div className="mt-4 flex space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div className="card bg-white border-2 border-red-200 shadow-xl">
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-3">
              Unable to Load Centers
            </h3>
            <p className="text-red-700 mb-8 font-medium max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchCenters}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-cyan-100/50 blur-3xl"></div>

        <div className="relative flex items-center justify-between flex-wrap gap-6 p-6 bg-white rounded-3xl border border-gray-200 shadow-xl">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur-xl opacity-40"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">
                Learning Centers
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <p className="text-lg font-semibold text-blue-600">
                  {filteredCenters.length} center{filteredCenters.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>

          {onCreateCenter && (
            <button
              onClick={onCreateCenter}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Center</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <CenterSearch onSearch={handleSearch} />

      {filteredCenters.length === 0 ? (
        <div className="relative">
          <div className="card text-center py-20 bg-white border-2 border-dashed border-gray-300">
            <div className="relative inline-block mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                <Building2 className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No centers found</h3>
            <p className="text-gray-600 text-lg mb-10 max-w-lg mx-auto">
              {centers.length === 0
                ? 'Get started by adding your first learning center to begin managing your educational network'
                : 'Try adjusting your search filters or clearing them to see all centers'}
            </p>
            {onCreateCenter && centers.length === 0 && (
              <button
                onClick={onCreateCenter}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 hover:-translate-y-1 transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                <Plus className="w-6 h-6" />
                <span>Add Your First Center</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCenters.map((center, index) => (
            <div
              key={center.centerId || `center-${index}`}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
               <CenterCard
                 center={center}
                 onView={onViewCenter}
                 onEdit={onEditCenter}
               />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CenterList;

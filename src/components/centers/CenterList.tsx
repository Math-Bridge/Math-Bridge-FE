import React, { useState, useEffect } from 'react';
import { Building2, Plus, Loader } from 'lucide-react';
import CenterCard from './CenterCard';
import CenterSearch from './CenterSearch';
import { getAllCenters } from '../../services/api';

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
      const result = await getAllCenters();

      if (result.success && result.data) {
        // Transform the API response to match our Center interface
        const centersData = result.data.data || result.data;
        console.log('Full API response:', result);
        console.log('Centers data received:', centersData);
        console.log('First center structure:', centersData[0]);
        setCenters(centersData);
        setFilteredCenters(centersData);
      } else {
        console.log('API call failed:', result);
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
        center.name.toLowerCase().includes(term) ||
        center.address.toLowerCase().includes(term) ||
        center.description?.toLowerCase().includes(term)
      );
    }

    if (city) {
      filtered = filtered.filter(center =>
        center.city?.toLowerCase().includes(city.toLowerCase())
      );
    }

    setFilteredCenters(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchCenters}
          className="mt-4 btn-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Centers</h1>
            <p className="text-sm text-gray-600">
              {filteredCenters.length} center{filteredCenters.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {onCreateCenter && (
          <button
            onClick={onCreateCenter}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Center</span>
          </button>
        )}
      </div>

      <CenterSearch onSearch={handleSearch} />

      {filteredCenters.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No centers found</h3>
          <p className="text-gray-600 mb-6">
            {centers.length === 0
              ? 'Get started by adding your first learning center'
              : 'Try adjusting your search filters'}
          </p>
          {onCreateCenter && centers.length === 0 && (
            <button
              onClick={onCreateCenter}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Center</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCenters.map((center, index) => (
            <CenterCard
              key={center.centerId || `center-${index}`}
              center={center}
              onView={onViewCenter}
              onEdit={onEditCenter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CenterList;

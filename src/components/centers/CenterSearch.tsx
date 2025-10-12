import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface CenterSearchProps {
  onSearch: (searchTerm: string, city: string) => void;
}

const CenterSearch: React.FC<CenterSearchProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [city, setCity] = useState('');

  const cities = [
    'All Cities',
    'Ho Chi Minh City',
    'Hanoi',
    'Da Nang',
    'Can Tho',
    'Hai Phong',
    'Bien Hoa',
    'Nha Trang',
    'Hue',
    'Vung Tau'
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value, city);
  };

  const handleCityChange = (value: string) => {
    const selectedCity = value === 'All Cities' ? '' : value;
    setCity(selectedCity);
    onSearch(searchTerm, selectedCity);
  };

  const handleClear = () => {
    setSearchTerm('');
    setCity('');
    onSearch('', '');
  };

  return (
    <div className="card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Search Centers</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="form-input pl-10"
              placeholder="Search by name, address, or description..."
            />
          </div>
        </div>

        <div>
          <label className="form-label">Filter by City</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={city || 'All Cities'}
              onChange={(e) => handleCityChange(e.target.value)}
              className="form-input pl-10"
            >
              {cities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(searchTerm || city) && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {searchTerm && (
              <span>
                Searching for: <span className="font-semibold">{searchTerm}</span>
              </span>
            )}
            {searchTerm && city && ' in '}
            {city && (
              <span>
                City: <span className="font-semibold">{city}</span>
              </span>
            )}
          </p>
          <button
            onClick={handleClear}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CenterSearch;

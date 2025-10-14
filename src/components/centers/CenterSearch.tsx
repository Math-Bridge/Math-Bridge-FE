import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';

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
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-3xl blur-lg opacity-30"></div>

      <div className="relative bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-cyan-50 to-transparent rounded-full blur-3xl"></div>

        <div className="relative p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Search & Filter
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Centers
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Search className="w-5 h-5 text-blue-500" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="Search by name, address, or description..."
                  />
                  {searchTerm && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-3 p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by City
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none z-10">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <select
                    value={city || 'All Cities'}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none cursor-pointer appearance-none bg-white"
                  >
                    {cities.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(searchTerm || city) && (
            <div className="mt-6 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-2xl blur opacity-30"></div>
              <div className="relative flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Active Filters</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {searchTerm && (
                        <span>
                          Search: <span className="text-blue-600">{searchTerm}</span>
                        </span>
                      )}
                      {searchTerm && city && <span className="text-gray-400 mx-2">•</span>}
                      {city && (
                        <span>
                          City: <span className="text-blue-600">{city}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CenterSearch;

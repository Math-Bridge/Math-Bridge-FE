import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  Users, 
  Star, 
  CheckCircle,
  ArrowLeft,
  Search,
  Filter,
  BookOpen,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../hooks/useTranslation';
import { apiService } from '../../../services/api';

interface Package {
  id: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  grade?: string;
  duration: number; // in weeks
  sessions: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  features: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
}

const PackageSelection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await apiService.getAllPackages();
        if (response.success && response.data) {
          // Map API response to component interface
          const mappedPackages = response.data.map((pkg: any) => ({
            id: pkg.packageId || pkg.id || pkg.PackageId || String(pkg.packageId || pkg.PackageId),
            name: pkg.name || pkg.packageName || pkg.PackageName || '',
            description: pkg.description || pkg.Description || '',
            subject: pkg.subject || pkg.category || 'General',
            level: pkg.level || 'Intermediate',
            grade: pkg.Grade || pkg.grade || '',
            duration: pkg.duration || pkg.durationWeeks || pkg.DurationDays ? Math.ceil(pkg.DurationDays / 7) : 0,
            sessions: pkg.sessions || pkg.totalSessions || pkg.SessionCount || pkg.sessionCount || 0,
            price: pkg.price || pkg.Price || 0,
            originalPrice: pkg.originalPrice,
            discount: pkg.discount,
            rating: pkg.rating || 0,
            reviews: pkg.reviews || pkg.reviewCount || 0,
            features: pkg.features || [],
            isPopular: pkg.isPopular || false,
            isRecommended: pkg.isRecommended || false,
            imageUrl: pkg.ImageUrl || pkg.imageUrl || pkg.image_url || '',
            image_url: pkg.ImageUrl || pkg.imageUrl || pkg.image_url || '',
            ImageUrl: pkg.ImageUrl || pkg.imageUrl || pkg.image_url || ''
          }));
          setPackages(mappedPackages);
        } else {
          console.error('Failed to fetch packages:', response.error);
          setPackages([]);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
    const pkgGrade = (pkg as any).grade || '';
    const matchesGrade = selectedGrade === 'all' || pkgGrade.toLowerCase() === selectedGrade.toLowerCase();
    
    return matchesSearch && matchesGrade;
  });

  // Get unique grades from packages
  const availableGrades = Array.from(new Set(
    packages
      .map(pkg => (pkg as any).grade || '')
      .filter(grade => grade && grade.trim() !== '')
      .sort()
  ));
  

  const handleSelectPackage = (packageId: string) => {
    navigate(`/contracts/create?package=${packageId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full bg-gray-50 py-8">
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/contracts/create')}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold">Back to Contract Creation</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('selectPackage')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">{t('selectLearningPackage')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search packages by name or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                >
                  <option value="all">All Grades</option>
                  {availableGrades.map(grade => (
                    <option key={grade} value={grade}>
                      {grade.charAt(0).toUpperCase() + grade.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const packageImageUrl = (pkg as any).imageUrl || (pkg as any).image_url || (pkg as any).ImageUrl || '';
            return (
            <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Package Image or Placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
                {packageImageUrl ? (
                  <img
                    src={packageImageUrl}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide image on error, show gradient background
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-blue-400" />
                  </div>
                )}
                {/* Badges */}
                {pkg.isPopular && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {t('popularPackage')}
                    </span>
                  </div>
                )}
                {pkg.isRecommended && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {t('recommendedPackage')}
                    </span>
                  </div>
                )}
                {pkg.discount && (
                  <div className="absolute bottom-4 left-4 z-10">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {pkg.discount}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Package Name */}
              <div className="px-6 pt-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              </div>

              <div className="p-6 pt-0">
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{pkg.subject}</span>
                    </div>
                    {/* <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>{pkg.level}</span>
                    </div> */}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('duration')}</span>
                    <span className="font-medium">{pkg.duration} {t('weeks')}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('sessions')}</span>
                    <span className="font-medium">{pkg.sessions} {t('sessions')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('rating')}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{pkg.rating}</span>
                      <span className="text-gray-500">({pkg.reviews} {t('reviews')})</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                  <ul className="space-y-1">
                    {pkg.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {pkg.features.length > 3 && (
                      <li className="text-sm text-gray-500">+{pkg.features.length - 3} more features</li>
                    )}
                  </ul>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price)}
                      </p>
                      {pkg.originalPrice && (
                        <p className="text-sm text-gray-500 line-through">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.originalPrice)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Per session</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price / pkg.sessions)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPackage(pkg.id)}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  {t('enrollNow')}
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGrade('all');
              }}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default PackageSelection;

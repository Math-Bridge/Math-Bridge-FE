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
  DollarSign,
  BookOpen,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Package {
  id: string;
  name: string;
  description: string;
  subject: string;
  level: string;
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
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    // Mock data for demo
    setPackages([
      {
        id: '1',
        name: 'Advanced Algebra Mastery',
        description: 'Comprehensive algebra course covering all topics from basic to advanced level',
        subject: 'Mathematics',
        level: 'Advanced',
        duration: 12,
        sessions: 24,
        price: 2000000,
        originalPrice: 2500000,
        discount: 20,
        rating: 4.8,
        reviews: 156,
        features: ['1-on-1 tutoring', 'Practice tests', 'Progress tracking', 'Certificate'],
        isPopular: true,
        isRecommended: true
      },
      {
        id: '2',
        name: 'Physics Fundamentals',
        description: 'Complete physics course covering mechanics, thermodynamics, and waves',
        subject: 'Physics',
        level: 'Intermediate',
        duration: 8,
        sessions: 16,
        price: 1500000,
        originalPrice: 1800000,
        discount: 17,
        rating: 4.6,
        reviews: 89,
        features: ['Group sessions', 'Lab experiments', 'Homework help', 'Exam prep'],
        isRecommended: true
      },
      {
        id: '3',
        name: 'Chemistry Basics',
        description: 'Introduction to chemistry with hands-on experiments and practical applications',
        subject: 'Chemistry',
        level: 'Beginner',
        duration: 6,
        sessions: 12,
        price: 1200000,
        rating: 4.4,
        reviews: 67,
        features: ['Interactive labs', 'Safety training', 'Periodic table mastery', 'Real-world applications']
      },
      {
        id: '4',
        name: 'Calculus Intensive',
        description: 'Advanced calculus course for university preparation',
        subject: 'Mathematics',
        level: 'Advanced',
        duration: 16,
        sessions: 32,
        price: 3000000,
        originalPrice: 3500000,
        discount: 14,
        rating: 4.9,
        reviews: 203,
        features: ['University prep', 'Advanced problems', 'Research projects', 'Mentorship'],
        isPopular: true
      },
      {
        id: '5',
        name: 'Biology Essentials',
        description: 'Comprehensive biology course covering cell biology, genetics, and ecology',
        subject: 'Biology',
        level: 'Intermediate',
        duration: 10,
        sessions: 20,
        price: 1800000,
        rating: 4.5,
        reviews: 94,
        features: ['Microscopy labs', 'Field trips', 'Research projects', 'Career guidance']
      }
    ]);
    setLoading(false);
  }, []);

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || pkg.subject === selectedSubject;
    const matchesLevel = selectedLevel === 'all' || pkg.level === selectedLevel;
    
    return matchesSearch && matchesSubject && matchesLevel;
  });

  const sortedPackages = [...filteredPackages].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popular':
      default:
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    }
  });

  const subjects = [...new Set(packages.map(pkg => pkg.subject))];
  const levels = [...new Set(packages.map(pkg => pkg.level))];

  const handleSelectPackage = (packageId: string) => {
    navigate(`/user/contracts/create?package=${packageId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/user/contracts/create')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Contract Creation</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Select Package</h1>
          <p className="text-gray-600 mt-2">Choose the perfect learning package for your child</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search packages..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPackages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Badges */}
              <div className="relative">
                {pkg.isPopular && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Popular
                    </span>
                  </div>
                )}
                {pkg.isRecommended && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Recommended
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

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{pkg.subject}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>{pkg.level}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-medium">{pkg.duration} weeks</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Sessions</span>
                    <span className="font-medium">{pkg.sessions} sessions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{pkg.rating}</span>
                      <span className="text-gray-500">({pkg.reviews})</span>
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
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Select Package
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedPackages.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('all');
                setSelectedLevel('all');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageSelection;

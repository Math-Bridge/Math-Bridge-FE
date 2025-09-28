import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  BookOpen, 
  Users, 
  ChevronRight,
  Heart,
  Award,
  DollarSign
} from 'lucide-react';

interface Tutor {
  id: string;
  name: string;
  subjects: string[];
  experience: string;
  rating: number;
  totalReviews: number;
  hourlyRate: number;
  location: string;
  avatarUrl?: string;
  isVerified: boolean;
  responseTime: string;
  completedSessions: number;
  specialties: string[];
}

const TutorList: React.FC = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience'>('rating');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Simulate API call with more realistic data
    setLoading(true);
    setTimeout(() => {
      setTutors([
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          subjects: ['Algebra', 'Geometry', 'Calculus'],
          experience: '8 years',
          rating: 4.9,
          totalReviews: 127,
          hourlyRate: 65,
          location: 'San Francisco, CA',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          isVerified: true,
          responseTime: '< 2 hours',
          completedSessions: 450,
          specialties: ['Test Prep', 'Advanced Calculus']
        },
        {
          id: '2',
          name: 'Prof. Michael Chen',
          subjects: ['Statistics', 'Data Analysis', 'Probability'],
          experience: '12 years',
          rating: 4.8,
          totalReviews: 89,
          hourlyRate: 75,
          location: 'New York, NY',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          isVerified: true,
          responseTime: '< 1 hour',
          completedSessions: 320,
          specialties: ['University Level', 'Research Methods']
        },
        {
          id: '3',
          name: 'Emma Rodriguez',
          subjects: ['Algebra', 'Pre-Calculus', 'Trigonometry'],
          experience: '5 years',
          rating: 4.7,
          totalReviews: 156,
          hourlyRate: 45,
          location: 'Austin, TX',
          avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          isVerified: false,
          responseTime: '< 4 hours',
          completedSessions: 280,
          specialties: ['High School Math', 'Exam Prep']
        },
        {
          id: '4',
          name: 'David Kim',
          subjects: ['Calculus', 'Linear Algebra', 'Differential Equations'],
          experience: '6 years',
          rating: 4.6,
          totalReviews: 73,
          hourlyRate: 55,
          location: 'Seattle, WA',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          isVerified: true,
          responseTime: '< 3 hours',
          completedSessions: 195,
          specialties: ['Engineering Math', 'Advanced Topics']
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const subjects = ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry', 'Pre-Calculus', 'Linear Algebra'];

  const filteredAndSortedTutors = tutors
    .filter(tutor =>
      tutor.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterSubject ? tutor.subjects.includes(filterSubject) : true)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.hourlyRate - b.hourlyRate;
        case 'experience':
          return parseInt(b.experience) - parseInt(a.experience);
        default:
          return 0;
      }
    });

  const toggleFavorite = (tutorId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(tutorId)) {
      newFavorites.delete(tutorId);
    } else {
      newFavorites.add(tutorId);
    }
    setFavorites(newFavorites);
  };

  const handleViewDetails = (tutorId: string) => {
    // Navigate to tutor detail page
    window.location.href = `/tutors/${tutorId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Finding the best tutors for you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Math Tutor</h1>
          <p className="text-gray-600">Connect with experienced tutors who can help you excel in mathematics</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'experience')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
              >
                <option value="rating">Sort by Rating</option>
                <option value="price">Sort by Price</option>
                <option value="experience">Sort by Experience</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center md:justify-start">
              <span className="text-gray-600 font-medium">
                {filteredAndSortedTutors.length} tutors found
              </span>
            </div>
          </div>
        </div>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedTutors.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={tutor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&size=64`}
                      alt={tutor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    {tutor.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                        <Award className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{tutor.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(tutor.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-900">{tutor.rating}</span>
                      <span className="text-gray-500 text-sm">({tutor.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {tutor.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {tutor.responseTime}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleFavorite(tutor.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    favorites.has(tutor.id)
                      ? 'text-red-500 bg-red-50 hover:bg-red-100'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${favorites.has(tutor.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Subjects */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              {tutor.specialties.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-2">
                    {tutor.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{tutor.completedSessions}</div>
                  <div className="text-xs text-gray-500">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{tutor.experience}</div>
                  <div className="text-xs text-gray-500">Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">${tutor.hourlyRate}</div>
                  <div className="text-xs text-gray-500">Per Hour</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleViewDetails(tutor.id)}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>View Profile</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button className="px-4 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Book Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedTutors.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tutors found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearch('');
                setFilterSubject('');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorList;
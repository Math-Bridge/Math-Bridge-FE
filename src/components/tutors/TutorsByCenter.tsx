import React, { useEffect, useState } from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  User, 
  Users, 
  ChevronRight,
  Heart,
  Award,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTutorsByCenter } from '../../services/api';

interface Tutor {
  id: string;
  name: string;
  subjects: string[];
  experience: string;
  rating: number;
  totalReviews: number;
  location: string;
  avatarUrl?: string;
  isVerified: boolean;
  responseTime: string;
  completedSessions: number;
  specialties: string[];
  centerId: string;
}

interface Center {
  centerId?: string;
  name?: string;
  address?: string;
  city?: string;
  district?: string;
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

const TutorsByCenter: React.FC = () => {
  const { centerId } = useParams<{ centerId: string }>();
  const navigate = useNavigate();
  
  // Mock center data - trong thực tế sẽ fetch từ API
  const [center, setCenter] = useState<Center | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'experience'>('rating');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch center data
  useEffect(() => {
    if (centerId) {
      // Mock center data - trong thực tế sẽ fetch từ API
      setCenter({
        CenterId: centerId,
        Name: 'Loading Center...',
        FormattedAddress: 'Loading address...',
        City: 'Loading city...',
        District: 'Loading district...',
        TutorCount: 0
      });
    }
  }, [centerId]);

  useEffect(() => {
    const fetchTutors = async () => {
      if (!centerId) return;
      
      setLoading(true);
      try {
        const result = await getTutorsByCenter(centerId);
        
        if (result.success && result.data) {
          // Transform API data to match our Tutor interface
          const tutorsData = result.data.map((tutor: any) => ({
            id: tutor.tutorId || tutor.id,
            name: tutor.fullName || tutor.name,
            subjects: tutor.subjects || ['Mathematics'],
            experience: tutor.experience || '5 years',
            rating: tutor.rating || 4.5,
            totalReviews: tutor.totalReviews || 0,
            location: center?.FormattedAddress || center?.address || '',
            avatarUrl: tutor.avatarUrl,
            isVerified: tutor.isVerified || false,
            responseTime: tutor.responseTime || '< 4 hours',
            completedSessions: tutor.completedSessions || 0,
            specialties: tutor.specialties || ['General Math'],
            centerId: centerId || ''
          }));
          setTutors(tutorsData);
        } else {
          setTutors([]); // Không fallback mock, chỉ trả về rỗng khi lỗi hoặc không có dữ liệu
        }
      } catch (error) {
        console.error('Error fetching tutors:', error);
        setTutors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, [centerId]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutors...</p>
        </div>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Center Not Found</h2>
          <p className="text-gray-600 mb-4">The center you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/centers')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Centers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate('/centers')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tutors at {center.Name || center.name}</h1>
              <p className="text-gray-600 flex items-center mt-2">
                <MapPin className="w-4 h-4 mr-1" />
                {center.FormattedAddress || center.address}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
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
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'experience')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
              >
                <option value="rating">Sort by Rating</option>
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
        <div>
          {filteredAndSortedTutors.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
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
          ) : (
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
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewDetails(tutor.id)}
                      className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>View Profile</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button className="px-4 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Contact Staff</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorsByCenter;

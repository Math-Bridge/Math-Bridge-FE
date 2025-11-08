import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  User, 
  Users, 
  ChevronRight,
  Award,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { getAllTutors, Tutor } from '../../services/api';

interface TutorDisplay extends Tutor {
  id: string;
  name: string;
  subjects: string[];
  experience: string;
  totalReviews: number;
  location: string;
  avatarUrl: string;
  isVerified: boolean;
  specialties: string[];
  languages: string[];
}

const TutorList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<TutorDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const subjects = [t('allSubjects'), t('algebra'), t('geometry'), t('calculus'), t('statistics'), t('trigonometry'), t('preCalculus')];

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      try {
        const result = await getAllTutors();
        if (result.success && result.data) {
          // Map Tutor data to TutorDisplay format
          const mappedTutors: TutorDisplay[] = result.data.map((tutor: Tutor) => {
            // Get subjects from specialties or major
            const tutorSubjects = tutor.specialties && tutor.specialties.length > 0 
              ? tutor.specialties 
              : tutor.major 
                ? [tutor.major] 
                : ['Math'];
            
            // Format experience
            const experience = tutor.yearsOfExperience 
              ? `${tutor.yearsOfExperience} years`
              : 'Not specified';
            
            // Default avatar
            const avatarUrl = tutor.profilePictureUrl || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.fullName)}&background=random`;
            
            // Location from center or default
            const location = tutor.centerName || 'Location not specified';
            
            // Languages (default to English if not specified)
            const languages = ['English']; // Can be extended if backend provides this
            
            // Is verified
            const isVerified = tutor.verificationStatus === 'approved' || tutor.verificationStatus === 'Approved';
            
            return {
              ...tutor,
              id: tutor.userId,
              name: tutor.fullName,
              subjects: tutorSubjects,
              experience: experience,
              rating: tutor.rating || 0,
              totalReviews: tutor.studentCount || 0,
              location: location,
              avatarUrl: avatarUrl,
              isVerified: isVerified,
              specialties: tutor.specialties || [],
              languages: languages,
            };
          });
          
          setTutors(mappedTutors);
        } else {
          console.error('Failed to fetch tutors:', result.error);
          setTutors([]);
        }
      } catch (error) {
        console.error('Error fetching tutors:', error);
        setTutors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutor.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === '' || selectedSubject === 'All Subjects' || 
                          tutor.subjects.includes(selectedSubject);
    return matchesSearch && matchesSubject;
  });

  const sortedTutors = [...filteredTutors].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'experience':
        const expA = parseInt(a.experience) || 0;
        const expB = parseInt(b.experience) || 0;
        return expB - expA;
      default:
        return 0;
    }
  });

  const handleViewDetails = (tutorId: string) => {
    navigate(`/tutors/${tutorId}`);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Math Tutors</h1>
          <p className="text-gray-600">Browse our qualified math tutors. Contact our staff to discuss your learning needs.</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('searchTutors')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rating">{t('sortBy')} {t('rating')}</option>
                <option value="experience">{t('experience')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {sortedTutors.length} of {tutors.length} tutors
          </p>
        </div>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTutors.map((tutor) => (
            <div key={tutor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Tutor Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random`;
                  }}
                />
                {tutor.isVerified && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full">
                    <Award className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Tutor Info */}
              <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{tutor.name}</h3>
                  {tutor.rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{tutor.rating.toFixed(1)}</span>
                      {tutor.totalReviews > 0 && (
                        <span className="text-sm text-gray-500">({tutor.totalReviews})</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{tutor.experience} experience</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{tutor.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>{tutor.languages.join(', ')}</span>
                  </div>
                </div>

                {/* Subjects */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {tutor.subjects.slice(0, 3).map((subject, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                    {tutor.subjects.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{tutor.subjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>


                {/* Staff Assignment Info */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">Staff Assignment</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Tutor assignments are managed by our staff team. Contact us to discuss your learning needs.
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleViewDetails(tutor.id)}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>{t('viewProfile')}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {sortedTutors.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noTutorsFound')}</h3>
            <p className="text-gray-600">Try adjusting your search criteria or contact our staff for assistance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorList;

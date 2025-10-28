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

interface Tutor {
  id: string;
  name: string;
  subjects: string[];
  experience: string;
  rating: number;
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
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const subjects = [t('allSubjects'), t('algebra'), t('geometry'), t('calculus'), t('statistics'), t('trigonometry'), t('preCalculus')];

  useEffect(() => {
    // Simulate API call
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
          location: 'San Francisco, CA',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
          isVerified: true,
          specialties: ['Test Preparation', 'Advanced Calculus'],
          languages: ['English', 'Spanish']
        },
        {
          id: '2',
          name: 'Prof. Michael Chen',
          subjects: ['Statistics', 'Probability', 'Data Analysis'],
          experience: '12 years',
          rating: 4.8,
          totalReviews: 89,
          location: 'New York, NY',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
          isVerified: true,
          specialties: ['Data Science', 'Research Methods'],
          languages: ['English', 'Mandarin']
        },
        {
          id: '3',
          name: 'Dr. Emily Rodriguez',
          subjects: ['Trigonometry', 'Pre-Calculus', 'Algebra II'],
          experience: '6 years',
          rating: 4.7,
          totalReviews: 156,
          location: 'Los Angeles, CA',
          avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
          isVerified: true,
          specialties: ['High School Math', 'SAT Prep'],
          languages: ['English', 'Spanish', 'French']
        },
        {
          id: '4',
          name: 'Prof. David Kim',
          subjects: ['Calculus', 'Linear Algebra', 'Differential Equations'],
          experience: '10 years',
          rating: 4.9,
          totalReviews: 203,
          location: 'Boston, MA',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
          isVerified: true,
          specialties: ['College Math', 'Engineering Math'],
          languages: ['English', 'Korean']
        },
        {
          id: '5',
          name: 'Dr. Lisa Thompson',
          subjects: ['Geometry', 'Algebra', 'Statistics'],
          experience: '7 years',
          rating: 4.6,
          totalReviews: 98,
          location: 'Chicago, IL',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
          isVerified: true,
          specialties: ['Middle School Math', 'Tutoring'],
          languages: ['English']
        },
        {
          id: '6',
          name: 'Prof. James Wilson',
          subjects: ['Calculus', 'Statistics', 'Probability'],
          experience: '15 years',
          rating: 4.8,
          totalReviews: 312,
          location: 'Seattle, WA',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
          isVerified: true,
          specialties: ['Advanced Statistics', 'Research'],
          languages: ['English', 'German']
        }
      ]);
      setLoading(false);
    }, 1000);
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
        return b.rating - a.rating;
      case 'experience':
        return parseInt(b.experience) - parseInt(a.experience);
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
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900">{tutor.rating}</span>
                    <span className="text-sm text-gray-500">({tutor.totalReviews})</span>
                  </div>
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

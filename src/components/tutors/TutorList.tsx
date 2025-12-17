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
  MessageSquare,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { getAllTutors, Tutor, apiService } from '../../services/api';

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
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 9 items per page (3 columns x 3 rows)

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      try {
        const result = await getAllTutors();
        if (result.success && result.data) {
          // Map Tutor data to TutorDisplay format
          const mappedTutors: TutorDisplay[] = await Promise.all(
            result.data.map(async (tutor: Tutor) => {
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
              
              // Try to get avatarUrl from tutor data first
              let avatarUrl = tutor.avatarUrl || tutor.profilePictureUrl;
              
              // If no avatarUrl, fetch from User API
              if (!avatarUrl && tutor.userId) {
                try {
                  const userResponse = await apiService.getUserById(tutor.userId);
                  if (userResponse.success && userResponse.data) {
                    avatarUrl = userResponse.data.avatarUrl || userResponse.data.AvatarUrl || undefined;
                  }
                } catch (err) {
                  // Silently fail, will use fallback
                  if (import.meta.env.DEV) {
                    console.warn(`Failed to fetch avatar for tutor ${tutor.userId}:`, err);
                  }
                }
              }
              
              // Fallback to generated avatar if still no avatarUrl
              if (!avatarUrl) {
                avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.fullName)}&background=random`;
              }
              
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
            })
          );
          
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

  // Filter tutors - only search by name
  const filteredTutors = tutors.filter(tutor => {
    if (!searchTerm.trim()) return true;
    return tutor.name.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Pagination calculations
  const totalPages = Math.ceil(sortedTutors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTutors = sortedTutors.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleViewDetails = (tutorId: string) => {
    navigate(`/tutors/${tutorId}`);
  };

  if (loading) {
    return (
      <>
        {/* Subtle Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-primary/15 text-7xl font-light select-none animate-float"
                style={{
                  left: `${10 + (i * 70) % 85}%`,
                  top: `${15 + (i * 55) % 80}%`,
                  animationDelay: `${i * 3}s`,
                }}
              >
                {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-screen bg-gradient-to-b from-background-cream via-white to-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutors...</p>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
          }
          .animate-float { animation: float 25s linear infinite; }
        `}} />
      </>
    );
  }

  return (
    <>
      {/* Subtle Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-primary/15 text-7xl font-light select-none animate-float"
              style={{
                left: `${10 + (i * 70) % 85}%`,
                top: `${15 + (i * 55) % 80}%`,
                animationDelay: `${i * 3}s`,
              }}
            >
              {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 min-h-screen">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
        {/* Header */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-8 sm:p-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-2">
                      Our Math Tutors
                    </h1>
                    <p className="text-lg sm:text-xl text-white/95">
                      Browse our qualified math tutors. Contact our staff to discuss your learning needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Search */}
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 mb-8">
          <div className="max-w-md">
            {/* Search - only by name */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by tutor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600 font-medium">
              Showing <span className="font-bold text-primary">{startIndex + 1}-{Math.min(endIndex, sortedTutors.length)}</span> of{" "}
              <span className="font-bold text-primary">{sortedTutors.length}</span> tutors
            {searchTerm && ` (filtered from ${tutors.length} total)`}
          </p>
        </div>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedTutors.map((tutor) => (
              <div key={tutor.id} className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden hover:shadow-math-lg transition-all transform hover:scale-[1.02]">
              {/* Tutor Image */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary-dark/20 overflow-hidden">
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.name}
                    className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random`;
                  }}
                />
                {tutor.isVerified && (
                    <div className="absolute top-3 right-3 bg-primary text-white p-2 rounded-full shadow-math">
                    <Award className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Tutor Info */}
              <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-primary-dark">{tutor.name}</h3>
                  {tutor.rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold text-primary-dark">{tutor.rating.toFixed(1)}</span>
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
                          className="px-2 py-1 bg-primary/10 text-primary border-2 border-primary/20 text-xs rounded-full font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                    {tutor.subjects.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border-2 border-gray-200">
                        +{tutor.subjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleViewDetails(tutor.id)}
                    className="w-full bg-primary text-white px-4 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-math hover:shadow-math-lg flex items-center justify-center gap-2"
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
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-12 text-center">
              <Users className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary-dark mb-2">{t('noTutorsFound')}</h3>
            <p className="text-gray-600">Try adjusting your search criteria or contact our staff for assistance.</p>
          </div>
        )}

        {/* Pagination */}
        {sortedTutors.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
                className={`px-4 py-2 rounded-xl border-2 ${
                currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Page Numbers */}
              <div className="flex gap-1">
              {(() => {
                // Chỉ hiển thị 5 số trang
                const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
                const endPage = Math.min(startPage + 4, totalPages);
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }
                return pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-xl border-2 ${
                      currentPage === page
                        ? 'bg-primary text-white border-primary shadow-math'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-xl border-2 ${
                currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-float { animation: float 25s linear infinite; }
      `}} />
    </>
  );
};

export default TutorList;

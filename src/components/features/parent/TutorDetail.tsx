import React, { useState, useEffect } from 'react';
import { 
  User, 
  Star, 
  Award, 
  MapPin, 
  Clock, 
  MessageSquare,
  BookOpen,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  Calendar,
  GraduationCap,
  Languages,
  Phone,
  Mail
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTutorById, getFinalFeedbacksByUserId, apiService } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useHideIdInUrl } from '../../../hooks/useHideIdInUrl';

interface TutorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  experience: string;
  rating: number;
  totalReviews: number;
  subjects: string[];
  qualifications: Array<{
    title: string;
    institution: string;
    year: string;
  }>;
  languages: string[];
  availability: Array<{
    day: string;
    timeSlots: string[];
  }>;
  hourlyRate: number;
  centerName: string;
  centerAddress: string;
  profileImage?: string;
  avatarUrl?: string;
  verified: boolean;
}

interface Review {
  id: string;
  parentName: string;
  rating: number;
  comment: string;
  date: string;
  subject: string;
}

const TutorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id: tutorId } = useParams<{ id: string }>();
  const { showError } = useToast();
  useHideIdInUrl(); // Hide ID in URL bar
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');

  useEffect(() => {
    if (!tutorId) {
      console.error('TutorDetail: No tutorId provided');
      setLoading(false);
      return;
    }

    const fetchTutorData = async () => {
      try {
        setLoading(true);
        console.log('TutorDetail: Fetching tutor with ID:', tutorId);
        
        // Fetch tutor info
        const tutorResponse = await getTutorById(tutorId);
        console.log('TutorDetail: API Response:', tutorResponse);
        
        if (!tutorResponse.success) {
          console.error('TutorDetail: API call failed:', tutorResponse.error);
          showError(tutorResponse.error || 'Failed to load tutor information');
          setLoading(false);
          return;
        }
        
        if (!tutorResponse.data) {
          console.error('TutorDetail: No data in response');
          showError('Tutor not found');
          setLoading(false);
          return;
        }

        const tutorData = tutorResponse.data;
        const verification = tutorData.verification;
        
        // Calculate average rating from final feedbacks
        const feedbacks = tutorData.finalFeedbacks || [];
        const avgRating = feedbacks.length > 0
          ? feedbacks.reduce((sum: number, fb: any) => sum + (fb.overallSatisfactionRating || fb.OverallSatisfactionRating || 0), 0) / feedbacks.length
          : 0;

        // Map tutor schedules to availability format
        const schedules = tutorData.tutorSchedules || [];
        const availabilityMap: { [key: string]: string[] } = {};
        schedules.forEach((schedule: any) => {
          const dayOfWeek = schedule.dayOfWeek || schedule.DayOfWeek || '';
          const startTime = schedule.startTime || schedule.StartTime || '';
          const endTime = schedule.endTime || schedule.EndTime || '';
          if (dayOfWeek && startTime && endTime) {
            if (!availabilityMap[dayOfWeek]) {
              availabilityMap[dayOfWeek] = [];
            }
            availabilityMap[dayOfWeek].push(`${startTime}-${endTime}`);
          }
        });

        const availability = Object.entries(availabilityMap).map(([day, timeSlots]) => ({
          day,
          timeSlots
        }));

        // Get center info
        const centers = tutorData.tutorCenters || [];
        const firstCenter = centers[0]?.center || centers[0]?.Center || null;

        // Try to get avatarUrl from tutor data first
        let avatarUrl = tutorData.avatarUrl || tutorData.AvatarUrl;
        
        // If no avatarUrl, fetch from User API
        if (!avatarUrl && tutorData.userId) {
          try {
            const userResponse = await apiService.getUserById(tutorData.userId);
            if (userResponse.success && userResponse.data) {
              avatarUrl = userResponse.data.avatarUrl || userResponse.data.AvatarUrl || undefined;
            }
          } catch (err) {
            // Silently fail, will use undefined
            if (import.meta.env.DEV) {
              console.warn('Error fetching tutor avatar:', err);
            }
          }
        }

        // Map to TutorProfile format
        setTutor({
          id: tutorData.userId,
          name: tutorData.fullName,
          email: tutorData.email,
          phone: tutorData.phone || 'N/A',
          bio: verification?.bio || 'No bio available',
          experience: 'Experienced', // Could calculate from createdDate
          rating: Math.round(avgRating * 10) / 10,
          totalReviews: feedbacks.length,
          subjects: verification?.major ? [verification.major] : ['Mathematics'],
          qualifications: verification?.university ? [
            {
              title: verification.major || 'Degree',
              institution: verification.university,
              year: new Date(tutorData.createdDate || Date.now()).getFullYear().toString()
            }
          ] : [],
          languages: ['English', 'Vietnamese'], // Default, could be enhanced
          availability: availability.length > 0 ? availability : [
            { day: 'Monday', timeSlots: ['09:00-17:00'] },
            { day: 'Tuesday', timeSlots: ['09:00-17:00'] },
            { day: 'Wednesday', timeSlots: ['09:00-17:00'] },
            { day: 'Thursday', timeSlots: ['09:00-17:00'] },
            { day: 'Friday', timeSlots: ['09:00-17:00'] }
          ],
          hourlyRate: verification?.hourlyRate || 0,
          centerName: firstCenter?.centerName || firstCenter?.CenterName || 'Not assigned',
          centerAddress: firstCenter?.address || firstCenter?.Address || tutorData.formattedAddress || 'N/A',
          profileImage: avatarUrl,
          avatarUrl: avatarUrl || null,
          verified: verification?.verificationStatus === 'verified' || verification?.verificationStatus === 'Verified'
        });

        // Fetch reviews
        const reviewsResponse = await getFinalFeedbacksByUserId(tutorId);
        if (reviewsResponse.success && reviewsResponse.data) {
          const mappedReviews: Review[] = reviewsResponse.data.map((fb: any) => ({
            id: fb.feedbackId || fb.FeedbackId || '',
            parentName: fb.parentName || fb.ParentName || 'Anonymous',
            rating: fb.overallSatisfactionRating || fb.OverallSatisfactionRating || 0,
            comment: fb.comment || fb.Comment || 'No comment',
            date: fb.createdDate || fb.CreatedDate || new Date().toISOString(),
            subject: 'Mathematics' // Could be enhanced with package info
          }));
          setReviews(mappedReviews);
        }
      } catch (error) {
        console.error('TutorDetail: Error fetching tutor data:', error);
        showError('Failed to load tutor information. Please try again later.');
        setTutor(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorData();
  }, [tutorId, showError]);

  const handleBookSession = () => {
    navigate('/contracts/create', { 
      state: { 
        tutorId: tutor?.id, 
        tutorName: tutor?.name 
      } 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleContactTutor = () => {
    navigate('/user/chat', { 
      state: { 
        tutorId: tutor?.id, 
        tutorName: tutor?.name 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!loading && !tutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <User className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Tutor Not Found</h3>
          <p className="text-gray-600 mb-2">
            The tutor you're looking for doesn't exist or has been removed.
          </p>
          {tutorId && (
            <p className="text-sm text-gray-500 mb-6">
              Tutor ID: <code className="bg-gray-100 px-2 py-1 rounded">{tutorId}</code>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/tutors')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-math hover:shadow-math-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Tutors
            </button>
            <button
              onClick={async () => {
                if (!tutorId) return;
                setLoading(true);
                try {
                  const tutorResponse = await getTutorById(tutorId);
                  if (tutorResponse.success && tutorResponse.data) {
                    const tutorData = tutorResponse.data;
                    const verification = tutorData.verification;
                    
                    const feedbacks = tutorData.finalFeedbacks || [];
                    const avgRating = feedbacks.length > 0
                      ? feedbacks.reduce((sum: number, fb: any) => sum + (fb.overallSatisfactionRating || fb.OverallSatisfactionRating || 0), 0) / feedbacks.length
                      : 0;

                    const schedules = tutorData.tutorSchedules || [];
                    const availabilityMap: { [key: string]: string[] } = {};
                    schedules.forEach((schedule: any) => {
                      const dayOfWeek = schedule.dayOfWeek || schedule.DayOfWeek || '';
                      const startTime = schedule.startTime || schedule.StartTime || '';
                      const endTime = schedule.endTime || schedule.EndTime || '';
                      if (dayOfWeek && startTime && endTime) {
                        if (!availabilityMap[dayOfWeek]) {
                          availabilityMap[dayOfWeek] = [];
                        }
                        availabilityMap[dayOfWeek].push(`${startTime}-${endTime}`);
                      }
                    });

                    const availability = Object.entries(availabilityMap).map(([day, timeSlots]) => ({
                      day,
                      timeSlots
                    }));

                    const centers = tutorData.tutorCenters || [];
                    const firstCenter = centers[0]?.center || centers[0]?.Center || null;

                    let avatarUrl = tutorData.avatarUrl || tutorData.AvatarUrl;
                    
                    if (!avatarUrl && tutorData.userId) {
                      try {
                        const userResponse = await apiService.getUserById(tutorData.userId);
                        if (userResponse.success && userResponse.data) {
                          avatarUrl = userResponse.data.avatarUrl || userResponse.data.AvatarUrl || undefined;
                        }
                      } catch (err) {
                        if (import.meta.env.DEV) {
                          console.warn('Error fetching tutor avatar:', err);
                        }
                      }
                    }

                    setTutor({
                      id: tutorData.userId,
                      name: tutorData.fullName,
                      email: tutorData.email,
                      phone: tutorData.phone || 'N/A',
                      bio: verification?.bio || 'No bio available',
                      experience: 'Experienced',
                      rating: Math.round(avgRating * 10) / 10,
                      totalReviews: feedbacks.length,
                      subjects: verification?.major ? [verification.major] : ['Mathematics'],
                      qualifications: verification?.university ? [
                        {
                          title: verification.major || 'Degree',
                          institution: verification.university,
                          year: new Date(tutorData.createdDate || Date.now()).getFullYear().toString()
                        }
                      ] : [],
                      languages: ['English', 'Vietnamese'],
                      availability: availability.length > 0 ? availability : [
                        { day: 'Monday', timeSlots: ['09:00-17:00'] },
                        { day: 'Tuesday', timeSlots: ['09:00-17:00'] },
                        { day: 'Wednesday', timeSlots: ['09:00-17:00'] },
                        { day: 'Thursday', timeSlots: ['09:00-17:00'] },
                        { day: 'Friday', timeSlots: ['09:00-17:00'] }
                      ],
                      hourlyRate: verification?.hourlyRate || 0,
                      centerName: firstCenter?.centerName || firstCenter?.CenterName || 'Not assigned',
                      centerAddress: firstCenter?.address || firstCenter?.Address || tutorData.formattedAddress || 'N/A',
                      profileImage: avatarUrl,
                      avatarUrl: avatarUrl || null,
                      verified: verification?.verificationStatus === 'verified' || verification?.verificationStatus === 'Verified'
                    });

                    const reviewsResponse = await getFinalFeedbacksByUserId(tutorId);
                    if (reviewsResponse.success && reviewsResponse.data) {
                      const mappedReviews: Review[] = reviewsResponse.data.map((fb: any) => ({
                        id: fb.feedbackId || fb.FeedbackId || '',
                        parentName: fb.parentName || fb.ParentName || 'Anonymous',
                        rating: fb.overallSatisfactionRating || fb.OverallSatisfactionRating || 0,
                        comment: fb.comment || fb.Comment || 'No comment',
                        date: fb.createdDate || fb.CreatedDate || new Date().toISOString(),
                        subject: 'Mathematics'
                      }));
                      setReviews(mappedReviews);
                    }
                  } else {
                    showError(tutorResponse.error || 'Failed to load tutor information');
                  }
                } catch (error) {
                  console.error('Error fetching tutor data:', error);
                  showError('Failed to load tutor information. Please try again later.');
                } finally {
                  setLoading(false);
                }
              }}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/tutors')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-primary border-2 border-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all shadow-math hover:shadow-math-lg mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tutors
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                {tutor.avatarUrl ? (
                  <img 
                    src={tutor.avatarUrl} 
                    alt={tutor.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : null}
                {!tutor.avatarUrl && (
                  <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{tutor.name}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2 break-words">
                  {tutor.subjects.join(' • ')} • {tutor.experience} experience
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {tutor.verified && (
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Verified
                </span>
              )}
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                <span className="font-semibold text-sm sm:text-base">{tutor.rating}</span>
                <span className="text-gray-500 text-xs sm:text-sm">({tutor.totalReviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: User },
                { key: 'reviews', label: 'Reviews', icon: Star }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                <p className="text-gray-700 leading-relaxed">{tutor.bio}</p>
              </div>

              {/* Subjects */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h3>
                <div className="flex flex-wrap gap-3">
                  {tutor.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Qualifications */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualifications</h3>
                <div className="space-y-4">
                  {tutor.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-blue-500 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">{qual.title}</p>
                        <p className="text-sm text-gray-600">{qual.institution} • {qual.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
                <div className="flex flex-wrap gap-3">
                  {tutor.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{tutor.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{tutor.phone}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Reviews</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{review.parentName}</p>
                        <p className="text-sm text-gray-600">{review.subject}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TutorDetail;

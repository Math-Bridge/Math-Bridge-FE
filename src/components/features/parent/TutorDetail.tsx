import React, { useState, useEffect } from 'react';
import { 
  User, 
  Star, 
  MapPin, 
  CheckCircle,
  ArrowLeft,
  GraduationCap,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTutorById, getFinalFeedbacksByUserId, apiService } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useHideIdInUrl } from '../../../hooks/useHideIdInUrl';

interface TutorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  // experience: string;
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
  communicationRating?: number;
  sessionQualityRating?: number;
  learningProgressRating?: number;
  professionalismRating?: number;
  wouldRecommend?: boolean;
  feedbackText?: string;
  additionalComments?: string;
  userFullName?: string;
}

const TutorDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tutorId = (location.state as any)?.tutorId || (location.state as any)?.id;
  const { showError } = useToast();
  useHideIdInUrl(); // Hide ID in URL bar
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    if (!tutorId) {
      console.error('TutorDetail: No tutorId provided');
      setLoading(false);
      navigate('/tutors');
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
        const firstCenter = centers[0]?.Center || centers[0]?.center || null;

        // Try to get avatarUrl from tutor data first
        let avatarUrl = tutorData.avatarUrl;
        
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
          // experience: 'Experienced', // Could calculate from createdDate
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
          centerName: firstCenter?.Name || firstCenter?.name || 'Not assigned',
          centerAddress: firstCenter?.FormattedAddress || firstCenter?.formattedAddress || tutorData.formattedAddress || 'N/A',
          profileImage: avatarUrl,
          avatarUrl: avatarUrl || null,
          verified: verification?.verificationStatus === 'verified' || verification?.verificationStatus === 'Verified'
        });

        // Fetch reviews
        const reviewsResponse = await getFinalFeedbacksByUserId(tutorId);
        if (reviewsResponse.success && reviewsResponse.data) {
          const mappedReviews: Review[] = reviewsResponse.data.map((fb: any) => ({
            id: fb.feedbackId || fb.FeedbackId || '',
            parentName: fb.parentName || fb.ParentName || fb.userFullName || fb.UserFullName || 'Anonymous',
            rating: fb.overallSatisfactionRating || fb.OverallSatisfactionRating || 0,
            comment: fb.comment || fb.Comment || fb.feedbackText || fb.FeedbackText || fb.additionalComments || fb.AdditionalComments || 'No comment',
            date: fb.createdDate || fb.CreatedDate || new Date().toISOString(),
            subject: 'Mathematics', // Could be enhanced with package info
            communicationRating: fb.communicationRating || fb.CommunicationRating,
            sessionQualityRating: fb.sessionQualityRating || fb.SessionQualityRating,
            learningProgressRating: fb.learningProgressRating || fb.LearningProgressRating,
            professionalismRating: fb.professionalismRating || fb.ProfessionalismRating,
            wouldRecommend: fb.wouldRecommend || fb.WouldRecommend || false,
            feedbackText: fb.feedbackText || fb.FeedbackText,
            additionalComments: fb.additionalComments || fb.AdditionalComments,
            userFullName: fb.userFullName || fb.UserFullName || fb.parentName || fb.ParentName || 'Anonymous'
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


  if (loading) {
    return (
      <div className="min-h-screen bg-background-cream flex items-center justify-center">
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
                    const firstCenter = centers[0]?.Center || centers[0]?.center || null;

                    let avatarUrl = tutorData.avatarUrl;
                    
                    if (!avatarUrl && tutorData.userId) {
                      try {
                        const userResponse = await apiService.getUserById(tutorData.userId);
                        if (userResponse.success && userResponse.data) {
                          avatarUrl = userResponse.data.avatarUrl || undefined;
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
                      // experience: 'Experienced',
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
                      centerName: firstCenter?.Name || firstCenter?.name || 'Not assigned',
                      centerAddress: firstCenter?.FormattedAddress || firstCenter?.formattedAddress || tutorData.formattedAddress || 'N/A',
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
              className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tutor) return null;

  return (
    <div className="w-full min-h-screen bg-background-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
          <button
            onClick={() => navigate('/tutors')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-primary border border-primary/20 rounded-lg font-medium hover:bg-primary/10 transition-all mb-6 shadow-sm"
          >
          <ArrowLeft className="w-4 h-4" />
            Back to Tutors
          </button>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
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
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-32 h-32 text-white opacity-50" />
                    </div>
                )}
              </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header with Name, Title, Location */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{tutor.name}</h1>
              {tutor.verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
              </div>
                  <p className="text-lg text-primary font-medium mb-2">Math Tutor</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{tutor.centerAddress}</span>
            </div>
          </div>
        </div>

              {/* RANKINGS */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{tutor.rating.toFixed(1)}</div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(tutor.rating) ? 'text-yellow-400 fill-current' : 
                        i < tutor.rating ? 'text-yellow-400 fill-current opacity-50' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({tutor.totalReviews} reviews)</span>
              </div>


        {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
              {[
                    { key: 'about', label: 'About', icon: User },
                { key: 'reviews', label: 'Reviews', icon: Star }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                      <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
        </div>

        {/* Tab Content */}
              {activeTab === 'about' && (
                <div className="space-y-6 pt-4">
                  {/* About Section */}
                  <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                    <p className="text-gray-600 leading-relaxed">{tutor.bio}</p>
              </div>

              {/* Qualifications */}
                  {tutor.qualifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
                <div className="space-y-4">
                  {tutor.qualifications.map((qual, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <GraduationCap className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{qual.title}</p>
                        <p className="text-sm text-gray-600">{qual.institution} • {qual.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                  )}

                  {/* CONTACT INFORMATION */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">CONTACT INFORMATION</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <a href={`tel:${tutor.phone}`} className="text-primary hover:underline">
                          {tutor.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="text-gray-600">{tutor.centerAddress}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary" />
                        <a href={`mailto:${tutor.email}`} className="text-primary hover:underline">
                          {tutor.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-primary" />
                        <span className="text-gray-900">{tutor.centerName}</span>
                      </div>
                    </div>
                  </div>
                </div>
        )}

        {activeTab === 'reviews' && (
                <div className="space-y-6 pt-4">
                  {/* Tutor Rating Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutor Rating</h3>
                    {reviews.length > 0 ? (
                      <>
                        {/* Calculate average ratings */}
                        {(() => {
                          const totalReviews = reviews.length;
                          const avgOverall = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;
                          const avgCommunication = reviews.reduce((sum, r) => sum + (r.communicationRating || 0), 0) / reviews.filter(r => r.communicationRating).length || 0;
                          const avgSessionQuality = reviews.reduce((sum, r) => sum + (r.sessionQualityRating || 0), 0) / reviews.filter(r => r.sessionQualityRating).length || 0;
                          const avgLearningProgress = reviews.reduce((sum, r) => sum + (r.learningProgressRating || 0), 0) / reviews.filter(r => r.learningProgressRating).length || 0;
                          const avgProfessionalism = reviews.reduce((sum, r) => sum + (r.professionalismRating || 0), 0) / reviews.filter(r => r.professionalismRating).length || 0;
                          const wouldRecommendCount = reviews.filter(r => r.wouldRecommend).length;
                          const recommendPercentage = (wouldRecommendCount / totalReviews) * 100;
                          
                          return (
              <div className="space-y-4">
                              {/* Overall Rating */}
                              <div className="text-center pb-4 border-b border-gray-200">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-6 h-6 ${
                                          i < Math.floor(avgOverall)
                                            ? 'text-yellow-400 fill-current'
                                            : i < avgOverall
                                            ? 'text-yellow-400 fill-current opacity-50'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-2xl font-bold text-gray-900">{avgOverall.toFixed(1)}</span>
                                </div>
                                <p className="text-sm text-gray-600">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                                <p className="text-xs text-green-600 mt-1">{recommendPercentage.toFixed(0)}% would recommend</p>
                              </div>
                              
                              {/* Individual Rating Breakdown */}
                              <div className="space-y-3">
                                {avgCommunication > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-600">Communication</span>
                                      <span className="text-sm font-semibold text-gray-900">{avgCommunication.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${(avgCommunication / 5) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                
                                {avgSessionQuality > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-600">Session Quality</span>
                                      <span className="text-sm font-semibold text-gray-900">{avgSessionQuality.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-purple-600 h-2 rounded-full" 
                                        style={{ width: `${(avgSessionQuality / 5) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                
                                {avgLearningProgress > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-600">Learning Progress</span>
                                      <span className="text-sm font-semibold text-gray-900">{avgLearningProgress.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full" 
                                        style={{ width: `${(avgLearningProgress / 5) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                
                                {avgProfessionalism > 0 && (
                      <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-600">Professionalism</span>
                                      <span className="text-sm font-semibold text-gray-900">{avgProfessionalism.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-indigo-600 h-2 rounded-full" 
                                        style={{ width: `${(avgProfessionalism / 5) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Recent Reviews Carousel */}
                              {(() => {
                                const validReviews = reviews.filter(r => r.comment && r.comment !== 'No comment');
                                if (validReviews.length === 0) return null;
                                
                                const currentReview = validReviews[currentReviewIndex];
                                const totalReviews = validReviews.length;
                                
                                return (
                                  <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-semibold text-gray-900">Recent Reviews</h4>
                                      <span className="text-xs text-gray-500">
                                        {currentReviewIndex + 1} / {totalReviews}
                                      </span>
                      </div>
                                    
                                    <div className="relative flex items-center gap-2">
                                      {/* Previous Button */}
                                      {totalReviews > 1 && (
                                        <button
                                          onClick={() => setCurrentReviewIndex((prev) => 
                                            prev === 0 ? totalReviews - 1 : prev - 1
                                          )}
                                          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                                          aria-label="Previous review"
                                        >
                                          <ChevronLeft className="w-5 h-5" />
                                        </button>
                                      )}
                                      
                                      {/* Review Card */}
                                      <div className="flex-1 bg-gray-50 p-4 rounded-lg min-h-[100px]">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                                                  i < Math.floor(currentReview.rating)
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                                            <span className="text-sm text-gray-600 font-medium">
                                            {currentReview.userFullName || currentReview.parentName || 'Anonymous'}
                                          </span>
                    </div>
                                        <p className="text-sm text-gray-600">{currentReview.comment}</p>
                  </div>
                                      
                                      {/* Next Button */}
                                      {totalReviews > 1 && (
                                        <button
                                          onClick={() => setCurrentReviewIndex((prev) => 
                                            prev === totalReviews - 1 ? 0 : prev + 1
                                          )}
                                          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                                          aria-label="Next review"
                                        >
                                          <ChevronRight className="w-5 h-5" />
                                        </button>
                                      )}
              </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No reviews yet</p>
                      </div>
                    )}
            </div>
          </div>
        )}
            </div>
          </div>
      </div>
    </div>
    </div>
  );
};

export default TutorDetail;

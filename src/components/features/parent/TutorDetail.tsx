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
  DollarSign,
  GraduationCap,
  Languages,
  Phone,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'availability'>('overview');

  useEffect(() => {
    // Mock data for demo
    setTutor({
      id: '1',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@mathbridge.com',
      phone: '+84 123 456 789',
      bio: 'Experienced mathematics tutor with over 8 years of teaching experience. Specialized in Advanced Mathematics, Calculus, and Algebra. Passionate about helping students achieve their academic goals.',
      experience: '8 years',
      rating: 4.8,
      totalReviews: 156,
      subjects: ['Mathematics', 'Advanced Calculus', 'Algebra', 'Statistics'],
      qualifications: [
        {
          title: 'PhD in Mathematics',
          institution: 'Stanford University',
          year: '2015'
        },
        {
          title: 'Master in Education',
          institution: 'Harvard University',
          year: '2012'
        },
        {
          title: 'Certified Math Teacher',
          institution: 'National Board',
          year: '2016'
        }
      ],
      languages: ['English', 'Vietnamese'],
      availability: [
        { day: 'Monday', timeSlots: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Tuesday', timeSlots: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Wednesday', timeSlots: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Thursday', timeSlots: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Friday', timeSlots: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Saturday', timeSlots: ['09:00-15:00'] }
      ],
      hourlyRate: 500000,
      centerName: 'MathBridge Center District 1',
      centerAddress: '123 Nguyen Hue, District 1, Ho Chi Minh City',
      verified: true
    });

    setReviews([
      {
        id: '1',
        parentName: 'Mrs. Nguyen',
        rating: 5,
        comment: 'Excellent tutor! My daughter improved significantly in mathematics. Very patient and knowledgeable.',
        date: '2024-01-10',
        subject: 'Advanced Mathematics'
      },
      {
        id: '2',
        parentName: 'Mr. Tran',
        rating: 5,
        comment: 'Dr. Johnson is amazing. She explains complex concepts in a simple way. Highly recommended!',
        date: '2024-01-05',
        subject: 'Calculus'
      },
      {
        id: '3',
        parentName: 'Mrs. Le',
        rating: 4,
        comment: 'Very good tutor. My son enjoys the lessons and has shown great progress.',
        date: '2023-12-28',
        subject: 'Algebra'
      }
    ]);

    setLoading(false);
  }, []);

  const handleBookSession = () => {
    navigate('/user/contracts/create', { 
      state: { 
        tutorId: tutor?.id, 
        tutorName: tutor?.name 
      } 
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tutor not found</h3>
          <p className="text-gray-600 mb-6">The tutor you're looking for doesn't exist</p>
          <button
            onClick={() => navigate('/tutors')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Tutors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/tutors')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Tutors</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tutor.name}</h1>
              <p className="text-gray-600 mt-2">
                {tutor.subjects.join(' • ')} • {tutor.experience} experience
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {tutor.verified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </span>
              )}
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-semibold">{tutor.rating}</span>
                <span className="text-gray-500">({tutor.totalReviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: User },
                { key: 'reviews', label: 'Reviews', icon: Star },
                { key: 'availability', label: 'Availability', icon: Calendar }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
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
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tutor.centerName}</p>
                      <p className="text-xs text-gray-600">{tutor.centerAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tutor.hourlyRate)}
                  </p>
                  <p className="text-sm text-gray-600">per hour</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleBookSession}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Book Session</span>
                </button>
                <button
                  onClick={handleContactTutor}
                  className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Contact Tutor</span>
                </button>
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
                    <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Availability</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tutor.availability.map((day, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{day.day}</h4>
                    <div className="space-y-1">
                      {day.timeSlots.map((slot, slotIndex) => (
                        <span
                          key={slotIndex}
                          className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded text-sm"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
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

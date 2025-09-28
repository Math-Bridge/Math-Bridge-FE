import React, { useEffect, useState } from 'react';
import { 
  Star, 
  Clock, 
  BookOpen, 
  Award, 
  Calendar, 
  MessageCircle,
  MapPin,
  Globe,
  CheckCircle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface TutorDetail {
  id: string;
  name: string;
  subjects: string[];
  experience: string;
  rating: number;
  totalReviews: number;
  bio: string;
  schedule: string;
  hourlyRate: number;
  location: string;
  languages: string[];
  education: string[];
  certifications: string[];
  specialties: string[];
  avatarUrl?: string;
  coverUrl?: string;
  isVerified: boolean;
  responseTime: string;
  completedSessions: number;
}

interface Review {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
  subject: string;
}

interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
}

const TutorDetail: React.FC<{ id: string }> = ({ id }) => {
  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setTutor({
        id,
        name: 'Dr. Sarah Johnson',
        subjects: ['Algebra', 'Geometry', 'Calculus', 'Statistics'],
        experience: '8 years',
        rating: 4.9,
        totalReviews: 127,
        bio: 'Passionate mathematics educator with over 8 years of experience helping students excel in various mathematical disciplines. I specialize in making complex concepts accessible and engaging through personalized teaching methods.',
        schedule: 'Mon-Fri: 2:00 PM - 8:00 PM, Sat: 10:00 AM - 4:00 PM',
        hourlyRate: 65,
        location: 'San Francisco, CA',
        languages: ['English', 'Spanish', 'French'],
        education: ['PhD in Mathematics - Stanford University', 'MS in Applied Mathematics - UC Berkeley'],
        certifications: ['Certified Math Teacher', 'Online Teaching Certificate'],
        specialties: ['Test Preparation', 'Advanced Calculus', 'Statistics for Data Science'],
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
        coverUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=300&fit=crop',
        isVerified: true,
        responseTime: '< 2 hours',
        completedSessions: 450
      });

      setReviews([
        {
          id: '1',
          studentName: 'Alex Chen',
          rating: 5,
          comment: 'Dr. Johnson is an exceptional tutor! She helped me understand calculus concepts that I struggled with for months. Her teaching style is clear and patient.',
          date: '2025-01-10',
          subject: 'Calculus'
        },
        {
          id: '2',
          studentName: 'Maria Rodriguez',
          rating: 5,
          comment: 'Amazing tutor! Very knowledgeable and makes learning fun. My grades improved significantly after working with her.',
          date: '2025-01-08',
          subject: 'Algebra'
        },
        {
          id: '3',
          studentName: 'David Kim',
          rating: 4,
          comment: 'Great experience overall. Dr. Johnson is very professional and well-prepared for each session.',
          date: '2025-01-05',
          subject: 'Statistics'
        }
      ]);

      // Generate available slots for the next 7 days
      const slots: AvailableSlot[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].forEach(time => {
          slots.push({
            date: dateStr,
            time,
            available: Math.random() > 0.3 // Random availability
          });
        });
      }
      setAvailableSlots(slots);
      
      setLoading(false);
    }, 1000);
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBookSession = () => {
    if (selectedSlot) {
      setShowBookingModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutor profile...</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tutor Not Found</h2>
          <p className="text-gray-600">The tutor you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
        {tutor.coverUrl && (
          <img
            src={tutor.coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-32 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative">
                  <img
                    src={tutor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&size=150`}
                    alt={tutor.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  {tutor.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{tutor.name}</h1>
                  <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(tutor.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">{tutor.rating}</span>
                    <span className="text-gray-500">({tutor.totalReviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {tutor.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {tutor.responseTime} response
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats and Actions */}
              <div className="flex-1 mt-8 lg:mt-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{tutor.completedSessions}</div>
                    <div className="text-sm text-gray-600">Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{tutor.experience}</div>
                    <div className="text-sm text-gray-600">Experience</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{tutor.subjects.length}</div>
                    <div className="text-sm text-gray-600">Subjects</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">${tutor.hourlyRate}</div>
                    <div className="text-sm text-gray-600">Per Hour</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Book Session</span>
                  </button>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                      isFavorite
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                    <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
                  </button>
                  <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                    <Share2 className="h-5 w-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed mb-6">{tutor.bio}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Subjects</h3>
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
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {tutor.languages.map((language, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Education & Certifications */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Education & Certifications</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    Education
                  </h3>
                  <ul className="space-y-2">
                    {tutor.education.map((edu, index) => (
                      <li key={index} className="text-gray-700 flex items-start">
                        <ChevronRight className="h-4 w-4 mt-0.5 mr-2 text-gray-400" />
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Certifications
                  </h3>
                  <ul className="space-y-2">
                    {tutor.certifications.map((cert, index) => (
                      <li key={index} className="text-gray-700 flex items-start">
                        <ChevronRight className="h-4 w-4 mt-0.5 mr-2 text-gray-400" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Student Reviews</h2>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">{tutor.rating}</span>
                  <span className="text-gray-500">({tutor.totalReviews} reviews)</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {review.studentName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.studentName}</h4>
                          <p className="text-sm text-gray-500">{review.subject} • {formatDate(review.date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900">${tutor.hourlyRate}</div>
                <div className="text-gray-500">per hour</div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Response time:</span>
                  <span className="font-medium text-gray-900">{tutor.responseTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sessions completed:</span>
                  <span className="font-medium text-gray-900">{tutor.completedSessions}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Calendar className="h-5 w-5" />
                <span>Book a Session</span>
              </button>
              
              <button className="w-full mt-3 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Send Message</span>
              </button>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Availability</h3>
              <p className="text-sm text-gray-600 mb-4">{tutor.schedule}</p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm">Next Available Slots</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableSlots.filter(slot => slot.available).slice(0, 6).map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSlot === slot
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{formatDate(slot.date)}</div>
                      <div className="text-sm text-gray-500">{slot.time}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Book a Session</h3>
            <p className="text-gray-600 mb-6">
              You're about to book a session with {tutor.name} for ${tutor.hourlyRate}/hour.
            </p>
            
            {selectedSlot && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="font-semibold text-blue-900">Selected Time</div>
                <div className="text-blue-700">{formatDate(selectedSlot.date)} at {selectedSlot.time}</div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle booking logic here
                  setShowBookingModal(false);
                  alert('Session booked successfully!');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorDetail;
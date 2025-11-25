import React, { useEffect, useState } from 'react';
import { 
  Star, 
  Clock, 
  Award, 
  MessageSquare,
  MapPin,
  CheckCircle,
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


const TutorDetail: React.FC<{ id: string }> = ({ id }) => {
  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    // TODO: Gọi API thật để lấy thông tin tutor ở đây. Nếu thất bại thì setTutor(null)
    // Ví dụ:
    /*
    getTutorById(id).then(result => {
      if(result.success && result.data){
        setTutor(result.data);  // Chuyển đổi nếu cần
      } else {
        setTutor(null);
      }
    }).catch(() => setTutor(null)).finally(() => setLoading(false));
    */
    setLoading(false); // Xóa đoạn mock bên dưới, chỉ để loading kết thúc nếu không gọi được API
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
            {/* Scheduling Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-8">
              
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
              
            </div>

            {/* Schedule Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Schedule</h3>
              <p className="text-sm text-gray-600 mb-4">{tutor.schedule}</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Specific session times will be arranged by our staff team based on your availability and the tutor's schedule.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TutorDetail;
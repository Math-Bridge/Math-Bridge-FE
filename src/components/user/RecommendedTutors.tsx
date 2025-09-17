import React from 'react';
import { Star, Clock, DollarSign, BookOpen, MessageCircle } from 'lucide-react';

const RecommendedTutors: React.FC = () => {
  const tutors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      avatar: '👩‍🏫',
      subjects: ['Algebra', 'Calculus', 'Statistics'],
      rating: 4.9,
      reviews: 127,
      hourlyRate: 45,
      experience: '8 years',
      availability: 'Available now',
      bio: 'PhD in Mathematics with expertise in helping students master complex concepts.',
      badges: ['Top Rated', 'Quick Response']
    },
    {
      id: 2,
      name: 'Prof. Michael Chen',
      avatar: '👨‍🏫',
      subjects: ['Calculus', 'Linear Algebra', 'Differential Equations'],
      rating: 4.8,
      reviews: 89,
      hourlyRate: 50,
      experience: '12 years',
      availability: 'Available today',
      bio: 'University professor specializing in advanced mathematics and problem-solving.',
      badges: ['Expert', 'Patient Teacher']
    },
    {
      id: 3,
      name: 'Ms. Emily Davis',
      avatar: '👩‍💼',
      subjects: ['Statistics', 'Probability', 'Data Analysis'],
      rating: 4.7,
      reviews: 156,
      hourlyRate: 40,
      experience: '6 years',
      availability: 'Available tomorrow',
      bio: 'Data scientist turned tutor, making statistics fun and understandable.',
      badges: ['Friendly', 'Real-world Examples']
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 animate-fade-in">
          Recommended Tutors
        </h2>
        <button className="text-blue-600 hover:text-blue-700 font-medium">
          View All Tutors →
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutors.map((tutor, index) => (
          <div
            key={tutor.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover-lift animate-scale-in stagger-${index + 1}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{tutor.avatar}</div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{tutor.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{tutor.rating}</span>
                    <span>({tutor.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ${tutor.hourlyRate}
                  <span className="text-sm font-normal text-gray-600">/hr</span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tutor.badges.map((badge, badgeIndex) => (
                <span
                  key={badgeIndex}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Subjects */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Subjects</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {tutor.subjects.map((subject, subjectIndex) => (
                  <span
                    key={subjectIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {tutor.bio}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {tutor.experience}
              </div>
              <div className="text-green-600 font-medium">
                {tutor.availability}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Book Session
              </button>
              <button className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedTutors;
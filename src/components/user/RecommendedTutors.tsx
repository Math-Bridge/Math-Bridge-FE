import React, { useState, useEffect } from 'react';
import { Star, Users, BookOpen, ArrowRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface Tutor {
  id: string;
  name: string;
  avatar_url: string | null;
  specialty: string;
  total_students: number;
  rating: number;
  total_sessions: number;
}

const RecommendedTutors: React.FC = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockTutors: Tutor[] = [
          {
            id: '1',
            name: 'Dr. John Smith',
            avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
            specialty: 'Advanced Mathematics',
            total_students: 156,
            rating: 4.9,
            total_sessions: 342
          },
          {
            id: '2',
            name: 'Prof. Sarah Johnson',
            avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
            specialty: 'Linear Algebra',
            total_students: 203,
            rating: 4.8,
            total_sessions: 487
          },
          {
            id: '3',
            name: 'Dr. Michael Chen',
            avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
            specialty: 'Calculus',
            total_students: 189,
            rating: 4.9,
            total_sessions: 421
          }
        ];

        setTutors(mockTutors);
      } catch (error) {
        console.error('Error fetching tutors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutors();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading recommended tutors..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Users className="h-6 w-6 text-blue-500 mr-2" />
          Recommended Tutors
        </h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tutors.map((tutor) => (
          <div
            key={tutor.id}
            className="border border-gray-200 rounded-lg p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
          >
            <div className="flex flex-col items-center text-center mb-4">
              <img
                src={tutor.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
                alt={tutor.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 mb-3"
              />
              <h3 className="font-semibold text-lg text-gray-900">{tutor.name}</h3>
              <p className="text-sm text-blue-600 font-medium">{tutor.specialty}</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <Star className="h-4 w-4 text-amber-400 mr-1 fill-current" />
                  Rating
                </span>
                <span className="font-semibold text-gray-900">{tutor.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <Users className="h-4 w-4 text-blue-500 mr-1" />
                  Students
                </span>
                <span className="font-semibold text-gray-900">{tutor.total_students}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <BookOpen className="h-4 w-4 text-green-500 mr-1" />
                  Sessions
                </span>
                <span className="font-semibold text-gray-900">{tutor.total_sessions}</span>
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
              View Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedTutors;

import React, { useState, useEffect } from 'react';
import { Award, Trophy, Target, Star, Lightbulb, GraduationCap } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface Achievement {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  date_earned: string;
}

interface Tutor {
  id: string;
  name: string;
  avatar_url: string | null;
  specialty: string;
  total_students: number;
  rating: number;
  total_sessions: number;
}

interface TutorWithAchievements extends Tutor {
  achievements: Achievement[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  award: Award,
  trophy: Trophy,
  target: Target,
  star: Star,
  lightbulb: Lightbulb,
  'graduation-cap': GraduationCap,
};

const TutorAchievements: React.FC = () => {
  const [tutors, setTutors] = useState<TutorWithAchievements[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const mockTutorsData: Tutor[] = [
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
          }
        ];

        const mockAchievementsData: Achievement[] = [
          {
            id: '1',
            tutor_id: '1',
            title: 'Outstanding Educator 2024',
            description: 'Awarded the Outstanding Educator title for 2024',
            icon: 'award',
            date_earned: '2024-06-15T08:00:00Z'
          },
          {
            id: '2',
            tutor_id: '1',
            title: '100 Successful Students',
            description: 'Helped over 100 students achieve excellent results',
            icon: 'trophy',
            date_earned: '2024-05-20T08:00:00Z'
          },
          {
            id: '3',
            tutor_id: '2',
            title: 'Algebra Expert',
            description: 'Recognized as an expert in Linear Algebra field',
            icon: 'star',
            date_earned: '2024-04-10T08:00:00Z'
          },
          {
            id: '4',
            tutor_id: '2',
            title: 'Innovative Methods',
            description: 'Developed creative and effective teaching methods',
            icon: 'lightbulb',
            date_earned: '2024-03-15T08:00:00Z'
          }
        ];

        const tutorsWithAchievements = mockTutorsData.map(tutor => ({
          ...tutor,
          achievements: mockAchievementsData.filter(a => a.tutor_id === tutor.id)
        }));

        setTutors(tutorsWithAchievements);
      } catch (error) {
        console.error('Error fetching tutor achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading tutor achievements..." />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Trophy className="h-6 w-6 text-amber-500 mr-2" />
          Tutor Achievements
        </h2>
      </div>

      <div className="space-y-6">
        {tutors.map((tutor) => (
          <div
            key={tutor.id}
            className="border-b border-gray-100 last:border-0 pb-6 last:pb-0 hover:bg-gray-50 -mx-6 px-6 py-4 rounded-lg transition-all duration-200"
          >
            <div className="flex items-start space-x-4 mb-4">
              <img
                src={tutor.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'}
                alt={tutor.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{tutor.name}</h3>
                <p className="text-sm text-gray-600">{tutor.specialty}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="flex items-center text-gray-700">
                    <Star className="h-4 w-4 text-amber-400 mr-1 fill-current" />
                    {tutor.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    {tutor.total_students} students
                  </span>
                  <span className="text-gray-500">
                    {tutor.total_sessions} sessions
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {tutor.achievements.map((achievement) => {
                const IconComponent = iconMap[achievement.icon || 'award'] || Award;
                return (
                  <div
                    key={achievement.id}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-600 rounded-lg p-2">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {achievement.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-blue-700 font-medium mt-2">
                          {new Date(achievement.date_earned).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorAchievements;

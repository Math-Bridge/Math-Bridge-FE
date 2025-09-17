import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  BookOpen, 
  Calendar, 
  Star, 
  TrendingUp,
  Clock,
  Award,
  Users,
  Target,
  ChevronRight,
  Play,
  Search,
  Filter
} from 'lucide-react';
import UserStats from './UserStats';
import RecommendedTutors from './RecommendedTutors';
import UpcomingSessions from './UpcomingSessions';

const UserHome: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    {
      title: 'Find Tutors',
      description: 'Browse available math tutors',
      icon: Search,
      color: 'blue',
      href: '/tutors'
    },
    {
      title: 'My Sessions',
      description: 'View upcoming sessions',
      icon: Calendar,
      color: 'green',
      href: '/sessions'
    },
    {
      title: 'Practice Problems',
      description: 'Solve math problems',
      icon: Target,
      color: 'purple',
      href: '/practice'
    },
    {
      title: 'My Progress',
      description: 'Track your learning',
      icon: TrendingUp,
      color: 'orange',
      href: '/progress'
    }
  ];

  const recentAchievements = [
    {
      title: 'First Session Complete',
      description: 'Completed your first tutoring session',
      icon: Award,
      date: '2 days ago',
      color: 'yellow'
    },
    {
      title: 'Problem Solver',
      description: 'Solved 10 algebra problems',
      icon: Target,
      date: '1 week ago',
      color: 'green'
    },
    {
      title: 'Consistent Learner',
      description: '7 days learning streak',
      icon: TrendingUp,
      date: '3 days ago',
      color: 'blue'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <h1 className="text-4xl font-bold mb-2">
                {getGreeting()}, {user?.name || 'Student'}! 👋
              </h1>
              <p className="text-xl text-blue-100 mb-4">
                Ready to solve some equations today? • f(learning) = success
              </p>
              <div className="flex items-center space-x-4 text-blue-100">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{currentTime.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block animate-float">
              <div className="text-8xl opacity-20">∫</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 animate-fade-in">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={action.title}
                className={`p-6 rounded-xl border-2 transition-all duration-200 hover-lift animate-scale-in stagger-${index + 1} ${getColorClasses(action.color)}`}
              >
                <action.icon className="h-8 w-8 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                <p className="text-sm opacity-80 mb-4">{action.description}</p>
                <div className="flex items-center text-sm font-medium">
                  <span>Get Started</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <UserStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upcoming Sessions */}
          <UpcomingSessions />

          {/* Recent Achievements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover-lift animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Award className="h-6 w-6 text-yellow-500 mr-2" />
                Recent Achievements
              </h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {recentAchievements.map((achievement, index) => (
                <div key={index} className={`p-4 rounded-lg border animate-fade-in stagger-${index + 1} ${getColorClasses(achievement.color)}`}>
                  <div className="flex items-start space-x-3">
                    <achievement.icon className="h-6 w-6 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium">{achievement.title}</h3>
                      <p className="text-sm opacity-80">{achievement.description}</p>
                      <p className="text-xs opacity-60 mt-1">{achievement.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Tutors */}
        <RecommendedTutors />

        {/* Learning Resources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover-lift animate-slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-6 w-6 text-blue-500 mr-2" />
              Learning Resources
            </h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Browse All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg hover-lift">
              <div className="flex items-center space-x-3 mb-3">
                <Play className="h-6 w-6 text-blue-600" />
                <h3 className="font-medium text-blue-900">Video Lessons</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Watch interactive math video tutorials
              </p>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                Start Watching →
              </button>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg hover-lift">
              <div className="flex items-center space-x-3 mb-3">
                <Target className="h-6 w-6 text-green-600" />
                <h3 className="font-medium text-green-900">Practice Tests</h3>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Test your knowledge with practice problems
              </p>
              <button className="text-green-600 text-sm font-medium hover:text-green-700">
                Take Test →
              </button>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg hover-lift">
              <div className="flex items-center space-x-3 mb-3">
                <Users className="h-6 w-6 text-purple-600" />
                <h3 className="font-medium text-purple-900">Study Groups</h3>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Join study groups with other students
              </p>
              <button className="text-purple-600 text-sm font-medium hover:text-purple-700">
                Join Group →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHome;
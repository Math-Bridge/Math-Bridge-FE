import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../hooks/useTranslation';
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  Target,
  ChevronRight,
  Star,
  Wallet,
  FileText,
  Plus,
  BarChart3,
  MessageCircle,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ParentHome: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const quickActions = [
    {
      title: t('myChildren'),
      description: t('manageProfiles'),
      icon: Users,
      color: 'blue',
      onClick: () => navigate('/user-profile')
    },
    {
      title: t('viewCourses'),
      description: t('browseCourses'),
      icon: BookOpen,
      color: 'green',
      onClick: () => navigate('/courses')
    },
    {
      title: t('createContract'),
      description: t('bookSessions'),
      icon: FileText,
      color: 'purple',
      onClick: () => navigate('/contracts/create')
    },
    {
      title: t('viewProgress'),
      description: t('trackProgress'),
      icon: TrendingUp,
      color: 'orange',
      onClick: () => navigate('/progress')
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

  const recentActivities = [
    {
      id: '1',
      type: 'session',
      title: 'Math Session with Sarah',
      description: 'Algebra fundamentals - Grade 8',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      id: '2',
      type: 'contract',
      title: 'New Contract Created',
      description: 'Advanced Calculus package with Dr. Johnson',
      time: '1 day ago',
      status: 'pending'
    },
    {
      id: '3',
      type: 'payment',
      title: 'Wallet Deposit',
      description: 'Added 2,000,000 VND to wallet',
      time: '2 days ago',
      status: 'completed'
    }
  ];

  const upcomingSessions = [
    {
      id: '1',
      childName: 'Emma Johnson',
      subject: 'Algebra',
      tutorName: 'Dr. Sarah Wilson',
      date: 'Tomorrow, 2:00 PM',
      duration: '1 hour'
    },
    {
      id: '2',
      childName: 'Michael Johnson',
      subject: 'Geometry',
      tutorName: 'Prof. David Lee',
      date: 'Friday, 4:00 PM',
      duration: '1.5 hours'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {getGreeting()}, {user?.name || 'Parent'}!
              </h1>
              <p className="text-xl text-blue-100 mb-4">
                Ready to support your children's learning journey?
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
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm">Wallet Balance</span>
                </div>
                <div className="text-2xl font-bold">2,500,000 VND</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${getColorClasses(action.color)}`}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Bell className="h-6 w-6 text-blue-500 mr-2" />
                  Recent Activities
                </h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'session' ? 'bg-blue-100' :
                      activity.type === 'contract' ? 'bg-purple-100' :
                      'bg-green-100'
                    }`}>
                      {activity.type === 'session' && <BookOpen className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'contract' && <FileText className="w-4 h-4 text-purple-600" />}
                      {activity.type === 'payment' && <Wallet className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <div className="flex items-center mt-1">
                        <Clock className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-6 w-6 text-green-500 mr-2" />
                Upcoming Sessions
              </h2>

              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{session.childName}</h3>
                      <span className="text-xs text-green-600 font-medium">{session.duration}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{session.subject}</p>
                    <p className="text-sm text-gray-500 mb-2">with {session.tutorName}</p>
                    <p className="text-sm font-medium text-green-700">{session.date}</p>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                View All Sessions
              </button>
            </div>
          </div>
        </div>

        {/* Popular Courses Section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-6 w-6 text-purple-500 mr-2" />
                Popular Courses
              </h2>
              <button 
                onClick={() => navigate('/courses')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View All Courses
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: '1',
                  title: 'Advanced Algebra',
                  description: 'Master complex algebraic concepts',
                  rating: 4.9,
                  students: 1250,
                  price: 500000,
                  duration: '8 weeks',
                  level: 'Advanced'
                },
                {
                  id: '2',
                  title: 'Geometry Fundamentals',
                  description: 'Learn geometric principles and proofs',
                  rating: 4.8,
                  students: 980,
                  price: 450000,
                  duration: '6 weeks',
                  level: 'Intermediate'
                },
                {
                  id: '3',
                  title: 'Calculus for Beginners',
                  description: 'Introduction to calculus concepts',
                  rating: 4.7,
                  students: 2100,
                  price: 600000,
                  duration: '10 weeks',
                  level: 'Beginner'
                }
              ].map((course) => (
                <div key={course.id} className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      {course.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">{course.students} students</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-purple-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">{course.duration}</span>
                    </div>
                    <button className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
                      Enroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Rated Tutors & Achievements Section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2" />
                Top Rated Tutors & Achievements
              </h2>
              <button 
                onClick={() => navigate('/tutors')}
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                View All Tutors
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: '1',
                  name: 'Dr. Sarah Wilson',
                  specialty: 'Advanced Mathematics',
                  rating: 4.9,
                  students: 156,
                  experience: '8 years',
                  avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
                  achievements: [
                    {
                      title: 'Outstanding Educator 2024',
                      description: 'Awarded for exceptional teaching methods and student success rates',
                      date: 'June 15, 2024',
                      icon: 'award'
                    },
                    {
                      title: 'Student Success Award',
                      description: '95% of students improved their grades by at least one letter',
                      date: 'March 15, 2024',
                      icon: 'star'
                    }
                  ]
                },
                {
                  id: '2',
                  name: 'Prof. David Lee',
                  specialty: 'Geometry & Trigonometry',
                  rating: 4.8,
                  students: 203,
                  experience: '12 years',
                  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
                  achievements: [
                    {
                      title: '100 Successful Students',
                      description: 'Helped over 100 students achieve excellent results in mathematics',
                      date: 'May 20, 2024',
                      icon: 'trophy'
                    },
                    {
                      title: 'Innovative Methods',
                      description: 'Developed creative and effective teaching methods for geometry',
                      date: 'April 10, 2024',
                      icon: 'lightbulb'
                    }
                  ]
                },
                {
                  id: '3',
                  name: 'Dr. Maria Garcia',
                  specialty: 'Calculus & Statistics',
                  rating: 4.9,
                  students: 189,
                  experience: '10 years',
                  avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
                  achievements: [
                    {
                      title: 'Research Excellence',
                      description: 'Published groundbreaking research in calculus education',
                      date: 'July 5, 2024',
                      icon: 'award'
                    },
                    {
                      title: 'Innovative Methods',
                      description: 'Developed creative and effective teaching methods for calculus',
                      date: 'April 10, 2024',
                      icon: 'lightbulb'
                    }
                  ]
                }
              ].map((tutor) => (
                <div key={tutor.id} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={tutor.avatar}
                      alt={tutor.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{tutor.name}</h3>
                      <p className="text-sm text-gray-600">{tutor.specialty}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{tutor.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">{tutor.students} students</span>
                    <span className="text-sm text-gray-500">{tutor.experience}</span>
                  </div>
                  
                  {/* Achievements Section */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Target className="h-4 w-4 text-green-600 mr-1" />
                      Recent Achievements
                    </h4>
                    <div className="space-y-2">
                      {tutor.achievements.map((achievement, index) => (
                        <div key={index} className="p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                          <div className="flex items-start space-x-2">
                            <div className="bg-green-600 rounded p-1">
                              {achievement.icon === 'award' && <Target className="h-3 w-3 text-white" />}
                              {achievement.icon === 'trophy' && <Star className="h-3 w-3 text-white" />}
                              {achievement.icon === 'lightbulb' && <TrendingUp className="h-3 w-3 text-white" />}
                              {achievement.icon === 'star' && <Star className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-xs mb-1">{achievement.title}</h5>
                              <p className="text-xs text-gray-600 mb-1">{achievement.description}</p>
                              <span className="text-xs text-gray-500">{achievement.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/tutors/${tutor.id}`)}
                    className="w-full px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Resources */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              <div className="p-4 bg-blue-50 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <h3 className="font-medium text-blue-900">View Courses</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Browse available courses for your children
                </p>
                <button 
                  onClick={() => navigate('/courses')}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  View Courses →
                </button>
              </div>

              <div className="p-4 bg-green-50 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  <h3 className="font-medium text-green-900">Progress Reports</h3>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Track your children's learning progress
                </p>
                <button 
                  onClick={() => navigate('/progress')}
                  className="text-green-600 text-sm font-medium hover:text-green-700"
                >
                  View Reports →
                </button>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                  <h3 className="font-medium text-purple-900">Support</h3>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Get help and support for your learning journey
                </p>
                <button className="text-purple-600 text-sm font-medium hover:text-purple-700">
                  Contact Support →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentHome;

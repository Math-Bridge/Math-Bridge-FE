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
  BarChart3,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  apiService, 
  getContractsByParent,
  getTopRatedTutors,
  Tutor,
  TutorAchievement
} from '../../../services/api';
import ScheduleCalendarWidget from './ScheduleCalendarWidget';

interface UpcomingSession {
  id: string;
  childName: string;
  subject: string;
  tutorName: string;
  date: string;
  duration: string;
}


interface PopularPackage {
  id: string;
  title: string;
  description: string;
  rating: number;
  students: number;
  price: number;
  duration: string;
  level: string;
}

const ParentHome: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // API Data States
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [popularPackages, setPopularPackages] = useState<PopularPackage[]>([]);
  const [topRatedTutors, setTopRatedTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch data from API
  useEffect(() => {
    if (user?.id) {
      fetchHomeData();
    }
  }, [user?.id]);

  const fetchHomeData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Fetch wallet balance
      const walletResponse = await apiService.getUserWallet(user.id);
      if (walletResponse.success && walletResponse.data) {
        setWalletBalance(walletResponse.data.walletBalance || 0);
      }

      // Fetch top rated tutors
      const tutorsResponse = await getTopRatedTutors(3);
      if (tutorsResponse.success && tutorsResponse.data) {
        setTopRatedTutors(tutorsResponse.data);
      } else {
        console.error('Failed to fetch top rated tutors:', tutorsResponse.error);
        setTopRatedTutors([]);
      }

      // Fetch contracts to create upcoming sessions and recent activities
      const contractsResponse = await getContractsByParent(user.id);
      if (contractsResponse.success && contractsResponse.data) {
        const contracts = contractsResponse.data;
        
        // Create upcoming sessions from active contracts
        const sessions: UpcomingSession[] = [];
        contracts
          .filter((c: any) => {
            const status = (c.Status || c.status || '').toLowerCase();
            return status === 'active' || status === 'pending';
          })
          .slice(0, 5) // Limit to 5 upcoming sessions
          .forEach((contract: any) => {
            const startDate = contract.StartDate || contract.startDate;
            const childName = contract.ChildName || contract.childName || 'N/A';
            const tutorName = contract.MainTutorName || contract.mainTutorName || 'Will be assigned';
            const packageName = contract.PackageName || contract.packageName || 'Package';
            
            // Create a simple upcoming session entry
            if (startDate) {
              const start = new Date(startDate);
              const now = new Date();
              if (start >= now) {
                sessions.push({
                  id: contract.ContractId || contract.contractId || contract.id || '',
                  childName: childName,
                  subject: packageName,
                  tutorName: tutorName,
                  date: start.toLocaleDateString('vi-VN', { weekday: 'long', month: 'long', day: 'numeric' }),
                  duration: '1 hour'
                });
              }
            }
          });
        setUpcomingSessions(sessions);
      }

      // Fetch packages for popular packages section
      const packagesResponse = await apiService.getAllPackages();
      if (packagesResponse.success && packagesResponse.data) {
        const packages = packagesResponse.data;
        const mappedPackages: PopularPackage[] = packages
          .slice(0, 3) // Limit to 3 popular packages
          .map((pkg: any) => {
            const price = pkg.Price || pkg.price || 0;
            const sessionCount = pkg.SessionCount || pkg.sessionCount || 0;
            const weeksNeeded = Math.ceil(sessionCount / 3); // 3 sessions per week
            
            return {
              id: pkg.PackageId || pkg.packageId || pkg.id || '',
              title: pkg.PackageName || pkg.packageName || pkg.name || 'Package',
              description: pkg.Description || pkg.description || 'Comprehensive math tutoring',
              rating: 4.8, // Default rating (backend may not have this)
              students: 100, // Default students (backend may not have this)
              price: price,
              duration: `${weeksNeeded} weeks`,
              level: 'Intermediate' // Default level
            };
          });
        setPopularPackages(mappedPackages);
      }

    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
      title: t('viewPackages'),
      description: t('browsePackages'),
      icon: BookOpen,
      color: 'green',
      onClick: () => navigate('/packages')
    },
    {
      title: 'Study Schedule',
      description: 'View your child\'s study schedule',
      icon: Calendar,
      color: 'orange',
      onClick: () => navigate('/parent/schedule')
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
      color: 'yellow',
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
                <div className="text-2xl font-bold">
                  {walletBalance !== null 
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletBalance)
                    : isLoading 
                      ? 'Loading...' 
                      : '0 VND'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="mb-8 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

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

          {/* Schedule Calendar */}
        <div className="w-full">
            <ScheduleCalendarWidget compact={false} />
        </div>

        {/* Popular Packages Section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-6 w-6 text-purple-500 mr-2" />
                Popular Packages
              </h2>
              <button 
                onClick={() => navigate('/packages')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View All Packages
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularPackages.length === 0 && !isLoading ? (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No packages available</p>
                </div>
              ) : (
                popularPackages.map((pkg) => (
                <div key={pkg.id} className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{pkg.title}</h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      {pkg.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{pkg.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">{pkg.students} students</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-purple-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">{pkg.duration}</span>
                  </div>
                </div>
                ))
              )}
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
              {topRatedTutors.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No tutors available at the moment.</p>
                </div>
              ) : (
                topRatedTutors.map((tutor) => {
                  // Get specialty from specialties array or major/university
                  const specialty = tutor.specialties && tutor.specialties.length > 0 
                    ? tutor.specialties.join(', ') 
                    : tutor.major || tutor.university || 'Math Tutor';
                  
                  // Format experience
                  const experience = tutor.yearsOfExperience 
                    ? `${tutor.yearsOfExperience} ${tutor.yearsOfExperience === 1 ? 'year' : 'years'}`
                    : 'Experience not specified';
                  
                  // Default avatar if not provided
                  const avatarUrl = tutor.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(tutor.fullName) + '&background=random';
                  
                  // Get achievements or use empty array
                  const achievements = tutor.achievements || [];
                  
                  // Helper function to get icon based on achievement type
                  const getAchievementIcon = (type?: string) => {
                    if (!type) return <Target className="h-3 w-3 text-white" />;
                    switch (type.toLowerCase()) {
                      case 'outstanding_educator':
                      case 'research_excellence':
                        return <Target className="h-3 w-3 text-white" />;
                      case 'successful_students':
                      case 'student_success':
                        return <Star className="h-3 w-3 text-white" />;
                      case 'innovative_methods':
                        return <TrendingUp className="h-3 w-3 text-white" />;
                      default:
                        return <Target className="h-3 w-3 text-white" />;
                    }
                  };
                  
                  // Format date
                  const formatDate = (dateStr: string) => {
                    try {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    } catch {
                      return dateStr;
                    }
                  };
                  
                  return (
                    <div key={tutor.userId} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <img
                          src={avatarUrl}
                          alt={tutor.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200"
                          onError={(e) => {
                            // Fallback to default avatar if image fails to load
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(tutor.fullName) + '&background=random';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{tutor.fullName}</h3>
                          <p className="text-sm text-gray-600">{specialty}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        {tutor.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{tutor.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {tutor.studentCount && (
                          <span className="text-sm text-gray-500">{tutor.studentCount} students</span>
                        )}
                        <span className="text-sm text-gray-500">{experience}</span>
                      </div>
                      
                      {/* Achievements Section */}
                      {achievements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Target className="h-4 w-4 text-green-600 mr-1" />
                            Recent Achievements
                          </h4>
                          <div className="space-y-2">
                            {achievements.slice(0, 2).map((achievement, index) => (
                              <div key={index} className="p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                                <div className="flex items-start space-x-2">
                                  <div className="bg-green-600 rounded p-1">
                                    {getAchievementIcon(achievement.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-900 text-xs mb-1">{achievement.title}</h5>
                                    <p className="text-xs text-gray-600 mb-1">{achievement.description}</p>
                                    <span className="text-xs text-gray-500">{formatDate(achievement.date)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => navigate(`/tutors/${tutor.userId}`)}
                        className="w-full px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  );
                })
              )}
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
                  <h3 className="font-medium text-blue-900">View Packages</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Browse available packages for your children
                </p>
                <button 
                  onClick={() => navigate('/packages')}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  View Packages →
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

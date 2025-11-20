import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../hooks/useTranslation';
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
  Star,
  Wallet,
  FileText,
  BarChart3,
  MessageCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  apiService,
  getContractsByParent,
  getTopRatedTutors,
  TopRatedTutorsListDto,
  TopRatedTutorDto
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

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [popularPackages, setPopularPackages] = useState<PopularPackage[]>([]);
  const [topRatedTutors, setTopRatedTutors] = useState<TopRatedTutorDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id) fetchHomeData();
  }, [user?.id]);

  const fetchHomeData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const walletResponse = await apiService.getUserWallet(user.id);
      if (walletResponse.success && walletResponse.data?.walletBalance != null) {
        setWalletBalance(walletResponse.data.walletBalance);
      }

      const tutorsResponse = await getTopRatedTutors(3);
      if (tutorsResponse.success && tutorsResponse.data?.tutors) {
        setTopRatedTutors(tutorsResponse.data.tutors);
      } else {
        setTopRatedTutors([]);
      }

      const contractsResponse = await getContractsByParent(user.id);
      if (contractsResponse.success && contractsResponse.data) {
        const contracts = contractsResponse.data;
        const sessions: UpcomingSession[] = [];
        contracts
          .filter((c: any) => ['active', 'pending'].includes((c.Status || c.status || '').toLowerCase()))
          .slice(0, 5)
          .forEach((contract: any) => {
            const startDate = contract.StartDate || contract.startDate;
            if (startDate && new Date(startDate) >= new Date()) {
              sessions.push({
                id: contract.ContractId || contract.id || '',
                childName: contract.ChildName || 'N/A',
                subject: contract.PackageName || 'Package',
                tutorName: contract.MainTutorName || 'Will be assigned',
                date: new Date(startDate).toLocaleDateString('vi-VN', { weekday: 'long', month: 'long', day: 'numeric' }),
                duration: '1 hour'
              });
            }
          });
        setUpcomingSessions(sessions);
      }

      const packagesResponse = await apiService.getAllPackages();
      if (packagesResponse.success && packagesResponse.data) {
        const mappedPackages: PopularPackage[] = packagesResponse.data
          .slice(0, 3)
          .map((pkg: any) => {
            const sessionCount = pkg.SessionCount || pkg.sessionCount || pkg.totalSessions || pkg.sessions || 0;
            const weeks = sessionCount > 0 ? Math.ceil(sessionCount / 3) : 4;

            return {
              id: pkg.PackageId || pkg.packageId || pkg.id || '',
              title: pkg.PackageName || pkg.packageName || pkg.name || 'Package',
              description: pkg.Description || pkg.description || 'Comprehensive tutoring package',
              price: pkg.Price || pkg.price || 0,
              duration: `${weeks} week${weeks > 1 ? 's' : ''}`,
              level: pkg.level || pkg.difficulty || 'Intermediate'
            };
          });
        setPopularPackages(mappedPackages);
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setIsLoading(false);
      setTimeout(() => setShowConfetti(true), 800);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const quickActions = [
    { title: t('myChildren'), description: t('manageProfiles'), icon: Users, color: 'blue', onClick: () => navigate('/my-children') },
    { title: t('viewPackages'), description: t('browsePackages'), icon: BookOpen, color: 'green', onClick: () => navigate('/packages') },
    { title: 'Study Schedule', description: 'View your child\'s study schedule', icon: Calendar, color: 'orange', onClick: () => navigate('/parent/schedule') },
    { title: t('createContract'), description: t('bookSessions'), icon: FileText, color: 'purple', onClick: () => navigate('/contracts/create') },
    { title: t('viewProgress'), description: t('trackProgress'), icon: TrendingUp, color: 'yellow', onClick: () => navigate('/daily-reports') }
  ];

  const getColorClasses = (color: string) => {
    const map = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
    };
    return map[color as keyof typeof map] || map.blue;
  };

  return (
    <>
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-100/20 via-transparent to-amber-100/20 animate-gradient-reverse" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-purple-300/10 text-6xl font-black select-none animate-float"
              style={{
                left: `${10 + (i * 65) % 85}%`,
                top: `${15 + (i * 50) % 80}%`,
                animationDelay: `${i * 2}s`,
              }}
            >
              {i % 5 === 0 ? 'π' : i % 4 === 0 ? '∑' : i % 3 === 0 ? '∞' : '∫'}
            </div>
          ))}
        </div>
      </div>

      {/* Confetti */}
      {showConfetti && !isLoading && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                backgroundColor: i % 3 === 0 ? '#8b5cf6' : i % 2 === 0 ? '#ec4899' : '#3b82f6',
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="min-h-screen py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Hero + Wallet */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 mb-10 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-700 p-8 text-white">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{getGreeting()}, {user?.name?.split(' ')[0] || 'Parent'}!</h1>
                  <p className="text-lg opacity-95">Ready to support your child's learning journey?</p>
                  <div className="flex items-center gap-6 mt-4 text-white/80">
                    <div className="flex items-center gap-2"><Clock className="h-5 w-5" /> {currentTime.toLocaleTimeString()}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-5 w-5" /> {currentTime.toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="relative group">
                  <div className="bg-white/25 backdrop-blur-2xl rounded-2xl p-6 border border-white/40 shadow-2xl 
                    transform-gpu transition-all duration-500 hover:scale-105 hover:rotate-1 hover:shadow-3xl
                    cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                      translate-x-[-100%] animate-shimmer" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-500 
                      opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-700" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <Wallet className="h-10 w-10 text-cyan-300" />
                          <div className="absolute -inset-2 bg-cyan-400/30 rounded-full blur-xl animate-pulse" />
                          <Zap className="absolute top-0 right-0 h-4 w-4 text-cyan-300 animate-ping" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white/80">Wallet Balance</p>
                          <p className="text-xs text-white/60">Ready for booking</p>
                        </div>
                      </div>
                      
                      <div className="text-4xl font-black text-white tracking-tight">
                        {walletBalance !== null 
                          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletBalance)
                          : 'Loading...'
                        }
                      </div>
                      
                      {walletBalance !== null && walletBalance > 10000000 && (
                        <div className="flex items-center gap-2 mt-3 text-cyan-300">
                          <Sparkles className="h-5 w-5 animate-pulse" />
                          <span className="text-sm font-bold">VIP Balance!</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-float"
                          style={{ left: `${20 + i * 15}%`, top: `${30 + i * 10}%`, animationDelay: `${i * 0.3}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-600 border-t-transparent"></div>
            </div>
          )}

          {/* Quick Actions */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-cyan-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.onClick}
                  className={`group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white/80 backdrop-blur-xl border ${getColorClasses(action.color)}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <action.icon className="h-10 w-10 mb-4 relative z-10" />
                  <h3 className="font-bold text-lg mb-2 relative z-10">{action.title}</h3>
                  <p className="text-sm opacity-80 mb-4 relative z-10">{action.description}</p>
                  <div className="flex items-center text-sm font-bold relative z-10">
                    Get Started
                    <ChevronRight className="h-5 w-5 ml-1 group-hover:translate-x-2 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Schedule */}
          <section className="mb-10">
            <ScheduleCalendarWidget compact={false} />
          </section>

          {/* Popular Packages */}
          <section className="mb-10">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <TrendingUp className="h-7 w-7 text-cyan-600" />
                  Popular Packages
                </h2>
                <button onClick={() => navigate('/packages')} className="text-cyan-600 hover:text-cyan-700 font-medium">
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {popularPackages.map((pkg) => (
                  <div key={pkg.id} className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200 hover:shadow-lg transition-all">
                    <div className="flex justify-between mb-3">
                      <h3 className="font-bold text-lg">{pkg.title}</h3>
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">{pkg.level}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                    <div className="flex items-center gap-3 mb-3">
                    </div>
                    <div className="text-lg font-bold text-cyan-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price)}
                      <span className="text-sm text-gray-500 ml-2">/ {pkg.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Top Tutors */}
          <section className="mb-10">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Star className="h-7 w-7 text-yellow-500" />
                  Top Rated Tutors
                </h2>
                <button onClick={() => navigate('/tutors')} className="text-yellow-600 hover:text-yellow-700 font-medium">
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {topRatedTutors.length > 0 ? (
                  topRatedTutors.map((tutor) => {
                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.tutorName)}&background=random`;
                    return (
                      <div key={tutor.tutorId} className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4 mb-4">
                          <img src={avatarUrl} alt={tutor.tutorName} className="w-14 h-14 rounded-full object-cover" />
                          <div>
                            <h3 className="font-bold">{tutor.tutorName}</h3>
                            <p className="text-sm text-gray-600">Tutor</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            <span className="font-bold">{tutor.averageRating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-gray-500">{tutor.feedbackCount} feedback{tutor.feedbackCount !== 1 ? 's' : ''}</span>
                        </div>
                        <button onClick={() => navigate(`/tutors/${tutor.tutorId}`)} className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                          View Profile
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No top rated tutors available yet</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Learning Resources */}
          <section>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <BookOpen className="h-7 w-7 text-blue-600" />
                Learning Resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 bg-blue-50 rounded-xl hover:shadow-lg transition">
                  <BookOpen className="h-10 w-10 text-blue-600 mb-3" />
                  <h3 className="font-bold mb-2">View Packages</h3>
                  <button onClick={() => navigate('/packages')} className="text-blue-600 font-medium">Browse</button>
                </div>
                <div className="p-5 bg-green-50 rounded-xl hover:shadow-lg transition">
                  <BarChart3 className="h-10 w-10 text-green-600 mb-3" />
                  <h3 className="font-bold mb-2">Daily Reports</h3>
                  <button onClick={() => navigate('/daily-reports')} className="text-green-600 font-medium">View</button>
                </div>
                <div className="p-5 bg-purple-50 rounded-xl hover:shadow-lg transition">
                  <MessageCircle className="h-10 w-10 text-purple-600 mb-3" />
                  <h3 className="font-bold mb-2">Support</h3>
                  <button className="text-purple-600 font-medium">Contact</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient {
          0%, 100% { transform: translateX(-5%) translateY(-5%); }
          50% { transform: translateX(5%) translateY(5%); }
        }
        @keyframes gradient-reverse {
          0%, 100% { transform: translateX(5%) translateY(5%); }
          50% { transform: translateX(-5%) translateY(-5%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        @keyframes confetti {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh) rotate(720deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-gradient { animation: gradient 30s ease infinite; }
        .animate-gradient-reverse { animation: gradient-reverse 35s ease infinite; }
        .animate-float { animation: float 25s linear infinite; }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
        .animate-shimmer { animation: shimmer 3s infinite; }
      `}} />
    </>
  );
};

export default ParentHome;
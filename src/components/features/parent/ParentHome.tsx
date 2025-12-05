import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import {
  BookOpen,
  ChevronRight,
  Star,
  PlayCircle,
  Award,
  GraduationCap,
  Quote,
  CheckCircle,
  Users,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  apiService,
  getTopRatedTutors,
  TopRatedTutorDto
} from '../../../services/api';

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
  const navigate = useNavigate();

  const [popularPackages, setPopularPackages] = useState<PopularPackage[]>([]);
  const [topRatedTutors, setTopRatedTutors] = useState<TopRatedTutorDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Statistics for display
  const stats = {
    totalStudents: 25000,
    totalCourses: 100,
    totalInstructors: 1000,
    satisfactionRate: 100
  };

  useEffect(() => {
    if (user?.id) fetchHomeData();
  }, [user?.id]);

  // Auto-reload other data (contracts, tutors, packages) every 30 seconds
  useEffect(() => {
    if (!user?.id) return;

    const fetchOtherData = async () => {
      try {
        const tutorsResponse = await getTopRatedTutors(4);
        if (tutorsResponse.success && tutorsResponse.data) {
          const tutors = tutorsResponse.data.tutors || [];
          setTopRatedTutors(tutors);
        }

        const packagesResponse = await apiService.getAllPackages();
        if (packagesResponse.success && packagesResponse.data) {
          const packagesData = Array.isArray(packagesResponse.data) 
            ? packagesResponse.data 
            : (packagesResponse.data as any).data || (packagesResponse.data as any).packages || [];
          
          const mappedPackages: PopularPackage[] = packagesData
            .slice(0, 3)
            .map((pkg: any) => {
              const sessionCount = pkg.SessionCount || pkg.sessionCount || pkg.totalSessions || pkg.sessions || 0;
              const weeks = sessionCount > 0 ? Math.ceil(sessionCount / 3) : 4;

              return {
                id: pkg.PackageId || pkg.packageId || pkg.id || '',
                title: pkg.PackageName || pkg.packageName || pkg.name || 'Package',
                description: pkg.Description || pkg.description || 'Comprehensive tutoring package',
                rating: pkg.Rating || pkg.rating || 4.5,
                students: pkg.Students || pkg.students || pkg.StudentCount || 25000,
                price: pkg.Price || pkg.price || 0,
                duration: `${weeks} week${weeks > 1 ? 's' : ''}`,
                level: pkg.level || pkg.difficulty || 'Intermediate'
              };
            });
          setPopularPackages(mappedPackages);
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      }
    };

    // Start interval after initial load
    const dataInterval = setInterval(fetchOtherData, 30000);
    
    return () => clearInterval(dataInterval);
  }, [user?.id]);

  const fetchHomeData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const tutorsResponse = await getTopRatedTutors(4);
      console.log('Top Rated Tutors Response:', tutorsResponse);
      if (tutorsResponse.success && tutorsResponse.data) {
        const tutors = tutorsResponse.data.tutors || [];
        setTopRatedTutors(tutors);
      } else {
        console.error('Failed to fetch top rated tutors:', tutorsResponse.error);
        setTopRatedTutors([]);
      }

      const packagesResponse = await apiService.getAllPackages();
      if (packagesResponse.success && packagesResponse.data) {
        const packagesData = Array.isArray(packagesResponse.data) 
          ? packagesResponse.data 
          : (packagesResponse.data as any).data || (packagesResponse.data as any).packages || [];
        
        const mappedPackages: PopularPackage[] = packagesData
          .slice(0, 3)
          .map((pkg: any) => {
            const sessionCount = pkg.SessionCount || pkg.sessionCount || pkg.totalSessions || pkg.sessions || 0;
            const weeks = sessionCount > 0 ? Math.ceil(sessionCount / 3) : 4;

            return {
              id: pkg.PackageId || pkg.packageId || pkg.id || '',
              title: pkg.PackageName || pkg.packageName || pkg.name || 'Package',
              description: pkg.Description || pkg.description || 'Comprehensive tutoring package',
              rating: pkg.Rating || pkg.rating || 4.5,
              students: pkg.Students || pkg.students || pkg.StudentCount || 25000,
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
    }
  };


  return (
    <>
      {/* Subtle Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-primary/15 text-7xl font-light select-none animate-float"
              style={{
                left: `${10 + (i * 70) % 85}%`,
                top: `${15 + (i * 55) % 80}%`,
                animationDelay: `${i * 3}s`,
              }}
            >
              {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
          
          {/* Hero Section - Professional for Grades 9-12 */}
          {!isLoading && (
            <section className="mb-16 sm:mb-20 relative">
              <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
                {/* Left Content */}
                <div className="relative z-10">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary-dark mb-6 leading-tight">
                    Excel in <span className="text-primary">Mathematics</span><br />Prepare for Success
                  </h1>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Comprehensive math tutoring designed for high school students. 
                    Expert tutors, personalized learning paths, and proven results to help your child 
                    achieve academic excellence and prepare for university entrance exams.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <button 
                      onClick={() => navigate('/packages')}
                      className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all shadow-math hover:shadow-math-lg transform hover:-translate-y-1"
                    >
                      Explore Courses
                    </button>
                    <button 
                      onClick={() => navigate('/tutors')}
                      className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-xl font-semibold text-lg hover:bg-background-cream hover:border-accent-orange transition-all flex items-center justify-center gap-2 hover:shadow-math"
                    >
                      <PlayCircle className="h-5 w-5" />
                      Meet Our Tutors
                    </button>
                </div>
                    </div>
                    
                {/* Right Visual - Academic Focus */}
                <div className="hidden lg:block relative">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-background-cream to-white rounded-3xl p-4 shadow-2xl relative z-10 border-2 border-primary/40 overflow-hidden">
                      <div className="relative w-full h-96 rounded-2xl overflow-hidden">
                        <img 
                          src="/images/hero-mathematics.jpg" 
                          alt="Advanced Mathematics"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = document.getElementById('hero-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background-cream to-white" style={{ display: 'none' }} id="hero-fallback">
                          <div className="text-center space-y-6">
                            <div className="text-7xl font-light text-primary mb-4">∫</div>
                            <div className="text-6xl font-light text-primary-dark mb-4">∑</div>
                            <div className="text-5xl font-light text-primary">π</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-orange border-t-transparent"></div>
            </div>
          )}

          {/* Feature/Benefit Section - Professional for High School */}
          {!isLoading && (
            <section className="mb-16 sm:mb-20">
              <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
                {/* Card 1 - Expert Instructors */}
                <div className="bg-white rounded-2xl p-8 text-center hover:shadow-math transition-all duration-300 hover:-translate-y-1 border-2 border-math-blue/40">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-math-blue rounded-xl flex items-center justify-center mx-auto mb-6 shadow-math">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Expert Instructors</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Highly qualified math tutors with advanced degrees and years of experience 
                    teaching high school mathematics, including calculus, algebra, and geometry.
                  </p>
                </div>
                
                {/* Card 2 - Comprehensive Curriculum */}
                <div className="bg-white rounded-2xl p-8 text-center hover:shadow-math-lg transition-all duration-300 hover:-translate-y-1 border-2 border-accent-orange/50 relative">
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-primary to-math-indigo text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg z-20">FEATURED</div>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-dark to-math-indigo rounded-xl flex items-center justify-center mx-auto mb-6 shadow-math">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Comprehensive Curriculum</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Structured programs aligned with national curriculum standards, 
                    covering all topics from Grade 9 to Grade 12 with exam preparation focus.
                  </p>
                </div>
                
                {/* Card 3 - Academic Excellence */}
                <div className="bg-white rounded-2xl p-8 text-center hover:shadow-math transition-all duration-300 hover:-translate-y-1 border-2 border-accent-yellow/40">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-accent-yellow rounded-xl flex items-center justify-center mx-auto mb-6 shadow-math">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Academic Excellence</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Proven track record of improving student performance and exam scores. 
                    Our students consistently achieve top results in national exams.
                  </p>
                </div>
            </div>
          </section>
          )}

          {/* Academic Excellence Section */}
          {!isLoading && (
            <section className="mb-16 sm:mb-20 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left - Visual Placeholder */}
                <div className="relative">
                  <div className="relative">
                    <div className="w-full h-80 bg-gradient-to-br from-background-cream to-white rounded-2xl shadow-lg border-2 border-primary/40 overflow-hidden relative">
                      <img 
                        src="/images/academic-excellence.jpg" 
                        alt="Advanced Mathematics"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.getElementById('academic-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background-cream to-white" style={{ display: 'none' }} id="academic-fallback">
                        <div className="text-center">
                          <div className="text-8xl font-light text-primary mb-4">∫</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right - Content */}
                <div>
                  <h2 className="text-4xl sm:text-5xl font-bold text-primary-dark mb-6 leading-tight">
                    Empowering High School Students at <span className="text-primary">MathBridge</span>
                </h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    We specialize in preparing students in Grades 9-12 for academic success. 
                    Our comprehensive approach combines rigorous curriculum coverage with 
                    personalized instruction, helping students master complex mathematical concepts 
                    and excel in their exams.
                  </p>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-4 bg-white rounded-xl border-2 border-primary/40 hover:shadow-math transition-all overflow-hidden">
                      <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 break-words">{stats.totalStudents.toLocaleString()}+</div>
                      <div className="text-sm text-gray-600 font-medium">Students</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl border-2 border-primary-dark/40 hover:shadow-math transition-all overflow-hidden">
                      <div className="text-2xl sm:text-3xl font-bold text-primary-dark mb-1 break-words">{stats.totalCourses}+</div>
                      <div className="text-sm text-gray-600 font-medium">Courses</div>
              </div>
                    <div className="text-center p-4 bg-white rounded-xl border-2 border-accent-orange/50 hover:shadow-math transition-all overflow-hidden">
                      <div className="text-2xl sm:text-3xl font-bold text-accent-orange mb-1 break-words">{stats.totalInstructors.toLocaleString()}+</div>
                      <div className="text-sm text-gray-600 font-medium">Instructors</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl border-2 border-accent-green/50 hover:shadow-math transition-all overflow-hidden">
                      <div className="text-2xl sm:text-3xl font-bold text-accent-green mb-1 break-words">{stats.satisfactionRate}%</div>
                      <div className="text-sm text-gray-600 font-medium">Satisfaction</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/packages')}
                    className="px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl"
                  >
                    View All Courses
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Learning Approach Section */}
          {!isLoading && (
            <section className="mb-16 sm:mb-20 bg-gradient-to-br from-primary-dark to-primary rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
              {/* Subtle math pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-8 left-8 text-6xl font-light">∫</div>
                <div className="absolute top-16 right-12 text-5xl font-light">∑</div>
                <div className="absolute bottom-8 left-12 text-5xl font-light">π</div>
                <div className="absolute bottom-16 right-8 text-6xl font-light">∞</div>
              </div>
              
              <div className="text-center mb-12 relative z-10">
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">Our Learning Methodology</h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Structured, results-driven approach designed for high school success
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto relative z-10">
                <div className="bg-white/20 rounded-xl p-6 border-2 border-white/40 hover:border-white/60 transition-all hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-math-blue rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2 text-white">{stats.totalStudents.toLocaleString()}+</div>
                  <div className="text-sm text-gray-200">Active Students</div>
                </div>
                <div className="bg-white/20 rounded-xl p-6 border-2 border-white/40 hover:border-white/60 transition-all hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-dark to-math-indigo rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2 text-white">{stats.totalCourses}+</div>
                  <div className="text-sm text-gray-200">Course Programs</div>
                </div>
                <div className="bg-white/20 rounded-xl p-6 border-2 border-white/40 hover:border-white/60 transition-all hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-orange to-accent-yellow rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <GraduationCap className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2 text-white">{stats.totalInstructors.toLocaleString()}+</div>
                  <div className="text-sm text-gray-200">Expert Tutors</div>
                </div>
                <div className="bg-white/20 rounded-xl p-6 border-2 border-white/40 hover:border-white/60 transition-all hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-green to-math-teal rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2 text-white">{stats.satisfactionRate}%</div>
                  <div className="text-sm text-gray-200">Success Rate</div>
                </div>
              </div>
            </section>
          )}

          {/* What Parents Say - Testimonials */}
          {!isLoading && (
            <section className="mb-16 sm:mb-20 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
              <h2 className="text-4xl font-bold text-primary-dark mb-12 text-center">What Parents Say</h2>
              <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
                {[
                  {
                    quote: "MathBridge helped my daughter improve from a C to an A in Grade 11 math. The personalized approach and expert tutors made all the difference.",
                    name: "Nguyen Thi Lan",
                    role: "Parent of Grade 11 Student"
                  },
                  {
                    quote: "Excellent preparation for university entrance exams. My son gained confidence and improved his problem-solving skills significantly.",
                    name: "Tran Van Minh",
                    role: "Parent of Grade 12 Student"
                  },
                  {
                    quote: "The structured curriculum and regular progress reports keep us informed. Highly professional and results-oriented.",
                    name: "Le Thi Hoa",
                    role: "Parent of Grade 10 Student"
                  }
                ].map((testimonial, idx) => {
                  const quoteConfigs = [
                    { quoteClass: 'text-primary', avatarClass: 'from-primary to-math-blue', borderClass: 'border-primary/40' },
                    { quoteClass: 'text-math-indigo', avatarClass: 'from-primary-dark to-math-indigo', borderClass: 'border-math-indigo/40' },
                    { quoteClass: 'text-accent-orange', avatarClass: 'from-accent-orange to-accent-yellow', borderClass: 'border-accent-orange/40' },
                  ];
                  const config = quoteConfigs[idx % quoteConfigs.length];
                  return (
                    <div key={idx} className={`bg-white rounded-xl p-6 border-2 ${config.borderClass} hover:shadow-math transition-all h-full flex flex-col`}>
                      <Quote className={`h-6 w-6 ${config.quoteClass} mb-4 flex-shrink-0`} />
                      <p className="text-gray-700 mb-6 leading-relaxed italic flex-1">
                      "{testimonial.quote}"
                    </p>
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
                        <div className={`w-12 h-12 bg-gradient-to-br ${config.avatarClass} rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg flex-shrink-0`}>
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-primary-dark">{testimonial.name}</div>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
          )}

          {/* Top Rated Tutors Section */}
          {!isLoading && (
            <section className="mb-16 sm:mb-20 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                <div>
                  <h2 className="text-4xl font-bold text-primary-dark mb-2">Top Rated Tutors</h2>
                  <p className="text-lg text-gray-600">Highly rated educators specializing in high school mathematics</p>
                </div>
                <button 
                  onClick={() => navigate('/tutors')}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl"
                >
                  View All Tutors
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topRatedTutors.length > 0 ? (
                  topRatedTutors.map((tutor: any) => {
                    const tutorId = tutor.tutorId || tutor.TutorId || '';
                    const tutorName = tutor.tutorName || tutor.TutorName || 'Unknown';
                    const averageRating = tutor.averageRating || tutor.AverageRating || 0;
                    const feedbackCount = tutor.feedbackCount || tutor.FeedbackCount || 0;
                    const tutorAvatarUrl = tutor.avatarUrl || tutor.AvatarUrl || null;
                    const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorName)}&background=2563eb&color=fff&size=200`;
                    const isVerified = tutor.verificationStatus === 'approved' || tutor.verificationStatus === 'Approved';
                    
                    return (
                      <div key={tutorId} className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden hover:shadow-math-lg transition-all transform hover:scale-[1.02]">
                        {/* Tutor Image */}
                        <div className="relative aspect-[3/2] bg-gradient-to-br from-primary/20 to-primary-dark/20 overflow-hidden">
                            {tutorAvatarUrl ? (
                              <img 
                                src={tutorAvatarUrl} 
                                alt={tutorName} 
                              className="w-full h-full object-cover object-center"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = fallbackAvatarUrl;
                                }}
                              />
                            ) : (
                            <img src={fallbackAvatarUrl} alt={tutorName} className="w-full h-full object-cover object-center" />
                            )}
                          {isVerified && (
                            <div className="absolute top-3 right-3 bg-primary text-white p-2 rounded-full shadow-math">
                              <Award className="h-4 w-4" />
                          </div>
                          )}
                        </div>

                        {/* Tutor Info */}
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-primary-dark">{tutorName}</h3>
                            {averageRating > 0 && (
                              <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold text-primary-dark">{Number(averageRating).toFixed(1)}</span>
                                {feedbackCount > 0 && (
                                  <span className="text-sm text-gray-500">({feedbackCount})</span>
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-4">Math Instructor</p>

                          {/* Action Button */}
                        <button 
                          onClick={() => navigate(`/tutors/${tutorId}`)}
                            className="w-full bg-primary text-white px-4 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-math hover:shadow-math-lg flex items-center justify-center gap-2"
                        >
                            <User className="h-4 w-4" />
                            <span>View Profile</span>
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-4 text-center py-12 text-gray-500">
                    <GraduationCap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No tutors available yet</p>
                  </div>
                )}
            </div>
          </section>
          )}

          {/* Most Popular Courses Section */}
          {!isLoading && (
            <section className="mb-16 sm:mb-20 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-4xl font-bold text-primary-dark mb-2">Most Popular Courses</h2>
                  <p className="text-lg text-gray-600">Comprehensive programs for Grades 9-12</p>
                </div>
                <button 
                  onClick={() => navigate('/packages')}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl"
                >
                  View All
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
                {popularPackages.map((pkg, idx) => {
                  const gradients = [
                    { from: 'from-math-blue/30', to: 'to-primary/20', icon: 'text-math-blue', symbol: 'text-math-indigo', price: 'text-primary', badge: 'from-math-blue/40 to-primary/30' },
                    { from: 'from-math-indigo/30', to: 'to-primary-dark/20', icon: 'text-math-indigo', symbol: 'text-math-teal', price: 'text-primary-dark', badge: 'from-math-indigo/40 to-primary-dark/30' },
                    { from: 'from-accent-orange/30', to: 'to-accent-yellow/20', icon: 'text-accent-orange', symbol: 'text-accent-yellow', price: 'text-accent-orange', badge: 'from-accent-orange/40 to-accent-yellow/30' },
                  ];
                  const gradient = gradients[idx % gradients.length];
                  return (
                    <div key={pkg.id} className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:shadow-math-lg transition-all group relative">
                      <div className={`h-48 bg-gradient-to-br ${gradient.from} ${gradient.to} flex items-center justify-center border-b border-gray-200`}>
                      <div className="text-center">
                          <BookOpen className={`h-16 w-16 ${gradient.icon} mx-auto mb-3`} />
                          <div className={`text-4xl font-light ${gradient.symbol}`}>∫</div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-primary-dark group-hover:text-primary transition-colors flex-1">{pkg.title}</h3>
                          <span className={`px-3 py-1 bg-gradient-to-r ${gradient.badge} text-primary-dark rounded-full text-xs font-semibold ml-2 border-2 border-primary/40`}>{pkg.level}</span>
                      </div>
                      <p className="text-gray-600 mb-5 line-clamp-2 text-sm leading-relaxed">{pkg.description}</p>
                      <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-200">
                        <div>
                            <div className={`text-2xl font-bold ${gradient.price}`}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(pkg.price)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">/ {pkg.duration}</div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-accent-yellow fill-current" />
                            <span className="text-sm font-semibold text-primary-dark">{(pkg.rating || 4.5).toFixed(1)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/packages/${pkg.id}`)}
                          className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark hover:shadow-math transition-all hover:scale-105"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Innovative Learning Approach Section */}
          {!isLoading && (
            <section className="mb-16 sm:mb-20 bg-gradient-to-br from-background-cream to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left Content */}
                <div>
                  <h2 className="text-4xl sm:text-5xl font-bold text-primary-dark mb-6 leading-tight">
                    Innovative Learning Approach
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Our teaching methodology combines structured curriculum delivery with interactive problem-solving. 
                    We focus on building strong conceptual understanding, developing analytical thinking skills, 
                    and preparing students for academic challenges ahead. Every session is designed to maximize 
                    learning outcomes and boost confidence.
                  </p>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-math-blue rounded-lg flex items-center justify-center flex-shrink-0 shadow-math group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-dark mb-1 group-hover:text-primary transition-colors">Structured Curriculum</h4>
                        <p className="text-gray-600 text-sm">Aligned with national standards and exam requirements</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-dark to-math-indigo rounded-lg flex items-center justify-center flex-shrink-0 shadow-math group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-dark mb-1 group-hover:text-math-indigo transition-colors">Personalized Instruction</h4>
                        <p className="text-gray-600 text-sm">Tailored to each student's learning pace and style</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-orange to-accent-yellow rounded-lg flex items-center justify-center flex-shrink-0 shadow-math group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-dark mb-1 group-hover:text-accent-orange transition-colors">Exam Preparation</h4>
                        <p className="text-gray-600 text-sm">Comprehensive preparation for university entrance exams</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/packages')}
                    className="px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    Learn More
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Right Visual */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-200 overflow-hidden">
                    <div className="relative w-full h-80 rounded-xl overflow-hidden">
                      <img 
                        src="/images/learning-approach.jpg" 
                        alt="Advanced Mathematics"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.getElementById('learning-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-white" style={{ display: 'none' }} id="learning-fallback">
                        <div className="text-center space-y-8">
                          <div className="text-8xl font-light text-primary">∑</div>
                          <div className="text-6xl font-light text-primary-dark">∫</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </section>
          )}
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}} />
    </>
  );
};

export default ParentHome;

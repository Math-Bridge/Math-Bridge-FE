import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  Star,
  PlayCircle,
  Award,
  GraduationCap,
  CheckCircle,
  Users,
  Calculator,
  Loader2
} from 'lucide-react';
import { usePackages } from '../../../hooks/usePackages';
import { useTutors } from '../../../hooks/useTutors';

const ParentHome: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const { packages: allPackages, loading: packagesLoading, error: packagesError } = usePackages(true, 60000);
  const { tutors: allTutors, loading: tutorsLoading, error: tutorsError } = useTutors(true, 60000);
  
  // Duplicate tutors and packages for seamless infinite scroll
  const duplicatedTutors = [...allTutors, ...allTutors];
  const duplicatedPackages = [...allPackages, ...allPackages];

  const handleTutorClick = (tutorId: string) => {
    navigate(`/tutors/${tutorId}`);
  };

  const handlePackageClick = (packageId: string) => {
    navigate(`/packages/${packageId}`);
  };

  // Get initials from tutor name
  const getTutorInitials = (name: string): string => {
    if (!name) return 'T';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    // Get first letter of first name and last name
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Get background color based on name for consistent avatar colors
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-gradient-to-br from-primary to-primary-dark',
      'bg-gradient-to-br from-accent-orange to-orange-600',
      'bg-gradient-to-br from-blue-500 to-blue-700',
      'bg-gradient-to-br from-green-500 to-green-700',
      'bg-gradient-to-br from-purple-500 to-purple-700',
      'bg-gradient-to-br from-pink-500 to-pink-700',
      'bg-gradient-to-br from-indigo-500 to-indigo-700',
      'bg-gradient-to-br from-teal-500 to-teal-700',
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const stats = {
    totalStudents: 25000,
    totalCourses: allPackages.length || 100,
    totalInstructors: allTutors.length || 1000,
    satisfactionRate: 100
  };

  return (
    <>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-background-cream via-background-light to-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #FF6B35 1px, transparent 1px),
                             radial-gradient(circle at 80% 80%, #FF6B35 1px, transparent 1px)`,
            backgroundSize: '50px 50px, 80px 80px',
            animation: 'float 20s ease-in-out infinite'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <section>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left Content */}
                <div className="relative z-10 space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Trusted by 25,000+ Students</span>
                  </div>

                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
                    Master Math with
                    <span className="block mt-2 bg-gradient-to-r from-primary via-accent-orange to-primary-light bg-clip-text text-transparent">
                      Expert Guidance
                    </span>
                  </h1>

                  <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                    Connect with experienced tutors specializing in international curricula. Personalized learning paths for every student.
                  </p>
                </div>

                {/* Right Visual */}
                <div className="hidden lg:block relative">
                  <div className="relative">
                    {/* Floating Elements */}
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-orange/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

                    {/* Main Card */}
                    <div className="relative bg-white rounded-3xl p-8 shadow-math-lg transform hover:scale-105 transition-transform duration-500">
                      <div className="absolute top-4 right-4 flex gap-2">
                        <div className="w-3 h-3 bg-accent-red rounded-full"></div>
                        <div className="w-3 h-3 bg-accent-yellow rounded-full"></div>
                        <div className="w-3 h-3 bg-accent-green rounded-full"></div>
                      </div>

                      <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-orange-50 via-background-cream to-amber-50 flex items-center justify-center overflow-hidden">
                        {/* Math Symbols Grid */}
                        <div className="grid grid-cols-3 gap-8 text-center">
                          <div className="text-5xl font-light text-primary opacity-60 transform hover:scale-125 transition-transform">∫</div>
                          <div className="text-5xl font-light text-accent-orange opacity-60 transform hover:scale-125 transition-transform">∑</div>
                          <div className="text-5xl font-light text-primary-dark opacity-60 transform hover:scale-125 transition-transform">π</div>
                          <div className="text-5xl font-light text-accent-orange opacity-60 transform hover:scale-125 transition-transform">√</div>
                          <div className="text-7xl font-bold text-primary transform hover:scale-125 transition-transform">Δ</div>
                          <div className="text-5xl font-light text-primary-dark opacity-60 transform hover:scale-125 transition-transform">∞</div>
                          <div className="text-5xl font-light text-primary opacity-60 transform hover:scale-125 transition-transform">α</div>
                          <div className="text-5xl font-light text-accent-orange opacity-60 transform hover:scale-125 transition-transform">θ</div>
                          <div className="text-5xl font-light text-primary-dark opacity-60 transform hover:scale-125 transition-transform">β</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          {/* Category Cards Section */}
          <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Explore Our <span className="text-primary">Subject Areas</span>
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Comprehensive coverage across all major mathematical disciplines
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {[
                    { name: 'Algebra', icon: Calculator, symbol: 'x²' },
                    { name: 'Geometry', icon: BookOpen, symbol: '△' },
                    { name: 'Calculus', icon: Award, symbol: '∫' },
                    { name: 'Statistics', icon: GraduationCap, symbol: 'μ' },
                    { name: 'Trigonometry', icon: Calculator, symbol: 'sin' },
                  ].map((category) => {
                    const Icon = category.icon;
                    return (
                      <div
                        key={category.name}
                        className="group relative bg-gradient-to-br from-white to-background-cream rounded-2xl p-6 border-2 border-gray-100 hover:border-primary transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:shadow-math"
                      >
                        <div className="absolute top-4 right-4 text-4xl font-light text-primary opacity-10 group-hover:opacity-20 transition-opacity">
                          {category.symbol}
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Expert-designed curriculum</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

          {/* About Us Section */}
          <section className="py-24 bg-gradient-to-b from-white to-background-cream relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-orange/5 rounded-full blur-3xl"></div>

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  {/* Left Content */}
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">About MathBridge</span>
                    </div>

                    <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                      Transforming Math Education
                      <span className="block mt-2 text-primary">Since 2016</span>
                    </h2>

                    <p className="text-lg text-gray-600 leading-relaxed">
                      MathBridge is a trusted platform dedicated to creating breakthroughs in mathematics education. We've helped thousands of students master complex concepts through personalized tutoring and innovative teaching methods.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { label: 'Students Helped', value: '25K+', icon: Users },
                        { label: 'Expert Tutors', value: '1000+', icon: GraduationCap },
                        { label: 'Success Rate', value: '98%', icon: Award },
                        { label: 'Years Experience', value: '8+', icon: CheckCircle }
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100">
                          <stat.icon className="h-6 w-6 text-primary mb-2" />
                          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                          <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Visual */}
                  <div className="relative">
                    <div className="relative bg-white rounded-3xl p-6 shadow-math-lg">
                      <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-50 via-background-cream to-amber-50 flex flex-col items-center justify-center p-8 overflow-hidden">
                        <div className="text-center space-y-6 relative z-10">
                          <div className="text-6xl font-light text-primary/80 animate-bounce-slow">∫</div>
                          <div className="text-7xl font-bold text-primary">
                            Math<span className="text-primary-dark">Bridge</span>
                          </div>
                          <div className="flex gap-4 justify-center">
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-2xl font-light text-primary">π</span>
                            </div>
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-2xl font-light text-primary">∑</span>
                            </div>
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-2xl font-light text-primary">√</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-4 left-4 w-20 h-20 border-2 border-primary/20 rounded-full"></div>
                        <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-primary/20 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          {/* Special Services Section */}
          <section className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-5xl font-bold text-gray-900 mb-4">
                    Why Choose <span className="text-primary">MathBridge</span>
                  </h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Comprehensive support and resources to ensure your success
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    {
                      title: 'Lifetime Support',
                      description: 'Continuous guidance even after course completion',
                      icon: Users,
                      gradient: 'from-primary/10 to-primary/5'
                    },
                    {
                      title: '24/7 Availability',
                      description: 'Round-the-clock assistance whenever you need it',
                      icon: CheckCircle,
                      gradient: 'from-accent-green/10 to-accent-green/5'
                    },
                    {
                      title: 'Expert Tutors',
                      description: 'Learn from verified mathematics educators',
                      icon: GraduationCap,
                      gradient: 'from-accent-orange/10 to-accent-orange/5'
                    },
                    {
                      title: 'Progress Tracking',
                      description: 'Detailed reports and performance analytics',
                      icon: Award,
                      gradient: 'from-accent-yellow/10 to-accent-yellow/5'
                    },
                  ].map((service, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-gradient-to-br from-white to-background-cream rounded-2xl p-8 border-2 border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-math transform hover:-translate-y-2"
                    >
                      <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <service.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          {/* Statistics Section */}
          <section className="py-24 bg-gradient-to-br from-primary-dark via-footer-brown to-primary-dark relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(45deg, transparent 48%, #FF6B35 48%, #FF6B35 52%, transparent 52%)`,
                  backgroundSize: '40px 40px'
                }}></div>
              </div>

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-5xl font-bold text-white mb-4">Our Impact in Numbers</h2>
                  <p className="text-lg text-white/80 max-w-2xl mx-auto">
                    Trusted by thousands of students and parents worldwide
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { icon: GraduationCap, label: 'Expert Mentors', value: stats.totalInstructors, suffix: '+', color: 'primary' },
                    { icon: Users, label: 'Active Students', value: stats.totalStudents / 1000, suffix: 'K+', color: 'accent-green' },
                    { icon: BookOpen, label: 'Course Programs', value: stats.totalCourses, suffix: '+', color: 'accent-yellow' },
                    { icon: Award, label: 'Success Stories', value: 98, suffix: '%', color: 'accent-orange' },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={idx}
                        className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/30 transform hover:-translate-y-2"
                      >
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                          <Icon className="h-10 w-10 text-white" />
                        </div>
                        <div className="text-5xl font-bold text-white mb-3">
                          {stat.value}{stat.suffix}
                        </div>
                        <div className="text-white/90 text-lg font-medium">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

          {/* Testimonials Section */}
          <section className="py-24 bg-gradient-to-b from-white to-background-cream relative overflow-hidden">
              <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-orange/5 rounded-full blur-3xl"></div>

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                    <Star className="h-4 w-4 text-primary fill-current" />
                    <span className="text-sm font-semibold text-primary">Testimonials</span>
                  </div>
                  <h2 className="text-5xl font-bold text-gray-900 mb-4">
                    Loved by Parents & <span className="text-primary">Students</span>
                  </h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Real experiences from families who trust MathBridge
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      quote: "MathBridge's courses focus on core mathematical concepts and build strong foundations. My daughter's confidence has grown tremendously.",
                      name: "Nguyen Thi Lan",
                      role: "Parent of Grade 11 Student"
                    },
                    {
                      quote: "Excellent preparation for university entrance exams. My son gained confidence and improved his problem-solving skills significantly.",
                      name: "Tran Van Minh",
                      role: "Parent of Grade 12 Student"
                    },
                    {
                      quote: "The structured curriculum and regular progress reports keep us informed. Highly professional and results-oriented teaching.",
                      name: "Le Thi Hoa",
                      role: "Parent of Grade 10 Student"
                    }
                  ].map((testimonial, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-white rounded-2xl p-8 shadow-card hover:shadow-math-lg transition-all duration-300 border-2 border-gray-100 hover:border-primary transform hover:-translate-y-2"
                    >
                      <div className="absolute top-0 left-8 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl font-serif">"</span>
                      </div>

                      <div className="flex gap-1 mb-6 mt-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-accent-yellow fill-current" />
                        ))}
                      </div>

                      <p className="text-gray-700 mb-8 leading-relaxed text-lg">
                        {testimonial.quote}
                      </p>

                      <div className="flex items-center gap-4 pt-6 border-t-2 border-gray-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-bold">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                          <div className="text-sm text-gray-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

         

          {/* All Tutors Section with Auto Scrolling */}
          <section className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Meet Our Experts</span>
                  </div>
                  <h2 className="text-5xl font-bold text-gray-900 mb-3">
                    All <span className="text-primary">Tutors</span>
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Learn from our experienced educators specializing in international mathematics curricula
                  </p>
                </div>

                {tutorsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                ) : tutorsError ? (
                  <div className="text-center py-20">
                    <p className="text-red-500 text-lg">Error loading tutors: {tutorsError}</p>
                  </div>
                ) : allTutors.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">No tutors available at the moment</p>
                  </div>
                ) : (
                  <div className="relative overflow-hidden scroll-container">
                    <div className="flex gap-6 animate-scroll-horizontal">
                      {duplicatedTutors.map((tutor, index) => (
                        <div
                          key={`${tutor.id}-${index}`}
                          onClick={() => handleTutorClick(tutor.id)}
                          className="group relative bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-math transform hover:-translate-y-2 cursor-pointer flex-shrink-0 w-80"
                        >
                          <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary-dark/10 overflow-hidden">
                            {tutor.avatar && tutor.avatar !== '/images/default-avatar.png' && tutor.avatar.trim() !== '' ? (
                              <>
                                <img
                                  src={tutor.avatar}
                                  alt={tutor.name}
                                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => {
                                    // If image fails to load, hide img and show initials
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      const initialsDiv = parent.querySelector('.tutor-initials') as HTMLElement;
                                      if (initialsDiv) initialsDiv.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div 
                                  className="tutor-initials hidden w-full h-full absolute inset-0 items-center justify-center"
                                  style={{ display: 'none' }}
                                >
                                  <div className={`w-full h-full ${getAvatarColor(tutor.name)} flex items-center justify-center`}>
                                    <span className="text-6xl font-bold text-white">
                                      {getTutorInitials(tutor.name)}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className={`w-full h-full ${getAvatarColor(tutor.name)} flex items-center justify-center`}>
                                <span className="text-6xl font-bold text-white">
                                  {getTutorInitials(tutor.name)}
                                </span>
                              </div>
                            )}
                            <div className="absolute top-4 right-4 bg-primary text-white p-2.5 rounded-full shadow-math z-10">
                              <Award className="h-5 w-5" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                          </div>

                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                                {tutor.name}
                              </h3>
                              <div className="flex items-center gap-1 bg-accent-yellow/10 px-2 py-1 rounded-lg">
                                <Star className="h-4 w-4 text-accent-yellow fill-current" />
                                <span className="text-sm font-bold text-gray-900">
                                  {(tutor.rating || 0).toFixed(1)}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">Mathematics Educator</p>

                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                              <Users className="h-4 w-4" />
                              <span>{tutor.reviews || 0} reviews</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <span className="text-sm font-semibold text-primary">View Profile</span>
                              <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

          {/* All Packages Section with Auto Scrolling */}
          <section className="py-24 bg-gradient-to-b from-background-cream to-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">All Packages</span>
                  </div>
                  <h2 className="text-5xl font-bold text-gray-900 mb-4">
                    All <span className="text-primary">Course Packages</span>
                  </h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Carefully designed programs to meet diverse learning needs and international curriculum standards
                  </p>
                </div>

                {packagesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                ) : packagesError ? (
                  <div className="text-center py-20">
                    <p className="text-red-500 text-lg">Error loading packages: {packagesError}</p>
                  </div>
                ) : allPackages.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">No packages available at the moment</p>
                  </div>
                ) : (
                  <div className="relative overflow-hidden scroll-container">
                    <div className="flex gap-8 animate-scroll-horizontal-reverse">
                      {duplicatedPackages.map((pkg, index) => {
                        const sessionCount = pkg.duration && pkg.duration.includes('week') ? parseInt(pkg.duration) * 3 : 32;

                        return (
                          <div
                            key={`${pkg.id}-${index}`}
                            onClick={() => handlePackageClick(pkg.id)}
                            className="group relative bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-math-lg transform hover:-translate-y-2 cursor-pointer flex-shrink-0 w-96"
                          >
                            {/* Course Header */}
                            <div className="relative h-56 bg-gradient-to-br from-primary/10 via-background-cream to-accent-orange/10 flex flex-col items-center justify-center p-8 overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0" style={{
                                  backgroundImage: `radial-gradient(circle, #FF6B35 1px, transparent 1px)`,
                                  backgroundSize: '20px 20px'
                                }}></div>
                              </div>

                              <div className="relative z-10 text-center">
                                <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                                  <span className="text-4xl text-primary">∫</span>
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-2xl font-bold text-gray-900">{pkg.title}</h3>
                                  <p className="text-gray-600 font-medium">Mathematics Program</p>
                                </div>
                              </div>
                            </div>

                            {/* Course Details */}
                            <div className="p-8">
                              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="text-center">
                                  <PlayCircle className="h-5 w-5 text-primary mx-auto mb-1" />
                                  <div className="text-sm font-bold text-gray-900">{sessionCount}+</div>
                                  <div className="text-xs text-gray-500">Sessions</div>
                                </div>
                                <div className="text-center">
                                  <Star className="h-5 w-5 text-accent-yellow fill-current mx-auto mb-1" />
                                  <div className="text-sm font-bold text-gray-900">{(pkg.rating || 4.5).toFixed(1)}</div>
                                  <div className="text-xs text-gray-500">Rating</div>
                                </div>
                              </div>

                              <div className="mb-6">
                                <div className="flex items-end gap-3 mb-2">
                                  <div className="text-3xl font-bold text-primary">
                                    {new Intl.NumberFormat('vi-VN', {
                                      style: 'currency',
                                      currency: 'VND',
                                      maximumFractionDigits: 0
                                    }).format(pkg.price)}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">{pkg.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
             {/* Newsletter Section */}
          <section className="py-24 bg-gradient-to-br from-primary via-primary-dark to-footer-brown relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <Award className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-5xl font-bold text-white mb-6">
                  Stay Updated with MathBridge
                </h2>
                <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                  Join our community and get exclusive learning tips, course updates, and special offers
                </p>

                <div className="max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row gap-4 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-6 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-lg"
                    />
                    <button
                      onClick={() => {
                        if (email) {
                          alert('Thank you for subscribing!');
                          setEmail('');
                        }
                      }}
                      className="px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-gray-50 transition-all whitespace-nowrap text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Subscribe Now
                    </button>
                  </div>
                  <p className="text-white/70 text-sm mt-4">
                    Join 25,000+ students already learning with us
                  </p>
                </div>
              </div>
            </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-float { animation: float 25s linear infinite; }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        @keyframes scroll-horizontal {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50% - 0.5rem));
          }
        }
        @keyframes scroll-horizontal-reverse {
          from {
            transform: translateX(calc(-50% - 0.5rem));
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-scroll-horizontal {
          animation: scroll-horizontal 20s linear infinite;
        }
        .animate-scroll-horizontal-reverse {
          animation: scroll-horizontal-reverse 20s linear infinite;
        }
        .scroll-container:hover .animate-scroll-horizontal,
        .scroll-container:hover .animate-scroll-horizontal-reverse {
          animation-play-state: paused;
        }
      `}} />
    </>
  );
};

export default ParentHome;

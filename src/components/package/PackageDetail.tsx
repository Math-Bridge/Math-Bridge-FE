import React, { useState, useEffect } from "react";
import {
  ArrowLeft,          // ĐÃ THÊM LẠI – KHÔNG CÒN LỖI
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Brain,
  Calculator,
  Globe,
  Beaker,
  Languages,
  PencilRuler,
  Users,
  CheckCircle,
  GraduationCap,
  Star,
  Loader,
  BookMarked,
  ChevronDown,
} from "lucide-react";
import type { Course } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { getCurriculumById, getUnitsByCurriculumId } from "../../services/api";

interface PackageDetailProps {
  course: Course;
  onBack: () => void;
  onEdit?: (courseId: string) => void;
  onEnroll?: (course: Course) => void;
}

const PackageDetail: React.FC<PackageDetailProps> = ({
  course,
  onBack,
  onEdit,
  onEnroll,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  
  // Curriculum state
  const [curriculum, setCurriculum] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  
  // Fetch curriculum when curriculumId is available
  useEffect(() => {
    const curriculumId = (course as any).curriculumId || (course as any).CurriculumId;
    if (curriculumId && activeTab === 'curriculum') {
      fetchCurriculumDetails(curriculumId);
    }
  }, [course, activeTab]);
  
  const fetchCurriculumDetails = async (curriculumId: string) => {
    setLoadingCurriculum(true);
    try {
      const [curriculumResponse, unitsResponse] = await Promise.all([
        getCurriculumById(curriculumId),
        getUnitsByCurriculumId(curriculumId)
      ]);
      
      if (curriculumResponse.success && curriculumResponse.data) {
        setCurriculum(curriculumResponse.data);
      }
      
      if (unitsResponse.success && unitsResponse.data) {
        setUnits(Array.isArray(unitsResponse.data) ? unitsResponse.data : []);
      }
    } catch (error) {
      console.error('Error fetching curriculum details:', error);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const packageName =
    course.name || (course as any).packageName || "Learning Package";

  const sessionCount = (course as any).sessionCount || 0;
  const durationDays = (course as any).durationDays || 0;
  const sessionsPerWeek = (course as any).sessionsPerWeek || 3;

  const weeksFromDuration = durationDays > 0 ? Math.ceil(durationDays / 7) : 0;
  const weeksFromSessions = Math.ceil(sessionCount / sessionsPerWeek);
  const durationWeeks =
    (course as any).duration_weeks || weeksFromDuration || weeksFromSessions || 0;

  const maxReschedule = (course as any).maxReschedule || 0;

  const getSubjectIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("math") || lowerName.includes("toán"))
      return Calculator;
    if (lowerName.includes("english") || lowerName.includes("tiếng anh"))
      return Languages;
    if (lowerName.includes("science") || lowerName.includes("khoa học"))
      return Beaker;
    if (lowerName.includes("literature") || lowerName.includes("văn"))
      return BookOpen;
    if (lowerName.includes("logic") || lowerName.includes("tư duy"))
      return Brain;
    if (lowerName.includes("art") || lowerName.includes("vẽ") || lowerName.includes("mỹ thuật"))
      return PencilRuler;
    if (lowerName.includes("world") || lowerName.includes("địa") || lowerName.includes("lịch sử"))
      return Globe;
    return BookOpen;
  };

  const SubjectIcon = getSubjectIcon(packageName);
  const bgColor = course.price === 0 ? "bg-accent-green/10" : "bg-primary/10";

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

      <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-6">
        <button
          onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white text-primary border-2 border-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all shadow-math hover:shadow-math-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Packages
        </button>
      </div>

        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* MAIN BLOCK */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-math-lg border-2 border-primary/20 overflow-hidden">
              {/* Hero Image */}
              <div className="relative aspect-[16/9] overflow-hidden">
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={packageName}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div
                    className={`relative w-full h-full ${bgColor} flex items-center justify-center`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                    <div className="relative z-10 p-12">
                      <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                        <SubjectIcon className="w-20 h-20 text-primary" />
                      </div>
                    </div>
                  </div>
                )}

                {course.status && course.status !== "active" && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/95 backdrop-blur rounded-full text-xs font-semibold text-gray-700 shadow">
                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                  </div>
                )}
              </div>

              <div className="p-8 space-y-8">
                {/* Title & Center & Grade */}
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-3">
                    {packageName}
                  </h1>
                  {course.center_name && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-lg font-medium">
                        {course.center_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {course.description && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      About This Package
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                )}

                {/* What You'll Get */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    What You'll Get
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Total Sessions
                        </p>
                        <p className="text-2xl font-bold text-cyan-600">
                          {sessionCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Duration</p>
                        <p className="text-2xl font-bold text-red-600">
                          {durationWeeks} week{durationWeeks !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <BookMarked className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Grade
                        </p>
                        <p className="text-2xl font-bold text-purple-600 capitalize">
                          {(course as any).grade || course.category || (course as any).Grade || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Learning Level
                        </p>
                        <p className="text-2xl font-bold text-teal-600 capitalize">
                          {course.level || "Intermediate"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Reschedule Allowed
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {maxReschedule} time{maxReschedule !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Section */}
                <div className="mt-8">
                  <div className="flex flex-col items-end">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Price
                    </h2>
                    <div className="flex items-baseline gap-3">
                      <p className="text-4xl font-bold text-gray-900">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          maximumFractionDigits: 0,
                        }).format(course.price || 0)}
                      </p>
                      {course.price === 0 && (
                        <span className="px-3 py-1 bg-accent-green/20 text-accent-green font-bold rounded-full text-sm">
                          FREE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Tab Navigation */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 sticky top-8">
              <div className="p-6">
                <div className="flex flex-wrap gap-3 mb-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === 'overview'
                        ? 'bg-primary text-white shadow-math'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === 'curriculum'
                        ? 'bg-primary text-white shadow-math'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Curriculum
                  </button>
                  <button
                    onClick={() => setActiveTab('instructor')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === 'instructor'
                        ? 'bg-primary text-white shadow-math'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Instructor
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === 'reviews'
                        ? 'bg-primary text-white shadow-math'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Reviews
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-12">
                  {activeTab === 'overview' && (
                    <>
                      {/* Course Description */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                          Course Description
                        </h3>
                        <div className="space-y-4 text-gray-700 leading-relaxed">
                          {course.description ? (
                            <p>{course.description}</p>
                          ) : (
                            <p className="text-gray-500 italic">No description available for this package.</p>
                          )}
                        </div>
                      </div>

                      {/* What Will I Learn */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                          What Will I Learn From This Course?
                        </h3>
                        <div className="space-y-4 text-gray-700 leading-relaxed">
                          {(course as any).learningOutcomes ? (
                            <ul className="list-disc list-inside space-y-2 ml-4">
                              {Array.isArray((course as any).learningOutcomes) 
                                ? (course as any).learningOutcomes.map((outcome: string, idx: number) => (
                                    <li key={idx}>{outcome}</li>
                                  ))
                                : <li>{(course as any).learningOutcomes}</li>
                              }
                            </ul>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-gray-500 italic">Learning outcomes information is not available.</p>
                              {course.description && (
                                <p className="text-sm text-gray-600">
                                  This package includes {sessionCount} sessions over {durationWeeks} weeks, 
                                  designed to help students achieve their learning goals.
                                </p>
                              )}
                  </div>
                )}
              </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'curriculum' && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                        Curriculum
                      </h3>
                      <div className="space-y-4 text-gray-700">
                        {loadingCurriculum ? (
                          <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center">
                            <Loader className="w-6 h-6 text-primary animate-spin" />
                            <span className="ml-3 text-gray-600">Loading curriculum details...</span>
                          </div>
                        ) : curriculum ? (
                          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">{curriculum.curriculumName || curriculum.CurriculumName}</h4>
                              {curriculum.description && (
                                <p className="text-gray-600 leading-relaxed mt-3">
                                  {curriculum.description || curriculum.Description}
                                </p>
                              )}
                              {curriculum.syllabusUrl && (
                                <a 
                                  href={curriculum.syllabusUrl || curriculum.SyllabusUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary-dark underline text-sm mt-2 inline-block"
                                >
                                  View Syllabus
                                </a>
                              )}
                            </div>
                            
                            {units.length > 0 && (
                              <div className="mt-6">
                                <h5 className="font-semibold text-gray-900 mb-3">Units ({units.length})</h5>
                                <div className="space-y-2">
                                  {units.map((unit: any, idx: number) => {
                                    const unitId = unit.unitId || unit.UnitId || idx.toString();
                                    const isExpanded = expandedUnitId === unitId;
                                    const mathConcepts = unit.mathConcepts || unit.MathConcepts || [];
                                    const hasMathConcepts = Array.isArray(mathConcepts) && mathConcepts.length > 0;
                                    
                                    return (
                                      <div key={unitId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div 
                                          className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}
                                          onClick={() => setExpandedUnitId(isExpanded ? null : unitId)}
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                              <span className="text-primary font-semibold text-sm">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900">
                                                  {unit.unitName || unit.UnitName || `Unit ${idx + 1}`}
                                                </p>
                                                {hasMathConcepts && (
                                                  <span className="text-xs text-primary font-medium">
                                                    {mathConcepts.length} MathConcept{mathConcepts.length !== 1 ? 's' : ''}
                                                  </span>
                                                )}
                                              </div>
                                              {unit.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                  {unit.description || unit.Description}
                                                </p>
                                              )}
                                            </div>
                                            {hasMathConcepts && (
                                              <ChevronDown 
                                                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                              />
                                            )}
                                          </div>
                                        </div>
                                        
                                        {isExpanded && hasMathConcepts && (
                                          <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
                                            <h6 className="text-sm font-semibold text-gray-700 mb-3">MathConcepts:</h6>
                                            <div className="space-y-2">
                                              {mathConcepts.map((concept: any, conceptIdx: number) => (
                                                <div 
                                                  key={concept.conceptId || concept.ConceptId || conceptIdx}
                                                  className="bg-white rounded-lg p-3 border border-gray-200"
                                                >
                                                  <div className="flex items-start gap-2">
                                                    <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                      <p className="font-medium text-gray-900 text-sm">
                                                        {concept.name || concept.Name || 'Unnamed Concept'}
                                                      </p>
                                                      {concept.category && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                          Category: {concept.category || concept.Category}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {isExpanded && !hasMathConcepts && (
                                          <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
                                            <p className="text-sm text-gray-500 italic">No MathConcepts available for this unit.</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (course as any).curriculumId || (course as any).CurriculumId ? (
                          <div className="bg-gray-50 rounded-xl p-6">
                            <p className="text-gray-600">
                              Curriculum ID: {(course as any).curriculumId || (course as any).CurriculumId}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              Detailed curriculum information will be available soon.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-6">
                            <p className="text-gray-500 italic">
                              Curriculum details are not available for this package.
                            </p>
                            {course.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                This package includes {sessionCount} sessions covering essential topics 
                                with structured learning progression.
                              </p>
              )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'instructor' && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                        Instructor
                      </h3>
                      <div className="space-y-4 text-gray-700">
                        {course.instructor || (course as any).instructorName || (course as any).InstructorName ? (
                          <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                                <GraduationCap className="w-8 h-8 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {course.instructor || (course as any).instructorName || (course as any).InstructorName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {(course as any).instructorTitle || (course as any).InstructorTitle || 'Qualified and experienced educator'}
                                </p>
                              </div>
                            </div>
                            {(course as any).instructorBio || (course as any).InstructorBio ? (
                              <p className="text-gray-600 leading-relaxed">
                                {(course as any).instructorBio || (course as any).InstructorBio}
                              </p>
                            ) : (
                              <p className="text-gray-600">
                                Our instructors are highly qualified professionals with years of experience in teaching and 
                                helping students achieve their academic goals.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                                <GraduationCap className="w-8 h-8 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Expert Instructor</p>
                                <p className="text-sm text-gray-600">Qualified and experienced educator</p>
                              </div>
                            </div>
                            <p className="text-gray-500 italic">
                              Specific instructor information is not available for this package. 
                              Our team of qualified educators will be assigned based on student needs and availability.
                            </p>
                          </div>
              )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                        Reviews
                      </h3>
                      <div className="space-y-4 text-gray-700">
                        {course.rating || (course as any).averageRating || (course as any).AverageRating ? (
                          <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Star className="w-5 h-5 text-yellow-400 fill-current" />
                              <span className="font-semibold text-gray-900">
                                {course.rating || (course as any).averageRating || (course as any).AverageRating}
                              </span>
                              {(course as any).reviewCount || (course as any).ReviewCount ? (
                                <span className="text-sm text-gray-600">
                                  (Based on {(course as any).reviewCount || (course as any).ReviewCount} reviews)
                                </span>
                              ) : (
                                <span className="text-sm text-gray-600">(Based on student feedback)</span>
                              )}
                            </div>
                            {(course as any).reviews && Array.isArray((course as any).reviews) && (course as any).reviews.length > 0 ? (
                              <div className="space-y-4 mt-4">
                                {(course as any).reviews.slice(0, 5).map((review: any, idx: number) => (
                                  <div key={idx} className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star 
                                            key={i} 
                                            className={`w-4 h-4 ${i < (review.rating || review.Rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm font-semibold text-gray-700">
                                        {review.reviewerName || review.ReviewerName || 'Anonymous'}
                  </span>
                </div>
                                    <p className="text-gray-600 text-sm">
                                      {review.comment || review.Comment || review.feedback || review.Feedback}
                                    </p>
                                    {review.date && (
                                      <p className="text-xs text-gray-500 mt-2">
                                        {new Date(review.date || review.Date).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-600">
                                This package has received positive feedback from students who have completed the program.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Star className="w-5 h-5 text-gray-300" />
                              <span className="font-semibold text-gray-500">No ratings yet</span>
                            </div>
                            <p className="text-gray-500 italic">
                              This package doesn't have any reviews yet. Be the first to share your experience!
                            </p>
                          </div>
                      )}
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-float { animation: float 25s linear infinite; }
      `}} />
    </>
  );
};

export default PackageDetail;
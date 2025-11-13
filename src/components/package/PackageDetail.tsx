import React from "react";
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
} from "lucide-react";
import type { Course } from "../../types";
import { useAuth } from "../../hooks/useAuth";

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
  const bgColor = course.price === 0 ? "bg-emerald-50" : "bg-sky-50";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Packages
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN BLOCK */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Hero Image */}
              <div className="relative">
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={packageName}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div
                    className={`relative h-96 ${bgColor} flex items-center justify-center`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                    <div className="relative z-10 p-12">
                      <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                        <SubjectIcon className="w-20 h-20 text-emerald-600" />
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
                      <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center flex-shrink-0">
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
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
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
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Reschedule Allowed
                        </p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {maxReschedule} time{maxReschedule !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 sticky top-8">
              <div className="mb-8">
                <div className="text-5xl font-black text-gray-900">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(course.price || 0)}
                </div>
                {course.price === 0 && (
                  <div className="mt-3 inline-block px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-full">
                    FREE OF CHARGE
                  </div>
                )}
              </div>

              {onEnroll && course.status === "active" && (
                <button
                  onClick={() => onEnroll(course)}
                  className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-2xl hover:bg-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  Enroll Now
                </button>
              )}

              {isAdmin && onEdit && course.course_id && (
                <button
                  onClick={() => onEdit(course.course_id!)}
                  className="w-full mt-4 py-4 border-2 border-emerald-600 text-emerald-600 font-bold text-lg rounded-2xl hover:bg-emerald-50 transition-all"
                >
                  Edit Package
                </button>
              )}

              <div className="mt-8 pt-8 border-t border-gray-200 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sessions per week</span>
                  <span className="font-bold text-gray-900">
                    {sessionsPerWeek}
                  </span>
                </div>
                {course.start_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-bold text-gray-900">
                      {new Date(course.start_date).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetail;
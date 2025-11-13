import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Loader,
  Filter,
  Sparkles,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PackageCard from "./PackageCard";
import type { Course } from "../../types";
import { apiService } from "../../services/api";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";

interface PackageListProps {
  centerId?: string;
  onViewPackage?: (packageId: string) => void;
  onEditPackage?: (packageId: string) => void;
  onCreatePackage?: () => void;
  onEnrollPackage?: (pkg: Course) => void;
}

const PackageList: React.FC<PackageListProps> = ({
  centerId,
  onViewPackage,
  onEditPackage,
  onCreatePackage,
  onEnrollPackage,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showError } = useToast();
  const isAdmin = user?.role === "admin";

  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, [centerId]);

  useEffect(() => {
    applyFilters();
  }, [courses, categoryFilter, statusFilter, levelFilter, searchQuery]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAllPackages();
      if (!response.success)
        throw new Error(response.error || "Failed to fetch packages");

      let packagesData: any[] = [];
      const data = response.data as any;
      if (Array.isArray(data)) packagesData = data;
      else if (data?.data) packagesData = data.data;
      else if (data?.items) packagesData = data.items;
      else if (data?.packages) packagesData = data.packages;

      const filteredPackages = centerId
        ? packagesData.filter(
            (pkg: any) =>
              pkg.center_id === centerId || pkg.CenterId === centerId
          )
        : packagesData;

      const mappedPackages = filteredPackages.map((pkg: any) => {
        const sessionCount = pkg.SessionCount || pkg.sessionCount || 0;
        const durationDays = pkg.DurationDays || pkg.durationDays || 0;
        const weeksNeeded =
          durationDays > 0
            ? Math.ceil(durationDays / 7)
            : Math.ceil(sessionCount / 3);

        return {
          course_id: pkg.PackageId || pkg.packageId || pkg.id || "",
          name: pkg.PackageName || pkg.packageName || pkg.name || "",
          description: pkg.Description || pkg.description || "",
          category: pkg.Grade || pkg.grade || "General",
          level: "Intermediate",
          price: pkg.Price || pkg.price || 0,
          duration_weeks: weeksNeeded,
          session_count: sessionCount,
          grade: pkg.Grade || pkg.grade || "",
          status: "active",
          max_students: 0,
          current_students: 0,
          start_date: "",
          end_date: "",
          schedule: "",
          image_url: "",
          center_id: pkg.CenterId || pkg.centerId || "",
          center_name: pkg.CenterName || pkg.centerName || "",
          packageId: pkg.PackageId || pkg.packageId || "",
          packageName: pkg.PackageName || pkg.packageName || "",
          sessionCount,
          durationDays,
          sessionsPerWeek: pkg.SessionsPerWeek || pkg.sessionsPerWeek || 3,
          maxReschedule: pkg.MaxReschedule || pkg.maxReschedule || 0,
        };
      });

      setCourses(mappedPackages);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch packages";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (c) => c.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter(
        (c) => c.level?.toLowerCase() === levelFilter.toLowerCase()
      );
    }

    setFilteredCourses(filtered);
  };

  const categories = [
    "all",
    ...Array.from(new Set(courses.map((c) => c.category))),
  ];
  const levels = ["all", "Beginner", "Intermediate", "Advanced"];
  const statuses = ["all", "active", "upcoming", "completed", "cancelled"];

  // Loading State - Siêu đẹp
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-3xl blur-3xl opacity-50 animate-pulse"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl animate-spin">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Discover Amazing Packages
          </h2>
          <p className="text-lg text-gray-600">
            Loading the best learning experiences for you...
          </p>
          <div className="mt-8 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-8">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-200 p-12 max-w-md text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <X className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Oops! Something went wrong
          </h3>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={fetchCourses}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header - Trắng + Xanh lá, nhỏ gọn, bo tròn */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-300 p-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-white">
              <h1 className="text-4xl sm:text-4xl font-bold mb-2 leading-tight">
                {centerId
                  ? "Center Learning Packages"
                  : "Explore Premium Packages"}
              </h1>
              <p className="text-lg opacity-95">
                Unlock your child's potential with our curated learning programs
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl font-bold">
                  {filteredCourses.length}
                </span>
                <span className="text-base opacity-90">Packages available</span>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() =>
                  onCreatePackage
                    ? onCreatePackage()
                    : navigate("/packages/create")
                }
                className="group px-6 py-3 bg-white text-emerald-600 font-bold text-base rounded-xl shadow-md hover:shadow-lg hover:bg-emerald-50 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                <span>Add New Package</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Grade Filter - Đã in hoa G */}
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-200">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent focus:outline-none text-gray-700 font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all"
                        ? "All Grades"
                        : cat.toLowerCase().startsWith("grade")
                        ? cat.charAt(0).toUpperCase() + cat.slice(1)
                        : `Grade ${cat}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-gray-700 font-medium"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level === "all" ? "All Levels" : level}
                  </option>
                ))}
              </select>

              {/* Status Filter - ĐÃ XÓA Completed & Cancelled */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-gray-700 font-medium"
              >
                {["all", "active", "upcoming"].map((status) => (
                  <option key={status} value={status}>
                    {status === "all"
                      ? "All Status"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-20 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <BookOpen className="w-16 h-16 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              No packages found
            </h3>
            <p className="text-xl text-gray-600 mb-10 max-w-md mx-auto">
              {courses.length === 0
                ? "Let's create your first amazing learning package!"
                : "Try adjusting your filters or search for something new"}
            </p>
            {isAdmin && courses.length === 0 && (
              <button
                onClick={() =>
                  onCreatePackage
                    ? onCreatePackage()
                    : navigate("/packages/create")
                }
                className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold text-lg rounded-2xl hover:from-indigo-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Create Your First Package
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCourses.map((course, index) => {
              const packageId =
                course.course_id || (course as any).packageId || "";
              return (
                <div
                  key={packageId || `package-${index}`}
                  className="transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                >
                  <PackageCard
                    course={course}
                    onView={(id) =>
                      onViewPackage
                        ? onViewPackage(id)
                        : navigate(`/packages/${id}`)
                    }
                    onEdit={
                      isAdmin
                        ? (id) =>
                            onEditPackage
                              ? onEditPackage(id)
                              : navigate(`/packages/${id}/edit`, {
                                  state: { course },
                                })
                        : undefined
                    }
                    onEnroll={onEnrollPackage}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageList;

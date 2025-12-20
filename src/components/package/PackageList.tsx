import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
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

const ITEMS_PER_PAGE = 12; // 3x4 grid đẹp nhất

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCourses();
  }, [centerId]);

  // Reset trang khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, levelFilter]);

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
          image_url: pkg.ImageUrl || pkg.imageUrl || pkg.image_url || "",
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

  // Lọc + Phân trang
  const { filteredCourses, totalPages, startIndex, endIndex } = useMemo(() => {
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

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginated = filtered.slice(start, end);

    return {
      filteredCourses: paginated,
      totalPages,
      startIndex: Math.min(start + 1, total),
      endIndex: Math.min(end, total),
      totalItems: total,
    };
  }, [courses, searchQuery, categoryFilter, statusFilter, levelFilter, currentPage]);

  // Get unique categories and sort them by grade number
  const uniqueCategories = Array.from(new Set(courses.map((c) => c.category))).filter(Boolean);
  const sortedCategories = uniqueCategories.sort((a, b) => {
    // Extract grade number from strings like "grade 9", "grade 10", etc.
    const getGradeNumber = (str: string): number => {
      const match = str.toLowerCase().match(/grade\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 999;
    };
    return getGradeNumber(a) - getGradeNumber(b);
  });

  const categories = ["all", ...sortedCategories];
  const levels = ["all", "Beginner", "Intermediate", "Advanced"];
  const statuses = ["all", "active", "upcoming"];

  // Loading State
  if (loading) {
    return (
      <div className="w-full">
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
        <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="relative mb-8">
              <div className="relative w-32 h-32 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-math-lg animate-bounce">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
            </div>
            <h2 className="text-3xl font-bold text-primary-dark mb-3">
            Discovering Amazing Packages
          </h2>
          <p className="text-lg text-gray-600">
            Loading the best learning experiences...
          </p>
        </div>
      </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
          }
          .animate-float { animation: float 25s linear infinite; }
        `}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        {/* Subtle Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
        </div>
        <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-12 max-w-md text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-accent-red to-accent-orange rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-white" />
          </div>
            <h3 className="text-2xl font-bold text-primary-dark mb-3">Oops!</h3>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={fetchCourses}
              className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-math hover:shadow-math-lg"
          >
            Try Again
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="w-full">
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
      {/* Hero Header */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-white">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-3">
                {centerId ? "Center Packages" : "Explore Premium Packages"}
              </h1>
                    <p className="text-lg sm:text-xl opacity-95 mb-4">
                Unlock your child's potential with our curated programs
              </p>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold">
                  {courses.length}
                </span>
                      <span className="text-lg opacity-90">Total Packages</span>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() =>
                  onCreatePackage
                    ? onCreatePackage()
                    : navigate("/packages/create")
                }
                      className="group px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-math hover:shadow-math-lg hover:bg-background-cream transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Add New Package
              </button>
            )}
                </div>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search packages by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-200">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent focus:outline-none text-gray-700 font-medium"
                >
                  {categories.map((cat) => {
                    // Format display text: if cat already contains "grade", use it as is, otherwise add "Grade"
                    const displayText = cat === "all" 
                      ? "All Grades" 
                      : cat.toLowerCase().includes("grade") 
                        ? cat.charAt(0).toUpperCase() + cat.slice(1)
                        : `Grade ${cat}`;
                    return (
                      <option key={cat} value={cat}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 font-medium"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level === "all" ? "All Levels" : level}
                  </option>
                ))}
              </select> */}

              {/* <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 font-medium"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select> */}
            </div>
          </div>
        </div>

        {/* Results Info + Pagination Top */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 font-medium">
            Showing <span className="font-bold text-primary">{startIndex}–{endIndex}</span> of{" "}
            <span className="font-bold text-primary">{courses.length}</span> packages
          </p>
        </div>

        {/* Packages Grid */}
        {courses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-20 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary-dark/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <BookOpen className="w-16 h-16 text-primary" />
            </div>
              <h3 className="text-3xl font-bold text-primary-dark mb-4">
              No packages yet
            </h3>
            <p className="text-xl text-gray-600 mb-10">
              Let's create your first amazing learning package!
            </p>
            {isAdmin && (
              <button
                onClick={() => onCreatePackage?.() || navigate("/packages/create")}
                  className="px-10 py-5 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-dark transition-all shadow-math hover:shadow-math-lg"
              >
                Create First Package
              </button>
            )}
          </div>
        ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-12 text-center">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-primary-dark">No packages match your filters</h3>
            <p className="text-gray-500 mt-3">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredCourses.map((course, index) => {
                const packageId = course.course_id || (course as any).packageId || "";
                return (
                  <div
                    key={packageId || `pkg-${index}`}
                    className="transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                  >
                    <PackageCard
                      course={course}
                      onView={(id) =>
                        onViewPackage ? onViewPackage(id) : navigate('/packages/detail', { state: { packageId: id } })
                      }
                      onEdit={
                        isAdmin
                          ? (id) =>
                              onEditPackage
                                ? onEditPackage(id)
                                : navigate('/packages/edit', { state: { packageId: id, course } })
                          : undefined
                      }
                      onEnroll={onEnrollPackage}
                    />
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all flex items-center gap-2 font-medium"
                >
                  <ChevronLeft className="w-5 h-5" /> Previous
                </button>

                <div className="flex items-center gap-2">
                  {(() => {
                    // Chỉ hiển thị 5 số trang
                    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
                    const endPage = Math.min(startPage + 4, totalPages);
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    return pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-12 h-12 rounded-xl font-bold transition-all ${
                          currentPage === page
                            ? "bg-primary text-white shadow-math"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all flex items-center gap-2 font-medium"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Bottom Results Info */}
            <div className="text-center mt-8 text-gray-500 text-sm">
              Page <span className="font-bold text-primary">{currentPage}</span> of{" "}
              <span className="font-bold">{totalPages}</span>
            </div>
          </>
        )}
      </div>
    </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-float { animation: float 25s linear infinite; }
      `}} />
    </div>
  );
};

export default PackageList;
import React from 'react';
import { ArrowLeft, Calendar, Users, DollarSign, Clock, GraduationCap, MapPin, BookOpen, Star, Info } from 'lucide-react';
import type { Course } from '../../types';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onEdit?: (courseId: string) => void;
  onEnroll?: (course: Course) => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ course, onBack, onEdit, onEnroll }) => {
  const enrollmentRate = course.max_students && course.current_students
    ? ((course.current_students / course.max_students) * 100).toFixed(0)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      case 'upcoming':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'completed':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'intermediate':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'advanced':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Mocked supplementary data for demo UI similar to Coursera
  const learnings: string[] = [
    'Develop a DevOps mindset and practice Agile philosophy & Scrum methodology',
    'Build microservices and deploy using containers (Docker, Kubernetes, OpenShift)',
    'Create Python applications using REST APIs and common libraries',
    'Employ tools for CI/CD including GitHub Actions and Tekton'
  ];

  const skills: string[] = [
    'Continuous Integration',
    'Application Development',
    'Cloud Computing Architecture',
    'Linux Commands',
    'Agile Software Development',
    'Software Development Life Cycle',
    'Software Architecture'
  ];

  const tools: string[] = [
    'Kubernetes',
    'Flask (Web Framework)',
    'Git (Version Control System)',
    'OWASP',
    'Grafana'
  ];

  const syllabus: Array<{ title: string; hours: number }> = [
    { title: 'Introduction to DevOps', hours: 9 },
    { title: 'Introduction to Cloud Computing', hours: 12 },
    { title: 'Agile Development and Scrum', hours: 11 },
    { title: 'Introduction to Software Engineering', hours: 14 },
    { title: 'Getting Started with Git and GitHub', hours: 10 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Courses</span>
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {course.image_url && (
              <div className="relative h-64 overflow-hidden">
                <img
                  src={course.image_url}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(course.status || 'upcoming')}`}>
                    {course.status || 'upcoming'}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getLevelColor(course.level || 'Beginner')}`}>
                    {course.level || 'Beginner'}
                  </span>
                </div>
              </div>
            )}

            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {course.name || 'Course Name'}
                  </h1>
                  {course.center_name && (
                    <div className="flex items-center space-x-2 text-lg text-gray-600 mb-4">
                      <MapPin className="w-5 h-5" />
                      <span>{course.center_name}</span>
                    </div>
                  )}
                </div>
                {!course.image_url && (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ml-6">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>

              {/* Primary CTA row like Coursera */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Enroll for free</button>
                <div className="text-sm text-gray-600">Try for free: Enroll to start your 7‑day full access free trial</div>
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                <div className="p-4 rounded-2xl border border-gray-200">
                  <div className="text-sm text-gray-600">{syllabus.length} course series</div>
                  <div className="text-xs text-gray-500">Earn a credential to demonstrate expertise</div>
                </div>
                <div className="p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold">4.7</span>
                    <span className="text-sm text-gray-500">(5,567 reviews)</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-gray-200">
                  <div className="text-sm text-gray-600">{(course.level || 'Beginner')} level</div>
                  <div className="text-xs text-gray-500">Learn at your own pace</div>
                </div>
                <div className="p-4 rounded-2xl border border-gray-200">
                  <div className="text-sm text-gray-600">Flexible schedule</div>
                  <div className="text-xs text-gray-500">6 months at 10 hours a week</div>
                </div>
              </div>

              {/* About section */}
              {course.description && (
                <div className="mb-8" id="about">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">What you'll learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {learnings.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-emerald-600 mt-1">✓</span>
                        <p className="text-gray-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900">Category</h4>
                  </div>
                  <p className="text-gray-700 font-semibold">{course.category || 'N/A'}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900">Price</h4>
                  </div>
                  <p className="text-gray-700 font-semibold text-xl">${course.price || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900">Duration</h4>
                  </div>
                  <p className="text-gray-700 font-semibold">{course.duration_weeks || 0} weeks</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900">Students</h4>
                  </div>
                  <p className="text-gray-700 font-semibold">
                    {course.current_students || 0}/{course.max_students || 0}
                  </p>
                </div>

                {course.start_date && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900">Start Date</h4>
                    </div>
                    <p className="text-gray-700 font-semibold">
                      {new Date(course.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {course.schedule && (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900">Schedule</h4>
                    </div>
                    <p className="text-gray-700 font-semibold">{course.schedule}</p>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Skills you'll gain</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">{s}</span>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Tools you'll learn</h3>
                <div className="flex flex-wrap gap-2">
                  {tools.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">{t}</span>
                  ))}
                </div>
              </div>

              {/* Enrollment Progress */}
              {enrollmentRate !== '0' && (
                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Enrollment Progress</span>
                    <span className="font-bold text-blue-600">{enrollmentRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${enrollmentRate}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Syllabus */}
              <div className="mb-10" id="courses">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Courses in this series</h3>
                <div className="divide-y rounded-2xl border border-gray-200 overflow-hidden">
                  {syllabus.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">{i + 1}</div>
                        <div>
                          <div className="font-semibold text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">Course {i + 1} • {item.hours} hours</div>
                        </div>
                      </div>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                {onEnroll && course.status === 'active' && course.current_students && course.max_students && course.current_students < course.max_students && (
                  <button
                    onClick={() => onEnroll(course)}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Enroll Now
                  </button>
                )}
                {onEdit && course.course_id && (
                  <button
                    onClick={() => onEdit(course.course_id)}
                    className="flex-1 px-8 py-4 bg-white border-2 border-blue-200 text-blue-700 text-lg font-semibold rounded-xl hover:bg-blue-50 hover:border-blue-300 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Edit Course
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

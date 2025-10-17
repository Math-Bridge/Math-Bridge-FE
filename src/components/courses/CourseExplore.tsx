import React from 'react';
import CourseCard from './CourseCard';
import type { Course } from '../../types';

export interface CourseSection {
  title: string;
  subtitle?: string;
  courses: Course[];
  onShowMore?: () => void;
}

interface CourseExploreProps {
  sections: CourseSection[];
  onViewCourse?: (courseId: string) => void;
}

const CourseExplore: React.FC<CourseExploreProps> = ({ sections, onViewCourse }) => {
  return (
    <div className="space-y-10">
      {sections.map((section, idx) => (
        <div key={`${section.title}-${idx}`} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              {section.subtitle && (
                <p className="text-gray-600 mt-1">{section.subtitle}</p>
              )}
            </div>
            {section.onShowMore && (
              <button
                onClick={section.onShowMore}
                className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Show 8 more
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {section.courses.slice(0, 8).map((course) => (
              <CourseCard key={course.course_id} course={course} onView={onViewCourse} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseExplore;



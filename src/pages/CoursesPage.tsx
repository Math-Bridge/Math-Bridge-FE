import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseList } from '../components/courses';
import CourseExplore from '../components/courses/CourseExplore';

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const coursesMock = [
    {
      course_id: 'c1',
      name: 'Algebra I Fundamentals',
      description: 'Master the foundations of algebra with interactive lessons and practice.',
      category: 'Mathematics',
      level: 'Beginner',
      duration_weeks: 8,
      price: 499000,
      max_students: 25,
      current_students: 12,
      start_date: new Date().toISOString(),
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop',
      center_id: 'ct1',
      center_name: 'MathBridge Center District 1'
    },
    {
      course_id: 'c2',
      name: 'Geometry Essentials',
      description: 'Angles, triangles, and proofs with step-by-step guidance.',
      category: 'Mathematics',
      level: 'Intermediate',
      duration_weeks: 6,
      price: 599000,
      max_students: 20,
      current_students: 20,
      start_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'completed',
      image_url: 'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?q=80&w=1200&auto=format&fit=crop',
      center_id: 'ct2',
      center_name: 'MathBridge Center Thu Duc'
    },
    {
      course_id: 'c3',
      name: 'Calculus Prep',
      description: 'Limits, derivatives, and integrals—get ready for university math.',
      category: 'Mathematics',
      level: 'Advanced',
      duration_weeks: 10,
      price: 899000,
      max_students: 30,
      current_students: 5,
      start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
      status: 'upcoming',
      image_url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=1200&auto=format&fit=crop',
      center_id: 'ct3',
      center_name: 'MathBridge Center Tan Binh'
    }
  ];
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <CourseExplore
          sections={[
            {
              title: 'Explore',
              subtitle: 'What do you want to learn?',
              courses: coursesMock,
              onShowMore: () => {}
            },
            {
              title: 'Explore with a Coursera Plus Subscription',
              courses: coursesMock,
              onShowMore: () => {}
            }
          ]}
          onViewCourse={(id) => {
            const course = coursesMock.find(c => c.course_id === id);
            navigate(`/courses/${id}`, { state: { course } });
          }}
        />
      </div>
    </div>
  );
};

export default CoursesPage;



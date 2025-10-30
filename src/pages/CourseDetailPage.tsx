import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CourseDetail } from '../components/courses';
import { getCourseById } from '../services/api';
import type { Course } from '../types';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);

      // Try to get course from navigation state first
      const courseFromState = location.state?.course as Course;
      if (courseFromState && courseFromState.course_id === courseId) {
        setCourse(courseFromState);
        setLoading(false);
        return;
      }

      if (!courseId) {
        setError('Course ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await getCourseById(courseId);
        if (response.success && response.data) {
          setCourse(response.data);
        } else {
          setError(response.error || 'Failed to fetch course details.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate, location.state]);

  const handleBack = () => {
    navigate('/courses');
  };

  const handleEdit = (id: string) => {
    navigate(`/courses/${id}/edit`, { state: { course } });
  };

  const handleEnroll = (enrollingCourse: Course) => {
    console.log('Enrolling in course:', enrollingCourse.name);
    alert(`Enrolled in course: ${enrollingCourse.name}`);
  };

  if (loading) {
    return <div className="text-center py-12">Loading course details...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  }

  if (!course) {
    return <div className="text-center py-12">Course not found.</div>;
  }

  return (
    <CourseDetail
      course={course}
      onBack={handleBack}
      onEdit={handleEdit}
      onEnroll={handleEnroll}
    />
  );
};

export default CourseDetailPage;






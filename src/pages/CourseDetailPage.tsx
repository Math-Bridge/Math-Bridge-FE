import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseDetail } from '../components/courses';
import type { Course } from '../types';
import { getCourseById } from '../services/api';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>((() => {
    // Try to hydrate from navigation state first (for mock/demo flows)
    const navState = (window.history.state && (window.history.state as any).usr) || undefined;
    if (navState && navState.course) {
      return navState.course as Course;
    }
    return null;
  })());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have course from state (mock), skip fetching
    if (course) {
      setLoading(false);
      return;
    }
    const fetchCourse = async () => {
      if (!courseId) {
        setError('Course ID is missing');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const res = await getCourseById(courseId);
      if (res.success && res.data) {
        setCourse(res.data);
      } else {
        setError(res.error || 'Failed to load course');
      }
      setLoading(false);
    };
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 mb-4">{error || 'Course not found'}</p>
          <button onClick={() => navigate('/courses')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Back</button>
        </div>
      </div>
    );
  }

  return (
    <CourseDetail
      course={course}
      onBack={() => navigate('/courses')}
      onEdit={(id) => navigate(`/courses/${id}/edit`)}
      onEnroll={() => navigate('/user-wallet')}
    />
  );
};

export default CourseDetailPage;



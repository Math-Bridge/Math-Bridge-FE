import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseForm } from '../components/courses';
import type { Course } from '../types';
import { createCourse, getCourseById, updateCourse } from '../services/api';

const CourseFormPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(!!courseId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!courseId) return;
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
    fetch();
  }, [courseId]);

  const handleSave = async (data: Course) => {
    if (courseId) {
      await updateCourse(courseId, data);
    } else {
      await createCourse(data as any);
    }
    navigate('/courses');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <CourseForm
          course={course || undefined}
          onSave={handleSave}
          onCancel={() => navigate('/courses')}
        />
      </div>
    </div>
  );
};

export default CourseFormPage;



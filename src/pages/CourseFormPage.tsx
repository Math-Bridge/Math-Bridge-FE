import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CourseForm } from '../components/courses';
import type { Course } from '../types';

const CourseFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course as Course | undefined;
  const isEdit = !!course;

  const handleSave = (courseData: Course) => {
    console.log('Saving course:', courseData);
    // Here you would typically call an API to save the course
    alert(`Course ${isEdit ? 'updated' : 'created'} successfully!`);
    navigate('/courses');
  };

  const handleCancel = () => {
    navigate('/courses');
  };

  return (
    <CourseForm
      course={course}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default CourseFormPage;

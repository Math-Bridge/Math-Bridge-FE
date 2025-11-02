import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PackageForm } from '../components/package';
import { useToast } from '../contexts/ToastContext';
import type { Course } from '../types';

const PackageFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const course = location.state?.course as Course | undefined;
  const isEdit = !!course;

  const handleSave = (courseData: Course) => {
    console.log('Saving package:', courseData);
    // Here you would typically call an API to save the package
    showSuccess(`Package ${isEdit ? 'updated' : 'created'} successfully!`);
    navigate('/packages');
  };

  const handleCancel = () => {
    navigate('/packages');
  };

  return (
    <PackageForm
      course={course}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default PackageFormPage;


import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PackageDetail } from '../components/package';
import { getPackageById } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useHideIdInUrl } from '../hooks/useHideIdInUrl';
import type { Course } from '../types';

const PackageDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const packageId = (location.state as any)?.packageId || (location.state as any)?.id;
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  useHideIdInUrl(); // Hide ID in URL bar
  const isAdmin = user?.role === 'admin';
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackage = async () => {
      setLoading(true);
      setError(null);

      // Try to get package from navigation state first
      const packageFromState = location.state?.course as Course;
      if (packageFromState) {
        setCourse(packageFromState);
        setLoading(false);
        return;
      }

      if (!packageId) {
        setError('Package ID is missing.');
        setLoading(false);
        navigate('/packages');
        return;
      }

      try {
        // Use packageId to fetch package
        const response = await getPackageById(packageId);
        if (response.success && response.data) {
          // Map ImageUrl from API to image_url for Course type
          const packageData = response.data as any;
          const mappedCourse: Course = {
            ...packageData,
            course_id: packageData.PackageId || packageData.packageId || packageData.course_id || packageId,
            name: packageData.PackageName || packageData.packageName || packageData.name,
            description: packageData.Description || packageData.description,
            category: packageData.Grade || packageData.grade || packageData.category,
            price: packageData.Price || packageData.price,
            image_url: packageData.ImageUrl || packageData.imageUrl || packageData.image_url,
            center_id: packageData.CenterId || packageData.centerId || packageData.center_id,
            center_name: packageData.CenterName || packageData.centerName || packageData.center_name,
            duration_weeks: packageData.DurationDays ? Math.ceil(packageData.DurationDays / 7) : packageData.duration_weeks,
          };
          setCourse(mappedCourse);
        } else {
          setError(response.error || 'Failed to fetch package details.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [packageId, location.state]);

  const handleBack = () => {
    navigate('/packages');
  };

  const handleEdit = (id: string) => {
    navigate('/packages/edit', { state: { packageId: id, course } });
  };

  const handleEnroll = (enrollingPackage: Course) => {
    console.log('Enrolling in package:', enrollingPackage.name);
    showSuccess(`Enrolled in package: ${enrollingPackage.name}`);
  };

  if (loading) {
    return <div className="text-center py-12">Loading package details...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  }

  if (!course) {
    return <div className="text-center py-12">Package not found.</div>;
  }

  return (
    <PackageDetail
      course={course}
      onBack={handleBack}
      onEdit={isAdmin ? handleEdit : undefined}
      onEnroll={handleEnroll}
    />
  );
};

export default PackageDetailPage;


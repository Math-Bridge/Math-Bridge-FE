import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PackageDetail } from '../components/package';
import { getPackageById } from '../services/api';
import type { Course } from '../types';
import { useAuth } from '../hooks/useAuth';

const PackageDetailPage: React.FC = () => {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
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
      if (packageFromState && (packageFromState.course_id === packageId || packageFromState.packageId === packageId)) {
        setCourse(packageFromState);
        setLoading(false);
        return;
      }

      if (!packageId) {
        setError('Package ID is missing.');
        setLoading(false);
        return;
      }

      try {
        // Use packageId to fetch package
        const response = await getPackageById(packageId);
        if (response.success && response.data) {
          setCourse(response.data);
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
  }, [packageId, navigate, location.state]);

  const handleBack = () => {
    navigate('/packages');
  };

  const handleEdit = (id: string) => {
    navigate(`/packages/${id}/edit`, { state: { course } });
  };

  const handleEnroll = (enrollingPackage: Course) => {
    console.log('Enrolling in package:', enrollingPackage.name);
    alert(`Enrolled in package: ${enrollingPackage.name}`);
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


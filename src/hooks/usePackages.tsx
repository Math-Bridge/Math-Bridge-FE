import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export interface Package {
  id: string;
  title: string;
  description: string;
  price: number;
  duration?: string;
  rating?: number;
  imageUrl?: string;
  [key: string]: any;
}

interface UsePackagesResult {
  packages: Package[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePackages = (
  enabled: boolean = true
): UsePackagesResult => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllPackages();

      if (response.success && response.data) {
        // Map the response data to Package format
        const mappedPackages: Package[] = (Array.isArray(response.data) ? response.data : []).map((pkg: any) => ({
          id: pkg.id || pkg.packageId || pkg.courseId || pkg.course_id || pkg.PackageId || '',
          title: pkg.PackageName || pkg.packageName || pkg.title || pkg.name || pkg.courseName || pkg.course_name || 'Untitled Package',
          description: pkg.description || pkg.Description || '',
          price: pkg.price || pkg.Price || 0,
          duration: pkg.duration || pkg.duration_weeks ? `${pkg.duration_weeks} weeks` : undefined,
          rating: pkg.rating || pkg.Rating || undefined,
          imageUrl: pkg.ImageUrl || pkg.imageUrl || pkg.image_url || undefined,
          ...pkg
        }));
        setPackages(mappedPackages);
      } else {
        setError(response.error || 'Failed to fetch packages');
        setPackages([]);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch packages');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [enabled]);

  return {
    packages,
    loading,
    error,
    refetch: fetchPackages
  };
};



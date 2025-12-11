import { useState, useEffect } from 'react';
import { getAllTutors, Tutor } from '../services/api';

export interface TutorDisplay {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviews: number;
  [key: string]: any;
}

interface UseTutorsResult {
  tutors: TutorDisplay[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTutors = (
  enabled: boolean = true,
  refetchInterval?: number
): UseTutorsResult => {
  const [tutors, setTutors] = useState<TutorDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTutors = async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getAllTutors();

      if (response.success && response.data) {
        // Map the Tutor data to TutorDisplay format
        const mappedTutors: TutorDisplay[] = (Array.isArray(response.data) ? response.data : []).map((tutor: Tutor) => ({
          id: tutor.userId || tutor.id || '',
          name: tutor.fullName || tutor.name || 'Unknown Tutor',
          avatar: tutor.avatarUrl || tutor.profilePictureUrl || '/images/default-avatar.png',
          rating: tutor.rating || 0,
          reviews: tutor.studentCount || 0,
          ...tutor
        }));
        setTutors(mappedTutors);
      } else {
        setError(response.error || 'Failed to fetch tutors');
        setTutors([]);
      }
    } catch (err) {
      console.error('Error fetching tutors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tutors');
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();

    let intervalId: NodeJS.Timeout | null = null;
    if (refetchInterval && refetchInterval > 0) {
      intervalId = setInterval(fetchTutors, refetchInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, refetchInterval]);

  return {
    tutors,
    loading,
    error,
    refetch: fetchTutors
  };
};




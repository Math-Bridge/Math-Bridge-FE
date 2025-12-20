import { useState, useEffect } from 'react';
import { getAllTutors, Tutor, apiService } from '../services/api';

export interface TutorDisplay {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
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
  enabled: boolean = true
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
        // Map the Tutor data to TutorDisplay format with avatar fetching
        const tutorPromises = (Array.isArray(response.data) ? response.data : []).map(async (tutor: Tutor) => {
          // Try to get avatarUrl from tutor data first
          let avatarUrl = tutor.avatarUrl || tutor.profilePictureUrl;
          
          // If no avatarUrl, fetch from User API
          if (!avatarUrl && tutor.userId) {
            try {
              const userResponse = await apiService.getUserById(tutor.userId);
              if (userResponse.success && userResponse.data) {
                avatarUrl = userResponse.data.avatarUrl || userResponse.data.AvatarUrl || undefined;
              }
            } catch (err) {
              // Silently fail, will use fallback
              if (import.meta.env.DEV) {
                console.warn(`Failed to fetch avatar for tutor ${tutor.userId}:`, err);
              }
            }
          }
          
          // Fallback to generated avatar if still no avatarUrl
          if (!avatarUrl) {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.fullName || tutor.name || 'Tutor')}&size=400&background=FF6B35&color=ffffff&bold=true`;
          }
          
          return {
            id: tutor.userId || tutor.id || '',
            name: tutor.fullName || tutor.name || 'Unknown Tutor',
            avatar: avatarUrl,
            avatarUrl: avatarUrl,
            rating: tutor.rating || 0,
            reviews: tutor.studentCount || 0,
            ...tutor
          };
        });
        
        const mappedTutors = await Promise.all(tutorPromises);
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
  }, [enabled]);

  return {
    tutors,
    loading,
    error,
    refetch: fetchTutors
  };
};














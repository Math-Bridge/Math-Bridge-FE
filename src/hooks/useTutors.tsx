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

// Helper function to fetch avatar with timeout
const fetchAvatarWithTimeout = async (userId: string, timeout: number = 3000): Promise<string | undefined> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const userResponse = await apiService.getUserById(userId);
    clearTimeout(timeoutId);
    
    if (userResponse.success && userResponse.data) {
      return userResponse.data.avatarUrl || userResponse.data.AvatarUrl || undefined;
    }
  } catch (err) {
    // Silently fail, will use fallback
    if (import.meta.env.DEV) {
      console.warn(`Failed to fetch avatar for tutor ${userId}:`, err);
    }
  }
  return undefined;
};

// Helper function to process tutors in batches
const processBatch = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(processor)
    );
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.warn('Failed to process tutor:', result.reason);
      }
    });
    
    // Small delay between batches to avoid overwhelming the server
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return results;
};

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
        const tutorsData = Array.isArray(response.data) ? response.data : [];
        
        // First, map tutors that already have avatarUrl (no need to fetch)
        const tutorsWithAvatar = tutorsData
          .filter((tutor: Tutor) => tutor.avatarUrl || tutor.profilePictureUrl)
          .map((tutor: Tutor) => {
            const avatarUrl = tutor.avatarUrl || tutor.profilePictureUrl || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.fullName || tutor.name || 'Tutor')}&size=400&background=FF6B35&color=ffffff&bold=true`;
            
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
        
        // Then, process tutors that need avatar fetching in batches
        const tutorsNeedingAvatar = tutorsData.filter(
          (tutor: Tutor) => !tutor.avatarUrl && !tutor.profilePictureUrl && tutor.userId
        );
        
        const tutorsWithFetchedAvatar = await processBatch(
          tutorsNeedingAvatar,
          3, // Process 3 tutors at a time
          async (tutor: Tutor) => {
            let avatarUrl: string | undefined;
            
            // Try to fetch from User API with timeout
            if (tutor.userId) {
              avatarUrl = await fetchAvatarWithTimeout(tutor.userId, 2000);
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
          }
        );
        
        // Combine both arrays
        const mappedTutors = [...tutorsWithAvatar, ...tutorsWithFetchedAvatar];
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














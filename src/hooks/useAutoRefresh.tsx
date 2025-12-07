import { useEffect, useCallback, useRef } from 'react';

interface UseAutoRefreshOptions {
  /**
   * Function to fetch/refresh data
   */
  fetchData: () => Promise<void> | void;
  
  /**
   * Interval in milliseconds (default: 5000 = 5 seconds)
   */
  interval?: number;
  
  /**
   * Whether auto-refresh is enabled (default: true)
   */
  enabled?: boolean;
  
  /**
   * Whether to fetch immediately on mount (default: true)
   */
  fetchOnMount?: boolean;
  
  /**
   * Dependencies array - refresh when these change
   */
  dependencies?: React.DependencyList;
}

/**
 * Custom hook for auto-refreshing data without page reload
 * Similar to WalletComponent's auto-refresh pattern
 * 
 * @example
 * ```tsx
 * const { refresh, isRefreshing } = useAutoRefresh({
 *   fetchData: async () => {
 *     const data = await apiService.getData();
 *     setData(data);
 *   },
 *   interval: 5000, // Refresh every 5 seconds
 *   enabled: true
 * });
 * ```
 */
export const useAutoRefresh = ({
  fetchData,
  interval = 5000,
  enabled = true,
  fetchOnMount = true,
  dependencies = []
}: UseAutoRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const executeFetch = useCallback(async () => {
    // Prevent concurrent fetches
    if (isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      await fetchData();
    } catch (error) {
      console.error('Error in auto-refresh:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    executeFetch();
  }, [executeFetch]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Fetch immediately on mount if enabled
    if (fetchOnMount) {
      executeFetch();
    }

    // Set up interval for auto-refresh
    intervalRef.current = setInterval(() => {
      executeFetch();
    }, interval);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, fetchOnMount, executeFetch, ...dependencies]);

  return {
    /**
     * Manually trigger a refresh
     */
    refresh,
    
    /**
     * Whether a refresh is currently in progress
     */
    isRefreshing: isRefreshingRef.current
  };
};










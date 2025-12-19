/**
 * Centralized error handling utilities
 */

import { ERROR_MESSAGES, HTTP_STATUS, EXPECTED_404_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { removeCookie } from './cookie';

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

/**
 * Checks if a 404 error is expected (normal behavior, not an error)
 */
export function isExpected404(url: string, errorMessage?: string): boolean {
  const urlLower = url.toLowerCase();
  const messageLower = errorMessage?.toLowerCase() || '';
  
  return EXPECTED_404_ENDPOINTS.some(endpoint => 
    urlLower.includes(endpoint.toLowerCase()) ||
    messageLower.includes('no daily reports found')
  );
}

/**
 * Extracts error message from API response
 */
export function extractErrorMessage(data: any, text?: string): string {
  if (data?.error) {
    return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  }
  
  if (data?.message) {
    return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
  }
  
  if (data?.errors) {
    if (Array.isArray(data.errors)) {
      return data.errors.join(', ');
    }
    if (typeof data.errors === 'object') {
      return Object.values(data.errors).flat().join(', ');
    }
  }
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (text) {
    return text.substring(0, 200);
  }
  
  return ERROR_MESSAGES.NETWORK_ERROR;
}

/**
 * Handles HTTP error responses
 */
export function handleHttpError(
  status: number,
  url: string,
  errorMessage: string,
  errorDetails?: any
): ApiError {
  // Handle 401 Unauthorized - token refresh đã được xử lý trong apiClient
  // Nếu vẫn đến đây nghĩa là refresh thất bại hoặc không có refresh token
  if (status === HTTP_STATUS.UNAUTHORIZED) {
    // Clear invalid token and user data
    if (typeof window !== 'undefined') {
      removeCookie(STORAGE_KEYS.AUTH_TOKEN);
      removeCookie(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      // Redirect to login only if not already on login page
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    return {
      message: ERROR_MESSAGES.UNAUTHORIZED,
      status,
      details: errorDetails,
    };
  }
  
  // Handle 403 Forbidden
  if (status === HTTP_STATUS.FORBIDDEN) {
    const message = errorMessage.includes('HTTP error! status: 403')
      ? ERROR_MESSAGES.FORBIDDEN
      : errorMessage;
    
    if (import.meta.env.DEV) {
      console.warn('403 Forbidden:', {
        url,
        message,
        userRole: typeof window !== 'undefined' && localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user') || '{}').role
          : 'unknown',
      });
    }
    
    return {
      message,
      status,
      details: errorDetails,
    };
  }
  
  // Handle 404 Not Found
  if (status === HTTP_STATUS.NOT_FOUND) {
    if (isExpected404(url, errorMessage)) {
      // Expected 404 - return error but don't log
      return {
        message: errorMessage || ERROR_MESSAGES.NOT_FOUND,
        status,
        details: errorDetails,
      };
    }
  }
  
  // Handle 500 with unauthorized access message
  const isUnauthorizedAccess = 
    status === HTTP_STATUS.INTERNAL_SERVER_ERROR &&
    errorMessage.toLowerCase().includes('unauthorized');
  
  // Only log unexpected errors in development
  if (import.meta.env.DEV && !isUnauthorizedAccess && !isExpected404(url, errorMessage)) {
    console.error('API Error:', {
      url,
      status,
      error: errorMessage,
    });
  }
  
  return {
    message: errorMessage,
    status,
    details: errorDetails,
  };
}

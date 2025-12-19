/**
 * Core API client with improved error handling and structure
 */

import { API_BASE_URL, STORAGE_KEYS } from '../constants';
import { extractErrorMessage, handleHttpError } from '../utils/errorHandler';
import { getCookie } from '../utils/cookie';
import { refreshTokenIfNeeded } from '../utils/tokenRefresh';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorDetails?: any;
}

/**
 * Core API client class
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    
    // Log API base URL in development
    if (import.meta.env.DEV) {
      console.info('[api] Using API base URL:', this.baseUrl);
    }
  }

  /**
   * Get authorization token from cookie
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    const token = getCookie(STORAGE_KEYS.AUTH_TOKEN);
    return token?.trim() || null;
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers as HeadersInit;
  }

  /**
   * Core request method
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Refresh token nếu cần trước khi gọi API
      await refreshTokenIfNeeded();
      
      const url = `${this.baseUrl}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: this.buildHeaders(options.headers),
      };

      const response = await fetch(url, config);
      const text = await response.text();
      
      let data: any = undefined;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        // Response is not JSON, keep data as undefined
      }

      if (!response.ok) {
        const errorMessage = extractErrorMessage(data, text);
        const errorDetails = data?.error || data?.errors || data;
        
        const apiError = handleHttpError(
          response.status,
          url,
          errorMessage,
          errorDetails
        );

        return {
          success: false,
          error: apiError.message,
          errorDetails: apiError.details,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Upload file with FormData
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const url = `${this.baseUrl}${endpoint}`;
      const token = this.getAuthToken();
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Don't set Content-Type - browser will set it with boundary for multipart/form-data

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const text = await response.text();
      let data: any = undefined;
      
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        // Response is not JSON
      }

      if (!response.ok) {
        const errorMessage = extractErrorMessage(data, text);
        const apiError = handleHttpError(
          response.status,
          url,
          errorMessage,
          data
        );

        return {
          success: false,
          error: apiError.message,
          errorDetails: apiError.details,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();


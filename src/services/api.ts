import { getCookie, removeCookie } from '../utils/cookie';
import { STORAGE_KEYS } from '../constants';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.vibe88.tech/api';

// Log which API base is being used in development to aid debugging
if (import.meta.env.DEV) {
  console.info('[api] Using API base URL:', API_BASE_URL);
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorDetails?: any;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  formattedAddress?: string;
  placeId?: string;
  createdAt: string;
  role?: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  FullName: string;
  Email: string;
  Password: string;
  PhoneNumber?: string;
  Gender?: string;
  RoleId?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  oobCode: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalTutors: number;
  totalStudents: number;
  revenue: number;
  activeSessions: number;
  growthRate: number;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
  type: string;
}

// Notification types
export interface Notification {
  id: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
  contractId?: string;
  bookingId?: string;
}

export interface NotificationApiResponse {
  notificationId: string;
  message: string;
  notificationType: string;
  status: string;
  createdDate: string;
  contractId?: string;
  bookingId?: string;
}

export interface PaginatedNotificationsResponse {
  data: Notification[];
  totalPages: number;
  currentPage: number;
}

export interface UnreadCountResponse {
  count: number;
}

class ApiService {
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Add auth token if available
      const token = getCookie(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        // Ensure token is not empty and is a valid string
        const cleanToken = token.trim();
        if (cleanToken) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${cleanToken}`,
          } as HeadersInit;
        }
      }

      // Check if this is an expected 404 endpoint that should be suppressed
      const isExpected404Endpoint = url.includes('/learning-forecast') || 
        url.includes('/unit-progress') ||
        url.includes('/daily-reports/contract/');

      // Temporarily suppress console errors for expected 404 endpoints
      let originalConsoleError: typeof console.error | null = null;
      if (isExpected404Endpoint) {
        originalConsoleError = console.error;
        console.error = (...args: any[]) => {
          // Suppress errors that contain 404 or Not Found for expected endpoints
          const errorString = args.join(' ');
          if (!errorString.includes('404') && !errorString.includes('Not Found')) {
            originalConsoleError?.apply(console, args);
          }
        };
      }

      let response: Response;
      try {
        response = await fetch(url, config);
      } catch (fetchError: any) {
        // Restore original console.error
        if (originalConsoleError) {
          console.error = originalConsoleError;
        }
        // Check if it's a network error that might indicate incomplete chunked encoding
        const errorMessage = fetchError?.message || '';
        const errorName = fetchError?.name || '';
        
        // Handle HTTP/2 protocol errors
        if (errorMessage.includes('ERR_HTTP2_PROTOCOL_ERROR') || 
            errorMessage.includes('HTTP2_PROTOCOL_ERROR') ||
            errorName === 'TypeError' && errorMessage.includes('Failed to fetch')) {
          console.error('HTTP/2 Protocol Error:', {
            url,
            error: errorMessage,
            suggestion: 'This may be a server-side HTTP/2 issue. The request may have succeeded on the server.'
          });
          
          // For withdrawal requests, return special error to allow verification
          if (url.includes('/withdrawals/request')) {
            return {
              success: false,
              error: 'INCOMPLETE_RESPONSE',
              errorDetails: { 
                networkError: true, 
                http2Error: true,
                message: 'HTTP/2 protocol error occurred. Please verify if the request was processed.',
                originalError: errorMessage
              }
            };
          }
          
          return {
            success: false,
            error: 'Network protocol error occurred. Please try again or contact support if the issue persists.',
            errorDetails: { 
              networkError: true, 
              http2Error: true,
              message: errorMessage
            }
          };
        }
        
        if (errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') || 
            errorMessage.includes('chunked') ||
            errorMessage.includes('incomplete') ||
            errorMessage.includes('Failed to fetch')) {
          // Return special error flag for incomplete responses
          return {
            success: false,
            error: 'INCOMPLETE_RESPONSE',
            errorDetails: { networkError: true, message: errorMessage }
          };
        }
        throw fetchError; // Re-throw if not a chunked encoding error
      } finally {
        // Restore original console.error
        if (originalConsoleError) {
          console.error = originalConsoleError;
        }
      }
      
      let text: string;
      try {
        text = await response.text();
      } catch (textError: any) {
        // If reading response text fails, it might be incomplete chunked encoding
        const errorMessage = textError?.message || '';
        if (errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') || 
            errorMessage.includes('chunked') ||
            errorMessage.includes('incomplete')) {
          return {
            success: false,
            error: 'INCOMPLETE_RESPONSE',
            errorDetails: { networkError: true, message: errorMessage }
          };
        }
        return {
          success: false,
          error: errorMessage || 'Failed to read response',
        };
      }
      
      let data: any = undefined;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch (jsonError) {
        // If response is not valid JSON, check if it might be incomplete
        // If status is 200 but JSON is invalid, it might be incomplete chunked encoding
        if (response.ok && response.status === 200 && text && text.length > 0) {
          // Check if it looks like a complete plain text response (not cut-off JSON)
          const trimmedText = text.trim();
          const looksLikeCompleteText = (
            // Plain text messages that are complete sentences
            (trimmedText.endsWith('.') || trimmedText.endsWith('!') || trimmedText.endsWith('?')) &&
            !trimmedText.includes('{') && !trimmedText.includes('[')
          );
          
          if (looksLikeCompleteText) {
            // This is a valid plain text response, return it as success with message
            return {
              success: true,
              data: { message: text }
            };
          }
          
          // Try to detect if response was cut off (incomplete JSON)
          const isLikelyIncomplete = !trimmedText.endsWith('}') && !trimmedText.endsWith(']');
          if (isLikelyIncomplete) {
            return {
              success: false,
              error: 'INCOMPLETE_RESPONSE',
              errorDetails: { jsonParseError: true, partialText: text.substring(0, 100) }
            };
          }
        }
        // If response is not valid JSON, keep data as undefined
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Clear invalid token and user data
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
        
        // Extract error message from response first
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails: any = null;
        
        if (data) {
          // Try multiple possible error message fields
          if (data.error) {
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
            errorDetails = data.error;
          } else if (data.message) {
            errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
            errorDetails = data.message;
          } else if (data.errors) {
            // Handle validation errors array
            if (Array.isArray(data.errors)) {
              errorMessage = data.errors.join(', ');
            } else if (typeof data.errors === 'object') {
              errorMessage = Object.values(data.errors).flat().join(', ');
            }
            errorDetails = data.errors;
          } else if (typeof data === 'string') {
            errorMessage = data;
            errorDetails = data;
          } else {
            // If we can't find a message, use the whole data object
            errorMessage = JSON.stringify(data);
            errorDetails = data;
          }
        } else if (text) {
          errorMessage = text.substring(0, 200); // First 200 chars of text response
          errorDetails = text;
        }
        
        // Handle 403 Forbidden - user doesn't have permission to access this resource
        if (response.status === 403) {
          // Provide a more user-friendly error message
          if (!errorMessage || errorMessage.includes('HTTP error! status: 403')) {
            errorMessage = 'You do not have permission to access this resource. Please check if you have the required access rights.';
          }
          // Don't clear token for 403 as it might be a permission issue, not auth issue
          // But log it for debugging
          if (import.meta.env.DEV) {
            console.warn('403 Forbidden - User may not have permission to access this resource:', {
              url,
              errorMessage,
              userRole: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').role : 'unknown'
            });
          }
        }
        
        // Log error information for debugging (only in development)
        // Skip logging for unauthorized access errors (500 with "Unauthorized access" message)
        const isUnauthorizedAccess = response.status === 500 && 
          (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('unauthorized'));
        
        // Skip logging for 404 errors - these are expected when resources don't exist
        const isNotFound = response.status === 404;
        
        // Skip logging for expected 404s (learning forecast, unit progress when no reports exist)
        // These are normal cases when there's no data yet, not actual errors
        const isExpectedNotFound = isNotFound && (
          url.includes('/learning-forecast') || 
          url.includes('/unit-progress') ||
          // Match any /daily-reports/contract/{id} endpoint (with or without /unit-progress)
          url.includes('/daily-reports/contract/') ||
          (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('no daily reports found'))
        );
        
        // Suppress console errors for expected 404s - don't log them at all
        if (isExpectedNotFound) {
          // Return error response but don't log it - this is expected behavior
          return {
            success: false,
            error: errorMessage || 'Resource not found',
            errorDetails: errorDetails,
          };
        }
        
        // Only log unexpected errors
        if (import.meta.env.DEV && !isUnauthorizedAccess && !isExpectedNotFound) {
          console.error('API Error:', {
            url,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
        }
        
        return {
          success: false,
          error: errorMessage,
          errorDetails: errorDetails,
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

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<{ token: string }>> {
    return this.request<{ token: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
  }

  async signup(userData: SignupRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async googleLogin(token: string): Promise<ApiResponse<{ token: string }>> {
    return this.request<{ token: string }>(
      '/auth/google-login',
      {
        method: 'POST',
        body: JSON.stringify({ IdToken: token }),
      }
    );
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/dashboard/stats');
  }

  async getRecentActivities(): Promise<ApiResponse<Activity[]>> {
    return this.request('/dashboard/activities');
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    // Get user ID from localStorage first
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).id : null;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID not found'
      };
    }
    
    return this.request(`/users/${userId}`);
  }

  async updateCurrentUser(data: { fullName?: string; phoneNumber?: string; gender?: string }): Promise<ApiResponse<User>> {
    // Get user ID from localStorage first
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).id : null;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID not found'
      };
    }
    
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    
    // Clear local storage regardless of API response
    removeCookie(STORAGE_KEYS.AUTH_TOKEN);
    removeCookie(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    
    return response;
  }

  async getUserWallet(userId: string): Promise<ApiResponse<{ balance?: number; walletBalance?: number; transactions: any[] }>> {
    return this.request(`/users/${userId}/wallet`);
  }

  async deductWallet(contractId: string, price: number): Promise<ApiResponse<{
    transactionId: string;
    amountDeducted: number;
    newWalletBalance: number;
    transactionStatus: string;
    transactionDate: string;
    message: string;
  }>> {
    return this.request(`/users/${contractId}/wallet/deduct?price=${price}`, {
      method: 'POST',
    });
  }

  // User endpoints
  async getUserById(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId: string, data: {
    FullName?: string;
    PhoneNumber?: string;
    Gender?: string;
  }): Promise<ApiResponse<{ userId: string }>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string; message: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Đảm bảo URL đúng format - loại bỏ trailing slash nếu có
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      
      // Workaround: Thử nhiều cách gọi để tránh route conflict
      // Cách 1: Thử với query parameter để tránh match với {id} route
      let url = `${baseUrl}/users/avatar?action=upload`;
      
      const token = getCookie(STORAGE_KEYS.AUTH_TOKEN);
      
      const headers: HeadersInit = {};
      if (token) {
        const cleanToken = token.trim();
        if (cleanToken) {
          headers['Authorization'] = `Bearer ${cleanToken}`;
        }
      }
      // Don't set Content-Type - browser will set it with boundary for multipart/form-data

      let response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      // Nếu vẫn lỗi 405, thử cách khác: dùng endpoint với trailing slash
      if (response.status === 405) {
        console.warn('First attempt failed with 405, trying alternative endpoint...');
        url = `${baseUrl}/users/avatar/`;
        response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: formData,
        });
      }

      // Nếu vẫn lỗi, thử không có query parameter
      if (response.status === 405) {
        console.warn('Second attempt failed with 405, trying without query parameter...');
        url = `${baseUrl}/users/avatar`;
        response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: formData,
        });
      }

      const text = await response.text();
      let data: any = undefined;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch (jsonError) {
        // If response is not valid JSON, keep data as undefined
      }

      if (!response.ok) {
        // Handle 405 Method Not Allowed specifically
        if (response.status === 405) {
          console.error('405 Method Not Allowed after all attempts - URL:', url, 'Method: POST');
          console.error('This is likely a backend routing issue. The route [HttpPost("avatar")] should be placed before [HttpGet("{id}")] in UsersController.');
          return {
            success: false,
            error: 'Method not allowed. This appears to be a backend routing conflict. Please contact the administrator.',
            errorDetails: { url, method: 'POST', status: 405, attempts: 3 },
          };
        }
        
        if (response.status === 401) {
          removeCookie(STORAGE_KEYS.AUTH_TOKEN);
          removeCookie(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          if (!window.location.pathname.includes('/login')) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (data) {
          if (data.error) {
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          } else if (data.message) {
            errorMessage = data.message;
          }
        }
        
        return {
          success: false,
          error: errorMessage,
          errorDetails: data,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      return {
        success: false,
        error: error?.message || 'Failed to upload avatar',
      };
    }
  }

  // Location endpoints
  async getAddressAutocomplete(input: string, country: string = 'VN'): Promise<ApiResponse<{
    success: boolean;
    predictions: Array<{
      place_id: string;
      description: string;
      structured_formatting?: {
        main_text: string;
        secondary_text: string;
      };
    }>;
    totalCount: number;
  }>> {
    return this.request(`/location/autocomplete?input=${encodeURIComponent(input)}&country=${country}`);
  }

  async getUserLocation(userId: string): Promise<ApiResponse<{
    placeId?: string;
    address?: string;
    description?: string;
  }>> {
    return this.request(`/location/user/${userId}`);
  }

  async saveAddress(placeId: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    locationUpdatedDate?: string;
  }>> {
    return this.request('/location/save-address', {
      method: 'POST',
      body: JSON.stringify({ placeId: placeId }),
    });
  }

  // Package endpoints
  async getAllPackages(): Promise<ApiResponse<any[]>> {
    console.log('API getAllPackages called');
    const response = await this.request<any>('/packages');
    console.log('API getAllPackages response:', response);
    
    // Handle different response formats
    if (response.success && response.data) {
      // If response.data is already an array, return as is
      if (Array.isArray(response.data)) {
        return response;
      }
      // If response.data is an object with data/items/packages property
      if (response.data.data && Array.isArray(response.data.data)) {
        return {
          ...response,
          data: response.data.data
        };
      }
      if (response.data.items && Array.isArray(response.data.items)) {
        return {
          ...response,
          data: response.data.items
        };
      }
      if (response.data.packages && Array.isArray(response.data.packages)) {
        return {
          ...response,
          data: response.data.packages
        };
      }
    }
    
    return response;
  }

  async uploadPackageImage(packageId: string, file: File): Promise<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getCookie(STORAGE_KEYS.AUTH_TOKEN);
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/packages/${packageId}/image`, {
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
        const errorMessage = data?.error || `HTTP error! status: ${response.status}`;
        return {
          success: false,
          error: errorMessage,
          errorDetails: data,
        };
      }

      return {
        success: true,
        data: data || { imageUrl: data?.imageUrl || '' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload package image',
      };
    }
  }

  // Admin endpoints
  async getAdminStats(): Promise<ApiResponse<any>> {
    return this.request('/admin/stats');
  }

  async getAllUsers(): Promise<ApiResponse<any[]>> {
    try {
      const result = await this.request<{ data: any[]; totalCount: number }>('/users', {
        method: 'GET',
      });
      
      if (result.success && result.data) {
        // Backend returns { data: [...], totalCount: ... }
        const usersData = result.data.data || result.data;
        const mappedUsers = (Array.isArray(usersData) ? usersData : []).map((item: any) => {
          // Extract hourlyRate from TutorVerification if user is a tutor
          const verification = item.TutorVerification || item.tutorVerification || null;
          const hourlyRate = verification?.HourlyRate !== undefined ? verification.HourlyRate : 
                            (verification?.hourlyRate !== undefined ? verification.hourlyRate : 
                            (item.hourlyRate !== undefined ? item.hourlyRate : 
                            (item.HourlyRate !== undefined ? item.HourlyRate : undefined)));
          
          return {
            userId: item.userId || item.UserId || '',
            fullName: item.fullName || item.FullName || '',
            email: item.email || item.Email || '',
            phoneNumber: item.phoneNumber || item.PhoneNumber,
            roleId: item.roleId ?? item.RoleId ?? 0,
            roleName: item.roleName || item.RoleName,
            status: item.status || item.Status || 'active',
            formattedAddress: item.formattedAddress || item.FormattedAddress,
            walletBalance: item.walletBalance ?? item.WalletBalance ?? 0,
            hourlyRate: hourlyRate,
          };
        });
        
      return {
        success: true,
        data: mappedUsers,
        error: undefined,
      };
      }
      
      return {
        success: result.success,
        data: [],
        error: result.error,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error?.message || 'Failed to fetch users',
      };
    }
  }

  // ==================== Notification Methods ====================

  // Helper function to remove ID from notification message
  private removeIdFromMessage(message: string): string {
    if (!message) return message;
    
    // Remove various ID patterns:
    // - (ID: xxx), (NotificationId: xxx), (ContractId: xxx), etc.
    // - - ID: xxx, - NotificationId: xxx, etc.
    // - [ID: xxx], [NotificationId: xxx], etc.
    // - ID: xxx, NotificationId: xxx, etc. (at the end)
    let cleaned = message
      .replace(/\s*\([^)]*(?:[Ii][Dd]|NotificationId|ContractId|BookingId|UserId|MessageId)[^)]*\)/g, '')
      .replace(/\s*-\s*(?:[Ii][Dd]|NotificationId|ContractId|BookingId|UserId|MessageId)\s*:\s*[^\s]+/g, '')
      .replace(/\s*\[\s*(?:[Ii][Dd]|NotificationId|ContractId|BookingId|UserId|MessageId)[^\]]*\s*\]/g, '')
      .replace(/\s*(?:[Ii][Dd]|NotificationId|ContractId|BookingId|UserId|MessageId)\s*:\s*[a-fA-F0-9-]{8,}(?:\s|$)/g, '')
      .trim();
    
    return cleaned || message; // Return original if cleaned is empty
  }

  // Helper function to map API response to internal format
  private mapNotificationFromApi(apiNotification: NotificationApiResponse): Notification {
    return {
      id: apiNotification.notificationId,
      message: this.removeIdFromMessage(apiNotification.message),
      type: apiNotification.notificationType,
      status: apiNotification.status,
      createdAt: apiNotification.createdDate,
      contractId: apiNotification.contractId,
      bookingId: apiNotification.bookingId,
    };
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.request<any>('/Notification/unread-count', {
        method: 'GET',
      });

      // Handle different response formats
      if (typeof response === 'number') {
        return response;
      }
      if (response && typeof response === 'object') {
        return response.count || response.unreadCount || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async getAllNotifications(pageNumber: number = 1, pageSize: number = 10): Promise<PaginatedNotificationsResponse> {
    try {
      const response = await this.request<any>(
        `/Notification?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        { method: 'GET' }
      );

      // Handle array response
      if (Array.isArray(response)) {
        const mappedData = response.map((item: any) => 
          this.mapNotificationFromApi(item)
        );
        return {
          data: mappedData,
          totalPages: 1,
          currentPage: pageNumber,
        };
      }

      // Handle paginated response
      if (response && typeof response === 'object') {
        const notifications = response.data || response.notifications || [];
        const mappedData = Array.isArray(notifications)
          ? notifications.map((item: any) => this.mapNotificationFromApi(item))
          : [];
        
        return {
          data: mappedData,
          totalPages: response.totalPages || 1,
          currentPage: response.currentPage || pageNumber,
        };
      }

      return {
        data: [],
        totalPages: 1,
        currentPage: pageNumber,
      };
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      return {
        data: [],
        totalPages: 1,
        currentPage: pageNumber,
      };
    }
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      const response = await this.request<any>('/Notification/unread', {
        method: 'GET',
      });

      // Handle array response
      if (Array.isArray(response)) {
        return response.map((item: any) => this.mapNotificationFromApi(item));
      }

      // Handle object response
      if (response && typeof response === 'object') {
        const notifications = response.data || response.notifications || [];
        return Array.isArray(notifications)
          ? notifications.map((item: any) => this.mapNotificationFromApi(item))
          : [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    try {
      const response = await this.request<NotificationApiResponse>(`/Notification/${id}`, {
        method: 'GET',
      });

      if (response) {
        return this.mapNotificationFromApi(response);
      }
      return null;
    } catch (error) {
      console.error('Error fetching notification by ID:', error);
      return null;
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await this.request(`/Notification/${id}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await this.request('/Notification/mark-all-read', {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await this.request(`/Notification/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async deleteAllNotifications(): Promise<void> {
    try {
      await this.request('/Notification', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

// =====================
// Center API
// =====================
export interface Center {
  centerId: string;
  name: string;
  address: string;
  phone?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number; // Distance in kilometers (calculated when needed)
}

export interface CreateCenterRequest {
  Name: string;
  PlaceId: string;
}

export interface UpdateCenterRequest {
  Name?: string;
  PlaceId?: string;
}

export async function getAllCenters() {
  // Use the public search endpoint that doesn't require authentication
  return apiService.request<{ data: Center[] }>(`/centers/search`);
}

export async function getCenterById(centerId: string) {
  return apiService.request<Center>(`/centers/${centerId}`);
}

export async function createCenter(data: CreateCenterRequest) {
  return apiService.request<{ centerId: string }>(`/centers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCenter(centerId: string, data: UpdateCenterRequest) {
  return apiService.request<void>(`/centers/${centerId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCenter(centerId: string) {
  return apiService.request<void>(`/centers/${centerId}`, {
    method: 'DELETE',
  });
}

export async function getTutorsByCenter(centerId: string) {
  return apiService.request<any[]>(`/centers/${centerId}/tutors`);
}

export async function getCenterStatistics() {
  return apiService.request<any>(`/centers/statistics`);
}

// Get unassigned tutors (tutors without center)
export async function getUnassignedTutors() {
  try {
    const result = await apiService.request<any[]>(`/Tutors/unassigned-to-center`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Map PascalCase to camelCase
      // TutorInCenterDto now includes location fields (FormattedAddress, City, District, Latitude, Longitude)
      const mappedTutors = (Array.isArray(result.data) ? result.data : []).map((item: any) => {
        const mapped = {
          userId: item.userId || item.TutorId || '',
          fullName: item.fullName || item.FullName || '',
          email: item.email || item.Email || '',
          phoneNumber: item.phoneNumber || item.PhoneNumber || '',
          formattedAddress: item.formattedAddress || item.FormattedAddress || undefined,
          city: item.city || item.City || undefined,
          district: item.district || item.District || undefined,
          latitude: item.latitude ?? item.Latitude ?? (typeof item.latitude === 'number' ? item.latitude : undefined),
          longitude: item.longitude ?? item.Longitude ?? (typeof item.longitude === 'number' ? item.longitude : undefined),
          tutorVerification: {
            verificationStatus: item.tutorVerification?.verificationStatus || item.VerificationStatus || 'pending',
            hourlyRate: item.tutorVerification?.hourlyRate ?? item.HourlyRate ?? 0,
            university: item.tutorVerification?.university || item.University || undefined,
            major: item.tutorVerification?.major || item.Major || undefined,
            bio: item.tutorVerification?.bio || item.Bio || undefined,
          },
        };
        
        // Debug log for troubleshooting
        if (import.meta.env.DEV && (!mapped.formattedAddress && !mapped.city && !mapped.latitude)) {
          console.warn('Tutor without address info:', {
            userId: mapped.userId,
            fullName: mapped.fullName,
            rawItem: item
          });
        }
        
        return mapped;
      });
      
      return {
        success: true,
        data: mappedTutors,
        error: null,
      };
    }
    
    return {
      success: result.success,
      data: [],
      error: result.error,
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch unassigned tutors',
    };
  }
}


// Assign tutor to center
export async function assignTutorToCenter(centerId: string, tutorId: string) {
  return apiService.request<{ message: string }>(`/centers/${centerId}/assign-tutor`, {
    method: 'POST',
    body: JSON.stringify({ TutorId: tutorId }),
  });
}

// Remove tutor from center
export async function removeTutorFromCenter(centerId: string, tutorId: string) {
  return apiService.request<{ message: string }>(`/centers/${centerId}/remove-tutor/${tutorId}`, {
    method: 'DELETE',
  });
}

// Test Result API functions
export interface TestResult {
  resultId: string;
  testType: string;
  score: number;
  notes?: string;
  createdDate: string;
  updatedDate: string;
  contractId: string;
  bookingId?: string;
}

export interface CreateTestResultRequest {
  testType: string;
  score: number;
  notes?: string;
  contractId: string;
  bookingId?: string;
}

export interface UpdateTestResultRequest {
  testType?: string;
  score?: number;
  notes?: string;
  contractId?: string;
  bookingId?: string;
}

// Get test result by ID
export async function getTestResultById(resultId: string) {
  return apiService.request<TestResult>(`/test-results/${resultId}`);
}

// Get test results by contract ID
export async function getTestResultsByContractId(contractId: string) {
  try {
    const result = await apiService.request<any[]>(`/test-results/contract/${contractId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const mappedData: TestResult[] = result.data.map((item: any) => ({
        resultId: item.resultId || item.ResultId || '',
        testType: item.testType || item.TestType || '',
        score: item.score ?? item.Score ?? 0,
        notes: item.notes || item.Notes,
        createdDate: item.createdDate || item.CreatedDate || '',
        updatedDate: item.updatedDate || item.UpdatedDate || '',
        contractId: item.contractId || item.ContractId || contractId,
        bookingId: item.bookingId || item.BookingId,
      }));
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch test results',
    };
  }
}

// Get test results by child ID
export async function getTestResultsByChildId(childId: string) {
  try {
    const result = await apiService.request<any[]>(`/test-results/child/${childId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const mappedData: TestResult[] = result.data.map((item: any) => ({
        resultId: item.resultId || item.ResultId || '',
        testType: item.testType || item.TestType || '',
        score: item.score ?? item.Score ?? 0,
        notes: item.notes || item.Notes,
        createdDate: item.createdDate || item.CreatedDate || '',
        updatedDate: item.updatedDate || item.UpdatedDate || '',
        contractId: item.contractId || item.ContractId || '',
        bookingId: item.bookingId || item.BookingId,
      }));
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch test results',
    };
  }
}

// Create test result
export async function createTestResult(request: CreateTestResultRequest) {
  return apiService.request<{ message: string; resultId: string }>(`/test-results`, {
    method: 'POST',
    body: JSON.stringify({
      TestType: request.testType,
      Score: request.score,
      Notes: request.notes,
      ContractId: request.contractId,
      BookingId: request.bookingId,
    }),
  });
}

// Update test result
export async function updateTestResult(resultId: string, request: UpdateTestResultRequest) {
  return apiService.request<{ message: string }>(`/test-results/${resultId}`, {
    method: 'PUT',
    body: JSON.stringify({
      TestType: request.testType,
      Score: request.score,
      Notes: request.notes,
      ContractId: request.contractId,
      BookingId: request.bookingId,
    }),
  });
}

// Delete test result
export async function deleteTestResult(resultId: string) {
  return apiService.request<{ message: string }>(`/test-results/${resultId}`, {
    method: 'DELETE',
  });
}

// Get centers near an address (within radius)
export async function getCentersNearAddress(address: string, radiusKm: number = 10) {
  const params = new URLSearchParams();
  params.append('address', address);
  params.append('radiusKm', radiusKm.toString());
  
  return apiService.request<Center[]>(`/location/nearby-centers?${params.toString()}`);
}

// Get coordinates (latitude/longitude) from placeId
export async function getCoordinatesFromPlaceId(placeId: string) {
  const params = new URLSearchParams();
  params.append('placeId', placeId);
  
  return apiService.request<{
    success: boolean;
    placeId: string;
    latitude: number;
    longitude: number;
    formattedAddress?: string;
    placeName?: string;
    city?: string;
    district?: string;
    countryCode?: string;
  }>(`/location/coordinates?${params.toString()}`);
}


// Children API
export interface Child {
  childId: string;
  fullName: string;
  schoolId: string;
  schoolName: string;
  centerId?: string;
  centerName?: string;
  grade: string;
  dateOfBirth?: string;
  status?: string;
  avatarUrl?: string;
  avatarVersion?: number;
  // Ignore fields that don't exist in backend
  reschedule_count?: never; // This field doesn't exist, ignore it
  rescheduleCount?: never;
  RescheduleCount?: never;
}

export interface AddChildRequest {
  fullName: string;
  schoolId: string;
  centerId?: string;
  grade: string;
  dateOfBirth?: string;
}

export interface UpdateChildRequest {
  fullName?: string;
  schoolId?: string;
  centerId?: string;
  grade?: string;
  dateOfBirth?: string;
}

export interface LinkCenterRequest {
  centerId: string;
}

export async function getAllChildren() {
  const response = await apiService.request<Child[]>(`/children`);
  
  // Filter out reschedule_count field from response if present
  if (response.success && response.data) {
    response.data = response.data.map((child: any) => {
      const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanChild } = child;
      return cleanChild;
    }) as Child[];
  }
  
  return response;
}

export async function getChildById(childId: string) {
  const response = await apiService.request<Child>(`/children/${childId}`);
  
  // Filter out reschedule_count field from response if present
  if (response.success && response.data) {
    const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanChild } = response.data as any;
    response.data = cleanChild as Child;
  }
  
  return response;
}

export async function getChildrenByParent(parentId: string) {
  const response = await apiService.request<Child[]>(`/parents/${parentId}/children`);
  
  // Filter out reschedule_count field from response if present (field doesn't exist in backend)
  if (response.success && response.data) {
    response.data = response.data.map((child: any) => {
      const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanChild } = child;
      return cleanChild;
    }) as Child[];
  }
  
  return response;
}

export async function addChild(parentId: string, data: AddChildRequest) {
  // Convert camelCase to PascalCase for backend
  // Only include optional fields if they have values
  const requestData: any = {
    FullName: data.fullName,
    SchoolId: data.schoolId,
    Grade: data.grade
  };
  
  // Only include CenterId if it's provided and not empty
  if (data.centerId && data.centerId.trim() !== '') {
    requestData.CenterId = data.centerId;
  }
  
  // Only include DateOfBirth if it's provided
  if (data.dateOfBirth && data.dateOfBirth.trim() !== '') {
    requestData.DateOfBirth = data.dateOfBirth;
  }
  
  return apiService.request<{ childId: string }>(`/parents/${parentId}/children`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

export async function updateChild(childId: string, data: UpdateChildRequest) {
  // Convert camelCase to PascalCase for backend
  const requestData: any = {};
  if (data.fullName) requestData.FullName = data.fullName;
  if (data.schoolId) requestData.SchoolId = data.schoolId;
  if (data.centerId) requestData.CenterId = data.centerId;
  if (data.grade) requestData.Grade = data.grade;
  if (data.dateOfBirth) requestData.DateOfBirth = data.dateOfBirth;
  
  return apiService.request<{ message: string }>(`/children/${childId}`, {
    method: 'PUT',
    body: JSON.stringify(requestData),
  });
}

export async function softDeleteChild(childId: string) {
  return apiService.request<{ message: string }>(`/children/${childId}`, {
    method: 'DELETE',
  });
}

export async function restoreChild(childId: string) {
  return apiService.request<{ message: string }>(`/children/${childId}/restore`, {
    method: 'PATCH',
  });
}

export async function linkCenterToChild(childId: string, centerId: string) {
  return apiService.request<{ message: string }>(`/children/${childId}/link-center`, {
    method: 'POST',
    body: JSON.stringify({ CenterId: centerId }),
  });
}

export async function getChildContracts(childId: string) {
  return apiService.request<any[]>(`/children/${childId}/contracts`);
}

export async function uploadChildAvatar(childId: string, file: File): Promise<ApiResponse<{ avatarUrl: string; message: string }>> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const url = `${baseUrl}/children/${childId}/avatar`;
    
    const token = getCookie(STORAGE_KEYS.AUTH_TOKEN);
    
    const headers: HeadersInit = {};
    if (token) {
      const cleanToken = token.trim();
      if (cleanToken) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }
    // Don't set Content-Type - browser will set it with boundary for multipart/form-data

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    const text = await response.text();
    let data: any = undefined;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
        data: undefined
      };
    }

    return {
      success: true,
      data: data,
      error: undefined
    };
  } catch (error: any) {
    console.error('Error uploading child avatar:', error);
    return {
      success: false,
      data: undefined,
      error: error?.message || 'Failed to upload child avatar',
    };
  }
}

// =====================
// School API
// =====================
export interface School {
  schoolId: string;
  schoolName: string;
  curriculumId: string;
  curriculumName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SchoolSearchRequest {
  schoolName?: string;
  curriculumId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function getAllSchools() {
  return apiService.request<{ data: School[] }>(`/schools`);
}

export async function getActiveSchools(page?: number, pageSize?: number) {
  const params = new URLSearchParams();
  if (page !== undefined) params.append('page', page.toString());
  if (pageSize !== undefined) params.append('pageSize', pageSize.toString());
  const queryString = params.toString();
  return apiService.request<{ data: School[], pagination?: any }>(`/schools/active${queryString ? `?${queryString}` : ''}`);
}

/**
 * Fetch all active schools by making multiple requests if needed
 */
export async function getAllActiveSchools(): Promise<School[]> {
  const allSchools: School[] = [];
  let page = 1;
  const pageSize = 1000; // Large page size to minimize requests
  let hasMore = true;
  let maxPages = 100; // Safety limit to prevent infinite loops

  while (hasMore && page <= maxPages) {
    try {
      const result = await getActiveSchools(page, pageSize);
      if (result.success && result.data) {
        // Handle different response structures
        let schools: School[] = [];
        let pagination: any = null;

        // Check if result.data is an object with nested data and pagination
        if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          const responseData = result.data as any;
          if (Array.isArray(responseData.data)) {
            schools = responseData.data;
            pagination = responseData.pagination;
          } else if (Array.isArray(responseData)) {
            schools = responseData;
          }
        } else if (Array.isArray(result.data)) {
          schools = result.data;
        }

        if (schools.length > 0) {
          allSchools.push(...schools);
        }
        
        // Check if there are more pages
        if (pagination) {
          hasMore = pagination.hasNext === true;
          page++;
        } else {
          // If no pagination info, assume we got all if less than pageSize
          hasMore = schools.length === pageSize;
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching schools page ${page}:`, error);
      hasMore = false;
    }
  }

  return allSchools;
}

export async function getSchoolById(schoolId: string) {
  return apiService.request<School>(`/schools/${schoolId}`);
}

export async function searchSchools(request: SchoolSearchRequest) {
  const params = new URLSearchParams();
  if (request.schoolName) params.append('schoolName', request.schoolName);
  if (request.curriculumId) params.append('curriculumId', request.curriculumId);
  if (request.isActive !== undefined) params.append('isActive', request.isActive.toString());
  if (request.page) params.append('page', request.page.toString());
  if (request.pageSize) params.append('pageSize', request.pageSize.toString());
  
  return apiService.request<{ data: School[] }>(`/schools/search?${params.toString()}`);
}

// Contract API
export interface ContractScheduleDto {
  dayOfWeek: number; // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
}

export interface Contract {
  contractId: string;
  childId: string;
  childName?: string | null;
  secondChildId?: string | null; // New: Second child support
  secondChildName?: string | null; // New: Second child name
  packageId: string;
  packageName?: string | null;
  mainTutorId?: string | null;
  mainTutorName?: string | null;
  centerId?: string | null;
  centerName?: string | null;
  startDate: string;
  endDate: string;
  timeSlot?: string; // Legacy field - may still exist for backward compatibility
  schedules?: ContractScheduleDto[]; // New: Flexible schedules array
  isOnline: boolean;
  status: string;
  offlineAddress?: string | null;
  rescheduleCount?: number; // Number of reschedules used
  maxReschedule?: number; // Maximum reschedules allowed (from package)
}

export interface CreateContractRequest {
  parentId: string;
  childId: string;
  secondChildId?: string; // New: Optional second child
  packageId: string;
  mainTutorId: string;
  substituteTutor1Id?: string; // Optional substitute tutor 1
  substituteTutor2Id?: string; // Optional substitute tutor 2
  centerId?: string;
  startDate: string;
  endDate: string;
  // Legacy fields - kept for backward compatibility but will be converted to schedules
  daysOfWeeks?: number; // Bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
  startTime?: string; // Format: "HH:mm"
  endTime?: string; // Format: "HH:mm"
  // New: Flexible schedules (preferred)
  schedules?: ContractScheduleDto[]; // Array of schedules for different days
  isOnline: boolean;
  offlineAddress?: string;
  offlineLatitude?: number;
  offlineLongitude?: number;
  videoCallPlatform?: string;
  maxDistanceKm?: number;
  paymentMethod?: 'wallet' | 'bank_transfer' | 'direct_payment'; // Payment method selection
  status?: string;
}

// Helper function to convert bitmask to DayOfWeek array
// Backend DayOfWeek enum: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
const bitmaskToDayOfWeek = (bitmask: number): number[] => {
  const days: number[] = [];
  // Bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
  // Backend DayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  const mapping: { bitmask: number; dayOfWeek: number }[] = [
    { bitmask: 1, dayOfWeek: 0 }, // Sunday
    { bitmask: 2, dayOfWeek: 1 }, // Monday
    { bitmask: 4, dayOfWeek: 2 }, // Tuesday
    { bitmask: 8, dayOfWeek: 3 }, // Wednesday
    { bitmask: 16, dayOfWeek: 4 }, // Thursday
    { bitmask: 32, dayOfWeek: 5 }, // Friday
    { bitmask: 64, dayOfWeek: 6 }  // Saturday
  ];
  
  for (const map of mapping) {
    if ((bitmask & map.bitmask) !== 0) {
      days.push(map.dayOfWeek);
    }
  }
  
  return days;
};

export async function createContract(data: CreateContractRequest) {
  // Remove reschedule_count if present (field doesn't exist in backend)
  const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanData } = data as any;
  
  // Check if mainTutorId is empty GUID - backend requires a valid tutor ID
  // Note: Backend validation requires MainTutorId to be a valid tutor (not empty GUID)
  // If it's an empty GUID placeholder, we should not send it (but backend DTO requires it)
  // For now, we'll send it and let backend handle the error gracefully
  const isEmptyGuid = cleanData.mainTutorId === '00000000-0000-0000-0000-000000000000' || 
                       !cleanData.mainTutorId || 
                       cleanData.mainTutorId.trim() === '';
  
  if (isEmptyGuid) {
    console.warn('MainTutorId is empty GUID - backend may reject this. Backend needs to allow nullable MainTutorId or a valid placeholder.');
    // Backend currently requires MainTutorId, but we need it to be nullable or allow placeholder
    // This is a limitation that needs backend fix
  }
  
  // Build schedules array - prefer schedules if provided, otherwise convert from legacy fields
  let schedules: ContractScheduleDto[] = [];
  
  if (cleanData.schedules && Array.isArray(cleanData.schedules) && cleanData.schedules.length > 0) {
    // Use provided schedules array
    schedules = cleanData.schedules;
  } else if (cleanData.daysOfWeeks && cleanData.startTime && cleanData.endTime) {
    // Convert legacy format (daysOfWeeks bitmask + startTime/endTime) to schedules array
    const selectedDays = bitmaskToDayOfWeek(cleanData.daysOfWeeks);
    
    if (selectedDays.length === 0) {
      return Promise.resolve({
        success: false,
        error: 'At least one day must be selected',
        data: null
      });
    }
    
    // Create one schedule entry for each selected day with the same time
    schedules = selectedDays.map(dayOfWeek => ({
      dayOfWeek: dayOfWeek,
      startTime: cleanData.startTime,
      endTime: cleanData.endTime
    }));
  } else {
    return Promise.resolve({
      success: false,
      error: 'Either schedules array or (daysOfWeeks + startTime + endTime) must be provided',
      data: null
    });
  }
  
  // Validate schedules
  if (schedules.length === 0) {
    return Promise.resolve({
      success: false,
      error: 'At least one schedule must be provided',
      data: null
    });
  }
  
  // Check for duplicate days
  const daySet = new Set(schedules.map(s => s.dayOfWeek));
  if (daySet.size !== schedules.length) {
    return Promise.resolve({
      success: false,
      error: 'Duplicate day of week is not allowed',
      data: null
    });
  }
  
  // Validate each schedule
  for (const schedule of schedules) {
    if (!schedule.startTime || !schedule.endTime || schedule.startTime === '' || schedule.endTime === '') {
      return Promise.resolve({
        success: false,
        error: `Start time and End time are required for day ${schedule.dayOfWeek}`,
        data: null
      });
    }
    
    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
      return Promise.resolve({
        success: false,
        error: `Invalid time format for day ${schedule.dayOfWeek}. Expected HH:mm format`,
        data: null
      });
    }
    
    // Validate startTime < endTime
    const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (startTotalMinutes >= endTotalMinutes) {
      return Promise.resolve({
        success: false,
        error: `Start time must be earlier than end time for day ${schedule.dayOfWeek}`,
        data: null
      });
    }
  }

  // Map camelCase to camelCase for backend (Backend uses JsonPropertyName with camelCase)
  // Backend expects DateOnly (YYYY-MM-DD) and TimeOnly (HH:mm) formats
  const requestData: any = {
    parentId: cleanData.parentId,
    childId: cleanData.childId,
    packageId: cleanData.packageId,
    startDate: cleanData.startDate, // Format: YYYY-MM-DD (DateOnly)
    endDate: cleanData.endDate, // Format: YYYY-MM-DD (DateOnly)
    schedules: schedules.map(s => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime, // Format: HH:mm (TimeOnly)
      endTime: s.endTime // Format: HH:mm (TimeOnly)
    })),
    isOnline: cleanData.isOnline,
    maxDistanceKm: cleanData.maxDistanceKm ?? (cleanData.isOnline ? 0 : 15),
    status: cleanData.status || 'unpaid' // Backend default is "unpaid"
  };
  
  // Add secondChildId if provided
  if (cleanData.secondChildId) {
    requestData.secondChildId = cleanData.secondChildId;
  }
  
  // mainTutorId - always send, use null if empty/invalid (don't leave field empty)
  if (cleanData.mainTutorId && 
      cleanData.mainTutorId !== '00000000-0000-0000-0000-000000000000' && 
      cleanData.mainTutorId !== null &&
      typeof cleanData.mainTutorId === 'string' &&
      cleanData.mainTutorId.trim() !== '') {
    requestData.mainTutorId = cleanData.mainTutorId;
  } else {
    requestData.mainTutorId = null; // Explicitly send null instead of omitting field
  }
  
  // substituteTutor1Id - always send, use null if not provided
  requestData.substituteTutor1Id = (cleanData.substituteTutor1Id && 
    cleanData.substituteTutor1Id !== '00000000-0000-0000-0000-000000000000' &&
    typeof cleanData.substituteTutor1Id === 'string' &&
    cleanData.substituteTutor1Id.trim() !== '')
    ? cleanData.substituteTutor1Id 
    : null;
  
  // substituteTutor2Id - always send, use null if not provided
  requestData.substituteTutor2Id = (cleanData.substituteTutor2Id && 
    cleanData.substituteTutor2Id !== '00000000-0000-0000-0000-000000000000' &&
    typeof cleanData.substituteTutor2Id === 'string' &&
    cleanData.substituteTutor2Id.trim() !== '')
    ? cleanData.substituteTutor2Id 
    : null;
  if (cleanData.centerId) {
    requestData.centerId = cleanData.centerId;
  }
  if (cleanData.offlineAddress) {
    requestData.offlineAddress = cleanData.offlineAddress;
  }
  if (cleanData.offlineLatitude !== undefined) {
    requestData.offlineLatitude = cleanData.offlineLatitude;
  }
  if (cleanData.offlineLongitude !== undefined) {
    requestData.offlineLongitude = cleanData.offlineLongitude;
  }
  // VideoCallPlatform - include if provided and isOnline is true
  // Backend DTO has JsonPropertyName("videoCallPlatform") which expects camelCase in JSON
  if (cleanData.videoCallPlatform && cleanData.isOnline) {
    requestData.videoCallPlatform = cleanData.videoCallPlatform; // Send with camelCase to match JsonPropertyName
  } else if (cleanData.isOnline && !cleanData.videoCallPlatform) {
    console.warn('Warning: isOnline is true but videoCallPlatform is not provided');
  }
  
  // Payment method is not sent to backend - it's only used in frontend to determine payment flow
  // Backend doesn't need to know payment method as it's handled differently:
  // - wallet: frontend calls deductWallet after contract creation (contract created with "pending" status, then wallet deduction)
  // - direct_payment: frontend calls createContractDirectPayment after contract creation
  //   Backend SePayService will update contract status to "unpaid" when creating payment
  
  // Set status: Backend validation only accepts "pending", "active", "completed", "cancelled" (ContractService.cs line 44)
  // Default to "pending" for new contracts - backend will handle status updates based on payment flow
  requestData.status = cleanData.status || 'pending';
  
  // Create contract request
  
  return apiService.request<{ contractId: string }>(`/contracts`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

export async function getContractsByParent(parentId: string) {
  const response = await apiService.request<Contract[]>(`/contracts/parents/${parentId}`);
  
  if (response.success && response.data) {
    // Map contract data, preserving rescheduleCount
    response.data = response.data.map((contract: any) => {
      const { reschedule_count, ...cleanContract } = contract;
      return {
        ...cleanContract,
        rescheduleCount: contract.rescheduleCount || contract.RescheduleCount || 0,
      } as Contract;
    }) as Contract[];
  }
  
  return response;
}

export async function getContractsByChild(childId: string) {
  const response = await apiService.request<Contract[]>(`/children/${childId}/contracts`);
  
  // Map contract data, preserving rescheduleCount
  if (response.success && response.data) {
    response.data = response.data.map((contract: any) => {
      const { reschedule_count, ...cleanContract } = contract;
      return {
        ...cleanContract,
        rescheduleCount: contract.rescheduleCount || contract.RescheduleCount || 0,
      } as Contract;
    }) as Contract[];
  }
  
  return response;
}

export async function getContractById(contractId: string) {
  // Backend might not have direct GET /contracts/{id} endpoint
  // So we'll try to get it from parent's contracts list
  // Or if backend has the endpoint, use it directly
  try {
    // Try direct endpoint first (if backend supports it)
    const response = await apiService.request<any>(`/contracts/${contractId}`);
    
    if (response.success && response.data) {
      const { reschedule_count, ...cleanContract } = response.data;
      
      // Helper function to convert schedules array to display string
      const formatSchedulesToString = (schedules: any[]): string => {
        if (!schedules || schedules.length === 0) return 'Not set';
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        return schedules.map((s: any) => {
          const dayOfWeek = s.dayOfWeek ?? s.DayOfWeek ?? 0;
          const dayName = dayShortNames[dayOfWeek] || `Day ${dayOfWeek}`;
          const startTime = (s.startTime ?? s.StartTime ?? '').substring(0, 5);
          const endTime = (s.endTime ?? s.EndTime ?? '').substring(0, 5);
          return `${dayName}: ${startTime}-${endTime}`;
        }).join(', ');
      };
      
      // Map timeSlot from various possible field names or construct from schedules/startTime/endTime
      let timeSlot = cleanContract.timeSlot || 
                     cleanContract.TimeSlot || 
                     cleanContract.time_slot ||
                     cleanContract.Time_Slot;
      
      // If timeSlot is not available, try to construct from schedules array (new format)
      if (!timeSlot && cleanContract.schedules && Array.isArray(cleanContract.schedules) && cleanContract.schedules.length > 0) {
        timeSlot = formatSchedulesToString(cleanContract.schedules);
      }
      
      // Fallback: try to construct from startTime and endTime (legacy format)
      if (!timeSlot) {
        const startTime = cleanContract.startTime || cleanContract.StartTime || cleanContract.start_time;
        const endTime = cleanContract.endTime || cleanContract.EndTime || cleanContract.end_time;
        if (startTime && endTime) {
          // Format time strings (handle both HH:mm and full datetime formats)
          const formatTime = (timeStr: string) => {
            if (timeStr.includes('T')) {
              // ISO datetime format
              const date = new Date(timeStr);
              return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            } else if (timeStr.includes(':')) {
              // Already in HH:mm format
              return timeStr.substring(0, 5); // Take only HH:mm part
            }
            return timeStr;
          };
          timeSlot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        }
      }
      
      return {
        success: true,
        data: {
          ...cleanContract,
          timeSlot: timeSlot || 'Not set',
          schedules: cleanContract.schedules || cleanContract.Schedules || [],
          rescheduleCount: response.data.rescheduleCount || response.data.RescheduleCount || 0,
        } as Contract,
        error: null
      };
    }
    
    return response;
  } catch (error) {
    // If direct endpoint doesn't exist, try to get from parent's contracts
    // This is a fallback approach
    console.warn('Direct contract endpoint not available, will need parent ID to fetch from list');
    return {
      success: false,
      data: null,
      error: 'Contract endpoint not available. Please use getContractsByParent and filter by ID.'
    };
  }
}

// =====================
// Course API
// =====================
export interface Course {
  course_id?: string;
  name?: string;
  description?: string;
  category?: string;
  level?: string;
  duration_weeks?: number;
  price?: number;
  max_students?: number;
  current_students?: number;
  start_date?: string;
  end_date?: string;
  schedule?: string;
  status?: string;
  image_url?: string;
  center_id?: string;
  center_name?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy fields for backward compatibility
  courseId?: string;
  title?: string;
  instructor?: string;
  duration?: string;
  rating?: number;
  totalStudents?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  thumbnail?: string;
}

export interface CreateCourseRequest {
  name: string;
  description: string;
  category: string;
  level: string;
  duration_weeks: number;
  price?: number;
  max_students?: number;
  start_date: string;
  end_date: string;
  schedule?: string;
  status?: string;
  image_url?: string;
  center_id?: string;
  // Legacy fields for API compatibility
  title?: string;
  instructor?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
}

export interface UpdateCourseRequest {
  name?: string;
  description?: string;
  category?: string;
  level?: string;
  duration_weeks?: number;
  price?: number;
  max_students?: number;
  current_students?: number;
  start_date?: string;
  end_date?: string;
  schedule?: string;
  status?: string;
  image_url?: string;
  center_id?: string;
  // Legacy fields for API compatibility
  title?: string;
  instructor?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
}

export async function getAllCourses() {
  return apiService.request<{ data: Course[] }>(`/courses`);
}

export async function getCourseById(courseId: string) {
  return apiService.request<Course>(`/courses/${courseId}`);
}

// Package API functions (wrapper for packages endpoint)
export async function getPackageById(packageId: string) {
  // Try packages endpoint first, fallback to courses
  try {
    const response = await apiService.request<Course>(`/packages/${packageId}`);
    if (response.success) {
      return response;
    }
  } catch (err) {
    console.log('Package endpoint not available, trying courses endpoint');
  }
  // Fallback to courses endpoint
  return apiService.request<Course>(`/courses/${packageId}`);
}

export async function createCourse(data: CreateCourseRequest) {
  return apiService.request<{ courseId: string }>(`/courses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourse(courseId: string, data: UpdateCourseRequest) {
  return apiService.request<void>(`/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(courseId: string) {
  return apiService.request<void>(`/courses/${courseId}`, {
    method: 'DELETE',
  });
}

export async function enrollInCourse(courseId: string) {
  return apiService.request<{ enrollmentId: string }>(`/courses/${courseId}/enroll`, {
    method: 'POST',
  });
}

export async function getCourseModules(courseId: string) {
  return apiService.request<any[]>(`/courses/${courseId}/modules`);
}

export async function getCourseReviews(courseId: string) {
  return apiService.request<any[]>(`/courses/${courseId}/reviews`);
}

// Tutor Availability API
export interface TutorAvailability {
  availabilityId?: string;
  tutorId?: string;
  daysOfWeek: number; // Bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64 (BE format)
  availableFrom: string; // TimeOnly format: "HH:mm"
  availableUntil: string; // TimeOnly format: "HH:mm"
  effectiveFrom: string; // DateOnly format: "YYYY-MM-DD"
  effectiveUntil?: string | null; // DateOnly format: "YYYY-MM-DD" or null
  canTeachOnline: boolean;
  canTeachOffline: boolean;
  status?: string;
  createdDate?: string;
  updatedDate?: string | null;
  isBooked?: boolean | null;
}

export interface CreateTutorAvailabilityRequest {
  TutorId?: string; // Optional, backend will use from token if not provided
  DaysOfWeek: number;
  AvailableFrom: string; // "HH:mm"
  AvailableUntil: string; // "HH:mm"
  EffectiveFrom: string; // "YYYY-MM-DD"
  EffectiveUntil?: string | null; // "YYYY-MM-DD" or null
  CanTeachOnline: boolean;
  CanTeachOffline: boolean;
}

// BE UpdateTutorScheduleRequest has all optional fields
export interface UpdateTutorAvailabilityRequest {
  DaysOfWeek?: number;
  AvailableFrom?: string; // "HH:mm"
  AvailableUntil?: string; // "HH:mm"
  EffectiveFrom?: string; // "YYYY-MM-DD"
  EffectiveUntil?: string | null; // "YYYY-MM-DD" or null
  CanTeachOnline?: boolean;
  CanTeachOffline?: boolean;
  IsBooked?: boolean;
}

export interface BulkCreateTutorAvailabilityRequest {
  availabilities: CreateTutorAvailabilityRequest[];
}

// Backend expects array directly, not wrapped in object
// type BulkCreateTutorAvailabilityRequestArray = CreateTutorAvailabilityRequest[]; // Unused type

export interface UpdateAvailabilityStatusRequest {
  Status: string; // BE expects PascalCase: "active", "inactive", "deleted"
}

// GET /api/tutor-availabilities/my-availabilities
export async function getMyAvailabilities(activeOnly?: boolean) {
  const query = activeOnly ? '?activeOnly=true' : '';
  const result = await apiService.request<any[]>(`/tutor-availabilities/my-availabilities${query}`);
  
  if (result.success && result.data) {
    // Debug: Log raw response from BE
    console.log('[getMyAvailabilities] Raw API response:', result.data);
    if (result.data.length > 0) {
      const sampleItem = result.data[0];
      console.log('[getMyAvailabilities] Sample raw item from BE:', sampleItem);
      console.log('[getMyAvailabilities] All keys in raw item:', Object.keys(sampleItem));
      console.log('[getMyAvailabilities] All daysOfWeek fields in raw item:', {
        daysOfWeek: sampleItem.daysOfWeek,
        days_of_week: sampleItem.days_of_week,
        DaysOfWeek: sampleItem.DaysOfWeek,
        DaysOfWeeks: sampleItem.DaysOfWeeks,
        daysOfWeeks: sampleItem.daysOfWeeks, // camelCase version
        days_of_weeks: sampleItem.days_of_weeks,
      });
      // Log the actual value if found
      const foundValue = sampleItem.daysOfWeek ?? sampleItem.days_of_week ?? sampleItem.DaysOfWeek ?? sampleItem.DaysOfWeeks ?? sampleItem.daysOfWeeks ?? sampleItem.days_of_weeks;
      console.log('[getMyAvailabilities] Found daysOfWeek value:', foundValue, 'Type:', typeof foundValue);
    }
    
    // Map snake_case from backend to camelCase for frontend
    const mappedData: TutorAvailability[] = result.data.map((item: any, index: number) => {
      // Try all possible field names - BE might serialize DaysOfWeeks as daysOfWeeks (camelCase) or DaysOfWeeks (PascalCase)
      const daysOfWeekValue = item.daysOfWeeks ?? item.DaysOfWeeks ?? item.daysOfWeek ?? item.DaysOfWeek ?? item.days_of_week ?? item.days_of_weeks ?? 0;
      
      // Debug: Log mapping for each item
      if (index < 3) { // Log first 3 items
        console.log(`[getMyAvailabilities] Mapping item ${index + 1}:`, {
          allKeys: Object.keys(item),
          rawDaysOfWeek: {
            daysOfWeek: item.daysOfWeek,
            daysOfWeeks: item.daysOfWeeks, // camelCase (most likely)
            days_of_week: item.days_of_week,
            DaysOfWeek: item.DaysOfWeek,
            DaysOfWeeks: item.DaysOfWeeks, // PascalCase
            days_of_weeks: item.days_of_weeks,
          },
          mappedDaysOfWeek: daysOfWeekValue,
          binary: daysOfWeekValue.toString(2),
        });
      }
      
      return {
        availabilityId: item.availabilityId || item.availability_id || item.AvailabilityId || item.id,
        tutorId: item.tutorId || item.tutor_id || item.TutorId,
        daysOfWeek: daysOfWeekValue, // BE uses DaysOfWeeks (PascalCase)
        availableFrom: item.availableFrom || item.available_from || item.AvailableFrom || '',
        availableUntil: item.availableUntil || item.available_until || item.AvailableUntil || '',
        effectiveFrom: item.effectiveFrom || item.effective_from || item.EffectiveFrom || '',
        effectiveUntil: item.effectiveUntil ?? item.effective_until ?? item.EffectiveUntil ?? null,
        canTeachOnline: item.canTeachOnline ?? item.can_teach_online ?? item.CanTeachOnline ?? false,
        canTeachOffline: item.canTeachOffline ?? item.can_teach_offline ?? item.CanTeachOffline ?? false,
        status: item.status || item.Status || 'active',
        createdDate: item.createdDate || item.created_date || item.CreatedDate,
        updatedDate: item.updatedDate ?? item.updated_date ?? item.UpdatedDate ?? null,
        isBooked: item.isBooked ?? item.is_booked ?? item.IsBooked ?? null,
      };
    });
    
    console.log('[getMyAvailabilities] Mapped data:', mappedData);
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// GET /api/tutor-availabilities/{id}
export async function getTutorAvailabilityById(id: string) {
  const result = await apiService.request<any>(`/tutor-availabilities/${id}`);
  
  if (result.success && result.data) {
    const item = result.data;
    // Map snake_case from backend to camelCase for frontend
    const mappedData: TutorAvailability = {
      availabilityId: item.availabilityId || item.availability_id || item.AvailabilityId || item.id,
      tutorId: item.tutorId || item.tutor_id || item.TutorId,
      daysOfWeek: item.daysOfWeeks ?? item.DaysOfWeeks ?? item.daysOfWeek ?? item.DaysOfWeek ?? item.days_of_week ?? item.days_of_weeks ?? 0, // BE uses DaysOfWeeks (camelCase when serialized)
      availableFrom: item.availableFrom || item.available_from || item.AvailableFrom || '',
      availableUntil: item.availableUntil || item.available_until || item.AvailableUntil || '',
      effectiveFrom: item.effectiveFrom || item.effective_from || item.EffectiveFrom || '',
      effectiveUntil: item.effectiveUntil ?? item.effective_until ?? item.EffectiveUntil ?? null,
      canTeachOnline: item.canTeachOnline ?? item.can_teach_online ?? item.CanTeachOnline ?? false,
      canTeachOffline: item.canTeachOffline ?? item.can_teach_offline ?? item.CanTeachOffline ?? false,
      status: item.status || item.Status || 'active',
      createdDate: item.createdDate || item.created_date || item.CreatedDate,
      updatedDate: item.updatedDate ?? item.updated_date ?? item.UpdatedDate ?? null,
      isBooked: item.isBooked ?? item.is_booked ?? item.IsBooked ?? null,
    };
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// GET /api/tutor-availabilities/tutor/{tutorId}
// REMOVED: This endpoint does not exist in the backend
// export async function getTutorAvailabilitiesByTutorId(tutorId: string) { ... }

// POST /api/tutor-availabilities
export async function createTutorAvailability(data: CreateTutorAvailabilityRequest) {
  const result = await apiService.request<any>(`/tutor-availabi lities`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (result.success && result.data) {
    const item = result.data;
    // Map snake_case from backend to camelCase for frontend
    const mappedData: TutorAvailability = {
      availabilityId: item.availabilityId || item.availability_id || item.AvailabilityId || item.id,
      tutorId: item.tutorId || item.tutor_id || item.TutorId,
      daysOfWeek: item.daysOfWeeks ?? item.DaysOfWeeks ?? item.daysOfWeek ?? item.DaysOfWeek ?? item.days_of_week ?? item.days_of_weeks ?? 0, // BE uses DaysOfWeeks (camelCase when serialized)
      availableFrom: item.availableFrom || item.available_from || item.AvailableFrom || '',
      availableUntil: item.availableUntil || item.available_until || item.AvailableUntil || '',
      effectiveFrom: item.effectiveFrom || item.effective_from || item.EffectiveFrom || '',
      effectiveUntil: item.effectiveUntil ?? item.effective_until ?? item.EffectiveUntil ?? null,
      canTeachOnline: item.canTeachOnline ?? item.can_teach_online ?? item.CanTeachOnline ?? false,
      canTeachOffline: item.canTeachOffline ?? item.can_teach_offline ?? item.CanTeachOffline ?? false,
      status: item.status || item.Status || 'active',
      createdDate: item.createdDate || item.created_date || item.CreatedDate,
      updatedDate: item.updatedDate ?? item.updated_date ?? item.UpdatedDate ?? null,
      isBooked: item.isBooked ?? item.is_booked ?? item.IsBooked ?? null,
    };
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// PUT /api/tutor-availabilities/{id}
// BE expects UpdateTutorScheduleRequest with optional fields (PascalCase)
export async function updateTutorAvailability(id: string, data: UpdateTutorAvailabilityRequest | CreateTutorAvailabilityRequest) {
  // Convert to BE format (PascalCase, optional fields)
  const requestBody: any = {};
  if ('DaysOfWeek' in data && data.DaysOfWeek !== undefined) requestBody.DaysOfWeek = data.DaysOfWeek;
  if ('AvailableFrom' in data && data.AvailableFrom !== undefined) requestBody.AvailableFrom = data.AvailableFrom;
  if ('AvailableUntil' in data && data.AvailableUntil !== undefined) requestBody.AvailableUntil = data.AvailableUntil;
  if ('EffectiveFrom' in data && data.EffectiveFrom !== undefined) requestBody.EffectiveFrom = data.EffectiveFrom;
  if ('EffectiveUntil' in data) requestBody.EffectiveUntil = data.EffectiveUntil ?? null;
  if ('CanTeachOnline' in data && data.CanTeachOnline !== undefined) requestBody.CanTeachOnline = data.CanTeachOnline;
  if ('CanTeachOffline' in data && data.CanTeachOffline !== undefined) requestBody.CanTeachOffline = data.CanTeachOffline;
  if ('IsBooked' in data && data.IsBooked !== undefined) requestBody.IsBooked = data.IsBooked;
  
  const result = await apiService.request<any>(`/tutor-availabilities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(requestBody),
  });
  
  if (result.success && result.data) {
    const item = result.data;
    // Map snake_case from backend to camelCase for frontend
    const mappedData: TutorAvailability = {
      availabilityId: item.availabilityId || item.availability_id || item.AvailabilityId || item.id,
      tutorId: item.tutorId || item.tutor_id || item.TutorId,
      daysOfWeek: item.daysOfWeeks ?? item.DaysOfWeeks ?? item.daysOfWeek ?? item.DaysOfWeek ?? item.days_of_week ?? item.days_of_weeks ?? 0, // BE uses DaysOfWeeks (camelCase when serialized)
      availableFrom: item.availableFrom || item.available_from || item.AvailableFrom || '',
      availableUntil: item.availableUntil || item.available_until || item.AvailableUntil || '',
      effectiveFrom: item.effectiveFrom || item.effective_from || item.EffectiveFrom || '',
      effectiveUntil: item.effectiveUntil ?? item.effective_until ?? item.EffectiveUntil ?? null,
      canTeachOnline: item.canTeachOnline ?? item.can_teach_online ?? item.CanTeachOnline ?? false,
      canTeachOffline: item.canTeachOffline ?? item.can_teach_offline ?? item.CanTeachOffline ?? false,
      status: item.status || item.Status || 'active',
      createdDate: item.createdDate || item.created_date || item.CreatedDate,
      updatedDate: item.updatedDate ?? item.updated_date ?? item.UpdatedDate ?? null,
      isBooked: item.isBooked ?? item.is_booked ?? item.IsBooked ?? null,
    };
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// DELETE /api/tutor-availabilities/{id}
export async function deleteTutorAvailability(id: string) {
  return apiService.request<void>(`/tutor-availabilities/${id}`, {
    method: 'DELETE',
  });
}

// PATCH /api/tutor-availabilities/{id}/status
// BE expects: { Status: "active" | "inactive" | "deleted" } (PascalCase)
export async function updateTutorAvailabilityStatus(id: string, data: UpdateAvailabilityStatusRequest) {
  // Ensure Status is PascalCase as BE expects
  const requestBody = {
    Status: data.Status,
  };
  const result = await apiService.request<any>(`/tutor-availabilities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(requestBody),
  });
  
  if (result.success && result.data) {
    const item = result.data;
    // Map snake_case from backend to camelCase for frontend
    const mappedData: TutorAvailability = {
      availabilityId: item.availabilityId || item.availability_id || item.AvailabilityId || item.id,
      tutorId: item.tutorId || item.tutor_id || item.TutorId,
      daysOfWeek: item.daysOfWeeks ?? item.DaysOfWeeks ?? item.daysOfWeek ?? item.DaysOfWeek ?? item.days_of_week ?? item.days_of_weeks ?? 0, // BE uses DaysOfWeeks (camelCase when serialized)
      availableFrom: item.availableFrom || item.available_from || item.AvailableFrom || '',
      availableUntil: item.availableUntil || item.available_until || item.AvailableUntil || '',
      effectiveFrom: item.effectiveFrom || item.effective_from || item.EffectiveFrom || '',
      effectiveUntil: item.effectiveUntil ?? item.effective_until ?? item.EffectiveUntil ?? null,
      canTeachOnline: item.canTeachOnline ?? item.can_teach_online ?? item.CanTeachOnline ?? false,
      canTeachOffline: item.canTeachOffline ?? item.can_teach_offline ?? item.CanTeachOffline ?? false,
      status: item.status || item.Status || 'active',
      createdDate: item.createdDate || item.created_date || item.CreatedDate,
      updatedDate: item.updatedDate ?? item.updated_date ?? item.UpdatedDate ?? null,
      isBooked: item.isBooked ?? item.is_booked ?? item.IsBooked ?? null,
    };
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// POST /api/tutor-availabilities/bulk
// Backend expects array directly: List<CreateTutorScheduleRequest>
export async function bulkCreateTutorAvailabilities(data: BulkCreateTutorAvailabilityRequest | CreateTutorAvailabilityRequest[]) {
  // Backend expects array directly, not wrapped in object
  // If data is an array, use it directly
  // If data is an object with 'availabilities' field, extract the array
  const requestsArray = Array.isArray(data) ? data : data.availabilities;
  
  const result = await apiService.request<any[]>(`/tutor-availabilities/bulk`, {
    method: 'POST',
    body: JSON.stringify(requestsArray),
  });
  
  if (result.success && result.data) {
    // Map snake_case from backend to camelCase for frontend
    const mappedData: TutorAvailability[] = result.data.map((item: any) => ({
      availabilityId: item.availabilityId || item.availability_id || item.AvailabilityId || item.id,
      tutorId: item.tutorId || item.tutor_id || item.TutorId,
      daysOfWeek: item.daysOfWeeks ?? item.DaysOfWeeks ?? item.daysOfWeek ?? item.DaysOfWeek ?? item.days_of_week ?? item.days_of_weeks ?? 0, // BE uses DaysOfWeeks (camelCase when serialized)
      availableFrom: item.availableFrom || item.available_from || item.AvailableFrom || '',
      availableUntil: item.availableUntil || item.available_until || item.AvailableUntil || '',
      effectiveFrom: item.effectiveFrom || item.effective_from || item.EffectiveFrom || '',
      effectiveUntil: item.effectiveUntil ?? item.effective_until ?? item.EffectiveUntil ?? null,
      canTeachOnline: item.canTeachOnline ?? item.can_teach_online ?? item.CanTeachOnline ?? false,
      canTeachOffline: item.canTeachOffline ?? item.can_teach_offline ?? item.CanTeachOffline ?? false,
      status: item.status || item.Status || 'active',
      createdDate: item.createdDate || item.created_date || item.CreatedDate,
      updatedDate: item.updatedDate ?? item.updated_date ?? item.UpdatedDate ?? null,
      isBooked: item.isBooked ?? item.is_booked ?? item.IsBooked ?? null,
    }));
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// GET /api/tutor-availabilities/dayflags
export async function getDayFlags() {
  return apiService.request<any>(`/tutor-availabilities/dayflags`);
}

// GET /api/tutor-availabilities/search-tutors
export async function searchTutorsByAvailability(params?: {
  daysOfWeek?: number;
  availableFrom?: string;
  availableUntil?: string;
  canTeachOnline?: boolean;
  canTeachOffline?: boolean;
  centerId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const query = queryParams.toString();
  return apiService.request<any[]>(`/tutor-availabilities/search-tutors${query ? `?${query}` : ''}`);
}
// ============================================
// STAFF API FUNCTIONS
// ============================================

// Reschedule Management
export interface RescheduleRequest {
  requestId: string;
  bookingId: string;
  contractId: string;
  parentId: string;
  parentName: string;
  childName?: string;
  requestedDate: string;
  requestedTimeSlot?: string;
  startTime?: string;
  endTime?: string;
  requestedTutorId?: string;
  requestedTutorName?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdDate: string;
  processedDate?: string;
  staffId?: string;
  staffName?: string;
  originalSessionDate?: string;
  originalStartTime?: string;
  originalEndTime?: string;
  originalTutorId?: string;
  originalTutorName?: string;
  tutorId?: string; // ID of tutor who created this request (null if created by parent)
  tutorName?: string; // Name of tutor who created this request
}

export interface CreateRescheduleRequest {
  bookingId: string;
  requestedDate: string; // Required: Date in YYYY-MM-DD format (DateOnly)
  startTime: string; // Required: Start time in HH:mm format (TimeOnly) - must be 16:00, 17:30, 19:00, or 20:30
  endTime: string; // Required: End time in HH:mm format (TimeOnly) - must be startTime + 90 minutes
  // Note: requestedTutorId is not supported in backend (commented out in CreateRescheduleRequestDto)
  reason?: string; // Optional: reason for rescheduling
}

export interface ApproveRescheduleRequest {
  newTutorId?: string; // Optional: if not provided, uses requestedTutorId or original tutor
  note?: string; // Optional: staff note about the approval
}

export interface RejectRescheduleRequest {
  reason: string;
}

export interface AvailableSubTutor {
  tutorId: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  rating?: number;
  isAvailable: boolean;
}

// Get all reschedule requests
// Backend: GET /api/reschedule?parentId={parentId} (optional, staff sees all, parent sees only their own)
// Note: Backend doesn't support status filter, filtering is done on frontend
export async function getRescheduleRequests(_status?: 'pending' | 'approved' | 'rejected') {
  try {
    // Backend doesn't have status query param, we'll filter on frontend
    const result = await apiService.request<any[]>(`/reschedule`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Map backend DTO to frontend interface
      const mappedData: RescheduleRequest[] = result.data.map((item: any) => ({
        requestId: item.requestId || item.RequestId || '',
        bookingId: item.bookingId || item.BookingId || '',
        contractId: item.contractId || item.ContractId || '',
        parentId: item.parentId || item.ParentId || '',
        parentName: item.parentName || item.ParentName || '',
        childName: item.childName || item.ChildName,
        requestedDate: item.requestedDate || item.RequestedDate || '',
        requestedTimeSlot: item.startTime && item.endTime 
          ? `${item.startTime} - ${item.endTime}`
          : item.requestedTimeSlot || item.RequestedTimeSlot,
        startTime: item.startTime || item.StartTime,
        endTime: item.endTime || item.EndTime,
        requestedTutorId: item.requestedTutorId || item.RequestedTutorId,
        requestedTutorName: item.requestedTutorName || item.RequestedTutorName,
        reason: item.reason || item.Reason,
        status: (item.status || item.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected',
        createdDate: item.createdDate || item.CreatedDate || '',
        processedDate: item.processedDate || item.ProcessedDate,
        staffId: item.staffId || item.StaffId,
        staffName: item.staffName || item.StaffName,
        originalSessionDate: item.originalSessionDate || item.OriginalSessionDate,
        originalStartTime: item.originalStartTime || item.OriginalStartTime,
        originalEndTime: item.originalEndTime || item.OriginalEndTime,
        originalTutorId: item.originalTutorId || item.OriginalTutorId,
        originalTutorName: item.originalTutorName || item.OriginalTutorName,
        tutorId: item.tutorId || item.TutorId,
        tutorName: item.tutorName || item.TutorName,
      }));
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch reschedule requests',
    };
  }
}

// Create reschedule request
// Backend DTO: BookingId, RequestedDate (DateOnly), StartTime (TimeOnly), EndTime (TimeOnly), Reason (optional)
// Note: RequestedTutorId is commented out in backend DTO, so we don't send it
export async function createRescheduleRequest(data: CreateRescheduleRequest) {
  try {
    const requestBody: any = {
      bookingId: data.bookingId,
      requestedDate: data.requestedDate, // Required: DateOnly format (YYYY-MM-DD)
      startTime: data.startTime, // Required: TimeOnly format (HH:mm)
      endTime: data.endTime, // Required: TimeOnly format (HH:mm)
    };
    
    // Optional fields
    if (data.reason && data.reason.trim() !== '') {
      requestBody.reason = data.reason;
    }
    // Note: requestedTutorId is not supported in backend (commented out in CreateRescheduleRequestDto)
    
    const result = await apiService.request<{ requestId: string; status: string; message: string }>(`/reschedule`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to create reschedule request',
    };
  }
}

// Create make-up session request (compensatory lesson - does NOT deduct RescheduleCount)
// Backend endpoint: POST /api/reschedule/make-up
// Backend automatically sets reason to "Reschedule due to Tutor unavailability"
export async function createMakeUpSession(data: Omit<CreateRescheduleRequest, 'reason'>) {
  try {
    const requestBody: any = {
      bookingId: data.bookingId,
      requestedDate: data.requestedDate, // Required: DateOnly format (YYYY-MM-DD)
      startTime: data.startTime, // Required: TimeOnly format (HH:mm)
      endTime: data.endTime, // Required: TimeOnly format (HH:mm)
    };
    // Note: Reason is automatically set by backend to "Reschedule due to Tutor unavailability"
    // Note: requestedTutorId is not supported in backend
    
    const result = await apiService.request<{ requestId: string; status: string; message: string }>(`/reschedule/make-up`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to create make-up session request',
    };
  }
}

// Get reschedule request by ID
export async function getRescheduleRequestById(requestId: string) {
  try {
    const result = await apiService.request<any>(`/reschedule/${requestId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const item = result.data;
      const mappedData: RescheduleRequest = {
        requestId: item.requestId || item.RequestId || requestId,
        bookingId: item.bookingId || item.BookingId || '',
        contractId: item.contractId || item.ContractId || '',
        parentId: item.parentId || item.ParentId || '',
        parentName: item.parentName || item.ParentName || '',
        childName: item.childName || item.ChildName,
        requestedDate: item.requestedDate || item.RequestedDate || '',
        requestedTimeSlot: item.startTime && item.endTime 
          ? `${item.startTime} - ${item.endTime}`
          : item.requestedTimeSlot || item.RequestedTimeSlot,
        startTime: item.startTime || item.StartTime,
        endTime: item.endTime || item.EndTime,
        requestedTutorId: item.requestedTutorId || item.RequestedTutorId,
        requestedTutorName: item.requestedTutorName || item.RequestedTutorName,
        reason: item.reason || item.Reason,
        status: (item.status || item.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected',
        createdDate: item.createdDate || item.CreatedDate || '',
        processedDate: item.processedDate || item.ProcessedDate,
        staffId: item.staffId || item.StaffId,
        staffName: item.staffName || item.StaffName,
        originalSessionDate: item.originalSessionDate || item.OriginalSessionDate,
        originalStartTime: item.originalStartTime || item.OriginalStartTime,
        originalEndTime: item.originalEndTime || item.OriginalEndTime,
        originalTutorId: item.originalTutorId || item.OriginalTutorId,
        originalTutorName: item.originalTutorName || item.OriginalTutorName,
        tutorId: item.tutorId || item.TutorId,
        tutorName: item.tutorName || item.TutorName,
      };
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to fetch reschedule request',
    };
  }
}

// Get available sub tutors for reschedule request
export async function getAvailableSubTutors(rescheduleRequestId: string) {
  try {
    const result = await apiService.request<{ availableTutors: any[]; totalAvailable: number }>(`/reschedule/${rescheduleRequestId}/available-sub-tutors`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const mappedData: AvailableSubTutor[] = (result.data.availableTutors || []).map((tutor: any) => ({
        tutorId: tutor.tutorId || tutor.TutorId || '',
        fullName: tutor.fullName || tutor.FullName || '',
        phoneNumber: tutor.phoneNumber || tutor.PhoneNumber,
        email: tutor.email || tutor.Email,
        rating: tutor.rating || tutor.Rating,
        isAvailable: tutor.isAvailable ?? tutor.IsAvailable ?? true,
      }));
      
      return {
        success: true,
        data: {
          availableTutors: mappedData,
          totalAvailable: result.data.totalAvailable || mappedData.length,
        },
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: { availableTutors: [], totalAvailable: 0 },
      error: error?.message || 'Failed to fetch available sub tutors',
    };
  }
}

// Get reschedule requests by tutor ID
// Backend: GET /api/reschedule/by-tutor/{tutorId}
// Returns only CHANGE TUTOR requests related to the tutor
export async function getRescheduleRequestsByTutorId(tutorId: string) {
  try {
    const result = await apiService.request<any[]>(`/reschedule/by-tutor/${tutorId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Map backend DTO to frontend interface
      const mappedData: RescheduleRequest[] = result.data.map((item: any) => ({
        requestId: item.requestId || item.RequestId || '',
        bookingId: item.bookingId || item.BookingId || '',
        contractId: item.contractId || item.ContractId || '',
        parentId: item.parentId || item.ParentId || '',
        parentName: item.parentName || item.ParentName || '',
        childName: item.childName || item.ChildName,
        requestedDate: item.requestedDate || item.RequestedDate || '',
        requestedTimeSlot: item.startTime && item.endTime 
          ? `${item.startTime} - ${item.endTime}`
          : item.requestedTimeSlot || item.RequestedTimeSlot,
        startTime: item.startTime || item.StartTime,
        endTime: item.endTime || item.EndTime,
        requestedTutorId: item.requestedTutorId || item.RequestedTutorId,
        requestedTutorName: item.requestedTutorName || item.RequestedTutorName,
        reason: item.reason || item.Reason,
        status: (item.status || item.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected',
        createdDate: item.createdDate || item.CreatedDate || '',
        processedDate: item.processedDate || item.ProcessedDate,
        staffId: item.staffId || item.StaffId,
        staffName: item.staffName || item.StaffName,
        originalSessionDate: item.originalSessionDate || item.OriginalSessionDate,
        originalStartTime: item.originalStartTime || item.OriginalStartTime,
        originalEndTime: item.originalEndTime || item.OriginalEndTime,
        originalTutorId: item.originalTutorId || item.OriginalTutorId,
        originalTutorName: item.originalTutorName || item.OriginalTutorName,
        tutorId: item.tutorId || item.TutorId,
        tutorName: item.tutorName || item.TutorName,
      }));
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch reschedule requests',
    };
  }
}

export async function approveRescheduleRequest(requestId: string, data: ApproveRescheduleRequest) {
  try {
    const requestBody: any = {};
    
    // Only include newTutorId if provided (not empty string)
    if (data.newTutorId && data.newTutorId.trim() !== '') {
      requestBody.newTutorId = data.newTutorId;
    }
    
    // Only include note if provided
    if (data.note && data.note.trim() !== '') {
      requestBody.note = data.note;
    }
    
    const result = await apiService.request<{ message: string }>(`/reschedule/${requestId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to approve reschedule request',
    };
  }
}

export async function rejectRescheduleRequest(requestId: string, data: RejectRescheduleRequest) {
  try {
    const result = await apiService.request<{ message: string }>(`/reschedule/${requestId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({
        reason: data.reason,
      }),
    });
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to reject reschedule request',
    };
  }
}

// Cancel session and refund when no tutors available
export interface CancelSessionResponse {
  requestId: string;
  status: string;
  message: string;
  processedDate: string;
}

export async function cancelRescheduleSession(bookingId: string, rescheduleRequestId?: string) {
  try {
    // Only include rescheduleRequestId in query if it's provided and not empty
    // Check for null, undefined, empty string, or whitespace-only string
    const hasValidRequestId = rescheduleRequestId != null && 
                              typeof rescheduleRequestId === 'string' && 
                              rescheduleRequestId.trim() !== '';
    
    const queryParam = hasValidRequestId 
      ? `?rescheduleRequestId=${encodeURIComponent(rescheduleRequestId.trim())}` 
      : '';
    
    const result = await apiService.request<CancelSessionResponse>(
      `/reschedule/cancel-session/${bookingId}${queryParam}`, 
      {
        method: 'POST',
      }
    );
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to cancel session',
    };
  }
}

// Create reschedule or refund notification for parent
export interface CreateRescheduleOrRefundNotificationRequest {
  requestId: string; // Required: reschedule request ID
  contractId: string;
  bookingId: string;
}

export interface CreateRescheduleOrRefundNotificationResponse {
  notificationId: string;
  userId: string;
  contractId: string;
  bookingId: string;
  title: string;
  message: string;
  notificationType: string;
  status: string;
  createdDate: string;
}

export async function createRescheduleOrRefundNotification(data: CreateRescheduleOrRefundNotificationRequest) {
  try {
    const result = await apiService.request<CreateRescheduleOrRefundNotificationResponse>(
      `/notification/reschedule-refund-request`,
      {
        method: 'POST',
        body: JSON.stringify({
          requestId: data.requestId,
          contractId: data.contractId,
          bookingId: data.bookingId,
        }),
      }
    );
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to create reschedule or refund notification',
    };
  }
}

// Tutor request replacement (change teacher for a session)
export interface TutorReplacementRequest {
  bookingId: string;
  reason?: string;
}

export interface TutorReplacementResponse {
  requestId: string;
  bookingId: string;
  sessionDate: string;
  originalTutor: string;
  message: string;
}

export async function requestTutorReplacement(data: TutorReplacementRequest) {
  try {
    const requestBody: any = {
      bookingId: data.bookingId,
    };
    
    // Optional reason
    if (data.reason && data.reason.trim() !== '') {
      requestBody.reason = data.reason;
    }
    
    const result = await apiService.request<TutorReplacementResponse>(`/reschedule/tutor-replacement`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to request tutor replacement',
    };
  }
}

// Parent response to reschedule or refund notification
export interface RespondToRescheduleOrRefundRequest {
  bookingId: string;
  contractId: string;
  choice: 'makeup' | 'refund';
  requestedDate?: string; // Required if choice is 'makeup'
  startTime?: string; // Required if choice is 'makeup'
  endTime?: string; // Required if choice is 'makeup'
}

export interface RespondToRescheduleOrRefundResponse {
  success: boolean;
  message: string;
  refundAmount?: number;
}

export async function respondToRescheduleOrRefund(data: RespondToRescheduleOrRefundRequest) {
  try {
    if (data.choice === 'makeup') {
      // For makeup session, create a new reschedule request
      if (!data.requestedDate || !data.startTime || !data.endTime) {
        return {
          success: false,
          data: null,
          error: 'Date and time are required for makeup session',
        };
      }
      
      const rescheduleRequest: CreateRescheduleRequest = {
        bookingId: data.bookingId,
        requestedDate: data.requestedDate,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: 'Makeup session - no tutors available for original reschedule request',
      };
      
      const result = await createRescheduleRequest(rescheduleRequest);
      return {
        success: result.success,
        data: result.data ? {
          success: true,
          message: result.data.message || 'Makeup session request submitted successfully',
        } : null,
        error: result.error,
      };
    } else {
      // For refund, cancel the session
      // First, find the reschedule request ID if exists
      const rescheduleRequests = await getRescheduleRequests();
      let rescheduleRequestId: string | undefined = undefined;
      
      if (rescheduleRequests.success && rescheduleRequests.data) {
        // Try to find pending request first
        let request = rescheduleRequests.data.find(
          (r: RescheduleRequest) => r.bookingId === data.bookingId && r.status === 'pending'
        );
        
        // If no pending request, try to find any request for this booking
        if (!request) {
          request = rescheduleRequests.data.find(
            (r: RescheduleRequest) => r.bookingId === data.bookingId
          );
        }
        
        // Ensure requestId is valid (not null, undefined, or empty string)
        if (request?.requestId && 
            typeof request.requestId === 'string' && 
            request.requestId.trim() !== '') {
          rescheduleRequestId = request.requestId.trim();
        }
      }
      
      // Only call cancelRescheduleSession if we have a valid rescheduleRequestId
      // Backend requires rescheduleRequestId to be present
      if (!rescheduleRequestId) {
        return {
          success: false,
          data: null,
          error: 'Cannot cancel session: No reschedule request found. Please create a reschedule request first or contact staff for assistance.',
        };
      }
      
      // Get session ID from booking ID (they are the same)
      // Pass rescheduleRequestId (required by backend)
      const result = await cancelRescheduleSession(data.bookingId, rescheduleRequestId);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: {
            success: true,
            message: result.data.message || 'Session cancelled and refund processed successfully',
            refundAmount: undefined, // Backend should return this
          },
          error: undefined,
        };
      } else {
        return {
          success: false,
          data: null,
          error: result.error || 'Failed to process refund',
        };
      }
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to respond to reschedule or refund notification',
    };
  }
}

// Staff Dashboard Stats
export interface StaffStats {
  pendingContracts: number;
  activeTutors: number;
  totalCenters: number;
  unreadMessages: number;
  upcomingSessions: number;
  completedSessions: number;
  rescheduleRequests: number;
  newParentRequests: number;
}

export async function getStaffStats() {
  try {
    const [contractsRes, rescheduleRes, tutorsRes, centersRes, sessionStatsRes] = await Promise.all([
      getAllContracts(),
      getRescheduleRequests('pending'),
      getAllTutors(),
      getAllCenters(),
      getSessionStatistics(),
    ]);

    // Calculate pending contracts: only count contracts with explicit 'pending' status
    // Do not count null/undefined/empty status or 'unpaid' status
    let pendingContracts = 0;
    if (contractsRes.success && contractsRes.data && Array.isArray(contractsRes.data)) {
      pendingContracts = contractsRes.data.filter((c: any) => {
        // Get status from contract (handle both PascalCase and camelCase)
        const rawStatus = c.Status || c.status;
        
        // Only process if status exists and is not null/undefined/empty
        if (!rawStatus || rawStatus === null || rawStatus === undefined || String(rawStatus).trim() === '') {
          return false;
        }
        
        // Convert to string and normalize (lowercase, trim whitespace)
        const normalizedStatus = String(rawStatus).toLowerCase().trim();
        
        // Only count contracts with explicit 'pending' status (not 'unpaid')
        return normalizedStatus === 'pending';
      }).length;
    }

    // Calculate reschedule requests - filter by pending status on frontend
    // Only count requests with explicit 'pending' status that haven't been processed
    let rescheduleRequests = 0;
    if (rescheduleRes.success && rescheduleRes.data && Array.isArray(rescheduleRes.data)) {
      rescheduleRequests = rescheduleRes.data.filter((r: any) => {
        // Status is already normalized to lowercase in getRescheduleRequests mapping
        const status = (r.status || '').toLowerCase().trim();
        
        // Only count if status is explicitly 'pending'
        if (status !== 'pending') {
          return false;
        }
        
        // Additional check: A truly pending request should not have been processed yet
        // (no processedDate and no staffId means it hasn't been processed)
        const hasProcessedDate = r.processedDate || r.ProcessedDate;
        const hasStaffId = r.staffId || r.StaffId;
        
        // Count as pending only if it hasn't been processed
        return !hasProcessedDate && !hasStaffId;
      }).length;
    }

    // Calculate active tutors: tutors with verified status
    let activeTutors = 0;
    if (tutorsRes.success && tutorsRes.data) {
      activeTutors = tutorsRes.data.filter((t: any) => {
        const status = (t.verificationStatus || t.VerificationStatus || t.status || '').toString().toLowerCase().trim();
        return status === 'approved' || status === 'verified' || status === 'active';
      }).length;
    }

    // Calculate total centers
    let totalCenters = 0;
    if (centersRes.success && centersRes.data) {
      if (Array.isArray(centersRes.data)) {
        totalCenters = centersRes.data.length;
      } else if (centersRes.data.data && Array.isArray(centersRes.data.data)) {
        totalCenters = centersRes.data.data.length;
      }
    }

    // Calculate completed and upcoming sessions from session statistics
    let completedSessions = 0;
    let upcomingSessions = 0;
    if (sessionStatsRes.success && sessionStatsRes.data) {
      const stats = sessionStatsRes.data;
      completedSessions = stats.completedSessions || stats.CompletedSessions || 0;
      upcomingSessions = stats.upcomingSessions || stats.UpcomingSessions || 0;
      if (import.meta.env.DEV) {
        console.log('Session statistics:', { completedSessions, upcomingSessions, fullData: stats });
      }
    } else if (import.meta.env.DEV) {
      console.warn('Failed to fetch session statistics:', sessionStatsRes.error);
    }

    return {
      success: true,
      data: {
        pendingContracts,
        activeTutors,
        totalCenters,
        unreadMessages: 0, // TODO: Get from chat API
        upcomingSessions,
        completedSessions,
        rescheduleRequests,
        newParentRequests: 0, // TODO: Get from parent requests API
      } as StaffStats,
    };
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    return {
      success: false,
      error: 'Failed to fetch staff stats',
      data: null,
    };
  }
}

// Contract Management for Staff
export async function getAllContracts(status?: string) {
  // TODO: Replace with actual staff endpoint when available
  // For now, this might need to be implemented in backend
  const query = status ? `?status=${status}` : '';
  return apiService.request<Contract[]>(`/contracts${query}`);
}

export async function getContractsByParentPhone(phoneNumber: string) {
  return apiService.request<Contract[]>(`/contracts/by-phone/${encodeURIComponent(phoneNumber)}`);
}

export async function assignTutorToContract(
  contractId: string, 
  mainTutorId: string, 
  substituteTutor1Id: string, 
  substituteTutor2Id: string
) {
  // Validate all tutor IDs are provided
  if (!mainTutorId || mainTutorId.trim() === '') {
    return {
      success: false,
      error: 'Main tutor ID is required',
      data: undefined
    };
  }

  if (!substituteTutor1Id || substituteTutor1Id.trim() === '') {
    return {
      success: false,
      error: 'Substitute tutor 1 ID is required',
      data: undefined
    };
  }

  if (!substituteTutor2Id || substituteTutor2Id.trim() === '') {
    return {
      success: false,
      error: 'Substitute tutor 2 ID is required',
      data: undefined
    };
  }

  // Validate GUID format (basic check)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const trimmedMainTutorId = mainTutorId.trim();
  const trimmedSubstituteTutor1Id = substituteTutor1Id.trim();
  const trimmedSubstituteTutor2Id = substituteTutor2Id.trim();

  if (!guidRegex.test(trimmedMainTutorId)) {
    console.error('Invalid GUID format for mainTutorId:', trimmedMainTutorId);
    return {
      success: false,
      error: 'Invalid main tutor ID format',
      data: undefined
    };
  }

  if (!guidRegex.test(trimmedSubstituteTutor1Id)) {
    console.error('Invalid GUID format for substituteTutor1Id:', trimmedSubstituteTutor1Id);
    return {
      success: false,
      error: 'Invalid substitute tutor 1 ID format',
      data: undefined
    };
  }

  if (!guidRegex.test(trimmedSubstituteTutor2Id)) {
    console.error('Invalid GUID format for substituteTutor2Id:', trimmedSubstituteTutor2Id);
    return {
      success: false,
      error: 'Invalid substitute tutor 2 ID format',
      data: undefined
    };
  }

  // Validate that all tutors are different
  if (trimmedMainTutorId === trimmedSubstituteTutor1Id || 
      trimmedMainTutorId === trimmedSubstituteTutor2Id || 
      trimmedSubstituteTutor1Id === trimmedSubstituteTutor2Id) {
    return {
      success: false,
      error: 'All tutors must be different',
      data: undefined
    };
  }

  // Backend endpoint is /assign-tutors (plural) and expects mainTutorId, substituteTutor1Id, substituteTutor2Id (camelCase in JSON)
  // Backend uses JsonPropertyName to map camelCase to PascalCase
  const requestBody: any = {
    mainTutorId: trimmedMainTutorId,
    substituteTutor1Id: trimmedSubstituteTutor1Id,
    substituteTutor2Id: trimmedSubstituteTutor2Id,
  };

  console.log('Assigning tutors to contract:', {
    contractId,
    mainTutorId: trimmedMainTutorId.substring(0, 8) + '...',
    substituteTutor1Id: trimmedSubstituteTutor1Id.substring(0, 8) + '...',
    substituteTutor2Id: trimmedSubstituteTutor2Id.substring(0, 8) + '...',
  });

  try {
    const result = await apiService.request<{ message: string }>(`/contracts/${contractId}/assign-tutors`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    if (!result.success) {
      console.error('Failed to assign tutors:', result.error);
    }

    return result;
  } catch (error: any) {
    console.error('Error in assignTutorToContract:', error);
    return {
      success: false,
      error: error?.message || 'Failed to assign tutors',
      data: undefined
    };
  }
}

export async function updateContractStatus(contractId: string, status: 'active' | 'completed' | 'cancelled') {
  // Backend endpoint expects Status (PascalCase)
  return apiService.request<{ message: string }>(`/contracts/${contractId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ 
      Status: status,
    }),
  });
}

export interface Tutor {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  specialties?: string[];
  rating?: number;
  centerId?: string;
  centerName?: string;
  verificationStatus?: string;
  university?: string;
  major?: string;
  hourlyRate?: number;
  bio?: string;
  canTeachOnline?: boolean;
  canTeachOffline?: boolean;
  studentCount?: number; // Number of students
  yearsOfExperience?: number; // Years of experience
  profilePictureUrl?: string; // Profile picture URL
  avatarUrl?: string; // Avatar URL (from User table)
  achievements?: TutorAchievement[]; // Achievements list
  averageRating?: number; // Average rating from reviews (used by contract-specific endpoint)
  reviewCount?: number; // Number of reviews (used by contract-specific endpoint)
  feedbackCount?: number; // Number of feedbacks (alias for reviewCount)
  distanceKm?: number; // Distance in kilometers (used by contract-specific endpoint with location)
}

export interface TutorAchievement {
  id?: string;
  type?: string; // 'outstanding_educator' | 'student_success' | 'successful_students' | 'innovative_methods' | 'research_excellence'
  title: string;
  description: string;
  date: string; // Date in YYYY-MM-DD format
}

// Get all tutors
// Backend endpoint: GET /api/tutors
export async function getAllTutors() {
  try {
    const result = await apiService.request<any[]>(`/tutors`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Map the response to Tutor format
      const tutors: Tutor[] = result.data.map((tutor: any) => {
        // Extract TutorVerification data (can be nested as TutorVerification or tutorVerification)
        const verification = tutor.TutorVerification || tutor.tutorVerification || null;
        
        return {
          userId: tutor.userId || tutor.id || tutor.UserId || tutor.user_id || '',
          fullName: tutor.fullName || tutor.name || tutor.FullName || tutor.full_name || '',
          email: tutor.email || tutor.Email || '',
          phone: tutor.phone || tutor.phoneNumber || tutor.PhoneNumber || undefined,
          // Get verification status from nested TutorVerification object
          verificationStatus: verification?.VerificationStatus || verification?.verificationStatus || 
                            tutor.verificationStatus || tutor.VerificationStatus || tutor.status || undefined,
          // Get university, major, hourlyRate, bio from nested TutorVerification object
          university: verification?.University || verification?.university || 
                     tutor.university || tutor.University || undefined,
          major: verification?.Major || verification?.major || 
                tutor.major || tutor.Major || undefined,
          hourlyRate: verification?.HourlyRate !== undefined ? verification.HourlyRate : 
                     (verification?.hourlyRate !== undefined ? verification.hourlyRate : 
                     (tutor.hourlyRate !== undefined ? tutor.hourlyRate : 
                     (tutor.HourlyRate !== undefined ? tutor.HourlyRate : undefined))),
          bio: verification?.Bio || verification?.bio || 
              tutor.bio || tutor.Bio || undefined,
          specialties: tutor.specialties || tutor.Specialties || tutor.specialization ? [tutor.specialization] : undefined,
          rating: tutor.rating || tutor.Rating || undefined,
          centerId: tutor.centerId || tutor.CenterId || tutor.center_id || undefined,
          centerName: tutor.centerName || tutor.CenterName || tutor.center_name || undefined,
          studentCount: tutor.studentCount || tutor.StudentCount || tutor.student_count || undefined,
          yearsOfExperience: tutor.yearsOfExperience || tutor.YearsOfExperience || tutor.years_of_experience || undefined,
          profilePictureUrl: tutor.profilePictureUrl || tutor.ProfilePictureUrl || tutor.profile_picture_url || undefined,
          avatarUrl: tutor.avatarUrl || tutor.AvatarUrl || tutor.avatar_url || undefined,
          achievements: tutor.achievements || tutor.Achievements || undefined,
          canTeachOnline: tutor.canTeachOnline ?? tutor.CanTeachOnline ?? tutor.can_teach_online ?? undefined,
          canTeachOffline: tutor.canTeachOffline ?? tutor.CanTeachOffline ?? tutor.can_teach_offline ?? undefined,
        };
      });
      
      return {
        success: true,
        data: tutors,
        error: null,
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching all tutors:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch tutors',
    };
  }
}

// Get tutor by ID
// Backend endpoint: GET /api/Tutors/{id}
export async function getTutorById(tutorId: string) {
  try {
    console.log(`[getTutorById] Fetching tutor with ID: ${tutorId}`);
    const result = await apiService.request<any>(`/Tutors/${tutorId}`, {
      method: 'GET',
    });
    
    console.log(`[getTutorById] API Response:`, result);
    
    if (result.success && result.data) {
      const tutor = result.data;
      const verification = tutor.TutorVerification || tutor.tutorVerification || null;
      
      console.log(`[getTutorById] Tutor data:`, tutor);
      console.log(`[getTutorById] Verification:`, verification);
      
      const mappedData = {
        userId: tutor.userId || tutor.UserId || tutor.user_id || '',
        fullName: tutor.fullName || tutor.FullName || tutor.full_name || '',
        email: tutor.email || tutor.Email || '',
        phone: tutor.phoneNumber || tutor.PhoneNumber || tutor.phone || '',
        gender: tutor.gender || tutor.Gender || '',
        formattedAddress: tutor.formattedAddress || tutor.FormattedAddress || '',
        city: tutor.city || tutor.City || '',
        district: tutor.district || tutor.District || '',
        status: tutor.status || tutor.Status || '',
        createdDate: tutor.createdDate || tutor.CreatedDate || null,
        avatarUrl: tutor.avatarUrl || tutor.AvatarUrl || null,
        // Verification info
        verification: verification ? {
          verificationId: verification.verificationId || verification.VerificationId || '',
          university: verification.university || verification.University || '',
          major: verification.major || verification.Major || '',
          hourlyRate: verification.hourlyRate || verification.HourlyRate || 0,
          bio: verification.bio || verification.Bio || '',
          verificationStatus: verification.verificationStatus || verification.VerificationStatus || '',
          verificationDate: verification.verificationDate || verification.VerificationDate || null,
        } : null,
        // Centers
        tutorCenters: tutor.tutorCenters || tutor.TutorCenters || [],
        // Schedules
        tutorSchedules: tutor.tutorSchedules || tutor.TutorSchedules || [],
        // Final Feedbacks
        finalFeedbacks: tutor.finalFeedbacks || tutor.FinalFeedbacks || [],
      };
      
      console.log(`[getTutorById] Mapped data:`, mappedData);
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    console.warn(`[getTutorById] API call succeeded but no data returned. Result:`, result);
    return {
      success: false,
      data: null,
      error: result.error || result.message || 'Tutor not found',
    };
  } catch (error) {
    console.error('[getTutorById] Error fetching tutor by ID:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch tutor',
    };
  }
}

// Get top rated tutors from tutor list
// Backend endpoint: GET /api/tutors (sorted by rating, limited)
export async function getTopRatedTutorsFromList(limit: number = 3) {
  try {
    const result = await getAllTutors();
    
    if (result.success && result.data) {
      // Sort by rating (highest first) and limit results
      const topTutors = result.data
        .filter((tutor: Tutor) => tutor.rating !== undefined && tutor.rating > 0)
        .sort((a: Tutor, b: Tutor) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        })
        .slice(0, limit);
      
      return {
        success: true,
        data: topTutors,
        error: null,
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching top rated tutors:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch top rated tutors',
    };
  }
}

// Verify tutor (approve verification)
// Use PATCH /api/tutor-verifications/{id}/approve
// First need to get verification ID from userId
export async function verifyTutor(tutorId: string) {
  try {
    // Try to get verification by userId first
    const verificationResult = await apiService.request<any>(`/tutor-verifications/user/${tutorId}`, {
      method: 'GET',
    });
    
    if (verificationResult.success && verificationResult.data) {
      // If verification exists, use its ID
      const verificationId = verificationResult.data.id || verificationResult.data.Id || verificationResult.data.verificationId;
      if (verificationId) {
        return apiService.request<{ message: string }>(`/tutor-verifications/${verificationId}/approve`, {
          method: 'PATCH',
        });
      }
    }
    // If the GET returned a not-found response, return a clear error rather than trying legacy endpoints
    if (!verificationResult.success && verificationResult.error && (
      verificationResult.error.toString().toLowerCase().includes('404') ||
      verificationResult.error.toString().toLowerCase().includes('not found') ||
      verificationResult.error.toString().toLowerCase().includes('verification not found')
    )) {
      return {
        success: false,
        error: 'Verification not found for user.',
      } as any;
    }
    
    // If no verification found, try direct approve with userId (if backend supports it)
    // Fallback to old endpoints
    try {
      const response = await apiService.request<{ message: string }>(`/users/${tutorId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      });
      if (response.success) {
        return response;
      }
    } catch (error) {
      console.log('Trying /tutors endpoint for verify');
    }
    
    return apiService.request<{ message: string }>(`/tutors/${tutorId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
    });
  } catch (error) {
    // Fallback to old endpoints
    try {
      const response = await apiService.request<{ message: string }>(`/users/${tutorId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      });
      if (response.success) {
        return response;
      }
    } catch (err) {
      console.log('Trying /tutors endpoint for verify');
    }
    
    return apiService.request<{ message: string }>(`/tutors/${tutorId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
    });
  }
}

// Get tutor verification details by userId
export async function getTutorVerificationByUserId(tutorId: string) {
  try {
    const result = await apiService.request<any>(`/tutor-verifications/user/${tutorId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Map backend response to frontend format
      const verification = result.data;
      return {
        success: true,
        data: {
          verificationId: verification.verificationId || verification.VerificationId || verification.id || verification.Id,
          userId: verification.userId || verification.UserId || tutorId,
          userFullName: verification.userFullName || verification.UserFullName || verification.fullName || verification.FullName,
          userEmail: verification.userEmail || verification.UserEmail || verification.email || verification.Email,
          university: verification.university || verification.University || '',
          major: verification.major || verification.Major || '',
          hourlyRate: verification.hourlyRate || verification.HourlyRate || 0,
          bio: verification.bio || verification.Bio || '',
          verificationStatus: verification.verificationStatus || verification.VerificationStatus || verification.status || 'pending',
          verificationDate: verification.verificationDate || verification.VerificationDate || null,
          createdDate: verification.createdDate || verification.CreatedDate || null,
          isDeleted: verification.isDeleted || verification.IsDeleted || false,
        },
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    console.error('Error in getTutorVerificationByUserId:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get tutor verification',
      data: undefined,
    };
  }
}

// Reject tutor verification
// Use PATCH /api/tutor-verifications/{id}/reject
// First need to get verification ID from userId
export async function rejectTutorVerification(tutorId: string) {
  try {
    // Try to get verification by userId first
    const verificationResult = await apiService.request<any>(`/tutor-verifications/user/${tutorId}`, {
      method: 'GET',
    });
    
    if (verificationResult.success && verificationResult.data) {
      // If verification exists, use its ID
      const verificationId = verificationResult.data.id || verificationResult.data.Id || verificationResult.data.verificationId;
      if (verificationId) {
        return apiService.request<{ message: string }>(`/tutor-verifications/${verificationId}/reject`, {
          method: 'PATCH',
        });
      }
    }
    // If the GET returned a not-found response, return a clear error rather than trying legacy endpoints
    if (!verificationResult.success && verificationResult.error && (
      verificationResult.error.toString().toLowerCase().includes('404') ||
      verificationResult.error.toString().toLowerCase().includes('not found') ||
      verificationResult.error.toString().toLowerCase().includes('verification not found')
    )) {
      return {
        success: false,
        error: 'Verification not found for user.',
      } as any;
    }
    // If no verification found, try direct reject with userId (if backend supports it)
    // Fallback to old endpoints
    try {
      const response = await apiService.request<{ message: string }>(`/users/${tutorId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (response.success) {
        return response;
      }
    } catch (error) {
      console.log('Trying /tutors endpoint for reject');
    }
    
    return apiService.request<{ message: string }>(`/tutors/${tutorId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rejected' }),
    });
  } catch (error) {
    // Fallback to old endpoints
    try {
      const response = await apiService.request<{ message: string }>(`/users/${tutorId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (response.success) {
        return response;
      }
    } catch (err) {
      console.log('Trying /tutors endpoint for reject');
    }
    
    return apiService.request<{ message: string }>(`/tutors/${tutorId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rejected' }),
    });
  }
}

/**
 * Get available tutors for a specific contract
 * This endpoint checks for overlapping contracts and returns tutors sorted by rating
 * @param contractId - The contract ID to get available tutors for
 */
export async function getAvailableTutorsForContract(
  contractId: string, 
  sortByRating?: boolean, 
  sortByDistance?: boolean
) {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (sortByRating !== undefined) {
      params.append('sortByRating', String(sortByRating));
    }
    if (sortByDistance !== undefined) {
      params.append('sortByDistance', String(sortByDistance));
    }
    
    const queryString = params.toString();
    const url = `/contracts/${contractId}/available-tutors${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiService.request<any[]>(url);
    
    if (result.success && result.data) {
      // Backend returns AvailableTutorResponse with userId, fullName, email, phoneNumber, averageRating, feedbackCount, distanceKm
      const mappedTutors: Tutor[] = result.data.map((tutor: any) => ({
        userId: tutor.userId || tutor.UserId || '',
        fullName: tutor.fullName || tutor.FullName || tutor.name || tutor.Name || '',
        email: tutor.email || tutor.Email || '',
        phone: tutor.phoneNumber || tutor.PhoneNumber || tutor.phone || tutor.Phone || undefined,
        centerId: undefined, // Not provided by this endpoint
        centerName: undefined, // Not provided by this endpoint
        verificationStatus: 'approved', // Assume approved if returned by this endpoint
        canTeachOnline: undefined,
        canTeachOffline: undefined,
        averageRating: tutor.averageRating || tutor.AverageRating || 0,
        reviewCount: tutor.feedbackCount || tutor.reviewCount || tutor.ReviewCount || tutor.FeedbackCount || 0,
        feedbackCount: tutor.feedbackCount || tutor.FeedbackCount || tutor.reviewCount || tutor.ReviewCount || 0,
        distanceKm: tutor.distanceKm || tutor.DistanceKm || undefined,
      })).filter((tutor: Tutor) => tutor.userId && tutor.userId.trim() !== '');

      return {
        success: true,
        data: mappedTutors,
        error: null,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error in getAvailableTutorsForContract:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get available tutors for contract',
      data: undefined,
    };
  }
}

// GET /api/contracts/{contractId}/available-slots
export interface AvailableSlot {
  date: string; // DateOnly format: "YYYY-MM-DD"
  slot: string; // Display format: "16:00 - 17:30"
  availableTutors: string[]; // List of tutor names who are available
}

export interface AvailableSlotsResponse {
  totalAvailableSlots: number;
  message: string;
  data: AvailableSlot[];
}

export async function getAvailableSlots(contractId: string) {
  try {
    const result = await apiService.request<any>(`/contracts/${contractId}/available-slots`);
    
    if (result.success && result.data) {
      // Backend returns: { totalAvailableSlots, message, data: AvailableSlot[] }
      const responseData = result.data;
      const mappedSlots: AvailableSlot[] = (responseData.data || []).map((slot: any) => ({
        date: slot.date || slot.Date || '',
        slot: slot.slot || slot.Slot || '',
        availableTutors: slot.availableTutors || slot.AvailableTutors || [],
      }));

      return {
        success: true,
        data: {
          totalAvailableSlots: responseData.totalAvailableSlots || mappedSlots.length,
          message: responseData.message || '',
          data: mappedSlots,
        },
        error: null,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error in getAvailableSlots:', error);
    return {
      success: false,
      data: undefined,
      error: error?.message || 'Failed to get available slots',
    };
  }
}

export async function getAvailableTutors(params?: {
  centerId?: string;
  daysOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isOnline?: boolean;
  contractId?: string; // Add contractId parameter
  sortByRating?: boolean; // Add sorting parameter
  sortByDistance?: boolean; // Add sorting parameter
}) {
  // If contractId is provided, use the contract-specific endpoint
  if (params?.contractId) {
    return getAvailableTutorsForContract(
      params.contractId, 
      params.sortByRating, 
      params.sortByDistance
    );
  }

  // Otherwise, use existing searchTutorsByAvailability function
  const result = await searchTutorsByAvailability({
    daysOfWeek: params?.daysOfWeek,
    availableFrom: params?.startTime,
    canTeachOnline: params?.isOnline,
    centerId: params?.centerId,
  });

  // Map backend AvailableTutorResponse to frontend Tutor interface
  if (result.success && result.data) {
    // Backend returns AvailableTutorResponse with TutorId (PascalCase), TutorName, TutorEmail
    const mappedTutors: Tutor[] = result.data.map((tutor: any) => ({
      userId: tutor.tutorId || tutor.TutorId || tutor.userId || tutor.id || '',
      fullName: tutor.tutorName || tutor.TutorName || tutor.fullName || tutor.name || '',
      email: tutor.tutorEmail || tutor.TutorEmail || tutor.email || '',
      phone: tutor.phone || tutor.Phone || tutor.phoneNumber || tutor.PhoneNumber || undefined,
      centerId: tutor.centerId || tutor.CenterId || params?.centerId || undefined,
      centerName: tutor.centerName || tutor.CenterName || undefined,
      verificationStatus: tutor.verificationStatus || tutor.VerificationStatus || 'approved',
      canTeachOnline: tutor.canTeachOnline ?? tutor.CanTeachOnline ?? params?.isOnline ?? undefined,
      canTeachOffline: tutor.canTeachOffline ?? tutor.CanTeachOffline ?? undefined,
    })).filter((tutor: Tutor) => tutor.userId && tutor.userId.trim() !== ''); // Filter out invalid tutors

    return {
      success: true,
      data: mappedTutors,
      error: null,
    };
  }

  return result;
}

// ============================================
// WALLET API FUNCTIONS
// ============================================

export interface WalletTransaction {
  id: string;
  transactionId?: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method?: string;
  paymentMethod?: string;
  transactionType?: string;
}

export interface WalletData {
  balance: number;
  totalDeposits?: number;
  totalSpent?: number;
  transactions: WalletTransaction[];
}

// SePay Payment APIs
export interface SePayPaymentRequest {
  amount: number;
  description: string;
}

export interface SePayPaymentResponse {
  success: boolean;
  message: string;
  qrCodeUrl: string;
  orderReference: string;
  walletTransactionId?: string; // Optional - not present for direct contract payment
  amount: number;
  bankInfo: string;
  transferContent: string;
}

export interface PaymentStatus {
  status: 'Paid' | 'Unpaid' | 'Pending';
  message: string;
  success: boolean;
  paidAt?: string;
  amountPaid?: number;
}

export async function createSePayPayment(data: SePayPaymentRequest) {
  // Validate input
  if (!data.amount || data.amount <= 0) {
    return Promise.resolve({
      success: false,
      error: 'Amount must be greater than 0',
      data: null
    });
  }

  if (!data.description || data.description.trim() === '') {
    data.description = 'Top up wallet';
  }

  // Ensure amount is a number (not string) and convert to decimal if needed
  const amountValue = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
  
  if (isNaN(amountValue) || amountValue <= 0) {
    return Promise.resolve({
      success: false,
      error: 'Amount must be a valid number greater than 0',
      data: null
    });
  }

  // Ensure amount is within valid range
  if (amountValue < 10000) {
    return Promise.resolve({
      success: false,
      error: 'Amount must be at least 10,000 VND',
      data: null
    });
  }

  if (amountValue > 50000000) {
    return Promise.resolve({
      success: false,
      error: 'Amount must not exceed 50,000,000 VND',
      data: null
    });
  }

  // Backend expects camelCase (amount, description) based on JsonNamingPolicy.CamelCase
  // Ensure Amount is sent as a number (not string) - backend expects decimal
  // JavaScript numbers are automatically serialized correctly in JSON
  const requestBody = {
    amount: amountValue, // camelCase to match backend JsonNamingPolicy.CamelCase
    description: data.description.trim() || 'Top up wallet', // camelCase
  };

  console.log('Creating SePay payment with request:', {
    ...requestBody,
    AmountType: typeof requestBody.amount,
    AmountValue: requestBody.amount,
    AmountStringified: JSON.stringify(requestBody.amount),
    DescriptionLength: requestBody.description.length,
    DescriptionValue: requestBody.description,
    FullRequestBody: JSON.stringify(requestBody)
  });

  try {
    const result = await apiService.request<SePayPaymentResponse>(`/SePay/create-payment`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // If result has error, extract detailed message
    if (!result.success && result.error) {
      // Try to get more details from responseData if available
      const errorDetails = (result as any).errorDetails || result.error;
      return {
        ...result,
        error: errorDetails
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error creating SePay payment:', error);
    
    // Extract detailed error message from response
    let errorMessage = error?.message || 'Failed to create payment request';
    let errorDetails: any = error;
    
    // Check if error has response data
    if (error?.response?.data) {
      const responseData = error.response.data;
      console.error('Error response data:', responseData);
      
      // Try to extract message from different possible formats
      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (responseData.error) {
        errorMessage = responseData.error;
      } else if (responseData.errors) {
        // Handle validation errors
        const validationErrors = Array.isArray(responseData.errors) 
          ? responseData.errors.map((e: any) => e.message || e).join(', ')
          : JSON.stringify(responseData.errors);
        errorMessage = validationErrors;
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else {
        errorMessage = JSON.stringify(responseData);
      }
      
      errorDetails = responseData;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
      errorDetails = error.response.data;
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error;
      errorDetails = error.response.data;
    }

    return {
      success: false,
      error: errorMessage,
      errorDetails: errorDetails,
      data: null
    };
  }
}

export async function checkSePayPaymentStatus(transactionId: string) {
  return apiService.request<PaymentStatus>(`/SePay/payment-status/${transactionId}`);
}

export async function getSePayPaymentDetails(transactionId: string) {
  return apiService.request<SePayPaymentResponse>(`/SePay/payment-details/${transactionId}`);
}

// Create direct contract payment with QR code
// Backend endpoint: POST /api/SePay/create-contract-payment?contractId={contractId}
// amount: Optional final amount with discount applied (if not provided, backend uses package price)
export async function createContractDirectPayment(contractId: string, amount?: number) {
  const requestBody = amount !== undefined ? { amount } : undefined;
  return apiService.request<SePayPaymentResponse>(`/SePay/create-contract-payment?contractId=${contractId}`, {
    method: 'POST',
    body: requestBody ? JSON.stringify(requestBody) : undefined,
  });
}

// Check tutor availability before creating contract
export interface CheckTutorAvailabilityRequest {
  packageId: string;
  childId: string;
  secondChildId?: string;
  startDate: string; // Format: "YYYY-MM-DD"
  endDate: string; // Format: "YYYY-MM-DD"
  schedules: ContractScheduleDto[];
  isOnline: boolean;
  offlineAddress?: string;
  offlineLatitude?: number;
  offlineLongitude?: number;
  maxDistanceKm?: number;
}

export interface AvailableTutorResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  averageRating: number;
  feedbackCount: number;
  distanceKm?: number | null;
}

export interface CheckTutorAvailabilityResponse {
  success: boolean;
  message: string;
  data?: {
    totalAvailable?: number;
    TotalAvailable?: number; // Backend may return PascalCase
    tutors?: AvailableTutorResponse[];
    Tutors?: AvailableTutorResponse[]; // Backend may return PascalCase
  };
}

export async function checkTutorsAvailability(request: CheckTutorAvailabilityRequest): Promise<CheckTutorAvailabilityResponse> {
  const result = await apiService.request<any>('/contracts/check-available-tutors', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  
  // Normalize response to handle both camelCase and PascalCase from backend
  if (result.success && result.data) {
    const data = result.data;
    // If backend returns PascalCase directly, normalize it
    if (data.TotalAvailable !== undefined || data.Tutors !== undefined) {
      result.data = {
        totalAvailable: data.TotalAvailable ?? data.totalAvailable ?? 0,
        tutors: data.Tutors ?? data.tutors ?? []
      };
    } else if (data.totalAvailable === undefined && data.tutors === undefined) {
      // If data structure is different, try to extract from nested structure
      const normalizedData = data.data || data;
      result.data = {
        totalAvailable: normalizedData.TotalAvailable ?? normalizedData.totalAvailable ?? 0,
        tutors: normalizedData.Tutors ?? normalizedData.tutors ?? []
      };
    }
  }
  
  return result as CheckTutorAvailabilityResponse;
}

// Get wallet transactions with filters
export async function getWalletTransactions(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.type) queryParams.append('type', params.type);
  
  const query = queryParams.toString();
  const userStr = localStorage.getItem('user');
  const userId = userStr ? JSON.parse(userStr).id : '';
  
  return apiService.request<{ transactions: WalletTransaction[]; total: number }>(
    `/users/${userId}/wallet/transactions${query ? `?${query}` : ''}`
  );
}

// ============================================
// SESSION API FUNCTIONS
// ============================================

export interface Session {
  bookingId: string;
  contractId: string;
  sessionDate: string; // DateOnly format: YYYY-MM-DD
  startTime: string; // DateTime ISO string
  endTime: string; // DateTime ISO string
  tutorName?: string;
  studentName?: string;
  childName?: string;
  packageName?: string;
  isOnline: boolean;
  videoCallPlatform?: string;
  offlineAddress?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'processing';
  videoConferenceLink?: string;
  videoConferencePlatform?: string;
  videoConferenceCode?: string;
}

// Get sessions for parent
// Backend gets parentId from JWT token (User.FindFirst("sub")), no need to pass in route
export async function getParentSessions(_parentId?: string) {
  // Backend endpoint: GET /api/sessions/parent
  // Backend gets parentId from JWT token, so we don't pass it in the route
  const result = await apiService.request<any[]>(`/sessions/parent`, {
    method: 'GET',
  });
  
  if (result.success && result.data) {
    // Map BE SessionDto to FE Session interface
    // BE SessionDto has: BookingId, ContractId, SessionDate, StartTime, EndTime, TutorName, ChildName, PackageName, IsOnline, VideoCallPlatform, OfflineAddress, Status
    const mappedData: Session[] = result.data.map((item: any) => ({
      bookingId: item.bookingId || item.BookingId || item.booking_id,
      contractId: item.contractId || item.ContractId || item.contract_id,
      sessionDate: item.sessionDate || item.SessionDate || item.session_date || '',
      startTime: item.startTime || item.StartTime || item.start_time || '',
      endTime: item.endTime || item.EndTime || item.end_time || '',
      tutorName: item.tutorName || item.TutorName || item.tutor_name || '',
      // Backend SessionDto has StudentNames field (contains both children if contract has SecondChild)
      // Format: "Child1" or "Child1 & Child2"
      childName: item.studentNames || item.StudentNames || item.childName || item.ChildName || item.child_name || item.studentName || item.StudentName || item.student_name || undefined,
      studentName: item.studentNames || item.StudentNames || item.studentName || item.StudentName || item.student_name || item.childName || item.ChildName || item.child_name || undefined,
      packageName: item.packageName || item.PackageName || item.package_name || undefined,
      isOnline: item.isOnline ?? item.IsOnline ?? item.is_online ?? false,
      videoCallPlatform: item.videoCallPlatform || item.VideoCallPlatform || item.video_call_platform || undefined,
      offlineAddress: item.offlineAddress || item.OfflineAddress || item.offline_address || undefined,
      status: (item.status || item.Status || 'scheduled').toLowerCase() as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'processing',
    }));
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// Get sessions by child ID
// Backend endpoint: GET /api/sessions/child/{childId}
// Backend gets parentId from JWT token, so we only pass childId
export async function getSessionsByChildId(childId: string) {
  const result = await apiService.request<any[]>(`/sessions/child/${childId}`, {
    method: 'GET',
  });
  
  if (result.success && result.data) {
    // Map BE SessionDto to FE Session interface
    // BE SessionDto has: BookingId, ContractId, SessionDate, StartTime, EndTime, TutorName, ChildName, PackageName, IsOnline, VideoCallPlatform, OfflineAddress, Status
    const mappedData: Session[] = result.data.map((item: any) => ({
      bookingId: item.bookingId || item.BookingId || item.booking_id,
      contractId: item.contractId || item.ContractId || item.contract_id,
      sessionDate: item.sessionDate || item.SessionDate || item.session_date || '',
      startTime: item.startTime || item.StartTime || item.start_time || '',
      endTime: item.endTime || item.EndTime || item.end_time || '',
      tutorName: item.tutorName || item.TutorName || item.tutor_name || '',
      // Backend SessionDto may have ChildName field
      childName: item.childName || item.ChildName || item.child_name || item.studentName || item.StudentName || item.student_name || undefined,
      studentName: item.studentName || item.StudentName || item.student_name || item.childName || item.ChildName || item.child_name || undefined,
      packageName: item.packageName || item.PackageName || item.package_name || undefined,
      isOnline: item.isOnline ?? item.IsOnline ?? item.is_online ?? false,
      videoCallPlatform: item.videoCallPlatform || item.VideoCallPlatform || item.video_call_platform || undefined,
      offlineAddress: item.offlineAddress || item.OfflineAddress || item.offline_address || undefined,
      status: (item.status || item.Status || 'scheduled').toLowerCase() as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'processing',
    }));
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// Get session by ID
// Backend endpoint: GET /api/sessions/{bookingId}
export async function getSessionById(bookingId: string) {
  const result = await apiService.request<any>(`/sessions/${bookingId}`);
  
  if (result.success && result.data) {
    // Map BE SessionDto to FE Session interface
    // BE SessionDto has: BookingId, ContractId, SessionDate, StartTime, EndTime, TutorName, IsOnline, VideoCallPlatform, OfflineAddress, Status
    const mappedData: Session = {
      bookingId: result.data.bookingId || result.data.BookingId || result.data.booking_id || bookingId,
      contractId: result.data.contractId || result.data.ContractId || result.data.contract_id || '',
      sessionDate: result.data.sessionDate || result.data.SessionDate || result.data.session_date || '',
      startTime: result.data.startTime || result.data.StartTime || result.data.start_time || '',
      endTime: result.data.endTime || result.data.EndTime || result.data.end_time || '',
      tutorName: result.data.tutorName || result.data.TutorName || result.data.tutor_name || '',
      // Backend SessionDto has StudentNames field (contains both children if contract has SecondChild)
      // Format: "Child1" or "Child1 & Child2"
      studentName: result.data.studentNames || result.data.StudentNames || result.data.studentName || result.data.StudentName || result.data.student_name || undefined,
      childName: result.data.studentNames || result.data.StudentNames || result.data.childName || result.data.ChildName || result.data.child_name || undefined,
      packageName: result.data.packageName || result.data.PackageName || result.data.package_name || undefined,
      isOnline: result.data.isOnline ?? result.data.IsOnline ?? result.data.is_online ?? false,
      videoCallPlatform: result.data.videoCallPlatform || result.data.VideoCallPlatform || result.data.video_call_platform || undefined,
      offlineAddress: result.data.offlineAddress || result.data.OfflineAddress || result.data.offline_address || undefined,
      status: (result.data.status || result.data.Status || 'scheduled').toLowerCase() as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'processing',
      videoConferenceLink: result.data.videoConferenceLink || result.data.VideoConferenceLink || result.data.video_conference_link || undefined,
      videoConferencePlatform: result.data.videoConferencePlatform || result.data.VideoConferencePlatform || result.data.video_conference_platform || undefined,
      videoConferenceCode: result.data.videoConferenceCode || result.data.VideoConferenceCode || result.data.video_conference_code || undefined,
    };
    
    // If no video conference in session data, try to fetch it
    if (!mappedData.videoConferenceLink && mappedData.isOnline) {
      try {
        const videoConferences = await getVideoConferencesByBooking(bookingId);
        if (videoConferences.success && videoConferences.data && videoConferences.data.length > 0) {
          const latestConference = videoConferences.data[0]; // Get the latest one
          mappedData.videoConferenceLink = latestConference.meetingUri;
          mappedData.videoConferencePlatform = latestConference.platform;
          mappedData.videoConferenceCode = latestConference.meetingCode;
        }
      } catch (error) {
        // Silently fail - video conference is optional
        console.log('Could not fetch video conference:', error);
      }
    }
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// Get all sessions for tutor (no main/substitute distinction)
// Backend endpoint: GET /api/sessions/tutor?tutorId={tutorId} (optional, defaults to current user)
export async function getTutorSessions(tutorId?: string) {
  const queryParams = tutorId ? `?tutorId=${tutorId}` : '';
  const result = await apiService.request<any[]>(`/sessions/tutor${queryParams}`, {
    method: 'GET',
  });
  
  if (result.success && result.data) {
    const mappedData: Session[] = result.data.map((item: any) => ({
      bookingId: item.bookingId || item.BookingId || item.booking_id,
      contractId: item.contractId || item.ContractId || item.contract_id,
      sessionDate: item.sessionDate || item.SessionDate || item.session_date || '',
      startTime: item.startTime || item.StartTime || item.start_time || '',
      endTime: item.endTime || item.EndTime || item.end_time || '',
      tutorName: item.tutorName || item.TutorName || item.tutor_name || '',
      // Backend SessionDto has StudentNames field (contains both children if contract has SecondChild)
      // Format: "Child1" or "Child1 & Child2"
      childName: item.studentNames || item.StudentNames || item.childName || item.ChildName || item.child_name || item.studentName || item.StudentName || item.student_name || undefined,
      studentName: item.studentNames || item.StudentNames || item.studentName || item.StudentName || item.student_name || item.childName || item.ChildName || item.child_name || undefined,
      packageName: item.packageName || item.PackageName || item.package_name || undefined,
      isOnline: item.isOnline ?? item.IsOnline ?? item.is_online ?? false,
      videoCallPlatform: item.videoCallPlatform || item.VideoCallPlatform || item.video_call_platform || undefined,
      offlineAddress: item.offlineAddress || item.OfflineAddress || item.offline_address || undefined,
      status: (item.status || item.Status || 'scheduled').toLowerCase() as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'processing',
    }));
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// Get session by ID for tutor
// Backend endpoint: GET /api/sessions/tutor/{bookingId}
export async function getSessionByIdForTutor(bookingId: string) {
  const result = await apiService.request<any>(`/sessions/tutor/${bookingId}`, {
    method: 'GET',
  });
  
  if (result.success && result.data) {
    const mappedData: Session = {
      bookingId: result.data.bookingId || result.data.BookingId || result.data.booking_id || bookingId,
      contractId: result.data.contractId || result.data.ContractId || result.data.contract_id || '',
      sessionDate: result.data.sessionDate || result.data.SessionDate || result.data.session_date || '',
      startTime: result.data.startTime || result.data.StartTime || result.data.start_time || '',
      endTime: result.data.endTime || result.data.EndTime || result.data.end_time || '',
      tutorName: result.data.tutorName || result.data.TutorName || result.data.tutor_name || '',
      // Backend SessionDto has StudentNames field (contains both children if contract has SecondChild)
      // Format: "Child1" or "Child1 & Child2"
      childName: result.data.studentNames || result.data.StudentNames || result.data.childName || result.data.ChildName || result.data.child_name || result.data.studentName || result.data.StudentName || result.data.student_name || undefined,
      studentName: result.data.studentNames || result.data.StudentNames || result.data.studentName || result.data.StudentName || result.data.student_name || result.data.childName || result.data.ChildName || result.data.child_name || undefined,
      packageName: result.data.packageName || result.data.PackageName || result.data.package_name || undefined,
      isOnline: result.data.isOnline ?? result.data.IsOnline ?? result.data.is_online ?? false,
      videoCallPlatform: result.data.videoCallPlatform || result.data.VideoCallPlatform || result.data.video_call_platform || undefined,
      offlineAddress: result.data.offlineAddress || result.data.OfflineAddress || result.data.offline_address || undefined,
      status: (result.data.status || result.data.Status || 'scheduled').toLowerCase() as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'processing',
      videoConferenceLink: result.data.videoConferenceLink || result.data.VideoConferenceLink || result.data.video_conference_link || undefined,
      videoConferencePlatform: result.data.videoConferencePlatform || result.data.VideoConferencePlatform || result.data.video_conference_platform || undefined,
      videoConferenceCode: result.data.videoConferenceCode || result.data.VideoConferenceCode || result.data.video_conference_code || undefined,
    };
    
    // If no video conference in session data, try to fetch it
    if (!mappedData.videoConferenceLink) {
      try {
        const videoConferences = await getVideoConferencesByBooking(bookingId);
        if (videoConferences.success && videoConferences.data && videoConferences.data.length > 0) {
          const latestConference = videoConferences.data[0]; // Get the latest one
          mappedData.videoConferenceLink = latestConference.meetingUri;
          mappedData.videoConferencePlatform = latestConference.platform;
          mappedData.videoConferenceCode = latestConference.meetingCode;
        }
      } catch (error) {
        // Silently fail - video conference is optional
        console.log('Could not fetch video conference:', error);
      }
    }
    
    return {
      success: true,
      data: mappedData,
      error: null,
    };
  }
  
  return result;
}

// Get sessions by contract ID
// Strategy: Get contract to get childId, then get sessions by childId and filter by contractId
export async function getSessionsByContractId(contractId: string) {
  try {
    // Get contract first to get childId
    const contractResult = await getContractById(contractId);
    if (!contractResult.success || !contractResult.data) {
      return {
        success: false,
        error: 'Contract not found',
        data: undefined,
      };
    }

    const contract = contractResult.data;
    // Get childId from contract
    const childId = (contract as any).childId || 
                    (contract as any).ChildId || 
                    (contract as any).child_id;
    
    if (!childId) {
      return {
        success: false,
        error: 'Child ID not found in contract',
        data: undefined,
      };
    }

    // Get sessions by childId
    const sessionsResult = await getSessionsByChildId(childId);
    if (!sessionsResult.success || !sessionsResult.data) {
      // If getSessionsByChildId fails (e.g., due to role restriction), fallback to tutor-based approach
      console.warn('Failed to get sessions by childId, falling back to tutor-based approach');
      
      const tutorIds: string[] = [];
      if (contract.mainTutorId) tutorIds.push(contract.mainTutorId);
      if (contract.substituteTutor1Id) tutorIds.push(contract.substituteTutor1Id);
      if (contract.substituteTutor2Id) tutorIds.push(contract.substituteTutor2Id);

      if (tutorIds.length === 0) {
        return {
          success: true,
          data: [],
          error: null,
        };
      }

      // Fetch sessions for all tutors and filter by contractId
      const allSessions: Session[] = [];
      for (const tutorId of tutorIds) {
        const result = await getTutorSessions(tutorId);
        if (result.success && result.data) {
          allSessions.push(...result.data);
        }
      }

      // Filter by contractId and remove duplicates
      const contractSessions = allSessions
        .filter(session => session.contractId === contractId)
        .filter((session, index, self) => 
          index === self.findIndex(s => s.bookingId === session.bookingId)
        );

      return {
        success: true,
        data: contractSessions,
        error: null,
      };
    }

    // Filter sessions by contractId (since getSessionsByChildId returns all sessions for the child)
    const contractSessions = sessionsResult.data
      .filter(session => session.contractId === contractId);

    return {
      success: true,
      data: contractSessions,
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching sessions by contract ID:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch sessions',
      data: undefined,
    };
  }
}

// Update session tutor (re-assign)
// Backend endpoint: PUT /api/sessions/{bookingId}/tutor
export async function updateSessionTutor(bookingId: string, newTutorId: string) {
  try {
    const result = await apiService.request<{
      success: boolean;
      message: string;
      bookingId: string;
      newTutorId: string;
    }>(`/sessions/${bookingId}/tutor`, {
      method: 'PUT',
      body: JSON.stringify({
        newTutorId: newTutorId,
      }),
    });

    return result;
  } catch (error: any) {
    console.error('Error updating session tutor:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update session tutor',
      data: undefined,
    };
  }
}

// Get replacement tutors for a session
// Backend endpoint: GET /api/sessions/{bookingId}/replacement-tutors
export async function getReplacementTutors(bookingId: string) {
  try {
    const result = await apiService.request<{
      replacementTutors: Array<{
        tutorId: string;
        fullName: string;
        email: string;
        phoneNumber?: string;
        rating?: number;
        isSubstitute: boolean;
        isAvailable: boolean;
      }>;
      otherAvailableTutors?: Array<{
        tutorId: string;
        fullName: string;
        email: string;
        phoneNumber?: string;
        rating?: number;
        isSubstitute: boolean;
        isAvailable: boolean;
      }>;
    }>(`/sessions/${bookingId}/replacement-tutors`, {
      method: 'GET',
    });

    return result;
  } catch (error: any) {
    console.error('Error fetching replacement tutors:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch replacement tutors',
      data: undefined,
    };
  }
}

// Change tutor for a session
// Backend endpoint: PUT /api/sessions/change-tutor
export async function changeSessionTutor(bookingId: string, newTutorId: string) {
  try {
    const result = await apiService.request<{
      success: boolean;
      message: string;
    }>(`/sessions/change-tutor`, {
      method: 'PUT',
      body: JSON.stringify({
        bookingId: bookingId,
        newTutorId: newTutorId,
      }),
    });

    return result;
  } catch (error: any) {
    console.error('Error changing session tutor:', error);
    return {
      success: false,
      error: error?.message || 'Failed to change session tutor',
      data: undefined,
    };
  }
}

// Get main tutor replacement plan
// Backend endpoint: GET /api/sessions/{contractId}/main-tutor-replacement-plan
// Backend response: { success: true, data: { contractId, childName, remainingSessions, bannedMainTutor, recommendedPlan, canProceed, message } }
export async function getMainTutorReplacementPlan(contractId: string) {
  try {
    const result = await apiService.request<{
      success: boolean;
      data: {
        contractId: string;
        childName: string;
        remainingSessions: number;
        bannedMainTutor: string;
        recommendedPlan: {
          planType: 'promote_substitute' | 'external_replacement';
          newMainTutorId: string;
          newMainTutorName: string;
          newSubstituteTutorId: string;
          newSubstituteTutorName: string;
          ratingMain: number;
          ratingSub: number;
        } | null;
        canProceed: boolean;
        message: string;
      };
    }>(`/sessions/${contractId}/main-tutor-replacement-plan`, {
      method: 'GET',
    });

    // Backend returns { success: true, data: {...} }
    // apiService.request wraps it in { success, data, error }
    // So result.data contains the backend's { success: true, data: {...} }
    // We need to extract the inner data
    if (result.success && result.data) {
      const backendResponse = result.data as any;
      // If backend response has nested structure { success: true, data: {...} }
      if (backendResponse.success && backendResponse.data) {
        return {
          success: true,
          data: backendResponse.data,
          error: null,
        };
      }
      // If backend response is already the data object
      return {
        success: true,
        data: backendResponse,
        error: null,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error fetching main tutor replacement plan:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch replacement plan',
      data: undefined,
    };
  }
}

// Replace main tutor for contract
// Backend endpoint: PUT /api/sessions/{contractId}/main-tutor
export async function replaceMainTutor(
  contractId: string,
  newMainTutorId: string,
  newSubstituteTutorId: string
) {
  try {
    const result = await apiService.request<{
      contractId: string;
      newMainTutorId: string;
      newSubstituteTutorId: string;
      replacedAt: string;
    }>(`/sessions/${contractId}/main-tutor`, {
      method: 'PUT',
      body: JSON.stringify({
        newMainTutorId: newMainTutorId,
        newSubstituteTutorId: newSubstituteTutorId,
      }),
    });

    return {
      success: true,
      data: result,
      error: null,
    };
  } catch (error: any) {
    console.error('Error replacing main tutor:', error);
    return {
      success: false,
      error: error?.message || 'Failed to replace main tutor',
      data: undefined,
    };
  }
}

// Update session status
// Backend endpoint: PUT /api/sessions/{bookingId}/status
// Note: Tutors can only set status to 'processing' or 'completed'
export async function updateSessionStatus(bookingId: string, status: 'processing' | 'completed') {
  const result = await apiService.request<{ success: boolean; message: string }>(
    `/sessions/${bookingId}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }
  );
  
  return result;
}

// Video Conference Types
export interface CreateVideoConferenceRequest {
  bookingId: string;
  contractId: string;
  platform: 'Meet' | 'Zoom';
}

export interface VideoConferenceSession {
  conferenceId: string;
  bookingId: string;
  contractId: string;
  platform: string;
  spaceName?: string;
  spaceId?: string;
  meetingUri?: string;
  meetingCode?: string;
  createdByUserId: string;
  createdDate: string;
  updatedDate?: string;
}

// Create video conference
// Backend endpoint: POST /api/video-conferences
export async function createVideoConference(request: CreateVideoConferenceRequest) {
  const result = await apiService.request<VideoConferenceSession>(
    `/video-conferences`,
    {
      method: 'POST',
      body: JSON.stringify({
        bookingId: request.bookingId,
        contractId: request.contractId,
        platform: request.platform,
      }),
    }
  );
  
  return result;
}

// Get video conferences by booking
// Backend endpoint: GET /api/video-conferences/booking/{bookingId}
export async function getVideoConferencesByBooking(bookingId: string) {
  const result = await apiService.request<VideoConferenceSession[]>(
    `/video-conferences/booking/${bookingId}`,
    {
      method: 'GET',
    }
  );
  
  return result;
}

// =====================
// Statistics API
// =====================

// User Statistics Types
export interface UserStatisticsDto {
  totalUsers: number;
  activeUsersLast24Hours: number;
  activeUsersLastWeek: number;
  activeUsersLastMonth: number;
  totalParents: number;
  totalTutors: number;
  totalAdmin: number;
  totalStaff: number;
}

export interface UserRegistrationTrendDto {
  date: string;
  newUsers: number;
}

export interface UserRegistrationTrendStatisticsDto {
  trends: UserRegistrationTrendDto[];
  totalNewUsersInPeriod: number;
}

export interface UserLocationDistributionDto {
  city: string;
  userCount: number;
}

export interface UserLocationStatisticsDto {
  cityDistribution: UserLocationDistributionDto[];
  totalCities: number;
}

export interface WalletStatisticsDto {
  totalWalletBalance: number;
  averageWalletBalance: number;
  medianWalletBalance: number;
  minWalletBalance: number;
  maxWalletBalance: number;
  usersWithZeroBalance: number;
  usersWithPositiveBalance: number;
}

// Session Statistics Types
export interface SessionStatisticsDto {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  upcomingSessions: number;
  rescheduledSessions: number;
  completionRate: number;
}

export interface SessionOnlineVsOfflineDto {
  onlineSessions: number;
  offlineSessions: number;
  onlinePercentage: number;
  offlinePercentage: number;
}

export interface SessionTrendDto {
  date: string;
  sessionCount: number;
}

export interface SessionTrendStatisticsDto {
  trends: SessionTrendDto[];
  totalSessionsInPeriod: number;
}

// Tutor Statistics Types
export interface TutorStatisticsDto {
  totalTutors: number;
  averageRating: number;
  tutorsWithFeedback: number;
  tutorsWithoutFeedback: number;
}

export interface TopRatedTutorDto {
  tutorId: string;
  tutorName: string;
  email: string;
  averageRating: number;
  feedbackCount: number;
}

export interface TopRatedTutorsListDto {
  tutors: TopRatedTutorDto[];
  totalTutors: number;
}

export interface TutorSessionCountDto {
  tutorId: string;
  tutorName: string;
  email: string;
  sessionCount: number;
  completedSessions: number;
}

export interface MostActiveTutorsListDto {
  tutors: TutorSessionCountDto[];
  totalTutors: number;
}

// Financial Statistics Types
export interface RevenueStatisticsDto {
  totalRevenue: number;
  averageTransactionAmount: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
}

export interface RevenueTrendDto {
  date: string;
  revenue: number;
  transactionCount: number;
}

export interface RevenueTrendStatisticsDto {
  trends: RevenueTrendDto[];
  totalRevenueInPeriod: number;
  totalTransactionsInPeriod: number;
}

// Statistics API Functions
export async function getUserStatistics() {
  return apiService.request<UserStatisticsDto>('/statistics/users/overview', {
    method: 'GET',
  });
}

export async function getUserRegistrationTrends(startDate: string, endDate: string) {
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
  const adjustedEndDateString = adjustedEndDate.toISOString().split('T')[0];
  
  return apiService.request<UserRegistrationTrendStatisticsDto>(
    `/statistics/users/registrations?startDate=${startDate}&endDate=${adjustedEndDateString}`,
    {
      method: 'GET',
    }
  );
}

export async function getUserLocationDistribution() {
  return apiService.request<UserLocationStatisticsDto>('/statistics/users/location', {
    method: 'GET',
  });
}

export async function getWalletStatistics() {
  return apiService.request<WalletStatisticsDto>('/statistics/users/wallet', {
    method: 'GET',
  });
}

export async function getSessionStatistics() {
  return apiService.request<SessionStatisticsDto>('/statistics/sessions/overview', {
    method: 'GET',
  });
}

export async function getSessionOnlineVsOffline() {
  return apiService.request<SessionOnlineVsOfflineDto>('/statistics/sessions/online-vs-offline', {
    method: 'GET',
  });
}

export async function getSessionTrends(startDate: string, endDate: string) {
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
  const adjustedEndDateString = adjustedEndDate.toISOString().split('T')[0];
  
  return apiService.request<SessionTrendStatisticsDto>(
    `/statistics/sessions/trends?startDate=${startDate}&endDate=${adjustedEndDateString}`,
    {
      method: 'GET',
    }
  );
}

export async function getTutorStatistics() {
  return apiService.request<TutorStatisticsDto>('/statistics/tutors/overview', {
    method: 'GET',
  });
}

export async function getTopRatedTutors(limit: number = 10) {
  return apiService.request<TopRatedTutorsListDto>(
    `/statistics/tutors/top-rated?limit=${limit}`,
    {
      method: 'GET',
    }
  );
}

export async function getMostActiveTutors(limit: number = 10) {
  return apiService.request<MostActiveTutorsListDto>(
    `/statistics/tutors/most-active?limit=${limit}`,
    {
      method: 'GET',
    }
  );
}

export async function getRevenueStatistics() {
  return apiService.request<RevenueStatisticsDto>('/statistics/financial/revenue', {
    method: 'GET',
  });
}

export async function getRevenueTrends(startDate: string, endDate: string) {
  // Adjust endDate to include the entire day (add 1 day)
  // Backend parses "2025-11-08" as 2025-11-08 00:00:00, so transactions on that day won't match
  // By sending "2025-11-09", backend gets 2025-11-09 00:00:00, which includes all of 2025-11-08
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
  const adjustedEndDateString = adjustedEndDate.toISOString().split('T')[0];
  
  return apiService.request<RevenueTrendStatisticsDto>(
    `/statistics/financial/revenue-trends?startDate=${startDate}&endDate=${adjustedEndDateString}`,
    {
      method: 'GET',
    }
  );
}

// ==================== Daily Report APIs ====================

export interface DailyReport {
  reportId: string;
  childId: string;
  tutorId: string;
  bookingId: string;
  notes?: string;
  url?: string;
  onTrack: boolean;
  haveHomework: boolean;
  createdDate: string; // DateOnly format (YYYY-MM-DD)
  unitId: string;
  testId?: string;
  // Additional fields from backend (if available)
  childName?: string;
  tutorName?: string;
  unitName?: string;
  sessionDate?: string;
}

export interface ChildReportData {
  childId: string; // Required
  notes?: string; // Optional, max 1000 chars
  url?: string; // Optional
  onTrack: boolean; // Required
  haveHomework: boolean; // Required
  unitId: string; // Required
}

export interface CreateDailyReportRequest {
  bookingId: string; // Required
  mainChild: ChildReportData; // Required
  secondChild?: ChildReportData; // Optional - only needed if contract has SecondChildId
}

export interface UpdateDailyReportRequest {
  notes?: string; // Optional, max 1000 chars
  url?: string; // Optional
  onTrack?: boolean; // Optional
  haveHomework?: boolean; // Optional
  unitId?: string; // Optional
}

export interface LearningCompletionForecast {
  childId: string;
  childName: string;
  curriculumId: string;
  curriculumName: string;
  startingUnitId: string;
  startingUnitName: string;
  startingUnitOrder: number;
  lastUnitId: string;
  lastUnitName: string;
  lastUnitOrder: number;
  totalUnitsToComplete: number;
  startDate: string; // DateOnly
  estimatedCompletionDate: string; // DateTime
  daysToCompletion: number;
  weeksToCompletion: number;
  message: string;
}

export interface UnitProgressDetail {
  unitId: string;
  unitName: string;
  unitOrder: number;
  timesLearned: number;
  firstLearnedDate: string; // DateOnly
  lastLearnedDate: string; // DateOnly
  isCompleted: boolean;
}

export interface ChildUnitProgress {
  childId: string;
  childName: string;
  totalUnitsLearned: number;
  uniqueLessonsCompleted: number;
  unitsProgress: UnitProgressDetail[];
  firstLessonDate: string | null;
  lastLessonDate: string | null;
  percentageOfCurriculumCompleted: number;
  message: string | null;
}

export interface Unit {
  unitId: string;
  unitName: string;
  unitDescription?: string;
  unitOrder: number;
  curriculumId: string;
  curriculumName?: string;
  credit?: number;
  learningObjectives?: string;
  isActive?: boolean;
  description?: string;
  createdDate?: string;
  updatedDate?: string;
}

// Get daily report by ID
export async function getDailyReportById(reportId: string) {
  try {
    const result = await apiService.request<any>(`/daily-reports/${reportId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const item = result.data;
      const mappedData: DailyReport = {
        reportId: item.reportId || item.ReportId || reportId,
        childId: item.childId || item.ChildId || '',
        tutorId: item.tutorId || item.TutorId || '',
        bookingId: item.bookingId || item.BookingId || '',
        notes: item.notes || item.Notes,
        url: item.url || item.Url,
        onTrack: item.onTrack ?? item.OnTrack ?? false,
        haveHomework: item.haveHomework ?? item.HaveHomework ?? false,
        createdDate: item.createdDate || item.CreatedDate || '',
        unitId: item.unitId || item.UnitId || '',
        testId: item.testId || item.TestId,
        childName: item.childName || item.ChildName,
        tutorName: item.tutorName || item.TutorName,
        unitName: item.unitName || item.UnitName,
        sessionDate: item.sessionDate || item.SessionDate,
      };
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to fetch daily report',
    };
  }
}

// Get all daily reports for logged-in tutor
// Get all daily reports (for staff)
export async function getAllDailyReports() {
  try {
    const result = await apiService.request<any[]>(`/daily-reports`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Fetch all units, tutors, and children to enrich the data
      let unitsMap: { [key: string]: string } = {};
      let tutorsMap: { [key: string]: string } = {};
      let childrenMap: { [key: string]: string } = {};
      
      // Fetch units
      try {
        const unitsResult = await getAllUnits();
        if (unitsResult.success && unitsResult.data) {
          unitsMap = unitsResult.data.reduce((acc: any, unit: Unit) => {
            if (unit.unitId && unit.unitName) {
              acc[unit.unitId] = unit.unitName;
            }
            return acc;
          }, {});
        }
      } catch (error) {
        console.warn('Failed to fetch units for enrichment:', error);
      }

      // Fetch tutors
      try {
        const tutorsResult = await getAllTutors();
        if (tutorsResult.success && tutorsResult.data) {
          tutorsMap = tutorsResult.data.reduce((acc: any, tutor: any) => {
            if (tutor.userId && tutor.fullName) {
              acc[tutor.userId] = tutor.fullName;
            }
            return acc;
          }, {});
        }
      } catch (error) {
        console.warn('Failed to fetch tutors for enrichment:', error);
      }

      // Fetch children
      try {
        const childrenResult = await getAllChildren();
        if (childrenResult.success && childrenResult.data) {
          childrenMap = childrenResult.data.reduce((acc: any, child: any) => {
            if (child.childId && child.fullName) {
              acc[child.childId] = child.fullName;
            }
            return acc;
          }, {});
        }
      } catch (error) {
        console.warn('Failed to fetch children for enrichment:', error);
      }

      const mappedData: DailyReport[] = result.data.map((item: any) => {
        const unitId = item.unitId || item.UnitId || '';
        const tutorId = item.tutorId || item.TutorId || '';
        const childId = item.childId || item.ChildId || '';
        
        const unitName = item.unitName || item.UnitName || (unitId && unitsMap[unitId] ? unitsMap[unitId] : undefined);
        const tutorName = item.tutorName || item.TutorName || (tutorId && tutorsMap[tutorId] ? tutorsMap[tutorId] : undefined);
        const childName = item.childName || item.ChildName || (childId && childrenMap[childId] ? childrenMap[childId] : undefined);
        
        return {
          reportId: item.reportId || item.ReportId || '',
          childId: childId,
          tutorId: tutorId,
          bookingId: item.bookingId || item.BookingId || '',
          notes: item.notes || item.Notes,
          url: item.url || item.Url,
          onTrack: item.onTrack ?? item.OnTrack ?? false,
          haveHomework: item.haveHomework ?? item.HaveHomework ?? false,
          createdDate: item.createdDate || item.CreatedDate || '',
          unitId: unitId,
          testId: item.testId || item.TestId,
          childName: childName,
          tutorName: tutorName,
          unitName: unitName,
          sessionDate: item.sessionDate || item.SessionDate,
        };
      });
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch all daily reports',
    };
  }
}

export async function getDailyReportsByTutor() {
  try {
    const result = await apiService.request<any[]>(`/daily-reports/tutor`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Fetch all units to map unit IDs to names
      let unitsMap: { [key: string]: string } = {};
      try {
        const unitsResult = await getAllUnits();
        if (unitsResult.success && unitsResult.data) {
          unitsMap = unitsResult.data.reduce((acc: any, unit: Unit) => {
            if (unit.unitId && unit.unitName) {
              acc[unit.unitId] = unit.unitName;
            }
            return acc;
          }, {});
        }
      } catch (error) {
        console.warn('Failed to fetch units for enrichment:', error);
      }

      const mappedData: DailyReport[] = result.data.map((item: any) => {
        const unitId = item.unitId || item.UnitId || '';
        const unitName = item.unitName || item.UnitName || (unitId && unitsMap[unitId] ? unitsMap[unitId] : undefined);
        
        return {
          reportId: item.reportId || item.ReportId || '',
          childId: item.childId || item.ChildId || '',
          tutorId: item.tutorId || item.TutorId || '',
          bookingId: item.bookingId || item.BookingId || '',
          notes: item.notes || item.Notes,
          url: item.url || item.Url,
          onTrack: item.onTrack ?? item.OnTrack ?? false,
          haveHomework: item.haveHomework ?? item.HaveHomework ?? false,
          createdDate: item.createdDate || item.CreatedDate || '',
          unitId: unitId,
          testId: item.testId || item.TestId,
          childName: item.childName || item.ChildName,
          tutorName: item.tutorName || item.TutorName,
          unitName: unitName,
          sessionDate: item.sessionDate || item.SessionDate,
        };
      });
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch daily reports',
    };
  }
}

// Get all daily reports for a child
export async function getDailyReportsByChild(childId: string) {
  try {
    const result = await apiService.request<any[]>(`/daily-reports/child/${childId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Fetch all units to map unit IDs to names
      let unitsMap: { [key: string]: string } = {};
      try {
        const unitsResult = await getAllUnits();
        if (unitsResult.success && unitsResult.data) {
          unitsMap = unitsResult.data.reduce((acc: any, unit: Unit) => {
            if (unit.unitId && unit.unitName) {
              acc[unit.unitId] = unit.unitName;
            }
            return acc;
          }, {});
          if (import.meta.env.DEV) {
            console.log('[DailyReports] Units map created with', Object.keys(unitsMap).length, 'units');
          }
        }
      } catch (error) {
        console.warn('Failed to fetch units for enrichment:', error);
      }

      const mappedData: DailyReport[] = result.data.map((item: any) => {
        const unitId = item.unitId || item.UnitId || '';
        const unitName = item.unitName || item.UnitName || (unitId && unitsMap[unitId] ? unitsMap[unitId] : undefined);
        
        if (import.meta.env.DEV && !unitName && unitId) {
          console.log('[DailyReports] Unit name not found for unitId:', unitId, 'Map has:', Object.keys(unitsMap).length, 'units');
        }
        
        return {
          reportId: item.reportId || item.ReportId || '',
          childId: item.childId || item.ChildId || '',
          tutorId: item.tutorId || item.TutorId || '',
          bookingId: item.bookingId || item.BookingId || '',
          notes: item.notes || item.Notes,
          url: item.url || item.Url,
          onTrack: item.onTrack ?? item.OnTrack ?? false,
          haveHomework: item.haveHomework ?? item.HaveHomework ?? false,
          createdDate: item.createdDate || item.CreatedDate || '',
          unitId: unitId,
          testId: item.testId || item.TestId,
          childName: item.childName || item.ChildName,
          tutorName: item.tutorName || item.TutorName,
          unitName: unitName,
          sessionDate: item.sessionDate || item.SessionDate,
        };
      });
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch daily reports',
    };
  }
}

// Get all daily reports for a contract
export async function getDailyReportsByContractId(contractId: string) {
  try {
    const result = await apiService.request<any>(`/daily-reports/contract/${contractId}`, {
      method: 'GET',
    });
    
    // Handle 404 gracefully - no daily reports means empty array, not an error
    // This is expected behavior, not an error
    if (!result.success && (
        result.error?.includes('404') || 
        result.error?.includes('Not Found') ||
        result.error?.includes('Resource not found') ||
        result.error?.toLowerCase().includes('not found')
      )) {
      // Silently return empty array - this is expected when there are no daily reports
      return {
        success: true,
        data: [],
        error: null,
      };
    }
    
    if (result.success && result.data) {
      // New BE structure: { contractId, sessions: [{ bookingId, sessionDate, startTime, endTime, reports: [...] }] }
      // Flatten the reports from all sessions into a single array
      let allReports: any[] = [];
      
      if (result.data.sessions && Array.isArray(result.data.sessions)) {
        // New grouped structure - extract reports from each session
        result.data.sessions.forEach((session: any) => {
          if (session.reports && Array.isArray(session.reports)) {
            session.reports.forEach((report: any) => {
              // Add session info to each report
              allReports.push({
                ...report,
                sessionDate: session.sessionDate || report.sessionDate,
                startTime: session.startTime,
                endTime: session.endTime,
                bookingId: session.bookingId || report.bookingId,
              });
            });
          }
        });
      } else if (Array.isArray(result.data)) {
        // Fallback: if it's still an array (old format), use it directly
        allReports = result.data;
      }
      
      // Fetch all units to map unit IDs to names
      let unitsMap: { [key: string]: string } = {};
      try {
        const unitsResult = await getAllUnits();
        if (unitsResult.success && unitsResult.data) {
          unitsMap = unitsResult.data.reduce((acc: any, unit: Unit) => {
            if (unit.unitId && unit.unitName) {
              acc[unit.unitId] = unit.unitName;
            }
            return acc;
          }, {});
        }
      } catch (error) {
        console.warn('Failed to fetch units for enrichment:', error);
      }

      const mappedData: DailyReport[] = allReports.map((item: any) => {
        const unitId = item.unitId || item.UnitId || '';
        const unitName = item.unitName || item.UnitName || (unitId && unitsMap[unitId] ? unitsMap[unitId] : undefined);
        
        return {
          reportId: item.reportId || item.ReportId || '',
          childId: item.childId || item.ChildId || '',
          tutorId: item.tutorId || item.TutorId || '',
          bookingId: item.bookingId || item.BookingId || '',
          notes: item.notes || item.Notes,
          url: item.url || item.Url,
          onTrack: item.onTrack ?? item.OnTrack ?? false,
          haveHomework: item.haveHomework ?? item.HaveHomework ?? false,
          createdDate: item.createdDate || item.CreatedDate || '',
          unitId: unitId,
          testId: item.testId || item.TestId,
          childName: item.childName || item.ChildName,
          tutorName: item.tutorName || item.TutorName,
          unitName: unitName,
          sessionDate: item.sessionDate || item.SessionDate,
        };
      });
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch daily reports',
    };
  }
}

// Get all daily reports for a booking/session
export async function getDailyReportsByBooking(bookingId: string) {
  try {
    const result = await apiService.request<any[]>(`/daily-reports/booking/${bookingId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      // Fetch all units to map unit IDs to names
      let unitsMap: { [key: string]: string } = {};
      try {
        const unitsResult = await getAllUnits();
        if (unitsResult.success && unitsResult.data) {
          unitsMap = unitsResult.data.reduce((acc: any, unit: Unit) => {
            if (unit.unitId && unit.unitName) {
              acc[unit.unitId] = unit.unitName;
            }
            return acc;
          }, {});
        }
      } catch (error) {
        console.warn('Failed to fetch units for enrichment:', error);
      }

      const mappedData: DailyReport[] = result.data.map((item: any) => {
        const unitId = item.unitId || item.UnitId || '';
        const unitName = item.unitName || item.UnitName || (unitId && unitsMap[unitId] ? unitsMap[unitId] : undefined);
        
        return {
          reportId: item.reportId || item.ReportId || '',
          childId: item.childId || item.ChildId || '',
          tutorId: item.tutorId || item.TutorId || '',
          bookingId: item.bookingId || item.BookingId || '',
          notes: item.notes || item.Notes,
          url: item.url || item.Url,
          onTrack: item.onTrack ?? item.OnTrack ?? false,
          haveHomework: item.haveHomework ?? item.HaveHomework ?? false,
          createdDate: item.createdDate || item.CreatedDate || '',
          unitId: unitId,
          testId: item.testId || item.TestId,
          childName: item.childName || item.ChildName,
          tutorName: item.tutorName || item.TutorName,
          unitName: unitName,
          sessionDate: item.sessionDate || item.SessionDate,
        };
      });
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch daily reports',
    };
  }
}

// Get learning completion forecast for a child
export async function getLearningCompletionForecast(childId: string) {
  try {
    const result = await apiService.request<any>(`/daily-reports/child/${childId}/learning-forecast`, {
      method: 'GET',
    });
    
    // Handle 404 gracefully - no daily reports means no forecast
    if (!result.success && result.error && 
        (result.error.includes('No daily reports found') || result.error.includes('404'))) {
      return {
        success: false,
        data: null,
        error: null, // Don't treat as error, just no data available
      };
    }
    
    if (result.success && result.data) {
      const item = result.data;
      const mappedData: LearningCompletionForecast = {
        childId: item.childId || item.ChildId || childId,
        childName: item.childName || item.ChildName || '',
        curriculumId: item.curriculumId || item.CurriculumId || '',
        curriculumName: item.curriculumName || item.CurriculumName || '',
        startingUnitId: item.startingUnitId || item.StartingUnitId || '',
        startingUnitName: item.startingUnitName || item.StartingUnitName || '',
        startingUnitOrder: item.startingUnitOrder || item.StartingUnitOrder || 0,
        lastUnitId: item.lastUnitId || item.LastUnitId || '',
        lastUnitName: item.lastUnitName || item.LastUnitName || '',
        lastUnitOrder: item.lastUnitOrder || item.LastUnitOrder || 0,
        totalUnitsToComplete: item.totalUnitsToComplete || item.TotalUnitsToComplete || 0,
        startDate: item.startDate || item.StartDate || '',
        estimatedCompletionDate: item.estimatedCompletionDate || item.EstimatedCompletionDate || '',
        daysToCompletion: item.daysToCompletion || item.DaysToCompletion || 0,
        weeksToCompletion: item.weeksToCompletion || item.WeeksToCompletion || 0,
        message: item.message || item.Message || '',
      };
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to fetch learning forecast',
    };
  }
}

// Get child unit progress by contract
export async function getChildUnitProgress(contractId: string) {
  try {
    const result = await apiService.request<any>(`/daily-reports/contract/${contractId}/unit-progress`, {
      method: 'GET',
    });
    
    // Handle 404 gracefully - no daily reports means no progress data
    // This is expected behavior, not an error - silently return no data
    if (!result.success && (
        result.error?.includes('404') || 
        result.error?.includes('Not Found') ||
        result.error?.includes('Resource not found') ||
        result.error?.includes('No daily reports found') ||
        result.error?.toLowerCase().includes('not found')
      )) {
      // Silently return no data - this is expected when there are no daily reports
      // Don't log or show this as an error to the user
      return {
        success: false,
        data: null,
        error: null, // Don't treat as error, just no data available
      };
    }
    
    if (result.success && result.data) {
      const item = result.data;
      const mappedData: ChildUnitProgress = {
        childId: item.childId || item.ChildId || '',
        childName: item.childName || item.ChildName || '',
        totalUnitsLearned: item.totalUnitsLearned || item.TotalUnitsLearned || 0,
        uniqueLessonsCompleted: item.uniqueLessonsCompleted || item.UniqueLessonsCompleted || 0,
        unitsProgress: (item.unitsProgress || item.UnitsProgress || []).map((up: any) => ({
          unitId: up.unitId || up.UnitId || '',
          unitName: up.unitName || up.UnitName || '',
          unitOrder: up.unitOrder || up.UnitOrder || 0,
          timesLearned: up.timesLearned || up.TimesLearned || 0,
          firstLearnedDate: up.firstLearnedDate || up.FirstLearnedDate || '',
          lastLearnedDate: up.lastLearnedDate || up.LastLearnedDate || '',
          isCompleted: up.isCompleted ?? up.IsCompleted ?? false,
        })),
        firstLessonDate: item.firstLessonDate || item.FirstLessonDate || null,
        lastLessonDate: item.lastLessonDate || item.LastLessonDate || null,
        percentageOfCurriculumCompleted: item.percentageOfCurriculumCompleted ?? item.PercentageOfCurriculumCompleted ?? 0,
        message: item.message || item.Message || null,
      };
      
      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to fetch child unit progress',
    };
  }
}

// Create daily report
export async function createDailyReport(data: CreateDailyReportRequest) {
  try {
    // Validate required fields
    if (!data.bookingId || !data.mainChild || !data.mainChild.childId || !data.mainChild.unitId) {
      return {
        success: false,
        data: null,
        error: 'Missing required fields: bookingId, mainChild.childId, and mainChild.unitId are required',
      };
    }

    // Validate notes length for main child
    if (data.mainChild.notes && data.mainChild.notes.length > 1000) {
      return {
        success: false,
        data: null,
        error: 'Main child notes cannot exceed 1000 characters',
      };
    }

    // Validate notes length for second child (if provided)
    if (data.secondChild?.notes && data.secondChild.notes.length > 1000) {
      return {
        success: false,
        data: null,
        error: 'Second child notes cannot exceed 1000 characters',
      };
    }

    // Build request body matching backend structure
    const requestBody: any = {
      bookingId: data.bookingId,
      mainChild: {
        childId: data.mainChild.childId,
        onTrack: data.mainChild.onTrack,
        haveHomework: data.mainChild.haveHomework,
        unitId: data.mainChild.unitId,
      },
    };

    // Add optional fields for main child
    if (data.mainChild.notes && data.mainChild.notes.trim() !== '') {
      requestBody.mainChild.notes = data.mainChild.notes.trim();
    }
    
    if (data.mainChild.url && data.mainChild.url.trim() !== '') {
      requestBody.mainChild.url = data.mainChild.url.trim();
    }

    // Add second child if provided
    if (data.secondChild) {
      if (!data.secondChild.childId || !data.secondChild.unitId) {
        return {
          success: false,
          data: null,
          error: 'Second child requires childId and unitId',
        };
      }

      requestBody.secondChild = {
        childId: data.secondChild.childId,
        onTrack: data.secondChild.onTrack,
        haveHomework: data.secondChild.haveHomework,
        unitId: data.secondChild.unitId,
      };

      if (data.secondChild.notes && data.secondChild.notes.trim() !== '') {
        requestBody.secondChild.notes = data.secondChild.notes.trim();
      }
      
      if (data.secondChild.url && data.secondChild.url.trim() !== '') {
        requestBody.secondChild.url = data.secondChild.url.trim();
      }
    }
    
    const result = await apiService.request<{ message: string; reportId: string }>(`/daily-reports`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    if (!result.success && result.error) {
      return {
        success: false,
        data: null,
        error: result.error,
      };
    }
    
    return result;
  } catch (error: any) {
    console.error('Error creating daily report:', error);
    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create daily report';
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
}

// Update daily report
export async function updateDailyReport(reportId: string, data: UpdateDailyReportRequest) {
  try {
    if (!reportId) {
      return {
        success: false,
        data: null,
        error: 'Report ID is required',
      };
    }

    // Validate notes length
    if (data.notes && data.notes.length > 1000) {
      return {
        success: false,
        data: null,
        error: 'Notes cannot exceed 1000 characters',
      };
    }

    const requestBody: any = {};
    
    if (data.notes !== undefined) {
      requestBody.notes = data.notes.trim() || null;
    }
    if (data.url !== undefined) {
      requestBody.url = data.url.trim() || null;
    }
    if (data.onTrack !== undefined) {
      requestBody.onTrack = data.onTrack;
    }
    if (data.haveHomework !== undefined) {
      requestBody.haveHomework = data.haveHomework;
    }
    if (data.unitId !== undefined && data.unitId) {
      requestBody.unitId = data.unitId;
    }
    
    const result = await apiService.request<{ message: string; reportId: string }>(`/daily-reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
    
    if (!result.success && result.error) {
      return {
        success: false,
        data: null,
        error: result.error,
      };
    }
    
    return result;
  } catch (error: any) {
    console.error('Error updating daily report:', error);
    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update daily report';
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
}

// Delete daily report
export async function deleteDailyReport(reportId: string) {
  try {
    const result = await apiService.request<{ message: string }>(`/daily-reports/${reportId}`, {
      method: 'DELETE',
    });
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to delete daily report',
    };
  }
}

// Final Feedback Types
export interface FinalFeedback {
  feedbackId: string;
  userId: string;
  contractId: string;
  feedbackProviderType: string;
  feedbackText?: string;
  overallSatisfactionRating: number;
  communicationRating?: number;
  sessionQualityRating?: number;
  learningProgressRating?: number;
  professionalismRating?: number;
  wouldRecommend: boolean;
  wouldWorkTogetherAgain: boolean;
  contractObjectivesMet?: boolean;
  improvementSuggestions?: string;
  additionalComments?: string;
  feedbackStatus: string;
  createdDate: string;
  userFullName?: string;
  contractTitle?: string;
}

export interface CreateFinalFeedbackRequest {
  userId: string;
  contractId: string;
  feedbackProviderType: string;
  feedbackText?: string;
  overallSatisfactionRating: number;
  communicationRating?: number;
  sessionQualityRating?: number;
  learningProgressRating?: number;
  professionalismRating?: number;
  wouldRecommend: boolean;
  wouldWorkTogetherAgain: boolean;
  contractObjectivesMet?: boolean;
  improvementSuggestions?: string;
  additionalComments?: string;
}

export interface UpdateFinalFeedbackRequest {
  feedbackText?: string;
  overallSatisfactionRating?: number;
  communicationRating?: number;
  sessionQualityRating?: number;
  learningProgressRating?: number;
  professionalismRating?: number;
  wouldRecommend?: boolean;
  wouldWorkTogetherAgain?: boolean;
  contractObjectivesMet?: boolean;
  improvementSuggestions?: string;
  additionalComments?: string;
  feedbackStatus?: string;
}

// Get final feedback by ID
export async function getFinalFeedbackById(feedbackId: string) {
  try {
    const result = await apiService.request<any>(`/finalfeedback/${feedbackId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const item = result.data;
      const mappedData: FinalFeedback = {
        feedbackId: item.feedbackId || item.FeedbackId || feedbackId,
        userId: item.userId || item.UserId || '',
        contractId: item.contractId || item.ContractId || '',
        feedbackProviderType: item.feedbackProviderType || item.FeedbackProviderType || '',
        feedbackText: item.feedbackText || item.FeedbackText,
        overallSatisfactionRating: item.overallSatisfactionRating ?? item.OverallSatisfactionRating ?? 0,
        communicationRating: item.communicationRating ?? item.CommunicationRating,
        sessionQualityRating: item.sessionQualityRating ?? item.SessionQualityRating,
        learningProgressRating: item.learningProgressRating ?? item.LearningProgressRating,
        professionalismRating: item.professionalismRating ?? item.ProfessionalismRating,
        wouldRecommend: item.wouldRecommend ?? item.WouldRecommend ?? false,
        wouldWorkTogetherAgain: item.wouldWorkTogetherAgain ?? item.WouldWorkTogetherAgain ?? false,
        contractObjectivesMet: item.contractObjectivesMet ?? item.ContractObjectivesMet,
        improvementSuggestions: item.improvementSuggestions || item.ImprovementSuggestions,
        additionalComments: item.additionalComments || item.AdditionalComments,
        feedbackStatus: item.feedbackStatus || item.FeedbackStatus || 'Submitted',
        createdDate: item.createdDate || item.CreatedDate || new Date().toISOString(),
        userFullName: item.userFullName || item.UserFullName,
        contractTitle: item.contractTitle || item.ContractTitle,
      };
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to get final feedback',
    };
  }
}

// Get final feedbacks by contract ID
export async function getFinalFeedbacksByContractId(contractId: string) {
  try {
    const result = await apiService.request<any[]>(`/finalfeedback/contract/${contractId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const mappedData: FinalFeedback[] = result.data.map((item: any) => ({
        feedbackId: item.feedbackId || item.FeedbackId || '',
        userId: item.userId || item.UserId || '',
        contractId: item.contractId || item.ContractId || contractId,
        feedbackProviderType: item.feedbackProviderType || item.FeedbackProviderType || '',
        feedbackText: item.feedbackText || item.FeedbackText,
        overallSatisfactionRating: item.overallSatisfactionRating ?? item.OverallSatisfactionRating ?? 0,
        communicationRating: item.communicationRating ?? item.CommunicationRating,
        sessionQualityRating: item.sessionQualityRating ?? item.SessionQualityRating,
        learningProgressRating: item.learningProgressRating ?? item.LearningProgressRating,
        professionalismRating: item.professionalismRating ?? item.ProfessionalismRating,
        wouldRecommend: item.wouldRecommend ?? item.WouldRecommend ?? false,
        wouldWorkTogetherAgain: item.wouldWorkTogetherAgain ?? item.WouldWorkTogetherAgain ?? false,
        contractObjectivesMet: item.contractObjectivesMet ?? item.ContractObjectivesMet,
        improvementSuggestions: item.improvementSuggestions || item.ImprovementSuggestions,
        additionalComments: item.additionalComments || item.AdditionalComments,
        feedbackStatus: item.feedbackStatus || item.FeedbackStatus || 'Submitted',
        createdDate: item.createdDate || item.CreatedDate || new Date().toISOString(),
        userFullName: item.userFullName || item.UserFullName,
        contractTitle: item.contractTitle || item.ContractTitle,
      }));
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to get final feedbacks',
    };
  }
}

// Get final feedback by contract and provider type
export async function getFinalFeedbackByContractAndProvider(contractId: string, providerType: string) {
  try {
    const result = await apiService.request<any>(`/finalfeedback/contract/${contractId}/provider/${providerType}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const item = result.data;
      const mappedData: FinalFeedback = {
        feedbackId: item.feedbackId || item.FeedbackId || '',
        userId: item.userId || item.UserId || '',
        contractId: item.contractId || item.ContractId || contractId,
        feedbackProviderType: item.feedbackProviderType || item.FeedbackProviderType || providerType,
        feedbackText: item.feedbackText || item.FeedbackText,
        overallSatisfactionRating: item.overallSatisfactionRating ?? item.OverallSatisfactionRating ?? 0,
        communicationRating: item.communicationRating ?? item.CommunicationRating,
        sessionQualityRating: item.sessionQualityRating ?? item.SessionQualityRating,
        learningProgressRating: item.learningProgressRating ?? item.LearningProgressRating,
        professionalismRating: item.professionalismRating ?? item.ProfessionalismRating,
        wouldRecommend: item.wouldRecommend ?? item.WouldRecommend ?? false,
        wouldWorkTogetherAgain: item.wouldWorkTogetherAgain ?? item.WouldWorkTogetherAgain ?? false,
        contractObjectivesMet: item.contractObjectivesMet ?? item.ContractObjectivesMet,
        improvementSuggestions: item.improvementSuggestions || item.ImprovementSuggestions,
        additionalComments: item.additionalComments || item.AdditionalComments,
        feedbackStatus: item.feedbackStatus || item.FeedbackStatus || 'Submitted',
        createdDate: item.createdDate || item.CreatedDate || new Date().toISOString(),
        userFullName: item.userFullName || item.UserFullName,
        contractTitle: item.contractTitle || item.ContractTitle,
      };
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to get final feedback',
    };
  }
}


// Get final feedbacks by user ID (for tutor ratings)
export async function getFinalFeedbacksByUserId(userId: string) {
  try {
    const result = await apiService.request<any[]>(`/finalfeedback/user/${userId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const mappedData: FinalFeedback[] = result.data.map((item: any) => ({
        feedbackId: item.feedbackId || item.FeedbackId || '',
        userId: item.userId || item.UserId || userId,
        contractId: item.contractId || item.ContractId || '',
        feedbackProviderType: item.feedbackProviderType || item.FeedbackProviderType || '',
        feedbackText: item.feedbackText || item.FeedbackText,
        overallSatisfactionRating: item.overallSatisfactionRating ?? item.OverallSatisfactionRating ?? 0,
        communicationRating: item.communicationRating ?? item.CommunicationRating,
        sessionQualityRating: item.sessionQualityRating ?? item.SessionQualityRating,
        learningProgressRating: item.learningProgressRating ?? item.LearningProgressRating,
        professionalismRating: item.professionalismRating ?? item.ProfessionalismRating,
        wouldRecommend: item.wouldRecommend ?? item.WouldRecommend ?? false,
        wouldWorkTogetherAgain: item.wouldWorkTogetherAgain ?? item.WouldWorkTogetherAgain ?? false,
        contractObjectivesMet: item.contractObjectivesMet ?? item.ContractObjectivesMet,
        improvementSuggestions: item.improvementSuggestions || item.ImprovementSuggestions,
        additionalComments: item.additionalComments || item.AdditionalComments,
        feedbackStatus: item.feedbackStatus || item.FeedbackStatus || 'Submitted',
        createdDate: item.createdDate || item.CreatedDate || new Date().toISOString(),
        userFullName: item.userFullName || item.UserFullName,
        contractTitle: item.contractTitle || item.ContractTitle,
      }));
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to get tutor feedback',
    };
  }
}

// Create final feedback
export async function createFinalFeedback(data: CreateFinalFeedbackRequest) {
  try {
    const requestBody: any = {
      userId: data.userId,
      contractId: data.contractId,
      feedbackProviderType: data.feedbackProviderType,
      overallSatisfactionRating: data.overallSatisfactionRating,
      wouldRecommend: data.wouldRecommend,
      wouldWorkTogetherAgain: data.wouldWorkTogetherAgain,
    };
    
    if (data.feedbackText) requestBody.feedbackText = data.feedbackText;
    if (data.communicationRating !== undefined) requestBody.communicationRating = data.communicationRating;
    if (data.sessionQualityRating !== undefined) requestBody.sessionQualityRating = data.sessionQualityRating;
    if (data.learningProgressRating !== undefined) requestBody.learningProgressRating = data.learningProgressRating;
    if (data.professionalismRating !== undefined) requestBody.professionalismRating = data.professionalismRating;
    if (data.contractObjectivesMet !== undefined) requestBody.contractObjectivesMet = data.contractObjectivesMet;
    if (data.improvementSuggestions) requestBody.improvementSuggestions = data.improvementSuggestions;
    if (data.additionalComments) requestBody.additionalComments = data.additionalComments;
    
    const result = await apiService.request<any>(`/finalfeedback`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    if (result.success && result.data) {
      const item = result.data;
      const mappedData: FinalFeedback = {
        feedbackId: item.feedbackId || item.FeedbackId || '',
        userId: item.userId || item.UserId || data.userId,
        contractId: item.contractId || item.ContractId || data.contractId,
        feedbackProviderType: item.feedbackProviderType || item.FeedbackProviderType || data.feedbackProviderType,
        feedbackText: item.feedbackText || item.FeedbackText || data.feedbackText,
        overallSatisfactionRating: item.overallSatisfactionRating ?? item.OverallSatisfactionRating ?? data.overallSatisfactionRating,
        communicationRating: item.communicationRating ?? item.CommunicationRating ?? data.communicationRating,
        sessionQualityRating: item.sessionQualityRating ?? item.SessionQualityRating ?? data.sessionQualityRating,
        learningProgressRating: item.learningProgressRating ?? item.LearningProgressRating ?? data.learningProgressRating,
        professionalismRating: item.professionalismRating ?? item.ProfessionalismRating ?? data.professionalismRating,
        wouldRecommend: item.wouldRecommend ?? item.WouldRecommend ?? data.wouldRecommend,
        wouldWorkTogetherAgain: item.wouldWorkTogetherAgain ?? item.WouldWorkTogetherAgain ?? data.wouldWorkTogetherAgain,
        contractObjectivesMet: item.contractObjectivesMet ?? item.ContractObjectivesMet ?? data.contractObjectivesMet,
        improvementSuggestions: item.improvementSuggestions || item.ImprovementSuggestions || data.improvementSuggestions,
        additionalComments: item.additionalComments || item.AdditionalComments || data.additionalComments,
        feedbackStatus: item.feedbackStatus || item.FeedbackStatus || 'Submitted',
        createdDate: item.createdDate || item.CreatedDate || new Date().toISOString(),
        userFullName: item.userFullName || item.UserFullName,
        contractTitle: item.contractTitle || item.ContractTitle,
      };
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to create final feedback',
    };
  }
}

// Update final feedback
export async function updateFinalFeedback(feedbackId: string, data: UpdateFinalFeedbackRequest) {
  try {
    const requestBody: any = {};
    
    if (data.feedbackText !== undefined) requestBody.feedbackText = data.feedbackText;
    if (data.overallSatisfactionRating !== undefined) requestBody.overallSatisfactionRating = data.overallSatisfactionRating;
    if (data.communicationRating !== undefined) requestBody.communicationRating = data.communicationRating;
    if (data.sessionQualityRating !== undefined) requestBody.sessionQualityRating = data.sessionQualityRating;
    if (data.learningProgressRating !== undefined) requestBody.learningProgressRating = data.learningProgressRating;
    if (data.professionalismRating !== undefined) requestBody.professionalismRating = data.professionalismRating;
    if (data.wouldRecommend !== undefined) requestBody.wouldRecommend = data.wouldRecommend;
    if (data.wouldWorkTogetherAgain !== undefined) requestBody.wouldWorkTogetherAgain = data.wouldWorkTogetherAgain;
    if (data.contractObjectivesMet !== undefined) requestBody.contractObjectivesMet = data.contractObjectivesMet;
    if (data.improvementSuggestions !== undefined) requestBody.improvementSuggestions = data.improvementSuggestions;
    if (data.additionalComments !== undefined) requestBody.additionalComments = data.additionalComments;
    if (data.feedbackStatus !== undefined) requestBody.feedbackStatus = data.feedbackStatus;
    
    const result = await apiService.request<any>(`/finalfeedback/${feedbackId}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
    
    if (result.success && result.data) {
      const item = result.data;
      const mappedData: FinalFeedback = {
        feedbackId: item.feedbackId || item.FeedbackId || feedbackId,
        userId: item.userId || item.UserId || '',
        contractId: item.contractId || item.ContractId || '',
        feedbackProviderType: item.feedbackProviderType || item.FeedbackProviderType || '',
        feedbackText: item.feedbackText || item.FeedbackText,
        overallSatisfactionRating: item.overallSatisfactionRating ?? item.OverallSatisfactionRating ?? 0,
        communicationRating: item.communicationRating ?? item.CommunicationRating,
        sessionQualityRating: item.sessionQualityRating ?? item.SessionQualityRating,
        learningProgressRating: item.learningProgressRating ?? item.LearningProgressRating,
        professionalismRating: item.professionalismRating ?? item.ProfessionalismRating,
        wouldRecommend: item.wouldRecommend ?? item.WouldRecommend ?? false,
        wouldWorkTogetherAgain: item.wouldWorkTogetherAgain ?? item.WouldWorkTogetherAgain ?? false,
        contractObjectivesMet: item.contractObjectivesMet ?? item.ContractObjectivesMet,
        improvementSuggestions: item.improvementSuggestions || item.ImprovementSuggestions,
        additionalComments: item.additionalComments || item.AdditionalComments,
        feedbackStatus: item.feedbackStatus || item.FeedbackStatus || 'Submitted',
        createdDate: item.createdDate || item.CreatedDate || new Date().toISOString(),
        userFullName: item.userFullName || item.UserFullName,
        contractTitle: item.contractTitle || item.ContractTitle,
      };
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || 'Failed to update final feedback',
    };
  }
}

// Get all units
export async function getAllUnits() {
  try {
    const result = await apiService.request<any>('/units', {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const data = result.data;
      // Handle both direct array and wrapped response
      const unitsArray = Array.isArray(data) ? data : (data.data || []);
      
      const mappedData: Unit[] = unitsArray.map((item: any) => ({
        unitId: item.unitId || item.UnitId || '',
        unitName: item.unitName || item.UnitName || '',
        unitDescription: item.unitDescription || item.UnitDescription,
        unitOrder: item.unitOrder || item.UnitOrder || 0,
        curriculumId: item.curriculumId || item.CurriculumId || '',
        curriculumName: item.curriculumName || item.CurriculumName,
        credit: item.credit || item.Credit || 0,
        learningObjectives: item.learningObjectives || item.LearningObjectives,
        isActive: item.isActive !== undefined ? item.isActive : (item.IsActive !== undefined ? item.IsActive : true),
        description: item.description || item.Description,
        createdDate: item.createdDate || item.CreatedDate,
        updatedDate: item.updatedDate || item.UpdatedDate,
      }));
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    return {
      success: false,
      data: [],
      error: result.error || 'Failed to fetch units',
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch units',
    };
  }
}

// =====================
// Curriculum & Unit admin CRUD (FE helpers)
// These call assumed admin endpoints. Backend must enforce authorization.
// =====================

export interface Curriculum {
  curriculumId: string;
  curriculumName: string;
  curriculumCode?: string;
  description?: string;
  grades?: string;
  syllabusUrl?: string;
  totalCredits?: number;
  totalSchools?: number;
  totalPackages?: number;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export async function getAllCurriculums() {
  try {
    const result = await apiService.request<any>('/curricula', { method: 'GET' });
    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data : (result.data.data || []);
      const mapped: Curriculum[] = data.map((item: any) => ({
        curriculumId: item.curriculumId || item.CurriculumId || '',
        curriculumName: item.curriculumName || item.CurriculumName || '',
        curriculumCode: item.curriculumCode || item.CurriculumCode,
        description: item.description || item.Description,
        grades: item.grades || item.Grades,
        syllabusUrl: item.syllabusUrl || item.SyllabusUrl,
        totalCredits: item.totalCredits || item.TotalCredits || 0,
        totalSchools: item.totalSchools || item.TotalSchools || 0,
        totalPackages: item.totalPackages || item.TotalPackages || 0,
        isActive: item.isActive !== undefined ? item.isActive : (item.IsActive !== undefined ? item.IsActive : true),
        createdDate: item.createdDate || item.CreatedDate,
        updatedDate: item.updatedDate || item.UpdatedDate,
      }));

      return { success: true, data: mapped };
    }

    return { success: false, data: [], error: result.error || 'Failed to fetch curriculums' };
  } catch (error: any) {
    return { success: false, data: [], error: error?.message || 'Failed to fetch curriculums' };
  }
}

export async function getCurriculumById(curriculumId: string) {
  try {
    const result = await apiService.request<any>(`/curricula/${curriculumId}`, { method: 'GET' });
    if (result.success && result.data) {
      const item = result.data;
      const mapped: Curriculum = {
        curriculumId: item.curriculumId || item.CurriculumId || curriculumId,
        curriculumName: item.curriculumName || item.CurriculumName || '',
        curriculumCode: item.curriculumCode || item.CurriculumCode,
        description: item.description || item.Description,
        grades: item.grades || item.Grades,
        syllabusUrl: item.syllabusUrl || item.SyllabusUrl,
        totalCredits: item.totalCredits || item.TotalCredits || 0,
        totalSchools: item.totalSchools || item.TotalSchools || 0,
        totalPackages: item.totalPackages || item.TotalPackages || 0,
        isActive: item.isActive !== undefined ? item.isActive : (item.IsActive !== undefined ? item.IsActive : true),
        createdDate: item.createdDate || item.CreatedDate,
        updatedDate: item.updatedDate || item.UpdatedDate,
      };
      return { success: true, data: mapped };
    }
    return { success: false, data: null, error: result.error || 'Failed to fetch curriculum' };
  } catch (error: any) {
    return { success: false, data: null, error: error?.message || 'Failed to fetch curriculum' };
  }
}

export async function getUnitsByCurriculumId(curriculumId: string) {
  try {
    const result = await apiService.request<any>(`/units/by-curriculum/${curriculumId}`, { method: 'GET' });
    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data : (result.data.data || []);
      return { success: true, data };
    }
    return { success: false, data: [], error: result.error || 'Failed to fetch units' };
  } catch (error: any) {
    return { success: false, data: [], error: error?.message || 'Failed to fetch units' };
  }
}

export async function createCurriculum(request: { 
  CurriculumName: string; 
  Description?: string;
  CurriculumCode?: string;
  Grades?: string;
  SyllabusUrl?: string;
  IsActive?: boolean;
}) {
  return apiService.request<any>('/curricula', {
    method: 'POST',
    body: JSON.stringify({ 
      CurriculumName: request.CurriculumName, 
      Description: request.Description,
      CurriculumCode: request.CurriculumCode,
      Grades: request.Grades,
      SyllabusUrl: request.SyllabusUrl,
      IsActive: request.IsActive,
    }),
  });
}

export async function updateCurriculum(curriculumId: string, request: { 
  CurriculumName?: string; 
  Description?: string;
  CurriculumCode?: string;
  Grades?: string;
  SyllabusUrl?: string;
  IsActive?: boolean;
}) {
  return apiService.request<any>(`/curricula/${curriculumId}`, {
    method: 'PUT',
    body: JSON.stringify({ 
      CurriculumName: request.CurriculumName, 
      Description: request.Description,
      CurriculumCode: request.CurriculumCode,
      Grades: request.Grades,
      SyllabusUrl: request.SyllabusUrl,
      IsActive: request.IsActive,
    }),
  });
}

export async function deleteCurriculum(curriculumId: string) {
  return apiService.request<any>(`/curricula/${curriculumId}`, {
    method: 'DELETE',
  });
}

// Create/Update/Delete units (admin)
export async function createUnit(request: { 
  UnitName: string; 
  UnitOrder?: number; 
  CurriculumId?: string;
  UnitDescription?: string;
  Credit?: number;
  LearningObjectives?: string;
  IsActive?: boolean;
  ConceptIds?: string[];
}) {
  return apiService.request<any>('/units', {
    method: 'POST',
    body: JSON.stringify({ 
      UnitName: request.UnitName, 
      UnitOrder: request.UnitOrder, 
      CurriculumId: request.CurriculumId,
      UnitDescription: request.UnitDescription,
      Credit: request.Credit,
      LearningObjectives: request.LearningObjectives,
      IsActive: request.IsActive,
      ConceptIds: request.ConceptIds,
    }),
  });
}

export async function updateUnit(unitId: string, request: { 
  UnitName?: string; 
  UnitOrder?: number; 
  UnitDescription?: string;
  Credit?: number;
  LearningObjectives?: string;
  IsActive?: boolean;
  ConceptIds?: string[];
}) {
  // Note: CurriculumId is not included as it cannot be changed when updating a unit
  return apiService.request<any>(`/units/${unitId}`, {
    method: 'PUT',
    body: JSON.stringify({ 
      UnitName: request.UnitName, 
      UnitOrder: request.UnitOrder, 
      UnitDescription: request.UnitDescription,
      Credit: request.Credit,
      LearningObjectives: request.LearningObjectives,
      IsActive: request.IsActive,
      ConceptIds: request.ConceptIds,
    }),
  });
}

export async function deleteUnit(unitId: string) {
  return apiService.request<any>(`/units/${unitId}`, {
    method: 'DELETE',
  });
}

// Math Concepts API
export async function createMathConcept(request: {
  Name: string;
  Category?: string;
  UnitIds?: string[];
}) {
  return apiService.request<any>('/math-concepts', {
    method: 'POST',
    body: JSON.stringify({
      Name: request.Name,
      Category: request.Category,
      UnitIds: request.UnitIds,
    }),
  });
}

export async function updateMathConcept(conceptId: string, request: {
  Name: string;
  Category?: string;
}) {
  return apiService.request<any>(`/math-concepts/${conceptId}`, {
    method: 'PUT',
    body: JSON.stringify({
      Name: request.Name,
      Category: request.Category,
    }),
  });
}

export async function deleteMathConcept(conceptId: string) {
  return apiService.request<any>(`/math-concepts/${conceptId}`, {
    method: 'DELETE',
  });
}

export async function getMathConceptById(conceptId: string) {
  return apiService.request<any>(`/math-concepts/${conceptId}`, {
    method: 'GET',
  });
}

export async function getAllMathConcepts() {
  return apiService.request<any>('/math-concepts', {
    method: 'GET',
  });
}

export async function getMathConceptsByUnitId(unitId: string) {
  return apiService.request<any>(`/math-concepts/by-unit/${unitId}`, {
    method: 'GET',
  });
}

export async function getMathConceptByName(name: string) {
  return apiService.request<any>(`/math-concepts/by-name/${encodeURIComponent(name)}`, {
    method: 'GET',
  });
}

export async function getMathConceptsByCategory(category: string) {
  return apiService.request<any>(`/math-concepts/by-category/${encodeURIComponent(category)}`, {
    method: 'GET',
  });
}

export async function linkMathConceptToUnits(conceptId: string, unitIds: string[]) {
  return apiService.request<any>(`/math-concepts/${conceptId}/link-units`, {
    method: 'POST',
    body: JSON.stringify({
      UnitIds: unitIds,
    }),
  });
}

export async function unlinkMathConceptFromUnits(conceptId: string, unitIds: string[]) {
  return apiService.request<any>(`/math-concepts/${conceptId}/unlink-units`, {
    method: 'POST',
    body: JSON.stringify({
      UnitIds: unitIds,
    }),
  });
}

// Get units by contract ID
export async function getUnitsByContractId(contractId: string) {
  try {
    const result = await apiService.request<any>(`/units/by-contract/${contractId}`, {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const data = result.data;
      // Handle both direct array and wrapped response
      const unitsArray = Array.isArray(data) ? data : (data.data || []);
      
      const mappedData: Unit[] = unitsArray.map((item: any) => ({
        unitId: item.unitId || item.UnitId || '',
        unitName: item.unitName || item.UnitName || '',
        unitDescription: item.unitDescription || item.UnitDescription,
        unitOrder: item.unitOrder || item.UnitOrder || 0,
        curriculumId: item.curriculumId || item.CurriculumId || '',
        curriculumName: item.curriculumName || item.CurriculumName,
        description: item.description || item.Description || item.unitDescription || item.UnitDescription,
        createdDate: item.createdDate || item.CreatedDate,
        updatedDate: item.updatedDate || item.UpdatedDate,
      }));
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    return {
      success: false,
      data: [],
      error: result.error || 'Failed to fetch units by contract',
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch units by contract',
    };
  }
}

// ==================== Tutor Report APIs ====================

export interface Report {
  reportId: string;
  parentId: string;
  tutorId: string;
  content: string;
  url?: string;
  status: 'pending' | 'approved' | 'denied';
  createdDate: string;
  type?: string;
  contractId?: string;
  parent?: {
    id: string;
    fullName: string;
    email: string;
  };
  tutor?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateReportRequest {
  tutorId?: string; // Required for parent reports, not needed for tutor reports
  parentId?: string; // Required for parent reports, not needed for tutor reports
  contractId: string;
  content: string;
  url?: string;
}

// Get reports by parent ID
export async function getReportsByParent(parentId: string) {
  try {
    const result = await apiService.request<any[]>(`/reports/parent/${parentId}`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      const mappedData: Report[] = result.data.map((item: any) => ({
        reportId: item.reportId || item.ReportId || '',
        parentId: item.parentId || item.ParentId || '',
        tutorId: item.tutorId || item.TutorId || '',
        content: item.content || item.Content || '',
        url: item.url || item.Url,
        status: (item.status || item.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'denied',
        createdDate: item.createdDate || item.CreatedDate || '',
        type: item.type || item.Type,
        contractId: item.contractId || item.ContractId,
        parent: item.parent || item.Parent ? {
          id: item.parent?.id || item.parent?.Id || item.Parent?.id || item.Parent?.Id || '',
          fullName: item.parent?.fullName || item.parent?.FullName || item.Parent?.fullName || item.Parent?.FullName || '',
          email: item.parent?.email || item.parent?.Email || item.Parent?.email || item.Parent?.Email || '',
        } : undefined,
        tutor: item.tutor || item.Tutor ? {
          id: item.tutor?.id || item.tutor?.Id || item.Tutor?.id || item.Tutor?.Id || '',
          fullName: item.tutor?.fullName || item.tutor?.FullName || item.Tutor?.fullName || item.Tutor?.FullName || '',
          email: item.tutor?.email || item.tutor?.Email || item.Tutor?.email || item.Tutor?.Email || '',
        } : undefined,
      }));

      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }

    return result;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch reports';
    return {
      success: false,
      data: [],
      error: errorMessage,
    };
  }
}

// Create a new report
export async function createReport(data: CreateReportRequest) {
  try {
    if (!data.contractId || !data.content) {
      return {
        success: false,
        data: null,
        error: 'Contract ID and Content are required',
      };
    }

    const requestBody: any = {
      contractId: data.contractId,
      content: data.content.trim(),
    };

    // Only include tutorId and parentId if provided (for parent reports)
    if (data.tutorId) {
      requestBody.tutorId = data.tutorId;
    }
    if (data.parentId) {
      requestBody.parentId = data.parentId;
    }

    if (data.url && data.url.trim()) {
      requestBody.url = data.url.trim();
    }

    const result = await apiService.request<any>(`/reports`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (result.success && result.data) {
      const item = result.data;
      const mappedData: Report = {
        reportId: item.reportId || item.ReportId || '',
        parentId: item.parentId || item.ParentId || '',
        tutorId: item.tutorId || item.TutorId || '',
        content: item.content || item.Content || '',
        url: item.url || item.Url,
        status: (item.status || item.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'denied',
        createdDate: item.createdDate || item.CreatedDate || '',
        type: item.type || item.Type,
        contractId: item.contractId || item.ContractId,
        parent: item.parent || item.Parent ? {
          id: item.parent?.id || item.parent?.Id || item.Parent?.id || item.Parent?.Id || '',
          fullName: item.parent?.fullName || item.parent?.FullName || item.Parent?.fullName || item.Parent?.FullName || '',
          email: item.parent?.email || item.parent?.Email || item.Parent?.email || item.Parent?.Email || '',
        } : undefined,
        tutor: item.tutor || item.Tutor ? {
          id: item.tutor?.id || item.tutor?.Id || item.Tutor?.id || item.Tutor?.Id || '',
          fullName: item.tutor?.fullName || item.tutor?.FullName || item.Tutor?.fullName || item.Tutor?.FullName || '',
          email: item.tutor?.email || item.tutor?.Email || item.Tutor?.email || item.Tutor?.Email || '',
        } : undefined,
      };

      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }

    return result;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create report';
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
}

// Get reports by tutor ID
export async function getReportsByTutor(tutorId: string) {
  try {
    const result = await apiService.request<any[]>(`/reports/tutor/${tutorId}`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      const mappedData: Report[] = result.data.map((item: any) => ({
        reportId: item.reportId || item.ReportId || '',
        parentId: item.parentId || item.ParentId || '',
        tutorId: item.tutorId || item.TutorId || '',
        content: item.content || item.Content || '',
        url: item.url || item.Url,
        status: (item.status || item.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'denied',
        createdDate: item.createdDate || item.CreatedDate || '',
        type: item.type || item.Type,
        contractId: item.contractId || item.ContractId,
        parent: item.parent || item.Parent ? {
          id: item.parent?.id || item.parent?.Id || item.Parent?.id || item.Parent?.Id || '',
          fullName: item.parent?.fullName || item.parent?.FullName || item.Parent?.fullName || item.Parent?.FullName || '',
          email: item.parent?.email || item.parent?.Email || item.Parent?.email || item.Parent?.Email || '',
        } : undefined,
        tutor: item.tutor || item.Tutor ? {
          id: item.tutor?.id || item.tutor?.Id || item.Tutor?.id || item.Tutor?.Id || '',
          fullName: item.tutor?.fullName || item.tutor?.FullName || item.Tutor?.fullName || item.Tutor?.FullName || '',
          email: item.tutor?.email || item.tutor?.Email || item.Tutor?.email || item.Tutor?.Email || '',
        } : undefined,
      }));

      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }

    return result;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch reports';
    return {
      success: false,
      data: [],
      error: errorMessage,
    };
  }
}

// Get all reports (for staff/admin)
export async function getAllReports() {
  try {
    const result = await apiService.request<any[]>(`/reports`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      const mappedData: Report[] = result.data.map((item: any) => ({
        reportId: item.reportId || item.ReportId || '',
        parentId: item.parentId || item.ParentId || '',
        tutorId: item.tutorId || item.TutorId || '',
        content: item.content || item.Content || '',
        url: item.url || item.Url,
        status: (item.status || item.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'denied',
        createdDate: item.createdDate || item.CreatedDate || '',
        type: item.type || item.Type,
        contractId: item.contractId || item.ContractId,
        parent: item.parent || item.Parent ? {
          id: item.parent?.id || item.parent?.Id || item.Parent?.id || item.Parent?.Id || '',
          fullName: item.parent?.fullName || item.parent?.FullName || item.Parent?.fullName || item.Parent?.FullName || '',
          email: item.parent?.email || item.parent?.Email || item.Parent?.email || item.Parent?.Email || '',
        } : undefined,
        tutor: item.tutor || item.Tutor ? {
          id: item.tutor?.id || item.tutor?.Id || item.Tutor?.id || item.Tutor?.Id || '',
          fullName: item.tutor?.fullName || item.tutor?.FullName || item.Tutor?.fullName || item.Tutor?.FullName || '',
          email: item.tutor?.email || item.tutor?.Email || item.Tutor?.email || item.Tutor?.Email || '',
        } : undefined,
      }));

      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }

    return result;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch reports';
    return {
      success: false,
      data: [],
      error: errorMessage,
    };
  }
}

// Update report status (for staff/admin)
export async function updateReportStatus(reportId: string, status: 'approved' | 'denied') {
  try {
    if (!reportId || !status) {
      return {
        success: false,
        error: 'Report ID and status are required',
        data: undefined,
      };
    }

    const result = await apiService.request<any>(`/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    if (result.success && result.data) {
      const item = result.data;
      const mappedData: Report = {
        reportId: item.reportId || item.ReportId || '',
        parentId: item.parentId || item.ParentId || '',
        tutorId: item.tutorId || item.TutorId || '',
        content: item.content || item.Content || '',
        url: item.url || item.Url,
        status: (item.status || item.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'denied',
        createdDate: item.createdDate || item.CreatedDate || '',
        type: item.type || item.Type,
        contractId: item.contractId || item.ContractId,
        parent: item.parent || item.Parent ? {
          id: item.parent?.id || item.parent?.Id || item.Parent?.id || item.Parent?.Id || '',
          fullName: item.parent?.fullName || item.parent?.FullName || item.Parent?.fullName || item.Parent?.FullName || '',
          email: item.parent?.email || item.parent?.Email || item.Parent?.email || item.Parent?.Email || '',
        } : undefined,
        tutor: item.tutor || item.Tutor ? {
          id: item.tutor?.id || item.tutor?.Id || item.Tutor?.id || item.Tutor?.Id || '',
          fullName: item.tutor?.fullName || item.tutor?.FullName || item.Tutor?.fullName || item.Tutor?.FullName || '',
          email: item.tutor?.email || item.tutor?.Email || item.Tutor?.email || item.Tutor?.Email || '',
        } : undefined,
      };

      return {
        success: true,
        data: mappedData,
        error: null,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error updating report status:', error);
    return {
      success: false,
      data: null,
      error: error?.response?.data?.error || error?.message || 'Failed to update report status',
    };
  }
}

// ============================================
// WITHDRAWAL API FUNCTIONS
// ============================================

export interface WithdrawalRequest {
  id: string;
  parentId: string;
  staffId?: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankHolderName: string;
  status: 'Pending' | 'Processed' | 'Rejected';
  createdDate: string;
  processedDate?: string;
}

export interface WithdrawalRequestCreateDto {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankHolderName: string;
}

// Request withdrawal
export async function requestWithdrawal(data: WithdrawalRequestCreateDto): Promise<ApiResponse<WithdrawalRequest>> {
  try {
    const result = await apiService.request<WithdrawalRequest>('/withdrawals/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success && result.data) {
      // Map backend response to frontend interface
      const mappedData: WithdrawalRequest = {
        id: result.data.id || (result.data as any).Id || '',
        parentId: result.data.parentId || (result.data as any).ParentId || '',
        staffId: result.data.staffId || (result.data as any).StaffId || undefined,
        amount: result.data.amount || (result.data as any).Amount || 0,
        bankName: result.data.bankName || (result.data as any).BankName || '',
        bankAccountNumber: result.data.bankAccountNumber || (result.data as any).BankAccountNumber || '',
        bankHolderName: result.data.bankHolderName || (result.data as any).BankHolderName || '',
        status: (result.data.status || (result.data as any).Status || 'Pending') as 'Pending' | 'Processed' | 'Rejected',
        createdDate: result.data.createdDate || (result.data as any).CreatedDate || new Date().toISOString(),
        processedDate: result.data.processedDate || (result.data as any).ProcessedDate || undefined,
      };

      return {
        success: true,
        data: mappedData,
        error: undefined,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error requesting withdrawal:', error);
    
    // Check if it's an incomplete chunked encoding error
    const errorMessage = error?.message || '';
    const isIncompleteChunked = errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') || 
                                 errorMessage.includes('chunked') ||
                                 errorMessage.includes('incomplete');
    
    // If it's incomplete chunked encoding, return special flag
    if (isIncompleteChunked) {
      return {
        success: false,
        data: undefined,
        error: 'INCOMPLETE_RESPONSE', // Special flag to indicate incomplete response
      };
    }
    
    return {
      success: false,
      data: undefined,
      error: error?.response?.data?.error || errorMessage || 'Failed to request withdrawal',
    };
  }
}

// Get my withdrawal requests
export async function getMyWithdrawalRequests(): Promise<ApiResponse<WithdrawalRequest[]>> {
  try {
    const result = await apiService.request<WithdrawalRequest[]>('/withdrawals/my-requests', {
      method: 'GET',
    });

    if (result.success && result.data) {
      // Map backend response array to frontend interface
      const mappedData: WithdrawalRequest[] = result.data.map((item: any) => ({
        id: item.id || item.Id || '',
        parentId: item.parentId || item.ParentId || '',
        staffId: item.staffId || item.StaffId || undefined,
        amount: item.amount || item.Amount || 0,
        bankName: item.bankName || item.BankName || '',
        bankAccountNumber: item.bankAccountNumber || item.BankAccountNumber || '',
        bankHolderName: item.bankHolderName || item.BankHolderName || '',
        status: (item.status || item.Status || 'Pending') as 'Pending' | 'Processed' | 'Rejected',
        createdDate: item.createdDate || item.CreatedDate || new Date().toISOString(),
        processedDate: item.processedDate || item.ProcessedDate || undefined,
      }));

      return {
        success: true,
        data: mappedData,
        error: undefined,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error getting withdrawal requests:', error);
    return {
      success: false,
      data: undefined,
      error: error?.response?.data?.error || error?.message || 'Failed to get withdrawal requests',
    };
  }
}

// Get pending withdrawal requests (for staff/admin)
export async function getPendingWithdrawalRequests(): Promise<ApiResponse<WithdrawalRequest[]>> {
  try {
    const result = await apiService.request<WithdrawalRequest[]>('/withdrawals/pending', {
      method: 'GET',
    });

    if (result.success && result.data) {
      // Map backend response array to frontend interface
      const mappedData: WithdrawalRequest[] = result.data.map((item: any) => ({
        id: item.id || item.Id || '',
        parentId: item.parentId || (item as any).ParentId || '',
        staffId: item.staffId || (item as any).StaffId || undefined,
        amount: item.amount || (item as any).Amount || 0,
        bankName: item.bankName || (item as any).BankName || '',
        bankAccountNumber: item.bankAccountNumber || (item as any).BankAccountNumber || '',
        bankHolderName: item.bankHolderName || (item as any).BankHolderName || '',
        status: (item.status || (item as any).Status || 'Pending') as 'Pending' | 'Processed' | 'Rejected',
        createdDate: item.createdDate || (item as any).CreatedDate || new Date().toISOString(),
        processedDate: item.processedDate || (item as any).ProcessedDate || undefined,
      }));

      return {
        success: true,
        data: mappedData,
        error: undefined,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error getting pending withdrawal requests:', error);
    return {
      success: false,
      data: undefined,
      error: error?.response?.data?.error || error?.message || 'Failed to get pending withdrawal requests',
    };
  }
}

// Process withdrawal request (for staff/admin)
export async function processWithdrawalRequest(withdrawalId: string): Promise<ApiResponse<WithdrawalRequest>> {
  try {
    const result = await apiService.request<WithdrawalRequest>(`/withdrawals/process/${withdrawalId}`, {
      method: 'PUT',
    });

    if (result.success && result.data) {
      // Map backend response to frontend interface
      const mappedData: WithdrawalRequest = {
        id: result.data.id || (result.data as any).Id || '',
        parentId: result.data.parentId || (result.data as any).ParentId || '',
        staffId: result.data.staffId || (result.data as any).StaffId || undefined,
        amount: result.data.amount || (result.data as any).Amount || 0,
        bankName: result.data.bankName || (result.data as any).BankName || '',
        bankAccountNumber: result.data.bankAccountNumber || (result.data as any).BankAccountNumber || '',
        bankHolderName: result.data.bankHolderName || (result.data as any).BankHolderName || '',
        status: (result.data.status || (result.data as any).Status || 'Processed') as 'Pending' | 'Processed' | 'Rejected',
        createdDate: result.data.createdDate || (result.data as any).CreatedDate || new Date().toISOString(),
        processedDate: result.data.processedDate || (result.data as any).ProcessedDate || undefined,
      };

      return {
        success: true,
        data: mappedData,
        error: undefined,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error processing withdrawal request:', error);
    return {
      success: false,
      data: undefined,
      error: error?.response?.data?.error || error?.message || 'Failed to process withdrawal request',
    };
  }
}
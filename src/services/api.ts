const API_BASE_URL = 'https://api.vibe88.tech/api';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  gender?: string;
  role_id?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface DashboardStats {
  totalUsers: number;
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

class ApiService {
  private async request<T>(
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
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
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
  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/signup', {
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

  async googleLogin(token: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
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
    return this.request('/user/profile');
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    // Clear local storage regardless of API response
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    return response;
  }
}

export const apiService = new ApiService();
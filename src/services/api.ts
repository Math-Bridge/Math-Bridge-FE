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
  phone?: string;
  address?: string;
  createdAt: string;
  role?: string;
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
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('Adding auth token to request:', { 
          url, 
          tokenLength: token.length, 
          tokenStart: token.substring(0, 20) + '...' 
        });
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      } else {
        console.warn('No auth token found for request:', url);
      }

      const response = await fetch(url, config);
      const text = await response.text();
      let data: any = undefined;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch (jsonError) {
        // If response is not valid JSON, keep data as undefined
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          console.warn('401 Unauthorized - clearing auth data');
          // Commented out automatic logout to prevent unwanted redirects
          // localStorage.removeItem('authToken');
          // localStorage.removeItem('user');
          // window.location.href = '/login';
        }
        
        return {
          success: false,
          error: (data && data.error) || (data && data.message) || `HTTP error! status: ${response.status}`,
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
    console.log('API service login called with:', credentials);
    const result = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    console.log('API login result:', result);
    return result;
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
    console.log('API resetPassword called with:', data);
    
    const response = await this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log('API resetPassword response:', response);
    return response;
  }

  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async googleLogin(token: string): Promise<ApiResponse<{ token: string }>> {
    return await this.request<{ token: string }>('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ IdToken: token }),
    }) as ApiResponse<{ token: string }>;
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    return response;
  }

  async getUserWallet(userId: string): Promise<ApiResponse<{ balance: number; transactions: any[] }>> {
    return this.request(`/users/${userId}/wallet`);
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
}

export interface CreateCenterRequest {
  name: string;
  address: string;
  phone?: string;
}

export interface UpdateCenterRequest {
  name?: string;
  address?: string;
  phone?: string;
  status?: string;
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
  return apiService.request<Child[]>(`/children`);
}

export async function getChildById(childId: string) {
  return apiService.request<Child>(`/children/${childId}`);
}

export async function getChildrenByParent(parentId: string) {
  return apiService.request<Child[]>(`/parents/${parentId}/children`);
}

export async function addChild(parentId: string, data: AddChildRequest) {
  // Convert camelCase to PascalCase for backend
  const requestData = {
    FullName: data.fullName,
    SchoolId: data.schoolId,
    CenterId: data.centerId,
    Grade: data.grade,
    DateOfBirth: data.dateOfBirth
  };
  
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

// Contract API
export interface Contract {
  contractId: string;
  childId: string;
  childName: string;
  packageId: string;
  packageName: string;
  mainTutorId: string;
  mainTutorName: string;
  centerId?: string;
  centerName?: string;
  startDate: string;
  endDate: string;
  timeSlot: string;
  isOnline: boolean;
  status: string;
}

export interface CreateContractRequest {
  childId: string;
  packageId: string;
  mainTutorId: string;
  centerId?: string;
  startDate: string;
  endDate: string;
  timeSlot: string;
  isOnline: boolean;
}

export async function createContract(data: CreateContractRequest) {
  return apiService.request<{ contractId: string }>(`/contracts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getContractsByParent(parentId: string) {
  return apiService.request<Contract[]>(`/contracts/parents/${parentId}`);
}

export async function getContractsByChild(childId: string) {
  return apiService.request<Contract[]>(`/children/${childId}/contracts`);
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
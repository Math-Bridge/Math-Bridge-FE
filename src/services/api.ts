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
        // Ensure token is not empty and is a valid string
        const cleanToken = token.trim();
        if (cleanToken) {
          console.log('Adding auth token to request:', { 
            url, 
            tokenLength: cleanToken.length, 
            tokenStart: cleanToken.substring(0, 20) + '...' 
          });
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${cleanToken}`,
          } as HeadersInit;
        } else {
          console.warn('Auth token is empty for request:', url);
        }
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
          const currentToken = localStorage.getItem('authToken');
          console.warn('401 Unauthorized - Token authentication failed:', {
            url,
            hasToken: !!currentToken,
            tokenLength: currentToken?.length || 0,
            tokenPreview: currentToken ? `${currentToken.substring(0, 30)}...` : 'N/A',
            responseText: text.substring(0, 200)
          });
          
          // Clear invalid token and user data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Redirect to login only if not already on login page
          if (!window.location.pathname.includes('/login')) {
            console.log('Redirecting to login due to 401 Unauthorized error');
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
        
        // Log detailed error information for debugging
        console.error('API Error Details:', {
          url,
          status: response.status,
          statusText: response.statusText,
          responseData: data,
          responseText: text.substring(0, 500), // First 500 chars
          hasToken: !!localStorage.getItem('authToken'),
          requestHeaders: config.headers
        });
        
        // Extract error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (data) {
          if (data.error) {
            errorMessage = data.error;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (typeof data === 'string') {
            errorMessage = data;
          }
        } else if (text) {
          errorMessage = text.substring(0, 200); // First 200 chars of text response
        }
        
        return {
          success: false,
          error: errorMessage,
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

  async saveAddress(placeId: string): Promise<ApiResponse<{
    success: boolean;
    message: string;
    locationUpdatedDate?: string;
  }>> {
    return this.request('/location/save-address', {
      method: 'POST',
      body: JSON.stringify({ PlaceId: placeId }),
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

  // Admin endpoints
  async getAdminStats(): Promise<ApiResponse<any>> {
    return this.request('/admin/stats');
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

export async function getActiveSchools() {
  return apiService.request<{ data: School[] }>(`/schools/active`);
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
  // Ignore fields that don't exist in backend
  reschedule_count?: never; // This field doesn't exist, ignore it
  rescheduleCount?: never;
  RescheduleCount?: never;
}

export interface CreateContractRequest {
  parentId: string;
  childId: string;
  packageId: string;
  mainTutorId: string;
  substituteTutor1Id?: string; // Optional substitute tutor 1
  substituteTutor2Id?: string; // Optional substitute tutor 2
  centerId?: string;
  startDate: string;
  endDate: string;
  daysOfWeeks?: number; // Bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
  startTime?: string; // Format: "HH:mm"
  endTime?: string; // Format: "HH:mm"
  isOnline: boolean;
  offlineAddress?: string;
  offlineLatitude?: number;
  offlineLongitude?: number;
  videoCallPlatform?: string;
  maxDistanceKm?: number;
}

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
  
  // Validate required fields before building request
  if (!cleanData.daysOfWeeks || cleanData.daysOfWeeks === 0) {
    return Promise.resolve({
      success: false,
      error: 'At least one day must be selected (DaysOfWeeks must be 1-127)',
      data: null
    });
  }

  if (!cleanData.startTime || !cleanData.endTime || cleanData.startTime === '' || cleanData.endTime === '') {
    return Promise.resolve({
      success: false,
      error: 'Start time and End time are required',
      data: null
    });
  }

  // Map camelCase to PascalCase for backend
  // Backend expects DateOnly (YYYY-MM-DD) and TimeOnly (HH:mm) formats
  const requestData: any = {
    ParentId: cleanData.parentId,
    ChildId: cleanData.childId,
    PackageId: cleanData.packageId,
    StartDate: cleanData.startDate, // Format: YYYY-MM-DD (DateOnly)
    EndDate: cleanData.endDate, // Format: YYYY-MM-DD (DateOnly)
    DaysOfWeeks: cleanData.daysOfWeeks, // Must be 1-127 (at least one day)
    StartTime: cleanData.startTime, // Format: HH:mm (TimeOnly)
    EndTime: cleanData.endTime, // Format: HH:mm (TimeOnly)
    IsOnline: cleanData.isOnline,
    MaxDistanceKm: cleanData.maxDistanceKm ?? (cleanData.isOnline ? 0 : 10)
  };
  
  // MainTutorId is required by backend DTO, but entity allows nullable
  // For now, we send empty GUID and backend should handle validation
  // Note: Backend may return error if MainTutorId is empty GUID and validation fails
  requestData.MainTutorId = cleanData.mainTutorId || '00000000-0000-0000-0000-000000000000';
  
  // Optional fields - only include if provided
  if (cleanData.substituteTutor1Id) {
    requestData.SubstituteTutor1Id = cleanData.substituteTutor1Id;
  }
  if (cleanData.substituteTutor2Id) {
    requestData.SubstituteTutor2Id = cleanData.substituteTutor2Id;
  }
  if (cleanData.centerId) {
    requestData.CenterId = cleanData.centerId;
  }
  if (cleanData.offlineAddress) {
    requestData.OfflineAddress = cleanData.offlineAddress;
  }
  if (cleanData.offlineLatitude !== undefined) {
    requestData.OfflineLatitude = cleanData.offlineLatitude;
  }
  if (cleanData.offlineLongitude !== undefined) {
    requestData.OfflineLongitude = cleanData.offlineLongitude;
  }
  if (cleanData.videoCallPlatform) {
    requestData.VideoCallPlatform = cleanData.videoCallPlatform;
  }
  
  // Note: Backend validation requires MainTutorId to be a valid tutor
  // If MainTutorId is empty GUID, backend will return "Invalid main tutor" error
  // This is expected behavior until backend allows nullable MainTutorId for pending contracts
  if (!requestData.MainTutorId) {
    return Promise.resolve({
      success: false,
      error: 'Main tutor ID is required by backend',
      data: null
    });
  }
  
  // Log the request data for debugging (excluding sensitive info)
  console.log('Creating contract with data:', {
    ...requestData,
    MainTutorId: requestData.MainTutorId ? `${requestData.MainTutorId.substring(0, 8)}...` : 'N/A'
  });
  
  return apiService.request<{ contractId: string }>(`/contracts`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

export async function getContractsByParent(parentId: string) {
  console.log(`[API] Fetching contracts for parent: ${parentId}`);
  
  const response = await apiService.request<Contract[]>(`/contracts/parents/${parentId}`);
  
  if (response.success && response.data) {
    console.log(`[API] Successfully fetched ${response.data.length} contracts for parent ${parentId}`);
    
    // Filter out reschedule_count field from response if present
    response.data = response.data.map((contract: any) => {
      const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanContract } = contract;
      return cleanContract;
    }) as Contract[];
  } else {
    console.error(`[API] Failed to fetch contracts for parent ${parentId}:`, response.error);
  }
  
  return response;
}

export async function getContractsByChild(childId: string) {
  const response = await apiService.request<Contract[]>(`/children/${childId}/contracts`);
  
  // Filter out reschedule_count field from response if present
  if (response.success && response.data) {
    response.data = response.data.map((contract: any) => {
      const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanContract } = contract;
      return cleanContract;
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
      const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanContract } = response.data;
      return {
        success: true,
        data: cleanContract,
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
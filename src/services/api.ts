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
          requestHeaders: config.headers,
          requestBody: config.body ? (() => {
            try {
              return JSON.parse(config.body as string);
            } catch {
              return config.body;
            }
          })() : null
        });
        
        // Extract error message from response
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
  daysOfWeeks?: number; // Bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64 (matches backend C# DayOfWeek enum)
  startTime?: string; // Format: "HH:mm"
  endTime?: string; // Format: "HH:mm"
  isOnline: boolean;
  offlineAddress?: string;
  offlineLatitude?: number;
  offlineLongitude?: number;
  videoCallPlatform?: string;
  maxDistanceKm?: number;
  paymentMethod?: 'wallet' | 'bank_transfer'; // Payment method selection
  status?: string;
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
    MaxDistanceKm: cleanData.maxDistanceKm ?? (cleanData.isOnline ? 0 : 10),
    Status: cleanData.status || 'pending' // Backend requires Status field - default to 'pending' for new contracts
  };
  
  // MainTutorId is optional - only send if it's a valid GUID (not empty/null)
  // If MainTutorId is empty GUID or null, don't send it (backend allows nullable)
  if (cleanData.mainTutorId && 
      cleanData.mainTutorId !== '00000000-0000-0000-0000-000000000000' && 
      cleanData.mainTutorId !== null &&
      typeof cleanData.mainTutorId === 'string' &&
      cleanData.mainTutorId.trim() !== '') {
    requestData.MainTutorId = cleanData.mainTutorId;
  }
  // Otherwise, don't include MainTutorId - backend will set it to null
  
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
  // VideoCallPlatform - include if provided and isOnline is true
  // Backend DTO has JsonPropertyName("videoCallPlatform") which expects camelCase in JSON
  if (cleanData.videoCallPlatform && cleanData.isOnline) {
    requestData.videoCallPlatform = cleanData.videoCallPlatform; // Send with camelCase to match JsonPropertyName
    console.log('videoCallPlatform included in request:', cleanData.videoCallPlatform);
  } else if (cleanData.isOnline && !cleanData.videoCallPlatform) {
    console.warn('Warning: isOnline is true but videoCallPlatform is not provided');
  }
  
  // Add payment method if provided
  if (cleanData.paymentMethod) {
    requestData.PaymentMethod = cleanData.paymentMethod;
  }
  
  // Log the request data for debugging (excluding sensitive info)
  console.log('Creating contract with data:', {
    ...requestData,
    MainTutorId: requestData.MainTutorId ? `${requestData.MainTutorId.substring(0, 8)}...` : 'null (not sent)',
    CenterId: requestData.CenterId ? `${requestData.CenterId.substring(0, 8)}...` : 'null (not sent)',
    DaysOfWeeks: requestData.DaysOfWeeks,
    Status: requestData.Status,
    IsOnline: requestData.IsOnline,
    videoCallPlatform: requestData.videoCallPlatform || 'not included',
    FullRequestBody: JSON.stringify(requestData) // Full request body for debugging
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
  daysOfWeek: number; // Bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
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

export interface UpdateTutorAvailabilityRequest extends CreateTutorAvailabilityRequest {
  AvailabilityId: string;
}

export interface BulkCreateTutorAvailabilityRequest {
  availabilities: CreateTutorAvailabilityRequest[];
}

export interface UpdateAvailabilityStatusRequest {
  status: string; // e.g., "active", "inactive", "suspended"
}

// GET /api/tutor-availabilities/my-availabilities
export async function getMyAvailabilities(activeOnly?: boolean) {
  const query = activeOnly ? '?activeOnly=true' : '';
  return apiService.request<TutorAvailability[]>(`/tutor-availabilities/my-availabilities${query}`);
}

// GET /api/tutor-availabilities/{id}
export async function getTutorAvailabilityById(id: string) {
  return apiService.request<TutorAvailability>(`/tutor-availabilities/${id}`);
}

// GET /api/tutor-availabilities/tutor/{tutorId}
export async function getTutorAvailabilitiesByTutorId(tutorId: string) {
  return apiService.request<TutorAvailability[]>(`/tutor-availabilities/tutor/${tutorId}`);
}

// POST /api/tutor-availabilities
export async function createTutorAvailability(data: CreateTutorAvailabilityRequest) {
  return apiService.request<TutorAvailability>(`/tutor-availabilities`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// PUT /api/tutor-availabilities/{id}
export async function updateTutorAvailability(id: string, data: CreateTutorAvailabilityRequest) {
  return apiService.request<TutorAvailability>(`/tutor-availabilities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE /api/tutor-availabilities/{id}
export async function deleteTutorAvailability(id: string) {
  return apiService.request<void>(`/tutor-availabilities/${id}`, {
    method: 'DELETE',
  });
}

// PATCH /api/tutor-availabilities/{id}/status
export async function updateTutorAvailabilityStatus(id: string, data: UpdateAvailabilityStatusRequest) {
  return apiService.request<TutorAvailability>(`/tutor-availabilities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// POST /api/tutor-availabilities/bulk
export async function bulkCreateTutorAvailabilities(data: BulkCreateTutorAvailabilityRequest) {
  return apiService.request<TutorAvailability[]>(`/tutor-availabilities/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
  childName: string;
  requestedDate: string;
  requestedTimeSlot: string;
  requestedTutorId?: string;
  requestedTutorName?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdDate: string;
}

export interface ApproveRescheduleRequest {
  newSessionDate?: string;
  newTimeSlot?: string;
  newTutorId?: string;
  notes?: string;
}

export interface RejectRescheduleRequest {
  reason: string;
}

export async function getRescheduleRequests(status?: 'pending' | 'approved' | 'rejected') {
  const query = status ? `?status=${status}` : '';
  return apiService.request<RescheduleRequest[]>(`/reschedule${query}`);
}

export async function approveRescheduleRequest(requestId: string, data: ApproveRescheduleRequest) {
  return apiService.request<{ message: string }>(`/reschedule/${requestId}/approve`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function rejectRescheduleRequest(requestId: string, data: RejectRescheduleRequest) {
  return apiService.request<{ message: string }>(`/reschedule/${requestId}/reject`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
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
  // TODO: Replace with actual API endpoint when available
  // For now, calculate from contracts and reschedule requests
  try {
    const [contractsRes, rescheduleRes] = await Promise.all([
      apiService.request<Contract[]>('/contracts'),
      getRescheduleRequests('pending'),
    ]);

    const pendingContracts = contractsRes.success && contractsRes.data
      ? contractsRes.data.filter(c => c.status === 'pending' || !c.mainTutorId).length
      : 0;

    const rescheduleRequests = rescheduleRes.success && rescheduleRes.data
      ? rescheduleRes.data.length
      : 0;

    return {
      success: true,
      data: {
        pendingContracts,
        activeTutors: 0, // TODO: Get from tutor API
        totalCenters: 0, // TODO: Get from center API
        unreadMessages: 0, // TODO: Get from chat API
        upcomingSessions: 0, // TODO: Get from sessions API
        completedSessions: 0, // TODO: Get from sessions API
        rescheduleRequests,
        newParentRequests: 0, // TODO: Get from parent requests API
      } as StaffStats,
    };
  } catch (error) {
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

export async function assignTutorToContract(contractId: string, tutorId: string) {
  return apiService.request<{ message: string }>(`/contracts/${contractId}/assign-tutor`, {
    method: 'PUT',
    body: JSON.stringify({ tutorId }),
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
}

export async function getAvailableTutors(params?: {
  centerId?: string;
  daysOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isOnline?: boolean;
}) {
  // Use existing searchTutorsByAvailability function
  return searchTutorsByAvailability({
    daysOfWeek: params?.daysOfWeek,
    availableFrom: params?.startTime,
    canTeachOnline: params?.isOnline,
    centerId: params?.centerId,
  });
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
  walletTransactionId: string;
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

  // Ensure Amount is sent as a number (not string) - backend expects decimal
  // JavaScript numbers are automatically serialized correctly in JSON
  const requestBody = {
    Amount: amountValue, // This will be serialized as number in JSON
    Description: data.description.trim() || 'Top up wallet',
  };

  console.log('Creating SePay payment with request:', {
    ...requestBody,
    AmountType: typeof requestBody.Amount,
    AmountValue: requestBody.Amount,
    AmountStringified: JSON.stringify(requestBody.Amount),
    DescriptionLength: requestBody.Description.length,
    DescriptionValue: requestBody.Description,
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

    console.log('SePay payment response:', result);

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
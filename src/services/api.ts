const API_BASE_URL = 'https://api.vibe88.tech/api';

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
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${cleanToken}`,
          } as HeadersInit;
        }
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
          // Clear invalid token and user data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Redirect to login only if not already on login page
          if (!window.location.pathname.includes('/login')) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
        
        // Log error information for debugging (only in development)
        if (import.meta.env.DEV) {
          console.error('API Error:', {
            url,
            status: response.status,
            statusText: response.statusText,
            error: data?.error || data?.message || text.substring(0, 200)
          });
        }
        
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
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
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

  async deductWallet(contractId: string): Promise<ApiResponse<{
    transactionId: string;
    amountDeducted: number;
    newWalletBalance: number;
    transactionStatus: string;
    transactionDate: string;
    message: string;
  }>> {
    return this.request(`/users/${contractId}/wallet/deduct`, {
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
  childName?: string | null;
  packageId: string;
  packageName?: string | null;
  mainTutorId?: string | null;
  mainTutorName?: string | null;
  centerId?: string | null;
  centerName?: string | null;
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
  paymentMethod?: 'wallet' | 'bank_transfer' | 'direct_payment'; // Payment method selection
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
  
  // MainTutorId - always send, use null if empty/invalid (don't leave field empty)
  if (cleanData.mainTutorId && 
      cleanData.mainTutorId !== '00000000-0000-0000-0000-000000000000' && 
      cleanData.mainTutorId !== null &&
      typeof cleanData.mainTutorId === 'string' &&
      cleanData.mainTutorId.trim() !== '') {
    requestData.MainTutorId = cleanData.mainTutorId;
  } else {
    requestData.MainTutorId = null; // Explicitly send null instead of omitting field
  }
  
  // SubstituteTutor1Id - always send, use null if not provided
  requestData.SubstituteTutor1Id = (cleanData.substituteTutor1Id && 
    cleanData.substituteTutor1Id !== '00000000-0000-0000-0000-000000000000' &&
    typeof cleanData.substituteTutor1Id === 'string' &&
    cleanData.substituteTutor1Id.trim() !== '')
    ? cleanData.substituteTutor1Id 
    : null;
  
  // SubstituteTutor2Id - always send, use null if not provided
  requestData.SubstituteTutor2Id = (cleanData.substituteTutor2Id && 
    cleanData.substituteTutor2Id !== '00000000-0000-0000-0000-000000000000' &&
    typeof cleanData.substituteTutor2Id === 'string' &&
    cleanData.substituteTutor2Id.trim() !== '')
    ? cleanData.substituteTutor2Id 
    : null;
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
  } else if (cleanData.isOnline && !cleanData.videoCallPlatform) {
    console.warn('Warning: isOnline is true but videoCallPlatform is not provided');
  }
  
  // Payment method is not sent to backend - it's only used in frontend to determine payment flow
  // Backend doesn't need to know payment method as it's handled differently:
  // - wallet: frontend calls deductWallet after contract creation (contract created with "pending" status)
  // - direct_payment: frontend calls createContractDirectPayment after contract creation
  //   Backend SePayService will update contract status to "unpaid" when creating payment
  
  // Set status based on payment method:
  // - For direct_payment: send "pending" (backend SePayService will change it to "unpaid")
  // - For wallet: send "pending" (will be activated after wallet deduction)
  if (cleanData.paymentMethod === 'direct_payment') {
    // Contract will be created with "pending" status, then SePayService will update it to "unpaid"
    requestData.Status = 'pending';
  } else {
    // Default to "pending" for wallet payment
    requestData.Status = cleanData.status || 'pending';
  }
  
  // Create contract request
  
  return apiService.request<{ contractId: string }>(`/contracts`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

export async function getContractsByParent(parentId: string) {
  const response = await apiService.request<Contract[]>(`/contracts/parents/${parentId}`);
  
  if (response.success && response.data) {
    // Filter out reschedule_count field from response if present
    response.data = response.data.map((contract: any) => {
      const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanContract } = contract;
      return cleanContract;
    }) as Contract[];
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
export async function getTutorAvailabilitiesByTutorId(tutorId: string) {
  const result = await apiService.request<any[]>(`/tutor-availabilities/tutor/${tutorId}`);
  
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

// POST /api/tutor-availabilities
export async function createTutorAvailability(data: CreateTutorAvailabilityRequest) {
  const result = await apiService.request<any>(`/tutor-availabilities`, {
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

export async function getRescheduleRequests(_status?: 'pending' | 'approved' | 'rejected') {
  // NOTE: Backend doesn't have GET endpoint for reschedule requests yet
  // The RescheduleController only has POST (Create) and PUT (Approve/Reject)
  // Return empty array for now until backend implements GET endpoint
  console.warn('GET /reschedule endpoint not implemented in backend. Returning empty array.');
  
  return {
    success: true,
    data: [] as RescheduleRequest[],
    error: null,
  };
  
  // Uncomment when backend implements GET endpoint:
  // const query = status ? `?status=${status}` : '';
  // return apiService.request<RescheduleRequest[]>(`/reschedule${query}`, {
  //   method: 'GET',
  // });
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
  // Validate tutorId is a valid GUID
  if (!tutorId || tutorId.trim() === '') {
    return {
      success: false,
      error: 'Tutor ID is required',
      data: undefined
    };
  }

  // Validate GUID format (basic check)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const trimmedTutorId = tutorId.trim();
  if (!guidRegex.test(trimmedTutorId)) {
    console.error('Invalid GUID format for tutorId:', trimmedTutorId);
    return {
      success: false,
      error: 'Invalid tutor ID format',
      data: undefined
    };
  }

  // Backend endpoint is /assign-tutors (plural) and expects mainTutorId (camelCase in JSON)
  // Backend uses JsonPropertyName to map camelCase to PascalCase
  // Only send mainTutorId, don't send null values for optional fields
  const requestBody: any = {
    mainTutorId: trimmedTutorId,
  };

  console.log('Assigning tutor to contract:', {
    contractId,
    tutorId: trimmedTutorId.substring(0, 8) + '...',
    requestBody: JSON.stringify(requestBody)
  });

  try {
    const result = await apiService.request<{ message: string }>(`/contracts/${contractId}/assign-tutors`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    if (!result.success) {
      console.error('Failed to assign tutor:', result.error);
    }

    return result;
  } catch (error: any) {
    console.error('Error in assignTutorToContract:', error);
    return {
      success: false,
      error: error?.message || 'Failed to assign tutor',
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
  achievements?: TutorAchievement[]; // Achievements list
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
      const tutors: Tutor[] = result.data.map((tutor: any) => ({
        userId: tutor.userId || tutor.id || tutor.UserId || tutor.user_id || '',
        fullName: tutor.fullName || tutor.name || tutor.FullName || tutor.full_name || '',
        email: tutor.email || tutor.Email || '',
        phone: tutor.phone || tutor.phoneNumber || tutor.PhoneNumber || undefined,
        verificationStatus: tutor.verificationStatus || tutor.VerificationStatus || tutor.status || 'pending',
        university: tutor.university || tutor.University || undefined,
        major: tutor.major || tutor.Major || undefined,
        hourlyRate: tutor.hourlyRate || tutor.HourlyRate || tutor.hourly_rate || undefined,
        bio: tutor.bio || tutor.Bio || undefined,
        specialties: tutor.specialties || tutor.Specialties || tutor.specialization ? [tutor.specialization] : undefined,
        rating: tutor.rating || tutor.Rating || undefined,
        centerId: tutor.centerId || tutor.CenterId || tutor.center_id || undefined,
        centerName: tutor.centerName || tutor.CenterName || tutor.center_name || undefined,
        studentCount: tutor.studentCount || tutor.StudentCount || tutor.student_count || undefined,
        yearsOfExperience: tutor.yearsOfExperience || tutor.YearsOfExperience || tutor.years_of_experience || undefined,
        profilePictureUrl: tutor.profilePictureUrl || tutor.ProfilePictureUrl || tutor.profile_picture_url || undefined,
        achievements: tutor.achievements || tutor.Achievements || undefined,
        canTeachOnline: tutor.canTeachOnline ?? tutor.CanTeachOnline ?? tutor.can_teach_online ?? undefined,
        canTeachOffline: tutor.canTeachOffline ?? tutor.CanTeachOffline ?? tutor.can_teach_offline ?? undefined,
      }));
      
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

// Get top rated tutors
// Backend endpoint: GET /api/tutors (sorted by rating, limited)
export async function getTopRatedTutors(limit: number = 3) {
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

export async function getAvailableTutors(params?: {
  centerId?: string;
  daysOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isOnline?: boolean;
}) {
  // Use existing searchTutorsByAvailability function
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
export async function createContractDirectPayment(contractId: string) {
  return apiService.request<SePayPaymentResponse>(`/SePay/create-contract-payment?contractId=${contractId}`, {
    method: 'POST',
  });
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
      // Backend SessionDto has ChildName field (line 17 in SessionDto.cs)
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
      studentName: result.data.studentName || result.data.StudentName || result.data.student_name || undefined,
      childName: result.data.childName || result.data.ChildName || result.data.child_name || undefined,
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
      childName: item.childName || item.ChildName || item.child_name || undefined,
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
      childName: result.data.childName || result.data.ChildName || result.data.child_name || undefined,
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

// Update session status
// Backend endpoint: PUT /api/sessions/{bookingId}/status
export async function updateSessionStatus(bookingId: string, status: 'completed' | 'cancelled') {
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

/**
 * Application-wide constants
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.vibe88.tech/api';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PROFILE: '/user-profile',
  UNAUTHORIZED: '/unauthorized',
  ADMIN: '/admin',
  TUTOR_DASHBOARD: '/tutor/dashboard',
  STAFF: '/staff',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TUTOR: 'tutor',
  PARENT: 'parent',
  STAFF: 'staff',
} as const;

// Role ID Mapping (Backend RoleId to Frontend Role)
export const ROLE_ID_MAP: Record<number, string> = {
  1: USER_ROLES.ADMIN,
  2: USER_ROLES.TUTOR,
  3: USER_ROLES.PARENT,
  4: USER_ROLES.STAFF,
};

// Expected 404 Endpoints (endpoints where 404 is normal, not an error)
export const EXPECTED_404_ENDPOINTS = [
  '/learning-forecast',
  '/unit-progress',
  '/daily-reports/contract/',
] as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'Resource not found',
  INVALID_TOKEN: 'Invalid or expired token',
  USER_NOT_FOUND: 'User ID not found',
} as const;


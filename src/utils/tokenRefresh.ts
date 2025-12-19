/**
 * Token refresh utility - automatically refreshes token before expiration
 */

import { getCookie, setCookie, removeCookie } from './cookie';
import { STORAGE_KEYS } from '../constants';
import { API_BASE_URL } from '../constants';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

/**
 * Decode JWT token to get expiration time
 */
const decodeToken = (token: string): { exp?: number; [key: string]: any } | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired or will expire soon
 */
const isTokenExpiringSoon = (token: string, bufferMinutes: number = 5): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const exp = decoded.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = exp - now;
  const bufferMs = bufferMinutes * 60 * 1000;

  return timeUntilExpiry < bufferMs;
};

/**
 * Refresh token by calling backend endpoint
 */
const callRefreshToken = async (): Promise<string | null> => {
  const refreshToken = getCookie(STORAGE_KEYS.REFRESH_TOKEN);
  
  if (!refreshToken) {
    console.warn('No refresh token available');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const text = await response.text();
    let data: any = undefined;
    
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      // Response is not JSON
    }

    if (!response.ok) {
      console.error('Token refresh failed:', data?.error || 'Unknown error');
      return null;
    }

    // Backend có thể trả về { token: "..." } hoặc { token: "...", refreshToken: "..." }
    const newToken = data?.token || data?.Token;
    const newRefreshToken = data?.refreshToken || data?.RefreshToken;

    if (newToken) {
      setCookie(STORAGE_KEYS.AUTH_TOKEN, newToken, { days: 7 });
      
      if (newRefreshToken) {
        setCookie(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken, { days: 30 });
      }
      
      return newToken;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

/**
 * Refresh token if needed (expiring soon or expired)
 * Returns the current or new token, or null if refresh failed
 */
export const refreshTokenIfNeeded = async (): Promise<string | null> => {
  const token = getCookie(STORAGE_KEYS.AUTH_TOKEN);
  
  if (!token) {
    return null;
  }

  // Check if token is expiring soon
  if (!isTokenExpiringSoon(token)) {
    return token; // Token is still valid
  }

  // If already refreshing, wait for it to complete
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const newToken = await callRefreshToken();
    
    if (newToken) {
      processQueue(null, newToken);
      isRefreshing = false;
      return newToken;
    } else {
      // Refresh failed - clear tokens and logout
      removeCookie(STORAGE_KEYS.AUTH_TOKEN);
      removeCookie(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      processQueue(new Error('Token refresh failed'), null);
      isRefreshing = false;
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
      
      return null;
    }
  } catch (error) {
    processQueue(error, null);
    isRefreshing = false;
    
    removeCookie(STORAGE_KEYS.AUTH_TOKEN);
    removeCookie(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
    
    return null;
  }
};

/**
 * Check if token exists and is valid (not expired)
 */
export const isTokenValid = (): boolean => {
  const token = getCookie(STORAGE_KEYS.AUTH_TOKEN);
  if (!token) return false;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;

  const exp = decoded.exp * 1000;
  const now = Date.now();
  
  return exp > now;
};


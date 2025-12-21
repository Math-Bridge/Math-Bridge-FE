/**
 * Cookie utility functions for managing authentication tokens
 */

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    days?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): void {
  if (typeof document === 'undefined') return;

  const {
    days = 7, // Default 7 days
    path = '/',
    domain,
    secure = true, // Use secure cookies in production
    sameSite = 'lax',
  } = options;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=${path}`;

  if (domain) {
    cookieString += `;domain=${domain}`;
  }

  if (secure && window.location.protocol === 'https:') {
    cookieString += ';secure';
  }

  cookieString += `;sameSite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Remove a cookie by name
 */
export function removeCookie(
  name: string,
  options: {
    path?: string;
    domain?: string;
  } = {}
): void {
  if (typeof document === 'undefined') return;

  const { path = '/', domain } = options;

  // Set cookie with expired date
  let cookieString = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}`;

  if (domain) {
    cookieString += `;domain=${domain}`;
  }

  document.cookie = cookieString;
}

/**
 * Check if cookies are enabled
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') return false;

  try {
    document.cookie = 'testcookie=1';
    const enabled = document.cookie.indexOf('testcookie=') !== -1;
    document.cookie = 'testcookie=1;expires=Thu, 01 Jan 1970 00:00:00 UTC';
    return enabled;
  } catch {
    return false;
  }
}






import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'originalUrlMapping';

/**
 * Normalize URL for consistent matching (remove trailing slashes, normalize double slashes)
 */
function normalizeUrl(url: string): string {
  if (!url) return '/';
  // Normalize pathname
  let pathname = url.split('?')[0].split('#')[0];
  pathname = pathname.replace(/\/+/g, '/');
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  if (!pathname) pathname = '/';
  
  // Reconstruct with query and hash
  const query = url.includes('?') ? url.substring(url.indexOf('?')) : '';
  const hash = url.includes('#') ? url.substring(url.indexOf('#')) : '';
  return pathname + query + hash;
}

/**
 * Hook to hide IDs in the browser URL bar
 * This replaces the URL in the address bar without affecting routing
 * Note: This only changes the displayed URL, React Router still uses the original URL for routing
 */
export function useHideIdInUrl() {
  const location = useLocation();

  useEffect(() => {
    // Get current pathname
    let pathname = location.pathname;
    
    // Check if pathname contains any UUIDs or long IDs
    const uuidPattern = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/gi;
    const longIdPattern = /[a-fA-F0-9]{32,}/gi;
    
    // Check if pathname has IDs
    if (!uuidPattern.test(pathname) && !longIdPattern.test(pathname)) {
      return; // No IDs to hide
    }
    
    // Store original URL in sessionStorage for restoration on reload
    const fullUrl = pathname + location.search + location.hash;
    try {
      const mapping = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      // Store mapping: cleaned URL -> original URL
      // Calculate cleaned pathname (same logic as below)
      let cleanedPathnameForStorage = pathname
        .replace(uuidPattern, '')
        .replace(longIdPattern, '');
      cleanedPathnameForStorage = cleanedPathnameForStorage.replace(/\/+/g, '/');
      if (cleanedPathnameForStorage !== '/' && cleanedPathnameForStorage.endsWith('/')) {
        cleanedPathnameForStorage = cleanedPathnameForStorage.slice(0, -1);
      }
      if (!cleanedPathnameForStorage) {
        cleanedPathnameForStorage = '/';
      }
      const cleanedUrl = cleanedPathnameForStorage + location.search + location.hash;
      const normalizedCleanedUrl = normalizeUrl(cleanedUrl);
      // Store both exact and normalized versions for reliable matching
      mapping[cleanedUrl] = fullUrl;
      mapping[normalizedCleanedUrl] = fullUrl;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
    } catch (e) {
      console.warn('Failed to store URL mapping:', e);
    }
    
    // Replace IDs in pathname - remove them completely
    let cleanedPathname = pathname
      .replace(uuidPattern, '')
      .replace(longIdPattern, '');
    
    // Clean up double slashes and trailing slashes
    cleanedPathname = cleanedPathname.replace(/\/+/g, '/');
    
    // Remove trailing slash if not root
    if (cleanedPathname !== '/' && cleanedPathname.endsWith('/')) {
      cleanedPathname = cleanedPathname.slice(0, -1);
    }
    
    // Ensure we have at least a slash
    if (!cleanedPathname) {
      cleanedPathname = '/';
    }
    
    // Only update if pathname actually changed and we have a valid cleaned path
    if (cleanedPathname !== pathname && cleanedPathname !== '/') {
      // Use replaceState to change URL without reloading
      // Store original pathname in state so we can restore if needed
      const newUrl = cleanedPathname + location.search + location.hash;
      window.history.replaceState(
        { ...window.history.state, originalPathname: pathname },
        '',
        newUrl
      );
    }
  }, [location.pathname, location.search, location.hash]);
}

/**
 * Restore original URL from sessionStorage if current URL is missing an ID
 * This should be called early in the app lifecycle, before routes are matched
 */
export function restoreUrlIfNeeded(): boolean {
  try {
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    const normalizedCurrentUrl = normalizeUrl(currentUrl);
    const mapping = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    
    // Check if current URL is a cleaned URL (missing ID)
    // Try exact match first, then normalized match
    let originalUrl = mapping[currentUrl] || mapping[normalizedCurrentUrl];
    
    if (originalUrl) {
      // Restore the original URL
      window.history.replaceState(null, '', originalUrl);
      return true; // URL was restored
    }
  } catch (e) {
    console.warn('Failed to restore URL:', e);
  }
  return false; // No restoration needed
}


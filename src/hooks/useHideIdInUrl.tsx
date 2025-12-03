import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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


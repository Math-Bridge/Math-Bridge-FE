import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles/custom.css';
import { AuthProvider } from './hooks/useAuth';
import { restoreUrlIfNeeded } from './hooks/useHideIdInUrl';

// Restore URL before React Router processes it
// This ensures that when page is reloaded, the original URL with ID is restored
// so React Router can match the correct route
restoreUrlIfNeeded();

// Suppress 404 errors in console for expected endpoints (no daily reports yet)
// This is a workaround for browser DevTools automatically logging failed requests
// Note: Browser DevTools may still show 404 in Network tab, but we suppress console logs
if (typeof window !== 'undefined') {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Override console.error to filter out expected 404 errors
  console.error = (...args: any[]) => {
    const errorString = args.map(arg => 
      typeof arg === 'string' ? arg : 
      typeof arg === 'object' ? JSON.stringify(arg) : 
      String(arg)
    ).join(' ');
    
    // Suppress 404 errors for expected endpoints (no daily reports = normal, not an error)
    const isExpected404 = (
      errorString.includes('404') || 
      errorString.includes('Not Found')
    ) && (
      errorString.includes('/daily-reports/contract/') ||
      errorString.includes('/unit-progress') ||
      errorString.includes('/learning-forecast')
    );
    
    if (!isExpected404) {
      originalError.apply(console, args);
    }
    // Silently ignore expected 404 errors
  };
  
  // Also filter console.warn for 404s
  console.warn = (...args: any[]) => {
    const warnString = args.map(arg => 
      typeof arg === 'string' ? arg : 
      typeof arg === 'object' ? JSON.stringify(arg) : 
      String(arg)
    ).join(' ');
    
    const isExpected404 = (
      warnString.includes('404') || 
      warnString.includes('Not Found')
    ) && (
      warnString.includes('/daily-reports/contract/') ||
      warnString.includes('/unit-progress') ||
      warnString.includes('/learning-forecast')
    );
    
    if (!isExpected404) {
      originalWarn.apply(console, args);
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles/custom.css';
import { AuthProvider } from './hooks/useAuth';
import { restoreUrlIfNeeded } from './hooks/useHideIdInUrl';
import { initGlobalPreventDoubleClick } from './utils/globalPreventDoubleClick';

// Restore URL before React Router processes it
// This ensures that when page is reloaded, the original URL with ID is restored
// so React Router can match the correct route
restoreUrlIfNeeded();

// Initialize global double-click prevention for all buttons
initGlobalPreventDoubleClick(500);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout, SSENotificationProvider } from './components/common';
import { ErrorBoundary } from './components/common';
import { NotificationProvider } from './contexts/NotificationContext';
import ScrollToTop from './components/common/ScrollToTop';
import { appRoutes } from './routes';

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ToastProvider>
          <SSENotificationProvider>
            <NotificationProvider>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Layout />}>
                  {appRoutes}
                </Route>
              </Routes>
            </NotificationProvider>
          </SSENotificationProvider>
        </ToastProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
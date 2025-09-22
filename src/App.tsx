import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/common';
import { Login, Signup, ForgotPassword, ResetPassword } from './components/auth';
import VerifyResetRedirect from './components/auth/VerifyResetRedirect';
import { UserHome } from './components/user';
import { Home } from './components/dashboard';
import { ErrorBoundary } from './components/common';
import UserWallet from './components/user/UserWallet';
import UserProfile from './components/user/UserProfile';
import WalletTopUp from './components/user/WalletTopUp';
import WalletHistory from './components/user/WalletHistory';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('User authenticated, showing protected content');
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="verify-reset" element={<VerifyResetRedirect />} />
            <Route path="home" element={
              <ProtectedRoute>
                <UserHome />
              </ProtectedRoute>
            } />
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="user-wallet" element={
              <ProtectedRoute>
                <UserWallet />
              </ProtectedRoute>
            } />
            <Route path="user-profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="wallet/topup" element={
              <ProtectedRoute>
                <WalletTopUp />
              </ProtectedRoute>
            } />
            <Route path="wallet/history" element={
              <ProtectedRoute>
                <WalletHistory />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
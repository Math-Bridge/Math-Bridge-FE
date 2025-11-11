import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/common';
import { Login, Signup, ForgotPassword, ResetPassword } from './components/auth';
import VerifyResetRedirect from './components/auth/VerifyResetRedirect';
// import { UserHome } from './components/user'; // Replaced with ParentDashboardPage
import { Home } from './components/dashboard';
import { ErrorBoundary } from './components/common';
// Wallet components moved to parent features
import CenterList from './components/centers/CenterList';

import TutorList from './components/tutors/TutorList';
import TutorDetail from './components/tutors/TutorDetail';
import TutorRegister from './components/tutors/TutorRegister';
import TutorDashboard from './components/features/tutor/TutorDashboard';
import TutorsByCenter from './components/tutors/TutorsByCenter';
import { PackageList } from './components/package';
import PackageDetailPage from './pages/PackageDetailPage';
import PackageFormPage from './pages/PackageFormPage';

import {
  ParentHomePage,
  ParentSchedulePage,
  ParentProfilePage,
  MyChildrenPage,
  ParentWalletPage,
  WalletPage,
  TopUpPage,
  TransactionHistoryPage,
  ContractsPage,
  PackageSelectionPage,
  CreateContractPage,
  ContractDetailPage,
  TutorDetailPage,
  ProgressReportsPage,
  AdminDashboardPage,
  UserManagementPage,
  CenterManagementPage,
  PackageManagementPage,
  StaffDashboardPage,
  ContractManagementPage,
  RescheduleManagementPage,
} from './pages/features';

// Protected Route Component (supports role-based guard)
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string | string[] }> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
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
  
  // Role guard if specified
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = user?.role;
    if (!userRole || !roles.includes(userRole)) {
      console.warn('Access denied due to role mismatch', { requiredRole: roles, userRole });
      return <Navigate to="/login" replace />;
    }
  }

  console.log('User authenticated (and role ok if required), showing protected content');
  return <>{children}</>;
};

// Role-based redirect component
const RoleBasedRedirect: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user role
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  if (user?.role === 'tutor') {
    return <Navigate to="/tutor/dashboard" replace />;
  }
  
  if (user?.role === 'staff') {
    return <Navigate to="/staff" replace />;
  }
  
  // Default redirect for other roles (parent, etc.)
  return <Navigate to="/home" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<RoleBasedRedirect />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-reset" element={<VerifyResetRedirect />} />
            {/* Original Routes */}
            <Route path="home" element={
              <ProtectedRoute>
                <ParentHomePage />
              </ProtectedRoute>
            } />
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="user-wallet" element={
              <ProtectedRoute>
                <ParentWalletPage />
              </ProtectedRoute>
            } />
            <Route path="user-profile" element={
              <ProtectedRoute>
                <ParentProfilePage />
              </ProtectedRoute>
            } />
            <Route path="parent-profile" element={
              <ProtectedRoute>
                <ParentProfilePage />
              </ProtectedRoute>
            } />
            <Route path="parent/schedule" element={
              <ProtectedRoute>
                <ParentSchedulePage />
              </ProtectedRoute>
            } />
            <Route path="my-children" element={
              <ProtectedRoute>
                <MyChildrenPage />
              </ProtectedRoute>
            } />
            <Route path="wallet/topup" element={
              <ProtectedRoute>
                <TopUpPage />
              </ProtectedRoute>
            } />
            <Route path="wallet/history" element={
              <ProtectedRoute>
                <TransactionHistoryPage />
              </ProtectedRoute>
            } />
            
            {/* Tutor Routes */}
            <Route path="tutors" element={
              <ProtectedRoute>
                <TutorList />
              </ProtectedRoute>
            } />
            <Route path="tutors/:id" element={
              <ProtectedRoute>
                <TutorDetail id={window.location.pathname.split('/').pop() || ''} />
              </ProtectedRoute>
            } />
            <Route path="tutor/register" element={
              <ProtectedRoute>
                <TutorRegister />
              </ProtectedRoute>
            } />
            <Route path="tutor/dashboard" element={
              <ProtectedRoute requiredRole="tutor">
                <TutorDashboard />
              </ProtectedRoute>
            } />
            
            {/* Center Routes */}
            <Route path="centers" element={
              <ProtectedRoute>
                <CenterList />
              </ProtectedRoute>
            } />
            <Route path="centers/:centerId/tutors" element={
              <ProtectedRoute>
                <TutorsByCenter />
              </ProtectedRoute>
            } />
            
            {/* Package Routes */}
            <Route path="packages" element={
              <ProtectedRoute>
                <PackageList />
              </ProtectedRoute>
            } />
            <Route path="packages/:packageId" element={
              <ProtectedRoute>
                <PackageDetailPage />
              </ProtectedRoute>
            } />
            <Route path="packages/create" element={
              <ProtectedRoute requiredRole="admin">
                <PackageFormPage />
              </ProtectedRoute>
            } />
            <Route path="packages/:packageId/edit" element={
              <ProtectedRoute requiredRole="admin">
                <PackageFormPage />
              </ProtectedRoute>
            } />
            
            {/* Additional Features Routes */}
            <Route path="wallet" element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            } />
            <Route path="contracts" element={
              <ProtectedRoute>
                <ContractsPage />
              </ProtectedRoute>
            } />
            <Route path="contracts/create" element={
              <ProtectedRoute>
                <CreateContractPage />
              </ProtectedRoute>
            } />
            <Route path="contracts/:id" element={
              <ProtectedRoute>
                <ContractDetailPage />
              </ProtectedRoute>
            } />
            <Route path="tutors/:id" element={
              <ProtectedRoute>
                <TutorDetailPage />
              </ProtectedRoute>
            } />
            <Route path="progress" element={
              <ProtectedRoute>
                <ProgressReportsPage />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/centers" element={
              <ProtectedRoute requiredRole="admin">
                <CenterManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/packages" element={
              <ProtectedRoute requiredRole="admin">
                <PackageManagementPage />
              </ProtectedRoute>
            } />
            
            {/* Staff Routes */}
            <Route path="staff" element={
              <ProtectedRoute>
                <StaffDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="staff/contracts" element={
              <ProtectedRoute>
                <ContractManagementPage />
              </ProtectedRoute>
            } />
            <Route path="staff/reschedules" element={
              <ProtectedRoute>
                <RescheduleManagementPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
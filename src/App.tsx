import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout, SSENotificationProvider } from './components/common';
import { Login, Signup, ForgotPassword, ResetPassword, VerifyEmail } from './components/auth';
import VerifyResetRedirect from './components/auth/VerifyResetRedirect';
// import { UserHome } from './components/user'; // Replaced with ParentDashboardPage
import { Home } from './components/dashboard';
import { ErrorBoundary } from './components/common';
// Wallet components moved to parent features
import CenterList from './components/centers/CenterList';
import ScrollToTop from './components/common/ScrollToTop';
import TutorList from './components/tutors/TutorList';
import TutorRegister from './components/tutors/TutorRegister';
import TutorDashboard from './components/features/tutor/TutorDashboard';
import TutorsByCenter from './components/tutors/TutorsByCenter';
import { PackageList } from './components/package';
import PackageDetailPage from './pages/PackageDetailPage';
import PackageFormPage from './pages/PackageFormPage';
import { NotificationProvider } from './contexts/NotificationContext';
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
  FinalFeedbackPage,
  TutorDetailPage,
  ParentDailyReportsPage,
  ParentTestResultsPage,
  ParentTutorReportsPage,
  AdminDashboardPage,
  UserManagementPage,
  CurriculumManagementPage,
  UnitManagementPage,
  CenterManagementPage,
  PackageManagementPage,
  FinancePage,
  SettingsPage,
  StaffDashboardPage,
  ContractManagementPage,
  ContractDetailStaffPage,
  RescheduleManagementPage,
  StaffDailyReportsPage,
  FinalFeedbackManagementPage,
  TutorDailyReportPage,
  StaffTutorReportsPage,
} from './pages/features';
import UnauthorizedPage from './pages/UnauthorizedPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Protected Route Component (supports role-based guard)
import HomeworkHelperPage from './pages/features/parent/HomeworkHelperPage';
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string | string[]; skipLocationCheck?: boolean }> = ({ children, requiredRole, skipLocationCheck = false }) => {
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
      // Redirect to unauthorized page with role information
      return (
        <Navigate
          to="/unauthorized"
          replace
          state={{
            requiredRole: roles,
            attemptedPath: window.location.pathname,
          }}
        />
      );
    }
  }

  // Check if user needs to set up location or phone (skip for profile pages)
  if (!skipLocationCheck && user) {
    const needsLocation = !user.placeId || user.phone === 'N/A';
    
    // For tutors, also check verification info
    let needsVerification = false;
    if (user.role === 'tutor') {
      // Check from localStorage if verification is needed (set during login)
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          needsVerification = userData.needsVerification === true;
        } catch (e) {
          // If can't parse, assume needs verification for safety
          needsVerification = true;
        }
      }
    }
    
    if (needsLocation || needsVerification) {
      console.log('User missing required data, redirecting to profile');
      // Redirect tutor to tutor dashboard (which has profile), others to user-profile
      if (user.role === 'tutor') {
        return <Navigate to="/tutor/dashboard" replace state={{ needsLocation: !user.placeId, needsPhone: user.phone === 'N/A', needsVerification: needsVerification }} />;
      } else {
        return <Navigate to="/user-profile" replace state={{ needsLocation: !user.placeId, needsPhone: user.phone === 'N/A' }} />;
      }
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
            <SSENotificationProvider>
              <NotificationProvider>
              <ScrollToTop />
              <Routes>
              <Route path="/" element={<Layout />}>
              <Route index element={<RoleBasedRedirect />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-reset" element={<VerifyResetRedirect />} />
              <Route path="verify-email" element={<VerifyEmail />} />
              <Route path="unauthorized" element={<UnauthorizedPage />} />
              <Route path="terms-of-service" element={<TermsOfServicePage />} />
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            {/* Original Routes */}
            <Route path="home" element={
              <ProtectedRoute requiredRole="parent">
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
              <ProtectedRoute skipLocationCheck={true}>
                <ParentProfilePage />
              </ProtectedRoute>
            } />
            <Route path="parent-profile" element={
              <ProtectedRoute skipLocationCheck={true}>
                <ParentProfilePage />
              </ProtectedRoute>
            } />
            <Route path="parent/homework-helper" element={
              <ProtectedRoute requiredRole="parent">
                <HomeworkHelperPage />
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
            <Route path="tutor/register" element={
              <ProtectedRoute>
                <TutorRegister />
              </ProtectedRoute>
            } />
            <Route path="tutor/dashboard" element={
              <ProtectedRoute requiredRole="tutor" skipLocationCheck={true}>
                <TutorDashboard />
              </ProtectedRoute>
            } />
            <Route path="tutor/daily-reports" element={
              <ProtectedRoute requiredRole="tutor">
                <TutorDailyReportPage />
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
            <Route path="contracts/:id/feedback" element={
              <ProtectedRoute>
                <FinalFeedbackPage />
              </ProtectedRoute>
            } />
            <Route path="tutors/:id" element={
              <ProtectedRoute>
                <TutorDetailPage />
              </ProtectedRoute>
            } />
            <Route path="progress" element={
              <ProtectedRoute>
                <ParentDailyReportsPage />
              </ProtectedRoute>
            } />
            <Route path="daily-reports" element={
              <ProtectedRoute requiredRole="parent">
                <ParentDailyReportsPage />
              </ProtectedRoute>
            } />
            <Route path="test-results" element={
              <ProtectedRoute requiredRole="parent">
                <ParentTestResultsPage />
              </ProtectedRoute>
            } />
            <Route path="tutor-reports" element={
              <ProtectedRoute requiredRole="parent">
                <ParentTutorReportsPage />
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
            <Route path="admin/curricula" element={
              <ProtectedRoute requiredRole="admin">
                <CurriculumManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/units" element={
              <ProtectedRoute requiredRole="admin">
                <UnitManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/finance" element={
              <ProtectedRoute requiredRole="admin">
                <FinancePage />
              </ProtectedRoute>
            } />
            <Route path="admin/settings" element={
              <ProtectedRoute requiredRole="admin">
                <SettingsPage />
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
            <Route path="staff/contracts/:id" element={
              <ProtectedRoute>
                <ContractDetailStaffPage />
              </ProtectedRoute>
            } />
            <Route path="staff/reschedules" element={
              <ProtectedRoute>
                <RescheduleManagementPage />
              </ProtectedRoute>
            } />
            <Route path="staff/daily-reports" element={
              <ProtectedRoute>
                <StaffDailyReportsPage />
              </ProtectedRoute>
            } />
            <Route path="staff/final-feedback" element={
              <ProtectedRoute>
                <FinalFeedbackManagementPage />
              </ProtectedRoute>
            } />
            <Route path="staff/tutor-reports" element={
              <ProtectedRoute>
                <StaffTutorReportsPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        </NotificationProvider>
            </SSENotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
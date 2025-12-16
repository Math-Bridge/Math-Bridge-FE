/**
 * Application routes configuration
 */

import { Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRedirect } from './RoleBasedRedirect';

// Auth components
import { Login, Signup, ForgotPassword, ResetPassword, VerifyEmail } from '../components/auth';
import VerifyResetRedirect from '../components/auth/VerifyResetRedirect';

// Common pages
import { Home } from '../components/dashboard';
import CenterList from '../components/centers/CenterList';
import TutorList from '../components/tutors/TutorList';
import TutorRegister from '../components/tutors/TutorRegister';
import TutorDashboard from '../components/features/tutor/TutorDashboard';
import TutorsByCenter from '../components/tutors/TutorsByCenter';
import { PackageList } from '../components/package';
import PackageDetailPage from '../pages/PackageDetailPage';
import PackageFormPage from '../pages/PackageFormPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';

// Feature pages
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
  CreateContractPage,
  ContractDetailPage,
  FinalFeedbackPage,
  TutorDetailPage,
  ParentDailyReportsPage,
  ParentTestResultsPage,
  ParentTutorReportsPage,
  WithdrawalRequestPage,
  AdminDashboardPage,
  UserManagementPage,
  CurriculumManagementPage,
  UnitManagementPage,
  MathConceptManagementPage,
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
  WithdrawalManagementPage,
  HomeworkHelperPage,
} from '../pages/features';

// Export routes as an array for use in nested Routes
export const appRoutes = [
  <Route key="index" index element={<RoleBasedRedirect />} />,
  <Route key="login" path="login" element={<Login />} />,
  <Route key="signup" path="signup" element={<Signup />} />,
  <Route key="forgot-password" path="forgot-password" element={<ForgotPassword />} />,
  <Route key="reset-password" path="reset-password" element={<ResetPassword />} />,
  <Route key="verify-reset" path="verify-reset" element={<VerifyResetRedirect />} />,
  <Route key="verify-email" path="verify-email" element={<VerifyEmail />} />,
  <Route key="unauthorized" path="unauthorized" element={<UnauthorizedPage />} />,
  <Route key="terms-of-service" path="terms-of-service" element={<TermsOfServicePage />} />,
  <Route key="privacy-policy" path="privacy-policy" element={<PrivacyPolicyPage />} />,

  // Parent Routes
  <Route
    key="home"
    path="home"
    element={
      <ProtectedRoute requiredRole="parent">
        <ParentHomePage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="dashboard"
    path="dashboard"
    element={
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    }
  />,
  <Route
    key="user-wallet"
    path="user-wallet"
    element={
      <ProtectedRoute>
        <ParentWalletPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="user-profile"
    path="user-profile"
    element={
      <ProtectedRoute skipLocationCheck={true}>
        <ParentProfilePage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="parent-profile"
    path="parent-profile"
    element={
      <ProtectedRoute skipLocationCheck={true}>
        <ParentProfilePage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="parent-homework-helper"
    path="parent/homework-helper"
    element={
      <ProtectedRoute requiredRole="parent">
        <HomeworkHelperPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="parent-schedule"
    path="parent/schedule"
    element={
      <ProtectedRoute>
        <ParentSchedulePage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="my-children"
    path="my-children"
    element={
      <ProtectedRoute>
        <MyChildrenPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="wallet-topup"
    path="wallet/topup"
    element={
      <ProtectedRoute>
        <TopUpPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="wallet-history"
    path="wallet/history"
    element={
      <ProtectedRoute>
        <TransactionHistoryPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="wallet-withdrawal-request"
    path="wallet/withdrawal/request"
    element={
      <ProtectedRoute requiredRole="parent">
        <WithdrawalRequestPage />
      </ProtectedRoute>
    }
  />,

  // Tutor Routes
  <Route
    key="tutors"
    path="tutors"
    element={
      <ProtectedRoute>
        <TutorList />
      </ProtectedRoute>
    }
  />,
  <Route
    key="tutor-register"
    path="tutor/register"
    element={
      <ProtectedRoute>
        <TutorRegister />
      </ProtectedRoute>
    }
  />,
  <Route
    key="tutor-dashboard"
    path="tutor/dashboard"
    element={
      <ProtectedRoute requiredRole="tutor" skipLocationCheck={true}>
        <TutorDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="tutor-daily-reports"
    path="tutor/daily-reports"
    element={
      <ProtectedRoute requiredRole="tutor">
        <TutorDailyReportPage />
      </ProtectedRoute>
    }
  />,

  // Center Routes
  <Route
    key="centers"
    path="centers"
    element={
      <ProtectedRoute>
        <CenterList />
      </ProtectedRoute>
    }
  />,
  // <Route
  //   key="centers-tutors"
  //   path="centers/:centerId/tutors"
  //   element={
  //     <ProtectedRoute>
  //       <TutorsByCenter />
  //     </ProtectedRoute>
  //   }
  // />,

  // Package Routes
  <Route
    key="packages"
    path="packages"
    element={
      <ProtectedRoute>
        <PackageList />
      </ProtectedRoute>
    }
  />,
  <Route
    key="package-detail"
    path="packages/:packageId"
    element={
      <ProtectedRoute>
        <PackageDetailPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="package-create"
    path="packages/create"
    element={
      <ProtectedRoute requiredRole="admin">
        <PackageFormPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="package-edit"
    path="packages/:packageId/edit"
    element={
      <ProtectedRoute requiredRole="admin">
        <PackageFormPage />
      </ProtectedRoute>
    }
  />,

  // Additional Features Routes
  <Route
    key="wallet"
    path="wallet"
    element={
      <ProtectedRoute>
        <WalletPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="contracts"
    path="contracts"
    element={
      <ProtectedRoute>
        <ContractsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="contracts-create"
    path="contracts/create"
    element={
      <ProtectedRoute>
        <CreateContractPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="contracts-detail"
    path="contracts/:id"
    element={
      <ProtectedRoute>
        <ContractDetailPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="contracts-feedback"
    path="contracts/:id/feedback"
    element={
      <ProtectedRoute>
        <FinalFeedbackPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="tutors-detail"
    path="tutors/:id"
    element={
      <ProtectedRoute>
        <TutorDetailPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="progress"
    path="progress"
    element={
      <ProtectedRoute>
        <ParentDailyReportsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="daily-reports"
    path="daily-reports"
    element={
      <ProtectedRoute requiredRole="parent">
        <ParentDailyReportsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="test-results"
    path="test-results"
    element={
      <ProtectedRoute requiredRole="parent">
        <ParentTestResultsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="tutor-reports"
    path="tutor-reports"
    element={
      <ProtectedRoute requiredRole="parent">
        <ParentTutorReportsPage />
      </ProtectedRoute>
    }
  />,

  // Admin Routes
  <Route
    key="admin"
    path="admin"
    element={
      <ProtectedRoute requiredRole="admin">
        <AdminDashboardPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="admin-users"
    path="admin/users"
    element={
      <ProtectedRoute requiredRole="admin">
        <UserManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="admin-centers"
    path="admin/centers"
    element={
      <ProtectedRoute requiredRole="admin">
        <CenterManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="admin-packages"
    path="admin/packages"
    element={
      <ProtectedRoute requiredRole="admin">
        <PackageManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="admin-curricula"
    path="admin/curricula"
    element={
      <ProtectedRoute requiredRole="admin">
        <CurriculumManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="admin-units"
    path="admin/units"
    element={
      <ProtectedRoute requiredRole="admin">
        <UnitManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="admin-math-concepts"
    path="admin/math-concepts"
    element={
      <ProtectedRoute requiredRole="admin">
        <MathConceptManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="admin-finance"
    path="admin/finance"
    element={
      <ProtectedRoute requiredRole="admin">
        <FinancePage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="admin-settings"
    path="admin/settings"
    element={
      <ProtectedRoute requiredRole="admin">
        <SettingsPage />
      </ProtectedRoute>
    }
  />,

  // Staff Routes
  <Route
    key="staff"
    path="staff"
    element={
      <ProtectedRoute>
        <StaffDashboardPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="staff-contracts"
    path="staff/contracts"
    element={
      <ProtectedRoute>
        <ContractManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="staff-contracts-detail"
    path="staff/contracts/:id"
    element={
      <ProtectedRoute>
        <ContractDetailStaffPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="staff-reschedules"
    path="staff/reschedules"
    element={
      <ProtectedRoute>
        <RescheduleManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="staff-daily-reports"
    path="staff/daily-reports"
    element={
      <ProtectedRoute>
        <StaffDailyReportsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="staff-final-feedback"
    path="staff/final-feedback"
    element={
      <ProtectedRoute>
        <FinalFeedbackManagementPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="staff-tutor-reports"
    path="staff/tutor-reports"
    element={
      <ProtectedRoute>
        <StaffTutorReportsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="staff-withdrawals"
    path="staff/withdrawals"
    element={
      <ProtectedRoute requiredRole="staff,admin">
        <WithdrawalManagementPage />
      </ProtectedRoute>
    }
  />,
];

// Export for backward compatibility (if needed)
export { ProtectedRoute } from './ProtectedRoute';
export { RoleBasedRedirect } from './RoleBasedRedirect';

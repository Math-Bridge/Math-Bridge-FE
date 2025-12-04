/**
 * Protected Route Component with role-based access control
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  skipLocationCheck?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  skipLocationCheck = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

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
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Role guard if specified
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = user?.role;
    if (!userRole || !roles.includes(userRole)) {
      console.warn('Access denied due to role mismatch', { requiredRole: roles, userRole });
      return (
        <Navigate
          to={ROUTES.UNAUTHORIZED}
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
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          needsVerification = userData.needsVerification === true;
        } catch (e) {
          needsVerification = true;
        }
      }
    }

    if (needsLocation || needsVerification) {
      // Redirect tutor to tutor dashboard (which has profile), others to user-profile
      if (user.role === 'tutor') {
        return (
          <Navigate
            to={ROUTES.TUTOR_DASHBOARD}
            replace
            state={{
              needsLocation: !user.placeId,
              needsPhone: user.phone === 'N/A',
              needsVerification: needsVerification,
            }}
          />
        );
      } else {
        return (
          <Navigate
            to={ROUTES.PROFILE}
            replace
            state={{
              needsLocation: !user.placeId,
              needsPhone: user.phone === 'N/A',
            }}
          />
        );
      }
    }
  }

  return <>{children}</>;
};


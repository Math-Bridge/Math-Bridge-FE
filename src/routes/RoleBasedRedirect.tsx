/**
 * Role-based redirect component
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, USER_ROLES } from '../constants';

export const RoleBasedRedirect: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Redirect based on user role
  if (user?.role === USER_ROLES.ADMIN) {
    return <Navigate to={ROUTES.ADMIN} replace />;
  }

  if (user?.role === USER_ROLES.TUTOR) {
    return <Navigate to={ROUTES.TUTOR_DASHBOARD} replace />;
  }

  if (user?.role === USER_ROLES.STAFF) {
    return <Navigate to={ROUTES.STAFF} replace />;
  }

  // Default redirect for other roles (parent, etc.)
  return <Navigate to={ROUTES.HOME} replace />;
};


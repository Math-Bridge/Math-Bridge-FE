import React from 'react';
import { AdminDashboard, UserManagement } from '../../../components/features/admin';

const UserManagementPage: React.FC = () => {
  return (
    <AdminDashboard>
      <UserManagement />
    </AdminDashboard>
  );
};

export default UserManagementPage;

